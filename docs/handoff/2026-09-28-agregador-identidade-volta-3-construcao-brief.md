# Brief de execução — Volta 3: construir a identidade no Agregador, recoletar e apagar

| | |
|---|---|
| **Frente** | Saúde Digital / Agregador |
| **Artefato** | `PHI — Agregador de Métricas Multi-fonte` (`4sdG2UKMCBuFq8xn`) — **ATIVO**, 66 nós, **semanal (segundas 09h)** |
| **Autorizado por** | 🟢 **Olavo, 2026-09-28:** *"1, 2 e 3 = ok"* — **ADR-33 ACEITO** com a extensão · **apagar as 6 linhas** · **recoletar** o período |
| **Desenho canônico** | `adr-rascunhos/ADR-33-identidade-estavel-item-pipeline-metricas.md` — **aceito, não é mais rascunho** |
| **Branch dos documentos** | `claude/consolidacao-2026-08` · `https://github.com/olavofranzin/phi/tree/claude/consolidacao-2026-08` |
| **Janela** | 🔴 **09h–23h BRT (D9)** |
| **Limite** | **3 voltas** |
| ✅ **ESTADO** | **ETAPA FECHADA em 01/10.** 6 linhas apagadas com prova (`45203`→`45205`→`45206`; totais **38→34** e **17→15**) · **`CA10` cumprido e verificado no ar**. 🔴 **Sobrou UMA coisa, e é da R13: um draft não publicado (`378f6b81-…`) sobre o `Reclassifica IDs`, que REGRIDE o conserto. Ver §0.7 — descartar** |
| 🟢 **EMENDA 29/09** | 🔴 **LEIA O §0.1 E O §0.2 ANTES DE TUDO.** §0.1: o passo 1 rodou e derrubou uma premissa **minha** — a Clarity **não se recoleta** (72h) e a **porta dela fecha**. §0.2: **li o workflow ativo** — o conserto da Clarity custa **um nó e uma linha**, e **achei um defeito novo** no guarda `Reclassifica IDs` |

---

## 0. 🔴 A ordem é a entrega. Não a inverta.

```
   1. MEDIR a retenção do Clarity   ← perecível, decide o escopo do resto
   2. CONSERTAR (carimbo + casamento por chave)
   3. PROVAR reproduzindo a ordem de 41535
   4. PUBLICAR
   5. RECOLETAR 13/09 e 20/09
   6. APAGAR as 6 linhas
   7. CONFERIR
```

> **Por que apagar é o último:** apagar antes do conserto **deixa o buraco E o defeito**. Nesta
> ordem, **o dado certo entra antes de o errado sair**, e em nenhum momento a tabela fica pior do que
> está hoje.

---

## 0.1. 🟢 EMENDA DE 2026-09-29 — o passo 1 rodou, e derrubou uma premissa minha

**O executor mediu antes de construir, como este brief mandou, e parou.** Foi o comportamento certo.
**O que ele achou vale mais que a etapa:**

| # | Medido | Efeito |
|---|---|---|
| **1** | a API da Clarity consulta **só as últimas 72 horas** | 13/09 e 20/09 **morreram**. Recoletar Clarity: **impossível** |
| **2** | não há projeto/ID Clarity **no cadastro** | sem chave de cliente |
| **3** | 🔴 o nó usa **um único projeto fixo** em toda passagem do `Loop` | o dado é do mesmo projeto **para qualquer cliente** — por construção, não por acidente |
| **4** | o payload **não devolve** `project_id` | o `source_id` não pode vir da resposta |

> 🔴 **O item 3 é maior que o defeito que fomos consertar**, e nenhuma correção de índice no
> adaptador o alcança: **não há o que indexar.** A falta de um ID por cliente virou *"vale para
> todos"* — **quarto caso da R11 regra 1 na casa.**

### 🔴 E a premissa que caiu é minha: o `CA2` nasceu errado

`saude-digital-do-negocio/CONTRATO-DE-FONTES-v0.md` **§1.1**, decisão do Olavo de **25/09**:

> *"`t28_clarity_daily` **deixa de ser fonte do índice** — a integração zerada **sai do parque em vez
> de entrar na fila de conserto**."*

**Este brief pôs a Clarity na fila de conserto.** Escrevi *"as 6 fontes"* contando nós, **sem ler o
contrato de fontes** — o documento que manda na construção. **R7 quebrada por mim.** Custo de
obedecer: um `grep`. Preço pago: a etapa parada esperando decisão tomada havia quatro dias.

### 🟢 A decisão — nenhuma das três opções, e o `CA2` continua valendo

**A porta da Clarity FECHA com carimbo explícito. Ela não sai do envelope — entra no envelope como
"não configurada".**

| | |
|---|---|
| **Envelope da Clarity** | `source_id = null` · `source_status = 'not_configured'` · **zero linhas** |
| **`CA2` reprova?** | 🟢 **não.** *"Inclusive quando vazias"* é **exatamente** este caso |
| **O que muda de verdade** | o vazio deixa de ser **"todos"** (herdado) e passa a ser **"pare"** (escolhido) |
| **Consumidor perdido** | **nenhum** — a Clarity está fora do índice desde 25/09; o ADR-42 já a registra *"hoje sem consumidor"*. E pelo **M11**, dado sem consumidor **não deveria estar sendo escrito** |

**Por que não a opção 3 como proposta:** *retirar do escopo* deixa a porta escrevendo para o cliente
da vez. **Tirar do escopo não fecha porta.**
**Por que não a 2:** cadastro, credencial e schema para fonte que não alimenta nada.
**Por que não a 1:** a regra moraria **em comentário dentro do nó** — e no dia do segundo projeto
volta a escrever para todos, **em silêncio**. É o modo de falha da casa.

### As três consequências, e a 1 é obrigatória

| # | O que | Por quê |
|---|---|---|
| **1** | 🔴 **tirar `t28_clarity_daily` da lista do `V4`**, na mesma sessão | o V4 só cobra tabela **com writer declarado**. Sem tirar, o vigia **grita todo dia para sempre** — e **alarme que sempre grita é alarme desligado** |
| **2** | as **2 linhas de Clarity** se **apagam e não se recoletam** | e **não há buraco a declarar**: não há consumidor |
| **3** | reabrir é **por dado, não por código** | 🟢 **e o mecanismo JÁ EXISTE — li o workflow ativo em 29/09, ver §0.2.** O id mora no **cadastro do Notion** (`Get database clientes` → `Set dados`), **não** no `client_config`. 🔴 **Não crie campo nenhum agora** |

**Aposentar a integração (R5) não é esta decisão.** Gatilho: o **item 7 do §4 do contrato de fontes**
— *verificar se o script da Clarity está instalado.* **Se não estiver, a ferramenta não serve nem ao
novo papel**, e aí ela se aposenta com sticky e nome.

### O que muda nos passos e nos critérios

| Passo / CA | Antes | 🟢 Agora |
|---|---|---|
| **§1 passo 1** | medir retenção do Clarity | ✅ **FEITO.** `CA1` cumprido: 72h, período morto |
| **§2 passo 2** | conserto nas 6 fontes | **+ 2.6: fechar a porta da Clarity** com `not_configured` e **zero linhas** |
| **§5 passo 5** | recoletar 13/09 e 20/09 | **só os 4 de `t28_ga4_landing`.** Clarity: **não recoleta** |
| **§6 passo 6** | apagar 6 linhas | **inalterado: 6.** A regra dura continua — **contagem ≠ 6 ⇒ PARE** |
| **`CA7`** | recoleta entrou sob `CLI-4` | **as 4 do GA4** sob `CLI-4`; **as 2 da Clarity declaradas impossíveis** (72h) |
| 🆕 **`CA11`** | — | **`t28_clarity_daily` fora da lista do `V4`**, com o motivo escrito |
| 🆕 **`CA12`** | — | o envelope da Clarity **existe e diz `not_configured`** — provado **lendo o nó**, não o log |

---

## 0.2. 🟢 LI O WORKFLOW ATIVO — o conserto custa **um nó e uma linha**, e achei um defeito novo

**Antes de te mandar construir, li o que está no ar** (`versionId == activeVersionId ==
`c54114b3-fdf3-46c7-83fb-20c3bdffee54`, `sameAsDraft: true` — **R13** ok).

### O guarda que eu ia te pedir para desenhar **já existe**, desde 18/08

| Vivo hoje no Agregador | O que é |
|---|---|
| `Filtro GA4?` · `Filtro Google Ads?` · `Filtro GBP?` | três nós **antes** da chamada HTTP, testando `$('Set dados').item.json.id_ga4` / `id_google_customer` / `id_gbp_local` com `notEmpty` |
| `Reclassifica IDs (not_configured)` | já **emite `source_status = 'not_configured'`** para 5 chaves |
| 🔴 **A Clarity não tem nem um nem outro** | `HTTP Request Clarity` pende **direto da saída 1 do `Loop`**, ao lado dos filtros dos irmãos — **sem filtro, sem id, sem guarda** |

> 🔴 **O defeito que caçamos duas voltas mora no buraco que o endurecimento de agosto não cobriu.** A
> casa já decidiu, em 18/08, que **fonte sem id não é chamada**. A Clarity ficou fora — e é a única
> fonte cuja porta ficou aberta para todo mundo.

### Então o 2.6 é isto, e nada além disto

| # | O que | Molde |
|---|---|---|
| **1** | `Filtro Clarity?` antes do `HTTP Request Clarity`, testando `$('Set dados').item.json.id_clarity` com `notEmpty` | **copie o `Filtro GBP?`** |
| **2** | uma linha no `Reclassifica IDs`: `na('clarity', hasClarity)` | as outras cinco já estão lá |

> 🟢 **O campo `id_clarity` NÃO precisa existir para a porta fechar.** Ausente ⇒ `undefined` ⇒
> `notEmpty` falso ⇒ **zero chamadas, zero linhas, carimbo `not_configured`.** No dia em que um
> cliente tiver projeto de verdade, **o campo entra no cadastro do Notion e a porta abre sozinha.**
> 🔴 **Não crie o campo. Não crie coluna no `client_config`.**

**Brinde:** hoje o `HTTP Request Clarity` roda **uma vez por cliente, toda semana**, sempre contra o
mesmo projeto fixo. Fechar a porta **também para de gastar a chamada**.

### 🔴 2.7 — o defeito novo, da mesma família, dentro do próprio guarda

`Reclassifica IDs (not_configured)` lê os ids assim:

```js
const sd = $('Set dados').all();
const ids = (sd && sd[0] && sd[0].json) ? sd[0].json : {};
```

**`sd[0]` é o PRIMEIRO cliente — e o `Set dados` carrega todos**, porque é ele que alimenta o `Loop`
(`Get database clientes` → `Set dados` → `Code prepara datas` → `Loop`). O nó roda **uma vez por
rodada**, depois do laço, e aplica **a presença de id do primeiro cliente às linhas de todos**.

| | |
|---|---|
| **Os três filtros acertam** | usam `$('Set dados').**item**` — item pareado |
| 🔴 **O guarda erra** | usa `.all()[0]` — **identidade por posição**, o defeito deste brief |
| **Ele confessa no comentário** | *"lê os IDs do cliente **do mesmo jeito que o Adaptador**"* — e o jeito do Adaptador é **o defeito provado em 41535** |
| **Estrago possível** | **não** rebaixa um `ok` (a guarda `ss[key] !== 'ok'` protege), mas **converte `error`/`missing` em `not_configured`** para um cliente que **tem** o id, quando o primeiro não tem |
| 🔴 **Por que importa** | `not_configured` quer dizer *"de propósito"*. **Virar falha em ausência deliberada é desligar o alarme** — o nó feito contra **falso alarme** pode produzir **falso silêncio** |

> 🔴 **MEÇA ANTES DE CONSERTAR.** Eu provei a **forma** (o `sd[0]`, e que o `Set dados` carrega todos
> os clientes). **Não vi acontecer.** Vale a **R6 corolário 2** contra mim: *li o código, não medi uma
> ocorrência.* Se a medição te desmentir, **quero saber** — e aí não conserte.
>
> **O conserto, se a medição confirmar:** trocar `sd[0]` por leitura pareada por `client_id`, do mesmo
> jeito que o 2.3 manda para o adaptador. **É o mesmo conserto, no mesmo ADR.**

---

## 0.3. 🔵 ESTADO EM 2026-09-29, fim do dia — construído, **não publicado**, e está certo assim

**O executor parou porque a condição do §4 não foi cumprida. Isso não é volta reprovada — é a
pré-autorização funcionando.** O §4 diz *"uma das duas sem prova ⇒ não publique"*, e a prova que ele
tinha era **de um draft anterior**. **Parar foi obedecer.**

| O que está pronto | Onde |
|---|---|
| carimbo por **cliente / fonte / janela** + casamento por chave + **`Filtro Clarity?`** | **draft** do Agregador |
| execução saudável **`44239`** passou: CLI-4 GA4 orgânico **19** / pago **4**; Normalizador **1** `t28_campaign` + **2** `t28_ga4_landing`; **Clarity `not_configured`, zero linhas** | ✅ **`CA5` e `CA12`** |
| `t28_clarity_daily` fora do V4, **com o motivo escrito** | **draft** do V4 |
| **produção intacta** | Agregador `c54114b3-…` · V4 `125b437b-dcce-414b-839f-8e61ffd2a3a9` |

> ⚠️ **A R9 fala de "limite de 3 voltas" para trabalho REPROVADO.** As três voltas desta etapa não
> foram reprovações: **volta 1 refutou minha premissa do `lastNodeExecuted`, volta 2 mediu o passivo,
> volta 3 matou a recoleta do Clarity e achou o guarda sem irmão.** **Etapa que devolve achado a cada
> volta não é execução falhando — é medição funcionando.** O limite não dispara aqui.

### 🔴 O `CA13` não está cumprido — a medição não podia falhar

**Ele mediu e a ocorrência do `sd[0]` não apareceu. Mas olhe onde ela foi medida:** a `44239` é a
execução **saudável**, e os números relatados são **de um cliente só**.

> 🔴 **Se a rodada tem um cliente, `sd[0]` É o cliente certo.** O defeito é *"aplica o id do primeiro
> a todos"* — **com um só, não há "todos".** A medição não desmentiu a hipótese: **ela não teve como
> testá-la.** É a lição de 18/09 outra vez, do lado do teste: *"o que acontece no dia em que ela não
> pega nada?"* — aqui, **o teste não pegou nada porque não havia o que pegar.**

**E o teste que falta é o mesmo que já está na fila:** a ordem invertida (`CLI-13` depois `CLI-4`) é
**exatamente** a condição do defeito — dois clientes, e **o primeiro sem o `id_ga4` que o segundo
tem**. 🟢 **Um teste, dois critérios: `CA4` e `CA13` saem juntos.**

**Mas nem esse teste garante que o defeito apareça** — e isto é a parte honesta:

```js
const na = (key, present) => { if (!present && ss[key] !== 'ok') ss[key] = 'not_configured'; };
```

**A guarda `ss[key] !== 'ok'` protege fonte que respondeu bem.** Então o estrago só se materializa
com **três condições ao mesmo tempo**:

| # | Condição |
|---|---|
| **1** | mais de um cliente na rodada |
| **2** | o **primeiro** cliente **sem** um id que um cliente **posterior tem** |
| **3** | 🔴 e essa fonte **não** ter retornado `ok` para o cliente posterior (ou seja, ter dado `error`/`missing`) |

> **Veredito: defeito real na forma, raro no disparo, e silencioso quando dispara** — ele troca um
> alarme (`error`/`missing`) por um "de propósito" (`not_configured`). **Isso é pior que um falso
> alarme: é um alarme que não toca.**
>
> 🟢 **DECISÃO: não consertar nesta volta.** O executor fez certo em não mexer. Fica **registrado como
> defeito latente com a condição de disparo escrita**, e o conserto (leitura pareada por `client_id`)
> viaja **na próxima vez que alguém abrir esse nó**. Consertar agora é obra nova em produção no mesmo
> dia de outra obra — e a R11 é clara sobre salvaguarda instalada às pressas.

**`CA13` passa a ser:** *"o `Reclassifica IDs` foi medido **numa rodada com mais de um cliente**, e
está consertado **ou** registrado como latente com a condição de disparo"*. **O segundo já está feito
aqui.** O primeiro sai de brinde do teste invertido.

### 🟢 Siga. A pré-autorização do §4 continua valendo, e agora com duas ordens

| # | O que |
|---|---|
| **1** | rode o **teste invertido contra o draft ATUAL** (§3). Ele é `CA4` **e** `CA13` |
| **2** | 🔴 **durante ele, olhe o `source_status` das linhas do `CLI-4`.** Se algum ficar `not_configured` tendo id, **o defeito do `sd[0]` apareceu** — aí **pare e me diga**, não conserte |
| **3** | passou ⇒ **publique os DOIS drafts na mesma janela** (Agregador **e** V4) |
| **4** | prove os dois com `versionId == activeVersionId` (**R13**) |

> 🔴 **Publicar o Agregador e esquecer o V4 é o pior dos dois mundos:** a porta da Clarity fecha, a
> tabela para de receber linha, **e o vigia continua cobrando a tabela.** Alarme diário, para sempre,
> por uma tabela que fechamos de propósito. **Os dois drafts são um só movimento.**

### ⚠️ Forçar a ordem dos clientes vale a R12 inteira

Igual ao §5, e pelo mesmo motivo:

| | |
|---|---|
| **Declare antes** | o que muda, para qual valor, por quanto tempo |
| **Desfaça na mesma sessão** e **prove relendo** | não lembrando |
| 🔴 **Se forçar a ordem exigir mais de uma alteração** | **PARE e devolva.** Duas mudanças para montar um teste em workflow ativo é obra, não teste |

### ⚠️ E a alteração local no `CONTRATO-PHI.md`

**Você fez certo em não tocar.** Mas **me diga o que ela é** — cole o `git diff`. O container é
efêmero: **alteração não commitada morre com ele.** Se for trabalho de alguém, ela precisa de commit
ou de descarte **declarado** — não de esquecimento.

---

## 0.4. 🔴 EMENDA — o teste invertido PROVOU o defeito, e eu reverto minha própria decisão

**Execução `44493`, manual, sucesso.** `CLI-13` primeiro sem ids, `CLI-4` depois com os seus.

| Critério | Veredito |
|---|---|
| 🟢 **`CA4` PASSOU** | o Normalizador emitiu **linhas só sob `CLI-4`**, **nenhuma sob `CLI-13`** — **na ordem exata que causou o defeito original**. **É a entrega da etapa, provada onde dói** |
| 🔴 **`CA13` REPROVOU** | `CLI-4` tinha `id_gbp_local = 269166995970029765`, e **depois do `Reclassifica IDs` o `gbp` ficou `not_configured`**. Causa confirmada: `$('Set dados').all()[0]` |
| 🟢 **R12 cumprida** | só o `Set dados` mudou · restaurado · **releitura com `same = true`** · draft `0dd2c89c-e7a1-4bea-8a7f-9df58c7be137` · produção intacta em `c54114b3-…` |

> 🟢 **E o `CA13` reprovar é a prova de que o §0.3 estava certo:** a medição anterior disse *"não
> apareceu"* porque **rodou com um cliente**. Bastou o teste poder falhar para ele falhar **na
> primeira tentativa**.

### 🔴 Onde eu errei, e o que muda

**Classifiquei o defeito como *"raro no disparo"* e decidi deixá-lo latente. As duas coisas estão
erradas** — e a prova que as derruba é a própria execução `44493`.

**Minha terceira condição de disparo era:** *"essa fonte não ter retornado `ok` para o cliente
posterior"*. Eu a tratei como coincidência rara. **Para o GBP ela é permanente:** enquanto a cota do
Google for **zero**, o GBP **nunca** retorna `ok`. Então, para o GBP, o defeito dispara **toda rodada
em que um cliente sem `id_gbp_local` venha antes de um que tenha.** Isso não é raro. **É a regra.**

> 🔴 **E a consequência é pior que um dado errado: é um alarme trocado.** `error`/`missing` vira
> `not_configured` — *"falhou"* vira *"é assim de propósito"*. **O vigia e qualquer leitor de
> `source_status` leem silêncio onde havia falha.**
>
> ⚠️ **Hipótese que isso levanta — e é hipótese, não medição:** parte do motivo de o GBP ter ficado
> **três meses morto sem ninguém ver** pode ser este nó. A causa-raiz do GBP **não** muda (cota zero,
> medido). **O que este defeito explicaria é o silêncio, não a falha.** Barato de checar: olhar o
> `source_status` histórico do `gbp` e ver se ele diz `not_configured` em vez de `error`. **Se o
> executor não quiser abrir esta frente agora, registre e siga** — ela não bloqueia nada.

### 🟢 DECISÃO REVERTIDA: consertar AGORA, no mesmo draft, ANTES de publicar

| Antes (§0.3) | Agora |
|---|---|
| latente, conserta na próxima vez que abrir o nó | 🔴 **conserta agora** |

**Os três motivos:**

| # | |
|---|---|
| **1** | **a premissa caiu.** *"Raro"* e *"não provado"* eram as duas pernas da decisão — **as duas quebraram na mesma execução** |
| **2** | **o nó já está aberto.** Ele está no draft, lido e entendido, e **não publicado**. Consertar agora custa uma linha e **uma republicação a menos** |
| **3** | 🔴 **o GBP chega entre 08 e 13/10.** Quando a API abrir, queremos `source_status` **dizendo a verdade**. Publicar agora é decidir que o GBP volta para dentro de um cano que mente sobre ele |

> ⚠️ **E o argumento que considerei do outro lado, para ficar registrado:** o defeito é
> **pré-existente em produção** — publicar o draft como está **não o introduz**. Era a defesa da
> opção "publica agora, conserta depois". **Ela perde para o motivo 3:** não é sobre não piorar, é
> sobre **o que estará no ar quando o GBP voltar**.

### O conserto, e ele tem uma regra dura

**Trocar `$('Set dados').all()[0]` por leitura pareada pelo `client_id` do próprio item** — o mesmo
conserto que o **2.3** manda para o adaptador, no mesmo ADR-33. O item já carrega o `client_id`
depois do 2.1/2.4.

| # | Regra |
|---|---|
| **1** | monte um índice `client_id → ids` a partir do `Set dados`, e **procure por chave** |
| **2** | 🔴 **chave ausente ⇒ NÃO reclassifica e sinaliza.** **Nunca** cair para `[0]`, **nunca** cair para *"todos"* — é a **R11 regra 1**, e foi exatamente ela que criou este defeito |
| **3** | a guarda `ss[key] !== 'ok'` **fica como está** — ela protege fonte que respondeu bem, e isso está certo |

### 🔴 E o preço: os DOIS testes voltam a correr

**Conserto novo ⇒ prova nova.** Não vale herdar o verde da `44493`, que foi medido em **outro draft**
— é o mesmo motivo pelo qual você parou ontem, e ele continua valendo contra mim.

| # | |
|---|---|
| **1** | **teste saudável** (§3, sem nada forçado) — as 6 fontes escrevem o que escreviam |
| **2** | **teste invertido** (§3) — e agora ele tem **dois** critérios de saída: **zero linhas sob `CLI-13`** (`CA4`) **e** `gbp` **continuar `ok`/`error` sob `CLI-4`, nunca `not_configured`** (`CA13`) |
| **3** | passou nos dois ⇒ **publique os dois drafts** (Agregador **e** V4), e prove com `versionId == activeVersionId` |

---

## 0.5. ✅ FECHAMENTO — publicado em 2026-09-29. E o gate do §5 achou algo maior que a recoleta

### O que está no ar

| | |
|---|---|
| **Conserto do `sd[0]`** | índice por `client_id`, **sem fallback posicional**; chave ausente **preserva o status** e emite `CLIENT_IDS_NOT_FOUND` |
| **Agregador publicado** | `ecec7073-a8ef-4d98-9502-ba2fb8c08d67` · `versionId == activeVersionId` |
| **V4 publicado** | `9f443157-8787-444a-9bf0-11d1fd3d7981` · `versionId == activeVersionId` |
| **Rollbacks preservados** | Agregador `c54114b3-…` · V4 `125b437b-…` |
| **R12** | `Set dados` restaurado com **igualdade integral** |

**Os dois testes, contra o draft final:**

| Teste | Resultado |
|---|---|
| **saudável `44507`** | GA4 orgânico **20**, pago **4** · GBP **`error`** · Clarity **`not_configured`** |
| 🎯 **invertido `44510`** | **zero linhas sob `CLI-13`**, só `CLI-4` — **e o GBP continuou `error`** |

> 🟢 **`CA4` e `CA13` passaram juntos, e o `CA13` passou no lugar exato onde falhou:** na `44493` o
> GBP virava `not_configured`; na `44510` ele **continua `error`**. **O alarme voltou a tocar.**
>
> 🕐 **E o momento não podia ser melhor: o GBP volta do Google entre 08 e 13/10.** Ele vai chegar num
> cano que **diz a verdade sobre ele** — que era exatamente o motivo pelo qual eu revertí a decisão
> de deixar o defeito latente.

> 🟢 **E o `CLIENT_IDS_NOT_FOUND` é a R11 regra 1 cumprida ao pé da letra:** chave ausente **não**
> virou *"o primeiro"*, **não** virou *"todos"* — virou **um sinal com nome**. Foi assim que este
> defeito devia ter nascido em 18/08.

### 🔴 O gate do §5 pegou o que devia pegar — e revelou uma limitação de projeto

**Ele parou. Certo.** As duas datas exigem **duas trocas de janela**, e uma alteração única que
emitisse as duas **exigiria mexer no adaptador**, porque *"ele agrupa somente por cliente e
colapsaria as janelas"*.

> 🔴 **Isso não é um obstáculo da recoleta. É um achado sobre o Agregador:**
> **ele não sabe fazer backfill.** Uma rodada = **uma janela**. Para um workflow semanal isso é
> suficiente e nunca incomodou — **mas no dia em que o Índice de Saúde Digital precisar de
> histórico, esta é a parede.**

**Vira tarefa própria, e ela não é pequena:** *"o Agregador não tem caminho de backfill — uma rodada
só emite uma janela"*. **Não construir agora.** Registrar, para a frente do Índice saber o que a
espera.

### 🔴 A recoleta sai — e isso muda a justificativa do apagamento (R6)

**O apagamento foi autorizado pelo Olavo em 28/09 sob uma premissa que acabou de cair:**
*"recoletar primeiro, apagar depois — o dado certo entra antes de o errado sair"*.
**Sem recoleta, apagar deixa de ser troca e vira perda.** É premissa diferente ⇒ **é decisão nova**,
e é do Olavo (**R6**: antes de ação irreversível, verifique a premissa que a justifica — **mesmo que
o plano já esteja aceito**).

**Recomendação do planejador: apagar mesmo assim.** Quatro razões:

| # | |
|---|---|
| **1** | 🔴 **linha sob o cliente errado é pior que buraco.** Buraco é ausência; linha errada é **afirmação falsa** — e o `M4` da casa já diz que zero nunca é ausência |
| **2** | **apagar não perde o dado: o GA4 ainda tem.** O que falta é **caminho de ingestão**, não fonte. O buraco é **preenchível depois**, pelo mecanismo certo |
| **3** | **remarcar continua recusado, e por um bom motivo.** Provamos que as linhas **não são do `CLI-13`** (assinatura de impossibilidade: `id_ga4` nulo). **Isso não prova que são do `CLI-4`** — é inferência. **Escrever inferência em tabela de fato foi exatamente como chegamos aqui** |
| **4** | **o conserto já está no ar.** A regra *"apagar é o último"* existia para não deixar **buraco E defeito**. O defeito saiu em 29/09 — **a ordem está satisfeita** |

**As 2 linhas de Clarity são caso diferente:** essas **não** voltam nunca (72h). **Mas não têm
consumidor** e a porta está fechada — **apagar não custa nada a ninguém**.

### O que continua valendo para o apagamento

| | |
|---|---|
| **Mira** | trio `client_id` + `execution_id` + `date`. 🔴 **nunca por `client_id` sozinho** |
| 🔴 **Trava** | `SELECT` que conta e lista **antes** — **se não der exatamente 6, PARE** |
| **Depois** | o mesmo `SELECT` devolvendo **zero** + total da tabela antes/depois |

### O buraco, se o apagamento acontecer — declarado aqui

**`t28_ga4_landing` fica sem linha de `CLI-4` em 13/09 e 20/09.** Sem consumidor hoje (o Índice não
foi construído). **Preenchível quando houver backfill.** 🔴 **Nunca reconstruir por estimativa** —
`S1`: pilar não medido nunca é zero.

---

## 0.6. 🟢 AUTORIZADO — Olavo, 2026-09-29: **"pode"**

**A autorização é NOVA, não herdada.** Ele foi informado, antes de responder, de que a premissa do
`ok` de 28/09 tinha caído — *"sem recoleta, apagar deixa de ser troca e vira perda"* — e **disse pode
mesmo assim**. 🔴 **Isto fica escrito porque a diferença importa:** não é o executor reaproveitando
uma autorização velha sob condições novas. **É decisão tomada com o custo à vista.**

### O apagamento, e ele tem duas travas

| | |
|---|---|
| **O que** | **4** de `t28_ga4_landing` + **2** de `t28_clarity_daily`, sob **`CLI-13`**, execuções **`EXEC-T28-39103`** e **`EXEC-T28-41535`** |
| **Mira** | trio **`client_id` + `execution_id` + `date`**. 🔴 **Nunca por `client_id` sozinho** |
| 🔴 **Trava 1** | `SELECT` que **conta e lista** antes — **se não der exatamente 6, PARE** e devolva. Número diferente do medido significa que o mundo mudou desde a medição, **e apagar sem entender é irreversível** |
| 🔴 **Trava 2** | cole no relatório: contagem **antes (=6)**, **depois (=0)**, e o **total da tabela antes e depois** — o total é o que prova que **só elas** sumiram |

### O buraco, declarado no ato

**`t28_ga4_landing` fica sem linha de `CLI-4` em 13/09 e 20/09.**

| | |
|---|---|
| **Custa a quem?** | **a ninguém hoje** — o Índice não foi construído |
| **Some para sempre?** | **não.** O GA4 ainda tem o dado; falta **caminho de ingestão** (o achado do backfill, §0.5) |
| 🔴 **E enquanto isso** | **nunca reconstruir por estimativa.** `S1`: pilar não medido nunca é zero |

**As 2 de Clarity são diferentes:** essas **não voltam** (72h). Mas **não têm consumidor** e a porta
está fechada — **não custam a ninguém.**

### 🔴 E falta o `CA10`, que não apareceu no relatório

**A descrição do Agregador precisa contar o que mudou** (**R5**: todo artefato carrega a própria
história). Duas frases: **o que ele faz** e **o que mudou em 29/09 e por quê** — identidade por
chave, porta da Clarity fechada, guarda sem fallback posicional.

> **Teste da R5:** *se a auditoria semanal precisar perguntar ao Olavo para entender, a descrição
> falhou.* **Sem isso a etapa não fecha** — e a R2 é clara: etapa concluída = documentação atualizada
> **na mesma sessão**.

## 1. ✅ Passo 1 — FEITO EM 29/09 (a medição que tem prazo). `CA1` cumprido — ver §0.1

**As 6 linhas cobrem 13/09 e 20/09.** Recoletar só é possível enquanto a fonte guardar o período.

| Fonte | O que medir | Se já passou |
|---|---|---|
| **GA4** | confirmar que 13/09 responde | 🟢 improvável — retenção longa |
| **Clarity** | 🔴 **retenção curta.** Peça 13/09 e veja se volta dado | **a saída honesta é apagar e declarar o buraco** — **nunca** reconstruir por estimativa (**S1**) |

> 🔴 **Faça isto ANTES de construir.** Se o Clarity de 13/09 já morreu, o passo 5 encolhe, e é melhor
> saber disso antes de desenhar a recoleta do que depois.

---

## 2. Passo 2 — o conserto, como o ADR-33 manda

| # | O que |
|---|---|
| **2.1** | Dentro de **cada passagem do `Loop`**, carimbar a resposta de cada fonte com **`client_id` + `source` + `source_id` + `date_start` + `date_end`** antes de chegar ao `Merge1` |
| **2.2** | 🔴 Resposta **vazia** ou `not_configured` **também conserva o envelope**. **Nunca emitir `{}`** |
| **2.3** | O `Adaptador Input T28` passa a **indexar por essa chave**. Sai o `nodeFirst(...)`, sai o `.first()`, sai a posição de array |
| **2.4** | Cada linha normalizada **herda o `client_id` do próprio envelope** |
| **2.5** | Chave **ausente ou em conflito** → **roteia erro** e bloqueia **só aquela fonte daquele cliente** — não a rodada inteira |
| 🆕 **2.6** | 🔴 **FECHAR A PORTA DA CLARITY** — e **§0.2 mostra que custa um nó e uma linha**: `Filtro Clarity?` (cópia do `Filtro GBP?`) + `na('clarity', hasClarity)` no `Reclassifica IDs`. Resultado: **zero chamadas, zero linhas, `not_configured` carimbado**. E **tirar `t28_clarity_daily` da lista do `V4`** no mesmo movimento |
| 🆕 **2.7** | ✅ **MEDIDO e CONFIRMADO em `44493` (§0.4) — agora é CONSERTAR**, índice por `client_id`, chave ausente **não** cai para `[0]`. Antes: medir se o `Reclassifica IDs` erra de cliente (§0.2): ele lê `sd[0]` — o **primeiro** cliente — e aplica às linhas de todos. **Se a medição confirmar**, troque por leitura pareada por `client_id`, como o 2.3. **Se te desmentir, não conserte e me diga** |

> 💡 **O 2.5 tem molde pronto e provado hoje:** é a mesma fronteira do **D1-d**, feita de manhã no
> `sw metricas campanhas` — um nó que recolhe o que foi pulado, avisa com nome e devolve o laço.
> **Reuse o desenho.**

---

## 3. 🔴 Passo 3 — a prova, e ela é específica

**Não basta "rodou e escreveu".** O teste é **reproduzir a ordem que causou o defeito**:

| | |
|---|---|
| **Cenário** | **`CLI-13` primeiro** (sem GA4), **`CLI-4` depois** — exatamente a ordem de `41535` |
| ✅ **Passa se** | **zero** linhas de GA4/Clarity sob `CLI-13` · os mesmos valores sob `CLI-4` · nenhuma outra fonte mudou de dono |
| ❌ **Reprova se** | aparecer **qualquer** linha de fonte não configurada sob um cliente |

⚠️ **E o teste do dia saudável continua valendo** (a lição de 18/09): rode também **sem nada
forçado** e confirme que as 6 fontes escrevem o que escreviam.

---

## 4. Passo 4 — publicar

🟢 **PRÉ-AUTORIZADO, com duas condições — as duas provadas antes:**

| # | Condição |
|---|---|
| **1** | o teste do §3 **passou**, com os números colados no relatório |
| **2** | o `versionId` **anterior** (`c54114b3-fdf3-46c7-83fb-20c3bdffee54`) está **anotado para rollback** |

**Uma das duas sem prova ⇒ não publique. Relate e devolva.**

🔴 **E são DOIS drafts, num só movimento (emenda §0.3): o Agregador E o V4.** Publicar a porta fechada e deixar o V4 cobrando a tabela cria **alarme diário para sempre** numa tabela que fechamos de propósito. Produção hoje: Agregador `c54114b3-…` · V4 `125b437b-dcce-414b-839f-8e61ffd2a3a9` — **os dois são o rollback.**

Depois de publicar: **releia e confirme** `versionId == activeVersionId` (**R13**).

---

## 5. Passo 5 — recoletar 13/09 e 20/09 — 🟢 **só o GA4** (emenda §0.1: Clarity não se recoleta, 72h)

🔴 **Este passo mexe na janela de datas de um workflow ativo. Vale a R12 inteira:**

| | |
|---|---|
| **Declare** | por escrito, **antes**: o que vai mudar, para qual valor, e por quanto tempo |
| **Desfaça** | **na mesma sessão** |
| **Prove que desfez** | **relendo o nó**, não lembrando |
| ⚠️ **Se precisar de mais de uma alteração** para forçar a janela | **PARE e devolva.** Forçar data em workflow semanal ativo com várias mudanças é obra, não recoleta |

**O que esperar:** as linhas de 13/09 e 20/09 entram **sob `CLI-4`**, pelo caminho consertado.

---

## 6. 🔴 Passo 6 — apagar as 6 linhas (destrutivo)

| | |
|---|---|
| **O que apagar** | **exatamente** as 4 de `t28_ga4_landing` e as 2 de `t28_clarity_daily`, **sob `CLI-13`**, das execuções **`EXEC-T28-39103`** e **`EXEC-T28-41535`** |
| **Como mirar** | pelo trio **`client_id` + `execution_id` + `date`**. 🔴 **Nunca por `client_id` sozinho** |
| **Antes** | `SELECT` que **conta e lista** exatamente o que será apagado — cole no relatório |
| **Depois** | o mesmo `SELECT` devolvendo **zero** |
| 🔴 **Regra dura** | se a contagem do `SELECT` **não for 6**, **PARE**. Número diferente do medido significa que o mundo mudou desde a medição — e apagar sem entender é irreversível |

---

## 7. Critérios de aceite — escritos antes (R9)

| # | Critério | Prova |
|---|---|---|
| **CA1** | ✅ **CUMPRIDO 29/09.** A retenção foi medida **antes** de construir | **72h** — 13/09 e 20/09 mortos |
| **CA2** | As 6 fontes carimbam `client_id + source + source_id + janela`, **inclusive quando vazias**. 🟢 **A Clarity CUMPRE este critério carimbando `not_configured`** — o vazio declarado é o carimbo | ler os nós de volta |
| **CA3** | **Nenhum** `nodeFirst`, `.first()` ou posição sobrou no caminho do adaptador | `grep` nos Code nodes, colado |
| **CA4** | 🔴 O teste da ordem invertida **passou** | §3, com os números |
| **CA5** | O dia saudável **não mudou** | as 6 fontes escrevem o que escreviam |
| **CA6** | Publicado = ativo, e o `versionId` de rollback está anotado | **R13** |
| **CA7** | 🟢 **As 4 linhas do GA4** entraram **sob `CLI-4`**. As 2 da Clarity: **declaradas impossíveis** (72h, medido em 29/09) | §5 + §0.1 |
| **CA8** | 🔴 O que foi mudado para recoletar **voltou** | releitura do nó, com o valor |
| **CA9** | As 6 linhas sumiram, e **só elas** | contagem antes (=6) e depois (=0) + total da tabela antes/depois |
| **CA10** | A descrição do Agregador conta o que mudou (**R5**) | duas frases |
| 🆕 **CA11** | 🔴 **`t28_clarity_daily` saiu da lista do `V4`**, com o motivo escrito | senão o vigia **grita todo dia para sempre** |
| 🆕 **CA12** | O envelope da Clarity **existe e diz `not_configured`** | provado **relendo o nó**, não pelo log (**R13**) |
| 🆕 **CA13** | 🔴 **REPROVADO em 29/09 (`44493`) — ver §0.4. Conserta agora.** Antes, em §0.3: O `Reclassifica IDs` foi medido **numa rodada com MAIS DE UM cliente** — e está consertado **ou** registrado como **latente, com a condição de disparo** | ⚠️ medir com **um** cliente não vale: `sd[0]` é trivialmente o certo. **A metade do registro já está feita no §0.3** |

---

## 8. Fora de escopo

| Fora | Por quê |
|---|---|
| as **318 linhas com `client_id` NULO** | **outro defeito** (dono nenhum, não dono trocado), **53× maior**, e etapa própria. 🔴 **Não apagar por conta** — *"linha de teste"* é rótulo herdado, não medição |
| executar o ADR-33 nos writers (`sw metricas *`) | 🔴 **o aceite de hoje liberou só o Agregador.** Ampliar é decisão do Olavo |
| o **GBP** | é cota do Google, decisão já tomada |
| remarcar linha para outro cliente | 🔴 **recusado pelo Olavo hoje** — apagar, não remarcar |

---

## 9. Registro (R3) e fechamento (R2)

- Linha no Notion **"PHI — Registro de Execuções (Sub-chats)"**, frente **Saúde Digital/Agregador**.
- Ao terminar: **ADR-33** com o as-built (o que foi construído, execuções, o que divergiu do desenho)
  e o **`PLANO-F3`**, cuja seção do V4 é onde esta história está contada.

---

## 10. O relatório de volta

1. Os **10 critérios**
2. Os **dois testes** do §3, com números
3. O que aconteceu com a **recoleta** — e, se não deu, por quê
4. A contagem **antes e depois** do apagamento
5. **O que você mediu e me desmentiu** — este brief é o terceiro sobre o mesmo assunto, e **os dois
   primeiros tiveram premissa derrubada por medição sua.** Se houver uma terceira, quero saber

> 🔴 **Regra que já se pagou duas vezes nesta etapa:** *premissa que cai vale mais que etapa
> entregue.* **Parar e devolver nunca foi erro aqui.**

---

## 0.7. 🔴 FECHAMENTO 01/10 — a etapa acabou, e sobrou um draft que precisa morrer

### O apagamento, com as duas travas cumpridas

| | Antes | Depois |
|---|---:|---:|
| alvo `t28_ga4_landing` | 4 | **0** |
| alvo `t28_clarity_daily` | 2 | **0** |
| **total** `t28_ga4_landing` | 38 | **34** |
| **total** `t28_clarity_daily` | 17 | **15** |

`SELECT 45203` = **6** · `DELETE` transacional `45205` (`@@row_count` 4 e 2) · releitura **independente**
`45206` = **0**. 🟢 **O total caindo exatamente 6 é o que prova que só elas sumiram** — era para isso
que a trava 2 existia. `TMP - A6 BigQuery Audit` restaurado e inativo (**R12**).

**`CA10` cumprido — e eu reli a descrição NO AR, não o relatório** (**R13 regra 3**). Ela está lá,
igual ao relatado.

### 🔴 O que sobrou: `versionId != activeVersionId`

**Li o workflow em 01/10.** `activeVersionId = ecec7073-…` · `versionId = 378f6b81-…` ·
**`sameAsDraft: false`**.

**Conferi o draft inteiro contra o ativo:** 68 nós dos dois lados, **conexões idênticas**, e
**exatamente um nó diferente** — `Reclassifica IDs (not_configured)`, o nó do conserto.

**E o draft é PIOR que o que está no ar:**

| # | No ar (**testado**) | No draft (**nunca testado**) |
|---|---|---|
| **1** | busca em **`j.ctx?.client_id ?? j.client_id`** | 🔴 **perdeu o `ctx`.** Se o cliente morar lá, **nenhum item casa** e **o guarda não reclassifica nada** — roda verde **não fazendo nada** |
| **2** | **`identity_errors[]`** + código **`CLIENT_IDS_NOT_FOUND`** | 🔴 escalar `reclassifica_ids_status` — **perde o array e o código**; quem lê `identity_errors` **para de ver** |
| **3** | último vence em chave duplicada | primeiro vence — **não é errado, é não testado** |

> 🔴 **O perigo não é o código: é ele existir.** O workflow é **ATIVO**. **A próxima pessoa que mudar
> qualquer coisa e publicar embarca isto sem saber** — e desfaz em silêncio o conserto que esta etapa
> acabou de provar.
>
> **E a ironia é exata:** o nó que existe para impedir *falha disfarçada de ausência* tem pendurado
> nele **uma versão que o faria falhar em silêncio.**

### 🟢 O último passo: descartar o draft

| | |
|---|---|
| **O que fazer** | repor o rascunho **igual ao ativo** (`ecec7073-a8ef-4d98-9502-ba2fb8c08d67`), até **`versionId == activeVersionId`** |
| **Prova** | reler e colar os dois ids iguais (**R13 regra 2**) |
| ⛔ **Não publicar o draft** | ele **regride dois pontos provados** |
| ⛔ **Não "guardar para depois"** | 🔴 **draft sem dono e sem teste em workflow ativo não é ideia, é armadilha.** Se a ideia valer, volta como etapa, com teste |
| **E me diga** | **de onde ele veio.** Não foi do `CA10` — descrição não muda `versionId` (**R13 item 4**) |

> ✅ **A `R12` ganhou uma quarta linha por causa disto**, de um tipo novo: *estado temporário não é só
> configuração mudada — é também **rascunho deixado para trás**.* **Teste de fechamento:** *o que está
> no ar é igual ao que está salvo?* Se não, **ou publica de propósito, ou descarta de propósito.**

---

## 0.8. 🔴 01/10 — a origem do draft, e a única coisa que falta é um clique

**Medido:** criado em **29/09 17:06:32 BRT**, nome da versão **`ADR-33 Reclassifica IDs por
client_id`**, autor **"Olavo Franzin (via MCP)"** — **dois minutos depois** de `ecec7073` ir ao ar.
**Não veio do `CA10`.** 🔴 **E o histórico não diz qual chat fez.**

> **Dois agentes no mesmo nó, quase ao mesmo tempo** — o nome da versão prova que era a **mesma
> tarefa**.

### 🔴 O buraco de governança que isso expõe

**Toda chamada MCP ao n8n é "Olavo Franzin (via MCP)"** — o dono do token, não o autor. Com vários
sub-chats em paralelo, **não dá para saber quem mexeu, nem perguntar.** Aqui custou um draft órfão;
pode custar **dois agentes publicando por cima um do outro**.

**🟢 Proposta (do Olavo, não de executor):** **o nome da versão já identificou este draft** — foi o
único canal que funcionou. Convenção: `<frente> <data> <brief/ADR>` em toda versão salva. Custo zero.

### O descarte — caminho A, e por que não é por MCP

`restore_workflow_version` **cria um `versionId` novo**: o conteúdo ficaria igual e os **ids
diferentes**, deixando `sameAsDraft: false` para sempre — **um falso alarme permanente** no teste da
R13. **Trocar um problema por outro não é consertar.**

| | |
|---|---|
| 🟢 **A** | **o Olavo clica "Descartar alterações"** no editor do Agregador — 30s, **nenhuma versão nova**, `versionId` volta a `ecec7073` |
| 🟡 **B (reserva)** | restaurar o ativo e **publicar** — funciona sem o Olavo, mas **muda o `activeVersionId`** e envelhece toda a doc que cita `ecec7073` |

**Depois do clique:** releia e cole **`versionId == activeVersionId == ecec7073-a8ef-4d98-9502-ba2fb8c08d67`**.
**Aí a etapa fecha de verdade.**
