# [ANEXO] Digests dos 7 documentos de conhecimento — evidência para a Camada de Conhecimento

> **Data:** 2026-07-05 · **Origem:** pedido do Olavo (bases de aprendizagem dos agentes).
> Digests produzidos por 2 agentes de leitura (Claude) sobre: 3 docs do repo (branch
> `claude/saude-digital-phi-midia-score-0ko12c`, pasta `docs/`) + 4 Google Docs vivos.
> Consumido por: `docs/strategic-planning/camada-conhecimento/BRUTO-v0.1-design.md`.

---

## PARTE 1 — Docs do repositório

### Doc R1 — `Gestão de Tráfego Pago, Métricas e Benchmarks (2026).md` (67,5KB, 788 linhas, 80 refs)
- **Tipo:** benchmark numérico ~35% · conceito ~30% · heurística ~15% · procedimento ~10% · framework ~10%.
- **Acionável (amostra):** CTR Search ruim <2% / bom 4–7% / excelente >7–8% (Meta: bom 1,5–2,5%); ROAS breakeven = 1/margem de contribuição, "bom" = 1–2 pts acima; LTV:CAC 3–4:1 saudável, >5:1 = **subinvestimento**; cadeia causal `CPA=(CPM/1000)×(1/CTR)×(1/CVR)`; keyword vencedora ≥100–200 cliques, 20+ conversões p/ decisão; matriz de avaliação (escala/reestruturar/pausar); benchmarks por vertical (§7.1); checklists semanal/mensal; GA4 sessão engajada.
- **Frescor:** 80 fontes 2024–2026, mas números do corpo citam só `[^n]` sem data inline; moeda ambígua. Risco médio (benchmarks de leilão degradam ~12 meses).
- **Lacunas:** sem IDs por benchmark; footnotes quebram chunking; mistura CVR de site com CVR de plataforma sem sinalizar; faixas internas inconsistentes.
- **Chunking:** 1 chunk/métrica (Tabela 1+§2); 1 chunk/vertical (§6+§7.1); checklists e framework §8.3 como chunks-procedimento; footnotes → metadata fonte/data.

### Doc R2 — `pesquisa-trafego-pago.md` (55KB, 759 linhas, jun/2026, BR+global)
- **Tipo:** benchmark ~30% · heurística ~25% (blocos "Decisão real") · framework ~15% · procedimento ~15% · conceito ~15%. **O melhor dos três em citabilidade** — fonte+data+região inline, nota anti-variância escrita para agentes ("prefira múltiplos relativos").
- **Acionável (amostra):** árvore de diagnóstico (CPM alto→leilão; CTR baixo→criativo; CPC alto+CTR ok→QS/negativas; CVR baixa+CTR ok→LP/oferta; ROAS baixo→modelo); break-even ROAS = 1÷margem; matriz quadrantes ("promissora → escalar +20–30% a cada 3–4 dias"); **scorecard ponderado 0–100** (≥80 escalar / 60–79 manter / 40–59 observar / <40 cortar — quase um phi_score alternativo); janela estatística ~30 conversões / 2–4 semanas; regra CPA "se não cair em 7–14 dias, realocar"; benchmarks BR (§7.3: CPC Google R$1,50–15, CPM Meta R$15–20, CPL R$3–15); §7.6 tabela de âncoras com fonte/data; hierarquia de alavancas Oferta>Criativo>LP>Segmentação>Lance; loop O.D.A.E.
- **Frescor:** dados abr/2024–mar/2025 majoritários — revisar ~2027. Fontes BR fracas (blogs comerciais).
- **Lacunas:** sem IDs estáveis; CVR "média 7,5%" (plataforma) vs 3–4% (§7.1 e-commerce) sem regra de uso; "ROAS ≥5:1 saudável" tensiona com a própria regra de margem.
- **Chunking:** cada benchmark = registro estruturado `{métrica, canal, região, vertical, faixas, valor, fonte, data}` (§7.6 já 90% pronta); cada "Decisão real" = chunk-heurística; frameworks íntegros; checklists como procedimentos.

### Doc R3 — `modulo-28-analise-cognitiva.md` (7KB, 103 linhas)
- **Tipo:** framework/arquitetura de agentes ~80% · procedimento ~20% · **zero benchmarks** (delega a R1/R2 como "fonte de verdade").
- **Acionável:** arquitetura de 7 agentes (Maestro + Leitura&Anomalia, Atribuição, Diagnóstico Crítico, Julgamento Multiobjetivo, Hipóteses&Priorização, Narrativa) com I/O; **Bloco Comum com 7 regras inegociáveis** (ancorar números com citação `[Meta BR ~R$15–20]`; `[CERTEZA]`/`[HIPÓTESE]`; <~30 conversões → "VOLUME INSUFICIENTE"; anti-vaidade; especialista só fala com Maestro; fora da lente → "ENCAMINHAR"); triagem rápido×devagar; prompt do Maestro completo.
- **Lacunas:** os 7 prompts específicos estão **vazios** (spec ~60%); não define modelo/effort por agente; não conecta com phi_score/bandas; referencia "Temas 01–27" que não existem no repo (**dependência quebrada** — resolvida: é o Google Doc G1, ver Parte 2).
- **Chunking:** NÃO fatiar — é protocolo/system-prompt, fora do índice de benchmarks.

### Transversal R1×R2×R3
- **Contradições que derrubam agente:** (a) **CVR** — R1 usa CVR de site (médio 1,5–3%), R2 usa CVR de plataforma Google (~7,5%); nenhum arbitra → **maior risco de diagnóstico invertido da base**; (b) CTR Search "bom" 4–7% vs 6–7%; (c) keyword vencedora 20+ vs ~30 conversões; (d) ROAS breakeven-por-margem vs regra absoluta "≥5:1"; (e) **LTV:CAC >5:1** = "subinvestimento" (R1) vs "eficiente, escalar" (R2) — leituras opostas; (f) CPL saúde 20–80 vs 80–100.
- **Autoridade recomendada:** **R2 canônico** em benchmarks/heurísticas/frameworks; R1 complementar (GA4, keywords, verticais §6 — números cedem a R2); R3 autoridade exclusiva do protocolo de consumo.
- **Recomendações:** 1) arbitrar CVR (`cvr_site` ≠ `cvr_plataforma`); 2) tabela canônica de benchmarks com ID (`BM-CTR-GSEARCH-GLOBAL-2025`), seed = §7.6; 3) precedência formal em header dos 3 docs (margem > regra absoluta; ~30 conversões unificado); 4) completar os 7 prompts do R3 + resolver refs Temas 01–27; 5) mapear faixas/scorecard R2 → bandas PHI (CRITICAL–EXCELLENT); 6) codificar ordem "benchmark interno primeiro" (percentis da própria conta > mercado); 7) metadata de frescor (`coletado_em`, `valido_ate`); 8) sanear R1 (footnotes → inline, moeda/região explícitas).

---

## PARTE 2 — Google Docs vivos

### Doc G1 — "Estudo de Inteligência Artificial Cognitiva" (`1_9F7BA…`) — o doc que permeia tudo
- **Identidade:** ~314k chars (~110 pág.), criado 14/04, **modificado 07/06**. "Guia 1" → **TEMAS 01–25** (conteúdo → aplicação prática → prompt de aplicação → acompanhamentos) + 2 anexos de funis (B2B alto ticket; infoproduto) + Tema 26 (próxima melhor ação por estágio) + Tema 27 (OS Cognitivo: rotinas diária/semanal/mensal/trimestral).
- **Tipo:** ~50% conceito/modelo mental · ~30% procedimento · ~15% templates de prompt · ~5% claims numéricos. **É a camada de raciocínio, não de benchmark.**
- **Acionável (amostra):** protocolo pré-decisão de verba (objetivo→efeitos cruzados→simular 7/30/90d); decisão multiobjetivo em 3 regimes; hipótese obrigatória "Se X, então Y, porque Z" + ICE/RICE; gatilho FAST×SLOW ("nada que mexa >20% da verba ou na oferta principal sem ciclo SLOW"); radar de risco ("CPA +25% em 7 dias sem mudança de contexto → alerta"); incrementalidade/holdout/geo-test; classificação de lead; Memória de Decisão (Tema 25 → virou os ADRs); taxonomia de agentes (Tema 09); **Tema 11 = spec conceitual da própria Camada de Conhecimento** ("motor de decisão vivo").
- **⚠️ Frescor:** claims numéricos **sem fonte nomeada** ("ganhos 20–40%", "criativo = 50–60% do impacto") — risco de agente citar como fato. Já sinalizado no Guia de Agentes §2: números do G1 NÃO são fonte citável.
- **Chunking:** 1 chunk/TEMA (~31 chunks), sub-split {conceito | procedimento | prompt}; extrair prompt-library com ID `tema-NN-prompt`.
- **ACHADO-CHAVE:** **G1 é a origem viva dos "Temas 01–27" que o Módulo 28 (R3) orquestra** — a dependência quebrada do R3 aponta para cá.

### Doc G2 — "Textos sobre e-commerce de Diego Santana" (`1utOmB…`)
- **Identidade:** 52k chars, criado 01/07, **modificado 04/07 (vivo)**. 6 edições-newsletter: headline → Sistema N → caso → KPI do Dia → insight → checklist. Sistemas: Oferta, PDP/Hero, Prova e Risco, Velocidade, Aquisição×Recompra, Escala. **Sistema 4 (checkout) ausente; "Sistema 5" duplicado.**
- **Tipo:** ~35% benchmark com limiar · ~30% heurística · ~20% framework de diagnóstico · ~15% casos com fonte. **O mais diretamente operacionalizável dos 4.**
- **Acionável (amostra):** escala +20–30% por ajuste, nunca dobrar; CPS (custo por sessão) como canário — teto R$1,50, recuo se +20% pós-aumento; ATC ≥4% (<4% = oferta fraca, não tráfego); bounce PDP >70% vermelho; LCP ≤2,5s mobile; 0,1s mais rápido = +8,4% conversão (Deloitte 2020); avaliações +270% chance de compra, nota ideal 4,2–4,5 (Spiegel/Northwestern); "CTR bom + CPA alto → olhe Clareza e Valor Percebido"; ancoragem de preço (Ariely); frete grátis piso 1,5× ticket; **ROAS de aquisição** (receita de novos ÷ investimento); recompra via CRM, não mídia.
- **Lacunas:** tabelas com markup quebrado na extração; escopo **e-commerce/PDP** — precisa flag de aplicabilidade (clientes PHI incluem negócio local); limiares (CPS R$1,50) são opinião do autor sem contexto de nicho.
- **Chunking:** 1 chunk/edição; **KPI-cards → tabela estruturada de limiares** (métrica, vermelho/verde, contexto).

### Doc G3 — "Pedro Sobral — Laboratório de Tráfego" (`1lp8ra…`)
- **Identidade:** criado 21/04, **modificado 04/07 (vivo)**. ~10 newsletters de testes reais; **última entrada truncada** (verificar corte no doc ou no export).
- **Tipo:** ~80% resultado empírico de teste **n=1** (lançamentos/infoproduto) · ~10% novidade de plataforma · ~10% procedimento. **Não são benchmarks — são hipóteses testáveis.**
- **Acionável (amostra):** copy por nível de consciência: CPL R$8,68 vs 9,56; "Escala Baiana" 1-50-1 adaptada **FALHOU** (R$195,73, 0 vendas vs CPA normal 60–80) — lição: não replicar estrutura sem calibrar; TikTok Community Interaction R$0,23/seguidor vs Video View R$1,39; YouTube público quente amplo escala sem deteriorar; públicos Meta por intervalo de interação (rollout); isolar posicionamentos YouTube; Advantage+ sem público manual = melhor CPA do lançamento; "Envolvimento Supremo" (365d∩7d); teste de nome de produto; campanha pra live IG.
- **Lacunas:** sem data por entrada; sem nicho/verba por teste; features em rollout envelhecem rápido; **tudo precisa da tag "evidência: teste único de terceiro"** (um agente ingênuo leria a Escala Baiana como recomendação).
- **Chunking:** 1 chunk/experimento (~10), metadata {plataforma, objetivo, estrutura, números, ressalva}.

### Doc G4 — "Arquitetura Cognitiva Comercial" (`1LZg4e…`)
- **Identidade:** criado 22/04, modificado 23/04 (**parado 2+ meses**). 2 TEMAs no formato do G1: cérebro de vendas agentizado + funil comercial cognitivo.
- **Tipo:** ~60% conceito · ~25% procedimento · ~15% prompt. Zero benchmark.
- **Acionável:** 5 módulos cognitivos (percepção→interpretação→planejamento→decisão→aprendizado); estágios de funil como hipóteses; agente de interpretação de leads (I/O definido); orquestrador + agentes por evento; 2 prompts completos.
- **⚠️ Escopo:** é o **comercial da agência** (venda de serviço), NÃO análise de campanha de cliente — **não deve contaminar o retrieval do PHI-análise**; taggear domínio=`comercial-agencia`.

### Transversal G1–G4 × repo
- **Mapa de papéis:** repo (R1/R2) = "quanto é normal" (benchmarks) · G1 = "como raciocinar" (lentes) · G2 = "limiares e diagnóstico de loja" · G3 = "hipóteses táticas testadas" · G4 = domínio comercial (separado). R3 (Módulo 28) = protocolo que liga tudo.
- **Tensões:** escala +20–30% (G2) vs Escala Baiana em massa que falhou (G3) — coerentes na prática, mas exigem tag de status; Advantage+ aberto venceu × "Envolvimento Supremo" manual venceu — condicionar por contexto (histórico de pixel); incrementalidade aparece em 3 fontes (G2, G1-T15, R2) — deduplicar no índice.
- **Recomendações:** 1) G1 = fonte canônica dos Temas 01–27 → exportar 1 arquivo/Tema pro repo com ID estável + ligar ao Módulo 28; 2) pipeline de extração que conserte tabelas quebradas e converta KPI-cards em tabela de limiares; 3) metadata obrigatória por chunk {data, fonte, aplicabilidade, força de evidência: benchmark-com-fonte | teste-n=1 | opinião | conceito}; 4) regras de aplicabilidade por modelo de negócio (G2→e-commerce; G3→infoproduto/lançamento; G1→universal; G4→fora do escopo de análise); 5) claims sem fonte do G1 = "não verificado — não citar como fato"; 6) completar G2 (Sistema 4, duplicação); 7) datar entradas do G3 + consertar truncamento; 8) extrair prompt-library dos G1/G4 (~30 prompts) como ativos versionados.
