# Promoção Onboarding Lote 1

## Passo 5 - Webhook shared secret + Apps Script

Status: concluído em 2026-05-29. Smoke completo do Passo 6 ainda não executado.

### Hardening A2.1

- `ONB_WEBHOOK_SECRET` gerado e salvo no `.env`.
- Valor injetado em build-time no workflow A2.1.
- Export sanitizado em `onboarding/a2.1/workflow.json` e `sandbox_export.json` como `<ONB_WEBHOOK_SECRET_redacted>`.
- Workflow A2.1 permanece `active=true`.
- Novo fluxo:
  - `[Onb A2.1] Webhook Briefing`
  - `[Onb A2.1] Validar Secret`
  - `[Onb A2.1] Secret Valido?`
  - se falso: `[Onb A2.1] Responder 401`
  - se verdadeiro: fluxo normal em `[Onb A2.1] Validar Payload`

### Testes E2E do webhook

URL de produção:

```text
https://n8n-n8n-editor.1unqx7.easypanel.host/webhook/onb-briefing-to-client
```

| Cenário | Cliente usado | Resultado HTTP | Efeito no Notion |
| --- | --- | ---: | --- |
| Header `X-Onb-Secret` correto | `Cliente Sandbox A2.1 Secret Test OK` | 201 | Criou cliente `36fb65e5-c72b-81db-9623-f43c9db06577` + 31 etapas com relation `Cliente`. |
| Sem header | `Cliente Sandbox A2.1 Secret Test NoHeader` | 401 | 0 clientes criados. |
| Header errado | `Cliente Sandbox A2.1 Secret Test WrongHeader` | 401 | 0 clientes criados. |

Validação adicional via `curl -i` confirmou body do 401:

```json
{"ok":false,"error":"unauthorized"}
```

### Validação via Notion API

Após o POST autorizado:

- Cliente criado: `36fb65e5-c72b-81db-9623-f43c9db06577`.
- `LinkedEtapas = 31`.
- `ActiveLinkedEtapas = 31`.
- Clientes criados nos cenários 401: `0`.

Cleanup do teste autorizado:

- Cliente `Cliente Sandbox A2.1 Secret Test OK` arquivado.
- 31 etapas vinculadas arquivadas.
- `ActiveEtapasAfter = 0`.

### Apps Script

Arquivo versionado:

- `onboarding/apps-script-briefing.gs`

O script:

- Implementa `onFormSubmit(e)`.
- Lê `ONB_WEBHOOK_SECRET` de `PropertiesService.getScriptProperties()`.
- Envia header `X-Onb-Secret`.
- Faz POST para o webhook de produção A2.1.
- Mapeia `namedValues` do Google Form para:
  - `cnpj_cliente`
  - `cliente_nome`
  - `data_inicio`
  - `modelo_negocio`
  - `servico`
  - `origem_comercial`
  - `responsavel_geral_email`

### Instruções para Olavo

1. Abrir o Google Form do briefing.
2. Ir em `Extensões` > `Apps Script`.
3. Colar o conteúdo de `onboarding/apps-script-briefing.gs`.
4. Em `Project Settings` > `Script Properties`, criar:
   - `ONB_WEBHOOK_SECRET`: copiar o valor do `.env` local.
   - opcional `ONB_WEBHOOK_URL`: usar só se a URL de produção mudar.
5. Conferir se os títulos dos campos do Form batem com algum alias em `FIELD_ALIASES`.
6. Criar trigger:
   - função: `onFormSubmit`
   - origem do evento: `From form`
   - tipo do evento: `On form submit`
7. Salvar e autorizar o script.

Se algum campo do Form não casar com `FIELD_ALIASES`, ajustar o alias no `.gs` antes de ativar o trigger.
