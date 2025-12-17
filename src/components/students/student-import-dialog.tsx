/**
 * Student Import Dialog
 * Upload CSV/XLSX files to bulk import students
 */

import { useMutation } from 'convex/react';
import {
	AlertCircle,
	CheckCircle,
	Download,
	FileSpreadsheet,
	Loader2,
	Upload,
	XCircle,
} from 'lucide-react';
import Papa from 'papaparse';
import { useCallback, useId, useState } from 'react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

import { api } from '../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import {
	getSchemaFields,
	mapCSVHeaders,
	normalizeEmail,
	normalizePaymentStatus,
	normalizePhone,
	normalizeProfession,
	normalizeStatus,
	parseBoolean,
	parseDate,
	parseInteger,
	parseMonetary,
	validateRow,
} from '@/lib/csv-validator';

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'results';

interface ParsedData {
	headers: string[];
	rows: Record<string, unknown>[];
}

interface ImportResult {
	rowNumber: number;
	success: boolean;
	studentId?: string;
	error?: string;
	warnings?: string[];
}

// Custom error class for XLSX parsing with specific error codes
class XLSXParseError extends Error {
	constructor(
		message: string,
		public readonly code: string,
	) {
		super(message);
		this.name = 'XLSXParseError';
	}
}

// Helper function to parse XLSX files with robust error handling
async function parseXLSXFile(file: File): Promise<ParsedData> {
	// Step 1: Read file buffer
	let buffer: ArrayBuffer;
	try {
		buffer = await file.arrayBuffer();
	} catch {
		throw new XLSXParseError(
			'Não foi possível ler o arquivo. O arquivo pode estar corrompido ou inacessível.',
			'FILE_READ_ERROR',
		);
	}

	// Step 2: Parse workbook
	let workbook: XLSX.WorkBook;
	try {
		workbook = XLSX.read(buffer, {
			type: 'array',
			cellDates: true,
			cellNF: false,
		});
	} catch (error) {
		if (error instanceof Error && error.message.includes('password')) {
			throw new XLSXParseError(
				'Arquivo XLSX protegido por senha não é suportado. Remova a proteção e tente novamente.',
				'PASSWORD_PROTECTED',
			);
		}
		throw new XLSXParseError(
			'Estrutura de arquivo XLSX inválida. Verifique se o arquivo não está corrompido.',
			'INVALID_STRUCTURE',
		);
	}

	// Step 3: Validate sheets exist
	if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
		throw new XLSXParseError('Nenhuma planilha encontrada no arquivo XLSX.', 'NO_SHEETS');
	}

	// Step 4: Get first sheet
	const firstSheetName = workbook.SheetNames[0];
	const firstSheet = workbook.Sheets[firstSheetName];

	if (!firstSheet) {
		throw new XLSXParseError('Primeira planilha está vazia ou corrompida.', 'EMPTY_SHEET');
	}

	// Step 5: Convert to JSON
	let jsonData: unknown[][];
	try {
		jsonData = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, {
			header: 1,
			raw: false,
			defval: '',
		});
	} catch {
		throw new XLSXParseError(
			'Erro ao processar dados da planilha. Verifique o formato dos dados.',
			'PARSE_ERROR',
		);
	}

	// Step 6: Validate data exists
	if (!jsonData || jsonData.length === 0) {
		throw new XLSXParseError('Nenhum dado encontrado na primeira planilha.', 'NO_DATA');
	}

	// Step 7: Extract headers and rows
	const firstRow = jsonData[0];
	if (!firstRow || firstRow.length === 0) {
		throw new XLSXParseError(
			'Cabeçalho da planilha está vazio. A primeira linha deve conter os nomes das colunas.',
			'EMPTY_HEADER',
		);
	}

	const headers = firstRow.map((h) => String(h || '').trim()).filter(Boolean);

	if (headers.length === 0) {
		throw new XLSXParseError('Nenhuma coluna válida encontrada no cabeçalho.', 'INVALID_HEADER');
	}

	const rows = jsonData.slice(1).map((row) => {
		const arr = row as unknown[];
		const obj: Record<string, unknown> = {};
		headers.forEach((header, index) => {
			obj[header] = arr[index];
		});
		return obj;
	});

	return { headers, rows };
}

// Helper function to parse CSV files
async function parseCSVFile(file: File): Promise<ParsedData> {
	const text = await file.text();
	const result = Papa.parse<Record<string, unknown>>(text, {
		header: true,
		skipEmptyLines: true,
		transformHeader: (h: string) => h.trim(),
	});

	return {
		headers: result.meta.fields || [],
		rows: result.data,
	};
}

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

// File validation function
function validateFile(file: File): { valid: boolean; error?: string } {
	const extension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));

	if (!ALLOWED_EXTENSIONS.includes(extension)) {
		return {
			valid: false,
			error: `Formato de arquivo não suportado: ${extension}. Use CSV, XLSX ou XLS.`,
		};
	}

	if (file.size > MAX_FILE_SIZE) {
		const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
		return {
			valid: false,
			error: `Arquivo muito grande (${sizeMB}MB). O tamanho máximo é 10MB.`,
		};
	}

	if (file.size === 0) {
		return {
			valid: false,
			error: 'O arquivo está vazio. Selecione um arquivo com dados.',
		};
	}

	return { valid: true };
}

// Field transformer type
type FieldTransformer = (value: unknown, schemaField: string) => unknown;

// Field transformers map to reduce switch complexity
const FIELD_TRANSFORMERS: Record<string, FieldTransformer> = {
	name: (value) => String(value || '').trim(),
	email: (value) => normalizeEmail(String(value || '')),
	phone: (value) => normalizePhone(String(value || '')),
	cpf: (value) => (value ? String(value).replace(/\D/g, '') : undefined),
	profession: (value) => normalizeProfession(String(value || '')),
	hasClinic: (value) => parseBoolean(value as string | boolean | undefined),
	status: (value) => normalizeStatus(String(value || '')),
	birthDate: (value) => (value ? parseDate(value as string | number) : undefined),
	saleDate: (value) => (value ? parseDate(value as string | number) : undefined),
	// Financial/Enrollment field transformers
	totalValue: (value) => parseMonetary(value as string | number | undefined),
	installmentValue: (value) => parseMonetary(value as string | number | undefined),
	installments: (value) => parseInteger(value as string | number | undefined),
	paidInstallments: (value) => parseInteger(value as string | number | undefined),
	paymentStatus: (value) => normalizePaymentStatus(String(value || '')),
	startDate: (value) => (value ? parseDate(value as string | number) : undefined),
	professionalId: (value) => (value ? String(value).trim() : undefined),
};

// Default transformer for string fields
const defaultTransformer: FieldTransformer = (value) =>
	value !== undefined && value !== null && value !== '' ? String(value).trim() : undefined;

export function StudentImportDialog() {
	const [open, setOpen] = useState(false);
	const [step, setStep] = useState<ImportStep>('upload');
	const [file, setFile] = useState<File | null>(null);
	const [parsedData, setParsedData] = useState<ParsedData | null>(null);
	const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
	const [isProcessing, setIsProcessing] = useState(false);
	const [importProgress, setImportProgress] = useState(0);
	const [importResults, setImportResults] = useState<{
		totalRows: number;
		successCount: number;
		failureCount: number;
		results: ImportResult[];
	} | null>(null);
	const [selectedProduct, setSelectedProduct] = useState<string>('');
	const [upsertMode, setUpsertMode] = useState(true);

	// @ts-expect-error - Convex API is generated dynamically
	const bulkImport = useMutation(api['students-import'].bulkImport);
	const fileInputId = useId();

	const schemaFields = getSchemaFields();

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
	}, []);

	const handleFileUpload = useCallback(async (uploadedFile: File) => {
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
			const isXLSX = uploadedFile.name.endsWith('.xlsx') || uploadedFile.name.endsWith('.xls');
			const parsed = isXLSX ? await parseXLSXFile(uploadedFile) : await parseCSVFile(uploadedFile);

			setParsedData(parsed);
			setColumnMapping(mapCSVHeaders(parsed.headers));
			setStep('mapping');
		} catch (error) {
			// Handle XLSXParseError with specific messages
			if (error instanceof XLSXParseError) {
				toast.error('Erro ao processar arquivo XLSX', {
					description: error.message,
				});
			} else {
				toast.error('Erro ao processar arquivo', {
					description: 'Verifique se o formato do arquivo está correto e tente novamente.',
				});
			}
		} finally {
			setIsProcessing(false);
		}
	}, []);

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

	const validatePreview = useCallback(() => {
		if (!parsedData) return { valid: 0, invalid: 0, errors: [] as string[] };

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
					// Financial/Enrollment fields
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
		} catch {
			alert('Erro durante a importação. Verifique os dados e tente novamente.');
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

	const previewValidation = validatePreview();
	const requiredFields = ['name', 'email', 'phone', 'profession', 'hasClinic'];
	const missingFields = requiredFields.filter((f) => !Object.values(columnMapping).includes(f));
	const canProceed = missingFields.length === 0; // All required fields must be mapped

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => {
				setOpen(isOpen);
				if (!isOpen) resetState();
			}}
		>
			<DialogTrigger asChild>
				<Button variant="outline" className="gap-2">
					<Upload className="h-4 w-4" />
					Importar CSV
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FileSpreadsheet className="h-5 w-5 text-purple-500" />
						Importar Alunos
					</DialogTitle>
					<DialogDescription>
						{step === 'upload' && 'Faça upload de um arquivo CSV ou XLSX com os dados dos alunos.'}
						{step === 'mapping' && 'Mapeie as colunas do arquivo para os campos do sistema.'}
						{step === 'preview' && 'Revise os dados antes de importar.'}
						{step === 'importing' && 'Importando alunos...'}
						{step === 'results' && 'Resultado da importação.'}
					</DialogDescription>
				</DialogHeader>

				{/* Upload Step */}
				{step === 'upload' && (
					<div className="space-y-4">
						<div className="space-y-2">
							<span className="block text-sm font-medium">
								Produto para matrícula <span className="text-red-500">*</span>
							</span>
							<Select value={selectedProduct} onValueChange={setSelectedProduct}>
								<SelectTrigger aria-label="Selecione o produto para matrícula">
									<SelectValue placeholder="Selecione o produto..." />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="trintae3">Trinta e 3</SelectItem>
									<SelectItem value="otb">OTB</SelectItem>
									<SelectItem value="black_neon">Black Neon</SelectItem>
									<SelectItem value="comunidade">Comunidade US</SelectItem>
									<SelectItem value="auriculo">Aurículo</SelectItem>
									<SelectItem value="na_mesa_certa">Na Mesa Certa</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-xs text-muted-foreground">
								Todos os alunos importados serão matriculados neste produto.
							</p>
						</div>

						<button
							type="button"
							className="w-full border-2 border-dashed rounded-lg p-8 text-center hover:border-purple-500 transition-colors cursor-pointer bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
							onDrop={handleDrop}
							onDragOver={(e) => e.preventDefault()}
							onClick={() => document.getElementById(fileInputId)?.click()}
							disabled={!selectedProduct}
						>
							<input
								id={fileInputId}
								type="file"
								accept=".csv,.xlsx,.xls"
								className="hidden"
								onChange={handleFileSelect}
							/>
							{isProcessing ? (
								<Loader2 className="h-12 w-12 mx-auto mb-4 text-purple-500 animate-spin" />
							) : (
								<Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
							)}
							<p className="text-lg font-medium">
								{isProcessing
									? 'Processando arquivo...'
									: !selectedProduct
										? 'Selecione um produto primeiro'
										: 'Arraste e solte um arquivo aqui'}
							</p>
							<p className="text-sm text-muted-foreground mt-2">
								ou clique para selecionar (CSV, XLSX)
							</p>
						</button>
					</div>
				)}

				{/* Mapping Step */}
				{step === 'mapping' && parsedData && (
					<div className="space-y-4">
						<div className="flex items-center justify-between text-sm text-muted-foreground">
							<span>Arquivo: {file?.name}</span>
							<span>{parsedData.rows.length} registros encontrados</span>
						</div>

						<div className="border rounded-lg overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-1/3">Coluna do Arquivo</TableHead>
										<TableHead className="w-1/3">Campo do Sistema</TableHead>
										<TableHead className="w-1/3">Exemplo</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{parsedData.headers.map((header) => (
										<TableRow key={header}>
											<TableCell className="font-medium">{header}</TableCell>
											<TableCell>
												<Select
													value={columnMapping[header] || '_skip'}
													onValueChange={(value) => handleMappingChange(header, value)}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Selecione..." />
													</SelectTrigger>
													<SelectContent>
														{schemaFields.map((field) => (
															<SelectItem key={field.value} value={field.value}>
																{field.label}
																{field.required && ' *'}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
												{String(parsedData.rows[0]?.[header] || '-')}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						{!canProceed && (
							<div className="flex items-start gap-2 text-amber-500 text-sm">
								<AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
								<div>
									<span className="font-medium">Campos obrigatórios faltando:</span>
									<ul className="list-disc list-inside mt-1">
										{missingFields.map((field) => {
											const fieldLabel =
												schemaFields.find((f) => f.value === field)?.label || field;
											return <li key={field}>{fieldLabel}</li>;
										})}
									</ul>
								</div>
							</div>
						)}

						<div className="space-y-3 border-t pt-4">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={upsertMode}
									onChange={(e) => setUpsertMode(e.target.checked)}
									className="rounded"
								/>
								<span className="text-sm">
									Atualizar alunos existentes (se email já cadastrado)
								</span>
							</label>
							<p className="text-xs text-muted-foreground ml-6">
								{upsertMode
									? 'Alunos existentes serão atualizados e nova matrícula será adicionada.'
									: 'Alunos com email duplicado serão ignorados.'}
							</p>
						</div>
					</div>
				)}

				{/* Preview Step */}
				{step === 'preview' && parsedData && (
					<div className="space-y-4">
						<div className="grid grid-cols-3 gap-4 text-center">
							<div className="border rounded-lg p-4">
								<p className="text-2xl font-bold">{parsedData.rows.length}</p>
								<p className="text-sm text-muted-foreground">Total de registros</p>
							</div>
							<div className="border rounded-lg p-4">
								<p className="text-2xl font-bold text-green-500">{previewValidation.valid}</p>
								<p className="text-sm text-muted-foreground">Válidos (amostra)</p>
							</div>
							<div className="border rounded-lg p-4">
								<p className="text-2xl font-bold text-red-500">{previewValidation.invalid}</p>
								<p className="text-sm text-muted-foreground">Com erros (amostra)</p>
							</div>
						</div>

						{previewValidation.errors.length > 0 && (
							<div className="border border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-950">
								<h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
									Erros encontrados:
								</h4>
								<ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
									{previewValidation.errors.slice(0, 5).map((error, i) => (
										<li key={i}>{error}</li>
									))}
								</ul>
							</div>
						)}

						<div className="border rounded-lg overflow-hidden">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>#</TableHead>
										{Object.values(columnMapping)
											.filter((v) => v !== '_skip')
											.slice(0, 5)
											.map((field) => (
												<TableHead key={field}>
													{schemaFields.find((f) => f.value === field)?.label || field}
												</TableHead>
											))}
									</TableRow>
								</TableHeader>
								<TableBody>
									{parsedData.rows.slice(0, 5).map((row, i) => {
										const transformed = transformRowData(row);
										return (
											<TableRow key={i}>
												<TableCell>{i + 2}</TableCell>
												{Object.values(columnMapping)
													.filter((v) => v !== '_skip')
													.slice(0, 5)
													.map((field) => (
														<TableCell key={field} className="truncate max-w-[150px]">
															{String(transformed[field] || '-')}
														</TableCell>
													))}
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</div>
					</div>
				)}

				{/* Importing Step */}
				{step === 'importing' && (
					<div className="py-8 text-center">
						<Loader2 className="h-12 w-12 mx-auto mb-4 text-purple-500 animate-spin" />
						<p className="text-lg font-medium">Importando alunos...</p>
						<p className="text-sm text-muted-foreground mt-2">
							Processando {parsedData?.rows.length || 0} registros
						</p>
						<div className="w-full bg-secondary rounded-full h-2 mt-4">
							<div
								className="bg-purple-500 h-2 rounded-full transition-all"
								style={{ width: `${importProgress}%` }}
							/>
						</div>
					</div>
				)}

				{/* Results Step */}
				{step === 'results' && importResults && (
					<div className="space-y-4">
						<div className="grid grid-cols-3 gap-4 text-center">
							<div className="border rounded-lg p-4">
								<p className="text-2xl font-bold">{importResults.totalRows}</p>
								<p className="text-sm text-muted-foreground">Total</p>
							</div>
							<div className="border rounded-lg p-4">
								<CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
								<p className="text-2xl font-bold text-green-500">{importResults.successCount}</p>
								<p className="text-sm text-muted-foreground">Importados</p>
							</div>
							<div className="border rounded-lg p-4">
								<XCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
								<p className="text-2xl font-bold text-red-500">{importResults.failureCount}</p>
								<p className="text-sm text-muted-foreground">Com erros</p>
							</div>
						</div>

						{importResults.failureCount > 0 && (
							<>
								<div className="border border-red-200 rounded-lg p-4 bg-red-50 dark:bg-red-950 max-h-48 overflow-y-auto">
									<h4 className="font-medium text-red-700 dark:text-red-300 mb-2">
										Erros na importação:
									</h4>
									<ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
										{importResults.results
											.filter((r) => !r.success)
											.slice(0, 10)
											.map((result, i) => (
												<li key={i}>
													Linha {result.rowNumber}: {result.error}
												</li>
											))}
										{importResults.failureCount > 10 && (
											<li className="font-medium">
												... e mais {importResults.failureCount - 10} erros
											</li>
										)}
									</ul>
								</div>

								<Button variant="outline" className="gap-2" onClick={downloadErrorLog}>
									<Download className="h-4 w-4" />
									Baixar log de erros
								</Button>
							</>
						)}
					</div>
				)}

				<DialogFooter>
					{step === 'mapping' && (
						<>
							<Button variant="outline" onClick={resetState}>
								Cancelar
							</Button>
							<Button onClick={() => setStep('preview')} disabled={!canProceed}>
								Pré-visualizar
							</Button>
						</>
					)}
					{step === 'preview' && (
						<>
							<Button variant="outline" onClick={() => setStep('mapping')}>
								Voltar
							</Button>
							<Button onClick={handleImport} disabled={isProcessing}>
								{isProcessing ? (
									<>
										<Loader2 className="h-4 w-4 mr-2 animate-spin" />
										Importando...
									</>
								) : (
									<>Importar {parsedData?.rows.length || 0} alunos</>
								)}
							</Button>
						</>
					)}
					{step === 'results' && <Button onClick={() => setOpen(false)}>Fechar</Button>}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
