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
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import {
	detectHeaderRow,
	extractDataWithHeaders,
	type HeaderDetectionResult,
	parseXLSXWithPassword,
} from '@/lib/xlsx-helper';

type ImportStep =
	| 'upload'
	| 'sheet-select'
	| 'header-select'
	| 'mapping'
	| 'preview'
	| 'importing'
	| 'results';

interface ParsedData {
	headers: string[];
	rows: Record<string, unknown>[];
}

interface XLSXParseResult {
	data: ParsedData;
	headerDetection: HeaderDetectionResult;
	rawData: unknown[][];
	needsPassword?: boolean;
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

// Helper function to get sheet names from XLSX file
async function getXLSXSheetNames(file: File): Promise<string[]> {
	const buffer = await file.arrayBuffer();
	const workbook = XLSX.read(buffer, { type: 'array' });
	return workbook.SheetNames;
}

// Helper function to parse workbook from buffer with password support
// Extracted to reduce complexity of parseXLSXFile
function parseWorkbookFromBuffer(buffer: ArrayBuffer, password?: string): XLSX.WorkBook {
	if (password) {
		const result = parseXLSXWithPassword(buffer, password);
		if (!result.success) {
			if ('needsPassword' in result && result.needsPassword) {
				throw new XLSXParseError('Senha incorreta. Tente novamente.', 'WRONG_PASSWORD');
			}
			if ('error' in result) {
				throw new XLSXParseError(result.error, 'PASSWORD_ERROR');
			}
			throw new XLSXParseError('Erro ao processar arquivo protegido.', 'PASSWORD_ERROR');
		}
		return result.workbook;
	}

	return XLSX.read(buffer, {
		type: 'array',
		cellDates: true,
		cellNF: false,
	});
}

// Helper function to handle workbook parsing errors
function handleWorkbookParseError(error: unknown): never {
	if (error instanceof XLSXParseError) throw error;
	if (error instanceof Error && error.message.includes('password')) {
		throw new XLSXParseError(
			'Arquivo protegido por senha. Por favor, informe a senha.',
			'PASSWORD_PROTECTED',
		);
	}
	throw new XLSXParseError(
		'Estrutura de arquivo XLSX inválida. Verifique se o arquivo não está corrompido.',
		'INVALID_STRUCTURE',
	);
}

// Helper function to parse XLSX files with header detection and password support
async function parseXLSXFile(
	file: File,
	sheetName?: string,
	password?: string,
): Promise<XLSXParseResult> {
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

	// Step 2: Parse workbook (with password support)
	let workbook: XLSX.WorkBook;
	try {
		workbook = parseWorkbookFromBuffer(buffer, password);
	} catch (error) {
		handleWorkbookParseError(error);
	}

	// Step 3: Validate sheets exist
	if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
		throw new XLSXParseError('Nenhuma planilha encontrada no arquivo XLSX.', 'NO_SHEETS');
	}

	// Step 4: Get target sheet (specified or first)
	const targetSheetName = sheetName || workbook.SheetNames[0];
	const targetSheet = workbook.Sheets[targetSheetName];

	if (!targetSheet) {
		throw new XLSXParseError(
			sheetName
				? `Planilha "${sheetName}" não encontrada.`
				: 'Primeira planilha está vazia ou corrompida.',
			'EMPTY_SHEET',
		);
	}

	// Step 5: Convert to JSON (raw 2D array)
	let jsonData: unknown[][];
	try {
		jsonData = XLSX.utils.sheet_to_json<unknown[]>(targetSheet, {
			header: 1,
			raw: false,
			defval: '',
		});
	} catch (_error) {
		throw new XLSXParseError(
			'Erro ao processar dados da planilha. Verifique o formato dos dados.',
			'PARSE_ERROR',
		);
	}

	// Step 6: Validate data exists
	if (!jsonData || jsonData.length === 0) {
		throw new XLSXParseError('Nenhum dado encontrado na primeira planilha.', 'NO_DATA');
	}

	// Step 7: Detect header row using smart detection
	const headerDetection = detectHeaderRow(jsonData);

	// Step 8: Extract data using detected header row
	const extractedData = extractDataWithHeaders(jsonData, headerDetection.headerRowIndex);

	if (extractedData.headers.length === 0) {
		throw new XLSXParseError('Nenhuma coluna válida encontrada no cabeçalho.', 'INVALID_HEADER');
	}

	return {
		data: { headers: extractedData.headers, rows: extractedData.dataRows },
		headerDetection,
		rawData: jsonData,
	};
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

// ============================================================================
// Step Content Render Helpers (to reduce cognitive complexity)
// ============================================================================

interface StepContentProps {
	// Upload step
	selectedProduct?: string;
	setSelectedProduct?: (value: string) => void;
	isProcessing?: boolean;
	fileInputId?: string;
	handleDrop?: (e: React.DragEvent<HTMLButtonElement>) => void;
	handleFileSelect?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	// Sheet select step
	fileName?: string;
	availableSheets?: string[];
	selectedSheet?: string;
	setSelectedSheet?: (value: string) => void;
	// Mapping step
	parsedData?: ParsedData;
	columnMapping?: Record<string, string>;
	handleMappingChange?: (csvHeader: string, schemaField: string) => void;
	schemaFields?: { value: string; label: string; required?: boolean }[];
	canProceed?: boolean;
	missingFields?: string[];
	upsertMode?: boolean;
	setUpsertMode?: (value: boolean) => void;
	// Preview step
	previewValidation?: { valid: number; invalid: number; errors: string[] };
	transformRowData?: (row: Record<string, unknown>) => Record<string, unknown>;
	// Importing step
	importProgress?: number;
	// Results step
	importResults?: {
		totalRows: number;
		successCount: number;
		failureCount: number;
		results: ImportResult[];
	};
	downloadErrorLog?: () => void;
}

function renderUploadStep(props: StepContentProps) {
	const {
		selectedProduct = '',
		setSelectedProduct,
		isProcessing,
		fileInputId = '',
		handleDrop,
		handleFileSelect,
	} = props;

	return (
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
				<p className="text-sm text-muted-foreground mt-2">ou clique para selecionar (CSV, XLSX)</p>
			</button>
		</div>
	);
}

function renderSheetSelectStep(props: StepContentProps) {
	const { fileName = '', availableSheets = [], selectedSheet = '', setSelectedSheet } = props;

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<FileSpreadsheet className="h-4 w-4" />
				<span>Arquivo: {fileName}</span>
			</div>
			<p className="text-sm">
				O arquivo contém <strong>{availableSheets.length} planilhas</strong>. Selecione qual deseja
				importar:
			</p>
			<Select value={selectedSheet} onValueChange={setSelectedSheet}>
				<SelectTrigger>
					<SelectValue placeholder="Selecione a planilha..." />
				</SelectTrigger>
				<SelectContent>
					{availableSheets.map((sheet) => (
						<SelectItem key={sheet} value={sheet}>
							{sheet}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

interface HeaderSelectStepProps {
	headerDetection: import('@/lib/xlsx-helper').HeaderDetectionResult | null;
	selectedHeaderRow: number;
	setSelectedHeaderRow: (row: number) => void;
	rawXLSXData: unknown[][] | null;
}

function renderHeaderSelectStep(props: HeaderSelectStepProps) {
	const { headerDetection, selectedHeaderRow, setSelectedHeaderRow, rawXLSXData } = props;

	if (!(headerDetection && rawXLSXData)) return null;

	// Get preview rows (first 5 data rows after selected header)
	const previewRows = rawXLSXData.slice(selectedHeaderRow + 1, selectedHeaderRow + 6);
	const headerRow = rawXLSXData[selectedHeaderRow] as string[];

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<span className="text-sm text-muted-foreground">Confiança na detecção:</span>
				<Badge variant={headerDetection.confidence >= 0.7 ? 'default' : 'secondary'}>
					{Math.round(headerDetection.confidence * 100)}%
				</Badge>
			</div>

			<div className="space-y-2">
				<Label>Selecione a linha de cabeçalho:</Label>
				<RadioGroup
					value={String(selectedHeaderRow)}
					onValueChange={(v) => setSelectedHeaderRow(Number(v))}
				>
					{headerDetection.candidates.map((candidate) => (
						<div key={candidate.rowIndex} className="flex items-center space-x-2">
							<RadioGroupItem value={String(candidate.rowIndex)} id={`row-${candidate.rowIndex}`} />
							<Label htmlFor={`row-${candidate.rowIndex}`} className="flex-1 cursor-pointer">
								<span className="font-medium">Linha {candidate.rowIndex + 1}</span>
								<span className="text-muted-foreground ml-2">
									({Math.round(candidate.score * 100)}% - {candidate.headers.slice(0, 3).join(', ')}
									{candidate.headers.length > 3 && '...'})
								</span>
							</Label>
						</div>
					))}
				</RadioGroup>
			</div>

			<Card>
				<CardContent className="p-4">
					<p className="text-sm font-medium mb-2">Prévia dos dados:</p>
					<div className="overflow-x-auto">
						<table className="text-xs w-full">
							<thead>
								<tr className="border-b">
									{headerRow?.slice(0, 5).map((h, i) => (
										<th key={i} className="p-1 text-left font-medium">
											{String(h) || `Col ${i + 1}`}
										</th>
									))}
									{(headerRow?.length ?? 0) > 5 && <th className="p-1">...</th>}
								</tr>
							</thead>
							<tbody>
								{previewRows.map((row, i) => (
									<tr key={i} className="border-b last:border-0">
										{(row as unknown[]).slice(0, 5).map((cell, j) => (
											<td key={j} className="p-1 truncate max-w-[150px]">
												{String(cell ?? '')}
											</td>
										))}
										{(row as unknown[]).length > 5 && <td className="p-1">...</td>}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

function renderMappingStep(props: StepContentProps) {
	const {
		fileName = '',
		parsedData,
		columnMapping = {},
		handleMappingChange,
		schemaFields = [],
		canProceed,
		missingFields = [],
		upsertMode,
		setUpsertMode,
	} = props;

	if (!parsedData) return null;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between text-sm text-muted-foreground">
				<span>Arquivo: {fileName}</span>
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
										onValueChange={(value) => handleMappingChange?.(header, value)}
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
								const fieldLabel = schemaFields.find((f) => f.value === field)?.label || field;
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
						onChange={(e) => setUpsertMode?.(e.target.checked)}
						className="rounded"
					/>
					<span className="text-sm">Atualizar alunos existentes (se email já cadastrado)</span>
				</label>
				<p className="text-xs text-muted-foreground ml-6">
					{upsertMode
						? 'Alunos existentes serão atualizados e nova matrícula será adicionada.'
						: 'Alunos com email duplicado serão ignorados.'}
				</p>
			</div>
		</div>
	);
}

function renderPreviewStep(props: StepContentProps) {
	const {
		parsedData,
		previewValidation = { valid: 0, invalid: 0, errors: [] },
		columnMapping = {},
		schemaFields = [],
		transformRowData,
	} = props;

	if (!parsedData) return null;

	const mappedFields = Object.values(columnMapping)
		.filter((v) => v !== '_skip')
		.slice(0, 5);

	return (
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
					<h4 className="font-medium text-red-700 dark:text-red-300 mb-2">Erros encontrados:</h4>
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
							{mappedFields.map((field) => (
								<TableHead key={field}>
									{schemaFields.find((f) => f.value === field)?.label || field}
								</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{parsedData.rows.slice(0, 5).map((row, i) => {
							const transformed = transformRowData?.(row) || {};
							return (
								<TableRow key={i}>
									<TableCell>{i + 2}</TableCell>
									{mappedFields.map((field) => (
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
	);
}

function renderImportingStep(props: StepContentProps) {
	const { parsedData, importProgress = 0 } = props;

	return (
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
	);
}

function renderResultsStep(props: StepContentProps) {
	const { importResults, downloadErrorLog } = props;

	if (!importResults) return null;

	return (
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
								<li className="font-medium">... e mais {importResults.failureCount - 10} erros</li>
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
	);
}

// ============================================================================
// Dialog Footer Buttons Component (extracted to reduce complexity)
// ============================================================================

interface DialogFooterButtonsProps {
	step: ImportStep;
	isProcessing: boolean;
	canProceed: boolean;
	selectedSheet: string;
	parsedDataRowCount: number;
	resetState: () => void;
	handleSheetSelect: () => void;
	handleHeaderSelect: () => void;
	handleImport: () => void;
	setStep: (step: ImportStep) => void;
	setOpen: (open: boolean) => void;
}

function DialogFooterButtons({
	step,
	isProcessing,
	canProceed,
	selectedSheet,
	parsedDataRowCount,
	resetState,
	handleSheetSelect,
	handleHeaderSelect,
	handleImport,
	setStep,
	setOpen,
}: DialogFooterButtonsProps) {
	switch (step) {
		case 'sheet-select':
			return (
				<>
					<Button variant="outline" onClick={resetState}>
						Cancelar
					</Button>
					<Button onClick={handleSheetSelect} disabled={isProcessing || !selectedSheet}>
						{isProcessing ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Processando...
							</>
						) : (
							'Continuar'
						)}
					</Button>
				</>
			);
		case 'header-select':
			return (
				<>
					<Button variant="outline" onClick={resetState}>
						Cancelar
					</Button>
					<Button onClick={handleHeaderSelect} disabled={isProcessing}>
						{isProcessing ? (
							<>
								<Loader2 className="h-4 w-4 mr-2 animate-spin" />
								Processando...
							</>
						) : (
							'Confirmar e Continuar'
						)}
					</Button>
				</>
			);
		case 'mapping':
			return (
				<>
					<Button variant="outline" onClick={resetState}>
						Cancelar
					</Button>
					<Button onClick={() => setStep('preview')} disabled={!canProceed}>
						Pré-visualizar
					</Button>
				</>
			);
		case 'preview':
			return (
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
							<>Importar {parsedDataRowCount} alunos</>
						)}
					</Button>
				</>
			);
		case 'results':
			return <Button onClick={() => setOpen(false)}>Fechar</Button>;
		default:
			return null;
	}
}

// ============================================================================
// Main Component
// ============================================================================

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
	const [availableSheets, setAvailableSheets] = useState<string[]>([]);
	const [selectedSheet, setSelectedSheet] = useState<string>('');

	// Header detection states
	const [headerDetection, setHeaderDetection] = useState<HeaderDetectionResult | null>(null);
	const [rawXLSXData, setRawXLSXData] = useState<unknown[][] | null>(null);
	const [selectedHeaderRow, setSelectedHeaderRow] = useState<number>(0);

	// Password dialog states
	const [showPasswordDialog, setShowPasswordDialog] = useState(false);
	const [xlsxPassword, setXlsxPassword] = useState('');
	const [pendingFile, setPendingFile] = useState<File | null>(null);
	const [pendingSheet, setPendingSheet] = useState<string | undefined>(undefined);

	const bulkImport = useMutation(api.studentsImport.bulkImport);
	const fileInputId = useId();
	const passwordInputId = useId();

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

			// Check for multiple sheets in XLSX files
			if (isXLSX) {
				const sheets = await getXLSXSheetNames(uploadedFile);
				if (sheets.length > 1) {
					setAvailableSheets(sheets);
					setSelectedSheet(sheets[0]);
					setStep('sheet-select');
					setIsProcessing(false);
					return;
				}
			}

			if (isXLSX) {
				const xlsxResult = await parseXLSXFile(uploadedFile);
				// Store header detection info and raw data for potential header-select step
				setHeaderDetection(xlsxResult.headerDetection);
				setRawXLSXData(xlsxResult.rawData);
				setSelectedHeaderRow(xlsxResult.headerDetection.headerRowIndex);

				// If low confidence or multiple candidates, let user confirm header row
				if (
					xlsxResult.headerDetection.confidence < 0.7 &&
					xlsxResult.headerDetection.candidates.length > 1
				) {
					setPendingFile(uploadedFile);
					setStep('header-select');
					setIsProcessing(false);
					return;
				}

				setParsedData(xlsxResult.data);
				setColumnMapping(mapCSVHeaders(xlsxResult.data.headers, xlsxResult.data.rows));
			} else {
				const csvData = await parseCSVFile(uploadedFile);
				setParsedData(csvData);
				setColumnMapping(mapCSVHeaders(csvData.headers, csvData.rows));
			}
			setStep('mapping');
		} catch (error) {
			// Handle XLSXParseError with specific messages
			if (error instanceof XLSXParseError) {
				if (error.code === 'PASSWORD_PROTECTED') {
					// Store file for password entry
					setPendingFile(uploadedFile);
					setShowPasswordDialog(true);
					setIsProcessing(false);
					return;
				}
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
			setColumnMapping(mapCSVHeaders(xlsxResult.data.headers, xlsxResult.data.rows));
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
	}, [file, selectedSheet]);

	// Handle user selecting a header row from candidates
	const handleHeaderSelect = useCallback(() => {
		if (!rawXLSXData) return;
		setIsProcessing(true);
		try {
			const extracted = extractDataWithHeaders(rawXLSXData, selectedHeaderRow);
			setParsedData({ headers: extracted.headers, rows: extracted.dataRows });
			setColumnMapping(mapCSVHeaders(extracted.headers, extracted.dataRows));
			setStep('mapping');
		} catch (_error) {
			toast.error('Erro ao processar cabeçalhos', {
				description: 'Não foi possível extrair os dados com o cabeçalho selecionado.',
			});
		} finally {
			setIsProcessing(false);
		}
	}, [rawXLSXData, selectedHeaderRow]);

	// Handle password submission for protected XLSX files
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
			setColumnMapping(mapCSVHeaders(xlsxResult.data.headers, xlsxResult.data.rows));
			setStep('mapping');
		} catch (error) {
			if (error instanceof XLSXParseError) {
				if (error.code === 'WRONG_PASSWORD') {
					toast.error('Senha incorreta', {
						description: 'A senha fornecida não está correta. Tente novamente.',
					});
					setShowPasswordDialog(true);
				} else {
					toast.error('Erro ao processar arquivo XLSX', { description: error.message });
				}
			} else {
				toast.error('Erro ao processar arquivo');
			}
		} finally {
			setIsProcessing(false);
			setXlsxPassword('');
		}
	}, [pendingFile, pendingSheet, xlsxPassword]);

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

	const previewValidation = validatePreview();
	const requiredFields = ['name', 'phone'];
	const missingFields = requiredFields.filter((f) => !Object.values(columnMapping).includes(f));
	const canProceed = missingFields.length === 0; // All required fields must be mapped

	return (
		<>
			{/* Password Dialog for protected XLSX files */}
			<Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Arquivo Protegido</DialogTitle>
						<DialogDescription>
							Este arquivo XLSX está protegido por senha. Digite a senha para continuar.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor={passwordInputId}>Senha</Label>
							<Input
								id={passwordInputId}
								type="password"
								value={xlsxPassword}
								onChange={(e) => setXlsxPassword(e.target.value)}
								onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
								placeholder="Digite a senha do arquivo"
							/>
						</div>
						<div className="flex justify-end gap-2">
							<Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
								Cancelar
							</Button>
							<Button onClick={handlePasswordSubmit} disabled={!xlsxPassword || isProcessing}>
								{isProcessing ? 'Verificando...' : 'Confirmar'}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Main Import Dialog */}
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
							{step === 'upload' &&
								'Faça upload de um arquivo CSV ou XLSX com os dados dos alunos.'}
							{step === 'sheet-select' && 'Selecione a planilha para importar.'}
							{step === 'header-select' && 'Confirme qual linha contém os cabeçalhos das colunas.'}
							{step === 'mapping' && 'Mapeie as colunas do arquivo para os campos do sistema.'}
							{step === 'preview' && 'Revise os dados antes de importar.'}
							{step === 'importing' && 'Importando alunos...'}
							{step === 'results' && 'Resultado da importação.'}
						</DialogDescription>
					</DialogHeader>

					{/* Upload Step */}
					{step === 'upload' &&
						renderUploadStep({
							selectedProduct,
							setSelectedProduct,
							isProcessing,
							fileInputId,
							handleDrop,
							handleFileSelect,
						})}

					{/* Sheet Selection Step */}
					{step === 'sheet-select' &&
						renderSheetSelectStep({
							fileName: file?.name,
							availableSheets,
							selectedSheet,
							setSelectedSheet,
						})}

					{/* Header Selection Step */}
					{step === 'header-select' &&
						renderHeaderSelectStep({
							headerDetection,
							selectedHeaderRow,
							setSelectedHeaderRow,
							rawXLSXData,
						})}

					{/* Mapping Step */}
					{step === 'mapping' &&
						parsedData &&
						renderMappingStep({
							fileName: file?.name,
							parsedData,
							columnMapping,
							handleMappingChange,
							schemaFields,
							canProceed,
							missingFields,
							upsertMode,
							setUpsertMode,
						})}

					{/* Preview Step */}
					{step === 'preview' &&
						parsedData &&
						renderPreviewStep({
							parsedData,
							previewValidation,
							columnMapping,
							schemaFields,
							transformRowData,
						})}

					{/* Importing Step */}
					{step === 'importing' &&
						renderImportingStep({
							parsedData: parsedData ?? undefined,
							importProgress,
						})}

					{/* Results Step */}
					{step === 'results' &&
						importResults &&
						renderResultsStep({
							importResults,
							downloadErrorLog,
						})}

					<DialogFooter>
						<DialogFooterButtons
							step={step}
							isProcessing={isProcessing}
							canProceed={canProceed}
							selectedSheet={selectedSheet}
							parsedDataRowCount={parsedData?.rows.length || 0}
							resetState={resetState}
							handleSheetSelect={handleSheetSelect}
							handleHeaderSelect={handleHeaderSelect}
							handleImport={handleImport}
							setStep={setStep}
							setOpen={setOpen}
						/>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
