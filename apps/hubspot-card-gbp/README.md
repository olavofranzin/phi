# PHI · Card GBP no HubSpot Deal (Camada B)

Esqueleto do **App Card** que renderiza o Diagnóstico GBP no record do Deal.
Segue a **spec** [`docs/comercial/card-gbp-record-spec.md`](../../docs/comercial/card-gbp-record-spec.md) §3
e o brief [`docs/handoff/2026-07-11-hubspot-record-card-gbp-design-build-subchat-brief.md`](../../docs/handoff/2026-07-11-hubspot-record-card-gbp-design-build-subchat-brief.md).

> **⚠️ Camada B = protótipo no Developer Test Account.** Não instalar no portal `5633277`
> enquanto for **Free** — App Card não renderiza em produção antes de Starter+.
> A **Camada A (nativo)** é o que vai pra produção agora e é config na UI, não código (spec §2).

## Pré-requisitos (na sua máquina)
- Node LTS (18+)
- **HubSpot CLI:** `npm i -g @hubspot/cli@latest`
- Conta de desenvolvedor + **Developer Test Account** já criados
- **Personal access key** da dev account (a credencial n8n `nKntASZQRG3NzatW` é de API, **não serve**)

## Setup local (uma vez)
```bash
cd apps/hubspot-card-gbp

# 1) autenticar com a personal access key da dev account
hs auth

# 2) criar um profile apontando pra Developer Test Account
#    O CLI vai gerar src/hsprofile.<nome>.json (que está no .gitignore — não commitar)
hs project profile add
# escolha um nome (ex.: CardGbp) e a Developer Test Account

# 3) instalar deps
npm install
```

## Loop de desenvolvimento
Passe o nome do profile na linha (o exemplo abaixo usa `CardGbp` — troque pelo seu):
```bash
# sobe + live reload (mudanças no .jsx recarregam sem re-upload)
hs project dev --profile CardGbp

# ou upload sem watch
hs project upload --profile CardGbp
```

Depois abra qualquer Deal do **Developer Test Account** — o card "Diagnóstico GBP" aparece
como aba do record. Teste de aceitação (spec §5): com Potencial 79 / SVC-ADS / Engajamento 0
o card deve mostrar Engajamento em vermelho.

## Estrutura (developer platform 2025.2)
```
apps/hubspot-card-gbp/
├── hsproject.json                         # config raiz (srcDir, platformVersion)
├── package.json                           # deps: @hubspot/ui-extensions
├── .gitignore                             # bloqueia hsprofile.*.json (segredo)
├── README.md                              # este arquivo
└── src/
    ├── hsprofile.dev.json.example         # TEMPLATE — o real é gerado por `hs project profile add`
    └── app/
        ├── app-hsmeta.json                # config do app (distribution: private, scopes)
        └── cards/
            ├── gbp-card-hsmeta.json       # config do card: location, objectTypes, properties a carregar
            └── GbpCard.jsx                # React (@hubspot/ui-extensions) — read-only
```

## Read-only por design
O card **não** escreve propriedade nem move deal. Ele lê `context.crm.properties` (populado
automaticamente pela lista `properties` do `gbp-card-hsmeta.json`) e apenas renderiza.

## Pontos a confirmar quando o CLI rodar (marcadores)
Estes 3 pontos podem variar levemente na versão atual da doc — confirmar comparando com o que
`hs project create` gera de base:

1. **`app-hsmeta.json`** — os nomes exatos das chaves `distribution`, `auth.type` e a
   forma dos `scopes` podem ter mudado na versão 2025.2 vigente.
2. **`gbp-card-hsmeta.json`** — o valor de `location` (`crm.record.tab` vs. `crm.deal.tab` vs. outro),
   a chave `module.file` e se a lista `properties` é `properties` ou `preloadProperties`.
3. **`GbpCard.jsx`** — o nome exato de alguns componentes (ex.: `StatusTag` vs `Alert`,
   `ProgressBar` vs `Meter`) e como o `context.crm.properties` chega (algumas versões usam
   `actions.fetchCrmObjectProperties(...)`).

Se algum falhar no `hs project dev`, o CLI aponta o campo — corrige e o live reload segue.

## Referências
- Spec: `docs/comercial/card-gbp-record-spec.md`
- Brief: `docs/handoff/2026-07-11-hubspot-record-card-gbp-design-build-subchat-brief.md`
- Mockup: artifact `e2c97b96-eaf2-41de-b9d2-5237771eed1b`
- Docs oficiais: <https://developers.hubspot.com/docs/apps/developer-platform/build-apps/create-an-app> ·
  <https://developers.hubspot.com/docs/developer-tooling/local-development/build-with-config-profiles> ·
  <https://developers.hubspot.com/docs/platform/ui-extensions-for-private-apps-quickstart>
