# [BRIEF sub-chat] ADR-39 + ADR-40 — o cadastro entra, e a métrica vai para a campanha

> **Como usar:** este brief **substitui** o `2026-09-21-adr39-client-config-subchat-brief.md`.
> Continue no **mesmo sub-chat** que fez as verificações — o contexto dele vale.
> **Branch:** `claude/consolidacao-2026-08` · **Idioma com o Olavo:** português simples.
> ✅ **ADR-39 aceito 20/09 · ADR-40 aceito 21/09.** Isto é execução.

---

## 0. Por que os dois viraram um

Os dois mexem na **mesma coluna**. Separados, o passo 4.1 do ADR-39 seria feito e desfeito semanas
depois.

> 🔴 **O passo 4.1 do ADR-39 está REVOGADO.** A decisão de 20/09 (*"manter mesmo sendo descartável"*)
> valia enquanto os ADRs rodariam separados. **Fundidos, o motivo dela deixou de existir** — não
> corrija a derivação de um campo que sai na mesma sessão.

**O que cada um entrega:**

| ADR | Entrega | Critério |
|---|---|---|
| **39** | **cliente novo chega ao score** — hoje o cadastro morre no `phi_dev` | **F1** |
| **40** | a Métrica-Mãe **viaja com a campanha**, e o score guarda **contra o que julgou** | base do **F4** |

## 1. Leia antes

`ADR-40-metrica-mae-viaja-com-a-campanha.md` (**§5.1 são as suas próprias verificações**, §6 os 3
requisitos, **§6.1 o refinamento do REQ-1 — leia com atenção, discordei de você ali**) ·
`ADR-39-dono-unico-client-config.md` · `CONTRATO-PHI.md` §3 (M1–M12) · `CLAUDE.md` da raiz.

## 2. 🔴 Antes de tocar em qualquer coisa

Suas verificações foram feitas sobre **dumps de 20/09**, com o n8n fora do ar.

**Passo zero: reconfirme que os `versionId` que você citou continuam sendo os publicados** (**R13**).
Se algum mudou, **pare e reporte** — não siga com leitura velha.

⏰ **Janela: 09h–23h** (D9). Fora disso, só com o Olavo avisado.

---

## 3. FASE A — aditiva. Nada é removido.

**Se parar aqui, o sistema funciona exatamente como hoje, com dado a mais.** É o ponto de parada
seguro, e existe de propósito.

| # | Passo | Cuidado |
|---|---|---|
| **A1** | `ADD COLUMN primary_metric_type` em **`raw_campaign_data`** e em **`phi_score_history`** | duas tabelas, dois DDL |
| **A2** | 🔴 **Backfill** das duas, a partir do `client_config` atual | **`ADD COLUMN` nasce `NULL`, e a porta de qualidade reprova `NULL` como `INSUFFICIENT_DATA`.** Sem isto, recalcular qualquer dia passado **derruba a série inteira** |
| **A3** | Os **dois writers de `raw_campaign_data`** passam a gravar o tipo | é `clean_metrica_mae`, ao lado de `clean_meta_metrica_mae` que já é gravada — **a mesma expressão, trocando o nome do campo** |
| **A4** | **REQ-1:** o `\|\| 'ROAS'` do `PHI - Subworkflow Campanhas` vira **`\|\| null`** | ⚠️ **não é erro alto — leia o §6.1 do ADR-40.** Erro alto derruba a coleta do lote por causa de uma campanha; vazio isola a campanha e a porta de qualidade a reprova, **que é a verdade** |
| **A5** | O SQL do score passa a ler o tipo **da campanha**, com `COALESCE(raw…, cc…)` de transição | **REQ-3: a data de remoção do `COALESCE` vai escrita num sticky, hoje.** Sem data é R12 |
| **A6** | `phi_score_history` grava o tipo **junto com o score** | é a **régua congelada** — o que permite saber contra o que um score de julho foi julgado. **Isso não existe hoje** |

### ⏸️ PARADA OBRIGATÓRIA

**Rode um dia inteiro antes da Fase B.** Confira na manhã seguinte:
- nenhuma linha nova de `raw_campaign_data` com o tipo vazio (fora campanha sem Métrica-Mãe);
- o score do KIL continua **`CPA`**;
- o `phi_score_history` do dia tem o tipo preenchido.

**Se qualquer um falhar, a Fase B não começa.**

---

## 4. FASE B — subtrativa. Aqui as coisas somem.

| # | Passo | Cuidado |
|---|---|---|
| **B1** | Repontar o `MERGE` do workflow `client_config` de `phi_dev` para **`phi_prod`** | use `dataset.table` entre backticks **sem project ID** (Regra Crítica nº 1) — o SQL atual usa project ID, corrija junto |
| **B2** | ⭐ **Provar o `INSERT`: cadastrar o CHA no Notion e vê-lo chegar ao score** | **é o F1, e é o ponto do ADR-39 inteiro.** Confirme que ele **aparece** em `Buscar Clientes Ativos` — não que "não deu erro" |
| **B3** | Remover o `UPDATE` de `client_config` do `PHI - Subworkflow Campanhas` | agora **sem função** — o tipo já viaja com a campanha |
| **B4** | Remover `primary_metric_type` de `client_config` **e tirar o `COALESCE`** do A5 | os dois no mesmo passo, senão o `COALESCE` sobrevive ao motivo |
| **B5** | Apagar `phi_dev.client_config` e varrer os workflows por `phi_dev` | ⚠️ o **`WF-T28-Orquestrador`** também lê `phi_dev` — **reporte, não conserte** |

---

## 5. Critérios de aceite (R9 — escritos antes)

| # | Critério | Como se prova |
|---|---|---|
| **CA1** | `phi_prod.client_config` tem **um** writer | ler os nós dos dois workflows |
| **CA2** | O KIL continua **`CPA`** — agora vindo da campanha | consultar depois do B4, não antes |
| **CA3** | ⭐ **O CHA chega ao score** | ele volta de `Buscar Clientes Ativos` |
| **CA4** | A Métrica-Mãe do Notion **vence** | trocar a métrica de uma campanha no Notion e ver a coluna mudar no dia seguinte |
| **CA5** | Nenhuma linha com tipo `NULL` depois do backfill | contar |
| **CA6** | O fallback **não inventa mais** | forçar um item sem Métrica-Mãe no Subworkflow e ver vazio, **não `'ROAS'`** |
| **CA7** | `phi_score_history` guarda a régua | consultar o score de hoje |
| **CA8** | O `COALESCE` **saiu**, e a data estava escrita antes | ler o SQL e o sticky |
| **CA9** | `phi_dev` não é escrito nem lido | varredura |
| **CA10** | Nada rodou fora de **09h–23h** | — |

**Limite de 3 voltas** (R9): na terceira, o problema é o plano.

## 6. ⛔ Fora do escopo

Não aposente o `PHI - Subworkflow Campanhas` (é a Fase 2 do ADR-37 — **este trabalho a destrava, não
a executa**) · não conserte o `WF-T28-Orquestrador` · não toque no score 3× (é o **F2**), no grão de
anúncio (**F4**) nem na Prospecção · **não construa nada novo** (R7).

## 7. As armadilhas

1. **Leia o que está NO AR** — `activeVersion.nodes`. Compare `versionId` com `activeVersionId` antes
   **e depois** de publicar (R13). `settings` e descrição valem sem publicar (R13 item 4).
2. 🔴 **O `NULL` é o risco deste trabalho, e não está no código.** O A2 é o passo que mais pode doer,
   e o dano só apareceria semanas depois, ao recalcular o passado.
3. **Zero nunca é ausência** (M4). O `'ROAS'` inventado é o exemplo vivo: **não é um valor, é um
   chute com cara de dado.**
4. **A coluna chega à tela do Olavo** — `Métrica Afetada` na Tarefa e no Log de Otimizações (sua V3).
   Se ela mentir, **a tarefa que ele abre mente**, e isso está sob a D10.
5. **R12:** o que mudar para testar, volte na mesma sessão, e prove **lendo**.

## 8. Registro (R3) e o que devolver

Linha na DB Notion **"PHI — Registro de Execuções (Sub-chats)"** ao começar e ao encerrar.

Devolva: os **10 critérios** com prova · os **cabeçalhos** dos dois ADRs com a data efetiva **na
tabela do topo** (R2 item 5) · o **§4.1 do `CONTRATO-PHI.md`** com o dono novo · **hipóteses que o
dado desmentiu** · **achados laterais** · **commit na mesma sessão**.

## 9. Uma nota sobre a V7

O seu REQ-1 gerou uma conferência nova no **plano do F3** (o vigia): *"quantas campanhas ficaram sem
`primary_metric_type` ontem?"*. **Você não precisa construí-la** — só saber que o vazio que você vai
introduzir **já tem quem o conte**, e por isso pode ser vazio em vez de erro.
