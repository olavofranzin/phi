# CONTRATO DO PARQUE PHI — documento canônico

| | |
|---|---|
| **Status** | 🟡 **RASCUNHO v0.1** — 2026-09-19. **Não é lei ainda.** Vira lei quando a entrevista do §9 for respondida e o as-built do §4 for lido no artefato |
| **Escopo** | Quem grava o quê em `phi_prod`, nos campos PHI do Notion e no Telegram — da métrica crua até a tarefa no Notion |
| **Não cobre** | **Prospecção** (planilha `leads` + CRM Odoo) — já normatizada pelo `CONTRATO-PROSPECCAO` + ADR-35/36. **Não tocar** |
| **Decisor** | Olavo |
| **Documentos-pai** | `ADR-37` (um destino, um dono) · `ADR-38` (identidade neutra) · `ADR-003` (autoridade do score) · `ADR-010` (writer único) |
| **Base factual** | `panorama-workflows-phi.md` (2026-09-19) · `docs/handoff/2026-09-08-consolidacao-writers-lote1-inventario.md` |
| **Modelo** | `CONTRATO-PROSPECCAO.md` — mesma forma, outra frente |

> **Regra de precedência** (copiada do contrato da Prospecção, porque funcionou):
> divergência entre este contrato e um workflow é **bug do workflow**.
> Divergência entre este contrato e o BigQuery real é **bug do contrato** — corrigir aqui primeiro.

---

## 0. Por que este documento existe

O `CONTRATO-PROSPECCAO` nasceu quando descobrimos que não dava para responder *"quem grava, quem
apaga e quem some com registro"* na planilha `leads`. **No PHI a pergunta é a mesma, e a resposta
hoje também é "não sei".** O que já encontramos, com o sistema em produção:

| Achado | Consequência |
|---|---|
| Duas cadeias escrevem `raw_campaign_data` todo dia | Cada linha mistura duas origens · o rótulo de uma apaga o da outra |
| `client_config` insere em `phi_dev`, o score lê `phi_prod` com `INNER JOIN` | **Cliente novo nunca entra no score** — sem erro, sem alarme |
| `raw_ad_data` vazia desde 30/06, com 2 workflows ativos escrevendo nela | 3 meses de dado que ninguém coletou — e ninguém notou |
| Checagem de unicidade devolvendo 0 itens no caso saudável | **Fase 3 morta 8 dias**, verde todo dia |
| `WHERE campaign_id = 'GADS-' + id` depois do ADR-38 | *"sem histórico"* em campanha com **250 dias** de série |
| 12 workflows ativos sem uma linha de descrição | A auditoria precisa **perguntar ao Olavo** para entender — teste da **R5** reprovado |

**Nenhum desses é um bug difícil. Todos são consequência de não haver dono declarado por destino —
e de não haver consumidor declarado por dado.**

---

## 1. Princípio duplo

> **1. Um destino, um dono.** (herdado do ADR-37)
> Cada tabela do BigQuery e cada campo do Notion tem **um** workflow autorizado a escrevê-lo. Todos
> podem ler; nenhum outro escreve — **nem para "corrigir"**.
>
> **2. Um dado, um consumidor declarado.** (novo, e é a lição de 2026-09-18)
> Todo dado que se escreve tem **alguém nomeado que o lê**. Tabela sem leitor não é ativo: é custo
> de API, tempo de janela e superfície de erro.

O primeiro princípio impede o dado **errado**. O segundo impede o dado **inútil** — e é ele que
`raw_ad_data` quebrou por três meses sem que nada acendesse.

---

## 2. Arquitetura alvo — as 5 camadas

```
 (1) INGESTÃO ──▶ phi_prod.raw_campaign_data · raw_ad_data · client_config
 (2) CÁLCULO  ──▶ phi_score_history ──▶ phi_score_current (view)
 (3) ENTREGA  ──▶ Notion: Campanhas · Tasks · Checklist · Log de Otimizações
 (4) VIGILÂNCIA ▶ Telegram do Olavo
 (5) CONSUMO  ──▶ T28 (análise cognitiva) · execução de demandas · telemetria
```

| # | Camada | Papel — uma frase | Dono hoje |
|---|---|---|---|
| **1** | Ingestão | Traz da plataforma o número cru, sem interpretar. | `sw metricas campanhas` + `operador unico metricas` |
| **2** | Cálculo | Transforma número em **score, classificação e severidade**. Fato, não opinião. | `PHI - Pipeline_v2` |
| **3** | Entrega | Põe o diagnóstico **onde o gestor trabalha**. | `PHI - Pipeline_v2` (Fase 3) + `PHI - Fechar Otimização` |
| **4** | Vigilância | Grita quando a camada 1, 2 ou 3 **não fez o que devia**. | `Vigia de Frescor` + `Alerta de Falha` |
| **5** | Consumo | Lê o score e produz **análise, demanda ou relatório**. | ❓ **indefinido** — é o §9 |

**Tudo o que não ocupar uma destas cinco camadas é arquivado pelo procedimento da R5.**

---

## 3. Invariantes M1–M12 — o que não muda sem ADR

Numerados **M** (de Mídia) para não colidir com os **I1–I11** da Prospecção.

| # | Invariante | Onde já nos mordeu |
|---|---|---|
| **M1** | **Um destino, um dono.** Exceção única: mesmo workflow, em sequência, **colunas disjuntas e declaradas** (padrão S4) | 2 writers em `raw_campaign_data` |
| **M2** | **Identidade neutra.** `campaign_id` = **ID nativo sem prefixo**; a plataforma mora em `platform`. Chave: `(client_id, platform, campaign_id, date)` | ADR-38 · o `'GADS-' + id` que matou a Série Diária |
| **M3** | **`client_id` sempre preenchido.** Linha sem cliente é linha órfã | P-11 do ADR-37 |
| **M4** | 🔴 **Zero nunca é ausência.** `conversions=0 ⇒ CPA/ROAS indefinidos`; `source_status error/missing ⇒ N/D`, **nunca 0**. Query agregada traz junto **a contagem do que casou** | guardrails 8/9 · R11 regra 5 · I3 da Prospecção |
| **M5** | **O score é fato.** Ninguém recalcula `phi_value`, flags ou severidade fora da camada 2 | ADR-003 |
| **M6** | 🔴 **A ordem da Fase 3 é imutável:** Fechamento → Escalada → Abertura | Regra Crítica nº 11 · quase quebrada na Fase 0.2 do ADR-37 |
| **M7** | **`ingestion_step` diz quem tocou por último, não de onde veio.** Não serve de linhagem | S1b do ADR-37 — o BigQuery "parecia ter um writer só" |
| **M8** | **O PHI detecta, classifica e orienta. Nunca executa otimização** | princípio central do produto |
| **M9** | **Um ambiente só: `phi_prod`.** Nenhum workflow de produção escreve ou lê `phi_dev` | `client_config` · `WF-T28-Orquestrador` |
| **M10** | 🔴 **Todo workflow ativo tem saída observável.** Se ninguém sabe dizer o que ele produziu ontem, ele não está no ar — **está ligado** | `raw_ad_data` vazia 3 meses, verde |
| **M11** | **Todo dado escrito tem consumidor declarado** (o princípio 2 do §1) | o grão de anúncio |
| **M12** | **Escrita idempotente.** MERGE por chave, `Always Output Data = true` no nó de INSERT/MERGE. Rodar duas vezes o mesmo dia não duplica | Regra Crítica nº 2 |

> ⚠️ **M10 e M11 são novos.** Saíram da semana de 09 a 18/09 e são a diferença entre este contrato e
> o da Prospecção: lá bastava dizer **quem escreve**; aqui é preciso dizer também **quem lê e como
> se prova que houve produção.**

---

## 4. Matriz de propriedade — ALVO (a confirmar no artefato)

> 🔴 **Nada desta tabela foi lido nos nós.** Cada **❓** é uma leitura que o sub-chat deve fazer
> **pela R13** (`activeVersion.nodes`, não o rascunho) antes de o contrato virar lei.

### 4.1. BigQuery `phi_prod`

| Destino | Dono único (alvo) | Momento | Consumidor declarado | Estado |
|---|---|---|---|---|
| `raw_campaign_data` | `sw metricas campanhas` (`W571K320aqIHsdtH`) | 04:00 BRT | Pipeline_v2 · Agregador T28 | 🔴 **2º writer ativo** — aposentar `PHI - Subworkflow Campanhas` |
| `raw_ad_data` | ❓ `sw metricas anuncios` | 04:00 BRT | ❓ **nenhum conhecido** | 🔴 **0 linhas** — decisão do §9 Q1 |
| `raw_adset_data_rollup` (view) | — (view sobre `raw_ad_data`) | — | ❓ | 🔴 vazia por consequência |
| `client_config` | ❓ **`SI5NSzRb8lVUz74RwOhIT`, corrigido para `phi_prod`** | poll 1h | Pipeline_v2 (`INNER JOIN`) | 🔴 escreve em `phi_dev` · ⚠️ e a correção óbvia quebraria o KIL (S3b) |
| `model_config` | ❓ | ❓ | Pipeline_v2 | ❓ |
| `client_goal_history` | ❓ | ❓ | ❓ | ❓ |
| `phi_score_history` | `PHI - Pipeline_v2` | 07:00 BRT | `phi_score_current` · Notion · T28 | ✅ writer único |
| `phi_score_current` (view) | — | — | ❓ | ✅ |
| `workflow_execution_log` | ❓ | ❓ | ❓ **alguém lê?** | ❓ |
| `t28_campaign` | ❓ Agregador | ❓ | T28 | ⚠️ **3 identidades** (P-28, no corpo do ADR-38) |
| `t28_errors` | `WF-T28-Error-Handler` | onError | ❓ | ⚠️ ativo sem o T28 rodar |

### 4.2. Notion

| Campo / DB | Dono único (alvo) | Momento | Estado |
|---|---|---|---|
| `Score Diário` · `Status` (Campanhas) | `PHI - Pipeline_v2` | 07h | ✅ Regra Crítica nº 9 |
| `Otimização Ativa?` (Campanhas) | **os dois**, em papéis disjuntos | Pipeline 1×/dia **abre** · `Fechar Otimização` 1×/h **fecha** | ✅ padrão S4 (ADR-37 Fase 0.2) — ❓ confirmar que `Fechar` **só fecha** |
| Tasks · Checklist · Log de Otimizações | `PHI - Pipeline_v2` (Fase 3) | 07h | ❓ |
| DB Clientes | **humano** (Olavo) | — | ⚠️ lida por `client_config` **e** por `L1 - Abertura de Projeto` |
| `PHI - ANÁLISES` | `WF-T28-Analise-Campaign` | inativo | 🟡 rascunho |
| `Registro de Execuções (Sub-chats)` | **sub-chats** (R3) | por bloco | lido pelo Digest 08:30 |

### 4.3. Telegram

| Mensagem | Dono | Gatilho |
|---|---|---|
| Falta de dado ontem | `Vigia de Frescor` | 08h |
| Workflow quebrou | `Alerta de Falha` | onError |
| Progresso do projeto | `Digest Diário` | 08:30 |
| Falha da rodada de métricas | `operador unico metricas` | 04h |
| ❓ **"o que devia acontecer não aconteceu"** | 🔴 **ninguém** | — |

---

## 5. As armadilhas desta frente (já custaram caro)

1. 🔴 **Verde não é produção.** Execução bem-sucedida que escreve zero linhas é o modo de falha desta
   casa. Antes de chamar um workflow de saudável, **conte os itens que chegaram ao nó de escrita**.
2. 🔴 **O rascunho mente.** `nodes` é o rascunho; o que roda é `activeVersion.nodes`. `triggerCount`
   conta gatilhos **ativos**. *"Não deu erro"* não é *"está no ar"* (**R13**).
3. 🔴 **Salvaguarda é código novo em produção.** A checagem de unicidade instalada para proteger o
   score **matou a Fase 3 por 8 dias**. O teste que falta nunca é *"ela pega o defeito?"* — é **"o
   que acontece no dia em que ela não pega nada?"**, que é todo dia.
4. **`phi_dev` está em produção sem ninguém ter decidido isso.** Dois workflows o usam. Não existe
   nota dizendo por quê.
5. **Dois scores no projeto.** Aqui é `phi_value` (campanha). `potencial_comercial` é lead, outra
   frente, outro ADR.
6. **Configuração mudada para teste não volta sozinha** (**R12**) — e nó desabilitado no n8n **não
   tem cor, não tem alarme e não aparece em lista nenhuma**.

---

## 6. Decisões pendentes (D1…)

| # | Decisão | Quem decide | Estado |
|---|---|---|---|
| **D1** | O grão de **anúncio/conjunto** faz parte do produto, ou foi aposta de junho? | Olavo | ⬜ §9 Q1 |
| **D2** | `phi_dev` some, ou vira ambiente declarado com regra de promoção? | Olavo | ⬜ §9 Q6 |
| **D3** | Quem é o dono de `client_config` — e como corrigir sem quebrar o KIL (S3b)? | sub-chat propõe, Olavo decide | ⬜ |
| **D4** | A camada 5 (T28, EXEC, telemetria) entra no contrato ou vira frente separada? | Olavo | ⬜ §9 Q9 |
| **D5** | Quem observa *"o que devia acontecer, aconteceu"*? Workflow novo ou extensão do Vigia? | Olavo (é construção — R7) | ⬜ |
| **D6** | Onboarding é parque PHI ou operação da agência (`docs/operacao/`)? | Olavo | ⬜ §9 Q10 |

---

## 7. Como este contrato se mantém vivo

Copiado do que funcionou na Prospecção, e do que falhou:

1. **Toda mudança de dono passa por ADR** — não por edição direta aqui.
2. **O as-built vence o plano** (R2). Quando o artefato divergir, corrige-se o contrato **e registra-se
   a divergência**, nunca se apaga.
3. **Hipótese desmentida também se escreve** (R6, corolário) — senão a próxima auditoria levanta o
   mesmo alarme.
4. 🔴 **O cabeçalho é o que se lê** (R2 item 5). Marcar estado **na tabela do topo**, não só no corpo.
   O ADR-38 ficou 9 dias "não executado" no cabeçalho depois de executado.

---

## 8. O que este contrato NÃO decide

- **Não decide a fórmula do score** — é o ADR-34 (Score v2).
- **Não decide o que o T28 analisa** — é o ADR-28 e o `modulo-28-analise-cognitiva.md`.
- **Não decide preço, oferta ou posicionamento** — é outra conversa, outro documento.
- **Não decide nada da Prospecção.** Aquela frente tem contrato próprio, e ele é lei lá.

---

## 9. A entrevista que falta

Este contrato tem **~25 células marcadas ❓**. Elas não se resolvem lendo mais código: metade é
**as-built** (o sub-chat lê e responde) e metade é **decisão de negócio** (só o Olavo responde).

👉 **As duas listas completas estão em
`docs/handoff/2026-09-19-parque-phi-contrato-e-entrevista-subchat-brief.md`.**

> **A ordem importa, e é a R9:** entrevista **antes** do contrato virar lei. Na Prospecção a
> entrevista chegou depois de três dias de construção, e **quatro das nove perguntas já tinham sido
> respondidas por incidente**. *Entrevista atrasada não é entrevista — é autópsia.*
