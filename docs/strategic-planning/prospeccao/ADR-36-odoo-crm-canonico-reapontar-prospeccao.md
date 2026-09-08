# ADR-36 — Odoo é o CRM canônico; a Prospecção passa a escrever nele

| | |
|---|---|
| **Status** | 🟡 **PROPOSTO** — direção pronta para aceite; **3 confirmações** do Olavo em §7 |
| **Data** | 2026-09-08 |
| **Depende de** | ADR-35 (contrato da Prospecção) · `decisao-substituicao-crm-hubspot-para-odoo.md` |
| **Destrava** | acabamento da Prospecção (P-5 do ADR-35) **e** o **F3** do Odoo — são o mesmo trabalho |

---

## 1. Contexto

Duas frentes andaram em paralelo e chegaram a um **conflito de destino**:

| Frente | Onde está |
|---|---|
| **Prospecção** (ADR-35) | parque `PROSP-01..08` ativo, escrevendo no **HubSpot** |
| **CRM Odoo** | **F1 + F2 concluídos** em 2026-09-08 — Odoo 19 no ar e módulo `phi_crm` aprovado nos 8 testes de aceite, **já com os campos GBP/IA e os 6 estágios** |

Hoje existiriam **dois CRMs**: o HubSpot recebendo lead novo da Prospecção, e o Odoo pronto e vazio.
Dois destinos = duas fontes de verdade — o oposto do princípio do ADR-35 (*uma coluna, um dono*).

A decisão de plataforma **já foi tomada pelos fatos**: o Odoo está no ar, com o modelo de dados do
PHI dentro dele. Falta **declarar** e **reapontar**.

## 2. Decisão

> **O Odoo Community self-hosted é o CRM canônico do PHI Comercial.**
> O HubSpot entra em **modo somente-leitura** e é desligado ao fim do cutover (F5).

Consequência direta: **`PROSP-05` passa a escrever no Odoo** e **`PROSP-06` passa a ler do Odoo**.

---

## 3. 🔴 Pré-requisito bloqueante descoberto neste ADR

**O módulo `phi_crm` não tem o campo `place_id`.**

O invariante **I4** do ADR-35 é explícito: *"dedup por `place_id`; **nome nunca é chave**"*. Sem esse
campo no `crm.lead`, o `PROSP-05` teria de procurar o lead **pelo nome** — que é exatamente o defeito
que produziu os deals duplicados no HubSpot e obrigou a construir um deduplicador.

**Ação obrigatória, antes de qualquer integração (primeiro item do F3):**

| # | O quê | Onde |
|---|---|---|
| 1 | Adicionar `place_id = fields.Char(index=True)` ao `crm.lead` | `addons/phi_crm/models/crm_lead.py` |
| 2 | Restrição de unicidade (`_sql_constraints`) em `place_id` | idem |
| 3 | Expor o campo na view (pode ser oculto/técnico) | `views/crm_lead_views.xml` |

Sem os itens 1 e 2, **o F3 não deve começar** — ele reintroduziria o problema já resolvido.

---

## 4. Reapontamento por workflow

| Workflow | Antes (HubSpot) | Depois (Odoo) |
|---|---|---|
| **`PROSP-05` CRM-out** | cria *deal*, grava `id_hubspot` | cria **`crm.lead`** via API do Odoo, busca por **`place_id`**, grava **`id_odoo`** |
| **`PROSP-06` Aprendizado** | lê deals do HubSpot → 17 colunas | lê `crm.lead` do Odoo → as mesmas 17 colunas |
| **`PROSP-08` Dedup** | deduplica no HubSpot | passa a operar no Odoo — **e tende a virar desnecessário**, porque a unicidade de `place_id` (§3) impede a duplicata na origem |
| `PROSP-01..04`, `07` | — | **não mudam** (planilha e descoberta são agnósticas de CRM) |

### 4.1. Mapeamento de estágios (já implementado no `phi_crm`)
`Prospeccao` · `Aguardando Aceite` · `Em Cadencia` · `Conversa Aceita` · `Escopo e Proposta` ·
`Ganho` (`is_won`). **"Perdido" não é estágio** — usa o mecanismo **Lost nativo** do Odoo
(`lost_reason_id`), conforme decidido no F2.

O `PROSP-05` cria o lead sempre no estágio **`Prospeccao`**. **A IA nunca move estágio** (guardrail-mãe).

### 4.2. Chave de junção planilha ↔ CRM
**Recomendação (mais simples):** criar **uma coluna nova `id_odoo`** (dono: `PROSP-05`) e
**congelar `id_hubspot`** como histórico — ninguém escreve, o conteúdo permanece.
Motivo: durante o cutover os dois mundos coexistem; reaproveitar a mesma coluna misturaria
identificadores de sistemas diferentes e corromperia o loop de aprendizado.

**A coluna `status hubspot` NÃO é renomeada** (precedente da decisão D4: não criar dependência de
coluna nova só para trocar o nome). Passa a significar *"estágio no CRM"*, alimentada pelo
`PROSP-06` a partir do Odoo.

## 5. Invariantes — como ficam no Odoo

| Invariante | Leitura no Odoo |
|---|---|
| **I4** dedup por `place_id` | agora com **unicidade no banco** (§3) — mais forte que no HubSpot |
| **I8** só o 05 escreve no CRM; o 06 só lê | inalterado, trocando HubSpot por Odoo |
| **I11** lead é sempre DEAL | no Odoo: lead é **`crm.lead`**. `res.partner` (empresa) só quando virar cliente |
| **I1** uma coluna, um dono | `id_odoo` → dono `PROSP-05`; as 17 de aprendizado → dono `PROSP-06` |
| **I7** score é fato | os campos `gbp_*` no Odoo são **escritos só pelo pipeline PHI**; ninguém recalcula |

## 6. Ordem de cutover (não pular etapas)

| # | Etapa | Estado |
|---|---|---|
| 1 | Adicionar `place_id` + unicidade no `phi_crm` (§3) | ⬜ **bloqueia tudo** |
| 2 | **F3** — `PROSP-05` escreve no Odoo (criar/reusar lead + `id_odoo`) | ⬜ |
| 3 | **F3** — `PROSP-06` lê do Odoo | ⬜ |
| 4 | **F5** — migrar os deals do HubSpot para o Odoo e casar `id_odoo` | ⬜ |
| 5 | Rodar **em paralelo** e conferir o loop de aprendizado (`acerto_previsao`) | ⬜ |
| 6 | Desligar o HubSpot; `PROSP-08` vira dispensável | ⬜ |

## 7. ⚠️ As 3 confirmações que faltam (Olavo)

| # | Pergunta | Minha recomendação |
|---|---|---|
| **C1** | Chave nova `id_odoo` ou reaproveitar `id_hubspot`? | **`id_odoo` nova**; congela a antiga |
| **C2** | Migrar o histórico do HubSpot (F5) ou começar limpo no Odoo? | **Migrar** — sem histórico o loop de aprendizado (`acerto_previsao`) perde a base de treino |
| **C3** | Quando desligar o HubSpot? | **Depois** de 1 ciclo em paralelo com o loop conferido (etapa 5) |

## 8. Riscos

- **Duplo destino durante o cutover.** Enquanto as etapas 2–5 rodam, um lead pode existir nos dois
  CRMs. Mitigar: janela curta e `place_id` como chave em ambos.
- **Perda do rótulo de aprendizado.** Se o F5 não casar corretamente os desfechos, o
  `acerto_previsao` zera e o modelo estatístico volta à estaca zero.
- **API do Odoo é diferente da do HubSpot** (XML-RPC/JSON-RPC). O F3 é trabalho real de integração,
  não configuração — merece sub-chat próprio com brief.

---

*Uma decisão, duas frentes destravadas.*
