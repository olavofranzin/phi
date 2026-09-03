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

---

## Adendo 2026-09-03 (2): as órfãs não seguram o score, mas a falta delas segura o argumento

### Apagar as órfãs empobrece o score? **Não.**

O motor atual (`fit-oport-v1`) **não lê nenhuma delas**. Ele calcula `porte`, `qual`, `viab`,
`gap` e `prontidão` a partir de `Quantidade reviews`, `Avaliação`, `Horário`,
`Quantidade fotos`, `site_tipo` e afins — e produz `potencial_comercial`, `fit` e
`oportunidade`. Apagar `score_tecnico`, `ipc`, `score_gbp` e as seis `dim_*` **não muda um
único número**. Elas são inertes.

### Mas o que a pergunta acerta é outra coisa

O empobrecimento não vem de apagar a coluna. Vem de **ninguém calcular a decomposição** — e
isso já é verdade hoje, com as colunas lá.

Vale relembrar o que o experimento anterior mostrou: enquanto `Avaliação` e `Horário` estavam
vazios, o fator `qual` ficava constante em **0,5** para todo mundo, e o teto de prioridade da
base inteira era **80**. Preenchidos os campos em 60 linhas, `qual` voltou a variar e o
primeiro colocado saltou para **99**.

A lição é a régua desta decisão: **um sinal constante não discrimina nada.** Ele ocupa lugar na
fórmula e não separa ninguém de ninguém. Hoje `potencial_comercial` é um número único: serve
para **ordenar**, não para **explicar**. E argumento comercial precisa de explicação, não de
ordem.

### O que o comparativo setorial exige — e o que já existe

| Ingrediente | Estado |
|---|---|
| Grupo de comparação (setor + cidade) | ✅ existe — o P3 já agrupa por `Categoria 1` + `Cidade` |
| Posição na busca | ⚠️ existe e **está sendo destruída** — ver abaixo |
| Notas por dimensão | ❌ não existe — é o que precisa ser reconstruído |
| Percentil dentro do grupo | ❌ não existe — é o que transforma nota em argumento |

Nota crua não vende: "seu SEO é 42" não diz nada a um dono de clínica. **Percentil vende:**
"das 60 clínicas odontológicas de Rio Preto que medimos, você está entre as 15% mais lentas."

### ⚠️ A busca estreita está apagando a posição — e é a minha estratégia que faz isso

O `[P2] Upsert Planilha Leads` casa por `id` e sobrescreve. `Searchstring` e
`Posição Pesquisa` são regravados a **cada** busca que reencontra o lead. Com 8 frases por
prospecção, um lead achado em cinco delas **guarda só a última**.

Confirmado na base: a Niti Odontologia está no HubSpot desde **06/05**, foi descoberta por
`Clinica odontologica São José do Rio Preto`, e hoje a linha diz
`Searchstring: clinica de implante dentario em Sao Jose do Rio Preto`, `Posição Pesquisa: 39`.
A descoberta original foi sobrescrita.

Isso importa exatamente para o argumento que se quer construir. Duas razões:

1. **Posição só significa alguma coisa junto da busca que a gerou.** Ser 39º em "implante
   dentário" e ser 39º em "clínica odontológica" são fatos comerciais diferentes.
2. **Aparecer em muitas buscas é, por si, um sinal de visibilidade** — e a contagem se perde
   junto com o histórico.

O caso mais vendável é justamente o que somem: um lead que aparece **mal colocado em várias
buscas** é o retrato do problema que tráfego pago resolve. Hoje a planilha guarda uma foto só,
e a mais recente.

### ⚠️ E um limite estatístico honesto do comparativo

Benchmark exige o **grupo** medido, não só o alvo.

- **Dimensões do GBP** (ficha, reputação, posição): cobertura ~100% — o P2 mede todo mundo.
- **Dimensões do site** (PageSpeed, SEO, schema, pixel): cobertura **~8%** — só quem passou
  pelo P4, e enviesado para os de maior prioridade, porque é assim que a fila ordena.

Uma "mediana de SEO do setor" calculada sobre os 8% mais prioritários **não é a mediana do
setor** — é a mediana da elite da fila, e vai fazer todo lead novo parecer pior do que é.

Regra a adotar: o comparativo de site só se publica quando a cobertura do grupo passar de um
piso (sugestão: 30 leads medidos **e** 40% do grupo), e sempre rotulado com o `n`. Abaixo
disso, comparar só o que tem cobertura total.

### Pendência registrada

**Aviso de gasto do Apify em US$ 4,50.** ⚠️ O acumulado hoje é **US$ 3,88** — a US$ 0,24 por
lead, o limite cai em **cerca de 3 leads**. Antes de implementar, definir se são US$ 4,50 de
teto acumulado da conta, ou orçamento por período (mês/semana) — a implementação é diferente,
e no primeiro caso o aviso dispara já no próximo lote.

---

## Adendo 2026-09-03 (3): as dimensões voltaram, como percentil do setor

Rodado de verdade na execução **35258**: 315 leads, sete colunas órfãs voltaram a ter dono.

### A decisão de desenho: percentil, não nota

`dim_*` e `score_gbp` deixam de ser nota absoluta e passam a ser **percentil 0–100 dentro do
grupo setor + cidade**. A frase de venda já vem pronta no número:

> `dim_seo: 10` quer dizer, literalmente, **"90% das clínicas odontológicas de Rio Preto
> aparecem melhor que você na busca"**.

O primeiro caso real que o motor produziu é o argumento inteiro numa linha só:

| Gonçalves Odontologia | valor | leitura comercial |
|---|---|---|
| `dim_autoridade` | **99** | reputação no topo do setor |
| `dim_saude` | **100** | ficha impecável |
| `dim_seo` | **10** | aparece em **57º** — 90% do setor à frente |
| `flags_score` | `MAL_COLOCADO` | |

Reputação excelente, ficha completa, e ninguém a encontra. É o retrato exato do problema que
tráfego pago resolve — e não é opinião, é percentil sobre 123 concorrentes medidos.

### O grupo de comparação mudou, e os scores mudaram junto

Era `Searchstring`. Mas o P2 regrava a Searchstring a cada busca que reencontra o lead, então
**o grupo mudava de composição sozinho a cada prospecção** — e com ele o `porte` de todo mundo.
Agora é `Categoria 1 + Cidade`. Os grupos reais: `dental_clinic @ SJRP` (n=123),
`dentist @ SJRP` (n=112), `doctor @ SJRP` (n=17).

Os scores mudaram de propósito: os antigos vinham de um agrupamento instável por construção.

### ⚠️ Um defeito meu, achado pelo teste em seco

Escrevi no comentário que "percentil com n=3 é ruído" e depois guardei **só o tamanho do
grupo**. Uma dimensão observada em 3 leads dentro de um grupo de 123 saía como percentil
confiante — o `dim_engajamento` da Gonçalves veio **100** assim.

Corrigido com um segundo piso: cada dimensão exige `MIN_AMOSTRA = 8` observações **dela
própria**. Depois da correção, `dim_engajamento` virou vazio em toda a base — `_amostra_eng: 0`.
Honesto: `Posts` só começou a funcionar agora e `Agendamento` só existe onde o P4 passou.

### A exclusão dos ganhos: verificada, não suposta

Não bastava escrever a regra. O diagnóstico `_status_vistos` mostrou o que existe na planilha:

```
Aberto | Prospectado = 89 ; Aberto | Interação Instagram = 1 ; (vazio) | (vazio) = 225
```

**Não há nenhum lead ganho na base hoje.** A regra está no lugar e não exclui ninguém ainda —
o que só se sabe porque foi medido. Quando o primeiro deal fechar, ele sai do denominador
sozinho.

### Cobertura das dimensões, hoje

| Dimensão | Cobertura | Depende de |
|---|---|---|
| `dim_autoridade` | alta | Avaliação + reviews (P2, todo mundo) |
| `dim_seo` | alta | Posição Pesquisa (P2, todo mundo) |
| `dim_saude` | alta | Horário, telefone, site, avaliação |
| `dim_conversao` | alta | telefone, site próprio, e-mail, agendamento |
| `dim_conteudo` | **parcial** — 61 leads com contagem exata | Apify via P4; `>=10` é censura e não entra |
| `dim_engajamento` | **vazia** — amostra 0 | Posts e Agendamento, só onde o P4 passou |

As duas parciais enchem sozinhas conforme o P4 roda. É a razão de o P4 valer o custo: ele não
só enriquece o lead dele, **ele melhora a régua de todos os outros**.

### `score_tecnico` e `ipc` continuam órfãs, de propósito

`ipc` duplica `potencial_comercial` e `score_tecnico` não tem definição nova. Preencher coluna
só porque ela existe é exatamente o defeito que este trabalho corrigiu. Recomendação: aposentar
as duas.
