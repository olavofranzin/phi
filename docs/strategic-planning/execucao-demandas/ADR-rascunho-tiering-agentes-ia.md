# ADR-rascunho — Tiering de Agentes IA: Denso (Pro) vs Barato (Flash)

> **Status:** Rascunho (git canônico para design — ADR-012). Vai pra Notion `PHI™ — Decisões (ADR)`
> como `Aceito` após aprovação Olavo. Numeração final do `Número ADR` será o próximo auto-increment
> do DB Notion (não tenta antecipar — divergência conhecida título × `Número ADR`).
>
> **Data origem:** 2026-06-14
> **Origem:** §6 do strawman v0.2/v0.3 de Execução de Demandas. Padrão já aplicado *de facto* em
> Onboarding Lote 1/2 (A2.3 Pro; A2.7, A2.10 Flash). Falta cristalizar como regra do projeto.

---

## Contexto

Projeto PHI usa modelos Gemini com 2 famílias: **Pro** (denso, raciocínio caro multi-artefato) e **Flash** (barato, validação rápida). Sem ADR, a escolha do tier de cada agente novo é ad-hoc — risco real porque:

- Pro em loops frequentes faz o custo escalar (ex: cota Gemini Pro do Onboarding A2.3 já estourou uma vez)
- Flash em decisão cara/multi-artefato gera respostas inconsistentes ou superficiais
- Sem regra, cada strawman improvisa — fonte de drift e dívida técnica

O Onboarding estabeleceu o padrão na prática:
- A2.3 (Classificação de briefing — decisão multi-artefato com PASS/FAIL determinante) → **Pro**
- A2.7 (Digest diário agregando estado) → **Flash**
- A2.10 (Gate Validação Final — checklist regex-able) → **Flash**

Falta formalizar.

---

## Decisão proposta

**Regra de tiering canônica:**

- **Denso (Pro)** onde a decisão é **cara, rara, multi-artefato**. Exemplos: classificação de briefing (A2.3), orquestração de fila operacional (Orquestrador da Execução), análise de Mudança de Escopo (Curador denso), Flash summarize de tendências (Telemetria Lote 3 quando vier).
- **Barato (Flash)** onde a validação é **frequente, repetitiva, mecânica**. Exemplos: gate PASS/FAIL (A2.10), digest agregador (A2.7), quality-gate de DoD (Padronizador da Execução), Flash summarize per-item.

**Critério de decisão para agente novo:**

> "Esta decisão é cara, rara e multi-artefato (≥3 entradas distintas, output ≠ regex/checklist)?"
> → SIM → Pro
> → NÃO → Flash
> → Ambíguo → Começar com Flash, escalar pra Pro se qualidade falhar em smoke

---

## Alternativas consideradas

### Opção A — Tudo Pro
- **Prós:** qualidade máxima em todos os pontos do sistema
- **Contras:** custo escala mal (Pro é 10-30× mais caro por token); Flash já entrega "bom o bastante" pra validação mecânica
- **Veredito:** Rejeitada

### Opção B — Tudo Flash
- **Prós:** custo mínimo
- **Contras:** qualidade insuficiente em raciocínio multi-artefato (A2.3 testou — Flash erra classificação em casos limítrofes); decisão cara mal feita custa mais caro que tokens Pro (retrabalho)
- **Veredito:** Rejeitada

### Opção C — ADR caso-a-caso (sem regra geral)
- **Prós:** zero esforço de regra
- **Contras:** inconsistência entre áreas; cada strawman reinventa o critério; agentes futuros têm decisão obscura; dívida de governança
- **Veredito:** Rejeitada (gerou inconsistência informal — esta ADR já corrige)

---

## Consequências

- **Custo do projeto sob controle:** Flash carrega volume, Pro carrega complexidade
- **Diagnóstico de falha mais fácil:** "Pro errou raciocínio" vs "Flash errou regex" — debug separado
- **Agentes futuros classificáveis ad-hoc** usando o critério "decisão cara/rara/multi-artefato?"
- **Padrão de Onboarding ratificado** (A2.3 Pro, A2.7/A2.10 Flash) — nada quebra
- **Execução de Demandas pré-classificada:** Orquestrador = Pro, Padronizador = Flash
- **Curador pré-classificado:** denso (Pro) por natureza — decisões raras multi-artefato
- **Telemetria neutra:** não usa agente IA hoje; Lote 3 (Flash summarize) já está classificado quando vier

---

## Reavaliar quando

- **Volume Pro > 30% do custo total** de modelo do projeto → revisitar (Flash 2.0 ou Pro Mini podem cobrir alguns casos hoje Pro)
- **Surgir 3ª família de modelo** (Ultra, Nano, etc.) → adicionar tier ao critério
- **Multi-modal entrar** (análise de PDF, screenshot, áudio) → pode exigir tier separado por modalidade
- **Cota Gemini Pro estourar mais de 1×/mês** em produção → pode forçar avaliação de "Pro estritamente onde Flash falha"
- **Provider novo entrar** (OpenAI, Anthropic, Mistral via aggregator) → tier vira "tier denso / tier barato" provider-agnostic; regra mantém

---

## Conexões

- **ADR-004 v2** (Fórmula PHI Score) — independente; PHI Score não usa LLM
- **ADR-010** (BQ × Supabase) — independente
- **ADR-012** (Git × Notion canônico) — paralelo estrutural (divisão por natureza)
- **Strawman Curador** (`docs/strategic-planning/curador/BRUTO-v0.1-design.md`) — Curador é Pro por natureza, esta ADR ratifica
- **Strawman Execução de Demandas v0.2/v0.3** — §6 cristalizado
- **Aprendizados PHI™** — "Anti-pattern de fallback silencioso" (#15) reforça: tier errado = falha silenciosa; esta ADR previne
- **Tronco 10 Miro** (Papéis e Responsabilidades) — agente IA é "papel"; tier define peso
