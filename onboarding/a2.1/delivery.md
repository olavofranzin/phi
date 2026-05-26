# Onb - Briefing to Client (A2.1)

## Arquivos entregues

- `workflow.json`
- `sandbox_export.json`
- `test_payload.json`
- `tests.ps1`
- `runs/exec_6715.json`
- `runs/exec_6716.json`

## Diagrama textual dos nodes

1. `[Onb A2.1] Webhook Briefing`
   - Recebe `POST` com o payload do Google Form.
2. `[Onb A2.1] Validar Payload`
   - Valida obrigatórios do v1 e formato básico.
3. `[Onb A2.1] Payload Válido?`
   - Se inválido, desvia para resposta `400`.
4. `[Onb A2.1] Responder 400`
   - Retorna erro para o webhook sem tocar Notion.
5. `[Onb A2.1] Normalizar Contexto`
   - Normaliza nome, CNPJ e email; padroniza `Tráfego pago`.
6. `[Onb A2.1] Buscar Clientes Ativos`
   - Lê `PHI - Onboarding de Clientes`.
7. `[Onb A2.1] Detectar Duplicidade`
   - Filtra registros ativos por nome normalizado.
8. `[Onb A2.1] Duplicado?`
   - Se houver onboarding ativo, aborta.
9. `[Onb A2.1] Notificar Duplicidade Olavo`
   - Envia alerta via Evolution API com payload bruto + CNPJ.
10. `[Onb A2.1] Responder 409`
    - Retorna `Onboarding ativo ja existe para este cliente.`
11. `[Onb A2.1] Buscar Usuários Workspace`
    - Lista usuários do workspace Notion.
12. `[Onb A2.1] Resolver Responsável Geral`
    - Faz match por email; se não achar, deixa vazio.
13. `[Onb A2.1] Criar Cliente`
    - Cria página em `PHI - Onboarding de Clientes`.
14. `[Onb A2.1] Ler Etapas A1`
    - Lê `{{ $env.ONBOARDING_DATA_PATH }}/etapas-a1.json`.
15. `[Onb A2.1] Binário para JSON Etapas`
    - Converte o arquivo para JSON.
16. `[Onb A2.1] Montar Itens Etapas`
    - Gera os 31 itens de etapa com `Data prevista = data_inicio + prazo_dias`.
    - O node assume `data_inicio` como date-only sem timezone e soma dias em UTC intencionalmente.
17. `[Onb A2.1] Criar Etapa`
    - Cria páginas em `PHI - Etapas de Onboarding` com relation para o cliente.
18. `[Onb A2.1] Consolidar Resultado`
    - Conta sucessos e falhas.
19. `[Onb A2.1] Falha Parcial Etapas?`
    - Se alguma etapa falhar, segue para bloqueio do cliente.
20. `[Onb A2.1] Atualizar Cliente Bloqueado`
    - Marca `Status=Bloqueado` e preenche `Bloqueios ativos`.
21. `[Onb A2.1] Notificar Falha Etapas Olavo`
    - Envia resumo do erro via Evolution API.
22. `[Onb A2.1] Responder 201`
    - Retorna resumo da execução ao webhook.

## Credenciais referenciadas

- `Notion PHI Onboarding`
  - Tipo esperado: `notionApi`
  - Uso: leitura de clientes, leitura de usuários, criação/atualização de páginas.
- `Evolution API Header Auth`
  - Tipo esperado: `httpHeaderAuth`
  - Uso: notificações internas para Olavo.

## Parâmetros externos esperados

- `ONBOARDING_DATA_PATH`
  - Valor esperado no sandbox: `/home/user/phi/onboarding`
  - O workflow lê `{{ $env.ONBOARDING_DATA_PATH }}/etapas-a1.json`
- `EVOLUTION_API_URL`
- `EVOLUTION_INSTANCE`
- `OLAVO_PHONE`

## Tech debt registrado

- `[Onb A2.1] Buscar Clientes Ativos` usa `filterType:none` e faz filtro client-side por nome/status.
- Em v1 isso é funcional. Quando o volume de clientes ativos + históricos crescer, o ideal é migrar para filtro server-side no node do Notion.

## Logs de validação

### Teste estrutural local

Data da execução: `2026-05-26`

Rodada RED:

```text
workflow.json must be UTF-8 without BOM
```

Rodada GREEN:

```text
Onboarding briefing workflow structural tests passed.
```

Comando executado:

```powershell
powershell -ExecutionPolicy Bypass -File C:\tmp\phi_repo\onboarding\a2.1\tests.ps1
```

### Validação E2E em sandbox

Status: `executada com bloqueio externo`

Workflow sandbox criado:

- Workflow ID no sandbox: `0MfPA3Uqmj4TySiX`
- Nome: `Onb - Briefing to Client`
- Estado final: `inactive` (desativado ao fim do teste)

Evidências geradas:

- `sandbox_export.json`
- `runs/exec_6715.json`
- `runs/exec_6716.json`

Rodada 1:

- POST em `2026-05-26T16:38:25Z`
- Resultado HTTP observado pelo caller: `400`
- Execução `6715` no n8n: `success`
- Causa real: payload enviado pelo PowerShell chegou com `Tráfego pago` em encoding corrompido, então a validação do enum rejeitou `servico`.

Rodada 2:

- POST em `2026-05-26T16:41:31Z`
- Payload repetido com `Trafego pago` para cair na normalização do workflow.
- Resultado HTTP observado pelo caller: `500`
- Execução `6716` no n8n: `error`
- Último node executado com erro: `[Onb A2.1] Buscar Clientes Ativos`
- Erro raiz:

```text
Could not find database with ID: c7867eef-126f-420b-8b80-d52db3854989.
Make sure the relevant pages and databases are shared with your integration "Integração n8n".
```

Conclusão operacional:

- O workflow foi criado, publicado temporariamente no sandbox para teste e desativado ao final.
- A leitura do dataset via `Read Binary File` deixou de ser o bloqueio principal depois do ajuste de `filePath`.
- O bloqueio real do E2E agora é permissão da integração Notion do sandbox sobre os dois DBs de onboarding.
- Por isso, **não existe log honesto de cliente criado + 31 etapas criadas + duplicidade concluída** nesta sessão.

## Próximo passo para fechar o DoD

1. Compartilhar os DBs `PHI - Onboarding de Clientes` e `PHI - Etapas de Onboarding` com a integração `Integração n8n` usada pela credencial `Notion account`.
2. Reexecutar o primeiro POST.
3. Reexecutar o segundo POST com o mesmo `cliente_nome` para validar a duplicidade e a notificação.
