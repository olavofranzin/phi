# Execution-log — HubSpot Cards, Lote H3 (decisão de produção) + Registro

> **Data:** 2026-08-21 · **Frente:** Comercial / Card GBP no record do Deal · **Lote:** H3 + §6 (registro).
> **Branch:** `claude/hubspot-gbp-card-finalizacao-annaxt` (rebase da `claude/consolidacao-2026-08`).
> **Brief:** `docs/handoff/2026-07-11-hubspot-record-card-gbp-design-build-subchat-brief.md` + brief de
> finalização (sub-chat, colado nesta sessão).

---

## 1. Objetivo desta sessão

Fechar o **entregável H3** (decidir/documentar como o card rico chega a produção, dado que Free não renderiza
App Card) e cumprir as obrigações de **registro (§6)** do brief.

## 2. O que foi feito

1. **Recon de estado (read-only, permitido):** `get_organization_details` no portal `5633277` →
   `accountType` **STANDARD**, moeda BRL, fuso America/Sao_Paulo. Confirma **ao vivo hoje** o tier Free que
   trava a decisão H3. Nenhuma escrita em produção.
2. **Decisão de produção (H3):** `docs/comercial/card-gbp-decisao-producao.md` — tabela-verdade de
   renderização (tier × tipo de app), os 4 caminhos (A nativo / B módulo CMS / C upgrade / D public app+OAuth)
   e a recomendação: **ativar A agora, B como prova visual, C/D como gatilhos futuros**.
3. **ADR-34:** `docs/strategic-planning/saude-digital/adr-rascunhos/ADR-34-caminho-producao-card-gbp.md` —
   cristaliza a decisão (RASCUNHO → Aceito quando a Camada A estiver em produção e o Olavo confirmar).
4. **ESTADO-DO-PROJETO:** corrigida a nota desatualizada "C1 aguarda OK" (C1 estrutural concluído — 21 props +
   2 produtos existem) e adicionada entrada de changelog v0.1.53.

## 3. Verificação (como conferir que está certo)

- **Fato do tier:** rodar `get_organization_details` → `accountType` deve ser STANDARD/Free. Se um dia voltar
  Enterprise, a tabela-verdade da §1 do doc de decisão muda (private app passa a renderizar) — reavaliar.
- **Coerência dos docs:** `card-gbp-decisao-producao.md`, `ADR-34` e a spec devem concordar na regra de
  renderização e nos guardrails. Conferido nesta sessão.
- **Sem escrita em produção:** nenhuma chamada de `manage_crm_objects`/escrita foi feita — só leitura.

## 4. O que ficou de fora (bloqueado — precisa do Olavo)

- **H1 — semear + validação visual:** **não executável nesta sessão.** Não há `HUBSPOT_TEST_TOKEN` no
  ambiente, e o conector HubSpot disponível aponta para **produção 5633277** (que o guardrail manda só exibir).
  A Test Account `51728276` (alvo do seed) não está conectada. → Olavo roda
  `apps/hubspot-card-gbp/scripts/seed-test-account.mjs` com o token da dev account.
- **H2 — Camada A nativa em produção:** as mudanças são feitas por Olavo na UI (aba/Destaques/grupo). Guia
  passo a passo pode ser produzido numa próxima rodada (não pedido nesta).
- **H4 — `transcricao_ia` (Meeting):** deferido para quando C4, como o brief define.

## 5. Próximos passos sugeridos

1. Olavo aplica a **Camada A nativa** em produção (Caminho A) — maior valor imediato.
2. Quando quiser demonstrar o card rico: publicar o **módulo CMS** (Caminho B) com o deal Niti `60040868935`.
3. Rodar o **seed** no Test Account para a validação visual da Camada B (H1), com o token da dev account.

## 6. Âncoras

- Decisão: `docs/comercial/card-gbp-decisao-producao.md`
- ADR: `docs/strategic-planning/saude-digital/adr-rascunhos/ADR-34-caminho-producao-card-gbp.md`
- Spec: `docs/comercial/card-gbp-record-spec.md`
- App Card: `apps/hubspot-card-gbp/`
- Ledger Notion (ADR-32): `8d8eb685f66249c7ba4f298d744feec3` (registrar esta rodada).
