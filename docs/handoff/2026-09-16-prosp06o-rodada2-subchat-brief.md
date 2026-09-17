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
