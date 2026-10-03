# Relatório — Fase 1 da Memória Compartilhada

| | |
|---|---|
| **Brief executado** | `docs/handoff/2026-10-03-fase-1-memoria-compartilhada-subchat-brief.md` |
| **Branch** | `claude/consolidacao-2026-08` · `https://github.com/olavofranzin/phi/tree/claude/consolidacao-2026-08` |
| **Commit base medido** | `d543f16` |
| **Camada** | forte (**R10**), sessão dedicada |
| **Verificado em** | 2026-10-03, pelo **sub-chat da Fase 1**, **contra** o `CLAUDE.md` do commit base, os documentos de destino, `git ls-remote` e os ADRs citados |
| **Voltas usadas** | 1 de 3 |

---

## 0. 🔴 A primeira coisa que aconteceu foi a R15 funcionar

**A branch do brief (`claude/consolidacao-2026-08`) divergia da branch da instrução da minha sessão
(`claude/focused-newton-rioas7`).** Pela **R15** eu **parei antes do primeiro commit e avisei** — não
escolhi sozinho, não commitei *“provisoriamente”*.

**E a medição mostrou que a divergência não era empate:**

| O que o brief pressupõe | Em `consolidacao-2026-08` | Em `focused-newton-rioas7` |
|---|---|---|
| `docs/base/` (Fase 0) | ✅ existe | ❌ **não existe** |
| a **R15** no `CLAUDE.md` | ✅ existe | ❌ **não existe** |
| o `CLAUDE.md` de ~634 linhas | ✅ 634 | ❌ **170** |
| existe no remoto? | ✅ `d543f16` | ❌ **não existe** — e é idêntica à `main` |

**O Olavo decidiu pela `consolidacao-2026-08`, e só então houve commit.**

> 🔴 **É a terceira ocorrência da doença de branch nesta casa, e a primeira que não custou nada.** A
> diferença entre esta e as de 26/09 e 29/09 **não foi mais destaque no texto do brief: foi uma trava
> que exige reconciliar antes de existir commit.** A R15 pagou-se na primeira vez que foi exercida.

---

## 1. Os 12 critérios do §6

| # | Critério | Veredito | Prova |
|---|---|---|---|
| **CA1** | todo doc novo tem `verificado em <data> por <quem> contra <o quê>` | ✅ | cabeçalho de `BASE-01`, `BASE-03`, `BASE-04`, das 7 fichas, dos 3 `CLAUDE.md` de frente, do `REGRAS-CRITICAS` e do `rtk.md` |
| **CA2** | nenhum doc novo **repete** fato de que não é dono — **liga** | ✅ | provado por script: cada bloco movido **não ficou na raiz**. `BASE-03` é índice; `BASE-01` §5 linka ADR em vez de copiar decisão |
| **CA3** | 🔴 **nenhuma história perdida** | ✅ | **18 blocos byte-idênticos** no `BASE-04`, conferidos por `provar.py`. Contagem colada no §3 |
| **CA4** | 🔴 **nenhuma regra alterada** — nem palavra, nem número | ✅ | **14 segmentos de regra byte-idênticos, cobrindo 276 das 428 linhas** da região de regras. As outras 152 são as histórias que saíram |
| **CA5** | os 4 números do `CLAUDE.md` | ✅ | **634 → 371 linhas** · **38.570 → 25.766 bytes** |
| **CA6** | `BASE-03` é índice, com a coluna *“já foi violado?”* | ✅ | **39 invariantes mapeados, zero copiados**, coluna preenchida nos 39 |
| **CA7** | as **7 fichas** existem, com os 7 campos | ✅ | `docs/base/fichas/` — 7 + `README.md` |
| **CA8** | 🔴 **o *“por que existe”* não foi inventado** | ✅ | **4 com fonte citada** (ADR-23, ADR-28, ADR-39, + R5), **3 com `⬜ a perguntar`**. Lista no §5 |
| **CA9** | `BASE-04` ordenado por **frequência da doença** | ✅ | placar no topo do `BASE-04`: 12 doenças, de 7 ocorrências a 1 |
| **CA10** | `docs/base/` com no máximo 6 documentos + `fichas/` | ✅ **hoje** | 5 `BASE-*` + o `PLANO` = **6**. ⚠️ **o `BASE-05` da Fase 3 fará 7 — o teto estoura.** Avisado, não resolvido sozinho |
| **CA11** | linha no Registro de Execuções (**R3**) | 🟡 **parcial, e declarado** | **a linha de encerramento existe** (Notion `3eeb65e5-c72b-81ab-8021-c9b347fe8efc`). 🔴 **A de abertura NÃO existe** — ver §6.1 |
| **CA12** | devolveu o que não conseguiu confirmar e onde o brief errou | ✅ | §5 e §7 |

## 1.1. Os 7 critérios adicionais do §9.6 e do §10

| # | Critério | Veredito | Prova |
|---|---|---|---|
| **CA13** | `CLAUDE.md` em ~150–180 linhas, e nenhuma regra fora da raiz | 🔴 **METADE NÃO.** Ver §4 | **371 linhas**, não 180. ✅ **As 15 regras continuam na raiz** — conferido por script, cabeçalho por cabeçalho |
| **CA14** | a contradição da branch foi consertada | ✅ | a branch obsoleta **saiu da raiz** (script falha se voltar); o fato corrigido está em `BASE-02` §3.2 |
| **CA15** | lista das 32 branches, nenhuma apagada | ✅ | §2. **Nenhuma branch foi apagada, renomeada ou tocada** |
| **CA16** | zero fato duplicado: Stack, ids do Notion e Docs do Notion saíram da raiz | ✅ **saíram** | ⚠️ **mas dois deles NÃO podiam ser apagados como o brief mandava** — ver §7 |
| **CA17** | todo `CLAUDE.md` de frente tem o cabeçalho do §9.5, com link de volta | ✅ | 5 frentes: `otimizacao-campanhas` e `webview` e `saude-digital-do-negocio` (novos) + `saude-digital` e `prospeccao` (atualizados) |
| **CA18** | nada se perdeu: todo fato que saiu da raiz existe no destino | ✅ | **10 blocos de fato** conferidos por script |
| **CA19** | a R15 está na raiz e a exigência de branch não ficou duplicada entre R1 e R15 | ✅ | script confere as duas sentinelas na R15 **e** a ausência da duplicata na R1 |

---

## 2. CA15 — as 32 branches, com data do último commit

🔴 **Nenhuma foi apagada. Só listadas.** Medido em 2026-10-03 com `git ls-remote --heads origin`.

| # | Último commit | Idade | Branch | À frente da `main` | Atrás da branch de trabalho | Autor | Último assunto |
|---|---|---|---|---|---|---|---|
| 1 | 2026-10-03 | 0 d | `claude/consolidacao-2026-08` 🟢 **a de trabalho** | 744 | 0 | Claude | O brief da Fase 1 nao cumpria a propria R15; consertado, e a camada de |
| 2 | 2026-09-29 | 4 d | `claude/plano-projeto-notion-v20z3g` | 2 | 744 | Claude | Plano de projeto: as-built no Notion (3 propriedades, 92 linhas, recon |
| 3 | 2026-09-26 | 7 d | `claude/exciting-bardeen-ozheq6` | 679 | 68 | Claude | F3: o dado do CLI-13 e de teste, vira excecao declarada e listada |
| 4 | 2026-09-23 | 10 d | `claude/webview-metricas-clientes-lxps0l` | 28 | 744 | olavofranzin | Update title and description to lowercase |
| 5 | 2026-09-22 | 11 d | `claude/parque-phi-contract-interview-ag70e4` | 631 | 113 | Claude | Conferencia da PARADA: as 3 passaram, e o passo B2 perdeu a base |
| 6 | 2026-09-11 | 22 d | `claude/affectionate-davinci-Ey2oV` | 464 | 316 | Claude | docs(prospeccao): tabela de propriedade das colunas com frequencia |
| 7 | 2026-08-27 | 37 d | `claude/agentic-agency-planning-KwJEw` | 283 | 480 | Claude | docs: brief do sub-chat de simplificacao da escrita de dados + correco |
| 8 | 2026-08-25 | 39 d | `main` 🔵 `main` | 0 | 744 | olavofranzin | Enhance verification process in CLAUDE.md |
| 9 | 2026-08-25 | 39 d | `claude/consolidacao-2026-08-kwknbk` | 0 | 744 | olavofranzin | Enhance verification process in CLAUDE.md |
| 10 | 2026-08-23 | 41 d | `claude/hubspot-gbp-card-retomada-zz2ars` | 398 | 352 | Claude | docs(comercial): guia de execucao usa o caminho Windows real (C:\Users |
| 11 | 2026-08-22 | 42 d | `claude/hubspot-gbp-card-finalizacao-annaxt` | 394 | 352 | Claude | docs(handoff): ponto de retomada p/ sessao nova (rede liberada + card  |
| 12 | 2026-08-01 | 63 d | `claude/paid-media-planning-frameworks-fofu96` | 2 | 742 | Claude | Consolida os dois documentos do deep research de midia paga em um arqu |
| 13 | 2026-07-23 | 72 d | `claude/fix-daily-entry-workflow-dC96Q` | 17 | 739 | Claude | docs: reinclui caminho Meta Ads no brief (religado pelo usuário) |
| 14 | 2026-07-21 | 74 d | `memory` | 1 | 745 | olavofranzin | Add files via upload |
| 15 | 2026-07-21 | 74 d | `claude/claude-md-access-2k7znf` | 1 | 745 | Claude | Atualizar CLAUDE.md para v1.5 |
| 16 | 2026-07-18 | 77 d | `claude/campaign-analysis-framework-l3-u67ugn` | 187 | 569 | Claude | docs(L3.0): brief Codex — fixa modelo Sonnet e instrui rodar /goal |
| 17 | 2026-07-12 | 83 d | `claude/gbp-scoring-motor-n8n-0zri0i` | 225 | 531 | Claude | docs(comercial): patch do sync (probabilidade/acerto_previsao/dias_no_ |
| 18 | 2026-07-06 | 89 d | `claude/n8n-workflow-review-skill-sp5mrq` | 4 | 744 | Claude | fix: reconcilia splitInBatches, generaliza skill e ajusta guia de secr |
| 19 | 2026-07-04 | 91 d | `claude/saude-digital-phi-midia-score-0ko12c` | 13 | 736 | Claude | docs: Pipeline_v2 v1.2 PUBLICADO (activeVersionId 9a174e50) + checklis |
| 20 | 2026-06-19 | 106 d | `claude/wonderful-hawking-Q6VLQ` | 10 | 746 | Claude | Resolve T28 adapter TODOs: business context, Meta id maps, GA4 norm |
| 21 | 2026-06-16 | 109 d | `fix/bugs-daily-entry-e-pipeline` | 6 | 750 | Claude | docs: adiciona prompt Codex para análise do sw metricas campanhas |
| 22 | 2026-06-16 | 109 d | `claude/tender-gates-2euo90` | 0 | 749 | Claude | docs: README como guia de colocacao de arquivos por pasta |
| 23 | 2026-06-15 | 110 d | `feat/planejamento-estrategico-e-onboarding` | 106 | 650 | Claude | ESTADO v0.1.29 + brief a04 v2 (refactor HTTP Notion -> Notion native) |
| 24 | 2026-06-07 | 118 d | `feat/docs-pesquisa-e-scripts` | 6 | 750 | Claude | Add Module 28 spec: Cognitive Campaign Analysis agent team |
| 25 | 2026-06-05 | 120 d | `feat/workflow-setup-projeto-l1` | 2 | 754 | Claude | Update L1 setup workflow export with production-ready fixes |
| 26 | 2026-06-05 | 120 d | `feat/workflow-comercial-hubspot` | 2 | 754 | Claude | antigravity: brief bugfix telemetria para Codex (BUG-1 digest silencia |
| 27 | 2026-06-05 | 120 d | `claude/lucid-tesla-ZWcbr` | 2 | 754 | Claude | Update L1 setup workflow export with production-ready fixes |
| 28 | 2026-04-26 | 160 d | `claude/review-technical-docs` | 0 | 756 | Claude | Add WPP Intake Part 3 and test data |
| 29 | 2026-04-14 | 172 d | `feat/claude-md-e-google-ads-insights` | 10 | 751 | Claude | feat: Google Ads Insights Semanal — workflow n8n + spec Notion + CLAUD |
| 30 | 2026-04-14 | 172 d | `claude/create-phi-folder-n2RXF` | 10 | 751 | Claude | feat: Google Ads Insights Semanal — workflow n8n + spec Notion + CLAUD |
| 31 | 2026-04-09 | 177 d | `feat/biblioteca-de-skills-agentes` | 11 | 765 | Claude | Add n8n-node-configuration skill from czlonkowski/n8n-skills |
| 32 | 2026-04-09 | 177 d | `claude/add-find-skills-lDj2v` | 11 | 765 | Claude | Add n8n-node-configuration skill from czlonkowski/n8n-skills |

### 🔴 O que a tabela mostra, e é material de decisão (não apaguei nada)

| O que medi | Número |
|---|---|
| branches no remoto | **32** |
| **paradas há mais de 90 dias** | **14** |
| **pares com o MESMO último commit** (gêmeos acidentais) | **4 pares** |
| branches **à frente da `main`** | **28** de 32 — a `main` está **744 commits atrás** da branch de trabalho |

**Os 4 pares de gêmeos — mesma data, mesmo assunto, nomes diferentes:**

| Par | Último commit |
|---|---|
| `main` **=** `claude/consolidacao-2026-08-kwknbk` | 2026-08-25 |
| `feat/workflow-setup-projeto-l1` **=** `claude/lucid-tesla-ZWcbr` | 2026-06-05 |
| `feat/claude-md-e-google-ads-insights` **=** `claude/create-phi-folder-n2RXF` | 2026-04-14 |
| `feat/biblioteca-de-skills-agentes` **=** `claude/add-find-skills-lDj2v` | 2026-04-09 |

> 🔴 **Duas coisas que valem a sua atenção, Olavo:**
>
> **1.** O `claude/consolidacao-2026-08-kwknbk` é um **gêmeo da `main`**, com um nome que parece ser a
> branch de trabalho. **Qualquer sessão que leia o nome depressa commita no lugar errado** — é a
> doença de branch com uma armadilha nova.
>
> **2.** O `claude/create-phi-folder-n2RXF` — **a branch que o `CLAUDE.md` declarava como “de
> desenvolvimento”** — teve o último commit em **14/04/2026**, há **172 dias**, e é gêmea de uma
> `feat/*`. **Era essa a branch que toda sessão lia no início.**

---

## 3. CA3 — a prova automática de não-perda, colada

**Comando:** `python3 scripts/fase1-memoria/provar.py` · **Resultado: APROVADA.**

```
PROVA MECANICA — Fase 1 da memoria compartilhada do PHI
commit base: d543f1662709965003e5b89867b78ef16b744e89
CLAUDE.md original: 634 linhas, 38570 bytes
CLAUDE.md novo:     371 linhas, 25766 bytes

CA3  — 18 blocos de historia conferidos, byte-identicos no BASE-04      OK
CA2  — 18 blocos nao ficaram duplicados na raiz                        OK
CA18 — 10 blocos de fato nos destinos (byte-identicos)                 OK
CA4  — 14 segmentos de regra intactos, cobrindo 276 das 428 linhas     OK
CA13 — os 15 cabecalhos R1..R15 presentes na raiz                      OK
CA14 — a branch obsoleta saiu da raiz                                  OK
CA19 — a exigencia de branch viva na R15, sem duplicata na R1          OK

OS 4 NUMEROS
  linhas: 634 -> 371   (-263, 41.5% menor)
  bytes:  38570 -> 25766   (-12804, 33.2% menor)

PROVA APROVADA — nenhuma historia perdida, nenhum fato perdido, nenhuma regra alterada
```

### 🔴 Por que esta prova vale, e não é teatro

| Como ela é construída | Por que isso importa |
|---|---|
| o `BASE-04` **não foi digitado** | `gerar-base04.py` **recorta** cada história do `CLAUDE.md` do commit base e cola verbatim. **A identidade byte é garantida por construção** |
| o `CLAUDE.md` novo **não foi digitado** | `gerar-claude-md.py` **recorta** a região de regras linha por linha, pulando só os intervalos declarados. 🔴 **Nenhuma palavra de regra passou pela minha digitação** |
| a cobertura de regra é **por diferença** | a prova não checa uma lista que eu escolhi: ela toma **a região de regras inteira menos o que saiu**, e exige que **todo o resto** esteja presente. **Não há como eu “esquecer” de checar um pedaço** |
| a prova **já falhou uma vez, e pegou um erro meu** | eu havia deixado o nome da branch obsoleta no rodapé do `CLAUDE.md` novo. **A prova reprovou e eu consertei.** Se ela nunca falhasse, não estaria medindo nada |

---

## 4. 🔴 CA13 — a meta de 150–180 linhas NÃO foi atingida. O número e o motivo

| | |
|---|---|
| **pedido no §9.1** | **150–180** linhas |
| **pedido no §3 do mesmo brief** | **~300** linhas |
| **entregue** | **371** linhas |

**A medição que explica:** a região de regras do arquivo original tem **428 linhas**. Dessas, **152
eram história** (e saíram) e **276 são texto imperativo** — que, somadas ao cabeçalho das 15 regras e
aos ponteiros, dão **~320 linhas só de regra**.

> 🔴 **Chegar a 180 linhas exigiria apagar texto de regra.** É a linha que o próprio brief diz não se
> cruzar (*“⛔ NÃO se tocam: o texto das regras, a numeração, o imperativo. Nem uma palavra”*), e é o
> que o §3 manda fazer quando não dá: *“se não der sem apagar história, PARE e devolva — o teto não
> vale mais que a memória”*. **Parei na meta e devolvi.**

**O que FOI atingido, e era o objetivo real:** a raiz não tem mais **nenhum fato de que não é dona**.
O que sobrou é **regra e ponteiro**.

> ⚖️ **A decisão que sobra é sua, e é sobre as REGRAS, não sobre a história.** Se 180 linhas é
> requisito real, o caminho é **encurtar o texto de regras** (as R6, R11, R12 e R13 têm corolários e
> emendas longos) — e isso **é reescrever a constituição**, que exige você, não um sub-chat.

---

## 5. 🔴 O entregável que mais vale: as perguntas para o Olavo

**11 perguntas. Nenhuma foi respondida por dedução.** Onde não achei, está `⬜ a perguntar`.

### 5.1. As que decidem alguma coisa agora

| # | ⬜ A pergunta | Por que importa | Onde |
|---|---|---|---|
| **1** | 🔴 **Onde mora o código do webview que está NO AR?** O `CHECKLIST` diz `server/notion.js` **na raiz**, e **não existe `server/` na raiz de nenhuma branch** deste repo (medido em 3 branches) | é a `R13` no nível do repositório. Enquanto valer, **o rollback citado pode não ser acionável daqui**, e **nenhuma revisão de código do webview é revisão do que está em produção** | ficha `webview-server` |
| **2** | 🔴 **Por que o `PHI - Pipeline_v2` existe, e o que era o `v1`?** | é **o coração do produto** e **o único dos 7 artefatos sem NENHUMA fonte de porquê**. O nome diz `_v2`; eu me recusei a transformar o nome em resposta | ficha `phi-pipeline-v2` |
| **3** | **O `F2` fechou?** É o gatilho declarado da volta do T28 (ADR-28) | o T28 está ⏸️ parado **de propósito**, esperando isso | ficha `wf-t28-analise-campaign` |
| **4** | **O motor multi-métrica:** o gatilho era *“o primeiro cliente não-CPA”* — **e o `CLI-13` já é CPL e já é real.** O gatilho já aconteceu? | hoje esse cliente **entra e sai sem nota**, e o vigia acusa todo dia | `BASE-01` §7 |
| **5** | **Das 32 branches, quais estão vivas?** 14 estão paradas há mais de 90 dias, e há **4 pares de gêmeos** | **não apaguei nenhuma.** É decisão sua | §2 |
| **6** | **O teto de `docs/base/`:** o `BASE-05` da Fase 3 fará 7 documentos. **O `PLANO` sai da pasta, ou o teto sobe?** | não resolvi sozinho | `BASE-00` §3 |

### 5.2. As de porquê — o conhecimento que só está na sua cabeça

| # | ⬜ A pergunta | Onde |
|---|---|---|
| **7** | **Por que o `Daily Entry` foi substituído** pelo `sw metricas campanhas`? O **fato** da substituição está escrito; **o motivo não está em lugar nenhum** | ficha `sw-metricas-campanhas` |
| **8** | **Por que o `sw metricas campanhas` roda 2×/dia** (gatilho próprio 00h **e** chamado 04h)? Está com `❓` no `panorama` desde que foi escrito | idem |
| **9** | **O `operador unico metricas` foi feito para ser o alarme, ou virou o alarme por acidente?** Hoje é **o único detector de falha que chega a um humano** | ficha `operador-unico-metricas` |
| **10** | **Por que a arquitetura do webview saiu do Supabase para Node/EasyPanel?** Há indício (um commit *“Removed supabase…”*), **e indício não é fonte** | ficha `webview-server` |
| **11** | **Os `sw metricas conjuntos` / `anúncios` ficam ou saem?** O Agregador *“pode torná-los redundantes”* há meses, sem decisão — e o Olavo mostrou em 20/09 que **o nível do conjunto é onde metade das causas vive** | ficha `agregador-metricas-multi-fonte` |

### 5.3. 🔴 O que a procura pelo *“por que existe”* revelou, e é um achado por si

**O brief mandava procurar em três lugares. Medi os três:**

| Lugar | O que achei |
|---|---|
| **a descrição do artefato no n8n** | 🔴 **vazia.** Nos dois snapshots em git, `description` é **`null`**, e `settings.description` também |
| **sticky notes** (o substituto informal) | 🔴 **pior que vazio no Agregador:** 4 notas em **inglês genérico de template** (*“Step 1: Trigger & Report Type Detection… weekly or monthly”*) que **descrevem outro workflow** — a **R5** na peça central do T28 |
| **o ADR** | 🟢 **a única fonte que funcionou.** 4 dos 7 porquês saíram de ADR |
| **o `ESTADO` / `panorama`** | 🟡 dão **o que faz**, quase nunca **por que existe** — e o `panorama` **está vencido** em pelo menos um ponto |

> 🔴 **A `R5` está quebrada no parque, e agora com número: das 7 fichas, a descrição do artefato
> ajudou em ZERO.** A única exceção boa é o `WF-T28-Analise-Campaign`, cuja descrição **foi lida de
> volta e conferida em 27/09** — e é por isso que ele é o único cujo *“parado”* tem motivo e gatilho
> escritos, em vez de ser *“parado por esquecimento”*.

---

## 6. O que eu NÃO consegui confirmar, e não preenchi

| # | ⬜ | Por quê |
|---|---|---|
| **1** | **que as 14 regras críticas estejam certas hoje** | esta fase não abriu n8n/BigQuery/Google Ads (§7/§11 do brief). O recorte é fiel à raiz; **a raiz é hipótese até alguém medir** |
| **2** | **que as 7 tabelas do `phi_prod` sejam as de hoje** | idem |
| **3** | **que cada id de Notion abra a DB que o nome diz** | o recorte é fiel à raiz; **a raiz nunca foi conferida contra o Notion** |
| **4** | **o ADR-003** | o documento-fonte está no Notion e **eu não o abri**. Tudo que afirmo dele vem de **citações em outros documentos** — e ele é a decisão-mãe mais citada da casa |
| **5** | **a atribuição do `es`/`rs`/`os` ao ADR-004** | confirmei que **são placeholders** (`MAPA` + `ESTADO`); **não achei o ADR-004 declarando isso**. O fato está confirmado; **a fonte dele, não** |
| **6** | **o custo em horas** da maioria dos incidentes | o texto de origem quase nunca o declarou. Onde não está, escrevi *“não declarado no texto de origem”* — **não estimei** |

### 6.1. 🔴 Onde eu próprio descumpri o brief, e declaro

**CA11 — a linha de abertura no Registro de Execuções não existe.** O brief pedia **uma no começo e
uma no fim**. Eu criei **só a de encerramento**.

**O motivo:** a sessão começou **parada pela R15** (branch divergente), e eu tratei *“não commitar”*
como *“não registrar”*. **Foram decisões diferentes e eu as misturei** — a R3 existe para o digest
diário saber que há trabalho em curso, e um sub-chat parado esperando decisão **é exatamente a
informação que o Olavo precisaria ter às 08:30.**

> **Não é grave e não escondo:** o digest de hoje vai mostrar a linha de encerramento. **Mas é a R3
> quebrada por mim, no mesmo dia em que escrevi um documento sobre ela.**

---

## 7. 🔴 Onde este brief errou — medido, não opinado

**O brief pediu isto explicitamente (§8.5), e aqui está.**

| # | O que o brief afirmava | O que a medição mostrou | Consequência |
|---|---|---|---|
| **1** | 🔴 §9.1: **apagar** os ids do Notion da raiz, *“o `BASE-02-SUPERFICIES` já é dono”* | **o `BASE-02` NÃO era dono.** A §3 dele escrevia *“ver `CLAUDE.md`”* — **apontava de volta para a raiz** | **obedecer teria perdido 6 ids.** Mudei de *apagar* para **mover**, e registrei a correção no manifesto e no destino |
| **2** | 🔴 §9.1: **apagar** a Documentação do Notion, *“o `MAPA` já é dono”* | **o `MAPA` tinha 3 dos 7 ids** | **obedecer teria perdido 4 ids.** Mudei para **mover** |
| **3** | §0 e §3: o `CLAUDE.md` tem **604 linhas**; §9.1 diz **605**; §11 diz **634** | **634** (medido). O §11 estava certo; os outros dois nasceram antes dos commits da R14/R15 | muda a base do corte: era 634, não 605 |
| **4** | §9.1: meta de **150–180 linhas**; §3 do mesmo brief: **~300** | **o brief se contradiz consigo mesmo**, e **nenhuma das duas é alcançável** sem apagar regra (§4 acima) | parei na meta e devolvi |
| **5** | §5: *“procure o porquê na **descrição do artefato no n8n**”* | ⚠️ **o §11 do mesmo brief proíbe tocar no n8n.** E, quando fui aos snapshots em git, **as descrições estão vazias** | resolvi pelos snapshots e pelos ADRs, e **declarei o que não deu** |
| **6** | §2: *“os **7 casos** da R11”* | ✅ **o brief está certo: a tabela tem 7 linhas.** 🔴 **Mas o texto da própria R11 diz *“já nos custou caro **cinco** vezes”*** | **é uma incoerência dentro de uma regra.** ⛔ **Não corrigi** — `CA4` proíbe mudar o texto da regra, **nem um número.** Fica registrado para você decidir |
| **7** | §9.3: *“a branch declarada **EXISTE** no remoto”* | ✅ verdade — **mas o último commit dela é de 14/04/2026**, há 172 dias, e ela é **gêmea de uma `feat/*`** | *“existe”* era verdade e **insuficiente**: o risco não era a branch não existir, era ela estar morta |

### 7.1. ⚠️ E três achados que eu NÃO consertei, de propósito

**Esta fase não toca em artefato nem em doc de outra frente sem pedido (§7).** Mas quem abrir esses
documentos precisa saber:

| # | O documento | O que ele afirma | O que é |
|---|---|---|---|
| **1** | `saude-digital/panorama-workflows-phi.md` linha 73 | *“`client_config` → **`phi_dev`** · 🔴 ambiente errado — cliente novo some sem erro”* | 🔴 **VENCIDO.** A Fase B do ADR-39 consertou em **28/09** (DROP `44093`). O `CONTRATO-PHI` linha 137 está atual |
| **2** | `webview/CHECKLIST-webview.md` | `W5` **concluído**, com *“tendência real (gráfico Evolução do Score)”* | 🔴 **VENCIDO.** O gráfico **deixou de existir**, e em 02/10 religá-lo virou **tarefa de construção** |
| **3** | as 4 sticky notes do `Agregador` | *“Step 1: Trigger & Report Type Detection… weekly or monthly”* | 🔴 **descrevem outro workflow.** É a **R5** — e é **pior que nota vazia, porque tem cara de documentação** |

> 🔴 **Os três são a mesma doença — a nº 2 do `BASE-04`** (*“o documento mente, e o cabeçalho mente
> primeiro”*) — **acontecendo agora, enquanto eu escrevia o documento que a cataloga.** Isso não é
> ironia: é a medida de quão viva ela está.

---

## 8. O que nasceu, e onde está

| Arquivo | O que é |
|---|---|
| `docs/base/BASE-01-PRINCIPIOS.md` | **o propósito**, o que o PHI não é (verbatim do Olavo), as decisões-mãe, os guardrails, **a fronteira do produto hoje** |
| `docs/base/BASE-03-INVARIANTES.md` | **índice** de 39 invariantes + a coluna *“já foi violado? quando?”* |
| `docs/base/BASE-04-INCIDENTES.md` | **12 doenças, 19 incidentes**, ordenados por **frequência**, com o texto original byte-idêntico |
| `docs/base/fichas/` | **7 fichas + README** com a regra do *“por que existe”* |
| `CLAUDE.md` (raiz) | **só regra e ponteiro.** 634 → 371 linhas |
| `otimizacao-campanhas/CLAUDE.md` · `webview/CLAUDE.md` · `saude-digital-do-negocio/CLAUDE.md` | 3 frentes novas, com o cabeçalho do §9.5 |
| `saude-digital/REGRAS-CRITICAS-IMPLEMENTACAO.md` | as 14 regras críticas + o cliente de teste |
| `docs/ferramentas/rtk.md` | o manual do RTK |
| `scripts/fase1-memoria/` | **manifesto + 3 scripts.** `provar.py` é re-executável e falha se algo se perder |

---

## 9. Para quem vier depois

| Se você vai… | Rode / leia |
|---|---|
| **mexer no `CLAUDE.md`** | 🔴 **rode `python3 scripts/fase1-memoria/provar.py` depois.** Ela falha se uma história, um fato ou uma palavra de regra sair de lugar |
| **mover mais coisa da raiz** | edite `scripts/fase1-memoria/manifesto.py` — é a **fonte única** das fronteiras entre regra, história e fato |
| **escrever uma ficha nova** | leia `docs/base/fichas/README.md` **antes**. ⛔ **Ficha nasce quando o artefato é tocado, nunca em lote** |
| **entender por que uma regra existe** | `BASE-04`, ordenado por frequência. **Comece pela doença nº 1** — ela responde por 7 dos 19 incidentes |
