# PHI · Card GBP no HubSpot Deal (Camada B)

App Card que renderiza o **Diagnóstico GBP** no record do Deal.
Segue a **spec** [`docs/comercial/card-gbp-record-spec.md`](../../docs/comercial/card-gbp-record-spec.md) §3.
Estrutura na **developer platform 2026.03** (confirmada contra o scaffold real do `hs project create`).

> **⚠️ Camada B = protótipo no Developer Test Account.** Não instalar no portal de produção
> `5633277` enquanto for **Free** — App Card não renderiza em produção antes de Starter+.
> A **Camada A (nativo)** é o que vai pra produção agora e é config na UI, não código (spec §2).

## Pré-requisitos (na sua máquina)
- Node LTS (18+) · **HubSpot CLI:** `npm i -g @hubspot/cli@latest`
- Conta de desenvolvedor + **Developer Test Account**
- **Personal access key** da dev account (a credencial n8n `nKntASZQRG3NzatW` é de API, **não serve**)

## Setup local (uma vez)
```bash
cd apps/hubspot-card-gbp
hs auth                       # personal access key da dev account
hs project profile add        # cria src/hsprofile.<nome>.json (fica no .gitignore); aponta p/ a Test Account
cd src/app/cards && npm install && cd ../../..   # deps do card (@hubspot/ui-extensions, react)
```

## Rodar
```bash
hs project dev --profile <nome-do-seu-profile>
```
Abra um **Deal** no Developer Test Account → aba **"Diagnóstico GBP"**.

## Estrutura (platform 2026.03)
```
apps/hubspot-card-gbp/
├── hsproject.json                     # srcDir + platformVersion 2026.03
├── src/
│   ├── hsprofile.dev.json.example     # TEMPLATE — o real é gerado por `hs project profile add`
│   └── app/
│       ├── app-hsmeta.json            # app private, auth static, scopes DEALS (read)
│       └── cards/
│           ├── package.json           # @hubspot/ui-extensions + react (o card é seu próprio pacote npm)
│           ├── gbp-card-hsmeta.json    # entrypoint + location crm.record.tab + objectTypes ["DEAL"]
│           └── GbpCard.tsx             # React — READ-ONLY, lê via actions.fetchCrmObjectProperties
```

## Read-only por design
O card **não** escreve propriedade nem move deal. Lê os valores em runtime com
`actions.fetchCrmObjectProperties([...])` e apenas renderiza (hierarquia spec §3.1, bandas de
status §4, degradação graciosa §3.5).

## ⚠️ Dado no Developer Test Account
As propriedades GBP (`potencial_comercial`, `dim_*`, …) e os deals com dado **existem no portal
de produção `5633277`**, não no Test Account. Então, ao rodar no Test Account, o card renderiza a
**estrutura** mas provavelmente cai no estado **"Sem diagnóstico GBP"** (sem dado). Para ver o card
**com dado**, é preciso criar no Test Account as propriedades + um deal de exemplo — ou usar o
[mockup](../../) (artifact `e2c97b96-...`), que já mostra o visual com dado real.

## Pontos a confirmar quando o CLI rodar
Se o `hs project dev` reclamar, os candidatos mais prováveis:
1. **Props do `ProgressBar`** — `value`/`maxValue` (pode esperar fração 0–1 em vez de 0–100).
2. **Tokens de `gap` do `Flex`** (`extra-small`/`small`/`medium`/`large`) e variants do `StatusTag`.
Erros de import de *tipo* (`CrmContext`/`ExtensionPointApiActions`) **não** ocorrem aqui — este card
não importa esses tipos (foi o que quebrava no boilerplate).

## Referências
- Spec: `docs/comercial/card-gbp-record-spec.md` · Brief: `docs/handoff/2026-07-11-hubspot-record-card-gbp-design-build-subchat-brief.md`
- Docs: fetching-data (`fetchCrmObjectProperties`), create-an-app, build-with-config-profiles (developer platform 2026.03)
