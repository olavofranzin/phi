# Auditoria multi-fan-in  2026-06-14

## Sumário
- Total workflows auditados: 10
- AFETADOS: 3
- NÃO AFETADOS: 7
- INCERTOS: 0
- NÃO LOCALIZADOS: 0

## WF-PRIOR-L1-Abertura-Projeto-Setup  `cgw7ozJ7Zk9jBrj1`
- **Área:** Priorização
- **Status:** NÃO AFETADO
- **Code/Function nodes auditados:** 7 (`Expand Active Clients`, `Prepare Setup Payload`, `Prepare Checklist Items`, `Prepare Telegram Alert`, `Prepare Telegram OK Log`, `Prepare Telegram Failed Log`, `Prepare No Missing Log`)
- **Evidência:**
  - Node `Expand Active Clients` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `Query Active Clients`, OK
  - Node `Prepare Setup Payload` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `Query Existing Setup Project`, OK
  - Node `Prepare Checklist Items` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `Create Setup Project`, OK
  - Node `Prepare Telegram Alert` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `Create Setup Project`, OK
  - Node `Prepare Telegram OK Log` (`n8n-nodes-base.code`, mode `runOnceForEachItem`): recebe 1 conexão direta de `Send Telegram Alert`, OK
  - Node `Prepare Telegram Failed Log` (`n8n-nodes-base.code`, mode `runOnceForEachItem`): recebe 1 conexão direta de `Send Telegram Alert`, OK
  - Node `Prepare No Missing Log` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `Create Setup Project`, OK
- **Recomendação:** Nenhuma ação necessária.

## WF-COM-Deduplicar-Leads-HubSpot  `izimrLm19H4i6LOq`
- **Área:** Comercial
- **Status:** NÃO AFETADO
- **Code/Function nodes auditados:** 4 (`[ComAb] Calcular Duplicatas`, `[ComAb] Montar Relatorio`, `[ComAb] Expandir Duplicatas`, `[ComAb] Consolidar Resultado`)
- **Evidência:**
  - Node `[ComAb] Calcular Duplicatas` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `[ComAb] Buscar Deals HubSpot`, OK
  - Node `[ComAb] Montar Relatorio` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `[ComAb] Tem Duplicatas?`, OK
  - Node `[ComAb] Expandir Duplicatas` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `[ComAb] Modo Execucao?`, OK
  - Node `[ComAb] Consolidar Resultado` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `[ComAb] Arquivar Deal HubSpot`, OK
- **Recomendação:** Nenhuma ação necessária.

## A2.1 Onboarding  `0MfPA3Uqmj4TySiX`
- **Área:** Onboarding
- **Status:** AFETADO
- **Code/Function nodes auditados:** 10 (`[Onb A2.1] Validar Payload`, `[Onb A2.1] Normalizar Contexto`, `[Onb A2.1] Detectar Duplicidade`, `[Onb A2.1] Resolver Responsavel Geral`, `[Onb A2.1] Ler Etapas A1`, `[Onb A2.1] Binario para JSON Etapas`, `[Onb A2.1] Montar Itens Etapas`, `[Onb A2.1] Consolidar Resultado`, `[Onb A2.1] Montar Texto Falha Telegram`, `[Onb A2.1] Validar Secret`)
- **Evidência:**
  - Node `[Onb A2.1] Validar Payload` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `[Onb A2.1] Secret Valido?`, OK
  - Node `[Onb A2.1] Normalizar Contexto` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `[Onb A2.1] Payload Valido?`, OK
  - Node `[Onb A2.1] Detectar Duplicidade` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `[Onb A2.1] Buscar Clientes Ativos`, OK
  - Node `[Onb A2.1] Resolver Responsavel Geral` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `[Onb A2.1] Buscar Usuarios Workspace`, OK
  - Node `[Onb A2.1] Ler Etapas A1` (`n8n-nodes-base.code`, mode `n/a`): recebe 2 conexões diretas de `[Onb A2.1] Tem Servico?`, `[Onb A2.1] Atualizar Servico Cliente`, em in[0], **sem Merge antes** - afetado
  - Node `[Onb A2.1] Binario para JSON Etapas` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `[Onb A2.1] Ler Etapas A1`, OK
  - Node `[Onb A2.1] Montar Itens Etapas` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `[Onb A2.1] Binario para JSON Etapas`, OK
  - Node `[Onb A2.1] Consolidar Resultado` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `[Onb A2.1] Criar Etapa`, OK
  - Node `[Onb A2.1] Montar Texto Falha Telegram` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `[Onb A2.1] Atualizar Cliente Bloqueado`, OK
  - Node `[Onb A2.1] Validar Secret` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.1] Webhook Briefing`, OK
- **Recomendação:** Adicionar Merge (mode append, `numberInputs: 2`) entre `[Onb A2.1] Tem Servico?`/`[Onb A2.1] Atualizar Servico Cliente` e `[Onb A2.1] Ler Etapas A1`.

## A2.2 Onboarding  `7lQ3AuNMtt4NXYZZ`
- **Área:** Onboarding
- **Status:** NÃO AFETADO
- **Code/Function nodes auditados:** 4 (`[Onb A2.2] Filtrar Etapas Elegiveis`, `[Onb A2.2] Montar Mensagem`, `[Onb A2.2] Preparar Update Etapa`, `[Onb A2.2] Consolidar Resultado`)
- **Evidência:**
  - Node `[Onb A2.2] Filtrar Etapas Elegiveis` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.2] Buscar Etapas Cobranca`, OK
  - Node `[Onb A2.2] Montar Mensagem` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.2] Obter Cliente da Etapa`, OK
  - Node `[Onb A2.2] Preparar Update Etapa` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.2] Enviar Telegram Olavo`, OK
  - Node `[Onb A2.2] Consolidar Resultado` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.2] Atualizar Status Etapa`, OK
- **Recomendação:** Nenhuma ação necessária.

## A2.5 Onboarding  `KqkDnSPtfbSfE9mK`
- **Área:** Onboarding
- **Status:** NÃO AFETADO
- **Code/Function nodes auditados:** 4 (`[Onb A2.5] Filtrar Etapas Elegiveis`, `[Onb A2.5] Montar Mensagem`, `[Onb A2.5] Preparar Update Observacoes`, `[Onb A2.5] Consolidar Resultado`)
- **Evidência:**
  - Node `[Onb A2.5] Filtrar Etapas Elegiveis` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.5] Buscar Etapas Aguardando`, OK
  - Node `[Onb A2.5] Montar Mensagem` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.5] Obter Cliente da Etapa`, OK
  - Node `[Onb A2.5] Preparar Update Observacoes` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.5] Enviar Telegram Olavo`, OK
  - Node `[Onb A2.5] Consolidar Resultado` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.5] Atualizar Observacoes Etapa`, OK
- **Recomendação:** Nenhuma ação necessária.

## A2.9 Onboarding  `Vqxb3G0KLeKerdCy`
- **Área:** Onboarding
- **Status:** NÃO AFETADO
- **Code/Function nodes auditados:** 5 (`[Onb A2.9] Filtrar Etapas Elegiveis`, `[Onb A2.9] Montar Mensagem`, `[Onb A2.9] Preparar Update Observacoes`, `[Onb A2.9] Consolidar Resultado`, `[Onb A2.9] Extrair Acessos Pendentes`)
- **Evidência:**
  - Node `[Onb A2.9] Filtrar Etapas Elegiveis` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.9] Buscar Etapas Kickoff Concluidas`, OK
  - Node `[Onb A2.9] Montar Mensagem` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.9] Obter Cliente da Etapa`, OK
  - Node `[Onb A2.9] Preparar Update Observacoes` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.9] Enviar Telegram Olavo`, OK
  - Node `[Onb A2.9] Consolidar Resultado` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.9] Atualizar Observacoes Etapa`, OK
  - Node `[Onb A2.9] Extrair Acessos Pendentes` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.9] Filtrar Etapas Elegiveis`, OK
- **Recomendação:** Nenhuma ação necessária.

## A2.11 Onboarding  `xoFU3G3xfEm0Zfjl`
- **Área:** Onboarding
- **Status:** NÃO AFETADO
- **Code/Function nodes auditados:** 4 (`[Onb A2.11] Filtrar Clientes Elegiveis`, `[Onb A2.11] Montar Mensagem e Links`, `[Onb A2.11] Preparar Update Observacoes`, `[Onb A2.11] Consolidar Resultado`)
- **Evidência:**
  - Node `[Onb A2.11] Filtrar Clientes Elegiveis` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `[Onb A2.11] Buscar Clientes Concluidos`, OK
  - Node `[Onb A2.11] Montar Mensagem e Links` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `[Onb A2.11] Filtrar Clientes Elegiveis`, OK
  - Node `[Onb A2.11] Preparar Update Observacoes` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `[Onb A2.11] Enviar Telegram Olavo`, OK
  - Node `[Onb A2.11] Consolidar Resultado` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `[Onb A2.11] Atualizar Observacoes Cliente`, OK
- **Recomendação:** Nenhuma ação necessária.

## A2.3 Onboarding  `fzHjTyMcPc6Rnlb1`
- **Área:** Onboarding
- **Status:** AFETADO
- **Code/Function nodes auditados:** 8 (`[Onb A2.3] Validar Secret`, `[Onb A2.3] Validar Payload`, `[Onb A2.3] Localizar Seq 7 e Seq 8`, `[Onb A2.3] Normalizar Decisao`, `[Onb A2.3] Preparar Atualizacoes Aprovado`, `[Onb A2.3] Montar Telegram Aprovado`, `[Onb A2.3] Preparar Atualizacoes Insuficiente`, `[Onb A2.3] Montar Telegram Insuf`)
- **Evidência:**
  - Node `[Onb A2.3] Validar Secret` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.3] Webhook Briefing`, OK
  - Node `[Onb A2.3] Validar Payload` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.3] Secret Valido?`, OK
  - Node `[Onb A2.3] Localizar Seq 7 e Seq 8` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.3] Buscar Etapas do Cliente`, OK
  - Node `[Onb A2.3] Normalizar Decisao` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.3] Avaliar via Gemini Pro`, OK
  - Node `[Onb A2.3] Preparar Atualizacoes Aprovado` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 2 conexões diretas de `[Onb A2.3] Roteador por Classe`, `[Onb A2.3] Roteador por Classe`, em in[0], **sem Merge antes** - afetado
  - Node `[Onb A2.3] Montar Telegram Aprovado` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.3] Atualizar Seq 8`, OK
  - Node `[Onb A2.3] Preparar Atualizacoes Insuficiente` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.3] Roteador por Classe`, OK
  - Node `[Onb A2.3] Montar Telegram Insuf` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.3] Atualizar Seq 7 Insuf`, OK
- **Recomendação:** Adicionar Merge (mode append, `numberInputs: 2`) entre `[Onb A2.3] Roteador por Classe`/`[Onb A2.3] Roteador por Classe` e `[Onb A2.3] Preparar Atualizacoes Aprovado`.

## A2.7 Onboarding  `VhaI01i4T6VBud1V`
- **Área:** Onboarding
- **Status:** NÃO AFETADO
- **Code/Function nodes auditados:** 3 (`[Onb A2.7] Filtrar e Agregar`, `[Onb A2.7] Montar Fallback`, `[Onb A2.7] Normalizar Digest`)
- **Evidência:**
  - Node `[Onb A2.7] Filtrar e Agregar` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `[Onb A2.7] Buscar Etapas`, OK
  - Node `[Onb A2.7] Montar Fallback` (`n8n-nodes-base.code`, mode `n/a`): recebe 1 conexão direta de `[Onb A2.7] Tem Resposta?`, OK
  - Node `[Onb A2.7] Normalizar Digest` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.7] Gerar Digest Gemini`, OK
- **Recomendação:** Nenhuma ação necessária.

## A2.10 Onboarding  `5WD3ilbH1C7fKiVs`
- **Área:** Onboarding
- **Status:** AFETADO
- **Code/Function nodes auditados:** 13 (`[Onb A2.10] Filtrar Elegiveis`, `[Onb A2.10] Filtrar Cliente Ativo`, `[Onb A2.10] Buscar seq 22 do Cliente`, `[Onb A2.10] Preparar Quadro`, `[Onb A2.10] Montar Telegram Criacao`, `[Onb A2.10] Triage Conteudo Quadro`, `[Onb A2.10] Montar Telegram Alerta`, `[Onb A2.10] Extrair Tabela`, `[Onb A2.10] Normalizar Decisao`, `[Onb A2.10] Preparar PASS`, `[Onb A2.10] Restaurar Telegram PASS`, `[Onb A2.10] Preparar FAIL`, `[Onb A2.10] Restaurar Telegram FAIL`)
- **Evidência:**
  - Node `[Onb A2.10] Filtrar Elegiveis` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.10] Buscar Etapas`, OK
  - Node `[Onb A2.10] Filtrar Cliente Ativo` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.10] Obter Cliente`, OK
  - Node `[Onb A2.10] Buscar seq 22 do Cliente` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.10] Filtrar Cliente Ativo`, OK
  - Node `[Onb A2.10] Preparar Quadro` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.10] Buscar Sub-pagina Quadro`, OK
  - Node `[Onb A2.10] Montar Telegram Criacao` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.10] Criar Sub-pagina Template`, OK
  - Node `[Onb A2.10] Triage Conteudo Quadro` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.10] Ler Conteudo Quadro`, OK
  - Node `[Onb A2.10] Montar Telegram Alerta` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.10] Roteador Conteudo`, OK
  - Node `[Onb A2.10] Extrair Tabela` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.10] Roteador Conteudo`, OK
  - Node `[Onb A2.10] Normalizar Decisao` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.10] Avaliar via Gemini`, OK
  - Node `[Onb A2.10] Preparar PASS` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.10] Resultado PASS?`, OK
  - Node `[Onb A2.10] Restaurar Telegram PASS` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 2 conexões diretas de `[Onb A2.10] Deve Destravar Seq 22?`, `[Onb A2.10] Destravar Seq 22 se Bloqueada`, em in[0], **sem Merge antes** - afetado
  - Node `[Onb A2.10] Preparar FAIL` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.10] Resultado PASS?`, OK
  - Node `[Onb A2.10] Restaurar Telegram FAIL` (`n8n-nodes-base.code`, mode `runOnceForAllItems`): recebe 1 conexão direta de `[Onb A2.10] Bloquear Seq 22`, OK
- **Recomendação:** Adicionar Merge (mode append, `numberInputs: 2`) entre `[Onb A2.10] Deve Destravar Seq 22?`/`[Onb A2.10] Destravar Seq 22 se Bloqueada` e `[Onb A2.10] Restaurar Telegram PASS`.

## Padrões inegociáveis aplicáveis (referência)
- Multi-fan-in (2 conexões) para Code/jsCode/Function node em n8n EXIGE nó Merge antes pra consolidar N batches upstream em 1 batch único.
- Nó Merge consolidador DEVE declarar numberInputs = nº exato de upstreams (default n8n v3 = 2; só esperaria 2 das N conexões).

## Observações gerais
- Fonte de verdade usada: produção n8n via MCP (`search_workflows` e `get_workflow_details`), não exports locais do repo.
- Critério aplicado: contagem reversa das conexões `main` diretas que chegam em cada node `n8n-nodes-base.code`, `n8n-nodes-base.function` ou `n8n-nodes-base.functionItem`.
- Esta auditoria não alterou, publicou, desativou ou executou workflows.
