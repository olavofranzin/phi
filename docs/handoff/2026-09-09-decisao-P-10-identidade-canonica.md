# Decisão P-10 — Identidade canônica de `raw_campaign_data`

| | |
|---|---|
| **De** | Chat-mãe (planejamento estratégico) |
| **Para** | Sub-chat de Consolidação de Writers |
| **Data** | 2026-09-09 |
| **Responde a** | `2026-09-09-identidade-canonica-raw-campaign-data-brief-decisao.md` |
| **Ação** | Incorporar ao **ADR-37** como decisão **D-2**, e marcar a **D1** como **revista** |

---

> 🔴 **SUPERSEDIDO EM 2026-09-09 PELO `ADR-38`.** O Olavo apontou o defeito da Opção A: o prefixo
> (`GADS-`/`META-`) **duplica** o que a coluna `platform` já diz, e obriga a reescrever código a cada
> plataforma nova (TikTok, etc.). A decisão final é **identidade neutra de plataforma** — `campaign_id`
> nativo sem prefixo + chave `(client_id, platform, campaign_id, date)` — com **rebuild da série
> histórica** a partir de relatório oficial. Ver
> `docs/strategic-planning/saude-digital/adr-rascunhos/ADR-38-identidade-neutra-e-rebuild-serie-historica.md`.
> **O §3 (gate do Meta) e o §5 (score só suporta CPA) deste documento continuam válidos.**

## 1. ~~DECISÃO: **Opção A** — `GADS-<id>` + `client_id` preenchido~~ (superada — ver acima)

Corrigir o `sw metricas campanhas` (`W571K320aqIHsdtH`) para gravar `client_id` preenchido e
`campaign_id` no formato `GADS-<id>`, alinhando-o ao que o resto do sistema já usa.

### Por que A, e não B

1. **A adota a identidade que tem 100% dos consumidores. A B adota a que tem zero.** Hoje o score, o
   `client_config`, o Notion e o próprio `CLAUDE.md` falam `GADS-`. A assimetria de custo não é
   apertada — é de ordem de grandeza.
2. **A B promoveria um rascunho a obra grande pela porta dos fundos.** O ADR-33 **não foi aceito**.
   Adotar a identidade dele agora seria decidir uma arquitetura por consequência de um bug de
   ingestão, sem que ela tenha passado por decisão própria. Isso é exatamente o padrão que nos trouxe
   até aqui.
3. **A é reversível; B carrega migração de dado histórico.** Estamos em **2 de 14** critérios com
   alvo em **30/11**. B abriria uma terceira frente e consumiria o WIP que acabamos de proteger.

**Opção C está descartada** — institucionalizar a duplicação contradiz o princípio do próprio ADR-37.

### O que esta decisão explicitamente **NÃO** decide

**A não declara que `GADS-` é a identidade certa a longo prazo.** Ela declara que **o sistema deve
falar uma língua só**, e a única língua que já tem falantes é essa. O ADR-33 continua **em aberto** e,
se for aceito, vira uma **migração planejada, de uma identidade para outra** — em vez de duas
identidades convivendo por acidente, que é o estado de hoje.

---

## 2. Sequência de execução

| # | Ação | Condição |
|---|---|---|
| 1 | **Investigar P-11** (por que o `client_id` sai vazio) | **Faz parte do escopo da A.** Se for decisão deliberada (ex.: writer multi-cliente que resolve o cliente depois), o custo da A muda e você **volta a falar comigo antes de executar** — regra **R6** |
| 2 | Aplicar a A no `sw metricas campanhas` | após 1 |
| 3 | Confirmar que os dois writers **passam a colidir** no `MERGE` | é o teste real da A |
| 4 | Refazer as Fases 1 e 2 do ADR-37 sob a identidade única | após 3 |

✅ **Fase 3 (`client_config`) está autorizada a começar JÁ, em paralelo** — não depende do P-10.
Manter a ordem obrigatória 3.1 → 3.2 → 3.3 → 3.4, e a regra de corrigir a métrica **antes** de trocar
o dataset (o score só suporta `CPA`; `ROAS` sai `INSUFFICIENT_DATA`).

---

## 3. ✅ Meta Ads — hipótese RESPONDIDA pelo Olavo (2026-09-09)

Eu havia levantado que **nenhuma campanha de Meta Ads jamais chegou ao score**, e que isso poderia
ser maior que o P-10. **Resposta do Olavo:**

> `CHA` é **cliente real**, mas os dados são de uma **campanha antiga da Meta**, usados para
> **configurar corretamente os nós** que puxavam dados de lá. **Na época não havia campanha Meta
> ativa — só Google.**

**Desfecho: não é bug ativo. É uma lacuna latente, com gatilho.**

| | |
|---|---|
| **Hoje** | ✅ nada se perde — não há campanha Meta ativa para pontuar |
| **No dia em que houver** | 🔴 a campanha seria **descartada em silêncio** pelo score |
| **Classificação** | **Gate condicional**, não tarefa de backlog |

### 🚧 GATE — antes de subir a primeira campanha Meta ativa
O score precisa suportá-la. Hoje **não suporta**, por três motivos empilhados: o writer que o
alimenta grava só `GADS-`; o `INNER JOIN` descarta as linhas do outro writer; e a classificação usa
`STARTS_WITH(campaign_id, 'GADS-')`.

> **Por que registrar como gate e não como tarefa:** tarefa sem data apodrece no backlog. Gate
> dispara sozinho, no momento em que a condição acontece. E o modo de falha aqui é o pior que existe
> — **silencioso**: ninguém receberia erro, a campanha simplesmente não teria score.

### ⚠️ Ajuste na Opção A por causa disso (obrigatório)
**A Opção A NÃO pode escrever `GADS-` numa linha `platform = meta_ads`** — seria gravar uma mentira.
O prefixo tem de **derivar da plataforma**:

| `platform` | prefixo |
|---|---|
| `google_ads` | `GADS-` |
| `meta_ads` | `META-` |

Custo praticamente idêntico (é o mesmo ponto no código), e **desarma a mina** em vez de enterrá-la
mais fundo. A parte do **consumidor** (o `STARTS_WITH` do score) fica para o gate — não há campanha
Meta ativa, então não há pressa.

### P-12 encerrada
`CMP.CHA.CAMP-10` **não é lixo**: é dado de configuração legítimo, de campanha antiga. **Não apagar.**
Só precisa entrar no padrão de identidade da Opção A como qualquer outra linha.

## 4. Registro de rumo (R6)

A **D1 do ADR-37 (08/09) está REVISTA**: duas das três justificativas caíram na verificação de 09/09.
Isso **não é retrabalho perdido** — é a R6 funcionando duas vezes seguidas. A Fase 0.1 permanece
correta como defesa (invariante I2) e **passa a valer de verdade** quando a A entrar.

**Manter escrito, não apagar.** A refutação é informação: sem ela, a próxima auditoria refaz o mesmo
caminho.

## 5. Também registre (achado de produto, fora do escopo deste sub-chat)

O SQL do score tem `WHEN primary_metric_type != 'CPA' THEN 'INSUFFICIENT_DATA'`.
**O PHI·Mídia Score só suporta CPA.** Isso é uma **limitação de produto** que hoje não está declarada
em lugar nenhum. Não é sua tarefa resolver — mas precisa estar escrito. Vou levar para o painel.

---

*Uma língua só. Qual língua, decide-se depois — mas duas por acidente, nunca.*
