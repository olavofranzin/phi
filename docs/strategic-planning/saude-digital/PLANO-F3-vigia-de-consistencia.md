# Plano F3 — o vigia de consistência: fazer o silêncio significar saúde

| | |
|---|---|
| **Status** | 🟡 **PROPOSTO** — 2026-09-21. **Aguarda aprovação do Olavo** (R7: nada se constrói sem plano aprovado) |
| **Critério que atende** | **F3** do `PLANO-ENTREGA-FINAL-PHI.md` · fecha o **D5** do `CONTRATO-PHI.md` · destrava **C3/C4** da Definição de Pronto |
| **Razão que serve** | **R-A** — a qualidade do serviço parar de depender da atenção do Olavo |
| **Posição na fila** | **2º**, depois do ADR-39 (F1) |

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
| **V1** | O `Pipeline_v2` chegou até o **último nó** ontem? | **Fase 3 morta 8 dias**, verde todo dia | 8 dias sem tarefa aberta |
| **V2** | Cada campanha ativa tem **exatamente 1 score** de ontem? | **score 3× no Notion** | número errado na sua bancada |
| **V3** | Todo cliente **ativo no Notion** aparece no score? | **CHA morrendo no `phi_dev`** | cliente pago e não monitorado |
| **V4** | Toda tabela **que tem writer declarado** recebeu linha? | **`raw_ad_data` vazia 3 meses** | coleta que ninguém fez |
| **V5** | Algum workflow terminou **verde tendo roteado erro**? | **Agregador na cota do GBP, toda rodada** | 3 de 6 destinos vazios |
| **V6** | O `operador unico` e o `Pipeline_v2` rodaram **na janela esperada**? | (preventiva) | rodada que não aconteceu |

> **V1 a V5 não são hipóteses: são autópsias.** Cada uma teria detectado um defeito que de fato
> aconteceu e custou dias ou meses. **V6 é a única preventiva** — e é a mais barata de todas.

### O que fica de fora, de propósito

- **Não vigia qualidade de julgamento** (*"o score está certo?"*) — isso é o Score v2 / ADR-34.
- **Não vigia a Prospecção** — outra frente, outro contrato.
- **Não conserta nada.** Vigia avisa; consertar é outro trabalho, com outro brief.

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
| **CA3** | **V2 detecta o score 3×** que existe hoje | é o único defeito **vivo** — ele deve acusar na primeira execução |
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
