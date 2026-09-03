# Dicionário de Colunas — Planilha `leads`

> Quem escreve cada coluna, de onde mais o dado poderia vir, e para que ela serve.
> Companheiro do `CONTRATO-PROSPECCAO.md`, que define as invariantes. Aqui está o **estado
> real verificado em 2026-09-02**, lido do JSON dos workflows — não do desenho.

**Invariante I1 — "uma coluna, um dono":** cada coluna tem exatamente um workflow autorizado a
escrevê-la. Onde isso não se cumpre hoje, está marcado com ⚠️.

## Os donos

| Sigla | Workflow | ID | Como roda |
|---|---|---|---|
| **P2** | PROSP-02 Descoberta (Places API) | `n7Z0xwi1dCDioln1` | chamado pelo P1, uma vez por frase de busca |
| **P3** | PROSP-03 Scoring (motor de regras) | `V0f80LU1ZH8PUtdc` | chamado pelo P2 ao fim de cada busca |
| **P4** | PROSP-04 Enriquecimento | `EFD7Drr0LDMqfDXw` | chamado pelo P1 ao fim, ou na mão |
| **P5** | PROSP-05 CRM-out (deal + id) | `94lSWJfxfu653KdN` | chamado pelo P4, um por lead |
| **SYNC** | Comercial - Sync HubSpot → Planilha | `WRFU2NM8rLJU7bRT` | agendado, a cada 6 h |
| **—** | ninguém | | coluna órfã |

---

## 1. Identidade e localização — dono **P2**

O P2 é a única fonte de identidade, e o único workflow autorizado a criar linha (I2).

| Coluna | Segunda opção | Função na prospecção |
|---|---|---|
| `Id` | Apify `placeId` (já disponível no P4) | **Chave única.** Todo cruzamento, dedupe e update casa por ela. Sem `Id` a linha é inútil. |
| `Nome` | Apify `title` | Identificação humana; vira o título do deal no HubSpot. |
| `Setor` | Apify `categoryName` | Segmentação e escolha do grupo de benchmark no P3. |
| `contato` | Apify `phone` / `phones` | Canal principal de abordagem. O P5 leva para o deal. |
| `site` | Apify `website` / `domain` | Âncora do guard I6 e insumo de **toda** a medição do P4. Sem site, metade da análise não existe. |
| `Endereço` | Apify `address` | Endereço completo para visita e conferência. |
| `Rua/Avenida` | Apify `street` | Recorte fino de território. |
| `Bairro` | Apify `neighborhood` | Recorte de território dentro da cidade. |
| `Cidade` | Apify `city` | Recorte territorial e base do `_site_cidade_no_site` (o site cita a cidade?). |
| `Estado` | Apify `state` | Recorte territorial. |
| `CEP` | Apify `postalCode`, ou Geocoding API | Roteiro e agrupamento por região. |
| `Categoria 1` | Apify `categories[0]` | Âncora I6 e agrupamento de benchmark. |
| `Categoria 2` | Apify `categories[1]` | Segunda categoria; refina o segmento. |
| `Searchstring` | — (é registro da própria busca) | **Rastro de cobertura.** É o que permite saber quais frases já rodaram e não repetir cota. |
| `Posição Pesquisa` | — | Proxy de relevância: onde o Google colocou o lead naquela busca. |
| `Avaliação` | Apify `totalScore` | Nota do GBP. Entra na dimensão de qualidade do score. |
| `Quantidade reviews` | Apify `reviewsCount` | Porte e autoridade. Abaixo de 5, a nota vira sinal fraco. |
| `Horário` | Apify `openingHours` — **já calculado no P4 (`_horario`) e não gravado** | Ficha completa = perfil cuidado. Entra na dimensão de qualidade. |
| `Quantidade fotos` | Apify `imagesCount` — **já calculado no P4 (`_fotos`) e não gravado** | Dimensão de conteúdo. ⚠️ O P2 **censura à direita** (`>=10`, teto da Places); o Apify traz o número real (36, 30, 10 no lote 34942). |
| `data extração` | — | Coorte e recência: de quando é este dado. |
| `mês extração` | — | Agrupamento mensal para acompanhar volume. |

> **Melhoria pronta para colher:** `Quantidade fotos` e `Horário` já chegam medidos ao P4 (em
> `_fotos` e `_horario`) e são descartados. Gravá-los troca um valor saturado (`>=10`) por um
> número real, sem custo novo de API.

---

## 2. Observação profunda — dono **P4**

Tudo aqui vem do Apify (ficha completa) ou da medição direta do site. São os campos que a
Places API **não** entrega.

| Coluna | Segunda opção | Função na prospecção |
|---|---|---|
| `e-mail` | **Agente de scraping próprio**: varrer `/contato`, `/fale-conosco`, rodapé e página de política do site do lead, que é onde o e-mail costuma estar e não aparece em `mailto:`. Fallback pago: Hunter.io ou Snov.io por domínio. | Canal de abordagem escrita. ⚠️ Voltou vazio nos 3 leads do lote 34942 — a telemetria nova (`_apify_tem_campo_emails`) dirá se o ator não devolve o campo ou devolve vazio. **É a coluna com maior distância entre valor e preenchimento.** |
| `redes_sociais` | Busca direta por perfil (`site:instagram.com "nome"`) num agente próprio | Onde o lead já produz conteúdo. Indica maturidade digital e dá assunto para a abordagem. |
| `Patrocinado` | Google Ads Transparency Center, ou conferência manual | **Sinal de que o lead já paga por mídia** — quem já investe é mais fácil de converter. |
| `Atributos` | — (só o GBP tem) | Riqueza da ficha: aceita convênio, acessibilidade, estacionamento. Entra na dimensão de saúde do perfil. |
| `Agendamento` | Detecção de widget no site (Doctoralia, Calendly) pelo próprio P4 | Se já agenda online, o funil dele é mais maduro — muda a conversa de venda. |
| `Posts` | — | Dimensão de **engajamento**: perfil vivo publica. ⚠️ Gravou vazio em todo lead até 02/09 por nome de campo errado (`updatesFromCustomers` em vez de `ownerUpdates`). Corrigido. |
| `nao_reivindicado` | Conferência manual da ficha | **Ficha não reivindicada é o gap mais vendável que existe:** o dono nem tomou posse do próprio perfil. |
| `analise_gbp_ia` | — (é redação sobre dado medido) | Leitura qualitativa da ficha: o que falta e o que isso custa. Material de abordagem. |
| `enriquecimento_site` | — | Leitura das medições do site: velocidade, SEO, GEO, conversão. **É o argumento com número** — LCP de 13 s não se discute. |
| `enriquecimento` | — | Resumo comercial de 3 a 5 frases. Vira a descrição do deal no HubSpot. |

> ⚠️ **Escrita compartilhada com o P2.** O P2 cria a linha gravando `Patrocinado`, `Atributos`,
> `Agendamento`, `Posts` e `nao_reivindicado` **vazios** (regra I3: não observado ≠ zero). O P4
> é quem observa e preenche. Não é conflito — é criação da linha versus observação do campo —
> mas são duas mãos na mesma coluna, e vale saber.

---

## 3. Score e prioridade — dono **P3**

O P3 não observa nada: ele lê a planilha e calcula. Nunca sobrescreve fato.

| Coluna | Segunda opção | Função na prospecção |
|---|---|---|
| `potencial_comercial` | — | **A prioridade, de 0 a 100.** É ela que governa a fila do P4 (corte em 60) e a ordem de ataque comercial. |
| `fit` | — | Quanto o lead casa com o que vendemos: `(0,60·porte + 0,40·qualidade) × viabilidade`. |
| `oportunidade` | — | Quanto há a ganhar: `max(gap, prontidão)`. Um lead ótimo sem lacuna não é oportunidade. |
| `oferta_recomendada` | — | Qual serviço propor primeiro. |
| `site_tipo` | O P4 poderia refinar com a medição real (hoje é classificado pela URL) | `own` / `social` / `none`. Quem só tem Instagram é conversa diferente de quem tem site próprio. |
| `flags_score` | — | Por que o score é o que é. Sem isso o número não se audita. |
| `data_processamento_score` | — | Quando foi pontuado — permite repontuar em massa após mudança de modelo. |
| `modelo_versao` | — | Qual fórmula gerou o número. **Sem isso não dá para comparar safras** de score entre si. |

---

## 4. Ponte com o CRM — dono **P5**

| Coluna | Segunda opção | Função na prospecção |
|---|---|---|
| `id_hubspot` | — | Costura a linha da planilha ao deal do HubSpot. É a chave que o SYNC usa para voltar com os dados do funil. |

---

## 5. Espelho do funil — dono **SYNC** (a cada 6 h)

Estas colunas **não nascem aqui**: nascem no HubSpot e são copiadas de volta. O SYNC casa por
`id_hubspot`. Segunda opção para todas: **webhook do HubSpot** em vez de varredura de 6 em 6
horas — troca latência média de 3 h por segundos, e some com a varredura inteira.

| Coluna | Função na prospecção |
|---|---|
| `status hubspot` | Rótulo do estágio (ex.: "Prospectado"). Onde o lead está no funil. |
| `hubspot_status` | Aberto / Vencido / Perdido — o desfecho, em três estados. |
| `motivo_perda` | **Por que perdemos.** É o dado que ensina o score a não priorizar quem não fecha. |
| `motivo_ganho` | Por que ganhamos. Mesma função, do lado bom. |
| `valor` | Valor do deal. Sem ele o score prioriza, mas não estima **valor esperado**. |
| `via_aquisicao` | Por onde o lead entrou. Compara prospecção ativa com outras origens. |
| `num_interacoes` | Quantos toques até o desfecho — custo de aquisição em esforço. |
| `ultimo_contato` | Data do último toque. Alimenta alerta de lead esfriando. |
| `data_criacao_deal` | Quando entrou no funil. |
| `data_fechamento` | Quando saiu. |
| `dias_no_funil` | Ciclo de venda. Cruzado com o score, diz se lead bem pontuado fecha mais rápido. |
| `probabilidade` | Probabilidade do HubSpot. Termo de comparação externo ao nosso score. |
| `data_sync_hubspot` | Quando o espelho foi atualizado. Diz se a linha está velha. |
| `nba_recomendada` | Próxima melhor ação sugerida. ⚠️ O SYNC copia, mas **o dado nasce no HubSpot** — se ninguém preenche lá, vem vazio. |
| `nba_aceite` | Se a sugestão foi aceita. ⚠️ Mesma condição. |
| `abordagem_ia` | Abordagem sugerida por IA. ⚠️ Mesma condição. |
| `acerto_previsao` | Se a previsão bateu com o desfecho. ⚠️ Mesma condição. **É a coluna que fecharia o laço de aprendizado**, e hoje depende de alguém alimentar o HubSpot. |

---

## 6. ⚠️ Colunas órfãs — **ninguém escreve**

Sobraram do motor antigo (L2/L3), que foi aposentado quando o P3 passou a usar o modelo
`fit-oport-v1`. **Os valores que estão lá são históricos e não são mais atualizados.**

| Coluna | O que era | O que fazer |
|---|---|---|
| `score_tecnico` | Nota técnica 0-100 do motor antigo | Ressuscitar como sub-score do P3, ou aposentar a coluna |
| `ipc` | Índice de potencial comercial antigo | Idem — hoje `potencial_comercial` ocupa esse papel |
| `score_gbp` | Nota isolada da ficha do Google | Seria útil separada do score geral: mede só o GBP |
| `dim_saude` | Completude da ficha | As seis dimensões são o **detalhamento** do score |
| `dim_seo` | SEO local | Sem elas o `potencial_comercial` é um número sem decomposição |
| `dim_autoridade` | Avaliações e reputação | O P4 hoje mede muito mais do que elas mediam |
| `dim_conversao` | Facilidade de virar contato | (idem) |
| `dim_engajamento` | Posts e atividade | ⚠️ Dependia de `Posts`, que estava quebrado |
| `dim_conteudo` | Fotos e riqueza visual | Dependeria de `Quantidade fotos` real, hoje saturada em `>=10` |

**Decisão pendente:** ou o P3 volta a preencher as dimensões (o dado bruto existe — o P4 já mede
mais do que o motor antigo media), ou as nove colunas saem da planilha. Deixá-las com valor
velho é pior que qualquer das duas: parecem atuais e não são.

---

## Resumo por dono

| Dono | Colunas |
|---|---|
| **P2** | 21 |
| **P4** | 10 (5 delas criadas vazias pelo P2) |
| **P3** | 8 |
| **SYNC** | 17 |
| **P5** | 1 |
| **órfãs** | 9 |

*Verificado em 2026-09-02 lendo o JSON dos workflows `n7Z0xwi1dCDioln1`, `V0f80LU1ZH8PUtdc`,
`EFD7Drr0LDMqfDXw`, `94lSWJfxfu653KdN` e `WRFU2NM8rLJU7bRT`.*

---

## Adendo 2026-09-03

### `Quantidade fotos` passou para o P4, com o número real

O P4 agora grava `imagesCount` do Apify por cima do `>=10` da Places. O dado já chegava até o
fim do fluxo e era descartado; agora é gravado.

A coluna passa a ter **dois tipos de valor**, e isso é proposital: `>=10` se lê a olho nu como
"ainda não medido com precisão". É a diferença entre isto e as colunas órfãs — um valor
autodeclarado como incompleto não engana ninguém; um número velho sem etiqueta, sim.

### Custo do Apify: a API responde, e o número é `usageTotalUsd`

Verificado com a sonda `DIAG - Custo das execuções do Apify` (`CprF1aeBAJouF95T`), que só lê
metadados e não roda ator nenhum:

- O objeto de execução traz **`usageTotalUsd`** — custo real em dólar, por execução.
- `stats` (e portanto `computeUnits`) **não vem** na listagem; exigiria `Get run` por ID.
- Também existe **`maxTotalChargeUsd`** como parâmetro do nó: teto de gasto por execução,
  que aborta a run ao atingir o limite.

Nas 16 execuções bem-sucedidas mais recentes: **US$ 3,8788 no total**, variando de
**US$ 0,024 a US$ 0,824 por lead** — 34× entre o mais barato e o mais caro. Média
**≈ US$ 0,24 por lead enriquecido**.

Como cada execução do ator corresponde a um lead do P4, a fila de 146 elegíveis custaria
**≈ US$ 35** para esvaziar, e um lote de 10 sai por **≈ US$ 2,40**.
