# Análise Comparativa: Google Ads v2 vs. Gemini Search Term Analyzer

## Resumo Executivo

Os dois workflows são **complementares e não concorrentes**. Eles atuam em camadas diferentes:
o **Google Ads v2** é um painel de performance completo; o **Gemini Analyzer** é uma ferramenta
de inteligência e ação focada em otimização de termos de pesquisa.
Há uma **oportunidade clara de integração** descrita ao final deste documento.

---

## Comparação Lado a Lado

| Dimensão                    | Google Ads v2                              | Gemini Search Term Analyzer                         |
|-----------------------------|--------------------------------------------|----------------------------------------------------|
| **Objetivo**                | Relatório de performance geral             | Otimização de termos de pesquisa (negativação)     |
| **Gatilho**                 | Schedule automático (05h diário)           | Manual (clique no n8n)                             |
| **Campanhas cobertas**      | Todas as ativas no Notion (qualquer tipo)  | Uma única campanha de Search (filtrada por nome)   |
| **Fonte de campanhas**      | Notion DB "Campanhas"                      | Google Ads native node                             |
| **Período de dados**        | 7d, 30d e mês corrente                     | 14 dias (fixo)                                     |
| **Versão da API**           | v22                                        | v19                                                |
| **Moeda**                   | BRL (R$)                                   | USD ($)                                            |
| **Termos de pesquisa**      | Top 50 por custo — tabela de performance   | Até 1.000 termos (clicks > 1) — análise por IA    |
| **Inteligência aplicada**   | Nenhuma (agregação + formatação JS)        | Gemini AI (LLM) com structured output             |
| **Output**                  | HTML + PDF                                 | Mensagem Slack com blocos interativos              |
| **Ação possível**           | Nenhuma (read-only)                        | Aprovar/rejeitar negativação via botões no Slack   |
| **Destinatário**            | Relatório (cliente / gestor)               | Time de SEM (ação operacional)                     |

---

## Análise Detalhada por Workflow

### Workflow 1 — Google Ads v2

**O que faz bem:**
- Cobre múltiplas campanhas em loop, sem configuração manual por campanha
- Métricas ricas: core, grupos de anúncios, audiência, schedule, pacing, canais de conversão
- Deltas 7d vs. média semanal dos 30d (tendência de performance)
- Relatório visual completo em PDF, pronto para apresentar ao cliente

**Limitações em relação a termos de pesquisa:**
- Coleta apenas os top 50 termos por custo (últimos 7d)
- Não distingue termos de marca de termos genéricos
- Não classifica termos por potencial de negativação
- Não gera nenhuma recomendação acionável

---

### Workflow 2 — Gemini Search Term Analyzer

**O que faz bem:**
- Usa IA (Gemini) para interpretar termos com contexto de marca
- Classifica automaticamente em dois grupos:
  - **Grupo A – Desperdício:** 0 conversões → lista de negativação
  - **Grupo B – Revisão:** 1+ conversões → revisão manual
- Calcula o valor total desperdiçado em anúncios (termos do Grupo A)
- Entrega resultado acionável no Slack com botões de aprovação
- Remove automaticamente termos de marca e termos já negativados (EXCLUDED)

**Limitações:**
- Roda manualmente (sem agendamento)
- Cobre apenas uma campanha de Search por vez (filtro por nome fixo)
- Não usa o Notion como fonte de campanhas ativas
- API v19 (desatualizada em relação ao v2 que usa v22)
- Moeda em USD (inconsistente com o ecossistema PHI em BRL)

---

## Fluxo de Dados — Onde se Tocam

```
Google Ads v2                        Gemini Analyzer
─────────────────                    ──────────────────────────────────
Notion "Campanhas"                   Google Ads native node
    │                                    │
    ▼                                    ▼
Loop por campanha                    Filtrar campanhas ENABLED
    │                                    │
    ▼                                    ▼
HTTP Termos 7d ◄──── OVERLAP ────► HTTP Termos 14d (search_term_view)
    │                                    │
    ▼                                    ▼
Tabela de performance                Agregação por termo
(sem distinção marca/genérico)           │
    │                                    ▼
    ▼                               Remove marca + EXCLUDED
PDF Report                               │
                                         ▼
                                    Gemini LLM
                                         │
                                         ▼
                                    Slack (recomendações + botões)
```

**O ponto de overlap** é exatamente `search_term_view` — ambos consultam a mesma API
com filtros e períodos ligeiramente diferentes.

---

## Recomendação: Manter como 2 Workflows Distintos

**Justificativa:**

1. **Propósitos diferentes:** Relatório de performance ≠ Ferramenta de otimização
2. **Audiências diferentes:** Gestores / clientes (PDF) vs. time operacional de SEM (Slack)
3. **Frequência diferente:** Diário automático vs. on-demand
4. **Risco de acoplamento:** Integrar os dois aumentaria a complexidade e fragilidade do pipeline principal

---

## Oportunidade de Integração (sem fundir os workflows)

Em vez de fundir, o ideal é **adicionar o Gemini Analyzer como etapa opcional ao final do
Google Ads v2**, disparado por subworkflow. O Google Ads v2 já coleta os termos de pesquisa —
basta passá-los para um subworkflow de análise com IA.

**Arquitetura proposta:**

```
Google Ads v2 (existente)
  └─► [ao final do loop, por campanha do tipo SEARCH]
        └─► Subworkflow: Gemini Search Term Analyzer
              ├─ Recebe: campaign_id, customer_id, termos já coletados (7d)
              ├─ Filtra: remove marca + EXCLUDED
              ├─ Analisa: Gemini LLM → JSON estruturado
              └─ Envia: Slack com recomendações + botões de aprovação
```

**Benefícios dessa abordagem:**
- Elimina a segunda chamada redundante à API de termos de pesquisa
- Mantém o Notion como fonte única de campanhas ativas
- Padroniza moeda (BRL) e versão de API (v22)
- O Gemini Analyzer continua podendo rodar de forma independente quando necessário
- Adiciona inteligência acionável ao relatório diário sem comprometer o PDF

**Ajustes necessários no Gemini Analyzer para integração:**
1. Substituir o manual trigger por um `Execute Workflow Trigger`
2. Receber `campaign_id`, `customer_id` e `termos[]` como parâmetros de entrada
3. Converter custo de micros BRL → em vez de USD direto da API
4. Atualizar a versão da API para v22

---

## Queries GAQL — Diferenças de Implementação

| Campo / Filtro              | Google Ads v2 (HTTP Core)            | Gemini Analyzer                             |
|-----------------------------|--------------------------------------|---------------------------------------------|
| Recurso                     | `search_term_view`                   | `search_term_view`                          |
| Período                     | `BETWEEN '7d.start' AND '7d.end'`    | `DURING LAST_14_DAYS`                       |
| Filtro mínimo               | Nenhum                               | `metrics.clicks > 1`                        |
| Limite                      | 50                                   | 1.000                                       |
| Ordenação                   | `metrics.cost_micros DESC`           | `metrics.clicks DESC`                       |
| `segments.date`             | Não incluso                          | Incluso (agregado depois)                   |
| `ad_group.id`               | Não incluso                          | Incluso                                     |
| `metrics.all_conversions`   | Não incluso                          | Incluso                                     |
| `metrics.conversions`       | Incluso                              | Incluso                                     |

---

*Análise gerada com base nos workflows `google_ads_v2.json` e `JXcDYDrqI6BONOjv` · PHI™*
