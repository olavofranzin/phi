# [BRIEF + REGRA] Registro de Execuções dos Sub-chats — RFI de estado atual + protocolo permanente

> **Duplo propósito.** (1) **RFI (pedido de informação):** cada sub-chat/frente reporta AGORA seu estado atual,
> documentos criados e **onde** estão salvos. (2) **Regra permanente:** a partir de agora, **toda vez que um
> sub-chat executa uma tarefa, ele registra no ledger** — para que a verificação de progresso seja diária e
> num só lugar. **Criado:** 2026-07-16. **Motivo:** o levantamento de 2026-07-16 mostrou que os logs de build
> estão espalhados por 3 branches e o doc-mestre (`ESTADO-DO-PROJETO.md`) está ~1 mês atrás do git — falta um
> registro único e cross-branch.

## 0. Onde registrar (o ledger canônico — já existe)
**Notion DB:** `PHI — Registro de Execuções (Sub-chats)`
- Database ID: `8d8eb685f66249c7ba4f298d744feec3`
- Data source (collection): `c884f9df-4daf-4142-a3df-e2bc89642484`
- Local: *Gerenciamento de Documentos → Central de Operações — Agência*.

**Por que Notion e não um `.md` no git:** por ADR-012, Notion é a fonte canônica de **estado operacional**;
git é design/governança. Um ledger no git fragmentaria por branch (o problema que estamos resolvendo). O ledger
é **único e cross-branch**; a **regra** que o governa é versionada aqui no git (este doc).

## 1. A REGRA (permanente, a partir de 2026-07-16)
**Ao concluir (ou pausar/bloquear) qualquer tarefa, o sub-chat DEVE criar uma linha no ledger** — antes de
encerrar a sessão. Uma linha por tarefa/entrega significativa (não por micro-passo). Se a tarefa evolui um item
já registrado, criar **nova linha** (o ledger é append-only; o histórico é o valor). Nunca deixar de registrar
"porque foi pequeno" — foi exatamente assim que se perdeu memória antes.

### Campos da linha (schema do ledger)
| Campo | Como preencher |
|---|---|
| **Tarefa** (título) | frase curta do que foi feito (ex.: "Aplica autonomia do L3 (Schedule + gate só-Deals)") |
| **Frente** (select) | Comercial/GBP · Saúde Digital/Agregador · PHI·Mídia Score · Produto PHI (core) · Onboarding · Execução de Demandas · Priorização · Telemetria · Curador/Docs · Camada de Conhecimento · Meta Ads · Conteúdo · Otimização · Infra/Agentes · Governança |
| **Tipo** (select) | Build · Fix · Design/Brief · Investigação · Doc · Config |
| **Status** (select) | Em progresso · Concluído · Parcial · Bloqueado |
| **Sub-chat / Branch** | branch git (ex.: `claude/...`) e/ou identificador do sub-chat |
| **Artefatos e Local (paths/IDs)** | ⭐ **o mais importante:** TODO artefato com seu endereço — paths de docs no repo, **IDs de workflow n8n**, IDs de página/DB Notion, file_id de planilha, nº de ADR. Sem isto, não se acha depois. |
| **Testado?** | Sim (como/qual execução/ID) · Não · N/A |
| **Próximo passo / Pendências** | o que falta, quem faz |
| **Bloqueadores** | o que trava (dependência, credencial, decisão do Olavo) |
| **Data da execução** | data em que o trabalho foi feito |
| *Atualizado em / Criado em* | automáticos (o ledger carimba) — base da verificação diária |

## 2. RFI — backfill do estado atual (fazer 1 vez, agora)
Cada sub-chat/frente ativa: **crie no ledger uma (ou mais) linha(s)** cobrindo o que já entregou e o estado atual,
com os campos acima — **em especial `Artefatos e Local`** (todos os paths/IDs). Backfill mínimo esperado por frente:
- **PHI·Mídia Score:** estado do fix do score congelado ("50"); versão publicada (`activeVersionId`), branch, o que falta.
- **Saúde Digital / Agregador:** L0–L2 (IDs dos workflows ativos), L3.0 (drafts `8Q5ofmAZju0hTN08`/`fhYmJH0o9BW1IO4i`), o que está em backlog.
- **Comercial/GBP:** motor L1–L4 (IDs), planilha/contrato, loops sync/guarda, card, autonomia. *(já parcialmente semeado — ver §4.)*
- **Meta Ads:** estado do `t28_meta_campaign` (write-path on, fonte off), brief.
- **Onboarding / Execução / Priorização / Telemetria / Curador:** lote atual, workflows ativos (IDs), pendências.
- **Camada de Conhecimento:** DBs (`PHI - Fontes de Conhecimento` `47424c69…`, `PHI - Conhecimento` `7c8e95df…`), estado.

> Regra de honestidade: registrar o **estado real** (inclusive "Bloqueado" / "Parcial" / "não testado"). O ledger
> serve para decidir, não para parecer pronto.

## 3. A verificação diária (o motivo de tudo isto)
Com o ledger populado, roda **1 verificação por dia** que consulta as linhas com **`Atualizado em` nas últimas
~24–30 h** e produz um digest: **por frente, o que mudou**; frentes sem linha nova = **"sem progresso"**; destaca
`Bloqueado`/`Parcial` e pendências antigas. Alimenta a atualização do `ESTADO-DO-PROJETO.md`.
- **Mecanismo (a definir na próxima etapa):** (a) agendamento do Claude que lê o ledger e reporta — *cuidado:*
  MCP autenticado interativamente pode faltar em execução headless; ou (b) workflow n8n agendado que consulta o
  Notion (credencial própria) e manda digest no Telegram + aciona a revisão. Decidir ao criar o agendamento.

## 4. Exemplos já lançados (bootstrap — frente Comercial/GBP, 2026-07-16)
*(Sementes do formato; se a API de escrita estiver bloqueada por aprovação, lançar manualmente ou liberar o tool.)*
| Tarefa | Frente | Tipo | Status | Artefatos e Local | Testado? |
|---|---|---|---|---|---|
| Patch #2 (sync + backup Drive) | Comercial/GBP | Fix | Concluído | WF `WRFU2NM8rLJU7bRT`,`vUI0pPlDASf64Htn`; brief `docs/handoff/2026-07-11-patch-sync-…-brief.md` | Sim (exec 17222; linha 3 = 10) |
| Reconciliação as-built Motor GBP | Comercial/GBP | Doc | Concluído | `docs/handoff/2026-07-13-motor-scoring-gbp-as-built-reconciliacao.md`; WF `dtXFdLAHp7HmUh7o`/`5j79f7oR8x1Nxs4q`/`EFD7Drr0LDMqfDXw`/`5L3SyzDkZqf1N6vW` | Read-only |
| Brief autonomia L3 | Comercial/GBP | Design/Brief | Em progresso | `docs/handoff/2026-07-13-motor-gbp-autonomia-sweep-l3-brief.md`; alvo `EFD7Drr0LDMqfDXw` | N/A |
| Cria ledger + protocolo | Governança | Config | Em progresso | DB `8d8eb685f66249c7ba4f298d744feec3`; este doc | N/A |

## 5. Governança
- **Esta regra deve ser ratificada** como **ADR/SOP** (padrão da casa, como ADR-31) — proponho registrar e o Olavo
  move para Aceito. Enquanto isso, este doc é a fonte da regra e **todo brief novo de sub-chat deve incluir o §1**.
- Ao mudar o schema do ledger, atualizar este doc no mesmo passo (mesma disciplina do Contrato de Dados).

## 6. Âncoras
- Ledger: Notion `8d8eb685f66249c7ba4f298d744feec3` (ds `c884f9df-4daf-4142-a3df-e2bc89642484`).
- Doc-mestre a atualizar a partir do ledger: `docs/strategic-planning/ESTADO-DO-PROJETO.md` (Notion `375b65e5-c72b-8195-9ca6-f9c6d6822b44`).
- Registro de workflows n8n (Notion): `354b65e5-c72b-815b-b166-ff8ea26861ae`.
