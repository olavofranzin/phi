# Rubrica — Auditoria de Google Business Profile (10 pilares)

> **O que é:** a **lente de análise** (rubrica) que o agente de auditoria de GBP usa para
> estruturar o diagnóstico. NÃO é fonte de dados — é *o que avaliar e como priorizar*.
> **Fonte:** Olavo (metodologia própria de auditoria de SEO local + conversão), 2026-07-05.
> **Força de evidência:** A (validada internamente — expertise do dono). **Domínio:** local/GBP.
> **Consumo:** entra no **prompt do agente** de enriquecimento (C2) como as regras comportamentais
> da lente (Guia de Agentes §4/§6 — "a lente transparece na saída") e como ativo da Camada de
> Conhecimento. **Aplicabilidade:** Negócio Local; complementa a oferta `SVC-GBP` (catálogo).

## Como o agente usa
1. Coleta os dados do perfil (fonte a definir — ver §"Fonte de dados por pilar" abaixo).
2. Percorre os 10 pilares, marcando cada achado com `[CERTEZA]`/`[HIPÓTESE]` e **ancorado** no dado
   observado (ex.: "nota 3,9 com 12 avaliações"). Guarda de volume (Tema 10): poucos dados → "sinal fraco".
3. Classifica cada gap em **🔴 Crítica / 🟠 Alta / 🟡 Média / 🟢 Baixa** e fecha com **plano de ação priorizado**.
4. Mapeia gaps materiais → oferta `SVC-GBP` (input para a NBA / C3).

---

## Os 10 pilares (rubrica do Olavo, preservada)

**1. Informações básicas** — completude e consistência: nome (sem excesso de palavra-chave), categoria principal, categorias secundárias, telefone, site, endereço, áreas de atendimento, horário, atributos preenchidos.

**2. Otimização para SEO Local** — palavra-chave principal usada naturalmente; relevância da categoria principal; descrição otimizada; serviços cadastrados; produtos (quando aplicável); uso correto das palavras-chave; cobertura dos serviços principais; coerência GBP × site × citações (NAP).

**3. Fotos e vídeos** — quantidade, qualidade, frequência de postagem, diversidade (fachada, interior, equipe, produtos, serviços, antes/depois, logotipo, capa, vídeos); existência de fotos feitas por clientes.

**4. Avaliações** — quantidade, nota média, crescimento, frequência, **respostas do proprietário**, uso de palavras-chave nas respostas, reclamações recorrentes, sentimento dos clientes, distribuição das notas (1–5★).

**5. Perguntas e respostas** — existência de perguntas, qualidade das respostas, FAQ estratégico, perguntas sem resposta, uso de palavras-chave.

**6. Serviços e Produtos** — todos os serviços cadastrados, descrições, produtos, fotos dos produtos, organização, cobertura completa do negócio.

**7. Postagens** — frequência, qualidade, CTAs, tipos (promoções, atualizações, eventos, novidades).

**8. Conversão** — clareza da proposta de valor, botões disponíveis, link de agendamento, WhatsApp, site funcional, facilidade de contato, CTA da descrição, diferenciais evidentes.

**9. Presença Local (vs concorrentes)** — quem aparece no Local Pack, volume de avaliações, categorias usadas, conteúdo publicado, fotos, autoridade local, oportunidades não exploradas.

**10. Performance (só com acesso ao perfil)** — pesquisas diretas, pesquisas por descoberta, cliques no site, ligações, solicitações de rota, mensagens, visualizações de fotos, comparação de fotos com concorrentes, termos de pesquisa dos usuários.

**Itens técnicos adicionais** — perfil verificado; nome em conformidade com as políticas do Google; categoria principal adequada; categorias secundárias estratégicas; todos os campos preenchidos; uso correto dos atributos; horários especiais; link de agendamento; integração com cardápio/catálogo/produtos; perfil sem suspensões/alertas.

## Resultado — 4 níveis de prioridade
| Prioridade | Objetivo |
|---|---|
| 🔴 Crítica | Problemas que impedem o bom desempenho (categoria errada, perfil incompleto, poucas avaliações). |
| 🟠 Alta | Melhorias com grande impacto em posicionamento e conversão. |
| 🟡 Média | Otimizações que fortalecem a autoridade ao longo do tempo. |
| 🟢 Baixa | Ajustes finos e oportunidades adicionais. |

---

## Fonte de dados por pilar — Apify em DOIS NÍVEIS (decidido Olavo 2026-07-09)
Esta rubrica **elimina a Places API** (não traz Q&A, respostas do dono, posts) e a fonte é o **Apify**.
Mas há dois actors/configs com profundidade diferente — e o teste real (2026-07-09, perfil "Niti
Odontologia") mostrou que **o wrapper "GBP Auditor" é raso**. Por isso a decisão é **dois níveis**:

- **Nível LEVE — actor "GBP Auditor on Apify Store"** (testado; roda `compass/crawler-google-places` por
  baixo). Retorna: `profile.rating/reviewCount/reviewsDistribution`, `hasWebsite/website/phone/address`,
  `imageCount`, `categories`, `permanentlyClosed`. **O próprio JSON confessa (`manualChecks`) que NÃO
  retorna:** `businessDescription`, `questionsAndAnswers`, `servicesOrMenu`, `recentPosts` — e nas reviews
  só distribuição/contagem (**sem `responseFromOwnerText`, sem texto/datas**). Também traz um `score/grade`
  próprio numa rubrica genérica em inglês — **ignoramos** (a lente é a nossa, PT-BR, 10 pilares → `SVC-GBP`).
- **Nível COMPLETO — `compass/crawler-google-places` CRU** com `reviews` + `questionsAndAnswers` +
  `additionalInfo` ligados. Aí vêm reviews com `responseFromOwnerText`, o Q&A, atributos/serviços,
  `popularTimesHistogram`, horários e `peopleAlsoSearch` (concorrentes). Alimenta os pilares **1–9** de verdade.

**Estratégia de funil:** LEVE em todos os leads (triagem barata) → COMPLETO só no lead qualificado.

| Pilar | Nível LEVE (GBP Auditor) | Nível COMPLETO (scraper cru) |
|---|---|---|
| 1 Info básicas | ✅ nome, categorias, tel, site, endereço | ✅ + horários, atributos, áreas |
| 2 SEO local (descrição/serviços/NAP) | ⚠️ só categoria/nome (descrição e serviços faltam) | ✅ (descrição, serviços, NAP) |
| 3 Fotos/vídeos (qualidade) | ⚠️ só `imageCount` | ✅ contagem + URLs (visão fase 2 avalia qualidade) |
| 4 Avaliações (respostas do dono, crescimento) | ⚠️ só nota+volume+distribuição | ✅ texto + `responseFromOwnerText` + datas |
| 5 Q&A | ❌ | ✅ `questionsAndAnswers` |
| 6 Serviços/Produtos | ❌ | ✅ `additionalInfo`/serviços |
| 7 Postagens | ❌ | ⚠️ parcial (posts nem sempre expostos) |
| 8 Conversão (proposta/CTAs) | ⚠️ tem site/tel, sem descrição | ✅ descrição/atributos (qualitativo) |
| 9 Concorrentes/Local Pack | ❌ (`competitors:[]` no teste) | ✅ `peopleAlsoSearch` |
| 10 Performance | ❌ | ❌ — só Business Profile API em cliente gerenciado |

**Conclusão:** fonte = **Apify, dois níveis**. O nível LEVE (Auditor testado) faz triagem; o COMPLETO
(scraper cru com reviews+Q&A+additionalInfo) alimenta a rubrica inteira nos leads qualificados. Pilar **10
(Performance)** só para clientes já gerenciados (não prospects). Qualidade de foto (P3) e proposta (P8):
opcional um **passe de visão** (fase 2) — mas ⚠️ o `imageUrls` **não vem por padrão**, precisa ligar o
scraping de imagens. Detalhe de integração e os campos reais do JSON no brief C2 §1.

### Campos confirmados do nível COMPLETO (teste real 2026-07-10, `compass/crawler-google-places` cru)
Rodado em modo busca ("clinica médica", Rio Preto). Campos → pilar, com o que **entrega** e o que **ainda falta**:

| Campo do JSON | Pilar | Observação |
|---|---|---|
| `title`, `categoryName`, `categories[]`, `address`, `phone`, `openingHours`, `additionalInfo` | 1 | ✅ atributos ricos (Acessibilidade/Pagamentos/Estacionamento/Planejamento) |
| `categories[]` (10 no Ziló), `title` | 2 | ✅ categoria/keywords; ❌ `description: null` (não vem pelo Maps) |
| `imagesCount`, `imageCategories` | 3 | ✅ contagem; ⚠️ `imageUrls: []` vazio por padrão → visão fase 2 exige flag |
| `totalScore`, `reviewsCount`, `reviewsDistribution`, `reviews[].text`, **`reviews[].responseFromOwnerText`**, `reviewsTags[]` | 4 | ✅✅ **completo** — texto, respostas do dono e tópicos já agregados |
| `questionsAndAnswers[]` | 5 | ⚠️ **veio `[]`** — confirmar se é ausência real ou flag de Q&A desligada |
| `menu`, `servicesLink`, `additionalInfo` | 6 | ⚠️ serviços não listados nesse perfil (`null`) → parcial |
| `ownerUpdates[]` | 7 | ⚠️ veio `[]` — posts nem sempre expostos |
| `bookingLinks[]`, `phone`, `additionalInfo` (pagamentos) | 8 | ✅ link de agendamento + formas de pagamento; ❌ descrição/proposta textual |
| `peopleAlsoSearch[]` (nota+volume) | 9 | ✅ concorrentes para benchmark |
| — | 10 | ❌ só Business Profile API em cliente gerenciado |

**Sinais de ouro (o agente eleva a 🔴 automaticamente):**
- **`claimThisBusiness: true`** → perfil **não reivindicado** (sem dono ativo). Lead SVC-GBP mais quente possível.
- **Guarda de volume (Tema 10):** `totalScore` só vale com `reviewsCount` alto. Ex. do teste: Estrela `5.0`
  com `reviewsCount:1` (sinal fraco) vs Ziló `5.0` com `reviewsCount:101` (sinal forte). "Nota" sem volume = ruído.

**Modo busca × modo place:** o mesmo actor em **modo busca** (query+geo, retorna `rank`/`totalScore`/`reviewsCount`
por resultado) é um **motor de prospecção** (descobre leads com GBP fraco); em **modo place** (place_id/URL) faz o
deep-dive de 1 lead (enriquecimento C2). A discovery alimenta a frente **Prospecção**; o C2 usa o modo place.
