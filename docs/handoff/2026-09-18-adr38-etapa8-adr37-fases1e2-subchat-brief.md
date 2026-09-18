# [PLANO] Etapa 8 do ADR-38 = **critério C2** — Fases 1 e 2 do ADR-37

| | |
|---|---|
| **Data** | 2026-09-18 |
| **Frente** | PHI·Mídia Score — consolidação de writers |
| **Fecha** | **C2** da `DEFINICAO-DE-PRONTO-PHI-V1` · **etapa 8** do ADR-38 · Fases 1 e 2 do ADR-37 |
| **Destrava** | **C1** (Score v2 / ADR-34) |
| **Branch** | `claude/consolidacao-2026-08` |
| **Estado** | ⬜ **plano — aguardando OK do Olavo (R7)** |

---

## 0. 🔴 Leia isto antes de qualquer coisa: o que a Fase 0.2 ensinou

**Em 2026-09-08 a Fase 0.2 do ADR-37 foi cancelada na hora de executar.** O inventário tinha visto
*"dois workflows escrevem o campo `Otimização Ativa?`"* e chamado de conflito. A leitura do fluxo,
feita **antes** de desabilitar qualquer nó, mostrou **três transições distintas**:

| Transição | Dono | Exclusivo? |
|---|---|---|
| **Abrir** (marca `true`) | `Pipeline_v2` | ✅ só ele |
| **Fechar por tarefa concluída** | os dois | ❌ sobreposto, mas inofensivo |
| **Limpar órfã** | `Pipeline_v2`, branch FALSE | ✅ só ele |

Executar como estava escrito teria **parado toda abertura de otimização** — quebrando a Fase 3, cuja
ordem é imutável pela Regra Crítica nº 11. **Nada foi desabilitado.** É a origem da **R6** e do
invariante corrigido: **a `I1` vale para transições de estado, não para nomes de campo.**

### Por que isso é exatamente o risco DESTE plano

As Fases 1 e 2 do ADR-37 foram escritas em **08/09** — **antes do ADR-38**, a partir do mesmo
inventário que produziu a Fase 0.2. E o próprio ADR-37, na §3.0.3, **já inverteu o `D1` uma vez**:
o ADR mandava aposentar o `GADS_INSERT`, e o dado mostrou que era justamente ele que alimentava o
score.

> **Regra deste plano: nenhuma fase começa executando. Cada uma começa lendo o que está no ar e
> comparando com o que o ADR-37 supôs.** Onde divergir, o dado vence e o ADR é corrigido primeiro.
> A premissa "dois writers no mesmo destino = um sobra" é precisamente a que já errou duas vezes.

---

## 1. Por que isto é o C2, e não só o fim do ADR-38

| Critério | Antes | Agora |
|---|---|---|
| **C2** — *um dado, um writer* | 🔴 bloqueado: *"decidir P-10 antes de consolidar"* | 🟡 **desbloqueado 18/09** — o **ADR-38 fechou o P-10** e unificou a identidade |
| **C1** — Score v2 em produção | 🟡 bloqueado por C2 | 🟡 caminho aberto — a série limpa que ele exige **já está carregada** |

**A dependência é real, não burocrática.** O Score v2 é validado comparando score contra
métrica-mãe sobre a série diária. Enquanto dois writers pudessem produzir linhas concorrentes, essa
comparação não era confiável. Com a identidade unificada eles colidem no `MERGE` — mas **"colidem"
ainda não é "um dono"**: hoje um cria a linha e o outro sobrescreve parte dela. **O C2 só fecha
quando cada coluna tiver um dono declarado.**

Por isso a etapa 8 não é encerramento de ADR: **é o penúltimo degrau do produto.**

---

## 2. 🔴 Fase 0 — o P-24 vem primeiro, e é mais grave do que parecia

A suspeita do Olavo estava certa: o `phi_ultima_execucao` parou em **10/09**, **o mesmo dia da
alteração dos writers pelo ADR-38**. Conferi em 18/09 e o problema **não é o carimbo**.

| Onde | O que diz |
|---|---|
| **BigQuery** `phi_score_history`, Salão, 17/09 | **`phi_value = 44,59`** |
| **Notion**, página do Salão, hoje | **`Score Diário = 68,7`** · `Status Geral = GOOD` |
| **Notion** `phi_ultima_execucao` | **10/09** |

**`68,7` não corresponde a nenhum dos últimos 10 dias** do Salão (50,76 · 65,1 · 57,51 · 53,41 ·
44,47 · **25,54** · 38,86 · 43,48 · 48,36 · 44,59). É um valor anterior a 08/09.

**O score está sendo calculado todo dia e não está chegando ao Notion.** O Notion é a *interface
operacional* — é onde o gestor olha. Ele está vendo **GOOD / 68,7** numa campanha que está em
**44,59**, e **não viu a queda para 25,54 em 13/09**.

> Isto é a **R11** em estado puro: o pipeline roda verde, o score é gravado, e a entrega ao humano
> parou — sem erro, sem alerta. O vigia não pega, porque ele confere `raw_campaign_data` e
> `phi_score_history`, e as duas estão certas.

**Pista adicional:** a página foi editada hoje às **07:00 UTC (04h BRT)** — a janela do
`sw metricas campanhas` — e **não** às 10:00 UTC, a janela do `Pipeline_v2`. Ou seja: alguém ainda
escreve nela; quem parou foi o ramo do score.

### Hipótese principal — e é hipótese, não fato

O ramo do `Pipeline_v2` que escreve no Notion provavelmente **procura a página por `campaign_id`
com o prefixo `GADS-`**. Com a identidade nova (`21116045403`, sem prefixo), a busca não acha mais
nada e o ramo não escreve. Seria efeito colateral direto da etapa 2 do ADR-38 — **da minha própria
alteração.**

**Não confirmei.** Confirmar exige ler o nó dentro do `Pipeline_v2` (61 nós), e isso é a primeira
tarefa da execução.

### O que a Fase 0 entrega

| # | Ação |
|---|---|
| 0.1 | Ler no `Pipeline_v2` **o que está no ar** (R13) o ramo que escreve `Score Diário`, `phi_score` e `phi_ultima_execucao` no Notion; achar o casamento que quebrou |
| 0.2 | Corrigir, publicar e **confirmar que publicou** (R13) |
| 0.3 | Reprocessar o Notion das 2 campanhas KIL para o valor corrente |
| 0.4 | **Registrar no ADR-38** como consequência tardia da etapa 2 — a §14/§15 não previram este writer |
| 0.5 | Decidir se o vigia passa a conferir **entrega no Notion**, não só gravação no BigQuery |

> **A 0.5 é a lição que não pode passar batido.** O vigia foi desenhado para achar dado que não
> chegou ao BigQuery. Este defeito mostra que existe **um trecho depois do BigQuery** que ninguém
> vigia — e é justamente o trecho que o gestor enxerga.

**A Fase 0 não depende de nenhuma decisão do Olavo além do OK deste plano.** É correção de defeito
em produção, não consolidação.

---

## 3. R7 — o que procurei antes de propor construir

| Pergunta | Resposta |
|---|---|
| **Existe skill que faz isso?** | Não. As instaladas de n8n (`n8n-api-workflow-review`, `n8n-workflow-patterns`, `n8n-node-configuration`, `n8n-validation-expert`) são de **método**, e serão usadas. `phi-diagnostico` é do T28, outra frente. |
| **Existe workflow que já faz?** | Não. Busquei por "score" no n8n: os únicos candidatos são o próprio `Pipeline_v2`, o `PHI - Fase 2 Cálculo Score` (**inativo desde março/2026**) e o `WF-T28-Orquestrador-Analises` (rascunho, outra frente). **Nenhum outro workflow escreve score no Notion** — o ramo vive dentro do `Pipeline_v2`. |
| **Existe coluna que já guarda?** | Sim, e é o ponto: `raw_campaign_data` já tem todas as colunas. O trabalho **não é criar campo, é declarar dono**. |

**Registrado para a próxima sessão não procurar de novo.**

---

## 4. Fase A — reler os dois writers e montar a tabela de dono por coluna

**Nenhuma linha de código antes disto.** É a Fase 0.2 aplicada: ler o fluxo, não o inventário.

| # | Ação |
|---|---|
| A.1 | Ler `activeVersion` dos dois writers e listar, **coluna por coluna**, o que cada um escreve no `INSERT` e o que escreve no `UPDATE SET` |
| A.2 | Cruzar com o dado: para cada coluna, qual writer produziu o valor que está lá hoje |
| A.3 | Produzir a **tabela de propriedade real** e compará-la com a matriz do §2.2 do ADR-37 |
| A.4 | Onde divergir: **corrigir o ADR-37 antes de executar** (R6) |

**O que já sei e a Fase A tem de confirmar:** desde o corte há **463 `BACKFILL_2026-09` + 27
`DAILY_ENTRY` e zero `GADS_INSERT`**. Como o writer das 07h só carimba `GADS_INSERT` no `INSERT`,
a ausência prova que **ele está atualizando a linha criada às 00h**. Os dois colidem — que é o que
se queria. **Mas isso não diz quais colunas ele sobrescreve**, e é isso que decide a Fase C.

---

## 5. Fase B — a Fase 1 do ADR-37, revisada pelo que o ADR-38 já fez

**Metade da Fase 1 já está feita.** Executá-la como escrita seria refazer trabalho e mexer em
produção sem motivo:

| # | Fase 1 do ADR-37 (escrita em 08/09) | Estado real em 18/09 |
|---|---|---|
| 1.1 | Adicionar `revenue` ao `sw metricas campanhas` | ⬜ **pendente** — e é o **bloqueio da Fase C** (ver abaixo) |
| 1.2 | `conversions` → `FLOAT64`, tirar o `Math.round` | ✅ **feito pelo ADR-38** (D3 nos dois writers) |
| 1.3 | Migrar o tipo da coluna | ✅ **feito** — `ALTER` direto em `phi_prod`; só `conversions` era `INT64` |
| 1.4 | Re-puxe de D-1..D-3 (**D4**) | ⬜ **pendente** — e está amarrado à **P-20** |
| 1.5 | Smoke contra o export oficial | ✅ **feito** — foi o próprio rebuild (§13), e **o subcount do Salão ficou explicado** |

**Sobram 1.1 e 1.4.** Esse encolhimento é o retorno de ter lido antes de executar.

### B.1 — `revenue` no writer das 00h/04h

O dado de hoje: `revenue` está **NULL em 472 linhas** (01/01 a 17/09) e **preenchido em 18**
(09/09 a 17/09) — 2 campanhas × 9 dias. Bate com o aviso do ADR-37: **só o `GADS_INSERT` escreve
`revenue`**. A Fase A confirma isso lendo o nó.

**Enquanto o writer das 00h não escrever `revenue`, aposentar o das 07h apaga a receita.**

### B.2 — o re-puxe de 3 dias e a decisão P-20

O `sw metricas campanhas` roda **duas vezes por dia** (gatilho próprio às 00h + orquestrador às
04h). A **P-20** está aberta desde 10/09. O D4 pede re-puxar D-1..D-3 por causa do atraso de
atribuição. **São a mesma pergunta**, e a resposta natural é juntar as duas:

| Opção | O que é |
|---|---|
| **(a) recomendada** | A rodada das 00h vira o **re-puxe de D-1..D-3** (D4); a das 04h segue como a rodada do dia |
| (b) | Desativar a das 00h e pôr o re-puxe na das 04h |
| (c) | Manter as duas como estão e não implementar o D4 |

> ⚠️ **Não decidir agora.** A opção (a) parece a certa, mas depende da Fase A mostrar se as duas
> rodadas escrevem as mesmas colunas. **Decisão do Olavo depois da Fase A.**

---

## 6. Fase C — aposentar o segundo writer (a parte irreversível)

**Esta é a fase que o histórico manda tratar com desconfiança.** O `D1` já foi invertido uma vez.

**Pré-condições, todas obrigatórias:**

1. Fase A concluída, com a tabela de dono por coluna **conferida contra o dado**;
2. **B.1 entregue** — `revenue` saindo do writer que fica;
3. nenhuma coluna órfã na tabela da Fase A;
4. o nó `Execute SQL client_config sincronizado` **preservado** — ele é da Fase 3, que tem ordem
   própria e imutável (3.1 antes de 3.2, senão o CPA do KIL vira ROAS e o score quebra em silêncio).

**Procedimento — o §2.5 do ADR-37, os 5 passos, sem pular nenhum:**
consolidar no que fica → **desabilitar o nó chamador** (`Call Subworkflow Campanhas` no
`Pipeline_v2`) → desativar o workflow → **renomear com `[APOSENTADO 2026-XX-XX]`** → sticky dizendo
por que e proibindo reuso.

> ⚠️ **R12:** se algo for desabilitado para teste, a nota diz quando religar, e a sessão não fecha
> sem reler o artefato confirmando que voltou.

---

## 7. Critérios de aceite — escritos ANTES (R9)

| # | Critério | Como se mede |
|---|---|---|
| CA1 | O `Score Diário` do Notion bate com o `phi_value` do BigQuery nas 2 campanhas KIL | comparar os dois no mesmo dia |
| CA2 | `phi_ultima_execucao` avança sozinho no dia seguinte | ler a página em D+1 |
| CA3 | Toda coluna de `raw_campaign_data` tem **exatamente um** dono declarado | tabela da Fase A, revisada |
| CA4 | `revenue` continua preenchido **depois** de aposentar o segundo writer | 2 dias seguidos sem `NULL` novo |
| CA5 | Uma linha por `(client_id, platform, campaign_id, date)` | a query do §7 do ADR-38, zero duplicata |
| CA6 | A checagem de unicidade da P-19 segue verde | `Pipeline_v2` com `success` |
| CA7 | O vigia roda em silêncio em D+1 e D+2 | sem Telegram |
| CA8 | Nenhum workflow ativo com `versionId != activeVersionId` ao fim (R13) | releitura dos 4 |
| CA9 | ADR-37 e ADR-38 atualizados **e o cabeçalho de cada um marcado** (R2, lição da §20.1) | leitura do topo |

**Limite de 3 voltas (R9).** Na terceira reprovação, o problema é o plano.

---

## 8. Ordem e ponto de parada

```
Fase 0 (P-24)  →  Fase A (ler)  →  [DECISÃO do Olavo: P-20/D4 e confirmação do D1]
                                    →  Fase B (1.1 + 1.4)  →  Fase C (aposentar)
```

**Pare depois da Fase A** e traga a tabela de dono por coluna. A Fase C é irreversível e **não deve
começar sem o Olavo reconfirmar o `D1` com a tabela na mão** — não com o que o ADR-37 supôs em 08/09.

---

## 9. Fora de escopo

- **O dia 2026-07-05 sem linha** no CLI-4. Fica **registrado como desconhecido** (ADR-38 §20.4).
  Um dia em ~250 não paga reabrir o relatório do Google Ads agora. **Se o Score v2 exigir série
  contínua, aí vira tarefa** — com dono e data.
- **Fase 3 (`client_config`)** e **Fase 4 (fechar o rastro)** — blocos próprios.
- **Recalcular `phi_score_history`** — é entrega do C1, não desta.
- **P-15, P-16, P-18, P-22, P-23** — pendências abertas, nenhuma bloqueia esta etapa.

## 10. Guardrails

- **R6** — plano aceito não dispensa verificação. Este plano existe porque o anterior foi executado
  na cabeça e cancelado na mão.
- **R13** — comparar `versionId` com `activeVersionId` antes de afirmar, e reler depois de publicar.
- **R11** — *"se este nó fizesse silenciosamente o oposto do que espero, eu perceberia?"* O P-24 é a
  resposta "não" custando caro agora.
- **R2** — cada fase concluída atualiza o ADR **e marca o cabeçalho**.
- **R3** — Notion no começo e no fim de cada bloco.
- **R5** — o `PHI - Pipeline_v2` sai desta etapa **com descrição** (P-23).
- **Regra Crítica nº 11** — a ordem da Fase 3 é imutável; não encostar nela aqui.
- **Não ativar/executar workflow sem OK de budget do Olavo.**
