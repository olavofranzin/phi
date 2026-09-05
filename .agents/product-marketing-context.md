# Product Marketing Context

*Last updated: 2026-08-27 · v0.1 (draft auto-gerado do repo — lacunas marcadas ⬜)*

> **Fonte:** auto-draft a partir de `docs/strategic-planning/catalogo-produtos-servicos.md`,
> `docs/conhecimento/rubricas/gbp-auditoria-10-pilares.md`,
> `docs/strategic-planning/roadmap-expansao/gbp-motor-scoring-ipc-design.md`,
> `docs/conhecimento/IA Cognitiva Comercial.md`.
> **Itens ⬜ precisam de confirmação do Olavo** — não inventar.

---

## Product Overview

**One-liner:** Agência de marketing digital que usa um sistema agentizado próprio (PHI) para diagnosticar a presença digital de negócios locais e vender a correção do gap encontrado.

**What it does:** A Franz Comunicação opera 4 serviços (tráfego pago, sites, GBP e agentes de IA) para negócios locais. O diferencial operacional é o PHI — um sistema que descobre leads via Google Maps, pontua automaticamente a saúde do perfil digital de cada um (Score Técnico multi-dimensional + Potencial Comercial) e roteia para a oferta certa antes do primeiro contato. A abordagem chega com diagnóstico pronto, não com pitch genérico.

**Product category:** Agência de marketing digital para negócio local (a prateleira onde o cliente busca: "agência de tráfego", "gestão de Google Meu Negócio", "criação de site").

**Product type:** Serviço (agência), operação de uma pessoa amplificada por sistema agentizado.

**Business model:** ⬜ *Confirmar: recorrente (fee mensal), projeto pontual, ou híbrido? Faixa de ticket por serviço?*

---

## Target Audience

**Target companies:** Negócios locais com presença no Google Maps — validação inicial feita com dentistas/clínicas; categorias adjacentes testadas: barbearias, salões, policlínicas, advogados.

**Decision-makers:** Dono do negócio (decisor único na maioria dos casos). Em clínicas maiores, pode haver gestor/sócio administrativo.

**Primary use case:** O negócio existe fisicamente e é encontrável, mas a presença digital não converte o quanto poderia — perfil GBP incompleto, sem site próprio, ou tem fundação boa e não anuncia.

**Jobs to be done:**
- "Fazer meu negócio aparecer quando alguém procura meu serviço na minha cidade"
- "Parar de perder cliente para o concorrente que aparece antes de mim"
- "Ter alguém que cuide disso, porque eu não tenho tempo nem sei fazer"

**Use cases (roteamento determinístico — decisão Olavo 2026-07-10):**

| Situação detectada | Oferta roteada |
|---|---|
| Sem site próprio (`none` ou rede social) | `SVC-SITE` |
| GBP fraco (autoridade<40, conteúdo<30, não reivindicado, atributos < 60% do p75) | `SVC-GBP` |
| Site próprio **e** GBP sólido | `SVC-ADS` |
| Negócio pujante sem site (ex.: 259 reviews, site=Instagram) | `SVC-SITE` → `SVC-ADS` (alto valor) |

**Sequência lógica de entrega:** `SVC-SITE` → `SVC-GBP` → `SVC-ADS` (precisa de base antes de anunciar).

---

## Catálogo de Serviços

| id | Serviço | O que é | Métrica-mãe | Ticket |
|---|---|---|---|---|
| `SVC-ADS` | Anúncios online | Gestão de tráfego pago (Google + Meta) | CPA / ROAS | ⬜ |
| `SVC-SITE` | Criação de site | Site / landing pages | CVR de site | ⬜ |
| `SVC-GBP` | Config e gestão do GBP | Setup e gestão do Google Business Profile | Ações locais / avaliações | ⬜ |
| `SVC-IA` | Agentes de IA e automação | Construção de agentes/automação (o que o PHI é internamente, agora ofertável) | Leads qualificados / pipeline | ⬜ *(descrito como "ticket mais alto")* |

---

## Personas

| Persona | Cares about | Challenge | Value we promise |
|---|---|---|---|
| Dono de negócio local (decisor único) | Telefone tocando, agenda cheia | Não tem tempo nem repertório técnico; já foi queimado por promessa de agência | Diagnóstico concreto do que está errado + execução, sem ele precisar entender o meio |
| ⬜ Gestor/sócio administrativo | ⬜ | ⬜ | ⬜ |

---

## Problems & Pain Points

**Core problem:** O negócio é bom no que faz, mas invisível ou mal representado onde o cliente procura. O dono sabe que "precisa mexer na internet" e não sabe por onde começar nem em quem confiar.

**Why alternatives fall short:**
- **Agência genérica:** vende pacote fechado sem diagnosticar; o dono não entende o que comprou
- **Sobrinho / freelancer barato:** faz uma vez e some; sem manutenção nem estratégia
- **Fazer sozinho:** o dono não tem tempo; o perfil fica pela metade
- ⬜ *Confirmar: quais concorrentes específicos aparecem nas negociações?*

**What it costs them:** Cliente que buscou o serviço na região e foi para o concorrente que aparecia primeiro. ⬜ *Quantificar se houver dado.*

**Emotional tension:** Desconfiança (já ouviu promessa antes) + constrangimento por não dominar o assunto + sensação de estar ficando para trás.

---

## Competitive Landscape

⬜ **Esta seção precisa de input.** O que consta no repo hoje trata de concorrentes **do lead** (o `04_benchmark_engine` compara o lead com quem aparece na mesma busca) — não de concorrentes **da agência**.

**Direct:** ⬜ *Outras agências locais? Quais aparecem nas negociações?*
**Secondary:** ⬜ *Freelancers, plataformas self-service (Wix, GoDaddy)?*
**Indirect:** ⬜ *Não fazer nada / sobrinho / funcionário interno?*

---

## Differentiation

**Key differentiators:**
- **Diagnóstico antes do pitch** — a abordagem chega com a auditoria dos 10 pilares já feita, com números do próprio perfil do lead e comparação com quem aparece na mesma busca
- **Determinismo** — a pontuação é regra de negócio, não opinião. Mesmo lead → mesmo diagnóstico. A IA só redige, não julga
- **Benchmark que vende sozinho** — não "você tem 46 avaliações", mas "você tem 46, a média de quem aparece com você é 198"
- **Roteamento de oferta** — o sistema identifica se o lead precisa de fundação (site/GBP) ou de amplificação (ads); não empurra o mesmo produto para todos

**How we do it differently:** A maioria das agências prospecta por volume e pitcha o mesmo pacote. Aqui a descoberta é automatizada e pontuada — o contato só acontece depois de saber o que o negócio precisa e quanto vale.

**Why customers choose us:** ⬜ *Precisa de verbatim de cliente real. Por que os que fecharam disseram sim?*

---

## Objections

⬜ **Seção crítica sem dado.** Precisa das 3 objeções mais ouvidas. Hipóteses a validar (não usar até confirmar):

| Objeção (hipótese) | Resposta |
|---|---|
| "Já tive agência e não deu resultado" | ⬜ |
| "Quanto custa?" / preço | ⬜ |
| "Vou pensar" / sem urgência | ⬜ |

**Anti-persona:** ⬜ *Quem NÃO fechar? Hipóteses do design: negócio inativo/fechado (a "viabilidade" do IPC já filtra), negócio sem capacidade de atender mais demanda.*

---

## Switching Dynamics (JTBD Four Forces)

**Push:** ⬜ *O que faz o dono procurar solução? (queda de movimento? concorrente novo? experiência ruim com agência anterior?)*
**Pull:** Ver um diagnóstico concreto do próprio negócio, com números, sem ter pedido.
**Habit:** "Sempre funcionou no boca a boca" / "meu filho cuida disso".
**Anxiety:** Medo de gastar e não ver retorno; medo de contrato longo; ⬜ *confirmar as reais.*

---

## Customer Language

⬜ **Seção vazia — é a de maior valor e a que não dá para inventar.** Precisa de verbatim real (transcrições de call, mensagens de WhatsApp, reviews que os leads deixam para os concorrentes).

**How they describe the problem:** ⬜
**How they describe us:** ⬜
**Words to use:** ⬜
**Words to avoid:** ⬜ *(hipótese: jargão técnico — "SEO local", "CTR", "SERP" — o dono não fala assim)*

**Glossary (interno, não usar com cliente):**

| Termo | Significado |
|---|---|
| GBP | Google Business Profile (Google Meu Negócio) |
| Score Técnico | Quão otimizado o perfil está hoje (6 dimensões, 0–100) |
| IPC | Índice de Potencial Comercial — quanto valor a consultoria ainda pode gerar |
| Potencial Comercial | `max(gap de fundação, prontidão de ADS) × viabilidade` |
| leadScore | Pontuação da Camada 1 — prioriza a fila, não descarta |
| Local Pack | Os 3 resultados de mapa que o Google mostra no topo |

---

## Brand Voice

⬜ **Precisa de definição.** O que o repo sugere (a validar):

**Tone:** Direto e sem jargão — a instrução do próprio Olavo no `CLAUDE.md` é *"Fale comigo sempre em português, de forma simples e sem jargão"*. Provável que valha para o cliente também.
**Style:** Consultivo baseado em evidência — mostra o número antes de opinar.
**Personality:** ⬜ *3–5 adjetivos.*

---

## Proof Points

⬜ **Seção vazia — bloqueia a escrita de qualquer abordagem.**

**Metrics:** ⬜ *Resultado de cliente que dê para citar?*
**Customers:** KIL (cliente de referência técnica do PHI), Charles Azevedo (CLI-13). ⬜ *Podem ser citados comercialmente?*
**Testimonials:** ⬜
**Value themes:** ⬜

---

## Goals

**Business goal:** ⬜ *Meta dos próximos 90 dias — volume de clientes novos? MRR? Mix de serviço?*

**Conversion action:** ⬜ *Qual o próximo passo que a abordagem pede? (reunião de diagnóstico? auditoria gratuita? resposta no WhatsApp?)*

**Current metrics:** ⬜ *Taxa de resposta atual, taxa de fechamento, ciclo médio, ticket médio.*

**Referência do design (não é meta, é critério):** *"Que tipo de lead maximiza meu LTV, reduz esforço de suporte e aumenta chance de usar IA avançada e automações no projeto?"* — `IA Cognitiva Comercial.md`

---

## Lacunas — o que preciso de você

Ordenado por impacto na próxima etapa:

| # | Lacuna | Bloqueia |
|---|---|---|
| 1 | **Ticket por serviço** + modelo (recorrente/pontual) | Priorização da fila, cálculo de valor do deal |
| 2 | **3 objeções mais ouvidas** + como você responde hoje | `cold-email` — sem isso a mensagem não trata resistência |
| 3 | **Conversion action** — o que a abordagem pede | Toda a cadência |
| 4 | **Motivo mais comum de perda** | Anti-persona e qualificação |
| 5 | **Verbatim de cliente** (call, WhatsApp, review) | `customer-research` — é o insumo que não dá para simular |
| 6 | Proof points citáveis | Credibilidade da abordagem |
| 7 | Concorrentes diretos da agência | Diferenciação |

**Atalho para o item 5:** se você não tiver transcrição, o `customer-research` consegue minerar reviews que os leads deixam para concorrentes no próprio Google Maps — que já estamos raspando. É linguagem real do mesmo público, de graça.
