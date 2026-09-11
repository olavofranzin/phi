# Prompt de Deep Research — Planejamento de Campanhas de Mídia Paga

> Versão aprimorada. Antes de usar, preencha o **Bloco 0 (Configuração)**.
> Sem esse preenchimento a pesquisa vira genérica e pouco acionável.

---

## Bloco 0 — Configuração (preencher antes de enviar)

Preencha as variáveis abaixo. Onde você não souber ou não quiser restringir,
escreva `qualquer` — mas saiba que cada `qualquer` deixa a resposta mais genérica.

| Variável | Valor | Exemplo |
|----------|-------|---------|
| `MERCADO` | | Brasil (com comparativo internacional quando relevante) |
| `IDIOMA_DA_RESPOSTA` | | Português do Brasil |
| `IDIOMA_DAS_FONTES` | | Português e inglês |
| `PORTE_DO_ANUNCIANTE` | | PME e médio porte (verba de R$ 5 mil a R$ 200 mil/mês) |
| `MODELOS_DE_NEGOCIO_PRIORITARIOS` | | Serviços locais, e-commerce, geração de leads B2B |
| `QUEM_VAI_USAR` | | Gestor de tráfego / agência que atende múltiplos clientes |
| `MATURIDADE_DO_TIME` | | Intermediária — já opera campanhas, quer padronizar processo |
| `FERRAMENTAS_DISPONIVEIS` | | Google Ads, Meta Ads, GA4, BigQuery, Notion, planilhas |
| `HORIZONTE_DE_PLANEJAMENTO` | | Trimestral, com revisão mensal |
| `JANELA_TEMPORAL_DAS_FONTES` | | 2023 a hoje, priorizando 2025–2026 |
| `EXTENSAO_ALVO` | | Relatório longo (o equivalente a 25–40 páginas) |
| `FORMATO_DE_ENTREGA` | | Markdown, com tabelas e seções numeradas |

---

## Bloco 1 — Papel e objetivo

Você é um **pesquisador sênior de mídia paga**, com experiência de planejamento
em agência e em anunciante. Sua função aqui não é ensinar conceitos de marketing:
é reconstruir, com base em evidências públicas, **como times de alta performance
realmente planejam campanhas digitais antes de colocá-las no ar** — e transformar
isso em um processo reutilizável.

**Objetivo final:** produzir um material que um gestor de tráfego consiga abrir na
segunda-feira e usar para planejar uma campanha real, sem precisar de nenhuma
pesquisa adicional.

**Escopo principal (foco de ~80% do esforço):**
planejamento estratégico e operacional de campanhas de mídia paga em Google Ads,
Meta Ads, LinkedIn Ads, TikTok Ads, YouTube, Microsoft Ads, Pinterest Ads e X Ads.

**Escopo secundário (contexto, ~10%):**
planejamento de marketing e posicionamento — apenas como insumo que alimenta o
planejamento de mídia. Não desenvolva planejamento de marketing por si só.

**Fora de escopo (não pesquisar):**
- Execução operacional passo a passo dentro das interfaces das plataformas
  (onde clicar, como criar a conta).
- SEO, e-mail marketing, conteúdo orgânico e social orgânico, exceto quando
  entram como variável do plano de mídia.
- Teoria de marketing sem aplicação direta em campanhas pagas.
- Táticas dependentes de recursos descontinuados ou em descontinuação — se citar,
  marque explicitamente como **[OBSOLETO]** com a data da mudança.

---

## Bloco 2 — Perguntas de pesquisa

Cada bloco abaixo é uma pergunta que a pesquisa deve responder. Trate-os como
blocos independentes: **não repita o mesmo conteúdo em blocos diferentes** —
quando houver sobreposição, aprofunde no bloco mais específico e faça referência
cruzada nos demais.

### 2.1 — Como times de alta performance planejam (processo)
Reconstrua o processo real, não o ideal de manual. Cubra:
- Etapas do planejamento, do briefing ao go-live, com **duração típica de cada etapa**.
- Quem participa de cada etapa e quem decide o quê (papéis: estrategista, planner,
  mídia, criação, dados, atendimento, cliente).
- Documentos produzidos em cada etapa e quem os aprova.
- Fluxos de aprovação e pontos de bloqueio mais comuns.
- Como o processo muda entre: agência grande, agência boutique, time in-house e
  freelancer/gestor solo. **Explicite o que dá para adaptar para times pequenos.**

### 2.2 — Frameworks: mapeamento e avaliação crítica
Pesquise e avalie: STP aplicado à mídia, Full Funnel, See-Think-Do-Care,
Jobs to be Done aplicado a comunicação, Customer Journey Mapping, Growth Marketing,
Demand Generation (incluindo o debate demand gen × lead gen), Performance Marketing,
frameworks proprietários de planejamento de mídia, Integrated Marketing
Communications, e regras de alocação do tipo 60/40 (Binet & Field / IPA).

Para **cada** framework, entregue uma ficha padronizada:
| Campo | Conteúdo |
|-------|----------|
| Origem | Quem criou, quando, com base em quê |
| O que resolve | Problema específico de planejamento |
| Como se aplica na prática | Passo a passo curto |
| Quando usar / quando não usar | Contexto, porte, verba, maturidade |
| Evidência de eficácia | Estudo, dado ou apenas adoção anedótica |
| Críticas conhecidas | Limitações apontadas por especialistas |
| Nível de consenso | Alto / Médio / Baixo / Contestado |

Ao final, indique se existem **modelos mais recentes (2024–2026)** substituindo
os clássicos — especialmente por causa de automação, campanhas de IA
(Performance Max, Advantage+), perda de sinal de terceiros e mensuração incremental.

### 2.3 — Anatomia do planejamento de uma campanha
Detalhe como se define, na prática, cada elemento — e **por qual critério se decide**,
não apenas o que é cada coisa:
objetivo · KPI primário e secundários · métricas de diagnóstico ·
metas numéricas (como chegar ao número) · orçamento total e diário ·
distribuição de verba entre campanhas · duração · calendário ·
frequência e limites de saturação · segmentação · canais · formatos ·
criativos · mensagens · ofertas · plano de testes e testes A/B ·
hipóteses · plano de otimização e cadência de ajustes.

Para orçamento e metas, mostre **como o cálculo é feito** (fórmulas, raciocínio
de trás para frente a partir da meta de receita ou de leads), com pelo menos um
exemplo numérico completo.

### 2.4 — Como o plano muda conforme objetivo e contexto de negócio
Explique as diferenças concretas de planejamento — não descrições genéricas —
entre os objetivos e contextos abaixo. Agrupe para evitar repetição:
- **Por etapa de funil:** awareness / alcance / reconhecimento de marca · tráfego ·
  geração de leads · conversão e vendas · retenção · remarketing.
- **Por evento:** lançamentos · datas sazonais e Black Friday · sempre-ligado
  (always-on) versus campanhas por pulso.
- **Por modelo de negócio:** e-commerce · SaaS · negócio local · B2B com ciclo
  longo · B2C de ticket baixo.

Para cada um: objetivo de campanha recomendado, KPI primário, janela de
atribuição adequada, tempo mínimo de aprendizado, verba mínima viável, sinal de
conversão que deve ser otimizado e erro mais comum.

### 2.5 — Diferenças de planejamento por plataforma
Cubra Google Search, Google Display, Demand Gen, Performance Max, YouTube,
Meta Ads (incluindo Advantage+), LinkedIn Ads, TikTok Ads, Pinterest Ads, X Ads
e Microsoft Ads.

Entregue uma **tabela comparativa** com: intenção capturada (demanda existente ×
demanda gerada), objetivos suportados, verba mínima recomendada e tempo de
aprendizado, qualidade de mensuração, papel típico no mix, quando usar e quando
evitar. Depois, um **fluxo de decisão** ("se o negócio é X e o objetivo é Y,
comece por Z").

Baseie-se na documentação oficial atual de cada plataforma e **sinalize o que
mudou nos últimos 12–24 meses**.

### 2.6 — Estrutura de conta e infraestrutura de mensuração
Boas práticas para definir: hierarquia de campanhas, conjuntos e grupos de
anúncios · lógica de segmentação por tema, produto ou margem · públicos e
exclusões · estrutura de palavras-chave e correspondências · consolidação versus
fragmentação (e como a automação mudou essa recomendação) · landing pages ·
eventos de conversão e valor de conversão · pixel, API de conversões e
rastreamento server-side · consent mode · padrão de UTMs · nomenclatura de
campanhas · integração com CRM para conversões offline.

Inclua uma **convenção de nomenclatura pronta para uso** e um padrão de UTM.

### 2.7 — Decisões de alocação
Como se decide, com que critério e com base em qual dado:
qual canal entra no mix · quanto investir no total · como dividir verba entre
canais, entre campanhas e ao longo do tempo · como priorizar quando a verba não
cobre tudo · divisão entre prospecção e remarketing · divisão entre marca e
performance · quando escalar, quando pausar, quando realocar.

Apresente os **métodos de alocação** encontrados (por objetivo, por participação
de mercado, por teste incremental, por modelo de mix de mídia, por regra
histórica) com suas premissas e limitações.

### 2.8 — Planejamento criativo
Como times estruturam: conceito criativo · proposta de valor e diferenciais ·
ângulos de comunicação e como gerá-los · copy e CTAs · criativo por etapa de
funil · volume e taxa de renovação de criativos · fadiga criativa ·
calendário de produção · matriz criativa (ângulo × formato × público) ·
processo de teste criativo e como declarar um vencedor.

Inclua o que as plataformas publicam sobre **qualidade e diversidade criativa
como alavanca de performance** — hoje frequentemente a variável de maior impacto.

### 2.9 — Planejamento baseado em dados
Como usar, na fase de planejamento: pesquisa de mercado · dados históricos da
conta · analytics · CRM · comportamento do consumidor · dados das plataformas ·
benchmarks de mercado (e como usá-los sem se enganar) · sazonalidade ·
tendências · inteligência competitiva (bibliotecas de anúncios, ferramentas
de espionagem).

Explique também **o que fazer quando não há dado histórico** (conta nova, produto
novo, cliente novo) — cenário mais comum do que os frameworks admitem.

### 2.10 — Documentos e artefatos
Levante exemplos reais de: Media Plan · Campaign Brief · Creative Brief ·
plano de testes · plano de otimização · plano de mensuração (measurement plan) ·
dashboard executivo · calendário de campanhas · checklist de lançamento ·
documento de aprendizados (learning log).

Para cada documento: **objetivo, quem escreve, quem aprova, quando é feito,
seções obrigatórias e erros comuns de preenchimento**. Priorize modelos públicos
de plataformas, agências ou associações do setor, com link.

### 2.11 — Ciclo contínuo
Como funciona o loop completo: pesquisa → planejamento → implementação →
monitoramento → otimização → aprendizado → documentação → reaproveitamento.
Inclua **cadências** (o que se olha diariamente, semanalmente, mensalmente,
trimestralmente), critérios de decisão em cada cadência, e como os aprendizados
voltam para o planejamento seguinte sem se perder.

### 2.12 — Erros comuns
Liste os erros mais frequentes de planejamento. Para cada um:
sintoma observável · causa raiz · custo típico · como prevenir no planejamento ·
como corrigir se já aconteceu. Ordene por frequência × impacto.

---

## Bloco 3 — Fontes e regras de evidência

**Priorize, nesta ordem:**
1. Documentação oficial e materiais técnicos das plataformas (Google Ads Help,
   Think with Google, Meta Business/Meta Foresight, LinkedIn Marketing Solutions,
   TikTok Business, Microsoft Advertising).
2. Estudos e séries de dados setoriais: WARC, IPA, IAB, Nielsen, eMarketer,
   Ehrenberg-Bass, Kantar.
3. Publicações de consultorias: McKinsey, Bain, Deloitte, Gartner, Forrester.
4. Materiais metodológicos de agências e plataformas de mídia com processo
   documentado publicamente.
5. Pesquisa acadêmica recente sobre alocação de mídia, atribuição e incrementalidade.
6. Especialistas reconhecidos, quando a contribuição for metodológica e não
   promocional.

**Regras obrigatórias:**
- **Toda afirmação numérica** (benchmark, percentual, custo, prazo) precisa de
  fonte com nome, ano e link. Sem fonte, não use o número.
- **Nunca invente benchmarks, nomes de frameworks, estudos ou citações.** Se não
  encontrar evidência, escreva literalmente:
  `[SEM FONTE ENCONTRADA — recomendação baseada em prática comum do setor]`.
- Marque a data de publicação de cada fonte citada. Material sobre plataformas
  envelhece rápido: sinalize quando algo pode ter mudado.
- Distinga com clareza **três tipos de conteúdo**: (a) fato verificável com fonte,
  (b) prática consolidada de mercado sem estudo formal, (c) sua inferência.
- Fontes de fornecedores (plataformas, ferramentas) têm interesse comercial no
  resultado. Ao citá-las, sinalize e, quando possível, contraste com fonte independente.
- Quando as fontes divergirem, **não force consenso**: apresente as duas posições,
  quem defende cada uma e em que contexto cada uma faz sentido.
- Classifique cada recomendação relevante com um **nível de consenso**:
  `Alto` (fontes independentes convergem) · `Médio` (maioria converge, há dissenso) ·
  `Baixo` (poucas fontes) · `Contestado` (divergência ativa entre especialistas).
- Janela temporal: conforme `JANELA_TEMPORAL_DAS_FONTES`. Fontes anteriores só se
  forem obras de referência ainda válidas — nesse caso, justifique a inclusão.

---

## Bloco 4 — Entregáveis

Produza, na ordem, os itens abaixo. Cada entregável deve ser utilizável de forma
isolada, sem depender de ler o relatório inteiro.

1. **Sumário executivo (1 página)** — as 10 conclusões que mais mudam a forma de
   planejar, cada uma com uma frase de "o que fazer com isso".
2. **Relatório de pesquisa** — respostas aos blocos 2.1 a 2.12, com tabelas.
3. **Framework consolidado de planejamento** — sua síntese própria, com nome,
   diagrama textual das etapas, e justificativa de por que cada peça entrou,
   citando de onde veio.
4. **Processo passo a passo do briefing ao go-live** — numerado, com responsável
   sugerido, entrada, saída, duração estimada e critério de conclusão por etapa.
5. **Tabela comparativa de metodologias** — framework × objetivo × porte × verba ×
   maturidade × esforço × evidência × quando usar.
6. **Matriz de decisão** — dado um contexto (objetivo + modelo de negócio + verba +
   maturidade), qual abordagem, quais canais e qual estrutura usar.
7. **Checklist de planejamento** — dividido em: estratégia, mensuração, estrutura,
   criativo, orçamento, aprovações, pré-lançamento (o que precisa estar verificado
   nas 24h antes de subir).
8. **Template reutilizável de plano de campanha** — em Markdown, com campos em
   branco, instruções curtas por campo e um **exemplo preenchido** de um caso
   fictício realista dentro de `MODELOS_DE_NEGOCIO_PRIORITARIOS`.
9. **Lista de decisões obrigatórias antes do lançamento** — cada decisão com:
   quem decide, qual informação é necessária, o que acontece se for adiada.
10. **Recomendações práticas priorizadas** — ordenadas por impacto × esforço,
    cada uma amarrada à evidência que a sustenta e ao nível de consenso.
11. **Bibliografia comentada** — fontes agrupadas por tema, cada uma com uma linha
    sobre o que ela resolve e por que vale a leitura.
12. **Lacunas da pesquisa** — o que você procurou e não encontrou, onde a evidência
    é fraca, e quais perguntas ficaram em aberto.

---

## Bloco 5 — Estilo e formato

- Escreva em `IDIOMA_DA_RESPOSTA`, em linguagem direta e sem jargão desnecessário.
  Ao usar um termo técnico pela primeira vez, explique em meia linha.
- Prefira tabelas, listas de decisão e fluxos a parágrafos longos e conceituais.
- **Proibido**: encher linguiça, repetir a mesma ideia em seções diferentes,
  entregar definições de dicionário, ou fechar com conselhos vagos do tipo
  "teste sempre" e "conheça seu público". Toda recomendação precisa dizer
  **o que fazer, com qual número ou critério, e quando**.
- Sempre que fizer uma recomendação, informe também **em que situação ela deixa
  de valer**.
- Use exemplos numéricos concretos. Ao usar valores, deixe claro se são reais
  (com fonte) ou ilustrativos.
- Numere as seções conforme a estrutura deste prompt, para facilitar referência.

---

## Bloco 6 — Se precisar cortar escopo

Se a profundidade máxima não couber em uma única resposta, **não corte
uniformemente**. Mantenha a prioridade nesta ordem e avise no início o que foi
reduzido:
1. Blocos 2.3, 2.5, 2.6 e 2.7 (planejamento, plataformas, estrutura, alocação) —
   nunca reduzir.
2. Entregáveis 4, 7 e 8 (processo, checklist, template) — nunca reduzir.
3. Blocos 2.1, 2.8, 2.9, 2.10, 2.11, 2.12 — reduzir apenas se necessário.
4. Bloco 2.2 (fichas de frameworks) — pode virar tabela resumida.

---

## Bloco 7 — Autoverificação antes de entregar

Antes de finalizar, verifique e declare em uma seção curta ao final:
- [ ] Toda afirmação numérica tem fonte identificada com ano e link?
- [ ] Existe algum framework, estudo ou benchmark citado que você não conseguiu
      confirmar em uma fonte real? Se sim, ele está marcado como `[SEM FONTE ENCONTRADA]`?
- [ ] Os 12 entregáveis estão presentes?
- [ ] O template do entregável 8 está preenchível e tem exemplo completo?
- [ ] Um gestor de tráfego consegue planejar uma campanha real só com o entregável
      4 + 7 + 8, sem ler o resto?
- [ ] Há alguma seção que apenas repete outra? Se sim, consolide.
- [ ] As divergências entre fontes foram apresentadas como divergência, e não
      dissolvidas em consenso artificial?
- [ ] As recomendações dizem quando **não** se aplicam?
