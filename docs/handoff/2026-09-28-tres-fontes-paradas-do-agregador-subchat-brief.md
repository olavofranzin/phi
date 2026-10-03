# Brief de execução — As 3 fontes paradas do Agregador (GBP e os dois GA4)

| | |
|---|---|
| **Frente** | Saúde Digital / Agregador — e é **a fonte de dado do índice do negócio** |
| **Artefato** | `PHI — Agregador de Métricas Multi-fonte` (`4sdG2UKMCBuFq8xn`) — **ATIVO**, 66 nós, gatilhos **semanal** e **mensal** |
| **Por que agora** | 🟢 **fila decidida pelo Olavo em 27/09: A → B → C.** O ADR-39 fechou, o **D1-d** ficou pronto em 28/09 — **esta é a vez do B** |
| **Branch dos documentos** | `claude/consolidacao-2026-08` · `https://github.com/olavofranzin/phi/tree/claude/consolidacao-2026-08` |
| **Onde o trabalho acontece** | **n8n** + **BigQuery** (leitura) — não é repositório de código |
| **Janela** | 🔴 **09h–23h BRT (D9)** |
| **Limite** | **3 voltas** |

---

## 1. 🔴 Antes de tudo: "religar" é a palavra errada, e ela esconde o problema

O painel diz *"religar as 3 fontes paradas"*. **Isso sugere um interruptor.** Pelo que está escrito
na casa, **as três não têm a mesma doença — e pelo menos uma não se conserta com código.**

| Fonte | O que a casa registrou | Que tipo de problema é |
|---|---|---|
| **GBP** (`t28_gbp_daily`) | o nó `HTTP Request GBP` falha **toda rodada** com *"receiving too many requests"* | 🔴 **cota de API.** Não é bug: é **limite de uso concedido pelo Google** |
| **GA4 D-7** (`t28_ga4_landing`) | última data **06/09** | ⬜ **desconhecido** — pode ser credencial, nó, filtro ou cota |
| **GA4 D-30** | último dado ~**31/07** | ⬜ **desconhecido** |

> 🔴 **Sua primeira entrega não é o conserto. É o DIAGNÓSTICO COM NOME.** Para cada uma das três:
> *qual nó · qual chamada · qual erro exato · de que tipo é (código, configuração, credencial, cota
> ou decisão do Olavo)*. **Sem isso, qualquer conserto é chute** — e chute em workflow ativo de
> produção é o que esta casa mais pagou caro.

---

## 2. Os números que você RE-MEDE antes de usar (R6, corolário 2)

**Os três números abaixo eu li; não medi hoje.** Vieram da estreia do vigia e da Fase 0 do índice,
entre **25 e 26/09**. **Número herdado de documento não vira critério de aceite sem ser medido de
novo** — e nesta casa isso já custou uma etapa inteira.

| Fonte | O que foi medido, e quando | 🔴 Re-meça |
|---|---|---|
| `t28_gbp_daily` | **1 linha única, de 21/06** (26/09) | quantas linhas, qual a data máxima, **hoje** |
| `t28_ga4_landing` (CLI-4) | **24 linhas · 12 datas · máxima 06/09** (execuções `43040`/`43042`, 25/09) | idem |
| GA4 D-30 | ~**57 dias** na estreia do vigia (26/09) | idem, **e descubra qual tabela/destino é** — o nome "D-30" é do vigia, não do schema |

> ⚠️ **E há uma contradição documental para você resolver com dado:** o
> `MAPA-material-x-casa.md` afirma que `t28_gbp_daily` ***"nunca recebeu uma linha"***. A medição de
> 26/09 achou **uma linha, de 21/06**. **Um dos dois está errado.** Meça e **corrija o documento** —
> é R2.
>
> 💡 **E repare no que essa linha única faz:** a tabela **não está vazia**, então passa em qualquer
> conferência do tipo *"tem dado?"*. **É a quarta cara do vazio** (R11, regra 5): não é "todos", não
> é "pare", não é "zero" — é **"tem, e está velho"**.

---

## 3. 🟢 Por que o GBP vale mais que os outros dois somados

| | |
|---|---|
| **12 indicadores do índice** destravam **com essa única coisa** | `DICIONARIO-DE-INDICADORES-v0.md` §placar: *"é o item de maior retorno por esforço do documento inteiro"* |
| **Dois pilares inteiros** dependem dele | **Visibilidade/Descoberta** e **Reputação** — hoje os dois entram no índice **com peso zero e rótulo "não medido"** (ADR-41, D7) |
| **A tabela existe, o workflow existe, o nó existe** | não falta construir nada. **Falta a cota** |

🔴 **E é por isso que ele pode não ser seu para resolver.** Aumentar cota de API do Google é
**pedido ao fornecedor**, não commit. **Se for esse o caso: pare, escreva as opções e devolva.** As
opções que eu já enxergo, para você confirmar ou derrubar com evidência:

| Opção | O que é |
|---|---|
| **A** | pedir **aumento de cota** ao Google (quantas chamadas/dia temos, quantas precisamos, qual o formulário) |
| **B** | **reduzir a demanda**: menos chamadas por rodada, lote menor, ou uma janela maior entre chamadas |
| **C** | a chamada está **errada** e gasta cota à toa (ex.: uma chamada por métrica em vez de uma por lote) |
| **D** | a cota é **por projeto** e estamos dividindo com outra coisa |

> ⚠️ **A opção C é a que mais aparece na prática** — e é a única inteiramente sua. **Verifique-a
> antes de pedir cota**: pedir mais cota para um consumo errado é pagar pelo próprio defeito.

---

## 4. 🔴 Um achado meu, medido hoje, que entra nesta etapa

**O Agregador não tem `errorWorkflow` configurado.** Li as `settings` dele hoje:
`executionOrder`, `binaryMode`, `availableInMCP` — **e nada de `errorWorkflow`**.

| | |
|---|---|
| **Compare** | o `sw metricas campanhas` e o `PHI - Pipeline_v2` **têm** (`UZ7sIE5cWrrO8xea`) |
| **Consequência** | se o Agregador **falhar duro** numa segunda-feira, **ninguém é avisado**. Ele é **semanal**: o próximo olhar natural é **sete dias depois** |
| **Custo de consertar** | **um campo.** E `settings` **não mora na versão** (R13, nº 4): configurar o `errorWorkflow` **vale sem publicar** e **não muda o `versionId`** |

✅ **Faça.** É a única mudança de configuração pré-autorizada neste brief.

---

## 5. O que fazer, em ordem

| # | Passo | Cuidado |
|---|---|---|
| **5.1** | **Re-medir** as três tabelas (§2) e escrever os números | é o portão: número velho não vira critério |
| **5.2** | Achar o **nó** de cada uma das três no Agregador e ler **a última execução** dele | **leia o que rodou**, não o rascunho (**R13**) |
| **5.3** | Para cada uma: **o erro exato, copiado**, e a **classificação** (código / config / credencial / cota / decisão) | sem o texto do erro, não é diagnóstico |
| **5.4** | Configurar o **`errorWorkflow`** do Agregador (§4) | pré-autorizado |
| **5.5** | Consertar **o que estiver ao seu alcance** sem decisão do Olavo | 🔴 **uma fonte por vez, e prove cada uma antes da seguinte** |
| **5.6** | O que precisar de decisão: **pare e devolva com opções** (§3) | não invente autorização |

---

## 6. 🔴 A prova de que uma fonte "voltou" — e ela não é o verde da execução

**Execução verde não é dado escrito.** Esta casa perdeu **três meses** com a `raw_ad_data`: dois
workflows ativos escrevendo nela todo dia, verde, **tabela vazia**.

| ❌ Não aceite como prova | ✅ Aceite |
|---|---|
| "a execução terminou sem erro" | **uma linha nova na tabela, com data posterior ao conserto**, consultada no BigQuery |
| "o nó devolveu 200" | **a contagem antes e a contagem depois** |
| "o Telegram não reclamou" | o **vigia das 08h** do dia seguinte parando de acusar aquela fonte no **V4** |

> 🔴 **E a conferência final é de graça: o vigia já existe e já vigia isto.** O **V4** pergunta todo
> dia se cada tabela com writer declarado recebeu linha no **período esperado dela**. **Se você
> consertar de verdade, o alarme some sozinho amanhã.** Se sumir do seu terminal e continuar no
> Telegram, quem está certo é o Telegram.

---

## 7. Critérios de aceite — escritos antes (R9)

| # | Critério | Prova |
|---|---|---|
| **CA1** | As três tabelas foram **re-medidas hoje** | contagem + data máxima de cada, com a query |
| **CA2** | Cada uma das três tem **erro exato copiado** e **classificação** | tabela de 3 linhas |
| **CA3** | A contradição do `MAPA-material-x-casa` está **resolvida com dado** e o documento **corrigido** | o número real + o commit |
| **CA4** | O `errorWorkflow` do Agregador está configurado | releitura das `settings` |
| **CA5** | Toda fonte declarada "consertada" tem **linha nova com data posterior** | consulta no BigQuery, não execução verde |
| **CA6** | O que exige decisão do Olavo voltou **com opções e custo**, não como pergunta aberta | §3 |
| **CA7** | Nada quebrou no que já funcionava | as outras fontes do Agregador continuam recebendo |
| **CA8** | Se publicou, o publicado é o que está no ar (**R13**) | `versionId == activeVersionId` |
| **CA9** | A descrição do Agregador conta o que mudou (**R5**) | ⚠️ hoje ela **não menciona** que 3 de 6 destinos estão parados |

---

## 8. Fora de escopo

| Fora | Por quê |
|---|---|
| Clarity | **saiu do índice** por decisão do Olavo (26/09) — voltou a ser ferramenta. A coleta fica, o estudo da API é outra etapa |
| Search Console | **nunca existiu** — é construção nova, não conserto |
| mudar o índice, os pesos ou o dicionário | é ADR-41/42, do chat-mãe |
| ligar o T28 | **parado por decisão** do Olavo em 27/09, com volta atrelada ao F2 |
| pedir cota ao Google por conta própria | **é decisão do Olavo** — envolve o fornecedor e possivelmente dinheiro |

---

## 9. Registro obrigatório (R3) e fechamento (R2)

- Linha na DB Notion **"PHI — Registro de Execuções (Sub-chats)"** ao **começar** e ao **encerrar**:
  frente **Saúde Digital/Agregador** · o que foi feito · estado · próximo passo · link.
- Ao terminar: corrigir o **`MAPA-material-x-casa.md`** e o **`DICIONARIO-DE-INDICADORES-v0.md`** com
  os números reais, e registrar o as-built. **O real vence o plano.**

---

## 10. O relatório de volta

1. Os **9 critérios**, com prova ou motivo
2. A tabela das **três fontes**: nó · erro exato · classificação · o que foi feito
3. As **opções** do que não é seu para decidir, com custo
4. **O que você mediu e me desmentiu** — este brief cita números de 25 e 26/09 que eu **não** medi hoje
5. O que ficou de fora e por quê

> 🔴 **Se uma premissa cair, PARE e devolva.** Aconteceu três vezes nesta semana e **as três vezes
> foi o trabalho certo.**
