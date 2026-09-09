---
name: phi-odoo-crm
description: Contrato do CRM do PHI no Odoo — o módulo phi_crm, seus 34 campos com o dono de cada um, os 6 estágios do pipeline, e os guardrails do PHI (a IA diagnostica, o humano dá o play). Use ao escrever ou revisar qualquer integração que leia ou escreva no crm.lead do Odoo (n8n, PROSP-05, PROSP-06), ao alterar o módulo phi_crm ou o layout do lead, ao decidir quem pode escrever num campo, e ao interpretar valor vazio ou zero num campo GBP. Para API e sintaxe do Odoo 19, ver a skill odoo-19-dev.
metadata:
  version: 1.0.0
---

# CRM do PHI no Odoo — contrato

Módulo: `docs/comercial/odoo/addons/phi_crm/` · Instância: `crm.franzcomunicacao.com`
Modelo: **`crm.lead` estendido**. Nunca `res.partner` — lead é sempre lead; empresa
só nasce quando vira cliente.

## Os guardrails — inegociáveis

1. **A IA diagnostica e recomenda; o humano dá o play.** Nenhuma automação move
   estágio, marca ganho ou fecha. `proxima_acao_aceite` nasce `pendente` e **só
   pessoa** muda.
2. **Um dono por campo.** Cada campo diz no `help` quem escreve: `[IA]` (pipeline
   PHI), `[HUM]` (pessoa), `[SIS]` (Odoo). Nunca dois workflows no mesmo campo.
3. **A chave é o `gbp_place_id`. Nome nunca é chave.** Buscar por nome foi o que
   gerou os deals duplicados no HubSpot. O banco tem `UNIQUE`.
4. **N/D honesto.** Dado não observado grava **vazio** — nunca `0`, nunca `false`.
5. **Não recalcular score.** Os `gbp_*` chegam prontos do pipeline.

## Os 6 estágios

| # | Nome | Entra quando | Perdido |
|---|---|---|---|
| 1 | Prospecção | lead no CRM | — |
| 2 | Aguardando Aceite | diagnóstico pronto · SLA 24h | rejeita + `motivo_rejeicao_mql` |
| 3 | Em Cadência | aceite dado · 1º toque ≤5 min | ≥8 tentativas sem resposta → reciclar |
| 4 | **Conversa Aceita** | ele topou a conversa ← 1º compromisso do comprador | sem fit / sumiu |
| 5 | Escopo e Proposta | escopo iniciado | objeção / recusa |
| 6 | Ganho (`is_won`) | contrato assinado | — |

**Perda não é estágio** — usa o botão Perdido nativo (`lost_reason_id` + arquiva).
As etapas 1–3 são pré-contato, nomeadas pelo **estado da relação**; nomear etapa
pela atividade do vendedor é anti-pattern (ver `docs/comercial/prospecção/`).

## Campos por bloco

- **Chave:** `gbp_place_id` (índice + unique, `copy=False`)
- **Marcador:** `gbp_score_atualizado_em` — **vazio = nunca diagnosticado (N/D)**;
  preenchido = os valores GBP são reais, **zeros inclusive**
- **Scoring [IA]:** `gbp_potencial_comercial`, `gbp_oferta_recomendada`, `gbp_ipc`,
  `gbp_score_tecnico`, 6 × `gbp_dim_*` (+ `_banda` computada), `gbp_nao_reivindicado`,
  `gbp_site_tipo`, `gbp_flags_score`
- **O play [HUM]:** `proxima_acao_aceite` (`pendente`/`aceita`/`rejeitada`)
- **Governança:** `lead_status`, `motivo_rejeicao_mql`, `data_primeiro_contato`,
  `tentativas_contato`, `proxima_acao_data`
- **IA (aba, textões):** `ia_analise_gbp`, `ia_analise_site`, `ia_analise_instagram`,
  `ia_abordagem_sugerida`, `ia_proxima_acao_recomendada`, `ia_dados_enriquecimento`,
  `followup` [HUM]

**Nativos reaproveitados, nunca duplicados:** `stage_id` (é o lifecycle), `source_id`/
`medium_id`, `date_last_stage_update`/`day_open`/`day_close`, `lost_reason_id`, `user_id`.

## O zero é sinal — o caso Niti

No lead de referência, `gbp_dim_engajamento = 0` é **o achado crítico** do
diagnóstico, não ausência de dado. Qualquer esquema que apague zeros destrói o sinal
mais valioso. Por isso a ausência é marcada **no conjunto** (`gbp_score_atualizado_em`
vazio esconde o card inteiro), e nunca campo a campo.

## Regra de apresentação

**Card = só número/enum/bool. Texto longo só na aba "IA / Diagnóstico".**
Bandas: forte ≥70 · médio 40–69 · fraco <40 — **o número é sempre visível**, cor
nunca é o único sinal.

## Escrevendo pelo n8n

Nó **Odoo** nativo, recurso **`custom`** (o recurso `opportunity` não expõe campo
customizado). Upsert: buscar por `gbp_place_id` → atualizar se achar, criar se não →
carimbar `gbp_score_atualizado_em`. **Nunca** escrever `stage_id` nem won/lost.

## Verificação antes de fechar qualquer alteração

1. Todo campo do modelo tem par na view
2. Nenhum campo com dois donos
3. Lead novo nasce `pendente`, em `Prospecção`
4. Rodar o writer **duas vezes no mesmo lead não cria um segundo**
5. Um `0` num campo GBP continua aparecendo como `0`
