# [BRUTO v0.1] Arquitetura Saúde Digital — 4 camadas (visão estratégica)

> **STATUS:** RASCUNHO DE DESIGN (git canônico, ADR-012). Aprovado em
> princípio por Olavo 2026-06-22 (decisões D11-D15). Define a visão
> arquitetural que enquadra a evolução do Agregador T28 → Análises →
> Entrega → Saúde Digital do cliente. **Não** é estado operacional;
> vira ADRs Aceitos no Notion conforme cada lote chega (D12).
>
> **FONTE DE VERDADE:** BigQuery (analítico, ADR-010). Notion (estado
> operacional + entrega humana, ADR-012). Git (design, ADR-012).
>
> **PRÉ-LEITURA:** `agregador-t28/BRUTO-v0.2-design.md` (contract T28,
> 5 decisões D1-D5) + `agregador-t28/ddl/phi_dev_t28_tables.sql`.

---

## 0. Por que este doc existe

Durante o smoke do Agregador T28 (L1), Olavo levantou que estávamos
"deixando complicação para depois" e pediu análise estratégica de 6
pontos abertos:

1. Após os `[T28] BQ`, falta a ligação com agente(s) que fazem as
   análises (a análise pode ser sub-workflow; dados visualizados em
   Notion/web).
2. Cada volta do loop analisa um anúncio, depois o conjunto, depois a
   campanha — bottom-up, podendo ser no mesmo workflow.
3. Saúde digital do cliente inclui análise dos perfis de redes sociais.
4. Análise social + GBP servem **também** para os workflows de
   prospecção (reuso).
5. Precisamos incluir alertas de erro.
6. Definir como este workflow termina, qual e onde é sua entrega, e
   fazer espelhos para conjunto de anúncios e campanhas.

Este doc responde aos 6 com uma arquitetura de **4 camadas desacopladas**.

---

## 1. Princípio: separar ETL de Análise de Entrega

Hoje o WF "PHI — Agregador de Métricas Multi-fonte" (`4sdG2UKMCBuFq8xn`)
tende a acumular responsabilidades. O caminho saudável (alinhado ADR-012
— separação de concerns) é **4 WFs encadeados** via Execute Workflow
Trigger, cada um com 1 responsabilidade:

```
[1] AGREGADOR T28        [2] ORQUESTRADOR ANÁLISES      [3] ENTREGA & ALERTAS
    (ETL puro)               (LLM, bottom-up)               (side effects)

    raw_campaign_data        t28_*                          análises
       |                        |                             |
       v                        v                             v
    6 tabelas t28_*    -->   chama sub-WFs análise    -->   Notion DB Análises
    (1x por trigger)         ad -> adset -> campaign        + DB Otimizacoes
    SEM LLM                  -> cliente                     + DB Demandas (alertas)
    idempotente              (bottom-up rollup)             + Telegram

                            [SUB-WFs Análise reutilizáveis]
                            - Análise Ad (granular)
                            - Análise Adset
                            - Análise Campaign
                            - Análise Saúde Cliente (social + GBP + Clarity)
                            - Análise GBP       (reuso prospecção)
                            - Análise Social    (reuso prospecção)

[4] ERROR HANDLER global (transversal)
    sub-WF acionado via onError dos nodes críticos das 3 camadas
    -> loga em t28_errors -> cria tarefa DB Demandas -> Telegram
```

### Por que separar (justificativa por camada)

| Camada | Natureza | Por que isolar |
|---|---|---|
| **[1] Agregador** | ETL idempotente, sem LLM, rápido | Falha cara se inflado. Reexecutável sem efeito colateral. |
| **[2] Orquestrador + Análises** | LLM (lento, caro, quota Gemini) | Isolar permite retry/cache; quota não derruba o ETL. |
| **[3] Entrega** | Side effects (Notion write, Telegram) | Poder desligar/depurar isoladamente sem reprocessar análise. |
| **[4] Error Handler** | Transversal | Padrão global; 1 lugar para alertas de toda a stack. |

---

## 2. Camada 1 — Agregador T28 (onde estamos)

**Responsabilidade única:** ETL. Lê `raw_campaign_data` + APIs externas,
normaliza no contract T28, grava nas 6 tabelas `t28_*`. **Termina nos 6
BQ Inserts** (D13). Sem LLM, sem análise, sem entrega.

**Estado atual (L1, em smoke):** refactor cirúrgico tirando T28 de dentro
do Loop legado (ver §6). Pós-fix, executa 1x por trigger.

**O Loop legado** (`splitInBatches`) é preservado por ora (D-decisão
Olavo: não remover Meta, não consolidar anúncios). Itera por anúncio
servindo o caminho legado AI Agent (hoje OFF). Quando o Orquestrador L3
existir, o Loop legado fica irrelevante e pode ser removido — mas isso é
decisão de L3, não de L1.

---

## 3. Camada 2 — Orquestrador de Análises (L3)

**Responsabilidade única:** orquestrar análises LLM **bottom-up**.
Responde ao ponto 2 do Olavo (ad -> adset -> campaign -> cliente).

```
Para cada cliente da janela:
  Para cada anúncio:
    -> SUB-WF Análise Ad      (lê t28_adset.criativos_json + t28_ga4_landing)
  Para cada adset:
    -> SUB-WF Análise Adset   (lê t28_adset + outputs ad-level)
  Para cada campaign:
    -> SUB-WF Análise Campaign (lê t28_campaign + outputs adset-level)
  Consolidação cliente:
    -> SUB-WF Análise Saúde Cliente (lê tudo + perfis sociais + GBP + Clarity)
```

**Bottom-up rollup:** análise de nível inferior alimenta o superior. Cada
nível recebe contexto do que está abaixo. O "espelho para conjunto e
campanha" (ponto 6) é isto: mesma estrutura de análise replicada por
nível, com agregação crescente.

**Granularidade ad-level (D15):** vive em `t28_adset.criativos_json`
(top-N criativos). Tabela `t28_ad` dedicada só será criada se a análise
ad-level precisar de histórico próprio — decisão diferida para L3 quando
soubermos o requisito real. Default: usar `criativos_json`.

---

## 4. Camada 3 — Entrega & Alertas (L3.5)

**Responsabilidade única:** materializar análises onde humanos veem +
disparar alertas. Responde aos pontos 1 e 6 (entrega).

**Notion como canônico humano (ADR-012):**

| Destino | Conteúdo |
|---|---|
| **DB Análises PHI** (novo) | 1 page por análise. Properties: nível (ad/adset/campaign/cliente), janela, cliente, PHI·Mídia score, flags. Body: insight + recomendações (output LLM). |
| **DBs Campanhas/Anúncios/Conjuntos** (existentes) | Atualizar properties `phi_midia_score`, `last_analysis_date`, `flags_ativas` (rollup das análises mais recentes). |
| **DB Demandas** (existente) | Tarefas automáticas quando análise dispara alerta (loop ADR-22). |
| **DB Otimizações** (existente/a confirmar) | Log de cada análise + ação tomada. |
| **Telegram** | Notificação resumo + link Notion (alertas críticos). |
| **Web (futuro)** | Dashboard lê de BQ + Notion via API. Fora de escopo agora. |

---

## 5. Reuso para prospecção (ponto 4)

Os sub-WFs **Análise Social** + **Análise GBP** são projetados para
receber parâmetros `tipo_alvo` (`cliente` \| `prospecto`) e `id_alvo`.
Mesmos workflows servem ambos os usos:

- Orquestrador T28 (L3) chama com `tipo_alvo=cliente`.
- WF Prospecção (futuro) chama com `tipo_alvo=prospecto`.

**Contrato comum** (`features_social_v1`, `features_gbp_v1`) vira ADR-25.
Define entrada/saída estável para que ambos os consumidores dependam da
mesma interface — não de implementação.

---

## 6. Refactor cirúrgico L1 (em curso — não confundir com a visão acima)

O L1 **NÃO** carrega a complexidade das camadas 2-4. É só o fix da
duplicação descoberta no smoke: T28 estava dentro do Loop (itera por
anúncio) -> N execuções -> N× linhas em t28_*.

**Mudanças cirúrgicas (decisões Olavo aplicadas):**
- M1: **NÃO** remover nodes (Meta Ads preservado; legado AI Agent OFF preservado).
- M2: **NÃO** consolidar anúncios (Loop preservado para granularidade futura ad-level).
- M3: tirar T28 de dentro do Loop — reconectar `[T28] BQ Read` ao Loop
  output 0 (done) em vez de output 1 (next iter); desconectar Adaptador
  do Merge1; ligar BQ Read -> Adaptador direto.
- M4: **NÃO** remover cadeia LLM Search Terms (mantida; retorna features
  zeradas hoje por listas brand/competitor vazias no Notion, não por bug).
- M5: defaults `pct_*=0` já garantidos por `num()` no Normalizador.

**Smoke esperado pós-fix:** t28_campaign=12 (6 dias × 2 campanhas),
t28_adset=0 (PMAX), t28_ga4_landing=2, t28_gbp_daily=1, t28_clarity_daily=1,
t28_meta_campaign=0 (Meta disabled / sem dado).

---

## 7. Decisões aprovadas (D11-D15, Olavo 2026-06-22)

| # | Decisão | Valor |
|---|---|---|
| **D11** | Arquitetura de 4 camadas (Agregador / Orquestrador / Análise / Entrega) | **Aprovada** — alinha ADR-012. |
| **D12** | Abrir ADRs 23-27 como rascunhos em git agora (não publicar Notion até L3) | **Aprovada** — caderno de design. |
| **D13** | L1 fecha nos 6 BQ Inserts (refactor cirúrgico simples, sem placeholder) | **Aprovada** — trigger Orquestrador entra em L3. |
| **D14** | Próximo lote pós-L1.5 = L2 Error Handler (antes do Orquestrador) | **Aprovada** — alertas protegem evolução posterior. |
| **D15** | Granularidade ad-level (t28_ad) diferida para L3 | **Aprovada** — default `criativos_json`. |

---

## 8. Sequenciamento de lotes (Saúde Digital)

| Lote | Escopo | Critério done |
|---|---|---|
| **L1** (em curso) | Refactor cirúrgico Agregador: T28 fora do Loop. Termina nos 6 BQ Inserts. | Smoke verde: 12/0/2/1/1/0 rows por execução. |
| **L1.5** | Promoção phi_dev -> phi_prod | t28_* gravando em phi_prod. |
| **L2** | Error Handler global + DDL t28_errors + onError em nodes críticos | 1 erro proposital -> tarefa DB Demandas + Telegram. |
| **L3** | Orquestrador Análises + SUB-WFs (Ad/Adset/Campaign) + DB Análises PHI | 1 execução E2E gera análise multi-nível, escreve Notion. |
| **L3.5** | Entrega: DB Otimizações + Telegram resumo + update properties DBs | Análise cria log + atualiza scores. |
| **L4** | Análise Saúde Cliente + tabelas t28_social_* + ingestão APIs sociais | Cliente recebe PHI Saúde Digital consolidado. |
| **L5** | Reuso prospecção: SUB-WFs Social/GBP recebem `tipo_alvo` | WF prospecção piloto chama sub-WF Social, recebe features compatíveis. |

---

## 9. ADRs derivados (rascunhos em `adr-rascunhos/`)

| ADR | Tópico | Vira Aceito em |
|---|---|---|
| **ADR-23** | Separação Agregador (ETL) vs Orquestrador (Análise) | L3 |
| **ADR-24** | Granularidade T28 + bottom-up rollup (ad/adset/campaign/cliente) | L3 |
| **ADR-25** | Sub-WFs reutilizáveis Social + GBP (contrato cliente↔prospecto) | L4/L5 |
| **ADR-26** | Error Handler global (onError + sub-WF + t28_errors) | L2 |
| **ADR-27** | Entrega de análises (DB Análises PHI + integração DBs existentes) | L3.5 |

---

## 10. Tensões registradas

| # | Tensão | Severidade | Quando resolver |
|---|---|---|---|
| TS1 | Loop legado vs Orquestrador L3 — quando remover o Loop do Agregador | Baixa | L3 (quando Orquestrador assumir iteração) |
| TS2 | Search Terms features zeradas (listas brand/competitor vazias no Notion) | Média | L3+ (preencher Notion ou ler `top_search_terms` da raw) |
| TS3 | Contrato social/GBP cliente↔prospecto — acoplamento entre duas frentes (T28 e Comercial) | Média | L4/L5 (ADR-25 estabiliza interface) |
| TS4 | PMAX sem ad_group -> t28_adset vazio; histórico ad-level via criativos_json pode não bastar | Baixa | L3 (decidir t28_ad ou asset_group) |
| TS5 | source_execution_id depende do Daily Entry gravar execution_id na raw (hoje usa FALLBACK-) | Baixa | Coordenar com A.6 Produto PHI (já no backlog) |
