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

## 2. Fase 0 — CAMINHO e viabilidade (portal NÃO é Enterprise)
Confirmado: `5633277` = accountType STANDARD, **não-Enterprise** → **UI extension de private app NÃO roda**
(private app React exige Enterprise). Caminho correto: **App Card (UI extension) como PUBLIC APP, construída na
conta de desenvolvedor**, instalada no portal.

**Realidade de renderização (fonte: docs + comunidade HubSpot, jul/2026):**
- O card **renderiza numa Developer Test Account** (grátis, features completas) → serve para **construir e
  demonstrar** a versão premium.
- Em **produção**, App Card de public app **só aparece em plano PAGO (Starter+)**; em **Free NÃO renderiza**.
  - **Se `5633277` for Free:** a extension fica **protótipo no dev test account** até upgrade; produção recebe o **plano nativo** (§3+§6) já.
  - **Se for Starter+/Pro:** confirmar suporte a App Card de public app nesse tier e instalar.
- **Setup (Olavo está finalizando):** conta de desenvolvedor + Developer Test Account; HubSpot CLI
  (`@hubspot/cli`, auth por **personal access key** da dev account — a credencial n8n `nKntASZQRG3NzatW` é de API, **não** serve pro CLI).
- **Legacy:** construir como **App Card (UI extension)**, não CRM card clássico (legacy sai em 31/out/2026).

### Entrega em 2 camadas (recomendado — não travar valor no tier)
- **(A) NATIVO em produção AGORA** (§3 + §6): aba 'IA/Diagnóstico' + Destaques de dados + grupos de propriedades. Funciona em **qualquer tier**; entrega ~80% do valor (página limpa e hierárquica).
- **(B) EXTENSION como protótipo** (§4) no Developer Test Account + **mockup** (§5) — pronta para promover à produção quando o tier permitir.

## 3. Aba nativa 'IA / Diagnóstico' (não precisa de dev)
Adicionar uma **aba** na coluna central (Settings → Objetos → Negócios → Personalização de registro) com cards de
propriedade contendo os textões: `analise_gbp_ia`, `abordagem_sugerida_ia`, `proxima_acao_recomendada`,
`analise_site_ia`, `analise_instagram_ia`, `dados_enriquecimento`, `followup`. Objetivo: leitura sob demanda, fora da visão geral.

## 4. Card sob medida (App Card / UI extension) — camada (B), no Developer Test Account
Projeto HubSpot **public app** (`hs project create`) com uma **App Card** (React, `@hubspot/ui-extensions`),
construída/testada no **Developer Test Account** (renderiza lá independe do tier de produção):
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
1. **Relatório de viabilidade** — tier real do `5633277` (Free vs Starter+), setup da dev account/CLI ok?
2. **Mockup** (Claude Design) das 3 colunas.
3. **Spec** campo→coluna→card/aba (a partir de §1/§3/§6).
4. **Camada A — produção AGORA (qualquer tier):** aba 'IA/Diagnóstico' + Destaques de dados + grupos aplicados/documentados.
5. **Camada B — protótipo:** projeto public app (App Card) construído e testado no **Developer Test Account** (Niti como smoke). Instalar na produção **só se** o tier permitir (Starter+); senão, fica pronto para promover no upgrade.

## 9. Teste de aceitação
- No record do **Niti**: card mostra Potencial 79, Oferta SVC-ADS (badge), IPC 11, Score 75, as 6 dimensões em barras, e os chips de sinal; aba 'IA/Diagnóstico' com os textões; visão geral **limpa** (sem texto longo solto).
- Num deal **sem** GBP: card em estado vazio discreto, sem erro.

## 10. Âncoras
- Motor de scoring (o que cada campo significa): `docs/strategic-planning/roadmap-expansao/gbp-motor-scoring-ipc-design.md` · `scripts/gbp_scoring_prototype.py`.
- Contrato da planilha (mesmos campos): `docs/comercial/planilha-quantidade-leads-por-mes-colunas.md`.
- Propriedades HubSpot (grupo `ia_enriquecimento` + scoring GBP): `get_properties(deals, [...])`.
- Deal de smoke: Niti Odontologia (Potencial 79 / Oferta SVC-ADS / IPC 11 / Score 75).
