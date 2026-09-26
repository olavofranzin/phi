# Plano F3 — o vigia de consistência: fazer o silêncio significar saúde

> ✅ **AS-BUILT 2026-09-26 — CONSTRUÍDO E PUBLICADO.** `versionId == activeVersionId == 98020749`
>
> **6 das 7 conferências no ar.** O workflow virou `PHI - Vigia de Consistencia dos Dados`.
> Relatório: `docs/handoff/2026-09-26-F3-vigia-volta-2-relatorio.md`
>
> | O que ficou diferente do plano | Por quê |
> |---|---|
> | 🔴 **o V4 é por tabela × CLIENTE × janela**, não por tabela | um `MAX` por tabela mostra 20/09 e **esconde um cliente parado há 20 dias**. Medido, exec 43326 |
> | o V4 tem **duas** perguntas: *carregou?* (`ingested_at`) e *avançou?* (`business_date`) | correção de 26/09; a coluna `ingested_at` existe em todas as `t28_*` |
> | 🔴 **V1 AUSENTE** | a credencial `n8nApi` existe mas a API responde **404** em dois recursos diferentes (401 seria chave inválida). API desabilitada ou URL-base errada — ação de tela |
> | **V5 parcial**, com rótulo obrigatório na mensagem | lê `t28_errors`: cobre só quem usa o error-handler do T28 |
> | **V6 completo sem a API** | `ingestion_step` deu o que a execução ia dar. Olha o writer, não o relógio (os dois relógios da tabela discordam) |
> | **V2b acrescentado** | a view `phi_score_current` agrupa **sem `platform`**: multiplicador armado, contraria o M2 |
> | `t28_gbp_daily` passou a ser **vigiada** | recebeu 1 linha em 21/06 e parou. *Recebeu uma vez e parou* não é *nunca recebeu* |
> | o nó `Buscar lacunas de ontem` foi **consolidado**, não aposentado | as duas perguntas dele viraram V4B e V2c no mesmo workflow |
>
> 🔴 **E a correção que o executor deve a si mesmo:** o **CA4 original estava CERTO.** O
> `t28_ga4_landing` **do CLI-4** está parado em **06/09** — 20 dias. A refutação da volta 1 foi
> errada porque agregou entre clientes. **A Fase 0 de 25/09 estava certa.**
>
> **A hipótese *"a carga acontece e a data não anda"* foi REFUTADA por dado:** `defasagem = 1 dia` em
> todas as 15 linhas medidas. A conferência para detectá-la **ficou construída de todo jeito**.

| | |
|---|---|
| **Status** | ✅ **APROVADO** — **Olavo, 2026-09-21** (*"Plano F3 ok"*). 🟢 **VIROU BRIEF EM 2026-09-26:** `docs/handoff/2026-09-26-F3-vigia-de-consistencia-construcao-subchat-brief.md` · ✅ **CONSTRUÍDO E PUBLICADO NA VOLTA 2 (26/09)** — ver banner acima |
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
| **V4** | Toda tabela **que tem writer declarado** recebeu linha **no período esperado DELA**? 🔴 **corrigido em 26/09** | **`raw_ad_data` vazia 3 meses** · **Clarity e GA4 mortos 19 dias** | coleta que ninguém fez |
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
