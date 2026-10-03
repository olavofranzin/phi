# Brief — Fase 1 da Memória Compartilhada: princípios, incidentes, enxugar o `CLAUDE.md`, fichas

| | |
|---|---|
| **Plano aprovado** | `docs/base/PLANO-MEMORIA-COMPARTILHADA.md` — 🟢 **Olavo, 2026-10-03: "Ok concordo"** |
| **Fase 0 (feita pelo chat-mãe)** | `BASE-00-PORTA.md` · `BASE-02-SUPERFICIES.md` · **R14** e **R15** no `CLAUDE.md` |
| **Camada de modelo** | 🔴 **FORTE** (**R10**) — ver §11 |
| **Limite** | **3 voltas** |

### 🔴 O cabeçalho da R15 — as três perguntas

| | |
|---|---|
| **1. ONDE COMMITO** | **`claude/consolidacao-2026-08`** · `https://github.com/olavofranzin/phi/tree/claude/consolidacao-2026-08` · `git fetch origin claude/consolidacao-2026-08 && git checkout claude/consolidacao-2026-08` |
| 🔴 **Antes do 1º commit** | **compare esta branch com a da instrução da sua sessão. Divergindo, PARE e avise** (**R15**) |
| **2. ONDE LEIO** | 🔴 **`docs/base/BASE-00-PORTA.md`** — esta frente é **governança/memória**, e a porta é o doc dela. Mais o **`CLAUDE.md` da raiz** (as regras) |
| **3. ONDE REGISTRO** | **(a)** `docs/base/PLANO-MEMORIA-COMPARTILHADA.md` — marcar a **Fase 1 concluída, com a prova** (os 4 números do `CLAUDE.md`) · **(b)** 🔴 **`BASE-00-PORTA.md` §4** — a tabela de estado dos 6 documentos **tem de sair de ⬜ para ✅** · **(c)** a linha no **Registro de Execuções** (**R3**) |

> ⚠️ **Este cabeçalho foi consertado em 03/10.** O brief original **não cumpria a R15** — ela nasceu
> depois dele. **O item (b) é o que a R15 existe para impedir de esquecer:** o `BASE-00` §4 é *onde
> se procura* se os documentos existem, e ele mentiria no dia seguinte (**R2 regra 5**).

> 🔴 **Leia o `BASE-00-PORTA.md` primeiro.** Este trabalho **é a aplicação das três regras dele.** Se
> você escrever um documento sem `verificado em`, ou repetir um fato de que ele não é dono, **falhou
> no próprio objeto da tarefa.**

---

## 0. 🔴 A tarefa mais delicada é a 3. Leia isto antes de tudo

**O `CLAUDE.md` é a constituição: 604 linhas, lido no início de TODA sessão, de todo sub-chat.** Se
você o estragar, **todas as sessões futuras herdam o estrago.**

| A linha que não se cruza | |
|---|---|
| 🟢 **movem-se** | os **blocos de motivo/história** (*"Motivo: em 2026-09-08…"*, as tabelas de incidente) |
| ⛔ **NÃO se tocam** | **o texto das regras**, a numeração, o imperativo. **Nem uma palavra** |
| ⛔ **NÃO se apaga nenhuma história** | elas **são** o porquê que o Olavo está pedindo. **Mudam de lugar e ganham link** |

🔴 **E a prova é mecânica, não é opinião:** toda história que sair do `CLAUDE.md` tem de aparecer
**byte-idêntica** no `BASE-04-INCIDENTES.md`. **Prove com um script** — extraia os blocos antes,
compare depois, e cole a contagem. **Se a comparação não for automática, você não provou.**

---

## 1. `BASE-01-PRINCIPIOS.md` — por que o PHI existe

**Dono do fato:** o propósito do PHI, o que ele **não** é, e as decisões-mãe que moldaram tudo.

| # | O que entra | De onde vem (**não invente**) |
|---|---|---|
| **1** | **o princípio central** | `CLAUDE.md`: *"detecta desvios e orienta o gestor — nunca executa otimizações"* |
| **2** | **o que o PHI NÃO é** | 🔴 as palavras do Olavo no `PLANO-ENTREGA-FINAL-PHI` §2 (*"primeiro ele disse o que o PHI não é"*) e §3.3 |
| **3** | **os dois scores que não se confundem** | `phi_value` (campanha) × `potencial_comercial` (lead) |
| **4** | **as decisões-mãe** — as que, se mudarem, mudam tudo | ADR-003 (autoridade do score) · ADR-21/41 (pesos iguais + cobertura declarada) · ADR-40 (métrica-mãe por campanha) · ADR-42 (normalização) · ADR-33 (identidade) · a ordem imutável da Fase 3 |
| **5** | **os guardrails de dado** | `conversions=0 ⇒ CPA/ROAS indefinidos` · `source_status error/missing ⇒ N/D` · **vazio nunca é 0** |
| **6** | 🔴 **a fronteira do produto hoje** | o motor **só calcula CPA**; `es/rs/os` são **placeholder desde o ADR-004**; o Índice **não foi construído** |

⛔ **Não escreva "a visão do PHI" com palavras suas.** Se o Olavo não disse, **marque
`⬜ a perguntar`**. Um princípio inventado vira citação falsa em três meses.

---

## 2. `BASE-04-INCIDENTES.md` — as histórias, inteiras

**Dono do fato:** o que já deu errado nesta casa, e quanto custou.

| Forma de cada incidente | |
|---|---|
| **data** · **o que parecia** · **o que era** · **o custo medido** · **a regra que saiu** |
| **link de volta** para a regra no `CLAUDE.md` |

**Entram, no mínimo** (todos já escritos, só realocados): os **7 casos da R11** · as **4 linhas da
R12** · os **3 documentos que mentiram** da R13 · a Fase 0.2 cancelada (R6) · o `ADR-38` executado e
não marcado (R2 regra 5) · o score 3× consertado sem registro · as **duas vezes que o chat-mãe inflou
gravidade** em 02/10 (R6 corolário 2) · o **draft órfão** do `Reclassifica IDs` · as **duas falhas da
regra de branch** · o **W5 "concluído"** com gráfico inexistente.

> 🔴 **Ordene por FREQUÊNCIA da doença, não por data.** O leitor precisa ver que *"vazio vira todos"*
> e *"identidade por posição"* aconteceram **várias vezes** — é isso que convence, e a ordem
> cronológica esconde.

---

## 3. 🔴 Enxugar o `CLAUDE.md` — a tarefa de risco

> 🔴 **ESTA SEÇÃO FOI AMPLIADA PELO §9. LEIA O §9 ANTES DE EXECUTAR ESTA.** O corte deixou de ser um
> (história → incidentes) e passou a ser **dois** (fato → frente, **e** história → incidentes), por
> decisão do Olavo em 03/10. **O que está abaixo é o corte B; o corte A está no §9.**

| Passo | |
|---|---|
| **1** | **extraia** todos os blocos de motivo/história para o `BASE-04` |
| **2** | no lugar de cada um, deixe **uma linha**: `> **Motivo:** <meia frase> — história completa em BASE-04-INCIDENTES#<ancora>` |
| **3** | 🔴 **confira que nenhuma regra mudou**: `git diff` do `CLAUDE.md` **não pode conter** alteração dentro do texto imperativo das regras |
| **4** | meça o antes e o depois: **linhas e bytes** |
| **5** | 🔴 **prova de não-perda, automática** (ver §0) |

**Meta honesta:** o `CLAUDE.md` em **~300 linhas**, sem perder uma regra nem uma história.
⚠️ **Se não der sem apagar história, PARE e devolva** — o teto não vale mais que a memória.

---

## 4. `BASE-03-INVARIANTES.md` — ÍNDICE, não cópia

🔴 **Este é o documento que mais tenta virar cópia. Não deixe.**

| Família | Dono | O 03 faz |
|---|---|---|
| **M1–M12** (mídia) | `saude-digital/CONTRATO-PHI.md` | **nome + uma linha + link** |
| **S1** (pilar não medido) | `saude-digital-do-negocio/` | idem |
| **I1–I11** (Prospecção) | `prospeccao/` | idem |
| **R1–R14** | `CLAUDE.md` | idem |

**Mais uma coluna, que é o valor real:** 🔴 **"já foi violado? quando?"** — com link para o incidente.
*Invariante que nunca foi violado e invariante que nos custou duas semanas não merecem a mesma
atenção.*

---

## 5. As 7 fichas-semente — `docs/base/fichas/`

| # | Artefato |
|---|---|
| 1 | `sw metricas campanhas` (`W571K320aqIHsdtH`) |
| 2 | `PHI - Pipeline_v2` (o score) |
| 3 | `PHI — Agregador de Métricas Multi-fonte` (`4sdG2UKMCBuFq8xn`) |
| 4 | `operador unico metricas` (`cLcimNoefTOnVVbd`) |
| 5 | `WF-T28-Analise-Campaign` (`fhYmJH0o9BW1IO4i`) |
| 6 | `phi_prod.client_config` (a tabela + seu writer) |
| 7 | o **servidor do webview** (`server/index.js`) |

**Forma fixa:** o que faz · **por que existe (a ideia geradora)** · **o que substituiu e por quê** ·
quem escreve / quem lê · **o que acontece quando a fonte falta** · **a prova** (com número) ·
`verificado em`.

> 🔴 **A instrução mais importante deste brief:** o campo **"por que existe"** é o conhecimento que
> **só existe na cabeça do Olavo**. Procure em três lugares — **a descrição do artefato no n8n**, o
> **ADR** correspondente, e o **`ESTADO-DO-PROJETO`**.
>
> **Se não achar, escreva `⬜ a perguntar ao Olavo` e siga.** **NÃO deduza.**
>
> **Ficha com porquê inventado é pior que ficha sem porquê:** a sem-porquê mostra o buraco; a inventada
> **o tampa com mentira**, e a próxima auditoria acredita. É exatamente o defeito que esta pasta existe
> para curar.
>
> 🟢 **E o que sobrar vira o entregável mais útil da fase:** uma **lista curta de perguntas** para o
> Olavo, em vez de uma entrevista.

---

## 6. Critérios de aceite — escritos antes (R9)

| # | Critério | Prova |
|---|---|---|
| **CA1** | Todo documento novo tem **`verificado em <data> por <quem> contra <o quê>`** | cabeçalhos |
| **CA2** | Nenhum documento novo **repete** fato de que não é dono — **liga** | — |
| **CA3** | 🔴 **Nenhuma história perdida** no enxugamento | **comparação automática**, com contagem colada |
| **CA4** | 🔴 **Nenhuma regra alterada** — nem palavra, nem número | `git diff` do `CLAUDE.md`, lido |
| **CA5** | `CLAUDE.md`: linhas e bytes **antes e depois** | os 4 números |
| **CA6** | `BASE-03` é **índice**: zero invariante copiado, e a coluna *"já foi violado?"* preenchida | — |
| **CA7** | As **7 fichas** existem, com os 7 campos | — |
| **CA8** | 🔴 **O "por que existe" não foi inventado** em nenhuma: ou tem fonte citada, ou está `⬜ a perguntar` | a lista de perguntas |
| **CA9** | `BASE-04` ordenado **por frequência da doença**, não por data | — |
| **CA10** | `docs/base/` continua com **no máximo 6 documentos** + `fichas/` | `ls` |
| **CA11** | Linha no **Registro de Execuções** no começo e no fim (**R3**) | — |
| **CA12** | 🔴 Devolveu **o que não conseguiu confirmar** e **onde este brief errou** | a lista |

---

## 7. Fora de escopo

| Fora | Por quê |
|---|---|
| **as vistas do Notion e a Porta de Entrada** | é a **Fase 2** |
| **o handoff do chat-mãe e a skill** | é a **Fase 3** |
| **ler o `PHI - SOPs`** | é a **Fase 4**, e é produto |
| **fichas além das 7** | 🔴 **ficha nasce quando o artefato é tocado.** Lote vira pilha que ninguém lê |
| **mexer em workflow, tabela ou código** | 🔴 **esta fase não toca em artefato nenhum.** É leitura e escrita de documento |
| **resolver o `Painel de Entregas`** | Fase 2 — mas **registre** se cruzar com ele |

---

## 8. O relatório de volta

1. os **12 critérios**
2. os **4 números** do `CLAUDE.md` (linhas e bytes, antes e depois)
3. a **prova automática** de não-perda de história
4. 🔴 **a lista de perguntas do Olavo** que saiu das fichas — este é o entregável que mais vale
5. **onde este brief errou** — ele foi escrito pelo chat-mãe, que esta semana inflou gravidade **duas
   vezes**. **Se eu errei premissa, quero saber**


---

## 9. 🟢 EMENDA 2026-10-03 — a reestruturação do Olavo entra na Fase 1 (e substitui a tarefa 3)

**O Olavo propôs, e eu adotei:** o `CLAUDE.md` da raiz fica **só com as regras**; o resto **aponta**
para o `CLAUDE.md` da frente. **Ver `PLANO-MEMORIA-COMPARTILHADA.md` §8.** É melhor que a minha
proposta, porque **a raiz é lida em TODA sessão, inclusive nas que nunca tocarão naquela frente.**

### 9.1. A tarefa 3 passa a ter DOIS cortes, não um

| Corte | O que sai da raiz | Para onde | Medido |
|---|---|---|---|
| **A — fato** | bloco **T28** | 🆕 `strategic-planning/otimizacao-campanhas/CLAUDE.md` | 28 linhas |
| | **Stack** · **ids do Notion** | ⛔ **apagar: `BASE-02-SUPERFICIES` já é dono** | 26 |
| | **tabelas BigQuery** | `saude-digital/CONTRATO-PHI.md` (já é dono) | 14 |
| | **14 Regras Críticas de Implementação** | doc técnico da frente que usa n8n/BQ/Google Ads | 19 |
| | **Cliente de Referência** | a frente que testa | 12 |
| | **Documentação no Notion** | ⛔ **apagar: o `MAPA` já é dono** | 14 |
| | **RTK** | doc de ferramentas | 34 |
| | 🔴 **Repositório GitHub** | **CORRIGIR e levar** — ver §9.3 | 9 |
| **B — história** | o grosso de **R13, R6, R11, R1, R12** | `BASE-04-INCIDENTES.md` | ≈180 |

**Meta: 605 → ~150–180 linhas.** ⚠️ **Sem perder uma regra nem uma história.**

### 9.2. 🔴 A linha que não se cruza, agora com nome

> **A RAIZ guarda REGRA. As FRENTES guardam FATO.**
> **Regra não lida causa estrago; fato não lido causa pergunta** — e pergunta o ponteiro resolve.

**Logo: as R1–R14 FICAM na raiz**, curtas, com uma linha de motivo + link. ⛔ **Nenhuma regra migra
para frente nenhuma.**

### 9.3. 🔴 CONSERTO OBRIGATÓRIO achado na medição

**O `CLAUDE.md` contradiz a si mesmo sobre a branch:**

| Onde | O que diz |
|---|---|
| seção *"Repositório GitHub"* | *"Branch de desenvolvimento: `claude/create-phi-folder-n2RXF`"* |
| **R1**, no mesmo arquivo | *"`claude/consolidacao-2026-08`"* |

🔴 **A branch declarada EXISTE no remoto** (confirmado em 03/10), e **há 32 branches lá**. **Isto é
lido no início de toda sessão, e tivemos dois incidentes de branch.**

| | |
|---|---|
| **Conserte** | a branch de trabalho é **`claude/consolidacao-2026-08`**, e é a **R1** que manda |
| 🔴 **E pergunte ao Olavo** | **as 32 branches** — quantas estão vivas? **Não apague nenhuma.** Só **liste** e devolva, com data do último commit. É material para ele decidir |

### 9.4. Os `CLAUDE.md` de frente

| Criar | Recebe |
|---|---|
| 🆕 `otimizacao-campanhas/CLAUDE.md` | o bloco **T28** inteiro |
| 🆕 `webview/CLAUDE.md` | 🔴 **tudo o que aprendemos em 02/10** — deploy pela raiz, 6 rotas e 2 usadas, sem autenticação, lockfile não reproduzível, Supabase morto, o join quebrado |
| 🆕 `saude-digital-do-negocio/CLAUDE.md` | o índice, o contrato de fontes, ADR-41/42 |
| atualizar `saude-digital/CLAUDE.md` e `prospeccao/CLAUDE.md` | o cabeçalho do §9.5 |

### 9.5. 🔴 Cabeçalho obrigatório de todo `CLAUDE.md` de frente

```
> Leia PRIMEIRO o CLAUDE.md da raiz — as regras R1–R14 valem aqui também.
> Esta frente é dona de: <lista curta de fatos>
> Verificado em <data>, por <quem>, contra <o quê>
```

**Ponteiro nos dois sentidos.** Frente sem link de volta vira ilha — e ilha é onde o
`CHECKLIST-webview` passou três semanas.

### 9.6. Critérios de aceite ADICIONAIS

| # | Critério | Prova |
|---|---|---|
| **CA13** | `CLAUDE.md` em **~150–180 linhas**, e **nenhuma regra R1–R14 saiu da raiz** | os 4 números + `git diff` |
| **CA14** | 🔴 **A contradição da branch foi consertada** | o diff |
| **CA15** | **Lista das 32 branches** com data do último commit — **nenhuma apagada** | a tabela |
| **CA16** | **Zero fato duplicado**: Stack, ids do Notion e Docs no Notion **saíram da raiz** porque já têm dono | — |
| **CA17** | Todo `CLAUDE.md` de frente tem o **cabeçalho do §9.5**, com link de volta | — |
| **CA18** | 🔴 **Nada se perdeu:** todo fato que saiu da raiz **existe no destino** | comparação automática, colada |


---

## 10. ⚠️ EMENDA 2026-10-03 (2) — a **R15** nasceu. Isso muda o seu corte na R1

**O Olavo pediu que *"todo brief diz a branch e o doc da frente"* virasse regra. Virou a R15**, e ela
**consolida** a exigência de branch que hoje mora **dentro da R1, em bloco de citação**.

| Ao enxugar a **R1** | |
|---|---|
| 🟢 **a exigência de branch sai dela** | **o dono agora é a R15** |
| 🟢 **a R1 fica** com o papel: chat-mãe × sub-chat, e quando parar e escrever brief | |
| **as duas histórias de branch** (26/09 e 29/09) | vão para o `BASE-04`, e a **R15** linka |
| ⛔ **não duplique a exigência** nas duas | é a regra 1.1 do `BASE-00` aplicada às próprias regras |

**E a R15 trouxe uma terceira exigência que ainda não existia:** 🔴 **todo brief diz o DOC CANÔNICO
que fecha a etapa.** Motivo medido: em 02/10 o chat-mãe escreveu **três** fechamentos no lugar do
executor (relatório do W4, o `CHECKLIST-webview` e o as-built do ADR-33) **porque o brief não dizia
qual documento fechava.**

| 🆕 **CA19** | A **R15** está na raiz, e a exigência de branch **não ficou duplicada** entre R1 e R15 | o diff |


---

## 11. 🔴 Camada de modelo para executar este brief (R10)

**Camada FORTE.** Hoje isso é **Opus**. ⛔ **Não execute em camada rápida.**

**O teste da R10 é *"duas pessoas competentes responderiam diferente?"* — e aqui a resposta é sim em
quatro lugares:**

| # | Onde há julgamento | Por que camada rápida falha |
|---|---|---|
| **1** | **o que é REGRA e o que é HISTÓRIA** no `CLAUDE.md` | a fronteira não está marcada no arquivo. Errar para o lado da história **apaga regra** |
| **2** | **o que é PRINCÍPIO** e o que é só decisão | o `BASE-01` é o doc mais fácil de encher de frase bonita sem dono |
| **3** | 🔴 **o campo "por que existe" das fichas** | **é o risco central.** O brief manda escrever `⬜ a perguntar ao Olavo` quando não achar — e **modelo mais fraco preenche a lacuna com texto plausível** em vez de admitir que não achou. **Ficha com porquê inventado é o pior resultado possível desta fase** |
| **4** | **a ordem do `BASE-04` por frequência da doença** | exige ver que *"vazio vira todos"* e *"identidade por posição"* são **o mesmo padrão** repetido, e não sete casos soltos |

> 🔴 **A regra é do degrau, não da marca (R10).** Se amanhã houver outro nome no degrau forte, é
> esse. **O que não muda: esta tarefa reescreve a constituição do projeto e inventa nada.**

### E o que mais importa na escolha da sessão

| | |
|---|---|
| **Ferramentas** | **só arquivo e git.** ⛔ **Esta fase não toca em n8n, BigQuery nem Notion** — exceto a linha do ledger (**R3**) |
| **Sessão dedicada** | 🔴 **uma sessão só para isto.** Ela lê o `CLAUDE.md` inteiro (634 linhas), extrai, reescreve e **prova que nada se perdeu** — não divida atenção com outra frente |
| **Modo rápido** | 🟢 **o modo rápido do Claude Code usa Opus com saída mais rápida — não rebaixa o modelo.** Pode usar |
