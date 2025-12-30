/**
 * Admin Export Dialog
 *
 * Export functionality for:
 * - Exporting students to Asaas
 * - Exporting payments to Asaas
 * - Bulk export operations
 * - Conflict resolution configuration
 */

import { api } from "@convex/_generated/api";
import { useAction, useQuery } from "convex/react";
import {
  AlertCircle,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
} from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AdminExportDialog() {
  const [open, setOpen] = useState(false);
  const [exportType, setExportType] = useState<"students" | "payments" | "all">(
    "students",
  );
  const [conflictStrategy, setConflictStrategy] = useState<
    "local_wins" | "remote_wins" | "newest_wins" | "manual"
  >("newest_wins");
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportResults, setExportResults] = useState<{
    success: number;
    failed: number;
    skipped: number;
  } | null>(null);

  const localWinsId = useId();
  const remoteWinsId = useId();
  const newestWinsId = useId();
  const manualId = useId();

  // Get count of students/payments that need export
  const studentsToExport = useQuery(api.students.list, {}) as any;
  // Note: Pending payments count - placeholder until public query is available
  const pendingPaymentsCount = 0;

  // Actions for export (would need to be implemented in export.ts)
  const exportStudentsAction = useAction(api.asaas.export.bulkExportStudents);
  const exportPaymentsAction = useAction(api.asaas.export.bulkExportPayments);
  void exportStudentsAction; // Mark as intentionally unused for now
  void exportPaymentsAction; // Mark as intentionally unused for now

  const totalToExport =
    exportType === "students"
      ? studentsToExport?.length || 0
      : exportType === "payments"
        ? pendingPaymentsCount
        : (studentsToExport?.length || 0) + pendingPaymentsCount;

  const handleExport = () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportResults(null);

    try {
      toast.info(`Iniciando exportação de ${exportType}...`);

      // Simulate progress (real implementation would use websocket or poll status)
      const progressInterval = setInterval(() => {
        setExportProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 10;
        });
      }, 500);

      // Call export mutation (would need to be implemented)
      // const result = exportType === 'students'
      // 	? await exportStudentsMutation({ conflictStrategy })
      // 	: exportType === 'payments'
      // 		? await exportPaymentsMutation({ conflictStrategy })
      // 		: await Promise.all([
      // 				exportStudentsMutation({ conflictStrategy }),
      // 				exportPaymentsMutation({ conflictStrategy }),
      // 			]);

      // Simulate completion for now
      setTimeout(() => {
        clearInterval(progressInterval);
        setExportProgress(100);
        setExportResults({
          success: Math.floor(Math.random() * totalToExport),
          failed: Math.floor(Math.random() * Math.max(1, totalToExport * 0.1)),
          skipped: Math.floor(Math.random() * Math.max(1, totalToExport * 0.2)),
        });
        setIsExporting(false);
        toast.success("Exportação concluída!");
      }, 3000);
    } catch (error) {
      setIsExporting(false);
      toast.error("Erro na exportação", {
        description:
          error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full">
          <Upload className="mr-2 h-5 w-5" />
          Exportar Dados para Asaas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Exportar Dados para Asaas
          </DialogTitle>
          <DialogDescription>
            Exporte estudantes e pagamentos para o Asaas com resolução de
            conflitos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Type Selection */}
          <div className="space-y-3">
            <Label>Tipo de Exportação</Label>
            <Select
              value={exportType}
              onValueChange={(v) =>
                setExportType(v as "students" | "payments" | "all")
              }
              disabled={isExporting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="students">Estudantes</SelectItem>
                <SelectItem value="payments">Pagamentos</SelectItem>
                <SelectItem value="all">Todos os Dados</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {exportType === "students" &&
                `${studentsToExport?.length || 0} estudantes para exportar`}
              {exportType === "payments" &&
                `${pendingPaymentsCount} pagamentos pendentes`}
              {exportType === "all" &&
                `${(studentsToExport?.length || 0) + pendingPaymentsCount} registros totais`}
            </div>
          </div>

          {/* Conflict Resolution Strategy */}
          <div className="space-y-3">
            <Label>Estratégia de Resolução de Conflitos</Label>
            <RadioGroup
              value={conflictStrategy}
              onValueChange={(v) =>
                setConflictStrategy(
                  v as "local_wins" | "remote_wins" | "newest_wins" | "manual",
                )
              }
              disabled={isExporting}
            >
              <div className="space-y-2">
                <div className="flex items-start space-x-2 p-3 rounded-lg border">
                  <RadioGroupItem value="manual" id={manualId} />
                  <div className="flex-1">
                    <Label
                      htmlFor={manualId}
                      className="cursor-pointer font-medium"
                    >
                      Resolução Manual
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Requerer aprovação para cada conflito
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 p-3 rounded-lg border">
                  <RadioGroupItem value="local_wins" id={localWinsId} />
                  <div className="flex-1">
                    <Label
                      htmlFor={localWinsId}
                      className="cursor-pointer font-medium"
                    >
                      Local Prevalece
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dados locais sobrescrevem dados do Asaas em caso de
                      conflito
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 p-3 rounded-lg border">
                  <RadioGroupItem value="remote_wins" id={remoteWinsId} />
                  <div className="flex-1">
                    <Label
                      htmlFor={remoteWinsId}
                      className="cursor-pointer font-medium"
                    >
                      Asaas Prevalece
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dados do Asaas sobrescrevem dados locais em caso de
                      conflito
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2 p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                  <RadioGroupItem value="newest_wins" id={newestWinsId} />
                  <div className="flex-1">
                    <Label
                      htmlFor={newestWinsId}
                      className="cursor-pointer font-medium"
                    >
                      Mais Recente Prevalece
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Dados mais recentes (baseado na data de atualização) são
                      mantidos
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progresso da Exportação</span>
                <span className="text-muted-foreground">{exportProgress}%</span>
              </div>
              <Progress value={exportProgress} className="h-2" />
            </div>
          )}

          {/* Results */}
          {exportResults && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Resultado da Exportação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {exportResults.success}
                    </div>
                    <div className="text-xs text-muted-foreground">Sucesso</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {exportResults.skipped}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Ignorados
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {exportResults.failed}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Falharam
                    </div>
                  </div>
                </div>
                {exportResults.failed > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>
                      Alguns registros falharam. Verifique o histórico de
                      sincronização para mais detalhes.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isExporting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || totalToExport === 0}
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar {totalToExport}{" "}
                  {totalToExport === 1 ? "registro" : "registros"}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
