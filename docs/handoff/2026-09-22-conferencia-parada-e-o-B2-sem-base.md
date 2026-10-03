# Conferência da PARADA (ADR-39+40) — as três passaram, e o passo B2 perdeu a base

| | |
|---|---|
| **Data** | 2026-09-22, 13h–15h BRT (dentro da janela 09h–23h) |
| **Veredito das 3 conferências** | ✅ **as três passaram**, com dado lido no BigQuery — não com status verde |
| 🔴 **Mas a Fase B NÃO começou** | o **passo B2** — *"cadastrar o CHA e vê-lo chegar ao score"*, que o brief chama de **"o ponto do ADR-39 inteiro"** — **perdeu a base**. Ver §3 |
| **Decisão** | **R6**: o plano está aceito, mas o dado que o justificava mudou. Parei, não executei, e registrei o porquê |
| **Base factual** | workflow temporário `pjcoVBzj52aUgFaS` (5 leituras, execução **41953**), já arquivado · DB Campanhas do Notion · nó `Get many database Campanhas` na `activeVersion` `752e5300` |

---

## 1. As três conferências da parada obrigatória

| # | Conferir | Resultado | Prova |
|---|---|---|---|
| **1** | Nenhuma linha nova de `raw_campaign_data` com o tipo vazio | ✅ | a única linha de **21/09** veio com `CPA` |
| **2** | Score do KIL continua `CPA` | ✅ | as **duas** campanhas, no `raw` e no `score`: `CPA`, metas 3,50 e 5,20, `SUCCESS`, phi 51,81 e 56,14 |
| **3** | `phi_score_history` do dia tem o tipo preenchido | ✅ | 2 linhas de 21/09, tipo `CPA` — **a régua congelada existe pela primeira vez** |

**CA5:** `phi_score_history` = 260 linhas, **0 nulos**. `raw_campaign_data` = 501 linhas, **12 nulos, 1 cliente só** (o CHA), exatamente a previsão de ontem.

## 2. ⚠️ As três passaram — mas só metade da mudança foi exercida

O `sw metricas campanhas` **falhou nas duas rodadas de hoje** (00h e 04h BRT), no nó `HTTP Request Meta Ads`:

> *"Error validating access token: Session has expired on Monday, 21-Sep-26 06:10:06 PDT."*

**Não é consequência da alteração de 21/09** — o token expirou horas antes da publicação. Mas o loop morre **no primeiro item**, e o primeiro item era Meta: os nós que rodaram foram só até o `If Plataforma`; o `Code Montar SQL` **nunca foi alcançado**, e **nem o Google foi coletado**. Não existe nenhuma linha `DAILY_ENTRY` de 21/09.

**Consequência honesta:** as três conferências passaram **por causa do outro writer** (`PHI - Subworkflow Campanhas`, `GADS_INSERT`). O writer canônico não foi exercido nem uma vez — **até a execução manual do §2-bis, que fechou esse buraco.**

> 🔴 **Achado lateral, fora do escopo, e que merece frente própria:** uma credencial expirada de **um** cliente derruba a coleta de **todos**. O problema não é o token — é o loop parar no primeiro item.

## 2-bis. ✅ A metade que faltava foi exercida — com autorização do Olavo

Com o CHA fora do filtro, rodei o **`sw metricas campanhas` na mão** (execução **41967**, 22/09 14h36 BRT,
`activeVersion` reconfirmada em `752e5300`). **Rodou inteiro, `success`**, processando só as duas campanhas
do Google.

**A prova direta, lida na saída do nó `Code Montar SQL`** (as duas execuções do loop):

```sql
    CAST(5.2 AS FLOAT64) AS primary_metric_goal,
    'CPA' AS primary_metric_type,        -- campanha 21149189736
...
    CAST(3.5 AS FLOAT64) AS primary_metric_goal,
    'CPA' AS primary_metric_type,        -- campanha 21116045403
```

O `Execute SQL inserir daily entry` rodou **2×, ambas `success`**, e o `Loop Over Items` terminou
(`noItemsLeft: true`). **O writer canônico grava o tipo, e o tipo vem da Métrica-Mãe da campanha, não de
mapa fixo.** O passo **A3b está provado com dado**, não só com leitura de código.

E a coleta de 21/09, que não existia, foi recuperada: as linhas de D-1 têm `ingested_at` **2026-09-22
17:37:02** e **17:37:15 UTC** — dentro da janela da execução 41967 (17:36:45 → 17:37:17).

### 🔴 Achado que só esta execução revelou: o `ingestion_step` mente

As linhas de 21/09, **depois** de o `sw metricas campanhas` reescrevê-las, continuam carimbadas
`ingestion_step = 'GADS_INSERT'`.

**Causa:** o `WHEN MATCHED THEN UPDATE SET` do MERGE atualiza `cost`, `conversions`, `primary_metric_type`,
`ingested_at` e mais — **mas não atualiza `ingestion_step`.** A linha já existia (escrita às 07h pelo
`PHI - Subworkflow Campanhas`), então o carimbo ficou com o **primeiro** e os números com o **último**.

**Por que importa:** o desempate do SQL do score é exatamente
`ORDER BY CASE WHEN ingestion_step = 'DAILY_ENTRY' THEN 0 ELSE 1 END`. **Ele decide quem ganha olhando um
campo que não acompanha quem escreveu.** É o 🔴 do §4.1 do contrato (*"um sobrescreve os números do outro em
silêncio"*) uma camada mais fundo: não é só que um sobrescreve — **é que o registro de quem sobrescreveu
não existe.**

**Não consertei.** É pré-existente, está fora do escopo do ADR-39+40, e some sozinho quando a **Fase 2 do
ADR-37** aposentar o segundo writer. Fica registrado para não se descobrir de novo.

## 3. 🔴 Por que o passo B2 perdeu a base

Leitura da DB Campanhas (Notion) em 22/09:

| Campanha | Cliente | Status | Métrica-Mãe |
|---|---|---|---|
| `[CHA] IG_MENS__PROD.TESTE__` | **CLI-13** | 🔴 **Concluído — conclusão 2026-09-22** | **CPL** |
| `[KIL] GG_…_PMAX_BARBEARIA` | CLI-4 | Em execução | CPA |
| `[KIL] GG_…_PMAX_SALÃO.BELEZA` | CLI-4 | Em execução | CPA |

E o filtro do nó `Get many database Campanhas` (lido na `activeVersion` `752e5300`) exige **`Status = "Em execução"`**.

**Duas coisas saem daí, e as duas derrubam o B2:**

### 3.1. O CHA não tem mais campanha em execução
A única campanha dele foi encerrada **hoje**. Um cliente sem campanha em execução **não tem o que chegar ao score** — o **CA3**, o critério ⭐, não pode ser provado com ele.

### 3.2. E mesmo que tivesse, o score não saberia calculá-lo
A Métrica-Mãe do CHA é **CPL**. A porta de qualidade do score, lida no nó publicado hoje:

```sql
WHEN primary_metric_type IS NULL OR primary_metric_type != 'CPA'
  THEN 'INSUFFICIENT_DATA'          -- e 'METRIC_TYPE_UNSUPPORTED'
```

**O motor só sabe calcular CPA.** O CHA apareceria em `Buscar Clientes Ativos` — o CA3 **"passaria"** — e o `phi_value` sairia `NULL`. É a **R11** literal: o critério verde escondendo que nada foi calculado.

> **Isto não foi causado pelo ADR-40 — foi tornado visível por ele.** Com a métrica morando no cliente, por mapa fixo `'ROAS'`, ninguém via. Agora que ela viaja com a campanha, dá para ver que **o parque tem duas réguas e o motor entende uma.**
>
> **Pergunta que é do Olavo, não minha:** o parque vai ter cliente com métrica diferente de CPA? Se sim, é ADR próprio — e provavelmente maior que o 39 e o 40 juntos.

## 4. Sobre o token do Meta: **não precisa renovar**

A única campanha Meta do parque é a do CHA, e ela saiu do filtro ao virar `Concluído`. A partir da próxima rodada o `sw metricas campanhas` processa só as duas do Google.

*Estimativa, não fato:* o status mudou **depois das 04h BRT**, o que explica as duas falhas de hoje. Não tenho como confirmar a hora da edição.

## 5. Hipótese minha que o dado desmentiu (a segunda em dois dias)

| Eu afirmei em 21/09 | O dado mostrou |
|---|---|
| *"14 nós BigQuery têm `{{ }}` sem o prefixo `=`; se o n8n tratar como texto literal, o `execution_id` gravado é a string do template"* | ❌ **Alarme falso.** O `execution_id` de 22/09 é `EXEC-PHI-20260922100052-3ab52120` — **um ID real**. O nó BigQuery do n8n resolve a expressão mesmo sem o `=`. **Fica registrado para ninguém levantar de novo.** |

## 6. Estado da Fase B

| Passo | Estado |
|---|---|
| **B1** repontar o `MERGE` para `phi_prod` | ⬜ não começou |
| **B2** provar o `INSERT` com o CHA | 🔴 **sem base** — §3 |
| **B3** remover o `UPDATE` do Subworkflow | ⬜ não começou |
| **B4** tirar a coluna do `client_config` + o `COALESCE` | ⬜ não começou — **prazo do sticky: 22/09/2026, vence hoje** |
| **B5** apagar `phi_dev` | ⬜ não começou |

**Nada da Fase B foi executado.** Nenhuma remoção aconteceu.

## 7. R12 — o que foi criado para esta conferência

| O que | Estado |
|---|---|
| `TMP - Conferencia PARADA Fase A` (`pjcoVBzj52aUgFaS`) | ✅ **arquivado** — provado lendo |
| `TMP - Prova A3b writer canonico` (`OvtKnGyC0fBGGu0z`) | ✅ **arquivado** — provado lendo |

**Nenhuma configuração foi mudada para teste.** A execução manual do `sw metricas campanhas` usou a versão
publicada, sem alterar nada; nenhum nó ficou desabilitado.

---

*Relatório da conferência — sub-chat do parque PHI, 2026-09-22.*
