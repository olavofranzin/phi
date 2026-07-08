# Catálogo de Produtos/Serviços da Agência — v1 (2026-07-05)

> Fonte: Olavo, 2026-07-05. **Pré-requisito** de duas frentes: Criação de Conteúdo
> (conteúdo por etapa de funil × produto) e Comercial/HubSpot ("produtos ofertáveis"
> que a IA insere na Oportunidade). Seed para: line-items/produtos no HubSpot, taxonomia
> de conteúdo, e escopo de análise dos agentes. `tenant_id = phi-agencia`.

| id | Produto/Serviço | O que é | Relevância p/ funil & agentes | Métrica-mãe típica |
|---|---|---|---|---|
| `SVC-ADS` | **Anúncios online** | Gestão de tráfego pago (Google Ads + Meta Ads) | Núcleo; alimentado por PHI·Mídia/Saúde Digital; base do repositório de estratégias e dos agentes de otimização | CPA / ROAS |
| `SVC-SITE` | **Criação de site** | Desenvolvimento de site/landing pages | Consome métricas de site (§2 do roadmap: GA4/Clarity, CVR de site); base de CRO | CVR de site / conversões |
| `SVC-IA` | **Agentes de IA e automação** | Construção de agentes/automação (o que o PHI é internamente, agora ofertável) | Oferta B2B; casa com G4 (Arquitetura Cognitiva Comercial); ticket mais alto | Leads qualificados / pipeline |
| `SVC-GBP` | **Configuração e gestão do GBP** | Setup e gestão do Google Business Profile | Base da análise de GBP na Prospecção (descrição, Q&A, avaliações); presença local | Ações locais / avaliações |

## Uso downstream
- **Conteúdo:** cada serviço × etapa de funil (topo/meio/fundo) = uma célula da matriz de conteúdo. As pastas do Drive (fonte de terceiros + swipe file) abastecem essa matriz.
- **HubSpot:** vira o conjunto de produtos que a IA pode sugerir na Oportunidade, com base no enriquecimento do lead (ex.: lead com GBP fraco → `SVC-GBP`; lead sem site → `SVC-SITE`; e-commerce sem tráfego → `SVC-ADS`).
- **Prospecção:** o diagnóstico do lead (GBP/IG/site) mapeia gaps → serviço ofertável correspondente (regra determinística + LLM).

> v1 é a lista-base. Detalhar depois: descrição comercial, faixa de ticket, ICP por serviço,
> pré-requisitos de entrega — quando abrirmos a frente Comercial.
