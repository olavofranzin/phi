# Dicionário de Indicadores — Saúde Digital do Negócio · **v0**

| | |
|---|---|
| **Status** | 🟢 **CANÔNICO** — por decisão do Olavo em 2026-09-25: *"o documento que sair daqui é que será considerado canônico"* |
| **O que é** | a **Versão 0** que a `Metodologia Estatística` §Plano de implantação exige: finalidade, estrutura, **dicionário de indicadores**, duplicidades eliminadas e regras de evidência |
| **Precedência** | 🔴 **Esta frente se sobrepõe ao que estava em andamento.** As regras e normas anteriores **deixam de ser fixas** e passam a ser lidas à luz do material novo (Olavo, 25/09). Ver §0.2 |
| **O que ele NÃO decide** | ⛔ **os pesos e a estrutura de pilares** — decisão adiada pelo Olavo em 25/09 ("mapa v2 primeiro"). Ver §2 |
| **Próximo** | os workflows da área **serão construídos ou reformados** — depois deste dicionário e do ADR, nunca antes (R7) |
| **ADR** | 🟡 **`adr-rascunhos/ADR-41-…md`** (2026-09-25, RASCUNHO) propõe a camada 3 que este dicionário deixou em aberto: **pesos iguais provisórios**, **cobertura declarada** e **peso só para pilar com fonte**. **Se aprovado, o §2 deste documento deixa de estar em aberto** |
| **Base lida** | `fundamentos-presenca-digital.md` · `Análise Estatística.md` · `Metodologia Estatística…md` · **`docs/handoff/2026-09-25-substrato-estatistico-do-phi-brief.md`** (o substrato — ver §3.11 e §3.12) · ADR-21/22/29 · `CONTRATO-PHI.md` · spec T28 · ADR-23 · os 4 JSON de workflow |

---

## 0.1. Por que este documento pode existir com os pilares em aberto

**Porque pilar e indicador são camadas diferentes, e só a de cima está indefinida.**

```
 CAMADA 3 — PILARES e PESOS ........ ⛔ EM ABERTO (4 candidatos, §2)
 CAMADA 2 — DIMENSÕES .............. o que se verifica
 CAMADA 1 — INDICADORES ............ este documento
 CAMADA 0 — FONTE .................. tabela, coluna, API, observação
```

**Nenhum indicador muda de definição porque o peso de um pilar mudou.** `gbp_maps_views` é o mesmo número se Visibilidade pesar 15, 20 ou 12,5. O que muda é **onde ele soma** — e isso é a camada 3.

> 🔴 **A consequência prática, e ela é boa:** o trabalho de dicionário **não está bloqueado** pela decisão de pesos. E o inverso também vale — **a decisão de pesos fica mais fácil depois dele**, porque só aqui se descobre que um pilar candidato tem 9 indicadores prontos e outro tem zero. **Ponderar um pilar que não se consegue medir é decidir no escuro.**

## 0.2. O que "as regras não são fixas" significa — e o que ela NÃO significa

O Olavo disse que as normas atuais não podem ser tratadas como fixas. Para isso não virar licença para apagar história, aplico a regra de precedência que o `PLANO-ENTREGA-FINAL-PHI.md` §3.3.3 já tinha escrito:

| ✅ Passa a ser revisável | ⛔ Continua valendo até este documento dizer o contrário, por escrito |
|---|---|
| a estrutura de pilares do **ADR-21** (6 pilares, Paga 35) | **o que está NO AR.** Nenhum workflow, tabela ou coluna muda nesta rodada |
| os pesos, as faixas e os nomes de classe | **R7** — nada se constrói sem plano aprovado |
| os **14 critérios** e a data **30/11** da `DEFINICAO-DE-PRONTO` | os **guardrails de dado**: M4 (zero nunca é ausência), `volume_suficiente`, `source_status` |
| a lista de tabelas e o desenho dos workflows | **M8** — o PHI detecta, classifica e orienta; **nunca executa** |
| o `CONTRATO-PHI.md` como *alvo* | o `CONTRATO-PHI.md` §4 como **as-built** — é o retrato do que roda, e retrato não se revoga por decisão |

🔴 **E uma consequência que precisa ser dita em voz alta:** se a data de 30/11 deixa de ser fixa, **duas frentes que dependiam dela ficam sem calendário** — a Prospecção (critérios P1–P9) e o ADR-39+40, que está em execução por outro sub-chat. **Isto não é problema deste documento resolver, mas é problema deste documento registrar.** Ver §7.

---

## 1. Finalidade e público

| | |
|---|---|
| **O que o índice mede** | *"a capacidade da empresa de ser encontrada, transmitir confiança, gerar demanda, converter oportunidades, manter relacionamento e medir seus resultados por meio de canais, dados e processos digitais integrados"* — `Análise Estatística` §Definição recomendada |
| **Natureza** | 🔴 **formativo**, não reflexivo. Os componentes **compõem** a saúde; não são manifestações de um traço único. Consequência estatística: **alfa de Cronbach e PCA não servem para validar o índice global** (`Metodologia` §Natureza do índice) |
| **Unidade de análise** | 🔴 **o NEGÓCIO do cliente** — não a campanha. É a mudança de grão que a reformulação introduz: o `phi_value` é por `(client_id, platform, campaign_id, date)`; este índice é por `(client_id, período)` |
| **Público** | (1) o gestor, para agir · (2) o cliente, para entender e comprar · (3) a agência, para acumular série |
| **Nome** | **"Saúde Digital do Negócio"**, nunca "Saúde Digital" sozinho — o termo isolado é do setor médico, e a agência prospecta clínicas e dentistas (`Análise Estatística` §Cuidados com o termo). ⚠️ O **ADR-21** já havia decidido "Saúde Digital" para o todo e **PHI·Mídia** para a parte paga: os dois nomes sobrevivem, com o sufixo "do Negócio" acrescentado |

---

## 2. ⛔ As quatro estruturas de pilares — em aberto

**Quatro tabelas de peso incompatíveis existem hoje na casa.** Nenhuma é descartada aqui.

| Candidata | Onde | Estrutura | Pesos |
|---|---|---|---|
| **A** | **ADR-21** (Notion, **Aceito 11/06/2026**) | 6 pilares | Paga **35** · Funil 20 · Orgânico 15 · Social 10 · Reputação 10 · Dados/Exp 10 |
| **B** | `Análise Estatística` §Score recomendado | 7 dimensões | Descoberta 20 · Confiança 15 · Infra+Exp 15 · Conteúdo 10 · Paga 10 · **Conversão 20** · Dados 10 |
| **C** | `Análise Estatística` §Índice de saúde **= `fundamentos-presenca-digital.md`** | 8 pilares | 10 · 15 · 10 · 10 · 10 · 15 · **20** · 10 |
| **D** | `Metodologia Estatística` §Arquitetura final | 8 pilares | 🔴 **iguais** (12,5 cada) na versão piloto |

> ⚠️ **B e C estão no mesmo documento e não batem entre si.** E a **D** abre dizendo: *"Não é recomendável começar atribuindo pesos 'intuitivos' e simplesmente somando notas."* — o que desqualifica A, B e C **como ponto de partida**, não como destino.

**O que eu registro sem decidir:**

1. **A candidata A é a única que é lei hoje** — e foi esquecida por três meses e meio. Qualquer escolha das outras **precisa de um ADR que a supersede explicitamente**, com a razão escrita (R2: o histórico ganha banner, não é apagado).
2. **A candidata D não é uma quinta estrutura** — é uma regra sobre *quando* ponderar. Ela é compatível com B ou C: adota-se a lista de pilares de uma, com pesos iguais até haver dado.
3. 🔴 **A diferença que mais importa não é de peso, é de ORDEM DE GRANDEZA.** Na A, mídia paga é **35**. Na B e C, é **10–15**. *A mesma agência, medindo o mesmo cliente, chegaria a notas muito diferentes.* Isso não se resolve por gosto: resolve-se pela §331 da `Metodologia` — **análise de sensibilidade**, que compara os esquemas antes de escolher.

### A grade de trabalho deste dicionário — neutra de propósito

Para organizar os indicadores **sem escolher pilar**, uso as **10 dimensões** do `fundamentos-presenca-digital.md`, porque elas são **unidades de verificação** ("o que se verifica"), não unidades de ponderação. A coluna final de cada tabela mostra a qual pilar o indicador iria **em cada candidata**.

---

## 3. O DICIONÁRIO

### Como ler as colunas

| Coluna | O que diz |
|---|---|
| **id** | identificador estável. **Nunca é reaproveitado**, mesmo se o indicador sair |
| **dir** | ↑ = maior é melhor · ↓ = menor é melhor · ⊙ = alvo (nem alto nem baixo) · ☑ = binário/checklist |
| **onde está hoje** | 🟢 coluna existente com dado · 🟡 coluna existente **sem** dado · 🔴 não existe na casa |
| **leitor** | quem consome hoje — ou **ninguém** (é o **M11**) |
| **tier** | 🅐 **núcleo** = sem ele o índice não fecha, e a casa já tem a maior parte · 🅑 **extensão** = real, mas depois · 🅧 **fora** = não entra sem decisão comercial nova |

> 🔴 **O tier substitui o "v1 / depois / nunca" do mapa de 24/09.** Aquele eixo era o calendário de 30/11, que o Olavo acabou de destravar. **Mas o risco de o escopo explodir não foi destravado** — 8 pilares × 10 dimensões × dezenas de métricas continua sendo grande demais para uma rodada. O tier é o mesmo freio com outro apoio: em vez de perguntar *"cabe até 30/11?"*, pergunta **"o índice fecha sem ele?"**

---

### D1 · Infraestrutura

| id | Indicador | dir | Fonte | Onde está hoje | Leitor | Tier |
|---|---|---|---|---|---|---|
| `SD-INF-01` | Site próprio existe e responde | ☑ | HTTP | 🟡 `leads.site` — **só de lead**, não de cliente | `PROSP-03` | 🅐 |
| `SD-INF-02` | Tipo do ativo principal (site próprio × rede social × nenhum) | ☑ | classificação | 🟡 `leads.site_tipo` · Odoo `gbp_site_tipo` — **só de lead** | `PROSP-03` | 🅐 |
| `SD-INF-03` | HTTPS válido e sem aviso | ☑ | HTTP/TLS | 🔴 **não existe** | — | 🅐 |
| `SD-INF-04` | Perfil GBP reivindicado | ☑ | Places/Apify | 🟡 `leads.nao_reivindicado` — **só de lead** | `PROSP-03` | 🅐 |
| `SD-INF-05` | Rastreamento instalado (GA4 respondendo para o cliente) | ☑ | GA4 API | 🟢 **implícito**: `t28_ga4_landing` com linha prova que GA4 responde | ninguém | 🅐 |
| `SD-INF-06` | Propriedade dos ativos (domínio, conta de anúncio, GBP, GA4) | ☑ | inventário humano | 🟡 checklist do `L1 - Abertura de Projeto Tecnico Setup` — **sem coluna, sem nota** | humano | 🅐 |
| `SD-INF-07` | Páginas indexadas | ↑ | Search Console | 🔴 **não existe** — GSC não está ligado a nada | — | 🅑 |
| `SD-INF-08` | Ativos órfãos, duplicados ou abandonados | ↓ | inventário humano | 🔴 **não existe** | — | 🅑 |

> **Onde iria:** A → *(sem pilar próprio; cairia em Dados/Exp)* · B → Infra+Exp · C → Presença e infraestrutura · D → Presença e infraestrutura.
> 🔴 **Achado:** na candidata **A (a que é lei)**, este bloco inteiro **não tem pilar**. Seis dos 8 indicadores são 🅐. É a maior lacuna estrutural do ADR-21.

### D2 · Descoberta

| id | Indicador | dir | Fonte | Onde está hoje | Leitor | Tier |
|---|---|---|---|---|---|---|
| `SD-DES-01` | Impressões no GBP | ↑ | GBP API | 🟡 `t28_gbp_daily.gbp_impressions` — **tabela vazia, cota** | ninguém | 🅐 |
| `SD-DES-02` | Visualizações na Busca | ↑ | GBP API | 🟡 `t28_gbp_daily.gbp_search_views` — vazia | ninguém | 🅐 |
| `SD-DES-03` | Visualizações no Maps | ↑ | GBP API | 🟡 `t28_gbp_daily.gbp_maps_views` — vazia | ninguém | 🅐 |
| `SD-DES-04` | Sessões orgânicas do Google | ↑ | GA4 | 🟢 `t28_ga4_landing` com `canal='google_organic'` — **escreveu em 14/09** | 🔴 ninguém | 🅐 |
| `SD-DES-05` | Cliques e impressões orgânicas | ↑ | Search Console | 🔴 **não existe** | — | 🅑 |
| `SD-DES-06` | Posição média para termos comerciais | ↓ | Search Console | 🔴 **não existe** para cliente. 🟡 `leads.Posição Pesquisa` é **posição no Maps de UMA busca**, de lead | `PROSP-03` | 🅑 |
| `SD-DES-07` | Índice de Visibilidade Local multi-busca | ↑ | Places, N buscas | 🔴 **desenhado e nunca construído** — `roadmap-expansao/gbp-motor-scoring-ipc-design.md` | — | 🅑 |
| `SD-DES-08` | Share of Voice vs concorrentes | ↑ | Places / Ad Library | 🔴 **não existe** | — | 🅑 |
| `SD-DES-09` | Citações em respostas de IA | ↑ | Bing WMT / manual | 🔴 **não existe** | — | 🅧 |

> **Onde iria:** A → Orgânico (15) + Reputação · B → Descoberta (20) · C → Visibilidade orgânica e local (15) · D → Visibilidade.

### D3 · Consistência

| id | Indicador | dir | Fonte | Onde está hoje | Leitor | Tier |
|---|---|---|---|---|---|---|
| `SD-CON-01` | Nome igual entre GBP, site e diretórios | ☑ | comparação | 🔴 **não existe** | — | 🅐 |
| `SD-CON-02` | Telefone igual entre canais | ☑ | comparação | 🔴 **não existe** | — | 🅐 |
| `SD-CON-03` | Endereço igual entre canais (NAP) | ☑ | comparação | 🔴 **não existe** — NAP só aparece como **texto de rubrica** | — | 🅐 |
| `SD-CON-04` | Horário preenchido e coerente | ☑ | GBP | 🟡 `leads.Horário` — **só de lead** | `PROSP-03` | 🅐 |
| `SD-CON-05` | Categoria principal adequada + secundárias | ☑ | GBP | 🟡 `leads.Categoria 1/2` — **só de lead** | `PROSP-03` | 🅑 |

> 🔴 **Esta dimensão é o buraco que nenhuma das quatro candidatas nomeia.** Em A, B, C e D ela é absorvida por outro pilar. **Três dos cinco indicadores são 🅐 e nenhum existe** — e ninguém na casa jamais sentiu falta. É a dimensão de menor custo de coleta e maior invisibilidade.

### D4 · Reputação

| id | Indicador | dir | Fonte | Onde está hoje | Leitor | Tier |
|---|---|---|---|---|---|---|
| `SD-REP-01` | Nota média | ↑ | GBP | 🟡 `t28_gbp_daily.gbp_reviews_avg_rating` — vazia · 🟡 `leads.Avaliação` de lead | ninguém | 🅐 |
| `SD-REP-02` | Volume de avaliações | ↑ | GBP | 🟡 `t28_gbp_daily.gbp_reviews_count` — vazia · 🟡 `leads.Quantidade reviews` | ninguém | 🅐 |
| `SD-REP-03` | Avaliações recentes (recência) | ↑ | GBP | 🔴 **não existe** — nem a coluna, nem a de lead | — | 🅐 |
| `SD-REP-04` | **% de avaliações respondidas** | ↑ | GBP | 🔴 **não existe como número.** Só como julgamento qualitativo da IA em `dim_engajamento` | — | 🅐 |
| `SD-REP-05` | Tempo de resposta a avaliação | ↓ | GBP | 🔴 **não existe** | — | 🅑 |
| `SD-REP-06` | Distribuição das notas 1–5★ | ⊙ | GBP | 🔴 **não existe** | — | 🅑 |
| `SD-REP-07` | Reclamações recorrentes (temas) | ↓ | GBP + LLM | 🔴 **não existe** | — | 🅑 |
| `SD-REP-08` | Menções e citações externas | ↑ | busca | 🔴 **não existe** | — | 🅧 |

> ⚠️ **`SD-REP-01/02` são o caso mais claro de esforço quase zero:** a coluna existe, o workflow existe, o nó existe. **Falta destravar a cota do GBP.** Os dois vêm na mesma chamada de API que D2.

### D5 · Conteúdo

| id | Indicador | dir | Fonte | Onde está hoje | Leitor | Tier |
|---|---|---|---|---|---|---|
| `SD-CNT-01` | Quantidade de fotos no GBP | ↑ | GBP | 🟡 `leads.Quantidade fotos` — **só de lead** | `PROSP-03` | 🅑 |
| `SD-CNT-02` | Postagens no GBP e frequência | ↑ | GBP | 🟡 `leads.Posts` (`ownerUpdates`) — **só de lead** | `PROSP-03` | 🅑 |
| `SD-CNT-03` | Alcance de **não seguidores** | ↑ | IG Graph | 🔴 **não existe** | — | 🅧 |
| `SD-CNT-04` | Compartilhamentos ÷ alcance | ↑ | IG Graph | 🔴 **não existe** | — | 🅧 |
| `SD-CNT-05` | Salvamentos ÷ alcance | ↑ | IG Graph | 🔴 **não existe** | — | 🅧 |
| `SD-CNT-06` | Retenção média de vídeo | ↑ | IG Graph | 🔴 **não existe** | — | 🅧 |
| `SD-CNT-07` | Visitas ao perfil social | ↑ | IG Graph | 🔴 **não existe** | — | 🅧 |

> 🔴 **Sete indicadores, cinco 🅧.** Rede social orgânica exige **credencial por cliente** e um score próprio de 9 dimensões (`Análise Estatística` §Score para redes). **Entrar nisso é abrir uma segunda frente, não um pilar.** Na candidata A ele vale 10; na C, 10. **[DEDUZO] ponderar 10 pontos num pilar de que a casa não tem um único dado é a definição de decidir no escuro.**

### D6 · Experiência

| id | Indicador | dir | Fonte | Onde está hoje | Leitor | Tier |
|---|---|---|---|---|---|---|
| `SD-EXP-01` | Rage clicks | ↓ | Clarity | 🟢 `t28_clarity_daily.clarity_rage_clicks` — **escreveu 14/09** | 🔴 ninguém | 🅐 |
| `SD-EXP-02` | Dead clicks | ↓ | Clarity | 🟢 `t28_clarity_daily.clarity_dead_clicks` | 🔴 ninguém | 🅐 |
| `SD-EXP-03` | Scroll excessivo | ↓ | Clarity | 🟢 `t28_clarity_daily.clarity_excessive_scroll` | 🔴 ninguém | 🅑 |
| `SD-EXP-04` | Profundidade média de scroll | ⊙ | Clarity | 🟢 `t28_clarity_daily.clarity_avg_scroll_depth` | 🔴 ninguém | 🅑 |
| `SD-EXP-05` | Duração média da sessão | ↑ | Clarity / GA4 | 🟢 `clarity_avg_session_sec` · `t28_ga4_landing.avg_session_duration_sec` | 🔴 ninguém | 🅐 |
| `SD-EXP-06` | Taxa de rejeição por landing | ↓ | GA4 | 🟢 `t28_ga4_landing.bounce_rate` | 🔴 ninguém | 🅐 |
| `SD-EXP-07` | Taxa de engajamento | ↑ | GA4 | 🟢 `t28_ga4_landing.engagement_rate` | 🔴 ninguém | 🅐 |
| `SD-EXP-08` | **Core Web Vitals** (LCP ≤2,5s · INP <200ms · CLS <0,1) | ⊙ | PageSpeed | 🟡 **existe para LEAD** (`PROSP-04` mede HTML+PageSpeed → `enriquecimento_site`). 🔴 **não existe para cliente** | `PROSP-03`/IA | 🅐 |
| `SD-EXP-09` | Site abre e funciona no celular — **teste real** | ☑ | humano/navegador | 🔴 **não existe.** A casa nunca fez teste real | — | 🅑 |
| `SD-EXP-10` | Formulário enviado chega ao destino — **teste real** | ☑ | humano | 🔴 **não existe** | — | 🅑 |

> 🔴 **Sete indicadores 🟢 nesta dimensão, e leitor em nenhum.** É a dimensão mais bem instrumentada da casa e a menos usada. Na candidata A ela é o pilar **Funil (20)** — o segundo maior. **O dado do segundo maior pilar do ADR-21 está em produção, escrevendo, e ninguém lê.**
> ⚠️ **E o `SD-EXP-08` é a assimetria mais estranha do inventário:** a casa mede Core Web Vitals **de quem ainda não é cliente** e não mede **de quem já é**.

### D7 · Aquisição

| id | Indicador | dir | Fonte | Onde está hoje | Leitor | Tier |
|---|---|---|---|---|---|---|
| `SD-AQU-01` | Investimento | ⊙ | Google/Meta Ads | 🟢 `raw_campaign_data.cost` · `t28_campaign.cost` | Pipeline_v2, T28 | 🅐 |
| `SD-AQU-02` | Impressões | ↑ | Ads | 🟢 `raw_campaign_data.impressions` | Pipeline_v2 | 🅐 |
| `SD-AQU-03` | Cliques | ↑ | Ads | 🟢 `raw_campaign_data.clicks` | Pipeline_v2 | 🅐 |
| `SD-AQU-04` | CTR | ↑ | derivada | 🟢 `t28_campaign.ctr` | T28 | 🅐 |
| `SD-AQU-05` | CPC | ↓ | derivada | 🟢 `t28_campaign.cpc` | T28 | 🅐 |
| `SD-AQU-06` | CPM | ↓ | derivada | 🟢 `t28_campaign.cpm` | T28 | 🅐 |
| `SD-AQU-07` | **Métrica-Mãe da campanha** (CPA/ROAS/CPL…) | ⊙ | objetivo | 🟢 `raw_campaign_data.primary_metric_type` + `phi_score_history.primary_metric_type` (ADR-40) | Pipeline_v2 | 🅐 |
| `SD-AQU-08` | **PHI·Mídia** (score 0–100 da campanha) | ↑ | motor | 🟢 `phi_score_history.phi_value` | Notion, T28 | 🅐 |
| `SD-AQU-09` | Métricas por **conjunto** | ⊙ | GAQL | 🟢 `t28_adset` · Notion *Conjuntos de Anúncios* | T28, Notion | 🅐 |
| `SD-AQU-10` | Métricas por **anúncio** / criativo | ⊙ | GAQL | 🟡 `t28_adset.criativos_json` (por design) · 🔴 `raw_ad_data` **0 linhas** — morre no `IF Gate PMAX` | T28 | 🅐 |
| `SD-AQU-11` | Participação de impressões (impression share) | ↑ | GAQL | 🟡 **coletado e descartado** — a spec T28 §4 diz *"parar de descartar"*; não há coluna | — | 🅑 |
| `SD-AQU-12` | Aquisição **orgânica** (sessões, conversões) | ↑ | GA4 | 🟢 `t28_ga4_landing` com `source='organico'` | 🔴 ninguém | 🅐 |
| `SD-AQU-13` | Termos de busca — composição (marca × problema) | ⊙ | GAQL + Gemini | 🟢 **calculado em runtime, não persistido** — por decisão do **ADR-29 D5** (termos são sensíveis) | Agregador | 🅐 |
| `SD-AQU-14` | Meta Ads (alcance, frequência, leads) | ⊙ | Meta API | 🔴 `t28_meta_campaign` **vazia** — o nó `Fetch Meta Ads` está **DISABLED** | — | 🅑 |

> **Onde iria:** A → Paga **35** + Orgânico 15 · B → Paga 10 · C → Aquisição 15 · D → Aquisição.
> 🔴 **É aqui que a diferença entre as candidatas mais dói:** este bloco é **o que a casa sabe fazer**. Na A vale 35; na B, 10. **Escolher B ou C reduz a nota do que funciona e aumenta o peso do que não existe** — o que pode ser correto, mas é uma decisão de negócio, não de método.

### D8 · Conversão

| id | Indicador | dir | Fonte | Onde está hoje | Leitor | Tier |
|---|---|---|---|---|---|---|
| `SD-CVR-01` | Conversões da plataforma | ↑ | Ads | 🟢 `raw_campaign_data.conversions` | Pipeline_v2 | 🅐 |
| `SD-CVR-02` | CPA / CPL | ↓ | derivada | 🟢 `t28_campaign.cpa` · `t28_meta_campaign.cpl` | T28 | 🅐 |
| `SD-CVR-03` | ROAS | ↑ | derivada | 🟢 `t28_campaign.roas` (⚠️ depende de `revenue`) | T28 | 🅐 |
| `SD-CVR-04` | Receita | ↑ | Ads | 🟡 `raw_campaign_data.revenue` — **a única coluna que se perde** ao aposentar o 2º writer (ADR-38 etapa 8) | T28 | 🅐 |
| `SD-CVR-05` | **Conversões de SITE** (key events) | ↑ | GA4 | 🟢 `t28_ga4_landing.conversions` + `key_events` | 🔴 ninguém | 🅐 |
| `SD-CVR-06` | Cliques no site pelo GBP | ↑ | GBP | 🟡 `t28_gbp_daily.gbp_website_clicks` — vazia | ninguém | 🅐 |
| `SD-CVR-07` | Ligações pelo GBP | ↑ | GBP | 🟡 `t28_gbp_daily.gbp_phone_calls` — vazia | ninguém | 🅐 |
| `SD-CVR-08` | Solicitações de rota | ↑ | GBP | 🟡 `t28_gbp_daily.gbp_direction_requests` — vazia | ninguém | 🅐 |
| `SD-CVR-09` | Cliques no WhatsApp | ↑ | GA4 / GBP | 🔴 **não existe** isolado | — | 🅐 |
| `SD-CVR-10` | Conversas iniciadas | ↑ | WhatsApp/IG | 🔴 **não existe** | — | 🅑 |
| `SD-CVR-11` | **Formulário chega ao CRM** — teste real ponta a ponta | ☑ | humano | 🔴 **não existe** | — | 🅑 |
| `SD-CVR-12` | Margem de contribuição | ↑ | Notion Clientes | 🟢 `t28_campaign.margem_contribuicao_pct` (vem da DB Clientes) | T28 | 🅐 |
| `SD-CVR-13` | Ticket / LTV | ↑ | Notion Clientes | 🟢 DB Clientes `Ticket/LTV` | Agregador | 🅑 |
| `SD-CVR-14` | CAC e LTV:CAC | ⊙ | derivada | 🔴 **`null` por design** — falta `custos_aquisicao_extra` (spec T28 §9) | — | 🅑 |

> ⚠️ **`SD-CVR-04` (receita) merece atenção:** o as-built de 24/09 identificou que é **a única coluna que se perde** ao aposentar o segundo writer de `raw_campaign_data`. Sem ela, `SD-CVR-03` (ROAS) fica indefinido. **Um indicador 🅐 depende de uma decisão de aposentadoria já planejada.**

### D9 · Relacionamento — 🔴 o pilar de peso 20, e está em zero

| id | Indicador | dir | Fonte | Onde está hoje | Leitor | Tier |
|---|---|---|---|---|---|---|
| `SD-REL-01` | 🔴 **Tempo até a primeira resposta** | ↓ | CRM/WhatsApp do cliente | 🔴 **não existe em lugar nenhum da casa** | — | 🅐 |
| `SD-REL-02` | Taxa de contato (lead alcançado) | ↑ | CRM do cliente | 🔴 **não existe** | — | 🅐 |
| `SD-REL-03` | Taxa de qualificação | ↑ | CRM do cliente | 🔴 **não existe** | — | 🅑 |
| `SD-REL-04` | Agendamentos | ↑ | agenda do cliente | 🔴 **não existe** | — | 🅐 |
| `SD-REL-05` | 🔴 **Comparecimento / no-show** | ↑/↓ | agenda do cliente | 🔴 **não existe** | — | 🅐 |
| `SD-REL-06` | Taxa de fechamento | ↑ | CRM do cliente | 🔴 **não existe** | — | 🅑 |
| `SD-REL-07` | Recompra / retorno | ↑ | CRM do cliente | 🔴 **não existe** | — | 🅑 |
| `SD-REL-08` | Clientes reativados | ↑ | CRM do cliente | 🔴 **não existe** | — | 🅑 |
| `SD-REL-09` | Ocupação em dias fracos | ↑ | agenda do cliente | 🔴 **não existe** | — | 🅑 |
| `SD-REL-10` | Motivos de perda | ⊙ | CRM do cliente | 🔴 **não existe** | — | 🅑 |

> 🔴 **⚠️ A armadilha que precisa ficar escrita, porque é fácil cair nela:** o **CRM Odoo** (`phi_crm`) tem `motivo_perda`, `dias_no_funil`, `probabilidade`, `acerto_previsao`. **Nada disso serve aqui.** Aquele é o CRM da **agência vendendo para leads** — não o CRM do **cliente atendendo os clientes dele**. Confundir os dois faria o índice medir a saúde comercial da agência e chamar de saúde do cliente.
>
> **E nem no funil da própria agência a casa mede interação:** `num_interacoes` e `ultimo_contato` estão **vazias por decisão registrada** — não há equivalente em `crm.lead` (`CONTRATO-PROSPECCAO` §"Campos sem par").
>
> 🟢 **Mas a lista de indicadores desta dimensão já estava escrita na casa** — `Análise Estatística de Mercado (2026–2030)` §"Métricas que diferenciam": *"Tempo até primeira resposta · Taxa de contato, qualificação, agendamento, comparecimento e fechamento · Motivos de perda e recuperação · Receita reativada e recompra"*. **Meses antes do material novo.**
>
> 🔴 **O ponto duro:** dos 10 indicadores, **10 não existem**, e **nenhum é problema de API** — o dado mora no WhatsApp, no telefone e na agenda do cliente. É problema de **acesso e de procedimento**, e o eixo da operação já tem dono: o `Board Agência` no Miro.

### D10 · Dados e governança

| id | Indicador | dir | Fonte | Onde está hoje | Leitor | Tier |
|---|---|---|---|---|---|---|
| `SD-GOV-01` | Origem do lead registrada | ↑ | CRM/UTM | 🟡 `leads.via_aquisicao` — **do funil da agência** | `PROSP-06` | 🅐 |
| `SD-GOV-02` | Conversão verificável (evento configurado no alvo certo) | ☑ | Ads/GA4 | 🟡 conceito existe no **Guardião (ADR-29)**; sem coluna | — | 🅐 |
| `SD-GOV-03` | Rastreamento íntegro (pixel + API de conversão) | ☑ | Ads/GA4 | 🔴 **não existe** | — | 🅐 |
| `SD-GOV-04` | CRM adotado de fato pelo cliente | ☑ | observação | 🔴 **não existe** | — | 🅑 |
| `SD-GOV-05` | Consentimento e privacidade | ☑ | observação | 🔴 **não existe** | — | 🅑 |
| `SD-GOV-06` | Backup e recuperação | ☑ | observação | 🔴 **não existe** | — | 🅑 |
| `SD-GOV-07` | **A orientação funcionou?** (resultado após a ação) | ↑ | Log de Otimizações | 🟡 **metade existe** — ver nota | — | 🅐 |

> 🔴 **`SD-GOV-07` é o indicador mais mal compreendido da casa, e eu mesmo errei sobre ele ontem.** O **ADR-22 está Aceito desde 11/06/2026** e decide o ciclo completo: alerta → tarefa no DB Tasks → registro vinculado no Log de Otimizações → **workflow diário fecha a janela com Resultado Real + Aprendizado**.
>
> | Metade | Estado |
> |---|---|
> | **escrita** | 🟢 **existe** — `PHI - Pipeline_v2`, nó `Criar Log Otimizacoes`, 12 campos. A dúvida do `PLANO-ENTREGA-FINAL-PHI` (*"ninguém verificou se algo escreve nela"*) está respondida: **escreve** |
> | **verificação** | 🔴 **não existe** — nada volta na janela vencida para medir se melhorou |
>
> ⚠️ **E a escrita tem um defeito:** aquele é o **único nó do Pipeline com `onError: continueRegularOutput` sem destino visível** para o erro. Se falhar, a ação fica sem registro e o Pipeline segue verde — **R11 regra 2**.

---

### Placar do dicionário

| Dimensão | Indicadores | 🟢 com dado | 🟡 coluna sem dado | 🔴 inexistente | 🅐 núcleo |
|---|--:|--:|--:|--:|--:|
| D1 Infraestrutura | 8 | 1 | 4 | 3 | 6 |
| D2 Descoberta | 9 | 1 | 4 | 4 | 4 |
| D3 Consistência | 5 | 0 | 2 | 3 | 4 |
| D4 Reputação | 8 | 0 | 4 | 4 | 4 |
| D5 Conteúdo | 7 | 0 | 2 | 5 | 0 |
| D6 Experiência | 10 | 7 | 1 | 2 | 6 |
| D7 Aquisição | 14 | 11 | 2 | 1 | 10 |
| D8 Conversão | 14 | 7 | 4 | 3 | 10 |
| 🔴 D9 Relacionamento | 10 | 0 | 0 | **10** | 4 |
| D10 Governança | 7 | 0 | 2 | 5 | 4 |
| **Total** | **92** | **27** | **25** | **40** | **52** |

🔴 **A leitura que o placar dá, e que nenhum documento anterior tinha:**

1. **27 indicadores já têm dado.** E **17 deles não têm um único leitor** — todo o D6, o orgânico do D7 e o `SD-CVR-05`.
2. **25 indicadores têm coluna e não têm dado.** **Doze** deles se resolvem com **uma coisa só: a cota do GBP.**
3. **D9 é o único bloco com zero em tudo** — e é o pilar de peso 20 em duas das quatro candidatas.
4. **D5 não tem um único indicador 🅐.** **[DEDUZO] rede social orgânica não pertence à v0 deste índice.**

---

## 3.11 🔎 Existe régua? — a coluna que o brief do substrato pediu

> Fonte: `docs/handoff/2026-09-25-substrato-estatistico-do-phi-brief.md` §5 — *"o mapa ganha uma coluna
> a mais: existe número de referência, e de onde?"*. O brief previu que **"não existe" seria a resposta
> mais frequente.** ✅ **Ele estava certo — e por uma margem maior do que supôs.**

**A hierarquia de consulta** (está dentro do `benchmarks-canonicos.yaml`, e inverte o que a maioria assume):

> **percentis da própria conta** (`raw_campaign_data` / `phi_score_history`) **>** o YAML **>** estratégia do Banco **>** conceito

**A primeira régua é a história do próprio cliente. O benchmark de mercado é a segunda.**

| Dim | Existe régua? | De onde | Ressalva |
|---|---|---|---|
| **D1** Infraestrutura | 🟡 **parcial** | **Core Web Vitals do Google**: LCP ≤2,5s · INP <200ms · CLS <0,1 (citado na `Análise Estatística`) | vale para `SD-EXP-08`; o resto do D1 é ☑ e dispensa |
| **D2** Descoberta | 🔴 **nenhuma** | — | impressões e views de GBP **não têm faixa em documento nenhum da casa**. Search Console idem |
| **D3** Consistência | ✅ **dispensa** | — | os 5 indicadores são **☑ binários**: nome igual ou diferente. Certo/errado não precisa de benchmark |
| **D4** Reputação | 🔴 **nenhuma** | — | **nenhum dos três documentos do substrato menciona GBP.** Nem nota, nem volume, nem % respondida |
| **D5** Conteúdo | 🔴 **nenhuma** | — | — |
| **D6** Experiência | 🟡 **parcial** | Core Web Vitals (acima) | 🔴 **rage/dead clicks: nada.** Bounce e engajamento **existem no YAML** mas marcados **e-commerce + força D**, e a **ARB-ESCOPO-01 os tira do nosso escopo** |
| **D7** Aquisição | 🟢 **SIM — a única bem servida** | os **16 `[BM-*]`** do YAML: CPC, CTR, CPM, CPL, CPA, ROAS, LTV:CAC | ⚠️ ver o defeito do `CTR_BENCHMARK` abaixo |
| **D8** Conversão | 🟡 **parcial** | CPA e ROAS no YAML | 🔴 **a `ARB-ROAS-01` manda usar a MARGEM do cliente antes da regra absoluta.** E a **`ARB-CVR-01`** separa CVR de site de CVR de plataforma — e a faixa de site é e-commerce/força D, **fora de escopo** |
| 🔴 **D9** Relacionamento | 🔴 **ZERO — e é o pilar de peso 20** | — | ver abaixo |
| **D10** Governança | ✅ **dispensa** (quase) | — | 6 dos 7 são ☑. O `SD-GOV-07` mede **variação do próprio cliente**, que é a 1ª régua da hierarquia |

### O placar da régua

| | |
|---|---|
| 🟢 **Com régua** | **1** dimensão de 10 — **D7, aquisição paga** |
| 🟡 Parcial | 2 — e as duas dependem dos Core Web Vitals, que vêm do Google, não da casa |
| ✅ Dispensa (binárias) | 2 |
| 🔴 **Sem régua** | **5** |

🔴 **E a assimetria é pior do que o número sugere:** as dimensões **☑ binárias dispensam régua** justamente porque são fáceis. **As dimensões contínuas — as que de fato precisam de um "comparado a quê" — são exatamente as que não têm.**

### 🔴 O buraco do D9, confirmado com uma busca que o brief não pôde fazer

O brief admitiu: *"não procurei no Notion nem no `Board Agência`"*. **Procurei no Notion.**

| O que achei | O que é |
|---|---|
| `classe_sla` no **SOP Execução de Demandas v1.0** | 🔴 **é a fila interna de demandas DA AGÊNCIA** — ticket próprio, não tempo de resposta ao lead do cliente |

**É a mesma armadilha do CRM Odoo, um nível acima:** a casa tem SLA **do próprio trabalho** e nenhum **do atendimento do cliente**. **§4.3 do brief fica confirmado.**

> 🔴 **E o incômodo que o brief nomeou continua de pé:** o substrato da casa **afirma** que *"velocidade de resposta define o ROI"* para negócio local — e **não traz um único número.** A alavanca que os nossos próprios documentos elegem como central é a que não tem régua.

---

## 3.12 🔴 O que os testes de refutação do brief devolveram

O brief do substrato fez três deduções e, em cada uma, escreveu **o que a derrubaria**. Rodei os três testes que os artefatos em mão permitiam. **Dois confirmam, um é refutado em parte — e a refutação achou coisa pior.**

### §4.1 — *"o gate estatístico não segura nada"* → ✅ **CONFIRMADO, e há uma porta a mais**

O brief disse: *"o que me derruba: rodar o SQL e contar linhas… nunca contei, estou deduzindo da regra."* **Não rodei o SQL — li o código do nó.** `Normalizador T28`, função `calcVolumeSuficiente`:

```js
function calcVolumeSuficiente(dataInicioCampanha, businessDate, conversoesNaJanela, diasDaJanela) {
  if (!dataInicioCampanha || !businessDate) return true;          // ← porta 1
  const idadeCampanhaDias = Math.floor((new Date(businessDate) - new Date(dataInicioCampanha)) / 86400000);
  if (idadeCampanhaDias <= 14) return conversoesNaJanela >= 50 && diasDaJanela >= 7;
  return true;                                                    // ← porta 2
}
```

**Há DOIS caminhos que devolvem `true`, e o brief só previu um.**

| Porta | O que faz | Gravidade |
|---|---|---|
| **1** | 🔴 **se a data de início da campanha estiver vazia, o gate ABRE** | **é a R11 regra 1 em estado puro** — *"a falta de critério nunca pode significar 'todos'"*. E `data_inicio_campanha` vem do **Notion**, preenchido à mão: campo em branco na DB Campanhas ⇒ gate aberto, em silêncio |
| **2** | campanha madura passa sempre | é a que o brief deduziu, e está certa |

> **[DEDUZO]** a porta 1 é mais perigosa que a 2, porque a 2 pelo menos é uma **decisão escrita** (ADR-29 D1) e a 1 é **um efeito colateral de implementação** que nenhum documento menciona. ⚠️ **E eu também não medi** — não rodei query. A diferença é que agora a causa está localizada no código, não inferida da regra.

### §4.2 — *"o substrato não tem leitor no ar"* → 🟡 **REFUTADO EM PARTE, e o que achei é pior**

O teste era: *"achar no n8n qualquer nó vivo que carregue esses números no prompt."*

| Onde procurei | Resultado |
|---|---|
| `PHI — Agregador`, `sw metricas campanhas`, `sw metricas conjuntos` | **zero** menção a `[BM-*]`, benchmark, substrato ou `forca_evidencia` |
| skill `phi-diagnostico` (byte-idêntica ao nó vivo) | **zero** menções — e **3** de `N/D`. ✅ a leitura do brief está exata |
| 🔴 **`sw metricas anuncios`, nó `Code Diagnóstico Criativo`** | 🔴 **TEM benchmarks — e nenhum deles vem do YAML** |

```js
const HOOK_BENCHMARK = 25;   // %
const HOLD_BENCHMARK = 15;   // %
const CTR_BENCHMARK  = 1.0;  // %
const CTR_CRITICO    = 0.5;  // %
const FREQ_ATENCAO = 2.5;  const FREQ_SATURADO = 3.5;
const PESO_RANKINGS = 0.50; const PESO_HOOK = 0.25; const PESO_HOLD = 0.25;
// comentário do próprio código:
// "Benchmarks de normalizacao (nao definidos no brief - ajustaveis)."
```

🔴 **Três achados, e o terceiro é o que mais importa:**

1. **Existe um segundo conjunto de benchmarks na casa**, hardcoded, paralelo ao YAML — e **o próprio código admite que foram inventados** (*"não definidos no brief — ajustáveis"*). É exatamente o problema que o YAML foi criado para resolver: **duas réguas que discordam.**
2. **Existe um TERCEIRO score que nenhum documento que eu li nomeia:** `criativo_score_operacional` (0–100), com pesos próprios (0,50 rankings + 0,25 hook + 0,25 hold). A casa tem **`phi_value`, `potencial_comercial` e este.**
3. 🔴 **`CTR_BENCHMARK = 1.0%` contradiz o canônico e viola a `ARB-ESCOPO-01`.** O substrato diz **CTR: 0,5–2% · Search: 5–10%**. Um CTR de 1,5% numa campanha de **Search** é ruim — e este código o classificaria como **acima do benchmark**. `1.0%` é número de **feed/Meta** aplicado numa operação que a arbitragem define como **Google Ads lead-gen local**.

> ✅ **O lado bom, e é real:** a normalização `clamp100((hook / HOOK_BENCHMARK) * 100)` é **distância à meta com limite fixo** — exatamente o **G5** que a `Metodologia` recomenda. **O método está certo; os alvos é que são inventados.** Trocar os números é barato; se fosse o método, seria caro.
>
> ⚠️ **E o nó tem gate:** o `criativo_fadiga_status` só calcula `if (suficiente && frequencia > 0)`, e cai em `'Sem dados'` — o comportamento no caso vazio **foi escolhido de propósito** aqui. É o oposto da porta 1 do §4.1.

### §4.3 — *"o substrato inteiro é de mídia paga"* → ✅ **CONFIRMADO**

Ver §3.11. A única coisa no Notion que parece régua de atendimento é o `classe_sla` da fila interna da agência — **objeto diferente.** E o placar da régua fecha o argumento: **1 dimensão de 10 tem régua, e é a paga.**

### 🟢 Um achado que credita o parque, e precisa ficar escrito

O `Normalizador T28` tem uma função `assertNoRawSearchTerms()` que **lança exceção** se um termo de busca bruto tentar entrar numa tabela `t28_*`:

```js
if (/search.*terms|termos|terms/i.test(path)) throw new Error('D5: search terms brutos não podem persistir em t28_*');
```

**A decisão do ADR-29 D5 não ficou só no papel: virou guarda que quebra o fluxo se for violada.** É o contrário do sucesso silencioso da R11 — e, no meio de tantos defeitos, é o padrão que o resto deveria imitar.

---

## 4. Duplicidades eliminadas

A `Metodologia` §v0 pede eliminar duplicidades antes de ponderar — **indicador contado duas vezes infla o pilar sem acrescentar informação.**

| # | Duplicidade | Decisão desta v0 |
|---|---|---|
| **1** | **GBP coletado duas vezes** — Apify (`PROSP-04`) e GBP API (Agregador) | **Fontes diferentes para sujeitos diferentes: lead × cliente.** Não é duplicidade a eliminar — é **a mesma família de fato em dois momentos do funil.** ⚠️ **Mas os dois caminhos precisam da mesma definição de indicador**, senão a nota do lead e a do cliente não são comparáveis |
| **2** | **`conversions` em dois lugares** — `raw_campaign_data.conversions` (plataforma) e `t28_ga4_landing.conversions` (site) | 🔴 **NUNCA somar.** Já é lei da casa: `ARB-CVR-01` em `benchmarks-canonicos.yaml` — *"CVR de site e CVR de plataforma são métricas distintas; nunca comparar uma com a faixa da outra"*. Ficam como `SD-CVR-01` e `SD-CVR-05`, separados |
| **3** | **`conversions` + `leads`** — Google conta `conversions`, Meta conta `leads` | A spec T28 §5 já apontou: `totalConversions = google + metaLeads` **mistura conversão e lead**. Padronizar `conversions` + `conversion_type` |
| **4** | **CPA × CPL** | **São o mesmo número quando o objetivo é gerar contato** — confirmado por você em 22/09 (`regras-otimizacao-metodo-subido` §2). Viram dois indicadores **só quando houver medição de venda separada da de lead** |
| **5** | **Duração de sessão em dois lugares** — `clarity_avg_session_sec` e `ga4.avg_session_duration_sec` | 🔴 **medem populações diferentes** (Clarity amostra; GA4 tudo). **Escolher UM como canônico** e guardar o outro como contexto. Não decidido aqui |
| **6** | **`dim_conversao` do lead × D8 do cliente** | Nomes colidem, objetos não. O `dim_conversao` avalia **o perfil GBP** (CTAs, agendamento, site); o D8 mede **conversão real**. ⚠️ Renomear um dos dois antes de construir |
| **7** | **`phi_value` × índice novo** | 🔴 **Não são camadas concorrentes:** `phi_value` é **um indicador** deste dicionário (`SD-AQU-08`), não o índice. É o que o ADR-21 já dizia — e o que o nome `PHI·Mídia` existe para marcar |

---

## 5. Regras de evidência

**Nota sem prova não vale** (`Análise Estatística` §Cuidados). Todo ponto atribuído carrega:

| Campo | Por quê |
|---|---|
| **evidência observada** | o número ou o fato, literal |
| **fonte** | qual API, tabela.coluna, ou "observação humana" |
| **período** | a janela — sem ela, o número não é comparável |
| **força de evidência** | `A` validado internamente · `B` case documentado · `C` benchmark público · `D` heurística. 🔴 **`D` nunca sustenta `[CERTEZA]`** (`benchmarks-canonicos.yaml`) |
| **problema encontrado** | o que está errado |
| **impacto provável** | e **marcado como hipótese** quando for |
| **prioridade** | 🔴 Crítica · 🟠 Alta · 🟡 Média · 🟢 Baixa |
| **responsável** · **próxima ação** | senão o diagnóstico não vira trabalho |
| **resultado depois da correção** | é o `SD-GOV-07`, e é o que fecha o ciclo do **ADR-22** |

### Os cinco guardrails que **não** se revogam nesta reformulação

| # | Regra | De onde vem |
|---|---|---|
| **G1** | 🔴 **Zero nunca é ausência.** `conversions=0 ⇒ CPA/ROAS indefinidos`; `source_status error/missing ⇒ N/D`, nunca `0` | **M4** · guardrails 8/9 · I3 |
| **G2** | **Volume insuficiente responde "VOLUME INSUFICIENTE", não pontua.** Campanha nova (≤14d): `conv ≥ 50 AND dias ≥ 7`; madura: sempre suficiente | **ADR-29 D1** ⚠️ **três problemas, ver §3.12:** (a) a `spec-contrato-agregador-t28.md` §3 ainda diz `≥30 conv AND ≥14 dias`, desatualizada frente ao ADR; (b) o YAML diz `~30 conv ou 2–4 semanas`, um terceiro número; (c) 🔴 **no código, data de início vazia ABRE o gate** |
| **G3** | **Média geométrica entre pilares**, aritmética dentro deles — para um pilar excelente não esconder um crítico | `Metodologia` §Modelo recomendado |
| **G4** | **Falha crítica não é compensável.** Sem controle do domínio, da conta ou do rastreamento → **alerta independente**, não desconto na média. *"72 — atenção crítica em governança"* | `Metodologia` §Modelo recomendado |
| **G5** | **Normalizar por distância à meta com limites fixos**, nunca por percentil da base — *"uma empresa não muda de nota apenas porque novos concorrentes entraram na base"* | `Metodologia` §Escolha recomendada |

> 🔴 **O G3 é a consequência mais caríssima deste documento, e precisa ser dita sem rodeio:** o `phi_value` de hoje é **soma ponderada** de 6 componentes (MIV/MAS/TSS/FIS/ES/RS) — **compensatória por construção**. Se o índice novo adota média geométrica entre pilares, **o motor de cálculo muda, não só a lista de pilares.** Isso é ordem de magnitude maior do que o mapa de 24/09 sugeriu.
>
> ✅ **E o G5 valida, por método, o que eu havia concluído por leitura:** o `potencial_comercial` usa **rank percentil dentro da `Searchstring`** — exatamente o que o G5 proíbe. **Os dois scores continuam separados, agora por fundamento estatístico e não por opinião.** O aviso do `CLAUDE.md` estava certo.

---

## 6. O que isto implica para os workflows

Você disse que os workflows da área **serão construídos ou reformados**. Registro o que o dicionário já determina — **sem especificar construção, que é R7 e vem por ADR:**

| Constatação | Consequência |
|---|---|
| 17 indicadores 🟢 **sem leitor** | O **M11** já obriga a decidir: ou ganham leitor, ou param de escrever. O dicionário dá a régua que faltava — **eles servem D6, D7-orgânico e D8** |
| **12** indicadores 🟡 destravam com **a cota do GBP** | É o item de maior retorno por esforço do documento inteiro |
| `Fetch Meta Ads` está **DISABLED**, sem nota de religação | **R12**: o `t28_meta_campaign` vazio tem causa mais silenciosa do que o contrato registra |
| O Agregador roda **semanal e mensal** | Um índice de saúde do **negócio** não precisa de cadência diária — **[DEDUZO]** semanal cabe, e isso é economia, não limitação |
| `raw_ad_data` tem **0 linhas** (`IF Gate PMAX`, confirmado no artefato) | `SD-AQU-10` é 🅐 e depende disso |
| Os **4 workflows estão sem descrição** | **R5**. Reformar sem escrever a descrição repete o defeito que a auditoria de 08/09 pagou |
| O `Criar Log Otimizacoes` tem `onError` sem destino visível | **R11 regra 2**. O `SD-GOV-07` nasce sobre um nó que falha em silêncio |
| ⚠️ Os 4 JSON **não trazem `activeVersion`** | **R13**: são export do rascunho. **Antes de reformar qualquer um, ler o que está no ar** — não estes arquivos |
| 🔴 `CTR_BENCHMARK = 1.0%` no `Code Diagnóstico Criativo` | **contradiz o canônico** (Search é 5–10%) e **viola a `ARB-ESCOPO-01`**. Número de feed aplicado em operação de Search. **Trocar o número é barato; o método já está certo** (§3.12) |
| 🔴 **Um terceiro score não documentado:** `criativo_score_operacional` | pesos próprios, inventados no código. Precisa entrar no dicionário ou ser aposentado — hoje é score sem ADR |
| 🔴 **Porta 1 do `calcVolumeSuficiente`** — data vazia abre o gate | **R11 regra 1.** ⚠️ **é produção e tem ADR próprio (ADR-29 D1): não mexer sem decisão do Olavo** |
| 🟢 `assertNoRawSearchTerms()` lança exceção | **o padrão a imitar.** Decisão de ADR que virou guarda que quebra o fluxo, em vez de comentário |

---

## 7. O que fica aberto — e o que eu preciso te dizer

### Decisões que este documento não toma

| # | Em aberto | Quem decide |
|---|---|---|
| **1** | **A estrutura de pilares e os pesos** (§2) | Olavo, depois do mapa v2 |
| **2** | O destino do **ADR-21** — revalidado, superseado ou aposentado, **com razão escrita** | Olavo, por ADR |
| **3** | Se **D9 (Relacionamento)** é do PHI ou do `Board Agência` | Olavo |
| **4** | Qual fonte é canônica para duração de sessão (dup. #5) | técnica |
| **5** | Qual dos dois `dim_conversao`/`SD-CVR` é renomeado (dup. #6) | técnica |
| **6** | O `volume_suficiente` é apertado **agora** ou espera a reformulação? ⚠️ **é produção** | Olavo |
| **7** | O substrato vira leitor do nó vivo, ou fica guardado até o time de agentes existir? | Olavo |
| **8** | A revisão trimestral do YAML (venceu em setembro) entra na fila? | Olavo — depende da 7 |
| **9** | 🔴 O `criativo_score_operacional` e os benchmarks hardcoded do `sw metricas anuncios`: entram no dicionário, são realinhados ao YAML, ou o score é aposentado? | Olavo |

### 🔴 Duas coisas que a decisão de 25/09 provocou e alguém precisa segurar

**1. Duas frentes ficaram sem calendário.** Se a data de 30/11 e os 14 critérios deixam de ser fixos, então a **Prospecção** (P1–P9) e o **ADR-39+40** — que está em execução por outro sub-chat **agora** — perdem a referência que os ordenava. **[DEDUZO] o ADR-39+40 deve seguir**, porque ele conserta a entrada de cliente, de que qualquer versão deste índice vai precisar. Mas isso precisa ser dito a quem o está executando, senão dois sub-chats trabalham com calendários diferentes.

**2. A `Metodologia` pede uma amostra que a agência não tem.** O plano dela é v0 → **v1 piloto com Delphi e auditoria de 30 a 50 empresas, reavaliadas por dois auditores** → v2 → v3. A agência tem **1 cliente com 2 campanhas**.

> 🟢 **E a própria `Metodologia` já dá a saída honesta:** chamar de **"Índice Experimental de Saúde Digital do Negócio"**, com metodologia publicada, pesos transparentes e aviso de que os benchmarks serão recalibrados conforme a base crescer. *"A versão comercial inicial não precisa fingir precisão científica que ainda não possui."*
>
> **[DEDUZO] Há uma fonte de amostra que ninguém propôs:** a Prospecção já mediu **GBP, reviews, fotos, horário e PageSpeed de centenas de leads**. Não é auditoria completa e **não cobre D9** — mas para as dimensões D1, D2, D4 e parte de D6, **a base de calibração pode já existir na planilha.** Vale verificar antes de supor que é preciso auditar 30 empresas do zero.

---

## 8. Como verificar este documento

| O que | Como se confere |
|---|---|
| Colunas 🟢 e 🟡 existem | `agregador-t28/ddl/phi_prod_t28_tables.sql` (6 tabelas) · `CONTRATO-PHI.md` §4.1 · `CONTRATO-PROSPECCAO.md` §3 |
| "escreveu em 14/09" | `CONTRATO-PHI.md` §4.1 · smoke `11755` no `ESTADO-DO-PROJETO.md` |
| `ingestion_step` fora do `WHEN MATCHED` | ✅ **lido no artefato** — `sw metricas campanhas.json`, nó `Code Montar SQL`. E **`execution_id` também está fora** |
| `raw_ad_data` morre no gate | ✅ **lido no artefato** — `IF Gate PMAX` condiciona a `_bq_sql` `notEmpty` |
| `Fetch Meta Ads` DISABLED | ✅ **lido no artefato** — `PHI — Agregador…json` |
| Search terms sem persistência | ✅ **ADR-29 D5** + nó `[T28] Search Terms Features` sem BQ Merge correspondente |
| `calcVolumeSuficiente` com duas portas | ✅ **lido no código** — `Normalizador T28`, dentro de `PHI — Agregador…json` |
| benchmarks hardcoded + 3º score | ✅ **lido no código** — `Code Diagnóstico Criativo`, dentro de `sw metricas anuncios.json` |
| skill `phi-diagnostico` sem benchmark | ✅ **contado** — `grep -c` em `.claude/skills/phi-diagnostico/SKILL.md`: **0** de benchmark, **3** de `N/D` |
| régua de tempo de resposta não existe | ✅ **busca no Notion** — só o `classe_sla` da fila interna da agência, objeto diferente |
| 🔴 **O que NÃO conferi** | **nenhuma query no BigQuery** e **nenhuma leitura de `activeVersion` no n8n**. Os JSON são rascunho (**R13**). A composição real das 6 `dim_*` do lead segue **não verificada** no motor vivo |

**Confiança: 0,86** (subiu de 0,84 com a leitura do substrato: três afirmações que eram dedução passaram a ser código lido). Puxam para baixo: (1) o tier 🅐/🅑 é **minha leitura**, não decisão sua; (2) os 92 indicadores cobrem o material lido, e o Olavo disse que **novos documentos poderão ser trazidos** — a lista é aberta por construção; (3) para D9 eu não tenho nenhuma fonte de dado, então os 10 indicadores são **derivados do material**, não de algo observável hoje.

