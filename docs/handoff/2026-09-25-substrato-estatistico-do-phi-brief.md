# [BRIEF] O suporte estatístico do PHI — os três documentos, e o que eu acho que falta

> **Como usar:** anexo do `2026-09-25-reformulacao-saude-digital-brief-inicial.md`. Pode ser colado
> sozinho em qualquer sub-chat que precise de **número de referência**.
> **Repo:** `olavofranzin/phi` · **Branch:** `claude/consolidacao-2026-08`.
> **Data:** 2026-09-25 · **Autor:** chat-mãe (planejamento).
>
> 🔴 **Este documento tem duas partes e elas NÃO têm o mesmo peso.**
> **§1 a §3 é o que está escrito nos arquivos** — verificável, linha por linha.
> **§4 é OPINIÃO MINHA, como planejador.** Não foi decidida pelo Olavo, não é ADR, não é regra.
> Está aqui para ser **atacada**, e cada item traz **o que a derruba**.

---

## 0. Para que serve o "suporte estatístico"

Quando um agente do PHI diz *"o CPA está alto"*, alto **comparado a quê?** O substrato é a resposta
a essa pergunta. Sem ele, "alto" é chute com cara de análise.

São **duas coisas diferentes**, e é comum confundir:

| | Pergunta que responde |
|---|---|
| **Os benchmarks** (§1–§2) | *"quanto é normal no mercado?"* |
| **O `volume_suficiente`** (§3) | *"eu já tenho dado suficiente para concluir alguma coisa?"* |

---

## 1. Os três documentos, e quem manda em quem

| Papel | Arquivo | Tamanho |
|---|---|---|
| 🥇 **Canônico** — em conflito de número, **este vence** | `docs/pesquisa-trafego-pago.md` | 769 linhas |
| 🥈 **Complementar** — GA4, palavras-chave/negativas, padrões por setor | `docs/Gestão de Tráfego Pago, Métricas e Benchmarks (2026).md` | 797 linhas |
| 📋 **O que se cita** — tabela com código `[BM-*]` | `docs/conhecimento/benchmarks-canonicos.yaml` | 16 benchmarks |

**A hierarquia não é opinião: está escrita no cabeçalho dos três**, com a data de 05/07/2026.

**Os dois primeiros explicam. O terceiro é o que se cita.** O YAML nasceu porque os dois documentos
narrativos **se contradiziam em número** — e um agente citando dois documentos que discordam produz
análise que parece fundamentada e não é.

### A regra de consulta que quase ninguém conhece

Está dentro do YAML, e **inverte o que a maioria assume**:

> **percentis da própria conta** (`raw_campaign_data` / `phi_score_history`) **>** este arquivo **>**
> estratégia do Banco **>** conceito

**A primeira régua é a história do próprio cliente. O benchmark de mercado é a segunda.** Faz
sentido: o mercado diz o que é normal em geral; o histórico diz o que é normal *aqui*.

### A escala de confiança

Todo item do YAML carrega `forca_evidencia`:

**A** = validado internamente · **B** = case documentado · **C** = benchmark público · **D** =
heurística/opinião — e **D nunca sustenta uma afirmação de certeza.**

---

## 2. As quatro arbitragens — elas valem ACIMA dos documentos

Quando R1 e R2 discordam, quem decide é o YAML. São quatro, e **as quatro pegam a nossa operação**:

| Código | O que resolve |
|---|---|
| **ARB-CVR-01** | **Taxa de conversão do site ≠ da plataforma.** 1,5–3% contra ~7,5%. Comparar uma com a faixa da outra é erro — e é um erro fácil de cometer |
| **ARB-ROAS-01** | **"ROAS bom" é a margem do cliente**, não "≥5:1". A regra absoluta só vale sem a margem, e citada como hipótese |
| **ARB-LTVCAC-01** | **LTV:CAC acima de 5:1 não é elogio** — pode ser subinvestimento. Checar se há demanda não capturada antes de comemorar |
| **ARB-ESCOPO-01** | 🔴 **Os limiares de e-commerce não valem para a nossa operação.** E a nossa operação é **lead-gen local, Google Ads** |

> **A ARB-ESCOPO-01 é a mais importante para esta frente** e explica um vazio do §4.3: o YAML **tem**
> limiares de site (velocidade, taxa de rejeição, carrinho) — mas todos marcados como e-commerce e
> **força D**, e a arbitragem os tira do nosso escopo.

---

## 3. O `volume_suficiente` — o critério que diz se dá para concluir

Ele mora em **dois lugares, com dois números diferentes**:

| Onde | O que diz |
|---|---|
| `agregador-t28/BRUTO-v0.2-design.md`, decisão **D1** | Campanha **nova** (≤14 dias): `≥50 conversões` **e** `≥7 dias`. Campanha **madura** (>14 dias): **`true` sempre**, sem mínimo de conversões |
| `benchmarks-canonicos.yaml`, regras de uso | *"nenhuma conclusão com menos de ~30 conversões ou 2–4 semanas → responder VOLUME INSUFICIENTE"* (ADR-21 / Bloco Comum) |

**O primeiro é um campo gravado na tabela `t28_*`. O segundo é uma instrução no prompt.**

---

## 4. 🔎 Minha leitura — e é MINHA, não é fato nem decisão

> **Aqui muda a natureza do texto.** Tudo acima está escrito nos arquivos e pode ser conferido.
> **O que vem abaixo é o que eu, como planejador, concluí a partir dessa leitura.** Ninguém aprovou.
> Cada item separa **o fato** (que li) da **minha leitura** (que deduzi) e diz **o que me derruba**.

### 4.1 O gate estatístico existe e eu acho que não segura nada

**O fato, e está registrado:** o **ADR-28, achado #1** diz — *"`volume_suficiente` frouxo a montante:
payload traz `true`, mas 19 cliques / 0 conversões deveria ser `false` para conclusões de conversão.
Candidato a fix upstream."* Está na lista "a monitorar" do ADR e no gatilho de reavaliação.

**Minha leitura:** a causa é a segunda metade da decisão D1 — **"campanha madura passa sempre"**. Uma
campanha com 200 dias de vida e 2 conversões no mês é madura pela idade e vazia pelo volume. E como
o PHI hoje roda com **uma campanha por cliente**, o caso "maduro e vazio" não é exceção: é o normal.

**Consequência, se eu estiver certo:** a guarda que deveria fazer o agente dizer *"não sei ainda"*
quase nunca dispara — **e o agente sempre opina.** É a R11 da casa outra vez: não falha, concorda.

**O que me derruba:** rodar o SQL e contar quantas linhas de `t28_campaign` têm
`volume_suficiente = true` com menos de 30 conversões na janela. Se forem poucas, eu exagerei.
**Nunca contei. Estou deduzindo da regra, não do dado** — e essa foi exatamente a minha pior falha
das últimas semanas (a cláusula de desempate que li e que era inerte).

### 4.2 O substrato tem leitor no papel e não tem leitor no ar

**O fato:** o `modulo-28-analise-cognitiva.md` lista os três documentos como *"fonte de verdade — não
invente números"*, e manda **ancorar toda afirmação numérica** numa referência entre colchetes. Mas o
**único nó de IA que vive hoje** é o Diagnóstico (T28), e a skill `phi-diagnostico` — que é
**byte-idêntica ao nó vivo** — tem **zero menção** a benchmark, a substrato ou a `[BM-*]`. Ela
trabalha **só com o que vem no payload** e manda tratar campo faltante como `N/D`.

**Minha leitura:** o substrato foi escrito para um time de agentes que **ainda não existe**. O que
está no ar hoje é o Agente 3 sozinho, e ele não consulta nada disso. **Não é um defeito do
Diagnóstico** — ele faz certo o que foi desenhado para fazer. É o inverso do invariante M11: lá,
dado escrito sem consumidor; aqui, **conhecimento escrito com consumidor declarado que não consome.**

**Consequência, se eu estiver certo:** a próxima vez que alguém disser *"o agente cita benchmark"*,
está descrevendo o design, não o ar. E a revisão do YAML pode estar sendo cobrada de um documento
que, na prática, **ninguém lê ainda**.

**O que me derruba:** achar no n8n qualquer nó vivo que carregue esses números no prompt. **Eu li a
skill, não abri o n8n.**

### 4.3 O substrato inteiro é de mídia paga — e o material novo não é

**O fato:** os **16 benchmarks** do YAML são CPC, CTR, ROAS, CPL, CPA, CPM, LTV:CAC e taxa de
conversão. Os limiares de site que existem estão marcados como e-commerce e **força D**, e a
**ARB-ESCOPO-01 os tira do nosso escopo**. Sobre **tempo de resposta**, os documentos narrativos
**citam a alavanca** — *"velocidade de resposta define o ROI"*, para negócio local — mas **não trazem
número nenhum.** Sobre GBP: nenhuma menção nos três.

**Minha leitura:** o material de presença digital pede régua para tempo até a primeira resposta,
avaliações, tráfego orgânico, conversão do site e retenção. **A casa tem régua para um pedaço da
aquisição paga e nada para o resto** — inclusive para o pilar que pesa 20, que é justamente
conversão e atendimento. E o mais incômodo: **o nosso próprio substrato já diz que velocidade de
resposta é a alavanca central do negócio local, e nunca mediu isso.**

**Consequência, se eu estiver certo:** qualquer índice de presença digital que a gente desenhe vai
dar nota **sem ter contra o que comparar** — e nota sem régua é a mesma doença do "CPA alto comparado
a quê".

**O que me derruba:** encontrar essas faixas em algum documento que eu não abri. **Procurei nos três
do substrato e nos de planejamento. Não procurei no Notion nem no `Board Agência`.**

---

## 5. O que eu recomendo fazer com isto — e o que NÃO fazer

**Para o sub-chat da reformulação:** o mapa da primeira entrega ganha **uma coluna a mais** —
*"existe régua?"*. Para cada pilar e cada dimensão: **existe número de referência, e de onde?**
Responder "não existe" é uma resposta boa e provavelmente a mais frequente.

**⛔ O que NÃO fazer agora:**

1. **Não saia procurando benchmark de presença digital na internet para preencher os vazios.** Vira
   um documento de 800 linhas que ninguém lê e que contradiz os outros dois — exatamente o problema
   que o YAML foi criado para resolver.
2. **Não mexa no `volume_suficiente`.** É produção, tem ADR próprio e a decisão é do Olavo.
3. **Não atualize os três documentos.** A revisão trimestral venceu em setembro, **mas revisar número
   de leilão antes de saber se alguém os lê é gastar trabalho na ordem errada** (§4.2).

---

## 6. Decisões que ficam com o Olavo

| # | Pergunta | Por que é dele |
|---|---|---|
| **1** | O `volume_suficiente` deve ser apertado **agora** ou espera a reformulação? | É produção, e §4.1 é dedução minha, não medição |
| **2** | O substrato deve virar leitor do nó vivo, ou fica guardado até o time de agentes existir? | Custa token e é escolha de sequência, não técnica |
| **3** | A revisão trimestral do YAML entra na fila, ou fica parada até o mapa dizer se ele tem leitor? | Depende da 2 |

---

## 7. Os arquivos, para copiar e colar

```
docs/pesquisa-trafego-pago.md                                  ← canônico
docs/Gestão de Tráfego Pago, Métricas e Benchmarks (2026).md   ← complementar
docs/conhecimento/benchmarks-canonicos.yaml                    ← o que se cita [BM-*]
docs/strategic-planning/agregador-t28/BRUTO-v0.2-design.md     ← D1, o volume_suficiente
docs/strategic-planning/saude-digital/adr-rascunhos/ADR-28-decomposicao-cerebro-analise-e1.md  ← achado #1
docs/modulo-28-analise-cognitiva.md                            ← quem deveria ler o substrato
.claude/skills/phi-diagnostico/SKILL.md                        ← quem lê hoje (e não lê)
```
