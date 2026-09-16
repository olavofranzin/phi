# PROSP-06O — estado, primeira análise e pedido de brief

> **Para:** chat-mãe (planejamento estratégico)
> **De:** sub-chat de execução PROSP-05/06 Odoo
> **Data:** 2026-09-16
> **Branch:** `claude/consolidacao-2026-08`
> **O que se pede:** escrever o **brief de execução** para um sub-chat novo corrigir o PROSP-06O.
> Esta é a **primeira análise**. A **última análise e o registro na documentação são do chat-mãe.**

---

## 1. Onde a frente está

A migração HubSpot → Odoo 19 está **quase toda feita**. O que falta é a volta do CRM para a planilha.

| Peça | Estado |
|---|---|
| **PROSP-05O CRM-out Odoo** (`0H1mdPuICHsyWGxt`) | ✅ **Funciona.** 4 rodadas de backfill em 16/09: 81 linhas carimbadas, 62 atualizações, 19 leads novos, **zero erro em 81 escritas** |
| **PROSP-04 Enriquecimento** (`EFD7Drr0LDMqfDXw`) | ✅ Ativo, apontando para o P5O desde 16/09 |
| **PROSP-05 HubSpot** (`94lSWJfxfu653KdN`) | ✅ Aposentado com os 5 passos da R5 |
| **TMP Inserção odoo crm** (`7COGAPeoofZCh58B`) | ✅ Arquivado pelo Olavo (sem o rename da R5 — ver §6) |
| **Sync HubSpot → Planilha** (`WRFU2NM8rLJU7bRT`) | ✅ Desativado em 16/09 |
| **PROSP-06O Sync Odoo → Planilha** (`Yc4shCqDzqiYHR3s`) | ❌ **Construído, nunca completou uma rodada.** É o objeto deste brief |
| Piloto comercial | 19 leads no CRM, decisão do Olavo de **parar aí** e não carregar o resto |

**Critérios de aceite do P5 provados:** CA1, CA2, CA3, CA4, CA8, CA11.
**Não provados:** CA5 (depende do P6O), CA6, CA7, CA9, CA10.

O CA5 — *o desfecho comercial volta do CRM para a planilha* — **só se prova com o P6O funcionando.**
É por isso que ele é a próxima peça.

---

## 2. O que o PROSP-06O faz

Lê o `crm.lead` do Odoo (**só lê** — I8), junta com a planilha **por `id_crm`** (I4) e devolve o
desfecho comercial. `update`, **nunca** `appendOrUpdate` (I2).

Dois pontos do desenho que só apareceram ao olhar o dado real e **não podem ser desfeitos** por quem
for mexer:

1. **Lead perdido no Odoo é arquivado** (`active = false`), e o `getAll` não devolve arquivado por
   padrão. Existem **dois ramos de leitura** (ativos e arquivados) por causa disso. Sem o segundo, o
   desfecho mais valioso — a perda — nunca voltaria.
2. **O estágio congela na perda** (perder arquiva, não move). Por isso o desfecho manda no rótulo:
   `Ganho` / `Perdido` / nome do estágio, nessa ordem.

Confirmado no lead real: **`won_status` existe** no Odoo 19 (`pending` no lead 115), e o **`id_crm`
da planilha é o `id` do lead no Odoo** — a junção da I4 casa direto.

---

## 3. Primeira análise — as quatro execuções

| Execução | Hora | Resultado | Leitura |
|---|---|---|---|
| `39662` | 16/09 02:22 | success, 0,06 s | Parou no 1º nó. A Data Table não tinha o cursor `odoo_leads_sync` e devolveu zero itens. **Zero escritas** — falhou seguro |
| `39663` | 16/09 02:22 | **error**, 51 s | `[P6] Ler a planilha`: *"Quota exceeded for quota metric 'Read requests' … sheets.googleapis.com"* |
| `39827` | 16/09 13:14 | **error**, 50 s | **O mesmo erro de cota**, 11 horas depois |
| `39835` | 16/09 13:21 | success, 0,03 s | Execução **parcial** (`destinationNode: Loop Over Items`). O cursor já existe, `since = 2026-09-16T00:03:15Z`, e o Juntar entregou **~100 leads** |

### 3.1 A causa raiz — com alto grau de confiança

O `39663` era explicável pelas 81 escritas do backfill minutos antes. **O `39827` não é** — aconteceu
11 horas depois, sem nenhuma carga em volta. Cota que estoura sozinha não é resíduo: é o próprio
workflow batendo na API muitas vezes.

O `[P6] Ler a planilha` foi criado com **`executeOnce: true`**, justamente para ler a aba uma vez só.
**Esse ajuste foi silenciosamente ignorado.** `executeOnce` **não faz parte do schema de criação de
nó** da ferramenta de update do n8n — ele é *ajuste de nó*, não parâmetro. O mesmo já aconteceu nesta
sessão com o `alwaysOutputData` do `[P6] Ler cursor`, e o sintoma foi idêntico: o workflow se
comportou como se a linha não existisse.

**Consequência:** o nó roda **uma vez por item**. Com ~100 leads vindos do Odoo, são ~100 leituras da
planilha inteira em poucos segundos. A cota de "leituras por minuto" estoura na hora, sempre.

O `[P6] Calcular novo cursor` tem o **mesmo problema** — também foi criado com `executeOnce` e
também deve estar sendo ignorado.

> **É a R11 de novo, na forma mais traiçoeira: a instrução foi escrita, aceita sem erro, e não
> existe.** O nó parece configurado. A tela não mente — o schema é que não tinha onde guardar.

### 3.2 O cursor está adiantado — há perda silenciosa armada

O cursor `odoo_leads_sync` está em **`2026-09-16T00:03:15Z`**. Mas **nenhuma execução chegou ao nó de
escrita** — em todas, o último nó executado foi `[P6] Ler a planilha` ou anterior.

Ou seja: **o cursor avançou sem que nada tenha sido escrito na planilha.** Dezenas de leads têm
`write_date` entre `00:03:06` e `00:03:15` — abaixo do cursor. Na próxima rodada eles serão
descartados como "não modificados" e **nunca serão sincronizados**.

Esse é o defeito mais perigoso da lista, porque é **invisível**: o workflow vai rodar verde e esses
leads simplesmente não aparecerão.

### 3.3 O workflow foi alterado por outra mão

A execução `39835` mostra um nó **`Loop Over Items`** (splitInBatches) que **não faz parte do desenho
original**. Alguém — Olavo ou outro agente — mexeu no workflow depois que este sub-chat parou.

**Quem for corrigir tem de ler o estado atual do workflow antes de qualquer coisa.** O desenho
descrito neste documento pode já não corresponder ao que está no n8n.

---

## 4. O que o sub-chat de correção precisa fazer

1. **Ler o workflow como ele está hoje** (`Yc4shCqDzqiYHR3s`) antes de tocar em qualquer nó, e
   comparar com o desenho da §2. Registrar o que mudou e por quê.
2. **Corrigir o `executeOnce`** do `[P6] Ler a planilha` e do `[P6] Calcular novo cursor` — via
   **ajuste de nó** (`setNodeSettings`), não como parâmetro de criação. Depois **confirmar lendo o
   workflow de volta**: nesta sessão o ajuste foi aceito sem erro e não existia.
3. **Recuar o cursor** `odoo_leads_sync` na Data Table `gbp_sync_cursor` (`zPnW2B39G0ovWjpA`). Ele
   está adiantado em relação ao que foi escrito (nada foi). Zerar, ou recuar para antes do lead mais
   antigo que precisa voltar.
4. **Provar que a cota parou de estourar** — uma rodada completa sem o erro do Sheets.
5. **Devolver a vazão para 50.** O `[P6] Vazao do lote` está em **3**, baixado para a estreia.
   Config mudada para teste e não devolvida foi exatamente como o carimbo do modo passou a mentir no
   P5 nesta mesma sessão.
6. **Provar o CA5**: o Olavo marca um lead como ganho ou perdido no Odoo, e o desfecho aparece na
   planilha na rodada seguinte. **É a única prova que vale.**

---

## 5. Critérios de aceite — já escritos, não renegociar

Foram escritos **antes** da construção (R9, item 4). Quem corrigir não os reescreve; prova ou reprova.

| # | Critério |
|---|---|
| **P6-1** | Nunca cria linha na planilha. Sem `id_crm` correspondente, o item é desviado **e contado** |
| **P6-2** | Não escreve em nenhuma coluna do P5 (`id_crm`, `data_envio_crm`, campos GBP) |
| **P6-3** | O desfecho vem de `won_status` + `lost_reason_id`, nunca da probabilidade do estágio |
| **P6-4** | O cursor **não avança** se a escrita falhar |
| **P6-5** | Fila vazia é visível: a execução diz "0 leads modificados", não passa batido |
| **P6-6** | Com P5 e P6 rodando, nenhum campo tem dois donos (é o **CA6**) |
| **P6-7** | Lead marcado ganho/perdido no Odoo aparece na planilha na rodada seguinte (é o **CA5**) |

**P6-4 está reprovado hoje** (§3.2). Os outros seis não foram testados.

---

## 6. Armadilhas conhecidas — não redescobrir

- **`executeOnce` e `alwaysOutputData` não são parâmetros de nó.** São ajustes. Passados na criação,
  somem sem erro. Sempre reler o workflow para confirmar que pegaram.
- **O P6O lê a aba inteira a cada rodada.** Mesmo com `executeOnce` certo, se o P5 estiver escrevendo
  linha a linha ao mesmo tempo, os dois podem estourar a cota do Sheets juntos. Vale vigiar.
- **Não copiar nada do Sync HubSpot** (`WRFU2NM8rLJU7bRT`). Ele casa por `id_hubspot` e escreve
  `data_sync_hubspot` — **duas colunas que não existem mais** — com `onError: continueRegularOutput`.
  É o bug das duas semanas da R11, ainda armado lá dentro.
- **`abordagem_ia` ficou deliberadamente de fora** do mapeamento. É campo do PHI na direção oposta;
  trazê-lo de volta recria o ping-pong que o TMP causava.
- **`motivo_ganho`, `num_interacoes` e `ultimo_contato`** ficaram de fora: não há equivalente honesto
  no Odoo hoje. Vazio é I3, não é esquecimento.

---

## 7. O que **não** é do sub-chat de correção

- **O mapeamento `score_gbp` → `gbp_score_tecnico` no P5O.** A skill `phi-odoo-crm` proíbe
  explicitamente ("grandeza diferente… não mapeie") e o lead 115 mostra o campo preenchido. **É
  escopo do P5**, precisa de decisão, e mexer num writer que acabou de carregar 81 leads sem plano
  seria a R7 ao contrário. Registrado em §11.11 do contrato.
- **A aposentadoria formal do Sync HubSpot** (nome `[APOSENTADO]` + sticky). Só depois que o P6O
  estiver provado — pôr o prefixo antes disso seria mentir no nome.
- **O rename do TMP arquivado.** O n8n não permite renomear workflow arquivado; a memória dele vive
  no §10 do contrato.
- **Enriquecer os leads crus.** É rodar o PROSP-04, custa Apify + Gemini e depende de OK de budget do
  Olavo.

---

## 8. Onde está escrito

- **Contrato:** `docs/strategic-planning/prospeccao/CONTRATO-PROSPECCAO.md`, §11.9 a §11.12
- **Commits:** `d3d2b8c` (backfill + carimbo do modo), `f7c06dc` (4 rodadas), `589c602` (achados)
- **Notion:** "PHI — Registro de Execuções (Sub-chats)", linha de 16/09

---

## 9. Grau de confiança desta análise

**0,85.**

- **Fato verificado:** as quatro execuções, seus erros literais, o estado do cursor, o valor do
  `won_status`, a existência do nó `Loop Over Items`, o `executeOnce` ausente do schema de criação.
- **Estimativa forte:** que o `executeOnce` ignorado é a causa da cota estourada. O raciocínio é
  sólido (o erro repete 11 h depois, sem carga em volta; o mesmo ajuste já sumiu uma vez nesta
  sessão), mas **não testei a correção** — nenhuma rodada completou depois dela.
- **Não sei:** quem alterou o workflow depois que parei, nem por quê. Nem se há outros ajustes de nó
  perdidos além dos dois que identifiquei.
