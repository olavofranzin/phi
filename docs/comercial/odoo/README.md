# Odoo CRM (PHI) — deploy

> ## STATUS 2026-09-05 — F1 no ar, MIGRANDO para deploy por Git
> - Odoo 19 Community no ar em `https://crm.franzcomunicacao.com`, app **CRM** instalado.
> - **Instalação atual:** template do EasyPanel (banco `phi_crm` no serviço `crm_odoo-db`).
> - **Decisão (Olavo, 2026-09-05):** trocar para **deploy por Git via `docker-compose.yml`**
>   deste diretório. Motivo: o F2 precisa que a pasta `addons/` viaje junto com o código —
>   pelo template o módulo não viaja (não há git-deploy) e cada atualização vira trabalho
>   manual. **Não há dado no CRM ainda**, então recriar do zero não custa nada.
> - O `docker-compose.yml` foi **reescrito** (2026-09-05) — ver §"O que estava errado" abaixo.
> - **05/09/2026 17:17 — o compose subiu.** Confirmado no log de boot: Odoo
>   `19.0-20260817` sobre **PostgreSQL 17.11**, conectado como `odoo@db:5432`, e
>   `/mnt/extra-addons` presente no `addons paths` (o módulo `phi_crm` é visível).
>   Falta criar o banco `phi_crm` e instalar os apps.
> - **Backup:** diário da VPS (Hostinger).
> - **Próximo:** F2 — módulo custom `phi_crm`. Brief: `docs/handoff/2026-09-05-odoo-f2-modulo-phi-subchat-brief.md`.

---

## Versões (fonte única — o que vale é o `docker-compose.yml`)

| Componente | Versão | Onde está declarado |
|---|---|---|
| Odoo | **19** (Community) | `docker-compose.yml` → `image: odoo:19` |
| PostgreSQL | **17** | `docker-compose.yml` → `image: postgres:17` |
| Manifesto do módulo | `19.0.1.0.0` | `addons/phi_crm/__manifest__.py` |

⚠️ **Como o deploy é por Git, editar o compose à mão no servidor não adianta** —
o próximo deploy sobrescreve. Versão se troca **no repositório**, com commit.

⚠️ **O nome do volume carrega a major do Postgres** (`odoo-db-pg17`). Isso é
convenção, não enfeite: o diretório de dados é específico da major, e apontar
uma major nova para um volume inicializado por outra **derruba o container na
hora** — `FATAL: database files are incompatible with server`. Aconteceu em
05/09/2026, com `postgres:17` sobre um volume que uma tentativa anterior tinha
inicializado com a 16.

**Ao trocar de major, mudar a tag e o nome do volume juntos, sempre.** Banco
vazio: volume novo e pronto. Com dado: `pg_dump` no volume antigo **antes**, e
restaurar no novo.

---

## Deploy por Git (o caminho atual)

### O que estava errado no compose anterior
Diagnóstico feito lendo o arquivo — os dois primeiros são **fato** (dá para ver no diff);
o terceiro é **hipótese**, não deu para confirmar sem reproduzir:

1. **Corrida de inicialização (fato).** Tinha `depends_on: [db]` puro, que só espera o
   container do Postgres **iniciar** — não espera ele **aceitar conexão**. O Odoo subia
   antes e falhava. Corrigido com `healthcheck` (`pg_isready`) + `depends_on.condition:
   service_healthy`.
2. **Senha em texto no git (fato).** A senha do Postgres estava escrita no arquivo, que
   está versionado. Agora vem de `${DB_PASSWORD}`, e o deploy falha com mensagem clara se
   a variável não existir — em vez de subir com senha vazia e dar
   `password authentication failed`.
3. **`list_db = False` antes da hora (hipótese).** Se o `config/odoo.conf` for montado
   antes do banco existir, a tela de criação some e o Odoo responde "Database not found".
   Isso **parece** falha de conexão com o banco, mas não é. Por isso o mount da conf agora
   é a **Etapa 2**, explicitamente comentado no compose.

> A tentativa mais antiga (apontar o Odoo para o Postgres do painel, cujo superusuário é
> `postgres`) já tinha sido abandonada — por isso este compose sobe o **próprio** banco,
> com o usuário `odoo`.

### Passo a passo

**Etapa 0 — gerar uma senha nova.**
A senha antiga está no histórico do git; considere-a queimada. Gere outra
(`openssl rand -base64 32`) e guarde no gerenciador de senhas.

**Etapa 1 — subir e criar o banco.**
1. EasyPanel → **Create Service → Compose** · Fonte = **Git**
   - Repositório: `git@github.com:olavofranzin/phi.git` (SSH — repo privado)
   - Ramo: `claude/consolidacao-2026-08`
   - Caminho de Build: `docs/comercial/odoo`
   - Arquivo Compose: `docker-compose.yml`
2. **Environment:** `DB_PASSWORD=<a senha da Etapa 0>`.
3. **Domains:** `crm.franzcomunicacao.com` → serviço `odoo` → porta **8069**.
4. Deploy. Conferir no log do serviço `odoo` a linha `addons paths:` — precisa conter
   `/mnt/extra-addons`.
5. Abrir o domínio → criar o banco **`phi_crm`** (nome exato — o `dbfilter` da Etapa 2
   depende disso) → instalar o app **CRM**.
6. Apagar o serviço antigo `crm_odoo-db` e o Odoo do template (libera RAM).

### Domínio: "Service is not reachable" — EM ABERTO

O Odoo sobe e responde na 8069 (confirmado no log), mas o domínio não chega
nele. É **roteamento**, não aplicação.

O que já foi descartado:
- **Não é o `container_name`.** Tentamos `container_name: crm_odoo` em 05/09 para
  casar com o alvo que o painel mostra (`http://crm_odoo:8069/`). O container passou
  a se chamar assim e **o erro continuou**. Além disso, contraria o padrão: o
  repositório oficial [easypanel-io/compose](https://github.com/easypanel-io/compose)
  remove `container_name` e `ports` "to ensure compatibility with the Easypanel
  environment", e o painel avisa que `container_name` "might cause conflicts".
  Revertido — este compose segue o padrão oficial (sem `container_name`, sem
  `ports`, sem `expose`, sem `networks`, sem labels).

O que falta investigar: os campos da caixa de **Domains** do painel para serviço
do tipo Compose — em particular se há um campo que diz **qual serviço interno**
do compose recebe o tráfego.

**Etapa 2 — trancar.**
1. Descomentar a linha `./config/odoo.conf:/etc/odoo/odoo.conf:ro` no `docker-compose.yml`.
2. Commit + push + redeploy.
3. Conferir: abrir `/web/database/manager` deve dar 404/redirect, não a tela de gerenciamento.

### Instalar / atualizar o módulo `phi_crm` (F2)
A pasta `addons/` deste diretório é montada em `/mnt/extra-addons`. Então:
- **Instalar:** Modo Desenvolvedor → Apps → *Atualizar Lista de Apps* → "PHI CRM" → Instalar.
- **Atualizar depois de um push:** redeploy do serviço no EasyPanel (puxa o git de novo) →
  Apps → *Atualizar Lista de Apps* → botão **Atualizar** no módulo.

### Backup (não pular)
`pg_dump` do banco **+** o volume `odoo-web` (filestore) — **os dois** — para fora da VPS,
e **testar a restauração**.

---

## Histórico

> ⚠️ **Tudo daqui para baixo é registro do que foi planejado/tentado antes —
> NÃO é instrução.** As versões citadas (`odoo:18`, Postgres 16) eram o plano da
> Fase 1 e estão **superadas**: hoje valem as da tabela acima. Os passos de
> instalação por template também estão superados pelo deploy por Git.
> Mantido só para não perder o rastro das decisões.

> Artefatos da **Fase 1** do `../decisao-substituicao-crm-hubspot-para-odoo.md`. Sobem o **Odoo 18
> Community + PostgreSQL** no easypanel que já roda o n8n. **Segredos ficam fora do git** (variáveis
> do easypanel). Nada aqui foi provisionado — é o material pronto para o Olavo aplicar.

## Pré-check (antes de subir)
- [ ] Confirmar **recursos livres** no easypanel: Odoo confortável em **~4 GB RAM** + Postgres. Se o
      host estiver apertado (o n8n já consome), avaliar aumentar o plano ou uma VPS dedicada.
- [ ] Ter um **subdomínio** para o CRM (ex.: `crm.seudominio.com`) para apontar no easypanel.
- [ ] Definir os segredos: `DB_PASSWORD` e a **senha-mestra** do Odoo (`admin_passwd` no `odoo.conf`).

## Passos (easypanel)
1. **Criar o serviço** a partir do `docker-compose.yml` (tipo *Compose*) OU dois serviços
   (App `odoo:18` + Postgres) — o que o painel oferecer.
2. **Variáveis de ambiente:** `DB_USER=odoo`, `DB_PASSWORD=<segredo forte>`.
3. **Domínio:** apontar o subdomínio do CRM para a porta **8069** do serviço `odoo`. O easypanel
   cuida do **HTTPS/Let's Encrypt** e do proxy — por isso `proxy_mode = True` no `odoo.conf`.
4. **Volumes persistentes:** garantir que `odoo-db-data` e `odoo-web-data` são persistentes (não
   somem em redeploy).
5. **Subir** e acessar o subdomínio. Criar o banco **uma vez** (nome ex.: `phi_crm`), definir o
   admin. Depois, no `odoo.conf`, travar `list_db = False` + `dbfilter` e **redeploy**.
6. **Instalar o app CRM** (e Sales, se for usar proposta/produtos).

## Segurança mínima (não pular)
- Trocar `admin_passwd` (senha-mestra) — o default do arquivo é placeholder.
- **Postgres nunca exposto** à internet (só rede interna do compose).
- `list_db = False` em produção; `admin_passwd` forte.
- Backup: **`pg_dump` + o volume `odoo-web-data` (filestore)** — os dois — para um bucket externo, e
  **testar restauração**. (Ver checklist §12 do doc de análise.)

## Estrutura
```
odoo/
├── docker-compose.yml     # Odoo 18 + Postgres 16
├── config/odoo.conf       # proxy_mode, list_db, addons_path (segredos = placeholder)
└── addons/                # (F2) módulo custom PHI — campos GBP/IA + pipeline + views
```

## Próximas fases (depois que o F1 subir)
- **F2** — módulo custom PHI em `addons/` (campos GBP/IA, pipeline dos 7 estágios, view do
  diagnóstico no lead). Versionado aqui, instalado no Odoo.
- **F3** — integração n8n↔Odoo (API externa do Odoo + webhooks).
- **F4** — ESP de e-mail + WhatsApp Cloud API/BSP.
- **F5** — migração dos dados do HubSpot.

## ⚠️ Notas de versão
- `odoo:18` é a recomendação (recente + estável). Se preferir **19**, trocar a tag na imagem e
  revisar o manifesto do módulo F2 (`version`). Postgres 16 atende 18/19.

---

## Atualização 2026-09-04 — realidade da VPS (KVM 1, id `1158274`)
- **Deploy pela API do Hostinger (`VPS_createNewProjectV1`) NÃO funciona nesta VPS** — retornou
  **400** (2 tentativas, formatos diferentes). Motivo: o **EasyPanel foi instalado manualmente** e é
  ele quem gerencia o Docker; o recurso de "projeto Docker" do painel Hostinger não está ativo aqui
  (histórico da VM não tem nenhuma ação de Docker). **Conclusão: instalar pelo EasyPanel.**
- **Recursos:** RAM ~2,8 GB usados de 4 GB → **~1,2 GB livre** (apertado; Odoo threaded + Postgres
  ≈ 0,6–1 GB). Disco/CPU folgados. Decidido testar assim mesmo; **se o n8n sofrer, remover o serviço**.
- **Firewall:** nenhum ativo → porta 8069 abre sem mexer.
- **DNS:** `crm.franzcomunicacao.com` → **A** → `72.61.62.203` (a VPS) — criado e confirmado.

### Receita de instalação no EasyPanel (onde o n8n já roda)
1. **Create Service → App** · nome `odoo` · **Image** `odoo:18`.
2. **Create Service → Postgres** (template) — anotar host/usuário/senha/DB gerados.
3. `odoo` → **Environment:** `HOST=<serviço-postgres>`, `USER=<pg user>`, `PASSWORD=<pg senha>`.
4. `odoo` → **Deploy → Command:** `odoo --workers=0 --max-cron-threads=1` (leve, p/ a RAM apertada).
5. `odoo` → **Mounts → Volume** em `/var/lib/odoo` (anexos/filestore — entra no backup).
6. `odoo` → **Domains:** `crm.franzcomunicacao.com` → porta **8069** → o EasyPanel emite o HTTPS
   (Let's Encrypt) sozinho, agora que o DNS resolve.
7. Abrir o domínio → criar o banco (nome ex.: `phi_crm`) + admin → instalar o app **CRM**.
> Rollback: apagar o serviço `odoo` (e o Postgres) no EasyPanel. Vigiar a RAM (métricas via MCP Hostinger).
