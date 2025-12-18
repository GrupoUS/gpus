/**
 * Custom hook for student import dialog state management
 * Extracted to reduce cognitive complexity of StudentImportDialog component
 */

import { useMutation } from 'convex/react';
import Papa from 'papaparse';
import { useCallback, useId, useState } from 'react';
import { toast } from 'sonner';

import { api } from '../../convex/_generated/api';
import { getSchemaFields, mapCSVHeaders, validateRow } from '@/lib/csv-validator';
import { extractDataWithHeaders, type HeaderDetectionResult } from '@/lib/xlsx-helper';

// ============================================================================
// Types
// ============================================================================

export type ImportStep =
	| 'upload'
	| 'sheet-select'
	| 'header-select'
	| 'mapping'
	| 'preview'
	| 'importing'
	| 'results';

export interface ParsedData {
	headers: string[];
	rows: Record<string, unknown>[];
}

export interface XLSXParseResult {
	data: ParsedData;
	headerDetection: HeaderDetectionResult;
	rawData: unknown[][];
	needsPassword?: boolean;
}

export interface ImportResult {
	rowNumber: number;
	success: boolean;
	studentId?: string;
	error?: string;
	warnings?: string[];
}

export interface ImportResultsSummary {
	totalRows: number;
	successCount: number;
	failureCount: number;
	results: ImportResult[];
}

export interface PreviewValidationResult {
	valid: number;
	invalid: number;
	errors: string[];
}

// Field transformers for data normalization
import {
	normalizeEmail,
	normalizePaymentStatus,
	normalizePhone,
	normalizeProfession,
	normalizeStatus,
	parseBoolean,
	parseDate,
	parseInteger,
	parseMonetary,
} from '@/lib/csv-validator';

type FieldTransformer = (value: unknown, fieldName: string) => unknown | undefined;

const FIELD_TRANSFORMERS: Record<string, FieldTransformer> = {
	phone: (v) => normalizePhone(v as string),
	email: (v) => normalizeEmail(v as string),
	status: (v) => normalizeStatus(v as string),
	profession: (v) => normalizeProfession(v as string),
	paymentStatus: (v) => normalizePaymentStatus(v as string | undefined),
	hasClinic: (v) => parseBoolean(v as string | boolean | undefined),
	birthDate: (v) => parseDate(v as string | number | undefined),
	saleDate: (v) => parseDate(v as string | number | undefined),
	startDate: (v) => parseDate(v as string | number | undefined),
	totalValue: (v) => parseMonetary(v as string | number | undefined),
	installmentValue: (v) => parseMonetary(v as string | number | undefined),
	installments: (v) => parseInteger(v as string | number | undefined),
	paidInstallments: (v) => parseInteger(v as string | number | undefined),
};

const defaultTransformer: FieldTransformer = (value) => {
	if (value === null || value === undefined || value === '') return undefined;
	return String(value).trim();
};

// ============================================================================
// Custom Error Class
// ============================================================================

export class XLSXParseError extends Error {
	constructor(
		message: string,
		public readonly code: string,
	) {
		super(message);
		this.name = 'XLSXParseError';
	}
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseStudentImportReturn {
	// Dialog state
	open: boolean;
	setOpen: (open: boolean) => void;

	// Step navigation
	step: ImportStep;
	setStep: (step: ImportStep) => void;

	// File handling
	file: File | null;
	setFile: (file: File | null) => void;
	parsedData: ParsedData | null;
	setParsedData: (data: ParsedData | null) => void;

	// Column mapping
	columnMapping: Record<string, string>;
	setColumnMapping: (mapping: Record<string, string>) => void;

	// Processing state
	isProcessing: boolean;
	setIsProcessing: (processing: boolean) => void;
	importProgress: number;
	setImportProgress: (progress: number) => void;

	// Import results
	importResults: ImportResultsSummary | null;
	setImportResults: (results: ImportResultsSummary | null) => void;

	// Product selection
	selectedProduct: string;
	setSelectedProduct: (product: string) => void;

	// Upsert mode
	upsertMode: boolean;
	setUpsertMode: (mode: boolean) => void;

	// Sheet handling (XLSX)
	availableSheets: string[];
	setAvailableSheets: (sheets: string[]) => void;
	selectedSheet: string;
	setSelectedSheet: (sheet: string) => void;

	// Header detection
	headerDetection: HeaderDetectionResult | null;
	setHeaderDetection: (detection: HeaderDetectionResult | null) => void;
	rawXLSXData: unknown[][] | null;
	setRawXLSXData: (data: unknown[][] | null) => void;
	selectedHeaderRow: number;
	setSelectedHeaderRow: (row: number) => void;

	// Password dialog (for protected XLSX)
	showPasswordDialog: boolean;
	setShowPasswordDialog: (show: boolean) => void;
	xlsxPassword: string;
	setXlsxPassword: (password: string) => void;
	pendingFile: File | null;
	setPendingFile: (file: File | null) => void;
	pendingSheet: string | undefined;
	setPendingSheet: (sheet: string | undefined) => void;

	// IDs for accessibility
	fileInputId: string;
	passwordInputId: string;

	// Schema fields
	schemaFields: ReturnType<typeof getSchemaFields>;

	// Callbacks
	resetState: () => void;
	handleSheetSelect: () => Promise<void>;
	handleHeaderSelect: () => void;
	handlePasswordSubmit: () => Promise<void>;
	handleDrop: (e: React.DragEvent<HTMLButtonElement>) => void;
	handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleMappingChange: (csvHeader: string, schemaField: string) => void;
	transformRowData: (row: Record<string, unknown>) => Record<string, unknown>;
	validatePreview: () => PreviewValidationResult;
	handleImport: () => Promise<void>;
	downloadErrorLog: () => void;
	handleFileUpload: (uploadedFile: File) => Promise<void>;

	// Computed values
	previewValidation: PreviewValidationResult;
	requiredFields: string[];
	missingFields: string[];
	canProceed: boolean;
}

// ============================================================================
// Dependencies Injection Types (for file parsing functions)
// ============================================================================

export interface StudentImportDependencies {
	validateFile: (file: File) => { valid: boolean; error?: string };
	getXLSXSheetNames: (file: File) => Promise<string[]>;
	parseXLSXFile: (file: File, sheetName?: string, password?: string) => Promise<XLSXParseResult>;
	parseCSVFile: (file: File) => Promise<ParsedData>;
}

// ============================================================================
// File Processing Helper Types
// ============================================================================

interface FileProcessingResult {
	success: true;
	data: ParsedData;
	mapping: Record<string, string>;
	headerDetection?: HeaderDetectionResult;
	rawData?: unknown[][];
}

interface SheetSelectResult {
	needsSheetSelect: true;
	sheets: string[];
}

interface HeaderSelectResult {
	needsHeaderSelect: true;
	headerDetection: HeaderDetectionResult;
	rawData: unknown[][];
	headerRowIndex: number;
}

type ProcessFileResult = FileProcessingResult | SheetSelectResult | HeaderSelectResult;

// ============================================================================
// File Processing Helpers (extracted to reduce cognitive complexity)
// ============================================================================

/**
 * Check if a file is an Excel file based on extension
 */
function isExcelFile(file: File): boolean {
	return file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
}

/**
 * Process an XLSX file and return the appropriate result
 */
async function processXLSXFile(
	file: File,
	deps: Pick<StudentImportDependencies, 'getXLSXSheetNames' | 'parseXLSXFile'>,
): Promise<ProcessFileResult> {
	// Check for multiple sheets
	const sheets = await deps.getXLSXSheetNames(file);
	if (sheets.length > 1) {
		return { needsSheetSelect: true, sheets };
	}

	// Parse the file
	const xlsxResult = await deps.parseXLSXFile(file);

	// Check if header detection needs user confirmation
	const needsHeaderConfirmation =
		xlsxResult.headerDetection.confidence < 0.7 && xlsxResult.headerDetection.candidates.length > 1;

	if (needsHeaderConfirmation) {
		return {
			needsHeaderSelect: true,
			headerDetection: xlsxResult.headerDetection,
			rawData: xlsxResult.rawData,
			headerRowIndex: xlsxResult.headerDetection.headerRowIndex,
		};
	}

	return {
		success: true,
		data: xlsxResult.data,
		mapping: mapCSVHeaders(xlsxResult.data.headers),
		headerDetection: xlsxResult.headerDetection,
		rawData: xlsxResult.rawData,
	};
}

/**
 * Process a CSV file and return the result
 */
async function processCSVFile(
	file: File,
	deps: Pick<StudentImportDependencies, 'parseCSVFile'>,
): Promise<FileProcessingResult> {
	const csvData = await deps.parseCSVFile(file);
	return {
		success: true,
		data: csvData,
		mapping: mapCSVHeaders(csvData.headers),
	};
}

/**
 * Handle file parsing errors and show appropriate toast messages
 * Returns true if the error requires password dialog
 */
function handleParseError(error: unknown): { needsPassword: boolean } {
	if (error instanceof XLSXParseError) {
		if (error.code === 'PASSWORD_PROTECTED') {
			return { needsPassword: true };
		}
		toast.error('Erro ao processar arquivo XLSX', {
			description: error.message,
		});
	} else {
		toast.error('Erro ao processar arquivo', {
			description: 'Verifique se o formato do arquivo está correto e tente novamente.',
		});
	}
	return { needsPassword: false };
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useStudentImport(deps: StudentImportDependencies): UseStudentImportReturn {
	const { validateFile, getXLSXSheetNames, parseXLSXFile, parseCSVFile } = deps;

	// Dialog state
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<ImportStep>('upload');

	// File handling
	const [file, setFile] = useState<File | null>(null);
	const [parsedData, setParsedData] = useState<ParsedData | null>(null);

	// Column mapping
	const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

	// Processing state
	const [isProcessing, setIsProcessing] = useState(false);
	const [importProgress, setImportProgress] = useState(0);

	// Import results
	const [importResults, setImportResults] = useState<ImportResultsSummary | null>(null);

	// Product selection
	const [selectedProduct, setSelectedProduct] = useState<string>('');

	// Upsert mode
	const [upsertMode, setUpsertMode] = useState(true);

	// Sheet handling (XLSX)
	const [availableSheets, setAvailableSheets] = useState<string[]>([]);
	const [selectedSheet, setSelectedSheet] = useState<string>('');

	// Header detection
	const [headerDetection, setHeaderDetection] = useState<HeaderDetectionResult | null>(null);
	const [rawXLSXData, setRawXLSXData] = useState<unknown[][] | null>(null);
	const [selectedHeaderRow, setSelectedHeaderRow] = useState<number>(0);

	// Password dialog states
	const [showPasswordDialog, setShowPasswordDialog] = useState(false);
	const [xlsxPassword, setXlsxPassword] = useState('');
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [pendingSheet, setPendingSheet] = useState<string | undefined>(undefined);

	// Convex mutation
	const bulkImport = useMutation(api.studentsImport.bulkImport);

	// IDs for accessibility
	const fileInputId = useId();
	const passwordInputId = useId();

	// Schema fields
	const schemaFields = getSchemaFields();

	// ============================================================================
	// Callbacks
	// ============================================================================

	const resetState = useCallback(() => {
		setStep('upload');
		setFile(null);
		setParsedData(null);
		setColumnMapping({});
		setIsProcessing(false);
		setImportProgress(0);
		setImportResults(null);
		setSelectedProduct('');
		setUpsertMode(true);
		setAvailableSheets([]);
		setSelectedSheet('');
		setHeaderDetection(null);
		setRawXLSXData(null);
		setSelectedHeaderRow(0);
		setShowPasswordDialog(false);
		setXlsxPassword('');
		setPendingFile(null);
		setPendingSheet(undefined);
	}, []);

	const handleFileUpload = useCallback(
		async (uploadedFile: File) => {
			// Validate file before processing
			const validation = validateFile(uploadedFile);
			if (!validation.valid) {
				toast.error('Arquivo inválido', {
					description: validation.error,
				});
				return;
			}

			setFile(uploadedFile);
			setIsProcessing(true);

			try {
				// Process file based on type using extracted helpers
				const result = isExcelFile(uploadedFile)
					? await processXLSXFile(uploadedFile, { getXLSXSheetNames, parseXLSXFile })
					: await processCSVFile(uploadedFile, { parseCSVFile });

				// Handle different result types
				if ('needsSheetSelect' in result) {
					setAvailableSheets(result.sheets);
					setSelectedSheet(result.sheets[0]);
					setStep('sheet-select');
					setIsProcessing(false);
					return;
				}

				if ('needsHeaderSelect' in result) {
					setHeaderDetection(result.headerDetection);
					setRawXLSXData(result.rawData);
					setSelectedHeaderRow(result.headerRowIndex);
					setPendingFile(uploadedFile);
					setStep('header-select');
					setIsProcessing(false);
					return;
				}

				// Success case - update state with parsed data
				if (result.headerDetection) {
					setHeaderDetection(result.headerDetection);
					setRawXLSXData(result.rawData ?? null);
					setSelectedHeaderRow(result.headerDetection.headerRowIndex);
				}
				setParsedData(result.data);
				setColumnMapping(result.mapping);
				setStep('mapping');
			} catch (error) {
				const { needsPassword } = handleParseError(error);
				if (needsPassword) {
					setPendingFile(uploadedFile);
					setShowPasswordDialog(true);
					setIsProcessing(false);
					return;
				}
			} finally {
				setIsProcessing(false);
			}
		},
		[validateFile, getXLSXSheetNames, parseXLSXFile, parseCSVFile],
	);

	const handleSheetSelect = useCallback(async () => {
		if (!(file && selectedSheet)) return;
		setIsProcessing(true);
		try {
			const xlsxResult = await parseXLSXFile(file, selectedSheet);
			// Store header detection info and raw data for potential header-select step
			setHeaderDetection(xlsxResult.headerDetection);
			setRawXLSXData(xlsxResult.rawData);
			setSelectedHeaderRow(xlsxResult.headerDetection.headerRowIndex);

			// If low confidence or multiple candidates, let user confirm header row
			if (
				xlsxResult.headerDetection.confidence < 0.7 &&
				xlsxResult.headerDetection.candidates.length > 1
			) {
				setPendingSheet(selectedSheet);
				setStep('header-select');
				setIsProcessing(false);
				return;
			}

			setParsedData(xlsxResult.data);
			setColumnMapping(mapCSVHeaders(xlsxResult.data.headers));
			setStep('mapping');
		} catch (error) {
			if (error instanceof XLSXParseError) {
				toast.error('Erro ao processar planilha', { description: error.message });
			} else {
				toast.error('Erro ao processar arquivo');
			}
		} finally {
			setIsProcessing(false);
		}
	}, [file, selectedSheet, parseXLSXFile]);

	const handleHeaderSelect = useCallback(() => {
		if (!rawXLSXData) return;
		setIsProcessing(true);
		try {
			const extracted = extractDataWithHeaders(rawXLSXData, selectedHeaderRow);
			setParsedData({ headers: extracted.headers, rows: extracted.dataRows });
			setColumnMapping(mapCSVHeaders(extracted.headers));
			setStep('mapping');
		} catch (_error) {
			toast.error('Erro ao processar cabeçalhos', {
				description: 'Não foi possível extrair os dados com o cabeçalho selecionado.',
			});
		} finally {
			setIsProcessing(false);
		}
	}, [rawXLSXData, selectedHeaderRow]);

	const handlePasswordSubmit = useCallback(async () => {
		if (!(pendingFile && xlsxPassword)) return;
		setIsProcessing(true);
		setShowPasswordDialog(false);
		try {
			const xlsxResult = await parseXLSXFile(pendingFile, pendingSheet ?? undefined, xlsxPassword);
			setHeaderDetection(xlsxResult.headerDetection);
			setRawXLSXData(xlsxResult.rawData);
			setSelectedHeaderRow(xlsxResult.headerDetection.headerRowIndex);

			if (
				xlsxResult.headerDetection.confidence < 0.7 &&
				xlsxResult.headerDetection.candidates.length > 1
			) {
				setStep('header-select');
				setIsProcessing(false);
				return;
			}

			setParsedData(xlsxResult.data);
			setColumnMapping(mapCSVHeaders(xlsxResult.data.headers));
			setStep('mapping');
		} catch (error) {
			if (error instanceof XLSXParseError) {
				if (error.code === 'WRONG_PASSWORD') {
					toast.error('Senha incorreta', {
						description: 'A senha fornecida não está correta. Tente novamente.',
					});
					setShowPasswordDialog(true);
				} else {
					toast.error('Erro ao processar arquivo XLSX', {
						description: error.message,
					});
				}
			} else {
				toast.error('Erro ao processar arquivo');
			}
		} finally {
			setIsProcessing(false);
			setXlsxPassword('');
		}
	}, [pendingFile, pendingSheet, xlsxPassword, parseXLSXFile]);

	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLButtonElement>) => {
			e.preventDefault();
			const droppedFile = e.dataTransfer.files[0];
			if (droppedFile) {
				void handleFileUpload(droppedFile);
			}
		},
		[handleFileUpload],
	);

	const handleFileSelect = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const selectedFile = e.target.files?.[0];
			if (selectedFile) {
				void handleFileUpload(selectedFile);
			}
		},
		[handleFileUpload],
	);

	const handleMappingChange = useCallback((csvHeader: string, schemaField: string) => {
		setColumnMapping((prev) => ({
			...prev,
			[csvHeader]: schemaField,
		}));
	}, []);

	const transformRowData = useCallback(
		(row: Record<string, unknown>): Record<string, unknown> => {
			const transformed: Record<string, unknown> = {};

			for (const [csvHeader, schemaField] of Object.entries(columnMapping)) {
				if (schemaField === '_skip' || !schemaField) continue;

				const value = row[csvHeader];
				const transformer = FIELD_TRANSFORMERS[schemaField] || defaultTransformer;
				const result = transformer(value, schemaField);
				if (result !== undefined) {
					transformed[schemaField] = result;
				}
			}

			// Set defaults
			if (!transformed.hasClinic) transformed.hasClinic = false;
			if (!transformed.status) transformed.status = 'ativo';
			if (!transformed.profession) transformed.profession = 'outro';

			return transformed;
		},
		[columnMapping],
	);

	const validatePreview = useCallback((): PreviewValidationResult => {
		if (!parsedData) return { valid: 0, invalid: 0, errors: [] };

		let valid = 0;
		let invalid = 0;
		const errors: string[] = [];

		for (let i = 0; i < Math.min(5, parsedData.rows.length); i++) {
			const row = parsedData.rows[i];
			const result = validateRow(row, i + 2, columnMapping);
			if (result.isValid) {
				valid++;
			} else {
				invalid++;
				errors.push(...result.errors);
			}
		}

		return { valid, invalid, errors };
	}, [parsedData, columnMapping]);

	const handleImport = useCallback(async () => {
		if (!(parsedData && file)) return;

		// Validate product is selected
		if (!selectedProduct) {
			toast.error('Produto não selecionado', {
				description: 'Selecione um produto antes de importar os alunos.',
			});
			return;
		}

		setStep('importing');
		setIsProcessing(true);
		setImportProgress(0);

		try {
			// Transform all rows
			const transformedStudents = parsedData.rows.map((row) => transformRowData(row));

			// Call bulk import mutation
			const result = await bulkImport({
				students: transformedStudents as {
					name: string;
					email: string;
					phone: string;
					profession: string;
					hasClinic: boolean;
					cpf?: string;
					clinicName?: string;
					clinicCity?: string;
					status?: 'ativo' | 'inativo' | 'pausado' | 'formado';
					birthDate?: number;
					address?: string;
					addressNumber?: string;
					complement?: string;
					neighborhood?: string;
					city?: string;
					state?: string;
					zipCode?: string;
					country?: string;
					saleDate?: number;
					salesperson?: string;
					contractStatus?: string;
					leadSource?: string;
					cohort?: string;
					totalValue?: number;
					installments?: number;
					installmentValue?: number;
					paymentStatus?: string;
					paidInstallments?: number;
					startDate?: number;
					professionalId?: string;
				}[],
				fileName: file.name,
				product: selectedProduct as
					| 'trintae3'
					| 'otb'
					| 'black_neon'
					| 'comunidade'
					| 'auriculo'
					| 'na_mesa_certa',
				upsertMode,
			});

			setImportResults(result);
			setStep('results');
		} catch (_error) {
			toast.error('Erro na importação', {
				description: 'Verifique os dados e tente novamente.',
			});
		} finally {
			setIsProcessing(false);
		}
	}, [parsedData, file, selectedProduct, upsertMode, bulkImport, transformRowData]);

	const downloadErrorLog = useCallback(() => {
		if (!importResults) return;

		const errors = importResults.results.filter((r) => !r.success);
		const csv = Papa.unparse(
			errors.map((e) => ({
				Linha: e.rowNumber,
				Erro: e.error,
				Avisos: e.warnings?.join('; ') || '',
			})),
		);

		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `erros_importacao_${new Date().toISOString().split('T')[0]}.csv`;
		link.click();
		URL.revokeObjectURL(url);
	}, [importResults]);

	// ============================================================================
	// Computed Values
	// ============================================================================

	const previewValidation = validatePreview();
	const requiredFields = ['name', 'phone'];
	const missingFields = requiredFields.filter((f) => !Object.values(columnMapping).includes(f));
	const canProceed = missingFields.length === 0;

	// ============================================================================
	// Return
	// ============================================================================

	return {
		// Dialog state
		open,
		setOpen,

		// Step navigation
		step,
		setStep,

		// File handling
		file,
		setFile,
		parsedData,
		setParsedData,

		// Column mapping
		columnMapping,
		setColumnMapping,

		// Processing state
		isProcessing,
		setIsProcessing,
		importProgress,
		setImportProgress,

		// Import results
		importResults,
		setImportResults,

		// Product selection
		selectedProduct,
		setSelectedProduct,

		// Upsert mode
		upsertMode,
		setUpsertMode,

		// Sheet handling (XLSX)
		availableSheets,
		setAvailableSheets,
		selectedSheet,
		setSelectedSheet,

		// Header detection
		headerDetection,
		setHeaderDetection,
		rawXLSXData,
		setRawXLSXData,
		selectedHeaderRow,
		setSelectedHeaderRow,

		// Password dialog
		showPasswordDialog,
		setShowPasswordDialog,
		xlsxPassword,
		setXlsxPassword,
		pendingFile,
		setPendingFile,
		pendingSheet,
		setPendingSheet,

		// IDs for accessibility
		fileInputId,
		passwordInputId,

		// Schema fields
		schemaFields,

		// Callbacks
		resetState,
		handleFileUpload,
		handleSheetSelect,
		handleHeaderSelect,
		handlePasswordSubmit,
		handleDrop,
		handleFileSelect,
		handleMappingChange,
		transformRowData,
		validatePreview,
		handleImport,
		downloadErrorLog,

		// Computed values
		previewValidation,
		requiredFields,
		missingFields,
		canProceed,
	};
}
