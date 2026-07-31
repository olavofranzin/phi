# CLAUDE.md — memória do repositório PHI

Arquivo lido automaticamente pelo Claude Code ao abrir o repo. Mantê-lo **curto e
apontador** — o conteúdo canônico mora nos docs abaixo, não aqui.

## O que é o PHI
Inteligência operacional para gestão de tráfego pago (e, adiante, Sites + Agentes de
IA) de uma agência. Princípio: **"operar como interno, construir como produto."**
Núcleo: o **PHI·Mídia Score** (score de campanha) + o **cérebro de análise** (Maestro +
especialistas) que traduz o score em diagnóstico e **decisão recomendada** — quem dá o
"play" (veicula/altera a conta) é sempre o humano.

## Fonte de verdade (não misturar)
- **Git** (`docs/strategic-planning/`) = canônico para **design e governança** (este
  arquivo, ESTADO-DO-PROJETO, roster, ADRs em rascunho, strawmans).
- **Notion** = canônico para **estado operacional** (DBs, execuções, Ledger).
- Mudar essa divisão exige **ADR aprovado pelo Olavo**.

## Por onde começar (ler nesta ordem)
1. `docs/strategic-planning/ESTADO-DO-PROJETO.md` — doc mestre, com snapshots datados.
2. `docs/strategic-planning/MAPA-DE-DOCUMENTACAO.md` — porta única de navegação
   (§7 = índice de PHI·Mídia / Saúde Digital).
3. `docs/strategic-planning/roster-de-agentes.md` — quais agentes existem, estado,
   autonomia, staging E0→E3.
4. `docs/modulo-28-analise-cognitiva.md` — os 7 prompts do cérebro de análise
   (Maestro + 6 especialistas) + BLOCO COMUM.
5. `docs/strategic-planning/saude-digital/adr-rascunhos/` — ADRs (decisões de design).

## Frente ativa: Otimização (cérebro de análise T28)
- Workflow n8n: **`WF-T28-Analise-Campaign`** (`fhYmJH0o9BW1IO4i`). Diagnóstico
  (Agente 3) **vive**; **Maestro (E1) no rascunho** (não ativado) — ver **ADR-28**.
- DB de entrega: **`PHI - ANÁLISES`** (`38fb65e5-c72b-80db-a425-e5939fc35c7a`).
- Credencial LLM: **`Anthropic account`** (`YifaYCQuGWjdd1Oh`) — existe; confirmar
  binding + smoke antes de ativar.
- Ordem das frentes: **Otimização → Planejamento → Comercial**.

## Convenções inegociáveis
- **Disciplina de token:** validar prompts pela skill `phi-diagnostico` (payload real
  no chat) **antes** de gastar token no n8n. Não ativar/executar workflow sem OK de
  budget do Olavo.
- **Guardrails de dado (regras 8/9 do BLOCO COMUM):** `conversions=0 ⇒ CPA/ROAS
  indefinidos` (nunca "cpa 0 = ótimo"); `source_status error/missing ⇒ N/D` (não 0).
- **Autoridade do score (ADR-003):** não recalcular `phi_value`/flags/severidade — são fato.
- **Memória de Decisão:** mudança de design → ADR (git); execução → entrada no Ledger
  "PHI — Registro de Execuções" (Notion, ADR-32).
- **Modelo por papel:** Claude (raciocínio) só onde há julgamento; Haiku/Gemini Flash
  nos mecânicos.
- **Git:** desenvolver na branch designada da sessão; nunca commitar identificador de
  modelo em artefato versionado.
- **Mudança em nó n8n:** ler o nó antes de editar, edição atômica e reversível, e
  read-back para conferir — nunca ativar por engano.

## Skills
- `phi-diagnostico` (`.claude/skills/`) — reproduz o nó Diagnóstico do T28 para validar
  prompts **sem gastar token**. Deve ficar **byte-idêntica** ao prompt do nó vivo
  `Message a model` (regra de sincronia da própria skill).
