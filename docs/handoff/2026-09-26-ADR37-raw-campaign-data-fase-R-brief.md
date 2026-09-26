# [BRIEF sub-chat] ADR-37 no `raw_campaign_data` — Fase R: o retrato de hoje, antes de aposentar ninguém

> **Como usar:** sub-chat **novo**. Cole este arquivo como primeira mensagem.
> **Modelo:** Opus · **Repo:** `olavofranzin/phi` · **Branch:** `claude/consolidacao-2026-08`
> **Papel do Olavo:** **ponte.** Decisão que aparecer, **pare e devolva ao chat-mãe.**

---

## 0. 🔴 Leia isto antes de tudo: o chat-mãe errou a ordem, e a correção é o motivo deste brief

**Eu recomendei ao Olavo *"terminar o ADR-37 no `raw_campaign_data`"* como primeiro item. Ao abrir o ADR-37 para escrever o brief, encontrei três coisas que desmontam essa recomendação:**

| O que o ADR-37 diz, e eu não tinha lido | Consequência |
|---|---|
| A **Fase 2 está SUSPENSA** desde 09/09 | não é *"terminar"*: é destravar |
| A **Fase 3 vem ANTES da Fase 2**, e está **bloqueada pelo ADR-39** | 🔴 **o ADR-39 é pré-requisito, não o item seguinte** |
| 🔴 **O writer que de fato alimenta o score é o `GADS_INSERT`** — exatamente o que o ADR mandava aposentar | *"Aposentá-lo agora deixaria o score sem fonte"* |

> **É a R6, corolário 2, aplicada a mim mesmo no mesmo dia em que virou regra:** eu recomendei uma
> ordem a partir da lembrança da frente, sem reler a cadeia de dependência. **O que se mede vence o
> que está escrito — inclusive o que eu escrevi.**

**Por isso esta etapa NÃO aposenta nada. Ela mede.**

---

## 1. A história que o ADR conta, e por que ela precisa ser remedida

**A narrativa de "dois writers se sobrescrevendo" está errada — e o próprio ADR já se corrigiu em 09/09:**

Os dois writers **nunca colidem**, porque as identidades diferem:

| Writer | `client_id` | `campaign_id` | O score enxerga? |
|---|---|---|---|
| `sw metricas campanhas` (`W571K320aqIHsdtH`) | 🔴 **vazio** | `CMP.<SLUG>.CAMP-N` | ❌ **nunca** — o `INNER JOIN` descarta 100% |
| `PHI - Subworkflow Campanhas` (`b1pbn8qmzCNTufTp`) | preenchido | `GADS-<id>` | ✅ **é a única fonte** |

> **Então não há sobrescrita: há um writer alimentando o score e outro escrevendo todo dia para
> ninguém.** É um defeito diferente, e mais barato de consertar — mas só se o retrato ainda for esse.

### 🔴 E há uma ligação que ninguém fechou

A `t28_campaign` tem **318 linhas sem `client_id`, com `campaign_id` no padrão `CMP.CHA.CAMP-10`** — que o vigia hoje filtra e o chat-mãe chamou de *"resíduo de teste"*.

**`CMP.<SLUG>.CAMP-N` com `client_id` vazio é exatamente a assinatura do `sw metricas campanhas`.**

> **[HIPÓTESE DO CHAT-MÃE, não medida]** as 318 linhas **não são resíduo parado: são produção diária.**
> Se for verdade, apagá-las sem tocar no writer seria limpar duas vezes — e **muda o que o Olavo
> decidiu sobre o CLI-13**, que foi tratado como exceção de dado de teste.
>
> 🔴 **Esta é a pergunta mais importante do brief.**

---

## 2. 🔴 Por que remedir, e não confiar no ADR

**Os números do ADR-37 são de 08 e 09/09 — dezessete dias.** Desde então aconteceram:

- o **rebuild do ADR-38** (identidade neutra: `campaign_id` nativo, chave com `platform`)
- o **ADR-40** (`primary_metric_type` viaja com a campanha)
- a **Fase B.1** (`revenue` passou a ser escrito pelo writer 1)
- e o **score 3× sumiu**, sem ninguém registrar

**Qualquer um dos quatro pode ter mudado o retrato.** O ADR-38 mexeu justamente na identidade que é a causa de tudo aqui.

---

## 3. As oito perguntas — e a entrega é a resposta medida de cada uma

**Toda resposta com número, execução e a query ao lado** (R11, regra 5: se um zero pode significar *"não encontrei"*, traga a contagem do que casou).

| # | Pergunta | Por que importa |
|---|---|---|
| **R1** | Nos últimos **7 dias**, quantas linhas cada writer escreveu em `raw_campaign_data`? | ⚠️ **o `ingestion_step` MENTE** — o `UPDATE` de um não o atualiza. **Use a assinatura de colunas exclusivas, não o carimbo** |
| **R2** | Quantas linhas têm **`client_id` vazio ou nulo** hoje? De qual writer? | é o **M3** sendo violado todo dia |
| **R3** | O `sw metricas campanhas` ainda grava **`CMP.<SLUG>.CAMP-N`**, ou o ADR-38 já o corrigiu para o **ID nativo**? | 🔴 **muda tudo.** Se já é nativo, os dois **colidem hoje** e o defeito virou outro |
| **R4** | O `INNER JOIN` do score ainda **descarta 100%** das linhas dele? | é a afirmação central da §3.0.3 |
| **R5** | O `GADS_INSERT` ainda é a **única fonte** do score? | é o que mantém a Fase 2 suspensa |
| **R6** | O **`revenue`** está chegando pelo writer 1 desde a Fase B.1? | era a única coluna que só o GADS_INSERT escrevia |
| **R7** | O `UPDATE` do `client_config` ainda tem função, ou o ADR-40 já o esvaziou? | é o que torna a aposentadoria segura **ou** destrutiva |
| **R8** | 🔴 **As 318 linhas órfãs da `t28_campaign` são produção DIÁRIA ou resíduo parado?** | ver §1. **Se forem diárias, a decisão do CLI-13 precisa ser revista** |

**Ferramenta:** `TMP - A6 BigQuery Audit` (`m8unFD0ksEc1Zvbk`) — **inativo, só `SELECT`**. Confirme com a **R13** antes de usar.

---

## 4. Critérios de aceite — escritos antes (R9)

| # | Critério |
|---|---|
| **CA1** | **As oito respostas**, cada uma com número, execução e query |
| **CA2** | 🔴 **Cada resposta diz se CONFIRMA ou DERRUBA** o que o ADR-37 afirma. Derrubar é resultado bom |
| **CA3** | Nenhum número vem de documento. **Tudo medido nesta sessão** (R6, corolário 2) |
| **CA4** | Uma **recomendação de qual writer fica**, com a evidência ao lado — e **por que o outro sai** |
| **CA5** | 🔴 **A ordem das fases, revista contra o medido.** Se o ADR-39 continuar sendo pré-requisito, **diga isso com todas as letras** |
| **CA6** | **Nada foi alterado.** Nenhum workflow tocado, nenhuma linha escrita ou apagada |
| **CA7** | O que **não** foi medido, e por quê |

---

## 5. ⛔ Fora do escopo — e aqui é quase tudo

- ❌ **Não aposente nada.** Nem nó, nem workflow, nem coluna
- ❌ **Não conserte o `client_id` vazio**, mesmo sendo óbvio. 🔴 **Corrigir a identidade faz os dois writers colidirem pela primeira vez** — e aí a sobrescrita silenciosa começa de verdade. **Isso tem de ser decidido junto com quem fica**
- ❌ **Não apague as 318 linhas.** Medir de quem são é a entrega; apagar é outra decisão
- ❌ **Não mexa no ADR-39, no Agregador, no vigia, no índice**
- ❌ **Nenhum nó de LLM.** Custo de modelo desta etapa: **zero**

---

## 6. O que entregar

| # | Entrega | Onde |
|---|---|---|
| 1 | **Relatório com as 8 respostas** e o veredito sobre a ordem das fases | `docs/handoff/2026-09-__-ADR37-fase-R-retrato.md` |
| 2 | **Adendo no ADR-37** — o que de 08-09/09 ainda vale e o que caiu. **Sem apagar o corpo**; banner de histórico onde virou retrato (R2) | `ADR-37-writers-canonicos-um-destino-um-dono.md` |
| 3 | Se a hipótese da **R8** se confirmar: **adendo na análise da limpeza e na decisão do CLI-13** | `2026-09-26-limpar-tudo-do-bigquery-analise.md` |
| 4 | **Linha no Notion**, ao começar e ao encerrar (R3) | Notion |

**E a pergunta da R4 respondida no relatório:** *onde estamos, quanto falta, e o que eu atualizei para provar isso?*

---

## 7. Como falar com o Olavo

- Ele é **ponte**. Decisão que aparecer → **pare, escreva a pergunta com opções e consequências, devolva.**
- **Separe o que leu do que mediu.** Nesta etapa, **só o medido conta**.
- 🔴 **Derrubar o ADR-37 é um resultado desejado.** Ele já se derrubou uma vez sozinho, em 09/09, e aquilo salvou o score. **Se o dado disser que a Fase 2 é impossível, isso é a entrega — não é falha.**

---

## 8. 🔴 Se quem executar NÃO for um Claude Code com o `CLAUDE.md` carregado

**Este brief cita regras pelo número** (R6, R9, R11, R12, R13) e **invariantes** (M1–M12). Num
ambiente que não carrega o `CLAUDE.md` da raiz automaticamente — **Codex, por exemplo** — esses
números não querem dizer nada, e o brief perde metade do peso.

**Leia estes arquivos ANTES de qualquer coisa, na ordem:**

| # | Arquivo | O que tirar dele |
|---|---|---|
| 1 | `CLAUDE.md` (raiz) | **R6** (o dado vence o plano) + **corolário 2** (número lido ≠ medido) · **R11** (sucesso silencioso, as 5 regras) · **R12** · **R13** (leia o que está no ar) · **R9** (3 voltas) |
| 2 | `docs/strategic-planning/saude-digital/CONTRATO-PHI.md` | os invariantes **M1–M12** e a matriz de dono por tabela |
| 3 | o ADR desta etapa, **inteiro** | não só a parte citada aqui |

🔴 **Três coisas que esta casa exige e que não são padrão em lugar nenhum:**

1. **No n8n, o que roda é `activeVersion.nodes`** — `nodes` é o rascunho. Antes de afirmar o que um
   workflow faz, compare `versionId` com `activeVersionId`.
2. **Zero nunca é ausência.** `COUNT(x IS NOT NULL)` prova que a coluna foi escrita, **não que algo
   foi medido**. Olhe valor, distribuição e mín/máx.
3. **Um `SELECT` agregado sempre devolve uma linha** — *"não achei"* e *"achei zero"* saem idênticos.
   **Traga a contagem do que casou, ao lado.**

### E o portão que vale para qualquer executor

- 🔴 **Ferramentas:** esta etapa precisa de acesso ao **n8n** e, por ele, ao **BigQuery**. **Confirme
  que você tem antes de começar** — se não tiver, diga logo, em vez de improvisar outro caminho.
- 🔴 **Quem revisa não é quem executou** (R9). **Traga os números e a sua leitura em blocos
  separados.** O chat-mãe revisa a leitura; os números são seus.
- **Precedente da casa:** em 28/06 o Codex entregou a idempotência do MERGE e a **pré-revisão
  encontrou um dedup que perdia `PARTITION`/`CLUSTER`.** O trabalho estava certo e a revisão pegou o
  que faltava — **é assim que funciona aqui, e não é desconfiança.**
