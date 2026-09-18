# [PLANO] Etapa 8 do ADR-38 = **critério C2** — Fases 1 e 2 do ADR-37

| | |
|---|---|
| **Data** | 2026-09-18 |
| **Frente** | PHI·Mídia Score — consolidação de writers |
| **Fecha** | **C2** da `DEFINICAO-DE-PRONTO-PHI-V1` · **etapa 8** do ADR-38 · Fases 1 e 2 do ADR-37 |
| **Destrava** | **C1** (Score v2 / ADR-34) |
| **Branch** | `claude/consolidacao-2026-08` |
| **Estado** | ⬜ **plano — aguardando OK do Olavo (R7)** |

---

## 0. 🔴 Leia isto antes de qualquer coisa: o que a Fase 0.2 ensinou

**Em 2026-09-08 a Fase 0.2 do ADR-37 foi cancelada na hora de executar.** O inventário tinha visto
*"dois workflows escrevem o campo `Otimização Ativa?`"* e chamado de conflito. A leitura do fluxo,
feita **antes** de desabilitar qualquer nó, mostrou **três transições distintas**:

| Transição | Dono | Exclusivo? |
|---|---|---|
| **Abrir** (marca `true`) | `Pipeline_v2` | ✅ só ele |
| **Fechar por tarefa concluída** | os dois | ❌ sobreposto, mas inofensivo |
| **Limpar órfã** | `Pipeline_v2`, branch FALSE | ✅ só ele |

Executar como estava escrito teria **parado toda abertura de otimização** — quebrando a Fase 3, cuja
ordem é imutável pela Regra Crítica nº 11. **Nada foi desabilitado.** É a origem da **R6** e do
invariante corrigido: **a `I1` vale para transições de estado, não para nomes de campo.**

### Por que isso é exatamente o risco DESTE plano

As Fases 1 e 2 do ADR-37 foram escritas em **08/09** — **antes do ADR-38**, a partir do mesmo
inventário que produziu a Fase 0.2. E o próprio ADR-37, na §3.0.3, **já inverteu o `D1` uma vez**:
o ADR mandava aposentar o `GADS_INSERT`, e o dado mostrou que era justamente ele que alimentava o
score.

> **Regra deste plano: nenhuma fase começa executando. Cada uma começa lendo o que está no ar e
> comparando com o que o ADR-37 supôs.** Onde divergir, o dado vence e o ADR é corrigido primeiro.
> A premissa "dois writers no mesmo destino = um sobra" é precisamente a que já errou duas vezes.

---

## 1. Por que isto é o C2, e não só o fim do ADR-38

| Critério | Antes | Agora |
|---|---|---|
| **C2** — *um dado, um writer* | 🔴 bloqueado: *"decidir P-10 antes de consolidar"* | 🟡 **desbloqueado 18/09** — o **ADR-38 fechou o P-10** e unificou a identidade |
| **C1** — Score v2 em produção | 🟡 bloqueado por C2 | 🟡 caminho aberto — a série limpa que ele exige **já está carregada** |

**A dependência é real, não burocrática.** O Score v2 é validado comparando score contra
métrica-mãe sobre a série diária. Enquanto dois writers pudessem produzir linhas concorrentes, essa
comparação não era confiável. Com a identidade unificada eles colidem no `MERGE` — mas **"colidem"
ainda não é "um dono"**: hoje um cria a linha e o outro sobrescreve parte dela. **O C2 só fecha
quando cada coluna tiver um dono declarado.**

Por isso a etapa 8 não é encerramento de ADR: **é o penúltimo degrau do produto.**

---

## 2. 🔴 Fase 0 — o P-24 vem primeiro, e é mais grave do que parecia

A suspeita do Olavo estava certa: o `phi_ultima_execucao` parou em **10/09**, **o mesmo dia da
alteração dos writers pelo ADR-38**. Conferi em 18/09 e o problema **não é o carimbo**.

| Onde | O que diz |
|---|---|
| **BigQuery** `phi_score_history`, Salão, 17/09 | **`phi_value = 44,59`** |
| **Notion**, página do Salão, hoje | **`Score Diário = 68,7`** · `Status Geral = GOOD` |
| **Notion** `phi_ultima_execucao` | **10/09** |

**`68,7` não corresponde a nenhum dos últimos 10 dias** do Salão (50,76 · 65,1 · 57,51 · 53,41 ·
44,47 · **25,54** · 38,86 · 43,48 · 48,36 · 44,59). É um valor anterior a 08/09.

**O score está sendo calculado todo dia e não está chegando ao Notion.** O Notion é a *interface
operacional* — é onde o gestor olha. Ele está vendo **GOOD / 68,7** numa campanha que está em
**44,59**, e **não viu a queda para 25,54 em 13/09**.

> Isto é a **R11** em estado puro: o pipeline roda verde, o score é gravado, e a entrega ao humano
> parou — sem erro, sem alerta. O vigia não pega, porque ele confere `raw_campaign_data` e
> `phi_score_history`, e as duas estão certas.

**Pista adicional:** a página foi editada hoje às **07:00 UTC (04h BRT)** — a janela do
`sw metricas campanhas` — e **não** às 10:00 UTC, a janela do `Pipeline_v2`. Ou seja: alguém ainda
escreve nela; quem parou foi o ramo do score.

### Hipótese principal — e é hipótese, não fato

O ramo do `Pipeline_v2` que escreve no Notion provavelmente **procura a página por `campaign_id`
com o prefixo `GADS-`**. Com a identidade nova (`21116045403`, sem prefixo), a busca não acha mais
nada e o ramo não escreve. Seria efeito colateral direto da etapa 2 do ADR-38 — **da minha própria
alteração.**

**Não confirmei.** Confirmar exige ler o nó dentro do `Pipeline_v2` (61 nós), e isso é a primeira
tarefa da execução.

### O que a Fase 0 entrega

| # | Ação |
|---|---|
| 0.1 | Ler no `Pipeline_v2` **o que está no ar** (R13) o ramo que escreve `Score Diário`, `phi_score` e `phi_ultima_execucao` no Notion; achar o casamento que quebrou |
| 0.2 | Corrigir, publicar e **confirmar que publicou** (R13) |
| 0.3 | Reprocessar o Notion das 2 campanhas KIL para o valor corrente |
| 0.4 | **Registrar no ADR-38** como consequência tardia da etapa 2 — a §14/§15 não previram este writer |
| 0.5 | Decidir se o vigia passa a conferir **entrega no Notion**, não só gravação no BigQuery |

> **A 0.5 é a lição que não pode passar batido.** O vigia foi desenhado para achar dado que não
> chegou ao BigQuery. Este defeito mostra que existe **um trecho depois do BigQuery** que ninguém
> vigia — e é justamente o trecho que o gestor enxerga.

**A Fase 0 não depende de nenhuma decisão do Olavo além do OK deste plano.** É correção de defeito
em produção, não consolidação.

---

## 3. R7 — o que procurei antes de propor construir

| Pergunta | Resposta |
|---|---|
| **Existe skill que faz isso?** | Não. As instaladas de n8n (`n8n-api-workflow-review`, `n8n-workflow-patterns`, `n8n-node-configuration`, `n8n-validation-expert`) são de **método**, e serão usadas. `phi-diagnostico` é do T28, outra frente. |
| **Existe workflow que já faz?** | Não. Busquei por "score" no n8n: os únicos candidatos são o próprio `Pipeline_v2`, o `PHI - Fase 2 Cálculo Score` (**inativo desde março/2026**) e o `WF-T28-Orquestrador-Analises` (rascunho, outra frente). **Nenhum outro workflow escreve score no Notion** — o ramo vive dentro do `Pipeline_v2`. |
| **Existe coluna que já guarda?** | Sim, e é o ponto: `raw_campaign_data` já tem todas as colunas. O trabalho **não é criar campo, é declarar dono**. |

**Registrado para a próxima sessão não procurar de novo.**

---

## 4. Fase A — reler os dois writers e montar a tabela de dono por coluna

**Nenhuma linha de código antes disto.** É a Fase 0.2 aplicada: ler o fluxo, não o inventário.

| # | Ação |
|---|---|
| A.1 | Ler `activeVersion` dos dois writers e listar, **coluna por coluna**, o que cada um escreve no `INSERT` e o que escreve no `UPDATE SET` |
| A.2 | Cruzar com o dado: para cada coluna, qual writer produziu o valor que está lá hoje |
| A.3 | Produzir a **tabela de propriedade real** e compará-la com a matriz do §2.2 do ADR-37 |
| A.4 | Onde divergir: **corrigir o ADR-37 antes de executar** (R6) |

**O que já sei e a Fase A tem de confirmar:** desde o corte há **463 `BACKFILL_2026-09` + 27
`DAILY_ENTRY` e zero `GADS_INSERT`**. Como o writer das 07h só carimba `GADS_INSERT` no `INSERT`,
a ausência prova que **ele está atualizando a linha criada às 00h**. Os dois colidem — que é o que
se queria. **Mas isso não diz quais colunas ele sobrescreve**, e é isso que decide a Fase C.

---

## 5. Fase B — a Fase 1 do ADR-37, revisada pelo que o ADR-38 já fez

**Metade da Fase 1 já está feita.** Executá-la como escrita seria refazer trabalho e mexer em
produção sem motivo:

| # | Fase 1 do ADR-37 (escrita em 08/09) | Estado real em 18/09 |
|---|---|---|
| 1.1 | Adicionar `revenue` ao `sw metricas campanhas` | ⬜ **pendente** — e é o **bloqueio da Fase C** (ver abaixo) |
| 1.2 | `conversions` → `FLOAT64`, tirar o `Math.round` | ✅ **feito pelo ADR-38** (D3 nos dois writers) |
| 1.3 | Migrar o tipo da coluna | ✅ **feito** — `ALTER` direto em `phi_prod`; só `conversions` era `INT64` |
| 1.4 | Re-puxe de D-1..D-3 (**D4**) | ⬜ **pendente** — e está amarrado à **P-20** |
| 1.5 | Smoke contra o export oficial | ✅ **feito** — foi o próprio rebuild (§13), e **o subcount do Salão ficou explicado** |

**Sobram 1.1 e 1.4.** Esse encolhimento é o retorno de ter lido antes de executar.

### B.1 — `revenue` no writer das 00h/04h

O dado de hoje: `revenue` está **NULL em 472 linhas** (01/01 a 17/09) e **preenchido em 18**
(09/09 a 17/09) — 2 campanhas × 9 dias. Bate com o aviso do ADR-37: **só o `GADS_INSERT` escreve
`revenue`**. A Fase A confirma isso lendo o nó.

**Enquanto o writer das 00h não escrever `revenue`, aposentar o das 07h apaga a receita.**

### B.2 — o re-puxe de 3 dias e a decisão P-20

O `sw metricas campanhas` roda **duas vezes por dia** (gatilho próprio às 00h + orquestrador às
04h). A **P-20** está aberta desde 10/09. O D4 pede re-puxar D-1..D-3 por causa do atraso de
atribuição. **São a mesma pergunta**, e a resposta natural é juntar as duas:

| Opção | O que é |
|---|---|
| **(a) recomendada** | A rodada das 00h vira o **re-puxe de D-1..D-3** (D4); a das 04h segue como a rodada do dia |
| (b) | Desativar a das 00h e pôr o re-puxe na das 04h |
| (c) | Manter as duas como estão e não implementar o D4 |

> ⚠️ **Não decidir agora.** A opção (a) parece a certa, mas depende da Fase A mostrar se as duas
> rodadas escrevem as mesmas colunas. **Decisão do Olavo depois da Fase A.**

---

## 6. Fase C — aposentar o segundo writer (a parte irreversível)

**Esta é a fase que o histórico manda tratar com desconfiança.** O `D1` já foi invertido uma vez.

**Pré-condições, todas obrigatórias:**

1. Fase A concluída, com a tabela de dono por coluna **conferida contra o dado**;
2. **B.1 entregue** — `revenue` saindo do writer que fica;
3. nenhuma coluna órfã na tabela da Fase A;
4. o nó `Execute SQL client_config sincronizado` **preservado** — ele é da Fase 3, que tem ordem
   própria e imutável (3.1 antes de 3.2, senão o CPA do KIL vira ROAS e o score quebra em silêncio).

**Procedimento — o §2.5 do ADR-37, os 5 passos, sem pular nenhum:**
consolidar no que fica → **desabilitar o nó chamador** (`Call Subworkflow Campanhas` no
`Pipeline_v2`) → desativar o workflow → **renomear com `[APOSENTADO 2026-XX-XX]`** → sticky dizendo
por que e proibindo reuso.

> ⚠️ **R12:** se algo for desabilitado para teste, a nota diz quando religar, e a sessão não fecha
> sem reler o artefato confirmando que voltou.

---

## 7. Critérios de aceite — escritos ANTES (R9)

| # | Critério | Como se mede |
|---|---|---|
| CA1 | O `Score Diário` do Notion bate com o `phi_value` do BigQuery nas 2 campanhas KIL | comparar os dois no mesmo dia |
| CA2 | `phi_ultima_execucao` avança sozinho no dia seguinte | ler a página em D+1 |
| CA3 | Toda coluna de `raw_campaign_data` tem **exatamente um** dono declarado | tabela da Fase A, revisada |
| CA4 | `revenue` continua preenchido **depois** de aposentar o segundo writer | 2 dias seguidos sem `NULL` novo |
| CA5 | Uma linha por `(client_id, platform, campaign_id, date)` | a query do §7 do ADR-38, zero duplicata |
| CA6 | A checagem de unicidade da P-19 segue verde | `Pipeline_v2` com `success` |
| CA7 | O vigia roda em silêncio em D+1 e D+2 | sem Telegram |
| CA8 | Nenhum workflow ativo com `versionId != activeVersionId` ao fim (R13) | releitura dos 4 |
| CA9 | ADR-37 e ADR-38 atualizados **e o cabeçalho de cada um marcado** (R2, lição da §20.1) | leitura do topo |

**Limite de 3 voltas (R9).** Na terceira reprovação, o problema é o plano.

---

## 8. Ordem e ponto de parada

```
Fase 0 (P-24)  →  Fase A (ler)  →  [DECISÃO do Olavo: P-20/D4 e confirmação do D1]
                                    →  Fase B (1.1 + 1.4)  →  Fase C (aposentar)
```

**Pare depois da Fase A** e traga a tabela de dono por coluna. A Fase C é irreversível e **não deve
começar sem o Olavo reconfirmar o `D1` com a tabela na mão** — não com o que o ADR-37 supôs em 08/09.

---

## 9. Fora de escopo

- **O dia 2026-07-05 sem linha** no CLI-4. Fica **registrado como desconhecido** (ADR-38 §20.4).
  Um dia em ~250 não paga reabrir o relatório do Google Ads agora. **Se o Score v2 exigir série
  contínua, aí vira tarefa** — com dono e data.
- **Fase 3 (`client_config`)** e **Fase 4 (fechar o rastro)** — blocos próprios.
- **Recalcular `phi_score_history`** — é entrega do C1, não desta.
- **P-15, P-16, P-18, P-22, P-23** — pendências abertas, nenhuma bloqueia esta etapa.

## 10. Guardrails

- **R6** — plano aceito não dispensa verificação. Este plano existe porque o anterior foi executado
  na cabeça e cancelado na mão.
- **R13** — comparar `versionId` com `activeVersionId` antes de afirmar, e reler depois de publicar.
- **R11** — *"se este nó fizesse silenciosamente o oposto do que espero, eu perceberia?"* O P-24 é a
  resposta "não" custando caro agora.
- **R2** — cada fase concluída atualiza o ADR **e marca o cabeçalho**.
- **R3** — Notion no começo e no fim de cada bloco.
- **R5** — o `PHI - Pipeline_v2` sai desta etapa **com descrição** (P-23).
- **Regra Crítica nº 11** — a ordem da Fase 3 é imutável; não encostar nela aqui.
- **Não ativar/executar workflow sem OK de budget do Olavo.**

---

## §X — Análise do chat-mãe sobre o P-24 (2026-09-18)

### X.1 A data aponta para o CORTE, não para a etapa 2

O relatório atribui o P-24 a possível efeito colateral da **etapa 2** (writers ajustados em **10/09
22:45**). **Os números dizem outra coisa.**

Os dez últimos `phi_value` do Salão são `50,76 · 65,1 · 57,51 · 53,41 · 44,47 · 25,54 · 38,86 ·
43,48 · 48,36 · 44,59` — janela de **08/09 a 17/09**. O Notion mostra **68,7**, que **não é nenhum
deles**: é **anterior a 08/09**.

**Se a quebra fosse da etapa 2, o último valor bom seria de ~10/09.** Não é. **Ela é do corte — 09/09**,
quando o prefixo `GADS-` **desapareceu do dado**.

> **Isso não enfraquece a hipótese: fortalece.** O ramo do Notion casa por `campaign_id` **com
> prefixo**, e o prefixo sumiu no corte. **A causa é a mesma; a data é outra — e a data é o que diz
> onde mais procurar.**

### X.2 🔴 A consequência que muda o escopo da Fase 0

**Se o ramo do Notion quebrou por casar com `campaign_id` prefixado, então TUDO que casa por
`campaign_id` quebrou no mesmo instante — em 09/09.** E este só apareceu **por acaso**, nove dias
depois.

A etapa 3 do ADR-38 (*"ajustar os consumidores"*) está marcada ✅ — **e estava certa no que verificou:
o SQL do score.** O que não foi verificado é **quem casa por `campaign_id` fora do SQL**. O próprio
relatório diz isso com todas as letras:

> *"Não conferi quem lê `campaign_id` para casar com o Notion."*

🔴 **A Fase 0 não é "consertar o ramo do Notion". É:**

1. **Varrer o parque** atrás de todo lugar que usa `campaign_id` como chave de casamento ou que
   contenha a string `GADS-` / `META-` — workflows, nós de Notion, SQL, filtros.
2. **Dizer, um por um, se quebrou em 09/09 ou não.**
3. **Só então consertar** — começando pelo do Notion, que é o que o gestor vê.

**Consertar um e não procurar os irmãos foi exatamente como o `id_hubspot` viveu duas semanas.** A
varredura é finita e barata; a ignorância não é.

### X.3 Por que isto passa na frente de tudo

**Não é um carimbo desatualizado. É o PHI fazendo o oposto do que existe para fazer.**

O princípio central do projeto é *"detecta desvios e orienta o gestor"*. Hoje ele mostra **GOOD** numa
campanha em **44,59**, e **escondeu a queda para 25,54 em 13/09** — o desvio mais grave da janela.
**Um painel que mente é pior que painel nenhum:** painel nenhum faz o gestor ir olhar; painel errado
faz ele não olhar.

### X.4 O buraco de vigilância, e onde ele mora no placar

A observação do relatório é estrutural e está certa:

> *"O vigia cobre até o BigQuery… Existe um trecho depois do BigQuery que ninguém vigia — e é
> justamente o que o gestor enxerga."*

O `PHI - Vigia de Frescor` vigia a **chegada do dado**. **Ninguém vigia a entrega** — a perna
BigQuery → Notion. E o Notion é **a única superfície que o gestor vê**.

**Isso não é pendência nova: é o C3 e o C4 do placar**, que estavam em *"❓ verificar"*. **Deixam de
ser caixa não conferida e passam a ser risco conhecido, com uma prova.**

### X.5 As duas decisões

| | |
|---|---|
| **Fase 0 agora, separada do resto** | ✅ **recomendado.** É correção de defeito em produção, classe de risco diferente da consolidação. Não espera o OK do plano inteiro |
| **Fases A–C** | seguem a ordem do plano, com a **parada deliberada antes da Fase C** — que é irreversível e exige o D1 reconfirmado **com a tabela na mão**, não com o que o inventário supôs em 08/09 |

---

## §Y — Decisões do chat-mãe sobre a Fase 0 (2026-09-18)

**A minha hipótese caiu, e a refutação vale mais que ela.** Eu apontei o prefixo; era a **salvaguarda
da P-19**. A varredura que eu pedi por causa de uma hipótese errada **achou o irmão certo** (P-25) —
mas por outro caminho.

### Y.1 O que vai para o `CLAUDE.md`

**R11 ganha a quinta regra e um sexto caso.** A formulação dele é a melhor que esta casa produziu:

> **O caso saudável de uma checagem é não achar nada — e no n8n "não achar nada" significa "pare
> tudo".**

É o **espelho da regra 1**: lá, *nenhum critério* não pode virar **"todos"**; aqui, *nenhum achado*
não pode virar **"pare"**. **O vazio nunca herda o padrão do nó** — o padrão é diferente em cada um.

E a lição da salvaguarda, que generaliza para além do n8n:

> **Salvaguarda é código novo em produção e exige o mesmo smoke que a mudança que ela protege.** O
> teste que faltou não era *"a checagem pega duplicata?"* — era **"o que acontece no dia em que ela
> não pega nada?"**, que é **todo dia**.

**R13 ganha a terceira regra:** *documentação de configuração se escreve depois de reler o artefato.*
Em uma semana, **três** documentos afirmaram fato que o artefato contradizia — a descrição do P5O, o
cabeçalho do ADR-38, e agora a §17.2. **Escreva o que leu de volta, não o que mandou fazer.**

### Y.2 As quatro pendências — decisão

| | Decisão | Por quê |
|---|---|---|
| **P-25** `Fechar Otimização` | ✅ **corrigir só as 3 tarefas abertas.** Não mexer nas fechadas | é o que restaura comportamento. Tarefa fechada com id antigo não faz mal e reescrever história custa mais que vale. **Registrar a escolha** para a próxima auditoria não estranhar |
| **P-27** `Code Prep Tendência` | ✅ **corrigir agora** | ninguém consome, então o risco é **zero** e o custo é uma linha. **Chave errada sem consumidor é a que alguém reusa em seis meses** |
| **P-26** rótulo de plataforma | 🟡 **aprovado, mas na Fase A/B — não agora** | hoje só afeta o **CLI-13**, que é teste. Empilhar mudança de view sobre um conserto ainda não provado é sequência ruim |
| **P-28** `t28_campaign` com 3 identidades | 🔴 **não é pendência nova: é lacuna de escopo do ADR-38** | o ADR unificou a tabela **crua** e não a **derivada**. A série do T28 está partida em três, e o T28 é o cérebro de análise. **Vai para o corpo do ADR-38**, não para uma lista de pendências |

### Y.3 A prova de amanhã — critérios escritos ANTES (R9)

**Ele fez certo em não rodar o Pipeline_v2 à mão.** A Fase 3 cria e move tarefa no Notion e a **Regra
Crítica 11** torna a ordem imutável. Rodar fora de ordem arriscava estrago maior que um dia a mais de
espera. **Foi uma regra respeitada quando era fácil racionalizar.**

**A rodada natural das 07h é a prova. O que tem de acontecer, escrito antes:**

1. o `Checar unicidade do score` **emite item** mesmo sem duplicata, e o ramo **continua**;
2. o `Sync Scores to Notion` **executa** — pela primeira vez desde 11/09;
3. o **Score Diário do Salão no Notion** deixa de ser `68,7` e passa a bater com o `phi_value` do dia;
4. os nós da **Fase 3** aparecem na execução, **na ordem imutável**: Fechamento → Escalada → Abertura.

**Qualquer um dos quatro fora do lugar, o conserto reprovou.**

### Y.4 Dois achados fora do ADR que não podem virar rodapé

- **`sw metricas conjuntos` e `sw metricas anuncios` estão ativos e escrevem em tabelas com ZERO
  linhas.** O `operador unico metricas` os chama todo dia às 04h. **Dois workflows ativos que não
  produzem nada** — ou estão quebrados, ou não deveriam existir. **É achado próprio dele, e é
  legítimo.** Não é deste ADR; **é do parque, e precisa de dono.**
- **A `t28_campaign`** (P-28), acima.

### Y.5 🔴 A conclusão estratégica da semana

Em sete dias esta casa descobriu: a **Fase 3 morta há 8 dias**, o **`Fechar Otimização` morto desde
09/09**, o **ADR-38 pronto e não marcado**, **4 falhas de alerta não identificadas**, e **2 workflows
que não produzem nada**. Tudo **verde**.

**O fio comum não é descuido — é arquitetura:**

| O que existe | O que ele vê |
|---|---|
| `PHI - Vigia de Frescor` | se o dado **chegou** ao BigQuery |
| `PHI - Alerta de Falha` | se uma execução **quebrou** |
| **nada** | se o que **deveria ter acontecido, aconteceu** |

**Execução verde que não faz nada é invisível para os dois vigias que temos.** É por isso que o C3 e
o C4 saíram de *"❓ verificar"* para 🔴 no placar — e é a próxima necessidade de arquitetura do
projeto, depois que a Fase 0 provar.
