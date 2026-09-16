# Brief de execução — corrigir o PROSP-06O (Sync Odoo → Planilha)

> **Para:** sub-chat novo de execução
> **De:** chat-mãe
> **Data:** 2026-09-16
> **Branch:** `claude/consolidacao-2026-08`
> **Workflow:** `PROSP-06O Sync Odoo -> Planilha` (`Yc4shCqDzqiYHR3s`) — **inativo**, nunca completou
> uma rodada
> **Origem:** `docs/handoff/2026-09-16-prosp06-correcoes-brief-para-chat-mae.md` (primeira análise,
> feita pelo sub-chat que construiu) + leitura do workflow feita pelo chat-mãe em 16/09

---

## 0. Regra zero — leia o workflow antes de concordar comigo

Este brief foi escrito depois de ler o `Yc4shCqDzqiYHR3s` como ele está hoje. **Mesmo assim,
releia.** O workflow foi alterado por terceiros pelo menos uma vez (§2.2) e pode ter sido de novo.

Se o que você ler não bater com o que está aqui, **pare e relate**. Não conserte um desenho que já
não existe — foi exatamente assim que a análise anterior errou o alvo.

---

## 1. O que o PROSP-06O é, e por que ele é a próxima peça

Ele fecha o circuito da Prospecção: lê o `crm.lead` do Odoo (**só lê** — invariante I8), casa com a
planilha `leads` por **`id_crm`** (I4) e devolve o **desfecho comercial** — ganhou, perdeu, por quê,
em quantos dias, e se o `potencial_comercial` tinha acertado.

**Sem ele, a base de aprendizado nunca se fecha.** O `PROSP-05O` já escreve no CRM e funciona
(81 escritas, zero erro). O que falta é a volta. É o **CA5** dos critérios de aceite, e ele só se
prova com o P6 rodando.

Dois pontos do desenho que **não podem ser desfeitos** por você:

1. **Lead perdido no Odoo é arquivado** (`active = false`) e a busca padrão não devolve arquivado.
   Por isso existem dois ramos de leitura, `[P6] Ler leads ativos` e `[P6] Ler leads arquivados`.
   Sem o segundo, o desfecho mais valioso — a perda — nunca voltaria.
2. **O estágio congela na perda** (perder arquiva, não move). Por isso o rótulo vem do desfecho:
   `Ganho` → `Perdido` → nome do estágio, nessa ordem. Nunca da probabilidade do estágio.

---

## 2. O diagnóstico — o que a primeira análise achou, e o que ela não achou

### 2.1 A causa que ela achou, e está certa pela metade

`[P6] Ler a planilha` (Google Sheets) **não tem `executeOnce`**. Confirmado na leitura de 16/09: o
ajuste não está no nó.

**Nó do n8n roda uma vez por item de entrada.** Com ~100 leads vindos do Odoo, são ~100 leituras da
aba inteira em poucos segundos. A cota de leituras por minuto do Sheets estoura na hora, sempre. É a
explicação literal dos erros das execuções `39663` (02:22) e `39827` (13:14).

⚠️ **Correção ao diagnóstico anterior:** ele dizia que `[P6] Calcular novo cursor` tem o mesmo
problema. **Não tem.** Aquele é um nó `Code` em modo *Run Once for All Items* (o padrão), então já
roda uma vez só. **`executeOnce` ali é inútil.** O único nó que precisa dele é o `[P6] Ler a
planilha`.

### 2.2 A causa que ela não achou — e que é a maior

Alguém embrulhou **o pipeline inteiro dentro de um loop**. A ligação hoje é esta:

```
[P6] Juntar  →  Loop Over Items
Loop Over Items  saída 0 (done)  →  (nada)
Loop Over Items  saída 1 (loop)  →  Wait  →  [P6] Ler a planilha  →  ...
                                    ...  →  [P6] Atualizar cursor  →  volta ao Loop Over Items
```

O `Loop Over Items` (`splitInBatches`) e o `Wait` **não têm o prefixo `[P6]`** e **não têm nenhum
parâmetro configurado** — nem tamanho de lote, nem tempo de espera. E o `updatedAt` do workflow é
**16/09 13:16:28**, ou seja: entre a execução `39827` (13:14, erro de cota) e a `39835` (13:21).

**Quem fez e por quê — dito pelo Olavo em 16/09:** foi ele, tentando conter a demanda que travava o
nó do Google Sheets, na hipótese de que **as atualizações chegam todas de uma vez**.

**A preocupação é legítima, mas é do outro nó.** O erro das execuções `39663` e `39827` diz, com
todas as letras, `Quota exceeded for quota metric 'Read requests'` — **leitura**, não escrita. E o nó
de escrita recebe hoje **no máximo 3 itens** (`[P6] Vazao do lote` = 3): ele não teria como estourar
nada.

**O loop não atacou nem uma coisa nem outra.** Como o que custa — a leitura da aba inteira — ficou
**dentro** do loop, o número de leituras não caiu: continuou em ~100, agora uma por volta, com uma
espera no meio. E as escritas também não diminuíram, porque o `[P6] So os modificados` reentrega a
lista inteira a cada volta e o `Vazao do lote` corta sempre os **mesmos** 3.

**E o loop não pagina nada.** O `[P6] So os modificados` não lê o lote: ele lê
`$('[P6] Juntar').all()`, ou seja, **a lista inteira, toda vez**. O `since` também é fixo, calculado
uma vez lá no começo. Então cada volta do loop reprocessa exatamente os mesmos leads, escreve
exatamente as mesmas 3 linhas, e avança o cursor de novo.

> **Não é um loop de paginação. É o trabalho inteiro repetido uma vez por lead.**

**O que fazer:** **apagar o `Loop Over Items` e o `Wait`** e religar `[P6] Juntar` direto em
`[P6] Ler a planilha`. Uma rodada = um lote; o que sobrar volta na rodada seguinte, 6 h depois, que é
o desenho original e o mais simples que resolve.

### 2.3 O cursor está adiantado — há perda silenciosa armada

O cursor `odoo_leads_sync` (Data Table `gbp_sync_cursor`, `zPnW2B39G0ovWjpA`) está em
**`2026-09-16T00:03:15Z`**, e dezenas de leads têm `write_date` logo abaixo disso. Se a planilha não
recebeu essas escritas, esses leads serão descartados como "não modificados" **para sempre** — o
workflow roda verde e eles simplesmente não aparecem.

**Escrever de novo é barato; perder é irreversível.** O próprio comentário do nó diz isso: *"Perder é
pior que repetir"*. A escrita do P6 é `update` em linha que já existe — repetir não faz dano.

**O que fazer:** **zerar o cursor** (ou recuar para antes do lead mais antigo que precisa voltar)
antes da primeira rodada de verdade. Não gaste tempo investigando se alguma escrita passou: a ação
segura é a mesma nos dois casos.

### 2.4 A vazão está em 3 — sobe para 20, não para 50

`[P6] Vazao do lote` está com `maxItems: 3`, baixado para a estreia. **Config mudada para teste e não
devolvida** foi exatamente como o carimbo do modo passou a mentir no P5 (§11.9 do contrato).

O desenho original dizia 50. **Suba para 20, não para 50** — 20 é o único número de que temos prova:
o PROSP-05O fez **quatro rodadas de 20 atualizações no Sheets, com zero erro**. 50 é estimativa.
Depois de uma rodada limpa em 20, subir é decisão do Olavo, e com o número medido na mão (RQ1: a
vazão é ajustável de propósito).

**Se um dia for preciso mesmo espaçar as escritas**, a forma certa é o loop **em volta do nó de
escrita apenas**, com a leitura da planilha **fora** dele. Foi a inversão disso que criou o problema
de hoje: o barato dentro do loop, o caro repetido.

---

## 3. A ordem do conserto

Nesta ordem, e **provando cada passo antes do próximo**:

1. **Ler o workflow como ele está** e comparar com a §2. Relatar toda diferença.
2. **Apagar o `Loop Over Items` e o `Wait`.** Religar `[P6] Juntar` → `[P6] Ler a planilha`.
3. **Pôr `executeOnce` no `[P6] Ler a planilha`.** É **ajuste de nó** (`setNodeSettings`), não
   parâmetro de criação — passado na criação, some sem erro. **Depois leia o workflow de volta e
   confirme que pegou.** Se não pegou, diga; não siga em frente supondo.
4. **Zerar o cursor** `odoo_leads_sync`.
5. **Rodar com `maxItems: 3` ainda.** O que tem de aparecer: **zero erro de cota** e o
   `console.log` do `[P6] So os modificados` dizendo quantos leram, quantos modificaram, quantos
   ficaram de fora e por quê.
6. **Conferir na planilha** as 3 linhas escritas: `sync_por = PROSP-06O`, `data_sync_crm` de hoje, e
   **nenhuma coluna do P5 tocada**.
7. **Subir a vazão para 20** (não 50 — §2.4) e rodar até a fila esvaziar.
8. **Provar o CA5 com o Olavo:** ele marca um lead como ganho ou perdido no Odoo, e o desfecho
   aparece na planilha na rodada seguinte. **É a única prova que vale.**
9. **Só então** propor ativar o gatilho de 6 h — e **ativar depende de OK do Olavo**.

---

## 4. Critérios de aceite — escritos antes, não renegociáveis

Vieram da entrevista de execução (R9). Você **prova ou reprova**; não reescreve.

| # | Critério | Hoje |
|---|---|---|
| **P6-1** | Nunca cria linha na planilha. Sem `id_crm` correspondente, o item é desviado **e contado** | não testado |
| **P6-2** | Não escreve em nenhuma coluna do P5 (`id_crm`, `data_envio_crm`, campos GBP) | não testado |
| **P6-3** | O desfecho vem de `won_status` + `lost_reason_id`, nunca da probabilidade do estágio | não testado |
| **P6-4** | O cursor **não avança** se a escrita falhar | **reprovado** (§2.3) |
| **P6-5** | Fila vazia é visível: a execução diz "0 leads modificados", não passa batido | não testado |
| **P6-6** | Com P5 e P6 rodando, nenhum campo tem dois donos (é o **CA6**) | não testado |
| **P6-7** | Lead marcado ganho/perdido no Odoo aparece na planilha na rodada seguinte (é o **CA5**) | não testado |

---

## 5. A entrevista de alinhamento — responda **antes** de tocar em qualquer nó

Esta parte viaja com o brief de propósito. Na última vez ela chegou três dias depois da construção, e
quatro das nove perguntas já tinham sido respondidas por incidente. **Entrevista atrasada não é
entrevista, é autópsia** (R9).

Responda por escrito, no seu primeiro relato:

1. **O loop foi posto pelo Olavo para espaçar as escritas no Sheets** (§2.2). Apagá-lo devolve o
   fluxo ao desenho original. **Que sinal apareceria** se a preocupação dele estivesse certa e as
   escritas em lote realmente travassem o nó? Descreva o sintoma antes de rodar, para saber
   reconhecê-lo.
2. **`[P6] Ler a planilha` lê a aba inteira a cada rodada.** Com o P5 escrevendo linha a linha ao
   mesmo tempo, os dois podem estourar a cota do Sheets juntos. Como você saberia se isso aconteceu,
   em vez de descobrir pelo erro?
3. **Se a escrita no Sheets falhar no meio do lote** — 20 escritas, a 11ª falha — o cursor avança
   até onde? O desenho atual atende ao **P6-4** nesse caso, ou só no caso de falha total?
4. **`acerto_previsao` usa `pot >= 60` como corte de "alto".** Esse 60 é o corte **temporário** do
   piloto, não um número do modelo. Congelá-lo dentro da regra de aprendizado tem custo? Onde ele
   deveria morar?
5. **Qual é o menor teste que reprova o seu conserto?** Descreva-o antes de rodar qualquer coisa.
6. **Quantos itens vão entrar na fila** na primeira rodada depois de zerar o cursor? Diga o número
   **antes** de rodar. (R11, regra 3: antes de chamar algo de teste, conte quantos itens entraram.)

---

## 6. Armadilhas conhecidas — não redescobrir

- **`executeOnce` e `alwaysOutputData` não são parâmetros de nó, são ajustes.** Passados na criação,
  somem sem erro nenhum. **Sempre reler o workflow para confirmar que pegaram.**
- **Não copiar nada do `Sync HubSpot -> Planilha`** (`WRFU2NM8rLJU7bRT`, desativado em 16/09). Ele
  casa por `id_hubspot` e escreve `data_sync_hubspot` — **duas colunas que não existem mais** — com
  `onError: continueRegularOutput`. É o bug das duas semanas da R11, ainda armado lá dentro.
- **`abordagem_ia` fica deliberadamente de fora.** É campo do PHI na direção oposta; trazê-lo de
  volta recria o ping-pong que o TMP causava. **O workflow é bidirecional; o CAMPO é sempre de mão
  única.**
- **`motivo_ganho`, `num_interacoes` e `ultimo_contato`** ficam de fora: não há equivalente honesto
  no Odoo hoje. **Vazio é I3, não é esquecimento.**
- **Fila vazia não pode casar com nada.** O código usa `__SEM_LEAD__` de propósito: string vazia no
  Sheets casa com todas as linhas vazias. Não "simplifique" isso (R11, regra 1).
- **Executar por MCP entra sempre pelo gatilho manual.** Se o teste depender do gatilho de horário,
  ele não vai entrar por onde você acha que entrou.

---

## 7. O que **não** é seu escopo

- **O mapeamento `score_gbp` → `gbp_score_tecnico` no P5O** (§11.11 do contrato). A skill
  `phi-odoo-crm` proíbe com todas as letras. **É decisão do Olavo e é escopo do P5.** Não toque.
- **A aposentadoria formal do `Sync HubSpot`** (prefixo `[APOSENTADO]` + sticky, R5). Só depois que o
  P6O estiver provado — pôr o nome antes disso seria mentir no nome.
- **Enriquecer leads crus** (rodar o PROSP-04): custa Apify + Gemini e **depende de OK de budget do
  Olavo**.
- **Carregar mais leads no CRM.** O piloto fechou em 19 por decisão do Olavo. Não aumente por
  inércia.
- **Ativar o workflow.** Propor, sim. Ativar, só com OK.

---

## 8. Obrigações de registro

- **Notion (R3):** ao **começar** e ao **encerrar**, linha na DB *"PHI — Registro de Execuções
  (Sub-chats)"* com frente · o que foi feito · estado · próximo passo · link do artefato. Sem isso o
  digest diário do Olavo diz "sem progresso".
- **Descrição do workflow (R5):** hoje ela termina em *"EM CONSTRUCAO"*. Quando o P6O passar, a
  descrição tem de dizer o que ele faz, por que existe e **o que substituiu**.
- **Contrato (R2):** o as-built vai para `docs/strategic-planning/prospeccao/CONTRATO-PROSPECCAO.md`,
  seguindo a numeração do §11. **O real vence o plano.**
- **Commit no git** na mesma sessão.

---

## 9. O que devolver ao chat-mãe

1. As respostas da §5, **antes** de qualquer alteração.
2. O placar dos sete critérios: provado, reprovado ou não testado — **com a execução que prova cada
   um**.
3. O que você mudou e **por quê**, nó a nó.
4. **O que você não sabe.** Com grau de confiança, como a análise anterior fez. Foi a melhor parte
   dela.
