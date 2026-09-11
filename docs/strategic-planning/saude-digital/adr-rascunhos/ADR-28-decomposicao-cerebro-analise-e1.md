# [RASCUNHO] ADR-28 — Decomposição do cérebro de análise (T28) em estágios (E1: Maestro sobre o Diagnóstico)

> **STATUS:** RASCUNHO (git, design-canônico). Aprovado em princípio por Olavo
> 2026-07-31 (sessão E1). Vira `Aceito` quando o E1 for ativado em produção
> (pós-credencial + smoke-test).

## Contexto

O cérebro de análise (Módulo 28 / Otimização) foi desenhado como **Maestro + 6
especialistas** (ver `roster-de-agentes.md` §6). Hoje vive só o **Diagnóstico
consolidado** (nó `Message a model`, `WF-T28-Analise-Campaign` `fhYmJH0o9BW1IO4i`)
— o estágio **E0**. Os 7 prompts já estão escritos (`modulo-28-analise-cognitiva.md`).
Faltava decidir **como** sair de 1 agente para o time **sem** quebrar o que roda,
**sem** gastar token antes de haver credencial/score estáveis, e de forma auditável.

## Decisão

**Build em estágios, partindo do que já vive, aditivo e reversível.** O primeiro
salto (**E1**) acrescenta o **Maestro** (triagem + síntese) *depois* do Diagnóstico,
no **rascunho** do WF, sem ativar nem executar (zero token). Design validado por
skill antes de qualquer gasto.

| Estágio | O que roda | LLM | Gatilho p/ avançar |
|---|---|---|---|
| **E0** | 1 Diagnóstico consolidado | 1 | — |
| **E1 (esta ADR)** | Maestro (triagem rápido/devagar + síntese) + Diagnóstico | 1–2 | credencial/token + score estável |
| **E2** | + Julgamento Multiobjetivo (4) + Hipóteses & Priorização (5) | 3–4 | payload carregar regime/margem/LTV (CKP) |
| **E3 (alvo)** | Maestro + 6 especialistas | ~7 | quando cada lente pagar em qualidade/auditoria |

### O que aterrissou no E1 (rascunho, reversível)

- **Nó `Maestro`** (`@n8n/n8n-nodes-langchain.anthropic`, `claude-sonnet-5`) +
  `phi_maestro` (tool de schema) + `Merge Maestro Output`, encadeados
  `Merge LLM Output → Maestro → Merge Maestro Output → Build Notion Page`, sem
  tocar o `Build Notion Page` existente (síntese flui por passthrough).
- **Persistência preparada** (ver ADR-27): +5 properties na DB `PHI - ANÁLISES`
  (`maestro_modo`, `maestro_confianca`, `maestro_diagnostico`, `maestro_decisao`,
  `maestro_proximos_passos`), gravadas por `Create`/`Update Analysis Page`.
- **Fix `cpa:0`** no nó determinístico `Build Deterministic Flags`: `conversions=0`
  ⇒ CPA/ROAS indefinidos + flag `zero_conversao_com_gasto` (atenção) para tráfego
  real sem conversão.
- **Guardrails 8/9 sincronizados** (cpa:0; source_status error/missing ⇒ N/D) nas
  **3 camadas**: código determinístico, prompt vivo do Diagnóstico e skill
  `phi-diagnostico`. Herança confirmada no BLOCO COMUM dos 7 prompts.
- **Validação zero-token** dos 7 prompts via skill contra payload real (CLI-4):
  todos schema-conformes, encadeando na ordem de dependência, degradando com
  honestidade no caso 0-conversão.

## Alternativas consideradas

1. **Reescrever o WF com os 7 agentes de uma vez.** Rejeitado: alto risco, quebra
   o que vive, gasta token antes de score/credencial estáveis.
2. **Só melhorar o prompt do Diagnóstico único (não decompor).** Rejeitado: não
   constrói o time; triagem/síntese (Maestro) e racional multiobjetivo auditável
   exigem lentes separadas.
3. **Aditivo em estágios, partindo do que vive (escolhida).** Respeita "prefira a
   solução mais simples" e o endosso dos docs ("opere num único modelo estruturando
   papéis distintos e migre gradualmente").

## Consequências

- (+) **Reversível** (versões `b2cd74ed` pré-Maestro / intermediárias) e **zero
  token** até o smoke-test.
- (+) Maestro + persistência prontos; a armadilha `cpa:0` fechada ponta a ponta.
- (+) Design **provado** (7 prompts validados) antes de qualquer gasto.
- (−) **E2 é reestruturação maior** (3 lentes Think em paralelo, Maestro consome as 3).
- (−) Gera débitos: confirmar credencial Anthropic no nó, smoke-test, ativação.

## Achados da validação (a monitorar)

1. **`volume_suficiente` frouxo a montante** — payload traz `true`, mas 19 cliques/0
   conv deveria ser `false` p/ conclusões de conversão. Candidato a fix **upstream**
   (agregador/score), não no nó de flags.
2. **E2 depende do Client Knowledge Pack** — Julgamento (4) precisa de
   `regime_decisao` + `margem` + `ticket/LTV` no payload (hoje ausentes). Gate do E2.
3. **Drift do nó Maestro vs. Agente 0 canônico** — **corrigido** nesta sessão
   (nó sincronizado com o prompt do repo).
4. **Guardrails 8/9 propagam corretamente** por todas as lentes.

## Reavaliar quando

- Houver credencial/token no n8n → smoke-test + ativar (E1 vira `Aceito`).
- O payload carregar `regime_decisao`/`margem`/`ticket_ltv` → destrava E2.
- `volume_suficiente` upstream for revisado (achado #1).

## Conexões com ADRs vigentes

- **ADR-003** (autoridade única do score): o Maestro trata `phi_value`/flags/
  severidade como FATO — não recalcula.
- **ADR-27** (entrega DB Análises PHI): E1 adiciona as properties `maestro_*`.
- **ADR-21/22** (loop alerta → tarefa → otimização): a decisão recomendada do
  Maestro alimenta esse loop.
- **Roster de Agentes §6** (staging E0→E3) e **Tema 10** (Slow Mode / triagem).
