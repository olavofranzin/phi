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

Onde salvar cada tipo de artefato:

| Pasta | O que salvar aqui |
|-------|-------------------|
| `CLAUDE.md` (raiz) | Contexto operacional do PHI para agentes (IDs, regras). Editar ao mudar infra/regras. |
| `.agents/skills/` | Skills de agentes IA — uma pasta por skill, com `SKILL.md`. |
| `.claude/skills/` | Apenas symlinks para `.agents/skills/` — não criar arquivos reais aqui. |
| `docs/` | Documentação técnica e de processo (`.md`). |
| `docs/analises/` | Análises técnicas pontuais (ex.: comparativos de workflow Google Ads). |
| `docs/handoff/` | Briefings de sessão e handoffs — histórico/rastreabilidade, não apagar. |
| `docs/strategic-planning/` | Doc mestre, ADRs e execução de demandas (design/governança). |
| `docs/audits/` | Relatórios de auditoria. |
| `scripts/` | Utilitários Python de apoio (build/fix/verificação), executados fora do n8n. |
| `workflows/main/` | Os workflows PHI em produção (pipeline e subworkflow de campanhas). |
| `workflows/subworkflows/` | Subworkflows chamados pelos principais (métricas, adsets, ads operacional). |
| `workflows/integrations/` | Workflows que conectam o PHI a serviços externos (Google Ads/Maps, daily entry, GitHub importer). |
| `workflows/whatsapp/` | Workflows de intake via WhatsApp. |
| `workflows/comercial/` | Automação comercial (dedup de leads HubSpot). |
| `workflows/onboarding/` | Módulos de onboarding (a2.x), runs de execução e telemetria. |
| `workflows/setup/` | Workflows de abertura/setup de projeto técnico (L1). |
| `archive/` | Versões antigas/intermediárias preservadas só para rollback — não referenciar em produção. |
| `prompts/` | Prompts de apoio a tarefas com agentes/LLM. |

Convenção de nomes: arquivos em `snake_case`, sem sufixos de versão (`_v2`, `_fixed`,
`_updated`) — versionamento fica no histórico do git.

## Stack

- **Data Warehouse:** BigQuery (`phi_prod`)
- **Orquestração:** n8n self-hosted v2.15.0
- **Interface operacional:** Notion (fonte de verdade do estado operacional)
- **Fontes de dados:** Google Ads API v23, Meta Ads API

Consulte [`CLAUDE.md`](CLAUDE.md) para IDs, credenciais de serviço e as regras
críticas de implementação antes de editar qualquer workflow.
