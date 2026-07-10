# Planilha "Quantidade de Leads por Mês" — colunas e função na aprendizagem dos agentes

> **Para que serve este doc:** fonte de verdade (versionada) das colunas da planilha de prospecção
> e a função de cada uma no aprendizado dos agentes. Criado em 2026-07-10 porque **várias colunas foram
> apagadas por engano** e precisavam ser restauradas — e não havia spec versionado (só a análise no Notion).
> **Fonte primária:** análise oficial **aprovada** no Notion "📊 PHI™ Prospecção — Análise Workflow Google
> Maps Atual" (`350b65e5-c72b-817f-ae19-f07f8a332549`, Documento Oficial=Sim, Aprovado). **Cruzado com** os
> workflows n8n que leem/escrevem a planilha.
>
> **Planilha (Google Sheets):** `1MuetJ4N7xiazkw55YOSHtq_nIaHPRKOE-g6GwfaNJKM`
> **Workflows que a usam:** `Google Maps - Extração e Enriquecimento` (n8n `5L3SyzDkZqf1N6vW`, 16 nós, versão
> documentada) e uma versão enxuta (`google_maps_updated.json` no repo). **Abas:** `qtd leads mes` (gid
> `624786381`, LEITURA) e `leads` (gid `0`, ESCRITA).

## Contexto: por que a planilha existe e como alimenta o aprendizado
O workflow extrai até ~50 leads/mês do Google Maps (Apify), enriquece cada um com pesquisa (Gemini + Google
Search) e cria o Deal no HubSpot. A planilha é **(a) gate de cota** (conta leads do mês → libera vagas) e
**(b) o corpus de aprendizado**: o agente de enriquecimento é, de propósito, um **agregador sem classificação**
— "o output serve para o sistema **aprender padrões de ICP**". As colunas são as features (sinais do negócio) +
os **rótulos humanos** (validação manual) de onde o futuro **Qualificador Cognitivo** (score ≥ 70) vai aprender
o que é "bom lead". **É a planilha precursora do motor de scoring GBP** (`scripts/gbp_scoring_prototype.py`) —
os mesmos sinais (rating, reviews, site, categoria, patrocinado) que hoje calculamos como Score Técnico/IPC.

---

## Aba `qtd leads mes` (gid 624786381) — LEITURA / controle de cota
O node "Consultar quantidade de leads" lê esta aba e calcula `vagas = max(0, 50 − leads_do_mês)` (free tier Apify).

| Coluna | Tipo | Função na aprendizagem / operação |
|---|---|---|
| `mes` (competência) | texto/data (ex.: `2026-07`) | chave do período; separa a contagem por mês |
| `quantidade` (leads extraídos) | número | quantos leads já entraram no mês → define vagas restantes |
| *(opcional)* `limite` | número (50) | teto mensal; hoje fixo no code (`50`) — se existir, parametriza a cota |

> ⚠️ Os nomes exatos desta aba não estão na análise (ela só descreve a função). Confirmar com a planilha viva
> (ou aceitar a reconstrução acima). O essencial: **período + contagem**.

---

## Aba `leads` (gid 0) — ESCRITA / corpus de aprendizado
São **22 campos extraídos** (mapeados do Apify) + `status` + `data_extracao` + o **enriquecimento (Gemini)** +
os **6 campos de validação manual**. Cada linha = um lead; cada coluna = uma feature ou um rótulo.

### Bloco 1 — Identidade e contato (extraídos do Apify)
| Coluna | Origem Apify | Função na aprendizagem |
|---|---|---|
| `place_id` | `placeId` | **chave única** (dedup); liga extração → enriquecimento → HubSpot. Sem ela o aprendizado duplica. |
| `nome` | `title` | identidade do negócio |
| `telefone` | `phone` | contato; canal de abordagem |
| `site` | `website` | **sinal de ICP e de oferta**: ter/não ter site (e se é rede social) → aprende oportunidade de **SVC-SITE** |
| `endereco` | `address` | localização completa |
| `bairro` | `neighborhood` | padrão territorial (densidade/renda por região) |
| `rua_avenida` | `street` | endereço |
| `cidade` | `city` | recorte geográfico de campanha |
| `cep` | `postalCode` | micro-território (cruzável com renda) |
| `estado` | `state` | UF |

### Bloco 2 — Sinais de porte/reputação/mercado (extraídos) — o núcleo do aprendizado de ICP
| Coluna | Origem Apify | Função na aprendizagem |
|---|---|---|
| `rating` | `totalScore` | reputação; **só vale com volume** (guarda de volume) — feeds Autoridade |
| `total_reviews` | `reviewsCount` | volume/maturidade digital; qualifica o `rating` (5,0 com 1 review ≠ com 200) |
| `rank` | `rank` | posição no Google Maps p/ o termo → proxy de concorrência/visibilidade |
| `patrocinado` | `isAdvertisement` | **já investe em anúncios** → sinal de budget e de lead **SVC-ADS** |
| `categoria` | `categoryName` | **segmento** — eixo primário do aprendizado (qual segmento converte) |
| `categoria_1` | `categories[1]` | categoria secundária → completude/SEO do perfil |
| `categoria_2` | `categories[2]` | idem |
| `search_string` | `searchString` | **qual termo** trouxe o lead → aprendizado de visibilidade/keywords |

### Bloco 3 — Controle e enriquecimento
| Coluna | Origem | Função na aprendizagem |
|---|---|---|
| `status` | fixo `novo` → `Prospectado` | **rótulo de funil**: o agente aprende quais características avançam no funil |
| `data_extracao` | `$now` | temporalidade/sazonalidade + contagem de cota mensal |
| `enriquecimento` | saída do **Gemini** | **corpus qualitativo**: capacidade financeira, presença digital, redes sociais, maturidade do setor, abordagem recomendada — de onde se extraem os padrões de ICP |

> A análise cita **"Mapeia 22 campos"**; 20 estão nomeados acima (18 extraídos + `status` + `data_extracao`).
> **Faltam 2** que a análise não enumera — candidatos prováveis pelos dados do Apify: `telefone_sem_formatacao`
> (`phoneUnformatted`), `latitude`/`longitude` (`location`) ou `perfil_reivindicado` (`claimThisBusiness`).
> **Confirmar com a planilha viva.**

### Bloco 4 — Validação manual (6 campos, dropdowns) — os RÓTULOS do aprendizado supervisionado
A análise diz: "6 campos adicionados no Google Sheets, dropdowns padronizados, formatação condicional por status".
São o **ground truth** que ensina o Qualificador: sem eles, o sistema perde a referência do que é "bom lead".
Os nomes exatos não estão documentados (provavelmente **perdidos no apagamento**). **Reconstrução recomendada**
(alinhada ao aprendizado e ao motor de scoring — ajustar aos originais se aparecerem):

| Coluna (proposta) | Tipo | Função na aprendizagem |
|---|---|---|
| `validacao_humana` | dropdown: Aprovado / Reprovado / Revisar | rótulo mestre: entra ou não no funil |
| `fit_icp` | dropdown: Alto / Médio / Baixo | quão aderente ao cliente ideal → alvo do Qualificador |
| `oferta_indicada` | dropdown: SVC-GBP / SVC-SITE / SVC-ADS / Combo | liga ao **roteamento de oferta** do motor de scoring |
| `motivo` | dropdown/texto | por que aprovado/reprovado → aprende critérios de qualificação e perda |
| `prioridade` | dropdown: Alta / Média / Baixa | ordenação da fila comercial |
| `observacoes` | texto | contexto humano livre |

---

## O que restaurar (resumo acionável)
1. **Aba `leads`:** recriar as colunas dos Blocos 1–3 (22 extraídas + `status` + `data_extracao` + `enriquecimento`)
   na ordem, mais os 6 do Bloco 4. A aba hoje está reduzida (evidência: a versão enxuta grava só `id, nome, setor,
   data extração`).
2. **Aba `qtd leads mes`:** garantir `mes` + `quantidade` (o code lê `leads_do_mês` p/ calcular vagas).
3. **Reconectar os nós Google Sheets** dos workflows (mapeamento de colunas) se os nomes mudarem.

## Gaps a confirmar com a planilha viva (Drive estava bloqueado por aprovação nesta sessão)
- Os **2 campos extraídos** não nomeados (para fechar os 22).
- Os **nomes/opções originais dos 6 campos de validação manual** (se recuperáveis; senão, usar a reconstrução).
- Os **cabeçalhos exatos** da aba `qtd leads mes`.
> Aprovando o acesso ao Google Drive (ou colando os cabeçalhos que sobraram), eu concilio este spec com a
> planilha real e fecho os gaps com precisão.

## Âncoras
- Análise oficial (Notion): `350b65e5-c72b-817f-ae19-f07f8a332549`.
- Planilha: `1MuetJ4N7xiazkw55YOSHtq_nIaHPRKOE-g6GwfaNJKM` (abas `qtd leads mes` gid 624786381, `leads` gid 0).
- Workflows: n8n `5L3SyzDkZqf1N6vW`; repo `google_maps_updated.json`.
- Sucessor do aprendizado: motor de scoring GBP — `docs/strategic-planning/roadmap-expansao/gbp-motor-scoring-ipc-design.md`, `scripts/gbp_scoring_prototype.py`.
