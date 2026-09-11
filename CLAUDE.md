# PHI™ — Contexto para Claude Code

> Leia este arquivo antes de qualquer implementação. É a fonte de contexto mínimo para agir corretamente neste repositório.
> Para documentação completa, consulte o Notion (links ao final).

---

## O que é o PHI

Sistema automatizado de monitoramento e gestão de campanhas de tráfego pago (Google Ads e Meta Ads). Calcula diariamente um score de saúde por campanha (0–100), classifica em EXCELLENT / GOOD / WARNING / CRITICAL e aciona tarefas operacionais com checklists no Notion.

**Princípio central:** O PHI detecta desvios e orienta o gestor — nunca executa otimizações automaticamente.

---

## Frente estratégica ativa: Otimização (cérebro de análise — "Módulo 28" / T28)

> Camada de **análise cognitiva** sobre o score: o "cérebro" (Maestro + especialistas)
> que traduz o PHI·Mídia Score em **diagnóstico + decisão recomendada** — o humano dá o
> "play". Design canônico em **Git** (`docs/strategic-planning/`); estado operacional em
> **Notion**. Complementa o contexto de pipeline abaixo.

- **Ler primeiro (git):** `docs/strategic-planning/ESTADO-DO-PROJETO.md` (doc mestre,
  snapshots datados) · `docs/strategic-planning/MAPA-DE-DOCUMENTACAO.md` (navegação) ·
  `docs/strategic-planning/roster-de-agentes.md` (agentes, staging E0→E3) ·
  `docs/modulo-28-analise-cognitiva.md` (os 7 prompts: Maestro + 6 especialistas) ·
  `docs/strategic-planning/saude-digital/adr-rascunhos/` (ADRs de design).
- **Workflow n8n:** `WF-T28-Analise-Campaign` (`fhYmJH0o9BW1IO4i`). Diagnóstico (Agente 3)
  **vive**; **Maestro (E1) no rascunho**, não ativado — ver **ADR-28**.
- **DB de entrega:** `PHI - ANÁLISES` (`38fb65e5-c72b-80db-a425-e5939fc35c7a`).
- **Credencial LLM:** `Anthropic account` (`YifaYCQuGWjdd1Oh`) — existe; confirmar binding
  nos nós + smoke antes de ativar.
- **Guardrails de dado (BLOCO COMUM, regras 8/9):** `conversions=0 ⇒ CPA/ROAS indefinidos`
  (nunca "cpa 0 = ótimo"); `source_status error/missing ⇒ N/D` (não 0).
- **Autoridade do score (ADR-003):** não recalcular `phi_value`/flags/severidade — são fato.
- **Memória de Decisão:** design → ADR (git); execução → Ledger "PHI — Registro de
  Execuções" (Notion, ADR-32).
- **Disciplina de token:** validar prompts pela skill `phi-diagnostico` (`.claude/skills/`,
  byte-idêntica ao nó vivo) com payload real no chat **antes** de gastar token no n8n; não
  ativar/executar workflow sem OK de budget do Olavo.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Data Warehouse | BigQuery — projeto `project-0e7c58d4-656f-49e8-807`, dataset `phi_prod` |
| Orquestração | n8n self-hosted v2.15.0 — `https://n8n-n8n-editor.1unqx7.easypanel.host` |
| Interface Operacional | Notion |
| Fonte de Dados | Google Ads API v23, Meta Ads API |
| Service Account | `phi-workflow-sa@phi-production-488720.iam.gserviceaccount.com` |

---

## Notion — IDs dos Databases

| Database | ID |
|----------|-----|
| Campanhas | `19fb65e5-c72b-8043-a82d-f47ede397928` |
| Tasks | `19fb65e5-c72b-812d-a734-de9a4d5b980f` |
| Checklist | `19fb65e5-c72b-81cd-b006-fe0ffa97a35d` |
| Log de Otimizações | `19fb65e5c72b81068e76f1e684197316` |
| Projetos | `19fb65e5-c72b-81ae-847c-e0b6b2888b6b` |
| Clientes | `19fb65e5-c72b-8147-8aa3-c63aa273d205` |
| Observações Diárias | `19fb65e5-c72b-8192-8f73-ff7f500a0972` |

---

## BigQuery — Tabelas Principais (`phi_prod`)

| Tabela | Papel |
|--------|-------|
| `raw_campaign_data` | Dados brutos diários por campanha (partição por `date`) |
| `phi_score_history` | Histórico de scores calculados (MERGE obrigatório) |
| `phi_score_current` | VIEW — score mais recente por campanha |
| `client_config` | Configuração por cliente |
| `model_config` | Pesos e limiares por modelo de negócio |
| `client_goal_history` | Histórico de metas por cliente |
| `workflow_execution_log` | Log de execuções por fase |

---

## VERIFICAÇÃO 
Antes de finalizar QUALQUER tarefa:
1. Descreva como você vai verificar se o resultado está correto.
2. Antes de me responder qualquer coisa, siga estes 4 passos internamente:
2.1. DECOMPOR — quebre minha pergunta nas partes que precisam de resposta e
separe o que eu afirmei do que ainda é suposição.
2.2. VERIFICAR — cheque a sua resposta em quatro frentes:
• Lógica: as conclusões seguem das premissas?
• Fatos: o que você está afirmando é verificável? O que é estimativa?
• Completude: está faltando responder alguma parte?
• Viés: você está preenchendo lacunas com suposição só pra soar mais
confiante?
2.3. AVALIAR — dê uma nota de 0,0 a 1,0 pra sua confiança na veracidade da
resposta.
2.4. SINTETIZAR — se a nota for menor que 0,8, refaça a resposta até passar.
Ao entregar, marque de forma clara o que é fato verificável, o que é
estimativa e o que você não sabe. Nunca invente número, fonte, citação ou
dado pra preencher lacuna. Se não souber, diga "não sei" ou "não tenho
como confirmar".
---

## Regras Críticas de Implementação

1. **BigQuery:** SEMPRE usar `dataset.table` sem project ID entre backticks — ex: `phi_prod.raw_campaign_data`
2. **Nodes INSERT/MERGE:** `Always Output Data = true` obrigatório
3. **`primary_metric_goal`** = FLOAT64 (valor numérico ex: `5.20`). **`primary_metric_type`** = STRING (ex: `'CPA'`)
4. **`client_id`** = `CLI-4` (identificador). **`client_slug`** = `KIL` (sigla 3 letras). São campos diferentes
5. **splitInBatches v3:** branch 0 = done (dispara uma vez, ao fim), branch 1 = loop (dispara a cada item). O último node do corpo do loop DEVE reconectar ao splitInBatches, senão só o 1º item é processado. (Confirmado no SDK n8n: `.onDone` = saída 0, `.onEachBatch` = saída 1.)
6. **IF nodes:** branch 0 = TRUE, branch 1 = FALSE
7. **Conexões no JSON n8n:** usar NOMES dos nodes como chaves, não UUIDs
8. **Queries dinâmicas:** montar SQL no Code node, nunca usar `{{ }}` dentro da query BigQuery
9. **`phi_score` e `Score Diário`** no Notion: escritos pelo PHI após Fase 2 — nunca pelo Daily Entry
10. **PHI não executa otimizações** — detecta, classifica e orienta
11. **Ordem da Fase 3 é imutável:** Fechamento → Escalada → Abertura
12. **Google Ads API:** `developer-token` deve estar no header — NÃO é injetado automaticamente pelo `googleAdsOAuth2Api`
13. **Google Ads API v23:** `metrics.cost_per_conversion` é incompatível com `segments.conversion_action_name/category`
14. **Token Hardcoded no n8n:** o n8n self-hosted não permite que o token seja inserido uma credencial ou variável

---

## Cliente de Referência para Testes

| Campo | Valor |
|-------|-------|
| Cliente | KIL |
| `client_id` | `CLI-4` |
| `client_slug` | `KIL` |
| Campanha Barbearia | `GADS-21149189736` |
| Campanha Salão | `GADS-21116045403` |

---

## Repositório GitHub

- **Repo:** `olavofranzin/phi`
- **Branch de desenvolvimento:** `claude/create-phi-folder-n2RXF`
- **Branch principal:** `main`
- **Pasta de análises:** `relatorios_api/google_ads/`

---

## Documentação Completa no Notion

| Documento | ID Notion |
|-----------|-----------|
| Documentação Técnica v1.4 | `328b65e5-c72b-8103-9ad0-d2fb81dd8055` |
| Arquitetura de IA & Análise de Dados | `342b65e5-c72b-81f8-a05e-dfe05e564105` |
| Google Ads Insights Semanal — Spec Técnica | `342b65e5-c72b-8177-9982-c5f012c8f006` |
| Sessão Handoff 08/04/2026 | `33db65e5-c72b-81e0-87c2-f63523db3906` |
| Sessão Handoff 06/04/2026 | `33ab65e5-c72b-8117-b67e-d29f4ca88fb6` |
| SQL de Validação v1.4 | `335b65e5-c72b-814f-95e2-d57a18d96458` |
| SOP, Glossário e Definições | `328b65e5-c72b-81d8-a25b-c83921610282` |

---

## Regras que você deve seguir

### Comunicação
- Fale comigo sempre em português, de forma simples e sem jargão.
- Antes de mudar algo grande, me explique o plano e espere eu aprovar.
- Prefira a solução mais simples que resolve. Nada de complicar sem motivo.

### R1 — Seu papel no chat-mãe é PLANEJAMENTO ESTRATÉGICO, não execução
Este chat é o **chat-mãe**: estratégia, arquitetura, decisão, priorização, ADR, roadmap.
**Execução longa vai para sub-chat** — construir workflow, escrever módulo, depurar infra,
mexer em servidor, caçar bug.

**Como agir:**
- Tarefa de execução com mais de ~3 passos, ou que exija ler muitos arquivos/logs/telas →
  **PARE. Escreva o brief** (`docs/handoff/AAAA-MM-DD-<tema>-subchat-brief.md`) e **devolva o
  brief**. Não execute aqui.
- Se já gastou **várias rodadas em troubleshooting**, isso por si só é o sinal: diga
  explicitamente "isto virou execução, deveria ser sub-chat" e proponha a migração.
- **Fica no chat-mãe:** decisão, ADR, priorização, roadmap, leitura de estado, revisão de plano,
  desenho de arquitetura e escrita de brief.

> **Motivo:** quando a execução mora aqui, o contexto lota de detalhe operacional e **o
> planejamento — que é o que só este chat faz — se perde.**

### R2 — Etapa concluída = documentação atualizada NA MESMA SESSÃO
**Nenhuma etapa é "concluída" enquanto a documentação não refletir isso.** Ao terminar uma entrega:
1. Atualizar o **doc canônico** da frente (ADR / contrato / spec).
2. Registrar o **as-built** quando o real divergir do planejado — **o real vence o plano**.
3. Pôr **banner de HISTÓRICO** no topo de todo doc que virou retrato de um momento passado.
4. **Commit no git.**

> **Motivo:** em 2026-09-08 descobrimos que a doc da Prospecção descrevia workflows que já não
> existiam havia semanas — e por isso não sabíamos que a frente estava praticamente pronta.
> **Doc desatualizada custa mais caro que doc inexistente: ela faz decidir errado.**
> Regra curta: **se não está escrito, não aconteceu.**

### R3 — Sub-chat é OBRIGADO a registrar no Notion (senão o digest diário morre)
Existe um workflow n8n **ativo**: `PHI — Digest Diário de Progresso (Registro de Execuções)`
(`rhobbBEeQaiWIuiF`, 08:30 BRT). Ele lê a DB Notion **"PHI — Registro de Execuções (Sub-chats)"**
e manda o andamento do projeto no Telegram do Olavo.
**Hoje ele avisa "sem progresso" — não porque nada anda, mas porque ninguém escreve na DB.**

**Todo sub-chat DEVE**, ao **começar** e ao **encerrar** cada bloco de trabalho, criar/atualizar
uma linha na DB com: **frente · o que foi feito · estado** (em andamento / concluído / bloqueado)
**· próximo passo · link do artefato**. Sem isso o Olavo perde a visão do projeto. (Ver ADR-32.)

### R5 — Todo artefato carrega a própria história (descrição fiel)
A **descrição** de um workflow (n8n), módulo ou tabela deve dizer, em duas frases: **o que ele faz**
e **por que existe** — incluindo **o que ele substituiu e por quê**.

- Ao criar ou alterar um artefato, **atualize a descrição na mesma sessão**.
- **Descrição copiada de outro artefato é bug** (foi o caso de 3 workflows da Prospecção).

> **Motivo:** em 2026-09-08 a auditoria por inventário **não descobriu** que o `Daily Entry` tinha
> sido desativado **porque** o `sw metricas campanhas` entrou no lugar. Isso só existia na cabeça do
> Olavo. **Inventário pega estrutura; intenção só existe se alguém escrever.**
>
> Teste prático: **se a auditoria semanal precisa perguntar ao Olavo para entender, a descrição
> falhou.** (Generaliza o invariante I10 do ADR-35 para o projeto inteiro.)

**Procedimento canônico de aposentadoria** (precedente `[APOSENTADO 2026-07-21] PHI - Loop Alerta
Fase 1` — o único workflow do parque que hoje passa no teste da R5):
1. consolidar a função no workflow que fica; 2. **desabilitar o nó chamador**; 3. desativar o
workflow; 4. **renomear com o prefixo `[APOSENTADO <data>]`**; 5. sticky note dizendo **por que** e
**proibindo reuso**. Nunca apagar sem esses 5 passos — o nome e o sticky são a memória.

### R6 — Plano aceito não dispensa verificação (o dado vence o plano)
Antes de uma ação **irreversível ou em produção**, **verifique a premissa que a justifica** — mesmo
que o plano já esteja **aceito** num ADR. Se o dado desmentir o plano:
**pare, não execute, corrija o ADR e registre o porquê.**

> **Motivo:** em 2026-09-08 a **Fase 0.2 do ADR-37 foi cancelada na hora de executar**. O inventário
> tinha visto "dois workflows escrevem o mesmo campo" e chamado de conflito; a leitura do fluxo,
> feita antes de desabilitar qualquer nó, mostrou **três transições distintas** — e que executar o
> plano teria **quebrado a Fase 3** (Regra Crítica nº 11: a ordem é imutável). Nada foi desabilitado.
>
> **Executar um plano aceito que o dado já desmentiu é o pior dos dois mundos** — tem a autoridade do
> ADR e a consequência do erro.
>
> **Corolário:** **hipótese desmentida também se registra.** Se a refutação não for escrita, a
> próxima auditoria levanta o mesmo alarme e o trabalho se repete.

### R4 — Uma pergunta que todo chat responde antes de fechar
> *"Onde estamos, quanto falta, e o que eu atualizei para provar isso?"*
Se não souber responder, a etapa não acabou.

---

# RTK - Rust Token Killer

**Usage**: Token-optimized CLI proxy (60-90% savings on dev operations)

## Meta Commands (always use rtk directly)

```bash
rtk gain              # Show token savings analytics
rtk gain --history    # Show command usage history with savings
rtk discover          # Analyze Claude Code history for missed opportunities
rtk proxy <cmd>       # Execute raw command without filtering (for debugging)
```

## Installation Verification

```bash
rtk --version         # Should show: rtk X.Y.Z
rtk gain              # Should work (not "command not found")
which rtk             # Verify correct binary
```

⚠️ **Name collision**: If `rtk gain` fails, you may have reachingforthejack/rtk (Rust Type Kit) installed instead.

## Hook-Based Usage

All other commands are automatically rewritten by the Claude Code hook.
Example: `git status` → `rtk git status` (transparent, 0 tokens overhead)

Refer to CLAUDE.md for full command reference.
   
---

*PHI™ v1.5 — Atualizado em 27/07/2026. Adendo 2026-07-31: frente Otimização/T28 (cérebro de análise) — ver `ESTADO-DO-PROJETO.md` (snapshot 2026-07-31) + ADR-28.*
