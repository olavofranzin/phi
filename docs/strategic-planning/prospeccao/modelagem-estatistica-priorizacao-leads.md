# Modelagem Estatística para Priorização de Leads

> **Frente:** Prospecção · **Data:** 2026-08-27 · **Status:** desenho — não implementado
> **Fontes:** documento `Modelagem Estatística e Predictive Lead Scoring para Priorizar Leads`
> (Google Docs, 58k chars) + `.md` anexo (contém apenas a primeira parte do Doc).
> **Governa:** o motor de scoring do L2b (`code-normalizer-places.js`, nó `03_scoring_fase1`).
> **Não altera:** as decisões de 2026-07-10 (roteamento de oferta) nem a ADR-003 (autoridade do score).

---

## 0. O que este documento resolve

O motor atual pontua leads com `max(gap_fundação, prontidão_ads) × viabilidade`. Testado contra
20 dentistas reais de Curitiba (dados de produção da Places API), ele apresenta **três defeitos
mensuráveis**:

| Defeito | Evidência nos 20 leads reais |
|---|---|
| **Saturação** | 7 leads empatados em 100, 9 empatados em 70 — apenas **6 valores distintos** em 20 |
| **Fila inútil** | 18 de 20 (90%) passam do corte 45 — a Fase 2 (Apify pago) roda para quase todos |
| **Benchmark frágil** | Compara com a **média** de reviews (447) numa distribuição assimétrica cuja mediana é 258 |

Este documento estabelece a base estatística para corrigir os três, mantendo intactas as decisões
de negócio já tomadas.

---

## 1. Base teórica — o que o documento traz

### 1.1 O framework central: Fit × Intent × Freshness

A contribuição principal do documento é separar três perguntas que hoje tratamos como uma só:

| Eixo | Pergunta | Natureza | Exemplos de sinal |
|---|---|---|---|
| **Fit** | Este negócio é o tipo de cliente que quero? | Estático (firmográfico) | porte, categoria, qualidade, região |
| **Intent** | Ele está *em mercado agora*? | Dinâmico (comportamental) | atividade recente, sinais de investimento |
| **Freshness** | Há quanto tempo observei isso? | Decaimento temporal | idade do sinal |

E propõe combiná-los **multiplicativamente**:

```
PriorityScore = Fit × Intent × Freshness
```

O produto é a escolha certa e não é detalhe de forma. Um lead com Fit alto e Intent zero **não
deve** ser priorizado — e `max()` o priorizaria. É exatamente a origem da saturação medida acima.

### 1.2 Por que percentil e não média

O documento defende benchmarking por **posição relativa na distribuição**, não por distância da
média. Nos nossos dados a razão é numérica:

```
média de reviews    : 447,2
mediana             : 258,5
razão média/mediana : 1,73
assimetria (skew)   : 1,27
leads abaixo da média: 65%   (abaixo da mediana, por definição: 50%)
```

Uma distribuição com cauda longa à direita. Comparar cada lead com a média faz **dois terços da
amostra parecerem fracos** — inclusive negócios sólidos. Foi o que rebaixou a Dra. Maria Nina
(164 reviews, site = `beacons.ai`) para 44 pontos, um abaixo do corte, apesar de ser exatamente
o perfil que o refino v1.1 do design marcou como lead de alto valor.

**Regra adotada:** toda comparação de porte usa **rank percentil dentro da própria busca**, não
distância da média.

### 1.3 O que mais o documento oferece (e o status de cada item aqui)

| Contribuição | Aplicável hoje? |
|---|---|
| Fit + Intent + Freshness | ✅ Fit sim; Intent e Freshness — ver §3 |
| Percentis / robustez a outlier | ✅ adotado |
| Camada de IA cognitiva sobre reviews (temas, dores, sentimento) | 🟡 depende do Apify (Fase 2) |
| Valor Esperado (EV) e CLV por lead | ❌ falta ticket por serviço (lacuna #1 do `product-marketing-context`) |
| Regressão logística / *predictive lead scoring* | ❌ falta rótulo — ver §4 |
| Caderno de ICP para salão/barbearia | 🟡 referência de pesos, categoria adjacente |

---

## 2. Modelo proposto — dois eixos

### 2.1 A correção conceitual

O documento chama seu eixo de "Fit". O nosso motor chama o dele de "gap". **Não são a mesma
coisa** e confundi-los quebra uma decisão já tomada:

- **Fit** = *este negócio é um bom cliente?* → porte, qualidade, viabilidade de contato
- **Oportunidade** = *tenho o que vender a ele?* → gap de fundação **ou** prontidão para ADS

Um perfil forte (Pio XII, 1849 reviews, site próprio) tem **gap baixo** e **Fit altíssimo**.
Tratar Fit como gap o rebaixaria — violando a decisão registrada:

> *"Potencial Comercial = max(gap de fundação, prontidão de ADS) × viabilidade — assim um perfil
> forte não é descartado: vira lead de ADS."* — Olavo, 2026-07-10

> *"O IPC não gateia 'abordar ou não' — ele roteia para a oferta certa."* — mesma decisão

O `max()` continua **dentro** do eixo Oportunidade, onde é semanticamente correto (basta uma via
de venda existir). O que muda é que ele deixa de ser o score final.

### 2.2 Formulação

```
EIXO 1 — FIT (0..1): este negócio é um bom cliente?

  porte  = rank_percentil(userRatingCount, dentro da mesma busca)
  qual   = 0,5                                   se rating ausente ou n < 5
         = clamp((rating - 3,5) / 1,5, 0, 1)     caso contrário
  viab   = 1,0  se tem horário OU telefone
         = 0,5  caso contrário

  fit = (0,60 · porte + 0,40 · qual) · viab


EIXO 2 — OPORTUNIDADE (0..1): tenho o que vender?

  gap    = 1,00  se site = none
         = 0,80  se site = social
         = 0,15  se site = own
  gap   += 0,15  se não tem horário publicado
  gap   += 0,15  se fotos < 10               (sinal binário — ver §5)
  gap    = min(gap, 1)

  pront  = 0                                  se site ≠ own
         = 0,50 + 0,50 · porte                se site = own
  pront += 0,20  se rating ≥ 4,5 e n ≥ 5
  pront  = min(pront, 1)

  oport = max(gap, pront)        ← decisão Olavo 2026-07-10, preservada


PRIORIDADE = round(100 · fit · oport)
```

**Guarda de volume (Tema 10):** nota 5,0 com n = 1 não é ponto forte. `rating` só vira sinal com
`userRatingCount ≥ 5`; abaixo disso `qual` fica neutro em 0,5.

### 2.3 Resultado contra os 20 leads reais

```
 #  nome                                     rev  site     fit  oport  PRIO  oferta
 1  Clínica Castell                         1077  own     0,94   1,00    94  SVC-ADS
 2  Julio Cavichiolo | Ortodontia           1200  own     0,94   1,00    94  SVC-ADS
 3  Clínica You Odonto                      1022  own     0,91   1,00    91  SVC-ADS
 4  Centro Odontológico Pio XII             1849  own     0,89   1,00    89  SVC-ADS
 5  Clínica Premium Curitiba                 657  own     0,82   1,00    82  SVC-ADS
 …
11  Dr. Maxwel Marques Dentista 24h           67  own     0,59   0,86    51  SVC-ADS
12  Dra. Maria Nina Munoz                    164  social  0,63   0,80    50  SVC-SITE
13  Dr Nicolae Carvalho de Paula             119  none    0,49   1,00    49  SVC-SITE
14  Dra Iasmin Diezner                        25  none    0,49   1,00    49  SVC-SITE
…
19  Dr. Jordano Francio                       24  own     0,38   0,75    29  SVC-ADS
20  Dentista 24h em Curitiba                   5  none    0,00   1,00     0  SVC-SITE
```

| Métrica | Modelo atual | Dois eixos |
|---|---|---|
| Valores distintos em 20 | 6 | **18** |
| Desvio-padrão | — | **25,6** |
| Empates no topo | 7 | 2 |
| Fila com corte 50 | 18/20 (90%) | **12/20 (60%)** |
| Fila com corte 60 | — | **10/20 (50%)** |

**Testes de sanidade — todos passam:**

- Perfis fortes permanecem no topo, roteados para `SVC-ADS` (decisão 2026-07-10 preservada)
- Dra. Maria Nina sobe de **44 → 50**: entra na fila, como o refino v1.1 exige
- O perfil com 5 reviews e sem contato sai do topo — **por Fit, não por gap**

**Corte recomendado: 60** (10 de 20 → a Fase 2 paga roda para metade, não para 90%).

### 2.4 Ajuste conhecido a fazer

O lead #20 zerou (`fit = 0,00`). O produto é implacável: porte no percentil 0 combinado com
qualidade baixa anula o score, e ele nunca reaparece na fila mesmo que melhore. **Aplicar piso**
`fit = max(fit, 0,05)` — mantém o lead no fim da fila em vez de excluí-lo permanentemente. Um
score 0 afirma "este lead não vale nada", o que é uma conclusão mais forte do que o dado sustenta.

---

## 3. O eixo que não temos: Intent

### 3.1 O problema

O documento propõe Intent a partir de: reviews nos últimos 30 dias, atualização de horário,
novas fotos, uso de reservas/mensagens, e eventos de CRM (visitou página, abriu e-mail).

**Nenhum está disponível para nós:**

- A Places API devolve `userRatingCount` (total acumulado), **nunca a data das reviews**
- Sinais de CRM não existem para lead frio — ele nunca nos conheceu
- Os campos de atividade do dono (`ownerUpdates`, `bookingLinks`) são justamente os 4 ausentes
  já mapeados na spec de descoberta

Sem Intent, `Priority = Fit × 1 × 1` — ficamos com um eixo a menos do que o framework pede.

### 3.2 A saída: Intent por observação longitudinal

Não conseguimos o Intent como **estado**, mas conseguimos como **variação**. Rodando a descoberta
semanalmente e guardando snapshots, a diferença entre execuções vira o sinal:

| Sinal do documento | Nosso proxy longitudinal | Fonte |
|---|---|---|
| Reviews nos últimos 30 dias | Δ `userRatingCount` entre execuções | Places API |
| Novas fotos publicadas | Δ contagem de `photos` (até saturar em 10) | Places API |
| Perfil sendo mantido | mudança em `regularOpeningHours` / Δ `rating` | Places API |

```
intent = clamp(Δreviews_30d / p75(Δreviews_30d da busca), 0, 1)
```

Com decaimento por idade do snapshot (Freshness), conforme o documento:

```
freshness = 0,5 ^ (dias_desde_observação / meia_vida)     meia-vida sugerida: 30 dias
```

**Custo: zero.** A descoberta já roda dentro da cota grátis (10.000 req/mês/SKU). O único
requisito é **guardar histórico** em vez de sobrescrever a linha do lead.

**Pré-requisito de implementação:** a planilha `leads` hoje faz upsert por `id` (place_id),
sobrescrevendo. Para medir delta é preciso ou (a) uma aba `leads_snapshots` append-only, ou
(b) colunas `reviews_anterior` / `data_anterior` na própria linha. A opção (b) é mais simples e
suficiente para um delta de uma janela.

**Maturação:** o eixo Intent só produz sinal após **duas execuções** da mesma busca. Até lá,
`intent = 1` (neutro), o que reduz o modelo ao de dois eixos da §2 — sem quebrar nada.

---

## 4. O que bloqueia o *predictive lead scoring*

O documento trata regressão logística e modelos preditivos. **Ainda não é alcançável, e é
importante ser direto sobre o porquê.**

Um modelo preditivo precisa de **rótulo**: leads com desfecho conhecido (fechou / não fechou).
Estado real do CRM, verificado em 2026-08-27:

| Estágio | Deals |
|---|---|
| Prospectado | 225 |
| Qualified to buy | 1 |
| Closed won | 2 *(ambos de abril de 2023 — anteriores a esta operação)* |
| **Closed lost** | **0** |

Os 226 deals criados entre abril e agosto de 2026 estão **todos em aberto**. O funil nunca rodou
até o fim uma vez sequer. Sem desfecho, não há variável-alvo — e sem variável-alvo não há modelo.

**Regra EPV (10–20 eventos por variável):** um modelo com 5 features precisa de ~50 a 100
**conversões**, não 100 leads. A uma taxa de fechamento típica de ~3%, seriam ~1.700 leads
trabalhados até o fim.

### 4.1 O atalho: micro-conversão

Em vez de esperar "virou cliente", usar um rótulo mais frequente e mais cedo no funil:

| Rótulo | Frequência estimada | Leads necessários p/ 50 eventos |
|---|---|---|
| Virou cliente | ~3% | ~1.700 |
| **Respondeu ao primeiro contato** | ~20–30% | **~200** |

Um modelo treinado em "responde ao contato" não prevê receita, mas prevê **onde vale gastar
tempo** — que é a decisão que a fila realmente toma.

**Bloqueio:** mesmo o atalho exige que o desfecho volte para a planilha. O loop **R3
(HubSpot → planilha)** não existe. Enquanto ele não for construído, nenhum rótulo é coletado —
e cada semana de prospecção sem ele é dado de treino perdido para sempre.

---

## 5. Limites honestos do dado

| Limite | Consequência | Tratamento |
|---|---|---|
| `photos[]` capado em 10 | Censura à direita: perfil com 200 fotos ≡ perfil com 10 | Usar só como binário `<10` (perfil fraco). **Nunca** como medida de porte |
| `types[]` ≠ categorias GBP | Taxonomia do Google, não o que o dono escolheu | Gravar marcado como origem distinta |
| 4 campos ausentes | `nao_reivindicado`, `Posts`, `Agendamento`, `Patrocinado` | Gravar **vazio, nunca 0/false** — guardrail BLOCO COMUM |
| Benchmark = a própria busca | Só 20 concorrentes por query | Suficiente para percentil; documentar que o universo é a busca, não o mercado |
| `Posição Pesquisa` ≠ Local Pack | Rank do Text Search não é o rank do Maps | Não comparar com o rank do Apify |

O item mais consequente é o terceiro: `nao_reivindicado` é o sinal mais forte do motor e **não
existe na Fase 1**. Toda priorização da descoberta opera sem ele, por construção.

---

## 6. Ordem de implementação

| # | Passo | Depende de | Efeito |
|---|---|---|---|
| 1 | Trocar `max()` por `fit × oport` no nó `03_scoring_fase1` | — | 6 → 18 valores distintos; fila cai de 90% para 50% |
| 2 | Trocar comparação com média por rank percentil | 1 | Robustez a outlier; corrige o caso Maria Nina |
| 3 | Aplicar piso `fit ≥ 0,05` | 1 | Nenhum lead é excluído permanentemente |
| 4 | Adicionar `reviews_anterior` / `data_anterior` à planilha | — | Habilita medição de delta |
| 5 | Ativar eixo Intent + Freshness | 4 + 2 execuções | Fecha o framework do documento |
| 6 | **Construir o loop R3 (HubSpot → planilha)** | — | **Destrava toda coleta de rótulo** |
| 7 | Rótulo de micro-conversão + primeiro modelo | 6 + ~200 leads | Primeiro scoring preditivo real |

**Os passos 1–3 são independentes de tudo e valem por si.** O passo 6 é o mais urgente em termos
de custo de oportunidade: ele não melhora nada hoje, mas cada semana sem ele é dado perdido.

---

## 7. Como verificar

| Passo | Verificação |
|---|---|
| 1–3 | Re-rodar contra os mesmos 20 dentistas: valores distintos ≥ 15, empates no topo ≤ 2, corte 60 retendo ~50% |
| 1–3 | Nenhum lead com site próprio e porte alto sai do `SVC-ADS` (regressão da decisão 2026-07-10) |
| 4 | Duas execuções da mesma query produzem `Δreviews` não-nulo para ao menos um lead |
| 5 | Lead com Δreviews no p75 sobe na fila vs. lead de mesmo Fit e Δ zero |
| 6 | Deal marcado `closedwon` no HubSpot aparece na planilha em ≤ 24h |
| 7 | AUC out-of-sample > 0,60 — abaixo disso o modelo não bate a regra determinística e deve ser descartado |

O critério do passo 7 é deliberado: **se o modelo não superar a regra, a regra fica.** Princípio
"REGRAS antes de IA", do design do motor de scoring.

---

## 8. Pendências que este documento revela

- [ ] Loop R3 (HubSpot → planilha) — bloqueia §4 inteira
- [ ] Ticket por serviço — bloqueia EV/CLV (lacuna #1 de `.agents/product-marketing-context.md`)
- [ ] Decidir onde guardar histórico: coluna na linha (simples) vs. aba de snapshots (completa)
- [ ] Confirmar corte da fila em 60 com o Olavo — é decisão de orçamento de Apify, não técnica

---

*Base teórica da frente Prospecção. O código do L2b implementa este desenho; divergência entre
os dois é bug do código, não do documento.*
