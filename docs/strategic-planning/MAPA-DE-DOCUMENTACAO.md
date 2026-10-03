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

## 7. Documentação estruturada — PHI·Mídia e Saúde Digital

> **Hierarquia (ADR-21):** **PHI (IDS — Índice de Saúde Digital)** = índice do
> **cliente**, 0–100, **6 pilares** (Mídia Paga 35%, Funil 20%, …). **PHI·Mídia**
> = o **pilar de mídia paga** = o **score de campanha** (ex-"PHI Score"), calculado
> pelo `Pipeline_v2`. Hoje só o pilar Mídia tem cálculo; os outros 5 pilares e os
> componentes `es/rs/os` do PHI·Mídia são placeholders (mesma lacuna estrutural).
> Lista **exaustiva** de artefatos = **Catálogo** (§2). Aqui ficam só os **ponteiros
> canônicos por tema** (IDs Notion / paths git). Manter enxuto (ver §9).

### 7.1 PHI·Mídia — o score de campanha (o que incide no cálculo)
| Tema | Documento canônico |
|---|---|
| Fórmula: 6 componentes (MIV/MAS/TSS/FIS/ES/RS) + pesos + thresholds + **os 5 problemas estruturais** | **ADR-004** `359b65e5-c72b-819c-981c-fc1eaf79555f` |
| Autoridade única do score (Pipeline_v2 = dono) | **ADR-003** `359b65e5-c72b-8106-8959-ce8615009166` (+ ADR-009/010, writer do raw) |
| Significado dos componentes + níveis de alerta | SOP/Glossário `328b65e5-c72b-81d8-a25b-c83921610282` |
| Schema `phi_score_history` + VIEW `phi_score_current` | Doc Técnica v1.4 `328b65e5-c72b-8103-9ad0-d2fb81dd8055` · DDL git `docs/handoff/2026-05-09-A7b-DDL-VIEW.md` |
| Auditoria-mãe + causas-raiz | A.1 `358b65e5-c72b-8117-ae16-f8713c2458ce` + Aprendizados #7–#11 (linkados no ADR-004) |
| **Análise/correção em curso** (dissecação do JSON live + kit BQ) | git `docs/handoff/2026-07-01-saude-digital-phi-midia-score-analise-subchat-brief.md` |
| Dados | BQ `phi_prod`: `raw_campaign_data`, `client_config`, `model_config`, `phi_score_history`/`_current`, `workflow_execution_log` |

### 7.1b Governança do PARQUE PHI (2026-09-19) — quem grava, quem lê, quem só está ligado
| Tema | Documento |
|---|---|
| **Contexto da frente** (ler primeiro ao mexer em qualquer coisa do PHI) | git `saude-digital/CLAUDE.md` |
| **Contrato do parque** — um destino um dono · **invariantes M1–M12** · matriz de propriedade | git `saude-digital/CONTRATO-PHI.md` 🟡 rascunho v0.1 |
| **Inventário dos 81 workflows** em 5 camadas + o placar do parque | git `saude-digital/panorama-workflows-phi.md` |
| **Entrevista de alinhamento** (30 perguntas de as-built + 22 de decisão) | git `docs/handoff/2026-09-19-parque-phi-contrato-e-entrevista-subchat-brief.md` |
| Os 2 ativos que não produzem nada desde 30/06 | git `docs/handoff/2026-09-18-achado-parque-workflows-sem-producao.md` |
| 🔴 **Ponta final da frente — os 8 critérios F1–F8** (*para quê* o PHI existe) | git `saude-digital/PLANO-ENTREGA-FINAL-PHI.md` — **§1 e §2 são do Olavo, em branco** |
| **O vigia de consistência** — plano, as-built e as 7 conferências V1–V7 | git `saude-digital/PLANO-F3-vigia-de-consistencia.md` (construído 26/09) |
| **Métrica-Mãe: onde ela mora** (por campanha, não por cliente) | git `saude-digital/adr-rascunhos/ADR-40-*.md` (Aceito 21/09) |

### 7.2 Saúde Digital — arquitetura em 4 camadas
| Tema | Documento |
|---|---|
| Índice-mãe (PHI/IDS, 6 pilares) | **ADR-21** `37db65e5-c72b-814b-b3c1-eb6b8ceab705` (Aceito) |
| Visão das 4 camadas (ETL→Análise→Entrega→Erro) | BRUTO git `saude-digital/BRUTO-v0.1-arquitetura-saude-digital.md` |
| Separação Agregador (ETL) × Orquestrador (Análise) | ADR-23 — rascunho git `saude-digital/adr-rascunhos/ADR-23-*.md` |
| Granularidade T28 + bottom-up rollup (ad→adset→campaign) | ADR-24 — rascunho git `…/ADR-24-*.md` |
| Sub-WFs reutilizáveis Social + GBP | ADR-25 — rascunho git `…/ADR-25-*.md` |
| Error Handler global (`onError` + sub-WF + `t28_errors`) | **ADR-26** `388b65e5-c72b-8186-aed5-c5fafd65b5f8` (Aceito) |
| Entrega de análises (DB Análises PHI + write-back) | ADR-27 — rascunho git `…/ADR-27-*.md` |
| Decomposição do cérebro de análise em estágios (E1 Maestro) | ADR-28 — rascunho git `…/ADR-28-*.md` |
| Guardião da Métrica-Mãe (portão de qualidade de dado) | ADR-29 — rascunho git `…/ADR-29-*.md` |
| Cadência (Janelas) no Maestro + Ordem Sagrada no Agente 5 | ADR-30 — rascunho git `…/ADR-30-*.md` |
| Camada de Conhecimento de Plataforma (Google Ads) + Consultor | ADR-31 — rascunho git `…/ADR-31-*.md` |
| Loop operacional O.D.A.E. (alerta→tarefa→Log) | **ADR-22** `37db65e5-c72b-8134-8475-f702f1e39ff1` + Espec. `37db65e5-c72b-81a0-a4a3-e47bd562f91e` |
| Camada 2 — design do Orquestrador campaign | git `saude-digital/L3.0-orquestrador-campaign-design.md` |
| Framework cognitivo dos agentes de análise | Guia de Agentes `37db65e5-c72b-8164-82c5-e4f246be9f2c` · Arquitetura de IA `342b65e5-c72b-81f8-a05e-dfe05e564105` |
| Cérebro de análise T28 — roster + 7 prompts (Maestro + 6) | git `strategic-planning/roster-de-agentes.md` · `docs/modulo-28-analise-cognitiva.md` |
| Regras de otimização (Método Subido destilado) | git `strategic-planning/regras-otimizacao-metodo-subido.md` |
| Regras de planejamento (PME Brasil destilado) — camada 3 | git `strategic-planning/regras-planejamento-midia-paga.md` (fonte: `…planejamento-midia-paga-pme-brasil-2023-2026.md`) |
| Skills de marketing (uso inline nos agentes; wrapper PHI) | git `strategic-planning/skills/` (README + campaign-plan, paid-ads; fonte `docs/conhecimento/skills marketing.md`) |
| Agente Planejador (mapa de decisões PC-xxx) | git `strategic-planning/agente-planejador.md` (BLOCO COMUM + prompt + skill campaign-plan inline) |
| Agente Consultor de Plataforma (que campanha criar) | git `strategic-planning/agente-consultor-plataforma.md` (prompt + skill paid-ads inline; instância do ADR-31) |

### 7.3 Workflows n8n por camada
| Camada | Workflow | id |
|---|---|---|
| 1 · ETL | PHI — Agregador Multi-fonte | `4sdG2UKMCBuFq8xn` |
| 1 · Ingestão raw | sw metricas campanhas ← operador único | `W571K320aqIHsdtH` ← `cLcimNoefTOnVVbd` |
| Score | PHI - Pipeline_v2 (+ Subworkflow Campanhas) | `ITWG3Ge0asXtUM8U` (+ `b1pbn8qmzCNTufTp`) |
| 2 · Análise | Orquestrador · Analise-Campaign | `8Q5ofmAZju0hTN08` · `fhYmJH0o9BW1IO4i` |
| 3 · Entrega/Loop | ~~Loop Alerta~~ (**aposentado 2026-07-21** — lógica inline no Pipeline_v2) · Fechar Otimização · Alerta Erro | `JqPwFD9udCq2hRPw` (off) · `83vfKD8XMYmjZjFQ` · `Oj1RbA0laZTzJZPx` |
| 4 · Erro | WF-T28-Error-Handler | `rTS5pE34eElfuMPl` |
| **Vigilância** | **PHI - Vigia de Consistencia dos Dados** (08h, 7 conferências, 1 msg/dia) | `JMgc0HdLPOFPnFYb` |
| **Erro (vivo)** | PHI - Alerta de Falha (`errorWorkflow` do parque) | `UZ7sIE5cWrrO8xea` |
| **Cadastro** | `client_config` — dono único do destino em `phi_prod` (ADR-39, 27/09) | `SI5NSzRb8lVUz74RwOhIT` |

> Dump recente do Pipeline_v2 p/ auditoria: git `docs/audits/PHI - Pipeline_v2.json`.
> Índice de workflows (legado): [Registro de Workflows n8n](https://app.notion.com/p/354b65e5c72b815bb166ff8ea26861ae).

### 7.4 DBs de destino
- **Notion:** PHI - ANÁLISES `38fb65e5-c72b-80db-a425-e5939fc35c7a` · Campanhas `19fb65e5-c72b-8043-a82d-f47ede397928` · Clientes `19fb65e5-c72b-8147-8aa3-c63aa273d205` · Log de Otimizações `19fb65e5-c72b-8106-8e76-f1e684197316` · Demandas `a5c6b6ae-3e9c-4619-a3c3-48e58c75c25b`.
- **BQ contract T28:** `t28_campaign / t28_adset / t28_ga4_landing / t28_gbp_daily / t28_clarity_daily / t28_meta_campaign / t28_errors`.
- **Telemetria operacional interna** (tangencial): strawman `docs/strategic-planning/telemetria-minima/` + DB Snapshots.

### 7.5 Índice de Saúde Digital do NEGÓCIO (frente nova — 2026-09-25)

> ⚠️ **Não confundir com o §7.1.** O **PHI·Mídia** pontua a **campanha**. Este índice pontua a
> **presença digital do negócio** do cliente, por pilares. É outra pasta, outros ADRs, outro dado de
> entrada (o Agregador multi-fonte). Antes de 27/09 esta frente **não aparecia neste mapa** — era
> possível ler o mapa inteiro sem saber que ela existe.

| Tema | Documento |
|---|---|
| **Pesos iguais provisórios + cobertura declarada** (supersede parcialmente o ADR-21) | **ADR-41 — ACEITO 25/09** · git `saude-digital-do-negocio/adr-rascunhos/ADR-41-*.md` · [Notion](https://app.notion.com/p/3e6b65e5c72b8150857cea4596fb6ffe) |
| Normalização de indicador de alvo + consolidação das decisões de 25/09 | ADR-42 — 🟡 **rascunho** · git `…/ADR-42-*.md` |
| **Os 92 indicadores** (canônico do que existe para medir) | git `saude-digital-do-negocio/DICIONARIO-DE-INDICADORES-v0.md` |
| De onde cada indicador vem, e o que fazer quando a fonte falha | git `…/CONTRATO-DE-FONTES-v0.md` · `…/REGUAS-D6-D9-v0.md` |
| **Substrato estatístico** (os 3 documentos-base, a hierarquia entre eles e as 4 arbitragens) | git `docs/handoff/2026-09-25-substrato-estatistico-do-phi-brief.md` |
| **Decisões do Olavo em 26/09** — nota por pilar + composta · lotes API→nós→cliente · agência como cliente-zero · cliente não vê a nota · Clarity sai do índice | git `docs/handoff/2026-09-26-decisoes-do-olavo-nota-dupla-lotes-e-cliente-zero.md` |
| **Checagem de rota** — *"não estamos complicando?"* (provocação do Olavo e a resposta) | git `docs/handoff/2026-09-26-checagem-de-rota-estamos-complicando.md` |
| Fonte de dado da frente | workflow **PHI — Agregador de Métricas Multi-fonte** `4sdG2UKMCBuFq8xn` → tabelas `t28_*` |

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

> 🔄 **Última atualização: 2026-09-27.** Motivo, dentro da própria regra acima: **uma frente nova
> ganhou porta de entrada** (§7.5 — o índice do negócio, com ADR aceito desde 25/09 e nenhuma menção
> aqui até hoje), e o parque ganhou **um workflow de vigilância** (§7.3), que é porta de entrada de
> *"como eu sei que parou?"*. **O sintoma de que faltava:** dava para ler este mapa do começo ao fim
> e não descobrir que existe um índice de saúde digital do negócio sendo desenhado há duas semanas.

---

## 🔴 Documentação completa no Notion — os ids, que até 03/10 moravam no `CLAUDE.md` da raiz

> **Por que isto mudou de lugar:** na Fase 1 da memória compartilhada a raiz passou a guardar **só
> regra**. *“O que existe e onde achar”* é fato **deste** documento (`BASE-00-PORTA` §1.1), então o
> bloco veio para cá, **byte-idêntico** ao que estava na raiz (commit `d543f16`).
>
> ⚠️ **O brief da Fase 1 (§9.1) mandava APAGAR este bloco, afirmando que este documento já era dono
> dos 7 ids.** Medido em 03/10: **tinha 3 dos 7.** Apagar teria perdido 4. Corrigido — movido, não
> apagado.

## Documentação Completa no Notion

| Documento | ID Notion |
|-----------|-----------|
| Documentação Técnica v1.4 | `328b65e5-c72b-8103-9ad0-d2fb81dd8055` |
| Arquitetura de IA & Análise de Dados | `342b65e5-c72b-81f8-a05e-dfe05e564105` |
| Google Ads Insights Semanal — Spec Técnica | `342b65e5-c72b-8177-9982-c5f012c8f006` |
| Sessão Handoff 08/04/2026 | `33db65e5-c72b-81e0-87c2-f63523db3906` |
| Sessão Handoff 06/04/2026 | `33ab65e5-c72b-8117-b67e-d29f4ca88fb6` |
| SQL de Validação v1.4 | `335b65e5-c72b-814f-95e2-d57a18d96458` |
| SOP, Glossário e Definições | `328b65e5-c72b-81d8-a25b-c83921610282` |

| Verificado | |
|---|---|
| **em** | 2026-10-03, pelo **sub-chat da Fase 1**, **contra o `CLAUDE.md` da raiz no commit `d543f16`** |
| ⬜ **o que NÃO foi verificado** | **que cada página do Notion ainda exista e ainda se chame assim.** O recorte é fiel à raiz; a raiz não foi conferida contra o Notion. Três dos títulos são *“Sessão Handoff”* de **abril de 2026** — candidatos a banner de HISTÓRICO (**R2 regra 3**) |
