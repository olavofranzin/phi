# [RASCUNHO] ADR-31 — Camada de Conhecimento de Plataforma (Google Ads primeiro)

> **STATUS:** RASCUNHO (git, design-canônico). Aprovado em princípio por Olavo
> 2026-07-31 (abertura da frente Planejamento). Vira `Aceito` quando o job de cache
> (camada 1) + o Consultor de Plataforma rodarem para Google Ads.
>
> **ESCOPO:** desenho da arquitetura de conhecimento + o contrato do **Consultor de
> Plataforma**. **Só Google Ads** nesta rodada; **Meta = camada prevista, não
> construída** (§7). Separado do build de workflows.

## Contexto

Na frente de **Planejamento**, os agentes precisam sugerir **que tipo de campanha
criar** para um objetivo + perfil de cliente, com informação **atual** das plataformas
(Google/Meta) + a **memória do que funcionou pra nós** (Banco de Estratégias + Log).

O reflexo natural — escrever `.md` com as diretrizes das plataformas — **é a armadilha
errada**: conhecimento de plataforma **envelhece em silêncio**. Um `.md` de julho citado
com confiança em dezembro é a mesma família de falha do caso Salão (informação que
*parece* confiável). Manter à mão **garante** que vai ficar velho.

**A virada:** a maior parte desse conhecimento **não é documento — é dado consultável ao
vivo.** O Google Ads já expõe de forma estruturada e sempre atual: os **enums** de tipo de
campanha/objetivo/lance, e o recurso **`Recommendation`** (recomendações personalizadas
para *aquela conta*, hoje). Consulta > transcrição.

## Decisão

**Tratar conhecimento de plataforma como camadas, cada uma na sua fonte natural, e NÃO
transcrever em `.md` o que a API/Notion já servem ao vivo.**

### As 5 camadas

| # | Camada | Responde | Onde mora | Atualiza |
|---|---|---|---|---|
| **1** | **Estrutural** (enums/compatibilidade) | Que tipos de campanha existem? Que objetivo aceita que lance/otimização? | Cache no BQ (job) puxado da **API** | Só quando a versão da API muda |
| **2** | **Da conta** (recomendações) | O que **esta conta** deveria fazer agora? | **API** on-demand (`Recommendation`) | Toda análise (fresco) |
| **3** | **Doutrina/método** | *Como decidir* (Bússola, Janelas, Ordem Sagrada, benchmarks) | **Git** (`regras-otimizacao-metodo-subido.md`) | Raro |
| **4** | **Memória própria** ⭐ | O que **funcionou pra nós**? | **Notion**: Banco de Estratégias + Log de Otimizações + Client Knowledge Pack | Sozinha, a cada ciclo |
| **5** | **Prosa da plataforma** | Requisitos de criativo, boas práticas, novidades | **Fetch on-demand** de URLs (dev docs) | Na hora, com citação + data |

Camadas **1, 2 e 4 são consulta, não documento** — os agentes chegam nelas via API/Notion
dentro do n8n. Zero `.md` novo para elas.

### Fontes Google Ads (camadas 1 e 2)

- **Camada 1 (estrutural):** `advertising_channel_type` (SEARCH, DISPLAY, SHOPPING, VIDEO,
  PERFORMANCE_MAX, DEMAND_GEN, …), estratégias de lance, conversion goals — enums do proto,
  versionados. Cacheados por um job em `platform_capabilities` (BQ), com `versao_api`.
- **Camada 2 (recomendações da conta):** recurso **`Recommendation`** (`RecommendationType`:
  migrar Local→PMax, ativar tROAS, add sitelink/callout asset, corrigir/instalar tag,
  ampliar match, raise target CPA…). Consulta on-demand por conta.

### Precedência (o que vence o quê)

1. **Camada 1 é restrição DURA** — se a plataforma não oferece, o agente não sugere.
2. **Camada 4 tem o MAIOR peso na escolha** — o que já funcionou nas nossas contas vence
   conselho genérico. É o ativo mais defensável.
3. **Camada 3 diz COMO raciocinar** (Bússola por objetivo, "So What?", Ordem Sagrada).
4. **Camadas 2 e 5 enriquecem, nunca decidem sozinhas** — recomendação do Google é
   **sugestão do vendedor** (ele quer que você gaste mais); entra como **hipótese** e passa
   pelo Julgamento Multiobjetivo (Agente 4).

### Selo de validade (o guardrail que fecha o ciclo)

Todo conhecimento externo (camadas 1, 2, 5) carrega **`fonte + data_captura + versao_api`**.
Passou da validade → o agente marca **[HIPÓTESE]** e pede refresh. É o princípio do Guardião
(ADR-29) aplicado ao **conhecimento**, não ao dado.

### O contrato do "Consultor de Plataforma"

Ferramenta/agente (camada Sense/Planejamento) que os especialistas de Planejamento chamam
para responder *"que campanha criar para este objetivo + perfil de cliente?"*.

- **ENTRADA:** objetivo de negócio + perfil do cliente (Client Knowledge Pack) + contexto
  atual (conta/campanha, se houver).
- **MÉTODO:** consulta camada 1 (o possível — restrição dura) → camada 2 (o que a conta
  recomenda) → **camada 4 (o que funcionou pra nós — maior peso)** → camada 3 (Bússola/
  doutrina) → sintetiza. Recomendação de plataforma entra como hipótese.
- **SAÍDA (estruturada):**
  ```
  {
    "tipo_campanha_recomendado": "SEARCH | PMAX | ... (da camada 1)",
    "objetivo": "...", "metrica_mae": "CPA | ROAS | ...",
    "racional": "por que, ancorado em [camada 4] > [camada 3]; [CERTEZA]/[HIPOTESE]",
    "alternativas": [{"tipo": "...", "quando_faria_sentido": "..."}],
    "recomendacoes_plataforma_consideradas": [{"tipo": "...", "aceito": true/false, "porque": "..."}],
    "fontes": [{"camada": 1|2|4|5, "fonte": "...", "data_captura": "..."}],
    "confianca": "certeza | hipotese"
  }
  ```
- **GUARDRAILS:** camada 1 = limite; sem histórico próprio (camada 4) → confiança rebaixada;
  conhecimento externo sem selo válido → [HIPÓTESE] + refresh. NÃO cria/veicula campanha
  (isso é o Construtor + o "play" humano).

### Dono da camada de conhecimento

O **Curador de Conhecimento** (roster, hoje `PARCIAL`) — é literalmente o papel dele:
mantém o cache da camada 1 (via job), cataloga fontes da camada 5, e serve o substrato. As
camadas 1 e 5, quando viram snapshot, são **geradas por job** (puxa enums, carimba data/
versão, grava) — **não digitadas**.

## Alternativas consideradas

1. **`.md` por plataforma com as diretrizes.** Rejeitado: envelhece em silêncio; é o
   problema que motivou a ADR.
2. **Vector DB / RAG das páginas de ajuda.** Rejeitado *por ora*: exagero para a escala
   atual, e recria o envelhecimento (índice vira stale). Consulta ao vivo é mais simples e
   mais correta ("prefira a solução mais simples").
3. **Raspar em massa `support.google.com`.** Rejeitado: HTML frágil, ToS duvidoso, conteúdo
   meio marketing. Preferir **dev docs** (feitos para máquina) + fetch pontual.
4. **Camadas na fonte natural + selo de validade + Consultor (escolhida).**

## Consequências

- (+) Conhecimento **sempre atual** (API) + **memória própria** com o maior peso.
- (+) Quase nenhum `.md` novo; o que sobra (doutrina) já existe e muda devagar.
- (+) Reaproveita o roster (Curador) e o Julgamento Multiobjetivo (filtra a "sugestão do
  vendedor").
- (−) Depende de credencial Google Ads API + um job de cache (camada 1).
- (−) O Consultor precisa do Client Knowledge Pack povoado (perfil do cliente) — mesmo gate
  do E2.

## Reavaliar quando

- Meta entrar como frente ativa → replicar as camadas 1/2/5 para a Marketing API
  (`OUTCOME_LEADS` → `LEAD_GENERATION`, etc.) — **§7**.
- Escala justificar um índice semântico (camada 5 grande) → reavaliar RAG.

## Conexões com ADRs vigentes

- **ADR-29** (Guardião): o selo de validade é o mesmo princípio, aplicado ao conhecimento.
- **`regras-otimizacao-metodo-subido.md`**: é a camada 3 (doutrina).
- **ADR-30** (Ordem Sagrada/Janelas): o Consultor respeita a doutrina na síntese.
- **Roster:** Curador (dono), Planejador/Estrategista (consomem), Julgamento Multiobjetivo
  (filtra recomendações da plataforma). Banco de Estratégias (Notion) = camada 4.

## §7 — Meta (previsto, não construído nesta rodada)

Mesmo desenho, fontes da **Marketing API**: camada 1 = enums ODAX (objetivo↔otimização, ex.
`OUTCOME_LEADS` → `LEAD_GENERATION`); camada 2 = delivery insights/recomendações da conta;
camada 5 = dev docs da Meta. Construir quando a frente Meta abrir; o contrato do Consultor
é agnóstico de plataforma (só troca a fonte por trás).
