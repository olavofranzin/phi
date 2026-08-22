# PONTO DE RETOMADA — Card GBP HubSpot (para a próxima sessão)

> **LEIA PRIMEIRO nesta ordem, na sessão nova.** Escrito 2026-08-22 porque a liberação de rede
> (acesso total à internet) **só vale para uma sessão criada DEPOIS** dela — a sessão que gerou este
> arquivo nasceu bloqueada. Branch de trabalho: `claude/hubspot-gbp-card-finalizacao-annaxt`.

---

## 0. Primeira ação obrigatória na sessão nova: testar a rede
Antes de qualquer coisa, confirmar que a liberação de internet pegou. Rodar:

```
curl -sS -o /dev/null -w "%{http_code}\n" https://developers.hubspot.com/docs
```

- **200/301/302** → rede liberada. Seguir para §3 (buscar as 2 URLs).
- **000 / "CONNECT tunnel failed, response 403"** → ainda bloqueado. NÃO insistir: avisar o Olavo que a
  política de rede continua barrando esta sessão também (a mudança pode exigir recriar o ambiente, não só
  nova sessão) e cair no plano B da §4.

## 1. O que é esta frente (contexto mínimo)
Card estratégico "Diagnóstico GBP" no record do Deal do HubSpot (portal produção `5633277`, **Free**).
O card **EXIBE, nunca escreve nem move o deal**. Duas camadas:
- **Camada A (nativo):** aba/Destaques/grupo, feito na UI — funciona em Free. É o caminho de ativação.
- **Camada B (App Card / UI extension):** `apps/hubspot-card-gbp/`, validado no Developer Test Account
  `51728276` (platform 2026.03). **Free não renderiza App Card** → fica protótipo até upgrade de tier.

## 2. O que JÁ foi feito (commitado nesta branch — não refazer)
- **Decisão de produção H3:** `docs/comercial/card-gbp-decisao-producao.md` + **ADR-34**
  (`docs/strategic-planning/saude-digital/adr-rascunhos/ADR-34-caminho-producao-card-gbp.md`).
  Resumo: ativar **Camada A nativa** agora; módulo CMS como prova visual; upgrade de tier e public
  app+OAuth como gatilhos futuros. Portal `5633277` confirmado **STANDARD/Free** ao vivo (2026-08-21).
- **ESTADO-DO-PROJETO** atualizado: nota "C1 aguarda OK" corrigida (C1 estrutural concluído — 21 props do
  card + produtos SVC-IA/1004 e SVC-GBP/1005 existem) + changelog v0.1.53.
- **Execution-log:** `docs/handoff/2026-08-21-hubspot-cards-h3-execution-log.md`.
- **Layout do record decidido (brief §1.1, commit f19e57b no brief):** ESQUERDA enxuta (só identidade, zero
  IA/GBP) · CENTRAL = diagnóstico (Destaques → card 14 compactos → aba 7 textões) · DIREITA = apoio
  (associações + `createdate`/última modificação/`nao_reivindicado`/`site_tipo`).

## 3. O que buscar nas 2 URLs liberadas (o objetivo da liberação)
Assim que a rede estiver ok, acessar e extrair:

### 3a. `https://developers.hubspot.com/docs`
Foco (para fechar a Camada B e o caminho de produção):
- **UI extensions / App Cards 2026.03**: `crm.record.tab` (aba na coluna central), componentes
  (`Statistics`, `ProgressBar`, `StatusTag`/`Tag`, `Flex`, `Divider`, `Text`), leitura read-only via
  `actions.fetchCrmObjectProperties`. Validar 1:1 contra `apps/hubspot-card-gbp/src/app/cards/GbpCard.tsx`.
- **Onde App Card renderiza por tier** (private vs public × Free/Starter/Pro/Enterprise) — confirmar a
  tabela-verdade da decisão H3 (`card-gbp-decisao-producao.md` §1) contra a doc oficial atual.
- **`hs project` / deploy** (upload do app no Test Account) — checar o fluxo p/ o guia de execução do Olavo.

### 3b. `https://www.skills.sh/hubspot`
- Descobrir **o que é** (skill de agente? ferramentas? templates de HubSpot?) e se há algo reutilizável para
  esta frente. Se for uma skill instalável, avaliar valor antes de propor instalar (pedir OK do Olavo).

**Registrar o que achar** num arquivo curto `docs/comercial/refs/hubspot-docs-<data>.md` (fonte + data +
achados que impactam a spec/decisão), e atualizar a spec/ADR se a doc oficial contradisser algo.

## 4. Plano B (se a rede continuar bloqueada)
- Olavo cola o conteúdo relevante das páginas aqui, ou salva em `docs/comercial/refs/`.
- Avançar com o conhecimento já existente da platform 2026.03 (o App Card já está validado no Test Account).
- Context7 MCP pode cobrir doc de algumas libs; npm registry está liberado (instalar `@hubspot/*` se preciso).

## 5. Pendências abertas (independentes da rede)
- **H1 seed + validação visual:** roda na Test Account `51728276` — precisa `HUBSPOT_TEST_TOKEN` da dev
  account (não está no ambiente; Claude não tem acesso a esse portal). É ação do Olavo, ou guia a produzir.
- **H2 Camada A nativa:** passo a passo na UI (aba IA/Diagnóstico + Destaques + grupo + coluna direita).
- **Sync spec ↔ brief:** portar a §1.1 (layout 3 colunas + coluna direita) para dentro de
  `docs/comercial/card-gbp-record-spec.md` (§2.5), usando os internal names reais. Edição pequena, pendente
  de OK.
- **Registro:** Ledger Notion (ADR-32 `8d8eb685f66249c7ba4f298d744feec3`) desta rodada ainda não lançado.

## 6. Guardrails (valem sempre)
Produção `5633277`: exibe, nunca escreve/move; nunca em `closedwon`/`closedlost`. Criar prop/produto só após
OK do Olavo. Segredos fora do git (token do seed via env). Nunca contornar limite de plano para forçar a
extension no Free — se travar, reportar e cair na Camada A.
