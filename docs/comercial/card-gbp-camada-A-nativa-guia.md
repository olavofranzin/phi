# Guia passo a passo — Camada A nativa do Card GBP (para o Olavo aplicar na UI)

> **Entregável H2.** Passo a passo para montar, **na interface do HubSpot** (sem código, sem CLI), a versão
> nativa do diagnóstico GBP no record do Deal. Funciona no portal **Free** `5633277` e entrega ~80% do valor.
> Baseado na spec `docs/comercial/card-gbp-record-spec.md` (§2 e §2.5) e na decisão H3
> (`docs/comercial/card-gbp-decisao-producao.md`).
>
> **Guardrail-mãe:** tudo aqui é **exibição**. Nenhuma automação escreve propriedade nem move o deal.
> Você está só **arrumando como a página aparece** — não muda nenhum dado.

---

## Antes de começar (1 minuto)

- Onde tudo acontece: **Configurações (⚙️) → Objetos → Negócios → aba "Personalização de registro"**
  (ou "Personalizar a experiência de registro").
- Você vai editar a **visão padrão** do record (a que todo mundo vê ao abrir um negócio).
- Nada aqui cria propriedade nova — as 21 propriedades do card **já existem**. Só estamos posicionando.
- Faça em um horário calmo: a mudança vale para todos os records de Negócio.

---

## Passo 1 — Coluna ESQUERDA: deixar enxuta

**Objetivo:** a esquerda mostra só *quem é o negócio*. Zero métrica de IA/GBP.

Deixe apenas:
- `dealname` (nome do negócio)
- Contato: nome, telefone, e-mail
- **Pipeline + etapa** (`dealstage`)
- Botões de ação (Ligar / E-mail / Tarefa)

**Remova da esquerda** qualquer campo de scoring, dimensão ou texto de IA (eles vão para o centro/aba).

---

## Passo 2 — "Destaques de dados" (topo da coluna central): 3 campos

No topo da coluna central existe a faixa **"Destaques de dados"** (normalmente 3 a 5 campos).
Configure para mostrar exatamente estes 3, nesta ordem:

1. `potencial_comercial` — **Potencial Comercial (GBP)**
2. `oferta_recomendada` — **Oferta Recomendada (GBP)**
3. `dealstage` — **Etapa do negócio**

Esses são os 3 que respondem "vale a pena e em que pé está" num olhar.

---

## Passo 3 — Aba "IA / Diagnóstico" (coluna central): os textões

**Objetivo:** tirar os textos longos da visão geral e jogá-los numa aba só deles (leitura sob demanda).

1. Na área de **abas** da coluna central, clique em **adicionar aba** e nomeie **"IA / Diagnóstico"**.
2. Dentro dela, adicione um (ou mais) **card de propriedades** contendo estes 7 campos, **nesta ordem**:
   1. `analise_gbp_ia` — Analise GBP (IA)
   2. `proxima_acao_recomendada` — Próxima Ação Recomendada
   3. `abordagem_sugerida_ia` — Abordagem sugerida (IA)
   4. `analise_site_ia` — Analise site (IA)
   5. `analise_instagram_ia` — Analise Instagram (IA)
   6. `dados_enriquecimento` — Dados Enriquecimento
   7. `followup` — Follow-up

> **Observação:** hoje `analise_gbp_ia` costuma vir preenchido; site / Instagram / abordagem ainda podem
> aparecer **vazios** — eles dependem dos agentes de enriquecimento (C2–C4, fora deste guia). Deixe o
> slot pronto: quando o dado chegar, já aparece no lugar certo.

---

## Passo 4 — Grupo de propriedades (coerência no CRM)

Mantenha os campos GBP/IA agrupados no grupo existente (**`ia_enriquecimento`** / scoring GBP), para que,
ao expandir "ver todas as propriedades", eles fiquem juntos e legíveis — não espalhados.

---

## Passo 5 — Coluna DIREITA: apoio

Na coluna direita, deixe:
- **Associações:** Contato e Empresa.
- **Métricas secundárias:** `createdate` (data de criação), última modificação,
  `nao_reivindicado` (GBP Não Reivindicado), `site_tipo` (Tipo de Site).

São informações de contexto — não competem com o diagnóstico do centro.

---

## Passo 6 — Salvar e conferir

Salve a visão. Depois abra 2 deals reais e confira (é o **teste de aceitação** da spec §5):

| O que olhar | 🦷 Niti Odontologia (`60040868935`) | Clínica Guerra (`60039196744`) |
|---|---|---|
| Destaques (topo) | Potencial **79** · Oferta **SVC-ADS** · Etapa | Potencial **11** · Oferta **SVC-SITE** · Etapa |
| Aba IA/Diagnóstico | `analise_gbp_ia` preenchido (aponta Engajamento 0) | `analise_gbp_ia` preenchido (site=rede / conversão) |
| Esquerda | só identidade (sem IA) | só identidade (sem IA) |
| Direita | associações + `createdate` etc. | idem |
| Visão geral | **limpa** — sem textão solto na página | **limpa** |

- Abra também um deal **sem** dados GBP (não veio do fluxo Maps): a página deve ficar limpa, sem erro —
  os campos GBP simplesmente aparecem vazios.

---

## O que a Camada A **não** entrega (e tudo bem)

A versão nativa não tem as barras coloridas por dimensão, os badges por serviço nem a paleta rica — isso é a
**Camada B (App Card)**, que **não renderiza em Free** (ver decisão H3). O App Card já está pronto e validado no
Developer Test Account, esperando um eventual upgrade de tier. A Camada A entrega a **hierarquia e a limpeza**
da página agora, que é o que mais importa no dia a dia.

---

## Guardrails (não pular)

- Portal **produção** `5633277`: a página **exibe** dados; **nunca** altere valor de propriedade nem mova o deal
  por aqui.
- **Nunca** em deals `closedwon` / `closedlost`.
- **Não** criar propriedade nova para isto — as 21 já existem.
- Se algo na UI empurrar para "criar campo" ou "automatizar", **pare** — este guia é só posicionamento visual.

---

## Âncoras

- Spec (campo→coluna→card/aba): `docs/comercial/card-gbp-record-spec.md` (§2 e §2.5)
- Decisão de produção (por que nativo agora): `docs/comercial/card-gbp-decisao-producao.md`
- Mockup de validação (Claude Design): artifact `e2c97b96-eaf2-41de-b9d2-5237771eed1b`
