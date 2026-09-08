# Definição de Pronto — PHI v1

| | |
|---|---|
| **Status** | 🟡 **PROPOSTA** — precisa do corte do Olavo (§5) |
| **Data** | 2026-09-08 |
| **Por que existe** | Em 2026-09-08 a pergunta *"quanto falta para finalizarmos?"* não tinha resposta — porque **nunca declaramos o que é "pronto"**. Sem linha de chegada, sempre falta. |

---

## 1. O PHI v1 em uma frase

> **O ciclo completo roda sozinho — do lead descoberto ao diagnóstico entregue — e o humano só
> aparece onde ele decide.**

```
descobre lead → pontua → enriquece → cria no CRM → [HUMANO dá o play] → vira cliente
                                                                             ↓
                              tarefa no Notion ← diagnostica ← pontua campanha (score)
```

**Fora disso é v2.** O v1 é o PHI rodando **dentro da própria agência** (Fase 1 do
`ESTADO-DO-PROJETO` §1) — não é produto empacotado, não é SaaS.

---

## 2. Critérios de aceite — 15 itens verificáveis

> Regra: um critério só vira ✅ com **evidência** (link, execução, print). "Acho que está" não conta.

### Frente A — Prospecção: o lead entra sozinho
| # | Critério | Hoje |
|---|---|---|
| A1 | Parque `PROSP-01..08` renomeado, **zero** workflow morto no n8n | ⬜ |
| A2 | Lead descoberto vira lead no **CRM canônico** sem toque humano | 🟡 (funciona p/ HubSpot; p/ Odoo depende do F3) |
| A3 | Loop de aprendizado escreve as 17 colunas a partir do CRM | 🟡 (roda no HubSpot) |
| A4 | Passivo zerado: **zero** linha órfã e **zero** lead sem chave de CRM | ⬜ (127 sem `place_id`; ~48 sem id) |

### Frente B — CRM: o comercial opera de verdade
| # | Critério | Hoje |
|---|---|---|
| B1 | Odoo é o CRM canônico e o **HubSpot está desligado** | ⬜ (ADR-36 proposto) |
| B2 | Pipeline dos 6 estágios **em uso real**, com critérios de saída respeitados | ⬜ |
| B3 | Campos GBP/IA preenchidos **pela IA via API** (F3) | ⬜ |
| B4 | O humano dá o play (`proxima_acao_aceite`) e **só ele** move estágio | ⬜ |

### Frente C — Produto PHI: score e diagnóstico
| # | Critério | Hoje |
|---|---|---|
| C1 | Score v2 (ADR-34) em produção — **sem contradição** entre score e métrica-mãe | 🟡 (desenhado e validado; não implantado) |
| C2 | Escrita de dados consolidada: **um dado, um writer** | 🟡 (Lote 1 em curso — 2026-09-08: **dois writers confirmados** em `raw_campaign_data`) |
| C3 | Diagnóstico T28 entregando na DB `PHI - ANÁLISES` para **todas** as campanhas ativas | ❓ **verificar cobertura** |
| C4 | Tarefa abre no Notion a partir do diagnóstico, com checklist | ❓ **verificar** |

### Frente D — Governança: o projeto se enxerga
| # | Critério | Hoje |
|---|---|---|
| D1 | Painel do `ESTADO-DO-PROJETO` atualizado a cada entrega (**R2**) | ✅ 2026-09-08 |
| D2 | Digest diário chega **com conteúdo real** (**R3** — sub-chats alimentando o Notion) | ⬜ |
| D3 | Rotina semanal de auditoria *doc × realidade* rodando | ⬜ |

---

## 3. Quanto falta — o placar

| | |
|---|---|
| ✅ **Pronto** | **1** de 15 |
| 🟡 Parcial | 4 |
| 🔴 Parado | 0 |
| ⬜ Não iniciado | 8 |
| ❓ **A verificar** | 2 |

> ⚠️ **Os 2 itens ❓ são a primeira tarefa.** Depois de 2026-09-08 aprendemos a não confiar em
> status não verificado: duas frentes estavam prontas sem ninguém saber. C3 e C4 podem estar
> melhores (ou piores) do que supomos — **verificar antes de planejar em cima**.

---

## 4. O que **NÃO** é v1 (escopo cortado de propósito)

Declarar isto é metade do valor do documento — é o que impede o projeto de crescer para sempre:

- ❌ Empacotar o PHI como **produto vendável** separado (Fase 2)
- ❌ **SaaS white-label** multi-tenant (Fase 3)
- ❌ ESP de e-mail próprio, WhatsApp Cloud API/BSP (F4 do Odoo)
- ❌ BI dedicado (Metabase/Superset) — Fase 6 do Odoo
- ❌ Modelo **preditivo** de leads (`EV`, `CLV`) — Fase 4 do contrato, bloqueada por falta de rótulo
- ❌ Maestro E1 e os demais especialistas do T28 além do Diagnóstico
- ❌ Frentes de Sites e Agentes IA
- ❌ Áreas da Operação Interna ainda não abertas (Atendimento, etc.)

> Qualquer um desses só entra no v1 se o Olavo **trocar** por um critério da §2 — nunca somando.

---

## 5. ⚠️ O que preciso do Olavo

1. **Confirmar ou cortar** os 15 critérios. *(Se algum não é essencial para "o PHI roda sozinho na
   agência", tire — quanto menor o v1, mais cedo ele existe.)*
2. **Confirmar a lista do §4** (o que fica de fora).
3. **Definir um prazo-alvo** para o v1 — sem data, "pronto" nunca chega.

---

## 6. Como este documento se mantém vivo

- É atualizado **junto com o painel** do `ESTADO-DO-PROJETO` (regra **R2**).
- A **Rotina semanal** de auditoria confere se algum critério mudou de estado sem ninguém marcar.
- Quando os 15 estiverem ✅, o **PHI v1 está pronto** e abre-se a discussão do v2.

*Sem linha de chegada, todo esforço parece insuficiente.*
