# BASE-00 — A PORTA. Quem é dono de qual fato, e como saber se um documento vale

| | |
|---|---|
| **O que este documento é** | 🔴 **a porta da memória compartilhada.** Se você não sabe onde procurar, **comece aqui** |
| **Escrito em** | 2026-10-03 |
| **Verificado em** | 2026-10-03, pelo chat-mãe, **contra a árvore do repositório e os artefatos citados**. 🟢 **Atualizado em 2026-10-03 pelo sub-chat da Fase 1:** a §4 saiu de ⬜ para ✅ nos documentos 01/03/04, e `R1–R13` virou `R1–R15` (a R14 e a R15 nasceram na Fase 0) |
| **Dono de qual fato** | **quem é dono de cada fato** · as três regras da memória · onde se procura o quê |
| **Aprovado por** | Olavo, 2026-10-03 (`PLANO-MEMORIA-COMPARTILHADA.md`) |

---

## 1. As três regras. Elas são a memória — o resto é arquivo

### 1.1. 🔴 Um fato tem UM dono. Quem não é dono **liga**, não repete

**Repetir um fato cria a segunda cópia, e a segunda cópia divergir é questão de tempo.** Em uma semana
isto nos custou quatro vezes (ver `BASE-04-INCIDENTES`).

| O fato | Dono |
|---|---|
| 🔴 **o que um artefato faz AGORA** | **o próprio artefato.** Ele vence todo documento (**R13**) |
| quem **escreve** e quem **lê** cada tabela | `strategic-planning/saude-digital/CONTRATO-PHI.md` |
| **estado por frente** | `strategic-planning/ESTADO-DO-PROJETO.md` **§0 PAINEL** |
| **uma decisão**, sua data e seu porquê | o **ADR** dela (`saude-digital/adr-rascunhos/`, `saude-digital-do-negocio/adr-rascunhos/`) |
| **tarefa, estado e quem destrava** | **Notion — `PHI - Gestão de Projetos`** (`774518d2128a4b10aede511718737058`) |
| **o que existe e onde achar** | `strategic-planning/MAPA-DE-DOCUMENTACAO.md` |
| **onde o PHI vive, e se está no ar** | `BASE-02-SUPERFICIES.md` |
| **por que o PHI existe** e o que ele não é | `BASE-01-PRINCIPIOS.md` |
| **as regras de trabalho** (R1–R15) | `CLAUDE.md` (raiz) |
| **as histórias** que justificam as regras | `BASE-04-INCIDENTES.md` |
| **quanto falta para acabar** | `strategic-planning/DEFINICAO-DE-PRONTO-PHI-V1.md` |
| **procedimento da agência** (quem faz o quê) | **Miro — `Board Agência`** ⚠️ **não a `Cópia`** |
| **execução de sub-chat** (o que foi feito, quando) | **Notion — `PHI — Registro de Execuções (Sub-chats)`** |
| **a história de um artefato** (por que existe, o que substituiu) | `docs/base/fichas/<artefato>.md` + a **descrição do próprio artefato** (**R5**) |

> **Teste prático:** *este documento está afirmando um fato de que ele não é dono?* Então **ele deveria
> estar linkando.** Apague a afirmação e ponha o link.

### 1.2. 🔴 `escrito em` **não é** `verificado em`

**Todo documento canônico carrega, no cabeçalho:**

```
Verificado em <data>, por <quem>, contra <qual artefato>
```

| | |
|---|---|
| `escrito em` | quando o texto nasceu. **Não diz nada sobre hoje** |
| 🔴 `verificado em` | **quando alguém abriu o artefato e confirmou** |

> 🔴 **A regra:** *documento cuja verificação é mais antiga que o fato que ele afirma **não serve de
> premissa — serve de hipótese.*** Quem quiser usá-lo como base, **verifica primeiro e atualiza o
> carimbo.**
>
> **Por que isto existe:** hoje **um documento velho tem a mesma cara de um documento novo**, e foi
> assim que esta casa decidiu errado quatro vezes numa semana. **O carimbo torna o envelhecimento
> visível.**
>
> **Teste prático:** *quando foi a última vez que alguém abriu o artefato de que este doc fala?* Se a
> resposta não está no cabeçalho, **não é premissa.**

### 1.3. 🔴 Prova de concluído

**Nada vira "concluído" sem prova anexada.**

| Vale como prova | Não vale |
|---|---|
| execução com número (`exec 44510`, `SELECT` = 6 → 0) | *"rodou"* |
| resposta HTTP capturada e colada | *"testei"* |
| `versionId` publicado + releitura | *"não deu erro"* |
| teste que falha se o defeito voltar | *"está funcionando"* |

> **Motivo, 02/10:** o `CHECKLIST-webview` marcou o **W5 concluído** com um gráfico que **não existe**.
> *"Concluído" sem prova é "acreditamos que foi concluído"* — **e as duas coisas se escrevem diferente.**

---

## 2. Onde procurar, por pergunta

| A pergunta | Onde |
|---|---|
| *onde o projeto está?* | `ESTADO-DO-PROJETO.md` **§0** |
| *o que falta para acabar?* | `DEFINICAO-DE-PRONTO-PHI-V1.md` |
| *o que está esperando o Olavo?* | **Notion**, vista *"Quem destrava = Olavo"* |
| *quem escreve nesta tabela?* | `CONTRATO-PHI.md` |
| *por que este workflow existe?* | a **ficha** dele, e a **descrição** no n8n |
| *esta integração está no ar?* | 🔴 **`BASE-02-SUPERFICIES.md`** — e se o carimbo estiver velho, **meça** |
| *já decidimos isso?* | o **ADR**. ⚠️ **ADR em RASCUNHO é decisão pendente, e a idade dele é o tamanho do risco** |
| *já tentamos isso e deu errado?* | `BASE-04-INCIDENTES.md` |
| *por que a regra X existe?* | `CLAUDE.md` → link para o incidente |
| *achar qualquer documento* | `MAPA-DE-DOCUMENTACAO.md` |

---

## 3. 🔴 O teto desta pasta, e por que ele existe

**`docs/base/` tem no máximo 6 documentos + a pasta `fichas/`.**

**Medido em 2026-10-03:** `docs/handoff/` tem **173 arquivos**; `docs/conhecimento/` tem **69 sem
índice**. **A doença de pilha-não-indexada já está instalada nesta casa.** Esta pasta existe para
curá-la — **não para virar a terceira.**

| Regra | |
|---|---|
| **teto** | 6 documentos. Precisa de um sétimo? **Então um dos seis está com escopo errado** |
| **fichas** | 🔴 **não se escrevem em lote.** Uma ficha nasce **quando o artefato é tocado** (é a **R5**) |
| **nada de "diversos"** | documento sem dono de fato declarado **não entra** |

---

## 4. Os seis documentos

| # | | Estado |
|---|---|---|
| **00** | **`BASE-00-PORTA.md`** — este | ✅ |
| **01** | `BASE-01-PRINCIPIOS.md` — por que o PHI existe | ✅ **2026-10-03, Fase 1** |
| **02** | `BASE-02-SUPERFICIES.md` — onde o PHI vive | ✅ |
| **03** | `BASE-03-INVARIANTES.md` — **índice** dos invariantes (não cópia) | ✅ **2026-10-03, Fase 1** |
| **04** | `BASE-04-INCIDENTES.md` — as histórias | ✅ **2026-10-03, Fase 1** — ordenadas por **frequência da doença** |
| **05** | `BASE-05-HANDOFF-CHAT-MAE.md` | ⬜ Fase 3 |

> 🟢 **2026-10-03 — a Fase 1 fechou, e a `fichas/` nasceu.** `docs/base/fichas/` tem as **7 sementes**
> + um `README.md` que explica a regra do campo *“por que existe”*. **A partir daqui, ficha nasce
> quando o artefato é tocado** (**R5**) — ⛔ **nunca em lote**.
>
> ⚠️ **E um aviso de teto, medido:** esta pasta tem hoje **5 `BASE-*` + o `PLANO-MEMORIA-COMPARTILHADA`
> = 6 documentos.** O **`BASE-05`** da Fase 3 fará **7**, e **o teto estoura**. Decisão a tomar quando
> a Fase 3 fechar: **o `PLANO` sai de `docs/base/`** (o plano cumprido é histórico, e o histórico tem
> outro lugar), ou o teto sobe de propósito.
>
> 🟢 **DECIDIDO pelo chat-mãe em 2026-10-03: o `PLANO` sai**, para `docs/handoff/`, com banner de
> **HISTÓRICO** (**R2** regra 3). **O teto NÃO sobe** — ele existe para doer, e teto que cede na
> primeira pressão não é teto. **Plano cumprido é história, e história tem outro lugar.**

> ⚠️ **O `BASE-03` é ÍNDICE, não cópia.** Os invariantes moram onde já moram — **M1–M12** no
> `CONTRATO-PHI.md`, **R1–R15** no `CLAUDE.md`, **I1–I11** na Prospecção. **O 03 aponta; não repete.**
> É a regra 1.1 aplicada à própria pasta.
