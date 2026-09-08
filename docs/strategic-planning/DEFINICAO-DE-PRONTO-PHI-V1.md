# Definição de Pronto — PHI v1

| | |
|---|---|
| **Status** | ✅ **VIGENTE** — cortes e data aprovados pelo Olavo em 2026-09-08 |
| **Data-alvo** | 🎯 **30/11/2026** · checkpoint **31/10/2026** |
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

## 2. Critérios de aceite — 14 itens verificáveis

> Regra: um critério só vira ✅ com **evidência** (link, execução, print). "Acho que está" não conta.
>
> **Cortes aprovados pelo Olavo em 2026-09-08** (de 15 → 14): **A1 removido** (renomear workflow é
> higiene, não afeta "roda sozinho") · **A4 relaxado** de *"zero"* para *"não crescendo"* (perfeição
> travava o v1) · **B2 reformulado** de *"uso real"* para *"um lead ponta a ponta"* (uso real depende
> de venda acontecer, não de engenharia entregar). A numeração é preservada por causa das
> referências nos ADRs.

### Frente A — Prospecção: o lead entra sozinho
| # | Critério | Hoje |
|---|---|---|
| A2 | Lead descoberto vira lead no **CRM canônico** sem toque humano | 🟡 funciona p/ HubSpot; p/ Odoo depende do F3 |
| A3 | Loop de aprendizado escreve as 17 colunas a partir do CRM | 🟡 ⚠️ **pode ter parado** desde a renomeação das colunas — ADR-36 §4.4 |
| A4 | Passivo **conhecido, documentado e não crescendo** (não precisa ser zero) | ⬜ 127 linhas sem `place_id`; ~48 sem chave de CRM |

### Frente B — CRM: o comercial opera de verdade
| # | Critério | Hoje |
|---|---|---|
| B1 | Odoo é o CRM canônico e o **HubSpot está desligado** | ⬜ ADR-36 aceito; execução no F3/F5 |
| B2 | **Um lead percorreu os 6 estágios ponta a ponta** | ⬜ |
| B3 | Campos GBP/IA preenchidos **pela IA via API** (F3) | ⬜ |
| B4 | O humano dá o play (`proxima_acao_aceite`) e **só ele** move estágio | ⬜ |

### Frente C — Produto PHI: score e diagnóstico
| # | Critério | Hoje |
|---|---|---|
| C1 | Score v2 (ADR-34) em produção — **sem contradição** entre score e métrica-mãe | 🟡 desenhado e validado; bloqueado por C2 |
| C2 | Escrita de dados consolidada: **um dado, um writer** | 🟡 Lote 1 **concluído** (2026-09-08) — 4 sobreposições mapeadas; falta o **ADR-37** |
| C3 | Diagnóstico T28 entregando na DB `PHI - ANÁLISES` para **todas** as campanhas ativas | ❓ **verificar cobertura** |
| C4 | Tarefa abre no Notion a partir do diagnóstico, com checklist | ❓ **verificar** |

### Frente D — Governança: o projeto se enxerga
| # | Critério | Hoje |
|---|---|---|
| D1 | Painel do `ESTADO-DO-PROJETO` atualizado a cada entrega (**R2**) | ✅ 2026-09-08 |
| D2 | Digest diário chega **com conteúdo real** (**R3** — sub-chats alimentando o Notion) | ⬜ |
| D3 | Rotina semanal de auditoria *doc × realidade* rodando | ✅ criada + conector n8n anexado (1ª execução 14/09) |

---

## 3. Quanto falta — o placar

| | |
|---|---|
| ✅ **Pronto** | **2** de 14 |
| 🟡 Parcial | 4 |
| ⬜ Não iniciado | 6 |
| ❓ **A verificar** | 2 |

### Caminho crítico até 30/11
```
F3 (place_id + reapontar + corrigir nomes) → F5 (migrar dados) → 1 ciclo em paralelo → desligar HubSpot
                                                                                        [B1, B2, B3, B4]
writers: Lote 1 → ADR-37 → implementar → Score v2 em produção
                                          [C2, C1]
```
**Checkpoint 31/10:** as duas correntes devem estar com **código pronto**, faltando só o ciclo em
paralelo. Se em 31/10 alguma delas ainda estiver escrevendo código, **a data de 30/11 está em risco**
e é hora de cortar mais escopo — não de empurrar a data.

> ⚠️ **A data é estimativa por dependência, não por medição.** Nunca cronometramos um lote desses.
> A auditoria semanal é quem vai calibrar isso a partir de 14/09.

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

## 5. ✅ Decisões do Olavo — 2026-09-08

| Decisão | Resultado |
|---|---|
| Corte dos critérios | **A1 cortado · A4 relaxado · B2 reformulado** → 15 vira **14** |
| Escopo fora do v1 (§4) | **confirmado** |
| Data-alvo | **30/11/2026**, com **checkpoint em 31/10** |

**Regra de reação ao checkpoint:** se em 31/10 o código não estiver pronto nas duas correntes,
**corta-se escopo, não se empurra a data.** Foi o que nos trouxe até aqui.

## 6. Como este documento se mantém vivo

- É atualizado **junto com o painel** do `ESTADO-DO-PROJETO` (regra **R2**).
- A **Rotina semanal** de auditoria confere se algum critério mudou de estado sem ninguém marcar.
- Quando os 15 estiverem ✅, o **PHI v1 está pronto** e abre-se a discussão do v2.

*Sem linha de chegada, todo esforço parece insuficiente.*
