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
| A2 | Lead descoberto vira lead no **CRM canônico** sem toque humano | 🔴 **o P4 foi repontado para o Odoo em 16/09 e o caminho NUNCA rodou** — última execução do PROSP-04 é de 10/09 |
| A3 | Loop de aprendizado escreve as 17 colunas a partir do CRM | 🟡 **resolvido 17/09** — o `PROSP-06O` substituiu o loop do HubSpot e passou nos 7 critérios; ✅ quando ativado |
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
| C1 | Score v2 (ADR-34) em produção — **sem contradição** entre score e métrica-mãe | 🟡 desenhado e validado; **o caminho abriu em 18/09** com o C2 — e a série limpa que ele exige já está carregada (`BACKFILL_2026-09`) |
| C2 | Escrita de dados consolidada: **um dado, um writer** | 🟡 **DESBLOQUEADO em 2026-09-18** — o ADR-38 unificou a identidade **e fechou o P-10**; os dois writers já colidem no `MERGE`. Falta executar as Fases 1 e 2 do ADR-37 |
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

---

## Adendo 2026-09-15 — fora da v1, mas com gatilho

| Item | Estado | Gatilho |
|---|---|---|
| **Automação da entrega de GBP** (1º pedaço real da Fase 2 do PHI) | **fora da v1** | **CK5 — ao fechar o 3º cliente de GBP** |
| **Bônus de "saúde digital"** no cliente de GBP (risco RE2) | **fora da v1** | **mesmo gatilho** — exige acessos e tempo do cliente, e na fase manual a entrega não tem folga |

> **Por que gatilho e não data:** tarefa sem data apodrece; **gatilho dispara sozinho quando a condição
> acontece.** É o mesmo mecanismo do gate do Meta Ads.
>
> Fonte: `prospeccao/PLANO-ENTREGA-FINAL-PROSPECCAO.md` §13.7 e §12.2.
> ⚠️ A **Prospecção tem critérios próprios** (P1–P7, P9) no §15 daquele plano — ainda 🟡 proposta.

---

## Frente PROSPECÇÃO — 8 critérios (aprovados 2026-09-15)

| # | Critério | Placar |
|---|---|---|
| **P1** | um lead entra e sai **analisado** pelo workflow de lead único | ⬜ |
| **P2** | um **recorte completo** (2 setores) roda ponta a ponta **sem intervenção** | ⬜ |
| **P3** | todo lead no CRM chega com **oferta, prioridade, abordagem e NBA** | ⬜ |
| **P4** | o **desfecho volta à planilha** com motivo, automaticamente | 🟡 **no ar desde 18/09** e rodando no gatilho (grade 00:20/06:20/12:20/18:20 BRT) — falta só **um perdido com motivo** chegar ao CRM |
| **P5** | a **cadência roda**, registra tentativas e **para na resposta** | ⬜ |
| **P6** | enriquecimentos são **skills versionadas no git** | ⬜ |
| **P7** | cada **dimensão do score** tem definição escrita e status de evidência | ⬜ |
| **P9** | o **mini-diagnóstico é gerado sem trabalho manual** | ⬜ |

**Placar: 0 de 8** (o P4 a um passo). Documento canônico: `prospeccao/PLANO-ENTREGA-FINAL-PROSPECCAO.md` (§15).
**Fora desta frente:** o relatório mensal do cliente — é entregável do **serviço**, vive no escopo do
projeto. **P8 saiu** e virou o checkpoint **CK1** (custo por lead): saber um custo é medição, não entrega.
