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

> ⚠️ **Escopo dos defeitos acima — verificado em produção 2026-08-27.** Eles se aplicam à
> **Fase 1 (descoberta via Places API)**, que é o que a spec do L2b propõe. O `potencial_comercial`
> que roda hoje em produção usa dados do Apify (`claimThisBusiness`, fotos, atributos) e **não está
> saturado**: 23 valores distintos em 32 leads de agosto. A saturação é consequência de **perder
> features na migração para a Places API**, não um defeito do motor atual.
>
> Isso reforça, em vez de enfraquecer, a necessidade deste desenho: com menos features de entrada,
> a fórmula precisa ser mais discriminante — e `max()` não é.

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

## 4. O HubSpot como tabela de treino

> **Decisão Olavo, 2026-08-27:** *todos* os leads descobertos vão para o HubSpot — não apenas os
> acima do corte. Corte de enriquecimento fixado em **60**.

### 4.1 Por que enviar todos é estatisticamente obrigatório

A decisão não é só "ajuda a validar" — sem ela **o modelo nunca pode ser refutado**.

Se só os leads acima do corte entram no CRM, só observamos desfecho de leads que o modelo aprovou.
Os reprovados nunca produzem evidência. O modelo passa a se confirmar por construção: qualquer erro
sistemático na faixa baixa é invisível para sempre. É o problema clássico de **viés de seleção**
(em crédito, *reject inference*) — e a única solução barata é não filtrar a entrada.

**A consequência prática:** o corte 60 governa **gasto de Apify**, não entrada no CRM. São gates
diferentes e independentes:

| Gate | Critério | Custo |
|---|---|---|
| 1. Descoberta (Places API) | toda a busca | grátis dentro da cota |
| 2. Registro no HubSpot | **todos os leads** | grátis |
| 3. Enriquecimento (Apify + Gemini) | `prioridade ≥ 60` | pago |
| 4. Contato (tempo humano) | fila por prioridade **+ amostra de exploração** | tempo |

### 4.2 O gate 4 também precisa de exploração

Mandar todos para o HubSpot resolve metade. Se o contato humano seguir só o topo da fila, o
rótulo continua existindo só para o topo — o viés volta pelo gate 4 em vez do gate 2.

**Regra:** contatar **10–15% da fila sorteados fora do topo**, marcados com origem `exploracao`.
É a amostra de controle que responde "o score realmente prevê alguma coisa?". Sem ela, todo lead
de score baixo permanece um contrafactual não observado.

### 4.3 Estado real do CRM (verificado 2026-08-27)

O que **já existe** — e é bem mais do que eu supunha:

| | |
|---|---|
| Objeto usado para lead | `DEAL` (sem company/contact associados) |
| Deals criados em agosto/2026 | 141 |
| Propriedades PHI já criadas | `score_tecnico`, `potencial_comercial`, `ipc`, `oferta_recomendada`, `site_tipo`, `nao_reivindicado`, `flags_score`, `data_processamento_score`, `enriquecido_profundo`, as 6 dimensões (`dim_*`), campos de IA e `closed_lost_reason` |

**O esqueleto de captura já está construído.** A tese de que "não há onde guardar" estava errada.

#### Três defeitos medidos em produção

**(a) O IPC está quebrado.** Distribuição real dos 33 leads pontuados em agosto:

```
valor máximo observado : 23     (escala é 0–100)
concentração           : 0–23, com média ≈ 9
```

Nenhum lead passa de 23 numa escala de 0 a 100. O IPC carrega quase nenhuma informação e **nunca
dispara nenhum limiar calibrado para 0–100**. Investigar antes de usá-lo em qualquer decisão.

**(b) 60% dos leads chegam sem score.** Dos 82 deals de agosto, **49 estão `Unassigned`** em
`potencial_comercial`, `oferta_recomendada` e `site_tipo`. Com a decisão de mandar todos, essa
fração cresce — e lead sem features é linha inútil para treino, ainda que tenha rótulo.

**(c) Faltam a chave e as variáveis brutas.** Não existe propriedade `place_id`, nem
`quantidade_reviews`, `avaliacao`, `cidade`, `searchstring`, `posicao_pesquisa`. **Guardamos o
score, não os insumos que o produziram.**

Isso é o mais grave para o objetivo declarado. Com só o score armazenado, dá para avaliar *aquele*
score congelado — mas **não dá para recalibrar contra o histórico**, porque não se pode recalcular
uma fórmula nova sobre dados que não foram guardados. Cada mudança de modelo zera a base histórica.

### 4.4 O que falta criar no HubSpot

| Propriedade | Tipo | Por quê |
|---|---|---|
| `place_id` | string | **Chave de junção.** Nome de deal não é chave — muda e duplica |
| `quantidade_reviews` | number | Variável bruta do eixo porte |
| `avaliacao` | number | Variável bruta do eixo qualidade |
| `cidade` / `categoria` | string | Estratificação e controle |
| `searchstring` | string | Identifica a coorte de benchmark |
| `posicao_pesquisa` | number | Rank na busca de origem |
| `modelo_versao` | string | **Sem isto, scores de fórmulas diferentes se misturam em silêncio** |
| `origem_fila` | enum | `topo` / `exploracao` — ver §4.2 |

`modelo_versao` é barato e não-óbvio: quando o passo 1 do roadmap trocar `max()` por produto, os
scores antigos deixam de ser comparáveis com os novos. Sem o carimbo, treinar sobre a mistura
contamina o modelo sem erro visível.

### 4.5 O que isso muda no bloqueio

Se features **e** rótulo passam a viver no mesmo objeto (o deal), **o HubSpot é a tabela de
treino** — e o loop R3 (HubSpot → planilha) deixa de ser pré-requisito. Basta consultar o CRM.
O bloqueio some por mudança de arquitetura, não por trabalho extra.

**O que continua bloqueando:** ainda não há desfecho. Todos os deals de 2026 estão em aberto; os
únicos `closedwon` são de abril de 2023, anteriores a esta operação, e não há nenhum `closedlost`.
O funil nunca rodou até o fim uma vez. Sem desfecho não há variável-alvo — e sem variável-alvo
não há modelo, por mais bem estruturada que a tabela esteja.

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

### 5.1 Sobre a perda do `nao_reivindicado` — medida, não estimada

`nao_reivindicado` é descrito no design como "sinal de ouro" e **não existe na Places API**. Hoje
ele é observado de verdade, porque a descoberta em produção ainda usa Apify. Na migração ele se
perde.

Duas consequências, uma menor e uma maior do que eu esperava:

**Menor do que parecia.** Prevalência real em agosto/2026: **1 lead em 82** (1,2%). Uma variável
que dispara em 1,2% dos casos contribui quase nada para um modelo treinado em ~200 leads — seriam
~2 eventos positivos. Como *feature estatística*, perdê-la custa pouco. Como *gatilho de abordagem
individual* (regra 🔴 Crítica), continua valiosa nos raros casos em que aparece — e esses são
recuperados na Fase 2.

**Maior do que parecia.** O nó de escrita hoje grava `false` para todos. Isso está **correto
enquanto a fonte é o Apify** (é observação real). No dia em que a descoberta virar Places API, o
mesmo `false` passa a ser **afirmação de fato não observado** — a violação exata do guardrail
`source_status error/missing ⇒ N/D, não 0`. Não é bug hoje; vira bug silencioso na migração.

**Ação obrigatória na migração:** o nó de escrita para o HubSpot precisa deixar `nao_reivindicado`
**vazio** quando `enriquecido_profundo = false` e a origem for Places.

---

## 6. Ordem de implementação

| # | Passo | Depende de | Efeito |
|---|---|---|---|
| 0 | **Criar as 8 propriedades da §4.4 no HubSpot** (`place_id`, brutas, `modelo_versao`, `origem_fila`) | — | **Sem isto, todo lead gravado a partir de hoje é linha inútil para treino** |
| 1 | Trocar `max()` por `fit × oport` no nó `03_scoring_fase1` | — | 6 → 18 valores distintos; fila cai de 90% para 50% |
| 2 | Trocar comparação com média por rank percentil | 1 | Robustez a outlier; corrige o caso Maria Nina |
| 3 | Aplicar piso `fit ≥ 0,05` | 1 | Nenhum lead é excluído permanentemente |
| 4 | Gravar **todos** os leads no HubSpot com features brutas + `modelo_versao` | 0 | Elimina viés de seleção; cria a tabela de treino |
| 5 | Investigar por que 49 de 82 deals chegam sem score | — | 60% dos leads hoje entram cegos |
| 6 | Corrigir ou aposentar o IPC (máx 23 numa escala 0–100) | — | Hoje não informa nada |
| 7 | Deixar `nao_reivindicado` vazio quando origem = Places | migração | Guardrail BLOCO COMUM |
| 8 | Amostra de exploração: 10–15% da fila sorteados fora do topo | 4 | Contrafactual — sem isto o score não é falseável |
| 9 | Adicionar `reviews_anterior` / `data_anterior` | — | Habilita eixo Intent longitudinal |
| 10 | Ativar Intent + Freshness | 9 + 2 execuções | Fecha o framework do documento |
| 11 | Rótulo de micro-conversão + primeiro modelo | 4 + 8 + ~200 leads com desfecho | Primeiro scoring preditivo real |

**O passo 0 é o mais urgente e o mais barato.** Não melhora nada hoje e não aparece em lugar
nenhum — mas cada lead gravado sem `place_id` e sem variáveis brutas é dado de treino perdido de
forma irrecuperável. Fazer depois não recupera o que passou.

**Os passos 1–3 são independentes de tudo e valem por si.**

O loop R3 (HubSpot → planilha) **saiu do caminho crítico**: com features e rótulo no mesmo deal,
o HubSpot é a tabela de treino e não há o que sincronizar.

---

## 7. Como verificar

| Passo | Verificação |
|---|---|
| 0 | `search_properties` em `deals` retorna as 8 novas propriedades |
| 1–3 | Re-rodar contra os mesmos 20 dentistas: valores distintos ≥ 15, empates no topo ≤ 2, corte 60 retendo ~50% |
| 1–3 | Nenhum lead com site próprio e porte alto sai do `SVC-ADS` (regressão da decisão 2026-07-10) |
| 4 | Após uma rodada: nº de deals criados = nº de leads da busca (**não** só os ≥ 60), e 100% com `place_id` e `quantidade_reviews` preenchidos |
| 5 | `SELECT COUNT(*) FROM DEAL WHERE potencial_comercial IS NULL` cai para ~0 nas rodadas novas |
| 6 | IPC volta a ocupar a faixa 0–100 — ou é removido das telas |
| 7 | Deal de origem Places com `enriquecido_profundo = false` tem `nao_reivindicado` **vazio**, não `false` |
| 8 | ≥10% dos contatos do mês têm `origem_fila = exploracao` |
| 9–10 | Duas execuções da mesma query produzem `Δreviews` não-nulo para ao menos um lead; lead com Δ no p75 sobe na fila vs. mesmo Fit e Δ zero |
| 11 | AUC out-of-sample > 0,60 — abaixo disso o modelo não bate a regra determinística e deve ser descartado |

**Verificação transversal (a que responde a pergunta do Olavo):** com ~200 leads rotulados, comparar
a taxa de resposta entre a faixa `prioridade ≥ 60` e a amostra de exploração abaixo dela. Se as
duas taxas forem estatisticamente indistinguíveis, **o score não está prevendo nada** e as métricas
que usamos hoje precisam ser revistas. Este teste só é possível por causa da decisão de mandar
todos para o CRM.

O critério do passo 7 é deliberado: **se o modelo não superar a regra, a regra fica.** Princípio
"REGRAS antes de IA", do design do motor de scoring.

---

## 8. Pendências que este documento revela

- [ ] **Criar as 8 propriedades da §4.4** — urgente, cada dia sem elas é dado perdido
- [ ] Investigar por que 49 de 82 deals de agosto chegaram sem score
- [ ] Investigar o IPC (máx 23 numa escala 0–100 em 33 leads)
- [ ] Ticket por serviço — bloqueia EV/CLV (lacuna #1 de `.agents/product-marketing-context.md`)
- [ ] Decidir onde guardar histórico do Intent: propriedade no deal vs. aba de snapshots
- [ ] Definir o rótulo de micro-conversão em termos operacionais (qual estágio do pipeline conta como "respondeu")
- [x] ~~Loop R3 (HubSpot → planilha)~~ — **saiu do caminho crítico** (§4.5)
- [x] ~~Corte da fila~~ — **fixado em 60** (Olavo, 2026-08-27)

---

*Base teórica da frente Prospecção. O código do L2b implementa este desenho; divergência entre
os dois é bug do código, não do documento.*
