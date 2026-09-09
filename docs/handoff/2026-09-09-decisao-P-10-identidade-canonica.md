# Decisão P-10 — Identidade canônica de `raw_campaign_data`

| | |
|---|---|
| **De** | Chat-mãe (planejamento estratégico) |
| **Para** | Sub-chat de Consolidação de Writers |
| **Data** | 2026-09-09 |
| **Responde a** | `2026-09-09-identidade-canonica-raw-campaign-data-brief-decisao.md` |
| **Ação** | Incorporar ao **ADR-37** como decisão **D-2**, e marcar a **D1** como **revista** |

---

## 1. DECISÃO: **Opção A** — `GADS-<id>` + `client_id` preenchido

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

## 3. 🔴 O que me preocupou mais que a pergunta — investigar antes da A

O `CMP.CHA.CAMP-10` é `platform = meta_ads`. Some isso a três fatos do seu próprio brief:

- o writer das 07h (`GADS_INSERT`) grava **só** `GADS-` → **só Google Ads**;
- o `INNER JOIN` descarta **100%** das linhas das 04h;
- o score classifica com `STARTS_WITH(campaign_id, 'GADS-')`.

**Hipótese (não verificada): nenhuma campanha de Meta Ads jamais chegou ao score.** O PHI é
documentado como "Google Ads **e** Meta Ads" — se a hipótese se confirmar, **metade do produto está
no escuro**, e isso é maior que o P-10.

**Teste barato, faça antes de aplicar a A:**
```sql
SELECT platform, COUNT(*) FROM `phi_prod.phi_score_history` GROUP BY 1;
-- e:
SELECT DISTINCT client_id, campaign_id, platform
FROM `phi_prod.raw_campaign_data`
WHERE platform != 'google_ads' AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY);
```

**Três desfechos, três encaminhamentos:**
- **Meta nunca entrou em produção** → alívio, registre e siga a A.
- **Existe cliente Meta ativo e o score nunca o viu** → **para tudo**: vira o item nº 1 do projeto,
  na frente do P-10.
- **`CHA` é lixo/teste** → limpar e registrar (P-12 fechada).

> ⚠️ **A Opção A não resolve o Meta.** Ela padroniza para `GADS-`, que é um formato **de plataforma
> única**. Se houver Meta real, a A precisa nascer já com um formato que comporte as duas
> (ex.: `META-<id>` no mesmo campo, com o `client_id` resolvido) — senão criamos, no mesmo dia, o
> próximo bug de identidade.

---

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
