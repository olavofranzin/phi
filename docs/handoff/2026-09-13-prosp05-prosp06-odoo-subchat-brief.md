# [BRIEF sub-chat] PROSP-05 e PROSP-06 → Odoo (troca do HubSpot + sincronização)

> **Como usar:** abra um sub-chat novo e cole este arquivo como 1ª mensagem. É auto-contido.
> **Modelo recomendado:** Opus. **Repo:** `olavofranzin/phi` · **Branch:** `claude/consolidacao-2026-08`.
> **Skills que você DEVE carregar:** `phi-odoo-crm` (os 34 campos e seus donos) e `odoo-19-dev`.
> **Idioma com o Olavo:** português simples. **Antes de mudança grande: explicar e esperar OK.**
> **Não ativar/executar workflow sem OK de budget do Olavo.**

---

## 0. Missão

Trocar o HubSpot pelo **Odoo** na frente Prospecção, em **dois** workflows:

| Workflow | ID | Papel |
|---|---|---|
| **PROSP-05 — CRM-out (deal + id)** | `94lSWJfxfu653KdN` | planilha **→** CRM · escreve o deal · devolve `id_crm` |
| **PROSP-06 — Aprendizado** | *(o sub-chat localiza)* | CRM **→** planilha · traz o desfecho |

⚠️ **Por que os dois, se o Olavo pediu o 05:** porque metade do que ele pediu **é do 06**. Ver §1.
Foi registrado em 2026-09-08: *"Não fiz as alterações no PROSP-05 e no PROSP-06, anote para que sejam
feitas quando formos trocar o hubspot pelo nó do odoo."* **Este é o momento.**

---

## 1. 🔴 O pedido × o contrato — leia antes de tudo

O Olavo pediu que o **PROSP-05** atualizasse estas colunas da planilha:

> `via_aquisicao`, `valor`, `ultimo_contato`, `data_criacao_deal`, `data_fechamento`, `status_crm`,
> `motivo_perda`, `motivo_ganho`, `nba_recomendada`, `nba_aceite`, `data_sync_crm`

**As 11 pertencem ao bloco `aprendizado`, cujo dono é o P6** (`CONTRATO-PROSPECCAO.md` §3). E o
**invariante I8** é explícito:

> **I8 — P6 só lê o CRM. P5 é o único que escreve no CRM.**

Fazer o P5 escrever essas colunas criaria **dois donos** — exatamente a doença que o contrato curou.

**A entrega pedida não muda; muda o endereço:**

| O que o Olavo pediu | Onde é feito |
|---|---|
| nós do Odoo no lugar do HubSpot | **P5 e P6** |
| filtro `potencial_comercial >= 60` | **P5** (§2) |
| atualizar as 11 colunas na planilha | **P6** — já é a função dele, hoje com HubSpot |
| sincronizar CRM → planilha | **P6** — já roda a cada 6h |
| sincronizar planilha → CRM sem depender do PROSP-04 | **P5** — é a parte **genuinamente nova** (§5) |

> **Explique isso ao Olavo em uma frase antes de começar**, para ele confirmar que é o mesmo
> resultado com dono certo. Não é recusa — é endereçamento.

## 2. 🔴 O filtro `>= 60` contradiz o invariante I5 — precisa de ADR

> **I5 — "Todos os leads descobertos vão à planilha e ao CRM. O corte governa gasto de Apify/IA, não
> entrada. Filtrar a entrada torna o score irrefutável (viés de seleção)."** — decisão Olavo, 2026-08-27.

O filtro pedido **é legítimo** (higiene do CRM: o vendedor não deve ver 300 leads fracos), mas tem uma
consequência que precisa ficar escrita, não descoberta depois:

> Se só entram leads `>= 60`, nunca saberemos se um lead de 50 fecharia. O `acerto_previsao` passa a
> medir **só falso positivo** — o score nunca pode ser corrigido para baixo. Ele fica **irrefutável**,
> que é o problema que o I5 existia para evitar.

**O que fazer (nesta ordem):**
1. **Implemente o filtro** como o Olavo pediu — é decisão dele e a higiene do CRM é real.
2. **Escreva um ADR curto** (ou emenda ao ADR-35) alterando o I5, com a consequência acima declarada.
   *Invariante não muda sem ADR.* Registre que **a planilha continua recebendo todos** (dono P2) —
   nada se perde, o dado fica guardado.
3. **Proponha ao Olavo a mitigação já prevista no contrato:** a **amostra de exploração de 10–15%**
   (`origem_fila` = `topo`/`exploracao`, item 3.3 do plano de migração). Com ela o filtro vira
   `potencial_comercial >= 60 OU origem_fila = 'exploracao'` — CRM limpo **e** score falseável.
   Hoje essa coluna **não existe**; é trabalho de outra etapa. **Só proponha, não construa aqui.**

**Dois detalhes do filtro que precisam de regra explícita:**

| Caso | Regra |
|---|---|
| Lead **sem** `potencial_comercial` (ainda não pontuado) | **não passa.** Vazio não é 0 e não é ≥60 (**I3**) |
| Lead **já no CRM** (`id_crm` preenchido) que caiu para 50 | **continua sendo atualizado.** O filtro gateia a **criação**, não a atualização — senão o vendedor fica olhando dado velho na tela |

## 3. Pré-requisitos

- ✅ **`gbp_place_id` existe** no módulo `phi_crm`, com constraint `UNIQUE`. O bloqueio registrado no
  ADR-36 §3 **está resolvido** — confirme na instalação antes de confiar.
- ⬜ **Credencial Odoo no n8n:** URL `https://crm.franzcomunicacao.com`, base `phi_crm`.
  **Crie um usuário dedicado à integração** (ex.: `n8n@franzcomunicacao.com`), **não use o admin** —
  assim dá para ver na tela quem escreveu o quê. Peça ao Olavo.
- ⬜ **Verifique o nó Odoo do n8n** com `search_nodes` + `get_node_types` **antes de escrever
  parâmetro** — não confie em memória. Se o nó nativo não cobrir `crm.lead` com filtro por campo
  custom, o caminho é **HTTP Request** contra o JSON-RPC/XML-RPC do Odoo. Decida com evidência.
- ⬜ **Check de 1 minuto, pendente desde 2026-09-08:** a planilha teve `id_hubspot` renomeado para
  **`id_crm`**. **O PROSP-06 parou de escrever desde a renomeação?** Se sim, há um buraco no
  aprendizado com data de início. Descubra, registre e conte ao Olavo — afeta o critério **A3**.

## 4. PROSP-05 — o que muda

1. **Trocar os nós HubSpot por Odoo.**
2. **Filtro `>= 60`** conforme §2, **antes** do nó de escrita.
3. **Busca do lead: por `gbp_place_id`, sempre** (**I4** — nome nunca é chave).
4. **O lead é um `crm.lead`** (deal). **Nunca criar `res.partner`/Company** (**I11**).
5. **Estágio:** cria no **primeiro estágio** do pipeline e **nunca move estágio, nunca marca
   ganho/perdido**. Mover é ato humano — é o guardrail-mãe do PHI.
6. **Campos GBP/IA:** mapear pela skill `phi-odoo-crm` (não invente nome de campo).
   Campo não observado → **não escreva a coluna**; nunca grave `0` para dizer "não sei" (**I3**).
7. **Escreve na planilha APENAS `id_crm`** (regra de escrita nº 2: *escreva só as colunas que você
   possui*). **Nunca `appendOrUpdate` — só `update`** (**I2**).
8. **Campos de marketing** (decisão de 2026-09-10) — preencher na **criação**:

   | Campo Odoo | Valor |
   |---|---|
   | Meio (`medium_id`) | `Prospecção ativa` |
   | Origem (`source_id`) | `Google Maps` |
   | Campanha (`campaign_id`) | **calculada**, ver abaixo |

   ```js
   const d = $json['data extração'];
   const lote = d
     ? 'PROSP-' + DateTime.fromISO(d).setZone('America/Sao_Paulo').toFormat('yyyy-MM')
     : 'PROSP-SEM-DATA';
   ```
   - o lote vem do **mês de extração do lead**, **nunca de `$now`** — senão rodar de novo no mês
     seguinte reetiqueta todo mundo;
   - `MM` com zero à esquerda (senão `2026-9` ordena depois de `2026-10`);
   - `setZone('America/Sao_Paulo')` — o n8n roda em UTC e viraria o mês às 21h.
   - ⚠️ Os três são **many2one**: precisam do **ID** do registro, não do texto. Para Meio e Origem,
     referencie por **XML ID** do módulo (estável se alguém renomear o rótulo). Para Campanha:
     **buscar; se não existir, criar** — o robô é o único que cria lote.
   - ⚠️ **Confirme com o Olavo** se ele já cadastrou Meio/Origem à mão. Se sim, **use os registros
     existentes** — não crie duplicata.

## 5. PROSP-05 — a rotina de sincronização (a parte nova)

Hoje o P5 só roda quando o **PROSP-04** chama. Se alguém corrige um telefone na planilha, **nada leva
isso ao CRM**. O Olavo pediu certo.

- **Adicione um Schedule Trigger** (sugestão: a cada 6h, alinhado ao P6 — confirmar com o Olavo).
- **Não varra a planilha inteira a cada rodada.** Proposta: **carimbo próprio do P5** — uma coluna
  nova `data_envio_crm`, **dono P5** (regra de escrita nº 6: *toda escrita carimba a data*). A rodada
  processa só linhas onde há mudança posterior ao último envio.
  ⚠️ Coluna nova = **atualizar o CONTRATO** na mesma sessão (**R2**). Confirme com o Olavo antes.
- **O gatilho pelo PROSP-04 continua existindo.** O schedule é reconciliação, não substituição.

## 6. 🔑 A regra que impede o ping-pong

Sincronizar nos dois sentidos é perigoso: se os dois lados escrevem o mesmo campo, **quem roda por
último vence** e o dado fica dançando. A regra é simples e não tem exceção:

> **O workflow é bidirecional. O CAMPO é sempre de mão única.**

| Sentido | Dono | O que anda |
|---|---|---|
| planilha **→** CRM | **P5** | identidade, features, scoring GBP, textões de IA, campos de marketing |
| CRM **→** planilha | **P6** | o bloco `aprendizado` (17 colunas): `status_crm`, `motivo_perda`, `motivo_ganho`, `valor`, `via_aquisicao`, `ultimo_contato`, `data_criacao_deal`, `data_fechamento`, `nba_recomendada`, `nba_aceite`, `data_sync_crm`… |

**Monte essa tabela campo a campo antes de cabear qualquer nó**, e ponha no CONTRATO. Se um campo
aparecer nos dois lados, **pare** — é erro de desenho, não detalhe de implementação.

## 7. PROSP-06 — o que muda

1. **Ler do Odoo** no lugar do HubSpot (**só ler** — I8).
2. **Renomear as colunas** que carregavam o nome do fornecedor: `status hubspot`/`hubspot_status` →
   **`status_crm`**; `data_sync_hubspot` → **`data_sync_crm`**. (Mesma lógica do `id_crm`: nome de
   coluna não carrega marca de fornecedor.) **Confirmar com o Olavo os nomes exatos da planilha.**
3. **Mapear o desfecho do Odoo:** o estágio (`stage_id`) e o **Lost nativo** (`lost_reason_id` +
   arquivado) → `status_crm` / `motivo_perda`. O `Ganho` é o estágio com `is_won`.
4. **Junção planilha↔CRM por `id_crm`** (**I4**). Sem correspondência → **desviar o item, nunca criar
   linha** (regra de escrita nº 1).
5. **`update`, nunca `appendOrUpdate`** (**I2**).

## 8. Verificação (descreva como testou — CLAUDE.md)

1. Lead com `potencial_comercial = 75` → **entra** no Odoo, no 1º estágio, com `gbp_place_id`,
   Meio/Origem/Campanha preenchidos; `id_crm` volta para a planilha.
2. Lead com `55` → **não entra**. Lead **sem** score → **não entra**.
3. Lead já no CRM que caiu para `50` → **continua sendo atualizado**.
4. Rodar o P5 **duas vezes** no mesmo lead → **um** lead no Odoo (a constraint `UNIQUE` do
   `gbp_place_id` tem de segurar), e o `PROSP-2026-09` **não muda** na 2ª rodada.
5. Mover um lead para `Ganho` na tela → o P6 traz `status_crm` e `data_fechamento` para a planilha.
6. Editar um campo na planilha **sem** rodar o PROSP-04 → na rodada agendada, o CRM recebe.
7. **Nenhum campo escrito pelos dois lados** — conferir contra a tabela do §6.
8. **Nenhum lead perdeu dado** que já tinha (o risco nº 1 de ler-e-reescrever).

## 9. Guardrails e obrigações

- **R2 — doc na mesma sessão:** atualizar `CONTRATO-PROSPECCAO.md` (donos, colunas renomeadas,
  coluna nova) e escrever o ADR do I5. Commit no git. *Se não está escrito, não aconteceu.*
- **R3 — Notion obrigatório:** ao **começar** e ao **encerrar** cada bloco, escrever na DB
  **"PHI — Registro de Execuções (Sub-chats)"** (`8d8eb685f66249c7ba4f298d744feec3`):
  frente · o que foi feito · estado · próximo passo · link.
- **R5 — descrição fiel:** os dois workflows saem da sessão com descrição dizendo **o que fazem e por
  que existem**, incluindo que substituíram o HubSpot. Descrição copiada é bug (**I10**).
- **R6 — o dado vence o plano:** se a leitura dos nós desmentir algo deste brief, **pare, não
  execute, corrija o documento e registre o porquê.**
- **I7 / ADR-003:** score é fato. Quem não é P3 **não recalcula nem sobrescreve**.
- **Guardrail-mãe:** a IA preenche campos; **mover estágio e fechar é humano**.
- **Não desligar o HubSpot.** Decisão C3 do ADR-36: **1 ciclo em paralelo** antes.

## 10. Fontes

- `docs/strategic-planning/prospeccao/CONTRATO-PROSPECCAO.md` ← **matriz de donos e invariantes**
- `docs/strategic-planning/prospeccao/ADR-35-...md` e `ADR-36-odoo-crm-canonico-reapontar-prospeccao.md`
- `docs/handoff/2026-09-08-f3-integracao-n8n-odoo-subchat-brief.md` — **carga inicial** dos leads da
  planilha (modo backfill do P5). ⚠️ **Coordene:** é o mesmo workflow. Se o F3 já estiver rodando,
  falem antes de cabear.
- Skills `phi-odoo-crm` e `odoo-19-dev` · `docs/comercial/odoo/addons/phi_crm/` · `CLAUDE.md`

## 11. Fora de escopo

- Construir a **amostra de exploração** (`origem_fila`) — só propor.
- **Desligar o HubSpot** · **migrar histórico** (F5) · mexer na frente do Score/BigQuery (ADR-38).
