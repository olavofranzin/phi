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

**Aposentar a integração (R5) não é esta decisão.** Gatilho: o **item 7 do §7 do contrato de fontes**
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
| 🆕 **2.7** | 🔴 **MEDIR** se o `Reclassifica IDs` erra de cliente (§0.2): ele lê `sd[0]` — o **primeiro** cliente — e aplica às linhas de todos. **Se a medição confirmar**, troque por leitura pareada por `client_id`, como o 2.3. **Se te desmentir, não conserte e me diga** |

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
| 🆕 **CA13** | O `Reclassifica IDs` foi **medido** (§0.2 / 2.7) — e está consertado **ou** está declarado por que não precisava | a medição, colada |

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
