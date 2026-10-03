# Otimização de Campanhas — o cérebro de análise ("Módulo 28" / T28)

> Leia **PRIMEIRO** o [`CLAUDE.md` da raiz](../../../CLAUDE.md) — as regras **R1–R15** valem aqui também.
> Esta frente é dona de: **a camada de análise cognitiva sobre o score** — o Maestro e os
> especialistas, o `WF-T28-Analise-Campaign`, a DB `PHI - ANÁLISES`, e a disciplina de token do T28.
> Verificado em **2026-10-03**, pelo **sub-chat da Fase 1 da memória compartilhada**, contra o
> `CLAUDE.md` da raiz no commit `d543f16`.

| | |
|---|---|
| **Por que este arquivo existe** | este bloco de 26 linhas era lido no início de **toda** sessão, inclusive nas que nunca tocam no T28. **A raiz guarda regra; a frente guarda fato** |
| 🔴 **A fronteira que esta frente não cruza** | **ADR-003: o score é fato.** Esta camada **lê** `phi_value`/flags/severidade e **não recalcula** nada. Ver [`BASE-01`](../../base/BASE-01-PRINCIPIOS.md) §5 |
| **O que esta frente NÃO decide** | o score (é a Saúde Digital, `saude-digital/`) · o propósito do PHI (é o `BASE-01`) · onde cada integração vive (é o `BASE-02`) |

---

## O contexto da frente

**Byte-idêntico ao que estava no `CLAUDE.md` da raiz** (commit `d543f16`):

## Frente estratégica ativa: Otimização (cérebro de análise — "Módulo 28" / T28)

> Camada de **análise cognitiva** sobre o score: o "cérebro" (Maestro + especialistas)
> que traduz o PHI·Mídia Score em **diagnóstico + decisão recomendada** — o humano dá o
> "play". Design canônico em **Git** (`docs/strategic-planning/`); estado operacional em
> **Notion**. Complementa o contexto de pipeline abaixo.

- **Ler primeiro (git):** `docs/strategic-planning/ESTADO-DO-PROJETO.md` (doc mestre,
  snapshots datados) · `docs/strategic-planning/MAPA-DE-DOCUMENTACAO.md` (navegação) ·
  `docs/strategic-planning/roster-de-agentes.md` (agentes, staging E0→E3) ·
  `docs/modulo-28-analise-cognitiva.md` (os 7 prompts: Maestro + 6 especialistas) ·
  `docs/strategic-planning/saude-digital/adr-rascunhos/` (ADRs de design).
- **Workflow n8n:** `WF-T28-Analise-Campaign` (`fhYmJH0o9BW1IO4i`). Diagnóstico (Agente 3)
  **vive**; **Maestro (E1) no rascunho**, não ativado — ver **ADR-28**.
- **DB de entrega:** `PHI - ANÁLISES` (`38fb65e5-c72b-80db-a425-e5939fc35c7a`).
- **Credencial LLM:** `Anthropic account` (`YifaYCQuGWjdd1Oh`) — existe; confirmar binding
  nos nós + smoke antes de ativar.
- **Guardrails de dado (BLOCO COMUM, regras 8/9):** `conversions=0 ⇒ CPA/ROAS indefinidos`
  (nunca "cpa 0 = ótimo"); `source_status error/missing ⇒ N/D` (não 0).
- **Autoridade do score (ADR-003):** não recalcular `phi_value`/flags/severidade — são fato.
- **Memória de Decisão:** design → ADR (git); execução → Ledger "PHI — Registro de
  Execuções" (Notion, ADR-32).
- **Disciplina de token:** validar prompts pela skill `phi-diagnostico` (`.claude/skills/`,
  byte-idêntica ao nó vivo) com payload real no chat **antes** de gastar token no n8n; não
  ativar/executar workflow sem OK de budget do Olavo.

---

## ⚠️ O que este recorte NÃO garante

| ⬜ | |
|---|---|
| **que o Maestro e o Diagnóstico estejam assim hoje** | esta fase **não abriu o n8n** (brief da Fase 1, §7). O bloco acima é fiel à raiz, **e a raiz é hipótese até alguém medir** (`BASE-00` §1.2) |
| 🔴 **a leitura do artefato** | e aqui a **R13** é dura: a leitura natural do n8n devolve **o rascunho**. Antes de afirmar o que o `WF-T28-Analise-Campaign` faz, compare **nós e conexões** do draft com o ativo — **não os ids** (`BASE-04` §5) |
| **a credencial do LLM** | o bloco diz *“existe; confirmar binding nos nós + smoke antes de ativar”*. **Continua a confirmar** |

> 🔴 **A disciplina de token não é burocracia — é a regra que esta frente mais quebra.** Valide o
> prompt pela skill `phi-diagnostico` (byte-idêntica ao nó vivo) com payload real **no chat**, antes
> de gastar token no n8n. E **não ative nem execute workflow sem OK de budget do Olavo.**
