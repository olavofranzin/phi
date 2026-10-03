# Brief — Fase 1 da Memória Compartilhada: princípios, incidentes, enxugar o `CLAUDE.md`, fichas

| | |
|---|---|
| **Plano aprovado** | `docs/base/PLANO-MEMORIA-COMPARTILHADA.md` — 🟢 **Olavo, 2026-10-03: "Ok concordo"** |
| **Fase 0 (feita pelo chat-mãe)** | `BASE-00-PORTA.md` · `BASE-02-SUPERFICIES.md` · **R14** no `CLAUDE.md` |
| **Branch** | `claude/consolidacao-2026-08` · `https://github.com/olavofranzin/phi/tree/claude/consolidacao-2026-08` |
| **Checkout** | `git fetch origin claude/consolidacao-2026-08 && git checkout claude/consolidacao-2026-08` |
| 🔴 **Antes do 1º commit** | **compare esta branch com a da instrução da sua sessão. Divergindo, PARE e avise** (**R1**, emenda — já falhou duas vezes) |
| **Limite** | **3 voltas** |

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
