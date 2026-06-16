# Pedido de Status — Sub-chat Comercial

> Copie o bloco abaixo (entre as linhas `--- COPY ---`) e cole no sub-chat **Comercial**.

--- COPY ---

Olá. Estou integrando o estado de todas as áreas do projeto PHI no **doc mestre** `ESTADO-DO-PROJETO.md` (versionado em git, na branch `claude/agentic-agency-planning-KwJEw`). Preciso de um snapshot do que está rolando aqui em **Comercial**.

## O que já consta sobre Comercial no doc mestre (pra eu não duplicar)

- **Status no roadmap (§3.6):** vestigial. Área formal não aberta. Sem strawman, sem âncora, sem lote.
- **Único artefato em produção:** workflow `Comercial - Deduplicar Leads HubSpot` (`n8n izimrLm19H4i6LOq`), legado.
- **Tensão T4 registrada:** "Prospecção comercial" e "Reunião de resultados com cliente" estão hoje como demandas da Execução de Demandas — semanticamente seriam Comercial. Devem migrar quando esta área existir formalmente.
- **Glossário:** Comercial = Tronco 2 do Miro (sub-área de Procedimentos da Área de Operações). Sigla canônica `COM`.
- **Padrões inegociáveis Lote 1 Onboarding** valem aqui também (webhook secret antes do payload, jsCode ASCII-safe, idempotência por marca em DB, Telegram string única HTML, NÃO editar prod sem re-importar canônico).

## Formato pedido (espelha o ESTADO-DO-PROJETO)

Pra eu integrar limpo, responda com estes 6 blocos curtos:

**1. Onde estamos AGORA** (1 parágrafo, ~3-5 linhas)
O que você está tocando agora? Qual o foco da última semana?

**2. Roadmap por lote**
Tabela ou bullets com: `Lote 0` / `Lote 1` / `Lote 2+` e estado (`Backlog` / `Em design` / `Em execução` / `Em smoke` / `Concluído` / `Bloqueado`).

**3. Decisões travadas recentes**
ADRs, fronteiras, escolhas de stack. Com data. Linkar Notion onde houver.

**4. Pendências abertas**
Com data de origem + se bloqueia alguma frente.

**5. Tensões / riscos**
Coisas que sabe que vão dar dor (sobreposição com outra área, dependência externa, escolha em aberto).

**6. Próximo passo previsto** (1-2 frases)
Qual o próximo movimento, com quem.

## Bônus — se já existirem artefatos a integrar

Se a área Comercial já tem:
- Strawman/SOP em arquivo (em git ou Notion) — me passa o path/URL
- DBs Notion vivos pra Comercial — me passa o ID/URL
- Workflows n8n adicionais (além do Deduplicar Leads) — me passa nome + ID n8n
- Âncora Notion da área (`[HANDOFF] Comercial — ...`) — me passa URL

Eu adiciono no Catálogo de Artefatos Operacionais (DB `PHI - Catálogo de Artefatos Operacionais`) e atualizo o ESTADO.

## Por que esta sincronização agora

Em 2026-06-04 abrimos a área Documentação e Ferramentas (Tronco 4 Miro) e formalizamos protocolo de checkpoint (Aprendizado #16). Toda área operacional precisa ter seu estado refletido no doc mestre pra outsider (ou eu reaberto em sessão nova) conseguir retomar em 10-15 minutos. Bus-factor baixo.

Quando você responder, eu (a) atualizo §3.6 e §5 do `ESTADO-DO-PROJETO.md`, (b) registro novos artefatos no Catálogo se houver, (c) sinalizo tensões novas ou resolvidas. Tudo versionado em git + Notion.

Obrigado. Sem prazo apertado — quando puder.

--- END COPY ---
