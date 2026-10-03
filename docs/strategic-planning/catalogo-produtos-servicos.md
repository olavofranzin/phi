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

---

## ✅ SVC-GBP — produto de ENTRADA (decidido 2026-09-15)

| | |
|---|---|
| **Papel** | **produto de entrada da prospecção ativa** — é por ele que o lead entra na carteira |
| **Preço** | **R$ 500/mês** |
| **Fidelidade** | **6 meses** |
| **Por que este e não anúncios** | entrega leve e controlável · é o que o diagnóstico mostra fraco · **não é publicidade**, então entra em setores com restrição a anúncio. Anúncio com verba pequena dá resultado fraco → cancela → **prova social negativa na cidade que estamos prospectando** |
| **Escada** | GBP → saúde digital como bônus → campanha teste → `SVC-ADS` |
| **Se promete** | o **trabalho** (perfil completo, avaliações respondidas, fotos e posts, palavras-chave na descrição e nas respostas) |
| **Nunca se promete** | "mais clientes", "1º lugar no Maps", "aparecer nas IAs" — o Google declara **distância** como fator de ranking, e ninguém a controla |

> Fonte: `docs/strategic-planning/prospeccao/PLANO-ENTREGA-FINAL-PROSPECCAO.md` §13.
> ⚠️ Os outros serviços **seguem sem preço definido** — foi isso que deixou "R$ 500" solto por treze
> rodadas de planejamento, sem ser preço de nada.
