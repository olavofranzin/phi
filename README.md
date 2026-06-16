# PHI™

Sistema automatizado de monitoramento e gestão de campanhas de tráfego pago
(Google Ads e Meta Ads). Calcula diariamente um score de saúde por campanha
(0–100), classifica em EXCELLENT / GOOD / WARNING / CRITICAL e aciona tarefas
operacionais com checklists no Notion.

> **Princípio central:** o PHI detecta desvios e orienta o gestor — nunca
> executa otimizações automaticamente.

## Por onde começar

| Documento | Para quê |
|-----------|----------|
| [`CLAUDE.md`](CLAUDE.md) | Contexto mínimo para agentes: IDs de workflows n8n, databases Notion, tabelas BigQuery, regras críticas de implementação. **Leia antes de qualquer mudança.** |
| [`docs/WORKFLOWS.md`](docs/WORKFLOWS.md) | Documentação técnica dos workflows principais. |
| [`docs/strategic-planning/ESTADO-DO-PROJETO.md`](docs/strategic-planning/ESTADO-DO-PROJETO.md) | Doc mestre do projeto (produto + operação interna). |

## Estrutura do repositório

```
.agents/skills/      Biblioteca de skills para agentes IA (copywriting, deep-research, n8n, etc.)
.claude/skills/      Symlinks para .agents/skills consumidos pelo Claude Code
docs/                Documentação, pesquisa e planejamento estratégico
  analises/          Análises técnicas (Google Ads)
  handoff/           Histórico de sessões e briefings (rastreabilidade)
  strategic-planning/ Doc mestre, ADRs, execução de demandas
scripts/             Utilitários Python (build/fix pipeline, verificação de métricas)
workflows/           Workflows n8n e código relacionado
  main/              Pipeline PHI e subworkflow de campanhas
  subworkflows/      Subworkflows expandidos (métricas, adsets, ads operacional)
  integrations/      Integrações (daily entry, Google Ads/Maps, GitHub importer)
  whatsapp/          Intake via WhatsApp
  comercial/         Deduplicação de leads HubSpot
  onboarding/        Módulos de onboarding (a2.x), execução e telemetria
  setup/             Setup de abertura de projeto técnico (L1)
archive/             Versões intermediárias preservadas para rollback
prompts/             Prompts de apoio
```

## Stack

- **Data Warehouse:** BigQuery (`phi_prod`)
- **Orquestração:** n8n self-hosted v2.15.0
- **Interface operacional:** Notion (fonte de verdade do estado operacional)
- **Fontes de dados:** Google Ads API v23, Meta Ads API

Consulte [`CLAUDE.md`](CLAUDE.md) para IDs, credenciais de serviço e as regras
críticas de implementação antes de editar qualquer workflow.
