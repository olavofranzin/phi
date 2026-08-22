# Guia de execução — Camada B (App Card GBP) na Developer Test Account `51728276`

> Passo a passo para **você rodar na sua máquina** (onde a rede é livre): (1) **semear** as 14 propriedades +
> 2 deals de exemplo e (2) **subir/rodar o App Card** para vê-lo renderizado com dado.
> Ambiente com rede bloqueada (como as sessões do Claude na web) **não roda isto** — a API `api.hubapi.com`
> fica barrada. Por isso este guia é para a **sua máquina** (ou um ambiente com rede liberada).
>
> **Alvo:** Developer Test Account **`51728276`** · projeto em `apps/hubspot-card-gbp/` (platform 2026.03).
> **Guardrail-mãe:** o card **exibe** — nunca escreve propriedade nem move deal. **Nunca** subir isto no
> portal de produção `5633277` (Free não renderiza App Card).

---

## 0. As DUAS credenciais (não confundir)

Este fluxo usa **dois segredos diferentes**, cada um numa etapa:

| Etapa | Credencial | Onde criar |
|---|---|---|
| **Seed** (criar props + deals via API) | **Token de um Private App** da Test Account | Test Account `51728276` → Configurações → Integrações → **Private Apps** |
| **Deploy** (subir/rodar o card via CLI) | **Personal Access Key** da sua **dev account** | conta de desenvolvedor → Perfil → **Personal Access Key** |

> ⚠️ A credencial n8n `nKntASZQRG3NzatW` é de **API** e **não serve** para nenhuma das duas.
>
> 🔒 **Segurança:** nunca cole token em arquivo do repo nem no chat. Use só via variável de ambiente.
> **Rotacione** qualquer token que tenha vazado (ex.: o token colado numa conversa) assim que terminar.

---

## 1. Pré-requisitos (uma vez, na sua máquina)

- **Node LTS (18+)** — o seed usa `fetch` global (Node 18+).
- **HubSpot CLI:** `npm i -g @hubspot/cli@latest`
- Conta de desenvolvedor + a **Developer Test Account `51728276`** já criada.

---

## 2. Etapa 1 — SEED (as 14 props + 2 deals de exemplo)

Cria a estrutura de dado para o card não cair em "Sem diagnóstico GBP".
**Idempotente:** propriedade que já existe é pulada.

### 2.1. Criar o Private App na Test Account e pegar o token
Na Test Account `51728276` → Configurações → Integrações → **Private Apps** → *Create a private app* →
aba **Scopes**, marque exatamente:
- `crm.objects.deals.read`
- `crm.objects.deals.write`
- `crm.schemas.deals.read`
- `crm.schemas.deals.write`

Crie e **copie o Access Token** (formato `pat-na1-...`).

### 2.2. Rodar o seed
De dentro de `apps/hubspot-card-gbp`:

**macOS / Linux (bash/zsh):**
```bash
cd apps/hubspot-card-gbp
export HUBSPOT_TEST_TOKEN="pat-na1-....."   # cole o token do Private App da Test Account
node scripts/seed-test-account.mjs
unset HUBSPOT_TEST_TOKEN                     # limpa da sessão do shell ao terminar
```

**Windows (PowerShell):**
```powershell
cd apps\hubspot-card-gbp
$env:HUBSPOT_TEST_TOKEN="pat-na1-....."
node scripts\seed-test-account.mjs
Remove-Item Env:\HUBSPOT_TEST_TOKEN
```

### 2.3. O que esperar
O script imprime as props criadas (ou "já existe") e, no fim, **os links dos 2 deals**:
```
+ deal "Niti Odontologia (exemplo GBP)" -> id <ID>
+ deal "Clinica Guerra (exemplo GBP)" -> id <ID>
https://app.hubspot.com/contacts/51728276/record/0-3/<ID>
```
Guarde esses links — é onde você vai conferir o card.

---

## 3. Etapa 2 — DEPLOY / RUN do App Card (CLI)

Faz o card **aparecer** no record do deal na Test Account.

### 3.1. Autenticar o CLI e apontar o profile para a Test Account
De dentro de `apps/hubspot-card-gbp`:
```bash
hs auth                     # cola a PERSONAL ACCESS KEY da sua dev account
hs project profile add      # cria src/hsprofile.<nome>.json (fica no .gitignore);
                            # escolha a conta 51728276 (Developer Test Account)
```
O `hsprofile.<nome>.json` guarda o `accountId` da Test Account e **não** vai para o git (está no `.gitignore`).

### 3.2. Instalar as deps do card
```bash
cd src/app/cards && npm install && cd ../../..
```

### 3.3. Rodar em modo dev (recomendado — hot reload)
```bash
hs project dev --profile <nome-do-seu-profile>
```
- Abra um dos **deals semeados** (links do passo 2.3) → aba **"Diagnóstico GBP"**.
- `hs project dev` mantém uma sessão local; ao salvar o `GbpCard.tsx`, recarrega.

> Alternativa (build permanente em vez de sessão dev): `hs project upload --profile <nome>`.
> Para protótipo na Test Account, `hs project dev` é o caminho normal.

---

## 4. Verificação (teste de aceitação — spec §5)

Abra os 2 deals e confira:

| O que olhar | 🦷 Niti (exemplo) | Clínica Guerra (exemplo) |
|---|---|---|
| Potencial (número + barra) | **79** | **11** |
| Oferta (badge) | **SVC-ADS** | **SVC-SITE** |
| IPC / Score | 11 / 75 | 11 / 74 |
| 6 dimensões | Engajamento **0 em vermelho** | Conversão 45 em âmbar |
| Chips | site próprio | chip **`site=rede`** |

- Abra também **um deal sem** essas props → card em estado **"Sem diagnóstico GBP"** (discreto, sem erro).

---

## 5. Se o CLI reclamar (troubleshooting)

- **`ProgressBar` — `value`/`maxValue`:** ✅ já confirmado na doc oficial (via Context7, 2026-08-22): aceita
  número absoluto com `maxValue=100` (não é fração 0–1). O que **estava errado e já foi corrigido** era o
  `variant` — `ProgressBar.variant` só aceita `success|warning|danger` (não `default`); o `GbpCard.tsx` já
  foi ajustado.
- **`Flex` `gap` / `StatusTag` variant:** tokens usados (`extra-small`/`small`/`medium`/`large`;
  `default|info|danger|warning|success`) batem com a doc atual. Se algum acusar, é ajuste de string local.
- **Erros de import de tipo** (`CrmContext`/`ExtensionPointApiActions`): não ocorrem — o card não importa
  esses tipos (foi o que quebrava o boilerplate).
- Registre qualquer erro novo em `docs/comercial/refs/` para a gente ajustar a spec/card.

---

## 6. Ordem recomendada e guardrails

1. **Seed primeiro** (§2) → 2. **Deploy** (§3) → 3. **Conferir** (§4). Assim o card já aparece com dado.
- **Nunca** rodar `hs project upload/dev` apontando para o portal de produção `5633277`.
- **Nunca** dar scope de **write** ao app do card (o card é read-only); o write acima é só do **Private App
  do seed**, que é uma ferramenta separada e temporária.
- Rotacione os tokens ao terminar. Não commitar segredo nem `hsprofile.<nome>.json` com valor real.

---

## 7. Âncoras
- App/card: `apps/hubspot-card-gbp/` (README + `src/app/cards/GbpCard.tsx`)
- Seed: `apps/hubspot-card-gbp/scripts/seed-test-account.mjs`
- Spec: `docs/comercial/card-gbp-record-spec.md` · Decisão H3: `docs/comercial/card-gbp-decisao-producao.md`
- Validação da doc HubSpot: `docs/comercial/refs/hubspot-docs-2026-08-22.md`
