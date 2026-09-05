# [BRUTO v0.1] Camada de Conhecimento — a base de aprendizagem dos agentes

> **STATUS:** RASCUNHO para red-line do Olavo (git, ADR-012). **Data:** 2026-07-05.
> **Origem:** pedido do Olavo (retomada do plano estratégico: bases de conhecimento
> antes dos agentes; casos internos + conhecimento externo; docs vivos no Google Docs).
> **Evidência:** digests dos 7 documentos em
> `docs/handoff/2026-07-05-camada-conhecimento-digests-7-docs.md`.
> **Alinhado a:** Guia de Agentes de IA (`37db65e5-c72b-8164-82c5-e4f246be9f2c`) §2/§8,
> ADR-21 (guardas cognitivas), ADR-22 (loop O.D.A.E.), ADR-012 (git=design/Notion=estado).

---

## 0. Tese

A aprendizagem dos agentes NÃO é um projeto novo — é a **materialização da camada que o
Guia de Agentes já desenha**: "memória institucional = ADRs + Log de Otimizações +
Aprendizados + (Expansão) Banco de Estratégias" + "substrato numérico canônico" (os docs
do repo). O inventário mostrou que **~60% da estrutura já existe** (schemas prontos,
protocolo escrito) e o que falta é: (a) **conteúdo** (popular), (b) **fiação** (as
automações preencherem os campos), (c) **2 peças novas** (registro de fontes vivas +
DB de conhecimento avulso), (d) **arbitragens editoriais** que evitam o agente tropeçar.

**Princípio:** conhecimento sem metadado de evidência é ruído com autoridade. Toda
unidade de conhecimento carrega `{fonte, data, aplicabilidade, força de evidência}` —
e o Nível de Evidência (A–D) do Banco de Estratégias é o padrão da casa
("D nunca sustenta [CERTEZA]").

## 1. Os 5 estratos do conhecimento (mapa)

| # | Estrato | Pergunta que responde | Onde vive | Estado |
|---|---|---|---|---|
| 1 | **Raciocínio** (lentes cognitivas) | "como pensar" | Google Doc G1 (Temas 01–27, VIVO) → exportar p/ git; Guia de Agentes (Notion) | ✅ existe · ❌ não versionado no repo |
| 2 | **Substrato numérico** (benchmarks) | "quanto é normal" | git: `pesquisa-trafego-pago.md` (canônico) + `Gestão…Benchmarks (2026).md` (complementar) | ✅ existe · ⚠️ contradições a arbitrar |
| 3 | **Protocolo de consumo** | "como o agente usa 1 e 2" | git: `modulo-28-analise-cognitiva.md` (Bloco Comum, 7 regras) | ✅ existe · ⚠️ 7 prompts vazios |
| 4 | **Conhecimento tático externo** | "o que o mercado testou" | **Banco de Estratégias** (Notion, schema pronto) ← G2 (Santana/e-comm) + G3 (Sobral/testes n=1) + futuros | ✅ schema · ❌ 1 registro só |
| 5 | **Memória episódica interna** (casos) | "o que NÓS fizemos e deu/não deu" | Log de Otimizações + PHI Aprendizados + ADRs + DB Análises (L3.0) + eventos de Onboarding | ✅ schemas · ⚠️ fiação incompleta |

**Fluxo-alvo (o "agente distribuidor" do pedido do Olavo):**

```
FONTES VIVAS (Google Docs G1–G4, novos docs)      OPERAÇÃO (n8n)
        │ sync (K5)                                    │ ADR-22
        ▼                                              ▼
   [CURADOR DE CONHECIMENTO]  ◄──────────────  Log de Otimizações
   tria · deduplica · classifica evidência       (Resultado Real/Aprendizado)
   tagueia aplicabilidade · detecta conflito           │
        │                                              │ promoção (Resultado=Melhora,
        ▼                                              ▼  verificado ≥1x)
   Banco de Estratégias (Rascunho→Ativa) ◄── "Validações Internas" (Nível A)
   DB Conhecimento (insights/pesquisas)
   Tabela canônica de benchmarks
        │
        ▼ consumo (ordem: interno > benchmark canônico > estratégia > conceito)
   AGENTES (T28/L3.0, planejamento, onboarding…) — citam com [referência] e nível
```

## 2. Inventário: existe × falta

**Já existe (não recriar):**
- `PHI — Banco de Estratégias (Tráfego Pago)` (`collection://0c6f2e04-b7fe-4e09-92b5-189b716c1dc2`,
  page `d8b953c8-0381-4d23-8b5c-4c320dc2910c`): Tese ("Se X, então Y, porque Z"), Alavanca,
  Nível de Evidência A–D, Fonte/Data da Fonte/Reavaliar em, Pré-condições, Contraindicações,
  relation bidirecional c/ Log ("Validações Internas" ↔ "Estratégia Relacionada"), tenant_id.
  **1 registro-semente** (12/06). Gap: população + catalogação + governança de review.
- `Log de Otimizações` (`19fb65e5-c72b-8106-8e76-f1e684197316`): schema rico (Hipótese,
  Critério de Sucesso, Resultado Esperado/Real, Aprendizado Consolidado, Impacto, Janela de
  Observação, Status do Registro, Origem da Ação, Componente PHI c/ MIV, Executada via PHI?,
  ID da Execução PHI). Gaps: fiação (§4), `tenant_id` ausente, localização legada (sob página
  "GESTÃO DE CRISE"), opção de `Origem da Ação` p/ análises da Camada 2.
- Substrato numérico (R1/R2) + protocolo (R3) em git (hoje no branch do score — ver D1).
- `PHI™ — Aprendizados`, ADRs, `PHI - ANÁLISES` (L3.0), DB Eventos: memória interna de operação.

**Falta (criar/fazer):**
- **DB `PHI — Fontes de Conhecimento`** (novo): registro de cada fonte viva —
  `{nome, tipo (google-doc|newsletter|curso|repo-doc), file_id/URL, dono, domínio
  (média|comercial|geral), modificado_em (última sync), hash/versão, status de ingestão,
  aplicabilidade, tenant_id}`. É o que permite o sync detectar mudança e o Curador saber
  o que reprocessar. (Registra os 4 Google Docs + os 3 do repo + futuros.)
- **DB `PHI — Conhecimento (Insights & Pesquisas)`** (novo): unidades de conhecimento que
  NÃO são estratégia acionável — insights, dados, pesquisas, conceitos de profissionais-
  referência. Schema espelhando o padrão do Banco: `{título, tipo (insight|dado|pesquisa|
  conceito|heurística), domínio, aplicabilidade (modelo de negócio/plataforma), força de
  evidência, fonte + data, resumo, referência (URL/página), relação c/ Fonte de Conhecimento,
  status (ativo|deprecado), reavaliar_em, tenant_id}`. O Curador promove daqui p/ o Banco
  quando algo vira tese acionável.
- **Tabela canônica de benchmarks** (estruturada, IDs estáveis `BM-CTR-GSEARCH-GLOBAL-2025`):
  seed = §7.6 do R2. Formato: git YAML/JSON versionado (v1) e/ou `phi_prod.benchmarks` (v2,
  quando agentes consultarem via BQ). Docs viram narrativa; agente consulta a tabela.
- **Fiação do Log** (§4), **sync Google Docs** (§5), **Curador** (§6), **arbitragens
  editoriais** (§3).

## 3. Arbitragens editoriais (pré-requisito de qualquer consumo por agente)

Do digest transversal — sem isso o agente erra com confiança:
1. **CVR site ≠ CVR plataforma** — separar em duas métricas com faixas próprias (maior
   risco de diagnóstico invertido da base).
2. **Precedência formal**: R2 > R1 em números; regra de margem > regra absoluta ("ROAS ≥5:1");
   janela estatística unificada em ~30 conversões / 2–4 semanas (já é o Bloco Comum do R3).
3. **LTV:CAC >5:1**: arbitrar leitura (subinvestimento × eficiência) — proposta: ">5:1 =
   avaliar headroom de escala ANTES de concluir eficiência" (une as duas).
4. **Claims sem fonte do G1** = "não verificado — não citar como fato" (já é regra do Guia §2;
   aplicar tag nos chunks).
5. **Aplicabilidade por modelo de negócio**: G2→e-commerce; G3→infoproduto/lançamento
   (tudo n=1); G4→domínio comercial-agência (FORA do retrieval de análise de campanha).
6. **Ordem de consulta**: percentis da própria conta (raw/phi_score_history) > benchmark
   canônico > estratégia do Banco > conceito — codificada no prompt (R3/§6 do Guia).

## 4. Fiação do Log de Otimizações (o "configurar corretamente" do pedido)

Estado: abertura automática existe (Pipeline_v2 Fase 3: Fechamento→Escalada→Abertura,
ADR-22); fechamento existe (`PHI - Fechar Otimização` `83vfKD8XMYmjZjFQ`). Spec da fiação:
- **Abertura (Alerta PHI):** preencher `Origem da Ação=Alerta PHI`, `Classificação PHI`,
  `Componente PHI` (pior componente ≠ NULL — semântica v1.2: es/rs/os NULL não conta),
  `ID da Execução PHI`, `Hipótese` (do checklist/análise), **`Critério de Sucesso` +
  `Janela de Observação (h)` obrigatórios na abertura** (sem eles, verificação vira opinião).
- **Fechamento/Verificação:** ao fim da janela → `Resultado Real` (números), `Resultado`
  (Melhora/Sem Efeito/Piora — comparado ao Critério), `Data de Verificação`,
  `Status do Registro=Verificado`, `Aprendizado Consolidado` (1–3 frases, template).
- **Promoção (novo, fecha o loop):** `Resultado=Melhora` + verificado → Curador propõe
  entrada/upgrade no Banco de Estratégias (relation `Validações Internas`; 1ª validação
  → evidência B→A). `Piora` → registra contraindicação na estratégia relacionada.
- **Higiene:** adicionar `tenant_id`; avaliar mover o DB p/ hub canônico (hoje sob "GESTÃO
  DE CRISE"); opção `Origem da Ação = Análise Camada 2` p/ recomendações do L3.0.
- **Auditoria:** medir % de registros com Hipótese/Critério/Resultado Real preenchidos
  (telemetria) — é o KPI de saúde da memória episódica.

## 5. Sincronização dos Google Docs vivos (docs "continuamente atualizados")

- **v1 (imediato, semi-automático):** DB Fontes de Conhecimento guarda `modifiedTime` da
  última ingestão. Rotina (n8n schedule semanal ou sessão Claude sob demanda): Drive API →
  `modifiedTime` atual ≠ registrado → marca `status=desatualizado` + notifica (Telegram) →
  re-digest dirigido (só o delta importa) → atualiza DBs/chunks + `modifiedTime`.
- **v2 (automação plena):** n8n + agente extrator (Gemini p/ volume, per ADR Tiering)
  produz proposta de atualização (Rascunho) → Curador/Olavo aprova → publica. Nunca
  auto-publicar conhecimento em `Ativa` sem gate humano (mesmo racional do "PHI não executa").
- Google Docs continuam sendo a **bancada de trabalho do Olavo**; o repo/DBs são a versão
  **consumível pelos agentes** (com IDs e metadados). Não pedir pro Olavo mudar onde escreve.

## 6. Curador de Conhecimento (o "agente que analisa e distribui")

Agente **N3** (Guia §3), tier denso. Funções: (1) triagem de material novo/alterado;
(2) classificação {estrato, evidência A–D, aplicabilidade, validade}; (3) deduplicação
(ex.: incrementalidade em 3 fontes → 1 unidade canônica c/ 3 referências); (4) detecção de
conflito (novo material contradiz benchmark/estratégia ativa → flag p/ Olavo); (5) proposta
de promoção/deprecação (Rascunho→Ativa é gate humano); (6) **distribuição** = manter os
"pacotes de conhecimento" por agente consumidor (o bloco de contexto que cada agente T28/
L3.0 recebe: substrato + estratégias ativas do seu domínio + aprendizados do cliente).
Nasce DEPOIS que os DBs têm conteúdo (K4) — curador sem acervo é overhead.
Relação com o Curador de Escopo existente: mesmo padrão, outra entidade (Conhecimento ×
Mudanças de Escopo) — avaliar se é o mesmo agente com 2 rotinas ou 2 agentes.

## 7. Decisões para red-line (Olavo)

- **D1 — Branch/merge:** os docs de conhecimento e o v1.2 vivem no branch do score
  (`claude/saude-digital-phi-midia-score-0ko12c`). Consolidar em `main` (ou branch única)
  antes de construir por cima? **Recomendo: merge primeiro** — 2 branches divergentes de
  longa duração já causaram confusão (regressão de 02/07).
- **D2 — Os 2 DBs novos** (§2): aprovar criação + schemas propostos? (Notion, padrão da casa,
  snake_case n8n-friendly onde automação escreve.)
- **D3 — Formato da tabela canônica de benchmarks:** git YAML (v1, simples, versionado) ou
  já `phi_prod.benchmarks` (BQ)? **Recomendo git v1** — agentes de análise hoje recebem
  contexto compilado, não consulta SQL; BQ quando o volume justificar.
- **D4 — Curador:** agente único Conhecimento+Escopo ou separados? **Recomendo separado**
  (lentes e cadências diferentes), decidir em K4.
- **D5 — Prioridade relativa:** Trilha A (validação de produção) na frente da Trilha B?
  **Recomendo A-primeiro nos próximos dias** (a 1ª rodada real do v1.2 é 05/07 07:00) com
  B começando pelos itens editoriais (K0/K1) que não dependem de produção.

## 8. Plano de lotes

**Trilha A — validação de produção (pré-existente, corre em paralelo):**
rodada 07:00 de 05/07 do v1.2 (checklist V1–V3 no branch do score) → a03 (`client_id` no
`sw metricas campanhas`) → Fase 4 (desligar GADS_INSERT) → re-smoke Agregador (a02) →
backfill history → janela de observação 7–14 dias → só então framework §4 + L3.0 produção.

**Trilha B — Camada de Conhecimento:**
| Lote | Entrega | Depende de |
|---|---|---|
| **K0** | Merge/consolidação de branch (D1) + ADR da Camada de Conhecimento (estratos, evidência, gates) | D1 |
| **K1** | Arbitragens editoriais (§3) aplicadas nos 3 docs do repo + header de precedência + tabela canônica de benchmarks v1 (git) | K0 |
| **K2** | DBs novos (Fontes de Conhecimento + Conhecimento) criados/catalogados + registro das 7 fontes | D2 |
| **K3** | População inicial do Banco de Estratégias a partir de G2/G3 (~15–25 entradas curadas, evidência B–D, aplicabilidade tagueada) + export Temas 01–27 (G1) p/ git + prompt-library | K1, K2 |
| **K4** | Fiação do Log (§4) nos workflows n8n + telemetria de preenchimento + fluxo de promoção Log→Banco | Trilha A estável |
| **K5** | Sync v1 Google Docs (watcher n8n + rotina de re-digest) | K2 |
| **K6** | Curador de Conhecimento (prompt N3 per Guia §6) + pacotes de conhecimento por agente consumidor | K3–K5 |

**Nota:** K1–K3 são majoritariamente trabalho editorial/estrutural (Claude/Codex) sem tocar
produção — podem correr já, mesmo com Trilha A em validação.

## 9. Riscos e tensões

- **T-K1:** conhecimento n=1 (G3) consumido como recomendação — mitigação: força de
  evidência obrigatória + Bloco Comum ("D nunca sustenta [CERTEZA]").
- **T-K2:** benchmarks envelhecem (abr/2024–mar/2025) — mitigação: `valido_ate` +
  `Reavaliar em` + ciclo trimestral do Curador.
- **T-K3:** dois writers no Banco (humano + Curador) — mitigação: agente só cria Rascunho.
- **T-K4:** contaminação de domínio (G4 comercial no retrieval de análise) — mitigação:
  tag de domínio obrigatória + filtro no pacote de contexto.
- **T-K5:** o G1 muda e o repo diverge — mitigação: sync v1 (K5) + hash por fonte.
- **T-K6:** duplicação com PHI™ — Aprendizados — fronteira: Aprendizado = lição de
  construção/operação interna; Conhecimento/Estratégia = conteúdo de mídia/negócio consumido
  por agentes de análise. Registrar no ADR (K0).
