# [BRIEF sub-chat] F3 — o vigia de consistência: construção

> **Como usar:** abra um sub-chat **novo** e cole este arquivo como primeira mensagem.
> **Modelo:** Opus · **Repo:** `olavofranzin/phi` · **Branch:** `claude/consolidacao-2026-08`
> **Idioma com o Olavo:** português simples, sem jargão.
> **O papel dele nesta etapa:** 🔴 **ponte entre você e o chat-mãe.** Ele não vai decidir no meio do
> caminho. Se aparecer decisão, **pare e devolva a pergunta** — não escolha por ele.

---

## 0. A etapa, em uma frase

**Estender o `PHI - Vigia de Frescor` para que ele pare de perguntar *"chegou dado?"* e passe a perguntar *"o que eu esperava, aconteceu?"* — 7 conferências, 1 mensagem por dia, e saída visível inclusive quando está tudo certo.**

| | |
|---|---|
| **Plano canônico** | `docs/strategic-planning/saude-digital/PLANO-F3-vigia-de-consistencia.md` — **aprovado pelo Olavo em 21/09.** Leia inteiro antes de qualquer coisa |
| **Workflow alvo** | `PHI - Vigia de Frescor dos Dados` — `JMgc0HdLPOFPnFYb` · **ATIVO**, roda às 08h · ⚠️ estender, **não criar novo** |
| **Custo financeiro** | **zero** — nenhum nó de LLM. BigQuery, n8n e Telegram |
| **Por que agora** | é o **primeiro da fila** desde 24/09; bloqueia a **Fase C** do ADR-38 e o **F5**; e é o único item que não depende de ninguém de fora |

> 🟢 **A condição *"vira brief quando o ADR-39 fechar"*, escrita no cabeçalho do plano, está
> LIBERADA.** Ela era de ordem de fila, e a fila mudou em 24/09. **O vigia não depende do ADR-39:**
> ele só detecta. Aliás, enquanto o ADR-39 não fechar, é esperado que o **V3 continue acusando** —
> *isso é o vigia funcionando*, não falso positivo.

---

## 1. 🔴 As cinco regras desta etapa

| # | Regra |
|---|---|
| **1** | **Você estende um workflow ATIVO.** Vale a **R13** inteira: leia `activeVersion.nodes`, compare `versionId` com `activeVersionId`, e **depois de publicar releia e confirme**. *"Não deu erro"* não é *"está no ar"* |
| **2** | 🟢 **PUBLICAR JÁ ESTÁ AUTORIZADO** — Olavo, 26/09: *"pode publicar quando os 9 critérios passarem"*. **A autorização é condicional: os nove, todos.** Um só que não passe ⇒ **não publique** — relate e devolva |
| **3** | **O vigia avisa; não conserta.** Ele vai encontrar coisa quebrada. **Não conserte nada** — nem a coleta morta, nem o score 3×, nem as linhas sem cliente. Consertar é outro brief |
| **4** | **Nada mudado para teste fica para trás** (R12). Antes de fechar, releia o artefato e confirme que voltou |
| **5** | **Limite de 3 voltas** (R9). Se na terceira o critério não passar, o problema é o plano — devolva ao chat-mãe |

**E a R11 é a razão de este vigia existir.** Leia a tabela dela no `CLAUDE.md` antes de escrever o primeiro nó: **sete casos em que um nó verde fez o contrário do que o nome dizia.** O seu vigia é uma salvaguarda — e *"salvaguarda é código novo em produção e exige o mesmo smoke que a mudança que ela protege"*.

---

## 2. O que construir — as 7 conferências

**A tabela completa está no §4 do plano.** Aqui vão só as **três correções** que entraram depois de o plano ser aprovado. Elas são obrigatórias:

### 2.1 🔴 O V4 precisa de **período esperado por tabela**

O plano escreveu o V4 como *"toda tabela que tem writer declarado recebeu linha?"* — **diariamente.** Metade das tabelas é **semanal**. Do jeito que está, ou grita todo dia para tabela semanal, ou é desligado — **e fica cego justamente para o buraco que motivou esta correção.**

**A expectativa é uma lista explícita no código (opção A do §5 do plano), com o período de cada tabela:**

| Tabela | Período esperado | Estado conhecido em 25/09 |
|---|---|---|
| `raw_campaign_data` | **diário** | ✅ em dia (24/09) |
| `phi_score_history` | **diário** | ✅ em dia (24/09) |
| `t28_campaign` | **semanal** (Agregador, segundas 09h) | ⚠️ 20/09 |
| `t28_ga4_landing` | **semanal** | 🔴 **06/09 — 19 dias de atraso** |
| `t28_clarity_daily` | **semanal** | 🔴 **06/09 — 19 dias de atraso** |
| `t28_adset` · `t28_meta_campaign` · `t28_gbp_daily` | **semanal** | vazias — ver 2.3 |
| `raw_ad_data` | **diário** | vazia desde 30/06 |

**Fonte destes números:** `docs/handoff/2026-09-25-fase0-indice-saude-digital-relatorio.md` §2.3. **Confira antes de usar** (R6) — são de 25/09.

### 2.2 🔴 Toda consulta filtra `client_id IS NOT NULL`

A `t28_campaign` tem **318 linhas sem `client_id`**, com `campaign_id` em padrão de teste (`CMP.CHA.CAMP-10`), dentro de `phi_prod` — **mais que as 304 do cliente real.** Sem o filtro, ou elas entram na conta, ou somem do `GROUP BY` em silêncio. **As duas coisas são ruins.**

### 2.3 Tabela vazia desde sempre ≠ tabela que parou

São dois estados diferentes e o alerta precisa distinguir:

| Estado | Exemplo | Como tratar |
|---|---|---|
| **parou de receber** | `t28_clarity_daily` — recebia, parou em 06/09 | 🔴 **alerta** |
| **nunca recebeu** | `t28_gbp_daily` (cota do GBP) · `raw_ad_data` | 🟡 **listar como conhecido**, não gritar todo dia |

> **Isto é o M4 outra vez:** *"zero nunca é ausência"*. Uma tabela em zero desde o nascimento e uma que morreu ontem **contam a mesma história para um `COUNT`, e histórias opostas para você.**

---

## 3. 🔴 Critérios de aceite — escritos ANTES, como manda a R9

**A etapa só está concluída quando os nove passarem.** Publicado sem prova **não é concluído**.

| # | Critério | Como se prova |
|---|---|---|
| **CA1** | No dia saudável o vigia emite a **linha de prova de vida** | uma execução com tudo certo, e a mensagem no Telegram |
| **CA2** | Cada uma das 7 conferências **pega o seu defeito** | injetar em ambiente controlado **ou** provar pelo dado histórico do dia em que aconteceu |
| **CA3** | 🟢 **V2 acusa o score 3×** — defeito **vivo**, teste de graça | tem de acusar na primeira execução real |
| **CA4** | 🟢 **V4 acusa `t28_clarity_daily` e `t28_ga4_landing`** — segundo defeito vivo | idem. **Se não acusar, o vigia não serve** |
| **CA5** | O vigia **não morre calado**: zero achados ≠ zero itens | ler o nó final e confirmar que ele **sempre** recebe entrada |
| **CA6** | 7 conferências = **1 mensagem** por dia | contar as mensagens de uma execução |
| **CA7** | As consultas **filtram `client_id IS NOT NULL`** | as 318 linhas de teste **não** aparecem em nenhuma contagem |
| **CA8** | O vigia tem `errorWorkflow` apontado | ler `settings` (vale sem publicar — R13 item 4) |
| **CA9** | 🔴 **O que foi publicado é o que está no ar** | reler o workflow **depois** de publicar: `versionId == activeVersionId`, `sameAsDraft: true` |

> 🔴 **O CA3 e o CA4 são o melhor teste que existe, e são de graça: há dois defeitos reais
> acontecendo agora.** Se o vigia não acusar os dois na estreia, ele não serve — e a gente descobre
> no primeiro dia, não em oito.

### 🟢 A autorização de publicação — o que ela cobre e o que não cobre

> **Olavo, 2026-09-26:** *"pode publicar quando os 9 critérios passarem."*

| ✅ Cobre | ❌ **Não** cobre |
|---|---|
| publicar e ativar **este** workflow (`JMgc0HdLPOFPnFYb`) | ativar ou publicar **qualquer outro** workflow |
| depois de os **nove** critérios passarem | publicar com oito. **Não há "quase"** |
| executar manualmente para provar os critérios | qualquer nó de **LLM**, em qualquer lugar |
| — | consertar o que o vigia achar |

🔴 **Se um critério não passar:** não publique, **não adapte o critério para ele passar**, e não
tente contornar. **Relate o defeito e devolva** — é a volta da R9, e são até 3. Na terceira, o
problema é o plano, não a execução.

---

## 4. O que entregar para dizer "concluído"

**Seis artefatos. Faltando um, a etapa não acabou** (R2 e R4).

| # | Entrega | Onde |
|---|---|---|
| **1** | O **workflow estendido, publicado e ativo** | n8n `JMgc0HdLPOFPnFYb` |
| **2** | A **prova de cada CA1–CA9**, uma linha cada, com o número da execução ou o print do dado | no relatório |
| **3** | 🔴 **Relatório de execução** — o que foi feito, o que o vigia achou na estreia, o que **não** foi feito e por quê | `docs/handoff/2026-09-__-F3-vigia-execucao-relatorio.md` |
| **4** | **As-built no plano F3**: banner no topo dizendo que foi construído, a data, e **o que ficou diferente do plano** — o real vence o plano | `PLANO-F3-vigia-de-consistencia.md` |
| **5** | **Descrição do workflow atualizada** (R5): o que ele faz, por que existe, **e o que mudou nesta extensão** | no próprio n8n |
| **6** | **Linha na DB Notion** *"PHI — Registro de Execuções (Sub-chats)"*, ao começar **e** ao encerrar (R3) | Notion |

**E a pergunta da R4, respondida no relatório:** *onde estamos, quanto falta, e o que eu atualizei para provar isso?*

---

## 5. ⛔ Fora do escopo — e não é pouco

**Não construa, não conserte, não investigue:**

- ❌ **Por que Clarity e GA4 pararam em 06/09.** O vigia **avisa**; a causa é outro brief
- ❌ O **score 3×**. O vigia acusa; consertar é outro trabalho
- ❌ As **318 linhas sem cliente**. Filtre; não apague, não investigue
- ❌ O **ADR-39/40**, a **etapa 8 do ADR-38**, o **Agregador**, o **índice de Saúde Digital**
- ❌ Os **21 workflows sem `errorWorkflow`** — trabalho separado e mecânico
- ❌ **Qualquer nó de LLM.** Esta etapa não gasta token de modelo em lugar nenhum

> **Se você encontrar algo grave fora do escopo: escreva no relatório e siga.** Achado registrado vale; achado consertado no meio do caminho quebra o aceite.

---

## 6. Como falar com o Olavo nesta etapa

Ele é **ponte**, não decisor do meio do caminho.

- 🟢 **Nem a pergunta do fim existe mais:** publicar já está autorizado, condicionado aos 9 critérios.
- Qualquer outra decisão que aparecer → **pare, escreva a pergunta com opções e a consequência de cada uma, e devolva ao chat-mãe.** Não decida por ele.
- **Separe o que leu do que deduziu.** Escreva *"deduzo que"* quando for dedução.
- **Discordar do plano é permitido e desejado** (R6): se o dado desmentir o plano aprovado, **pare, não execute, e registre.**
