# Brief — motivos de perda do `phi_crm`

> **Para:** sub-chat do módulo `phi_crm`
> **De:** chat-mãe
> **Data:** 2026-09-17
> **Branch:** `claude/consolidacao-2026-08`
> **Quando:** **depois** da ativação do PROSP-06O. Não interromper.

---

## 1. Por que isto não é cadastro

O `motivo_perda` da planilha vem do `lost_reason_id` do Odoo e é **a base de aprendizado do "por que
a gente perde"**. **A lista de motivos é a taxonomia do aprendizado** — se ela estiver errada, o
pipeline pode funcionar perfeitamente e o dado não ensina nada.

Hoje estão lá os motivos **de fábrica do Odoo**, escritos para um contexto industrial. Não servem
para uma agência que vende gestão de perfil do Google por R$ 500/mês.

## 2. Procurei o que já existe (R7) — e metade do trabalho está feita

**Não há arquivo de motivos no módulo.** O `crm_lead.py` diz, no comentário da linha 57:
*"Motivo de perda = `lost_reason_id` nativo (botão Perdido)"*. Nenhum `data/` define registros.

🟢 **Mas o `data/crm_stage_data.xml` já diz, estágio a estágio, o que é perder ali:**

| Estágio | O que o `requirements` já escreve |
|---|---|
| Prospecção | *"Perdido: não se aplica nesta etapa."* |
| Aguardando Aceite | *"NBA-Aceite = Rejeitada + preencher Motivo da Rejeição (MQL)"* |
| Em Cadência | *"8 ou mais tentativas multi-canal sem resposta → **reciclar** (Status do Lead = Reciclado)"* |
| Conversa Aceita | *"sem fit, ou sumiu (botão Perdido + motivo)"* |
| Escopo e Proposta | *"objeção não superada ou recusa (botão Perdido + motivo)"* |

**A taxonomia se deriva daí, não se inventa.** E há uma distinção que o desenho já fez e que **não
pode ser achatada**: em Cadência, sem resposta é **reciclar**, não perder. Quem juntar as duas coisas
destrói a análise — o gargalo declarado do projeto é *falar com eles*, então "sem resposta" domina
tudo se virar motivo de perda no mesmo balde.

## 3. Proposta de lista — **precisa do OK do Olavo antes de construir**

Agrupada pelo estágio onde a perda acontece, porque **onde se perde ensina tanto quanto por quê**.

**Perde em Cadência (nunca conversamos)**
| Motivo | Quando usar |
|---|---|
| `Sem resposta` | cadência completa, nunca respondeu — **só se não for reciclar** |
| `Contato inválido` | telefone/e-mail não existe ou é de outro negócio |
| `Pediu para não contatar` | opt-out explícito |

**Perde em Conversa Aceita (conversamos)**
| Motivo | Quando usar |
|---|---|
| `Sem fit` | fora da cidade, setor que não atendemos, negócio fechado ou inativo |
| `Sumiu depois de aceitar` | topou conversar e não voltou |

**Perde em Escopo e Proposta (chegou na proposta)**
| Motivo | Quando usar |
|---|---|
| `Preço` | achou caro para o que entrega |
| `Já tem quem faça` | agência, funcionário ou familiar já cuida |
| `Perdeu para concorrente` | comparou e escolheu outro |
| `Não é prioridade agora` | quer, adiou — **candidato a retomada** |
| `Não vê valor no GBP` | não acredita que o perfil traga resultado |

**Os dois últimos pares colam na hora de escolher** (`Preço` × `Não vê valor`, `Já tem quem faça` ×
`Perdeu para concorrente`) — e é por isso que cada um leva definição. São perguntas diferentes: preço
se resolve mexendo na oferta; falta de valor se resolve mexendo na prova.

## 4. As quatro regras de construção

### 4.1 🔴 Nome de motivo é chave de análise — escolher uma vez

A planilha guarda o **nome** do motivo, não o id: o `[P6] So os modificados` faz
`txt(lead.lost_reason_id)`, que devolve `v[1]` do many2one. **Renomear um motivo depois parte a base
em duas** — metade das linhas com o nome velho, metade com o novo, e nada dizendo que são a mesma
coisa.

> É o mesmo erro do `id_hubspot` → `id_crm` e do `campaign_id` com prefixo. **O Olavo aprova os nomes
> antes de existirem.**

### 4.2 Fino é melhor que grosso — e não é simetria

**Dado fino sempre se agrupa na análise. Dado grosso nunca se separa.** Não comece com 4 motivos
"para simplificar": daqui a seis meses ninguém recupera qual `Preço` era na verdade `Não vê valor`.

É a mesma lógica do **I3** (vazio ≠ zero): **não destrua informação na hora de escrever.**

### 4.3 🔴 Arquivar os nativos, nunca apagar

Já existe **pelo menos um lead perdido apontando para um motivo de fábrica** — o Olavo marcou um em
17/09. Apagar o registro quebraria a referência ou apagaria o dado.

**Arquivar (`active = False`) tira da lista sem perder a história**, e o lead antigo continua legível.
É a R5 no nível do dado.

### 4.4 Arquivo de dados versionado, não cadastro na tela

Como o `crm_stage_data.xml`: **os nomes fazem parte da spec, não são preferência editável na tela.**

⚠️ **E leia o comentário no topo daquele arquivo antes de escrever o novo** — ele registra que
`noupdate="1"` foi tentado em 05/09 e **fez o Odoo pular os registros que já existiam**, que era
exatamente o que se queria alterar. A mesma armadilha vale aqui.

## 5. O que fica de fora

- **O "Motivo da Rejeição (MQL)"** do estágio Aguardando Aceite é campo próprio e outra pergunta —
  não vira motivo de perda.
- **O `lead_status = Reciclado`** continua sendo o caminho de quem não respondeu em Cadência. Este
  brief **não muda** essa regra; só cuida do que acontece quando de fato se marca Perdido.
- **A definição de cada motivo não cabe no Odoo** — `crm.lead.lost.reason` só tem `name` e `active`.
  As definições da §3 vivem em documento, e o arquivo de dados aponta para ele em comentário. **Diga
  isso em vez de esconder.**

## 6. O que devolver

1. A lista final **aprovada pelo Olavo**, com os nomes exatos.
2. O arquivo de dados, no padrão do `crm_stage_data.xml`, com o comentário explicando **por que sem
   `noupdate`** e **por que arquiva em vez de apagar**.
3. Confirmação de que os nativos foram **arquivados, não apagados**, e de que o lead perdido de 17/09
   **continua mostrando o motivo antigo**.
4. Onde ficou escrita a definição de cada motivo.
