# [ACHADO DO PARQUE] Dois workflows ativos que não produzem nada

| | |
|---|---|
| **Data** | 2026-09-18 |
| **Origem** | varredura da Fase 0 do plano da etapa 8 do ADR-38 — **achado lateral, fora daquele escopo** |
| **Frente** | ❓ **a definir** |
| **Dono** | 🔴 **a definir — é o ponto desta nota** |
| **Estado** | ⬜ registrado, não investigado |

---

## 1. O fato

Dois workflows **ativos**, chamados **todo dia às 04h** pelo `operador unico metricas`
(`cLcimNoefTOnVVbd`), escrevem em tabelas que estão **vazias**:

| Workflow | ID | Escreve em | Linhas hoje |
|---|---|---|---|
| `sw metricas conjuntos` | `t0DH5N5maws4egnG` | `raw_adset_data_rollup` | **0** |
| `sw metricas anuncios` | `vVAdXAJh6MW2Z5Hp` | `raw_ad_data` | **0** |

Medido em 18/09 por `phi_prod.__TABLES__`. A `raw_adset_data_rollup` é **view** sobre `raw_ad_data`,
então a origem das duas é a mesma tabela: **`raw_ad_data`, criada em 30/06/2026, com zero linhas
desde então.**

O orquestrador os chama em sequência depois do `sw metricas campanhas`, com
`waitForSubWorkflow: true` — ou seja, **a rodada diária espera por eles.**

## 2. Por que isto não é rodapé

**Ou estão quebrados, ou não deveriam existir — e as duas respostas custam.**

- Se **deveriam** produzir: há ~3 meses de dado de conjunto e anúncio que **nunca foi coletado**, e
  o grão de anúncio é entrada do T28. Ninguém percebeu porque **execução verde não é olhada**.
- Se **não deveriam**: são dois workflows ativos consumindo cota de API e tempo da janela das 04h
  todo dia, por nada — e o procedimento de aposentadoria da **R5** nunca foi aplicado a eles.

É **exatamente o padrão da semana** (ver ADR-38 §22 e §23, e a R11 regra 5): *execução verde que não
faz nada é invisível para os dois vigias que temos.* O `PHI - Vigia de Frescor` olha
`raw_campaign_data` e `phi_score_history` — **não olha `raw_ad_data`.** O `PHI - Alerta de Falha`
só dispara em erro, e não há erro.

## 3. O que NÃO foi feito, e por quê

**Não abri nenhum dos dois workflows.** A varredura da Fase 0 tinha escopo definido — consumidores de
`campaign_id` no caminho do score — e estes dois estão fora dele. Abri-los ali teria sido escopo
crescendo por conta própria, que é o que a **R7** existe para evitar.

**Não sei, e não tentei descobrir:**
- se já produziram alguma vez (não olhei o histórico de execuções);
- se a `raw_ad_data` foi criada e nunca usada, ou se foi esvaziada;
- se os dois falham silenciosamente ou se a API não devolve nada;
- se `sw métricas e diagnósticos anúncios` (`uqEHxuJPWRiZS6ai`, **inativo**) é o antecessor deles.

## 4. O primeiro passo, quando houver dono

Barato e só leitura, nesta ordem:

1. `search_workflow_executions` nos dois IDs — **eles rodam? terminam verdes?**
2. Se verdes: ler a execução de um dia e ver **quantos itens** chegam ao nó de escrita. Se zero, a
   pergunta vira *por que a API não devolve nada* — e a resposta provável é a **R11 regra 1**
   (critério ausente virando escopo vazio), o espelho do que já aconteceu três vezes nesta casa.
3. Decidir: **consertar** (se o grão de anúncio é necessário ao T28) ou **aposentar pela R5** —
   desabilitar o nó chamador no `operador unico metricas`, desativar, renomear com
   `[APOSENTADO <data>]` e sticky dizendo por quê.

## 5. Pergunta que decide tudo

> **O grão de anúncio e de conjunto faz parte do produto hoje, ou era uma aposta de junho que não
> vingou?**

Isso é decisão do Olavo, não achado de sub-chat. **Enquanto não for respondida, os dois seguem
rodando todo dia às 04h sem produzir nada.**
