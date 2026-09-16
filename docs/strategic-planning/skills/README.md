# Skills de Marketing (uso PHI) — índice

> Skills "de mercado" (formato SKILL.md) que os agentes PHI usam **inline no prompt**,
> mantidas **ORIGINAIS** (só o markdown foi des-escapado mecanicamente) + um **wrapper de
> runtime PHI** por cima. O corpo abaixo do separador `═══ SKILL ORIGINAL ═══` é **"as regras"
> que o agente executa — não reescrever**.
>
> **Fonte bruta:** `docs/conhecimento/skills marketing.md` (6 skills concatenadas, com o
> markdown escapado). Aqui elas ficam limpas, uma por arquivo.

## Convenção

- Cada arquivo = **wrapper PHI** (contrato de runtime) + `═══ SKILL ORIGINAL ═══` + **corpo
  verbatim**.
- **Uso:** o texto abaixo do separador entra **inline** no *system prompt* do nó do agente
  (n8n), como "as regras a executar".
- **Divisão de papéis:** a **doutrina** (`regras-otimizacao-metodo-subido.md` /
  `regras-planejamento-midia-paga.md`) decide *o que é bom*; a **skill** é o *procedimento* do
  entregável. Elas compõem.
- **Custo:** skill grande (ex.: `paid-ads`, ~2,2k linhas) → carregar **só no agente que a
  usa**, nunca global.
- O **wrapper** diz ao agente para ignorar as instruções de assistente interativo do corpo
  ("User runs /comando", "ask the user", `CONNECTORS.md`), não perguntar ao humano (o que
  faltar vira `dados_faltantes`, ADR-31), entregar ao Maestro e honrar os guardrails (ADR-29).

## Fit com Planejamento + destino

| Skill | Fit | Agente PHI | Estado |
|---|---|---|---|
| **campaign-plan** | 🟢 alto | Planejador (`PC-xxx`) | ✅ limpa + wrapper |
| **paid-ads** | 🟢 alto | Consultor de Plataforma / Planejador / Construtor | ✅ limpa + wrapper |
| marketing-campaign | 🟢 alto (overlap c/ campaign-plan) | Planejador | ⏸ adiada (quase-duplicata — usar campaign-plan) |
| market-research | 🟡 médio-alto | Dossiê/ICP (Client Knowledge Pack) / Estrategista | ⏸ a fazer |
| marketing-psychology | 🟡 médio | Criativos/Narrativa | ⏸ a fazer (mais Otimização/Conteúdo) |
| ad-creative | 🔴 baixo p/ planejamento | Variação de Criativos (execução) | ⏸ fora de Planejamento |

## Próximo

Quando construirmos o **Planejador** / **Consultor de Plataforma**, o corpo da skill
correspondente entra **inline** no prompt do nó, sob o wrapper. As 4 skills `⏸` são limpas
sob demanda, quando o agente que as usa for desenhado.
