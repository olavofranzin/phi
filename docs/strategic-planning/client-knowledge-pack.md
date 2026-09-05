# Client Knowledge Pack — spec do substrato por cliente (PHI)

> **[GOVERNANÇA — Design & Fundação, 2026-07-29]** Papel: **spec de DESIGN** do "Client Knowledge
> Pack" — o pacote de conhecimento **por cliente** que todos os agentes leem antes de decidir. Git
> (`docs/strategic-planning/`) é canônico para o design; o **conteúdo vivo** de cada cliente é
> canônico no Notion (+ índice RAG). Este doc **não** é a ficha de nenhum cliente — é o molde.
>
> **FONTES QUE UNIFICA:**
> - Roster (§5 "Client Knowledge Pack"): `docs/strategic-planning/roster-de-agentes.md`.
> - Docs por frente: `docs/conhecimento/IA Cognitiva Otimização.md` (Tema 06 — Marketing Knowledge
>   Base, "start with 3") · `… Planejamento.md` (grafo de conhecimento, taxonomia de fontes, camada
>   "contexto") · `… Comercial.md` (vetor de sinais do lead, snapshot cognitivo).
> - Substrato numérico agnóstico: `docs/conhecimento/benchmarks-canonicos.yaml` (`[BM-*]`) +
>   `docs/pesquisa-trafego-pago.md`.
> - Contrato de entrada do cliente: moldura (Ficha do Cliente + Briefing de Campanha).
> - Enforcement: o **BLOCO COMUM** do Módulo 28 (`docs/modulo-28-analise-cognitiva.md`) já referencia
>   "Base de conhecimento da conta" como fonte de verdade — **é este Pack**.
>
> **VERSÃO.** v0.1 (2026-07-29).

---

## 1. O que é e por que existe

O **Client Knowledge Pack** é o **substrato consultável por cliente** que os agentes leem antes de
qualquer leitura/decisão. É o que operacionaliza a regra nº 1 do BLOCO COMUM — *"não invente números;
ancore no substrato"*. Sem ele, "aprendizado contínuo" e "agente que não alucina" são só promessa: o
agente melhora porque **o conhecimento que ele lê melhora**, não porque re-treinamos modelo.

**Hoje o Pack está disperso** (campanhas no Notion, Ficha do Cliente, `benchmarks-canonicos.yaml`, Log
de Otimizações, ADRs). Esta spec define **os blocos, de onde cada um vem, como se consolida e quem lê**
— para virar um pacote único, versionável e servido via RAG.

---

## 2. Os 3 blocos

| Bloco | Conteúdo | De onde vem hoje | Estado |
|---|---|---|---|
| **A · Brand Voice & Guidelines** | Tom, promessa/Core da Oferta, o que pode/não pode dizer, provas sociais, do's & don'ts de criativo, style/formatting | Criativos e swipe files existentes (Drive); disperso/implícito | **NOVO** (estruturar) |
| **B · Market Intelligence** | ICP + personas · dores/objeções · concorrentes e posicionamento · faixas do setor · geografia/raio | Ficha do Cliente (Notion) + enriquecimento GBP (prospecção) + `benchmarks-canonicos.yaml` + Meta Ad Library (concorrentes) | **PARCIAL** |
| **C · Histórico de Aprendizado** | Estratégias que funcionaram/falharam · narrativas vencedoras · decisões e o *porquê* · resultados por campanha | Banco de Estratégias + Log de Otimizações + Validações Internas + ADRs/Ledger | **PARCIAL** (estruturas existem, histórico ~vazio) |

> **Substrato numérico (agnóstico, transversal):** `benchmarks-canonicos.yaml` + `pesquisa-trafego-pago.md`
> **não** são por-cliente, mas fazem parte da "única fonte de verdade" que o agente cita (`[BM-*]`),
> com precedência `pesquisa-trafego-pago.md > Benchmarks (2026)`. O Pack por-cliente **contextualiza**
> esse substrato (ex.: "para ESTE cliente, CPA-alvo R$5,20; margem X%").

---

## 3. Estrutura de dados — 2 camadas + grafo

Reaproveita o modelo já travado na moldura (Planejamento), sem redundância:

- **Ficha do Cliente** (estável, onboarding) — segmento, raio, ticket/LTV geral, setup de conta/pixel,
  concorrentes, histórico. **Semeada pela prospecção** (enriquecimento GBP). É o núcleo dos blocos A+B.
- **Briefing de Campanha** (por campanha, ligado à Ficha) — a oferta/meta/verba/CAC desta campanha.
  Não é do Pack permanente, mas o Pack o **absorve como histórico** após o ciclo.
- **Grafo de conhecimento** (do doc de Planejamento): `cliente → segmento → hipóteses → campanhas →
  resultados`, com relações ponderadas (`segmento → narrativa vencedora`, `campanha → resultado`,
  `regra → exceção`). **Regra de ouro:** editar o nó ICP/segmento deve mudar o comportamento do agente
  na próxima rodada — senão o Pack é decorativo.

**Taxonomia de fontes** (registrar por fonte, do doc de Planejamento): `{tipo de evento observável ·
frequência · fidelidade/confiabilidade · papel na decisão}`. Ex.: GBP (missing→N/D), GA4 paid, Ads,
Clarity, CRM/HubSpot, WhatsApp. Casa com a **regra 9 do BLOCO COMUM** (fonte `error/missing` ⇒ campos
derivados = N/D, não 0).

---

## 4. Como os agentes consomem (mapa bloco → leitor)

| Bloco | Agentes que leem (roster) |
|---|---|
| **A · Brand Voice** | Narrativa · Variação de Criativos · Evaluator · Mensagem/Abordagem · Funil Conversacional |
| **B · Market Intelligence** | Maestro · Julgamento Multiobjetivo · Estrategista · Planejador · Interpretação de Leads · NBA · Audiência |
| **C · Histórico de Aprendizado** | Estrategista (seleção do Banco) · Hipóteses & Priorização · Insights & Aprendizado · Maestro (síntese) |
| **Substrato numérico** | **Todos** (é a fonte das citações `[BM-*]`) |

O **Curador de Conhecimento** (roster Camada 0) é o agente que **mantém o índice RAG** do Pack:
classifica/etiqueta e garante que cada agente recupere o bloco certo. Modelo barato (Haiku/Flash).

---

## 5. Governança & anti-alucinação

- O Pack + o substrato numérico são a **única fonte de verdade** citável. Fora dele: `[HIPÓTESE]` ou
  "não tenho dados suficientes" — nunca inventar (BLOCO COMUM regras 1–3, 8, 9).
- **Precedência** de conflito: dado do cliente (Ficha/CRM) > `pesquisa-trafego-pago.md` >
  `Benchmarks (2026)`.
- **Two-layer metrics:** o Pack carrega tanto a métrica **canônica** (score PHI, benchmarks) quanto a
  **contextual** do cliente (meta/CAC/margem/regime de decisão) — o agente lê as duas sem confundir.
- **Fechamento do loop (bloco C):** todo ciclo de otimização vira entrada no Log/Validações → re-pontua
  a estratégia no Banco → atualiza o Histórico. É o mecanismo que faz o Pack (e os agentes) melhorarem.

---

## 6. Build em estágios ("start with 3")

Do doc de Otimização (Tema 06): não montar os 7 tipos de doc de uma vez. Ordem sugerida p/ o PHI:

| Estágio | Monta | Destrava |
|---|---|---|
| **K0 (agora)** | Consolidar a **Ficha do Cliente** (bloco B núcleo) a partir do que a prospecção já enriquece | Maestro/Julgamento/Interpretação de Leads leem contexto real |
| **K1** | **Brand Voice** (bloco A) mínimo: tom + Core da Oferta + do's/don'ts + provas sociais | Narrativa/Variação/Mensagem respeitam a marca |
| **K2** | **Histórico de Aprendizado** (bloco C): ligar Banco ↔ Log ↔ Validações ↔ ADRs num grafo consultável | Estrategista/Hipóteses/Insights aprendem do passado |
| **K3** | Índice **RAG** + Curador vivo sobre os 3 blocos | recuperação automática por agente |

---

## 7. Onde vive

- **Conteúdo vivo por cliente:** Notion (store operacional — campanhas, Ficha, Banco, Log) + índice RAG.
- **Molde/spec e templates:** git (`docs/strategic-planning/`).
- **Substrato numérico:** git (`benchmarks-canonicos.yaml`, `pesquisa-trafego-pago.md`).
- **Manutenção:** Curador de Conhecimento (agente) + rito de curadoria (quem aprova promoção
  Rascunho→Ativa no Banco).

---

## 8. Verificação (critério de "pronto")

Um agente de razão (ex.: o Diagnóstico ou o Julgamento) consegue **sustentar um diagnóstico e uma
recomendação de UM cliente real usando SÓ o Pack + o substrato numérico** — citando a origem de cada
número, sem inventar e sem pedir dados que já deveriam estar no Pack. Se ele precisa "achar" algo, o
Pack está incompleto naquele ponto.

> **Zero-token / não toca workflow:** montar o Pack é consolidação de conteúdo + estrutura; não depende
> de credencial LLM. A ativação do RAG/Curador vivo (K3) é que entra no n8n depois.
