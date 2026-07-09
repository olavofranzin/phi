# HubSpot C1 — Checklist de setup (campos + produtos)

> **Contexto:** o MCP do HubSpot só cria/edita **registros**, não **schema** (propriedades,
> grupos, tipos de campo). Então os campos abaixo são criados na **UI** (Settings → Properties)
> ou via **API** (private app com `crm.schemas.custom.write`). Colisão já checada no recon
> 2026-07-05 (portal `5633277`) — nenhum destes internal names existe hoje. Aprovado por Olavo
> (C1) em 2026-07-05. `tenant_id` lógico = phi-agencia.

## 1. Grupo de propriedades (Deals)
Criar grupo **"IA / Enriquecimento"** (internal `ia_enriquecimento`) no objeto **Negócio (Deal)**.
Mover para ele os 3 já existentes (`followup`, `dados_enriquecimento`, `proxima_acao_recomendada`) + os 6 novos.

## 2. Migrar 2 campos existentes (Deals) — string → multi-line
Ambos estão vazios (sem risco de perda):
| internal | Ação |
|---|---|
| `dados_enriquecimento` | Field type: **Single-line text → Multiple-line text** |
| `proxima_acao_recomendada` | Field type: **Single-line text → Multiple-line text** |

## 3. Criar 6 campos novos em Negócio (Deal)
| internal name | Label | Tipo (type / fieldType) | Opções |
|---|---|---|---|
| `proxima_acao_aceite` | NBA — Aceite | enumeration / dropdown select | `pendente` (default), `aceita`, `rejeitada` |
| `proxima_acao_aceite_data` | NBA — Data do aceite | datetime / date picker | — |
| `abordagem_sugerida_ia` | Abordagem sugerida (IA) | string / multi-line text | — |
| `analise_gbp_ia` | Análise GBP (IA) | string / multi-line text | — |
| `analise_site_ia` | Análise site (IA) | string / multi-line text | — |
| `analise_instagram_ia` | Análise Instagram (IA) | string / multi-line text | — |

## 4. Criar 1 campo novo em Reunião (Meeting / activity)
| internal name | Label | Tipo | Nota |
|---|---|---|---|
| `transcricao_ia` | Transcrição (IA) | string / multi-line text | onde a IA lê a transcrição da reunião |

## 5. Produtos (via MCP `manage_crm_objects` OU UI Settings → Produtos)
> Tentativa via MCP bloqueada por permissão do harness — aprovar a ferramenta de escrita do
> HubSpot no cliente e eu retento; ou criar na UI. Não duplicar SKUs 1001/1002/1003.
| name | hs_sku | description | serviço |
|---|---|---|---|
| Agentes de IA e automação | 1004 | SVC-IA (catálogo PHI v1) | `SVC-IA` |
| Configuração e gestão do GBP | 1005 | SVC-GBP (catálogo PHI v1) | `SVC-GBP` |

Reuso (não criar): `Gestão de Tráfego Pago` (1001) = SVC-ADS · `WebSite Institucuional` (1003) = SVC-SITE.

## 6. Opção API (se preferir eu automatizar)
Se você criar um **private app** com scopes `crm.schemas.custom.write` (+ `crm.objects.line_items.write` p/ produtos) e me passar o token pela via segura, eu rodo os itens 1–5 via API (`POST /crm/v3/properties/{objectType}`, `PATCH` p/ migração, `POST /crm/v3/objects/products`) com read-back — em vez do trabalho manual. Sem o token, o checklist acima é 100% suficiente para a UI.

## Verificação pós-setup
- `get_properties` (Deal) confirmando os 9 campos no grupo `ia_enriquecimento` + os 2 migrados como textarea.
- `get_properties` (Meeting) confirmando `transcricao_ia`.
- `search_crm_objects` (products) confirmando SKUs 1004/1005.
Depois disso, o **C2** (agente de enriquecimento) fica destravado.
