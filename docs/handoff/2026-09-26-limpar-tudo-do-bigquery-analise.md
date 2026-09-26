# "E se limparmos tudo do BigQuery e subirmos de novo, já limpo?" — análise

| | |
|---|---|
| **Data** | 2026-09-26 |
| **Quem propôs** | **Olavo** |
| **Resposta curta** | 🔴 **Não limpar tudo. Limpar três coisas nomeadas — e só depois de consertar quem as produz** |
| **Por que está escrito** | **R6, corolário 1:** hipótese desmentida se registra. Sem isto, a proposta volta em um mês e o trabalho se repete |

---

## 1. A pergunta certa não é *"o dado está sujo?"* — é *"quem sujou ainda está sujando?"*

**Oito defeitos conhecidos hoje. A limpeza resolve dois, e só até o produtor rodar de novo:**

| # | Defeito | A limpeza resolve? | Por quê |
|---|---|---|---|
| 1 | **318 linhas sem `client_id`** na `t28_campaign` | 🟡 **sim, por ora** | o produtor foi uma rodada de teste. **Se o caminho que as criou ainda existir, elas voltam** |
| 2 | **CLI-13 com dado de meta_ads de teste** | ❌ **não** | 🔴 **o produtor está funcionando certo.** A campanha segue cadastrada; o dado volta na próxima rodada |
| 3 | `t28_gbp_daily` — 1 linha em 97 dias | ❌ **não** | a cota do GBP falha **toda rodada**. Limpo, fica vazio |
| 4 | `t28_ga4_landing` parado há 20 dias | ❌ **não** | é coleta, não é dado velho |
| 5 | Clarity com **zeros** | ❌ **não** | a extração não mede. Limpo, volta zerado |
| 6 | Data-sentinela **2000-01-01** | ❌ **não** | está no código que escreve |
| 7 | `phi_score_current` **sem `platform`** | ❌ **não** | é **definição de view**, não é linha |
| 8 | Os dois relógios da `raw_campaign_data` | ❌ **não** | é regra de escrita |

> ### 🔴 A regra que sai daqui
> **Nunca limpe antes de consertar o produtor — senão você limpa duas vezes.**
> E na segunda, com menos paciência e o mesmo custo.

---

## 2. O que a limpeza destruiria, e não é pouco

| O que se perde | Tamanho | Dá para reconstruir? |
|---|---|---|
| **`raw_campaign_data`** | **495 linhas · 266 dias · desde 01/01** | 🟡 **do Google Ads, provavelmente sim** (backfill). Do resto, incerto |
| **`phi_score_history`** | a série de score | 🔴 **NÃO — e por decisão nossa** |
| **GA4 / Clarity / GBP** | histórico das fontes externas | 🔴 **provavelmente não** — retenção curta, e o GBP nem coleta |
| **A trilha dos defeitos** | as 318 linhas | ❌ **some a prova de quem as escreveu** |

### 🔴 O `phi_score_history` é o argumento que fecha a discussão

**O ADR-003 diz que o score é FATO: não se recalcula `phi_value`, flags nem severidade.**

E a régua mudou desde então — o `primary_metric_type` passou a viajar com a campanha (ADR-40), o motor só calcula CPA, o rebuild do ADR-38 trocou a identidade. **Recalcular a série produziria os números de hoje carimbados com as datas de ontem.**

> **Isso não é uma série limpa. É um passado fabricado** — e um passado fabricado é pior que um passado com buraco, porque o buraco pelo menos se enxerga.

---

## 3. O que mudou desde a última vez que isso foi tentador

**A limpeza era tentadora quando ninguém conseguia distinguir dado bom de dado ruim. Desde hoje, consegue:** o vigia roda às 08h e diz, todo dia, o que está parado, o que nunca chegou e o que é exceção declarada.

**Antes:** limpar era a única forma de saber.
**Agora:** olhar é a forma de saber, e limpar virou o que é — uma operação cirúrgica, com alvo nomeado.

---

## 4. O que eu recomendo limpar — três alvos, não tudo

**Cada um é uma decisão sua, separada, e nenhuma é urgente.**

| # | Alvo | Operação | Pré-requisito |
|---|---|---|---|
| **1** | as **318 linhas sem `client_id`** | `DELETE WHERE client_id IS NULL` na `t28_campaign` | 🔴 **achar e fechar quem as escreveu.** Senão voltam |
| **2** | o **dado de teste do CLI-13** | decisão sua: apagar **ou** manter como exceção declarada (já está assim) | o campo `Tipo` do §5 — senão a exceção continua sendo texto no código |
| **3** | a **data-sentinela 2000-01-01** | corrigir o writer **primeiro**; as linhas antigas só depois | é código, não é dado |

**Antes de qualquer `DELETE`: snapshot da tabela.** Barato, e transforma uma operação irreversível numa reversível.

---

## 5. A prevenção vale mais que as três limpezas

**O dado de teste não é acidente: é padrão.** CLI-13 é o segundo caso; as 318 linhas foram o primeiro; **o cliente-zero da agência será o terceiro** — e esse já está decidido.

**Proposta:** propriedade **`Tipo`** na DB Clientes do Notion — `Real` · `Teste` · `Interno` — porque **natureza de cliente é cadastro, e cadastro mora no Notion** (ADR-010).

| Ganho | |
|---|---|
| o vigia **filtra por campo** | a lista de exceção sai do código |
| cliente de teste novo | custa **zero linha** no vigia |
| o cliente-zero | **nasce marcado**, antes de contaminar qualquer média |

🔴 **E não marcar no `client_id`** (`TST-13`): é a lição do `id_crm` e do `campaign_id` com prefixo — *não grave no nome o que pertence a outro campo*. Custou caro duas vezes.

> **A regra, se aprovada:** **dado criado para teste nasce declarado e com data para sair.** É a **R12** aplicada ao dado em vez da configuração.

---

## 6. A ordem certa, e ela é mais barata que a limpeza

1. 🔴 **Descobrir por que GA4, Clarity e GBP pararam** — é o próximo brief, e é o que trava o F5
2. **Corrigir os produtores** que escrevem errado (sentinela, view sem `platform`)
3. **Criar o campo `Tipo`** — para o lixo novo não nascer
4. **Só então** os três `DELETE` cirúrgicos do §4, cada um com snapshot antes

> **O vigia vai dizer, todo dia, se a ordem está funcionando.** É a primeira vez que a casa pode fazer uma limpeza e **saber no dia seguinte se ela pegou.**
