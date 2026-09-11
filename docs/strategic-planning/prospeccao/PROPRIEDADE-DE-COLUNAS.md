# Propriedade das Colunas — Planilha `leads`

> Tabela operacional: **quem é o dono**, **o que ele escreve**, **de onde vem o dado** e
> **com que frequência** cada coluna é atualizada. Estado verificado em 2026-09-11, lido do
> JSON dos workflows. Companheiro do `DICIONARIO-DE-COLUNAS.md` (que explica a *função* de cada
> coluna) e do `CONTRATO-PROSPECCAO.md` (as invariantes).

## Legenda de donos e frequências

| Dono | Workflow | Quando roda |
|---|---|---|
| **P2** | PROSP-02 Descoberta | **por prospecção** — a cada frase de busca disparada pelo P1 |
| **P3** | PROSP-03 Scoring | **por prospecção** — ao fim de cada busca, ou na mão para repontuar |
| **P4** | PROSP-04 Enriquecimento | **sob demanda** — por lote de leads da fila (prioridade ≥ 60) |
| **P5** | PROSP-05 CRM-out | **por lead enriquecido** — chamado pelo P4 |
| **SYNC** | Comercial · Sync HubSpot → Planilha | **a cada 6 h** — agendado |

---

## 1. Identidade e localização — **P2**

| Coluna | O que escreve | De onde vem | Frequência |
|---|---|---|---|
| `Id` | place_id do Google | Places API `id` | por prospecção (cria a linha) |
| `Nome` | nome do negócio | Places API `displayName` | por prospecção |
| `Setor` | tipo primário | Places API `primaryTypeDisplayName` | por prospecção |
| `contato` | telefone nacional | Places API `nationalPhoneNumber` | por prospecção |
| `site` | URL do site | Places API `websiteUri` | por prospecção |
| `Endereço` | endereço formatado | Places API `formattedAddress` | por prospecção |
| `Rua/Avenida` | logradouro | Places API `addressComponents` | por prospecção |
| `Bairro` | bairro | Places API `addressComponents` | por prospecção |
| `Cidade` | cidade | Places API `addressComponents` | por prospecção |
| `Estado` | UF | Places API `addressComponents` | por prospecção |
| `CEP` | CEP | Places API `addressComponents` | por prospecção |
| `Categoria 1` | 1ª categoria | Places API `types[0]` | por prospecção |
| `Categoria 2` | 2ª categoria | Places API `types[1]` | por prospecção |
| `Searchstring` | a frase da busca | o próprio input do P2 | por prospecção — **regravada a cada busca que reencontra o lead** |
| `Posição Pesquisa` | posição no resultado | ordem da Places API | por prospecção — idem |
| `Avaliação` | nota do GBP | Places API `rating` | por prospecção |
| `Quantidade reviews` | nº de avaliações | Places API `userRatingCount` | por prospecção |
| `Horário` | horário de funcionamento | Places API `regularOpeningHours` | por prospecção |
| `data extração` | data da descoberta | relógio do P2 | por prospecção |
| `mês extração` | mês da descoberta | relógio do P2 | por prospecção |

> **Regra I3:** o P2 cria a linha gravando `Patrocinado`, `Atributos`, `Agendamento`, `Posts`,
> `nao_reivindicado` e `Quantidade fotos` **vazios** — quem observa esses campos é o P4.

---

## 2. Observação profunda — **P4**

| Coluna | O que escreve | De onde vem | Frequência |
|---|---|---|---|
| `e-mail` | e-mail de contato | Apify `emails` + varredura do site | por lote (sob demanda) |
| `redes_sociais` | perfis sociais | Apify + links achados no site | por lote |
| `Patrocinado` | sim/não | Apify `isAdvertisement` | por lote |
| `Atributos` | atributos da ficha | Apify `additionalInfo` | por lote |
| `Agendamento` | link(s) de agendamento | Apify `bookingLinks` | por lote |
| `Posts` | nº de posts do dono | Apify `ownerUpdates` | por lote |
| `nao_reivindicado` | sim/não | Apify `claimThisBusiness` | por lote |
| `Quantidade fotos` | nº **real** de fotos | Apify `imagesCount` (sobrescreve o `>=10` do P2) | por lote |
| `analise_gbp_ia` | leitura da ficha | agente Gemini sobre dado medido | por lote |
| `enriquecimento_site` | leitura do site | agente sobre medição de HTML + PageSpeed | por lote |
| `enriquecimento` | resumo comercial | agente Gemini | por lote |

> **Medição do site:** o P4 baixa o HTML e chama a PageSpeed API (mesma chave da Places). O
> agente **não navega** — recebe os números prontos e redige sobre eles.

---

## 3. Score e prioridade — **P3**

| Coluna | O que escreve | De onde vem | Frequência |
|---|---|---|---|
| `potencial_comercial` | prioridade 0–100 | `round(100 · fit · oport)` | por prospecção |
| `fit` | eixo de encaixe | `(0,60·porte + 0,40·qual)·viab` | por prospecção |
| `oportunidade` | eixo de ganho | `max(gap, prontidão)` | por prospecção |
| `oferta_recomendada` | serviço a propor | regra sobre site + porte | por prospecção |
| `site_tipo` | own/social/none | classificação da URL | por prospecção |
| `flags_score` | motivos do score | motor de regras | por prospecção |
| `data_processamento_score` | data do cálculo | relógio do P3 | por prospecção |
| `modelo_versao` | versão da fórmula | config do P3 (`fit-oport-v1`) | por prospecção |
| `dim_saude` | percentil da ficha no setor | percentil dentro de Categoria 1 + Cidade | por prospecção |
| `dim_seo` | percentil de visibilidade | percentil da `Posição Pesquisa` no grupo | por prospecção |
| `dim_autoridade` | percentil de reputação | reviews + nota no grupo | por prospecção |
| `dim_conversao` | percentil de meios de contato | telefone/site/agend./e-mail no grupo | por prospecção |
| `dim_conteudo` | percentil de fotos | contagem exata (P4) no grupo | por prospecção — vazio sem P4 |
| `dim_engajamento` | percentil de atividade | Posts + Agendamento no grupo | por prospecção — vazio sem P4 |
| `score_gbp` | média das dimensões disponíveis | as dim_* acima | por prospecção |

> **Grupo de comparação:** `Categoria 1 + Cidade` (estável). Leads **ganhos saem do
> denominador** — podem ter sido melhorados por nós. Dimensão sem amostra suficiente grava
> vazio, nunca 0.

---

## 4. Ponte com o CRM — **P5**

| Coluna | O que escreve | De onde vem | Frequência |
|---|---|---|---|
| `id_hubspot` | ID do deal | HubSpot, na criação do deal | por lead enriquecido |

---

## 5. Espelho do funil — **SYNC** (a cada 6 h)

Nenhuma nasce aqui: nascem no HubSpot e voltam copiadas, casadas por `id_hubspot`.

| Coluna | O que escreve | De onde vem | Frequência |
|---|---|---|---|
| `status_crm` | rótulo do estágio (inclui Vencido/Perdido) | HubSpot `dealstage` → `STAGE_LABELS` | a cada 6 h |
| `motivo_perda` | motivo da perda | HubSpot `closed_lost_reason` | a cada 6 h |
| `motivo_ganho` | motivo do ganho | HubSpot `closed_won_reason` | a cada 6 h |
| `valor` | valor do deal | HubSpot `amount` | a cada 6 h |
| `via_aquisicao` | origem | HubSpot `hs_analytics_source` | a cada 6 h |
| `num_interacoes` | nº de toques | HubSpot `num_contacted_notes` | a cada 6 h |
| `ultimo_contato` | data do último toque | HubSpot `notes_last_contacted` | a cada 6 h |
| `data_criacao_deal` | criação do deal | HubSpot `createdate` | a cada 6 h |
| `data_fechamento` | fechamento | HubSpot `closedate` | a cada 6 h |
| `dias_no_funil` | ciclo de venda | derivado (criação → fim) | a cada 6 h |
| `probabilidade` | probabilidade | HubSpot `hs_deal_stage_probability` | a cada 6 h |
| `data_sync_hubspot` | quando sincronizou | relógio do SYNC | a cada 6 h |
| `nba_recomendada` | próxima ação | HubSpot `proxima_acao_recomendada` | a cada 6 h ⚠️ vazio se ninguém preenche no CRM |
| `nba_aceite` | ação aceita | HubSpot `proxima_acao_aceite` | a cada 6 h ⚠️ idem |
| `abordagem_ia` | abordagem sugerida | HubSpot `abordagem_sugerida_ia` | a cada 6 h ⚠️ idem |
| `acerto_previsao` | previsão × desfecho | derivado (score × status) | a cada 6 h |

---

## Colunas removidas (2026-09-11)

`score_tecnico`, `ipc`, `hubspot_status` — apagadas. As duas primeiras não tinham dono; a
terceira foi absorvida por `status_crm`, que já traz Vencido/Perdido pelo `STAGE_LABELS`.
