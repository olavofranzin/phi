# Brief de execução — PROSP-06O rodada 2: fechar o P6-5 e trocar sorte por desenho

> **Para:** sub-chat de execução do PROSP-05/06 Odoo
> **De:** chat-mãe
> **Data:** 2026-09-16
> **Branch:** `claude/consolidacao-2026-08`
> **Workflow:** `PROSP-06O Sync Odoo -> Planilha` (`Yc4shCqDzqiYHR3s`) — **inativo**
> **Brief anterior:** `docs/handoff/2026-09-16-prosp06o-correcao-subchat-brief.md` — leia a §11, que
> tem as decisões do chat-mãe sobre o seu relatório da rodada 1

---

## 0. Regra zero — leia o workflow antes de concordar comigo

Releia o `Yc4shCqDzqiYHR3s` como ele está agora e compare com este brief. Se divergir, **pare e
relate**. Já aconteceu uma vez nesta frente.

---

## 1. Onde estamos

**A rodada 1 provou o que se propôs a provar.** 7 execuções, **100 leads, 100 escritas, zero erro de
cota, zero erro de escrita**. A contabilidade fechou sozinha em toda rodada — `_modificados` caiu 20 e
`_fora_nao_modificado` subiu 20 —, o que prova o avanço correto do cursor **sem abrir a planilha**.

| # | Estado |
|---|---|
| **P6-1** | não testado — contador zerado não é prova |
| **P6-2** | ✅ **provado** (`39937`, linha do `id_crm` 11) |
| **P6-3** | não testado — depende do Olavo |
| **P6-4** | atendido **por acidente**, não por desenho |
| **P6-5** | 🔴 **reprovado** (`39937`) |
| **P6-6** | não testado |
| **P6-7 / CA5** | não testado — depende do Olavo |

**Esta rodada fecha o P6-5 e transforma o P6-4 de acidente em desenho.** Os outros quatro dependem de
gestos do Olavo (§5).

---

## 2. Os quatro consertos

### 2.1 P6-5 — fila vazia não pode derrubar a execução

Hoje o sentinela `__SEM_LEAD__` não tem `_write_ms` e o `[P6] Ordenar pelo mais antigo` morre com
*"Couldn't find the field '_write_ms' in the input data"*.

**Decisão: um nó IF antes da ordenação. A opção de dar `_write_ms: 0` ao sentinela está descartada —
e não se gasta execução medindo se ela funcionaria.**

> **Por quê:** ela manda um **item falso para dentro do nó de escrita** em toda rodada vazia — e
> rodada vazia passa a ser o **estado normal** do P6. Um nó chamado `Gravar na planilha` sendo
> convidado, quatro vezes por dia, para sempre, a gravar algo que não é um lead. **Basta alguém
> trocar `update` por `appendOrUpdate` um dia** — o erro que criou as linhas órfãs que o PROSP-LO
> existe para limpar — e `__SEM_LEAD__` **vira linha nova na planilha**.
>
> **"Nada a fazer" tem de significar "pare", não "mande um item falso adiante".**

🔴 **A condição do IF NÃO pode ser `_modificados > 0`.** Você propôs isso, e **quebraria o caminho
normal**. O motivo está no seu próprio código:

```js
return saida.map(function (l, i) {
  return { json: i === 0 ? Object.assign({}, l, diagnostico) : l };
});
```

**O diagnóstico só é colado no item 0.** Os itens 1 em diante **não têm `_modificados`**. O IF avalia
**item a item** — então numa rodada de 20 leads o item 0 passaria e os **19 outros cairiam** com
`undefined > 0`. Escreveria 1 linha em vez de 20, **sem erro nenhum**.

**A condição certa é `id_crm` diferente de `__SEM_LEAD__`.** Está em **todo** item, é o próprio
marcador do sentinela, e o nó passa a ler exatamente como o que faz.

**O ramo falso não vai a lugar nenhum** — o fluxo para de propósito, e o diagnóstico continua visível
na saída do `[P6] So os modificados`.

> **A regra que generaliza, e vale para todo nó desta casa:** *filtro item a item só pode testar
> campo que existe em todo item.* Campo que só o primeiro item carrega é **diagnóstico**, não
> critério.

### 2.2 P6-4 — o cursor passa a avançar sobre o que foi escrito

Hoje o `[P6] Calcular novo cursor` lê a **entrada** do nó de escrita (`[P6] Vazao do lote`). Só não
há perda porque o `[P6] Gravar na planilha` **não tem `onError`** e qualquer falha derruba a
execução. Sua frase está certa e vai para o contrato:

> *"A trava de segurança do P6-4 é hoje a ausência de uma configuração, e ausência não se documenta
> sozinha."*

⚠️ **Não é ler `$('[P6] Gravar na planilha').all()` direto.** O `_write_ms` é campo **auxiliar** e
**não está no mapeamento de colunas** — o que sai do nó são as colunas mapeadas. Se ele não
atravessar, o `maxMs` dá zero, o nó devolve `[]`, **o cursor nunca avança** e o workflow reprocessa a
mesma fila para sempre.

**O desenho:** a saída da escrita diz **quais `id_crm` foram gravados**; o `_write_ms` de cada um vem
do `[P6] Vazao do lote`, casando pelo `id_crm`.

🔴 **Rode uma vez, olhe o que a saída do nó de escrita traz de verdade, e só então escreva o
código.** Escrever no escuro é o mesmo erro do `executeOnce`: a instrução parecia certa e não existia
(R6).

### 2.3 O empate de segundo — perda silenciosa armada

Você achou, e é da mesma família: leads criados em lote ficam a ~2 segundos um do outro (`02:02:23`,
`02:02:25`, `02:02:27`). Se dois leads tiverem **o mesmo `write_date`** e a vazão cortar entre eles, o
que ficou de fora volta com `w <= since` na rodada seguinte — **e é descartado para sempre**.

**O invariante:** *o corte nunca pode cair no meio de um segundo sem sobreposição.*

Duas formas, ambas de uma linha. **Escolha uma e escreva por quê:** recuar o cursor em 1 segundo
(`maxMs - 1000`), ou trocar o filtro para `w < since`. As duas repetem, no pior caso, os leads de um
segundo — e **repetir é inofensivo** (`update` em linha existente), enquanto perder é irreversível.

### 2.4 `acerto_previsao` leva a régua dentro do texto

`"acertou (>=60 -> ganhou)"` em vez de `"acertou (alto->ganhou)"`.

Hoje o campo guarda **um veredito já julgado**, com a régua do dia em que a linha foi escrita. Quando
a régua mudar, as linhas velhas ficam julgadas por uma e as novas por outra, e **nada na linha diz
qual foi**. Como este campo é **a base de aprendizado do score**, uma base que mistura duas réguas
sem etiqueta não fica imprecisa: fica **inutilizável**, e o estrago é **retroativo**.

⚠️ **Há dois `60` no projeto, e não são a mesma coisa** — iguais hoje por coincidência de quem
escreveu:

| | O que decide | Natureza |
|---|---|---|
| **Corte de entrada** (`potencial_comercial >= 60` no P5) | quais leads vão para o CRM | **temporário** — o Olavo já disse que sobe |
| **Régua de aprendizado** (`pot >= 60` no `acerto_previsao`) | o que conta como "alto" ao julgar o acerto | pergunta de **análise** |

**Um não segue o outro.** Quando o corte de entrada subir para 70, a régua **não tem obrigação de
subir junto**.

**O número fica no código do `[P6] So os modificados`, escrito à mão, e carimbado em toda linha.** Não
vai para nó de config — config é fácil de trocar em silêncio, e foi assim que o carimbo do modo passou
a mentir (§11.9 do contrato).

---

## 3. O que provar, e com que números

**Duas execuções bastam, e as duas já estão definidas:**

| Cenário | O que tem de acontecer |
|---|---|
| **Fila vazia** | a execução termina **verde**; a saída do `[P6] So os modificados` mostra `_modificados: 0` e `_lidos_no_odoo > 0`; **zero linha escrita**; **o cursor não se mexe** |
| **Fila com leads** | o `[P6] Ler a planilha` executa **1 vez**; escreve o lote inteiro (**não 1 linha**); o cursor avança até o último **escrito** |

🔴 **O segundo cenário é o que reprova a §2.1 se você errar a condição do IF.** Conte as linhas
escritas. Se der 1 quando deveriam ser 20, a condição está testando campo que só o item 0 tem.

> **Antes de rodar, diga quantos itens vão entrar na fila.** (R11, regra 4.)

---

## 4. Os sete critérios — prove ou reprove, não reescreva

| # | Critério |
|---|---|
| **P6-1** | Nunca cria linha na planilha. Sem `id_crm` correspondente, o item é desviado **e contado** |
| **P6-2** | Não escreve em nenhuma coluna do P5 (`id_crm`, `data_envio_crm`, campos GBP) |
| **P6-3** | O desfecho vem de `won_status` + `lost_reason_id`, nunca da probabilidade do estágio |
| **P6-4** | O cursor **não avança** se a escrita falhar |
| **P6-5** | Fila vazia é visível: a execução diz "0 leads modificados", não passa batido |
| **P6-6** | Com P5 e P6 rodando, nenhum campo tem dois donos (é o **CA6**) |
| **P6-7** | Lead marcado ganho/perdido no Odoo aparece na planilha na rodada seguinte (é o **CA5**) |

---

## 5. O que depende do Olavo — não tente contornar

Três gestos, e nenhum deles você faz:

1. **Marcar um lead como ganho ou perdido no Odoo** → destrava **P6-3 e P6-7/CA5** de uma vez.
2. **Criar um lead à mão no Odoo** → destrava **P6-1**. Ele não tem linha na planilha, então o desvio
   tem de contá-lo **sem criar linha**. É o mesmo gesto que um dia vai acontecer sem ninguém pedir —
   uma indicação, um contato que chegou sozinho.
3. **Ativar o workflow** → só com OK dele, e **depois** da §7.

**Se travar em qualquer um dos três: pare, escreva o que falta, e devolva.** Parar no muro e dizer por
quê é entrega válida. Contornar não é.

---

## 6. Armadilhas — não redescobrir

- **`executeOnce` e `alwaysOutputData` não são parâmetros de nó, são ajustes.** Passados na criação,
  somem sem erro. **Sempre reler o workflow para confirmar que pegaram.**
- **No n8n, "o parâmetro não está lá" tem dois significados** e **não dá para distinguir olhando o
  JSON**: *foi ignorado* (o `executeOnce`) ou *é o padrão e o editor limpou ao salvar* (o
  `[P6] Juntar`, criado com `mode: "append"` explícito). Na dúvida, o teste é o comportamento.
- **`notes` de nó não é gravável** pelas ferramentas disponíveis. **Sticky é o substituto legítimo.**
- **Não copiar nada do `Sync HubSpot -> Planilha`** (`WRFU2NM8rLJU7bRT`, desativado). Ele casa por
  `id_hubspot` e escreve `data_sync_hubspot` — **colunas que não existem mais** — com
  `onError: continueRegularOutput`. É o bug das duas semanas, ainda armado lá dentro.
- **`abordagem_ia` fica fora.** O workflow é bidirecional; **o CAMPO é sempre de mão única**.
- **`motivo_ganho`, `num_interacoes` e `ultimo_contato`** ficam fora: não há equivalente honesto no
  Odoo. **Vazio é I3, não é esquecimento.**
- **Executar por MCP entra sempre pelo gatilho manual.**

---

## 7. O que **não** é seu escopo

- **O mapeamento `score_gbp` → `gbp_score_tecnico` no P5O** (§11.11 do contrato). A skill
  `phi-odoo-crm` proíbe com todas as letras. **Decisão do Olavo, escopo do P5.**
- **Desfazer o `data_criacao_deal`.** O comportamento é o desenhado. **Mas escreva no as-built** que,
  para os ~100 leads migrados, o `dias_no_funil` passou a contar **da migração**, não do primeiro
  contato — senão daqui a três meses alguém lê a base de aprendizado errado.
- **A aposentadoria formal do `Sync HubSpot`** (prefixo `[APOSENTADO]` + sticky, R5). Só depois do P6O
  provado.
- **Ativar o workflow.** Propor, sim. E a proposta tem de dizer **em que minuto o gatilho do P6 cai em
  relação ao do P5**: se coincidirem, colidem na cota do Sheets **sempre**; se ficarem defasados,
  **nunca**. Isso não pode ficar por conta da sorte.
- **"Corrigir" o 61 vs 62 do §11.10.** **Os dois números estão certos:** 61 são as quatro rodadas de
  backfill; 62 inclui a Niti da execução `39649`, o smoke do ramo contínuo. `62 + 19 = 81`.

---

## 8. Registro — e um conserto de leitura

🔴 **Commite agora, com o reprovado dentro.** Você segurou o commit da rodada 1 *"para não documentar
como pronto o que reprovou"*. A intenção é certa, **a leitura da R2 não é**: a regra não é *documentar
quando ficar pronto* — é **documentar o que aconteceu**, e o real vence o plano.

Uma drenagem de 100 leads com 100 escritas e zero erro é **fato**, e vale escrito mesmo com o P6-5
aberto. **Se a sessão morrer agora, esse conhecimento morre junto.** *Se não está escrito, não
aconteceu.*

- **Notion (R3):** linha na DB *"PHI — Registro de Execuções (Sub-chats)"* ao começar e ao encerrar.
- **Contrato (R2):** as-built em `docs/strategic-planning/prospeccao/CONTRATO-PROSPECCAO.md`, seguindo
  a numeração do §11.
- **Descrição do workflow (R5):** hoje termina em *"EM CONSTRUCAO"*. Quando o P6O passar, tem de dizer
  o que faz, por que existe e **o que substituiu**.
- **Commit no git** na mesma sessão.

---

## 9. Skills instaladas que servem para esta tarefa (R7)

Procurei nas 16 skills do repositório. **Três servem, e uma falta:**

| Skill | Para quê, aqui |
|---|---|
| **`n8n-node-configuration`** | **configurar o nó IF da §2.1** — estrutura do operador, campos obrigatórios, dependências de propriedade. É onde mais se erra |
| **`n8n-mcp-tools-expert`** | usar as ferramentas do n8n direito: buscar nó, validar configuração, ler o workflow de volta. **É a que evita a armadilha do ajuste que some** |
| **`phi-odoo-crm`** | os 34 campos com o dono de cada um e os 6 estágios — **necessária para o P6-3** (`won_status` + `lost_reason_id`) e para não violar o I1 |

**Não use:** `odoo-19-dev` (é desenvolvimento de módulo, não integração), `phi-diagnostico` (é do T28,
outra frente), e as nove de marketing.

⚠️ **Registro que procurei e não existe** (para a próxima sessão não procurar de novo): **não há skill
instalada de JavaScript em nó Code do n8n** — e as §2.2, §2.3 e §2.4 são exatamente isso. Escreva com
cuidado redobrado e **releia o código antes de salvar**.

---

## 10. O que devolver ao chat-mãe

1. **Antes de tocar em qualquer nó:** confirme a §0 e diga **quantos itens vão entrar na fila**.
2. Os números da §3, **com a execução que os mostra**.
3. O placar dos sete critérios: provado, reprovado ou não testado.
4. O que mudou, **nó a nó, e por quê**.
5. **O que você não sabe**, com grau de confiança. Foi a melhor parte dos seus dois relatórios.

---

## 11. Rodada 2 — a análise do chat-mãe (17/09)

Li o `Yc4shCqDzqiYHR3s` no n8n antes de endossar qualquer coisa. Os quatro consertos estão lá:
`executeOnce` presente, `[P6] Tem lead?` testando `id_crm` (não `_modificados`), vazão em 20, sticky
do `onError` no lugar, `REGUA_ACERTO` usada na comparação **e** no texto.

### 11.1 A §2.3 do brief estava errada — ele viu e eu não

Eu mandei escolher entre **`maxMs - 1000` sempre** ou **`w < since` sempre**. **As duas estão
erradas, e pelo mesmo motivo que ele descreveu:**

| Variante | O que acontece na rodada seguinte |
|---|---|
| cursor `= maxMs`, filtro `w < since` | o lead da fronteira tem `w == since` → **passa**. Volta para sempre |
| cursor `= maxMs - 1000`, filtro `w <= since` | o lead da fronteira tem `w > since` → **passa**. Volta para sempre |

**Consequência:** a fila **nunca ficaria vazia**. O lead da fronteira (hoje o `id_crm` 115) seria
reescrito 4× por dia, indefinidamente — e o caminho de fila vazia, que é o P6-5 que acabamos de
provar, **nunca aconteceria em produção**. Eu teria mandado consertar um invariante quebrando outro.

**O desenho dele é o certo: recuar 1 s só quando um empate foi mesmo cortado.** Mesmo invariante, sem
o custo. Está implementado comparando a fila ordenada com o conjunto gravado — fonte certa, chave
certa.

> **Registro da hipótese desmentida (R6):** a versão de uma linha que eu pedi fica **descartada**, com
> o motivo escrito. Se não ficar registrado, a próxima sessão propõe de novo.

### 11.2 A trava contra parada eterna esconde uma perda — fechar **antes da ativação**

O nó tem uma guarda correta: se recuar 1 s levasse o cursor a não passar do `since` da rodada, ele
**avança assim mesmo** e registra `_empate_maior_que_o_lote: true`.

**A decisão de não travar está certa. O destino do aviso, não.** Nesse ramo um lead **é perdido de
verdade**, e o único sinal é uma linha no log da execução — que é literalmente a R11, regra 2: *erro
que só existe no log de execução não existe*.

**Quando acontece:** quando **um único segundo tem mais leads do que a vazão inteira**. Não é
fantasia — é o que uma carga em lote ou uma edição em massa no Odoo produz.

**O invariante que sai daí, e que vale escrever no contrato:**

> **A vazão precisa ser maior que o maior grupo de leads que compartilham o mesmo segundo.** O cursor
> tem resolução de 1 segundo; o lote não pode ser mais fino que ela.

**A correção:** nesse ramo, **a execução para com erro** em vez de avançar. Parar é recuperável —
sobe-se a vazão e roda de novo. Avançar perde o lead **para sempre**. É o mesmo raciocínio do
`onError` ausente, aplicado um nível acima: **parar é melhor que perder.**

🔴 **Prazo: antes da ativação.** Depois que o gatilho de 6 h estiver ligado, ninguém está olhando.

### 11.3 O recuo de 1 s fica provado **fora** do n8n — e está certo assim

Ele verificou cinco casos contra os dados reais da `39936`, fora do n8n, e não conseguiu exercitar o
ramo em produção porque os leads estão a ~2 s um do outro.

**Aceito, e o rótulo vai para o contrato exatamente assim:** *"provado em teste fora do n8n, não
exercitado em produção"*. Forçar um empate artificial seria fabricar o teste. **O momento em que ele
vai ser exercido de verdade já é conhecido:** a próxima carga em lote no Odoo.

### 11.4 O teste dos 37 leads — **recomendado**

Voltar o cursor para `2026-09-16T02:00:16Z` recoloca 37 leads na fila.

**Custo real:** 37 `update` em linhas que já existem, com os mesmos valores. Só o `data_sync_crm`
muda — e mudar é honesto, o P6 realmente tocou naquelas linhas. **Nunca cria linha.**

**O que só esse teste prova:**

1. o `[P6] Ler a planilha` executa **1 vez** com fila cheia;
2. **o lote de 20 é escrito inteiro** — é aqui que uma condição errada no IF apareceria como **1 linha
   em vez de 20**. É a regressão da §2.1, e não tem outro jeito de pegá-la;
3. o cursor avança sobre o **escrito**, em duas rodadas seguidas.

⚠️ **Não é alternativa ao gesto do Olavo, é complemento.** Marcar um lead põe **1** lead na fila —
prova o desfecho (P6-3, P6-7), **não** prova o lote. São testes diferentes.

**Ao fim:** confirmar que o cursor parou onde se espera e que a fila **voltou a ficar vazia** —
fechando o ciclo e re-provando o P6-5 em sequência, que é mais forte que prová-lo isolado.

### 11.5 Um efeito colateral do cursor que ninguém tinha notado

Lead que existe no CRM **e não tem linha na planilha** é contado em
`_fora_sem_linha_na_planilha` — **mas só na rodada seguinte à sua modificação.** Depois que o cursor
passa por ele, ele vira "não modificado" e **some do relatório**.

**Não é defeito** — o P6 cuida do desfecho, não de órfãos. **Mas muda o teste do P6-1:** quando o
Olavo criar o lead à mão, **a janela de prova é uma rodada só.** Se passar, o contador zera e o lead
fica invisível. Escrever isso no contrato.

---

## 12. Fim da rodada 2 (17/09) — o que passou e o que falta

**Doze previsões declaradas antes, doze certas.** Reli o workflow no n8n. O conserto do §11.2 está
correto: `throw` de verdade, com mensagem que diz **o que fazer** (`aumente o maxItems`) e é honesta
sobre o estado (*"as linhas deste lote JÁ foram gravadas e o cursor NÃO avançou"*). É o oposto de um
alarme mudo.

**Placar: P6-2, P6-4 e P6-5 provados.** O P6-4 provado em cadeia — o cursor que sai de A é o `since`
de B, o de B é o de C, **sem buraco**. E o P6-5 re-provado *acontecendo*, não montado.

### 12.1 O P6 escreve `id_crm` — e não é violação, é estrutura

O mapeamento do `[P6] Gravar na planilha` inclui `id_crm` no payload, e `id_crm` é **coluna do P5**.

**Não é bug, e não dá para remover:** o nó do Sheets em `defineBelow` exige a coluna de casamento
dentro dos valores — é por ela que ele acha a linha. O valor escrito é **idêntico** ao que ele acabou
de casar.

🔴 **Mas isso precisa estar escrito no contrato, ao lado do I1.** Senão a próxima auditoria marca
como violação e alguém "conserta" removendo a chave — quebrando o casamento e transformando `update`
em nada. **É a R5: benigno por desenho só é benigno se estiver escrito.**

> Redação sugerida para o contrato: *"O P6 escreve `id_crm` porque o nó do Google Sheets exige a
> coluna de casamento no payload. O valor é sempre o mesmo que ele leu para achar a linha. Não
> remover — remover quebra o `update`."*

### 12.2 O gatilho — o último risco antes da ativação

Os dois gatilhos são de 6 em 6 horas. O do P6 é `hoursInterval: 6` **sem minuto declarado**, e o
padrão do n8n é **minuto 0**.

⚠️ **Se o do P5 também estiver no padrão, os dois disparam no mesmo minuto — e colidem na cota do
Sheets em toda rodada.** É o problema que custou a rodada 1 inteira, voltando por outra porta.

**Antes de propor a ativação:** leia o minuto do gatilho do P5, diga qual é, e **declare um minuto
diferente para o P6**. Não é para ficar por conta da sorte, e não é para descobrir pelo erro.

### 12.3 Os três critérios que fecham com dois gestos do Olavo — **numa rodada só**

| Gesto do Olavo | Fecha |
|---|---|
| **Marcar um lead como ganho ou perdido** no Odoo | **P6-3** e **P6-7 / CA5** |
| **Criar um lead à mão** no Odoo (sem linha na planilha) | **P6-1** |

**Os dois na mesma sessão, e depois UMA rodada do P6.** O lead marcado entra na fila (tem linha); o
criado aparece em `_fora_sem_linha_na_planilha` com o id em `_sem_linha_ids`. **Os dois no mesmo
diagnóstico.**

🔴 **Leia o diagnóstico dessa rodada antes de rodar de novo** — a janela do P6-1 é **uma rodada**
(§11.5).

### 12.4 O P6-6 / CA6 não exige ativar nada

*"Com P5 e P6 rodando, nenhum campo tem dois donos."* Não precisa dos dois **ativos** — precisa dos
dois **tendo rodado sobre a mesma linha**.

**O teste:** rode o P6 sobre um lead, anote a linha inteira; rode o P5 sobre o mesmo lead; leia a
linha de novo. **As colunas do P6 não podem ter mudado, e as do P5 não podem ter sido tocadas pelo
P6** — com a exceção do `id_crm` da §12.1, que muda para o mesmo valor.

### 12.5 O recuo de 1 s fica rotulado, não forçado

Provado **fora do n8n** contra dados reais da `39936`; `_empate_cortado: false` em todas as rodadas
reais porque os leads estão a ~2 s um do outro. **Forçar um empate artificial seria fabricar o
teste.** O rótulo no contrato é exatamente esse: *"provado em teste fora do n8n, não exercitado em
produção"*. O momento em que ele será exercido de verdade já é conhecido: **a próxima carga em lote no
Odoo**.

### 12.6 A higiene do workflow descartável

O `uFcx8z2kvadipVrO` foi criado só para rebobinar o cursor (não há ferramenta MCP que escreva linha em
Data Table) e está **arquivado** — confirmado: o n8n recusa até a leitura dele.

**Está certo assim.** Não cabe o procedimento de aposentadoria da R5: ele não substituiu nada, foi
ferramenta de uma vez. **O que o torna seguro é estar registrado no contrato** — a R5 é sobre
intenção, e a intenção está escrita.

### 12.7 A descrição do workflow — a última coisa, e nessa ordem

A descrição ainda termina em **"EM CONSTRUCAO"**, e ele está certo em não mexer antes: **descrição que
diz "pronto" antes dos critérios fecharem mente**, e é exatamente o que a R5 existe para impedir.

**A ordem é:** os dois gestos do Olavo → uma rodada → P6-1/P6-3/P6-7 → o teste do P6-6 → **então** a
descrição, e **então** a proposta de ativação com o minuto do gatilho.

---

## 13. O §12.2 estava errado, e o que ele revela (17/09)

**Não existe gatilho do P5 para ler.** Eu avisei sobre colisão de minuto entre dois cron sem
verificar que havia dois cron. **A cadeia inteira da Prospecção só anda quando alguém manda "Iniciar
prospecção" no Telegram e aperta o botão** — P2, P3, P4 e P5O não têm gatilho nenhum, são chamados.

A colisão determinística **não tinha como existir**. Hipótese desmentida, registrada (R6).

**O raciocínio dele sobre o que sobra é o certo, e a frase merece ficar:**

> *"Um minuto escolhido reduz a chance de coincidir no minuto exato, mas não elimina a janela, porque
> uma rodada de prospecção dura vários minutos. **Não quero te vender proteção que não entrego.**"*

**E o `triggerAtMinute: 20` fica pelo motivo certo:** higiene contra o resto da instância, onde tudo
que fica no padrão se junta no topo da hora. **Não** proteção contra o P5.

### 13.1 Uma precisão para quando a instância crescer

A cota do Google Sheets é **por credencial**, não por planilha. Então a pergunta certa, no dia em que
isso voltar a incomodar, não é *"quem mexe nesta planilha?"* — é **"quais workflows agendados usam a
credencial `Google Sheets account` (`1syGXHEXgjrxSblV`)?"**

**Hoje não vale a auditoria.** O P6 gasta **1 leitura + no máximo 20 escritas** por rodada, 4× por
dia — uma fração da cota. O que estourou na rodada 1 foram ~100 leituras em segundos, e a causa não
existe mais. **Fica a pergunta formulada, não a tarefa aberta.**

### 13.2 🔴 O P6 será o primeiro workflow da Prospecção que roda sozinho

Isso muda uma coisa que ninguém tinha dito em voz alta: **até hoje, nada nesta frente acontece sem
alguém apertar um botão.** Depois da ativação, o P6 roda 4× por dia, para sempre, **sem ninguém
olhando**.

**A pergunta que falta responder antes de ativar: se ele quebrar, quem avisa?**

O workflow não tem *error workflow* configurado. Uma execução vermelha fica no log — e **erro que só
existe no log de execução não existe** (R11, regra 2). Pior: com a fila vazia quase sempre, *"não
aconteceu nada"* e *"parou de funcionar"* **têm exatamente a mesma aparência**.

**Duas saídas, e é decisão do Olavo:**

| | Custo | O que entrega |
|---|---|---|
| **Error workflow apontando para o Telegram** | pouco — a credencial `Telegram phi_prospeccao` já existe e o P5 já usa esse canal | quebra vira aviso na hora, no mesmo lugar onde os erros do P5 já chegam |
| **Nada, e uma conferida manual por semana** | zero | depende de alguém lembrar — foi assim que a quebra do `id_hubspot` passou duas semanas |

**Recomendo o primeiro.** É o mesmo canal, a credencial existe, e é a única peça que falta para o P6
poder rodar sem vigilância.

### 13.3 A ordem final, sem mudanças

1. **Os dois gestos do Olavo** (marcar um lead · criar um à mão)
2. **Uma rodada do P6**, e **ler o diagnóstico antes de qualquer outra coisa** — a janela do P6-1 é
   essa rodada
3. Fecham **P6-1, P6-3 e P6-7/CA5**
4. **O teste do §11.17** fecha o **P6-6**
5. **A descrição do workflow** — só agora, senão mente
6. **A proposta de ativação**, já com a resposta do §13.2

---

## 14. A rodada dos gestos (17/09) — seis provados, e um número em aberto

**P6-1 · P6-2 · P6-3 · P6-4 · P6-5 · P6-7/CA5 · CA7 — provados.** Falta o **P6-6/CA6**.

**O P6-3 saiu limpo, e é a prova mais elegante da série.** O lead 43 está no Odoo com
`stage_id: [1, "Prospecção"]` e `probability: 0` — perder **arquiva, não move** —, e a planilha
recebeu **`Perdido`**. Se o rótulo viesse do estágio, diria "Prospecção". **Veio do desfecho.**

**CA7 passou e foi medido pela primeira vez:** 100 ativos + 1 arquivado = 101, ramos **disjuntos**. O
`active = false` **desliga** o `active_test` nesta instância. Estava documentado desde 16/09 e nunca
tinha sido medido.

### 14.1 🔴 O 101 não pode ser fechado como "buracos na sequência"

Meu `~116` estava errado — **id não é contagem**, e ele tem razão. Mas a conclusão de que *"a base
devolve 101"* **não está verificada**, e há duas explicações possíveis:

| | O que seria | Gravidade |
|---|---|---|
| **A** | 15 leads foram **apagados** do Odoo | benigno **se** o Olavo apagou |
| **B** | os 15 **existem** e o P6 **não os vê** | 🔴 ponto cego silencioso |

**A hipótese B é concreta:** o nó usa `resource: opportunity`. No Odoo, `crm.lead` tem um campo
`type` (`lead` / `opportunity`), e **é preciso descartar** que o nó esteja filtrando por ele. Se
estiver, existem registros no CRM que o P6 nunca vai ler — **e nada no diagnóstico diria isso**.

> **"Não tenho como confirmar" não é o mesmo que "não é problema."** Um número que não fecha ou é
> explicado ou continua aberto — não vira nota de rodapé.

**O teste custa 10 segundos e é do Olavo:** abrir o pipeline do CRM no Odoo e ler o total.
**101 → o P6 vê tudo** (e os 15 foram apagados). **116 → o P6 é cego para 15 leads**, e isso vira a
prioridade da frente.

⚠️ Vale lembrar que os 15 ids que faltam são **quase exatamente** os que ele tinha previsto como "sem
linha na planilha" antes da drenagem (1–10, 12, 13, 14, 16, 17) — e que voltaram **zero**. As duas
anomalias podem ser a mesma. Não é prova; é motivo para não fechar.

### 14.2 A §11.5 estava exagerada — a janela do P6-1 é maior

Eu escrevi que a janela do P6-1 era **uma rodada**. **Não é**, e a observação é dele: na execução
`40264` o lead 116 **continuou sendo contado**.

**O motivo:** o cursor só avança até o `write_date` do último lead **gravado**. Um lead sem linha na
planilha **nunca é gravado**, então ele só sai do contador quando **outro** lead, mais recente, for
escrito. Enquanto isso, `_sem_linha_ids` é um **sinal persistente**, não um relâmpago.

**Melhor do que eu tinha dito, e vale corrigir no contrato:** o P6 tem um detector de órfãos que se
mantém aceso sozinho.

### 14.3 `motivo_perda` vazio é o I3 — e a lição é operacional, não de código

O lead 43 tem `lost_reason_id: false` no Odoo: foi marcado como perdido **sem escolher motivo**. Ele
conferiu **na origem antes** de chamar de defeito, que é o procedimento certo.

**Mas `motivo_perda` é um dos campos mais valiosos da base de aprendizado** — é ele que vai responder
*"por que a gente perde"*. Um funil cheio de perdas sem motivo não ensina nada.

> **Isto é hábito de operação, não conserto de workflow:** *ao marcar um lead como perdido, sempre
> escolher o motivo na tela.* O lugar disso é o procedimento comercial — o `Board Agência` —, não o
> código. Nenhuma trava técnica substitui.

### 14.4 O P6-6/CA6 — como disparar o P5

O `PROSP-05O` é sub-workflow, sem gatilho próprio. **Decisão: executar o P5O direto pelo MCP, com
`lote_max = 1`, sobre o lead `66`.**

**Por que não rodar o P4:** ele enriquece — **custa Apify + Gemini e depende de OK de budget**. É um
canhão para matar um mosquito, e faz muito mais coisa do que o teste precisa.

**Por que o lead 66 e não o 43:** o 66 é o **ganho** — está **ativo** (o 43 está arquivado, e o P5
não escreveria nada nele) e é o que tem **mais colunas do P6 preenchidas**: `status_crm`,
`data_fechamento`, `acerto_previsao`, `probabilidade`. Mais superfície para o teste pegar.

**Esperado:** o P5 escreve `id_crm`, `data_envio_crm`, `erro_envio_crm` e os campos GBP — e **não
toca em nenhuma coluna do P6**.

⚠️ **O que NÃO é anomalia:** depois do P5 escrever no CRM, o `write_date` do lead 66 muda e ele
**volta à fila do P6** na rodada seguinte. Isso é o circuito funcionando, **não** ping-pong: o
workflow é bidirecional, **o campo é sempre de mão única**.

### 14.5 O 101 está fechado — não há ponto cego (17/09)

O Olavo leu o pipeline do CRM no Odoo: **100 leads**. A listagem padrão esconde arquivados, então
são **100 ativos + 1 arquivado (o lead 43) = 101** — **exatamente** o que o `_lidos_no_odoo` devolveu.

🟢 **A hipótese B está descartada. O P6 lê 100% do que existe no CRM.** O `resource: opportunity` não
está escondendo nada, e o CA7 continua de pé.

**Os 15 ids que faltam foram consumidos, não perdidos.** A explicação mecânica é banal: no
PostgreSQL, **a sequência de id não volta atrás quando um `INSERT` falha** — e esta frente teve várias
tentativas de criação que falharam (o `UNIQUE(gbp_place_id)`, a recusa do payload na execução
`39633`). Cada uma queimou um id sem deixar registro.

> **A lição, e o erro era meu:** **id nunca é contagem.** Eu estimei `~116` a partir do maior id e
> mandei procurar 15 leads que não existiam. Em qualquer base com sequência, **buraco de id é o
> estado normal** — a única fonte de contagem é contar.
>
> O sub-chat estava certo ao dizer que o número certo era 101. **Ele só não podia fechar sem
> descartar o ponto cego** — e agora está descartado com medição, não com raciocínio.

---

## 15. Os três achados do P5O (17/09) — e a prioridade muda

### 15.1 O `triggerCount` mentiu, e eu tenho a mesma evidência

**Confirmado por conta própria:** quando li o `Yc4shCqDzqiYHR3s`, ele reportava `triggerCount: 0`
**tendo o `[P6] A cada 6h` dentro**. O campo conta gatilhos **ativos**, não declarados — e workflow
inativo reporta zero.

**Então o §12.2 estava certo e o §11.16 errado.** O `[P5] Reconciliacao 6h` existe, está habilitado, e
está **no padrão (minuto 0)**. O `triggerAtMinute: 20` do P6 **deixa de ser higiene e vira conserto
justificado por dado**.

**Vai para a R12 do `CLAUDE.md`:** *para saber que gatilhos um workflow tem, leia os nós — nunca o
número.*

**E a recomendação dele é aceita:** quando o P5O for ativado, **declarar o minuto dele também**. Dois
workflows no padrão é uma colisão esperando o segundo ser ligado.

### 15.2 O P6-6 não precisa das cinco mexidas — prova-se lendo

Ele está certo: executar o P5O por MCP entra pelo gatilho de reconciliação, cujo primeiro filtro é
`data_envio_crm VAZIO`. **O lead 66 seria descartado**, e o caminho pegaria leads nunca enviados e
**criaria leads novos no CRM de produção**. Minha instrução tinha esse defeito.

**Mas a proposta de cinco mexidas está descartada — e não por risco, por ser inferior.**

O CA6 pergunta: *"nenhum campo tem dois donos"*. **Metade já está provada empiricamente** — hoje, nas
linhas 43 e 66, **nenhuma coluna do P5 mudou** além do `id_crm` da §12.1. A outra metade — *o P5 toca
alguma coluna do P6?* — se responde **lendo o mapeamento de escrita do P5O**.

| | Cobertura |
|---|---|
| **Uma execução** | as colunas que **por acaso** mudarem naquele lead |
| **Ler o mapeamento** | **todas** as colunas que o P5 é capaz de escrever, sempre |

**A leitura é mais forte, custa zero e não escreve no CRM de produção.**

**O método:** listar **todos** os nós do Google Sheets que escrevem no `PROSP-05O` e as colunas
mapeadas em cada um; pôr ao lado a lista do P6; mostrar que os dois conjuntos são **disjuntos**,
com a única interseção sendo o `id_crm` já documentado. **Se houver qualquer outra interseção, aí sim
é achado — e aí a execução vira necessária.**

### 15.3 🔴 O `[P5] Entrada` desabilitado é a prioridade da frente

**Passa na frente do P6-6, e não é perto.** O P6-6 virou leitura de cinco minutos. Isto é um caminho
de produção possivelmente quebrado na perna que **alimenta o CRM**.

**A hipótese mais provável não é nenhuma das duas que ele listou, é uma terceira:** o nó foi
desabilitado **durante o smoke de 16/09**, para o P4 não disparar nada no meio do teste, **e não foi
religado**. É o terceiro caso do mesmo padrão — **a R12 nasceu disto**.

**Se for isso, a consequência é séria:** a repontagem do M6 (§11.6), feita em 16/09 contra a
recomendação de esperar o cutover, **nunca foi exercida**. Na próxima prospecção que o Olavo rodar, o
enriquecimento não alimentaria o CRM — e **ninguém saberia**, porque não há execução do P4 desde
então.

**O que fazer, nesta ordem:**

1. **Ler a última execução do P4** e ver o que o nó `[P5] CRM-out` devolveu. Se não houver execução
   desde 16/09, **isso por si só é a resposta**: o caminho nunca foi exercido.
2. **Ver se o `[P5] CRM-out` do P4 tem `onError`.** Se tiver `continueRegularOutput`, a chamada pode
   estar falhando em silêncio há dias — é literalmente o bug das duas semanas.
3. **Religar o `[P5] Entrada`** — com nota dizendo por que ele existe e que **não se desabilita sem
   prazo de religar**.
4. **Corrigir a descrição do P5O**, que afirma um fato (*"chamado pelo P4 desde 16/09"*) que o
   workflow contradiz. **Descrição que mente é pior que descrição ausente** (R5).

### 15.4 A ordem revisada até o fim da frente

1. **`[P5] Entrada`** (§15.3) — primeiro, e não é negociável
2. **CA6 por leitura** (§15.2) — cinco minutos, zero escrita
3. **A descrição do P6O** — só depois dos sete critérios
4. **A proposta de ativação**, com o minuto do gatilho e a resposta sobre o aviso de erro

---

## 16. Os sete fecharam (17/09) — e o que a resposta abriu

**CA6 provado por leitura, interseção vazia.** E a distinção que ele fez é a certa: as duas
sobreposições são **de chave, não de valor** — o `id_crm` (§12.1) e o `place_id`. A observação sobre o
`row_number` ser metadado do nó, não coluna de negócio, evita um falso achado numa auditoria futura.
**Bom reflexo: registrar o que parece problema e não é.**

**A resposta do §15.3 era a terceira hipótese, e é a melhor das três:** o caminho P4 → P5O **nunca foi
exercitado**. A descrição não mentia sobre a ligação — **errava no tempo verbal**.

### 16.1 🔴 O `onError` do `[P5] CRM-out` — antes da próxima prospecção

```
onError: "continueRegularOutput"   retryOnFail: true   waitForSubWorkflow: true
```

Com o `[P5] Entrada` desabilitado, o P4 seguiria **verde**: nenhum lead no CRM, `id_crm` vazio, e
**nem `erro_envio_crm` gravado** — porque o ramo de erro do P5O nunca chegaria a rodar. *"Estava
armado, não disparado"*, como ele escreveu. A única razão de não ter custado nada é que ninguém rodou
o P4 desde 10/09.

**A recomendação, e é mais simples do que parece: tirar o `onError`, não dar destino a ele.**

O raciocínio: o que falha ali é **a chamada do sub-workflow**, não um lead. Falha de lead **já tem
tratamento dentro do P5O** — é a D3, que grava `erro_envio_crm` e avisa no Telegram, e que provou
funcionar na execução `39633`. Se a **chamada** falha, não é *"este lead deu problema"*, é **"a perna
do CRM está fora do ar"** — e isso vai falhar para todos os leads igualmente.

> **Continuar em silêncio quando a perna inteira caiu é o pior comportamento possível.** O
> `retryOnFail` fica (cobre a falha passageira); sem o `onError`, o que sobrar **para e aparece**.

⚠️ **Por que NÃO dar a ele um ramo que grava `erro_envio_crm`:** essa coluna é do **P5**. O P4
escrevendo nela criaria **dois donos** — exatamente o que o CA6 acabou de provar que não existe.

**É o P4, outra perna. Vai como proposta ao Olavo, não como conserto do sub-chat.**

### 16.2 Um error workflow para o parque, não um aviso por nó

A pergunta *"se o P6 quebrar, quem avisa?"* e a pergunta *"se o P4 quebrar, quem avisa?"* **têm a
mesma resposta** — e não devem virar duas construções.

O n8n tem **error workflow por workflow**: um único workflow de erro, apontado por todos, recebe a
execução que morreu e avisa. **Um artefato, não um nó de Telegram em cada perna.**

> Isso é diferente do Telegram que já existe **dentro** do P5O: aquele é **por lead** (D3, o erro que
> vai para a coluna). O error workflow é **por execução** — *"isto morreu"*. Os dois convivem e
> respondem perguntas diferentes.

**Vai junto com a proposta de ativação.**

### 16.3 ⚠️ E o CA9 e o CA10? — não deixar fechar a frente sem resposta

Os critérios de aceite da entrevista de execução iam de **CA1 a CA11**. Estão provados: CA1, CA2,
CA3, CA4, CA5, CA6, CA7, CA8, CA11.

**O CA9 e o CA10 nunca foram mencionados desde o §11.8** — nem como provados, nem como descartados.

🔴 **Antes de declarar a frente pronta, os dois precisam de um veredito escrito**: provado, reprovado,
ou **explicitamente retirado com justificativa**. É a pior hora para perder dois critérios — quando
todo mundo está contando os que passaram.

### 16.4 Resposta: sim, siga com os dois

**A descrição do P6O** — agora é honesto escrevê-la. Ela tem de dizer, em duas frases, **o que ele
faz, por que existe e o que substituiu** (o `Sync HubSpot -> Planilha`, desativado em 16/09). É a R5,
e o P6O vai ser o segundo workflow do parque a passar nesse teste.

**A proposta de ativação**, com quatro coisas dentro:

1. o minuto do P6 (**20**, já declarado) e o **minuto a declarar no P5O** quando ele for ativado;
2. a resposta do §16.2 — o error workflow do parque;
3. a recomendação do §16.1 sobre o `onError` do P4, como item separado, **para antes da próxima
   prospecção**;
4. o veredito do **CA9 e CA10** (§16.3).

**E a precisão dele sobre o `notes` entra nas armadilhas:** não é *"não é gravável"* nem *"é
gravável"* — é **gravável na criação, não depois**. Nó que já existe só recebe **sticky**.

---

## 17. Fechamento (17/09) — o que move no placar, e os últimos quatro

**A descrição passa no teste da R5:** diz o que faz, por que existe e **o que substituiu**. Segundo
workflow do parque a conseguir.

**O CA10 estava atendido pelo desenho e faltava alguém verificar** — duas travas independentes, e um
nó chamado `[P5] Lead e do vendedor - nao mexer`, que é descrição dentro do nome.

**E o error workflow já existia** (`UZ7sIE5cWrrO8xea`, ativo desde 10/09). Ele **procurou antes de
propor construir** (R7) e achou. Era uma linha de configuração, não um artefato novo.

### 17.1 O CA9 revisado — endosso, mas a palavra é do Olavo

**O raciocínio está certo.** Coluna `Integer` no Odoo devolve `0` para quem nunca escreveu: pelo ORM,
**ausência e zero são indistinguíveis no campo**. Um critério que exige o que o armazenamento não
representa não é critério — é desejo. E a alternativa que ele propôs mantém o que importa: o zero
observado chega, e a ausência é marcada **no conjunto**, por `gbp_score_atualizado_em` vazio.

**A parte mais valiosa do achado é o aviso, não o critério:**

> **Um `0` num lead sem `gbp_score_atualizado_em` não é "dimensão zero" — é "o PHI nunca rodou".**
> Quem usar as dimensões em análise **filtra por `gbp_score_atualizado_em` preenchido primeiro.**

⚠️ **Mas retirar critério é controle de mudança (§12.3 do plano), e a decisão é do Olavo.** Ele
apresentou justificativa e alternativa, que é exatamente o que o controle pede. **Falta a palavra.**

### 17.2 A rede de segurança nunca foi testada

Ele mesmo registrou: **error workflow só dispara em produção, nunca em execução manual.** Então o
alerta do P6O **nunca foi exercido**.

**A pergunta que decide se vamos ligar com rede ou com a foto de uma rede:** o
`PHI - Alerta de Falha` **já disparou alguma vez?** Ele foi criado em 10/09 por causa da credencial do
BigQuery — se disparou naquele dia, está provado. Se nunca disparou, estamos confiando num aviso que
ninguém viu funcionar. **Uma olhada na lista de execuções dele responde.**

### 17.3 O `PHI - Alerta de Erro (Telegram)` inativo — aposentar, não deixar

Dois workflows com o mesmo nome-conceito é **a próxima confusão de auditoria**, e ele tem razão em
apontar. **Procedimento da R5, cinco passos** — o que importa aqui é o **prefixo `[APOSENTADO
2026-09-17]` e o sticky** dizendo que o substituto é o `UZ7sIE5cWrrO8xea`. Dois minutos, e evita que
alguém aponte a perna errada daqui a um mês.

### 17.4 A ordem de ligar — aceita, com dois acréscimos

O raciocínio de ligar **o P6 primeiro** está certo: ele só lê o Odoo e escreve em colunas que são só
dele; o pior caso é uma coluna de desfecho desatualizada. O P5 **cria lead no CRM** — e já custou caro
duas vezes.

**Dois acréscimos:**

1. **Não basta ver uma rodada vazia.** A primeira rodada com `_modificados > 0` é a **primeira
   escrita de produção em horário automático** — essa também tem de ser olhada. A vazia prova que o
   gatilho dispara; a cheia prova que ele trabalha.
2. **O `triggerAtMinute: 40` do P5O está aceito.** 20 minutos de separação é folga de sobra para um
   P6 que faz 1 leitura e no máximo 20 escritas.

### 17.5 O que isso move no placar da frente

| | Antes | Agora |
|---|---|---|
| **P4** — *o desfecho volta à planilha com motivo, automaticamente* | ⬜ | 🟡 **máquina provada**; falta **ativar** e um perdido **com motivo** |
| **A3** — *loop de aprendizado escreve as 17 colunas* | 🟡 *"pode ter parado"* | 🟡 **resolvido**; ✅ quando ativado |
| **A2** — *lead vira lead no CRM canônico sem toque humano* | 🟡 | 🔴 **o caminho P4 → P5O nunca rodou** |

🔴 **O A2 piorou, e é honesto que tenha piorado.** Ele estava 🟡 com base numa premissa que a leitura
do §15.3 desmentiu: o P4 foi repontado em 16/09 e **nunca chamou o P5O nem uma vez**. O critério não
regrediu — **a nossa informação sobre ele melhorou.**

### 17.6 Um gesto de 10 segundos fecha o P4 direito

O `motivo_perda` voltou **vazio** porque o lead 43 foi marcado como perdido **sem motivo**. O I3
funcionou. **Mas o caminho do motivo nunca foi exercido** — e o critério P4 diz, com todas as letras,
*"o desfecho volta à planilha **com motivo**"*.

**Marcar um lead como perdido escolhendo um motivo na tela** fecha o último furo. É o mesmo gesto que
vira **hábito de operação** (§14.3): perda sem motivo não ensina nada.
