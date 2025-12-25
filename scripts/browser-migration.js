/**
 * SCRIPT PARA EXECUTAR MIGRAÇÃO VIA CONSOLE DO NAVEGADOR
 * 
 * INSTRUÇÕES:
 * 1. Faça login no sistema com sua conta admin (msm.jur@gmail.com)
 * 2. Abra o console do navegador (F12 → Console)
 * 3. Cole este script e pressione Enter
 * 4. Aguarde a mensagem de sucesso
 * 5. Recarregue a página (/students)
 */

(async () => {
  console.log('🚀 Iniciando migração de alunos...');
  
  // Verificar se a API do Convex está disponível
  if (!window.convexMutation) {
    console.error('❌ Erro: API do Convex não encontrada.');
    console.error('💡 Certifique-se de estar logado no sistema.');
    alert('Erro: API do Convex não encontrada.\nVerifique se está logado no sistema.');
    return;
  }

  try {
    // Executar a migration
    const result = await window.convexMutation('migrationTrigger:triggerStudentMigration', {});
    
    console.log('✅ Migração concluída com sucesso!', result);
    
    // Exibir alerta com resultado
    alert(`✅ Migração Concluída!\n\n` +
           `Alunos migrados: ${result.migrated}\n` +
           `Organization ID: ${result.organizationId}\n\n` +
           `Recarregue a página para ver os alunos.`);
    
    // Recarregar automaticamente após 2 segundos
    setTimeout(() => {
      console.log('🔄 Recarregando a página...');
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    alert(`❌ Erro na migração:\n\n${error.message}\n\nVerifique o console para detalhes.`);
  }
})();
