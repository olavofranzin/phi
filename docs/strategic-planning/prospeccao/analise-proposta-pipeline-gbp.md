# Análise da proposta de pipeline de prospecção a partir do GBP

> **Data:** 2026-08-28 · **Objeto:** proposta de fluxo em 9 etapas (GBP → n8n → agentes de IA)
> **Base da avaliação:** inventário dos 19 workflows (`panorama-workflows-prospeccao.md`),
> modelagem estatística (`modelagem-estatistica-priorizacao-leads.md`) e o que foi verificado em
> produção nos dias 27–28/08.

---

## Veredicto

**A proposta é um bom mapa do território — mas descreve como projeto futuro aquilo que já está
construído.** Das 9 etapas, 7 existem e rodam hoje. As 2 que faltam são justamente as que não
dependem de código, e sim de dado que ainda não temos.

Adotá-la como plano de construção repetiria exatamente o padrão que o Olavo identificou: gastar
energia reentendendo e refazendo, em vez de consertar o que existe.

---

## 1. O que a proposta descreve já existe

| Etapa proposta | Já existe como | Estado |
|---|---|---|
| 1. Nicho + região | `Intake - Telegram API` | ativo |
| 2. Busca no Maps/GBP | `L2 Discovery (Pipeline A)` (Apify) · `L2b` (Places API) | ativo / pronto |
| 3. Normalização + dedup | nós de normalização do L2 + `Deduplicar Leads HubSpot` | ativo |
| 4. Enriquecimento (site, redes) | `1º Enriquecimento` · `L3 Enriquecimento` · `Site L4` | 2 ativos |
| 5. IA cognitiva sobre reviews | `L3` (Gemini redige) · campos `analise_gbp_ia`, `abordagem_sugerida_ia` | existe |
| 6. Scoring | motor de regras: `score_tecnico`, `potencial_comercial`, 6 `dim_*`, `oferta_recomendada` | ativo |
| 7. Gravação no CRM | criação de deal + 20 propriedades PHI no HubSpot | ativo |
| 8. Next Best Action | campos `proxima_acao_recomendada`, `nba_aceite` | campos existem, subutilizados |
| 9. Aprendizado contínuo | **`Sync HubSpot → Planilha` (R3)** — 6/6h, cursor, 17 colunas de rótulo, `acerto_previsao` | ativo desde 17/07 |

A etapa 9, que a proposta trata como horizonte distante, é **o artefato mais bem construído da
frente** e roda a cada 6 horas há seis semanas.

---

## 2. Quatro objeções técnicas

### 2.1 🔴 As duas fórmulas da proposta se contradizem

A proposta define, no mesmo documento:

```
TotalScore   = FitScore + IntentScore                              (aditivo)
priority     = fit_norm · intent_norm · EV_norm · freshness        (multiplicativo)
```

Aditivo e multiplicativo respondem perguntas diferentes e não podem coexistir como "o score".
Pior: o aditivo é justamente a forma que **medimos saturar** — o motor atual usa uma variante
disso e produz 6 valores distintos em 20 leads, com 7 empatados no topo.

### 2.2 🔴 O produto de 4 fatores colapsa — e pode inverter de sinal

Três problemas no `priority_score` proposto:

**(a) Colapso.** Quatro fatores em [0,1] com média ~0,5 dão produto médio ~0,06. Quase todos os
leads ficam indistinguíveis perto de zero — a mesma saturação de hoje, invertida.

**(b) `EV_norm = EV / EV_max` é frágil a outlier.** Um único lead de ticket alto comprime todos os
outros. É o mesmo erro de usar média em distribuição assimétrica que já corrigimos com percentil
(a base tem skew 1,27, média/mediana = 1,73×).

**(c) 🔴 `EV` pode ser negativo.** `EV = p·CLV − C_acq − C_sales`. Para lead ruim, `EV < 0`, logo
`EV_norm < 0`, e o produto inteiro fica **negativo** — um lead péssimo pode pontuar acima de um
lead mediano dependendo dos sinais. É um defeito matemático, não de calibração.

### 2.3 🔴 Multiplicar por Intent zera toda prospecção fria

`priority = fit · intent · …`. Intent, como a própria proposta define, vem de reviews recentes,
atualização de horário, novas fotos, **visitas ao seu site e respostas de WhatsApp/e-mail**.

Um lead frio nunca nos conheceu: não visitou site, não respondeu e-mail. **Intent ≈ 0 para
praticamente toda a base** — e o produto zera todo mundo.

Fit + Intent é um modelo desenhado para *inbound*, onde o lead já interagiu. Nosso negócio é
prospecção ativa. O eixo Intent só se sustenta aqui na forma **longitudinal** (Δ reviews, Δ fotos
entre execuções semanais), e mesmo assim exige duas execuções antes de significar algo.

### 2.4 🔴 "Enviar só leads de alta qualidade para o CRM" contradiz a decisão de 27/08

A etapa 8.1 cita o padrão *"scrape → clean → AI qualification → enviar só leads de alta qualidade
para HubSpot"*.

Isso é o oposto da decisão tomada: **todos os leads vão para o HubSpot.** O motivo não é
preferência — é que filtrar a entrada torna o score **irrefutável**: só observamos desfecho dos
leads que o modelo aprovou, e nenhum erro na faixa baixa jamais aparece. Viés de seleção.

---

## 3. O que é inalcançável hoje — e não por falta de código

| Etapa | Bloqueio real |
|---|---|
| 8 — `EV = p·CLV − C_acq − C_sales` | **Não existe ticket, CLV nem custo de aquisição.** É a lacuna #1 de `.agents/product-marketing-context.md`, ainda em aberto |
| 10 — modelo preditivo para `p` | **Não existe rótulo.** 0 deals `closedlost`; os únicos `closedwon` são de abril/2023. O funil nunca rodou até o fim |

Construir os nós dessas etapas hoje produz código que não pode ser executado.

---

## 4. Divergências menores

| Ponto da proposta | Observação |
|---|---|
| Descoberta via Apify/SerpAPI/Outscraper | Retrocede à decisão de 27/08: **Places API na descoberta** (10.000 req/mês grátis por SKU ⇒ até 200 mil leads/mês sem custo), Apify só no enriquecimento de leads já qualificados |
| "Place Details reviews scraper" | A Places API **não** entrega Q&A, respostas do dono nem posts — decisão de 2026-07-09 registra que por isso o enriquecimento é Apify |
| Faixas 80–100 / 60–79 / 40–59 | Importadas de HubSpot/Clay sem calibração local. Já medimos que um corte de 45 deixava passar **90%** dos leads. Faixa de mercado sem calibrar é chute com aparência de método |
| Criar "contato/empresa" no HubSpot | Hoje o lead é um **DEAL**, sem company nem contact associados. Trocar o objeto é migração, não configuração |
| Checks de presença (etapa 3) | ✅ correto e necessário — mas a proposta não diz **o que fazer** com o lead que falha o check. Foi exatamente essa lacuna que gerou os leads envenenados de hoje (§7 do panorama) |

---

## 5. O que vale aproveitar

Quatro contribuições genuínas, que não existem hoje:

| # | Contribuição | Por que vale |
|---|---|---|
| 1 | **Extrair e-mail e redes sociais do site** | A coluna `e-mail` existe na planilha e está vazia. Hoje só temos telefone — limita o canal de abordagem |
| 2 | **Dedup por telefone e domínio**, além de `place_id` | Hoje o `Search deal` casa por `dealname` + telefone, que é frágil. É a razão de existir um workflow só para deduplicar |
| 3 | **Tier de esforço (Hot/Warm/Cold) com cadência definida** | Hoje o roteamento é por **oferta** (`SVC-*`), não por **intensidade**. São eixos complementares: *o que vender* e *quanto investir* |
| 4 | **Formulário de entrada** (Notion/Typeform) | Substitui o Telegram e reduz os 4 intakes concorrentes a um |

O item 3 é o mais valioso: preenche uma lacuna real do desenho atual sem contradizer nada.

---

## 6. Recomendação

**Não adotar como plano de construção. Usar como checklist de conferência.**

A base atual não sofre de falta de etapas — sofre de falta de confiabilidade nas que existem. Nas
últimas 48h encontramos, em produção: um workflow apagando colunas de outros donos, um `executeOnce`
que perdia a chave de junção de todos os leads menos o primeiro do lote, 64 leads sem deal, e uma
cadeia que gastava Gemini para gravar recusas que marcavam o lead como pronto para sempre.

Somar 9 etapas sobre isso multiplica a superfície de erro. **A ordem correta é inversa:**

1. Fechar os consertos abertos (guard do IF, limpeza dos envenenados, origem das linhas sem nome)
2. Arquivar os 8 workflows mortos — 19 → 7
3. Trocar o score aditivo por `fit × oportunidade` com percentil (já testado, 18 valores distintos em 20)
4. **Só então** incorporar os itens da §5 — e-mail/redes, dedup por telefone/domínio, tier de esforço

Os passos 1 e 2 não constroem nada. São o que torna possível confiar em qualquer coisa construída
depois.

---

*Analisado contra o estado verificado em produção, não contra a documentação.*
