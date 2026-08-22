# Refs HubSpot — validação da doc oficial (2026-08-22)

> Objetivo (§3 do ponto de retomada): validar a Camada B (`apps/hubspot-card-gbp/`) e a decisão H3
> contra a doc oficial da HubSpot (developer platform 2026.03).
>
> **Rede continua bloqueada nesta sessão** (403 no CONNECT tunnel para `developers.hubspot.com`, mesmo
> padrão da sessão anterior). Então **não** foi possível abrir as 2 URLs diretamente (§3a/§3b).
> **Plano B (§4):** usei o **Context7 MCP**, que indexa a doc oficial da HubSpot
> (`/websites/developers_hubspot`, fonte High, 13.277 snippets). Todos os achados abaixo vêm de páginas
> `https://developers.hubspot.com/docs/apps/developer-platform/...` retornadas pelo Context7.

---

## 1. Componentes UI — validação 1:1 contra `GbpCard.tsx`

| Componente | Doc oficial (props relevantes) | Uso no card | Veredito |
|---|---|---|---|
| `fetchCrmObjectProperties(props[])` | Recebe `Array<string>` ou `'*'`; retorna `{prop: valor}`. Exige o object type declarado no `.json` da extension. | `actions.fetchCrmObjectProperties(PROPS)` | ✅ ok |
| `StatusTag` | `variant`: `'default' \| 'info' \| 'danger' \| 'warning' \| 'success'` | usa success/default/warning/danger | ✅ ok |
| `Divider` | `size` opcional (default `small`) | `<Divider />` | ✅ ok |
| `Text` / `Heading` | componentes padrão (substituem `<p>`/`<h1>`) | ok | ✅ ok |
| `Flex` | layout padrão | ok | ✅ ok |
| **`ProgressBar`** | **`variant`: `'success' \| 'warning' \| 'danger'` (SEM `'default'`)**; `value` (default 0), `maxValue` (default 100), `showPercentage`, `title`, `valueDescription` | ver §2 | ⚠️ **bug** |

## 2. ⚠️ Bug encontrado e corrigido — `ProgressBar variant='default'`

- **Onde:** `apps/hubspot-card-gbp/src/app/cards/GbpCard.tsx`, função `bandVariant` + linha do
  `<ProgressBar variant={bandVariant(v)} />` no loop das 6 dimensões.
- **Problema:** `bandVariant` retornava `'default'` quando a dimensão era `null` (sem dado). A doc oficial
  do `ProgressBar` **só** aceita `'success' | 'warning' | 'danger'` — `'default'` é inválido e quebraria o
  typecheck/`hs project build` (o `StatusTag` aceita `'default'`, o `ProgressBar` não).
- **Correção aplicada:** `bandVariant` agora retorna só os 3 variants válidos; quando a dimensão é `null`,
  o card mostra o rótulo + `—` e **não** renderiza a barra (evita cor enganosa e prop inválida).
  Mudança local, só no protótipo (Camada B) — não toca produção nem cria propriedade/produto.

## 3. Tipo de app × distribuição (confirma o desenho da decisão H3)

Da doc oficial (páginas `build-apps/manage-apps-in-hubspot`, `app-configuration`, `migrate-an-app`):

- **Private app (static token/auth):** instala em **1 conta standard + 10 dev test accounts**. Config em
  `src/app/app-hsmeta.json` com `distribution: private`, `auth.type: static`, scopes em `auth.requiredScopes`.
  UI cards ficam na pasta `cards/`.
- **Private app (OAuth):** até **10 contas** allowlisted.
- **Public app / Marketplace (OAuth):** até **25 contas** antes de listar, ilimitado depois.
  `distribution: marketplace` **exige** `auth.type: oauth`.

**Impacto na spec/ADR:** nada contradiz a decisão H3. Confirma o desenho: private app = poucas contas
(inclui Test Account), marketplace = OAuth obrigatório. O `apps/hubspot-card-gbp/src/app/app-hsmeta.json`
segue esse formato (private/static).

## 4. Lacuna — a tabela-verdade de renderização por TIER (§1 da decisão H3) NÃO foi confirmável aqui

- A afirmação central da decisão — **"Produção Free ❌ não renderiza App Card (private nem public)"** — **não**
  apareceu de forma direta nos snippets indexados pelo Context7. Ele confirma os limites de *distribuição*
  (nº de contas, oauth vs static), mas **não** uma tabela explícita "tier Free/Starter/Pro/Enterprise ×
  renderiza card".
- **Portanto:** a tabela-verdade §1 do `card-gbp-decisao-producao.md` **permanece como está** (não foi
  contrariada), mas segue **pendente de confirmação na página oficial ao vivo** — que precisa da rede
  liberada (§3a) ou do Olavo colar a página de "where UI extensions render / plan requirements".
- Enquanto isso, o guardrail vale: se Free não renderizar, **cair na Camada A nativa** (já é o plano).

## 5. §3b — `https://www.skills.sh/hubspot`

- **Não acessível** (mesma rede bloqueada; não é lib no Context7). Fica para a rede liberada ou Olavo colar.

---

### Fontes (via Context7 — doc oficial HubSpot, developer platform 2026.03)
- `.../ui-extensions/ui-components/standard-components/{progress-bar,status-tag,divider}`
- `.../ui-extensions/ui-extensions-sdk/actions` (fetchCrmObjectProperties)
- `.../ui-extensions/tools/linting/rules/no-html-elements` (Text/Heading)
- `.../build-apps/{manage-apps-in-hubspot,app-configuration}`, `.../migrate-an-app/*`
