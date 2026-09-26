# F3 — o vigia de consistência: relatório da volta 2 (CONSTRUÍDO E PUBLICADO)

> ⚠️ **SUPERADO EM PARTE, no mesmo dia.** Onde este relatório diz **`V1 AUSENTE`** e **`V5 parcial por
> falta da API`**, leia a volta 3: a URL da credencial estava errada, foi corrigida, e **as 7
> conferências entraram no ar**. O V3 também mudou (ganhou portão de tráfego pago).
> **Vale:** `docs/handoff/2026-09-26-F3-vigia-volta-3-as-7-conferencias.md` — versão no ar: `8c19e88f`.

| | |
|---|---|
| **Data** | 2026-09-26 |
| **Resultado** | ✅ **PUBLICADO E ATIVO.** 6 das 7 conferências no ar · V1 ausente por infraestrutura |
| **Workflow** | `PHI - Vigia de Consistencia dos Dados` — `JMgc0HdLPOFPnFYb` |
| **Prova de publicação** | `versionId == activeVersionId == 2cf47d9d-0cb2-4334-bc3e-6b5fe418b691`, `active: true`, 6 nós |
| **Volta** | **2 de 3** |
| **Custo de modelo** | **zero.** Nenhum nó de LLM |

---

## 0. 🔴 A frase única, e ela começa com um erro meu

**O pré-requisito resolveu a contradição do GA4 — e o que ele mostrou foi que a Fase 0 estava certa e
eu estava errado.** O `t28_ga4_landing` **do CLI-4 parou em 06/09 mesmo**, 20 dias. Eu "refutei" isso
na volta 1 porque agrupei `business_date | janela | execution_id` **sem `client_id`**: as cargas de
13/09 e 20/09 que eu vi eram **do CLI-13**, o outro cliente.

> **É o mesmo erro que eu tinha acabado de apontar na volta 1**, em outra roupa. Lá eu contei
> não-nulo e chamei de "tem dado". Aqui agreguei entre clientes e chamei de "em cadência".
> **Agregado esconde exatamente o que um vigia existe para achar.**
>
> **E o CA4 original estava correto.** O chat-mãe trocou um critério bom por causa do meu erro.
> O CA4′ (o `t28_gbp_daily`) também passa — mas quem devia ter passado desde o começo era o CA4.

**A hipótese do chat-mãe também caiu, e por dado:** `defasagem_dias = 1` em **todas** as 15 linhas
medidas. A data do dado e a da carga andam juntas, sempre D+1. **Não existe "a carga acontece e a
data não anda"** neste parque hoje. *Mas a conferência para detectá-la ficou construída* — o V4 pergunta
as duas coisas, e se um dia divergirem ele grita como CRÍTICO.

---

## 1. O pré-requisito: a query que decidiu

**Antes dela, um achado de método:** `ingested_at` **existe** em todas as `t28_*` e nas `raw_*`. Eu não
a tinha visto na volta 1 porque filtrei `INFORMATION_SCHEMA` por padrões de nome e **`%ingest%` não
estava na minha lista**. Listei as colunas por tipo, sem filtro de nome, e ela apareceu (exec **43325**).

**O resultado (exec 43326), por tabela × cliente × janela:**

| tabela | client_id | janela | max **dado** | max **carga** | defasagem |
|---|---|---|---|---|---|
| `t28_ga4_landing` | **CLI-4** | D-7 | **2026-09-06** | 07/09 09:01 | **1** |
| `t28_ga4_landing` | CLI-13 | D-7 | 2026-09-20 | 21/09 09:01 | 1 |
| `t28_ga4_landing` | CLI-4 | D-30 | 2026-07-31 | 01/08 09:02 | 1 |
| `t28_clarity_daily` | **CLI-4** | D-7 | **2026-09-06** | 07/09 09:01 | 1 |
| `t28_campaign` | CLI-4 | D-7 | 2026-09-20 | 21/09 09:01 | 1 |
| `t28_gbp_daily` | CLI-4 | D-7 | 2026-06-21 | 22/06 22:32 | 1 |
| `raw_campaign_data` | CLI-4 | diário | 2026-09-25 | 26/09 07:00 | 1 |

**As duas conclusões:**

1. **A contradição era de granularidade, não de coluna.** Fase 0 e volta 1 leram a mesma coluna; uma
   olhou o cliente e a outra o agregado. **Quem olhou o cliente acertou.**
2. **O V4 nasceu com as duas perguntas** — *carregou?* e *avançou?* — e **por cliente**, que é a
   correção que importa mais.

---

## 2. A chave do n8n: existe, e não funciona

**Testei antes de desenhar o V1, como o brief mandou.** Dois recursos diferentes, mesma resposta:

| Teste | Recurso | Resultado | Execução |
|---|---|---|---|
| 1 | `execution: getAll` (Pipeline_v2) | **404** *"The resource you are requesting could not be found"* | 43327 |
| 2 | `workflow: getAll` | **404**, idêntico | 43330 |

🔴 **Chave inválida daria 401, não 404.** Os dois endpoints do `/api/v1` respondem 404, o que aponta
para **a API pública desabilitada nesta instância** (`N8N_PUBLIC_API_DISABLED`) **ou a URL-base da
credencial errada**. Não consigo distinguir os dois: a URL mora dentro da credencial e eu não leio
segredo — e **não pedi o valor a ninguém, nem vou**.

Tentei confirmar por fora, sem credencial (um 401 provaria a API viva): **a rede do meu contêiner não
alcança o host** — `curl` devolve `000` nos quatro caminhos testados. Então a distinção fica para quem
tem acesso à tela.

**Consequências, exatamente como o brief instruiu (*"escreva no relatório e siga sem o V1"*):**

- **V1 ausente.** E ele é o que pega o defeito de 8 dias. **Continua sendo o buraco mais caro.**
- **V5 voltou a ser parcial** — lê `t28_errors`, então cobre só quem usa o error-handler do T28.
- **V6 NÃO ficou parcial**, e isso é ganho: o `ingested_at` e o `ingestion_step` deram o que a API ia dar.

🔴 **As três limitações vão escritas na própria mensagem diária**, não só neste relatório:

```
Cobertura: V1 AUSENTE - a API do n8n responde 404, nao da para ler execucao.
V5 parcial: cobre so os workflows que usam o error-handler do T28.
V6 olha o writer, nao o relogio.
```

**Parcial silencioso é o modo de falha desta casa. Um vigia que parece cobrir 7 e cobre 6 é pior que
um que não existe** — então a cobertura é parte do alerta.

---

## 3. O que está no ar: 6 nós

```
Todo dia 08h BRT ─┬─► Conferir dados (BigQuery) ──┬─► Juntar as fontes ─► Montar UMA mensagem ─► Avisar no Telegram
                  └─► Clientes ativos (Notion) ───┘
```

| Conferência | Como | Estado |
|---|---|---|
| **V1** — o `Pipeline_v2` chegou ao fim? | — | 🔴 **ausente** (API 404) |
| **V2** — 1 score por campanha? | chave canônica do ADR-38 | ✅ |
| **V2b** — a **view** que a bancada lê multiplica? | `phi_score_current` agrupa **sem `platform`** | ✅ *adição minha, declarada* |
| **V2c** — entrou dado e não saiu score? | herdado do vigia antigo | ✅ |
| **V3** — cliente **ATIVO no Notion** sem score? | lê o cadastro do humano, não o `client_config` | ✅ |
| **V4** — **carregou? e avançou?** por tabela × cliente × janela | `business_date` × `ingested_at` | ✅ |
| **V4B** — campanha com dado nos 7 dias e sem dado ontem | herdado do vigia antigo | ✅ |
| **V5** — erro roteado que terminou verde | `t28_errors` não resolvido | 🟡 **parcial, rotulado** |
| **V6** — **quem** carregou o dado de ontem | `ingestion_step` esperado = `DAILY_ENTRY` | ✅ |
| **V7** — campanha sem `primary_metric_type` | ADR-40 §6.1 | ✅ |

### Três decisões de desenho que não são estéticas

1. 🔴 **O V4 é por cliente.** Um `MAX` por tabela mostra 20/09 e esconde um cliente parado há 20 dias.
   **Foi o meu erro da volta 1 virando regra do código.**
2. 🔴 **Os blocos `_FATO` devolvem linha SEMPRE.** O CA5 fica garantido **na estrutura**, não na boa
   vontade: o nó nunca recebe zero itens, então o ramo nunca morre.
3. **O V6 olha o writer, não o relógio.** Ver §5.2 — os dois relógios da `raw_campaign_data` discordam,
   e eu não construo em cima de relógio que não entendo.

### A expectativa, num lugar só (opção A do §5 do plano)

| janela | tolerância | por quê |
|---|---|---|
| `diario` | 1 dia | o dado de ontem entra hoje |
| `D-7` | 10 dias | o Agregador roda segunda com `business_date` do domingo: na segunda seguinte o atraso chega a 8 |
| `D-30` | 40 dias | janela mensal, fecha no último dia do mês |

| tabela | estado | por quê |
|---|---|---|
| `t28_clarity_daily` | **em_estudo** — lista, não alerta | decisão do Olavo de 26/09: a coleta fica, não há consumidor. Alertar por dado que ninguém usa seria instalar no vigia o defeito que ele combate (M11) |
| `t28_gbp_daily` | **vigiada** 🔴 | **mudei de opinião da volta 1 para cá.** Ela recebeu 1 linha em 21/06 e parou: *recebeu uma vez e parou* **não é** *nunca recebeu*. Tem writer declarado |
| `t28_adset` · `t28_meta_campaign` · `raw_ad_data` | conhecido — lista | zero linhas, sem writer vivo |

---

## 4. Os 9 critérios de aceite, um por linha, com a prova

| # | Estado | Prova |
|---|---|---|
| **CA1** | ✅ | exec **43341**, ambiente controlado: *"Tudo certo. Conferi 12 itens, 12 ok."* — e a execução chegou ao nó do Telegram |
| **CA2** | 🟡 **6 de 7** | V3 e V4 **ao vivo** (exec 43342) · V5, V6, V7 **pelo dado histórico** (exec 43339) · V2 e V2b **sintéticos** (exec 43339) · **V1 ausente** (§2) |
| **CA3′** | ✅ | exec **43339**: o V7 acusa `CLI-13 / meta_ads / 120223097083780450` em 18/09 |
| **CA4′** | ✅ | exec **43342**: `V4 t28_gbp_daily | CLI-4 | D-7: parou de receber, atraso_dado=97`. E o `t28_clarity_daily` aparece no resumo **sem alertar** |
| **CA5** | ✅ | **antes e depois no mesmo workflow.** O código antigo tinha `if (lacunas.length === 0) { return []; }`; o novo devolve 1 item sempre — provado no dia saudável (43341) |
| **CA6** | ✅ | 1 mensagem por execução: uma única chamada ao Telegram, `message_id` 676 e 677 |
| **CA7** | ✅ | as 318 linhas sem cliente **não aparecem**: a `t28_campaign` sai só como CLI-4 e CLI-13 |
| **CA8** | ✅ | `settings.errorWorkflow = "UZ7sIE5cWrrO8xea"` |
| **CA9** | ✅ | conferido **duas vezes**, depois de cada publicação: `98020749` e, na correção final, `versionId == activeVersionId == 2cf47d9d-0cb2-4334-bc3e-6b5fe418b691` |

> 🔴 **Por que publiquei com o CA2 em 6 de 7, e onde isso pode ser discutido:** o §2.5 do brief diz, em
> letra, *"se não funcionar: escreva no relatório e siga sem o V1, não contorne"*. Li isso como
> autorização prévia para exatamente este caso. **Se o chat-mãe discordar, despublicar é uma chamada** —
> mas note que não publicar deixaria no ar o vigia antigo, que **morre calado todo dia saudável**, e um
> rascunho divergente ao lado. **Publicar é o estado menos ruim dos três.**

### O que o vigia disse na estreia (exec 43342)

```
ACORDA:
- V3 CLI-13: ATIVO no Notion e SEM score ontem
- V3 CLI-7: ATIVO no Notion e SEM score ontem
CONSERTA AMANHA:
- V4 t28_ga4_landing | CLI-4 | D-7: parou de receber. atraso_dado=20
- V4 t28_gbp_daily   | CLI-4 | D-7: parou de receber. atraso_dado=97
- V4 t28_ga4_landing | CLI-4 | D-30: atraso_dado=57
- V4 t28_errors      | CLI-13: atraso_dado=26
- V4 raw_campaign_data | CLI-13: atraso_dado=6
- V4B CLI-13 | meta_ads | 120223097083780450: teve dado nos 7 dias e nao teve ontem
Conferi 28 itens: 2 critico(s), 6 de atencao.
```

**Oito achados no primeiro dia, todos verdadeiros.** É o vigia fazendo o trabalho, não falso positivo.

---

## 5. Achados novos, registrados e **não consertados**

### 5.1 🔴 O CLI-7 está ATIVO no Notion e o PHI não o monitora

`RODRIGO VIEIRA CLARA` (CLI-7) tem Status **ATIVO** na DB Clientes e **não aparece em nenhuma tabela do
`phi_prod`** — nem `raw_campaign_data`, nem score. **É o defeito do CHA se repetindo**, que é
literalmente o que o V3 existe para pegar. O V3 o pegou no primeiro dia.

O CLI-13 (`CHARLES AZEVEDO`) também acusa: **ATIVO** no cadastro, campanha `Concluído` na DB Campanhas,
sem dado desde 20/09. **Ou o Status do cliente ou o da campanha está velho.**

### 5.2 🔴 A armadilha nº 5 me pegou, e eu corrigi o artefato

O `CLAUDE.md` desta frente avisa: **`ingestion_step` não é linhagem — é "quem tocou por último", e o
`UPDATE` alheio o sobrescreve.** Meu comentário no nó do V6 afirmava que em 21/09 *"a ingestão diária
não rodou e o outro cobriu"*. **O dado não sustenta isso:** ele não distingue *"não rodou"* de *"rodou
e foi sobrescrita"*.

Corrigi **no nó e na mensagem**, não só aqui — o alerta agora diz as duas leituras possíveis em vez de
escolher uma. O sinal continua valendo (um step inesperado merece olhar); a afirmação, não.

> **É a terceira vez nesta etapa que eu afirmo mais do que medi.** As duas primeiras (contar não-nulo,
> agregar entre clientes) me custaram uma volta. Esta foi pega antes de publicar, por reler o
> `CLAUDE.md` da frente. **A diferença entre as três não foi cuidado: foi ter lido o aviso que já
> estava escrito.**

### 5.3 Dois relógios que discordam na `raw_campaign_data`

Na mesma linha: `ingested_at` = **07:00 BRT** e `execution_id` = `EXEC-DE-20260926030033`, que lido como
`YYYYMMDDHHMMSS` dá **03:00**. Um dos dois está em outro fuso, ou o `execution_id` carrega a hora do
gatilho e o `ingested_at` a da escrita. **Não investiguei** — e é por isso que o V6 olha o `ingestion_step`
e não o relógio. **Construir vigilância sobre um relógio ambíguo seria vigiar com instrumento quebrado.**

### 5.4 Dois clientes sem Status no cadastro

CLI-9 (`MARIAH ACESSÓRIOS`) e CLI-10 (sem nome) têm **Status vazio** — não são ATIVO nem INATIVO. O
vigia os **lista como "não conferido"** em vez de adivinhar, porque vazio nunca é zero (M4).

### 5.5 O `t28_errors` do CLI-13 parou em 31/08, e o do CLI-4 em 20/09

A tabela de erros também tem frescor, e o V4 a vigia. Um rastro de erro que para de chegar não
significa que os erros pararam.

---

## 6. R12 — o que mudei para teste, e a prova de que voltou

| Mudado | Por quê | Estado agora | Prova |
|---|---|---|---|
| nó `TESTE chave n8n` no vigia | provar a chave antes de desenhar o V1 | **removido** | o workflow no ar tem **6 nós**, e nenhum é do tipo `n8n-nodes-base.n8n` |
| consulta do vigia → ambiente controlado | provar o CA1 | **restaurada** | exec **43342** traz `ontem=2026-09-25`, não `AMBIENTE CONTROLADO` |
| consulta do `TMP - A6 BigQuery Audit` | 8 leituras de verificação | fica na última leitura — **é o propósito do artefato** | descrição dele atualizada (R5) |

🔴 **E uma lição de ferramenta que quase me custou a restauração:** a chamada que restaurava a consulta
**e** mudava a descrição **falhou inteira** por causa do limite de 255 caracteres da descrição — e o
`update_workflow` é atômico. **Se eu tivesse confiado no "mandei restaurar", o ambiente controlado teria
ficado no ar.** Só a releitura pegou. É a R13 item 3 na prática: *escreva o que você leu de volta, não o
que você mandou fazer.*

---

## 7. O que eu **não** fiz

- ❌ **Não consertei nada** do §5 — nem o CLI-7, nem o CLI-13, nem a view sem `platform`, nem os relógios.
- ❌ **Não pedi nem transportei o valor da chave** do n8n. Usei só o ID `V70ThVPGl1rho6Gb`.
- ❌ **Não aposentei nem apaguei** o ramo do Clarity: a coleta fica, por decisão de 26/09.
- ❌ **Não mexi em nenhum outro workflow.** O `Pipeline_v2`, o Agregador e o `operador unico` estão intocados.
- ❌ **Nenhum nó de LLM.**
- ⚠️ **O nó `Buscar lacunas de ontem` foi removido, não aposentado pela R5** — mas as duas perguntas dele
  (`SEM INGESTAO` e `SEM SCORE`) **continuam vivas** como V4B e V2c, dentro do mesmo workflow. Não é
  aposentadoria de artefato: é consolidação dentro dele, e está escrita na descrição.

---

## 8. As perguntas que devolvo

### P1 — A API do n8n: desabilitada ou URL-base errada?

**Só quem abre a tela distingue.** Se for a URL da credencial, é edição de um campo. Se for
`N8N_PUBLIC_API_DISABLED`, é variável de ambiente no EasyPanel. **Com isso resolvido, o V1 entra e o V5
deixa de ser parcial** — a volta 3 seria curta.

### P2 — O CLI-7 é cliente de tráfego pago?

Se **sim**, o PHI está com um cliente pago sem monitoramento **agora**. Se **não**, o Status ATIVO no
cadastro está errado e o V3 vai acusar todo dia. **As duas exigem ação de alguém, e nenhuma é minha.**

### P3 — O CA4 original merece uma nota de reabilitação?

Ele estava certo: o `t28_ga4_landing` do CLI-4 **está** parado desde 06/09. Foi trocado por causa do meu
erro de agregação. **O CA4′ passa, então a etapa não depende disso** — mas o registro fica torto se
ninguém escrever que o critério original era bom.

---

## 9. R4 — onde estamos, quanto falta, e o que atualizei

**Onde estamos:** o vigia está **no ar**, fazendo 6 conferências, mandando 1 mensagem por dia, com saída
no dia bom e cobertura declarada no próprio alerta. Ele achou 8 coisas verdadeiras na estreia.

**Quanto falta:** o **V1**, que depende de uma tela (P1). E os 8 achados da estreia, que são de outras
frentes.

**O que atualizei:**

| Artefato | O que mudou |
|---|---|
| `JMgc0HdLPOFPnFYb` | renomeado para `PHI - Vigia de Consistencia dos Dados`, 6 nós, publicado e ativo |
| descrição do workflow | R5: o que faz, e que substituiu o Vigia de Frescor que morria calado |
| `PLANO-F3-vigia-de-consistencia.md` | banner de as-built: construído, com o que ficou diferente do plano |
| `F3-conferencias-sql-e-codigo.md` | marcado como **construído**, com o que mudou do desenho |
| `docs/handoff/2026-09-26-F3-vigia-volta-2-relatorio.md` | este relatório |
| descrição do `TMP - A6 BigQuery Audit` | R5: último uso |
| DB Notion *Registro de Execuções* | linha de encerramento (R3) |
