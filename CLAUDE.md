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

## Por onde começar, por assunto

| Se a conversa é sobre… | Leia primeiro |
|---|---|
| **Onde o projeto está** | `docs/strategic-planning/ESTADO-DO-PROJETO.md` (§0 PAINEL) |
| **Quanto falta para acabar** | `docs/strategic-planning/DEFINICAO-DE-PRONTO-PHI-V1.md` |
| **Achar qualquer documento** | `docs/strategic-planning/MAPA-DE-DOCUMENTACAO.md` |
| **Prospecção** (leads, GBP, planilha, CRM) | `docs/strategic-planning/prospeccao/CLAUDE.md` |
| **Score de mídia** (campanhas, BigQuery) | `docs/strategic-planning/saude-digital/` + ADR-37/ADR-38 |
| **CRM Odoo** | skills `phi-odoo-crm` e `odoo-19-dev` |
| **Procedimentos da agência** (quem faz o quê, entrega, atendimento) | **Miro — `Board Agência`** · `https://miro.com/app/board/uXjVHecmR7c=/` |

> **O `Board Agência` é o mapa da OPERAÇÃO, não do software.** *"Planejamento Estratégico Para Criação
> De Procedimentos Em Áreas De Uma Agência"* — mapa mental com ~250 blocos, organizado por **área**
> (Comercial, Operações, Atendimento) e seus **procedimentos**: *Passagem de Bastão entre Comercial e
> Operações · Planejamento de Entregas · Pontos de Contato · Plantão de Dúvidas · Monitorar a Adoção ·
> Responsáveis*. ⚠️ Existe uma `Cópia de Board Agência` — **não é a vigente**.
>
> **São dois eixos, não confundir:** frente de **software** mora em `docs/strategic-planning/<frente>/`;
> **área da agência** é o board (e, quando for para o git, `docs/operacao/<area>/`).
> **Consulte-o antes de planejar qualquer coisa que envolva o depois da venda** — em 2026-09-15
> descobrimos que ele já previa a passagem de bastão que o plano da Prospecção tinha deixado sem dono.

> ⚠️ **Dois scores diferentes, não confundir:** `phi_value` (saúde da **campanha**) e
> `potencial_comercial` (qualidade do **lead**). Frentes, donos e ADRs distintos.

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

> 🔴 **5. Marque ONDE SE PROCURA, não só onde se narra.** Tabela do topo, checklist, placar. **O
> corpo do documento não substitui o cabeçalho** — ninguém lê §14 a §19 para saber se uma etapa
> aconteceu; lê a primeira tabela.
>
> **Motivo:** em 2026-09-18 descobrimos que o **ADR-38 estava executado desde 09/09** — as 7 etapas,
> inclusive a destrutiva. O corpo do ADR narrava tudo. Mas o **cabeçalho** ainda dizia *"Data efetiva
> do corte: ⬜ ainda não ocorreu"* e o **checklist do brief** estava todo em branco, **nove dias
> depois**. Custou: uma frente parada como "bloqueada" sem estar, uma rotina agendada, e uma sessão
> inteira de conferência.
>
> **Um documento pode estar completo no corpo e mentir no cabeçalho — e o cabeçalho é o que se lê.**

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

### R7 — Nada se cria sem plano pronto. E todo plano começa procurando o que já existe
**Antes de construir qualquer coisa nova** — workflow, skill, agente, coluna, tabela, pasta — **tem de
existir um plano escrito e aprovado pelo Olavo.**

E **em cada etapa do plano**, antes de propor construir, responder por escrito:
1. **Existe skill instalada** que já faz isso? (`ListSkills` / `SearchSkills` — não confie na memória)
2. **Existe workflow** que já faz? **Existe coluna** que já guarda?
3. Se procurei e **não existe**, **registrar que procurei** — senão a próxima sessão procura de novo.

> **Motivo:** é a **R2** e a **R6** aplicadas *antes* do fato, e não depois. Corrigir um plano em texto
> custa minutos; corrigir uma construção custa semanas — foi o que aconteceu com o `1º Enriquecimento`,
> com o `id_hubspot` e com as 6 dimensões do score. **O caro nunca foi construir: foi construir o que
> já existia, ou o que não podia ser auditado depois.**

### R8 — Skill primeiro; subagente é a exceção
**O padrão é a skill** — instrução determinística, versionada em pasta. **Orquestrar vários agentes é
exceção**, reservada a tarefa de alta volatilidade.

| Escolha **skill** quando | Escolha **agente/subagente** quando |
|---|---|
| a tarefa se repete **com a mesma forma** | cada execução é diferente e exige **decidir** |
| é frequente e estruturada | precisa de **humano no loop** antes de publicar |
| você quer previsibilidade e custo baixo | há **paralelismo real** ou depuração ao vivo |

> **Teste prático:** *"se eu escrevesse isso num checklist, outra pessoa executaria igual?"* Se sim, é
> skill. Se a resposta depende de julgamento a cada caso, é agente.
>
> **Motivo:** skill tem carga de contexto baixa e saída previsível; orquestração tem o efeito oposto e
> só se paga quando a tarefa realmente exige autonomia. O `phi-diagnostico` é o exemplo da casa: um
> agente que virou skill e passou a poder ser testado sem gastar token no n8n.

### R10 — Modelo caro só onde há julgamento (escada de modelos)
Tarefa básica usa **modelo rápido e barato**; tarefa que exige **raciocínio e qualidade de entrega**
usa **modelo forte**. Escolher o modelo é decisão de arquitetura, não detalhe.

| Camada | Para quê | O que usamos hoje |
|---|---|---|
| **Rápido / barato** | extrair, estruturar, classificar, formatar, redigir com molde pronto | **Gemini Flash** (`gemini-2.5-flash`) na cadeia de enriquecimento |
| **Forte** | diagnosticar, decidir, priorizar, escrever abordagem, planejar | **Claude Sonnet 5** no nó de Diagnóstico (T28) · **Opus 5** no planejamento |

> **A regra é do degrau, não da marca.** Escreva "camada rápida" e "camada forte" — nunca prenda a
> regra ao nome de um fornecedor. Modelo troca de nome e de preço a cada poucos meses; **o degrau
> permanece.** É a mesma lição do `id_crm` e do `campaign_id` sem prefixo: **não grave no nome o que
> pertence a outro campo.**
>
> **Teste prático:** *se a resposta certa está determinada pelo dado de entrada, é camada rápida. Se
> duas pessoas competentes responderiam diferente, é camada forte.*
>
> ⚠️ **Antes de trocar de modelo para economizar, meça.** Custo estimado no papel já nos levou a
> discutir soluções trabalhosas para economizar valor que ninguém tinha medido.

### R9 — A ordem do trabalho: alinhar → planejar → isolar → revisar
1. **Entrevista de alinhamento antes do primeiro token de execução.** Perguntar até a ambiguidade
   acabar. Ambiguidade não resolvida vira retrabalho, não vira criatividade.
2. **Plano barato antes da construção** (é a **R7**).
3. **Contexto isolado por camada** — cada sub-chat com o seu (é a **R1**).
4. **Quem revisa não é quem executou**, e o critério de aceite é **escrito antes**. Reprovou, volta com
   relatório do defeito. **Limite de 3 voltas** — na terceira, o problema é o plano, não a execução.

> ✅ **Praticado pela 1ª vez em 2026-09-16** (PROSP-05/06): 11 critérios de aceite escritos antes de
> construir.
>
> ⚠️ **E a lição de quem escreve o brief — minha:** a entrevista de alinhamento **viaja junto com o
> brief de construção**, nunca depois. Em 16/09 pedi a entrevista a um sub-chat que construía desde
> 13/09; quando ela chegou, quatro das nove perguntas **já tinham sido respondidas por incidente**.
> **Entrevista atrasada não é entrevista — é autópsia.**

### R11 — Sucesso silencioso é o modo de falha desta casa
**Nó que roda verde fazendo o contrário do que o nome diz** já nos custou caro **cinco vezes**:

| Caso | O que parecia | O que era |
|---|---|---|
| `onError: continueRegularOutput` no P5/P6 | tudo certo | **duas semanas** escrevendo em coluna inexistente após o `id_hubspot` → `id_crm` |
| `Filter` do TMP com operador `notEmpty` e o `60` ao lado | "corta em 60" | **não cortava nada** — entraram leads abaixo do corte |
| `lookupValue` vazio no Google Sheets | "busca 1 lead" | **devolveu a planilha inteira** → smoke de 1 virou escrita em 20 |
| `INNER JOIN` com `client_config` no score | score rodando | **descartava 100%** das linhas de um writer |
| `Loop Over Items` posto para conter a cota no P6 | "agora vai de pouco em pouco" | **o que custava ficou dentro do loop** — mesmas ~100 leituras, agora com espera no meio |

**As quatro regras que saem daí:**
1. 🔴 **A falta de critério nunca pode significar "todos".** Filtro sem valor, busca sem chave, lote
   sem limite → o fluxo **para**, não processa tudo. Use uma chave impossível (`__SEM_VALOR__`) em vez
   de deixar vazio.
2. **`onError: continueRegularOutput` só com destino visível para o erro** — coluna, alerta, tabela.
   Erro que só existe no log de execução **não existe**.
3. **Nó do n8n roda uma vez por item de entrada.** Chamada cara com muitos itens na entrada é
   **multiplicação**, não leitura. E **loop não conserta cota se o que custa ficou dentro dele** —
   antes de bater lote, pergunte o que está sendo repetido.
4. **Antes de chamar algo de "smoke", conte quantos itens entraram na fila.** Afirmar escopo sem medir
   é a **R6** quebrada, só que mais rápido.

> **Teste prático:** *"se este nó fizesse silenciosamente o oposto do que eu espero, eu perceberia?"*
> Se a resposta for não, **falta um limite ou um carimbo** — não falta confiança.

### R12 — Configuração mudada para teste volta na mesma sessão
**Estado temporário sem prazo vira estado permanente invisível.** Já nos custou **três vezes**:

| O que foi mudado para testar | O que aconteceu por não voltar |
|---|---|
| `modo: continuo` no `[P5] Config` | o backfill inteiro rodou **carimbado como contínuo** — o campo que existe para dizer que rodada foi aquela registrou o oposto |
| vazão do P6 em **3**, baixada para a estreia | ficou em 3 depois de o motivo acabar; só não custou caro porque alguém reparou |
| `[P5] Entrada` **desabilitado** durante o smoke de 16/09 | a porta pela qual o P4 chama o P5O ficou fechada — e a repontagem do M6 **nunca foi exercida** |

**As duas regras:**
1. **Antes de fechar a sessão, liste o que foi mudado para teste e releia o artefato confirmando que
   voltou.** Voltar se prova **lendo, não lembrando**.
2. **Ao desabilitar algo para testar, a nota ou o sticky diz quando religar.** Nó desabilitado não
   tem cor, não tem alarme e não aparece em lista nenhuma — **é a mudança mais silenciosa que existe
   no n8n.**

> ⚠️ **Ver também a R13:** o que a ferramenta devolve não é necessariamente o que está no ar.

### R13 — Leia o que está NO AR, não o que está na tela
**No n8n, a leitura mais natural devolve o rascunho — e o rascunho é uma proposta, não o sistema.**
Isso já escondeu um caminho de produção quebrado por **dois dias**.

| O que parece | O que é |
|---|---|
| `nodes` no retorno do workflow | **o RASCUNHO.** O que roda está em `activeVersion.nodes` |
| `triggerCount: 0` | conta gatilhos **ATIVOS**, não declarados — workflow inativo com `scheduleTrigger` dentro reporta zero |
| a chamada de update **não deu erro** | o n8n salva o rascunho **e depois** publica. **Publicação recusada deixa a alteração só no rascunho** |

**As duas regras:**
1. **Antes de afirmar o que um workflow ativo faz, compare `versionId` com `activeVersionId`.** Se
   `sameAsDraft` for `false`, **você está lendo uma proposta.**
2. **Depois de alterar workflow ativo, releia e confirme que publicou.** *"Não deu erro"* não é
   *"está no ar"*.

> **Motivo:** em 16/09 o `[P5] CRM-out` do PROSP-04 foi repontado para o Odoo — **no rascunho**. O
> que rodava continuou chamando o P5 do HubSpot, já aposentado, **com
> `onError: continueRegularOutput`**: a próxima prospecção teria alimentado nada e seguido verde.
> Duas leituras do workflow não pegaram, porque as duas leram o rascunho — **e o campo `sameAsDraft:
> false` estava na tela, sem ninguém olhar.**
>
> **Teste prático:** *"eu li o que roda, ou li o que alguém propôs?"*

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
