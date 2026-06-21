# 🗺️ Mapa de Documentação — Comece Aqui

> **Porta única de entrada da documentação do PHI.** Se você é um agente
> (Claude Code, Codex, Antigravity) ou pessoa nova: leia esta página primeiro.
> Ela **não lista todos os documentos** (o **Catálogo** faz isso, vivo) — ela diz
> **onde procurar** e **quando criar cada tipo de documento**, pra você não
> perder tempo lendo vários docs nem recriar algo que já existe.
>
> **Canônico:** este Mapa vive em git (governança/navegação). Espelho Notion
> opcional sob "Gerenciamento de Documentos". Estado operacional (DBs, ADR
> aceito, SOP vigente) é canônico no Notion (ADR-012).

## 1. Como usar este mapa

1. **Encontrar um artefato existente?** → vá ao **PHI - Catálogo de Artefatos
   Operacionais** ([Notion](https://app.notion.com/p/bd8df5b982ad4f00a8ae56d687db819e)),
   filtre por `Tipo` e `Área`, pegue o link em `Localização` (URL Notion **ou**
   path git de cada artefato). É o índice vivo.
2. **Entender o estado atual do projeto?** → [`ESTADO-DO-PROJETO.md`](ESTADO-DO-PROJETO.md) (doc mestre).
3. **Criar um documento novo?** → §4 (quando criar qual) + [Regras de Criação e
   Gestão de Documentos](https://app.notion.com/p/34db65e5c72b8147afc5e3f9bfdae174).
4. **Trabalho no repositório (código/workflows)?** → o Catálogo tem o path git
   em `Localização`; o [`README.md`](README.md) é o índice desta pasta.

## 2. Portas de entrada e índices

| Recurso | Função | Onde |
|---|---|---|
| **PHI - Catálogo de Artefatos Operacionais** | Índice VIVO de todos os artefatos (SOP, DB, Workflow, Prompt, ADR, SLA, DoD, Âncora) com tipo, área, localização, versão, estado | [Notion](https://app.notion.com/p/bd8df5b982ad4f00a8ae56d687db819e) |
| **ESTADO-DO-PROJETO.md** | Doc mestre: roadmap por área, decisões, pendências, glossário, mapa de agentes | git `docs/strategic-planning/` |
| **README (strategic-planning)** | Índice navegável da pasta de planejamento + ponteiros pras bases Notion | git `docs/strategic-planning/README.md` |
| **Regras de Criação e Gestão de Documentos** | Regras oficiais: quando criar, nomeação, tipos, qualidade, regras de SOP | [Notion](https://app.notion.com/p/34db65e5c72b8147afc5e3f9bfdae174) |
| **PHI™ — Painel de Entregas** | Fila viva de entregas (A.x) | [Notion](https://app.notion.com/p/fad6713af36d4c17a8db1dfca158b0fa) |
| **Registro de Workflows n8n** | Índice (legado) dos workflows n8n com IDs | [Notion](https://app.notion.com/p/354b65e5c72b815bb166ff8ea26861ae) |
| **Central do Repositório do Projeto** | Hub legado de documentos gerais | [Notion](https://app.notion.com/p/34db65e5c72b815b8103d418a513b2d5) |
| **PHI-Compass™** | Guia estratégico da agência | [Notion](https://www.notion.so/356b65e5c72b812dbb34f0180cfccd75) |

## 3. DBs canônicos (onde o estado operacional vive)

> **ADR-012:** Notion canônico para **estado operacional** (estes DBs, ADRs
> aceitos, SOPs vigentes). Git canônico para **design** (strawmans, rascunhos de
> ADR não-aceitos, doc mestre). Sync via processo.

| DB | Função | Link |
|---|---|---|
| **PHI™ — Decisões (ADR)** | Decisões arquiteturais aceitas | [abrir](https://app.notion.com/p/237a5e127f5142eeb9c04ddfb16b6400) |
| **PHI™ — Aprendizados** | Lições, bugs com causa-raiz, observações | [abrir](https://app.notion.com/p/2e49a766781841fda4a2681d358bc98f) |
| **PHI - SOPs** | Procedimentos operacionais versionados (todas as áreas) | [abrir](https://app.notion.com/p/7ebc98e0ebdc480c8c6abc18f65e2ed5) |
| **PHI - Demandas** | Fila operacional run-time (demandas automatizadas) | [abrir](https://app.notion.com/p/a5c6b6ae3e9c4619a3c348e58c75c25b) |
| **PHI - Eventos** | Log canônico de eventos (sink BQ futuro) | [abrir](https://app.notion.com/p/c64f600e4f464b2bac22c1e425c8966e) |
| **PHI - Snapshots de Telemetria** | Métricas operacionais diárias (key-value, 7 áreas) | [abrir](https://app.notion.com/p/0e1cffdef0654580828d5f1478c50077) |
| **PHI - Mudanças de Escopo** | Entidade do Curador (novo serviço/regra/fronteira) | [abrir](https://app.notion.com/p/507d18009622435ba3f17b24d191762d) |
| **PHI - Catálogo de Artefatos Operacionais** | Índice vivo de todos os artefatos | [abrir](https://app.notion.com/p/bd8df5b982ad4f00a8ae56d687db819e) |
| **PHI - Gestão de Projetos** | Tarefas/pendências do Olavo (build/meta-trabalho) | [abrir](https://app.notion.com/p/774518d2128a4b10aede511718737058) |
| **PHI - Onboarding de Clientes** | Estado de onboarding por cliente | [abrir](https://app.notion.com/p/04e34a62624b484cbda546604564b88c) |
| **PHI - Etapas de Onboarding** | 31 etapas canônicas por cliente | [abrir](https://app.notion.com/p/6eb4565b4f1d498c8b2978e0c80880fd) |

> **Não confundir:** **PHI - Gestão de Projetos** = o que o Olavo precisa
> **construir/decidir** (meta-trabalho). **PHI - Demandas** = o que o sistema
> **processa em produção** (fila run-time automatizada).

## 4. Quando criar QUAL documento (guia de decisão)

| Preciso registrar... | Documento certo | Onde |
|---|---|---|
| Decisão arquitetural com trade-offs/alternativas | **ADR** | DB Decisões (ADR) |
| Procedimento repetível de execução (sequência + responsáveis + critério de conclusão) | **SOP** | DB SOPs (versionado) |
| Lição aprendida / bug com causa-raiz / observação reaproveitável | **Aprendizado** | DB Aprendizados |
| Entrada de novo serviço / regra / fronteira / ferramenta | **Mudança de Escopo** | DB Mudanças (Curador) |
| Design em iteração, ainda não decidido | **strawman BRUTO-vX** | git `docs/strategic-planning/<area>/` |
| Passagem de contexto / brief entre agentes | **handoff** | git `docs/handoff/` |
| Spec técnica / arquitetura / visão geral (documento geral) | **Documento** (tipo apropriado) | DB Documentos + Regras de Criação |
| Relatório de auditoria | **auditoria** | git `docs/audits/` |
| Tarefa/pendência do Olavo (build) | linha em **PHI - Gestão de Projetos** | DB Gestão de Projetos |
| Demanda operacional automatizável (run-time) | linha em **PHI - Demandas** | DB Demandas |
| Métrica operacional diária | snapshot em **PHI - Snapshots de Telemetria** | DB Telemetria |
| Evento de transição (histórico imutável) | linha em **PHI - Eventos** | DB Eventos |
| Registrar a EXISTÊNCIA de um novo artefato vivo | linha no **Catálogo** | DB Catálogo |

### Quando NÃO criar um documento novo (Regras de Criação)
- A informação pertence claramente a um documento existente → **incorpore nele**.
- O conteúdo ainda está desorganizado / sem validação mínima → **consolide antes**.
- A mudança é só um detalhe que cabe numa página oficial já existente.

> **Regra final (Regras de Criação):** a função da base não é acumular páginas, é
> permitir continuidade real e consulta confiável. Na dúvida entre rápido e
> claro, prefira **clareza**.

## 5. Fluxo de criação de um procedimento (do tácito ao oficial)

```
Extração do tácito  →  strawman BRUTO-vX (git, red-line com Olavo)
   →  decisão travada (ADR se arquitetural)
   →  SOP (DB SOPs) + DB(s) Notion canônico(s)
   →  workflow n8n (brief Codex em docs/handoff/)
   →  pré-revisão Claude  →  smoke real  →  activate
   →  registrar no Catálogo (Estado=Vivo)
```

Espelha o **Tronco 9 do Miro** (Etapas para Criação dos Procedimentos) e a
sequência Lote 0 → 1 → N+ usada em todas as áreas.

## 6. Âncoras [HANDOFF] por área operacional

Cada área tem uma página âncora com propósito, governança, decisões travadas,
plano de lotes e padrões inegociáveis:

| Área | Âncora |
|---|---|
| Onboarding | [\[HANDOFF\] Implementação de Workflows n8n — Onboarding](https://app.notion.com/p/36bb65e5c72b8123afbecbe126db0a35) |
| Execução de Demandas | [\[HANDOFF\] Execução de Demandas — Âncora da Área](https://app.notion.com/p/37fb65e5c72b81088eb5cfc529ec5137) |
| Priorização | [\[HANDOFF\] Priorização dos Procedimentos — Âncora da Área](https://app.notion.com/p/373b65e5c72b81f4acf6f2d53cab76fa) |
| Curador | [\[HANDOFF\] Curador — Âncora da Área](https://app.notion.com/p/375b65e5c72b810f8f4be50873daedbe) |
| Documentação e Ferramentas | [\[HANDOFF\] Documentação e Ferramentas — Âncora da Área](https://app.notion.com/p/375b65e5c72b8108a4a9db18d2fd8c6b) |

## 7. Documentação técnica do Produto PHI (métricas/score/campanhas)

| Tema | Documento |
|---|---|
| Fórmula do PHI Score (6 componentes MIV/MAS/TSS/FIS/ES/RS) | ADR-004 v2 (DB Decisões) |
| PHI promovido a Índice de Saúde Digital; PHI·Mídia = score de campanha | ADR-21 (DB Decisões) |
| Loop alerta → tarefa → Log de Otimizações | ADR-22 + [Especificação do Loop Operacional](https://app.notion.com/p/37db65e5c72b81a0a4a3e47bd562f91e) |
| Autoridade de score / writer de dados | ADR-003 / ADR-009 / ADR-010 (Daily Entry) |
| Workflows de métricas | git raiz (`phi_pipeline_v2.json`, `daily_entry_v4.json`, `phi_subworkflow_*.json`, `phi_operator_metricas.json`) + Catálogo |
| Telemetria operacional interna | strawman `docs/strategic-planning/telemetria-minima/` + DB Snapshots |

## 8. Convenções rápidas

- **git × Notion (ADR-012):** git = design (strawmans, rascunhos, doc mestre);
  Notion = estado operacional (DBs, ADR aceito, SOP vigente).
- **Nomenclatura de artefatos (ESTADO §8):** prefixos `DB-`, `WF-`, `SOP-`,
  `PROMPT-`, `ADR-`, `SLA-`, `DOD-`, `PAG-`.
- **`tenant_id = phi-agencia`** default em todo artefato novo (multi-tenant futuro).
- **Rascunho de ADR fica em git só enquanto não-aceito.** Quando vira `Aceito`
  no Notion, sai do git (histórico via `git log`).

## 9. Manutenção desta página

Esta página é **meta-navegação** — NÃO lista artefatos individuais (o Catálogo
faz isso, vivo). Atualize-a só quando:
- surge um **novo TIPO** de documento ou um **novo DB canônico**;
- muda uma **porta de entrada** (novo índice, nova âncora de área);
- muda uma **regra de governança** (ADR sobre documentação).

Não liste docs aqui — registre-os no Catálogo. Assim esta página não envelhece.
