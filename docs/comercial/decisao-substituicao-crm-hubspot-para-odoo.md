# Decisão: substituir o CRM — HubSpot Free → Odoo Community (self-hosted)

> **STATUS:** PROPOSTA (aguarda decisões de infra do Olavo — §7). Registro da decisão de trocar o
> CRM e o **plano de migração**. **Nada provisionado.**
> **Fonte:** análise anexa `analise_odoo_crm_hubspot_instalacao_integracoes.md` (04/09/2026) +
> a nossa formatação de CRM (`guia-formatacao-crm.md` + passo-a-passo) + os 2 docs estratégicos em `prospecção/`.

---

## 1. Análise do documento (o que ele conclui)
O documento compara **HubSpot Free × Odoo One App Free × Odoo Community self-hosted** e conclui:
para uma operação de **prospecção local** que precisa de **campos próprios (ICP/score/oferta),
n8n bidirecional, WhatsApp oficial, e-mail e BI próprio**, a base mais flexível é o **Odoo Community
self-hosted** — com a contrapartida de assumir **infra** (servidor, segurança, updates, backups,
entregabilidade de e-mail).

**Veredito para o nosso caso: encaixa.** É exatamente o perfil do PHI Comercial. E mais: resolve as
**paredes do HubSpot Free** que documentamos ontem —

| Dor no HubSpot Free (documentada) | No Odoo Community |
|---|---|
| Campos personalizados limitados | **Sem limite técnico** (campos via módulo/Studio-equivalente) |
| Sem workflows (SLA/rotação/auto-fill nativo = Pro) | **Automação nativa** + n8n bidirecional |
| Aba rica no registro / App Card = Pro | **Formulário nativo** renderiza o diagnóstico GBP sem tier |
| BI/velocidade avançada = Pro | **Acesso ao Postgres** → Metabase/Superset |
| 1 pipeline, 2º = Starter+ | **Múltiplos pipelines** |
| n8n restrito por plano | **API/webhooks/DB com controle total** |

> Ou seja: quase todos os "contornos Free" do passo-a-passo **deixam de ser necessários**. A troca
> **simplifica** a frente comercial em vez de complicar.

**Trade-offs honestos (a assumir):** vira responsabilidade nossa a **infra** (VPS/containers,
HTTPS, updates), a **entregabilidade de e-mail** (ESP externo + SPF/DKIM/DMARC + aquecimento) e
**backup/restauração** (pg_dump + filestore + cópia externa testada). Não é "só usar CRM".

---

## 2. O que CARREGA da nossa formatação (é agnóstico de plataforma)
Tudo o que desenhamos no `guia-formatacao-crm.md` **vale** — só muda o "onde":
- **Ciclo de vida de 7 estágios** + critérios de entrada/saída → viram **estágios do pipeline Odoo**.
- **Governança/SLAs** (Speed to Lead ≤5min, aceite MQL ≤24h, cadência ≥8) → agora **executáveis via
  automação Odoo/n8n** (não mais "processo manual" do Free).
- **Sincronia IA↔CRM** (auto-fill, scoring, NBA, enriquecimento) → n8n escreve direto no Odoo via API.
- **Campos GBP/IA** (potencial_comercial, ipc, oferta_recomendada, dim_*, textões, `proxima_acao_aceite`) →
  campos custom no modelo `crm.lead`/`res.partner`.
- **Produtos SVC-*** → produtos do módulo Vendas.
- **Guardrail-mãe:** IA diagnostica/recomenda, humano dá o play — **inalterado**.

## 3. Mapa HubSpot → Odoo (conceitos)
| HubSpot | Odoo |
|---|---|
| Deal | `crm.lead` (lead/oportunidade) |
| Contact / Company | `res.partner` (com `company_type`) |
| Deal stage | estágio de `crm.stage` (por equipe/pipeline) |
| Lifecycle Stage | campo próprio ou estágio; SAL vira estágio real (sem gambiarra de Lead Status) |
| Propriedade custom | campo custom em módulo Python (versionado em git) |
| App Card GBP | **view/form nativo** do lead (sem limitação de tier) |
| Workflow (Pro) | Ações automatizadas Odoo + n8n |
| Produtos SVC | `product.template` |

---

## 4. Arquitetura-alvo (do documento, adaptada)
```
VPS/host (4 vCPU / 8 GB / 80 GB NVMe) — ou easypanel atual (já roda o n8n)
├── Traefik/Nginx (HTTPS, proxy)
├── Odoo Community (CRM + Sales + Website/Form + módulo custom PHI)
├── PostgreSQL (dado + acesso p/ BI)
├── n8n (já existe — integrações bidirecionais)
├── ESP externo (SES/Mailgun/Brevo/SendGrid) — e-mail
└── Backup externo (pg_dump + filestore → bucket)
```
> **Recomendação pragmática (CLAUDE.md: solução mais simples):** hospedar o Odoo no **easypanel que
> já roda o n8n** (`1unqx7.easypanel.host`) em vez de uma VPS crua com Docker Compose à mão — o
> easypanel já cuida de proxy reverso/HTTPS/deploy, reduzindo o peso de DevOps do §1. Avaliar recursos.

## 5. Plano de migração em fases
- **F0 — Decisões (§7).** Hospedagem, versão Odoo, ESP, domínio de e-mail, caminho WhatsApp, quem administra.
- **F1 — Infra.** Subir Odoo + Postgres + Traefik/HTTPS + backups (easypanel ou VPS). Smoke de acesso.
- **F2 — Modelagem do CRM.** Pipeline dos 7 estágios + times/permissões + **módulo custom PHI** com os
  campos GBP/IA (versionado em git) + view do diagnóstico no form do lead.
- **F3 — Integração n8n↔Odoo.** Eventos Odoo→n8n (webhook) e n8n→Odoo (criar/atualizar lead, score,
  atividade, mover estágio). **Reaproveita os writers PHI** (e casa com o sub-chat de simplificação).
- **F4 — E-mail + WhatsApp.** ESP + SPF/DKIM/DMARC + subdomínio; WhatsApp Cloud API/BSP oficial.
- **F5 — Migração de dados.** Exportar do HubSpot (deals Niti `60040868935` / Clínica Guerra
  `60039196744` + 21 campos + histórico) → importar no Odoo. Validar.
- **F6 — BI.** Metabase/Superset lendo o Postgres (Cycle Time, Pipeline Velocity, Stall Rate).
- **F7 — Cutover.** Rodar em paralelo, validar, **desligar o HubSpot**.

## 6. Impacto nos docs que já fizemos
- `guia-formatacao-crm.md` → o **conteúdo estratégico continua**; a camada "HubSpot/Free" vira anexo Odoo.
- `guia-formatacao-crm-passo-a-passo.md` (HubSpot Free) → **congelar como referência histórica** (os
  contornos de Free deixam de ser necessários no Odoo).
- `card-gbp-record-spec.md` → o card GBP passa a ser **view nativa do Odoo** (adeus Camada A/B e tier).
- **Simplificação de writers** (sub-chat) → o destino passa a ser **Odoo**, não o HubSpot; a decisão de
  writer canônico agora inclui "quem escreve no Odoo".

## 7. Decisões (2026-09-04)
1. ✅ **Modelo Odoo:** **Community self-hosted** (decidido).
2. ✅ **Onde hospedar:** **easypanel atual** (`1unqx7.easypanel.host`, junto do n8n) — decidido.
   Pré-check: confirmar recursos livres (Odoo confortável em ~4 GB RAM; +Postgres).

**Ainda abertas (não bloqueiam F1):**
3. **Versão do Odoo** (recomendo **18**; 19 já existe). *A confirmar.*
4. **ESP de e-mail** (SES / Mailgun / Brevo / SendGrid / Postmark).
5. **Domínio/subdomínio** de envio + quem controla o DNS.
6. **Caminho WhatsApp** (Cloud API direta vs BSP — Take Blip/Zenvia/360dialog/Twilio).
7. **Quem administra a infra** (você / eu preparo os artefatos em git / parceiro).
8. **Orçamento** (VPS/easypanel + ESP + eventual BSP).

## 8. O que eu posso adiantar sem infra (com seu OK)
- Escrever o **módulo custom PHI** (campos GBP/IA + views + pipeline) versionado em git (F2), pronto pra instalar.
- Escrever o **Docker Compose / template easypanel** do Odoo+Postgres (F1) como artefato.
- Desenhar a **integração n8n↔Odoo** (contratos de webhook + chamadas API) (F3).

## 9. Âncoras
- Análise: `analise_odoo_crm_hubspot_instalacao_integracoes.md` (anexo, 04/09/2026).
- Formatação: `guia-formatacao-crm.md` · `guia-formatacao-crm-passo-a-passo.md` · `card-gbp-record-spec.md`.
- Estratégia: `prospecção/Plano de Alinhamento...md` · `prospecção/Roteiro Estratégico...md`.
- Infra existente: n8n self-hosted `n8n-n8n-editor.1unqx7.easypanel.host`.
