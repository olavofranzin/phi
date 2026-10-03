# BASE-01 — PRINCÍPIOS. Por que o PHI existe, e o que ele não é

| | |
|---|---|
| **O que este documento é** | 🔴 **o dono do propósito do PHI.** As decisões-mãe: aquelas que, se mudarem, mudam tudo o resto |
| **Escrito em** | 2026-10-03 |
| **Verificado em** | 2026-10-03, pelo **sub-chat da Fase 1 da memória compartilhada**, **contra** o `CLAUDE.md` da raiz (commit `d543f16`), o `PLANO-ENTREGA-FINAL-PHI.md` (§0.1, §2, §3.3), o `ADR-41`, o `ADR-42`, o `MAPA-DE-DOCUMENTACAO.md` e o `ESTADO-DO-PROJETO.md` |
| **Dono de qual fato** | o propósito · o que o PHI **não** é · as decisões-mãe · os guardrails de dado · a fronteira do produto hoje |
| **Quem NÃO é dono** | o **texto das regras** (`CLAUDE.md`) · o **estado de hoje** (`ESTADO-DO-PROJETO.md` §0) · **onde cada coisa vive** (`BASE-02-SUPERFICIES.md`) · **o que já deu errado** (`BASE-04-INCIDENTES.md`) · **cada decisão individual** (o ADR dela) |

> 🔴 **A regra desta página:** nenhuma frase aqui é a visão do PHI escrita com palavras minhas.
> **Onde o Olavo falou, está o verbatim dele, com data.** Onde ele não falou, está
> **⬜ a perguntar ao Olavo** — e o buraco fica visível de propósito.

---

## 1. O princípio central

**Como está escrito no `CLAUDE.md` da raiz desde sempre** (byte-idêntico, commit `d543f16`):

## O que é o PHI

Sistema automatizado de monitoramento e gestão de campanhas de tráfego pago (Google Ads e Meta Ads). Calcula diariamente um score de saúde por campanha (0–100), classifica em EXCELLENT / GOOD / WARNING / CRITICAL e aciona tarefas operacionais com checklists no Notion.

**Princípio central:** O PHI detecta desvios e orienta o gestor — nunca executa otimizações automaticamente.

> **Este é o fato de que esta página é dona.** O `CLAUDE.md` passa a apontar para cá.
> A frase *“detecta desvios e orienta o gestor — nunca executa otimizações”* é
> **a única coisa do PHI que nunca foi revisada em nenhuma rodada de entrevista.**

---

## 2. 🔴 As 4 razões de o PHI existir

**Fonte:** `PLANO-ENTREGA-FINAL-PHI.md` §0.1 — dedução do executor **confirmada pela metade** pelo
Olavo em **2026-09-21** (*“Certo, mas falta metade”*), e completada por ele na mesma data.

| # | Razão | De onde vem |
|---|---|---|
| **R-A** | **A qualidade do serviço para de depender da atenção do Olavo** | dedução do executor, **confirmada** pelo Olavo 21/09 |
| **R-B** | **Acumular aprendizado** — o ativo é a **série**, não o score de hoje | **Olavo, 21/09** |
| **R-C** | **Provar valor ao cliente** — mostrar o que foi detectado e corrigido | **Olavo, 21/09** |
| **R-D** | **Agir antes do estrago** — pegar o desvio no dia 2, não no dia 20 | **Olavo, 21/09** |

**O verbatim da peça central**, como o executor a formulou e o Olavo a confirmou:

> *“O PHI não é uma ferramenta de apoio ao serviço. Ele é a **capacidade de entrega do produto
> principal** (SVC-ADS). Sem ele, a agência atende tantos clientes de tráfego quantos o Olavo
> conseguir olhar com o próprio olho.”*

> 🔴 **O que o Olavo NÃO escolheu, e é importante que fique escrito:** *“levar o critério para fora
> de mim”* (fazer outra pessoa chegar à mesma conclusão) **não foi apontado como razão**. Isso não a
> torna falsa — **torna-a não-motivo.**

### 2.1. ⚠️ Três das quatro razões não têm nada no sistema que as sirva

**Fonte:** `PLANO-ENTREGA-FINAL-PHI.md` §0.1, medido lá. **Não é estimativa minha.**

| Razão | O que o PHI precisaria ter | Existe hoje? |
|---|---|---|
| **R-A** | vigilância que substitua o olho | 🔴 **não** — o detector é o olho do Olavo |
| **R-B** | medir **se a orientação funcionou** | 🔴 **nada** |
| **R-C** | um **entregável externo** ao cliente | 🔴 **nada** |
| **R-D** | **tendência**, não só estado | 🔴 **nada** — o score é um retrato do dia |

> 🔴 **O achado mais desconfortável da casa, e ele é sobre propósito, não sobre bug:**
> a **Prospecção fecha o laço** (`acerto_previsao` traz o desfecho do CRM de volta) e **o PHI não.**
> Ele detecta, abre tarefa, o gestor resolve, o `Fechar Otimização` desmarca a caixinha — **e
> ninguém mede se o número melhorou.** O ciclo termina em *“foi feito”*, nunca em *“funcionou”*.
>
> **Sem isso a R-B é impossível por construção:** aprendizado é **detecção + ação + resultado**, e
> faltam as duas últimas.

---

## 3. 🔴 O que o PHI NÃO é — nas palavras do Olavo

**Fonte:** `PLANO-ENTREGA-FINAL-PHI.md` §2. O chat-mãe pediu *“os 12 itens como você fez na
Prospecção”*; **a resposta recusou a analogia, e a recusa é o conteúdo.**

> **Olavo, verbatim, 2026-09-27:**
>
> *“Prospecção não tem nada relacionado ao PHI, por mais que alguns indicadores venham da mesma
> fonte; prospecção é uma etapa do comercial que atenderá a dinâmica do comercial e as suas
> políticas (que poderão mudar mês a mês, coisa que o PHI não). O PHI poderá ou não ser usado como
> diferencial competitivo. Até declararmos o PHI como 'pronto', ou seja, com números que acreditamos
> corresponder à realidade, não poderei ficar sem prospectar.”*

**As três fronteiras que saem daí** (`G1`, `G2`, `G3` no `PLANO-ENTREGA-FINAL-PHI` §2):

| # | A fronteira | Consequência prática |
|---|---|---|
| **G1** | **O PHI não herda a cadência do Comercial.** A política comercial muda mês a mês; **o PHI não pode** | um indicador do índice **não muda porque a política de vendas mudou**. **Fonte compartilhada ≠ regra compartilhada** |
| **G2** | **O PHI como diferencial de venda é OPCIONAL e CONDICIONAL** — só depois de *“pronto”* | ⬜ **nada do PHI entra em material comercial até isso.** Não é timidez: é não vender número em que a casa ainda não confia |
| **G3** | 🔴 **A Prospecção não pode esperar o PHI** | as duas correm **em paralelo**; priorizar uma **não suspende a outra** |

### 3.1. ⚖️ E o que é imutável, segundo ele

> **Olavo, verbatim, 2026-09-20** (`PLANO-ENTREGA-FINAL-PHI` §3.3.3):
>
> *“até termos um documento escrito nesta nova base nada é imutável. O que já temos como documentação
> serve para mostrar o raciocínio que nos trouxe até aqui, o porquê cada coisa foi criada, para
> mostrar que o pensamento base, criador, ainda permanece e está se formatando. A base permanece, o
> que queremos com o PHI permanece, o restante pode (e se preciso) deve ser alterado ou descartado.”*

| O que permanece | O que é revisável |
|---|---|
| **o propósito do PHI** e a base do raciocínio | ADRs, contratos, matrizes, invariantes, nomes de tabela, desenho de workflow |
| **o princípio:** detecta, classifica e orienta — **nunca executa** | a forma como isso é implementado |

> 🔴 **Isto não é licença para apagar história.** A documentação anterior **não é lei; é o registro de
> por que cada coisa nasceu** — continua sendo lida como **explicação**, não como ordem. E
> **descartar exige dizer o que substitui**: *“isto sai”* sem *“aquilo entra no lugar”* é buraco, não
> simplificação.

---

## 4. 🔴 Os dois scores que não se confundem

| | `phi_value` | `potencial_comercial` |
|---|---|---|
| **mede** | a **saúde da campanha** | a **qualidade do lead** |
| **frente** | Saúde Digital / PHI·Mídia | Prospecção |
| **contrato** | `saude-digital/CONTRATO-PHI.md` (M1–M12) | `prospeccao/CONTRATO-PROSPECCAO.md` (I1–I11) |
| **fecha o laço?** | 🔴 **não** | ✅ **sim** — `acerto_previsao` |

> ⚠️ **Por que isto é um princípio e não um detalhe:** *“alguns indicadores vêm da mesma fonte”* —
> GBP, PageSpeed e site aparecem **na Prospecção (pontuando lead)** e **no índice (pontuando
> negócio)**. **Mesma fonte, réguas diferentes, donos diferentes** — e a confusão se paga na origem
> do dado, não só no score.

---

## 5. As decisões-mãe — as que, se mudarem, mudam tudo

| Decisão | O que ela fixa | Onde ela mora |
|---|---|---|
| **ADR-003** | 🔴 **o score é fato, e tem autoridade única.** Quem não é o motor **não recalcula nem sobrescreve** `phi_value`/flags/severidade | citado no `CLAUDE.md`, no `CONTRATO-PHI.md` (I7) e no `L3.0-orquestrador-campaign-design.md`. ⬜ **o documento-fonte do ADR-003 está no Notion, não em git** — não o abri |
| **ADR-21 → ADR-41** | **pesos iguais provisórios + cobertura declarada** no Índice de Saúde Digital do Negócio. O **ADR-41 supersede parcialmente o ADR-21** — só a tabela de pesos | `saude-digital-do-negocio/adr-rascunhos/ADR-41-*.md` — 🟢 **ACEITO, Olavo, 2026-09-25** |
| **ADR-42** | **normalização de indicador de alvo**, e a consolidação das decisões de 25/09 | `saude-digital-do-negocio/adr-rascunhos/ADR-42-*.md` — 🟡 **rascunho** |
| **ADR-40** | 🔴 **a métrica-mãe é da CAMPANHA**, e viaja com ela | `saude-digital/adr-rascunhos/ADR-40-*.md` |
| **ADR-33** | **identidade estável do item no pipeline de métricas** | `saude-digital/adr-rascunhos/ADR-33-*.md` |
| **A ordem da Fase 3 é imutável** | **Fechamento → Escalada → Abertura** | Regra Crítica nº 11, hoje em `saude-digital/REGRAS-CRITICAS-IMPLEMENTACAO.md` |

> ⚠️ **ADR em RASCUNHO é decisão pendente, e a idade dele é o tamanho do risco** (`BASE-00` §2).
> O **ADR-42** está em rascunho e carrega a normalização de alvo.

> 🔴 **Defeito de governança registrado, e não é escopo desta página:** o campo `Número ADR` na DB
> `PHI™ — Decisões (ADR)` do Notion é **`auto_increment_id`, somente leitura** — então **título e
> número não batem naquela DB desde antes do ADR-41** (a página titulada *“ADR-21”* tem
> `Número ADR = ADR-25`). Fonte: `ADR-41`, nota de numeração.

---

## 6. Os guardrails de dado — e eles são princípio, não implementação

| Guardrail | O que significa |
|---|---|
| `conversions = 0` ⇒ **CPA/ROAS indefinidos** | **nunca** *“cpa 0 = ótimo”* |
| `source_status` **error/missing** ⇒ **N/D** | **não 0** |
| 🔴 **vazio nunca é 0** | é o **I3** da Prospecção, e vale para a casa inteira |

> 🔴 **Por que isto é princípio:** os três dizem a mesma coisa — **“não sei” e “zero” são respostas
> diferentes, e o sistema tem de saber escrever as duas.** Quando elas saem iguais, o consumidor não
> tem como distinguir, e foi assim que *“sem histórico”* saiu como `n_dias = 0` numa campanha com
> **250 dias de série**. Histórias em
> [`BASE-04-INCIDENTES.md`](BASE-04-INCIDENTES.md#1-D1-vazio-vira-outra-coisa).

---

## 7. 🔴 A fronteira do produto HOJE — o que o PHI ainda não faz

**Isto não é roadmap. É o limite do que existe, medido, para que nenhum documento afirme capacidade
que o sistema não tem.**

| A fronteira | Verificado contra |
|---|---|
| 🔴 **o motor do score só calcula CPA.** `primary_metric_type != 'CPA'` sai como `INSUFFICIENT_DATA` / `METRIC_TYPE_UNSUPPORTED`. Cliente de **CPL/ROAS entra e sai sem nota** — não é bug de dado, é **limite do motor** | `saude-digital/CLAUDE.md` item 9 · `ADR-40` §10.3 · `PLANO-ENTREGA-FINAL-PHI` §4 |
| **o `CHA` (`CLI-13`) é real e é CPL** ⇒ hoje **sem nota**, e o vigia acusa todo dia até existir marca de *“fora por decisão”* | `ADR-40`, cabeçalho |
| **os componentes `es`/`rs`/`os` são placeholders** — eram constantes `50.0` e hoje estão com **peso 0** no `model_config` MODEL-VAREJO-001 **v1.2** | `MAPA-DE-DOCUMENTACAO.md` linha 122 · `ESTADO-DO-PROJETO.md` (v0.1.52 e §478) |
| **o Índice de Saúde Digital do Negócio não foi construído** — existe decisão (`ADR-41`, aceito) e metodologia, **não existe motor** | `ADR-41` · `saude-digital-do-negocio/` |
| **o PHI pontua o agregado, e o agregado não tem causa** — a hierarquia real tem **três níveis** (campanha · conjunto · anúncio) e o PHI ignora os dois de baixo | **Olavo, verbatim 2026-09-20**, `PLANO-ENTREGA-FINAL-PHI` §3.3.2 |
| **o único alarme que chega é *“o `operador unico metricas` não rodou”*.** Falha na coleta, coleta que não aconteceu e qualquer outra falha são **silenciosas** | **Olavo, verbatim**, §3.3.1 |

> **Olavo, verbatim, 2026-09-20** (§3.3.2), sobre o que o PHI está ignorando:
>
> *“é ele [o anúncio] que fica 'ruim' ou não, a campanha é reflexo de um ou mais anúncios. Um anúncio
> ruim não significa necessariamente uma campanha ruim, ao passo que, uma campanha ruim possui um ou
> mais anúncios ruins. (…) estamos esquecendo como funcionam as plataformas de anúncios, como elas
> estruturam e enxergam a campanha, o conjunto de anúncio(s) e o(s) anúncio(s), estamos tomando os
> registros que temos como absolutos.”*

> 🔴 **O que isso revelou sobre o parque, e é a lição:** o `sw metricas conjuntos` **existe, roda e
> escreve no Notion** — e foi classificado como *“ativo que não produz nada”* por **duas varreduras
> seguidas**, porque ninguém sabia para que serviria. **Ele estava certo o tempo todo; a régua é que
> faltava.** É o caso mais puro da **R5** nesta casa.

---

## 8. ⬜ O que esta página NÃO sabe — a perguntar ao Olavo

**Nada abaixo foi preenchido por dedução. São buracos, e ficam visíveis.**

| # | ⬜ A pergunta | Por que importa |
|---|---|---|
| **1** | **A lista do que o PHI vai permitir que hoje não dá.** O Olavo respondeu *o que o PHI não é*; **falta a ambição** | está declarado como aberto no `PLANO-ENTREGA-FINAL-PHI` §2 (*“o que ele respondeu foi a fronteira; falta a ambição”*) |
| **2** | **O que é *“pronto”***, em número. O `G2` trava material comercial até o PHI estar *“pronto, com números que acreditamos corresponder à realidade”* — **e “acreditamos” não é critério testável** | sem isso o `G2` não tem gatilho |
| **3** | **A `Log de Otimizações`** (`19fb65e5c72b81068e76f1e684197316`) está no `CLAUDE.md` desde sempre. **Ninguém verificou se algo escreve nela** — pode ser o elo que falta para a **R-B**, ou mais uma tabela sem writer | é o laço que o PHI não fecha |
| **4** | **O documento-fonte do ADR-003** está no Notion e **eu não o abri** nesta fase. Tudo que afirmo dele vem de **citações em outros documentos** | é a decisão-mãe mais citada da casa |
| **5** | **A atribuição do `es`/`rs`/`os` ao ADR-004.** O brief desta fase disse *“placeholder desde o ADR-004”*. Eu confirmei que **são placeholders** (`MAPA` + `ESTADO`), mas **não achei o ADR-004 declarando isso** — o que achei dele foi a **lista de componentes** (`L3.0-orquestrador-campaign-design` linha 44) | **não deduzo a atribuição.** O fato está confirmado; a fonte dele, não |
