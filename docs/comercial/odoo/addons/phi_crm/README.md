# `phi_crm` — módulo custom PHI no Odoo 19

Extensão pura de `crm.lead`. **Não cria modelo novo e não tem automação**: só
define campos e layout.

> **Guardrail-mãe do PHI:** a IA diagnostica e recomenda; **o humano dá o play.**
> Nenhuma linha deste módulo move estágio, marca ganho/perdido ou escreve em nome
> da pessoa.

## Instalar

O `docker-compose.yml` deste repositório monta `docs/comercial/odoo/addons` em
`/mnt/extra-addons`, então o módulo já viaja pelo Git.

1. Modo Desenvolvedor → **Apps** → *Atualizar Lista de Apps*
2. Buscar **"PHI CRM"** → **Instalar**

## Atualizar depois de um push

1. Redeploy do serviço no EasyPanel (puxa o Git de novo)
2. Apps → *Atualizar Lista de Apps* → botão **Atualizar** no módulo

Ou reiniciar o Odoo com `-u phi_crm`.

## O que ele entrega

**27 campos novos** em `crm.lead`, cada um com **um único dono** declarado no
`help` — `[IA]` (pipeline PHI, F3), `[HUM]` (pessoa) ou `[SIS]` (Odoo):

- **5 de governança do ciclo** — `lead_status`, `motivo_rejeicao_mql`,
  `data_primeiro_contato`, `tentativas_contato`, `proxima_acao_data`
- **15 de scoring GBP** (o card, só número/enum/bool)
- **7 de diagnóstico por IA** (a aba, os textões)

**8 campos nativos reaproveitados** (não duplicados): `stage_id` (é o lifecycle),
`source_id`/`medium_id`, `date_last_stage_update`/`day_open`/`day_close`,
`lost_reason_id`, `user_id`.

**6 estágios** de pipeline — ver `data/crm_stage_data.xml`.

## Duas decisões de desenho que valem explicação

### N/D honesto — `gbp_score_atualizado_em`

`Integer` no Odoo não tem nulo: "nunca diagnosticado" lê como **0**, igual a um
score real de 0. E o zero real importa — no caso de aceitação da Niti,
`dim_engajamento = 0` **é** o achado crítico. Apagar zeros destruiria o sinal
mais valioso.

Como os 10 campos GBP são escritos **juntos** pelo pipeline, a ausência é do
*conjunto*. Um único marcador resolve, em vez de 10 booleanos companheiros:

| `gbp_score_atualizado_em` | Significa |
|---|---|
| vazio | o PHI nunca rodou → **N/D**. A view esconde o card e mostra um aviso discreto. |
| preenchido | todos os valores GBP são reais, **zeros inclusive**. |

De brinde, vira a auditoria de quando o F3 escreveu.

### Nomes dos estágios

Vêm da pesquisa em `docs/comercial/prospecção/`, que lista como anti-pattern a
etapa nomeada pela **atividade do vendedor** ("Contato feito", "Apresentação") —
a etapa deve virar pelo **compromisso do comprador**.

As etapas 1–3 são **pré-contato** (o comprador ainda não sabe que existimos), por
isso são nomeadas pelo **estado da relação**, não por ação nossa. A virada real
do comprador é a etapa 4.

## Como verificar depois de instalar

| # | O quê | Como |
|---|---|---|
| 1 | Instala limpo | Log do Odoo sem traceback; módulo "Instalado" em Apps |
| 2 | Card e aba | Abrir um lead: grupo "Diagnóstico GBP" + "Governança do Ciclo" + aba "IA / Diagnóstico". **Nenhum texto longo fora da aba** |
| 3 | 6 estágios | CRM → Configuração → Estágios: exatamente 6, na ordem; **Ganho** com *Is Won*; sem resquício de New/Qualified/Proposition |
| 4 | Tooltip | Passar o mouse no nome do estágio no kanban mostra o critério de saída |
| 5 | Perda | Botão "Perdido" pede motivo e arquiva — sem estágio de perda |
| 6 | Default | Lead novo nasce com NBA-Aceite = "Pendente" |
| 7 | **N/D honesto** | Lead novo: card escondido + aviso. Preencher `gbp_score_atualizado_em` e `gbp_dim_engajamento = 0` na mão → o card aparece e mostra **0** (o caso Niti) |
| 8 | Bandas de cor | Pôr 80 / 50 / 20 em três dimensões → verde / âmbar / vermelho, **com o número sempre visível** |

O teste 7 é o que valida o N/D honesto. O teste 8, as bandas.
