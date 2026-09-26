# Contrato de Fontes — Índice de Saúde Digital do Negócio (v0)

| | |
|---|---|
| **Data** | 2026-09-25 |
| **Decisão que o autoriza** | 🔴 **Olavo, 25/09: inverter a ordem — primeiro a fonte de cada indicador, depois o workflow.** É o **D7 / S3 do ADR-41** aplicado ao grão do indicador |
| **Status** | 🟡 **RASCUNHO.** Não é decisão até virar ADR aprovado (R7) |
| **Substitui** | o brief `2026-09-25-indice-saude-digital-v0.1-construcao-subchat-brief.md`, que partia de *"zero coleta nova"* — premissa que o Olavo mudou. Aquele recebeu banner de histórico, não foi apagado (R2) |
| **Complementa** | `DICIONARIO-DE-INDICADORES-v0.md` (o quê) · `REGUAS-D6-D9-v0.md` (quanto é bom) · **este: de onde vem** |

---

## 0. Como ler, e as três regras que governam este documento

**Este documento é CONTRATO (de onde o dado DEVE vir), não as-built (de onde vem hoje).** O as-built continua no dicionário, coluna *"onde está hoje"*. **Misturar os dois é o erro que a R2 proíbe** — foi o que me fez reportar "tem dado" sobre tabela zerada.

| Selo | Significado |
|---|---|
| 🟢 **`v0.1`** | fonte contratada para a primeira versão. Entra na construção agora |
| 🟡 **`depois`** | fonte existe ou é obtenível, mas fica para outra rodada. **Tem gatilho escrito** |
| ⬜ **`não coletamos`** | 🔴 **decisão explícita de não coletar.** Não é esquecimento, e não vira dívida |
| 🔧 **`ferramenta`** | serve ao humano, **não alimenta o índice**. Não tem coluna, não tem nota |

> 🔴 **REGRA 1 — nome de campo marcado `⚠️` NÃO pode ser usado como está.** Eu escrevi o nome que acredito ser o correto da API, **mas não verifiquei contra a API viva**. Quem construir **confere primeiro**. Inventar nome de campo é o mesmo defeito de inventar benchmark.
>
> 🔴 **REGRA 2 — toda fonte declara o comportamento no VAZIO.** Por padrão: ausência ⇒ `NULL` + `motivo_nao_medido`, **nunca `0`** (M4 / S1). Onde o padrão não serve, está escrito.
>
> 🔴 **REGRA 3 — verificar VALOR, não nulidade.** `COUNT(x IS NOT NULL)` prova que a coluna foi escrita, não que algo foi medido. Foi assim que a Clarity zerada passou por mim. **Todo aceite olha valor, distribuição e mín/máx.**

---

## 1. 🔴 As duas decisões do Olavo que mudam o desenho

### 1.1. A Clarity sai do índice e volta a ser ferramenta

**Motivo, nas palavras dele:** *"o pensamento inicial em se usar o Clarity é que ele substituísse o Hotjar e pudéssemos extrair principalmente os dados de mapa de calor"*.

**Mapa de calor e gravação são instrumentos de análise para pessoa. Nunca foram para ser coluna em BigQuery.**

| Consequência | Efeito |
|---|---|
| `t28_clarity_daily` **deixa de ser fonte do índice** | a integração zerada **sai do parque** em vez de entrar na fila de conserto |
| Rage/dead clicks, error clicks, quick backs, mapa de calor | 🔧 **ferramenta** — o Clarity segue como o *"confirmação visual nas gravações"* do critério do Olavo |
| O grão que faltava (URL, dispositivo, origem) | 🟢 **o GA4 tem nativamente** — o que a Clarity agregada nunca daria |
| ⚠️ **Pendência que não desaparece** | os zeros podem significar **script não instalado**. Se for isso, o mapa de calor também não existe, e a ferramenta não serve nem ao novo papel. **Verificar é execução** |

### 1.2. `não coletamos` é resposta válida

Sem esse selo o documento viraria lista de desejos. **Com ele, a ausência é decisão registrada** — e para de reaparecer em toda auditoria.

---

## 2. As fontes, por dimensão

### D1 · Infraestrutura e presença — 8

| id | Fonte contratada | Onde / campo | Grão | Selo |
|---|---|---|---|---|
| `SD-INF-01` site responde | HTTP `HEAD/GET` próprio | status 2xx/3xx + tempo | cliente | 🟡 `depois` |
| `SD-INF-02` tipo do ativo | observação humana no onboarding | ficha de onboarding | cliente | 🟡 `depois` |
| `SD-INF-03` HTTPS válido | inspeção de certificado | validade + cadeia | cliente | 🟡 `depois` |
| `SD-INF-04` GBP reivindicado | Places API / Business Profile API | ⚠️ confirmar campo de verificação | cliente | 🟡 `depois` |
| `SD-INF-05` rastreamento instalado | GA4 Data API — 🟢 **prova por uso** | a API devolve linha para a propriedade | cliente | 🟢 **`v0.1`** |
| `SD-INF-06` propriedade dos ativos | checklist humano de acessos | ficha de onboarding | cliente | 🟡 `depois` |
| `SD-INF-07` páginas indexadas | Search Console API | ⚠️ `index coverage` / contagem de URLs | domínio | 🟡 `depois` — **gatilho: GSC conectado** |
| `SD-INF-08` ativos órfãos | auditoria humana | ficha | cliente | 🟡 `depois` |

> 🟢 **`SD-INF-05` é de graça e entra:** se o GA4 responde para a propriedade do cliente, o rastreamento está instalado. **A prova é o próprio uso da fonte** — não precisa de coleta nova.

### D2 · Descoberta e visibilidade — 9

| id | Fonte contratada | Onde / campo | Grão | Selo |
|---|---|---|---|---|
| `SD-DES-01` impressões GBP | Business Profile Performance API | ⚠️ `BUSINESS_IMPRESSIONS_*` (4 variantes: desktop/mobile × search/maps) | cliente/dia | 🟡 `depois` — **gatilho: cota do GBP** |
| `SD-DES-02` views na Busca | idem | ⚠️ soma das variantes `*_SEARCH` | cliente/dia | 🟡 `depois` |
| `SD-DES-03` views no Maps | idem | ⚠️ soma das variantes `*_MAPS` | cliente/dia | 🟡 `depois` |
| `SD-DES-04` sessões orgânicas | 🟢 **GA4 Data API** | `sessions` com `source='organico'` | landing/dia | 🟢 **`v0.1`** |
| `SD-DES-05` cliques e impressões orgânicas | Search Console API | `clicks`, `impressions` | query/página | 🟡 `depois` — **gatilho: GSC conectado** |
| `SD-DES-06` posição média | Search Console API | `position` | query | 🟡 `depois` |
| `SD-DES-07` visibilidade local multi-busca | 🔴 exige grade de geolocalização (ferramenta paga) | — | — | ⬜ **`não coletamos`** |
| `SD-DES-08` Share of Voice | Meta Ad Library + grade local | — | — | ⬜ **`não coletamos`** |
| `SD-DES-09` citações em IA | 🔴 sem fonte estável e auditável | — | — | ⬜ **`não coletamos`** |

> 🔴 **Três `não coletamos` seguidos, e é honesto:** os itens 07, 08 e 09 são os mais vendáveis do pilar e **os que não temos como medir**. Registrar isso impede que reapareçam como promessa comercial.

### D3 · Consistência cadastral — 5 · todos `☑`

| id | Fonte contratada | Onde / campo | Grão | Selo |
|---|---|---|---|---|
| `SD-CON-01` a `-05` (nome · telefone · endereço · horário · categoria) | **Places API × site × ficha**, comparação automática | comparar `name`, `formatted_phone_number`, `formatted_address`, `opening_hours`, `types` contra o cadastro | cliente | 🟡 `depois` |

> 🟢 **Barato e de bom retorno:** a Prospecção **já lê a Places API**. É comparação, não coleta nova. **Gatilho: quando o cadastro canônico do cliente existir** para comparar contra.

### D4 · Reputação — 8

| id | Fonte contratada | Onde / campo | Grão | Selo |
|---|---|---|---|---|
| `SD-REP-01` nota média | 🟢 **Places API** (a Prospecção já usa) | `rating` | cliente | 🟡 `depois` |
| `SD-REP-02` volume | idem | `user_ratings_total` | cliente | 🟡 `depois` |
| `SD-REP-03` recência | idem | `reviews[].time` | avaliação | 🟡 `depois` |
| `SD-REP-04` % respondidas | ⚠️ Places API **não traz resposta do dono** de forma confiável | ⚠️ exige Business Profile API com acesso do cliente | avaliação | 🟡 `depois` |
| `SD-REP-05` tempo de resposta | idem `-04` | — | avaliação | 🟡 `depois` |
| `SD-REP-06` distribuição 1–5★ | ⚠️ Places API traz amostra, **não a distribuição completa** | ⚠️ exige Business Profile API | cliente | 🟡 `depois` |
| `SD-REP-07` reclamações recorrentes | **camada rápida de IA** sobre o texto das avaliações (R10) | classificação de tema | avaliação | 🟡 `depois` |
| `SD-REP-08` menções externas | 🔴 sem fonte sem ferramenta paga | — | — | ⬜ **`não coletamos`** |

> ⚠️ **Precisão importante:** a Prospecção lê **Places API**, que serve para ver de fora. **`-04`, `-05` e `-06` exigem a Business Profile API com acesso do cliente** — não é a mesma coisa. Tratar como a mesma fonte seria repetir a confusão do CRM da agência.

### D5 · Conteúdo e redes sociais — 7

| id | Fonte contratada | Onde / campo | Grão | Selo |
|---|---|---|---|---|
| `SD-CNT-01` fotos no GBP | Business Profile API | ⚠️ contagem de mídia | cliente | 🟡 `depois` |
| `SD-CNT-02` postagens no GBP | Business Profile API | ⚠️ `localPosts` | cliente | 🟡 `depois` |
| `SD-CNT-03` alcance de não seguidores | Instagram Graph API — insights | ⚠️ `reach` com breakdown de seguidor | conta/post | 🟡 `depois` — **gatilho: credencial de IG por cliente** |
| `SD-CNT-04` compartilhamentos ÷ alcance | idem | ⚠️ `shares` ÷ `reach` | post | 🟡 `depois` |
| `SD-CNT-05` salvamentos ÷ alcance | idem | ⚠️ `saved` ÷ `reach` | post | 🟡 `depois` |
| `SD-CNT-06` retenção de vídeo | idem | ⚠️ nome do campo **incerto**; varia por tipo de mídia | post | 🟡 `depois` |
| `SD-CNT-07` visitas ao perfil | idem | ⚠️ `profile_views` | conta | 🟡 `depois` |

> 🔴 **Nenhum entra na v0.1**, e o motivo é o **D7**: não existe credencial de Instagram por cliente. **Foi exatamente o que matou o ADR-21** — atribuir peso aqui sem a credencial.

### D6 · Experiência digital — 🔴 **redesenhada pelas duas decisões**

| id | Fonte contratada | Onde / campo | Grão | Selo |
|---|---|---|---|---|
| `SD-EXP-01` rage clicks | Clarity | — | — | 🔧 **`ferramenta`** |
| `SD-EXP-02` dead clicks | Clarity | — | — | 🔧 **`ferramenta`** |
| `SD-EXP-03` scroll excessivo | Clarity | — | — | 🔧 **`ferramenta`** |
| `SD-EXP-04` profundidade de scroll | 🟡 GA4 tem o evento `scroll`, **um só limiar (90%)** — não é mapa. Mapa: Clarity | `eventCount` de `scroll` | landing | 🔧 **`ferramenta`** (mapa) · 🟡 `depois` (evento) |
| `SD-EXP-05` **tempo de engajamento por sessão** | 🟢 **GA4 Data API** | ⚠️ confirmar se existe `averageEngagementTimePerSession`; **derivação segura: `userEngagementDuration` ÷ `sessions`** | landing × device × source | 🟢 **`v0.1`** |
| `SD-EXP-06` taxa de rejeição | 🟢 GA4 Data API — ⚠️ **é `1 − engagementRate`** | `bounceRate` | landing × device × source | 🟢 **`v0.1` — coletar e EXIBIR, 🔴 não pontuar** |
| `SD-EXP-07` taxa de engajamento | 🟢 **GA4 Data API** — o único com dado real hoje | `engagementRate` | landing × device × source | 🟢 **`v0.1`** |
| `SD-EXP-08` Core Web Vitals | 🟢 **PageSpeed Insights / CrUX** — código já existe no `PROSP-04` | ⚠️ LCP · INP · CLS (p75 de campo) + `performance score` do Lighthouse | URL × device | 🟢 **`v0.1`** |
| `SD-EXP-09` mobile funciona | teste humano | registro no onboarding e a cada trimestre | cliente | 🟢 **`v0.1`** |
| `SD-EXP-10` formulário chega | teste humano | idem | cliente | 🟢 **`v0.1`** |
| 🆕 `SD-EXP-11` error clicks | Clarity | — | — | 🔧 **`ferramenta`** |
| 🆕 `SD-EXP-12` quick backs | Clarity | — | — | 🔧 **`ferramenta`** |

> 🟢 **O que a troca conserta:** o grão. As réguas do Olavo pediam comparação **por URL, por dispositivo, por origem e por novo × recorrente** — o GA4 dá todas nativamente (`landingPage`, `deviceCategory`, `sessionSource`, ⚠️ `newVsReturning`). `t28_clarity_daily`, agregada por cliente, nunca daria.
>
> 🔴 **O que a troca perde, e fica declarado:** sinal de frustração e gravação. **O pilar Experiência passa a ser desempenho + engajamento**, não frustração. A frustração vira **investigação humana no Clarity**, como o critério conjuntivo do Olavo já exigia.
>
> ⚠️ **Dois pré-requisitos antes de pontuar qualquer coisa deste pilar:** a atribuição do pago (2 sessões em 7 dias com gasto diário) e os `key_events` inflados (CVR de 36% a 61%). **Fonte errada faz régua certa errar.**

### D7 · Aquisição — 14

| id | Fonte contratada | Onde / campo | Grão | Selo |
|---|---|---|---|---|
| `SD-AQU-01` investimento | 🟢 Google Ads GAQL | `metrics.cost_micros` → `raw_campaign_data.cost` | campanha/dia | 🟢 **`v0.1`** |
| `SD-AQU-02` impressões | 🟢 GAQL | `metrics.impressions` | campanha/dia | 🟢 **`v0.1`** |
| `SD-AQU-03` cliques | 🟢 GAQL | `metrics.clicks` | campanha/dia | 🟢 **`v0.1`** |
| `SD-AQU-04` CTR | 🟢 derivada | `t28_campaign.ctr` | campanha/janela | 🟢 **`v0.1`** |
| `SD-AQU-05` CPC | 🟢 derivada | `t28_campaign.cpc` | campanha/janela | 🟢 **`v0.1`** |
| `SD-AQU-06` CPM | 🟢 derivada | `t28_campaign.cpm` | campanha/janela | 🟢 **`v0.1`** |
| `SD-AQU-07` métrica-mãe | 🟢 Notion Clientes → `client_config` | `primary_metric_type` + `primary_metric_goal` | campanha | 🟢 **`v0.1`** |
| `SD-AQU-08` **PHI·Mídia** | 🟢 motor próprio | `phi_score_history.phi_value` | campanha/dia | 🟢 **`v0.1`** |
| `SD-AQU-09` conjuntos | ⚠️ GAQL de ad group. 🔴 `t28_adset` está **VAZIA**, e o `sw metricas conjuntos` **não tem nó BigQuery** | ⚠️ definir writer | conjunto/janela | 🟡 `depois` — **gatilho: writer decidido** |
| `SD-AQU-10` anúncio/criativo | GAQL de ad. 🔴 `raw_ad_data` tem 0 linhas (`IF Gate PMAX`) | ⚠️ investigar o gate | anúncio | 🟡 `depois` |
| `SD-AQU-11` impression share | 🟢 GAQL — **a coluna JÁ EXISTE e está vazia** | ⚠️ `metrics.search_impression_share` → `t28_campaign.impression_share` (+ `budget_lost_is`) | campanha/janela | 🟢 **`v0.1` — só preencher** |
| `SD-AQU-12` aquisição orgânica | 🟢 GA4 Data API | `sessions`/`keyEvents` com `source='organico'` | landing/janela | 🟢 **`v0.1`** |
| `SD-AQU-13` composição de termos | 🟢 GAQL + camada rápida de IA — **já persistido como proporção** | `pct_brand_terms`, `pct_problem_solving_terms`, `pct_competitor_terms`, `pct_other_terms` | campanha/janela | 🟢 **`v0.1`** ⚠️ **apurar `search_terms = "error"`** |
| `SD-AQU-14` Meta Ads | Meta Graph API. 🔴 nó `Fetch Meta Ads` está **DISABLED**, sem nota de religação (R12) | ⚠️ `t28_meta_campaign` | campanha/janela | 🟡 `depois` |

> 🔴 **`SD-AQU-13` carrega uma contradição aberta:** as quatro colunas `pct_*` estão **304 de 304 cheias** e `source_status.search_terms = "error"` em **todas** as linhas. **Valor cheio com fonte em erro é candidato a sucesso silencioso.** Ou o erro é espúrio, ou os valores são default. **Apurar antes de pontuar.**
>
> ✅ **O `ADR-29 D5` é respeitado na prática:** `raw_campaign_data.top_search_terms` existe e tem **0 não-nulos**. Nunca foi escrita. **Só a proporção é persistida, nunca o termo.** O contrato mantém isso: 🔴 **persistir termo bruto é proibido, e o código lança exceção.**

### D8 · Conversão — 14

| id | Fonte contratada | Onde / campo | Grão | Selo |
|---|---|---|---|---|
| `SD-CVR-01` conversões da plataforma | 🟢 GAQL | `metrics.conversions` | campanha/dia | 🟢 **`v0.1`** |
| `SD-CVR-02` CPA / CPL | 🟢 derivada | `t28_campaign.cpa` · `cpl` | campanha/janela | 🟢 **`v0.1`** — ⚠️ `NULL` quando `conversions=0` (guardrail 8), **nunca 0** |
| `SD-CVR-03` ROAS | 🟢 derivada de `conv_value` | `t28_campaign.roas` | campanha/janela | 🟢 **`v0.1`** |
| `SD-CVR-04` receita | 🟢 GAQL | `metrics.conversions_value` → `conv_value` (318/318). `raw_campaign_data.revenue` é 32/495 e **não é a fonte** | campanha | 🟢 **`v0.1`** |
| `SD-CVR-05` conversões de SITE | 🟢 GA4 Data API | `keyEvents` | landing × source | 🟢 **`v0.1`** — 🔴 **bloqueado até apurar quais eventos contam** |
| `SD-CVR-06` cliques no site pelo GBP | Business Profile Performance API | ⚠️ `WEBSITE_CLICKS` | cliente/dia | 🟡 `depois` — **gatilho: cota do GBP** |
| `SD-CVR-07` ligações pelo GBP | idem | ⚠️ `CALL_CLICKS` | cliente/dia | 🟡 `depois` |
| `SD-CVR-08` solicitações de rota | idem | ⚠️ `BUSINESS_DIRECTION_REQUESTS` | cliente/dia | 🟡 `depois` |
| `SD-CVR-09` cliques no WhatsApp | GA4 — **evento próprio no site** | ⚠️ exige evento configurado no GTM | landing | 🟡 `depois` — **gatilho: evento instalado** |
| `SD-CVR-10` conversas iniciadas | WhatsApp Business API / GBP | ⚠️ `BUSINESS_CONVERSATIONS` | cliente | 🟡 `depois` |
| `SD-CVR-11` formulário chega ao CRM | teste humano ponta a ponta | registro | cliente | 🟢 **`v0.1`** |
| `SD-CVR-12` margem de contribuição | 🟢 Notion **DB Clientes** — coluna existe e está **0/304** | `margem_contribuicao_pct` | cliente | 🟢 **`v0.1` — é CADASTRO, não coleta** |
| `SD-CVR-13` ticket / LTV | idem | `ticket_ltv` | cliente | 🟢 **`v0.1` — é cadastro** |
| `SD-CVR-14` CAC e LTV:CAC | falta `custos_aquisicao_extra` (spec T28 §9) | ⚠️ campo novo no cadastro | cliente | 🟡 `depois` |

> 🟢 **`-12` e `-13` são o achado mais barato do documento:** não é integração, **é alguém preencher a DB Clientes.** Duas colunas vazias travam dois indicadores de núcleo.
>
> 🔴 **`SD-CVR-05` é o mais perigoso:** tem número, e o número é suspeito (CVR de 36% a 61%). **Indicador com número errado é pior que indicador sem número** — o índice não tem como desconfiar sozinho.

### D9 · Relacionamento e atendimento — 10 · **caminho A**

**Fonte única declarada pelo Olavo: o sistema do cliente** (WhatsApp Business API · agenda · CRM dele), com acesso concedido. *"Nossa orientação e ação será para que sempre se use um CRM e que ele seja preenchido corretamente — dado perdido é dinheiro perdido."*

| id | Fonte contratada | Observação | Selo |
|---|---|---|---|
| `SD-REL-01` tempo até 1ª resposta | CRM do cliente + WhatsApp Business API | 🔴 exige **dois carimbos**: chegada e resposta. ⚠️ Em **ligação** o tempo não é mensurável — a **contagem** é (`metrics.phone_calls` do Ads) | 🟡 `depois` |
| `SD-REL-02` taxa de contato | CRM do cliente | registro de quem atende | 🟡 `depois` |
| `SD-REL-03` taxa de qualificação | CRM do cliente **+ 🟢 caminho alternativo** | 🟢 *"leads que chegam × conversão"* **não depende do cliente definir nada** — é derivável de `keyEvents` + CRM | 🟡 `depois` |
| `SD-REL-04` agendamentos | agenda do cliente | varia por cliente | 🟡 `depois` |
| `SD-REL-05` no-show | marcação de quem atendeu | humano | 🟡 `depois` |
| `SD-REL-06` fechamento | CRM do cliente | humano | 🟡 `depois` |
| `SD-REL-07` recompra | base do cliente — *"se não tiver, será criada"* | acesso é **condição do trabalho** | 🟡 `depois` |
| `SD-REL-08` reativados | idem | idem | 🟡 `depois` |
| `SD-REL-09` ocupação em dias fracos | agenda + 🟢 **capacidade declarada** (*"o cliente sabe a própria capacidade"*) | capacidade entra no **onboarding** | 🟡 `depois` |
| `SD-REL-10` motivos de perda | CRM do cliente | 🔴 **NÃO é o `motivos_de_perda` do `phi_crm`** — aquele é a agência perdendo o lead dela | 🟡 `depois` |

> 🔴 **Três consequências do caminho A, todas de arquitetura:**
>
> **1. O D9 inteiro depende do `SD-GOV-04`** (*"CRM adotado de fato pelo cliente"*). É a **primeira dependência explícita entre dimensões** do dicionário.
>
> **2. A cobertura passa a ser por CLIENTE, não por produto.** Cliente com CRM conectado tem o pilar; cliente sem, não tem. O **D3 / S2** já prevê — **confirma que `pilares_medidos` por linha é obrigatório**, não conveniência.
>
> **3. 🔴 Todo indicador de D9 carrega TAXA DE PREENCHIMENTO.** Abaixo do mínimo ⇒ **"não medido"** (S1), **nunca nota baixa**. Sem isso o índice **pune o cliente organizado que registra perdas e premia o desorganizado que não registra nada.**

### D10 · Dados e governança — 7

| id | Fonte contratada | Onde / campo | Selo |
|---|---|---|---|
| `SD-GOV-01` origem do lead registrada | CRM do cliente + UTM | ⚠️ taxa de leads com origem preenchida | 🟡 `depois` |
| `SD-GOV-02` **conversão verificável** | 🟢 GA4 — auditoria do que é `keyEvent` | 🔴 **já tem achado: CVR de 36–61% é implausível** | 🟢 **`v0.1`** |
| `SD-GOV-03` **rastreamento íntegro** | 🟢 GA4 + Ads — confronto de sessões pagas × gasto | 🔴 **já tem achado: 2 sessões pagas em 7 dias com gasto diário** | 🟢 **`v0.1`** |
| `SD-GOV-04` CRM adotado de fato | CRM do cliente — taxa de preenchimento | 🔴 **pré-requisito do D9 inteiro** | 🟡 `depois` |
| `SD-GOV-05` consentimento e privacidade | inspeção do site + modo de consentimento | ⚠️ humano | 🟡 `depois` |
| `SD-GOV-06` backup e recuperação | checklist humano | ficha | 🟡 `depois` |
| `SD-GOV-07` **a orientação funcionou?** | 🟢 Notion Log de Otimizações + `phi_score_history` | metade de escrita existe (ADR-22); **falta a de verificação** | 🟡 `depois` |

> 🟢 **`-02` e `-03` sobem para a v0.1 e viram os dois primeiros indicadores de governança da casa** — porque a Fase 0 **já produziu o achado de cada um**. Eles não precisam ser construídos para existir: **precisam ser apurados.** E são pré-requisito do D6 e do D8.

---

## 3. Placar do contrato

| Selo | Quantos |
|---|--:|
| 🟢 **`v0.1`** | **24** |
| 🟡 `depois` | **56** |
| ⬜ `não coletamos` | **5** |
| 🔧 `ferramenta` (Clarity) | **5** ⚠️ o `SD-EXP-04` conta nos dois papéis |
| **Total** | **92** |

**As 24 da v0.1, por fonte:**

| Fonte | Indicadores |
|---|--:|
| **Google Ads (GAQL) + derivadas** | 11 |
| **GA4 Data API** | 7 |
| **Notion (cadastro, não integração)** | 2 |
| **PageSpeed / CrUX** | 1 |
| **Teste humano** | 3 |

> 🔴 **O que este placar diz, e é a virada do dia:** **três fontes** entregam 21 dos 24. **Nenhuma delas é nova** — Google Ads, GA4 e PageSpeed já estão em produção na casa. **O trabalho da v0.1 não é integrar: é ler, dar grão e dar leitor.**

---

## 4. O que precisa acontecer ANTES de pontuar — na ordem

| # | Pré-requisito | Por quê |
|---|---|---|
| **1** | 🔴 Apurar os `key_events` do GA4 (`SD-GOV-02`) | CVR de 36–61% é implausível. **Trava `SD-CVR-05`** |
| **2** | 🔴 Apurar a atribuição do pago (`SD-GOV-03`) | 2 sessões em 7 dias com gasto diário. **Trava metade do D6 e do D8** |
| **3** | Apurar `search_terms = "error"` com `pct_*` cheios | **Trava `SD-AQU-13`** |
| **4** | Preencher `margem_contribuicao_pct` e `ticket_ltv` na DB Clientes | **É cadastro.** Destrava 2 indicadores de núcleo |
| **5** | Confirmar o nome do campo de tempo de engajamento no GA4 | **Regra 1.** Sem isso `SD-EXP-05` não se coleta |
| **6** | Estender o `Vigia de Frescor` às tabelas `t28` | 🔴 Clarity e GA4 pararam em **06/09** e ninguém viu. **Sem vigia, o índice lê tabela morta** |
| **7** | Verificar se o script da Clarity está instalado | Se não estiver, a ferramenta não serve nem ao novo papel |

> 🔴 **O item 6 é o mais urgente do documento, e não é do índice.** Existe sem ele. **Um índice que lê tabela morta nasce mentindo**, e hoje a casa não tem como saber que a tabela morreu.

---

## 5. Decisões do Olavo — 2026-09-25

**Seis das sete pendências foram decididas no mesmo dia.** Ficam registradas aqui e valem para a construção.

| # | Decisão | Estado |
|---|---|---|
| **2** | 🟢 **O pilar Experiência entra como ALERTA, não como nota ponderada** (S5) | ✅ **decidido** |
| **3** | 🟢 `SD-EXP-06` rejeição: **coletar e exibir, não pontuar** — é `1 − engagementRate` | ✅ **decidido** |
| **4** | 🟢 **Taxa de preenchimento obrigatória em todo indicador de D9.** Abaixo do mínimo ⇒ *"não medido"* (S1), nunca nota baixa | ✅ **decidido** |
| **5** | 🟢 Faixas de frustração traduzidas como **`T` = 1% · `U` = 10%** | ✅ **decidido** · ⚠️ **em reserva**: a frustração virou 🔧 ferramenta, então hoje **não há indicador que use estes limites**. Ficam escritos para quando houver |
| **6** | 🟢 Os cinco **`não coletamos`** (`SD-DES-07`, `-08`, `-09`, `SD-REP-08`) são **decisão, não lacuna** | ✅ **decidido** |
| **7** | 🟢 Este documento **continua organizado por DIMENSÃO**. A estrutura nominal dos pilares segue aberta (ADR-41 §4 item 6) e **não bloqueia nada** | ✅ **decidido** |
| **1** | 🔴 **Terceira fórmula de normalização para indicador `⊙` (alvo)** | ⛔ **NÃO RESPONDIDA.** Ver abaixo |

### 5.1. 🔴 A única que segue aberta — e ela bloqueia

O **D5 do ADR-41** define fórmula para indicador **positivo** e **negativo**. **Não define para `⊙` (alvo).**

**São 11 dos 92**, e entre eles o `SD-EXP-07` (taxa de engajamento) — 🔴 **o único indicador de D6 com dado real hoje**, e que a régua do Olavo tornou alvo ao dizer que *"acima de 90% é suspeito"*.

| Os 11 indicadores de alvo | |
|---|---|
| `SD-EXP-04` profundidade de scroll · `SD-EXP-07` engajamento · `SD-EXP-08` Core Web Vitals | D6 |
| `SD-AQU-01` investimento · `-07` métrica-mãe · `-09` conjuntos · `-10` criativo · `-13` composição de termos · `-14` Meta | D7 |
| `SD-CVR-14` LTV:CAC | D8 |
| `SD-REP-06` distribuição de notas · `SD-REL-10` motivos de perda | D4 / D9 |

> 🔴 **Sem a terceira fórmula, nenhum dos 11 pode ser normalizado** — e o pilar Experiência não fecha nem como alerta, porque alerta também precisa saber o que é "fora da faixa".
>
> **É lacuna da decisão, não detalhe de implementação.** Aguarda autorização do Olavo para eu escrever o adendo ao ADR-41.

### 5.2. ✅ Consolidação feita — ADR-42 (rascunho)

As seis decisões **e** a fórmula de alvo foram consolidadas em `adr-rascunhos/ADR-42-normalizacao-de-alvo-e-consolidacao-das-decisoes-de-25-09.md` — adendo ao ADR-41, **aguardando aprovação**.

### 5.3. Nota histórica

As seis decisões acima **refinam o ADR-41** e hoje moram só aqui e no `REGUAS-D6-D9-v0.md`. **Elas precisam virar um adendo único ao ADR-41**, junto com a fórmula de `⊙` — senão repetimos o defeito que a R2 nomeia: decisão que existe no corpo de um documento e não no lugar onde se procura.

## 6. Como verificar este documento

| O que | Como |
|---|---|
| Que a Clarity está zerada | execução `43060` — 15 linhas, `sessions`/`rage`/`dead` = 0 |
| Que o GA4 tem dado real | execução `43061` — orgânico 26–56 sessões, engajamento 0,64–0,81 |
| Que o pago tem 2 a 5 sessões | mesma execução |
| Que `impression_share` existe e está vazia | execução `43038` (schema) + `43040` (contagem) |
| Que `pct_*_terms` está 304/304 | execução `43040` |
| Que `top_search_terms` nunca foi escrita | execução `43040` — 0 não-nulos |
| 🔴 **O que NÃO está verificado** | **todo nome de campo marcado `⚠️`.** São ~25. Nenhum foi conferido contra a API viva, e **nenhum pode ser usado sem conferir** (Regra 1) |

**Confiança na estrutura e nos selos: 0,85.** **Nos nomes de campo `⚠️`: baixa de propósito — é por isso que estão marcados.** Onde não havia fonte, escrevi `não coletamos` em vez de inventar.
