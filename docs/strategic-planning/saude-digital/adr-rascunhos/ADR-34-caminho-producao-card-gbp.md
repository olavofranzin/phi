# [RASCUNHO] ADR-34 — Caminho de produção do Card GBP no record do Deal (HubSpot)

> **STATUS:** RASCUNHO (git, design-canônico). Escrito 2026-08-21 no sub-chat de finalização dos cards HubSpot.
> Vira `Aceito` quando a Camada A nativa estiver aplicada em produção (`5633277`) e o Olavo confirmar a leitura
> no record de um deal real.
>
> **ESCOPO:** só a **decisão de caminho** (onde/como o card chega a produção). Não mexe em código do card
> (`apps/hubspot-card-gbp/` já validado no Test Account) nem cria propriedade/produto. Complementa a spec
> `docs/comercial/card-gbp-record-spec.md` e o documento de decisão `docs/comercial/card-gbp-decisao-producao.md`.

---

## Contexto

O card estratégico GBP tem **dado pronto** (21 propriedades em `deals` + produtos SVC-IA/SVC-GBP) e **dois
artefatos de exibição** construídos: a Camada A **nativa** (recursos do record) e a Camada B **App Card**
(UI extension), esta já validada no Developer Test Account `51728276` na platform 2026.03.

O bloqueio não é de dados nem de construção: é de **tier de renderização**. O portal de produção `5633277` é
**Free** (confirmado ao vivo 2026-08-21 via `get_organization_details`: `accountType` STANDARD), e **portal Free
não renderiza App Card** — nem de private app, nem de public app. Essa é a regra da HubSpot, não uma limitação
que se contorne por configuração.

## Decisão

Adotar o **Caminho A (Camada A nativa)** como via de ativação em produção **agora**, e escalonar os demais:

1. **A — Nativo (agora):** aba "IA/Diagnóstico" + "Destaques de dados" + grupo de propriedades, feito por Olavo
   na UI. Renderiza em Free, entrega ~80% do valor, zero código, zero risco de plano.
2. **B — Módulo CMS (sob demanda):** os blocos prontos publicados numa página com deal real, como **prova
   visual** do card rico — não como a experiência no record.
3. **C — Upgrade de tier (gatilho comercial):** promover o App Card já validado quando a agência subir para
   Starter+ (public app OAuth) ou Enterprise (private app). Trabalho técnico já feito.
4. **D — Public app + OAuth (só se virar produto):** distribuir a clientes. Prematuro hoje.

## Regra de renderização que fundamenta a decisão

| Superfície | Private app | Public app |
|---|---|---|
| Developer Test Account | ✅ sempre | ✅ sempre |
| Produção **Free** (5633277) | ❌ | ❌ |
| Produção Starter/Pro | ❌ | ✅ |
| Produção Enterprise | ✅ | ✅ |

## Consequências

- **Positivas:** valor no record **imediato** e sem custo de plano; os dois artefatos preservados para
  promoção futura sem retrabalho; caminho de escala (C/D) explícito e ligado a um gatilho de negócio, não a
  engenharia.
- **Negativas/limites:** em Free a estética rica (barras, badges, paleta por serviço) só vive no Test Account
  ou numa página CMS — o record fica com o visual nativo padrão até um upgrade.
- **Guardrail reafirmado:** nunca contornar o plano para forçar a extension no Free; se algo não couber,
  reportar e cair na Camada A.

## Âncoras

- Decisão detalhada: `docs/comercial/card-gbp-decisao-producao.md`
- Spec: `docs/comercial/card-gbp-record-spec.md`
- Camada B validada: `apps/hubspot-card-gbp/`
- Recon ao vivo: 2026-08-21 (`5633277`, STANDARD/Free).
