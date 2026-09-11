# [BRIEF sub-chat] Finalização dos cards HubSpot + integração dos dados que faltam

> **Como usar:** abra uma sessão nova (sub-chat dedicado) e cole este arquivo como 1ª mensagem.
> É auto-contido. **Frente:** Comercial / Card GBP no HubSpot. **Branch base:** `claude/consolidacao-2026-08`.
> **Repo:** `olavofranzin/phi`. **Continua de onde a sessão anterior parou** (§1).

## 0. Missão
Fechar o **card estratégico GBP no record do Deal** nas suas 2 camadas (A nativo + B App Card), **integrar os
dados que ainda faltam** e **decidir/implementar o caminho de produção** (o portal de produção é **Free** e não
renderiza App Card). O card **exibe** — nunca escreve propriedade nem move o deal.

## 1. Onde paramos (JÁ FEITO — não refazer)
- **Recon read-only** do portal produção `5633277`: **21 propriedades do card existem** em deals + `proxima_acao_aceite_data`;
  **2 produtos** `SVC-IA` (SKU1004) e `SVC-GBP` (SKU1005) criados; **falta só** `transcricao_ia` (objeto **Meeting**).
- **Mockup (Claude Design):** artifact `e2c97b96-eaf2-41de-b9d2-5237771eed1b` (3 estados: Niti forte/ADS, Clínica Guerra fraco/SITE, vazio).
- **Spec:** `docs/comercial/card-gbp-record-spec.md` (mapa campo→coluna→card/aba, Camada A e B, regras, teste de aceitação).
- **Camada B (App Card) — estrutura VALIDADA na developer platform 2026.03:** `apps/hubspot-card-gbp/` — app private
  "PHI Comercial", card "Diagnóstico GBP" (`crm.record.tab`, `objectTypes: ["DEAL"]`), **read-only** via
  `actions.fetchCrmObjectProperties([...])`. **Compila e renderiza** no Developer Test Account **`51728276`**
  (profile `CardGbp`). Componentes: ProgressBar/StatusTag/Flex/Heading/Text/Divider/Tag.
- **Seed script:** `apps/hubspot-card-gbp/scripts/seed-test-account.mjs` — cria as 14 props + 2 deals de exemplo na
  Test Account (token via env `HUBSPOT_TEST_TOKEN`; **Service Key** beta ou Private App com deals read/write + schemas read/write).
- **Módulo CMS (alternativa de produção):** 3 blocos (`module.html`+HubL, `module.css`, `module.js`) do card, prontos
  para copiar num módulo custom do CMS (renderiza fora da restrição de tier do App Card).
- Commits na `claude/consolidacao-2026-08`: `2fb31ef` (rewrite 2026.03), `a1275ec` (nome do app), `a3c45bf` (seed).

## 1.1. Layout do record — o que vai em cada coluna (DECIDIDO — não é achismo)
Fonte: **spec §1** (mapa campo→coluna) + brief `2026-07-11` §1/§6 + mockup `e2c97b96`. **O sub-chat NÃO
redecide isto — aplica.** Legenda de campos abaixo usa os internal names reais (confirmados no recon).

**Coluna ESQUERDA — enxuta (regra: ZERO métrica de IA/GBP aqui).**
- `dealname`, contato (nome / telefone / e-mail), **pipeline + etapa** (`dealstage`), botões de ação (Ligar/E-mail/Tarefa).
- É só a identificação do negócio. Nenhum scoring, dimensão ou texto de IA nesta coluna.

**Coluna CENTRAL — onde mora o diagnóstico. 3 blocos, de cima pra baixo:**
1. **Destaques de dados** (topo, 3 campos): `potencial_comercial` · `oferta_recomendada` · `dealstage` (Etapa do negócio).
2. **Card "Diagnóstico GBP"** (Camada B App Card, ou o card nativo) — os **14 campos compactos**, na hierarquia:
   - (a) `potencial_comercial` (número grande + barra) + `oferta_recomendada` (badge por serviço);
   - (b) `ipc` (oportunidade de venda) + `score_tecnico` (quão otimizado) — **rotular a diferença**;
   - (c) 6 dimensões `dim_saude`/`dim_seo`/`dim_autoridade`/`dim_conversao`/`dim_engajamento`/`dim_conteudo` (barras + bandas forte≥70/médio40–69/fraco<40, valor sempre visível);
   - (d) sinais de ouro: `nao_reivindicado` (chip só se true), `site_tipo`, `flags_score` (chips);
   - (e) NBA: `proxima_acao_aceite`.
   - **Regra de ouro: NENHUM texto longo no card** — string extensa vai pra aba (bloco 3).
3. **Aba "IA / Diagnóstico"** (Camada A, nativo) — os **textões**, nesta ordem: `analise_gbp_ia`,
   `proxima_acao_recomendada`, `abordagem_sugerida_ia`, `analise_site_ia`, `analise_instagram_ia`,
   `dados_enriquecimento`, `followup`.

**Coluna DIREITA — apoio:** associações (Contato / Empresa) + métricas secundárias
(`createdate`, última modificação, `nao_reivindicado`, `site_tipo`).

> Resumo da decisão: **esquerda = quem é o negócio** (sem IA) · **central = o diagnóstico** (Destaques →
> card compacto → aba com os textões) · **direita = apoio/associações**. Campos compactos no card;
> textos longos só na aba.

## 2. Dados que ainda faltam integrar (o foco deste sub-chat)
1. **Semear + validar com dado:** rodar o `seed-test-account.mjs` na Test Account e **conferir o card populado**
   (Niti: Potencial 79, badge SVC-ADS, Engajamento 0 em vermelho). Ajustar props de componente se o CLI reclamar.
2. **Aba "IA / Diagnóstico" (Camada A, nativo) — os textões:** `analise_gbp_ia` (existe, populado real),
   `proxima_acao_recomendada`, `abordagem_sugerida_ia`, `analise_site_ia`, `analise_instagram_ia`,
   `dados_enriquecimento`, `followup`. Aplicar/documentar a aba na produção (§2 da spec). Os campos de site/IG/abordagem
   **ainda estão vazios** — dependem dos agentes de enriquecimento **C2–C4** (fora deste sub-chat; deixar o slot pronto).
3. **`transcricao_ia` (Meeting):** criar quando o C4 (abordagem por etapa) for construído — **não** é do card.
4. **Caminho de produção do card rico (decidir + implementar):** o Free **não** renderiza App Card. Opções (ver §3):
   (a) **Camada A nativa** em produção agora (aba + Destaques + grupos) — entrega ~80%; (b) **módulo CMS** numa página
   puxando dado real (via `crm_object` HubL ou backend); (c) **upgrade de tier** (Starter+ p/ public app, Enterprise p/
   private app); (d) **virar public app + OAuth** se for distribuir a clientes.

## 3. Decisão de produção (trazer recomendação ao Olavo)
Mapear tier × caminho e recomendar. Fatos: App Card de **private app** renderiza só em **Enterprise**; de **public app**,
só **Starter+**; **Test Account** renderiza sempre (protótipo). **Nunca** contornar limitação de plano pra forçar a
extension no Free — se algo empurrar nessa direção, **parar e reportar**.

## 4. Guardrails
- HubSpot é **produção** (`5633277`): card e aba **exibem**, nunca escrevem propriedade nem movem o deal.
- **Nunca** escrever em deals `closedwon`/`closedlost`.
- Criar propriedade/produto só **após OK** do Olavo. `transcricao_ia` só quando C4.
- **Segredos fora do git:** token do seed (Service Key/Private App) só via env; a credencial n8n `nKntASZQRG3NzatW` é de API,
  **não serve** pro CLI do HubSpot.
- Não subir nada em produção sem o Olavo ver o resultado.

## 5. Lotes sugeridos
- **H1** — Seed na Test Account + validação visual do card com dado (Niti + Clínica Guerra).
- **H2** — Camada A nativa em produção: aba "IA/Diagnóstico" + Destaques de dados + grupo `ia_enriquecimento` (documentar/aplicar).
- **H3** — Decisão de produção do card rico (tier vs CMS module vs public app) — recomendação + implementação do caminho aprovado.
- **H4** — (quando C4 existir) `transcricao_ia` em Meeting + wire da abordagem por etapa.

## 6. Registro de andamento (OBRIGATÓRIO)
Manter o andamento **sempre atualizado** nos documentos canônicos:
1. **Ledger de execução (Notion, ADR-32):** registrar cada rodada em **"PHI — Registro de Execuções (Sub-chats)"**
   (`8d8eb685f66249c7ba4f298d744feec3`).
2. **Execution-log (git):** ao fim de cada lote, `docs/handoff/<data>-hubspot-cards-<lote>-execution-log.md`.
3. **Doc mestre (git):** atualizar snapshot em `docs/strategic-planning/ESTADO-DO-PROJETO.md` ao fechar cada lote
   (a nota atual "C1 aguarda OK" está **desatualizada** — o C1 estrutural foi concluído; registrar isso).
4. **ADRs (git):** decisões de design → ADR em `docs/strategic-planning/.../adr-rascunhos/`.
5. Manter um **checklist vivo** de tarefas. Regra: nada de "terminei" sem registrar **onde parou e o que falta**.

## 7. Âncoras
- App: `apps/hubspot-card-gbp/` (+ `README.md` com o fluxo `hs project dev`) · Spec: `docs/comercial/card-gbp-record-spec.md`.
- Brief original: `docs/handoff/2026-07-11-hubspot-record-card-gbp-design-build-subchat-brief.md` · Frente Comercial: `docs/handoff/2026-07-05-comercial-hubspot-subchat-brief.md`.
- Mockup: artifact `e2c97b96-eaf2-41de-b9d2-5237771eed1b` · Test Account `51728276` (profile `CardGbp`) · Produção `5633277`.
