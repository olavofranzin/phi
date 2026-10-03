# Passo a passo — Configuração nativa do CRM (HubSpot Free)

> **Companion executável** do `guia-formatacao-crm.md`. Checklist para o **Olavo aplicar na UI** do
> portal `5633277` (**tier Free**). Cada passo marca a viabilidade: **Free ✅** (dá pra fazer agora),
> **Pro ⛔** (precisa upgrade — com **contorno Free** ao lado).
>
> **Regra de ouro:** a IA (PHI/n8n) **preenche** campos; **mover/fechar o deal é humano**. Nada aqui
> cria automação que mova deal.
> **Antes de começar:** ter perfil **Super Admin**. Caminhos de menu podem variar de nome — o que
> importa é o destino.

---

## Bloco 0 — Decidir antes (3 definições do Olavo)
- [ ] **Corte de `potencial_comercial` para virar MQL** (ex.: ≥ 60). É o filtro "fit + intenção".
- [ ] **Donos (owners)** por etapa (quem é o SDR/vendedor que recebe no "Aprovado p/ Abordagem").
- [ ] **Opções de "motivo de rejeição" e "motivo de perda"** (listas fechadas — sugestões nos blocos 3 e 6).

---

## Bloco 1 — Estágios do pipeline de Negócios · **Free ✅**
**Caminho:** Configurações (⚙) → Objetos → **Negócios** → **Pipelines** → pipeline `default`.

- [ ] Renomear/criar os estágios nesta ordem (manter os 2 fechados que já existem):
  1. **Prospectado** (entrada — já existe) — *prob. 10%*
  2. **Diagnosticado** — *20%* (PHI preencheu score/oferta/NBA)
  3. **Aprovado p/ Abordagem** — *30%* (humano aceitou)
  4. **Em Qualificação** — *50%* (contato feito, BANT/MEDDIC)
  5. **Proposta** — *70%* (proposta + line items SVC-*)
  6. **Fechado Ganho** (`closedwon`) — *100%*
  7. **Fechado Perdido** (`closedlost`) — *0%*
- [ ] Ao salvar cada estágio, anotar que a **data de entrada** em cada um é registrada
  automaticamente pelo HubSpot (base das métricas de velocidade — Bloco 8).

> Free = **1 pipeline**. Não criar um 2º (isso é Starter+).

---

## Bloco 2 — Propriedades de governança · **Free ✅** (aproveitando nativas)
**Caminho:** Configurações → **Propriedades** → objeto **Negócio** (ou Contato).

**Já existem nativas — só usar (não criar):**
- [ ] **Motivo de perda** → propriedade nativa **`Closed lost reason`** (Negócio). Editar as opções
  (Bloco 6).
- [ ] **Nº de vezes contatado** → nativa **`Number of times contacted`** (cadência ≥8).
- [ ] **Data da próxima atividade** → nativa **`Next activity date`** (evita o "limbo"/stall).
- [ ] **Proprietário do negócio** → nativa **`Deal owner`**.

**Criar (não existem) — botão "Criar propriedade":**
- [ ] `data_primeiro_contato` — tipo **Data/hora** — objeto Negócio. *(mede Speed to Lead)*
- [ ] `motivo_rejeicao_mql` — tipo **Lista suspensa** — objeto Negócio. *(fecha o buraco MQL→SAL)*
      Opções sugeridas: `Fit fraco` · `Timing ruim` · `Fora do ICP` · `Sem orçamento` · `Duplicado`.

> Os **21 campos GBP + textões de IA já existem** (recon 2026-08-17) — nada a criar para o diagnóstico.

---

## Bloco 3 — Lead Status (a nuance do SAL/cadência) · **Free ✅**
**Caminho:** Configurações → Propriedades → **Contato** → **`Lead Status`** → editar opções.

- [ ] Definir as opções: `Novo` · `Aceito` · `Em cadência` · `Reciclado` · `Descartado`.
- [ ] Convenção: ao aceitar a abordagem, Lead Status = **Aceito** (dispara o SLA de 5 min do Bloco 7).

---

## Bloco 4 — Lifecycle Stage · **Free ✅ (padrão)** / custom = **Pro ⛔**
**Caminho:** Configurações → Propriedades → Contato/Empresa → **`Lifecycle stage`**.

- [ ] Usar os estágios **padrão** do HubSpot e mapear (não criar custom no Free):
  `Lead` → Known Lead · `Marketing Qualified Lead` → MQL · `Sales Qualified Lead` → SQL ·
  `Opportunity` → Oportunidade · `Customer` → Cliente.
- [ ] **SAL não é estágio padrão** → representar via **Lead Status = Aceito** (Bloco 3), não via lifecycle.
- ⛔ **Custom lifecycle stages** (ex.: um "SAL" formal) = Pro/Enterprise. **Contorno Free:** Lead Status.
- ⛔ **Transição automática de lifecycle** por regra = Pro (workflows). **Contorno Free:** a mudança de
  deal stage e o preenchimento vêm do **pipeline PHI (n8n)** ou é setada à mão.

---

## Bloco 5 — Layout do registro (surfacing dos campos) · **Free ✅ parcial** / abas = **Pro ⛔**
**Caminho:** Configurações → Objetos → Negócios → **Personalizar registro** / barra lateral "Sobre".

- [ ] **Free ✅ — Barra lateral esquerda / "Sobre este negócio":** deixar enxuta — `dealname`, contato,
  **pipeline/etapa**, `deal owner`, botões de ação. **Zero texto de IA aqui.**
- [ ] **Free ✅ — Destaques (highlights):** os 3 que decidem — `potencial_comercial` ·
  `oferta_recomendada` · **Etapa do negócio**.
- [ ] **Free ✅ — Grupo de propriedades:** agrupar os campos GBP/IA no grupo `ia_enriquecimento`
  (aparece em "Ver todas as propriedades" de forma coerente).
- ⛔ **Aba dedicada "IA/Diagnóstico" no meio do registro (tabs/cards)** = geralmente **Sales Hub Pro+**.
  **Contorno Free:** manter os 7 textões no **grupo `ia_enriquecimento`** (barra lateral / "Ver todas as
  propriedades"); a leitura fica um clique mais fundo, mas sem custo. A **aba rica** entra no upgrade
  (é a Camada B / App Card do `card-gbp-record-spec.md`).

> Correção honesta ao `card-gbp-record-spec.md` §2: a **aba** nativa no meio do registro exige Pro; no
> Free ela vira **grupo de propriedades**. Os "Destaques" e a barra lateral, esses, são Free.

---

## Bloco 6 — Critérios de saída (campos obrigatórios por estágio) · **confirmar no portal**
**Caminho:** Pipelines → estágio → **"Configurar propriedades do estágio"** (conditional/required).

- [ ] Tentar marcar como **obrigatório para mover**:
  - **→ Diagnosticado:** `potencial_comercial` preenchido.
  - **→ Aprovado p/ Abordagem:** `proxima_acao_aceite = aceita`.
  - **→ Em Qualificação:** `data_primeiro_contato` preenchida.
  - **→ Proposta:** campo(s) de BANT/MEDDIC (criar um campo simples `qualificacao_bant` se quiser).
  - **→ Fechado Perdido:** `Closed lost reason` obrigatório.
- ⚠️ Se o Free **não permitir "obrigatório"**: **contorno** = deixar como *propriedade sugerida do
  estágio* + **regra de processo** ("não move sem preencher") + uma **view salva** de deals sem o campo
  (Bloco 8) para auditar quem pulou etapa.

---

## Bloco 7 — SLAs · **processo no Free** / automação = **Pro ⛔**
No Free **não há workflow** para cronometrar/rotear. Então os SLAs são **disciplina + apoio manual**:

- [ ] **Speed to Lead ≤ 5 min** (Lead Status=Aceito): criar **Tarefa** automática no aceite (à mão ou
  pelo PHI) + medir por `data_primeiro_contato` − data do aceite.
- [ ] **Aceite/rejeição de MQL ≤ 24 h:** **view salva** "Diagnosticado há > 24 h" (Bloco 8) revisada 1×/dia.
- [ ] **Cadência ≥ 8 tentativas:** acompanhar por `Number of times contacted`; só ir a `Reciclado`
  depois de 8. (A cadência automatizada multi-canal = Pro; no Free é manual/PHI.)
- ⛔ Timer de SLA, rotação de leads e auto-fill nativos = **Pro (workflows)**. **Contorno Free:** o
  **auto-fill e o disparo de tarefa já vêm do pipeline PHI (n8n)** — não dependemos do workflow do HubSpot.

---

## Bloco 8 — Views e métricas (velocidade) · **Free ✅ básico** / avançado = **Pro ⛔**
**Caminho:** Negócios → **Visualizações salvas**; Relatórios → Dashboards.

- [ ] **Views salvas** (Free ✅) para caçar stall:
  - "Diagnosticado > 24 h" (fura SLA de aceite).
  - "Aprovado sem `data_primeiro_contato`" (fura Speed to Lead).
  - "Parados > 30 dias em qualquer etapa" (**Stall Rate**).
- [ ] **Relatório básico** (Free ✅): "Negócios por etapa" + "tempo médio por etapa" (o HubSpot já
  guarda a data de entrada em cada estágio).
- ⛔ **Pipeline Velocity** composto e dashboards avançados = Pro. **Contorno Free:** calcular fora
  (planilha/PHI) a partir do export de deals — **mas** o alvo é justamente sair da planilha; tratar
  como provisório até o upgrade.

---

## Bloco 9 — Ordem de execução sugerida
1. Bloco 0 (decisões) → 2. Bloco 1 (estágios) → 3. Blocos 2–4 (propriedades/status/lifecycle) →
4. Bloco 5 (layout) → 5. Bloco 6 (obrigatórios/contorno) → 6. Bloco 3+7 (SLAs de processo) →
7. Bloco 8 (views). Depois: validar com os 2 deals reais (Niti `60040868935`, Clínica Guerra `60039196744`).

---

## Resumo Free vs. upgrade
| Precisa de Pro+ | Contorno no Free (agora) |
|---|---|
| Workflows (SLA timer, rotação, auto-fill) | Tarefas + views salvas + **auto-fill pelo PHI/n8n** |
| Aba rica no meio do registro / App Card | Grupo de propriedades + Destaques + barra lateral |
| Custom lifecycle stages | Lead Status para o "SAL" |
| 2+ pipelines | 1 pipeline `default` |
| Dashboards de velocidade avançados | Views salvas + relatório básico + cálculo externo provisório |

> **Nada aqui muda dado de produção sem o Olavo** — é tudo config de estrutura. A escrita de dados
> (quem preenche os campos) depende da **consolidação dos writers** (sub-chat de simplificação).

## Fontes (limites do tier, verificados)
Ver seção final do chat.
