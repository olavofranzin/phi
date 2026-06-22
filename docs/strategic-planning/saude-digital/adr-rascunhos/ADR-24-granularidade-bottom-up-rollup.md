# [RASCUNHO] ADR-24 — Granularidade T28 + bottom-up rollup

> **STATUS:** RASCUNHO (git, ADR-012). Vira `Aceito` no Lote 3.
> Aprovado em princípio por Olavo 2026-06-22 (D11/D15).

## Contexto

Olavo definiu que a análise percorre níveis: anúncio -> conjunto de
anúncios -> campanha -> cliente. Cada volta do loop analisa um nível,
agregando o inferior. Precisamos decidir onde mora cada granularidade no
contract T28 e como o rollup acontece.

## Decisão

**Análise é bottom-up; granularidade ad-level vive em
`t28_adset.criativos_json` (não em tabela própria, por ora).**

- **Ad-level:** `t28_adset.criativos_json` carrega top-N criativos
  (headlines, descriptions, final_url, métricas). Análise Ad lê daí +
  `t28_ga4_landing`.
- **Adset-level:** `t28_adset` (uma linha por adset/business_date/janela).
- **Campaign-level:** `t28_campaign`.
- **Cliente-level:** consolidação de tudo + social + GBP + Clarity.

**Rollup bottom-up:** output da análise de nível N alimenta a análise de
nível N+1 (ad -> adset -> campaign -> cliente). Cada nível recebe o
contexto agregado do inferior.

## Alternativas consideradas

1. **Tabela `t28_ad` dedicada agora.** Diferida (D15): ainda não sabemos
   se análise ad-level precisa de histórico próprio. `criativos_json`
   cobre o caso atual (análise lê snapshot, não série histórica ad-level).
2. **Top-down (campanha -> adset -> ad).** Rejeitado: perde o princípio de
   que o insight macro deve ser informado pelo detalhe (criativo que puxa
   ou afunda a campanha).
3. **criativos_json + rollup bottom-up (escolhida).**

## Caso PMAX

Performance Max não tem `ad_group` tradicional — a granularidade abaixo da
campanha é "asset group" (estrutura assets+signals). Confirmado no smoke:
cliente 100% PMAX gera `t28_adset = 0` rows. **Comportamento esperado, não
bug.** Para clientes PMAX, a análise opera só em campaign + cliente.

Decisão futura (L3): avaliar `t28_pmax_asset_group` OU coluna
`tipo_grupo ENUM('ad_group','asset_group')` em `t28_adset`. Diferido até
o portfólio ter massa de PMAX que justifique.

## Consequências

- (+) Sem tabela extra agora; `criativos_json` é suficiente para análise snapshot.
- (+) Rollup bottom-up dá contexto rico ao nível superior.
- (-) Histórico ad-level limitado ao que `criativos_json` retém (top-N, sem série).
- (-) PMAX fica sem granularidade intermediária até decisão futura.

## Reavaliar quando

- Análise ad-level precisar de série histórica (tendência de criativo no tempo).
- Portfólio PMAX crescer o bastante para justificar `t28_pmax_asset_group`.

## Conexões com ADRs vigentes

- **ADR-005** (heterogeneidade Google × Meta): níveis diferem por plataforma.
- **ADR-010** (BQ analítico): `t28_*` é a fonte da análise.
- **ADR-23** (separação): o rollup roda no Orquestrador, não no Agregador.
