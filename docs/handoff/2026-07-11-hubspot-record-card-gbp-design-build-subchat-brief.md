# [BRIEF sub-chat] Design + build — Card estratégico GBP no record do Deal (HubSpot)

> **Cole como 1ª mensagem.** Frente: Comercial. **Objetivo:** deixar a página do lead (record do Deal)
> **limpa, hierárquica e estratégica** — um **card sob medida (UI extension)** com o diagnóstico GBP compacto
> na coluna central, os **textões da IA numa aba própria**, e a coluna direita com métricas secundárias.
> **Decisões do Olavo (2026-07-11):** (1) entrega via **UI extension** (card custom); (2) público primário =
> **Olavo/estratégia**; (3) textos longos da IA → **aba dedicada 'IA/Diagnóstico'**; (4) entregar **mockup
> (Claude Design) + spec**. Portal HubSpot `5633277`, pipeline `default`. Deal de smoke: **Niti Odontologia**
> (Potencial 79 · Oferta SVC-ADS · IPC 11 · Score 75 — perfil forte, lead de ADS).

## 0. Inventário dos campos (já levantado) — o que é compacto × texto longo
**Compactos (número/enum/bool) → card estratégico:**
`potencial_comercial` (0–100), `ipc` (0–100), `score_tecnico` (0–100), `oferta_recomendada` (SVC-GBP/SITE/ADS),
`proxima_acao_aceite` (pendente/aceita/rejeitada), `nao_reivindicado` (bool), `site_tipo` (site/social/none),
e os **6 `dim_*`**: `dim_saude`, `dim_seo`, `dim_autoridade`, `dim_conversao`, `dim_engajamento`, `dim_conteudo`.
`flags_score` (string curta, lista de flags).

**Texto longo (string) → aba 'IA/Diagnóstico':**
`analise_gbp_ia`, `analise_site_ia`, `analise_instagram_ia`, `abordagem_sugerida_ia`, `dados_enriquecimento`,
`proxima_acao_recomendada`, `followup`.

## 1. Hierarquia estratégica (público = Olavo; "vale a pena e como abordar")
1. **Topo do card:** `potencial_comercial` (número grande + barra) · `oferta_recomendada` (badge colorido por serviço).
2. **Linha 2:** `ipc` (badge — *oportunidade de venda*) · `score_tecnico` (badge — *quão otimizado*). Rotular a diferença.
3. **Painel de dimensões:** os 6 `dim_*` como barras/mini-radar (leitura de 1 olhar de onde o perfil é forte/fraco).
4. **Sinais de ouro:** chip "Perfil não reivindicado" (se `nao_reivindicado`), chip `site_tipo` (Site próprio/Rede social/Sem site), `flags_score` como chips pequenos.
5. **NBA:** chip de `proxima_acao_aceite` (Pendente/Aceita/Rejeitada).
> Regra de limpeza: **nenhum texto longo no card**; tudo que é string extensa vai pra aba (§3).

## 2. Fase 0 — VIABILIDADE (fazer antes de codar)
UI extensions de record CRM dependem do tipo de conta/hub e de projetos de desenvolvedor habilitados.
**Verificar primeiro:**
- O portal `5633277` suporta **UI extensions em CRM records** (geralmente exige Sales/Service Hub Enterprise ou setup de dev projects). Checar em Settings/Developer ou docs.
- Ferramentas: **HubSpot CLI** (`@hubspot/cli`, `hs`), auth por **personal access key** (a credencial "HubSpot Developer account" no n8n `nKntASZQRG3NzatW` é para API, **não** para o CLI — o CLI precisa da sua própria auth). Sandbox de dev recomendado antes de produção.
- **Se NÃO for viável:** cair no plano B — configuração **nativa** (§3+§4: aba IA + Destaques de dados + grupos de propriedades) + o **mockup**. Reportar a limitação; não travar a entrega.

## 3. Aba nativa 'IA / Diagnóstico' (não precisa de dev)
Adicionar uma **aba** na coluna central (Settings → Objetos → Negócios → Personalização de registro) com cards de
propriedade contendo os textões: `analise_gbp_ia`, `abordagem_sugerida_ia`, `proxima_acao_recomendada`,
`analise_site_ia`, `analise_instagram_ia`, `dados_enriquecimento`, `followup`. Objetivo: leitura sob demanda, fora da visão geral.

## 4. Card sob medida (UI extension) — o entregável principal
Projeto HubSpot (`hs project create`) com uma **CRM record card** (React, `@hubspot/ui-extensions`):
- **Componentes:** `Statistics`/`Text` (Potencial, IPC, Score), `Tag`/`StatusTag` (Oferta, site_tipo, não-reivindicado, NBA), `ProgressBar` (as 6 dimensões), `Flex`/`Divider` para o layout compacto.
- **Dados:** ler as propriedades do Deal via `context`/`hubspot.fetch` (runServerless) ou `crm` property read — **somente leitura** (o card **exibe**, não altera valores).
- **Colocação:** coluna central (destaque) como card primário; avaliar um card secundário/menor na coluna direita para métricas de apoio, se a placement permitir.
- **Degradação graciosa:** deal **sem** dados GBP (não veio do fluxo Maps) → card mostra estado vazio discreto ("sem diagnóstico GBP"), não erro.
- **Estética:** paleta por serviço (SVC-ADS/SITE/GBP), números grandes pro que decide, dims em barras. Consistente com "simples mas preciso".

## 5. Mockup (Claude Design) — junto do spec
Gerar um **esboço das 3 colunas** mostrando: esquerda (negócio/contato — manter enxuta), central (Destaques + **card GBP** + aba IA), direita (associações + métricas secundárias). Usar o Claude Design; anexar o link/arquivo no log. Serve pra validar com o Olavo **antes** de aplicar.

## 6. Coluna esquerda e "Destaques de dados" (nativo)
- **Esquerda:** manter enxuta — nome, telefone, pipeline/etapa, botões de ação. Não poluir com métricas de IA.
- **Destaques de dados (topo central, ~3 campos):** trocar para os 3 mais estratégicos — sugestão `Potencial Comercial` · `Oferta Recomendada` · `Etapa do negócio`. (Documentar; Olavo aplica na UI.)

## 7. Guardrails
- Portal de **produção**: o card e a aba **exibem** dados; **não** alteram valores de propriedade nem movem o deal.
- UI extension: seguir o fluxo oficial (dev sandbox → upload → install). Não subir nada em produção sem o Olavo ver o mockup.
- Se a API/CLI não permitir algo (placement, plano), **reportar e cair no plano nativo** — nunca contornar limitação de plano.

## 8. Entregáveis do sub-chat
1. **Relatório de viabilidade** (UI extension disponível? plano? CLI/auth?).
2. **Mockup** (Claude Design) das 3 colunas.
3. **Spec** campo→coluna→card/aba (a partir de §1/§3/§6).
4. Se viável: **projeto da UI extension** (código + `hs project upload` + install), testado no Niti; senão, plano nativo aplicado/documentado.

## 9. Teste de aceitação
- No record do **Niti**: card mostra Potencial 79, Oferta SVC-ADS (badge), IPC 11, Score 75, as 6 dimensões em barras, e os chips de sinal; aba 'IA/Diagnóstico' com os textões; visão geral **limpa** (sem texto longo solto).
- Num deal **sem** GBP: card em estado vazio discreto, sem erro.

## 10. Âncoras
- Motor de scoring (o que cada campo significa): `docs/strategic-planning/roadmap-expansao/gbp-motor-scoring-ipc-design.md` · `scripts/gbp_scoring_prototype.py`.
- Contrato da planilha (mesmos campos): `docs/comercial/planilha-quantidade-leads-por-mes-colunas.md`.
- Propriedades HubSpot (grupo `ia_enriquecimento` + scoring GBP): `get_properties(deals, [...])`.
- Deal de smoke: Niti Odontologia (Potencial 79 / Oferta SVC-ADS / IPC 11 / Score 75).
