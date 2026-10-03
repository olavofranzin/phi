# BASE-04 — INCIDENTES. O que já deu errado nesta casa, e quanto custou


| | |
|---|---|
| **O que este documento é** | 🔴 **o dono das HISTÓRIAS que justificam as regras.** As regras moram no `CLAUDE.md` da raiz; o **porquê** delas mora aqui |
| **Escrito em** | 2026-10-03 |
| **Verificado em** | 2026-10-03, pelo **sub-chat da Fase 1 da memória compartilhada**, **contra o `CLAUDE.md` da raiz no commit `d543f16`** — cada história abaixo foi **recortada** dele por script, não redigitada |
| **Dono de qual fato** | o que já deu errado, o que parecia, o que era, e o que custou |
| **Quem NÃO é dono** | o **texto das regras** (é o `CLAUDE.md` da raiz) · o **estado de hoje** (é o `ESTADO-DO-PROJETO.md`) · **onde cada integração vive** (é o `BASE-02-SUPERFICIES.md`) |
| **Gerado por** | `scripts/fase1-memoria/gerar-base04.py` · provado por `scripts/fase1-memoria/provar.py` |

---

## Como ler este documento

🔴 **A ordem é por FREQUÊNCIA DA DOENÇA, não por data.** Uma doença que aconteceu sete vezes e uma que aconteceu uma vez não merecem a mesma atenção, e a ordem cronológica esconde exatamente isso: espalha as sete pelo calendário e faz cada uma parecer um acidente isolado.

🔴 **O texto de cada história é byte-idêntico ao que estava no `CLAUDE.md`.** Ele aparece em bloco de citação, recortado por script. **Nada foi reescrito**, para que a prova de não-perda possa ser automática — e para que o enxugamento da constituição não possa ter perdido uma palavra sem o script acusar.

## O placar das doenças

| # | A doença | Vezes | Regra que saiu |
|---|---|---|---|
| 1 | [A falta de critério vira “todos”, “pare” ou “zero”](#1-D1-vazio-vira-outra-coisa) | **7** | `R11` |
| 2 | [O documento mente — e o cabeçalho mente primeiro](#2-D2-documento-que-mente) | **5** | `R2 · R13` |
| 3 | [Estado temporário sem prazo vira estado permanente invisível](#3-D3-estado-temporario-que-nao-volta) | **4** | `R12` |
| 4 | [Número e gravidade herdados de documento, sem medir de novo](#4-D4-numero-e-gravidade-herdados) | **4** | `R6` |
| 5 | [O rascunho confundido com o que está no ar](#5-D5-rascunho-confundido-com-o-ar) | **3** | `R13` |
| 6 | [Identidade casada por posição no array ou por chave coagível](#6-D6-identidade-por-posicao) | **2** | `R14` |
| 7 | [Branch ditada por engano — o executor tem duas ordens e obedece à mais perto](#7-D7-branch-ditada-por-engano) | **2** | `R15` |
| 8 | [A intenção só existia na cabeça do Olavo](#8-D8-intencao-nao-escrita) | **1** | `R5` |
| 9 | [Construir o que já existia, ou o que não podia ser auditado depois](#9-D9-construir-o-que-ja-existia) | **1** | `R7` |
| 10 | [Entrevista de alinhamento pedida depois da construção](#10-D10-entrevista-atrasada) | **1** | `R9` |
| 11 | [Execução morando no chat-mãe](#11-D11-execucao-no-chat-mae) | **1** | `R1` |
| 12 | [Orquestrar agente onde uma skill bastava](#12-D12-orquestracao-onde-skill-bastava) | **1** | `R8` |

> **O que o placar mostra, e a ordem cronológica escondia:** as duas primeiras doenças respondem por **12 dos incidentes desta pasta**. Elas não são sete e cinco acidentes — são **duas doenças**, cada uma repetida. Quem for consertar causa-raiz nesta casa, começa por elas.

---

## 1. A falta de critério vira “todos”, “pare” ou “zero” <a id="1-D1-vazio-vira-outra-coisa"></a>

**Vezes que aconteceu:** 7 · **Regra que saiu:** `R11`

> Nó verde fazendo o contrário do que o nome diz. Sempre a mesma raiz: o vazio herdou o padrão de alguém — do nó, da query, da linguagem — e ninguém escolheu esse padrão pensando neste caso.

### 1. Os 7 casos, como estavam escritos na R11

| | |
|---|---|
| **data** | 2026-09 a 2026-10 (sete casos) |
| **o que parecia** | nó verde, execução sem erro, nome do nó dizendo o que se esperava |
| **o que era** | o nó fazia o contrário — ou processava tudo, ou nada, ou devolvia zero como se fosse resposta |
| **o custo medido** | duas semanas escrevendo em coluna inexistente · Fase 3 morta por 8 dias, verde todo dia · smoke de 1 virou escrita em 20 · 100% das linhas de um writer descartadas · `n_dias = 0` em campanhas com 250 dias de série |
| **a regra que saiu** | `R11` |
| **link de volta** | [`CLAUDE.md` → R11](../../CLAUDE.md) · âncora `H-R11-7CASOS` |

**Como estava escrito no `CLAUDE.md`** (linhas 398–406 do commit `d543f16`, byte-idêntico):

| Caso | O que parecia | O que era |
|---|---|---|
| `onError: continueRegularOutput` no P5/P6 | tudo certo | **duas semanas** escrevendo em coluna inexistente após o `id_hubspot` → `id_crm` |
| `Filter` do TMP com operador `notEmpty` e o `60` ao lado | "corta em 60" | **não cortava nada** — entraram leads abaixo do corte |
| `lookupValue` vazio no Google Sheets | "busca 1 lead" | **devolveu a planilha inteira** → smoke de 1 virou escrita em 20 |
| `INNER JOIN` com `client_config` no score | score rodando | **descartava 100%** das linhas de um writer |
| `Loop Over Items` posto para conter a cota no P6 | "agora vai de pouco em pouco" | **o que custava ficou dentro do loop** — mesmas ~100 leituras, agora com espera no meio |
| `Checar unicidade do score` posto para a duplicata gritar | "checagem instalada" | **zero linhas no caso saudável = zero itens = fim do ramo.** Matou o `Sync Scores to Notion` e **a Fase 3 inteira por 8 dias**, verde todo dia |
| `Série Diária` com `WHERE campaign_id = 'GADS-'+id` | "sem histórico" | **query agregada sempre devolve linha** — "não achei" saiu como **`n_dias = 0`** em campanhas com **250 dias de série** |

---

## 2. O documento mente — e o cabeçalho mente primeiro <a id="2-D2-documento-que-mente"></a>

**Vezes que aconteceu:** 5 · **Regra que saiu:** `R2 · R13`

> Corpo do documento certo, cabeçalho errado. Ninguém lê §14 a §19 para saber se uma etapa aconteceu: lê a primeira tabela. Doc desatualizada custa mais caro que doc inexistente, porque faz decidir errado.

### 2. 2026-09-08 — a doc da Prospecção descrevia workflows mortos

| | |
|---|---|
| **data** | 2026-09-08 |
| **o que parecia** | a documentação da Prospecção descrevia o parque de workflows |
| **o que era** | descrevia workflows que já não existiam havia semanas |
| **o custo medido** | não sabíamos que a frente estava praticamente pronta (custo em decisão, não medido em horas) |
| **a regra que saiu** | `R2 · R13` |
| **link de volta** | [`CLAUDE.md` → R2 · R13](../../CLAUDE.md) · âncora `H-R2-PROSPECCAO-0809` |

**Como estava escrito no `CLAUDE.md`** (linhas 229–232 do commit `d543f16`, byte-idêntico):

> **Motivo:** em 2026-09-08 descobrimos que a doc da Prospecção descrevia workflows que já não
> existiam havia semanas — e por isso não sabíamos que a frente estava praticamente pronta.
> **Doc desatualizada custa mais caro que doc inexistente: ela faz decidir errado.**
> Regra curta: **se não está escrito, não aconteceu.**

### 3. 2026-09-18 — o ADR-38 estava executado havia 9 dias, e o cabeçalho dizia que não

| | |
|---|---|
| **data** | 2026-09-18 (o fato era de 2026-09-09) |
| **o que parecia** | o cabeçalho do ADR-38 dizia *“Data efetiva do corte: ⬜ ainda não ocorreu”*, e o checklist do brief estava em branco |
| **o que era** | as 7 etapas estavam executadas havia 9 dias, inclusive a destrutiva — e o corpo do ADR narrava tudo |
| **o custo medido** | uma frente parada como “bloqueada” sem estar · uma rotina agendada à toa · uma sessão inteira de conferência |
| **a regra que saiu** | `R2 · R13` |
| **link de volta** | [`CLAUDE.md` → R2 · R13](../../CLAUDE.md) · âncora `H-R2-ADR38-CABECALHO` |

**Como estava escrito no `CLAUDE.md`** (linhas 238–242 do commit `d543f16`, byte-idêntico):

> **Motivo:** em 2026-09-18 descobrimos que o **ADR-38 estava executado desde 09/09** — as 7 etapas,
> inclusive a destrutiva. O corpo do ADR narrava tudo. Mas o **cabeçalho** ainda dizia *"Data efetiva
> do corte: ⬜ ainda não ocorreu"* e o **checklist do brief** estava todo em branco, **nove dias
> depois**. Custou: uma frente parada como "bloqueada" sem estar, uma rotina agendada, e uma sessão
> inteira de conferência.

### 4. Uma semana, três documentos que o artefato contradizia

| | |
|---|---|
| **data** | uma semana de 2026-09 |
| **o que parecia** | três documentos afirmavam uma configuração |
| **o que era** | o artefato contradizia os três |
| **o custo medido** | três testemunhas falsas que a auditoria seguinte acreditaria |
| **a regra que saiu** | `R2 · R13` |
| **link de volta** | [`CLAUDE.md` → R2 · R13](../../CLAUDE.md) · âncora `H-R13-TRES-DOCS` |

**Como estava escrito no `CLAUDE.md`** (linhas 525–529 do commit `d543f16`, byte-idêntico):

| Documento | Afirmava | Era |
|---|---|---|
| descrição do `PROSP-05O` | *"religado ao P4 em 16/09"* | a religação estava **no rascunho** |
| cabeçalho do **ADR-38** | *"corte ainda não ocorreu"* | tinha ocorrido **9 dias antes** |
| **ADR-38 §17.2** | *"`alwaysOutputData` ligado"* | o campo estava **nulo** |

---

## 3. Estado temporário sem prazo vira estado permanente invisível <a id="3-D3-estado-temporario-que-nao-volta"></a>

**Vezes que aconteceu:** 4 · **Regra que saiu:** `R12`

> Mudou para testar e não voltou. Nó desabilitado e draft não publicado não têm cor, não têm alarme e não aparecem em lista nenhuma — são as mudanças mais silenciosas que existem no n8n.

### 5. As 4 linhas da R12, como estavam escritas

| | |
|---|---|
| **data** | 2026-09-16 a 2026-10-01 (quatro casos) |
| **o que parecia** | configuração mudada “só para testar”, que alguém voltaria depois |
| **o que era** | ninguém voltou — e nó desabilitado e draft não publicado não aparecem em lista nenhuma |
| **o custo medido** | o backfill inteiro carimbado como contínuo · vazão presa em 3 depois do motivo acabar · a repontagem do M6 nunca exercida · um draft que **regredia** um conserto já provado, pronto para embarcar na publicação seguinte |
| **a regra que saiu** | `R12` |
| **link de volta** | [`CLAUDE.md` → R12](../../CLAUDE.md) · âncora `H-R12-4LINHAS` |

**Como estava escrito no `CLAUDE.md`** (linhas 450–455 do commit `d543f16`, byte-idêntico):

| O que foi mudado para testar | O que aconteceu por não voltar |
|---|---|
| `modo: continuo` no `[P5] Config` | o backfill inteiro rodou **carimbado como contínuo** — o campo que existe para dizer que rodada foi aquela registrou o oposto |
| vazão do P6 em **3**, baixada para a estreia | ficou em 3 depois de o motivo acabar; só não custou caro porque alguém reparou |
| `[P5] Entrada` **desabilitado** durante o smoke de 16/09 | a porta pela qual o P4 chama o P5O ficou fechada — e a repontagem do M6 **nunca foi exercida** |
| 🔴 **draft não publicado deixado para trás** no `Reclassifica IDs` do Agregador (01/10) | o workflow é **ativo**: o draft diferia do ar **só nesse nó**, e **regredia** o conserto que acabara de ser provado. **A próxima publicação de qualquer coisa o embarcaria sem ninguém saber** |

---

## 4. Número e gravidade herdados de documento, sem medir de novo <a id="4-D4-numero-e-gravidade-herdados"></a>

**Vezes que aconteceu:** 4 · **Regra que saiu:** `R6`

> Um documento registra o que era verdade no dia em que foi escrito; um critério de aceite afirma o que é verdade agora. Alarme repassado ganha autoridade a cada repasse, e quem recebe não vê que a urgência foi inventada no caminho.

### 6. 2026-09-08 — a Fase 0.2 do ADR-37 cancelada na hora de executar

| | |
|---|---|
| **data** | 2026-09-08 |
| **o que parecia** | o inventário viu “dois workflows escrevem o mesmo campo” e chamou de conflito; o plano estava aceito num ADR |
| **o que era** | eram três transições distintas — e executar o plano teria quebrado a Fase 3 |
| **o custo medido** | zero, porque a premissa foi verificada antes de desabilitar qualquer nó. É o único caso desta pasta cujo custo foi zero **por causa da regra** |
| **a regra que saiu** | `R6` |
| **link de volta** | [`CLAUDE.md` → R6](../../CLAUDE.md) · âncora `H-R6-FASE02-ADR37` |

**Como estava escrito no `CLAUDE.md`** (linhas 281–290 do commit `d543f16`, byte-idêntico):

> **Motivo:** em 2026-09-08 a **Fase 0.2 do ADR-37 foi cancelada na hora de executar**. O inventário
> tinha visto "dois workflows escrevem o mesmo campo" e chamado de conflito; a leitura do fluxo,
> feita antes de desabilitar qualquer nó, mostrou **três transições distintas** — e que executar o
> plano teria **quebrado a Fase 3** (Regra Crítica nº 11: a ordem é imutável). Nada foi desabilitado.
>
> **Executar um plano aceito que o dado já desmentiu é o pior dos dois mundos** — tem a autoridade do
> ADR e a consequência do erro.
>
> **Corolário 1:** **hipótese desmentida também se registra.** Se a refutação não for escrita, a
> próxima auditoria levanta o mesmo alarme e o trabalho se repete.

### 7. 2026-09-26 — dois critérios de aceite em cima de defeitos que já não existiam

| | |
|---|---|
| **data** | 2026-09-26 |
| **o que parecia** | dois critérios de aceite apoiados em “defeitos vivos” — o score 3× e o `t28_ga4_landing` morto há 19 dias |
| **o que era** | nenhum dos dois estava acontecendo; o score 3× era real em 19/09 e foi consertado até 26/09 sem ninguém registrar |
| **o custo medido** | uma etapa inteira parou antes do primeiro nó · três das quatro premissas caíram · cinco briefs seguidos mandaram não tocar num defeito que já não existia. Custo de obedecer à regra: uma query |
| **a regra que saiu** | `R6` |
| **link de volta** | [`CLAUDE.md` → R6](../../CLAUDE.md) · âncora `H-R6-COROLARIO2` |

**Como estava escrito no `CLAUDE.md`** (linhas 292–311 do commit `d543f16`, byte-idêntico):

> 🔴 **Corolário 2 (2026-09-26) — número herdado de documento não vira critério de aceite sem ser
> medido de novo.**
>
> **Um documento registra o que era verdade no dia em que foi escrito. Um critério de aceite afirma o
> que é verdade agora.** São coisas diferentes.
>
> **Motivo:** em 26/09 o brief do F3 escreveu dois critérios de aceite em cima de *"defeitos vivos"*
> copiados de um relatório do dia anterior — **o score 3× e o `t28_ga4_landing` morto há 19 dias.**
> Nenhum dos dois estava acontecendo. O executor mediu antes de construir, **três das quatro
> premissas caíram, e a etapa parou antes do primeiro nó.** Um dos achados errados tinha inclusive
> sido apresentado como *"mais urgente que construir o índice"*.
>
> **Custo de obedecer: uma query. Preço pago por não obedecer: uma etapa inteira.**
>
> **Teste prático:** *este número eu medi, ou eu li?* Se leu, e ele vai virar critério, **meça.** E
> **o que se mede vence o que está escrito** — inclusive o que está escrito por mim.
>
> ⚠️ **Vale também para o contrário:** a mesma sessão descobriu que **o score 3× era real em 19/09 e
> foi consertado até 26/09 sem ninguém registrar** — e cinco briefs seguidos mandaram não tocar num
> defeito que já não existia. **Defeito que some também se escreve** (é o Corolário 1, do outro lado).

### 8. 2026-10-02 — o chat-mãe inflou gravidade duas vezes no mesmo dia

| | |
|---|---|
| **data** | 2026-10-02 (duas vezes no mesmo dia) |
| **o que parecia** | o relatório traz o fato; quem leu acrescentou a urgência (*“das urgentes”*, *“pode ser credencial exposta”*) |
| **o que era** | três chaves `VITE_*` públicas por construção em repo privado, nada a rotacionar; e uma pasta `supabase/` com zero migrations e zero chamadas, nada a checar |
| **o custo medido** | trabalho mandado ao Olavo em cima de duas urgências inventadas no caminho. Custo de medir, nos dois casos: dois comandos |
| **a regra que saiu** | `R6` |
| **link de volta** | [`CLAUDE.md` → R6](../../CLAUDE.md) · âncora `H-R6-GRAVIDADE-0210` |

**Como estava escrito no `CLAUDE.md`** (linhas 313–326 do commit `d543f16`, byte-idêntico):

> 🔴 **E vale para GRAVIDADE, não só para número (2026-10-02 — duas vezes no mesmo dia, as duas
> minhas).** Um relatório traz o **fato**; quem lê acrescenta a **urgência**. **A urgência também é
> uma afirmação, e também se mede.**
>
> | O que o relatório disse (correto) | O que EU acrescentei | O que a medição mostrou |
> |---|---|---|
> | *"o `.env` está versionado e o `.gitignore` não o ignora"* | *"das urgentes"* · *"o único item que piora sozinho"* · *"pode ser credencial exposta"* | **três chaves `VITE_*`, públicas por construção, em repo privado, sem `NOTION_TOKEN`.** Nada a rotacionar |
> | *"existe pasta `supabase/` intocada"* | *"confira se há dado atrás da chave pública"* | **zero migrations, zero chamadas, `client.ts` importado por ninguém.** Nada a checar |
>
> **Nos dois casos o custo de medir era dois comandos, e eu já tinha mandado trabalho para o Olavo.**
>
> **Teste prático:** *esta gravidade eu medi, ou eu herdei?* Se herdou, **meça antes de passar
> adiante** — porque **alarme repassado ganha autoridade a cada repasse**, e quem recebe não vê que
> a urgência foi inventada no caminho.

---

## 5. O rascunho confundido com o que está no ar <a id="5-D5-rascunho-confundido-com-o-ar"></a>

**Vezes que aconteceu:** 3 · **Regra que saiu:** `R13`

> No n8n a leitura mais natural devolve o rascunho — e o rascunho é uma proposta, não o sistema. Já escondeu um caminho de produção quebrado por dois dias.

### 9. 2026-10-02 — a comparação de id é peneira, não veredito (e fez um executor recusar a ação certa)

| | |
|---|---|
| **data** | 2026-10-02 |
| **o que parecia** | a regra dizia comparar `versionId` com `activeVersionId` — ids diferentes = mudança pendente |
| **o que era** | “Descartar alterações” cria um rascunho NOVO a partir do ativo: ids diferentes, conteúdo idêntico (68 nós, zero nós diferentes). A igualdade de ids não é estado alcançável |
| **o custo medido** | um executor recusou `restore_workflow_version` — que era a ação certa — porque ela “reprovaria a R13”. A cautela estava correta; a regra estava incompleta |
| **a regra que saiu** | `R13` |
| **link de volta** | [`CLAUDE.md` → R13](../../CLAUDE.md) · âncora `H-R13-EMENDA-0210` |

**Como estava escrito no `CLAUDE.md`** (linhas 490–512 do commit `d543f16`, byte-idêntico):

> 🔴 **EMENDA 2026-10-02 — a comparação de id é PENEIRA, não veredito. E a regra, como estava
> escrita, fez um executor recusar a ação certa.**
>
> Medido no Agregador: **"Descartar alterações" no editor NÃO devolve o `versionId` do ativo — cria um
> rascunho NOVO a partir do conteúdo do ativo.** Depois do descarte: `versionId 7aba9362` ·
> `activeVersionId ecec7073` · **ids diferentes** · e **conteúdo idêntico** (68 nós, zero nós
> diferentes, conexões iguais).
>
> **Consequência:** `versionId == activeVersionId` **não é um estado alcançável** depois de qualquer
> rascunho ter existido — só publicando. **Exigir a igualdade de ids vira alarme que grita para
> sempre**, e *alarme que sempre grita é alarme desligado.*
>
> | O teste | O que ele vale |
> |---|---|
> | `versionId != activeVersionId` | 🟡 **"olhe mais perto"** — não é *"existe mudança pendente"* |
> | **conteúdo do draft vs conteúdo do ativo** | 🟢 **o veredito.** É o conteúdo que embarca numa publicação, não o id |
>
> **Custo de ter escrito a regra só com id:** o executor recusou `restore_workflow_version` **porque
> ela criava id novo e "reprovaria a R13"** — e a ação era a certa. **A cautela dele foi correta; a
> regra estava incompleta.**
>
> **Teste prático, corrigido:** *"o que embarca na próxima publicação é igual ao que está no ar?"*
> Compare **nós e conexões**, não ids.

### 10. 2026-09-16 — o `[P5] CRM-out` repontado só no rascunho

| | |
|---|---|
| **data** | 2026-09-16 |
| **o que parecia** | o `[P5] CRM-out` do PROSP-04 estava repontado para o Odoo, e duas leituras do workflow confirmaram |
| **o que era** | a repontagem estava só no rascunho; o que rodava chamava o P5 do HubSpot já aposentado, com `onError: continueRegularOutput`. As duas leituras leram o rascunho |
| **o custo medido** | caminho de produção quebrado escondido por **dois dias**; a próxima prospecção teria alimentado nada e seguido verde |
| **a regra que saiu** | `R13` |
| **link de volta** | [`CLAUDE.md` → R13](../../CLAUDE.md) · âncora `H-R13-MOTIVO-1609` |

**Como estava escrito no `CLAUDE.md`** (linhas 514–520 do commit `d543f16`, byte-idêntico):

> **Motivo:** em 16/09 o `[P5] CRM-out` do PROSP-04 foi repontado para o Odoo — **no rascunho**. O
> que rodava continuou chamando o P5 do HubSpot, já aposentado, **com
> `onError: continueRegularOutput`**: a próxima prospecção teria alimentado nada e seguido verde.
> Duas leituras do workflow não pegaram, porque as duas leram o rascunho — **e o campo `sameAsDraft:
> false` estava na tela, sem ninguém olhar.**
>
> **Teste prático:** *"eu li o que roda, ou li o que alguém propôs?"*

---

## 6. Identidade casada por posição no array ou por chave coagível <a id="6-D6-identidade-por-posicao"></a>

**Vezes que aconteceu:** 2 · **Regra que saiu:** `R14`

> Duas frentes independentes, na mesma semana, com a mesma doença: `[0]`, `.first()`, “o primeiro item” e “o que chegou agora” são acidentes de execução, não chaves.

### 11. As duas frentes, como estavam escritas na R14

| | |
|---|---|
| **data** | uma semana de 2026-09 (Agregador consertado em 29/09; Webview ainda aberto) |
| **o que parecia** | a identidade do cliente estava casada |
| **o que era** | casada por posição no array (`[0]`, `.first()`) numa frente, e por chave coagível na outra |
| **o custo medido** | dado do KIL gravado sob o `CLI-13` · o guarda convertendo `error` em `not_configured` · campanha atribuída ao cliente errado na tela, que é a função central do produto |
| **a regra que saiu** | `R14` |
| **link de volta** | [`CLAUDE.md` → R14](../../CLAUDE.md) · âncora `H-R14-DUAS-FRENTES` |

**Como estava escrito no `CLAUDE.md`** (linhas 545–548 do commit `d543f16`, byte-idêntico):

| Frente | Como a identidade era casada | O estrago |
|---|---|---|
| **Agregador** (consertado 29/09) | **posição no array** — `nodeFirst()`, `.first()`, `$('Set dados').all()[0]` | dado do KIL gravado sob o `CLI-13`; e o guarda convertendo `error` em `not_configured` |
| **Webview** (aberto) | **chave coagível** — `client_id` com zero à esquerda deixa de casar | campanha atribuída ao cliente errado na tela, que é a função central do produto |

---

## 7. Branch ditada por engano — o executor tem duas ordens e obedece à mais perto <a id="7-D7-branch-ditada-por-engano"></a>

**Vezes que aconteceu:** 2 · **Regra que saiu:** `R15`

> Declarar a branch no brief não resolveu: a instrução da sessão venceu o brief duas vezes. O conserto não foi repetir a branch com mais destaque — foi mandar reconciliar antes de existir commit.

### 12. 2026-09-26 — o ADR-41 passou a citar um documento que não existia na branch dele

| | |
|---|---|
| **data** | 2026-09-26 |
| **o que parecia** | o brief declarava a branch, com URL completa |
| **o que era** | a instrução da sessão do sub-chat apontava para outra, e venceu |
| **o custo medido** | o ADR-41 passou a citar como base um documento que não existia na branch dele — merge, conflito e documento canônico que mente |
| **a regra que saiu** | `R15` |
| **link de volta** | [`CLAUDE.md` → R15](../../CLAUDE.md) · âncora `H-BRANCH-2609` |

**Como estava escrito no `CLAUDE.md`** (linhas 197–199 do commit `d543f16`, byte-idêntico):

> **Motivo:** em 26/09 um sub-chat commitou numa branch diferente porque a instrução da sessão dele
> apontava para outra — **e o ADR-41 passou a citar como base um documento que não existia na branch
> dele.** Branch dita por engano custa merge, conflito e documento canônico que mente.

### 13. 2026-09-29 — aconteceu de novo, pelo mesmo motivo (e a trava que saiu daí)

| | |
|---|---|
| **data** | 2026-09-29 |
| **o que parecia** | a regra de 26/09 tinha sido escrita, com mais destaque |
| **o que era** | aconteceu de novo, pelo mesmo motivo: o executor tem DUAS ordens e obedece à que está mais perto dele |
| **o custo medido** | o relatório nasceu em `claude/plano-projeto-notion-v20z3g` e o chat-mãe teve de ir buscar. **Declarar a branch com mais destaque não resolveu** — o conserto foi mandar reconciliar antes de existir commit |
| **a regra que saiu** | `R15` |
| **link de volta** | [`CLAUDE.md` → R15](../../CLAUDE.md) · âncora `H-BRANCH-2909` |

**Como estava escrito no `CLAUDE.md`** (linhas 201–217 do commit `d543f16`, byte-idêntico):

> 🔴 **EMENDA 2026-09-29 — a regra acima NÃO funcionou, e aconteceu de novo, pelo mesmo motivo.**
> O brief do plano de projeto dizia `claude/consolidacao-2026-08`; **a instrução da sessão do
> sub-chat dizia outra branch, e a instrução da sessão venceu** — o relatório nasceu em
> `claude/plano-projeto-notion-v20z3g` e o chat-mãe teve de ir buscar.
>
> **Declarar a branch no brief não resolve: o executor tem DUAS ordens e obedece a que está mais
> perto dele.** O conserto não é repetir a branch com mais destaque — é **mandar reconciliar antes
> de existir commit**:
>
> | Quando | O que o sub-chat faz |
> |---|---|
> | **antes do primeiro commit** | compara a branch do **brief** com a da **instrução da sessão** |
> | **se forem iguais** | segue |
> | 🔴 **se forem diferentes** | **PARA e avisa, antes de commitar.** Não escolhe sozinho, não commita "provisoriamente" |
>
> **Teste prático:** *"eu tenho duas ordens sobre onde commitar?"* Se sim, **a dúvida vem antes do
> commit — depois vira mudança de histórico.**

---

## 8. A intenção só existia na cabeça do Olavo <a id="8-D8-intencao-nao-escrita"></a>

**Vezes que aconteceu:** 1 · **Regra que saiu:** `R5`

> Inventário pega estrutura; intenção só existe se alguém escrever.

### 14. 2026-09-08 — a auditoria não descobriu por que o `Daily Entry` foi desativado

| | |
|---|---|
| **data** | 2026-09-08 |
| **o que parecia** | a auditoria por inventário cobria o parque |
| **o que era** | não descobriu que o `Daily Entry` tinha sido desativado **porque** o `sw metricas campanhas` entrou no lugar — isso só existia na cabeça do Olavo |
| **o custo medido** | não declarado em horas no texto de origem. O custo nomeado é estrutural: “inventário pega estrutura; intenção só existe se alguém escrever” |
| **a regra que saiu** | `R5` |
| **link de volta** | [`CLAUDE.md` → R5](../../CLAUDE.md) · âncora `H-R5-DAILYENTRY` |

**Como estava escrito no `CLAUDE.md`** (linhas 263–268 do commit `d543f16`, byte-idêntico):

> **Motivo:** em 2026-09-08 a auditoria por inventário **não descobriu** que o `Daily Entry` tinha
> sido desativado **porque** o `sw metricas campanhas` entrou no lugar. Isso só existia na cabeça do
> Olavo. **Inventário pega estrutura; intenção só existe se alguém escrever.**
>
> Teste prático: **se a auditoria semanal precisa perguntar ao Olavo para entender, a descrição
> falhou.** (Generaliza o invariante I10 do ADR-35 para o projeto inteiro.)

---

## 9. Construir o que já existia, ou o que não podia ser auditado depois <a id="9-D9-construir-o-que-ja-existia"></a>

**Vezes que aconteceu:** 1 · **Regra que saiu:** `R7`

> Corrigir um plano em texto custa minutos; corrigir uma construção custa semanas.

### 15. O `1º Enriquecimento`, o `id_hubspot` e as 6 dimensões do score

| | |
|---|---|
| **data** | não declarada no texto de origem (três casos nomeados) |
| **o que parecia** | construir era o caminho |
| **o que era** | já existia, ou o que se construiu não podia ser auditado depois |
| **o custo medido** | semanas, no `1º Enriquecimento`, no `id_hubspot` e nas 6 dimensões do score |
| **a regra que saiu** | `R7` |
| **link de volta** | [`CLAUDE.md` → R7](../../CLAUDE.md) · âncora `H-R7-MOTIVO` |

**Como estava escrito no `CLAUDE.md`** (linhas 337–340 do commit `d543f16`, byte-idêntico):

> **Motivo:** é a **R2** e a **R6** aplicadas *antes* do fato, e não depois. Corrigir um plano em texto
> custa minutos; corrigir uma construção custa semanas — foi o que aconteceu com o `1º Enriquecimento`,
> com o `id_hubspot` e com as 6 dimensões do score. **O caro nunca foi construir: foi construir o que
> já existia, ou o que não podia ser auditado depois.**

---

## 10. Entrevista de alinhamento pedida depois da construção <a id="10-D10-entrevista-atrasada"></a>

**Vezes que aconteceu:** 1 · **Regra que saiu:** `R9`

> Entrevista atrasada não é entrevista — é autópsia.

### 16. 2026-09-16 — quatro das nove perguntas já tinham sido respondidas por incidente

| | |
|---|---|
| **data** | 2026-09-16 |
| **o que parecia** | pedir a entrevista de alinhamento era cumprir a R9 |
| **o que era** | o sub-chat construía desde 13/09; a entrevista chegou depois |
| **o custo medido** | quatro das nove perguntas já tinham sido respondidas por incidente. “Entrevista atrasada não é entrevista — é autópsia” |
| **a regra que saiu** | `R9` |
| **link de volta** | [`CLAUDE.md` → R9](../../CLAUDE.md) · âncora `H-R9-1609` |

**Como estava escrito no `CLAUDE.md`** (linhas 387–393 do commit `d543f16`, byte-idêntico):

> ✅ **Praticado pela 1ª vez em 2026-09-16** (PROSP-05/06): 11 critérios de aceite escritos antes de
> construir.
>
> ⚠️ **E a lição de quem escreve o brief — minha:** a entrevista de alinhamento **viaja junto com o
> brief de construção**, nunca depois. Em 16/09 pedi a entrevista a um sub-chat que construía desde
> 13/09; quando ela chegou, quatro das nove perguntas **já tinham sido respondidas por incidente**.
> **Entrevista atrasada não é entrevista — é autópsia.**

---

## 11. Execução morando no chat-mãe <a id="11-D11-execucao-no-chat-mae"></a>

**Vezes que aconteceu:** 1 · **Regra que saiu:** `R1`

> Quando a execução mora no chat-mãe, o planejamento — que é o que só ele faz — se perde.

### 17. O motivo da R1, como estava escrito

| | |
|---|---|
| **data** | não declarada no texto de origem |
| **o que parecia** | resolver a execução no chat-mãe era mais rápido |
| **o que era** | o contexto lota de detalhe operacional |
| **o custo medido** | o planejamento — que é o que só o chat-mãe faz — se perde. Não medido em horas |
| **a regra que saiu** | `R1` |
| **link de volta** | [`CLAUDE.md` → R1](../../CLAUDE.md) · âncora `H-R1-CONTEXTO` |

**Como estava escrito no `CLAUDE.md`** (linhas 219–220 do commit `d543f16`, byte-idêntico):

> **Motivo:** quando a execução mora aqui, o contexto lota de detalhe operacional e **o
> planejamento — que é o que só este chat faz — se perde.**

---

## 12. Orquestrar agente onde uma skill bastava <a id="12-D12-orquestracao-onde-skill-bastava"></a>

**Vezes que aconteceu:** 1 · **Regra que saiu:** `R8`

> O `phi-diagnostico` é o exemplo da casa: um agente que virou skill e passou a poder ser testado sem gastar token no n8n.

### 18. O motivo da R8, como estava escrito

| | |
|---|---|
| **data** | não declarada no texto de origem |
| **o que parecia** | orquestrar vários agentes dava mais poder |
| **o que era** | skill tem carga de contexto baixa e saída previsível; orquestração tem o efeito oposto |
| **o custo medido** | não declarado. O ganho medido é o inverso: o `phi-diagnostico` virou skill e passou a poder ser testado sem gastar token no n8n |
| **a regra que saiu** | `R8` |
| **link de volta** | [`CLAUDE.md` → R8](../../CLAUDE.md) · âncora `H-R8-MOTIVO` |

**Como estava escrito no `CLAUDE.md`** (linhas 355–357 do commit `d543f16`, byte-idêntico):

> **Motivo:** skill tem carga de contexto baixa e saída previsível; orquestração tem o efeito oposto e
> só se paga quando a tarefa realmente exige autonomia. O `phi-diagnostico` é o exemplo da casa: um
> agente que virou skill e passou a poder ser testado sem gastar token no n8n.

---

### 13. 2026-10-02 — o `W5` marcado “concluído” com um gráfico que deixou de existir

| | |
|---|---|
| **data** | 2026-10-02 |
| **o que parecia** | o `CHECKLIST-webview` marcava o lote **W5 concluído**, com *“tendência real (gráfico Evolução do Score ligado a `/api/phi-score-history`)”* |
| **o que era** | 🔴 **o gráfico parou de existir sem ninguém ver.** O `BASE-00-PORTA.md` §1.3 registra que a prova anexada era *“um gráfico que não existe”*; o handoff de 02/10 confirma e qualifica: *“declarado entregue, verde, ausente”* |
| **o custo medido** | não declarado em horas. O custo nomeado: **o `M10` no nível de funcionalidade**, e uma rota (`/api/phi-score-history`) que **quase foi apagada como órfã** por não ter mais consumidor — o Olavo reteve a decisão e mandou **religar o gráfico** |
| **o que teria pego** | 🔴 **um teste que afirme que o gráfico renderiza. Não existe** — entrou na lista de testes do conserto do join |
| **a regra que saiu** | `BASE-00-PORTA.md` §1.3 — **prova de concluído** |
| **link de volta** | [`BASE-00-PORTA.md` §1.3](BASE-00-PORTA.md) · [`webview/CLAUDE.md` §4](../strategic-planning/webview/CLAUDE.md) |

> 🔴 **Este incidente tem uma segunda camada, e ela está acontecendo AGORA.** O
> `docs/strategic-planning/webview/CHECKLIST-webview.md` **ainda não foi corrigido**: medido em
> 03/10, ele continua descrevendo o W5 como concluído **com** o gráfico. **O documento que mentiu
> sobre a entrega continua mentindo** — e é por isso que este caso aparece aqui e **também** na
> doença nº 2 (*“o documento mente, e o cabeçalho mente primeiro”*).
>
> ⚠️ **Fonte da reconciliação:** o `CHECKLIST` e o `BASE-00` se contradiziam, e eu não resolvi a
> contradição por dedução — **achei a resposta em
> `docs/handoff/2026-10-02-webview-os-6-passos-decisao-do-olavo.md` §7.1**, que é a decisão do Olavo
> sobre a rota. **O `BASE-00` está certo; o `CHECKLIST` está vencido.**

---

## O que esta pasta ainda não sabe

| ⬜ | O que falta |
|---|---|
| **o custo em horas** da maioria dos incidentes | o texto de origem quase nunca o declarou. Onde não está, está escrito *“não declarado no texto de origem”* — **não estimado** |
| **o `W5`** | a divergência do incidente 13, acima |
| **os incidentes antes de 2026-09** | o `CLAUDE.md` só começou a guardar história em setembro. O que aconteceu antes **não está escrito em lugar nenhum que eu tenha achado** |
