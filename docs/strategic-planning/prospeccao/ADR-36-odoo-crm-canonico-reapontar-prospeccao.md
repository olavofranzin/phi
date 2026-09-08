# ADR-36 — Odoo é o CRM canônico; a Prospecção passa a escrever nele

| | |
|---|---|
| **Status** | ✅ **ACEITO** — 2026-09-08 (Olavo respondeu C1, C2 e C3 — ver §7) |
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
| **`PROSP-05` CRM-out** | cria *deal*, grava `id_hubspot` | cria **`crm.lead`** via API do Odoo, busca por **`place_id`**, grava **`id_crm`** |
| **`PROSP-06` Aprendizado** | lê deals do HubSpot → 17 colunas | lê `crm.lead` do Odoo → as mesmas 17 colunas |
| **`PROSP-08` Dedup** | deduplica no HubSpot | passa a operar no Odoo — **e tende a virar desnecessário**, porque a unicidade de `place_id` (§3) impede a duplicata na origem |
| `PROSP-01..04`, `07` | — | **não mudam** (planilha e descoberta são agnósticas de CRM) |

### 4.1. Mapeamento de estágios (já implementado no `phi_crm`)
`Prospeccao` · `Aguardando Aceite` · `Em Cadencia` · `Conversa Aceita` · `Escopo e Proposta` ·
`Ganho` (`is_won`). **"Perdido" não é estágio** — usa o mecanismo **Lost nativo** do Odoo
(`lost_reason_id`), conforme decidido no F2.

O `PROSP-05` cria o lead sempre no estágio **`Prospeccao`**. **A IA nunca move estágio** (guardrail-mãe).

### 4.2. Chave de junção planilha ↔ CRM — **`id_crm`** (decisão C1)

A chave é **`id_crm`** — e não `id_odoo`, como eu havia proposto. **O critério do Olavo prevalece e é
melhor:** o nome é **neutro de fornecedor**, então uma futura troca de CRM não obriga a mexer na
coluna de novo. O mesmo raciocínio vale para todas as colunas do bloco.

> **Nota:** o Olavo **já aplicou** a renomeação na planilha em 2026-09-08 — *"tudo que tinha hubspot
> troquei para crm"*. Portanto a planilha real **já está** com os nomes novos.

| Antes | Agora | Dono |
|---|---|---|
| `id_hubspot` | **`id_crm`** | `PROSP-05` |
| `status hubspot` | **`status crm`** *(provável — confirmar)* | `PROSP-06` |
| `hubspot_status` | **`crm_status`** *(provável — confirmar)* | `PROSP-06` |
| `data_sync_hubspot` | **`data_sync_crm`** *(provável — confirmar)* | `PROSP-06` |
| `hubspot_estagio` | descontinuada (D4) | — |

⚠️ **Só `id_crm` está confirmado pelo Olavo.** Os demais são inferência a partir da regra
"hubspot → crm" e **precisam ser conferidos na planilha** antes de qualquer workflow ser alterado.

### 4.3. 🔴 RISCO ABERTO — os workflows escrevem por NOME de coluna

`PROSP-05` grava `id_hubspot` e `PROSP-06` grava as 17 colunas de aprendizado **referenciando o
cabeçalho da planilha**. Se as colunas foram renomeadas e **os workflows ainda apontam para os nomes
antigos**, o efeito é um destes — nenhum deles dá erro visível:

1. o nó **não encontra** a coluna e o dado **some silenciosamente**; ou
2. o Google Sheets **cria uma coluna nova** com o nome antigo → passa a haver `id_hubspot` **e**
   `id_crm`, e o elo planilha↔CRM quebra para todo lead novo.

**Verificação obrigatória, antes de qualquer outra coisa nesta frente:**
- abrir a planilha e listar os nomes reais do bloco de chave/aprendizado;
- abrir `PROSP-05` e `PROSP-06` e conferir se os mapeamentos usam os nomes novos;
- conferir se apareceu coluna duplicada desde 2026-09-08.

Isto é **execução** — vai para o sub-chat da Prospecção, não para o chat-mãe.

## 5. Invariantes — como ficam no Odoo

| Invariante | Leitura no Odoo |
|---|---|
| **I4** dedup por `place_id` | agora com **unicidade no banco** (§3) — mais forte que no HubSpot |
| **I8** só o 05 escreve no CRM; o 06 só lê | inalterado, trocando HubSpot por Odoo |
| **I11** lead é sempre DEAL | no Odoo: lead é **`crm.lead`**. `res.partner` (empresa) só quando virar cliente |
| **I1** uma coluna, um dono | `id_crm` → dono `PROSP-05`; as 17 de aprendizado → dono `PROSP-06` |
| **I7** score é fato | os campos `gbp_*` no Odoo são **escritos só pelo pipeline PHI**; ninguém recalcula |

## 6. Ordem de cutover (não pular etapas)

| # | Etapa | Estado |
|---|---|---|
| 1 | Adicionar `place_id` + unicidade no `phi_crm` (§3) | ⬜ **bloqueia tudo** |
| 2 | **F3** — `PROSP-05` escreve no Odoo (criar/reusar lead + `id_crm`) | ⬜ |
| 3 | **F3** — `PROSP-06` lê do Odoo | ⬜ |
| 4 | **F5** — migrar os deals do HubSpot para o Odoo e casar `id_crm` | ⬜ |
| 5 | Rodar **em paralelo** e conferir o loop de aprendizado (`acerto_previsao`) | ⬜ |
| 6 | Desligar o HubSpot; `PROSP-08` vira dispensável | ⬜ |

## 7. ✅ Decisões do Olavo — 2026-09-08

| # | Pergunta | **Decisão** | Nota |
|---|---|---|---|
| **C1** | chave nova ou reusar `id_hubspot`? | ✅ **Nova, chamada `id_crm`** | **Melhorou a proposta:** eu sugeri `id_odoo`; o Olavo escolheu um nome **neutro de fornecedor**, para uma futura troca de CRM não exigir nova renomeação. Já **aplicado na planilha**. |
| **C2** | migrar o histórico do HubSpot? | ✅ **Migrar** | Preserva a base de treino do `acerto_previsao` |
| **C3** | desligar o HubSpot só após 1 ciclo em paralelo? | ✅ **Sim** | Etapa 5 do §6 vira pré-requisito da etapa 6 |

## 8. Riscos

- 🔴 **Renomeação já aplicada, workflows possivelmente não** — ver §4.3. É o risco **mais urgente**
  deste ADR, porque falha em silêncio.
- **Duplo destino durante o cutover.** Enquanto as etapas 2–5 rodam, um lead pode existir nos dois
  CRMs. Mitigar: janela curta e `place_id` como chave em ambos.
- **Perda do rótulo de aprendizado.** Se o F5 não casar corretamente os desfechos, o
  `acerto_previsao` zera e o modelo estatístico volta à estaca zero.
- **API do Odoo é diferente da do HubSpot** (XML-RPC/JSON-RPC). O F3 é trabalho real de integração,
  não configuração — merece sub-chat próprio com brief.

---

*Uma decisão, duas frentes destravadas.*
