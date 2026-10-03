# Plano F3 — o vigia de consistência: fazer o silêncio significar saúde

> 🟢 **CONSTRUÍDO E NO AR — 2026-09-26, volta 3.** `PHI - Vigia de Consistencia dos Dados`
> (`JMgc0HdLPOFPnFYb`), **7 de 7 conferências**, `versionId == activeVersionId == 125b437b`,
> `errorWorkflow` apontado, 8 nós, 1 gatilho às 08h BRT. **Conferido pelo chat-mãe na API, não
> relatado.** Estreia: **0 críticos · 3 atenções, todas reais e todas do CLI-4.**
> Relatório: `docs/handoff/2026-09-26-F3-vigia-volta-3-as-7-conferencias.md`.
>
> **O banner abaixo é da VOLTA 1 e virou histórico** — guardado porque é o registro de por que a
> volta 1 parou.

---

> 🔴 **[HISTÓRICO — VOLTA 1] A CONSTRUÇÃO NÃO OCORREU. NADA FOI PUBLICADO.**
>
> A volta 1 parou **antes do primeiro nó**, porque o dado desmentiu três premissas (R6):
>
> | Premissa do brief | O que o dado diz | Prova |
> |---|---|---|
> | **CA3** — *"o score 3× é defeito vivo, teste de graça"* | **era real em 19/09** (6 linhas para 2 campanhas) e **sumiu até 26/09**: 0 chaves duplicadas em 30 dias · a view devolve 1 linha por campanha · o Notion tem 1 página e 1 score por campanha. **Consertado sem registro** — deduzo: rebuild do ADR-38 | execs **43184**, **43189** + query Notion |
> | **CA4** — *"`t28_ga4_landing` morto desde 06/09, 19 dias"* | **em dia.** Cadência semanal 06/09 → 13/09 → 20/09, `execution_id` crescente. Idem `t28_clarity_daily` | exec **43184** |
> | **V1** — *"ler a execução do n8n"* | **não construível**: nenhuma das 26 credenciais é do tipo `n8nApi`, e não há prova pelo dado (a Fase 3 legitimamente não escreve em dia saudável) | leitura das credenciais |
>
> **`JMgc0HdLPOFPnFYb` está intocado** (`versionId == activeVersionId`, `sameAsDraft: true`), e **não
> foi deixado rascunho divergente**, de propósito.
>
> ⚠️ **O achado nº 1 do relatório da Fase 0 de 25/09 — *"Clarity e GA4 pararam em 06/09 e ninguém
> viu"* — está errado**, e ele repriorizou a fila. Ver §2.2 do relatório.
>
> **Relatório:** `docs/handoff/2026-09-26-F3-vigia-execucao-relatorio.md` (4 perguntas devolvidas)
> **Desenho pronto das 4 conferências construíveis:** `F3-conferencias-sql-e-codigo.md`

| | |
|---|---|
| **Status** | 🟢 **ENTREGUE — 2026-09-26, na volta 3 de 3.** Aprovado em 21/09, brief em 26/09, construído no mesmo dia depois de duas voltas que o dado derrubou |
| **A condição do ADR-39** | 🟢 **LIBERADA em 26/09.** *"Vira brief quando o ADR-39 fechar"* era ordem de fila, e a fila mudou em 24/09. **O vigia não depende do ADR-39** — ele só detecta. Enquanto o 39 não fechar, é esperado que o **V3 acuse**: isso é o vigia funcionando |
| **Critério que atende** | **F3** do `PLANO-ENTREGA-FINAL-PHI.md` · fecha o **D5** do `CONTRATO-PHI.md` · destrava **C3/C4** da Definição de Pronto |
| **Razão que serve** | **R-A** — a qualidade do serviço parar de depender da atenção do Olavo |
| **Posição na fila** | 🔴 **PRIMEIRO** (revisado em 2026-09-24) — ver abaixo |

> 🔴 **Este plano subiu de posição em 24/09, e não por prioridade: por bloqueio.**
>
> | O que ele bloqueia | Desde |
> |---|---|
> | a **Fase C** da etapa 8 do ADR-38 (aposentar o 2º writer de `raw_campaign_data`) | decisão do Olavo, 24/09: *"só quando o vigia existir"* |
> | o **F5** do ponto final (*"rodou 30 dias sem intervenção manual"*) | sem vigia não há como saber se os 30 dias foram limpos |
>
> **E o F1, que estava à frente dele, deixou de poder segurá-lo:** o F1 espera **um cliente novo
> contratar tráfego** — evento externo, sem data —, e o CHA, que era o caso de prova, teve a campanha
> encerrada em 22/09. **Duas frentes paradas à espera de um telefonema.**
>
> **O F3 é o único item da fila que não depende de ninguém de fora.**

---

## 1. O problema, na frase do Olavo

> *"Qualquer outra falha só sei se abrir o Notion e ver alguma incoerência."*

**O único detector de qualidade do PHI é uma pessoa achando estranho.** Funciona com 1 cliente.
Com *"todos os clientes que contratarem tráfego pago"*, não existe.

## 2. R7 — o que já existe, e por que não basta

| Workflow | Pergunta que ele faz | O que ele NÃO pega |
|---|---|---|
| `PHI - Vigia de Frescor` (`JMgc0HdLPOFPnFYb`) | *"chegou dado ontem em `raw_campaign_data` e `phi_score_history`?"* | tudo que não é chegada de dado nessas 2 tabelas |
| `PHI - Alerta de Falha` (`UZ7sIE5cWrrO8xea`) | *"algum workflow quebrou?"* | os que **não quebram** — e os 21 de 26 que não o têm apontado |

> **Os dois existem e funcionam.** O buraco não é falta de vigia: é que **ambos observam eventos**
> (chegou / quebrou) e **nenhum observa expectativas** (*devia ter acontecido → aconteceu?*).

**Decisão de desenho: estender o `Vigia de Frescor`, não criar workflow novo.** Ele já roda às 08h,
já tem a credencial, já fala com o Telegram, e já faz uma pergunta da mesma família. **Criar um
terceiro vigia seria mais um artefato para manter e mais um que pode morrer calado.**

## 3. O princípio do desenho

> ### Vigiar não é perguntar *"o que aconteceu?"* — é perguntar *"o que eu esperava, aconteceu?"*
> Toda vigilância de consistência precisa de uma **expectativa declarada**. Sem expectativa escrita,
> não há como distinguir *"não achei nada"* de *"não havia nada para achar"*.

### 🔴 E a regra que nasce do estrago de 2026-09-18

A checagem de unicidade instalada para proteger o score **matou a Fase 3 por 8 dias**, porque no caso
saudável ela devolvia zero linhas — e zero itens encerra o ramo no n8n.

> **O vigia SEMPRE produz saída.** Mesmo com tudo certo, ele emite *"conferi 6 itens, 6 ok"*.
> **A saída do caso saudável é a prova de que ele rodou.** Um vigia silencioso é indistinguível de
> um vigia morto — e seria a terceira vez que esta casa instala uma salvaguarda que se apaga sozinha.

## 4. As 6 perguntas — cada uma nasceu de um defeito real

| # | Pergunta | Defeito que passou invisível | Custo |
|---|---|---|---|
| **V1** | O `Pipeline_v2` chegou até o **último nó** ontem? 🔴 **lendo a execução do n8n, NUNCA o `workflow_execution_log`** | **Fase 3 morta 8 dias**, verde todo dia | 8 dias sem tarefa aberta |
| **V2** | Cada campanha ativa tem **exatamente 1 score** de ontem? | **score 3× no Notion** | número errado na sua bancada |
| **V3** | Todo cliente **ativo no Notion** aparece no score? | **CHA morrendo no `phi_dev`** | cliente pago e não monitorado |

> ### 🔴 EMENDA PROPOSTA AO V3 — 2026-09-27: o vigia vai gritar todo dia, e isso o mata
>
> **O que mudou hoje:** o Olavo confirmou que **não há cliente de outra métrica entrando agora**, e o
> **CHA (`CLI-13`) é cliente real com Métrica-Mãe CPL** — que o motor do score **não sabe calcular**.
> Logo o CHA **nunca aparece no score**, e o **V3 vai acusá-lo todos os dias, indefinidamente**.
>
> | | |
> |---|---|
> | 🔴 **Por que isso é grave** | **alarme que grita todo dia por caso conhecido para de ser lido.** É a lição da salvaguarda de 18/09 chegando pelo lado mais barato — e desta vez dá para prever antes de doer |
> | ❌ **O que NÃO fazer** | tirar o CHA da conferência à mão, ou baixar a severidade do V3. Isso **esconde** o defeito, e o dia em que um cliente **de verdade** faltar passa igual |
>
> **A emenda (proposta minha, aguarda OK do Olavo):** o V3 deixa de perguntar *"todo cliente aparece?"*
> e passa a perguntar **duas coisas**, sempre com a contagem:
>
> ```
> clientes ativos sem score: <n>
>   por motivo declarado: <m>  (lista nominal + motivo)
>   SEM MOTIVO DECLARADO: <n-m>   ← só isto acorda o Olavo
> ```
>
> **Isto é a Regra Crítica do vazio (R11, nº 5) aplicada ao cadastro:** *se um número pode significar
> "não achei", traga junto a contagem do que casou*. Aqui: **se "0 problemas" pode significar "ignorei
> tudo", traga a lista do que foi ignorado e por quê.**
>
> **O motivo mora no Notion** (decisão do Olavo em 27/09 de que a categorização fica só lá). Dois
> campos, nascidos de decisões diferentes e resolvidos de uma vez:
>
> | Campo na DB Clientes | Para quê | Nasceu de |
> |---|---|---|
> | **`Tipo`** — Real · Teste · Interno | separar quem paga de quem existe para testar | fila de decisões **D-9**, aprovada em 27/09 |
> | **`Fora do índice (motivo)`** | *métrica não suportada · sem campanha ativa · em implantação* — vazio = **é defeito, acorde o Olavo** | a declaração do CPA, 27/09 |
>
> ✅ **E isto responde a objeção do Olavo ao campo `Tipo`** (*"poderá virar mais um item que
> esqueceremos depois"*): **um campo que o vigia lê todo dia às 08h não é esquecível.** Se alguém
> preencher errado, o alarme diverge no dia seguinte. **A garantia contra o esquecimento não é
> disciplina — é ter um leitor automático.**
| **V4** | Toda tabela **que tem writer declarado** recebeu linha **no período esperado DELA**? 🔴 **corrigido em 26/09** | **`raw_ad_data` vazia 3 meses** · **Clarity e GA4 mortos 19 dias** | coleta que ninguém fez |
| ↳ ✅ **V4 — emenda de 29/09, PUBLICADA** (versão `9f443157-8787-444a-9bf0-11d1fd3d7981`, `versionId == activeVersionId`; rollback `125b437b-…`) | **`t28_clarity_daily` SAI da lista de tabelas cobradas.** A porta da Clarity no Agregador fecha (`source_status = 'not_configured'`, zero linhas) porque ela **saiu do índice em 25/09** e **não tem `source_id` por cliente** — medido em 29/09. O V4 só cobra tabela **com writer declarado**, e este writer deixou de ser declarado | se ficar na lista, **o vigia grita todo dia para sempre** — e *alarme que sempre grita é alarme desligado* | ver `ADR-33` (seção 29/09) e `CONTRATO-DE-FONTES-v0` §1.1 |

> ### 🔴 2026-09-28 — O V4 vai ficar quieto sobre o GA4, e **ninguém sabe por quê ele gritou**
>
> **Medido hoje** (diagnóstico das fontes do Agregador, execuções `44023` e `44140`):
>
> | Quando | `t28_ga4_landing` |
> |---|---|
> | **25–26/09** | 24 linhas · 12 datas · **máxima `06/09`** — o V4 acusou, com razão |
> | **28/09, 09h01** | **32 linhas · 2 clientes · 16 datas · até `27/09`** — a rodada semanal escreveu, e os dois nós GA4 voltaram **com sucesso** |
>
> 🔴 **A fonte voltou sozinha. Não houve conserto — ninguém tocou nela.** E o buraco de **06/09 a
> 27/09** (~3 semanas, ~3 rodadas semanais) **não tem causa registrada.**
>
> **Por que isso é problema, e não alívio:**
>
> | | |
> |---|---|
> | **O alarme some amanhã** | o V4 vai parar de acusar o GA4 — e com ele some **o único ponteiro** para o buraco |
> | **O que não sabemos** | por que 3 rodadas seguidas não escreveram, e o que mudou na de hoje. **Credencial? cota temporária? falha dura sem handler?** |
> | 🔴 **E o handler não existia** | o Agregador **ficou sem `errorWorkflow` até 28/09**. Se aquelas rodadas falharam duro, **o aviso não tinha para onde ir** — é a explicação mais provável, e segue **não provada** |
> | **É a terceira vez na semana** | o **score 3×** sumiu sem registro (26/09) · o *"GA4 morto há 19 dias"* foi refutado (26/09) · agora isto |
>
> ### ⚖️ A regra que sai daí — **defeito que some é evento, não é alívio**
>
> **Quando um defeito desaparece sem causa conhecida, o desaparecimento é o que se investiga** — e
> se não for investigado **enquanto o rastro existe**, ele volta e a conta recomeça do zero. É o
> **corolário 1 da R6** pelo lado que ninguém pratica: *hipótese desmentida se registra* vale também
> para *defeito curado sem médico*.
>
> ### ❌ [REFUTADO NO MESMO DIA] O bloco abaixo era MEU e está ERRADO — leia a correção logo depois
>
> **Eu li `lastNodeExecuted: [T28] Filter t28_meta_campaign` e concluí que o ramo tinha morrido ali.**
> **Errado.** Com **seis filtros em paralelo**, `lastNodeExecuted` é só **o último a terminar** — não
> é onde a corrente parou. **A execução `41535` ESCREVEU** (prova: `44156`). Guardo o texto abaixo
> porque ele explica de onde veio o alarme falso, **e o raciocínio errado é a parte que ensina.**
>
> ### 🔴 [HISTÓRICO, ERRADO] RESPONDIDO NO MESMO DIA (28/09) — e a resposta é pior do que "parou"
>
> **Abri a execução `41535` (21/09, rodada semanal) e li os dois nós do GA4. O dado ESTAVA LÁ.**
>
> | Nó, na execução `41535` | Resultado |
> |---|---|
> | `HTTP Request GA4 Orgânico` | ✅ **sucesso, 12 linhas**, datas de **14/09 a 20/09** |
> | `HTTP Request GA4 Pago (LPs)` | ✅ sucesso — **2 linhas** numa passada, e **nenhuma chave `rows`** na outra |
> | **`lastNodeExecuted`** | 🔴 **`[T28] Filter t28_meta_campaign`** |
> | **Status da execução** | 🟢 **`success`** |
>
> **E quatro dias depois, em 25/09, `t28_ga4_landing` ainda tinha data máxima `06/09`.**
>
> ## 🔴 Então o GA4 nunca parou de coletar. A ESCRITA é que não aconteceu — e a rodada terminou verde.
>
> | O que parecia | O que é |
> |---|---|
> | *"a fonte GA4 parou 3 semanas"* | ❌ **a fonte respondeu normalmente** |
> | *"voltou sozinha em 28/09"* | ❌ **nunca esteve fora**; o que mudou foi a rodada ter chegado até a escrita |
> | *"execução com sucesso = dado gravado"* | 🔴 **a execução terminou num `Filter`** — e terminar num filtro é o **fim do ramo**, não o fim do trabalho |
>
> **Isto é o M10 quebrado com prova na mão:** *workflow ativo tem de ter saída observável; verde sem
> produção é o modo de falha desta casa.* É **exatamente** o defeito que matou a Fase 3 por 8 dias —
> `zero itens = fim do ramo`, verde todo dia — **agora no Agregador, e pego pelo vigia**.
>
> ✅ **E é o V4 que entregou isso.** Ele não achou "o GA4 parado": ele achou **uma tabela que não
> recebeu linha** — que é a pergunta certa, porque **não depende de saber onde o caminho se rompe.**
>
> ### 🔴 CORREÇÃO DE 2026-09-28 — a premissa *"verde sem escrita"* caiu
>
> A execução retida `41535` **chegou à escrita**. O filtro entregou 2 itens, o construtor montou o
> `MERGE`, o nó `[T28] BQ Merge t28_ga4_landing` executou, e a consulta de conferência
> (**execução `44156`**) encontrou as duas linhas ainda na tabela:
> `CLI-13` · `2026-09-20` · `EXEC-T28-41535`. A mesma consulta encontrou também 21 linhas em
> `t28_campaign` e 1 em `t28_clarity_daily` com esse `execution_id`.
>
> O que mudou entre as rodadas foi **o primeiro cliente**, não a passagem pelo writer:
>
> | | `41535` — 21/09 | `44023` — 28/09 |
> |---|---|---|
> | primeiro item de `Set dados` | `CLI-13` (sem `id_ga4`) | `CLI-4` |
> | linhas gravadas em `t28_ga4_landing` | 2 para `CLI-13`, data 20/09 | 2 para `CLI-4`, data 27/09 |
> | destinos que escreveram | campaign · GA4 · Clarity | campaign · GA4 · Clarity |
> | destinos sem item no filtro | adset · GBP · Meta | adset · GBP · Meta |
>
> A causa do falso diagnóstico está no **grão**: o `Adaptador Input T28` usa `nodeFirst(...)` para
> `Set dados` e para as respostas GA4 depois que o laço terminou. Em `41535`, associou ao primeiro
> cliente (`CLI-13`) a resposta GA4 coletada nas passadas do `CLI-4`. Em `44023`, o primeiro cliente
> já era o `CLI-4`, então a linha apareceu onde a medição esperava. O
> `[T28] Filter t28_meta_campaign` foi apenas o último dos seis filtros paralelos a executar.
>
> **Conclusão:** o V4 encontrou uma divergência real de frescor por cliente, mas a explicação
> *"coletou e não escreveu"* estava errada. O defeito vivo é **associação ao primeiro item do lote**,
> com risco de atribuir GA4/Clarity e outros contextos ao cliente errado. Nenhum conserto foi
> publicado nesta volta; o desenho precisa preservar o cliente de cada passagem antes de mudar o
> workflow semanal.

> ### 🟢 VOLTA 2 MEDIDA EM 2026-09-28 — passivo e desenho no ADR-33
>
> A assinatura impossível confirmou **6 linhas contaminadas sob `CLI-13`**: 4 em
> `t28_ga4_landing` (13/09 e 20/09) e 2 em `t28_clarity_daily` nas mesmas datas. O Clarity
> devolveu páginas e URLs de `kbbecker.com.br` nas três passagens de `41535`, confirmando que o
> defeito não se limita ao GA4. Campanha, GBP, adset e meta_campaign não acrescentaram linha
> impossível pela peneira barata. O limite ficou explícito: clientes ambos configurados podem ser
> trocados sem serem pegos.
>
> O desenho foi incorporado ao
> `adr-rascunhos/ADR-33-identidade-estavel-item-pipeline-metricas.md`: estender o contrato existente
> com `client_id + source + source_id + janela`, carimbar dentro do loop e casar por chave no
> adaptador. **Nada foi publicado**; o Agregador segue em `c54114b3`.

> ### ⚖️ A leitura do chat-mãe — **isto é pior que dado faltando, e é da família mais cara da casa**
>
> **Dado que falta é visível. Dado no cliente errado parece certo.**
>
> | | |
> |---|---|
> | **O que está na tabela hoje** | 2 linhas de `t28_ga4_landing` com o **GA4 do CLI-4 gravado sob `CLI-13`** (exec `41535`) |
> | **Quem consome isso** | o **Índice de Saúde Digital do Negócio** — o pilar de Experiência sai de `t28_ga4_landing` |
> | **O que aconteceria** | o **CHA receberia nota calculada com o tráfego do KIL**. Ninguém notaria: a nota sai, é plausível, e não há a quem comparar |
> | **De que família é** | 🔴 **identidade** — a mesma do `client_id` vazio (ADR-37), do prefixo no `campaign_id` (ADR-38) e da Métrica-Mãe no grão errado (ADR-40). **É a família que mais custou a esta casa** |
>
> 🔴 **E o mecanismo é o de sempre: `nodeFirst()` pega o primeiro, não o correspondente.** É o mesmo
> vício do `lookupValue` vazio que devolveu a planilha inteira e do filtro sem valor que não cortava
> nada (**R11, regra 1**): **quando falta a chave, o n8n não para — ele escolhe por você.**
>
> ### O que isto exige, e o que NÃO é
>
> | | |
> |---|---|
> | ❌ **Não é** | conserto de um nó no meio da semana |
> | ✅ **É** | decidir **como o cliente viaja junto do dado** dentro do Agregador — as 6 fontes usam o mesmo trecho compartilhado |
> | 🔴 **E tem passivo** | as linhas **já gravadas** com cliente trocado. **Quantas, em quais tabelas, desde quando** — ninguém sabe ainda |
> | ⚠️ **Regra herdada** | o **ADR-38** resolveu identidade **antes** de reconstruir a série. Aqui vale igual: **descobrir o tamanho do passivo antes de reescrever qualquer coisa** |
>
> ✅ **O crédito continua do vigia**, e agora por um motivo melhor: o **V4** perguntou *"esta tabela
> recebeu linha no período dela?"* e, sem saber nada de `nodeFirst()`, **acabou apontando para um
> defeito de identidade que ninguém procurava.**
| **V5** | Algum workflow terminou **verde tendo roteado erro**? | **Agregador na cota do GBP, toda rodada** | 3 de 6 destinos vazios |
| **V6** | O `operador unico` e o `Pipeline_v2` rodaram **na janela esperada**? | (preventiva) | rodada que não aconteceu |
| **V7** | Quantas campanhas ficaram **sem `primary_metric_type`** ontem? | (nova, 21/09 — **ADR-40 §6.1**) | campanha julgada por régua inventada |

> **V7 entrou em 21/09**, vinda do ADR-40: o fallback `|| 'ROAS'` passa a gravar **vazio**, e vazio sem contagem é a terceira cara do vazio da R11. **O F3 ainda estava em plano, então coube sem retrabalho** — é a vantagem de o vigia nascer depois dos defeitos que ele vigia.

**V1 a V5 não são hipóteses: são autópsias.** Cada uma teria detectado um defeito que de fato
> aconteceu e custou dias ou meses. **V6 é a única preventiva** — e é a mais barata de todas.

### O que fica de fora, de propósito

- **Não vigia qualidade de julgamento** (*"o score está certo?"*) — isso é o Score v2 / ADR-34.
- **Não vigia a Prospecção** — outra frente, outro contrato.
- **Não conserta nada.** Vigia avisa; consertar é outro trabalho, com outro brief.

> 🔴 **Por que o V1 não pode ler o `workflow_execution_log`** (achado de 23/09, ADR-38 §25.11.5):
> aquela tabela sofre contenção consigo mesma e **grava `FAILED` em dia que deu certo**. Em 23/09 ela
> diria que a fase Operacional falhou — num dia em que a Abertura rodou pela primeira vez e entregou
> tarefa, checklist e log. **Um vigia que lê um instrumento quebrado repete o defeito com autoridade.**

### 🔴 Correção de 2026-09-26 — o V4 era diário e metade das tabelas é semanal

O V4 foi escrito como *"recebeu linha ontem?"*. **As `t28_*` são semanais** (Agregador, segundas 09h).
Do jeito que estava, ele **gritaria todo dia** para tabela semanal — e seria desligado, ficando cego
para o caso que o motivou.

**Três coisas entram no V4, e estão detalhadas no brief de construção:**

1. **Período esperado por tabela** — diário para `raw_campaign_data` e `phi_score_history`, semanal
   para as `t28_*`.
2. **Distinguir *"parou de receber"* de *"nunca recebeu"*.** ~~`t28_clarity_daily` parou em **06/09**~~
   🔴 **corrigido em 26/09: o Clarity NÃO parou — último dado 20/09, em cadência semanal.**
   `t28_gbp_daily` nunca recebeu de verdade: **1 linha única, de 21/06, há 97 dias** — o que é uma
   **quarta** cara do vazio (não está vazio, então "tem dado?" passa; não está em dia, então frescor
   grita). **Alerta só para quem de fato parou.** É o **M4** de novo: os estados contam a mesma
   história para um `COUNT` e histórias opostas para o Olavo.
3. **Toda consulta filtra `client_id IS NOT NULL`** — a `t28_campaign` tem **318 linhas de teste**
   sem cliente dentro de `phi_prod`.

> **De onde veio a correção:** o sub-chat da Saúde Digital achou, por acaso, que Clarity e GA4
> pararam em **06/09** e ninguém viu — *porque o vigia atual só olha as duas tabelas que estão em dia*.
> Fonte: `docs/handoff/2026-09-25-fase0-indice-saude-digital-relatorio.md` §2.3.

---

## 5. Onde a expectativa mora

Cada pergunta precisa saber **o que esperar**. Duas opções:

| | Opção | Prós | Contras |
|---|---|---|---|
| **A** ⭐ | **No código do vigia**, como lista explícita | simples, versionada no n8n, zero artefato novo | mudar a expectativa exige editar o workflow |
| **B** | Numa **tabela de expectativas** no BigQuery | mudar sem tocar em código | 🔴 **mais uma tabela que pode ficar sem writer** — exatamente o defeito que estamos combatendo |

**Recomendo A.** Seis perguntas não justificam uma tabela, e a **R7** manda preferir a solução mais
simples que resolve. Se um dia forem sessenta, a tabela se justifica — e aí o próprio vigia já terá
provado que funciona.

## 6. Severidade — o que acorda e o que espera

Herdada da **D10** do contrato (*"1 e 3"*):

| Nível | Quais | Como chega |
|---|---|---|
| 🔴 **Acorda o Olavo** | **V2** (número errado na bancada) · **V3** (cliente pago sem monitoramento) | Telegram, imediato |
| 🟡 **Conserta amanhã** | V1, V4, V5, V6 | Telegram, no resumo das 08h |
| ✅ **Prova de vida** | tudo ok | **uma linha no resumo das 08h** — não é ruído, é o recibo |

> ⚠️ **O Olavo disse que "quase nunca chega alarme".** Este plano vai **aumentar** o volume de
> mensagens — e isso é o ponto. Mas o volume precisa caber: **6 conferências viram 1 mensagem por
> dia**, não 6. Se um dia forem 20 conferências, continua sendo 1 mensagem.

## 7. Critérios de aceite — escritos antes (R9)

| # | Critério | Como se prova |
|---|---|---|
| **CA1** | No dia saudável, o vigia **emite a linha de prova de vida** | rodar com tudo certo e ver a mensagem chegar |
| **CA2** | Cada uma das 6 perguntas **pega o seu defeito** | injetar o defeito em ambiente controlado, ou provar pelo dado histórico do dia em que ele aconteceu |
| **CA3** | ~~**V2 detecta o score 3×** que existe hoje~~ 🔴 **REFUTADO EM 26/09** | o defeito **não existe** em `phi_score_history`, na view `phi_score_current` nem no Notion. Nunca havia sido confirmado por query (as-built de 20/09, §L1: *"falta acesso ao BigQuery, 2 queries"*). **O critério está aberto — ver P1 do relatório de 26/09** |
| **CA4** | O vigia **não morre calado**: zero achados ≠ zero itens | ler o nó final e confirmar que ele sempre recebe entrada |
| **CA5** | 6 conferências = **1 mensagem** | contar as mensagens de um dia |
| **CA6** | O próprio vigia tem `errorWorkflow` apontado | ler `settings` (vale sem publicar — R13 item 4) |

> 🔴 **CA3 é o melhor teste que existe**, e é de graça: **há um defeito real acontecendo agora.**
> Se o vigia não acusar o score 3× na estreia, ele não serve — e descobrimos isso no primeiro dia,
> não em oito.

## 8. O que este plano NÃO resolve

- **Não fecha o laço** (*"a orientação funcionou?"*) — isso é o **F7**, e o Olavo o pôs no fim da fila.
- **Não cobre os 21 workflows sem `errorWorkflow`** — apontá-los é trabalho separado e mecânico.
- **Não substitui o Score v2.** Vigiar consistência não é vigiar acerto.

### ✅ Fechamento do passivo de identidade — 2026-10-01

SELECT `45203`: **6** linhas exatas sob `CLI-13`; DELETE transacional `45205`; releitura `45206`: **0**. Totais: `t28_ga4_landing` **38→34** e `t28_clarity_daily` **17→15**. O buraco GA4 de 13/09 e 20/09 permanece declarado até existir backfill; nunca estimar (`S1`). Relatório: `docs/handoff/2026-10-01-agregador-identidade-volta-3-relatorio.md`.
