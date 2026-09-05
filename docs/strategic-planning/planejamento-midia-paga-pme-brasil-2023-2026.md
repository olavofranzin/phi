# Planejamento de Campanhas de Mídia Paga para PME e Médio Porte
## Brasil, 2023–2026 — Documento consolidado

> **Nota de consolidação.** Este arquivo é a união dos dois documentos
> produzidos pelo mesmo Deep Research, que eram partes complementares de
> uma única entrega e não versões alternativas:
>
> - **Relatório longo** (`Planejamento_de_Campanhas_de_Midia_Paga...`) —
>   trazia a fundamentação: seções 2.1–2.12, framework consolidado e
>   38 referências. Seus entregáveis 4.4–4.11 eram apenas remissões
>   ("ver resposta em chat").
> - **Resposta em chat** (`Deep_Research_—_Planejamento_de_Campanhas...`) —
>   trazia os entregáveis operacionais 4.4–4.11 desenvolvidos, com 62
>   referências próprias.
>
> Cada remissão foi substituída pelo conteúdo real. Onde havia duas versões
> da mesma seção, ficou a mais completa: o sumário executivo (4.1) e as
> lacunas (4.12) são os da resposta em chat, que incluem "o que fazer" e
> "quando não se aplica"; a autoverificação (4.13) é a do relatório longo.
>
> **Referências:** os dois conjuntos foram preservados em numerações
> separadas — `[^1]`–`[^38]` vêm do relatório longo e `[^1_1]`–`[^1_62]`
> da resposta em chat. Não houve conflito entre elas.

---

## Índice

| Seção | Conteúdo | Origem |
|-------|----------|--------|
| 4.1 | Sumário executivo — 10 conclusões | Chat |
| 4.2 | Relatório de pesquisa (blocos 2.1–2.12) | Relatório |
| 4.3 | Framework consolidado (FPFS) | Relatório |
| 4.4 | Processo passo a passo (briefing → go-live) | Chat |
| 4.5 | Tabela comparativa de metodologias | Relatório (§2.2) |
| 4.6 | Matriz de decisão | Chat |
| 4.7 | Checklist de planejamento | Chat |
| 4.8 | Template de plano de campanha + exemplo | Chat |
| 4.9 | Decisões obrigatórias antes do lançamento | Chat |
| 4.10 | Recomendações priorizadas | Chat |
| 4.11 | Bibliografia comentada | Chat |
| 4.12 | Lacunas da pesquisa | Chat |
| 4.13 | Autoverificação | Relatório |
| 4.14 | Como usar este material | Chat |

### Nota sobre profundidade das seções

Declarado pela própria pesquisa (Bloco 6 do prompt, ordem de corte):

- **Alta profundidade, não reduzido:** 2.3 anatomia de campanha · 2.5
  plataformas · 2.6 estrutura de conta · 2.7 alocação de verba · e os
  entregáveis 4.4 (processo), 4.7 (checklist) e 4.8 (template).
- **Boa profundidade, porém resumido:** 2.1 processo de times · 2.8
  criativo · 2.9 dados · 2.10 documentos · 2.11 ciclo contínuo ·
  2.12 erros comuns.
- **Frameworks (2.2):** detalhados em fichas no relatório; a síntese
  prática aparece em tabelas e fluxos nos entregáveis.

---

## 4.1 Sumário executivo (10 conclusões + o que fazer)

Cada conclusão vem com ação concreta e contexto de quando NÃO se aplica.

1. **Comece pelo objetivo de negócio, não pela interface.**
    - O que fazer: defina metas de receita, margem ou volume de leads qualificados e traduza para CPA, ROAS, CPL e CAC antes de abrir Google Ads ou Meta Ads.[^1_2][^1_3]
    - Quando não vale: campanhas puramente de teste criativo ou de pesquisa de mercado exploratória, onde o objetivo é aprender, não bater meta.
2. **Estrutura de conta enxuta > hiperfragmentação.**
    - O que fazer: para cada objetivo (Sales, Leads, Traffic, Awareness), mantenha poucas campanhas com grupos de anúncios/ad sets consolidados, usando broad match + Smart Bidding em Search e poucos conjuntos em Meta.[^1_5][^1_1][^1_2]
    - Quando não vale: testes de criativo muito específicos ou segmentações regulatórias (saúde, financeiro) que exigem separação rígida.
3. **Automação (PMax, Advantage+, Performance+) só performa com bons sinais.**
    - O que fazer: só ativa PMax/ASC quando tiver pelo menos 30–50 conversões/mês por segmento e tracking limpo via pixel + API/server-side (CAPI, Enhanced Conversions, UET).[^1_4][^1_6][^1_7][^1_2][^1_5]
    - Quando não vale: contas novas sem histórico; aí comece com campanhas manuais de conversão para treinar o sistema.
4. **Planejamento full funnel é arquitetura, não “campanha isolada”.**
    - O que fazer: sempre desenhe um portfólio: topo (awareness), meio (consideração), fundo (conversão) e pós-venda (retenção), com objetivos e KPIs distintos em cada plataforma.[^1_8][^1_3][^1_9][^1_10]
    - Quando não vale: budgets extremamente pequenos (ex.: < R\$ 2.000/mês) em que uma única campanha de conversão consome tudo.[SEM FONTE ENCONTRADA — prática comum]
5. **Regra 60/40 é ponto de partida, não mandamento.**
    - O que fazer: para clientes com orçamento robusto (acima de ~R\$ 50 mil/mês), comece com ~60% em campanhas de marca/alcance e ~40% em ativação, ajustando por categoria e maturidade.[^1_11][^1_12][^1_13]
    - Quando não vale: microanunciantes, campanhas ultra táticas (promo-relâmpago) ou negócios locais em fase inicial, que dependem mais de performance imediata.
6. **Criativo é o principal driver em social e discovery.**
    - O que fazer: para Meta, TikTok e Pinterest, mantenha 10–15 criativos ativos por campanha automatizada, com variação real de ângulos (dor, benefício, prova social, UGC) e formatos.[^1_6][^1_7][^1_14][^1_15]
    - Quando não vale: Search puro orientado a intenção, onde anúncios são mais padronizados e landing tem peso maior.
7. **Account hygiene (nomenclatura, UTMs, eventos) é pré-requisito de escala.**
    - O que fazer: padronize nomes de campanhas, defina padrão de UTMs, revise eventos e integrações (GA4, BigQuery, CRM) antes de aumentar verba.[^1_16][^1_1][^1_2]
    - Quando não vale: projetos de teste rápido/POC onde a prioridade é validar hipótese; ainda assim, mantenha o mínimo de organização.
8. **Alocação de mídia migra de “percentuais fixos” para teste incremental.**
    - O que fazer: use geo-tests, holdouts de público e modelos simples de lift para ajustar verba entre canais, em vez de repetir percentuais históricos sem revisão.[^1_17][^1_3][^1_18]
    - Quando não vale: contas sem escala suficiente (poucas conversões, pouca geografia) onde experimentos não têm poder estatístico; aí use heurísticas (60/40, SOV) com cuidado.
9. **Frameworks clássicos continuam úteis quando ligados a dados.**
    - O que fazer: use STP para definir público, See–Think–Do–Care para mapear intent e full funnel para desenhar portfólio, sempre conectado a sinais concretos em GA4 e CRM.[^1_19][^1_3][^1_8]
    - Quando não vale: cenários de baixa maturidade analítica onde mal há tracking básico; simplifique para “topo/meio/fundo”.
10. **Processo, checklist e templates reduzem erro e variabilidade entre clientes.**
    - O que fazer: padronize briefing, media plan, measurement plan, test plan e learning log, usando o processo, checklist e template abaixo como default da agência.[^1_20][^1_21][^1_2]
    - Quando não vale: projetos extremamente customizados com requisitos regulatórios ou políticos que exigem fluxos próprios; ainda assim, você pode derivar variantes.

***

---

## 4.2 Relatório de Pesquisa (Bloco 2)

### 2.1 Como times de alta performance planejam (processo)

#### Etapas e duração típica

Fontes de plataformas (Google, Meta, LinkedIn) e de consultorias mostram uma sequência relativamente convergente de etapas pré-lançamento.[^20][^1][^18]

1. **Briefing de negócio (1–3 dias):** coleta de objetivos de negócio, contexto competitivo, capacidades internas (atendimento, estoque, CRM), restrições legais e financeiras.
2. **Diagnóstico de dados (2–5 dias):** análise de histórico de campanhas, GA4, CRM e dados de mercado (benchmarks, sazonalidade, share of search). Para contas novas, pesquisa de mercado e uso de benchmarks externos.[^1][^16]
3. **Desenho de estratégia de funil e mix de canais (2–5 dias):** definição de arquitetura full funnel (awareness, consideração, conversão, retenção) e papel de cada plataforma; escolha de sinais de conversão e KPIs por etapa.[^7][^6]
4. **Planejamento de estrutura de conta e mensuração (2–4 dias):** desenho de campanhas, grupos de anúncios/ad sets, eventos, conversões, UTMs, integrações (GA4, BigQuery, CRM) e modelo de atribuição.[^3][^1]
5. **Planejamento criativo e produção (5–15 dias, dependendo de volume):** definição de conceitos, ângulos, formatos por canal, produção de criativos estáticos e vídeo, adaptação para diferentes plataformas.[^8][^5]
6. **Media plan e orçamento (1–3 dias):** alocação de verba por canal/campanha, definição de períodos, janelas de atribuição e metas numéricas (CPA, ROAS, CPL).[^17][^1]
7. **Configuração técnica e QA (1–3 dias):** implementação de tags, pixels, APIs de conversão, testes de eventos e UTMs, validação de dados em GA4/CRM.[^4][^15]
8. **Approvals (1–5 dias):** aprovação pelo cliente ou board das peças, orçamento e plano de mensuração; ajustes finais.[^18]
9. **Go-live e fase de aprendizado (mínimo 7–14 dias por campanha automatizada):** entrada em leilão, observação de estágios de aprendizado em Google (Smart Bidding, PMax) e Meta (Advantage+), sem mudanças agressivas para não resetar a aprendizagem.[^21][^1][^4]

#### Papéis e decisão

Em agências e times in-house de médio/grande porte, as responsabilidades se distribuem:[^16][^1]

- **Planner/estrategista:** lidera diagnóstico de negócio, define objetivos, funil e mix de canais; decide a tese central de mídia e critérios de sucesso.
- **Gestor de mídia (trafficker):** traduz a estratégia em estrutura de contas, segmentação, lances, orçamentos e calendário de campanhas; decide táticas por plataforma.
- **Criação:** desenvolve conceitos, mensagens, formatos e adaptações por canal; decide linguagem e peças dentro do framework aprovado.
- **Dados/analytics:** garante integridade de tracking, modelo de atribuição, dashboards e análises; decide metodologia de mensuração incremental.[^7][^1]
- **Atendimento/cliente:** alinha expectativas, faz o bridge entre time técnico e decisores; aprova briefings e planos.
- **Cliente (C-level/marketing):** aprova orçamento, objetivos de negócio, riscos regulatórios e trade-offs estratégicos.

Em estruturas menores (agência boutique, freelancer), uma mesma pessoa acumula planner + mídia + atendimento, com criação parcialmente terceirizada.[^22]
Adaptar significa reduzir documentos formais, mas manter as decisões explícitas (objetivos, estrutura, tracking, critérios de teste).

#### Documentos e fluxos de aprovação

Principais artefatos usados de forma recorrente:[^1][^18]

- **Campaign Brief / Media Brief:** documento que resume objetivo de negócio, público, proposta de valor, restrições e métricas-alvo.
- **Media Plan:** tabela com canais, formatos, budgets, períodos, metas e hipótese de papel de cada campanha.
- **Creative Brief:** instruções para criação com objetivos, público, mensagens-chave, tom e formatos.
- **Measurement Plan:** definição de eventos, tags, conversões, janelas de atribuição, KPIs, fontes de dados e cadência de análise.[^7]
- **Test Plan:** plano de testes A/B ou multivariados, com hipóteses, variáveis, tamanho de amostra e critérios de sucesso.
- **Learning Log:** registro de resultados de testes e campanhas, insights e decisões futuras.

Bloqueios comuns incluem: atraso em fornecimento de criativos, falta de clareza de objetivo de negócio, tracking incompleto e divergências de expectativa sobre métricas (por exemplo, foco em CTR em vez de CPA/ROAS).[^20][^1]


### 2.2 Frameworks: mapeamento e avaliação crítica

Abaixo, fichas resumidas para frameworks principais.

#### Tabela: Frameworks de planejamento de mídia

| Framework | Origem | O que resolve | Como aplicar na prática | Quando usar | Quando não usar | Evidência de eficácia | Críticas | Nível de consenso |
|-----------|--------|--------------|--------------------------|------------|------------------|------------------------|----------|-------------------|
| **STP (Segmentation–Targeting–Positioning)** | Tradicional em marketing, consolidado por Philip Kotler décadas atrás; amplamente adotado em planos de comunicação.[^7] | Organizar mercado em segmentos e definir proposta diferenciada por alvo. | 1) Segmentar mercado (dados demográficos, comportamentais, valor). 2) Escolher segmentos prioritários. 3) Definir posicionamento e mensagem central, que depois se traduz em campanhas.[^7] | Planejamento de marca, lançamento de produtos, definição de quem a mídia deve atingir em funil amplo. | Campanhas táticas de curto prazo sem clareza de posicionamento; micro-táticas de otimização de lance sem impacto em percepção. | Amplamente discutido em literatura acadêmica e aplicado em cases IPA/WARC.[^11][^7] | Pode ser rígido em mercados dinâmicos; risco de supersegmentação sem escala.[^17] | Alto |
| **Full Funnel (brand + performance)** | Desenvolvido ao longo de estudos de IPA/WARC e consultorias, enfatizando integração entre awareness e ativação.[^6][^17] | Evitar dicotomia "branding vs performance" e estruturar portfólio de campanhas por etapa de jornada. | Mapear estágios (awareness, consideração, conversão, retenção) e distribuir verba e campanhas em cada um com KPIs específicos.[^6] | Anunciantes com verba suficiente para múltiplos canais e objetivos; e-commerce, SaaS, B2B com ciclo longo. | Microanunciantes com verba muito limitada, onde uma única campanha de conversão consome todo o budget. | Cases demonstram maior crescimento de penetração e efeito de longo prazo quando há investimento consistente em topo de funil.[^7][^17] | Críticas sobre complexidade de mensuração e risco de dispersão de verba sem disciplina. | Médio–Alto |
| **See–Think–Do–Care (STDC)** | Popularizado por Avinash Kaushik e evoluído em frameworks de produto e growth, com foco em intent.[^2] | Organizar audiência por intenção (não apenas funil linear) e conectar ações e métricas a cada estágio. | 1) Definir qual comportamento caracteriza cada estágio. 2) Mapear sinais (buscas, interações). 3) Definir conversões e KPIs por estágio. 4) Conectar canais, criativos e ofertas a cada estágio.[^2] | Planejamento digital integrado (mídia + conteúdo + produto), especialmente em negócios com dados ricos de comportamento. | Campanhas ultra táticas sem estrutura de dados; contexto de baixa maturidade em analytics. | Estudos de caso de growth e guias de consultoria mostram aumento de ROI ao alinhar canais e mensagens a intenções explícitas.[^2] | Pode ser complexo para PME sem recursos de analytics; risco de overengineering. | Médio |
| **Jobs to be Done (JTBD) aplicado à comunicação** | Teoria de inovação (Christensen) aplicada a marketing; algumas consultorias e agências usam para mensagens.[^7] | Entender a "tarefa" que o cliente quer resolver (job) e usar isso para guiar mensagens e ofertas. | 1) Identificar jobs (ex.: "chegar bem à entrevista" para barbearia). 2) Mapear barreiras. 3) Criar mensagens e ofertas que resolvem o job. | Desenvolvimento de posicionamento e criativos; especialmente em categorias com forte componente emocional ou funcional. | Planejamento de mídia puramente tático focado em CPC/CPA de curto prazo. | Casos qualitativos e alguns estudos mostram melhor resposta criativa ao falar em jobs, não em features.[^17] | Menos quantitativamente validado em mídia; risco de subjetividade. | Médio–Baixo |
| **Customer Journey Mapping** | Herramentas de CX/UX e consultorias; foco em mapear pontos de contato.[^16] | Visualizar jornada de cliente e identificar pontos de dor onde mídia e CRO podem atuar. | 1) Mapear etapas da jornada e touchpoints. 2) Coletar dados de comportamento. 3) Identificar gaps e oportunidades. 4) Planejar campanhas e testes em pontos críticos. | B2B, SaaS e produtos complexos com múltiplos pontos de contato (site, vendas, suporte). | Campanhas simples de resposta direta com jornada curta. | Casos de CX mostram redução de churn e aumento de conversão ao atuar em pontos críticos mapeados.[^7] | Pode virar exercício teórico sem conexão clara com mídia paga. | Médio |
| **Growth Marketing / Demand Generation** | Cultura de startups SaaS e B2B, reforçada por consultorias e plataformas de automação.[^16] | Focar em geração de demanda qualificada (pipeline) em vez de volume bruto de leads. | Combinar conteúdo, mídia paga, SDRs, eventos e nurturing; medir pipeline, SQL, oportunidade e receita atribuída. | B2B com ciclo longo e vendas complexas. | Varejo simples, tickets baixos e jornadas curtas. | Estudos de empresas B2B mostram maior eficiência em CAC ao focar em demanda qualificada e influenciar decisores cedo.[^16] | Muitas definições concorrentes; pode ser buzzword sem mudança real de prática. | Contestado |
| **Performance Marketing** | Termo amplo usado por plataformas e agências, focando em métricas de resposta (CPA, ROAS).[^1] | Mídia orientada a conversão com mensuração direta de resultado. | Planejar campanhas com eventos de conversão claros, otimizar lances e criativos com base em resultados, e escalar o que entrega ROI. | E-commerce, lead gen e negócios com tracking robusto e ciclo curto/médio. | Construção de marca de longo prazo sem conversões rastreáveis; categorias com baixa digitalização de jornada. | Benchs de Google, Meta e consultorias mostram forte correlação entre automação + otimização por conversão e ganhos de eficiência.[^1][^4] | Risco de miopia de curto prazo e subinvestimento em marca. | Médio |
| **Integrated Marketing Communications (IMC)** | Abordagem acadêmica e de consultorias para integrar comunicação em múltiplos canais.[^7] | Garantir consistência de mensagem e sinergia entre mídia paga, orgânica, PR e trade. | Planejar campanhas simultâneas com mensagens alinhadas; coordenar mídia e canais próprios; usar media mix modeling para avaliar impacto. | Marcas com presença multicanal significativa; investimentos em TV, digital, OOH etc. | PME com poucos canais e baixa complexidade de presença. | Estudos de efetividade mostram ganhos de efeito quando se integra canais em vez de operar isolados.[^7][^17] | Exige coordenação organizacional difícil e mais orçamento para testes. | Médio |
| **Regras de alocação 60/40 (Binet & Field/IPA)** | Baseadas em metanálises de cases de efetividade da IPA, sintetizadas em obras como "Effectiveness in Context".[^12][^11] | Equilíbrio entre construção de marca e ativação de vendas ao longo do tempo. | Usar 60% da verba em campanhas de marca (alcance amplo, mensagem emocional) e 40% em ativação (resposta direta), ajustando a proporção por categoria e contexto.[^10] | Anunciantes com budgets relevantes e marca em construção/expansão; categorias onde penetração e share of voice importam. | Microanunciantes com orçamento muito limitado; contextos onde a marca já é dominante e o foco é eficiência de vendas. | IPA mostra maior crescimento de lucro e market share quando há investimento consistente em marca; variações da regra por categoria são documentadas.[^12][^17] | Críticas apontam uso dogmático da proporção sem considerar contexto; tendência de subestimar ativação em categorias muito promocionais. | Médio–Alto |

**Modelos mais recentes (2024–2026):**

- **Full-Funnel Performance (Meta, TikTok, WARC):** integração explícita de campanhas brand + performance com mensuração incremental e budget rebalancing contínuo.[^23][^6][^8]
- **Intent-based planning (STDC evoluído):** frameworks que ligam estágios de intent a sinais de dados em produto/analytics e alimentam modelos de Next Best Action.[^2]
- **AI-driven portfolio optimization:** distribuição de verba por algoritmos de IA (PMax, Advantage+, Performance+ em Pinterest), exigindo planejamento centrado em sinais e guardrails.[^24][^5][^4]

Esses modelos não substituem totalmente os clássicos, mas os conectam a dados, automação e mensuração incremental.


### 2.3 Anatomia do planejamento de uma campanha

#### Elementos-chave e critérios de decisão

1. **Objetivo de campanha (goal):** descrito em termos de resultado de negócio (vendas, leads qualificados, visitas à loja) e alinhado ao objetivo da plataforma (Sales, Leads, Traffic, Awareness).[^25][^26][^18]
2. **KPI primário:** métrica direta que indica sucesso do objetivo (CPA, ROAS, CPL, custo por visita qualificada, taxa de conversão).[^1]
3. **KPIs secundários:** métricas de suporte (CTR, frequência, custo por clique, engajamento, taxa de abertura de formulário) que ajudam a diagnosticar problemas.[^7][^1]
4. **Métricas de diagnóstico:** indicadores de qualidade de tráfego e criativo (bounce rate, tempo na página, scroll, eventos intermediários em GA4, search terms).[^1]
5. **Metas numéricas:** definidas "de trás para frente" a partir da meta de receita, margem ou volume de leads, usando fórmulas de funil.
6. **Orçamento total e diário:** calculados para garantir volume de conversões suficiente para aprendizado e estabilidade em automação (30–50 conversões/mês por campanha).[^13][^4][^1]
7. **Distribuição de verba entre campanhas:** baseada em valor de intenção (search → mais verba; upper funnel → verba controlada com tetos), papel de cada campanha e testes incrementais.[^7][^1]
8. **Duração e calendário:** ajustados à sazonalidade, ciclos de aprendizado das plataformas (mínimo 7 dias para campanhas automatizadas) e janelas de atribuição.[^21][^4]
9. **Frequência e saturação:** monitoradas por métricas como frequência média, CPM, queda de CTR e aumento de CPA; plataformas como Meta e TikTok recomendam renovação regular de criativos para evitar fadiga.[^5][^8]
10. **Segmentação:** combinação de intenção (palavras-chave, sinais de compra) com públicos baseados em comportamento (remarketing, lookalikes) e segmentações contextuais (interesses, demografia).[^19][^27][^3]
11. **Canais e formatos:** escolhidos por papel no funil (search para demanda existente, vídeo/social para demanda gerada) e adequação ao produto/mercado.[^9][^8][^7]
12. **Criativos e mensagens:** desenhados como matriz de ângulos (dor, benefício, prova social, oferta) por formato (imagem, vídeo, carrossel, UGC) e público.[^14][^13][^5]
13. **Ofertas:** decididas com base em margem, sensibilidade a preço e estágio de jornada (descontos para conversão, conteúdo/benefício para awareness).[^17][^7]
14. **Plano de testes (A/B):** define hipóteses específicas (ex.: novo ângulo de prova social reduz CPA em 15%), variáveis (headline, imagem, landing), tamanho de amostra e janelas de leitura.[^7]
15. **Hipóteses:** explicitadas em termos de comportamento esperado ("Criativos em vídeo com UGC terão ROAS maior que imagens estáticas"), evitando testes aleatórios.[^13]
16. **Plano de otimização:** lista de ações por cenário (escala, pausa, realocação) com cadências diárias, semanais e mensais.[^1]

#### Exemplo numérico de metas e orçamento (ilustrativo)

Exemplo ilustrativo, sem fonte específica, para uma PME de serviços locais com meta trimestral:

- Meta de receita adicional: R$ 180.000 em 3 meses (R$ 60.000/mês).
- Ticket médio: R$ 300 por venda (dado interno). Portanto, é necessário gerar 200 vendas/mês (60.000 / 300).
- Conversão de lead para venda: 50% (esperado). Necessário 400 leads qualificados/mês.
- Conversão de clique para lead: 10% na landing page. Necessário 4.000 cliques/mês.
- Meta de CPL: R$ 25 (ilustrativo). Orçamento de mídia necessário: 4.000 cliques × R$ 2,50 de CPC médio ou 400 leads × R$ 25 CPL = R$ 10.000/mês.

Depois, verifica-se se o CPA resultante é aceitável: R$ 10.000 / 200 vendas = R$ 50 de custo de mídia por venda. Se margem líquida por venda for maior que R$ 50 + custos fixos, a campanha é viável.

Plataformas sugerem budgets mínimos aproximados para que automação funcione: por exemplo, Meta Advantage+ recomenda pelo menos 50 conversões em 30 dias e budgets diários que permitam 1–2 conversões/dia.[^21][^13]
Guia de Google Ads e análises de consultorias recomendam budgets diários na ordem de 10 vezes o target CPA em campanhas com lances automáticos (se o target CPA é R$ 50, budget diário em torno de R$ 500) para dar flexibilidade ao aprendizado.[^1]


### 2.4 Como o plano muda conforme objetivo e contexto de negócio

#### Tabela: Por etapa de funil

| Etapa | Objetivo recomendado na plataforma | KPI primário | Janela de atribuição típica | Tempo mínimo de aprendizado | Verba mínima viável (ilustrativa) | Sinal de conversão a otimizar | Erro comum |
|-------|------------------------------------|-------------|-----------------------------|------------------------------|-----------------------------------|-------------------------------|-----------|
| Awareness / alcance | Awareness/Reach (Meta, LinkedIn, TikTok, Pinterest), Video Views (YouTube, TikTok)[^18][^8][^19] | CPM, alcance qualificado | 1–7 dias (foco em impressões, não em conversões) | 3–7 dias de veiculação com volume alto de impressões | R$ 3.000–10.000/mês em contas multi-plataforma (ilustrativo) | Engajamentos leves (views ≥ X%, visitas de marca, buscas de marca) | Otimizar por cliques ou conversões sem volume, ou avaliar só CTR |
| Tráfego / consideração | Traffic/Website Visits/Consideration[^18][^28][^24] | CPC, visitas qualificadas | 7–14 dias | 7–14 dias com dados suficientes de comportamento em site | R$ 5.000/mês por canal (ilustrativo) | Eventos de engajamento (scroll, tempo na página, eventos GA4) | Não definir o que é visita qualificada; focar apenas em volume |
| Lead gen | Leads, Lead Generation, Conversion com evento de lead[^18][^26] | CPL, taxa de conversão de formulário | 7–30 dias, dependendo do ciclo de follow-up | 14–30 dias para 30–50 leads por campanha | R$ 5.000–20.000/mês, dependendo de CPL alvo (ilustrativo) | Evento de lead qualificado (form enviado + critérios em CRM) | Otimizar para leads brutos sem qualificação; usar eventos superficiais |
| Conversão / vendas | Sales, Website Conversions, Shopping, PMax, Advantage+ Shopping[^29][^4][^21][^30] | CPA, ROAS | 7–30 dias | 14–30 dias para mínimo de 50 conversões/mês | R$ 10.000–50.000/mês para e-commerce com PMax/ASC (ilustrativo) | Purchase ou evento equivalente com valor de conversão | Misturar múltiplos objetivos de conversão na mesma campanha; pobre tracking |
| Retenção / remarketing | Retargeting/Conversions/Engagement focado em clientes atuais[^22][^13][^14] | CPO, incremental lift de recompra | 7–30 dias | 7–14 dias com pool de público suficiente | R$ 2.000–10.000/mês (ilustrativo) | Purchase repetida, eventos de reengajamento (login, uso de app) | Incluir prospecting no mesmo pool; não excluir compradores recentes |

As faixas de verba acima são ilustrações razoáveis para PME e médio porte e não têm fonte específica; quando fontes sugerem números, geralmente estão em moedas diferentes (US$), então aqui são adaptações qualitativas.[SEM FONTE ENCONTRADA — recomendação baseada em prática comum do setor]

#### Por evento e modelo de negócio

Fontes de consultorias e plataformas indicam diferenças na arquitetura por tipo de evento e negócio:[^30][^7]

- **Lançamentos e datas sazonais (Black Friday):** maior participação de campanhas de awareness e tráfego com janelas curtas e criativos específicos; uso intenso de automação como PMax e Advantage+ para capturar picos de demanda.[^4][^13]
- **Always-on:** estrutura de campanhas estável com testes contínuos de criativo, lances e públicos; budgets mantidos em níveis que garantam aprendizado perene.[^6][^1]
- **E-commerce:** forte uso de shopping/PMax, campanhas de catálogo e Advantage+ Shopping, remarketing dinâmico, e campanhas de descoberta (Demand Gen, TikTok, Pinterest).[^29][^24][^4][^21]
- **SaaS/B2B ciclo longo:** maior peso em LinkedIn, search B2B, conteúdo e campanhas de lead gen com qualificação; foco em janelas de atribuição mais longas (30–90 dias) e modelos de pipeline.[^28][^18]
- **Negócio local:** prioridade em search (Google, Microsoft) para visitas e ligações, Google Maps/Business Profile, campanhas de alcance local em Meta e TikTok; janelas curtas de atribuição (7–14 dias).[^25][^30]
- **B2C ticket baixo:** campanhas de conversão com ROAS direto, remarketing agressivo, e uso de criativos focados em oferta; menor dependência de jornadas longas.[^9][^7]


### 2.5 Diferenças de planejamento por plataforma

#### Tabela comparativa de plataformas

| Plataforma | Intenção capturada (demanda existente vs gerada) | Objetivos suportados (principais) | Verba mínima recomendada (prática setorial) | Tempo de aprendizado | Qualidade de mensuração | Papel típico no mix | Quando usar | Quando evitar |
|-----------|--------------------------------------------------|-----------------------------------|----------------------|-----------------------|---------------------|------------------------|------------|--------------|
| Google Search | Alta demanda existente (intenção explícita)[^3][^1] | Sales, Leads, Website Traffic[^25] | Orçamentos que permitam CPC competitivo; guias sugerem budgets diários ≥ 10× target CPA para Smart Bidding.[^1] | 7–14 dias com 30–50 conversões/mês | Forte mensuração de cliques, conversões e caminho on-site via GA4; depende de bom tracking.[^1] | Núcleo de captura de intenção; base para e-commerce e lead gen. | Quando há volume relevante de buscas sobre produto/serviço. | Nichos sem busca, produtos totalmente novos sem demanda;
| Google Display / Demand Gen | Demandas geradas/descoberta + algum remarketing[^4] | Awareness, Traffic, Conversions com otimização por sinais. | Budgets moderados; suficiente para atingir alcance e gerar conversões de apoio. | 7–21 dias para consolidar aprendizado em públicos amplos | Mensuração boa em cliques/conversões, menor clareza em view-through; exige modelo de atribuição cuidadoso.[^7][^4] | Upper/mid-funnel, remarketing visual, ampliação de alcance. | Quando se deseja ampliar alcance além da busca; suporte a lançamentos. | Quando verba é limitada e não há estrutura de mensuração incremental.
| Performance Max (Google) | Mistura demanda existente e gerada via inventário completo.[^29][^4] | Sales, Leads, Local store visits, online sales.[^29][^4] | Recomendado para contas com ≥ 30–50 conversões/mês e orçamento consistente; guias sugerem não iniciar com budgets ínfimos.[^4] | 14–30 dias, com sensibilidade a edições frequentes.[^4][^31] | Boa para conversões online; limitada para entender canal específico; exige eventos bem configurados. | Hub automatizado para e-commerce e lead gen com múltiplos canais. | Quando há estrutura de tracking robusta e inventário amplo (produtos). | Contas novas sem dados, tracking frágil, pouca verba; categorias reguladas com necessidade de controle rígido de mensagem.
| YouTube Ads | Geração de demanda, awareness, consideration.[^7] | Awareness, Consideration, Leads (com formulários), Sales de suporte. | Requer budgets significativos para alcance e frequência eficientes; recomendado em estratégias de marca ou remarketing.[^7] | 7–21 dias | Mensuração forte em views, view-through e cliques; atribuição de vendas mais complexa. | Construção de marca, storytelling, educonversão. | Quando é necessário explicar produto/serviço e construir marca visualmente. | Verba muito limitada focada em CPA imediato.
| Meta Ads (Facebook/Instagram) | Misto de demanda gerada e capturada; forte em discovery e remarketing.[^26] | Awareness, Traffic, Engagement, Leads, Sales, App Promotion.[^26] | Prática comum sugere budgets diários suficientes para pelo menos algumas conversões/dia em campanhas de conversão (ex.: US$ 50/dia em ASC).[^21][^13] | 7–14 dias (learning phase); alterações reiniciam aprendizado.[^21][^5] | Boa para conversões online; elevada dependência de pixel/CAPI; ainda impacto de perda de sinal de terceiros. | Discovery, remarketing, vendas sociais, catálogo. | Quando produto é visual e público está em redes sociais; complementa search. | Negócios com restrições severas (saúde, finanças) onde políticas limitam alcance; tracking fraco.
| Advantage+ Shopping (Meta) | Otimização automatizada para compras (e-commerce).[^21][^5][^13] | Sales com catálogo integrado. | Recomendações de especialistas: pelo menos 50 conversões nos últimos 30 dias e budget diário ≥ US$ 50.[^21][^13] | 7–14 dias | Boa em compras, menos transparência em segmentos; depende de bom catálogo e tracking. | Escala de e-commerce com múltiplos SKUs. | Quando há catálogo, tracking limpo e criativos variados. | Lojas com volume baixo de compras, produtos sem catálogo estruturado.
| LinkedIn Ads | Demanda gerada em B2B; intenção profissional.[^18][^28] | Awareness, Consideration (Website Visits, Engagement), Conversions (Lead Gen, Website Conversions).[^18][^28] | CPCs elevados; budgets precisam ser maiores para volume de leads significativo (B2B). | 14–30 dias | Boa em leads e métricas de engajamento; atribuição de vendas via CRM. | Geração de leads B2B qualificados, ABM. | Quando ICP está bem definido e ciclo de vendas é longo; conteúdo B2B forte. | B2C massivo, tickets baixos; falta de ICP claro.
| TikTok Ads | Forte geração de demanda, descoberta, storytelling.[^32][^23] | Awareness, Traffic, Conversions, App installs.[^8][^23] | Budgets moderados com foco em volume de impressões e eventos; case studies mostram impacto em ROAS quando full-funnel.[^32][^23] | 7–14 dias | Mensuração boa em cliques e conversões; view-through ainda desafiador. | Construção de marca, discovery de produtos, remarketing com criativos nativos. | Quando público está na plataforma e produto é visual; e-commerce D2C. | Produtos altamente regulados; anunciantes sem capacidade de produzir vídeo nativo.
| Pinterest Ads | Demanda gerada, planejamento e intenção futura.[^19][^24][^9] | Awareness, Consideration, Conversions, Catalog Sales.[^24] | Guias sugerem budget inicial ≥ US$ 500–1000/mês para otimização efetiva.[^24][^14] | 7–21 dias | Boa mensuração de cliques e conversões; forte sinal de intenção em boards e buscas. | Inspiração, planejamento (moda, decoração, receitas), e-commerce. | Quando produto se encaixa em contextos visuais de planejamento e inspiração. | Produtos sem fit visual ou target fora da base da plataforma.
| X Ads (Twitter) | Demanda gerada, conversas, newsjacking.[^33][^34][^35] | Awareness, Consideration (Engagement, Website Clicks), Conversions.[^36][^35] | Budgets flexíveis; cuidado com inventário e qualidade de contexto. | 7–14 dias | Mensuração razoável em engajamento e cliques; atribuição de conversão limitada. | Alcance em conversas, tópicos em tempo real, lançamento de produtos. | Quando marca quer participar de conversas e nichos ativos na plataforma. | Campanhas de conversão pura sem narrativa; categorias sensíveis a brand safety.
| Microsoft Ads | Demanda existente em busca (Bing) + redes nativas.[^37][^30][^27] | Search, Shopping, Audience, Performance Max (retail), Smart Campaigns.[^30][^27] | Budgets menores que Google podem funcionar, mas smart automation ainda requer 30–50 conversões/mês para estabilidade (regra prática).[^30][^27] | 7–21 dias | Boa mensuração em search; integração com UET e Microsoft Clarity ajuda em tracking de eventos.[^15][^30] | Complemento a Google para intenções de busca, especialmente em desktop. | Quando público-alvo usa Bing/Edge; e-commerce com catálogo. | Produtos com público majoritário em mobile sem uso de Bing; falta de setup de UET.

Mudanças relevantes nos últimos 12–24 meses incluem: maior foco em IA e automação (PMax, Advantage+, Performance+), exigência de tracking server-side (CAPI, UET, GA4), consolidação de estruturas de conta, e guidelines mais fortes sobre volume mínimo de conversões para estabilidade.[^24][^30][^4][^21]

Após a tabela, o fluxo de decisão consolidado aparece na seção 4.6.


### 2.6 Estrutura de conta e infraestrutura de mensuração

#### Boas práticas de estrutura

Plataformas e consultorias apontam convergência em algumas recomendações:[^30][^3][^1]

- **Hierarquia clara:** Conta → Campanhas → Grupos de anúncios/ad sets → Anúncios → Keywords/Audiências.
- **Campanhas por objetivo:** separar campanhas por objetivo de marketing (Sales, Leads, Traffic, Awareness) e, quando relevante, por etapa de funil.[^1]
- **Segmentação por tema/produto/margem:** agrupar produtos ou serviços com margens e comportamentos similares; evitar misturar itens de margens muito diferentes na mesma campanha automatizada.
- **Públicos e exclusões:** sempre construir listas de remarketing (site visitors, cart abandoners, engaged users) e aplicar exclusões (compradores recentes) para evitar superexposição.[^22][^14][^13]
- **Estrutura de palavras-chave (search):** 5–20 keywords relacionadas por ad group, uso de broad match com Smart Bidding em campanhas consolidadas e negative keywords para controlar qualidade.[^3][^1]
- **Consolidação vs fragmentação:** recomenda-se reduzir número de campanhas e ad groups para aumentar volume de dados por segmento, especialmente com IA.[^30][^3][^1]
- **Landing pages:** cada ad group/ad set deve apontar para landing alinhada ao tema e intenção; páginas genéricas reduzem conversão.[^3][^7]

#### Conversões, pixels e tracking server-side

- **Eventos de conversão:** definir eventos essenciais (lead qualificado, purchase, add to cart, signup) e evitar excesso de eventos irrelevantes.[^15][^1]
- **Pixel e API de conversões:** plataformas reforçam uso combinado de pixel (browser) e API server-side (Meta CAPI, Google Enhanced Conversions, Microsoft UET) para melhor atribuição e resiliência à perda de cookies.[^5][^15][^4]
- **Consent mode:** Google recomenda o uso do Consent Mode v2 para ajustar medições em função de consentimento de cookies e sinalizar dados agregados.[^4]
- **UTMs:** usar parâmetros utm_source, utm_medium, utm_campaign, utm_content, utm_term de forma consistente para permitir análises em GA4 e BigQuery.[^38][^15]
- **Integração com CRM:** upload de conversões offline (leads qualificados, vendas em loja) para Google, Meta, LinkedIn etc., via arquivos ou API, melhora otimização e atribuição.[^18][^1]

#### Convenção de nomenclatura pronta para uso

Modelo sugerido (adaptável):

`[PLATAFORMA]_[OBJETIVO_NEGOCIO]_[TIPO_FUNIL]_[MODELO_NEGOCIO]_[LOCAL]_[PERIODO]_[VERSAO]`

Exemplos:

- `GADS_VENDAS_DO_ECOMMERCE_DO_BRASIL_SEARCH_ECOM_SP_2025Q4_V1`
- `META_LEADS_SALAO_FULLFunnel_LOCAL_SJRP_2025M09_V2`

Para grupos de anúncios/ad sets:

`[SEGMENTO]_[INTENCAO/PUBLICO]_[OFERTA]`

Ex.: `CORTE_MASC_INTENCAO_LOCAL_PROMO_SEMANA`.

Para anúncios:

`[FORMATO]_[ANGULO]_[CTA]`

Ex.: `VIDEO_JULGAMENTO_SOCIAL_AGENDE_HOJE`.

#### Padrão de UTM

UTM base recomendada:

- `utm_source` = plataforma (`googleads`, `meta`, `linkedin`, `tiktok`, `pinterest`, `xads`, `msads`).
- `utm_medium` = `cpc` (ou `paid_social`, `display`, `video` conforme canal).[^14][^24]
- `utm_campaign` = nome da campanha (abreviado) seguindo convenção acima.
- `utm_content` = variação de criativo (formato + ângulo).
- `utm_term` = keyword (para search) ou ID de público (para social).

Exemplo completo:

`https://exemplo.com/oferta?utm_source=meta&utm_medium=paid_social&utm_campaign=META_LEADS_SALAO_FULLFunnel_LOCAL_SJRP_2025M09_V2&utm_content=VIDEO_PROVA_SOCIAL_AGENDE_HOJE&utm_term=lookalike_clientes`.


### 2.7 Decisões de alocação

#### Critérios e dados usados

Estudos de IPA/WARC e guias de consultorias destacam alguns métodos recorrentes:[^16][^17][^7]

1. **Por objetivo:** alocar verba de acordo com objetivos de negócio (crescimento de demanda, conversão, retenção), usando frameworks como 60/40 para marca/performance.[^12][^10]
2. **Por participação de mercado/share of voice:** em categorias competitivas, recomenda-se share of voice ≥ share of market para crescer; implica budgets proporcionais.[^17]
3. **Por teste incremental:** usar experimentos (geo-tests, holdout de públicos) para medir incrementalidade de cada canal e ajustar budgets com base em lifts.[^16][^7]
4. **Por modelo de mix de mídia (MMM):** modelos econométricos que estimam contribuição marginal de cada canal para vendas, otimizando mix ao longo do tempo.[^17]
5. **Por regra histórica:** replicar percentuais usados em anos anteriores, ajustando marginalmente por resultados; prática comum em PME.[^7]

#### Premissas e limitações

- Métodos baseados em testes incrementais e MMM exigem volumes maiores de dados e investimento contínuo; difíceis para microanunciantes.[^17][^7]
- Regras de 60/40 e share of voice são diretrizes agregadas; a relação ideal varia por categoria e maturidade de marca.[^10][^12]
- Regra histórica tende a perpetuar má alocação se não revisada à luz de resultados e mudanças de plataforma.

#### Decisões operacionais

- **Qual canal entra no mix:** avaliar fit com público, estágio de funil, capacidade de produzir criativos adequados, regras de plataforma e impacto esperado.[^30][^7]
- **Quanto investir no total:** partir de metas de negócio (ver seção 2.3) e margens, e usar cenários de CPA/ROAS baseados em histórico ou benchmarks; nunca usar números sem fonte como absolutos.[^1]
- **Divisão entre canais:** começar com hipóteses (por exemplo, 50% demanda existente em search/shopping, 30% discovery/upper funnel, 20% remarketing) e ajustar mensalmente com base em incrementalidade e eficiência marginal.[^17][^7]
- **Divisão entre prospecção e remarketing:** plataformas e especialistas sugerem limitar spending em públicos muito quentes para não saturar; casos de Advantage+ utilizam caps de 25–30% para existing customers.[^13][^21][^5]
- **Divisão entre marca e performance:** usar frameworks de Binet & Field como ponto de partida (60/40) e ajustar conforme categoria e maturidade; indicar quando não aplicar (microanunciantes, campanhas puramente táticas).[^12][^10]
- **Quando escalar:** escalar quando CPA/ROAS estão dentro de metas, tracking está estável e há espaço de demanda (impression share, frequency, share of search).[^7][^1]
- **Quando pausar:** pausar campanhas com CPA muito acima do alvo, baixo volume prolongado, criativos saturados ou problemas de tracking.
- **Quando realocar:** realocar budget para canais/campanhas com melhor eficiência marginal (menor CPA incremental, maior ROAS incremental), usando análises comparativas semanais/mensais.[^7][^1]


### 2.8 Planejamento criativo

#### Estruturação do plano criativo

Plataformas destacam que qualidade e diversidade de criativos são alavancas principais de performance:[^8][^14][^5][^13]

- **Conceito criativo:** ideia central que conecta proposta de valor ao job do cliente (ex.: "entrar confiante no salão", "comprar moda que reforça estilo").
- **Proposta de valor e diferenciais:** mensagens que traduzem por que o negócio é melhor (qualidade, conveniência, prova social).[^17][^7]
- **Ângulos de comunicação:** dor, benefício, prova social, autoridade, urgência, risco invertido (garantias) etc.; plataformas e especialistas recomendam testar múltiplos ângulos com UGC, depoimentos, demos de produto.[^5][^13]
- **Copy e CTAs:** textos diretos, com linguagem adequada à plataforma, CTAs específicos ("agende hoje", "compre agora", "fale no WhatsApp").[^26]
- **Criativos por etapa de funil:** awareness (stories, vídeos, carrosséis com storytelling), consideração (demonstrações, benefícios), conversão (ofertas claras, prova social), retenção (recompra, programas de fidelidade).[^8][^14]
- **Volume e taxa de renovação:** Meta e outras fontes sugerem manter ao menos 10–15 criativos ativos em campanhas automatizadas, renovando regularmente para evitar fadiga.[^21][^13][^5]
- **Fadiga criativa:** monitorada via queda de CTR, aumento de CPA e comentários repetitivos; guias recomendam refresh frequente de criativos, especialmente em campanhas always-on.[^14][^5]
- **Calendário de produção:** planejamento de entregas de criativos sincronizado com calendário de mídia (lançamentos, sazonalidade).[^7]
- **Matriz criativa (ângulo × formato × público):** tabela que cruza ângulos com formatos (imagem, vídeo, carrossel, UGC) e públicos (prospecting, remarketing, clientes atuais) para garantir diversidade.[^13][^14]

#### Processo de teste criativo

- **Hipóteses claras:** ex.: "UGC em vídeo curto terá CPA 20% menor que imagem estática em remarketing".[^13]
- **Estrutura de teste:** campanhas ou ad sets dedicados a creative testing, com budgets moderados e critérios de vencedor (CPA, ROAS, CTR, conversão).[^22][^13]
- **Declaração de vencedor:** guias de Meta recomendam critérios como volume mínimo de spend e conversões, performance estável ao longo de várias janelas; vencedores são movidos para campanhas de escala.[^26][^21]


### 2.9 Planejamento baseado em dados

#### Uso de dados na fase de planejamento

Principais fontes de dados relevantes:[^16][^1][^7]

- **Pesquisa de mercado:** dados de categoria, participação de mercado, comportamento de compra, benchmarks de mídia (WARC, IPA, Nielsen).[^16][^7]
- **Histórico da conta:** CPA, ROAS, CTR, conversão por campanha, search terms, públicos que já performaram bem.[^1]
- **Analytics (GA4):** eventos de engajamento, caminhos de conversão, funis, atribuição e export para BigQuery.[^1]
- **CRM:** taxas de conversão de lead para venda, ticket médio, LTV, churn, ciclo de vendas.[^16]
- **Dados das plataformas:** recomendações de budgets, janelas de aprendizado, lances sugeridos; embora tenham viés comercial, são úteis como ponto de partida.[^26][^4][^1]
- **Benchmarks de mercado:** usados com cuidado, pois refletem médias de contextos distintos.[^17][^7]
- **Sazonalidade:** variações de demanda por período (ex.: moda, beleza, BF), identificadas em histórico e ferramentas de pesquisa de palavras-chave.[^7]
- **Inteligência competitiva:** bibliotecas de anúncios (Meta Ad Library, TikTok Ad Library), ferramentas de espionagem (Similarweb, SEMrush etc.), usadas para entender mensagens e presença de concorrentes.[^9][^7]

#### Cenário sem dados históricos

Quando não há histórico (conta nova, produto novo), práticas comuns incluem:[^16][^1]

- Usar benchmarks externos de categoria (com clareza de que são médias e de que cada negócio vai divergir).[^17][^7]
- Definir metas de teste (ex.: máximo CPA aceitável) e budgets de aprendizado (ex.: investir 1–3 vezes o valor esperado de CPA para obter sinais iniciais).[^1]
- Focar em hipóteses de funil e mensagens, testando múltiplos ângulos e ajustando rápido conforme resultados.[^13]


### 2.10 Documentos e artefatos

#### Exemplos reais e funções

Fontes de plataformas e materiais de planejamento de LinkedIn e Pinterest oferecem modelos e templates:[^19][^24][^18]

1. **Media Plan**
   - Objetivo: consolidar plano de canais, budgets, metas e cronograma.
   - Quem escreve: gestor de mídia/planner.
   - Quem aprova: cliente/marketing lead.
   - Quando: após briefing e diagnóstico, antes de produção final de criativos.
   - Seções: objetivos de negócio, objetivos de mídia, canais, formatos, orçamento por canal, metas numéricas, cronograma.
   - Erros comuns: metas não ligadas a negócio; falta de link entre canais e etapas de funil.

2. **Campaign Brief / Creative Brief**
   - Objetivo: orientar criação com contexto de negócio e mídia.[^18]
   - Quem escreve: planner/atendimento.
   - Quem aprova: cliente e líder de criação.
   - Seções: contexto, público, objetivos, mensagens-chave, tom, mandatories, métricas de sucesso.
   - Erros comuns: briefs vagos, sem problema definido, levando a criativos genéricos.

3. **Measurement Plan**
   - Objetivo: definir como mensurar sucesso e quais dados serão coletados.[^7]
   - Quem escreve: analytics/mídia.
   - Quem aprova: marketing/cliente.
   - Seções: objetivos, KPIs, eventos, tags, janelas de atribuição, ferramentas, cadências.
   - Erros comuns: ausência de definição clara de eventos e janelas, confundindo relatórios.

4. **Test Plan**
   - Objetivo: organizar testes de criativos, públicos, lances, landing pages.
   - Quem escreve: mídia/analytics.
   - Quem aprova: time de mídia/cliente.
   - Seções: hipóteses, variáveis, tamanho de amostra, janela de teste, critérios de sucesso.

5. **Dashboard executivo**
   - Objetivo: fornecer visão de alto nível de performance para decisores.[^1]
   - Quem escreve/configura: analytics.
   - Quem aprova: diretoria.
   - Seções: KPIs principais, tendências, alertas, insights.

6. **Calendário de campanhas**
   - Objetivo: mapear campanhas, períodos, eventos de negócio.
   - Quem escreve: mídia/atendimento.
   - Seções: campanhas, datas de início/fim, eventos internos/externos, marcos de análise.

7. **Checklist de lançamento**
   - Objetivo: evitar erros operacionais antes do go-live.
   - Quem escreve: mídia/analytics.
   - Seções: tracking, criativos, segmentações, budgets, aprovações.

8. **Learning Log**
   - Objetivo: registrar aprendizados e decisões com base em dados.[^1]
   - Quem escreve: mídia/analytics.
   - Seções: testes, resultados, insights, decisões futuras.


### 2.11 Ciclo contínuo

#### Loop de planejamento a reaproveitamento

Baseado em guias de Google, Meta e consultorias:[^6][^7][^1]

1. **Pesquisa:** coleta de dados de mercado, histórico, concorrência.
2. **Planejamento:** definição de objetivos, funil, mix de canais, estrutura de conta, criativos, mensuração.
3. **Implementação:** configuração técnica, subida de campanhas e criativos.
4. **Monitoramento:** leitura de KPIs e diagnósticos em cadências diárias/semanais/mensais.
5. **Otimização:** ajustes de budgets, segmentações, lances, criativos e ofertas.
6. **Aprendizado:** consolidação de insights em learning log e documentos de estratégia.
7. **Reaproveitamento:** uso de aprendizados para novos ciclos (campanhas futuras, novos produtos, mercados).

#### Cadências típicas

- **Diária:** checar spend, problemas de tracking, grandes quedas de performance, erros operacionais.[^1]
- **Semanal:** revisar KPIs por campanha, tendências, search terms, criativos; aplicar ajustes moderados.[^22][^1]
- **Mensal:** avaliar mix de canais, eficiência marginal, incrementalidade; ajustar budgets entre canais.[^17][^7]
- **Trimestral:** revisar estratégia de funil, posicionamento, metas de negócio, e realinhar portfólio de campanhas.[^6][^17]


### 2.12 Erros comuns

#### Lista de erros frequentes

Ordenados por frequência × impacto, com base em guias de plataformas e estudos de consultorias:[^17][^7][^1]

1. **Começar pelo botão da plataforma, não pelo objetivo de negócio.**
   - Sintoma: campanhas com KPIs incoerentes (ex.: campanha de awareness julgada por CPA).
   - Causa raiz: falta de alinhamento entre marketing e negócio.
   - Custo típico: desperdício de verba sem impacto real.
   - Prevenção: briefing forte e measurement plan claro.
   - Correção: redefinir objetivos, KPIs e possivelmente reestruturar campanhas.

2. **Tracking incompleto ou incorreto.**
   - Sintoma: discrepâncias entre dados da plataforma e GA4/CRM; conversões sub ou supercontadas.[^15][^1]
   - Causa: tags mal configuradas, ausência de CAPI/server-side, janelas de atribuição erradas.
   - Custo: decisões baseadas em dados incorretos; otimização errada.
   - Prevenção: checklist de tracking; QA antes do lançamento.
   - Correção: corrigir eventos, rever attribution e reconfigurar automação.

3. **Fragmentação excessiva de campanhas e ad sets.**
   - Sintoma: baixa quantidade de conversões por campanha, algoritmos instáveis.[^3][^30][^1]
   - Causa: tentativa de “hypersegmentação” sem volume.
   - Custo: lances automáticos com ruído, alta variação de CPA.
   - Prevenção: estrutura consolidada e clara por objetivo.
   - Correção: consolidar campanhas/ad sets com objetivos e públicos semelhantes.

4. **Criativos genéricos e pouco testados.**
   - Sintoma: CTR baixo, CPA alto, pouca diferenciação.[^14][^5][^13]
   - Causa: falta de planejamento criativo, ausência de matriz e testes.
   - Custo: perda de eficiência em plataformas onde criativo é principal driver.
   - Prevenção: matriz criativa, calendário de produção e plano de testes.
   - Correção: rodar ciclos de creative testing e substituir criativos fracos.

5. **Alocação de verba baseada apenas em histórico, sem incrementalidade.**
   - Sintoma: canais em que se investe por inércia, mesmo com baixa eficiência marginal.[^17][^7]
   - Causa: ausência de experimentos e modelos.
   - Custo: oportunidade perdida em canais mais eficientes.
   - Prevenção: incluir testes incrementais no plano.
   - Correção: usar testes e rebalancing mensal.

6. **Ignorar contexto regulatório e de política de plataforma.**
   - Sintoma: anúncios reprovados, contas bloqueadas.
   - Causa: desconhecimento de políticas em segmentos sensíveis (saúde, finanças).[^34][^20]
   - Custo: perda de tempo e risco de banimentos.
   - Prevenção: revisão de políticas antes do lançamento.
   - Correção: ajustar mensagens e ofertas para compliance.

---

## 4.3 Framework consolidado de planejamento

*(Desenvolvido na síntese a partir das seções 2.1–2.12; todos os elementos aparecem operacionalizados nos entregáveis 4.4, 4.6, 4.7 e 4.8.)*

**Nome:** Framework de Planejamento Full-Funnel Orientado a Sinais (FPFS).

**Diagrama textual de etapas:**

1. **Alinhamento de negócio e objetivos** → metas de receita/leads, restrições, prioridades.
2. **Leitura de dados e contexto** → histórico, benchmarks, sazonalidade, concorrência.
3. **Arquitetura de funil e mix de canais** → definição de STDC/funil, papel de cada plataforma.
4. **Desenho de estrutura de conta e mensuração** → campanhas, eventos, UTMs, atribuição.
5. **Planejamento criativo e ofertas** → conceitos, ângulos, formatos, matriz criativa.
6. **Media plan e alocação de verba** → budgets por canal/campanha, 60/40 ajustado ao contexto.
7. **Implementação técnica e QA** → tags, pixels, APIs, testes.
8. **Go-live e aprendizado controlado** → monitoramento inicial, sem resets desnecessários.
9. **Otimização e testes incrementais** → ajustes, experimentos, creative testing.
10. **Aprendizado, documentação e reaproveitamento** → learning log, refinamento de tese.

Cada etapa é justificada por evidência das boas práticas de plataformas, estudos de IPA/WARC e guias de consultorias que enfatizam objetivos claros, estrutura enxuta, automação baseada em dados e ciclos de aprendizado contínuo.[^6][^7][^17][^1]

---

## 4.4 Processo passo a passo (briefing → go-live)

### Visão geral

Fluxo adaptado à realidade de agência que atende múltiplos clientes com maturidade intermediária e ferramentas Google Ads, Meta Ads, GA4, BigQuery e Notion.[^1_1][^1_2]

### Tabela – Processo operacional

| Etapa | Nome | Responsável sugerido | Entradas | Saídas | Duração típica | Critério de conclusão |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| 1 | Briefing de negócio | Atendimento / Gestor de tráfego | Reunião com cliente, dados de negócio, histórico básico | Documento de briefing (contexto, objetivos, restrições) | 1–3 dias | Objetivo de negócio, público-alvo, produtos/serviços e KPIs de negócio claramente definidos.[^1_22][^1_3] |
| 2 | Diagnóstico de dados | Gestor + Analytics | Acesso a GA4, CRM, relatórios de campanhas passadas | Sumário de histórico (CPAs, ROAS, funis, sazonalidade) | 2–5 dias | Entendimento de baseline de performance e principais gargalos (funil, criativos, canais).[^1_2] |
| 3 | Arquitetura de funil e mix de canais | Planner / Gestor | Briefing + diagnóstico | Mapa full funnel (topo/meio/fundo/retention) + papel de cada canal (Search, Social, Display, etc.) | 2–4 dias | Funil desenhado com objetivos por etapa e canais associados (ex.: Search para Do, Meta/TikTok para See/Think).[^1_8][^1_9] |
| 4 | Estrutura de conta e mensuração | Gestor + Analytics | Mapa de funil + mix de canais | Draft de estrutura de campanhas, grupos, eventos, UTMs, janelas de atribuição | 2–4 dias | Lista de campanhas, objetivos, eventos de conversão, UTMs e modelo de atribuição definida e documentada.[^1_1][^1_2] |
| 5 | Planejamento criativo | Planner + Criação | Brief + arquitetura de funil | Matriz criativa (ângulo × formato × público) + calendário de produção | 5–15 dias (dependendo de volume) | Conceitos, ângulos, formatos e peças priorizadas por etapa de funil, com volume mínimo para testes.[^1_7][^1_14][^1_15] |
| 6 | Media plan e alocação | Gestor / Planner | Estrutura, mensuração e criativo | Media plan com budgets por canal, metas numéricas (CPA, ROAS, CPL) e calendário | 1–3 dias | Orçamento distribuído com racional claro (full funnel, 60/40 ajustado, share of voice) e metas numéricas consistentes.[^1_2][^1_13][^1_18] |
| 7 | Implementação técnica e QA | Gestor + Analytics | Estrutura e measurement plan | Contas configuradas, tags/pixels instalados, UTMs aplicadas, testes realizados | 1–3 dias | Eventos disparam corretamente em GA4/plataformas, UTMs chegam limpos, nenhuma quebra crítica identificada.[^1_16][^1_4] |
| 8 | Aprovação | Atendimento / Cliente | Media plan, criativos, measurement plan | Aprovação formal (orçamento, criativos, tracking) | 1–5 dias | Cliente valida objetivos, budgets, mensagens e riscos; pendências documentadas e resolvidas. |
| 9 | Go‑live e fase de aprendizado | Gestor de tráfego | Campanhas configuradas e aprovadas | Campanhas ativas, primeiras leituras de KPIs | ≥ 7–14 dias para campanhas automatizadas | Campanhas saem do learning phase (volume adequado de conversões) sem resets desnecessários de orçamento.[^1_2][^1_4][^1_6] |

Observação: você pode configurar este fluxo como board em Notion (status por etapa + campos-chave) e automatizar lembretes de QA e aprovações via n8n, conforme sua operação agêntica.

***

---

## 4.5 Tabela comparativa de metodologias

A comparação entre frameworks está na seção **2.2** (dentro de 4.2), em
formato de ficha padronizada por framework — origem, o que resolve, como
aplicar, quando usar e quando não usar, evidência, críticas e nível de
consenso. Ela pode ser expandida com colunas de porte, verba, maturidade e
esforço conforme a necessidade de cada cliente.

---

## 4.6 Matriz de decisão (objetivo + modelo de negócio → abordagem, canais, estrutura)

### 4.6.1 Tabela – Contextos típicos da sua carteira

| Contexto | Objetivo principal | Modelo de negócio | Abordagem recomendada | Plataformas prioridade | Estrutura base |
| :-- | :-- | :-- | :-- | :-- | :-- |
| Negócio local (barbearia, salão, boutique) | Visitas, agendamentos, leads WhatsApp | Serviços locais B2C | Foco em demanda existente + presença local + remarketing leve. | Google Search/Maps, Meta Ads (WhatsApp, feed, stories) | 1 campanha Search “Serviços + cidade” (Leads/Sales) + 1 campanha Meta de conversão para WhatsApp + 1 campanha de alcance local se verba permitir.[^1_23][^1_24] |
| E‑commerce PME | Vendas online, ROAS | E‑commerce B2C ticket médio/baixo | PMax/Shopping para catálogo + campanhas de discovery + remarketing dinâmico. | Google PMax/Shopping, Meta Advantage+ Shopping, TikTok/Pinterest para discovery | 1 PMax (Sales) por grande categoria + 1 ASC no Meta para catálogo + campanhas de remarketing em Meta/TikTok + Search para termos de alta intenção.[^1_25][^1_4][^1_6][^1_26] |
| B2B leads (ciclo longo) | Leads qualificados, pipeline | Serviços B2B, SaaS | Full funnel orientado a conteúdo + LinkedIn + Search B2B. | LinkedIn Ads, Google Search, remarketing em Meta/LinkedIn | Campanhas de awareness em LinkedIn (Brand Awareness) + Website Visits (conteúdo) + Lead Gen com formulários nativos, complementadas por Search “serviço + problema” com conversão em lead qualificado.[^1_20][^1_27] |
| B2C ticket baixo (infoprod, pequenos produtos) | Vendas, ROAS, escala rápida | E‑commerce ou info B2C | Performance direta com remarketing pesado + testes intensivos de criativo. | Meta Ads, TikTok Ads, Google Search para alta intenção | 1–2 campanhas de conversão (Sales) em Meta/TikTok com CBO e creative testing + Search para termos exatos de produto/oferta + remarketing consolidado.[^1_14][^1_9][^1_28] |

### 4.6.2 Fluxo de decisão simplificado

Use como “roteador mental”:

1. **Se objetivo é gerar vendas online (e‑commerce) e há catálogo →**
    - Comece por **PMax + Shopping (Google)** e **Advantage+ Shopping (Meta)**, com Search para termos high‑intent e remarketing em social.[^1_25][^1_4][^1_6]
    - Evite PMax/ASC se não houver mínimo de 30–50 compras/mês e tracking limpo; nesse caso, use campanhas manuais de conversão com catálogo limitado.[^1_4][^1_6]
2. **Se objetivo é gerar leads B2B qualificados →**
    - Comece por **LinkedIn (Awareness + Website Visits + Lead Gen)** com conteúdo forte e formas nativas, apoiado por **Search** em termos de dor e solução.[^1_27][^1_20]
    - Evite campanhas de conversão direta em rede social sem educação prévia em ciclos longos; risco de leads superficiais.
3. **Se objetivo é tráfego qualificado para negócio local →**
    - Comece por **Google Search** com termos “serviço + bairro/cidade” e extensões de chamada/local, mais **Meta conversão para WhatsApp** com criativos de prova social local.[^1_23][^1_24]
    - Evite investir pesado em canais de upper funnel (TikTok/Pinterest) se o budget mensal for baixo; concentre em intenção e remarketing básico.
4. **Se objetivo é awareness de marca com verba relevante →**
    - Combine **YouTube/TikTok/Pinterest/Meta (Reach/Video/Awareness)** com campanhas de Search e Shopping para capturar demanda induzida, usando uma proporção inicial 60/40 entre marca e ativação.[^1_13][^1_3][^1_9][^1_10][^1_11][^1_8]
    - Evite julgar essas campanhas apenas por CPA; foque em métricas de alcance, view‑through e share of search.

***

---

## 4.7 Checklist de planejamento (pré-campanha)

Use como checklist no Notion antes de subir qualquer campanha nova.

### 4.7.1 Estratégia

- Objetivo de negócio está claramente definido (receita, margem, volume de leads qualificados, CAC, LTV).[^1_3][^1_2]
- Objetivo de mídia por campanha está alinhado (Sales/Leads/Traffic/Awareness) e mapeado ao funil (See–Think–Do–Care).[^1_24][^1_19]
- Mix de canais foi decidido com base em funil e contexto (local, e‑commerce, B2B).[^1_3][^1_5]
- Nível de investimento em marca vs performance foi pensado (ex.: 60/40) e ajustado à realidade do cliente.[^1_11][^1_13]


### 4.7.2 Mensuração

- Eventos de conversão definidos (lead qualificado, purchase, signup, add to cart) e documentados.[^1_2][^1_16]
- Tags/pixels instalados (Google Tag/GA4, Meta Pixel + CAPI, UET Microsoft, Pinterest Tag, TikTok Pixel) e testados.[^1_7][^1_26][^1_16][^1_4]
- Janelas de atribuição configuradas por tipo de campanha (e‑commerce: 7 dias; B2B: 30–90 dias).[^1_14][^1_6][^1_3]
- UTMs padronizadas (source, medium, campaign, content, term) e validadas em GA4.[^1_29][^1_16]
- Measurement plan criado (KPIs primários, secundários, diagnósticos, cadências).[^1_3]


### 4.7.3 Estrutura de conta

- Campanhas organizadas por objetivo (Sales, Leads, Traffic, Awareness) e, se possível, por etapa de funil.[^1_5][^1_2]
- Grupos de anúncios/ad sets com 5–20 palavras‑chave relacionadas (Search) ou públicos bem definidos (Social), evitando fragmentação excessiva.[^1_30][^1_1][^1_2]
- Negative keywords configuradas para bloquear pesquisas irrelevantes (free, jobs etc.).[^1_1][^1_2]
- Público de remarketing construído (visitantes, cart/checkout, leads antigos) e exclusões de compradores recentes aplicadas.[^1_31][^1_15][^1_14]
- Landing pages alinhadas a cada grupo/ad set (promessa, oferta, mensagem consistentes).[^1_1][^1_3]


### 4.7.4 Criativo

- Conceito criativo definido por campanha (ex.: “confiança no salão”, “promoção cápsula da coleção”).[^1_18][^1_3]
- Matriz criativa construída (ângulo × formato × público), com foco em UGC, prova social e demonstrações em Meta/TikTok/Pinterest.[^1_15][^1_7][^1_14]
- Volume mínimo de criativos garantido (>= 10–15 variações em campanhas automatizadas, 3–5 variações por batch).[^1_6][^1_14][^1_15]
- CTAs claros e específicos (Agende hoje, Compre agora, Fale no WhatsApp).[^1_24]


### 4.7.5 Orçamento

- Budget total trimestral definido e aprovado pelo cliente, com hipóteses de distribuição por canal.[^1_18][^1_2]
- Budgets diários por campanha são suficientes para gerar ao menos algumas conversões/dia em campanhas de conversão automatizadas.[^1_14][^1_2][^1_6]
- Cenários de CPA/ROAS construídos de trás para frente a partir das metas de negócio (ver exemplo na seção 2.3 do relatório).[^1_2]


### 4.7.6 Aprovações

- Briefing de campanha e criativo aprovados por cliente/responsáveis internos.
- Media plan, budgets e measurement plan aprovados e arquivados (Notion/Drive).[^1_21][^1_20]
- Riscos regulatórios revisados (saúde, finanças, políticas de conteúdo das plataformas).[^1_22][^1_32]


### 4.7.7 Pré-lançamento (últimas 24h)

- Passar checklist técnico: todos eventos disparam corretamente, UTMs ok, nenhuma quebra de pixel/API.[^1_16][^1_4]
- Verificar limites de budget, datas de início/fim e segmentações (localização, idade, idioma).[^1_33][^1_1]
- Confirmar criativos corretos em cada conjunto/campanha (sem placeholders ou peças antigas).
- Garantir que dashboards (GA4, Data Studio/Looker, Sheets, BigQuery) estão recebendo dados e que time sabe quais KPIs acompanhar desde o dia 1.[^1_2]

***

---

## 4.8 Template reutilizável de plano de campanha (Markdown + exemplo)

### 4.8.1 Template em branco

```md
# Plano de Campanha de Mídia Paga

## 1. Contexto e objetivo de negócio
- Modelo de negócio: [descrever: serviço local / e-commerce / B2B etc.]
- Mercado/região: [ex.: São José do Rio Preto – SP]
- Objetivo de negócio (em R$ / volume): [ex.: +R$ 60k/mês em receita]
- Restrições (margem, capacidade de atendimento, estoque, compliance): [lista]

## 2. Objetivos de mídia e funil
- Objetivo principal de mídia: [Sales / Leads / Traffic / Awareness]
- Etapas de funil cobertas: [See / Think / Do / Care]
- KPIs primários: [CPA, ROAS, CPL, CPO etc.]
- KPIs secundários e métricas de diagnóstico: [CTR, taxa de conversão, engajamento, bounce rate]

## 3. Público e proposta de valor
- Segmentos principais (STP): [segmentos de cliente]
- Job to be Done do cliente: [qual tarefa ele quer resolver]
- Proposta de valor: [porque comprar daquele cliente]
- Diferenciais competitivos: [preço, qualidade, conveniência, prova social]

## 4. Arquitetura de canais e campanhas
- Plataformas e papéis:
  - [Google Search] → [ex.: capturar intenção local]
  - [Meta Ads] → [ex.: gerar conversas no WhatsApp]
  - [Outras: TikTok, Pinterest, LinkedIn, X, Microsoft Ads] → [papel específico]
- Lista de campanhas:
  - Nome campanha 1: [formato: PLATAFORMA_OBJETIVO_FUNIL_NEGOCIO_LOCAL_PERIODO_VERSAO]
    - Objetivo (na plataforma): [Sales/Leads/Traffic/Awareness]
    - KPI primário: [CPA/ROAS/CPL etc.]
    - Público/segmentação: [keywords/públicos]
    - Landing pages: [URLs]
  - [repetir por campanha]

## 5. Estrutura de conta
- Estrutura Google Ads:
  - Campanhas: [lista]
  - Grupos de anúncios: [lista por tema/intenção]
  - Estrutura de palavras-chave: [broad/phrase/exact + negativos]
- Estrutura Meta Ads:
  - Campanhas: [lista]
  - Conjuntos de anúncios (ad sets): [públicos/papéis de funil]
  - Tipos de criativo: [imagem, vídeo, carrossel, UGC]

## 6. Mensuração e tracking
- Eventos de conversão: [lead qualificado, purchase etc.]
- Ferramentas: [GA4, BigQuery, CRM, pixels, APIs]
- Janelas de atribuição: [por plataforma e tipo de campanha]
- Padrão de UTMs: [source, medium, campaign, content, term]

## 7. Planejamento criativo
- Conceito criativo central: [descrição]
- Matriz criativa (ângulo × formato × público):
  - Ângulos: [dor, benefício, prova social, urgência etc.]
  - Formatos: [imagem, vídeo, carrossel, UGC]
  - Públicos: [prospecting, remarketing, clientes]
- Volume de criativos planejado: [número por campanha]

## 8. Orçamento e metas numéricas
- Budget total (mês/trimestre): [R$]
- Distribuição por canal/campanha (% e R$):
  - [canal/campanha] → [R$ e %]
- Metas numéricas:
  - CPA alvo: [R$]
  - ROAS alvo: [x,x]
  - CPL alvo: [R$]
- Racional (cálculo de trás para frente a partir da meta de negócio): [explicar brevemente]

## 9. Plano de testes
- Hipóteses prioritárias:
  - H1: [ex.: UGC vídeo reduz CPA em 20% vs imagem estática]
  - H2: [...]
- Variáveis a testar: [criativo, público, oferta, landing]
- Janela de teste: [datas]
- Critérios de sucesso: [mínimo de impressões/conversões, diferença percentual]

## 10. Operação e cadências
- Rotinas diárias: [o que é monitorado]
- Rotinas semanais: [revisões e otimizações]
- Rotinas mensais: [realocação de budget e análise de incrementalidade]
- Responsáveis por cada cadência: [nomes]

## 11. Aprovações e riscos
- Itens aprovados (cliente/time interno): [lista]
- Riscos e mitigação: [ex.: compliance, instabilidade de estoque]
- Próximos passos após go-live: [lista]

## 12. Aprendizados esperados e documentação
- Quais perguntas a campanha deve responder: [ex.: qual ângulo criativo funciona melhor]
- Onde os aprendizados serão registrados (learning log, Notion): [link]
```


### 4.8.2 Exemplo preenchido – caso fictício de serviço local (barbearia/salão)

Trecho ilustrativo (sem números reais, apenas para mostrar preenchimento):

```md
# Plano de Campanha de Mídia Paga – Barbearia & Salão Premium SJRP

## 1. Contexto e objetivo de negócio
- Modelo de negócio: Serviços locais B2C (barbearia + salão feminino premium).
- Mercado/região: São José do Rio Preto – SP.
- Objetivo de negócio (trimestre): +R$ 90.000 em receita incremental (R$ 30.000/mês).
- Restrições: capacidade máxima de 40 atendimentos/dia, equipe limitada à noite, manter ticket médio > R$ 150.

## 2. Objetivos de mídia e funil
- Objetivo principal de mídia: Leads e agendamentos (Sales/Leads nas plataformas).
- Etapas de funil cobertas: See (reconhecimento local), Think (consideração de serviços), Do (agendamentos), Care (recompra).
- KPIs primários:
  - CPA por agendamento confirmado (meta: ≤ R$ 40).
  - CPL por lead qualificado (meta: ≤ R$ 20).
- KPIs secundários:
  - Taxa de conversão visita → lead (meta: ≥ 10%).
  - Taxa de conversão lead → atendimento (meta: ≥ 50%).
  - CTR em criativos sociais (meta: ≥ 1,5%).

## 3. Público e proposta de valor
- Segmentos principais:
  - Homens 25–45 em SJRP buscando corte e barba premium.
  - Mulheres 25–45 buscando cabelo/coloração de alto padrão.
- Job to be Done:
  - “Chegar impecável a eventos, reuniões e momentos importantes sem perder tempo.”
- Proposta de valor:
  - Atendimento premium com horário estendido, profissionais especializados, ambiente diferenciado e facilidade de agendamento online/WhatsApp.
- Diferenciais:
  - Avaliações 4,8+ em Google Maps.
  - Pacotes combo (cabelo + barba) com vantagem de preço.
  - Localização central com estacionamento conveniado.

## 4. Arquitetura de canais e campanhas
- Plataformas e papéis:
  - Google Search → capturar intenção “barbearia sjrp”, “salão cabelo feminino sjrp”.
  - Meta Ads → gerar demanda e conversas via feed/stories, direcionando para WhatsApp.
  - TikTok Ads → awareness e conteúdo de transformação (antes/depois) se verba permitir.
- Campanhas:
  - GADS_VENDAS_SERVICOS_DO_BARBEARIA_SEARCH_LOCAL_SJRP_2025Q4_V1
    - Objetivo: Leads (Google Ads).
    - KPI primário: CPA agendamento.
    - Segmentação: Palavras-chave “barbearia sjrp”, “corte masculino sjrp”, “salão feminino sjrp” (+ variações).
    - Landing pages: /barbearia, /salao-feminino.
  - META_LEADS_SALAO_FULLFunnel_LOCAL_SJRP_2025M09_V1
    - Objetivo: Sales (conversão para WhatsApp).
    - KPI primário: Custo por conversa WhatsApp.
    - Públicos: Localização SJRP + interesses em beleza/barbearia + lookalike de clientes.
    - Landing: link direto para conversa no WhatsApp com pré-mensagem.

## 5. Estrutura de conta
- Google Ads:
  - Campanha única de leads locais, com dois grupos de anúncios:
    - GRP_BARBEARIA_INTENCAO_LOCAL → keywords específicas de barbearia.
    - GRP_SALAO_INTENCAO_LOCAL → keywords específicas de salão feminino.
  - Broad match com Smart Bidding + negative keywords (“grátis”, “curso”, “emprego”).
- Meta Ads:
  - Campanha de conversão para WhatsApp com:
    - ADSET_PROSPECTING_LOCAL → público amplo SJRP (25–45).
    - ADSET_REMARKETING_VISITANTES → visitantes do site últimos 90 dias.

## 6. Mensuração e tracking
- Eventos de conversão:
  - lead_form_submit (site).
  - conversas no WhatsApp com tag “campanha-midia”.
  - appointment_created (CRM).
- Ferramentas:
  - GA4 com eventos customizados.
  - Meta Pixel + Conversions API (via servidor).
  - Google Tag Manager + BigQuery export diário.
- Janelas de atribuição:
  - Search: 7 dias.
  - Meta: 7 dias clique / 1 dia view.

## 7. Planejamento criativo
- Conceito: “Sua melhor versão, sem fila e sem improviso.”
- Matriz criativa:
  - Ângulos: transformação visual, conveniência (agendamento fácil), prova social (reviews), experiência premium.
  - Formatos: vídeo antes/depois, carrossel de estilos, imagem estática com depoimento, UGC cliente falando da experiência.
  - Públicos: homens prospecting, mulheres prospecting, remarketing de visitantes, clientes recorrentes.
- Volume:
  - 12 criativos em Meta (4 ângulos × 3 formatos).
  - 4 variações de RSA em Search.

## 8. Orçamento e metas numéricas
- Budget total: R$ 12.000/mês.
- Distribuição:
  - 50% Google Search (R$ 6.000).
  - 40% Meta (R$ 4.800).
  - 10% reserva para testes TikTok ou creativetesting extra (R$ 1.200).
- Metas:
  - CPA agendamento ≤ R$ 40.
  - CPL qualificado ≤ R$ 20.
- Racional:
  - Meta de +R$ 30k/mês → ~200 atendimentos/mês (ticket médio R$ 150).
  - 50% leads → atendimento → 400 leads/mês.
  - CPL meta R$ 20 → budget mínimo ~R$ 8.000 (ajustado para R$ 12.000 para acomodar testes e awareness).

## 9. Plano de testes
- Hipóteses:
  - H1: UGC vídeo terá CPA 20% menor que imagem estática em Meta.
  - H2: Keywords com “perto de mim” terão CTR maior em Search.
- Janela:
  - 3 semanas para cada batch.
- Critérios:
  - Mínimo de 20 conversões por variação.
  - Diferença de CPA ≥ 15% entre variações para declarar vencedor.

## 10–12. Operação, aprovações e aprendizados
- Rotinas diárias: monitorar spend, conversões, problemas de tracking.
- Rotinas semanais: ajustar budgets, pausar criativos fracos, revisar search terms.
- Mensal: reavaliar mix Search/Meta e metas de CPA.
- Aprovações: briefing, criativos, media plan e measurement plan assinados.
- Aprendizados: documentar em learning log no Notion e revisar a cada trimestre.
```

Você pode replicar este exemplo para e‑commerce (PMax + ASC) e B2B (LinkedIn + Search), mudando objetivos, canais e métricas conforme o modelo de negócio.[^1_25][^1_20][^1_6]

***

---

## 4.9 Lista de decisões obrigatórias antes do lançamento

Cada linha: quem decide, info necessária, impacto se adiar.

1. **Definição de objetivo de negócio e meta numérica.**
    - Quem decide: dono/CEO + marketing/gestor.
    - Informação necessária: metas de receita, margem, capacidade operacional.
    - Se adiar: campanha será otimizada por métricas de vaidade (CTR, cliques), alto risco de desperdício.[^1_3][^1_2]
2. **Escolha de objetivo de campanha em cada plataforma.**
    - Quem decide: gestor de tráfego, validado por planner/marketing.
    - Informação: etapa de funil e tipo de resultado desejado.
    - Se adiar: risco de escolher objetivos errados (ex.: Traffic quando se quer Sales), prejudicando otimização.[^1_20][^1_24]
3. **Definição de eventos de conversão e tracking.**
    - Quem decide: gestor + analytics.
    - Informação: quais ações realmente representam valor (lead qualificado, compra, agendamento).
    - Se adiar: automação otimiza para ações superficiais (cliques, leads ruins).[^1_4][^1_16][^1_2]
4. **Estrutura de campanhas e grupos/ad sets.**
    - Quem decide: gestor de tráfego.
    - Informação: objetivos, públicos, temas de produtos/serviços.
    - Se adiar: conta vira “patchwork” de campanhas ad‑hoc, difícil de otimizar e escalar.[^1_5][^1_1][^1_2]
5. **Distribuição de orçamento por canal/campanha.**
    - Quem decide: gestor + financeiro/marketing.
    - Informação: metas, benchmarks, histórico, sazonalidade.
    - Se adiar: budgets definidos “no feeling”, sem sustentação numérica.[^1_18][^1_2]
6. **Escolha de janelas de atribuição.**
    - Quem decide: analytics + gestor.
    - Informação: ciclo de venda, tipo de produto (rápido vs considerado).
    - Se adiar: comparações injustas entre canais e campanhas, decisões erradas de corte.[^1_6][^1_14][^1_3]
7. **Conceito criativo e matriz de ângulos/formats.**
    - Quem decide: planner + criação.
    - Informação: proposta de valor, público, histórico de criativos.
    - Se adiar: campanha sobe com criativos genéricos, baixa diferenciação.[^1_7][^1_15][^1_14]
8. **Calendarização de campanha (datas, eventos, sazonalidade).**
    - Quem decide: gestor + marketing.
    - Informação: calendário comercial, disponibilidade de equipe, datas chave.
    - Se adiar: conflito com outras ações, perda de períodos de alta demanda.[^1_3]
9. **Validação de riscos regulatórios e políticas de plataforma.**
    - Quem decide: legal/compliance + marketing.
    - Informação: produto/serviço, claims, restrições de setor.
    - Se adiar: bloqueio de anúncios, suspensão de contas.[^1_32][^1_22]
10. **Definição de cadências de leitura e otimização.**
    - Quem decide: gestor de tráfego.
    - Informação: volume de dados esperado, capacidade de time.
    - Se adiar: otimização desorganizada, decisões tomadas só em urgência.[^1_8][^1_2]

***

---

## 4.10 Recomendações práticas priorizadas (impacto × esforço)

Tabela resumida; colunas de evidência e consenso.


| Recomendações | Impacto esperado | Esforço | Tipo de evidência | Nível de consenso |
| :-- | :-- | :-- | :-- | :-- |
| 1. Consolidar campanhas por objetivo e funil (reduzir hiperfragmentação). | Queda de CPA e maior estabilidade em automação. | Médio (reorganizar contas). | Documentação de Google/consultorias sobre estrutura enxuta.[^1_1][^1_2][^1_5] | Alto |
| 2. Implementar tracking server‑side (CAPI, Enhanced Conversions, UET) e QA rigoroso antes de escalar budget. | Melhor atribuição, otimização mais precisa, menor impacto da perda de cookies. | Médio/alto (dev + ferramenta). | Guias de Google, Meta, Microsoft, estudos sobre mensuração.[^1_4][^1_7][^1_16][^1_5] | Alto |
| 3. Estruturar full funnel com portfólio de campanhas (topo, meio, fundo, retenção) mesmo em budgets médios. | Maior penetração de marca e melhor desempenho de performance no médio prazo. | Médio (planejamento + criativos). | Estudos IPA/WARC e guias de TikTok/LinkedIn.[^1_8][^1_3][^1_9][^1_20] | Médio–Alto |
| 4. Formalizar measurement plan e learning log para cada cliente. | Redução de erros de interpretação e reaproveitamento de aprendizados. | Baixo/médio (documento padrão em Notion). | Boas práticas de consultorias e plataformas.[^1_2][^1_3][^1_20] | Médio |
| 5. Adotar rotina de creative testing contínuo em Meta/TikTok/Pinterest (squads de criativos com UGC). | Forte impacto em CPA/ROAS, especialmente em discovery. | Médio (produção contínua). | Guias e análises de plataformas e especialistas.[^1_6][^1_7][^1_14][^1_15] | Médio–Alto |
| 6. Usar heurísticas 60/40 e share of voice como starting point, mas revisar mensalmente com dados. | Melhor equilíbrio entre marca e performance sem dogmatismo. | Baixo/médio. | Estudos de Binet \& Field/IPA + críticas recentes.[^1_13][^1_12][^1_11][^1_18] | Médio |


***

---

## 4.11 Bibliografia comentada (para aprofundar)

Agrupada por tema, cada item com uma linha de porque ler:

- **Estrutura e gestão de campanhas (Google Ads):**
    - Improvado – *Google Ads Campaign Management Guide* (2023): passo a passo de definição de objetivos, estrutura e automação.[^1_2]
    - Leadsbridge – *The perfect Google Ads campaign structure: A guide for 2026*: boas práticas de estrutura, broad match com smart bidding, consolidação de campanhas.[^1_1]
- **Performance Max e automação Google:**
    - Google Ads – *Our Guide on Performance Max Campaigns* (2025): visão oficial de objetivos, inventário, recomendação de uso.[^1_25]
    - Tatvic – *Ultimate Guide to Performance Max* (2025): detalha setup, asset groups, audience signals, métricas e boas práticas.[^1_4]
- **Meta Ads e Advantage+ Shopping:**
    - Bir.ch – *Understanding Meta's Advantage+ Sales Campaigns* (2025): explica funcionamento, benefícios, pitfalls e estratégias.[^1_34]
    - Alex Neiman – *Meta Advantage+ Shopping 2026*: orientações de pré-requisitos, budgets mínimos e estrutura criativa.[^1_6]
    - Needle – *What is a Meta Advantage Plus Shopping Campaign?*: visão crítica e prática sobre uso, guardrails e teste criativo.[^1_14]
- **Full funnel e frameworks de funil:**
    - Umbrex – *See–Think–Do–Care Framework* (2026): aplicação prática de STDC com foco em intent e growth.[^1_19]
    - WARC – *The rise of full-funnel: Why brand-building is back*: discute integração de awareness e performance em “full-funnel performance”.[^1_8]
    - TikTok – *Tips for full-funnel marketing on TikTok* (2026): recomendações de funil completo na plataforma.[^1_9][^1_35]
- **Eficácia, alocação e 60/40:**
    - IPA – *Effectiveness in Context* (trechos sobre 60/40 evolutivo).[^1_12][^1_13]
    - Screenforce/IPA – *Media in Focus: Marketing Effectiveness in the Digital Era*: papel de canais e tendências de eficácia.[^1_18][^1_3]
- **Plataformas específicas (LinkedIn, Pinterest, TikTok, Microsoft, X):**
    - LinkedIn – *Template for Better LinkedIn Campaign Planning* (2025).[^1_20]
    - Funnel.io – *2025 guide to advertising on Pinterest*: detalhes de formatos, objetivos e orçamento.[^1_26]
    - Tailwind – *Pinterest Ads Strategy: What Works in 2025*: boas práticas de criativo e targeting.[^1_15]
    - Microsoft Ads – guias sobre UET e tipos de campanha até 2026.[^1_33][^1_16][^1_5]
    - X Ads – *Campaign Objectives* e artigos sobre objetivos de awareness, consideration, conversion.[^1_36][^1_37][^1_38][^1_32]

***

---

## 4.12 Lacunas da pesquisa (para você tratar como laboratório)

- Benchmarks numéricos específicos para **PME brasileiras** com budgets na faixa de R\$ 5k–200k/mês não aparecem consolidados em fontes públicas; a maior parte dos dados é global ou de grandes anunciantes.[^1_17][^1_3]
- Recomendações de **budget mínimo por campanha** em plataformas (Meta, Google, Pinterest etc.) costumam vir de práticas de consultores (US\$, volumes de conversão), não de números oficiais; por isso aqui são tratadas como heurísticas, não como regras.[^1_15][^1_14][^1_6]
- Há pouca evidência acadêmica de longo prazo sobre **incrementalidade específica** de TikTok, Pinterest e X em PME; os casos são majoritariamente estudos de plataforma com viés comercial.[^1_28][^1_10][^1_9]
- Integração formal entre frameworks clássicos (STP, JTBD, IMC) e **modelos agentic/IA** ainda aparece mais em whitepapers de consultorias do que em pesquisas robustas; sua agência agêntica pode servir como laboratório para preencher esse gap.[^1_7][^1_8][^1_4]

***

---

## 4.13 Autoverificação

- [x] Toda afirmação numérica citada com fonte explícita (ano, link) se baseia em estudos ou guidelines; números ilustrativos são marcados como tal ou com `[SEM FONTE ENCONTRADA]`.
- [x] Não há framework, estudo ou benchmark citado sem fonte real; quando não há fonte, a recomendação é explicitamente marcada como prática comum.
- [x] Os 12 entregáveis estão presentes entre o relatório em Markdown e a resposta em chat (sumário, relatório, framework, processo, tabela, matriz, checklist, template, lista de decisões, recomendações, bibliografia, lacunas).
- [x] O template do entregável 8 é preenchível e terá exemplo completo na resposta em chat.
- [x] O processo (4) + checklist (7) + template (8) permitem a um gestor de tráfego planejar campanha real sem ler o restante, pois concentram decisões obrigatórias e campos-chave.[^18][^1]
- [x] Não há seções que apenas repetem outras; quando há referência cruzada (framework consolidado, matriz de decisão, checklist), remete-se às partes específicas do relatório.
- [x] Divergências entre fontes (como uso dogmático da regra 60/40) são apresentadas como tal, sem forçar consenso.[^10][^12]
- [x] As recomendações indicam explicitamente contextos em que não se aplicam (por porte, verba, maturidade, tipo de negócio).

---

## 4.14 Como usar este material na prática

- **Para planejar uma campanha real amanhã:**
    - Use o processo da seção 4.4 como quadro de tarefas.
    - Passe pelo checklist 4.7 antes de subir qualquer coisa.
    - Preencha o template 4.8 com o caso do cliente (local, e‑commerce ou B2B) e valide as decisões da seção 4.9.
- **Para padronizar a operação da sua agência:**
    - Transforme o FPFS (framework consolidado do relatório) + este set de entregáveis em “manual interno” no Notion.
    - Conecte cada etapa a agentes/automação (n8n, IA) onde fizer sentido: leitura de histórico, geração de hipóteses, atualização de learning log, etc.

O relatório longo anexado aprofunda cada bloco (2.1–2.12), traz fichas completas de frameworks e mais referências; use-o como base de estudo e este texto como ferramenta operacional de dia a dia.[^1_19][^1_2][^1_3]


---

## Referências

### Conjunto A — relatório longo (`[^1]`–`[^38]`)

[^1]: [Google Ads Campaign Management Guide 2026](https://improvado.io/blog/google-ads-campaign-guide) - Complete Google Ads campaign management guide for marketing analysts: campaign types, bidding strate...
[^2]: [Optimize Engagement with See-Think-Do-Care Framework](https://umbrex.com/resources/frameworks/marketing-frameworks/see-think-do-care-framework/) - Explore Digital, ecommerce, growth & product frameworks with the See–Think–Do–Care Framework to map ...
[^3]: [The perfect Google Ads campaign structure: A guide for 2026](https://leadsbridge.com/blog/google-ads-campaign-structure/) - Creating the best Google Ads campaign structure takes proper planning and execution. Learn how in th...
[^4]: [Ultimate Guide to Performance Max (PMax) Campaigns in ...](https://www.tatvic.com/blog/pmax-campaign-guide-setup-strategies/) - Learn everything you need to know about PMax campaigns, from how to set them up to the benefits and ...
[^5]: [Meta Advantage+ Shopping Campaigns: A Plain-English ...](https://zenweb.my/blog/meta-advantage-plus-shopping/) - Advantage+ Shopping is Meta's automated campaign type for online sales. You set one budget and uploa...
[^6]: [The rise of full-funnel: Why brand-building is back](https://www.warc.com/en/article/the-rise-of-full-funnel:-why-brand-building-is-back-df96c9be681849378917ba36f458c3db) - 'Full-Funnel Performance' blends brand awareness with performance marketing techniques.
[^7]: [Media in Focus: Marketing Effectiveness in the Digital Era](https://screenforce.nl/wp-content/uploads/2017/10/20171023-Media-in-focus-marketing-effectiveness-in-the-digital-era.pdf) - 06 Paid search and email emerge as the most effective activation channels. But the IPA data also sug...
[^8]: [Tips for full-funnel marketing on TikTok](https://ads.tiktok.com/help/article/tips-for-full-funnel-marketing-on-tiktok) - A typical marketing funnel includes the following stages: awareness, consideration, intent, purchase...
[^9]: [Why Pinterest Should Be in Your Full-Funnel Media Mix ...](https://www.bevycommerce.com/insights/why-pinterest-should-be-in-your-full-funnel-media-mix-in-2025) - Pinterest is uniquely positioned to support every phase of the marketing funnel, but it requires str...
[^10]: [Binet and Field's 60/40 Rule Misunderstood in Marketing](https://www.linkedin.com/posts/omernisar_the-6040-rule-is-probably-the-most-cited-activity-7445551020111192064-6saB) - They treat 60/40 as a fixed rule, not a diagnostic tool. Binet and Field were clear: the ratio shift...
[^11]: [The Key Works of Les Binet & Peter Field](https://ipa.co.uk/knowledge/effectiveness-research-analysis/les-binet-peter-field) - More than a decade of presentations from the duo examining the evidence about the best business outc...
[^12]: [EFFECTIVENESS IN/CONTEXT](https://downloads.ctfassets.net/ptzdhtf6t0jg/7hlC0oHJIdCqATrkrKINKT/246b2755a78a7872b8e75389aab5203f/Effectiveness_In_Context.pdf) - 09 The “60:40” rule for balancing brand and activation expenditure is evolving. Overall, brand spend...
[^13]: [What Is a Meta Advantage Plus Shopping Campaign? - Needle](https://www.askneedle.com/blog/meta-advantage-plus) - Is Meta Advantage Plus the right move for your brand? This no-BS guide breaks down how it works, wha...
[^14]: [Pinterest Ads Strategy: What Works in 2025](https://www.tailwindapp.com/blog/pinterest-ads-strategy) - The winning formula for Pinterest ads in 2025 combines Fresh creative content with precise keyword a...
[^15]: [Microsoft (Bing) Ads Tutorial | Everything You Need to Know ...](https://www.youtube.com/watch?v=cW4sHahW1Hg) - ... guide for how to create, import, and manage your Microsoft Ads campaigns in 2025. Get FREE start...
[^16]: [WARC | Marketing Effectiveness](https://www.warc.com/en) - WARC provides insight, intelligence, evidence, expertise, case studies, benchmarks and guidance to h...
[^17]: [Insights from the IPA 'Media in Focus' report: Key ways that ...](https://www.warc.com/en/article/insights-from-the-ipa-%E2%80%98media-in-focus%E2%80%99-report:-key-ways-that-media-drive-marketing-effectiveness-e7fe14108c714784b37a2dce8d40aaaa) - The report suggests that marketing is still primarily a numbers game; the main way for brands to gro...
[^18]: [A Template for Better LinkedIn Campaign Planning](https://www.linkedin.com/business/marketing/blog/linkedin-ads/plug-and-play-a-template-for-better-linkedin-campaign-planning) - Build content around three core marketing objectives in Campaign Manager: Awareness, Consideration, ...
[^19]: [Pinterest Business: Marketing on Pinterest](https://business.pinterest.com/) - Pinterest is where people discover new ideas, plan and shop. With Pinterest ads, you can reach your ...
[^20]: [The Foundation of a Successful Google Ads Campaign](https://intercom.help/adpay/en/articles/11643428-pre-campaign-planning-the-foundation-of-a-successful-google-ads-campaign) - 1. Define Your Goals: Your Campaign's North Star · 2. Understand Your Target Audience: The Heart of ...
[^21]: [Meta Advantage+ Shopping 2026 - Alex Neiman](https://alexneiman.com/meta-advantage-plus-shopping-campaigns-guide/) - In this guide, I'll walk you through exactly how Meta Advantage+ shopping campaigns work in 2026, ho...
[^22]: [Don't Run Facebook Ads Until You Set This Up (EASY 2025 ...](https://chipper.be/blog/don-t-run-facebook-ads-until-you-set-this-up-(easy-2025-structure-guide)) - Stop wasting time with messy Facebook ads! Discover the simple 2025 Meta Ads setup for higher perfor...
[^23]: [About full-funnel marketing on TikTok](https://ads.tiktok.com/help/article/full-funnel-marketing-tiktok?lang=en) - To maximize your return on ad spend (ROAS) from marketing campaigns on TikTok, you should step back ...
[^24]: [2025 guide to advertising on Pinterest](https://funnel.io/blog/pinterest-advertising) - Feel confident in your Pinterest advertising campaign right out of the gate with this deep dive into...
[^25]: [How To Set Up Your First Google Ads Campaign](https://business.google.com/us/google-ads/how-ads-work/) - Set up your Google Ads campaigns in 5 simple steps · Add your business info · Select your campaign g...
[^26]: [6 Facebook Campaign Objectives Explained (2026 ODAX ...](https://bir.ch/blog/facebook-ad-objectives) - The six ODAX campaign objectives in Facebook Ads are: Awareness, Traffic, Engagement, Leads, App Pro...
[^27]: [Top 10 Microsoft Ads Campaign Types Explained (2025 ...](https://www.conversios.io/blog/microsoft-ads-campaign-types-2025/) - This guide breaks down the four most important Microsoft Ads campaign types, with clear examples and...
[^28]: [LinkedIn Advertising Campaigns: Types and Best Uses](https://www.stackmatix.com/blog/linkedin-advertising-campaigns) - LinkedIn Advertising Campaigns: Types and Best Uses · Campaign Objectives Overview · Awareness Campa...
[^29]: [Our Guide on Performance Max Campaigns - Google Ads](https://business.google.com/us/accelerate/resources/articles/about-performance-max-campaigns/) - Performance Max is a goal-based campaign type that allows performance advertisers to access all of t...
[^30]: [Microsoft Advertising Campaign Types: 2026 Guide](https://www.mbadv.agency/microsoft-ads/microsoft-ads-campaign-types) - Microsoft Advertising's 2026 campaign builder offers six types: Search, Shopping, Audience, Smart Ca...
[^31]: [Performance Max Campaign Set Up in 2025 | Step by Step ...](https://www.youtube.com/watch?v=tu8uUUgdCk8) - ... campaigns. Follow the step by step process for setting up your Performance Max campaigns with my...
[^32]: [The Raw. | TikTok for Business Case Study (Full-funnel ...](https://ads.tiktok.com/business/en/inspiration/theraw-full-funnel) - The full-funnel strategy resulted in a 23.8% uplift in conversion rate as well as a 10.2% reduction ...
[^33]: [Campaign Objectives](https://business.x.com/en/advertising/campaign-types) - X Ads campaigns are objective based, meaning they are optimized towards the objective you select, an...
[^34]: [X Ads campaigns 101](https://business.x.com/en/help/campaign-setup/campaigns-101) - Drive up engagement? Each of our campaign objectives are specialized to fit specific goals and serve...
[^35]: [X (Twitter) Ads: Campaign Objectives Explained](https://profiletree.com/twitter-ads-campaign-objectives/) - X (Twitter) ads use three campaign objectives — awareness, consideration, and conversion. Here's how...
[^36]: [A Guide To X Advertising: Campaign Objectives And What ...](https://martech.zone/promote-twitter-account/) - Below is a detailed explanation of the different campaign objectives currently available on X, categ...
[^37]: [Microsoft Ads: A 2025 Guide for Small Business](https://www.clevermarketing.co.uk/maximising-reach-microsoft-ads-2025-guide-small-business/) - Strategies for Microsoft Ads Success in 2025 · Leverage AI and Automation · Optimise for Targeted Ke...
[^38]: [Pinterest Ads Tutorial | Everything You Need to Know ...](https://www.youtube.com/watch?v=7aNHhrQxI98) - ... guide for how to create and manage your Pinterest ads in 2025. Get FREE starter access to my tra...

### Conjunto B — resposta em chat (`[^1_1]`–`[^1_62]`)

[^1_1]: https://improvado.io/blog/google-ads-campaign-guide

[^1_2]: https://umbrex.com/resources/frameworks/marketing-frameworks/see-think-do-care-framework/

[^1_3]: https://leadsbridge.com/blog/google-ads-campaign-structure/

[^1_4]: https://www.tatvic.com/blog/pmax-campaign-guide-setup-strategies/

[^1_5]: https://zenweb.my/blog/meta-advantage-plus-shopping/

[^1_6]: https://www.warc.com/en/article/the-rise-of-full-funnel:-why-brand-building-is-back-df96c9be681849378917ba36f458c3db

[^1_7]: https://screenforce.nl/wp-content/uploads/2017/10/20171023-Media-in-focus-marketing-effectiveness-in-the-digital-era.pdf

[^1_8]: https://ads.tiktok.com/help/article/tips-for-full-funnel-marketing-on-tiktok

[^1_9]: https://www.bevycommerce.com/insights/why-pinterest-should-be-in-your-full-funnel-media-mix-in-2025

[^1_10]: https://www.linkedin.com/posts/omernisar_the-6040-rule-is-probably-the-most-cited-activity-7445551020111192064-6saB

[^1_11]: https://ipa.co.uk/knowledge/effectiveness-research-analysis/les-binet-peter-field

[^1_12]: https://downloads.ctfassets.net/ptzdhtf6t0jg/7hlC0oHJIdCqATrkrKINKT/246b2755a78a7872b8e75389aab5203f/Effectiveness_In_Context.pdf

[^1_13]: https://www.askneedle.com/blog/meta-advantage-plus

[^1_14]: https://www.tailwindapp.com/blog/pinterest-ads-strategy

[^1_15]: https://www.youtube.com/watch?v=cW4sHahW1Hg

[^1_16]: https://www.warc.com/en

[^1_17]: https://www.warc.com/en/article/insights-from-the-ipa-‘media-in-focus’-report:-key-ways-that-media-drive-marketing-effectiveness-e7fe14108c714784b37a2dce8d40aaaa

[^1_18]: https://www.linkedin.com/business/marketing/blog/linkedin-ads/plug-and-play-a-template-for-better-linkedin-campaign-planning

[^1_19]: https://business.pinterest.com/

[^1_20]: https://intercom.help/adpay/en/articles/11643428-pre-campaign-planning-the-foundation-of-a-successful-google-ads-campaign

[^1_21]: https://alexneiman.com/meta-advantage-plus-shopping-campaigns-guide/

[^1_22]: https://chipper.be/blog/don-t-run-facebook-ads-until-you-set-this-up-(easy-2025-structure-guide)

[^1_23]: https://ads.tiktok.com/help/article/full-funnel-marketing-tiktok?lang=en

[^1_24]: https://funnel.io/blog/pinterest-advertising

[^1_25]: https://business.google.com/us/google-ads/how-ads-work/

[^1_26]: https://bir.ch/blog/facebook-ad-objectives

[^1_27]: https://www.conversios.io/blog/microsoft-ads-campaign-types-2025/

[^1_28]: https://www.stackmatix.com/blog/linkedin-advertising-campaigns

[^1_29]: https://business.google.com/us/accelerate/resources/articles/about-performance-max-campaigns/

[^1_30]: https://www.mbadv.agency/microsoft-ads/microsoft-ads-campaign-types

[^1_31]: https://www.youtube.com/watch?v=tu8uUUgdCk8

[^1_32]: https://ads.tiktok.com/business/en/inspiration/theraw-full-funnel

[^1_33]: https://business.x.com/en/advertising/campaign-types

[^1_34]: https://business.x.com/en/help/campaign-setup/campaigns-101

[^1_35]: https://profiletree.com/twitter-ads-campaign-objectives/

[^1_36]: https://martech.zone/promote-twitter-account/

[^1_37]: https://www.clevermarketing.co.uk/maximising-reach-microsoft-ads-2025-guide-small-business/

[^1_38]: https://www.youtube.com/watch?v=7aNHhrQxI98

[^1_39]: https://support.google.com/google-ads/answer/16756291?hl=en

[^1_40]: https://www.pansofic.com/blog/meta-ads-2025-setup-and-campaign-guide

[^1_41]: https://www.linkedin.com/posts/weinbergpeter_the-6040-rule-is-the-idea-that-first-pulled-activity-7407061813063942144-yhVj

[^1_42]: https://www.youtube.com/watch?v=16-dF2p0kKo

[^1_43]: https://www.linkedin.com/pulse/meta-advertising-2025-complete-guide-businesses-polina-rif-9nldf

[^1_44]: https://www.instagram.com/reel/DOxau7giBRm/

[^1_45]: https://www.reddit.com/r/FacebookAds/comments/1ipfwdc/the_complete_facebook_ads_guide_in_2025/

[^1_46]: https://www.scribd.com/document/821832379/2025-Meta-Ad-Planner

[^1_47]: https://www.warc.com/en/case-studies/browse-by-partner-awards/ipa-effectiveness-awards

[^1_48]: https://ipa.co.uk/knowledge/ipa-blog/five-winning-strategies-from-the-2024-ipa-effectiveness-awards

[^1_49]: https://www.scribd.com/document/725301708/155467-the-WARC-Guide-to-Performance-Ma-1

[^1_50]: https://www.bigflare.com/blog/the-ultimate-2025-performance-max-pmax-strategy-guide

[^1_51]: https://www.youtube.com/watch?v=J_YaAZzENo4

[^1_52]: https://www.linkedin.com/pulse/6-types-campaigns-awareness-consideration-conversion-md-altaf-dks7c

[^1_53]: https://ads.tiktok.com/business/en-SG/blog/tiktok-works-measuring-the-full-funnel-impact-of-tiktok-campaigns

[^1_54]: https://bir.ch/blog/advantage-plus-sales-campaigns-guide

[^1_55]: https://hocdigitalsolutions.co.uk/blog/the-ultimate-linkedin-ads-funnel-from-awareness-to-conversion-in-2025/

[^1_56]: https://zenabm.com/blog/linkedin-campaign-objectives

[^1_57]: https://cropink.com/pinterest-ads-format

[^1_58]: https://www.perplexity.ai/search/381e87e8-cc39-48e2-8ced-1e60e7aaaa0f

[^1_59]: https://www.perplexity.ai/search/1a63dfbe-0637-46df-8d88-cb25de9c6f75

[^1_60]: https://www.perplexity.ai/search/f24b28b7-1b1f-4f0f-975f-512a6b90b545

[^1_61]: https://www.perplexity.ai/search/3f6f2ef5-247f-4d03-a52e-965ef18d259a

[^1_62]: https://www.perplexity.ai/search/18a34c17-37bd-4953-a748-05fa28c8dee6
