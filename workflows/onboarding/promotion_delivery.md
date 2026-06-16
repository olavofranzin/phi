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

## Passo 5c - Contrato mínimo alinhado ao Form real

Status: concluído em 2026-05-29. Smoke completo do Passo 6 ainda não executado.

### Ajuste de contrato A2.1

O Form real do briefing expõe apenas estes campos com mapeamento direto para o contrato:

- `Nome da empresa` -> `cliente_nome`
- `CNPJ` -> `cnpj_cliente`

O workflow A2.1 foi ajustado para aceitar payload mínimo:

- `[Onb A2.1] Validar Payload` agora exige somente `cnpj_cliente` e `cliente_nome`.
- `data_inicio` é opcional; quando ausente, `[Onb A2.1] Normalizar Contexto` resolve a data atual em `America/Sao_Paulo`.
- `modelo_negocio`, `servico` e `origem_comercial` são opcionais.
- `modelo_negocio` e `servico` continuam validados se forem enviados.
- Hardening por `X-Onb-Secret` foi mantido intacto.

### Ajuste em Criar Cliente

Campos sempre enviados:

- `Cliente`
- `Status = Em andamento`
- `Data de início`
- `SLA até 1ª entrega (dias) = 21`
- `Observações`

Campos opcionais:

- `Modelo de negócio (business_model)` usa `undefined` quando ausente.
- `Serviço` usa `multiSelectValue` singular do Notion v2.2; `multiSelectValues` plural é ignorado pelo node.
- `Origem (vendedor / comercial)` usa string vazia quando ausente.
- `Responsável geral` mantém a lógica existente por match de e-mail com usuário do workspace.

Para garantir que `Serviço` seja preenchido no payload completo, foi adicionado:

- `[Onb A2.1] Tem Servico?`
- `[Onb A2.1] Atualizar Servico Cliente`

### Ajuste no Apps Script

`onboarding/apps-script-briefing.gs` foi atualizado para:

- exigir só `cliente_nome` e `cnpj_cliente`;
- gerar `data_inicio` com `Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd')`;
- omitir `modelo_negocio`, `servico`, `origem_comercial` e `responsavel_geral_email` quando não houver campo equivalente no Form;
- manter `ONB_WEBHOOK_SECRET` exclusivamente em Script Properties.

### Testes E2E 5c

| Cenário | Resultado HTTP | Validação |
| --- | ---: | --- |
| Header válido + payload mínimo (`cnpj_cliente`, `cliente_nome`) | 201 | Cliente `36fb65e5-c72b-8101-9e99-c92920f2de21` criado com `Status=Em andamento`, `Data de início=2026-05-29`, `Modelo=null`, `Serviço=[]`, `Origem=''`, 31 etapas. |
| Header válido + payload completo | 201 | Cliente `36fb65e5-c72b-81fd-ad3e-c9dfc9e40afb` criado com `Modelo=Lead Gen`, `Serviço=Tráfego pago, Agente IA`, `Origem=Olavo`, 31 etapas. |
| Sem header | 401 | 0 clientes criados para `Cliente Sandbox A2.1 Minimal NoHeader Final`. |

### Cleanup 5c

Todos os clientes sintéticos criados durante os retestes 5c foram arquivados com guarda `Cliente Sandbox`, junto com suas etapas vinculadas.

Validação final:

- 9 clientes sintéticos arquivados.
- 0 etapas ativas vinculadas aos 9 clientes.
