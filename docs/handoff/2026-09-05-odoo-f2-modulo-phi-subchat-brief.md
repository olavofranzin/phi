# Brief do sub-chat — F2: módulo custom PHI no Odoo (`phi_crm`)

> **Para quem abre o sub-chat:** este documento é o **contexto completo** para construir o módulo
> custom do CRM no Odoo. Você NÃO precisa juntar mais nada — as fontes estão listadas no §8.
> **Modelo recomendado:** Opus (é código Python + XML de views; precisa cuidado).
> **Branch de trabalho:** `claude/consolidacao-2026-08` (frente comercial). Módulo versionado em
> `docs/comercial/odoo/addons/phi_crm/`.
> **Idioma com o Olavo:** português simples. **Antes de mudança grande, explicar o plano e esperar OK.**

---

## 0. Onde estamos (F1 concluído — realidade do servidor)
- **Odoo 19 Community** rodando, **instalado por TEMPLATE do EasyPanel** (⚠️ **NÃO** pelo
  `docs/comercial/odoo/docker-compose.yml` — esse arquivo está **obsoleto**, mantido só como histórico).
- **Banco:** `phi_crm`, em Postgres separado (serviço EasyPanel `crm_odoo-db`, usuário `odoo`).
- **URL:** `https://crm.franzcomunicacao.com` (HTTPS pelo EasyPanel). App **CRM** já instalado.
- **Segurança:** senha-mestra forte; gerenciador de bancos com redirecionamento (o `list_db=False`
  "de verdade" ficou pendente — fazer via `odoo.conf`, NÃO pelo campo Command, que quebra o boot).
- **Backup:** diário da VPS (Hostinger).

## 1. Objetivo do F2
Criar o **módulo `phi_crm`** que:
1. **Estende `crm.lead`** com os campos **GBP/IA** (scoring + textões de diagnóstico).
2. Cria o **pipeline dos estágios** (crm.stage) com os critérios de entrada/saída.
3. Coloca no **formulário do lead** um **grupo "card"** (só números/enum/bool) + uma **aba
   "IA / Diagnóstico"** (textões).
Tudo versionado em git; instalado no Odoo.

## 2. ⚠️ Passo 0 — entregar o módulo no template (resolver ANTES de codar demais)
Como foi instalado por **template**, o módulo custom **não viaja sozinho** (não há git-deploy). É
preciso montar um caminho de addons e colocar os arquivos lá:
1. No serviço Odoo (EasyPanel) → **Mounts** → montar um **volume/bind** em **`/mnt/extra-addons`**
   (persistente). Confirmar que o `addons_path` do Odoo inclui `/mnt/extra-addons` (a imagem oficial
   já inclui por padrão — validar no log de boot).
2. **Colocar os arquivos do módulo** dentro desse caminho. Opção mais simples: **bind-mount** para
   uma pasta no host da VPS e `git clone`/`git pull` do repo `phi` nessa pasta (ou copiar só
   `docs/comercial/odoo/addons/phi_crm`).
3. No Odoo: **Modo Desenvolvedor → Apps → Atualizar Lista de Apps → instalar "PHI CRM"** (ou
   reiniciar o Odoo com `-u phi_crm`).
> **Confirmar com o Olavo** as opções de Mount que o template oferece antes de decidir o caminho de
> entrega. Este passo é logística de infra; o código do módulo é independente e pode ser escrito já.

## 3. Estrutura de arquivos (proposta)
```
docs/comercial/odoo/addons/phi_crm/
├── __init__.py
├── __manifest__.py            # name, version '19.0.1.0.0', depends ['crm'], data [...]
├── models/
│   ├── __init__.py
│   ├── crm_lead.py            # _inherit = 'crm.lead'  → todos os campos GBP/IA
│   └── res_partner.py         # (opcional) fit/ICP na Empresa
├── views/
│   └── crm_lead_views.xml     # herda a form view: grupo "card" + aba "IA / Diagnóstico"
├── data/
│   └── crm_stage_data.xml     # os estágios do pipeline (Ganho com is_won=True)
└── security/
    └── ir.model.access.csv    # só se criar modelos novos (extensão pura não precisa)
```

## 4. Dicionário de campos → tipos Odoo
> **Dono** = quem escreve: **IA** (via n8n/F3), **HUM** (pessoa), **SIS** (Odoo/nativo).
> Convenção de nomes: `snake_case`, prefixo por domínio (`gbp_` scoring, `ia_` textões).

### 4.1. Governança do ciclo
| Campo (sugerido) | Tipo Odoo | Dono | Observação |
|---|---|---|---|
| *(lifecycle)* | — | SIS | No Odoo o "lifecycle" É o **estágio** (`stage_id`). Não criar campo à parte. |
| `lead_status` | Selection (`novo/aceito/em_cadencia/reciclado`) | HUM | nuance do SAL/cadência (sem nativo equivalente) |
| *(origem)* | nativo `source_id`/`medium_id` (utm) | SIS | usar nativo |
| *(data de virada de estágio)* | nativo `date_last_stage_update`, `day_open`, `day_close` | SIS | base de Cycle Time |
| `motivo_rejeicao_mql` | Selection (`fit_fraco/timing/fora_icp/sem_orcamento/duplicado`) | HUM | fecha MQL→SAL |
| *(motivo de perda)* | nativo `lost_reason_id` (crm.lost.reason) | HUM | usar o **Lost** nativo do Odoo |
| `data_primeiro_contato` | Datetime | SIS/IA | mede Speed to Lead |
| `tentativas_contato` | Integer | IA/SIS | cadência ≥8 |
| `proxima_acao_data` | Date | IA/HUM | anti-stall |
| *(owner)* | nativo `user_id` | SIS/HUM | responsável |

### 4.2. Scoring GBP (o "card" — só número/enum/bool)
| Campo | Tipo Odoo | Dono |
|---|---|---|
| `gbp_potencial_comercial` | Integer (0–100) | IA |
| `gbp_oferta_recomendada` | Selection (`SVC-GBP/SVC-SITE/SVC-ADS/SVC-IA`) | IA |
| `gbp_ipc` | Integer/Float | IA |
| `gbp_score_tecnico` | Integer | IA |
| `gbp_dim_saude`,`gbp_dim_seo`,`gbp_dim_autoridade`,`gbp_dim_conversao`,`gbp_dim_engajamento`,`gbp_dim_conteudo` | Integer (0–100) | IA |
| `gbp_nao_reivindicado` | Boolean | IA |
| `gbp_site_tipo` | Selection | IA |
| `gbp_flags_score` | Char | IA |
| `proxima_acao_aceite` | Selection (`pendente/aceita/rejeitada`, default `pendente`) | **HUM** ← o "play" |

### 4.3. Diagnóstico por IA (aba "IA / Diagnóstico" — textões)
| Campo | Tipo Odoo | Dono |
|---|---|---|
| `ia_analise_gbp`,`ia_analise_site`,`ia_analise_instagram` | Text | IA |
| `ia_abordagem_sugerida`,`ia_proxima_acao_recomendada` | Text | IA |
| `ia_dados_enriquecimento` | Text (JSON) | IA |
| `followup` | Text | HUM |

> **Bandas das dimensões (apresentação):** forte ≥70 / médio 40–69 / fraco <40 — valor sempre
> visível (widget/decoration). **Card = só número/enum/bool; texto longo só na aba.**

## 5. Estágios do pipeline (crm.stage)
Criar via `data/crm_stage_data.xml` (mapeiam a estratégia do guia §3/§4):
1. **Prospectado** (entrada) — Known Lead
2. **Diagnosticado** — MQL (PHI preencheu potencial/oferta/NBA)
3. **Aprovado p/ Abordagem** — SAL (`proxima_acao_aceite = aceita`) — dispara SLA ≤5 min
4. **Em Qualificação** — SQL (BANT/MEDDIC)
5. **Proposta** — Oportunidade (line items SVC-*)
6. **Ganho** — `is_won = True`
> **Ajuste de idioma Odoo:** "closedlost" NÃO vira estágio. Usar o mecanismo **Lost nativo**
> (`lost_reason_id` + arquivar). Só o **Ganho** é estágio (`is_won`).
> **Critérios de saída (guia §6):** usar o campo `requirements` do crm.stage como **orientação**;
> gating rígido "não move sem preencher" é opcional (via constraint) — decidir com o Olavo, mantendo
> leve (mover é ato humano).

## 6. Guardrails (não-negociáveis — CLAUDE.md + guia §7)
- A IA **preenche campos**; **mover estágio e fechar é HUMANO**. **Nunca** escrever won/lost automático.
- `proxima_acao_aceite` é **o play do humano** (default `pendente`).
- **Um dono por campo** — campos GBP/IA escritos só pelo pipeline PHI (F3, via API); campos de
  qualificação/negociação, só pelo humano. Nada de dois workflows no mesmo campo.
- **N/D honesto:** score ausente ≠ 0. ⚠️ Odoo Integer não tem "nulo" (vira 0). **Decisão de design a
  tomar no sub-chat:** ou (a) o writer só grava quando há valor + exibir "N/D" via computed, ou (b)
  um Boolean companheiro `..._tem_valor`. Não forjar 0.
- **Deals fechados são imutáveis** para a IA.

## 7. Verificação (antes de fechar o F2)
1. Módulo instala **sem erro** (checar log do Odoo).
2. Campos aparecem na form do lead: **grupo "card"** (números/enum/bool) + **aba "IA / Diagnóstico"**
   (textões).
3. Os **6 estágios** aparecem no pipeline; **Ganho** marcado como won; **Lost** funciona pelo botão nativo.
4. `proxima_acao_aceite` nasce `pendente`; nenhum campo com dois donos.
5. Descrever como testar cada item (CLAUDE.md: sempre dizer como verificar).

## 8. Fontes (ler no início do sub-chat)
- **Dicionário de campos + estágios:** `docs/comercial/guia-formatacao-crm.md` (§3–§7) ← principal.
- **Mapa HubSpot→Odoo + plano de fases:** `docs/comercial/decisao-substituicao-crm-hubspot-para-odoo.md`.
- **Apresentação card vs aba:** `docs/comercial/card-gbp-record-spec.md` (se presente).
- **Docs Odoo 19:** via Context7 (`/odoo/odoo`, branch 19.0) — `crm.lead`, `crm.stage`
  (`is_won`, `requirements`, rotting), herança de views, tipos de campo. **Validar na fonte**, não chutar.
- **Guardrails gerais:** `CLAUDE.md`.

## 9. Fora de escopo do F2 (não fazer aqui)
- **F3** (integração n8n↔Odoo / API que escreve os campos) — é a próxima fase.
- **F5** (migração de dados do HubSpot).
- Nada de ativar workflow n8n / gastar token sem OK de budget do Olavo.
