# Plano — Memória Compartilhada do PHI

| | |
|---|---|
| **Pedido do Olavo** | 2026-10-03 — quatro pontos: (1) parar de especular e ter memória viva · (2) recuperar o **porquê** do que existe · (3) um painel de visão rápida · (4) poder abrir um novo chat-mãe sem perder conhecimento |
| **Estado** | 🟡 **PLANO — aguarda aprovação.** Nada construído |
| **Branch** | `claude/consolidacao-2026-08` · `https://github.com/olavofranzin/phi/tree/claude/consolidacao-2026-08` |
| **Regra que o rege** | **R7** — nada se cria sem plano aprovado |

---

## 0. 🔴 A coisa que eu mudo no pedido, e o motivo

**O Olavo propôs: pasta no GitHub **espelhada** no Notion.**

> 🔴 **Espelhar é a doença, não a cura.** Duas cópias do mesmo fato = **dois lugares para divergir** — e
> é exatamente o que nos morde hoje. Nesta semana, **quatro vezes**:
>
> | O que divergiu | Custo |
> |---|---|
> | cabeçalho do `PLANO-ENTREGA-FINAL` dizia *"§1 em branco"*; o corpo dizia *"respondido em 27/09"* | **eu li o cabeçalho** e escrevi uma tarefa que não existia |
> | `CHECKLIST-webview` dizia *"W5 concluído, gráfico ligado"*; o código não tinha o gráfico | **funcionalidade sumiu e ninguém viu** |
> | `CHECKLIST-webview` só existia **noutra branch** | **o chat-mãe teve de ir buscar** |
> | meu clone do webview estava **atrasado** e eu não dei `fetch` | **afirmei que alguém tinha escrito depois da publicação. Não tinha** |
>
> **Nenhuma dessas quatro teria sido evitada por espelhamento. Três delas seriam PIORADAS por ele.**

**O que resolve não é cópia — é DONO.** Cada fato tem **um** documento dono. Os outros **ligam**, nunca
repetem. **Notion ganha uma porta com links, não um espelho.**

### 🔴 E o mecanismo que falta: `escrito em` ≠ `verificado em`

**Toda a especulação desta semana veio de documento que estava certo no dia em que foi escrito.** A data
de escrita não diz nada sobre hoje.

| Carimbo novo, no cabeçalho de todo doc canônico | O que significa |
|---|---|
| `escrito em` | quando o texto nasceu |
| 🔴 **`verificado em <data> por <quem> contra <qual artefato>`** | **quando alguém releu o artefato e confirmou** |

> 🔴 **A regra que sai disso:** *documento cuja verificação é mais antiga que o fato que ele afirma
> **não serve como premissa** — serve como hipótese.* **Isso torna o envelhecimento VISÍVEL**, que é
> exactamente o que falta hoje: um doc velho tem a mesma cara de um doc novo.

---

## 1. O que vai existir — `docs/base/`, com TETO

**Procurei antes (R7):** `docs/conhecimento/` é **biblioteca de estudo** (69 arquivos, **sem índice**) e
`strategic-planning/camada-conhecimento/` é **uma frente de produto** (ADR-31). **Nenhuma das duas serve.
Registrado para a próxima sessão não procurar de novo.**

> 🔴 **E o teto existe por um motivo medido:** `docs/handoff/` tem **173 arquivos** e
> `docs/conhecimento/` tem **69 sem índice**. **A doença de "correr atrás" já está instalada em pilha
> não indexada.** Esta pasta **não pode virar a terceira.** **Máximo 6 documentos, e o primeiro é a
> porta.**

| # | Documento | Dono de qual fato | Tamanho-alvo |
|---|---|---|---|
| **1** | 🔴 **`BASE-00-PORTA.md`** | **quem é dono de qual fato** · onde se procura o quê · a regra do `verificado em` · a regra de **prova de concluído** | 1 tela |
| **2** | **`BASE-01-PRINCIPIOS.md`** | **por que o PHI existe**, o que ele **não** é, e as decisões-mãe que moldaram tudo | 2–3 telas |
| **3** | **`BASE-02-SUPERFICIES.md`** | **todo lugar que serve ou guarda dado do PHI** — vivo ou não, com credencial e leitor | tabela |
| **4** | **`BASE-03-INVARIANTES.md`** | os invariantes num só lugar (M1–M12, S1, I*, + o de identidade) | tabela |
| **5** | **`BASE-04-INCIDENTES.md`** | **as histórias** que justificam as regras — hoje dentro do `CLAUDE.md` | cresce |
| **6** | **`BASE-05-HANDOFF-CHAT-MAE.md`** | o que este chat faz, como se comporta, estado e fios abertos | 2–3 telas |
| **+** | **`docs/base/fichas/`** | **uma ficha por artefato vivo** — ver §3 | 1 tela cada |

---

## 2. 🔴 Ponto 1 — a memória viva. E ela se sustenta em três regras, não em três pastas

### 2.1. Dono do fato (o que mata a divergência na raiz)

| O fato | Quem é dono |
|---|---|
| **o que um workflow faz AGORA** | 🔴 **o próprio artefato.** Ele vence todo documento (é a R13) |
| quem escreve e quem lê cada tabela | `saude-digital/CONTRATO-PHI.md` |
| estado por frente | `ESTADO-DO-PROJETO.md` §0 PAINEL |
| uma decisão e sua data | o **ADR** dela |
| tarefa, estado e **quem destrava** | **Notion** — `PHI - Gestão de Projetos` |
| o que existe e onde achar | `MAPA-DE-DOCUMENTACAO.md` |
| onde cada sistema vive e se está no ar | 🆕 `BASE-02-SUPERFICIES.md` |

> **Regra:** **quem não é dono LIGA, não repete.** Repetir é criar a segunda cópia que vai divergir.

### 2.2. `verificado em` — o carimbo de frescor

Todo doc canônico passa a ter no cabeçalho: **`verificado em <data> por <quem> contra <qual artefato>`**.

> **Teste prático:** *este documento afirma algo sobre um artefato? Então quando foi a última vez que
> alguém abriu o artefato?* Se não há resposta no cabeçalho, **o documento é hipótese.**

### 2.3. 🔴 Prova de concluído

**Nenhum item vira "concluído" sem a prova anexada** — um teste, uma query com números, uma resposta
HTTP capturada, um `versionId`.

> **Motivo, medido em 02/10:** o `CHECKLIST` marcou o **W5 concluído** com um gráfico que **não
> existe**. *"Concluído" sem prova é "acreditamos que foi concluído"* — **e as duas coisas se escrevem
> diferente.** Já temos o hábito: o W4 fechou com três capturas HTTP; o ADR-33 com três execuções.

---

## 3. 🔴 Ponto 2 — o porquê. E ele tem DUAS metades, sendo que a segunda é produto

### 3.1. Metade retroativa — a **ficha do artefato**

A **R5** já manda a descrição dizer *o que faz* e *por que existe*. **A ficha é a R5 com forma fixa:**

| Campo | |
|---|---|
| **o que faz** | uma frase |
| 🔴 **por que existe** | **a ideia geradora** — qual problema fez alguém criar isto |
| 🔴 **o que substituiu, e por quê** | o elo que hoje só existe na cabeça do Olavo |
| **quem escreve / quem lê** | e o que acontece quando a fonte falta |
| 🔴 **a prova** | execução, query ou teste — com número |
| **`verificado em`** | data, quem, contra o quê |

> 🔴 **Ficha NÃO se escreve em lote para 80 artefatos** — viram 80 páginas que ninguém lê. **Ela se
> escreve quando o artefato é tocado** (igual à R5), **mais uma semente** dos que decidem coisa:
> `sw metricas campanhas` · `PHI - Pipeline_v2` · `Agregador` · `operador unico metricas` ·
> `WF-T28-Analise-Campaign` · `client_config` · o servidor do webview.

### 3.2. 🔴 Metade PRODUTO — e esta é a parte mais importante da sua mensagem

**Você escreveu:** *"até hoje não considero finalizadas etapas como abertura das tarefas relacionadas ao
PHI considerando tempo em que o indicador está degradado, abertura correlata e correto preenchimento da
tarefa, do log de otimização, do próprio alerta, das tarefas de otimização... SOPs com checklists para
otimizações programadas, para casos de crise, criação automática dos checklists, o campo hipótese."*

> 🔴 **Isso não é falta de documentação. É produto inacabado — e é o coração do PHI.** O PHI *"detecta,
> classifica e orienta"*. **A orientação é exatamente essa cadeia**, e você está dizendo que ela não
> está pronta. **Nenhum documento resolve isso; é uma frente.**

**E ela começa MEDINDO, não construindo** — porque pode já existir:

| # | Primeiro passo | Por quê |
|---|---|---|
| **1** | 🔴 **ler a DB `PHI - SOPs`** (`7ebc98e0ebdc480c8c6abc18f65e2ed5`) e a `Checklist` (`19fb65e5-c72b-81cd-…`) | **os SOPs e checklists que você desenhou no início podem estar lá.** Reconstruir o que existe é o erro mais caro desta casa (**R7**) |
| **2** | ler o que a **Fase 3** realmente faz hoje (Fechamento → Escalada → Abertura) | a ordem é imutável (regra crítica 11), e o que ela preenche hoje ninguém escreveu |
| **3** | comparar **desenhado × existente** e devolver a lista do que falta | **só então** virar plano de construção |

**Fica como frente própria:** `docs/strategic-planning/orientacao-ao-gestor/` — nome provisório, e
**ela é caminho crítico para o PHI estar "pronto"**, não acessório.

---

## 4. Ponto 3 — o painel. E a resposta é **não construir painel**

🔴 **R7 primeiro: cinco coisas já fazem parte disso.**

| Já existe | O que faz | Por que não basta |
|---|---|---|
| `ESTADO-DO-PROJETO.md` §0 | estado por frente, rico | **é git, é longo, e não é "rápido"** |
| **Notion `PHI - Gestão de Projetos`** | 🟢 **131 linhas** com `Frente`, `Quem destrava`, `Fonte` | **falta a VISTA** |
| `Painel de Entregas` | (schema lido, conteúdo não) | **não sabemos o papel dele** — risco de 2º painel |
| Miro `Board Agência` | mapa da operação | outro eixo |
| **Digest diário** 08:30 Telegram | empurra progresso | **lê o ledger, não o plano** |

> 🟢 **O painel que você quer são VISTAS sobre as 131 linhas que já existem.** Zero código, zero
> integração nova — e as colunas que aprovamos ontem (`Frente`, `Quem destrava`) **são exatamente os
> eixos dele.**

| A visão rápida — 4 perguntas, 4 vistas |
|---|
| 🔴 **o que espera o Olavo** (`Quem destrava = Olavo`) |
| **o que está em execução agora** |
| **o que está bloqueado** — com o bloqueio **nomeado** |
| **o que vem depois** |

**Mais duas coisas, pequenas:**
- **uma `Porta de Entrada` no Notion**: links para o git e para as 4 vistas. 🔴 **Links. Não cópias.**
- **o digest diário passa a ler o plano** e mandar as mesmas 4 contas. **O canal de push já existe.**
- 🔴 **E antes de tudo: descobrir o que é o `Painel de Entregas`** — ou ele é isto (e usamos), ou morre. **Dois painéis concorrentes é como o DB de projetos ficou com 39 linhas ilegíveis de junho.**

---

## 5. Ponto 4 — o handoff do chat-mãe

### 5.1. O que JÁ está exportado (e é a maior parte)

**O conhecimento do projeto já mora no git** — `CLAUDE.md` (R1–R13), `ESTADO-DO-PROJETO`, os ADRs, os
173 handoffs. **Isso não se perde ao trocar de chat.**

### 5.2. 🔴 O que NÃO está, e é o que importa

**O julgamento.** Ler relatório com desconfiança, medir antes de repassar gravidade, dividir um passo
quando metade tem pergunta aberta, recusar autorizar escopo novo. **Parte está nas regras; o resto está
no hábito desta conversa.**

| # | Artefato | Forma |
|---|---|---|
| **1** | **`BASE-05-HANDOFF-CHAT-MAE.md`** | o que este chat faz · como se comporta · estado atual · **fios abertos com dono** · decisões pendentes |
| **2** | 🟢 **a skill `phi-chat-mae`** | **é a R8 ao pé da letra:** *"se eu escrevesse num checklist, outra pessoa executaria igual?"* — **os movimentos recorrentes do chat-mãe SÃO um checklist.** ⚠️ **Não dá para criar skill aqui** — entra no brief do novo chat |

### 5.3. 🔴 E um problema que eu preciso te contar: o `CLAUDE.md` está perto de se derrotar

**Medido hoje: 578 linhas, 35 KB.** Ele é lido no início de **toda** sessão — de todo sub-chat, toda
vez. **Eu mesmo acrescentei três emendas esta semana.**

> 🔴 **Regra longa não é regra forte: é regra que começa a ser passada de olho.** E quando isso
> acontece, **as regras param de funcionar sem ninguém perceber** — que é o modo de falha favorito
> desta casa.

| Proposta | |
|---|---|
| **`CLAUDE.md`** fica com **as regras**: imperativo, curto, **uma linha de motivo** | o que se obedece |
| **`BASE-04-INCIDENTES.md`** recebe **as histórias completas**, e cada regra linka para a sua | o que se lê uma vez e convence |
| 🔴 **As histórias NÃO se apagam** | elas **são** o porquê que você está pedindo no ponto 2. **Só mudam de lugar e ganham link** |

---

## 6. 🟢 Duas coisas que eu acrescento

### 6.1. `BASE-02-SUPERFICIES.md` — o inventário de onde o PHI vive

**Motivo, desta semana:** gastamos **três rodadas** para responder *"as Edge Functions do Supabase estão
publicadas?"* — e a resposta final veio de você olhar o painel. **Com um inventário, era uma linha.**

| Cada linha diz | |
|---|---|
| a superfície | n8n · BigQuery · Notion · EasyPanel · Supabase · Odoo · HubSpot · Sheets · Miro · Telegram |
| **está no ar?** | e **desde quando ninguém confirma isso** |
| **quem lê** | e **o que morre** se ela cair |
| 🔴 **que credencial ela guarda** | **o nome, nunca o valor** |
| **substituiu o quê** | para o antecessor não ficar de pé em silêncio — **foi o caso do Supabase** |

### 6.2. O invariante de identidade

**Duas frentes independentes, uma semana, a mesma doença:** o Agregador casava por **posição no array**;
o webview casa por **chave coagível**.

> *Identidade se casa por **chave declarada e não-coagível**. Posição em array, ordem de chegada e
> número que parece id **nunca** são identidade. Chave ausente **para e grita** — nunca cai para "o
> primeiro" nem para "todos".*

---

## 7. A ordem — e cada fase tem teste de pronto

> ## 🟢 2026-10-03 — **FASE 1 CONCLUÍDA**, com a prova
>
> | | |
> |---|---|
> | **Executada por** | sub-chat da Fase 1 (camada forte, **R10**), branch `claude/consolidacao-2026-08` |
> | **Teste de pronto do plano** | *“o `CLAUDE.md` cabe numa leitura e **nenhuma história se perdeu**”* |
> | 🔴 **Os 4 números** | **linhas 634 → 371** (−263, **41,5% menor**) · **bytes 38.570 → 25.766** (−12.804, **33,2% menor**) |
> | 🔴 **A prova de não-perda é MECÂNICA** | `python3 scripts/fase1-memoria/provar.py` — **APROVADA**: 18 blocos de história **byte-idênticos** no `BASE-04`, 10 blocos de fato nos destinos, **14 segmentos de regra intactos cobrindo 276 das 428 linhas** da região de regras, as 15 regras na raiz |
> | **O que nasceu** | `BASE-01-PRINCIPIOS` · `BASE-03-INVARIANTES` · `BASE-04-INCIDENTES` · `fichas/` (7 + README) · 3 `CLAUDE.md` de frente novos (`otimizacao-campanhas`, `webview`, `saude-digital-do-negocio`) · `saude-digital/REGRAS-CRITICAS-IMPLEMENTACAO.md` · `docs/ferramentas/rtk.md` |
>
> ### ⚠️ A meta de linhas do §9.1 do brief NÃO foi atingida, e por um motivo que é a própria regra
>
> O brief pedia **150–180 linhas** (e o §3 do mesmo brief pedia **~300** — ele se contradiz).
> **Entregou 371.** Medido: **o texto imperativo das regras R1–R15, sozinho, ocupa ~320 linhas.**
> Chegar a 180 exigiria **apagar texto de regra**, que é a linha que o próprio brief diz não se
> cruzar. **Então parei na meta e devolvi**, como o §3 manda: *“se não der sem apagar história, PARE
> e devolva — o teto não vale mais que a memória”*.
>
> 🔴 **O que FOI atingido:** a raiz não tem mais **nenhum** fato de que não é dona. O que sobrou é
> **regra e ponteiro**. Se o teto de 180 for requisito real, **a decisão seguinte é sobre as regras,
> não sobre a história** — e é do Olavo.

### A ordem original



```
FASE 0 — o alicerce (barata, e destrava o resto)
   BASE-00-PORTA  ·  BASE-02-SUPERFICIES  ·  o invariante de identidade
   pronto quando: dá para responder "quem é dono deste fato?" e
                  "esta superfície está no ar?" sem abrir o artefato

FASE 1 — a memória viva
   BASE-01-PRINCIPIOS  ·  BASE-04-INCIDENTES (mover do CLAUDE.md)
   CLAUDE.md enxugado  ·  BASE-03-INVARIANTES
   semente de 7 fichas
   pronto quando: o CLAUDE.md cabe numa leitura e nenhuma história se perdeu

FASE 2 — a visão rápida
   descobrir o Painel de Entregas  ·  4 vistas no Notion  ·  Porta de Entrada
   digest diário lendo o plano
   pronto quando: as 4 perguntas se respondem em uma tela

FASE 3 — o handoff
   BASE-05-HANDOFF  ·  brief do novo chat-mãe (que cria a skill phi-chat-mae)
   pronto quando: um chat novo lê o handoff e assume sem perguntar nada ao Olavo

FASE 4 — a frente escondida (PRODUTO, caminho crítico)
   ler PHI - SOPs e Checklist  ·  ler o que a Fase 3 preenche hoje
   desenhado × existente  →  plano
   pronto quando: existe lista do que falta na orientação ao gestor
```

### 🔴 O risco desta coisa toda, dito na cara

> **Isto pode virar um projeto de documentação que não termina** — e aí teremos trocado "correr atrás
> da informação" por "escrever documento em vez de entregar".

| Trava | |
|---|---|
| **teto de 6 documentos** na `docs/base/` | mais que isso, vira pilha |
| **fichas são incrementais** | **7 na semente, o resto quando o artefato é tocado** |
| **Fase 0 é uma sessão**, não uma semana | se passar disso, o plano está errado |
| 🔴 **nada aqui bloqueia o caminho crítico** | o motor do score, o Índice e a Fase 4 seguem |

### E uma observação de ordem, que é sua para decidir

**Você disse *"antes vamos atualizar/reescrever os documentos"*, e eu concordo** — com um porém:

> 🔴 **A Fase 4 é a que move o "pronto".** As fases 0 a 3 são o que torna **seguro** mexer nela: sem
> ler o `PHI - SOPs` primeiro, a gente reconstrói o que você desenhou no início. **A doc vem antes
> porque ela protege a Fase 4 — não porque ela vale mais.**

---

## 8. 🟢 2026-10-03 — proposta do Olavo ADOTADA, e ela é melhor que a minha

**Ele propôs:** *"o `CLAUDE.md` fica com as regras principais e para o restante aponta o caminho — o
chat vai tratar do T28, o `CLAUDE.md` aponta para o doc da frente, com as regras e os docs daquele
item."*

> 🟢 **Adotada.** E o motivo pelo qual é melhor que a minha é um que eu não tinha visto: **o
> `CLAUDE.md` da raiz é lido no início de TODA sessão — inclusive de sessões que nunca vão tocar no
> T28, no score ou no webview.** Uma sessão que conserta o módulo do Odoo hoje paga o custo de ler o
> bloco inteiro do T28 e as 14 regras de `splitInBatches`.
>
> **O critério certo não é "regra ou história". É: *toda* sessão precisa disto, ou só *algumas*?**

### 8.1. 🟢 As duas propostas são complementares — medido

**Dois cortes, em eixos diferentes. Medido em 03/10 (605 linhas):**

| Corte | O que sai | Linhas |
|---|---|---|
| **o do Olavo** — *fato → frente* | T28 (28) · Stack (12) · IDs do Notion (14) · tabelas BigQuery (14) · 14 Regras Críticas (19) · Cliente de teste (12) · Repositório (9) · Docs no Notion (14) · RTK (34) | **≈156** |
| **o meu** — *história → incidentes* | o grosso de **R13 (68) · R6 (52) · R11 (52) · R1 (43) · R12 (27)** | **≈180** |

> 🟢 **Juntos: 605 → ~150–180 linhas, sem perder uma regra nem uma história.** Separados, nenhum dos
> dois chega lá.

### 8.2. 🔴 A linha que eu desenho — e ela responde o risco da sua proposta

**O risco de só apontar:** *sessão que não segue o ponteiro perde a regra.* Hoje a regra está na cara
de quem quer e de quem não quer.

> 🟢 **A linha: a RAIZ guarda REGRA; as FRENTES guardam FATO.**
>
> **Porque regra não lida causa ESTRAGO; fato não lido causa PERGUNTA.** Pergunta é barata — o
> ponteiro resolve. Estrago não.

| Fica na raiz, sempre | Vai para a frente |
|---|---|
| as regras **R1–R14** (curtas) e a Comunicação | **ids, tabelas, nomes de nó, credenciais, stack** |
| a **PORTA** (a tabela "se a conversa é sobre X, leia Y") | o **como se faz** de cada ferramenta |
| os dois avisos de confusão (dois eixos · dois scores) | o estado e o histórico daquela frente |
| **R4** | — |

### 8.3. 🔴 E a mitigação operacional: o brief passa a dizer o DOC DA FRENTE

**Ponteiro na raiz não garante leitura** — a R1 já provou isso duas vezes com a branch.

> **Então: todo brief diz a BRANCH *e* o DOC DA FRENTE**, do mesmo jeito e com o mesmo destaque.
> Não é o executor que descobre qual frente ele está tocando — **é o brief que diz.**

### 8.4. 🔴 Dois defeitos que a medição achou, e um é meu

| # | Defeito | Gravidade |
|---|---|---|
| **1** | 🔴 **O `CLAUDE.md` contradiz a si mesmo sobre a branch.** A seção *"Repositório GitHub"* declara **`claude/create-phi-folder-n2RXF`** como *"branch de desenvolvimento"*; a **R1**, no mesmo arquivo, manda usar **`claude/consolidacao-2026-08`**. **A branch declarada EXISTE no remoto** (confirmado), e há **32 branches** lá | 🔴 **Isto é lido no início de toda sessão. E tivemos DOIS incidentes de branch.** Pode não ser a causa, mas **é combustível** — e não custa nada apagar |
| **2** | ⚠️ **Os ids do Notion estão em TRÊS lugares:** `CLAUDE.md`, `MAPA-DE-DOCUMENTACAO.md` e **`BASE-02-SUPERFICIES.md`** | 🔴 **a terceira cópia fui EU que criei — ontem, no dia seguinte a escrever a regra que proíbe.** Boa intenção não resolve duplicação; **só a estrutura resolve.** É o argumento da sua proposta, dado por mim contra mim |

### 8.5. O desenho final

```
CLAUDE.md (raiz, ~150 linhas)
   o que é o PHI · A PORTA · Comunicação · R1–R14 curtas · 2 avisos · R4

docs/base/                         ← a memória compartilhada (teto 6)
   BASE-00-PORTA  BASE-01-PRINCIPIOS  BASE-02-SUPERFICIES
   BASE-03-INVARIANTES (índice)  BASE-04-INCIDENTES  BASE-05-HANDOFF
   fichas/

docs/strategic-planning/<frente>/CLAUDE.md     ← o CLAUDE.md da frente
   saude-digital/        (existe)
   prospeccao/           (existe)
   otimizacao-campanhas/ 🆕  ← recebe o bloco do T28
   webview/              🆕
   saude-digital-do-negocio/ 🆕
```

> **Cada `CLAUDE.md` de frente começa com três linhas:** *"leia a raiz primeiro"* + link + **o que
> esta frente é dona**. **Ponteiro nos dois sentidos**, senão a frente vira ilha.
