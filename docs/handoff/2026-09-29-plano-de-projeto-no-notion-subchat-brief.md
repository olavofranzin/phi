# Brief de execução — montar o PLANO DE PROJETO do PHI no Notion

| | |
|---|---|
| **Pedido do Olavo** | *"pesquise toda a documentação — estado do projeto, CLAUDE.md, o Miro, tudo — e monte no Notion um projeto com as etapas, a etapa em andamento, o status, e todas as tarefas que temos que desenvolver"* |
| **Data** | 2026-09-29 |
| **Branch** | `claude/consolidacao-2026-08` · `https://github.com/olavofranzin/phi/tree/claude/consolidacao-2026-08` |
| **Checkout** | `git fetch origin claude/consolidacao-2026-08 && git checkout claude/consolidacao-2026-08` |
| **Limite** | **3 voltas** |
| 🔴 **A armadilha nº 1** | **o DB já existe e tem linha de junho.** Leia o §1 antes de escrever qualquer coisa |

---

## 0. O que este trabalho é — e o que ele NÃO é

| É | NÃO é |
|---|---|
| **transcrever** um estado que já está documentado, para um lugar onde o Olavo consiga ver | **medir** o sistema |
| organizar por etapa, estado e **quem destrava** | decidir prioridade — **isso é do Olavo** |
| listar o que falta | consertar, executar ou publicar **qualquer coisa** |

> 🔴 **Você não vai rodar uma query, nem abrir um workflow, nem tocar em BigQuery.** Cada número que
> você escrever é **citado**, com **data e documento de origem**. Isto não é preguiça: é a **R6
> corolário 2** — *um documento registra o que era verdade no dia em que foi escrito.* Se você
> transcrever um número de 21/09 como se fosse de hoje, você **fabrica uma testemunha falsa**, e a
> próxima auditoria acredita nela.
>
> **Regra de ouro deste brief:** ✅ *"o `ESTADO-DO-PROJETO` diz, em 27/09, que X"* · ❌ *"X"*.

---

## 1. 🔴 ANTES DE CRIAR: o que já existe (R7)

**Não crie database. Não crie propriedade nova. Procure primeiro — e registre que procurou.**

| Já existe no Notion | ID / link | Para que serve |
|---|---|---|
| 🎯 **`PHI - Gestão de Projetos`** | `774518d2128a4b10aede511718737058` | **o alvo deste trabalho** — *"tarefas/pendências do Olavo (build/meta-trabalho)"* |
| `PHI — Registro de Execuções (Sub-chats)` | ver ADR-32 | o ledger de sub-chats. **Você escreve nele por obrigação (R3), não é o alvo** |
| `PHI - Demandas` | `a5c6b6ae3e9c4619a3c348e58c75c25b` | ⚠️ **NÃO é aqui.** É a fila run-time do sistema em produção |
| `PHI - Catálogo de Artefatos Operacionais` | `bd8df5b982ad4f00a8ae56d687db819e` | índice de artefatos — **fonte**, não destino |
| `Projetos` · `Tasks` · `Checklist` | `19fb65e5-c72b-81ae-…` · `19fb65e5-c72b-812d-…` · `19fb65e5-c72b-81cd-…` | DBs **operacionais do PHI** (campanha/cliente). ⚠️ **NÃO é aqui** |

> 🔴 **O `PHI - Gestão de Projetos` foi criado em 2026-06-18** e recebeu uma *"ingestão do Plano
> Operacional"*. **Ou seja: ele já tem linhas, e elas têm três meses.**
>
> **A armadilha é escrever 80 linhas novas ao lado de 30 velhas.** Isso não melhora o rastreador —
> **piora**, porque cria dois planos concorrentes e ninguém sabe qual vale. **Você RECONCILIA:**
>
> | O que achar | O que fazer |
> |---|---|
> | linha que **já foi feita** | **fechar**, com a data e o documento que prova |
> | linha que **ainda vale** | **atualizar** o estado, não duplicar |
> | linha que **não existe mais** (frente morta, decisão revertida) | **marcar como cancelada com o motivo** — 🔴 **não apagar** |
> | tarefa nova | criar |

**Se — e só se — o DB não comportar o que o Olavo pediu:** ⛔ **PARE e devolva a proposta.** Criar
database ou propriedade nova **não está autorizado**. Descreva o que falta e por quê.

---

## 2. A ordem de leitura — e ela importa, porque a doc é grande

**Leia nesta ordem. Não comece pelo maior arquivo.**

| # | Documento | O que extrair | Cuidado |
|---|---|---|---|
| **1** | `CLAUDE.md` (raiz) | as regras **R1–R13**, os invariantes, e a tabela *"Por onde começar, por assunto"* | é o mapa. Leia inteiro |
| **2** | `docs/strategic-planning/ESTADO-DO-PROJETO.md` **§0 PAINEL** | 🎯 **o estado por frente.** É a espinha do plano | 🔴 **SÓ o §0.** O resto do arquivo (1100+ linhas) é **changelog histórico até junho** — **não transcreva** |
| **3** | `DEFINICAO-DE-PRONTO-PHI-V1.md` | os critérios **C** e **D** — *"quanto falta para acabar"* | cada critério não cumprido **é uma tarefa** |
| **4** | `MAPA-DE-DOCUMENTACAO.md` | navegação + os DBs do Notion | a §3 tem a lista de DBs |
| **5** | `saude-digital/CLAUDE.md` e `prospeccao/CLAUDE.md` | o estado de cada frente pelos olhos dela | as "armadilhas" listadas viram avisos no plano |
| **6** | `saude-digital-do-negocio/README.md` + `CONTRATO-DE-FONTES-v0.md` **§7** | 🎯 **o §7 é uma lista de pré-requisitos — ou seja, tarefas prontas** | o item 6 está marcado como *"o mais urgente do documento"* |
| **7** | `saude-digital/PLANO-ENTREGA-FINAL-PHI.md` | os oito critérios **F1–F8** | 🔴 **leia o CORPO, não o cabeçalho** — o §1 já foi respondido em 27/09 e o cabeçalho mentia sobre isso até 29/09 |
| **8** | `saude-digital/adr-rascunhos/` (todos) | **status e data de cada ADR** | ver §3 abaixo — **é a parte mais valiosa** |
| **9** | `docs/handoff/` (os de setembro) | o que está **em execução agora** | o mais recente de cada tema vence |
| **10** | **Miro — `Board Agência`** | procedimentos da operação | ver §4 |

---

## 3. 🔴 ADR em rascunho É tarefa — e é a descoberta mais cara da casa

**Liste TODOS os ADRs com: número · título · status · data do status.**

**Por quê:** em 28/09 descobrimos que o **ADR-33 ficou RASCUNHO de 09/08 a 28/09 — sete semanas.**
Nesse tempo o defeito que ele descrevia **se espalhou para um segundo workflow**, gravou dado no
cliente errado em duas rodadas, e só apareceu por acaso.

> **Desenho aceito não conserta nada. Desenho que fica em rascunho é dívida com juros.**

| Status do ADR | Vira, no plano |
|---|---|
| **RASCUNHO** | 🔴 **tarefa de DECISÃO do Olavo** — e a idade dele é o tamanho do risco |
| **ACEITO, não executado** | tarefa de **execução** |
| **ACEITO e executado** | ✅ feito — **fecha a linha** |
| **SUPERSEDIDO / revertido** | cancelado, **com o motivo** |

---

## 4. O Miro — e os dois eixos que não se misturam

**Board vigente:** `Board Agência` · `https://miro.com/app/board/uXjVHecmR7c=/`
⚠️ **Existe uma `Cópia de Board Agência`. NÃO é a vigente. Não leia a cópia.**

| Eixo | O que é | Onde mora |
|---|---|---|
| **Frente de software** | Agregador, Score, Prospecção, CRM, Webview… | `docs/strategic-planning/<frente>/` |
| **Área da agência** | Comercial, Operações, Atendimento e seus **procedimentos** | **o board do Miro** |

🔴 **No plano do Notion, os dois ficam em seções separadas e rotuladas.** Misturar *"construir o
vigia"* com *"definir o plantão de dúvidas"* faz um plano que ninguém consegue executar.

> **E o motivo de ler o board mesmo assim:** em 2026-09-15 descobrimos que ele **já previa** a
> passagem de bastão entre Comercial e Operações que o plano da Prospecção tinha deixado **sem dono**.
> 🎯 **Procure exatamente isso:** ponto onde uma frente de software **depende** de um procedimento da
> agência que **não tem dono**. Cada um desses é uma tarefa, e das caras.

---

## 5. O que entregar no Notion

### 5.1. Uma página-espinha (o que o Olavo abre primeiro)

**Título:** `PHI — Plano de Projeto · estado em 2026-09-29`

🔴 **A primeira tela é um PLACAR, não uma lista.** (**R2 regra 5**: *marque onde se procura, não só
onde se narra — ninguém lê o §14 para saber se uma etapa aconteceu; lê a primeira tabela.*)

O topo responde, em uma tela:

| | |
|---|---|
| **1** | **qual é a etapa em andamento** — 🔴 **uma só.** Se você achar três "em andamento", o plano ainda não está pronto |
| **2** | **o que está esperando terceiro** e desde quando |
| **3** | 🔴 **o que está esperando o OLAVO** — a lista mais importante da página |
| **4** | o que está bloqueado, **com o bloqueio nomeado** |
| **5** | o placar: quantas tarefas em cada estado |

### 5.2. As linhas no `PHI - Gestão de Projetos`

**Cada linha carrega, sem exceção:**

| Campo | Regra |
|---|---|
| **frente** | Saúde Digital · Agregador · Score · Prospecção · CRM Odoo · Webview · Índice do Negócio · Governança · **Operação (Miro)** |
| **o que é** | uma frase. Verbo primeiro |
| **estado** | ✅ feito · 🔵 em execução · ⏳ esperando terceiro · ⬜ **decisão do Olavo** · 🟡 planejado · 🔴 bloqueado |
| 🔴 **quem destrava** | **Olavo** · **execução (sub-chat)** · **terceiro** — *é a coluna que torna o plano usável* |
| **de onde veio** | documento **+ data**. Sem isso a linha não entra |
| **depende de** | quando houver — só dependência **que a doc afirma**, não a sua intuição |

> 🔴 **A coluna "quem destrava" é o coração disto.** Um plano que mistura *"o Olavo precisa pedir a
> API ao Google"* com *"consertar o `sd[0]`"* não serve para nada: **o Olavo não consegue ver o que é
> dele.** Separar isso é metade do valor da entrega.

---

## 6. Semente — a lista que eu já tenho, de 29/09

⚠️ **Isto é SEMENTE, não verdade final.** Veio do chat-mãe em 29/09. **Confira cada uma na doc,
corrija o que estiver errado e complete o que falta** — e me diga o que eu errei.

| # | Tarefa | Quem destrava | Estado |
|---|---|---|---|
| 1 | **Volta 3 do Agregador** — consertar o `sd[0]`, 2 testes, publicar Agregador **e** V4, recoletar GA4, apagar 6 linhas | execução | 🔵 em execução |
| 2 | **318 linhas com `client_id` nulo** — etapa própria, não medida | execução | 🟡 planejado |
| 3 | **ADR-37 Fase 2** — bloqueada pelo requisito das 07h + 2 SQLs que leem `client_config.primary_metric_type` | execução | 🔴 bloqueado |
| 4 | **Dataset `phi_dev`** — `WF-T28-Orquestrador-Analises` ainda o referencia | execução | 🟡 planejado |
| 5 | **Motor multi-métrica** (ADR próprio) — gatilho: **primeiro cliente não-CPA** | Olavo (gatilho) | 🟡 planejado |
| 6 | **GBP — liberação da API** | ⏳ **Google** | resposta entre **08 e 13/10** |
| 7 | **W4 do webview** volta 2 + dívida do lockfile/`npm ci` + casca `webview/` | execução | 🔵 em execução |
| 8 | **3 campos na DB Clientes** do Notion: `Tipo`, `Fora do índice (motivo)`, **nível bronze/prata/ouro** | Olavo | ⬜ decisão |
| 9 | 🔴 **CORRIGIDO 29/09: só o §2.** O **§1 foi respondido em 27/09** e o §2 está **parcialmente** respondido — o cabeçalho do plano é que estava defasado | 🔴 **Olavo** | ⬜ pendente |
| 10 | **Dono de cada dimensão D1–D10** | 🔴 **Olavo** | ⬜ pendente |
| 11 | **F8 — relatório semanal** (segundas, WhatsApp, reunião de 30min para elegível). **Construção nova** | execução | 🟡 planejado |
| 12 | **Índice de Saúde Digital do Negócio** — ADR-41 e ADR-42 aceitos, **construção não começou** | execução | 🟡 planejado |
| 13 | **T28 / ADR-28** — parado, com gatilho de reentrada declarado | Olavo (gatilho) | ⏸️ parado |
| 14 | **Motor do score só calcula CPA**; `es/rs/os` são placeholder desde o ADR-004 | execução | 🔴 dívida antiga |
| 15 | **Vigia de Frescor estendido às tabelas `t28`** — *"o item mais urgente do contrato de fontes"* | execução | 🟡 planejado |
| 16 | **Verificar se o script da Clarity está instalado** (§4 item 7) | execução | 🟡 planejado |
| 17 | **Aposentar a integração da Clarity pela R5** — gatilho: o item 16 | execução | 🟡 gatilho |
| 18 | **`raw_ad_data` vazia** — o grão de anúncio (F4), *"quero o anúncio culpado"* | execução | 🟡 planejado |
| 19 | **`ingestion_step` mente** no `WHEN MATCHED` — some com a Fase 2 do ADR-37 | execução | 🔴 conhecido |
| 20 | **Emenda V3 do vigia** aguardando construção | execução | 🟡 planejado |
| 21 | **CRM Odoo** — F3 (campos GBP/IA pela API) e F5 (migração do HubSpot) | execução | 🟡 planejado |

---

## 7. Critérios de aceite — escritos antes (R9)

| # | Critério | Prova |
|---|---|---|
| **CA1** | Inventariou o Notion **antes** de escrever, e **registrou a busca** (R7) | o que achou e o que não achou |
| **CA2** | 🔴 **Nenhum database novo, nenhuma propriedade nova** — ou parou e devolveu a proposta | — |
| **CA3** | As linhas de junho foram **reconciliadas**, não duplicadas | quantas fechou · atualizou · cancelou · criou |
| **CA4** | Toda linha tem **frente · estado · quem destrava · origem COM DATA** | amostra de 5 linhas colada |
| **CA5** | 🔴 A **etapa em andamento é UMA** e está no topo | — |
| **CA6** | O que é **do Olavo** está separado e listado à parte | a lista |
| **CA7** | 🔴 **Nenhum número foi medido por você** — todos citados com procedência; o que a doc diz *"não medido"* está marcado assim | — |
| **CA8** | Miro lido do **board vigente** (não da cópia), e a **Operação** está em seção própria | o que achou |
| **CA9** | Todos os ADRs listados com **status e data**; rascunho antigo aparece como **dívida** | a tabela |
| **CA10** | A primeira tela é **placar**, não lista (R2 regra 5) | print ou descrição |
| **CA11** | Linha no **Registro de Execuções** (R3), no começo e no fim | — |
| **CA12** | 🔴 Devolveu **o que não conseguiu confirmar** e **onde a semente do §6 estava errada** | a lista |

---

## 8. Fora de escopo

| Fora | Por quê |
|---|---|
| medir qualquer coisa (BigQuery, n8n, execuções) | 🔴 **este trabalho é transcrição com procedência.** Medir é outra etapa, e cara |
| consertar, publicar, executar **qualquer coisa** | não é o pedido |
| **priorizar** | 🔴 **é do Olavo.** Você monta e mostra dependências; quem ordena é ele |
| criar DB ou propriedade no Notion | **R7** — devolva a proposta |
| apagar linha antiga | **cancelar com motivo**. O histórico é memória |

---

## 9. O relatório de volta

1. Os **12 critérios**
2. O que **reconciliou** — fechou, atualizou, cancelou, criou (com números)
3. 🔴 **Onde a semente do §6 estava errada** — este brief foi escrito de memória do chat-mãe, e a doc
   vence a memória
4. O que **não conseguiu confirmar**, e o que precisaria para confirmar
5. As **dependências entre frente de software e procedimento da agência** que você achou no Miro

> 🔴 **Regra que já se pagou quatro vezes esta semana:** *premissa que cai vale mais que etapa
> entregue.* **Parar e devolver nunca foi erro aqui.**

---

## 10. 🟢 VOLTA 1 — respondida em 2026-09-29. Aprovado, com correções minhas

**Ele parou onde devia e devolveu proposta em vez de criar. Certo.** E **achou dois erros no meu
próprio brief** — os dois já corrigidos, e o segundo tinha uma raiz que valia mais que o erro.

### 10.1. 🟢 APROVADO: as três propriedades

**Crie as três no `PHI - Gestão de Projetos`.** Nenhum database novo.

| Propriedade | Por quê |
|---|---|
| **`Frente`** | 92 linhas sem frente é um monte, não um plano |
| **`Quem destrava`** (Olavo / Execução / Terceiro) | 🔴 **é a entrega.** Sem ela o Olavo não enxerga o que é dele |
| **`Fonte (doc + data)`** | 🔴 **é a trava da R6 corolário 2.** Sem ela, *"sem fonte não entra"* não existe, e o plano vira pilha de afirmação sem dono — **exatamente a testemunha falsa que a próxima auditoria acredita** |

> **Por que eu aprovo e não devolvo ao Olavo:** três propriedades num rastreador que já existe é
> aditivo, reversível e **dentro do que ele já aprovou** ao pedir o plano. Ele fica sabendo; não fica
> esperando.

**Liberado também:** escrever as ~92 linhas e **aplicar a reconciliação** proposta (fechar 1,
atualizar 7, cancelar 2, manter 16). 🔴 **As 13 não confirmadas NÃO se cancelam** — entram como
**`⬜ não confirmado`**, com a dúvida escrita. **Rótulo herdado não é medição.**

### 10.2. 🔴 Meus dois erros, corrigidos — e a raiz do segundo

| Erro meu | Corrigido |
|---|---|
| citei *"§7 do contrato de fontes"* | ✅ **é o §4.** O documento tem 6 seções. Corrigido em **4 arquivos**, inclusive no ADR-33 e no próprio contrato |
| disse que os **§1 e §2** do plano estão em branco | ✅ **o §1 foi respondido em 27/09** e o §2 está **parcialmente** respondido |

> 🔴 **E a raiz do segundo é a lição, não o erro:** o **corpo** do `PLANO-ENTREGA-FINAL-PHI` dizia
> *"§1 — RESPONDIDO em 27/09"*. O **cabeçalho** dizia *"os §1 e §2 estão em branco de propósito"*.
> **Eu li o cabeçalho.**
>
> **É o incidente do ADR-38, inteiro, de novo:** *um documento pode estar completo no corpo e mentir
> no cabeçalho — e o cabeçalho é o que se lê.* **O cabeçalho já foi corrigido.**

### 10.3. O que eu respondo do seu "não confirmei"

| Você não confirmou | Resposta |
|---|---|
| **se o V4 está no ar** | 🟢 **está.** Publicado em 29/09, versão `9f443157-8787-444a-9bf0-11d1fd3d7981`, `versionId == activeVersionId`, rollback `125b437b-…` |
| **se o `es/rs/os` foi decidido depois de 02/07** | ⬜ **não foi.** Continua decisão do Olavo, e entra como tal |
| **onde está o ADR-34** | ⬜ **eu também não sei.** Entra como linha: *"ADR-34 — localizar ou declarar inexistente"* |
| **P-20, `BF`, `LO`** | ⬜ **sigla herdada de junho sem glossário.** 🔴 **Isso é evidência a favor de cancelar com motivo**, não de manter: *linha que ninguém consegue ler não é tarefa, é entulho* — mas cancela **declarando** que não foi entendida |
| 🔴 **rotação de credenciais expostas** | **você está certíssimo em não cancelar.** É o item de maior risco da sua lista inteira. Entra como **`🔴 não confirmado — segurança`**, e **sobe para o topo da página-espinha**. Credencial que talvez não tenha sido rodada é pior que credencial que sabidamente não foi |

### 10.4. ⛔ Um ponto onde eu NÃO aceito sua correção — e por quê

**Seed #19, o `ingestion_step`.** Você escreveu que ele *"não mente no `WHEN MATCHED`"*.

🔴 **O `CONTRATO-PHI.md` registra o contrário, como achado MEDIDO em 22/09:** *"o `WHEN MATCHED THEN
UPDATE SET` do `sw metricas campanhas` não atualiza `ingestion_step` — quando os dois tocam a mesma
linha, o carimbo fica com o primeiro e os números com o último."*

**Você declarou que não mediu nada em n8n nem BigQuery** — e esta é uma afirmação que **só se
resolve medindo**. Então:

| | |
|---|---|
| **Não mude nada** | a linha fica como está, **com a data de 22/09** |
| **Registre o conflito** | *"o chat-mãe e o executor divergem; nenhum dos dois mediu em 29/09"* |
| **A resolução** | uma leitura do nó — **outra etapa**, não esta |

> **Vale contra mim e vale contra você:** *este número eu medi, ou eu li?* **Nenhum de nós mediu.
> Então nenhum de nós decide.**

### 10.5. Sobre a branch — o problema não foi seu

Você commitou em `claude/plano-projeto-notion-v20z3g` porque **a instrução da sua sessão mandava**, e
o brief mandava outra. 🔴 **Isso é a segunda vez que acontece, pelo mesmo motivo** — e prova que a
regra estava errada, não você.

**Já busquei seu relatório e ele está na `claude/consolidacao-2026-08`.** Nada a fazer da sua parte.
**A `R1` do `CLAUDE.md` foi emendada:** de agora em diante, **duas ordens sobre branch ⇒ pare e avise
ANTES do primeiro commit.**

### 10.6. O que eu quero na volta 2

1. as **3 propriedades** criadas
2. as **~92 linhas** escritas, cada uma com **frente · estado · quem destrava · fonte com data**
3. a **reconciliação aplicada** — e as **13** como `não confirmado`, não canceladas
4. a **página-espinha** com o placar, e **no topo dela**: a etapa em andamento (uma), **o que espera
   o Olavo (30)**, e a **linha de segurança** do §10.3
5. 🔴 o **Painel de Entregas** (`fad6713a…`) que você achou e eu não listei: **diga o que ele é** e se
   ele conflita com este plano. **Dois painéis concorrentes é como este DB ficou com 39 linhas
   ilegíveis de junho**
