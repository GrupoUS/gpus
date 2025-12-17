# Importacao de Alunos via CSV/XLSX

Este documento descreve como importar alunos em lote utilizando arquivos CSV ou XLSX, incluindo criacao automatica de matriculas.

## Visao Geral

O sistema de importacao permite:
- Importar alunos em lote a partir de CSV/XLSX
- Criar matriculas automaticamente para um produto selecionado
- Atualizar alunos existentes (modo UPSERT)
- Importar dados financeiros das matriculas
- Conformidade total com LGPD

---

## Fluxo de Importacao

```
1. Selecionar Produto (obrigatorio)
       |
       v
2. Upload do arquivo CSV/XLSX
       |
       v
3. Mapeamento de colunas
       |
       v
4. Pre-visualizacao dos dados
       |
       v
5. Importacao com criacao de matriculas
       |
       v
6. Relatorio de resultados
```

---

## Produtos Disponiveis

Antes de fazer upload do arquivo, e necessario selecionar o produto para o qual os alunos serao matriculados:

| Codigo | Produto |
|--------|---------|
| `trintae3` | Trinta e 3 |
| `otb` | OTB |
| `black_neon` | Black Neon |
| `comunidade` | Comunidade US |
| `auriculo` | Auriculo |
| `na_mesa_certa` | Na Mesa Certa |

> **Importante**: Cada importacao e para UM unico produto. Se voce tem alunos para diferentes produtos, faca importacoes separadas.

---

## Campos do CSV/XLSX

### Campos Obrigatorios (Dados do Aluno)

| Coluna | Descricao | Exemplo |
|--------|-----------|---------|
| NOME | Nome completo do aluno | Joao Silva |
| EMAIL | Email valido e unico | joao@email.com |
| TELEFONE | Telefone brasileiro (10-11 digitos) | 11999999999 |
| GRADUACAO | Profissao/Formacao | Enfermagem |

### Campos Opcionais (Dados do Aluno)

| Coluna | Descricao | Exemplo |
|--------|-----------|---------|
| DOCUMENTO / CPF | CPF (sera validado e criptografado) | 123.456.789-00 |
| ENDERECO | Logradouro | Rua das Flores |
| No | Numero do endereco | 123 |
| COMPLEMENTO | Complemento | Apto 45 |
| BAIRRO | Bairro | Centro |
| CIDADE | Cidade | Sao Paulo |
| ESTADO / UF | Estado | SP |
| CEP | Codigo postal | 01234-567 |
| PAIS | Pais | Brasil |
| DATA NASC | Data de nascimento | 15/03/1990 |
| DATA DA VENDA | Data da venda | 23/10/2024 |
| VENDEDOR | Nome do vendedor | Ana |
| STATUS CONTRATO | Status do contrato | Assinado |
| ORIGEM LEAD | Fonte do lead | Trafego |
| TURMA | Turma do curso | TURMA 5 |

### Campos Financeiros (Dados da Matricula)

| Coluna | Descricao | Exemplo | Formato |
|--------|-----------|---------|---------|
| VALOR TOTAL | Valor total do curso | R$ 1.234,56 | Monetario BR |
| PARCELAS | Numero de parcelas | 12 | Inteiro |
| VALOR PARCELA | Valor de cada parcela | R$ 102,88 | Monetario BR |
| STATUS PAGAMENTO | Status do pagamento | Pago / Pendente | Texto |
| PARCELAS PAGAS | Quantidade de parcelas pagas | 6 | Inteiro |
| DATA INICIO | Data de inicio do curso | 01/02/2025 | Data BR |
| ID PROFISSIONAL | ID do profissional responsavel | prof_123 | Texto |

---

## Mapeamento Automatico de Colunas

O sistema reconhece automaticamente variacoes comuns dos nomes de colunas:

### Dados do Aluno
| Campo | Variacoes Reconhecidas |
|-------|------------------------|
| Nome | `NOME`, `NOME COMPLETO`, `ALUNO` |
| Email | `EMAIL`, `E-MAIL` |
| Telefone | `TELEFONE`, `CELULAR`, `WHATSAPP`, `CONTATO` |
| CPF | `CPF`, `DOCUMENTO` |
| Profissao | `GRADUACAO`, `PROFISSAO`, `FORMACAO` |

### Dados Financeiros
| Campo | Variacoes Reconhecidas |
|-------|------------------------|
| Valor Total | `VALOR TOTAL`, `TOTAL`, `VALOR` |
| Parcelas | `PARCELAS`, `QTD PARCELAS`, `NUM PARCELAS` |
| Valor Parcela | `VALOR PARCELA`, `PARCELA` |
| Status Pagamento | `STATUS PAGAMENTO`, `PAGAMENTO`, `STATUS` |
| Parcelas Pagas | `PARCELAS PAGAS`, `PAGAS` |
| Data Inicio | `DATA INICIO`, `INICIO`, `DATA` |

---

## Normalizacao de Dados

### Profissoes

| Valor no CSV | Normalizado para |
|--------------|------------------|
| Enfermagem, Enfermeiro(a) | `enfermeiro` |
| Dentista, Odontologia | `dentista` |
| Biomedico(a), Biomedicina | `biomedico` |
| Farmaceutico(a), Farmacia | `farmaceutico` |
| Medico(a), Medicina | `medico` |
| Esteticista, Estetica | `esteticista` |
| Outros | `outro` |

### Status de Pagamento

| Valor no CSV | Normalizado para |
|--------------|------------------|
| Pago, Quitado, Completo, Finalizado | `paid` |
| Pendente, Aguardando, Em aberto | `pending` |
| Atrasado, Vencido, Inadimplente | `overdue` |
| Cancelado, Estornado | `cancelled` |
| Reembolsado, Devolvido | `refunded` |

### Valores Monetarios

O sistema aceita diversos formatos brasileiros:
- `R$ 1.234,56` -> 1234.56
- `1234,56` -> 1234.56
- `1.234,56` -> 1234.56
- `1234.56` -> 1234.56

---

## Modo UPSERT (Atualizar Existentes)

### O que e?

Quando ativado, o sistema verifica se ja existe um aluno com o mesmo email:
- **Se existir**: Atualiza os dados do aluno existente
- **Se nao existir**: Cria um novo aluno

### Comportamento das Matriculas

| Cenario | Acao |
|---------|------|
| Aluno novo | Cria aluno + cria matricula |
| Aluno existente, sem matricula no produto | Atualiza aluno + cria matricula |
| Aluno existente, com matricula no produto | Atualiza aluno + atualiza matricula |

### Como Usar

1. Na etapa de mapeamento, marque a opcao **"Atualizar alunos existentes"**
2. O sistema identificara duplicatas por email
3. Dados existentes serao atualizados com os novos valores

> **Dica**: Use o modo UPSERT para atualizar dados financeiros de alunos ja cadastrados.

---

## Como Usar

### Passo a Passo

1. Acesse a pagina de **Alunos** no menu lateral
2. Clique no botao **Importar CSV**
3. **Selecione o produto** para matricula (obrigatorio)
4. Arraste ou selecione seu arquivo CSV/XLSX
5. Revise o mapeamento de colunas
6. Configure o modo UPSERT se desejar atualizar existentes
7. Clique em **Pre-visualizar**
8. Revise os dados e clique em **Importar**
9. Aguarde o processamento e veja o relatorio

### Resultado da Importacao

O sistema exibe um resumo com:
- **Criados**: Novos alunos inseridos
- **Atualizados**: Alunos existentes modificados
- **Ignorados**: Registros pulados (se UPSERT desativado)
- **Erros**: Registros com problemas de validacao

---

## Exemplo de Arquivo CSV Completo

```csv
NOME,EMAIL,TELEFONE,DOCUMENTO,GRADUACAO,CIDADE,ESTADO,VALOR TOTAL,PARCELAS,VALOR PARCELA,STATUS PAGAMENTO,PARCELAS PAGAS,DATA INICIO
Joao Silva,joao@email.com,11999999999,123.456.789-00,Enfermagem,Sao Paulo,SP,"R$ 3.600,00",12,"R$ 300,00",Pago,12,01/01/2025
Maria Santos,maria@email.com,21988888888,987.654.321-00,Dentista,Rio de Janeiro,RJ,"R$ 3.600,00",12,"R$ 300,00",Pendente,6,01/02/2025
Pedro Costa,pedro@email.com,31977777777,456.789.123-00,Biomedico,Belo Horizonte,MG,"R$ 2.400,00",6,"R$ 400,00",Atrasado,3,15/01/2025
```

---

## Validacoes

### Email
- Formato valido (contem @)
- Unico no sistema (exceto em modo UPSERT)

### CPF
- 11 digitos
- Digitos verificadores validos
- Unico no sistema

### Telefone
- Minimo 10 digitos
- Formato brasileiro

### Valores Financeiros
- Valor total deve ser positivo
- Numero de parcelas deve ser inteiro positivo
- Parcelas pagas nao pode exceder total de parcelas

---

## Conformidade LGPD

Todos os dados importados sao:

### Criptografia
- **CPF**: Criptografado com AES-256-GCM
- **Email**: Criptografado com AES-256-GCM
- **Telefone**: Criptografado com AES-256-GCM

### Auditoria
Cada importacao gera registros de auditoria contendo:
- Data/hora da operacao
- Usuario responsavel
- Tipo de operacao (create/update)
- ID do registro afetado

### Rastreabilidade
- Fonte da importacao registrada
- Data e responsavel pela importacao
- Historico de alteracoes mantido

---

## Limites e Recomendacoes

| Aspecto | Limite/Recomendacao |
|---------|---------------------|
| Registros por importacao | Maximo recomendado: **1000** |
| Tamanho do arquivo | Maximo: **10 MB** |
| Formatos aceitos | CSV (UTF-8), XLSX, XLS |
| Codificacao CSV | UTF-8 (recomendado) |

> **Dica**: Arquivos maiores devem ser divididos em lotes de 500-1000 registros.

---

## Troubleshooting

### "Email duplicado"
- **Causa**: O email ja existe no sistema
- **Solucao**: Ative o modo UPSERT para atualizar ou corrija manualmente

### "CPF invalido"
- **Causa**: O CPF nao passou na validacao de digitos verificadores
- **Solucao**: Verifique se o CPF esta correto

### "Telefone invalido"
- **Causa**: O telefone tem menos de 10 digitos
- **Solucao**: Adicione o DDD completo (ex: 11999999999)

### "Produto nao selecionado"
- **Causa**: Tentou fazer upload sem selecionar um produto
- **Solucao**: Selecione o produto antes de arrastar o arquivo

### "Valor monetario invalido"
- **Causa**: Formato do valor nao reconhecido
- **Solucao**: Use formato brasileiro (R$ 1.234,56) ou numerico (1234.56)

### Arquivo nao reconhecido
- **Causa**: Formato ou codificacao invalidos
- **Solucao**: Certifique-se de que o arquivo e CSV (UTF-8) ou XLSX

### Erros Especificos de Arquivos XLSX

#### "Arquivo XLSX protegido por senha nao e suportado"
- **Causa**: O arquivo XLSX possui protecao por senha
- **Solucao**: Remova a protecao por senha no Excel/LibreOffice antes de importar

#### "Estrutura de arquivo XLSX invalida"
- **Causa**: O arquivo esta corrompido ou nao e um XLSX valido
- **Solucao**: Verifique se o arquivo nao esta corrompido e se foi salvo corretamente como XLSX

#### "Nenhuma planilha encontrada no arquivo XLSX"
- **Causa**: O arquivo XLSX nao contem nenhuma planilha (sheet)
- **Solucao**: Abra o arquivo no Excel e verifique se ha pelo menos uma planilha com dados

#### "Primeira planilha esta vazia ou corrompida"
- **Causa**: A primeira aba do arquivo nao contem dados ou esta corrompida
- **Solucao**: Verifique se os dados estao na primeira aba (sheet) do arquivo

#### "Nenhum dado encontrado na primeira planilha"
- **Causa**: A planilha esta vazia, sem cabecalho ou registros
- **Solucao**: Adicione pelo menos o cabecalho na primeira linha e registros nas linhas seguintes

#### "Cabecalho invalido na primeira linha"
- **Causa**: A primeira linha nao contem um cabecalho valido (array de colunas)
- **Solucao**: Certifique-se de que a primeira linha contem os nomes das colunas

#### "Nenhuma coluna valida encontrada no cabecalho"
- **Causa**: Todas as celulas do cabecalho estao vazias ou invalidas
- **Solucao**: Preencha a primeira linha com os nomes das colunas (NOME, EMAIL, TELEFONE, etc.)

#### "Erro ao processar linhas da planilha"
- **Causa**: Erro ao converter as linhas de dados em objetos
- **Solucao**: Verifique se os dados estao no formato correto e nao ha celulas com formatos especiais

#### "Arquivo muito grande (XMB). O tamanho maximo e 10MB"
- **Causa**: O arquivo excede o limite de 10MB
- **Solucao**: Divida o arquivo em lotes menores de 500-1000 registros cada

#### "Formato de arquivo nao suportado: .xxx"
- **Causa**: A extensao do arquivo nao e .csv, .xlsx ou .xls
- **Solucao**: Converta o arquivo para CSV ou XLSX antes de importar

---

## Arquitetura Tecnica

### Componentes

| Componente | Arquivo | Descricao |
|------------|---------|-----------|
| Dialog de Importacao | `src/components/students/student-import-dialog.tsx` | Interface do usuario |
| Validador CSV | `src/lib/csv-validator.ts` | Validacao e normalizacao de dados |
| Mutation Backend | `convex/students-import.ts` | Logica de importacao e persistencia |

### Fluxo de Dados

```
[CSV/XLSX]
    |
    v
[Papa Parse / XLSX.js] -- Parse do arquivo
    |
    v
[csv-validator.ts] -- Validacao e normalizacao
    |
    v
[student-import-dialog.tsx] -- Mapeamento de colunas
    |
    v
[convex/students-import.ts] -- UPSERT + Enrollment
    |
    v
[Convex DB] -- Persistencia criptografada
```

### Campos Criptografados (LGPD)

Os seguintes campos sao criptografados antes de salvar:
- `cpf` -> `encryptedCpf`
- `email` -> `encryptedEmail`
- `phone` -> `encryptedPhone`

---

## Changelog

### v2.0.0 (Atual)
- Adicionado seletor de produto obrigatorio
- Adicionado modo UPSERT para atualizar existentes
- Adicionados campos financeiros (valor, parcelas, status)
- Criacao automatica de matriculas (enrollments)
- Melhorias na acessibilidade (WCAG 2.1 AA)

### v1.0.0
- Importacao basica de alunos
- Validacao de CPF, email, telefone
- Criptografia LGPD
- Auditoria de operacoes
