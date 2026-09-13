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

## 1. ✅ O pedido × o contrato — resolvido, leia antes de tudo

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

> ✅ **Confirmado pelo Olavo (2026-09-13):** *"nenhum problema o P6 ser o responsável por atualizar a
> planilha... Deixemos então o P6 como o dono não 'da escrita' mas da 'atualização'."* **A divisão
> acima está fechada** — P5 leva ao CRM, P6 traz o desfecho de volta.

### 1.1 Carimbo de linhagem — quem sincronizou

O Olavo pediu que a sincronização deixe **assinatura**: saber que foi o P6 que atualizou aquela linha.
O pedido é certo — é a mesma ideia do `ingestion_step` no BigQuery.

⚠️ **Mas não misture os dois fatos na mesma célula.** Se `data_sync_crm` virar texto
(`2026-09-13 14:22 · P6`), a coluna **deixa de ser data** e qualquer comparação de "mudou desde a
última sincronização" quebra — justamente o que a rotina do §5 precisa fazer.

**Recomendação:** `data_sync_crm` continua **data pura**, e a assinatura vai numa coluna própria
**`sync_por`** (dono P6). Duas colunas, dois fatos, nenhum tipo quebrado.

✅ **Decidido (Olavo, 2026-09-13): a coluna `sync_por` será criada à mão na planilha.** Já está no
CONTRATO (bloco `aprendizado`, dono **P6**). **Não crie a coluna** — ela já existe; confira o nome
exato no cabeçalho antes de cabear o nó (o nó do Sheets casa por **nome de cabeçalho**, e um caractere
diferente falha em silêncio — foi o que aconteceu com `id_hubspot` → `id_crm`).

## 2. O filtro `>= 60` é TEMPORÁRIO — e por isso NÃO mexe no I5

✅ **Decisão do Olavo (2026-09-13):** o corte é **temporário**. Os leads `>= 60` têm mais campos
preenchidos, e ele quer **conferir o layout do lead na tela** antes de ativar os agentes de IA
(previstos para os próximos dias).

> Isso muda o trabalho: **não escreva ADR alterando o I5.** O invariante
> (*"todos os leads vão à planilha e ao CRM"*) **continua valendo**. Isto é uma exceção de carga, não
> uma mudança de política.

**Como implementar para que ele saia fácil depois:**

1. **O corte é um parâmetro, não um número enterrado num nó IF.** Um `Set` no topo do workflow
   (`corte_potencial = 60`). Remover depois vira **uma linha**, não uma caçada.
2. **Sticky note obrigatório, com a condição de saída escrita** (**R5**):
   > *"Filtro TEMPORÁRIO de carga. Sai quando os agentes de IA estiverem ativos e preenchendo os
   > campos. Não é política: o I5 continua valendo — todos os leads vão ao CRM."*
3. **Filtro temporário sem condição de saída escrita vira permanente.** É o motivo do item 2.

**Nada se perde:** os leads abaixo de 60 continuam na planilha (dono **P2**) e entram quando o corte
sair — com o lote certo (`PROSP-<mês da extração>`), porque o lote vem do **dado**, não do relógio.

**Sugestão prática:** para conferir layout **não precisa subir todos**. 10–20 leads já mostram como a
tela fica. Suba um lote pequeno, olhe, ajuste o módulo se for o caso, e só então suba o resto —
descobrir um problema de layout com 20 leads é bem mais barato que com 300.

**Dois detalhes do filtro que precisam de regra explícita:**

| Caso | Regra |
|---|---|
| Lead **sem** `potencial_comercial` (ainda não pontuado) | **não passa.** Vazio não é 0 e não é ≥60 (**I3**) |
| Lead **já no CRM** (`id_crm` preenchido) que caiu para 50 | **continua sendo atualizado.** O filtro gateia a **criação**, não a atualização — senão o vendedor fica olhando dado velho na tela |

## 3. Pré-requisitos

- ✅ **`gbp_place_id` existe** no módulo `phi_crm`, com constraint `UNIQUE`. O bloqueio registrado no
  ADR-36 §3 **está resolvido** — confirme na instalação antes de confiar.
> ## ✅ Verificação executada em 2026-09-13 (R6 — o dado vence o plano)
>
> **1. A credencial Odoo JÁ EXISTE.** `Odoo (API Key) account user n8n@` (`YJBRNdCvPaSiUoep`, tipo
> `odooApiKeyApi`), com o usuário-bot, exatamente como o brief pediu. **Este item não é mais
> bloqueio.** (Cuidado: o filtro `query` do `list_credentials` **não** a encontra por "odoo" — só a
> listagem completa. Não conclua que não existe a partir do filtro.)
>
> **2. O nó Odoo nativo cobre o que precisamos — com evidência, não memória.** Lendo os tipos:
> `opportunity/getAll` aceita `filters.filter[]` com `fieldName` vindo de `getOpportunityFields`,
> operador `equal` — ou seja, **busca por `gbp_place_id` funciona** (I4). `create` e `update` usam
> `fieldsToSend`, um **resource mapper** que carrega o schema do próprio `crm.lead`. **Não precisa de
> HTTP Request contra XML-RPC.**
>
> **3. Chamei `getOpportunityFields` ao vivo na instância.** Confirmado presente: `gbp_place_id`
> (char), `gbp_diagnostico` (selection), `gbp_score_atualizado_em` (**date**), as 6 dimensões e as 6
> bandas, `gbp_potencial_comercial`, `gbp_oferta_recomendada`. **O módulo publicado está em dia com o
> repositório.** O pré-requisito do ADR-36 §3 está resolvido de fato, não só no papel.
>
> **4. Achado novo — `won_status`.** O `crm.lead` do Odoo 19 tem um campo nativo `won_status`
> (selection). Para o §7.3 do brief, ele é **melhor que inferir o desfecho pela probabilidade do
> estágio**. Use-o.
>
> **5. O estágio não precisa ser escrito.** O `stage_id` do Odoo é computado com `precompute=True`:
> um lead criado sem `stage_id` **cai sozinho no primeiro estágio**. Isso satisfaz o §4.5 do brief
> **sem** escrever no campo — o que é mais fiel ao guardrail-mãe do que escolher o estágio "certo".
>
> **6. O PROSP-06 — diagnóstico corrigido, são DUAS causas, não uma.** O brief pergunta se ele parou
> de escrever desde a renomeação. Lendo a execução `38824` (13/09 21:00):
> - o cursor está **congelado em 2026-09-08T21:00Z**;
> - o nó do HubSpot devolveu **`[]`** — zero deals modificados;
> - o nó do Sheets **nem executou**, e por isso o cursor nunca avança.
>
> Ou seja: **(a)** entre 28/08 e 08/09 ele achava deals e a escrita falhava calada pelo nome de coluna
> (`onError: continueRegularOutput`); **(b)** de 08/09 para cá não há mais fonte nenhuma — os leads
> pararam de ir para o HubSpot. As 60 execuções marcadas "success" são as duas doenças somadas.
> **Consequência para o trabalho:** apontar o P6 para o Odoo resolve (b); renomear as colunas resolve
> (a). **Fazer só um dos dois deixa o buraco aberto.**
>
> **Ainda aberto:** os nomes exatos do cabeçalho da planilha (não tenho acesso a ela), se o Olavo já
> cadastrou Meio/Origem à mão no Odoo, e as decisões do §5.

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
  colunas novas). Commit no git. *Se não está escrito, não aconteceu.*
  **Sem ADR do I5** — o filtro é temporário e o invariante não muda (§2).
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

- **Desligar o HubSpot** · **migrar histórico** (F5) · mexer na frente do Score/BigQuery (ADR-38).
