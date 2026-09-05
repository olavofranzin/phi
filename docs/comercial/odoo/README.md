# Odoo CRM (PHI) — deploy F1 (Community, easypanel)

> ## ✅ STATUS 2026-09-05 — F1 CONCLUÍDO
> - Odoo 19 Community **no ar** em `https://crm.franzcomunicacao.com`; app **CRM** instalado.
> - **Instalado pelo TEMPLATE do EasyPanel** (não pelo `docker-compose.yml` deste diretório, que
>   está **obsoleto**/histórico). Banco `phi_crm` em Postgres separado (serviço `crm_odoo-db`,
>   usuário `odoo`). HTTPS pelo EasyPanel.
> - **Segurança:** senha-mestra forte; gerenciador de bancos com redirecionamento (o `list_db=False`
>   "de verdade" ficou pendente — fazer via `odoo.conf`, **nunca** pelo campo Command, que quebra o boot).
> - **Backup:** diário da VPS (Hostinger).
> - **Próximo:** F2 — módulo custom PHI. Brief: `docs/handoff/2026-09-05-odoo-f2-modulo-phi-subchat-brief.md`.


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
