# Roster de Agentes do PHI — desenho unificado (AgenticOS)

> **[GOVERNANÇA — Design & Roster de Agentes, 2026-07-29]** Papel: **fonte de verdade de
> DESIGN** de "quais agentes o PHI terá e o que cada um faz". Git (`docs/strategic-planning/`)
> é canônico para design; **estado operacional** (workflows ativos, execuções) é canônico no
> Notion. Este doc **não duplica** o Módulo 28, os Temas nem os docs de frente — **amarra** tudo
> num roster único, aplicado ao PHI.
>
> **FONTES QUE ESTE DOC UNIFICA:**
> - **Capacidades cognitivas:** `docs/conhecimento/temas/` (Temas 01–27 + prompts) — base
>   conceitual **já construída** (fonte "Estudo de IA Cognitiva", agora também em
>   `docs/conhecimento/Estudo de Inteligencia Artificial Cognitiva.md`).
> - **Docs por frente (cursos conceituais, fonte profunda por frente):**
>   `docs/conhecimento/IA Cognitiva Otimização.md` · `… Comercial.md` · `… Planejamento.md`.
>   São **cursos/método**, não specs de build — a spec de build mora **aqui** + no Módulo 28 +
>   nos briefs de handoff.
> - **Spec do cérebro de análise:** `docs/modulo-28-analise-cognitiva.md` — Maestro + 6
>   especialistas, BLOCO COMUM, 7 prompts (hoje **vazios**).
> - **Síntese condensada:** `docs/conhecimento/IA Cognitiva.md` + "The Architecture of the
>   Agentic Mind" + "Plano de Transformação…" + mapa mental "Segundo Cérebro Estratégico".
> - **Decisões travadas de forma:** moldura estratégica (autonomia painel-nativo, ordem das
>   frentes, n8n+Langfuse, custo por papel).
> - **Dependências/sequenciamento:** `roadmap-expansao/BRUTO-v0.1-frentes-paralelas.md` §5/§7.
> - **Regras de agente:** "Guia de Agentes de IA" (Notion `37db65e5…9f2c`).
>
> **VERSÃO.** v0.2 (2026-07-29) — enriquecido com os 3 docs por frente. Atualizar quando um agente
> muda de estado (NOVO→PARCIAL→VIVE), muda de tier de autonomia, ou o roster ganha/perde papel.

---

## 1. O que este doc é (e não é)

**É** o mapa único de "quais agentes teremos, o que cada um faz, com quanta autonomia, em que
modelo, e o que já vive vs. o que falta". Referência para execução frente a frente.

**Não é** um spec nó-a-nó (isso mora nos briefs de handoff) nem um tratado conceitual (isso mora
nos Temas e nos docs por frente). Aqui é a **tradução PHI**.

**Descoberta que motivou o doc:** a base conceitual já está construída (27 temas + 3 docs por
frente), e o Módulo 28 já é uma spec de roster com 7 prompts vazios. Logo: **não re-derivar teoria
— traduzir num roster concreto, ancorado no que já vive.**

---

## 2. Frame organizador — AgenticOS: Sense → Think → Act → Learn

Frame dos próprios docs (bate com o Tema 27, "OS Cognitivo"):

```
        ┌──────────────────────────────────────────────────────────┐
        │  DIRETOR DE ESTRATÉGIA (Olavo) — Norte, guardrails, "play" │  ← governança humana (System 2)
        └───────────────────────────┬──────────────────────────────┘
                        ┌────────────▼───────────┐
                        │  MAESTRO / ORQUESTRADOR  │  ← roteia por evento + Router Cognitivo (Slow Mode)
                        └────────────┬───────────┘
   SENSE ───────────► THINK ───────────► ACT ───────────► LEARN
   (percepção)        (decisão)          (execução,        (aprendizado,
                                          em PAUSADO)        fecha o loop)
        ┌────────────────────────────▼─────────────────────────────┐
        │  SUBSTRATO: Client Knowledge Pack + base de conhecimento   │  ← todos leem
        │  (Temas, benchmarks-canonicos.yaml, pesquisa-trafego-pago) │
        └──────────────────────────────────────────────────────────┘
```

- **Diretor de Estratégia (humano):** define objetivos multiobjetivo, guardrails e **dá o "play"**
  (decisão travada #1/#4 — a máquina cria em pausado; o humano habilita a veiculação).
- **Maestro/Orquestrador:** recebe o gatilho (alerta PHI, pedido de plano, **lead novo/resposta/
  silêncio/mudança de status**), monta o contexto e **roteia** ao especialista; aplica o **Router
  Cognitivo** (força o "modo lento"/System 2 nos casos de alto impacto — §5).

---

## 3. Legenda + contrato por agente

- **Realidade:** **VIVE** (rodando) · **PARCIAL** (peça determinística/área existe, falta o agente
  LLM) · **NOVO** (a construir).
- **Autonomia (Matriz de Autoridade × escada de 4 modos):** 🟢 **Verde** (autônomo / *Observe &
  Suggest* / *Plan & Propose* / *Act-Autonomously* de baixo risco) · 🟡 **Amarelo** (*Act-with-
  Confirmation* — exige aprovação humana) · 🔴 **Vermelho** (humano-only / proibido). O tier reflete
  a **ação-núcleo**. 🔴 sempre inclui: **veicular anúncio (o "play")**, criar/alterar oferta,
  negociar/fechar contrato, mudar posicionamento de marca, acessar dado sensível.
- **Modelo:** Claude (raciocínio) só onde há julgamento; Haiku/Gemini Flash nos mecânicos.

> **Contrato por agente ("ficha de módulo", do doc de Otimização §Tema 09):** todo agente do roster
> é especificado por **Nome/papel · Frente · Inputs · Outputs · Frequência · Limites (o que NÃO pode
> decidir sozinho) · Autonomia · Modelo · Realidade**. As tabelas abaixo são a forma curta; a ficha
> completa de cada agente vai no brief do seu pacote.

---

## 4. O Roster, por camada

### Camada 0 — Governança & Orquestração (Fundação / transversal)

| Agente | Frente | Faz (concreto no PHI) | Aut. | Modelo | Realidade · âncora |
|---|---|---|---|---|---|
| **Diretor de Estratégia** (humano) | todas | Define Norte, guardrails, regime de decisão; dá o "play" | — | — | VIVE (Olavo) |
| **Maestro / Orquestrador** | trans. | Roteia por evento→especialista; monta contexto; Router Cognitivo; sintetiza pareceres | 🟢 rotear / 🔴 exec. irrev. | Claude | **PARCIAL** — Orq. determinístico no T28 + `WF-EXEC-Orquestrador` vivo; Maestro LLM = **Agente 0** Módulo 28 (vazio) |
| **Curador de Conhecimento / SOPs** | Fundação | Classifica/etiqueta SOPs, estratégias, swipe files; mantém RAG / Knowledge Pack | 🟢 | Haiku/Flash | **PARCIAL** — área Curador Lote 0 (Catálogo) feita; agente LLM não-vivo |

### Camada 1 — Sense / Percepção (lê sinais)

| Agente | Frente | Faz | Aut. | Modelo | Realidade · âncora |
|---|---|---|---|---|---|
| **Leitura & Anomalia** | Otim. | Lê Ads/GA4/Meta cru, normaliza, flag de anomalia (leilão/sazonalidade vs. conta) | 🟢 read-only | Haiku/Flash | **PARCIAL** — Agregador `4sdG2UKMCBuFq8xn` + `Build Deterministic Flags`; LLM = Agente 1 Módulo 28 (Tema 19), vazio |
| **Percepção Comercial** | Prosp. | Monitora sinais de leads/campanhas/páginas; alerta quando merece intervenção | 🟢 | Flash | **NOVO** — (doc Comercial: "agente de percepção comercial") |
| **Enriquecedor** (GBP/site/social) | Prosp. | Lê GBP/site/redes do lead → sinais Intent · Maturity · Urgency · risco de churn · potencial de ticket | 🟢 | Gemini Flash | **VIVE** — agentes Gemini "Agente site"/"Agente GBP" na prospecção |
| **Observador** (termos de busca) | Otim. | Coleta search terms do Google → clusters de intenção (preço/conveniência/experiência) | 🟢 | Flash | **NOVO** — (doc Otim.: Observador→Intérprete) |

### Camada 2 — Think / Decisão (o "cérebro")

| Agente | Frente | Faz | Aut. | Modelo | Realidade · âncora |
|---|---|---|---|---|---|
| **Atribuição** | Otim. | Leitura incremental (DDA/MMM/MER), não last-click | 🟢 analisar | Claude | **NOVO** — Agente 2 Módulo 28 (Tema 15), vazio |
| **Measurement / Incrementalidade (MMM)** | Otim. | Lift/holdout/geo; incremental ROAS ("padrão-ouro"); "se eu desligar, o que acontece?" | 🟢 analisar | Claude | **NOVO** — (doc Otim. Tema 08; distinto da Atribuição) |
| **Diagnóstico Crítico** | Otim. | Debiasing + reframe + contrafactual sobre o score quantitativo | 🟢 analisar | Claude sonnet-5 | **VIVE (consolidado)** — nó `Message a model` no T28 `fhYmJH0o9BW1IO4i` (= Agente 3, Temas 04/02/03); skill `phi-diagnostico`; build bloqueado por credencial/token |
| **Julgamento Multiobjetivo** | Otim. | Bom/ruim pro negócio (ROAS × LTV × risco), Pareto, 2ª ordem; aplica o Regime de Decisão | 🟢 analisar | Claude | **NOVO** — Agente 4 Módulo 28 (Temas 05/12), vazio |
| **Estrategista** | Otim. | Do diagnóstico → seleciona estratégia do Banco (hipóteses concorrentes) + propõe ação | 🟡 | Claude | **NOVO** — Banco de Estratégias (Notion, 19 aprovadas) = insumo vivo |
| **Interpretação de Leads** | Prosp. | Classifica lead **Excelente/Bom/Mediano/Ruim** + justificativa + próxima ação | 🟢 | Flash→Claude | **PARCIAL** — motor GBP scoring vive (regras); narrativa LLM nova. Critérios: ticket, complexidade, alinhamento, maturidade |
| **Next Best Action (NBA)** | Prosp. | Próxima jogada por lead: oferta · canal · argumento · timing · condição de parada | 🟡 | Claude | **NOVO** — campos HubSpot desenhados (BRUTO §3, Tema 26) |
| **Audiência / Segmentação** | Otim./Planej. | Público desejado vs. atingido; mismatch; higiene/sobreposição/tamanho | 🟢 analisar | Claude | **NOVO** — (docs Otim./Planej.) |
| **Planejador / Decisão Estratégica** | Planej. | Do briefing + dossiê + Banco → **"mapa de decisões"** (não lista de tarefas); dossiê ICP/preço | 🟡 | Claude | **NOVO** — plano nomeado `PC-xxx` |

### Camada 3 — Act / Execução (produz em PAUSADO)

| Agente | Frente | Faz | Aut. | Modelo | Realidade · âncora |
|---|---|---|---|---|---|
| **Hipóteses & Priorização** | Otim. | Backlog priorizado de experimentos (ICE tático / RICE estrutural); "Se X → Y porque Z" | 🟢 propor | Claude | **NOVO** — Agente 5 Módulo 28 (Temas 07/08), vazio |
| **Execução-Controle de Experimentos** | Otim. | Orquestra teste (A/B/multivariado); **pausa variantes perdedoras cedo**; controle de frequência | 🟡 | Claude | **NOVO** — (doc Otim. Tema 05: AutoResearch loop) |
| **Construtor de Campanha** | Otim. | Cria campanha/grupos/anúncios **em pausado** (Google/Meta API) — **papel mais sensível** | 🟡 criar / 🔴 veicular | Claude estrut. | **NOVO** |
| **Variação de Criativos** (Lab) | Otim./Conteúdo | Gera variações copy/criativo respeitando marca; loop **Generate → Evaluate → Critique(humano) → Refine**; Curador+Analista de assets (Best/Good/Low) | 🟢 rascunho | Flash→Claude | **NOVO** (Tema 16) |
| **Mensagem / Abordagem por estágio** | Prosp. | Abordagem personalizada por estágio do CRM (exceto Vencido/Perdido) | 🟡 humano revisa | Claude | **NOVO** — campos HubSpot desenhados |
| **Coordenação de Automações** | Prosp. | Mantém fluxos e-mail/WhatsApp coerentes com o estado do funil (ex.: **não nutrir quem já é cliente**) | 🟡 | Flash→Claude | **NOVO** — (doc Comercial Tema 04) |
| **Funil Conversacional** (WhatsApp) | Prosp. | Qualifica lead em tempo real (BANT-adaptado, grounding em catálogo); handoff triggers | 🟡 | Claude | **NOVO** (aspiracional) |
| **Narrativa** | Otim. | Relatório/mensagem pro cliente (traduz diagnóstico técnico) | 🟡 humano revisa | Claude | **NOVO** — Agente 6 Módulo 28 (Tema 13), vazio |

### Camada 4 — Learn / Aprendizado (fecha o loop)

| Agente | Frente | Faz | Aut. | Modelo | Realidade · âncora |
|---|---|---|---|---|---|
| **Insights & Aprendizado** | Fundação | Consolida ciclos, extrai padrões vencedores, mantém o "playbook vivo" | 🟢 propor / 🟡 promover | Claude | **PARCIAL** — Log de Otimizações + loop `Estratégia ↔ Validações Internas` |
| **Memória de Decisão** | Fundação | Loga decisão + **porquê** (ADR / Ledger + traces) — disciplina, não-LLM | 🟢 | — | **VIVE** — ADRs + Ledger "PHI — Registro de Execuções" |
| **Reporting Cognitivo** (narrativo) | Prosp./trans. | Resumos semanais/mensais com narrativa e insights (não só tabela) | 🟢 rascunho | Flash→Claude | **NOVO** — (doc Comercial) |
| **Evaluator** (criativo) | Otim. | Critica A/B por tom + marca, não só número | 🟢 | Flash→Claude | **NOVO** |
| **QA** | trans. | Checa tags de rastreio, links quebrados em LP, erros de formulário | 🟢 | Flash | **NOVO** |

### 4b. Squads por frente (visão de trabalho — mesmos agentes acima)

- **Otimização — cérebro de análise (Módulo 28):** Maestro + Leitura&Anomalia + Atribuição +
  Diagnóstico Crítico + Julgamento Multiobjetivo + Hipóteses&Priorização + Narrativa. **+ Squad de
  experimentação** (Hipóteses → Variação → Execução-Controle → Evaluator/Insights) e
  **Measurement/Incrementalidade** como frente causal própria.
- **Prospecção/Comercial — funil por-evento:** Orquestrador roteando por evento
  (novo lead/resposta/silêncio/mudança de status) → Percepção/Enriquecedor → Interpretação de Leads
  → NBA/Mensagem/Coordenação de Automações → Reporting Cognitivo.
- **Planejamento — diagnóstico-antes-do-plano:** antes de abrir o Ads Manager, rodar 5 pareceres
  (Planner · Analista de performance · Audiência · Criativos/Narrativa · Risco/QA) → síntese de
  **3–5 recomendações/30 dias** → o Planejador escreve o **mapa de decisões (`PC-xxx`)**.

---

## 5. Governança transversal (dos docs, aplicada ao PHI)

- **Escada de autonomia (4 modos)** — *Observe-and-Suggest* → *Plan-and-Propose* →
  **Act-with-Confirmation** (🟡, o default para budget/segmentação/conteúdo sensível) →
  *Act-Autonomously* (🟢, só baixo risco com limites). HITL: *in-the-loop* (aprova durante) ·
  *on-the-loop* (revisa depois, ex.: review semanal) · *out-of-the-loop* (autônomo, baixo risco,
  monitorado). **Maturidade:** Augmentação → Automação supervisionada → Workflows agênticos —
  *"governança precede escala"*.
- **Portão plano→campanha (converte estratégia em campanha otimizável):** o **plano (`PC-xxx`,
  humano-aprovado)** define o alvo; a **carta do agente (`AP-xxx`)** define **bandas por KPI +
  restrições duras**; os agentes de performance operam **só dentro das bandas**, escalando p/ HITL
  quando um KPI sai da banda. As bandas SÃO a fronteira de aprovação.
- **Router Cognitivo / "Slow Mode" (força System 2)** — obrigatório quando: decisão **> 20% do
  budget** · toca o **Core da Oferta**/promessa · horizonte de consequência **> 30 dias**.
- **Kill-switches / Bandas de Valor** — auto-pausa se CPA/verba saírem da faixa verde. Reusa gates
  de significância do PHI Score (`MIN_CLICKS_7D` / `MIN_CONV_7D`) + guardrail C2. Regra de sugestão
  de budget limitada (ex.: **−20% a +20%**). **"Sem dados suficientes → não decide"** (anti-alucinação).
- **Capacidade cognitiva como recurso governado** — limitar nº de clientes em "sistema completo" e
  **nº de testes ativos/cliente** (ex.: 2). "Governança é proteger a cabeça do gestor."
- **Client Knowledge Pack** (substrato por cliente): **Brand Voice & Guidelines** · **Market
  Intelligence** (ICP, dores, concorrentes) · **Histórico de Aprendizado**. Hoje **disperso**
  (campanhas Notion, Ficha do Cliente, `benchmarks-canonicos.yaml`) → consolidar num pacote
  consultável (RAG / grafo de conhecimento: cliente → segmento → hipóteses → campanhas →
  resultados). Alinha com o "Guia de Agentes de IA" (Notion `37db65e5…9f2c`).
- **Regime de Decisão** por cliente/campanha (**Agressivo** = escala, CAC mais alto · **Equilibrado**
  = eficiência/margem · **LTV** = retenção, sacrifica ROAS imediato) → alimenta o Julgamento Multiobjetivo.
- **Observabilidade: Langfuse** (decisão #7) — custo/latência/qualidade por prompt + **audit log /
  traces** (data · agente · sistema tocado · recomendação · decisão aplicada sim/não/parcial · motivo
  · resultado). Sem isso, "aprendizado contínuo" é cego.
- **Convenções de nomenclatura:** plano = **`PC-<cliente>-<tema>-<AAAA-MM>`**; carta de agente de
  performance = **`AP-<cliente>-<AAAA-MM>`** (com dependência `AP → PC`).
- **Disciplina de modelo por papel** (custo): Claude só nos de razão; Haiku/Gemini Flash nos mecânicos.

---

## 6. Filosofia de construção — "alvo decomposto, build em estágios"

Desenhar o **alvo** (roster acima, cada lente auditável), mas **implementar partindo do que já
vive**: o Diagnóstico consolidado (T28) + Orquestrador/Agregador/Score determinísticos. **Decompor
em especialistas só onde pagar**. Os docs endossam: "opere num único modelo estruturando papéis
distintos e migre gradualmente" — respeita "prefira a solução mais simples".

| Estágio | O que roda | LLM/campanha | Gatilho p/ avançar |
|---|---|---|---|
| **E0 (hoje)** | 1 Diagnóstico consolidado (T28) | 1 | — |
| **E1** | Maestro (triagem rápido/devagar) + Diagnóstico consolidado | 1–2 | credencial/token + score estável |
| **E2** | + separa **Julgamento Multiobjetivo** e **Hipóteses & Priorização** | 3–4 | quando a recomendação precisa de racional multiobjetivo auditável |
| **E3 (alvo)** | Maestro + 6 especialistas (Módulo 28 completo) | ~7 | quando cada lente pagar em qualidade/auditoria |

> **Validar prompts sem gastar token:** skill `phi-diagnostico` + payloads reais no chat. Cada um
> dos 7 prompts do Módulo 28 pode ser escrito e testado assim **antes** de haver credencial no n8n.

---

## 7. Dependências & sequenciamento (do BRUTO §5/§7)

- **Otimização** bloqueada por: (a) score confiável (Pipeline_v2 v1.2 em validação), (b) credencial
  Claude no n8n (**sem tokens ainda**), (c) os 7 prompts do Módulo 28. → **design + validação por
  skill andam JÁ** (zero token); build LLM quando score + token.
- **Prospecção / Comercial** menos bloqueada (HubSpot MCP conectado; motor GBP vivo) — pode andar; é
  a frente **pausável primeiro** (decisão #3).
- **Fundação** (Knowledge Pack, Curador, Langfuse, escrever/validar os 7 prompts) **anda agora**.

---

## 8. Cross-reference: agente → lente (Tema) → âncora

| Agente | Tema(s) | Âncora concreta |
|---|---|---|
| Maestro / Orquestrador | 01, 27, 10 | Módulo 28 Agente 0 · `WF-EXEC-Orquestrador` · Orq. determinístico T28 |
| Curador de Conhecimento / SOPs | 11 | área Curador (Catálogo) · DB `PHI - Fontes de Conhecimento` |
| Leitura & Anomalia | 19 | Módulo 28 Agente 1 · Agregador `4sdG2UKMCBuFq8xn` |
| Percepção Comercial / Enriquecedor | 26 | agentes Gemini da prospecção (GBP/site/social) |
| Observador / Intérprete (search terms) | 02, 07 | doc Otim. Tema 01 |
| Atribuição | 15 | Módulo 28 Agente 2 |
| Measurement / Incrementalidade (MMM) | 15 | doc Otim. Tema 08 (Meridian/Robyn) |
| Diagnóstico Crítico | 04, 02, 03 | Módulo 28 Agente 3 · nó `Message a model` T28 · skill `phi-diagnostico` |
| Julgamento Multiobjetivo | 05, 12 | Módulo 28 Agente 4 · PHI Score (ROAS×LTV×risco) |
| Estrategista | 07, 17 | Banco de Estratégias (Notion) |
| Interpretação de Leads / NBA | 26 | motor GBP scoring · campos HubSpot (follow-up, NBA + aceite) |
| Audiência / Segmentação | 05 | docs Otim./Planej. |
| Planejador / Decisão Estratégica | 05, 22, 23 | Briefing de Campanha + Banco · plano `PC-xxx` |
| Hipóteses & Priorização / Exec-Controle | 07, 08, 21 | Módulo 28 Agente 5 · Log de Otimizações · AutoResearch loop |
| Construtor de Campanha | 17 | Google/Meta API (write) — a construir; carta `AP-xxx` |
| Variação de Criativos / Evaluator | 16 | swipe file (Drive) — a construir |
| Coordenação de Automações | 26 | HubSpot workflows por estágio |
| Narrativa / Reporting Cognitivo | 13 | Módulo 28 Agente 6 |
| Insights & Aprendizado | 18, 21 | Log ↔ Validações Internas ↔ Banco |
| Memória de Decisão | 25 | ADRs + Ledger + traces |
| QA | 19 | — a construir |

---

## 9. Próximos passos (o que anda sem token, seguro)

1. **Este doc** — revisão do Olavo (fonte de verdade do roster). Registrar no
   `MAPA-DE-DOCUMENTACAO.md` + Catálogo (Notion).
2. **Preencher os 7 prompts vazios do Módulo 28** (`docs/modulo-28-analise-cognitiva.md`): Maestro +
   6, cada um = BLOCO COMUM + lente do Tema. Validar via skill + payloads reais.
3. **Consolidar o Client Knowledge Pack** — spec de onde cada bloco vem (Brand Voice / Market Intel /
   Histórico) e como o RAG serve os agentes.
4. **Ligar Langfuse** (observabilidade + audit log/traces).

> Nenhum passo gasta token de LLM em produção nem toca workflow live. Publicar/ativar agentes LLM só
> quando o score estabilizar **e** houver credencial/token no n8n.
