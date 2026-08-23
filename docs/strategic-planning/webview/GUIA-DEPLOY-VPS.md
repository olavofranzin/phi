# Guia de deploy do Webview no VPS (Hostinger) + credenciais

> Objetivo: subir o webview PHI no seu VPS. Backend Node (guarda o segredo e lê
> o BigQuery) + build React servido pelo mesmo Node.
> Dois caminhos: **Método A — EasyPanel (recomendado, já instalado no seu VPS)**
> ou **Método B — manual (Node + pm2 + nginx)**.

## Visão geral

```
Navegador → (VPS) Node/Express  ──> BigQuery (phi_prod)
             serve o site React        lê phi_score_current + raw_campaign_data
             guarda GCP_SA_KEY
```

O código vive em `olavofranzin/phi`, pasta `webview/`:
- `webview/`         → app React (Vite)
- `webview/server/`  → backend Node/Express
- `webview/Dockerfile` → imagem única (front + backend) para o EasyPanel

---

# MÉTODO A — EasyPanel (RECOMENDADO)

> Você já tem EasyPanel no VPS (é onde roda o n8n). Ele builda direto do GitHub,
> injeta o segredo como variável de ambiente e cuida de domínio + HTTPS.

### A.1 — Gerar a chave (ver Passo 1 abaixo, é igual para os dois métodos).

### A.2 — Criar o App no EasyPanel
1. EasyPanel → seu projeto → **+ Create → App**.
2. **Source:** GitHub → repositório `olavofranzin/phi`, branch
   `claude/webview-metricas-clientes-lxps0l` (depois do merge, use `main`).
3. **Build:** tipo **Dockerfile**.
   - **Build context / Root:** `webview`  (a pasta, não a raiz do repo).
   - **Dockerfile path:** `Dockerfile` (relativo ao context) ou `webview/Dockerfile`.
4. **Porta:** o container expõe **8080** (aponte o domínio para essa porta).

### A.3 — Variáveis de ambiente (aba Environment do App)
Cole exatamente:
- `GCP_SA_KEY` → o **JSON inteiro** da service account, em **uma linha**
  (o JSON já traz os `\n` escapados dentro de `private_key` — cole como está).
- `BQ_BILLING_PROJECT` → `phi-production-488720`
- `BQ_DATA_PROJECT` → `project-0e7c58d4-656f-49e8-807`
- `PORT` → `8080`

> O segredo fica só no servidor (EasyPanel), nunca no navegador.

### A.4 — Deploy e domínio
1. Clique **Deploy**. Acompanhe o log de build (Docker).
2. Em **Domains**, adicione um domínio/subdomínio (ex.: `phi.suaagencia.com.br`)
   apontando para a porta **8080**; o EasyPanel emite o HTTPS.
3. Atualizações futuras: `git push` → botão **Deploy** (ou webhook de auto-deploy).

### A.5 — Validar
Pule para **Passo 7 — Validar (cliente KIL)** no fim deste guia.

---

# MÉTODO B — Manual (Node + pm2 + nginx)

> Use este método se preferir não usar o EasyPanel. Pré-requisitos: Node 20+ e git.

## Passo 1 — Gerar a chave da service account (Google Cloud)

1. Google Cloud Console → **IAM & Admin → Service Accounts**.
2. Abra `phi-workflow-sa@phi-production-488720.iam.gserviceaccount.com`.
3. Aba **Keys → Add key → Create new key → JSON → Create**. Baixa um `.json`.
   ⚠️ É segredo. Não versione, não mande por chat/e-mail sem cuidado.
4. Garanta as permissões de **leitura** no dataset (uma vez):
   - No projeto de billing (`phi-production-488720`): papel **BigQuery Job User**.
   - No projeto/dataset dos dados (`project-0e7c58d4-656f-49e8-807` / `phi_prod`):
     papel **BigQuery Data Viewer** para a service account.

## Passo 2 — Clonar/atualizar o código no VPS

```bash
# primeira vez
git clone https://github.com/olavofranzin/phi.git
cd phi
git checkout claude/webview-metricas-clientes-lxps0l

# atualizações futuras
git pull
```

## Passo 3 — Configurar o segredo (backend)

```bash
cd webview/server
cp .env.example .env
nano .env   # cole os valores
```

No `.env`:
- `GCP_SA_KEY=` → cole o **conteúdo do JSON inteiro** em uma linha
  (com aspas simples ao redor; mantenha os `\n` do `private_key` como estão no
  arquivo). Ex.: `GCP_SA_KEY='{"type":"service_account",...,"private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"phi-workflow-sa@..."}'`
- `BQ_BILLING_PROJECT=phi-production-488720`
- `BQ_DATA_PROJECT=project-0e7c58d4-656f-49e8-807`
- `PORT=8080`

> O `.env` já está no `.gitignore` — não vai para o repositório.

## Passo 4 — Build do front + instalar backend

```bash
# na raiz de webview/
cd ~/phi/webview
npm install
npm run build          # gera webview/dist/

cd server
npm install            # instala express
```

## Passo 5 — Subir o servidor

```bash
cd ~/phi/webview/server
node --env-file=.env index.js      # Node 20.6+ lê o .env nativo
# deve logar: PHI webview server on :8080 (...)
```

Para manter no ar (recomendado), use **pm2**:
```bash
npm i -g pm2
cd ~/phi/webview/server
pm2 start index.js --name phi-webview --node-args="--env-file=.env"
pm2 save && pm2 startup   # reinício automático no boot
```

## Passo 6 — Expor com domínio/HTTPS (nginx)

Aponte um domínio/subdomínio (ex.: `phi.suaagencia.com.br`) para o VPS e faça
um proxy reverso para a porta 8080:

```nginx
server {
  server_name phi.suaagencia.com.br;
  location / { proxy_pass http://127.0.0.1:8080; proxy_set_header Host $host; }
}
```
Depois rode `certbot --nginx` para o HTTPS.

---

## Passo 7 — Validar (cliente KIL de referência)

1. **Descobrir colunas reais** (uma vez):
   ```
   https://SEU-DOMINIO/api/phi-snapshot?debug=1
   ```
   Isso lista as colunas de `phi_score_current` e `raw_campaign_data`.
2. Se os nomes diferirem dos candidatos, ajuste **um** objeto:
   `webview/server/index.js` → constante `COLS` (cada campo aceita uma lista de
   nomes possíveis; basta acrescentar o nome real). `git commit` + `git pull` no
   VPS + `pm2 restart phi-webview`.
3. Abra o webview → **Campanhas** → localize a campanha KIL
   (`GADS-21149189736`) e confira o **score** contra `phi_score_current`.
4. Guardrail: campanha com `conversions = 0` deve mostrar **CPA/ROAS = N/D**.

## Solução de problemas

- `/api/health` → `{"ok":true,"hasSecret":false}` ⇒ o `.env`/`GCP_SA_KEY` não foi
  carregado (rode com `--env-file=.env` ou confira o pm2).
- `/api/phi-snapshot` retorna 502 com mensagem ⇒ leia a mensagem: pode ser
  permissão da service account, projeto de billing errado, ou nome de coluna.
- Tela mostra erro/carregando eterno ⇒ o backend está devolvendo erro; use
  `?debug=1` e o `/api/health` para diagnosticar. O front nunca inventa dados.
