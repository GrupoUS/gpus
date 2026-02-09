/**
 * Lead Import Dialog
 * Multi-step wizard for importing leads from XLSX/CSV spreadsheets
 */

import { AlertCircle, CheckCircle2, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
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
	LEAD_SCHEMA_FIELDS,
	type LeadFieldKey,
	mapLeadHeaders,
	transformLeadRow,
	validateLeadRow,
} from '@/lib/lead-csv-validator';
import { parseXLSXFile } from '@/lib/xlsx-helper';
import type { Lead } from '@/types/api';

interface LeadImportDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

interface ImportResult {
	total: number;
	success: number;
	failed: number;
	results: { index: number; success: boolean; error?: string }[];
}

export function LeadImportDialog({ open, onOpenChange }: LeadImportDialogProps) {
	const [step, setStep] = useState<ImportStep>('upload');
	const [file, setFile] = useState<File | null>(null);
	const [headers, setHeaders] = useState<string[]>([]);
	const [rows, setRows] = useState<Lead[]>([]);
	const [mapping, setMapping] = useState<Record<string, LeadFieldKey | null>>({});
	const [defaultProduct, setDefaultProduct] = useState<string>('otb');
	const [importResult, setImportResult] = useState<ImportResult | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// biome-ignore lint/suspicious/noExplicitAny: Required for Convex API
	// @ts-expect-error - Migration: error TS2304
	const importLeads = useMutation((api as any).leads.importLeads);

	const resetState = useCallback(() => {
		setStep('upload');
		setFile(null);
		setHeaders([]);
		setRows([]);
		setMapping({});
		setImportResult(null);
		setError(null);
		setIsProcessing(false);
	}, []);

	const handleClose = useCallback(() => {
		resetState();
		onOpenChange(false);
	}, [onOpenChange, resetState]);

	// Step 1: File Upload
	const handleFileUpload = useCallback(async (uploadedFile: File) => {
		setFile(uploadedFile);
		setError(null);
		setIsProcessing(true);

		try {
			const result = await parseXLSXFile(uploadedFile);

			if (!(result.data.headers.length && result.data.rows.length)) {
				throw new Error('Arquivo vazio ou sem dados válidos');
			}

			setHeaders(result.data.headers);
			// @ts-expect-error - Migration: error TS2345
			setRows(result.data.rows);

			// Auto-suggest mappings
			const suggestions = mapLeadHeaders(result.data.headers, result.data.rows);
			const initialMapping: Record<string, LeadFieldKey | null> = {};
			for (const [header, suggestion] of Object.entries(suggestions)) {
				initialMapping[header] = suggestion.field;
			}
			setMapping(initialMapping);

			setStep('mapping');
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Erro ao processar arquivo');
		} finally {
			setIsProcessing(false);
		}
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			const droppedFile = e.dataTransfer.files[0];
			if (droppedFile) {
				void handleFileUpload(droppedFile);
			}
		},
		[handleFileUpload],
	);

	const handleFileChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const selectedFile = e.target.files?.[0];
			if (selectedFile) {
				void handleFileUpload(selectedFile);
			}
		},
		[handleFileUpload],
	);

	// Step 2: Column Mapping
	const handleMappingChange = useCallback((header: string, field: LeadFieldKey | null) => {
		setMapping((prev) => ({ ...prev, [header]: field }));
	}, []);

	// Step 3: Preview & Validate
	const getPreviewData = useCallback(() => {
		return rows.slice(0, 10).map((row, index) => {
			const transformed = transformLeadRow(row, mapping);
			const validation = validateLeadRow(transformed, index);
			return { raw: row, transformed, validation, index };
		});
	}, [rows, mapping]);

	const getTotalValidCount = useCallback(() => {
		let valid = 0;
		for (let i = 0; i < rows.length; i++) {
			const transformed = transformLeadRow(rows[i], mapping);
			if (transformed && validateLeadRow(transformed, i).valid) {
				valid++;
			}
		}
		return valid;
	}, [rows, mapping]);

	// Step 4: Import
	const handleImport = useCallback(async () => {
		setStep('importing');
		setIsProcessing(true);

		try {
			const leadsToImport = rows
				.map((row) => transformLeadRow(row, mapping))
				.filter((lead): lead is NonNullable<typeof lead> => lead !== null);

			const result = await importLeads({
				leads: leadsToImport,
				defaultProduct,
			});

			setImportResult(result);
			setStep('complete');

			if (result.success > 0) {
				toast.success(`${result.success} leads importados com sucesso!`);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Erro na importação');
			setStep('preview');
		} finally {
			setIsProcessing(false);
		}
	}, [rows, mapping, defaultProduct, importLeads]);

	const hasNameMapping = Object.values(mapping).includes('name');
	const hasPhoneMapping = Object.values(mapping).includes('phone');

	return (
		<Dialog onOpenChange={handleClose} open={open}>
			<DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<FileSpreadsheet className="h-5 w-5" />
						Importar Leads
					</DialogTitle>
					<DialogDescription>
						{step === 'upload' && 'Selecione um arquivo XLSX ou CSV para importar leads'}
						{step === 'mapping' && 'Mapeie as colunas da planilha para os campos de lead'}
						{step === 'preview' && 'Revise os dados antes de importar'}
						{step === 'importing' && 'Importando leads...'}
						{step === 'complete' && 'Importação concluída'}
					</DialogDescription>
				</DialogHeader>

				{/* Step Indicators */}
				<div className="flex items-center gap-2 py-2">
					{['upload', 'mapping', 'preview', 'complete'].map((s, i) => (
						<div className="flex items-center gap-2" key={s}>
							<div
								className={`h-2 w-2 rounded-full ${
									step === s || ['mapping', 'preview', 'complete'].indexOf(step) > i - 1
										? 'bg-primary'
										: 'bg-muted'
								}`}
							/>
							{i < 3 && <div className="h-px w-8 bg-muted" />}
						</div>
					))}
				</div>

				{error && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<ScrollArea className="flex-1 pr-4">
					{/* Step 1: Upload */}
					{step === 'upload' && (
						<div
							className="cursor-pointer rounded-lg border-2 border-muted border-dashed p-12 text-center transition-colors hover:border-primary/50"
							onDragOver={(e) => e.preventDefault()}
							onDrop={handleDrop}
						>
							{isProcessing ? (
								<div className="flex flex-col items-center gap-4">
									<Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
									<p className="text-muted-foreground">Processando arquivo...</p>
								</div>
							) : (
								<>
									<Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
									<p className="mb-2 font-medium text-lg">Arraste e solte seu arquivo aqui</p>
									<p className="mb-4 text-muted-foreground">ou</p>
									<label>
										<input
											accept=".xlsx,.xls,.csv"
											className="hidden"
											onChange={handleFileChange}
											type="file"
										/>
										<Button asChild variant="outline">
											<span>Selecionar Arquivo</span>
										</Button>
									</label>
									<p className="mt-4 text-muted-foreground text-xs">
										Formatos suportados: XLSX, XLS, CSV
									</p>
								</>
							)}
						</div>
					)}

					{/* Step 2: Mapping */}
					{step === 'mapping' && (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<p className="text-muted-foreground text-sm">
									Arquivo: <strong>{file?.name}</strong> ({rows.length} linhas)
								</p>
								<Select onValueChange={setDefaultProduct} value={defaultProduct}>
									<SelectTrigger className="w-40">
										<SelectValue placeholder="Produto padrão" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="otb">OTB 2026</SelectItem>
										<SelectItem value="black_neon">Black Neon</SelectItem>
										<SelectItem value="trintae3">TrintaE3</SelectItem>
									</SelectContent>
								</Select>
							</div>

							{hasNameMapping && hasPhoneMapping ? null : (
								<Alert>
									<AlertCircle className="h-4 w-4" />
									<AlertDescription>
										{hasNameMapping || hasPhoneMapping
											? hasNameMapping
												? 'Mapeie a coluna de Telefone (obrigatório)'
												: 'Mapeie a coluna de Nome (obrigatório)'
											: 'Mapeie as colunas de Nome e Telefone (obrigatórios)'}
									</AlertDescription>
								</Alert>
							)}

							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Coluna da Planilha</TableHead>
										<TableHead>Mapear para</TableHead>
										<TableHead>Amostra</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{headers.map((header) => (
										<TableRow key={header}>
											<TableCell className="font-medium">{header}</TableCell>
											<TableCell>
												<Select
													onValueChange={(val) =>
														handleMappingChange(
															header,
															val === 'skip' ? null : (val as LeadFieldKey),
														)
													}
													value={mapping[header] ?? 'skip'}
												>
													<SelectTrigger className="w-40">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="skip">
															<span className="text-muted-foreground">— Ignorar —</span>
														</SelectItem>
														{LEAD_SCHEMA_FIELDS.map((field) => (
															<SelectItem key={field.key} value={field.key}>
																{field.label}
																{field.required && <span className="ml-1 text-destructive">*</span>}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</TableCell>
											<TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
												{String((rows[0] as Record<string, unknown>)?.[header] ?? '')}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}

					{/* Step 3: Preview */}
					{step === 'preview' && (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="font-medium">
										{getTotalValidCount()} de {rows.length} leads válidos
									</p>
									<p className="text-muted-foreground text-sm">
										Leads com erros serão ignorados na importação
									</p>
								</div>
								<Badge variant="secondary">Produto: {defaultProduct.toUpperCase()}</Badge>
							</div>

							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-12">#</TableHead>
										<TableHead>Nome</TableHead>
										<TableHead>Telefone</TableHead>
										<TableHead>E-mail</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{getPreviewData().map((item) => (
										<TableRow key={item.index}>
											<TableCell className="text-muted-foreground">{item.index + 1}</TableCell>
											<TableCell>{item.transformed?.name ?? '—'}</TableCell>
											<TableCell>{item.transformed?.phone ?? '—'}</TableCell>
											<TableCell>{item.transformed?.email ?? '—'}</TableCell>
											<TableCell>
												{item.validation.valid ? (
													<Badge className="bg-green-600" variant="default">
														<CheckCircle2 className="mr-1 h-3 w-3" />
														OK
													</Badge>
												) : (
													<Badge variant="destructive">
														<X className="mr-1 h-3 w-3" />
														Erro
													</Badge>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							{rows.length > 10 && (
								<p className="text-center text-muted-foreground text-sm">
									Mostrando 10 de {rows.length} linhas
								</p>
							)}
						</div>
					)}

					{/* Step 4: Importing */}
					{step === 'importing' && (
						<div className="flex flex-col items-center justify-center gap-4 py-12">
							<Loader2 className="h-12 w-12 animate-spin text-primary" />
							<p className="font-medium text-lg">Importando leads...</p>
							<Progress className="w-64" value={50} />
						</div>
					)}

					{/* Step 5: Complete */}
					{step === 'complete' && importResult && (
						<div className="space-y-4">
							<div className="py-8 text-center">
								<CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-green-600" />
								<p className="mb-2 font-bold text-2xl">Importação Concluída</p>
								<p className="text-muted-foreground">
									{importResult.success} leads criados • {importResult.failed} ignorados
								</p>
							</div>

							{importResult.failed > 0 && (
								<div className="space-y-2">
									<p className="font-medium text-sm">Erros encontrados:</p>
									<div className="max-h-40 overflow-auto rounded border p-2 text-sm">
										{importResult.results
											.filter((r) => !r.success)
											.slice(0, 10)
											.map((r) => (
												<p className="text-destructive" key={r.index}>
													Linha {r.index + 1}: {r.error}
												</p>
											))}
									</div>
								</div>
							)}
						</div>
					)}
				</ScrollArea>

				{/* Footer Actions */}
				<div className="flex justify-between border-t pt-4">
					<Button onClick={handleClose} variant="ghost">
						{step === 'complete' ? 'Fechar' : 'Cancelar'}
					</Button>

					<div className="flex gap-2">
						{step === 'mapping' && (
							<>
								<Button onClick={() => setStep('upload')} variant="outline">
									Voltar
								</Button>
								<Button
									disabled={!(hasNameMapping && hasPhoneMapping)}
									onClick={() => setStep('preview')}
								>
									Próximo
								</Button>
							</>
						)}

						{step === 'preview' && (
							<>
								<Button onClick={() => setStep('mapping')} variant="outline">
									Voltar
								</Button>
								<Button disabled={getTotalValidCount() === 0} onClick={handleImport}>
									Importar {getTotalValidCount()} Leads
								</Button>
							</>
						)}

						{step === 'complete' && <Button onClick={handleClose}>Concluir</Button>}
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
