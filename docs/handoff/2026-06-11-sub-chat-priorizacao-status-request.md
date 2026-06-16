# Pedido de Status — Sub-chat Priorização dos Procedimentos

> Copie o bloco abaixo (entre as linhas `--- COPY ---`) e cole no sub-chat **Priorização dos Procedimentos**.

--- COPY ---

Olá. Estou integrando o estado de todas as áreas do projeto PHI no **doc mestre** `ESTADO-DO-PROJETO.md` (versionado em git, na branch `claude/agentic-agency-planning-KwJEw`). Preciso de um snapshot do que está rolando aqui em **Priorização dos Procedimentos**.

## O que já consta sobre Priorização no doc mestre (pra eu não duplicar)

- **Status no roadmap (§3.5):**
  - Lote 0 (Framework + Inventário) — **Concluído**
  - L1 `Abertura de Projeto Técnico/Setup` — **Em execução** (brief travado 2026-06-02, pendente Codex)
  - L2 Passagem de Bastão entre Áreas — Backlog
  - L3 Atendimento de Solicitações — Backlog
- **Artefatos vivos no Catálogo:**
  - Âncora `[HANDOFF] Priorização dos Procedimentos — Âncora da Área` (https://www.notion.so/373b65e5c72b81f4acf6f2d53cab76fa)
  - DB `Inventário de Processos da Agência` (https://www.notion.so/d50b66da6bf24d549ea8a346e24d3995)
  - ADR Framework de Priorização — Status `Em planejamento` (https://www.notion.so/373b65e5c72b8103befef67c7e905776)
  - L1 — Abertura de Projeto Técnico/Setup — Em execução (https://www.notion.so/373b65e5c72b81629358ee80f1e2ac10)
- **Fronteira aprovada:** Execução de Demandas é **consumidora** da Priorização (fronteira travada em 2026-06-03). Ou seja, a Priorização produz scores/contrato de handoff que a Execução consome — não o contrário.
- **Glossário:** Priorização = Tronco 2 do Miro (sub-área de Procedimentos da Área de Operações). Sigla canônica `PRIOR`.
- **Padrões inegociáveis Lote 1 Onboarding** valem aqui também.
- **ADR-012 Aceito 2026-06-04:** Git canônico para design (strawmans, planos, ADRs em rascunho) + Notion canônico para estado operacional (DBs vivos, ADRs aceitos, registros).

## Formato pedido (espelha o ESTADO-DO-PROJETO)

Pra eu integrar limpo, responda com estes 6 blocos curtos:

**1. Onde estamos AGORA** (1 parágrafo, ~3-5 linhas)
O que você está tocando agora? Qual o foco da última semana?

**2. Roadmap por lote**
Atualização da tabela em §3.5. Inclua status real de Lote 0, L1, L2, L3 — se algum mudou desde 2026-06-02, sinaliza com data.

**3. Decisões travadas recentes**
ADRs, fronteiras, escolhas de stack. Com data. Linkar Notion onde houver. Especificamente:
- O ADR Framework de Priorização saiu de `Em planejamento`?
- O brief L1 destravou? Codex avançou?

**4. Pendências abertas**
Com data de origem + se bloqueia alguma frente. Foco especial:
- L1 ainda travado? Por quê?
- Contrato de Passagem de Bastão (L2) — desenho começou?

**5. Tensões / riscos**
Coisas que sabe que vão dar dor:
- Sobreposição com Execução (mesmo se fronteira está travada)
- Dependência da Comercial (quando ela existir, prospecção migra pra lá — afeta L3 Atendimento de Solicitações?)
- Decisões em aberto pro framework de scoring

**6. Próximo passo previsto** (1-2 frases)
Qual o próximo movimento, com quem.

## Bônus — se houver novos artefatos a integrar

Se desde 2026-06-04 surgiram:
- Novos strawmans/SOPs (git ou Notion) — me passa path/URL
- Novos DBs Notion — me passa ID/URL
- Novos workflows n8n — me passa nome + ID
- Aprendizados aplicados — me passa ID do PHI™ Aprendizados
- ADRs novos (rascunho ou aceito) — me passa Número + Status + URL

Eu adiciono no Catálogo de Artefatos Operacionais e atualizo o ESTADO + ADR-Vigentes onde couber.

## Por que esta sincronização agora

Em 2026-06-04 abrimos a área Documentação e Ferramentas (Tronco 4 Miro) e formalizamos protocolo de checkpoint (Aprendizado #16). Toda área operacional precisa ter seu estado refletido no doc mestre pra outsider (ou eu reaberto em sessão nova) conseguir retomar em 10-15 minutos.

Quando você responder, eu (a) atualizo §3.5 e §5 do `ESTADO-DO-PROJETO.md`, (b) registro novos artefatos no Catálogo se houver, (c) sinalizo tensões novas ou resolvidas, (d) atualizo a fronteira Execução=consumidora se houver evolução. Tudo versionado em git + Notion.

Obrigado. Sem prazo apertado — quando puder.

--- END COPY ---
