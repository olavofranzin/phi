# Brief de execução — O Agregador coleta, termina verde e não escreve

> # ❌ TÍTULO E PREMISSA ERRADOS — REFUTADO EM 2026-09-28, na mesma volta
>
> **A execução `41535` ESCREVEU.** Prova: consulta `44156` achou as 2 linhas ainda na tabela
> (`CLI-13` · `2026-09-20` · `EXEC-T28-41535`), mais 21 em `t28_campaign` e 1 em `t28_clarity_daily`.
>
> **O erro foi meu, e foi de leitura:** tomei `lastNodeExecuted: [T28] Filter t28_meta_campaign` como
> *"onde a corrente parou"*. Com **seis filtros em paralelo**, `lastNodeExecuted` é apenas **o último
> a terminar**. Aquele filtro **nem está no caminho do GA4**.
>
> ## 🔴 O defeito real é outro, e é pior
>
> O `Adaptador Input T28` usa **`nodeFirst(...)`**: ele associa a resposta do GA4 ao **primeiro
> cliente do lote**, não ao cliente daquela passagem. Em `41535` o primeiro era o **`CLI-13`** —
> então **o GA4 do `CLI-4` foi gravado como se fosse do CHA**. Em `44023` o primeiro já era o
> `CLI-4`, e por isso *pareceu* que a escrita "voltou".
>
> **Dado que falta é visível. Dado no cliente errado parece certo** — e alimenta o índice do negócio.
>
> **Este brief fica como histórico.** O trabalho continua em
> `docs/handoff/2026-09-28-identidade-do-cliente-no-agregador-brief.md`, e a análise está no
> `PLANO-F3-vigia-de-consistencia.md`, na seção do V4.


| | |
|---|---|
| **Frente** | Saúde Digital / Agregador |
| **Artefato** | `PHI — Agregador de Métricas Multi-fonte` (`4sdG2UKMCBuFq8xn`) — **ATIVO**, 66 nós, semanal (segundas 09h BRT) + mensal |
| **Autorizado por** | **Olavo, 2026-09-28** |
| **Branch dos documentos** | `claude/consolidacao-2026-08` · `https://github.com/olavofranzin/phi/tree/claude/consolidacao-2026-08` |
| **Onde o trabalho acontece** | **n8n** + leitura do BigQuery |
| **Janela** | 🔴 **09h–23h BRT (D9)** |
| **Urgência** | ⏳ **a prova está numa execução que a retenção do n8n vai apagar** |
| **Limite** | **3 voltas** |

---

## 1. 🔴 O achado — e ele já está provado, não é hipótese

Esta etapa **não começa do zero**. O chat-mãe abriu a execução **`41535`** (rodada semanal de
**21/09**) e leu os dois nós do GA4:

| Na execução `41535` | Resultado lido |
|---|---|
| `HTTP Request GA4 Orgânico` | ✅ **sucesso, 12 linhas**, datas **14/09 a 20/09** |
| `HTTP Request GA4 Pago (LPs)` | ✅ sucesso — **2 linhas** numa passada e **nenhuma chave `rows`** na outra |
| **`lastNodeExecuted`** | 🔴 **`[T28] Filter t28_meta_campaign`** |
| **Status** | 🟢 **`success`** |

**E em 25/09, quatro dias depois, `phi_prod.t28_ga4_landing` ainda tinha data máxima `06/09`.**

> ## 🔴 O dado foi coletado e NÃO foi escrito. E a rodada terminou verde.
>
> Não é "a fonte GA4 parou". **A fonte respondeu normalmente.** O que falhou foi o caminho entre a
> coleta e a tabela — **e ninguém soube**, porque a execução fecha em `success`.

**É o M10 quebrado com prova na mão** — *workflow ativo tem saída observável; verde sem produção é o
modo de falha desta casa.* **E é o mesmo defeito que matou a Fase 3 por 8 dias:** um nó que devolve
**zero itens** encerra o ramo, e o n8n chama isso de sucesso.

---

## 2. O que você tem de descobrir

| # | Pergunta | Por que importa |
|---|---|---|
| **Q1** | 🔴 **Em que nó exato o ramo morre** entre `HTTP Request GA4 Orgânico` e a escrita em `t28_ga4_landing`? | é a causa |
| **Q2** | **Por que a rodada de 28/09 (`44023`) passou** e a de 21/09 (`41535`) não? | sem isso, o conserto é chute |
| **Q3** | O `[T28] Filter t28_meta_campaign` **está no caminho do GA4** ou só foi o último a rodar? | pode ser coincidência de ordem — **não presuma** |
| **Q4** | **Quantas outras tabelas `t28_*`** dependem do mesmo trecho e podem estar sofrendo calado? | o Agregador tem **6 destinos**; se o ramo é compartilhado, o buraco é maior |
| **Q5** | Além do GA4, **algum outro destino ficou sem escrever** em `41535`? | compare os destinos de `41535` com os de `44023` |

> ⏳ **Comece pela `41535`. Ela é a única rodada de setembro que ainda existe** — procurei, e entre
> 01/09 e 27/09 **só ela** está retida. **Quando a retenção a apagar, a prova acaba.**

---

## 3. 🔴 A regra que rege o conserto — e o que NÃO aceitar como solução

| ❌ Não conserte assim | ✅ Conserte assim |
|---|---|
| fazer o filtro "deixar passar" | **entender por que ele não passou** |
| pôr `alwaysOutputData` para o ramo não morrer | isso **mascara**: o ramo segue com item vazio e escreve lixo ou nada |
| tratar como problema do GA4 | o GA4 **respondeu certo**; o problema é a ligação |

> 🔴 **A pergunta que decide o desenho:** *quando a fonte X não tem dado, o que DEVE acontecer com as
> outras 5?* Hoje a resposta de fato é **"todas param, e ninguém é avisado"**. Isso é escolha de
> ninguém — é o padrão do nó, herdado. **A R11, regra 5, manda escolher de propósito.**
>
> 💡 **E já existe precedente do mesmo dia para copiar:** o **D1-d**, feito hoje no
> `sw metricas campanhas`, resolveu exatamente esta família — **uma fronteira de erro, um nó que
> recolhe o que foi pulado, um aviso com nome, e o laço segue.** Veja
> `docs/handoff/2026-09-28-D1d-fronteira-de-erro-do-writer-subchat-brief.md`. **Se o desenho servir
> aqui, reuse-o em vez de inventar outro.**

---

## 4. Ordem de trabalho

| # | Passo |
|---|---|
| **4.1** | Ler a execução **`41535`** inteira: qual ramo rodou, qual não rodou, onde parou |
| **4.2** | Ler a execução **`44023`** (28/09) e **comparar** — o que foi diferente |
| **4.3** | Mapear o caminho `GA4 → t28_ga4_landing` no workflow **ativo** (R13: `activeVersion`, não rascunho) |
| **4.4** | Responder Q1–Q5 **por escrito, com evidência**, e **parar** |
| **4.5** | 🔴 **Só então** propor o conserto — **e voltar para aprovação antes de publicar** |

> ⚠️ **Esta etapa é diagnóstico. Não publique conserto sem devolver o desenho.** O Agregador é
> semanal: um conserto errado **só aparece sete dias depois**, e a próxima rodada é o único teste
> natural que existe.

---

## 5. Critérios de aceite — escritos antes (R9)

| # | Critério | Prova |
|---|---|---|
| **CA1** | Q1 respondida: **o nó exato** onde o ramo morre | nome do nó + o que ele devolveu em `41535` |
| **CA2** | Q2 respondida: **o que mudou em 28/09** | comparação das duas execuções |
| **CA3** | Q3 respondida com evidência, não com suposição | o caminho lido no workflow ativo |
| **CA4** | Q4 e Q5: **quais destinos** compartilham o trecho e quais ficaram sem escrever | lista dos 6 destinos, com sim/não em cada rodada |
| **CA5** | 🔴 **Nada foi publicado** no Agregador nesta volta | `versionId` igual ao do começo |
| **CA6** | O conserto voltou como **proposta**, com o caso vazio escolhido de propósito | §3 |
| **CA7** | Se a execução `41535` for apagada antes de você terminar, **isso está dito no relatório** | não invente o que não leu |

---

## 6. Fora de escopo

| Fora | Por quê |
|---|---|
| o **GBP** | é cota do Google, **decisão já tomada pelo Olavo** em 28/09 — outro caminho, `docs/handoff/2026-09-28-gbp-liberacao-de-api-decisao-e-caminho.md` |
| consertar sem aprovação | §4.5 |
| mexer no vigia | ele **funcionou**: foi o V4 que achou isto |

---

## 7. Registro (R3) e fechamento (R2)

- Linha na DB Notion **"PHI — Registro de Execuções (Sub-chats)"**, frente **Saúde Digital/Agregador**,
  ao começar e ao encerrar.
- Ao terminar, atualizar o **`PLANO-F3-vigia-de-consistencia.md`** (a seção do V4 já carrega este
  achado) e, se virar conserto, a **descrição do Agregador** (R5).

---

## 8. O relatório de volta

1. **Q1 a Q5**, com evidência
2. Os **7 critérios**
3. A **proposta de conserto**, com o comportamento do caso vazio escolhido de propósito
4. **O que você mediu e me desmentiu** — este brief nasceu de **uma** execução lida por mim
5. O que ficou de fora e por quê

> 🔴 **Se a premissa central cair — se o dado de 21/09 tiver sido escrito e apagado depois, por
> exemplo — PARE e devolva.** É mais valioso do que qualquer conserto.
