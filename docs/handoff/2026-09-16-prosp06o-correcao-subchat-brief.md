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

⚠️ **O que se sabe e o que não se sabe.** A execução `39835` chegou até o nó de atualizar o cursor,
e o único caminho até lá passa pelo nó de escrita — então é possível que 3 linhas tenham sido
gravadas. **Não dá para afirmar nem uma coisa nem outra daqui**, e não importa: a ação segura é a
mesma nos dois casos, porque a escrita do P6 é `update` em linha que já existe.

**O que fazer:** **zerar o cursor antes da primeira rodada de verdade.** Não gaste tempo
investigando se alguma escrita passou.

✅ **FEITO — o Olavo apagou a linha em 16/09.** O cursor não existe mais; o `[P6] Calcular since` vai
cair no padrão de 30 dias na próxima rodada. **O passo 4 da §3 está cumprido.**

🔴 **Mas a ordem inverteu, e isso tem uma consequência.** A linha foi apagada **antes** do conserto.
Enquanto o loop estiver lá e o `executeOnce` faltando, **qualquer execução do workflow agora puxa os
~115 leads de uma vez** — estoura a cota outra vez e pode empurrar o cursor para frente de novo.

**O workflow está inativo**, então nada dispara sozinho. **Não rode nada antes dos passos 2 e 3.** Se
por qualquer motivo ele rodar antes, **avise e peça para o Olavo apagar a linha de novo** — não
prossiga com o cursor sujo.

---

**Como era o bloqueio, para memória:** As ferramentas de Data Table criam tabela, criam coluna,
renomeiam e **inserem** linha — **não atualizam nem apagam** linha existente (procurado em 16/09,
R7). **Quem apaga é o Olavo**, na mão: *Data Tables → `gbp_sync_cursor` → linha com
`chave = odoo_leads_sync` → apagar a linha.*

**Apagar é melhor que editar:** o `alwaysOutputData` do `[P6] Ler cursor` já cobre a leitura vazia, e
o código cai no padrão de 30 dias — que é o caminho que se quer testar de verdade.

**Não contorne mexendo no `[P6] Calcular since` "só para este teste".** Config mudada para teste é
config que alguém tem de lembrar de devolver — foi assim que o carimbo do modo passou a mentir
(§11.9) e a vazão ficou em 3 (§2.4). **Espere o Olavo.**

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

### 2.5 O P6-4 está de pé por acidente, não por desenho

`[P6] Calcular novo cursor` lê a **entrada** do nó de escrita (`[P6] Vazao do lote`): ele calcula o
cursor sobre os leads que **deveriam** ter sido escritos, não sobre os que **foram**.

Isso só não causa perda por um motivo: **o `[P6] Gravar na planilha` não tem `onError`**, então
qualquer falha derruba a execução e o nó do cursor nunca roda. O cursor fica onde estava e a rodada
seguinte traz tudo de novo.

> **A trava de segurança do P6-4 é hoje a ausência de uma configuração — e ausência não se documenta
> sozinha.** Basta alguém pôr `onError: continueRegularOutput` ali (exatamente o que existe no Sync
> HubSpot) e o cursor passa a avançar sobre leads nunca escritos. Perda silenciosa, permanente,
> verde.

**Duas ações, em momentos diferentes:**

1. **Agora, junto com o conserto:** uma **nota no `[P6] Gravar na planilha`** dizendo que o `onError`
   vazio é **proposital** e por quê. Custa zero e vale hoje (R5).
2. **Na rodada 2, depois do conserto provado (§10.1):** o cursor passa a avançar sobre o que foi
   escrito de fato.

⚠️ **E não é ler `$('[P6] Gravar na planilha').all()` direto.** O `_write_ms` é campo **auxiliar** e
**não está no mapeamento de colunas** do nó do Sheets — o que sai de lá são as colunas mapeadas. Se
ele não atravessar, o `maxMs` dá zero, o nó devolve `[]`, **o cursor nunca avança** e o workflow
reprocessa a mesma fila para sempre.

**O desenho certo:** a saída da escrita diz **quais `id_crm` foram gravados**; o `_write_ms` de cada
um vem do `[P6] Vazao do lote`, casando pelo `id_crm`.

🔴 **Rode uma vez, olhe o que a saída do nó de escrita traz de verdade, e só então escreva o
código.** Escrever no escuro é o mesmo erro do `executeOnce`: a instrução parecia certa e não
existia (R6).

### 2.6 `[P6] Ler leads ativos` sem filtro — teto conhecido, não se conserta agora

O nó traz **todo lead ativo** do CRM em toda rodada (`returnAll: true`, sem `filters`); o corte por
`write_date` só acontece depois, no código.

**Não é descuido: o nó Odoo v2 só filtra por igualdade**, não tem operador `>`. Com ~115 leads não
dói.

**O sinal para revisitar é a duração do próprio nó**, visível em toda execução — não precisa de
alarme nenhum. Quando ela começar a incomodar, a saída é trocar o nó por uma chamada com domínio de
verdade. **Não é tarefa sua.**

> Decisão consciente que não vira texto é indistinguível de descuido (R5). Por isso está aqui.

### 2.7 `acerto_previsao` leva a régua dentro do texto — rodada 2

Hoje o campo grava `"acertou (alto->ganhou)"`, e o que define "alto" é um `pot >= 60` escondido
dentro do código. **Isso não guarda um dado: guarda um veredito já julgado, com a régua do dia em que
a linha foi escrita.** No dia em que a régua mudar, as linhas velhas ficam julgadas por uma régua e
as novas por outra, e **nada na linha diz qual foi**.

É pior que o caso do modo (§11.9): lá o comportamento era idêntico e só o carimbo mentia. **Aqui o
próprio veredito muda** — o mesmo lead pode ser "acertou" numa régua e "errou" na outra. E como este
campo é **a base de aprendizado do score**, uma base que mistura duas réguas sem etiqueta não fica
imprecisa: fica **inutilizável**, e o estrago é retroativo.

**O conserto:** `"acertou (>=60 -> ganhou)"` em vez de `"acertou (alto->ganhou)"`. Uma mudança de
texto, nenhuma coluna nova, e **cada linha passa a dizer com que régua foi julgada** (R5 aplicada ao
dado). Se a régua mudar, as linhas velhas se explicam sozinhas.

⚠️ **Há dois `60` no projeto, e eles não são a mesma coisa.** São iguais hoje por coincidência de
quem escreveu, não por necessidade:

| | O que decide | Natureza |
|---|---|---|
| **Corte de entrada** (`potencial_comercial >= 60` no P5) | quais leads vão para o CRM | **temporário** — o Olavo já disse que sobe |
| **Régua de aprendizado** (`pot >= 60` no `acerto_previsao`) | o que conta como "alto" ao julgar o acerto | pergunta de **análise**, não de operação |

**Um não segue o outro.** Quando o corte de entrada subir para 70, a régua de aprendizado **não tem
obrigação nenhuma de subir junto**.

**Onde o número mora: no código do `[P6] So os modificados`, escrito à mão, e carimbado em toda linha
que ele escreve.** Não vai para nó de config — config é fácil de trocar em silêncio, e foi
exatamente assim que o carimbo do modo passou a mentir. Em código, trocar a régua exige um commit,
que fica na história.

---

## 3. A ordem do conserto

Nesta ordem, e **provando cada passo antes do próximo**:

> 🔴 **Conserto e melhoria não andam juntos.** Os passos 2 e 3 devolvem o workflow ao desenho já
> aprovado. A mudança do cursor (§2.5) é **melhoria** e vai na **rodada 2**. Se as duas entrarem no
> mesmo commit e algo quebrar, ninguém sabe qual delas quebrou — e o teste do passo 5 deixa de provar
> o que foi desenhado para provar.

**Rodada 1 — o conserto**

1. **Ler o workflow como ele está** e comparar com a §2. Relatar toda diferença.
2. **Apagar o `Loop Over Items` e o `Wait`.** Religar `[P6] Juntar` → `[P6] Ler a planilha`.
3. **Pôr `executeOnce` no `[P6] Ler a planilha`.** É **ajuste de nó** (`setNodeSettings`), não
   parâmetro de criação — passado na criação, some sem erro. **Depois leia o workflow de volta e
   confirme que pegou.** Se não pegou, diga; não siga em frente supondo.
   **No mesmo commit:** a nota no `[P6] Gravar na planilha` sobre o `onError` vazio (§2.5).
4. ✅ **Cursor zerado** — o Olavo apagou a linha `odoo_leads_sync` em 16/09 (§2.3). **Feito, mas
   feito antes do conserto:** não rode nada antes dos passos 2 e 3, senão o cursor suja de novo.
5. **Rodar com `maxItems: 3` ainda.** Os quatro números que reprovam ou aprovam:
   **`[P6] Ler a planilha` executou 1 vez · `_lidos_no_odoo` > 0 · zero erro 429 · 3 linhas
   carimbadas na planilha.** Qualquer um fora do lugar, reprovado.
6. **Conferir na planilha** as 3 linhas: `sync_por = PROSP-06O`, `data_sync_crm` de hoje, e
   **nenhuma coluna do P5 tocada**.
7. **Subir a vazão para 20** (não 50 — §2.4) e rodar até a fila esvaziar.

**Rodada 2 — as duas melhorias, só depois da rodada 1 provada**

8. **O cursor passa a avançar sobre o que foi escrito** — com a saída do nó de escrita **olhada
   antes** de escrever o código (§2.5).
9. **`acerto_previsao` leva a régua dentro do texto** (§2.7).

**Fechamento**

10. **Provar o CA5 com o Olavo:** ele marca um lead como ganho ou perdido no Odoo, e o desfecho
    aparece na planilha na rodada seguinte. **É a única prova que vale.**
11. **Só então** propor ativar o gatilho de 6 h. **Ativar depende de OK do Olavo** — e a proposta
    tem de dizer **em que minuto** o gatilho do P6 cai em relação ao do P5: se coincidirem, colidem
    na cota do Sheets sempre; se ficarem defasados, nunca. Isso não pode ficar por conta da sorte.

---

## 4. Critérios de aceite — escritos antes, não renegociáveis

Vieram da entrevista de execução (R9). Você **prova ou reprova**; não reescreve.

| # | Critério | Hoje |
|---|---|---|
| **P6-1** | Nunca cria linha na planilha. Sem `id_crm` correspondente, o item é desviado **e contado** | não testado |
| **P6-2** | Não escreve em nenhuma coluna do P5 (`id_crm`, `data_envio_crm`, campos GBP) | não testado |
| **P6-3** | O desfecho vem de `won_status` + `lost_reason_id`, nunca da probabilidade do estágio | não testado |
| **P6-4** | O cursor **não avança** se a escrita falhar | atendido hoje **por acidente**, não por desenho (§2.5) |
| **P6-5** | Fila vazia é visível: a execução diz "0 leads modificados", não passa batido | não testado |
| **P6-6** | Com P5 e P6 rodando, nenhum campo tem dois donos (é o **CA6**) | não testado |
| **P6-7** | Lead marcado ganho/perdido no Odoo aparece na planilha na rodada seguinte (é o **CA5**) | não testado |

---

## 5. A entrevista de alinhamento — ✅ **respondida em 16/09**

> **Já foi respondida**, por escrito e **antes** de qualquer alteração no workflow. As respostas e o
> que o chat-mãe decidiu a partir delas estão na **§10**. **Não refaça** — leia a §10 e siga.
> As perguntas ficam abaixo como registro.

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
- **No n8n, "o parâmetro não está lá" tem dois significados** e **não dá para distinguir olhando o
  JSON**: *foi ignorado* (o caso do `executeOnce`) ou *é o valor padrão e o editor limpou ao salvar*
  (o caso do `[P6] Juntar`, criado com `mode: "append"` explícito). Na dúvida, o teste é o
  comportamento, não o JSON.
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
- **"Corrigir" o 61 vs 62 do §11.10 do contrato.** **Os dois números estão certos:** 61 é o total das
  quatro rodadas de backfill; 62 inclui a atualização da Niti na execução `39649`, o smoke do ramo
  contínuo, fora das rodadas. `62 + 19 criações = 81`. **Trocar 62 por 61 criaria o erro em vez de
  corrigi-lo.**

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

1. ~~As respostas da §5~~ — **feito em 16/09** (§10). O que vem agora é o **resultado da rodada 1**:
   os quatro números do passo 5 da §3, com a execução que os mostra.
2. O placar dos sete critérios: provado, reprovado ou não testado — **com a execução que prova cada
   um**.
3. O que você mudou e **por quê**, nó a nó.
4. **O que você não sabe.** Com grau de confiança, como a análise anterior fez. Foi a melhor parte
   dela.

---

## 10. Registro — o relatório de alinhamento e as decisões do chat-mãe (16/09)

> **As instruções que saíram daqui já estão dobradas no corpo do brief** (§2.3, §2.5, §2.6, §2.7 e
> §3). Esta seção fica como **história**: quem perguntou o quê, quem respondeu, e por que se decidiu
> assim. Para executar, siga o corpo.

O executor respondeu as 6 perguntas da §5 **antes** de alterar qualquer nó, e o sub-chat da primeira
análise revisou as respostas. Esta seção fecha o que ficou em aberto. **É a última análise; o que
está aqui vale mais que o que está acima.**

### 10.1 Não juntar conserto com melhoria

Os passos 2 e 3 (tirar o loop, pôr o `executeOnce`) são **conserto**: devolvem o workflow ao desenho
que já estava aprovado. As duas propostas da §10.2 e §10.3 são **melhoria**.

**Vão em rodadas separadas.** Conserto primeiro, rodada limpa em `maxItems: 3`, e só depois a
melhoria. Se as duas coisas entrarem juntas e algo quebrar, ninguém sabe qual delas quebrou — e o
teste da pergunta 5 (o `[P6] Ler a planilha` executou 1 vez?) deixa de provar o que foi desenhado
para provar.

### 10.2 O cursor passa a ler o que foi escrito — **aprovado, com uma correção no desenho**

A proposta do executor está certa no diagnóstico: hoje o `[P6] Calcular novo cursor` lê a **entrada**
do nó de escrita (`[P6] Vazao do lote`), então ele calcula o cursor sobre os leads que *deveriam* ter
sido escritos, não sobre os que *foram*. Só não há perda porque o nó de escrita **não tem `onError`**
e qualquer falha derruba a execução inteira. A frase dele é exata:

> *"A trava de segurança do P6-4 é hoje a ausência de uma configuração, e ausência não se documenta
> sozinha."*

⚠️ **Mas a implementação proposta — ler `$('[P6] Gravar na planilha').all()` — provavelmente não
funciona.** O `_write_ms` é um campo **auxiliar**, não está no mapeamento de colunas do nó do Sheets.
O que o nó devolve na saída são as colunas mapeadas. Se o `_write_ms` não sobreviver, o
`maxMs` dá zero, o nó devolve `[]`, **o cursor nunca avança** e o workflow reprocessa a mesma fila
para sempre.

**O desenho certo, e é quase o mesmo trabalho:** a saída do Sheets diz **quais `id_crm` foram
escritos**; o `_write_ms` de cada um vem do `[P6] Vazao do lote`, casando pelo `id_crm`. Assim o
cursor avança sobre o que foi escrito de fato, sem depender de um campo auxiliar atravessar um nó
que não o conhece.

**Ordem obrigatória:** rodar uma vez, **olhar o que a saída do nó de escrita traz de verdade**, e só
então escrever o código. **Nunca escrever esse código no escuro** — é a R6, e é o mesmo erro do
`executeOnce`: a instrução parecia certa e não existia.

**E agora, de graça:** pôr uma **nota no `[P6] Gravar na planilha`** dizendo que o `onError` vazio é
**proposital** e por quê. Custa zero, vale hoje, e é a R5. Fazer isso no mesmo commit do conserto.

### 10.3 `acerto_previsao` leva a régua dentro do texto — **aprovado (opção b)**

`"acertou (>=60 -> ganhou)"` em vez de `"acertou (alto->ganhou)"`. Cada linha passa a dizer com que
régua foi julgada, e as linhas velhas se explicam sozinhas quando a régua mudar.

**Uma distinção que ninguém fez, e que muda onde o número mora:** há **dois 60 diferentes** no
projeto, iguais hoje por coincidência de quem escreveu, não por necessidade.

| | O que decide | De quem é |
|---|---|---|
| **Corte de entrada** (`potencial_comercial >= 60` no P5) | quais leads vão para o CRM | é **temporário**, e o Olavo já disse que sobe |
| **Régua de aprendizado** (`pot >= 60` no `acerto_previsao`) | o que conta como "alto" ao julgar o acerto | é uma pergunta de **análise**, não de operação |

**Um não deve seguir o outro.** Quando o corte de entrada subir para 70, a régua de aprendizado não
tem obrigação nenhuma de subir junto — são perguntas diferentes.

**Onde o número mora:** **no código do `[P6] So os modificados`, escrito à mão, e carimbado em toda
linha que ele escreve.** Não vai para nó de config. Config é fácil de trocar em silêncio — foi
exatamente assim que o carimbo do modo passou a mentir (§11.9 do contrato). Em código, trocar a régua
exige um commit, que fica na história; e o carimbo garante que nenhuma linha antiga fique órfã de
régua.

### 10.4 O `[P6] Ler leads ativos` sem filtro — teto conhecido, não se conserta agora

O nó traz **todo lead ativo** do CRM em toda rodada; o corte por `write_date` só acontece depois, no
código. Não é descuido: **o nó Odoo v2 só filtra por igualdade**, não tem operador `>`. Com ~115
leads não dói.

**Fica registrado como teto, com um sinal que não precisa de alarme nenhum:** a **duração do próprio
nó**, visível em toda execução. Quando ela começar a incomodar, a saída é trocar o nó por uma
chamada com domínio de verdade — e aí sim vira tarefa.

> Vale a parte da crítica que é de escrita: isso **não estava escrito em lugar nenhum**. Decisão
> consciente que não vira texto é indistinguível de descuido (R5).

### 10.5 O que foi conferido e está encerrado

- **61 vs 62** — **não é erro.** 61 é o total das quatro rodadas de backfill; 62 inclui a atualização
  da Niti na execução `39649`, o smoke do ramo contínuo, fora das rodadas. `62 + 19 criações = 81`.
  **Trocar 62 por 61 criaria o erro em vez de corrigi-lo.**
- **`[P6] Juntar` sem parâmetro** — foi **escolha**, não descuido: criado com `mode: "append"` e
  `numberInputs: 2` explícitos, e o editor do n8n **limpa valores-padrão ao salvar**. Pode riscar da
  lista de incertezas. E reforça a armadilha da §6: no n8n, *"o parâmetro não está lá"* pode
  significar **"foi ignorado"** ou **"é o padrão e foi limpo"** — e **não dá para distinguir olhando
  o JSON**.
- **Zerar o cursor** — o executor procurou e tem razão (R7): as ferramentas de Data Table criam
  tabela, criam coluna, renomeiam e **inserem** linha; **não atualizam nem apagam** linha existente.
  **É o Olavo que apaga, na mão, no n8n.** E ele fez certo em recusar o atalho de mexer no
  `[P6] Calcular since` "só para este teste": config mudada para teste é config que alguém tem de
  lembrar de devolver.
