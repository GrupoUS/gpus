# Importação de Alunos via CSV/XLSX

Este documento descreve como importar alunos em lote utilizando arquivos CSV ou XLSX.

## Formato Esperado

### Campos Obrigatórios
| Coluna | Descrição | Exemplo |
|--------|-----------|---------|
| NOME | Nome completo do aluno | João Silva |
| EMAIL | Email válido e único | joao@email.com |
| TELEFONE | Telefone brasileiro (10-11 dígitos) | 11999999999 |
| GRADUAÇÃO | Profissão/Formação | Enfermagem |

### Campos Opcionais
| Coluna | Descrição | Exemplo |
|--------|-----------|---------|
| DOCUMENTO / CPF | CPF (será validado e criptografado) | 123.456.789-00 |
| ENDEREÇO | Logradouro | Rua das Flores |
| Nº | Número do endereço | 123 |
| COMPLEMENTO | Complemento | Apto 45 |
| BAIRRO | Bairro | Centro |
| CIDADE | Cidade | São Paulo |
| ESTADO / UF | Estado | SP |
| CEP | Código postal | 01234-567 |
| PAÍS | País | Brasil |
| DATA NASC | Data de nascimento | 15/03/1990 |
| DATA DA VENDA | Data da venda | 23/10/2024 |
| VENDEDOR | Nome do vendedor | Ana |
| STATUS CONTRATO | Status do contrato | Assinado |
| ORIGEM LEAD | Fonte do lead | Tráfego |
| TURMA | Turma do curso | TURMA 5 |

## Mapeamento Automático

O sistema reconhece automaticamente variações comuns dos nomes de colunas:

- **Nome**: `NOME`, `NOME COMPLETO`, `ALUNO`
- **Email**: `EMAIL`, `E-MAIL`
- **Telefone**: `TELEFONE`, `CELULAR`, `WHATSAPP`, `CONTATO`
- **CPF**: `CPF`, `DOCUMENTO`
- **Profissão**: `GRADUAÇÃO`, `PROFISSÃO`, `FORMAÇÃO`

## Profissões Suportadas

O sistema normaliza as seguintes profissões:

| Valor no CSV | Normalizado para |
|--------------|------------------|
| Enfermagem, Enfermeiro(a) | enfermeiro |
| Dentista, Odontologia | dentista |
| Biomédico(a), Biomedicina | biomedico |
| Farmacêutico(a), Farmácia | farmaceutico |
| Médico(a), Medicina | medico |
| Esteticista, Estética | esteticista |
| Outros | outro |

## Validações

### Email
- Formato válido (contém @)
- Único no sistema (não duplicado)

### CPF
- 11 dígitos
- Dígitos verificadores válidos
- Único no sistema

### Telefone
- Mínimo 10 dígitos
- Formato brasileiro

## Como Usar

1. Acesse a página de **Alunos**
2. Clique no botão **Importar CSV**
3. Arraste ou selecione seu arquivo CSV/XLSX
4. Revise o mapeamento de colunas
5. Marque "Ignorar duplicados" se desejar
6. Clique em **Pré-visualizar**
7. Revise os dados e clique em **Importar**

## Tratamento de Erros

- Registros com erros são ignorados mas não interrompem a importação
- Ao final, é exibido um resumo com sucessos e falhas
- É possível baixar um log de erros em CSV

## Exemplo de Arquivo CSV

```csv
NOME,EMAIL,TELEFONE,DOCUMENTO,GRADUAÇÃO,ENDEREÇO,CIDADE,ESTADO
João Silva,joao@email.com,11999999999,123.456.789-00,Enfermagem,Rua A,São Paulo,SP
Maria Santos,maria@email.com,21988888888,987.654.321-00,Dentista,Rua B,Rio de Janeiro,RJ
```

## Conformidade LGPD

Todos os dados importados são:
- **Criptografados**: CPF, Email e Telefone são criptografados com AES-256-GCM
- **Auditados**: Cada importação gera registros de auditoria LGPD
- **Rastreados**: Fonte, data e responsável pela importação são registrados

## Limites

- Máximo recomendado: **1000 registros** por importação
- Arquivos maiores devem ser divididos em lotes

## Troubleshooting

### "Email duplicado"
O email já existe no sistema. Marque "Ignorar duplicados" ou corrija manualmente.

### "CPF inválido"
O CPF não passou na validação de dígitos verificadores. Verifique se está correto.

### "Telefone inválido"
O telefone tem menos de 10 dígitos. Adicione o DDD completo.

### Arquivo não reconhecido
Certifique-se de que o arquivo é CSV (codificação UTF-8) ou XLSX.
