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

### 4.3 A tabela de treino não é o HubSpot — é a planilha

> **Correção (Olavo, 2026-08-27):** as variáveis brutas **existem**, na planilha
> `Quantidade de Leads por Mês` (`1MuetJ4N7xiazkw55YOSHtq_nIaHPRKOE-g6GwfaNJKM`, aba `leads`).

A arquitetura correta já está desenhada e é melhor do que a que eu propus. Os dois lados são
complementares, não concorrentes:

| Lado | O que guarda | Estado |
|---|---|---|
| **Planilha** (63 colunas) | `id` (place_id), features brutas, score, dimensões, roteamento | ✅ existe e roda |
| **HubSpot** (deal) | o funil e o desfecho — `dealstage`, `closed_lost_reason`, `amount` | ✅ existe e roda |
| **`id_hubspot`** (coluna da planilha) | o elo entre os dois | ⚠️ declarado, **nunca populado** |

O schema canônico já declara `"join_key": "id_hubspot"` e `"dedup_key": "id"`. O contrato §1.4
especifica um **bloco de RESULTADO/APRENDIZADO** completo (17 colunas: `hubspot_status`,
`motivo_perda`, `motivo_ganho`, `valor`, `dias_no_funil`, `acerto_previsao`…), desenhado
exatamente para receber os rótulos.

**Retiro o que escrevi na versão anterior deste documento.** Não faltam variáveis brutas e não
falta chave — ambas existem. Falta **uma coisa só**.

#### O elo quebrado

Registrado em `prompts/codex-hubspot-status-extracao.md` (2026-07-15), defeito 4:

> *"`Atualizar status do lead na planilha` casa pela coluna `id_hubspot` **que nenhum nó popula**
> → cria linha duplicada em vez de atualizar."*

#### ⚠️ Os dois nomes são o mesmo conceito — e é exatamente por isso que há risco

`id_hubspot` e `id_deal_hubspot` significam a mesma coisa: o id do deal no HubSpot
(Olavo, 2026-08-27). Conceitualmente não há ambiguidade nenhuma.

**Mas o nó Google Sheets do n8n não casa por conceito — casa por string exata do cabeçalho.**

| Fonte | Nome usado | Natureza |
|---|---|---|
| `planilha-leads-schema.json` (**AS-BUILT**, 63 colunas reais, 2026-07-13) | `id_hubspot` | cabeçalho real da aba |
| `prompts/codex-hubspot-status-extracao.md` (2026-07-15) | `id_deal_hubspot` | instrução ao Codex |

**Não existe nenhuma coluna `id_deal_hubspot` no schema AS-BUILT.** O nome aparece só no prompt do
Codex — que instrui, em quatro pontos, a casar por `id_deal_hubspot` e explicitamente **"não usar
`id_hubspot`"**.

Se essa instrução for executada contra a planilha atual, `matchingColumns: ["id_deal_hubspot"]`
não encontra cabeçalho nenhum, o match falha e o nó **cria linha nova** — que é precisamente o
sintoma do defeito 4 que o prompt pretendia corrigir. O próprio prompt hedgeia ("confirmar o header
exato"), sinal de que a dúvida já existia quando foi escrito.

**Ação:** conferir o cabeçalho real da aba `leads` e alinhar o prompt do Codex ao nome que existe
lá — presumivelmente `id_hubspot`. Não é uma decisão de design; é evitar que a correção
reintroduza o bug.

Consequência: features de um lado, rótulos do outro, e nada os une. Cada lado funciona; o par não.
É por isso que a base de treino tem zero linhas apesar de os dados existirem.

#### O que a planilha realmente não tem

| Falta | Impacto |
|---|---|
| `id_hubspot` populado | **Bloqueia tudo** — features e rótulos nunca se encontram |
| Colunas do bloco §1.4 | Marcadas *"(a criar)"* — o destino dos rótulos não existe ainda |
| `modelo_versao` | Scores de fórmulas diferentes se misturam em silêncio no treino |
| `origem_fila` | `topo` / `exploracao` — sem isto a amostra de controle da §4.2 não é identificável |

Só as duas últimas são propriedades novas de verdade. As duas primeiras são trabalho já
especificado que não foi concluído.

### 4.4 Os backups diários resolvem o Intent — de graça

Descoberta desta verificação: existe uma pasta com **snapshot diário** da planilha
(`backup_leads_2026-08-14` … `backup_leads_2026-08-27`, um por dia, gerados ~11h UTC).

Isso muda a §3 materialmente. Eu havia proposto criar colunas `reviews_anterior`/`data_anterior`
para medir Δ entre execuções. **Desnecessário:** o histórico já está sendo gravado. O eixo Intent
pode ser calculado **retroativamente**, sobre as ~2 semanas que já existem, comparando o
`Quantidade reviews` do mesmo `id` entre backups de datas diferentes.

Também resolve parcialmente o `modelo_versao`: dá para reconstruir qual score um lead tinha em uma
data, mesmo que o upsert tenha sobrescrito a linha viva.

**Passo 9 do roadmap sai da lista de construção e vira análise sobre dado existente.**

### 4.5 O que isso muda no bloqueio

O loop R3 **volta ao caminho crítico** — eu o tinha removido cedo demais. Com as features na
planilha e os rótulos no HubSpot, a sincronização não é opcional: é o que fecha o circuito.

Mas o escopo é bem menor do que "construir o R3": o workflow existe, com defeitos catalogados
desde julho. O bloqueio real é **popular `id_hubspot` no momento em que o deal é criado** — um
campo, escrito uma vez, no nó que já cria o deal.

**O que continua bloqueando de fato:** não há desfecho. Todos os deals de 2026 estão em aberto; os
únicos `closedwon` são de abril de 2023, anteriores a esta operação, e não há nenhum `closedlost`.
Ainda que o elo seja consertado hoje, o join produz 226 linhas com rótulo "Aberto". O funil precisa
rodar até o fim — e é isso que a decisão de mandar todos ao CRM, somada à amostra de exploração,
finalmente permite medir.

### 4.6 Dois defeitos medidos em produção (2026-08-27)

**(a) O IPC está quebrado.** Distribuição real dos 33 leads pontuados em agosto:

```
valor máximo observado : 23      (a escala é 0–100)
concentração           : 0–23, média ≈ 9
```

Nenhum lead passa de 23 numa escala de 0 a 100. O IPC **nunca dispara nenhum limiar calibrado para
0–100** e carrega quase nenhuma informação. Investigar antes de usá-lo em qualquer decisão — ou
aposentá-lo.

**(b) 60% dos leads chegam sem score.** Dos 82 deals de agosto, **49 estão `Unassigned`** em
`potencial_comercial`, `oferta_recomendada` e `site_tipo`. Lead sem features é linha inútil para
treino mesmo tendo rótulo — e com a decisão de mandar todos ao CRM, essa fração tende a crescer.

**O que está certo e vale registrar:** o roteamento de oferta funciona sem exceção nos 33 leads
pontuados — `SVC-SITE` só para `site_tipo = social`, `SVC-ADS`/`SVC-GBP` só para site próprio.
A decisão de 2026-07-10 está implementada corretamente em produção.

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
| 0a | **Conferir o cabeçalho real da aba `leads`** e alinhar o prompt do Codex a ele (o AS-BUILT diz `id_hubspot`; o prompt manda usar `id_deal_hubspot`, que não existe lá) | — | Impede que a correção reintroduza o bug |
| 0b | **Popular esse campo no nó que cria o deal** | 0a | **Fecha o elo.** Sem ele, features e rótulos nunca se encontram |
| 1 | Trocar `max()` por `fit × oport` no nó `03_scoring_fase1` | — | 6 → 18 valores distintos; fila cai de 90% para 50% |
| 2 | Trocar comparação com média por rank percentil | 1 | Robustez a outlier; corrige o caso Maria Nina |
| 3 | Aplicar piso `fit ≥ 0,05` | 1 | Nenhum lead é excluído permanentemente |
| 4 | Gravar **todos** os leads (planilha + deal), não só os ≥ 60 | 0b | Elimina viés de seleção |
| 5 | Criar as colunas do bloco §1.4 na planilha | 0a | Destino dos rótulos |
| 6 | Consertar o loop R3 (6 defeitos catalogados em 2026-07-15) | 0b + 5 | Fecha o circuito de aprendizado |
| 7 | Investigar por que 49 de 82 deals chegam sem score | — | 60% dos leads hoje entram cegos |
| 8 | Corrigir ou aposentar o IPC (máx 23 numa escala 0–100) | — | Hoje não informa nada |
| 9 | Deixar `nao_reivindicado` vazio quando origem = Places | migração | Guardrail BLOCO COMUM |
| 10 | Adicionar `modelo_versao` e `origem_fila` | — | Evita contaminar o treino; identifica a amostra de controle |
| 11 | Amostra de exploração: 10–15% da fila sorteados fora do topo | 4 + 10 | Contrafactual — sem isto o score não é falseável |
| 12 | Calcular Intent **retroativamente** sobre os backups diários | — | Não precisa construir nada — o histórico já existe (§4.4) |
| 13 | Rótulo de micro-conversão + primeiro modelo | 6 + 11 + ~200 leads com desfecho | Primeiro scoring preditivo real |

**O passo 0 é o mais urgente e o mais barato: um campo, escrito uma vez, no nó que já cria o
deal.** Todo o resto da infraestrutura de aprendizado já existe — as features na planilha, os
rótulos no HubSpot, o histórico nos backups. Falta o elo.

**Os passos 1–3 são independentes de tudo e valem por si.**

**O passo 12 é lucro puro:** eu havia planejado construir colunas de histórico para o eixo Intent.
Os backups diários já as substituem — é análise sobre dado que já está guardado.

---

## 7. Como verificar

| Passo | Verificação |
|---|---|
| 0 | Após uma rodada: **100% das linhas novas da planilha têm o campo de join preenchido**, e cada valor casa com um deal existente |
| 1–3 | Re-rodar contra os mesmos 20 dentistas: valores distintos ≥ 15, empates no topo ≤ 2, corte 60 retendo ~50% |
| 1–3 | Nenhum lead com site próprio e porte alto sai do `SVC-ADS` (regressão da decisão 2026-07-10) |
| 4 | nº de leads gravados = nº de leads da busca (**não** só os ≥ 60) |
| 5–6 | Um deal movido para `Perdido` no HubSpot aparece na planilha com `hubspot_status` e `motivo_perda` em ≤ 6h, **sem criar linha duplicada** |
| 7 | `COUNT(*) WHERE potencial_comercial IS NULL` cai para ~0 nas rodadas novas |
| 8 | IPC volta a ocupar a faixa 0–100 — ou é removido das telas |
| 9 | Deal de origem Places com `enriquecido_profundo = false` tem `nao_reivindicado` **vazio**, não `false` |
| 11 | ≥10% dos contatos do mês têm `origem_fila = exploracao` |
| 12 | Comparar dois backups distantes ≥7 dias produz `Δreviews` não-nulo para ao menos um `id` |
| 13 | AUC out-of-sample > 0,60 — abaixo disso o modelo não bate a regra determinística e deve ser descartado |

**Verificação transversal (a que responde a pergunta do Olavo):** com ~200 leads rotulados, comparar
a taxa de resposta entre a faixa `prioridade ≥ 60` e a amostra de exploração abaixo dela. Se as
duas taxas forem estatisticamente indistinguíveis, **o score não está prevendo nada** e as métricas
que usamos hoje precisam ser revistas. Este teste só é possível por causa da decisão de mandar
todos para o CRM.

O critério do passo 7 é deliberado: **se o modelo não superar a regra, a regra fica.** Princípio
"REGRAS antes de IA", do design do motor de scoring.

---

## 8. Pendências que este documento revela

- [ ] **Conferir o cabeçalho real da aba `leads`** e corrigir o prompt do Codex antes que ele rode — o nome que ele manda usar (`id_deal_hubspot`) não consta do schema AS-BUILT (§4.3)
- [ ] **Popular o campo de join no nó que cria o deal** — bloqueia todo o aprendizado
- [ ] Criar as colunas do bloco de RESULTADO/APRENDIZADO (§1.4 do contrato da planilha)
- [ ] Investigar por que 49 de 82 deals de agosto chegaram sem score
- [ ] Investigar o IPC (máx 23 numa escala 0–100 em 33 leads)
- [ ] Ticket por serviço — bloqueia EV/CLV (lacuna #1 de `.agents/product-marketing-context.md`)
- [ ] Definir o rótulo de micro-conversão em termos operacionais (qual estágio conta como "respondeu")
- [ ] Padronizar `closed_lost_reason` como dropdown — hoje é texto livre e o motivo de perda é o rótulo mais informativo que temos
- [x] ~~Corte da fila~~ — **fixado em 60** (Olavo, 2026-08-27)
- [x] ~~Onde guardar histórico do Intent~~ — **os backups diários já resolvem** (§4.4)
- [x] ~~Criar propriedades de features brutas no HubSpot~~ — **desnecessário, existem na planilha** (§4.3)

---

*Base teórica da frente Prospecção. O código do L2b implementa este desenho; divergência entre
os dois é bug do código, não do documento.*
