# Réguas e coleta — D6 Experiência e D9 Relacionamento (v0)

| | |
|---|---|
| **Data** | 2026-09-25 |
| **Autoria das réguas** | 🔴 **Olavo**, por elicitação neste chat. **Não são benchmark de mercado.** |
| **Força de evidência** | **C/D** — julgamento de especialista com n=1. A `Metodologia Estatística` endossa esse caminho (Delphi/AHP); o **D9 do ADR-41** exige que a força seja declarada, e **`D` nunca sustenta certeza** |
| **Base factual de dado** | execuções `43060` e `43061` do `TMP - A6 BigQuery Audit` |
| **Status** | 🟡 insumo. Vira régua oficial quando entrar no ADR de construção |

> 🔴 **Nada aqui foi inventado por mim.** Onde o Olavo disse "não sei" ou não disse, está escrito que falta. Onde ele citou fonte externa (`learn.microsoft`), **eu não verifiquei** — não tenho como, e o brief do substrato proíbe sair buscando benchmark de presença digital.

---

## 1. 🔴 A correção que vem antes de tudo: a Clarity está ZERADA

**A Fase 0 contou não-nulos e eu reportei "tem dado". Estava errado.**

| Execução `43060` — `t28_clarity_daily`, 15 linhas, os 2 clientes | Resultado |
|---|---|
| `clarity_sessions` | 🔴 **0 em todas as 15 linhas** |
| `clarity_rage_clicks` | 🔴 **0 em todas** |
| `clarity_dead_clicks` | 🔴 **0 em todas** |

**A coluna não é nula. O valor é zero. As duas coisas não são a mesma, e eu tratei como se fossem.**

> 🔴 **É o **M4** me morrendo na mão, pelo lado que eu não estava olhando.** A casa já sabia que *"zero nunca é ausência"* — eu apliquei isso à leitura do índice e **não apliquei à minha própria verificação**. `COUNT(x IS NOT NULL)` prova que a coluna foi escrita; **não prova que algo foi medido.**
>
> **Regra que sai daí, e vale para qualquer Fase 0 futura:** 🔴 **contar não-nulo não verifica dado. Tem de olhar o valor, a distribuição e o mínimo/máximo.** Está indo para os critérios de aceite.

**Consequência:** o pilar Experiência não tem 4 indicadores com dado. **Tem 1** — `SD-EXP-07`, do GA4. **Os 3 da Clarity caem.** E a régua de frustração que o Olavo definiu abaixo **não tem o que medir hoje**.

---

## 2. O que o GA4 tem, de verdade (execução `43061`)

🟢 **Aqui há dado real**, não zero.

| `source` | sessões por janela D-7 | `engagement_rate` |
|---|---|---|
| **orgânico** | 26 a 56 | 0,64 a 0,81 |
| 🔴 **pago** | **2 a 5** | 0,0 a 0,5 |

### 🔴 Três problemas que este dado revela

**2.1. O segmento pago nunca passa na régua de amostra do Olavo.** Ele definiu *"menos de 50 sessões: apenas evidência qualitativa"*. O tráfego pago tem **2 a 5 sessões por janela**. Com a separação pago × orgânico aprovada (questão 9), **a metade paga do pilar Experiência é estatisticamente vazia por construção.**

**2.2. `[DEDUZO]` há problema de atribuição, não só de volume.** As campanhas gastam todo dia em `raw_campaign_data`, e o GA4 registra **2 sessões pagas em 7 dias**. É implausível. **[DEDUZO]** falta auto-tagging / UTM, ou o GA4 classifica o pago como orgânico ou direto. **Não verifiquei** — exige olhar a configuração, que é execução.

**2.3. 🔴 A taxa de conversão de site é implausível.** 19 conversões em 31 sessões orgânicas = **61%**; 16/39 = 41%; 20/56 = 36%. Para site de lead local isso não acontece. **[DEDUZO] `key_events` inclui evento que não é conversão real** (`page_view`, scroll, ou similar).
> É exatamente o que a **`ARB-CVR-01`** previne (CVR de site ≠ CVR de plataforma) e o que o **`SD-GOV-02`** ("conversão verificável, evento no alvo certo") existe para pegar. **`SD-CVR-05` tem número e o número é suspeito** — pior que não ter.

---

## 3. D6 — as réguas do Olavo, como ele as deu

### 3.1. Denominador (questão 1) — ✅ decidido

Os sinais de frustração passam a ser **taxa**, não contagem. Base de comparação: **o histórico do próprio cliente** e, no futuro, **outros clientes do mesmo setor**.

> ⚠️ **Ressalva de método, obrigatória:** comparar com outros clientes do mesmo setor serve para **calibrar limites fixos uma vez e congelá-los**. **Não pode ser rank percentil dentro da coorte a cada rodada** — isso é o que o **D5 / S4 do ADR-41 proíbe**, porque a empresa mudaria de nota só porque a base mudou. **A comparação setorial informa o número; depois o número fica parado até ser revisto por decisão.**

### 3.2. Faixas de frustração — regra interna, não benchmark oficial

| Taxa de sessões afetadas | Classificação |
|---|---|
| < 1% | Monitorar |
| 1% a 3% | Investigar se ocorre em elemento importante |
| > 3% | Problema provável |
| > 5% | Prioridade alta |
| > 10% | Problema grave ou comportamento estrutural |

**Tradução para o D5 do ADR-41** (indicador negativo, `z = 100 × clip((U − x)/(U − T), 0, 1)`): **`T` = 1%** e **`U` = 10%**.
⚠️ **Isto é minha tradução, não a fala dele — precisa de confirmação.** Dá: 1% → 100 · 3% → 78 · 5% → 56 · 10% → 0.

### 3.3. Faixas técnicas — 🟢 e estas fecham o `SD-EXP-08`

O Olavo definiu como alerta: **Performance Score ≤ 50 · LCP > 4s · INP > 500ms · CLS > 0,25**.

🟢 **Isso completa a régua dos Core Web Vitals**, porque são exatamente os limites da faixa "ruim":

| Métrica | `T` (meta) | `U` (ruim) |
|---|---|---|
| LCP | 2,5 s | **4 s** |
| INP | 200 ms | **500 ms** |
| CLS | 0,1 | **0,25** |
| Performance Score | — | **≤ 50** |

**É o único indicador de D6 com régua completa e de fonte pública.**

### 3.4. Amostra mínima — 🔴 é um `volume_suficiente` próprio do pilar

| Sessões | O que se pode afirmar |
|---|---|
| < 50 | apenas evidência qualitativa |
| 50 a 100 | alerta preliminar |
| 100 a 500 | diagnóstico operacional |
| > 500 | comparação confiável entre segmentos |

> 🔴 **Consequência de arquitetura:** o `volume_suficiente` de mídia paga (`conv ≥ 50 AND dias ≥ 7`, ADR-29 D1) **não serve aqui**. O pilar Experiência precisa do **seu próprio gate**, e é este. Dois gates diferentes, por pilar — e isso precisa estar no schema.

### 3.5. Exceções críticas — 🔴 **não implementáveis com o dado atual**

O Olavo definiu que **mesmo abaixo de 1% é grave** quando o sinal está em: botão de comprar · enviar formulário · agendar · finalizar pagamento · abrir WhatsApp · selecionar data · menu mobile · aceitar consentimento · avançar etapa.

🔴 **`t28_clarity_daily` é agregada por cliente e janela. Não tem URL, não tem elemento, não tem dispositivo.** A regra mais importante que ele deu **não tem onde ser aplicada.**

O mesmo vale para a lista de comparações que ele pediu (histórico da URL · páginas de mesma função · dispositivo · origem · novo × recorrente · converteu × não converteu): **nenhuma dessas dimensões existe na tabela.**

> **Isto é decisão de grão, e é maior que régua:** para a régua do Olavo funcionar, a Clarity teria de ser coletada **por URL e por elemento**, não por cliente. **É mudança de contrato de coleta, não ajuste de limite.**

### 3.6. Ordem de prioridade dos sinais — 🔴 **reestrutura o D6**

O Olavo definiu 7 classes, nesta ordem:

| # | Classe | Sinais |
|---|---|---|
| 1 | **Falha técnica** | error clicks, erro de JavaScript, elemento quebrado |
| 2 | **Desempenho** | LCP, INP, CLS, Performance Score |
| 3 | **Frustração** | rage clicks, dead clicks |
| 4 | **Desalinhamento** | quick backs |
| 5 | **Encontrabilidade** | excessive scrolling, mapa de rolagem |
| 6 | **Impacto** | queda de conversão, abandono de evento importante |
| 7 | **Materialidade** | volume de usuários, valor comercial da página |

**Dois indicadores NOVOS aparecem aqui e não existem no dicionário:**
- 🆕 **error clicks** — e ele o coloca em **1º lugar**. *"Error clicks recorrentes em um CTA principal devem ser tratados mesmo com baixa incidência"*
- 🆕 **quick backs**

Nenhum dos dois existe em `t28_clarity_daily`. **Propostos como `SD-EXP-11` (error clicks) e `SD-EXP-12` (quick backs)** — ids reservados, aguardando decisão.

### 3.7. 🔴 A descoberta mais importante: o D6 não é nota, é alerta

O critério final do Olavo é **conjuntivo**: uma página é problemática quando apresenta **simultaneamente** taxa ≥ 2× a referência **e** volume suficiente **e** concentração num mesmo elemento **e** conversão menor que páginas equivalentes **e** 🔴 **confirmação visual nas gravações**.

**O último item é humano e não automatizável.**

> 🟢 **E isso resolve o impasse da régua de um jeito melhor que as duas saídas que eu havia proposto.** O **D6 do ADR-41** já diz: *falha crítica é **alerta**, não desconto na média* (**S5**). O critério do Olavo é exatamente a forma de um alerta com investigação humana — **não de um componente de nota 0–100**.
>
> **Proposta:** o pilar Experiência **entra como alerta e evidência, não como nota ponderada**, até existir dado por elemento e série suficiente. Não é "pilar sem régua"; é **pilar cuja natureza é alerta**. Isso **não reduz a cobertura pontuada de propósito** — reconhece o que o indicador é.

### 3.8. Questões 3, 4 e 5 — scroll

**Resposta do Olavo: scroll sozinho não basta.** Baixa profundidade pode ser CTA no primeiro bloco, ligação sem rolar, conteúdo desalinhado; excessive scrolling pode ser dificuldade de encontrar **ou** interação não convencional. **Precisa de contexto.**

**Decisão registrada:** `SD-EXP-03` (excessive scroll) e `SD-EXP-04` (profundidade) **não pontuam isolados**. Entram na classe 5 (encontrabilidade), como **descrição e gatilho de investigação**.

### 3.9. Questões 6 e 7 — `SD-EXP-05` muda de definição

**Medir só no GA4**, e a métrica passa a ser **tempo médio de engajamento por sessão** — que conta só o tempo com o site em foco. *(O Olavo registrou também a definição de sessão engajada do GA4: >10s, ou um evento-chave, ou 2+ visualizações.)*

🔴 **Consequência: essa coluna não existe.** `t28_ga4_landing` tem `avg_session_duration_sec` (vazia), `engaged_sessions` e `sessions` — **não tem tempo de engajamento**. É **coluna nova** (`avg_engagement_time_sec`) e **campo novo na chamada do GA4**.
✅ Em compensação, a direção fica resolvida: **tempo de engajamento é `↑` sem ambiguidade** — diferente de duração de sessão, que era `⊙` disfarçado.

### 3.10. Questão 8 — consertar a rejeição · ⚠️ **mas ela é redundante**

**Decisão: consertar.** ⚠️ **Ressalva que eu devo dizer:** no GA4, **taxa de rejeição é literalmente `1 − taxa de engajamento`**. Com `SD-EXP-07` no índice, **`SD-EXP-06` não acrescenta informação — e pontuar os dois conta o mesmo fato duas vezes**, o que o §4 do dicionário (duplicidades) existe para impedir.
**Recomendação:** coletar e **exibir** para leitura humana; **não pontuar**. *Aguarda confirmação.*

### 3.11. Questão 9 — separar pago × orgânico — ✅ aprovado

Coluna `source` já existe, custo zero. ⚠️ **Mas ver 2.1:** o lado pago tem 2 a 5 sessões e **nunca atinge a amostra mínima**. Separar está certo; **esperar nota do lado pago, não.**

### 3.12. Questão 10 — `SD-EXP-07` é `⊙`, não `↑` — e isso abre um buraco no ADR-41

| Taxa de engajamento | Leitura |
|---|---|
| < 35% | Baixa; investigar tráfego e página |
| 35% a 50% | Mediana ou aceitável, dependendo da intenção |
| 50% a 60% | Boa |
| 60% a 75% | Muito boa |
| > 75% | Alta; validar configuração e qualidade |
| > 90% | 🔴 Suspeita; verificar eventos ou implementação |

**Como acima de 90% é suspeito, o indicador é `⊙` (alvo), não `↑`.** O dicionário o classifica como `↑`: **corrigir**.

> 🔴 **E aqui está um buraco real no ADR-41:** o **D5 define fórmula para indicador positivo e para negativo. Não define para `⊙`.** São **~11 dos 92 indicadores** que são alvo. **Sem terceira fórmula, eles não podem ser normalizados** — e isso não é detalhe de implementação, é lacuna da decisão.
>
> **Proposta de terceira fórmula:** nota máxima dentro da faixa boa, decaindo linearmente para fora dela, com piso 0 nos extremos. **Precisa virar adendo ao ADR-41.**

**Dado real do CLI-4 contra esta régua:** orgânico entre **0,64 e 0,81** → "muito boa", encostando na faixa de validar. Pago entre **0,0 e 0,5** — com 2 a 5 sessões, não se conclui nada.

### 3.13. Questão 11 — ✅ ligar Core Web Vitals para cliente

O código existe (`PROSP-04` mede PageSpeed de lead) e a régua é pública. **É o item de melhor retorno do D6.**

### 3.14. Questão 12 — ✅ testes reais no onboarding e a cada trimestre, com registro

Vale para `SD-EXP-09` (mobile) e `SD-EXP-10` (formulário chega). Binários: **não precisam de régua, precisam de dono e cadência.**

---

## 4. D9 — caminho **A**: o cliente dá acesso ao sistema dele

**Resposta do Olavo à questão 13: A.** E o eixo que atravessa todas as respostas seguintes: 🔴 ***"nossa orientação e ação será para que sempre se use um CRM e que ele seja preenchido corretamente — dado perdido é dinheiro perdido"***.

| # | Indicador | Resposta do Olavo | O que isso implica |
|---|---|---|---|
| 14 | `SD-REL-01` tempo até 1ª resposta | depende da campanha (se o lead vem de tráfego). **Das fontes, só ligação telefônica não se mede automaticamente** | ⚠️ precisão: a **contagem** de ligações é mensurável (`raw_campaign_data.phone_calls` existe, vazia, e o Google Ads reporta chamadas). O que não se mede é **o tempo de resposta numa ligação** |
| 15 | `SD-REL-02` taxa de contato | registro no **CRM**, por quem atende o lead | depende de humano preencher |
| 16 | `SD-REL-03` qualificação | definição vem do cliente; **e também dá para medir leads que chegam × conversão** | 🟢 o segundo caminho não depende do cliente definir nada |
| 17 | `SD-REL-04` agendamentos | depende do cliente | por cliente, não por produto |
| 18 | `SD-REL-05` no-show | marcação de quem atendeu | depende de humano |
| 19 | `SD-REL-09` ocupação | depende do cliente, **mas a orientação é sempre usar CRM bem preenchido** | idem |
| 20 | `SD-REL-07/08` recompra e reativados | **se não tiver base, será criada**; o compartilhamento é **condição para o trabalho** | 🟢 vira cláusula de entrada, não impedimento |
| 21 | `SD-REL-09` capacidade | **o cliente sabe a própria capacidade** | 🟢 dado declarado, coletável no onboarding |
| 22 | `SD-REL-10` motivos de perda | se o cliente não tiver ou não marcar, **isso também será trabalhado** | ✅ e confirma: é o cliente perdendo o **cliente dele**, não a agência perdendo o lead dela. **`motivos_de_perda` do `phi_crm` NÃO serve** |

### 4.1. 🔴 As três consequências estruturais do caminho A

**1. O D9 depende do `SD-GOV-04`.** *"CRM adotado de fato pelo cliente"* deixa de ser um indicador entre outros e passa a ser **pré-requisito de toda a dimensão**. Sem ele, os 10 indicadores de D9 não têm fonte. **É a primeira dependência explícita entre dimensões do dicionário.**

**2. A cobertura passa a ser por CLIENTE, não por produto.** Cliente com CRM conectado tem D9; cliente sem, não tem. Pelo **D3 / S2**, isso já é tratado — a linha grava `pilares_medidos`. **Mas confirma que o campo é obrigatório**, e não conveniência.

**3. 🔴 O D9 mede disciplina, não só desempenho.** Se o preenchimento é humano, uma nota baixa pode significar *"o atendimento é ruim"* **ou** *"ninguém preencheu"*. **São coisas opostas e o índice não pode confundi-las.**
> **Proposta:** todo indicador de D9 carrega junto uma **taxa de preenchimento**. Abaixo de um mínimo, o indicador é **"não medido"** (S1), **nunca nota baixa**. Sem isso, o índice pune o cliente organizado que registra perdas e premia o desorganizado que não registra nada.

---

## 5. O que fica pendente de você

| # | Pendência |
|---|---|
| **1** | Confirmar a tradução `T = 1%` e `U = 10%` das faixas de frustração (§3.2) — **é minha leitura, não sua fala** |
| **2** | 🔴 A Clarity zerada (§1): investigar a coleta, ou o pilar Experiência fica com **1 indicador** |
| **3** | 🔴 Grão da Clarity (§3.5): coletar **por URL e elemento**? Sem isso, sua regra de exceção crítica e sua lista de comparações não existem |
| **4** | Aceitar `SD-EXP-11` error clicks e `SD-EXP-12` quick backs como indicadores novos (§3.6) |
| **5** | 🔴 Aceitar que o pilar Experiência entre como **alerta, não como nota** (§3.7) |
| **6** | `SD-EXP-06` rejeição: coletar e **não pontuar**, por ser `1 − engajamento` (§3.10) |
| **7** | 🔴 Terceira fórmula de normalização para indicadores `⊙` — **adendo ao ADR-41** (§3.12) |
| **8** | Taxa de preenchimento obrigatória em todo indicador de D9 (§4.1 item 3) |
| **9** | Investigar a atribuição do GA4 (2 sessões pagas) e os `key_events` (CVR de 61%) — §2.2 e §2.3. **É execução, vira sub-chat** |

**Confiança nos dados citados: 0,95** (são valores lidos, não contagens). **Nas quatro deduções marcadas `[DEDUZO]`: 0,6.**
