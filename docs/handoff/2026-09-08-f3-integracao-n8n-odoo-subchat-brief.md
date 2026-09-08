# [BRIEF sub-chat] F3 — Integração n8n ↔ Odoo (inclui a carga inicial dos leads)

> **Como usar:** sessão nova, cole este arquivo como 1ª mensagem. Auto-contido. **Modelo:** Opus.
> **Repo:** `olavofranzin/phi` · **Branch:** `claude/consolidacao-2026-08`
> **Leia junto:** `CLAUDE.md` (regras R1–R6) · `ADR-35` · `ADR-36` · `CONTRATO-PROSPECCAO.md`
> **Português simples com o Olavo. Antes de mudança grande: explicar e esperar OK.**

---

## 0. Missão

Fazer o **CRM novo (Odoo) receber os leads** — tanto os que já existem na planilha quanto os novos,
daqui pra frente. Concretamente:

1. **`PROSP-05`** passa a criar/atualizar **`crm.lead` no Odoo** (hoje escreve deal no HubSpot).
2. **`PROSP-06`** passa a **ler do Odoo** para trazer o desfecho de volta à planilha.
3. **Carga inicial** dos leads que já estão na planilha.

Isto é o **F3** do plano do Odoo **e** a pendência **P-5** do ADR-35 — o mesmo trabalho visto dos
dois lados. Fecha 4 dos 14 critérios do v1 (**B1, B2, B3, B4**) e está no **caminho crítico até 30/11**.

## 1. 🔴 A regra que define o desenho inteiro

> **A carga inicial usa o MESMO caminho do fluxo contínuo: o próprio `PROSP-05`, em modo backfill.**
> **NÃO escreva um script/workflow separado de "upload".**

Um uploader à parte criaria **um segundo writer no `crm.lead`** — violando o invariante **I8**
(*só o `PROSP-05` escreve no CRM*) **no primeiro dia do CRM novo**. Seria repetir no Odoo o problema
que o ADR-37 está desfazendo no BigQuery, onde dois writers na mesma tabela custaram semanas.

Se o `PROSP-05` não der conta do backfill, **conserte o `PROSP-05`** — não crie um paralelo.

## 2. ⚠️ Pré-requisito — não comece sem isto

**O módulo `phi_crm` precisa ter `place_id` com índice e restrição de unicidade** (ADR-36 §3).
Sem ele, o `PROSP-05` teria que procurar o lead **pelo nome** no Odoo — que é o defeito que gerou os
deals duplicados no HubSpot e obrigou a construir um deduplicador (**invariante I4: nome nunca é
chave**).

Está sendo feito pelo **sub-chat do módulo `phi_crm`**. **Confirme que está publicado antes de
escrever qualquer integração.** Teste: criar dois leads com o mesmo `place_id` — o segundo tem que
ser recusado pelo banco.

## 3. 🔴 Dívida herdada que ESTE sub-chat tem que pagar (ADR-36 §4.4)

O Olavo **já renomeou** as colunas da planilha (`hubspot*` → `crm*`), mas **os workflows não foram
ajustados** — a correção foi adiada de propósito para ser feita agora, junto com a troca do nó.

| Item | O quê |
|---|---|
| `PROSP-05` | passar a gravar **`id_crm`** (não `id_hubspot`) |
| `PROSP-06` | atualizar os nomes das 17 colunas de aprendizado para o padrão `crm*` |
| Planilha | conferir se surgiram **colunas duplicadas** desde a renomeação e limpar |

⚠️ **PRIMEIRA COISA A CONFERIR (pode estar perdendo dado agora):** o `PROSP-06` roda **a cada 6 h**
escrevendo em colunas que talvez não existam mais. Verifique se o **loop de aprendizado parou** —
sinal: `data_sync_crm` (ou equivalente) sem avançar, ou coluna duplicada na planilha.
Isto derruba o critério **A3** do v1 e cada dia parado é desfecho perdido da base de treino.

## 4. O destino — o que já existe no Odoo

Módulo **`phi_crm`** instalado e aprovado em 8 testes de aceite (2026-09-08).
Código em `docs/comercial/odoo/addons/phi_crm/`.

- **Modelo:** `crm.lead` estendido. **Nunca** `res.partner` — invariante **I11**: lead é sempre lead;
  empresa só nasce quando vira cliente (pós-venda).
- **Estágios (6):** `Prospeccao` · `Aguardando Aceite` · `Em Cadencia` · `Conversa Aceita` ·
  `Escopo e Proposta` · `Ganho` (`is_won`). **"Perdido" não é estágio** — usa o **Lost nativo**
  (`lost_reason_id`).
- **Campos de scoring:** `gbp_potencial_comercial`, `gbp_oferta_recomendada`, `gbp_ipc`,
  `gbp_score_tecnico`, 6 × `gbp_dim_*` (+ `_banda`), `gbp_nao_reivindicado`, `gbp_site_tipo`,
  `gbp_flags_score`.
- **Campos de IA (textões):** `ia_analise_gbp`, `ia_analise_site`, `ia_analise_instagram`,
  `ia_abordagem_sugerida`, `ia_proxima_acao_recomendada`, `ia_dados_enriquecimento`, `followup`.
- **Governança:** `lead_status`, `motivo_rejeicao_mql`, `data_primeiro_contato`,
  `tentativas_contato`, `proxima_acao_data`, **`proxima_acao_aceite`** (o "play" do humano).

**API:** o Odoo usa **XML-RPC / JSON-RPC** (não é REST como o HubSpot). É trabalho de integração
real — consultar a documentação oficial do Odoo 19 (Context7 `/odoo/odoo`, branch 19.0) e
**validar contra a fonte, não chutar**.

## 5. Ordem de execução sugerida

| # | Etapa | Observação |
|---|---|---|
| 0 | Confirmar `place_id` publicado (§2) | bloqueia tudo |
| 1 | Diagnosticar a dívida dos nomes de coluna (§3) | pode estar perdendo dado **agora** |
| 2 | `PROSP-05` → Odoo: buscar por `place_id`, reusar se existir, criar se não, gravar `id_crm` | I4 + I8 |
| 3 | **Smoke com 1 lead real** antes de qualquer lote | |
| 4 | **Carga inicial** pelo próprio `PROSP-05`, em **dry-run primeiro** | §1 |
| 5 | `PROSP-06` → ler do Odoo, escrever as 17 colunas com os nomes novos | I8: só lê o CRM |
| 6 | Rodar **em paralelo** com o HubSpot e conferir o loop (`acerto_previsao`) | decisão C3 do ADR-36 |

### 5.1. ⚠️ Sequência que evita duplicata (decisão de arquitetura)
A planilha (~353 linhas) é **superset** dos ~141 deals do HubSpot. Portanto:
1. **Primeiro** carregue a partir da **planilha** (é ela que tem `place_id`, a chave).
2. **Depois**, o **F5** vira *"enriquecer os leads já criados com o desfecho do HubSpot"* (estágio,
   motivo de perda, datas), casando por `id_hubspot` — **não** *"criar leads a partir do HubSpot"*.

Invertendo a ordem, criam-se ~141 duplicatas. **O F5 é fase seguinte — não faça neste sub-chat.**

## 6. Guardrails (não-negociáveis)

- **I8** — o `PROSP-05` é o **único** que escreve no CRM. O `PROSP-06` **só lê**.
- **I4** — chave é `place_id`. **Nome nunca é chave.**
- **I11** — só `crm.lead`. Nada de criar `res.partner`.
- **A IA nunca move estágio nem fecha.** O lead nasce em `Prospeccao`; `proxima_acao_aceite` nasce
  `pendente` e **só o humano** muda. Nunca escrever won/lost automaticamente.
- **I3 / N/D honesto** — campo não observado grava **vazio**, nunca `0` ou `false`.
- **I7 / ADR-003** — não recalcular score. Os campos `gbp_*` vêm prontos do pipeline.
- **Dry-run antes de qualquer escrita em lote.** Sem OK do Olavo, nada de carga real.
- **R6** — antes de ação irreversível, **verifique a premissa**, mesmo que o plano já esteja aceito.
  Foi o que salvou o ADR-37 de quebrar a Fase 3.

## 7. Verificação (descrever ANTES de executar — regra do CLAUDE.md)

1. `place_id` duplicado é **recusado pelo banco**.
2. Um lead da planilha vira **exatamente um** `crm.lead`, no estágio `Prospeccao`, com os campos
   `gbp_*` preenchidos e `proxima_acao_aceite = pendente`.
3. **Rodar o `PROSP-05` duas vezes no mesmo lead não cria um segundo** (reuso por `place_id`).
4. O `id_crm` volta para a planilha, na coluna certa, **para todos os leads do lote** (não só o 1º —
   foi o bug do `executeOnce`).
5. O `PROSP-06` traz o estágio do Odoo e escreve nas colunas `crm*` **sem criar linha nova**.

## 8. Registro obrigatório (R2 · R3 · R5)

- **Notion (R3):** DB "PHI — Registro de Execuções (Sub-chats)" (`8d8eb685f66249c7ba4f298d744feec3`)
  — ao **começar** e ao **encerrar** cada bloco. O digest das 08:30 depende disso.
- **Git (R2):** execution-log em `docs/handoff/<data>-f3-<etapa>-execution-log.md` + atualizar o
  **PAINEL** (`ESTADO-DO-PROJETO.md` §0) e os critérios **B1–B4** da `DEFINICAO-DE-PRONTO-PHI-V1.md`.
- **Descrição fiel (R5):** todo workflow que você tocar sai com `description` dizendo **o que faz** e
  **por que existe / o que substituiu**. Descrição copiada é bug.
- **ADR-36** ganha o as-built quando o reapontamento estiver de pé.

## 9. Fora de escopo (não faça aqui)
**F5** (migrar o histórico do HubSpot) · **F4** (e-mail/WhatsApp) · **F6** (BI) · desligar o HubSpot
(só depois de 1 ciclo em paralelo — decisão C3) · qualquer coisa na frente dos **writers/BigQuery**.

## 10. R4 — a pergunta de fecho
> *"Onde estamos, quanto falta, e o que eu atualizei para provar isso?"*
