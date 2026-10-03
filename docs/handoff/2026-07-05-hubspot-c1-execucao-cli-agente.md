# [EXEC via CLI] HubSpot C1 — para Codex CLI ou Claude Code CLI (rodando local)

> **Para o Olavo:** cole o bloco da §2 no **Codex CLI** ou no **Claude Code CLI** aberto no
> seu clone local do repo `phi`. Antes, faça a §1 (private app + exportar o token). Rode em
> **máquina local** — o ambiente remoto do agente não alcança `api.hubapi.com` (egress bloqueado);
> a sua máquina alcança.

## 1. Você faz uma vez (fora do agente)
1. HubSpot → **Settings → Integrations → Private Apps → Create app**. Scopes:
   `crm.schemas.deals.read`, `crm.schemas.deals.write`, `crm.objects.deals.read`,
   `crm.schemas.custom.read`, `crm.schemas.custom.write`, `e-commerce`.
2. Copie o **Access token** (`pat-...`) e exporte **no mesmo terminal** onde vai abrir o agente:
   ```bash
   export HUBSPOT_TOKEN='pat-na1-...'
   ```
   (O token fica só na sessão do shell — não vai pro git nem pro chat.)
3. Garanta o repo atualizado: `git fetch && git checkout claude/agentic-agency-planning-KwJEw && git pull`.

## 2. Prompt para colar no Codex CLI / Claude Code CLI
```
Tarefa: executar o setup HubSpot C1 do projeto PHI, rodando o script já pronto do repo.

Contexto: estamos no clone local do repo `phi`, branch claude/agentic-agency-planning-KwJEw.
O script scripts/hubspot-c1-setup.sh cria (via API REST HubSpot) um grupo de propriedades,
migra 2 campos p/ multi-line, cria 6 campos em Deal + 1 em Meeting e 2 produtos. É idempotente.

Faça, nesta ordem:
1. Confirme que a variável de ambiente HUBSPOT_TOKEN está definida (`printenv HUBSPOT_TOKEN | sed 's/./*/g'`
   só para checar existência — NUNCA imprima o valor real). Se estiver vazia, PARE e peça ao Olavo
   para `export HUBSPOT_TOKEN='pat-...'`.
2. Confirme que scripts/hubspot-c1-setup.sh existe (senão, `git pull` na branch acima).
3. Rode: `bash scripts/hubspot-c1-setup.sh`
4. Leia a saída. Sucesso = cada linha com código HTTP 2xx (ou 409 "já existe", que é OK) e o
   READ-BACK listando: no grupo ia_enriquecimento os campos followup, dados_enriquecimento,
   proxima_acao_recomendada (fieldType textarea), proxima_acao_aceite, proxima_acao_aceite_data,
   abordagem_sugerida_ia, analise_gbp_ia, analise_site_ia, analise_instagram_ia; a meeting
   transcricao_ia; e os produtos SKU 1004 e 1005.
5. Se algum POST retornar 403 citando um scope: reporte ao Olavo qual scope falta (ele adiciona no
   private app) e rerode — o script é idempotente. Se for 403 de política de rede (proxy), reporte
   e NÃO tente contornar.
6. NÃO edite o script para embutir o token. NÃO faça commit de nada com o token. NÃO invente valores.
   O HubSpot é CRM de PRODUÇÃO do Olavo — só rode o que está no script.
7. Ao final, reporte um resumo curto: quantos campos/produtos criados vs já-existentes, e qualquer
   falha com o código HTTP e a mensagem.

Não crie PR. Não altere outros arquivos.
```

## 3. Guardrails (por que assim)
- **Token nunca no arquivo/git/PR** — só `export` no shell. O script lê de `$HUBSPOT_TOKEN`.
- **Idempotente:** reexecutar não duplica (409 = ok; produtos checados por SKU). Seguro rerodar.
- **Produção:** o agente só executa o script versionado — nada de improviso no CRM.
- **403 de scope ≠ 403 de política:** o primeiro se resolve adicionando o scope; o segundo (proxy)
  não se contorna — reportar. (No SEU terminal local não há proxy de egress, então 403 aqui = scope.)
- Pós-uso: revogue/rotacione o token que foi exposto no chat.

## 4. Referências
- Script: `scripts/hubspot-c1-setup.sh`. Spec dos campos: `docs/handoff/2026-07-05-hubspot-c1-setup-checklist.md`.
- Brief da frente: `docs/handoff/2026-07-05-comercial-hubspot-subchat-brief.md`. Catálogo: `docs/strategic-planning/catalogo-produtos-servicos.md`.
