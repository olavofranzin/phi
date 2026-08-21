# Decisão de produção — Card estratégico GBP no record do Deal (HubSpot)

> **Entregável H3** do brief `docs/handoff/2026-07-11-hubspot-record-card-gbp-design-build-subchat-brief.md`
> (sub-chat de finalização dos cards). Responde à pergunta: **como o card rico chega a produção**, dado que
> o portal está no tier **Free** e **portal Free não renderiza App Card**.
> **Complementa** a spec `docs/comercial/card-gbp-record-spec.md` (que define campo→coluna→card).
> **Guardrail-mãe:** o card **EXIBE** dados — nunca escreve propriedade nem move o deal.

---

## 0. Fatos travados (recon read-only ao vivo 2026-08-21)

- **Portal** `5633277` · `accountType` **STANDARD** · moeda **BRL** · fuso `America/Sao_Paulo`
  (confirmado hoje via `get_organization_details`, não é hipótese).
- Tier **Free** já confirmado por Olavo em 2026-07-13 → **não re-verificar**.
- As **21 propriedades** do card já existem em `deals`; produtos **SVC-IA (1004)** e **SVC-GBP (1005)** criados
  (recon 2026-08-17). Estrutura de dados **pronta** — o que falta é só a *superfície de exibição*.
- Camada B (App Card) já **validada** no Developer Test Account `51728276` (platform 2026.03), em
  `apps/hubspot-card-gbp/`.

**Consequência dura:** o dado existe e o card existe — o único bloqueio é **onde ele renderiza**.

---

## 1. A regra de renderização (a "tabela-verdade" que decide tudo)

Onde um App Card (UI extension) efetivamente aparece depende de **duas coisas**: o **tipo de app**
(private vs public) e o **tier** do portal onde ele seria instalado.

| Superfície | Private app (static auth) | Public app (OAuth) |
|---|---|---|
| **Developer Test Account** | ✅ renderiza sempre | ✅ renderiza sempre |
| **Produção Free** (nosso caso) | ❌ não renderiza | ❌ não renderiza |
| **Produção Starter / Pro** | ❌ (private só Enterprise) | ✅ renderiza |
| **Produção Enterprise** | ✅ renderiza | ✅ renderiza |

Leitura direta para o **5633277 (Free)**: **nenhuma variação de App Card renderiza em produção hoje.**
O App Card fica sendo **protótipo no Test Account** até um upgrade de tier. Isso **não é falha** — é o desenho
do plano da HubSpot. Não há truque de configuração que contorne isso, e **não vamos tentar contornar**
(guardrail §5 da spec).

---

## 2. Os quatro caminhos até produção — avaliados

### Caminho A — Camada A nativa (agora, funciona em Free) ⭐ base

Montar a superfície com os recursos **nativos** do record (aba "IA/Diagnóstico", "Destaques de dados",
grupo de propriedades) — feito por Olavo na UI, sem dev/CLI, sem extension.

- **Renderiza em Free?** ✅ Sim, imediatamente.
- **Entrega:** ~80% do valor — página limpa, hierárquica, textões da IA numa aba própria.
- **Custo:** ~30 min de configuração na UI (guia H2 a produzir). Zero código, zero risco de plano.
- **Limite:** visual "de CRM" (property cards padrão), sem barras/badges/paleta por serviço.

### Caminho B — Módulo CMS numa página com dado real

Os 3 blocos do card (`module.html`+HubL, `module.css`, `module.js`) já prontos, publicados numa página CMS
que lê o deal via HubL/API.

- **Renderiza em Free?** ⚠️ Depende — CMS grátis existe, mas fica **fora do record do deal** (é uma página,
  não o CRM). Serve para **demonstração visual com dado real** e para validar a estética rica, não como a
  experiência operacional dentro do CRM.
- **Custo:** baixo (blocos prontos), mas exige hospedar/rotear a página e passar o `dealId`.
- **Papel:** **prova visual** do card rico + trampolim para o Test Account; **não** substitui o card no record.

### Caminho C — Upgrade de tier (destrava o App Card no record)

Subir o portal para **Starter+** (com public app OAuth) ou **Enterprise** (permite private app).

- **Renderiza em Free?** N/A — é o que **sai** do Free.
- **Entrega:** o card rico **de verdade dentro do record**, exatamente como validado no Test Account.
- **Custo:** decisão comercial/financeira do Olavo (mensalidade HubSpot). **Fora do escopo técnico** —
  é um gatilho de negócio, não uma tarefa de engenharia.

### Caminho D — Public app + OAuth (se distribuir o card a clientes)

Empacotar como **public app** e distribuir via OAuth para portais de clientes (Starter+).

- **Quando faz sentido:** só se o card virar **produto para os clientes da agência** terem no CRM deles.
- **Custo:** app público + fluxo OAuth + processo de listagem/instalação. Investimento real.
- **Hoje:** **prematuro.** É o caminho de *escala*, não o de *ativação interna*.

---

## 3. Recomendação

**Ativar o Caminho A (nativo) agora, manter B pronto como prova visual, e tratar C/D como gatilhos futuros.**

1. **Agora (H2):** Camada A nativa em produção — entrega 80% do valor no record, funciona em Free, sem risco.
   É o **caminho de ativação** e não depende de mais ninguém além do Olavo na UI.
2. **Sob demanda (B):** publicar o módulo CMS numa página com um deal real (ex.: Niti `60040868935`) quando
   houver necessidade de **mostrar o card rico** (reunião, validação de estética, material comercial). Fica
   como *prova*, não como operação.
3. **Gatilho de upgrade (C):** no dia em que a agência subir o HubSpot para **Starter+** (por qualquer motivo
   comercial), promover o App Card já validado do Test Account para produção — o trabalho técnico já está feito
   em `apps/hubspot-card-gbp/`.
4. **Só se virar produto (D):** public app + OAuth quando/se o card for oferecido aos clientes. Não antes.

**Por quê:** o dado e os dois artefatos (nativo + extension) já existem. O gargalo é puramente *tier de
renderização*. Gastar esforço em C/D hoje é pagar por escala que ainda não foi decidida; a Camada A entrega o
valor imediato sem custo de plano. A ordem certa é **ativar barato agora (A)** e **promover quando o negócio
justificar (C/D)**.

---

## 4. Matriz-resumo (para decisão rápida do Olavo)

| Caminho | Renderiza no record em Free? | Esforço | Quando escolher |
|---|---|---|---|
| **A — Nativo** | ✅ agora | Baixo (UI, ~30 min) | **Agora** — ativação padrão |
| **B — Módulo CMS** | ⚠️ fora do record (página) | Baixo | Prova visual com dado real |
| **C — Upgrade tier** | ✅ após upgrade | Custo comercial | Quando a agência subir de plano |
| **D — Public app + OAuth** | ✅ (Starter+ do cliente) | Alto | Só se distribuir a clientes |

---

## 5. Guardrails (herdados da spec §6)

- Produção `5633277`: card e aba **exibem**; **nunca** alteram propriedade nem movem o deal.
- **Nunca** em deals `closedwon` / `closedlost`.
- **Não** subir nada em produção sem Olavo ver o mockup (artifact `e2c97b96-eaf2-41de-b9d2-5237771eed1b`).
- Se API/CLI/plano não permitir algo, **reportar e cair na Camada A nativa** — **nunca** contornar limitação de
  plano para forçar a extension no Free.
- Criar propriedade/produto novo **só** após OK do Olavo.

---

## 6. Âncoras

- Spec do card (campo→coluna→card): `docs/comercial/card-gbp-record-spec.md`
- App Card validado (Camada B): `apps/hubspot-card-gbp/` (+ README)
- Brief do sub-chat: `docs/handoff/2026-07-11-hubspot-record-card-gbp-design-build-subchat-brief.md`
- Mockup de validação (Claude Design): artifact `e2c97b96-eaf2-41de-b9d2-5237771eed1b`
- ADR da decisão: `docs/strategic-planning/saude-digital/adr-rascunhos/ADR-34-caminho-producao-card-gbp.md`
- Recon read-only ao vivo: 2026-08-21 (portal `5633277`, `accountType` STANDARD/Free confirmado).
