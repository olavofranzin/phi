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

## 1. ⏳ Passo 1 — a medição que tem prazo e decide o resto

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

## 5. Passo 5 — recoletar 13/09 e 20/09

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
| **CA1** | A retenção do Clarity foi medida **antes** de construir | resposta da API para 13/09 |
| **CA2** | As 6 fontes carimbam `client_id + source + source_id + janela`, **inclusive quando vazias** | ler os nós de volta |
| **CA3** | **Nenhum** `nodeFirst`, `.first()` ou posição sobrou no caminho do adaptador | `grep` nos Code nodes, colado |
| **CA4** | 🔴 O teste da ordem invertida **passou** | §3, com os números |
| **CA5** | O dia saudável **não mudou** | as 6 fontes escrevem o que escreviam |
| **CA6** | Publicado = ativo, e o `versionId` de rollback está anotado | **R13** |
| **CA7** | A recoleta entrou **sob `CLI-4`** — ou está declarado por que não foi possível | §5 |
| **CA8** | 🔴 O que foi mudado para recoletar **voltou** | releitura do nó, com o valor |
| **CA9** | As 6 linhas sumiram, e **só elas** | contagem antes (=6) e depois (=0) + total da tabela antes/depois |
| **CA10** | A descrição do Agregador conta o que mudou (**R5**) | duas frases |

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
