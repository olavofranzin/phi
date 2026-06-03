# [BRUTO v0.2] Execução das Demandas — Extração do tácito + Design Lote 0

> **STATUS:** Strawman v0.2. v0.1 red-lined por Olavo em 2026-06-03;
> §4 e §11 atualizados; demais seções confirmadas. Aguarda v0.3 pendente de
> definição do **Curador de Procedimentos** (frente nova — ver §16).
> Nada aqui tocou Notion canônico nem código (Codex). Este doc é o artefato
> de revisão. Cada premissa de domínio está marcada `[PRESUMIDO]` — risque,
> corrija ou confirme.
>
> **FONTE DE VERDADE:** Notion (estado), BigQuery (dados de produto/analytics).
> Este `.md` é espelho versionado de design, não fonte canônica.

---

## 0. Como cheguei aqui

Olavo respondeu o bloco de extração do tácito assim:
- **(3) Roteamento:** opera sozinho hoje.
- **(6) Agente por tier:** agente IA faz **total** — controle de prazos,
  distribuição de tarefas (redistribuição por humano), gestão de prioridades
  (alterável por humano) e padronização dos entregáveis.
- **(7) Miro:** board de fluxo das demandas + mapa visual do processo.
- **(1,2,4,5,8,9):** delegados a este desenho.

Os pontos delegados (tipos de demanda, ciclo de vida, SLA, padronização,
eventos, white-label) estão preenchidos como **proposta grounded** na operação
de tráfego pago evidenciada no repo (`daily_entry_v4`, `phi_pipeline_v2`,
`phi_subworkflow_ads_operational`, `phi_subworkflow_campaign_metrics`,
`google_ads_v2`, `wpp-intake-*`, `phi_operator_metricas`). Tudo `[PRESUMIDO]`.

---

## 1. Fato estruturante: operação SOLO

Reescreve "distribuição de tarefas":
- **NÃO é** atribuir trabalho a pessoas (não há equipe).
- **É** o agente organizar/sequenciar **a fila única do Olavo** — o que fazer
  agora, em que ordem, o que agrupar (batching), o que adiar.
- O agente vira **chief-of-staff operacional**, não dispatcher.
- O desenho do modelo de dados já prevê o campo `responsavel` (default = Olavo)
  pra quando entrar a 1ª pessoa/sub-agente — aí "distribuição" recupera a
  dimensão de destinatário sem reescrita.

---

## 2. Fronteira (TRAVADA — Olavo escolheu "Execução = consumidora")

**Dentro:** ciclo de demanda interna ponta a ponta — tickets internos +
tarefas recorrentes: intake → priorização → orquestração da fila → SLA →
execução → padronização (quality-gate) → entrega.

**Fora (consome, não constrói):**
- Scores de prioridade → framework da Priorização (lê, não calcula).
- Contrato de passagem de bastão → propriedade da Priorização (pluga nele).
- Atendimento de Solicitações de cliente → Priorização (Lote 3 dela).
- Entidade "projeto" → criada pela Priorização L1 (Abertura de Projeto Setup);
  a Execução opera **sobre** ela.

---

## 3. Princípios de produto herdados (PHI Fase 1→3)

Aplicados a TODA entidade/regra desta área desde já:
1. **`tenant_id` + `client_id` lógicos** em toda Demanda e todo evento, mesmo
   single-tenant hoje. Custa 1 campo; evita migração ao virar produto.
2. **Notion = interface humana, NUNCA cálculo.** Prioridade/SLA/quality-gate
   são computados em n8n (jsCode/Gemini); Notion só guarda resultado.
3. **BigQuery = base de verdade analítica.** Não construído no Lote 1, mas o
   schema de evento (§10) nasce compatível com sink BQ.
4. **Versionamento explícito de regras.** Cada demanda registra contra qual
   `SLA vX.Y`, `template vX.Y`, `threshold vX.Y` rodou (igual ADR-004v2 faz
   pros thresholds do PHI Score).
5. **Modular:** coleta / decisão / interface separados.

---

## 4. Tipos de demanda v0.2 (red-lined por Olavo)

### Recorrentes (Schedule Trigger)
| Tipo | Cadência | Origem |
|---|---|---|
| Conferência de ingestão de métricas (daily entry) | Diária | `daily_entry_v4` |
| Checagem de pacing/verba por campanha | Diária | `phi_subworkflow_ads_operational` |
| Revisão de PHI Score em degradação | Diária | `phi_pipeline_v2` |
| Higiene de leads (intake WhatsApp) | Diária | `wpp-intake-*` |
| **Prospecção comercial** | Diária | red-line Olavo |
| Relatório de performance por cliente | Semanal | `phi_operator_metricas` |
| **Reunião de resultados com cliente** | Semanal | red-line Olavo |

### Tickets internos (ad-hoc)
| Tipo | Gatilho |
|---|---|
| Ajuste de verba/orçamento | Decisão sua / alerta de pacing |
| Subir ou pausar criativo | Decisão sua |
| **Criação de campanhas** | red-line Olavo — projeto novo / aquisição de cliente |
| Investigar anomalia de métrica (PHI Score caiu) | Alerta automático |
| Setup/config de conta nova | Liga com Projeto Setup (L1 Priorização) |
| Solicitação operacional pontual | Telegram → intake |

**Demandas também nascem upstream:** Etapas de Onboarding (A2.1) e itens do
checklist de Projeto Setup (L1) são demandas a executar — a Execução as
**consome**, não as recria.

> **Tensão de fronteira a re-examinar (não bloqueia agora):**
> "Prospecção comercial" e "Reunião de resultados com cliente" são
> semanticamente da área **Abordagem Comercial** (outro pilar). Enquanto
> Olavo opera solo, caem na fila única da Execução. Quando a área Comercial
> existir como entidade, esses dois tipos provavelmente **migram** pra lá e
> a Execução só consome o output (lead qualificado / pauta de reunião).
> Re-examinar quando Comercial entrar no escopo. Esse tipo de mudança é
> EXATAMENTE o que o Curador de Procedimentos (§16) automatiza.

---

## 5. Ciclo de vida v0.1 `[PRESUMIDO]`

```
Aberta → Priorizada → Em execução → Em revisão (quality-gate) → Entregue → Arquivada
                                          │
                                          └─ FALHA → volta a Em execução (reaberta)
Estado lateral: Bloqueada (com motivo) — pausa SLA.
```

- Igual pra todos os tipos no v0.1 (uniforme = simples de automatizar).
  Se algum tipo precisar de ciclo próprio, vira exceção documentada — não a regra.
- **Priorizada** e **Em execução** são onde o agente Orquestrador atua.
- **Em revisão** é onde o agente Padronizador atua.

---

## 6. Arquitetura de agentes (o "agente fazendo total", destrinchado)

"Total" = um **loop**, não um monólito. Proponho **2 agentes + humano**:

### Agente Orquestrador — tier DENSO (Gemini Pro)
Roda o loop de prazos + distribuição + prioridade:
- Lê a fila de Demandas (Notion).
- Calcula/atualiza **prioridade** (consome scores da Priorização quando
  existirem; heurística própria enquanto não existir).
- Monta a **sequência do dia** (ordem + batching) = "distribuição" na operação solo.
- Monitora **SLA**, escala via Telegram o que vai estourar.
- Roda em Schedule (ex: 08:00 BR) + on-demand quando entra ticket novo.
- **Toda decisão dele é PROPOSTA gravada no Notion com `origem=agente`**;
  Olavo sobrescreve via campo de override → atende "redistribuição/prioridade
  alterável por humano".

### Agente Padronizador / Quality-Gate — tier BARATO (Gemini Flash)
- Por tipo de entregável, valida contra a Definition of Done (§8) → PASS/FAIL +
  lista do que falta. Reusa padrão **A2.10**.
- Roda quando a demanda entra em "Em revisão".

### Humano (Olavo)
- Override de prioridade/distribuição, decisão final, execução do que ainda
  não é automatizável.

### Regra de tiering (vira ADR) `[PRESUMIDO]`
> **Denso (Pro) onde a decisão é cara e rara; barato (Flash) onde é repetitiva
> e frequente.** Orquestração roda poucas vezes/dia com raciocínio caro → Pro.
> Quality-gate roda muitas vezes com validação mecânica → Flash.

---

## 7. SLA v0.1 — por CLASSE, não por tipo `[PRESUMIDO — calibre os prazos]`

| Classe | Exemplos | Prazo | "Atrasado" =|
|---|---|---|---|
| Crítica | Anomalia PHI Score, verba estourando | Mesmo dia | > janela do dia |
| Recorrente diária | Daily entry, pacing, leads | Dentro do dia | vira o dia |
| Recorrente semanal | Relatório por cliente | Dentro da semana | vira a semana |
| Ad-hoc padrão | Ajuste verba, criativo | 48h úteis | > 48h |

SLA pausa em estado **Bloqueada**. Versão da tabela registrada por demanda.

---

## 8. Padronização / Definition of Done v0.1 `[PRESUMIDO]`

"No padrão" = a demanda tem um **DoD por tipo** que o quality-gate valida.
Exemplo (relatório de performance):
- [ ] PHI Score do período + variação vs período anterior
- [ ] Top campanhas por degradação/ganho
- [ ] ≥3 ações recomendadas, acionáveis
- [ ] Auditável (execution_id + fonte dos números)

Quality-gate (Flash) → PASS/FAIL. FAIL devolve checklist do que falta.

---

## 9. Modelo de dados — entidade "Demanda" `[PRESUMIDO]`

**Decisão de modelagem:** DB **novo** `PHI - Demandas` (não estender
`Etapas de Onboarding`, que tem semântica fechada de 31 passos). Relaciona-se
a Cliente / Projeto / Etapa de origem.

Campos:
| Campo | Tipo | Nota |
|---|---|---|
| `titulo` | title | |
| `tenant_id` | text | produto-ready (default tenant PHI) |
| `client_id` | relation/text | cliente alvo (pode ser interno) |
| `tipo` | select | §4 |
| `classe_sla` | select | §7 |
| `estado` | select | §5 |
| `prioridade` | number | calculada (agente) |
| `prioridade_origem` | select | `agente` \| `humano` (override) |
| `responsavel` | person/text | default = Olavo |
| `prazo` | date | derivado de classe_sla |
| `sla_version` | text | regra versionada |
| `quality_gate` | select | `pendente`\|`pass`\|`fail` |
| `projeto_origem` | relation | L1 Priorização |
| `etapa_origem` | relation | A2.1 Onboarding |
| `observacoes` | text | `Status <provider>: ok\|falhou` (auditoria) |

---

## 10. Eventos canônicos (sink BQ futuro) `[PRESUMIDO]`

Modelar desde já, emitir como log (Notion `observacoes` + tabela de log),
plugar em BQ depois sem reescrita:

`demanda.criada`, `demanda.priorizada`, `demanda.roteada`, `demanda.iniciada`,
`demanda.sla_quebrada`, `demanda.em_revisao`, `demanda.quality_gate`
(pass/fail), `demanda.entregue`, `demanda.reaberta`.

Payload comum: `tenant_id`, `client_id`, `demanda_id`, `tipo`, `classe_sla`,
`tier_agente`, `timestamp`, `execution_id`.

**Métricas de produto que isso habilita** (resposta à pergunta 8, proposta):
lead time médio por tipo · % dentro de SLA · throughput por dia · taxa de PASS
no quality-gate · tempo em fila por classe · % de overrides humanos (mede
confiança no agente).

---

## 11. Miro v0.2 (red-lined por Olavo — kanban cortado)

**Uso único:** **Mapa visual do processo** = diagrama do SOP (estados +
roteamento). Documentação viva, atualizada quando o SOP muda. Sem sync
operacional n8n→Miro (kanban cortado no red-line — Notion serve esse
papel sozinho, sem duplicação).

---

## 12. White-label (resposta à pergunta 9) — RECOMENDAÇÃO

**Personas neutras config-driven.** Agentes nomeados por função
(`Orquestrador`, `Padronizador`), com camada de marca = variável `{{BRAND}}`
(default "PHI") nos prompts. Barato agora, evita renomear tudo se virar produto
white-label. Alinha com "white-label core + brand layer" dos docs.

---

## 13. Plano de lotes da Execução

- **Lote 0 — Fundação (este doc → SOP + âncora + ADRs):** design/Notion, zero
  código. Roda em paralelo ao re-smoke A2.3 do Onboarding.
  - SOP de Execução de Demandas
  - DB `PHI - Demandas` (§9)
  - ADR — Tiering de agentes (§6)
  - ADR — Modelo de evento + sink BQ futuro (§10)
  - Âncora da área (espelha a da Priorização)
- **Lote 1 — Engine mínimo coeso:** 1 tipo recorrente ponta a ponta
  (intake → Orquestrador prioriza/sequencia → SLA → alerta Telegram → digest).
  Valida a stack, igual Lote 1 Onboarding.
- **Lote 2 — Quality-gate (Padronizador):** padrão A2.10.
- **Lote 3 — Tickets internos ad-hoc + espelho Miro.**
- **Lote 4+ — Expansão de tipos + integração com scores da Priorização quando
  ela entregar o framework.**

---

## 14. Status do red-line v0.1 → v0.2 (resolvido 2026-06-03)

| # | Item | Status |
|---|---|---|
| 1 | Tipos de demanda (§4) | ✅ Atualizado — +prospecção, +reunião resultados, +criação de campanhas. Tensão fronteira Comercial registrada. |
| 2 | Ciclo de vida (§5) | ✅ OK |
| 3 | Classes/prazos SLA (§7) | ✅ OK |
| 4 | DoD padronização (§8) | ✅ OK |
| 5 | 2 agentes vs 1 (§6) | ✅ OK — Orquestrador (Pro) + Padronizador (Flash) |
| 6 | DB novo `PHI - Demandas` (§9) | ✅ OK |
| 7 | White-label `{{BRAND}}` (§12) | ✅ OK |
| 8 | Eventos/métricas (§10) | ✅ OK |
| 9 | Miro (§11) | ✅ Reduzido a mapa visual do processo (kanban cortado) |

**Pendência ABERTA — não bloqueia a v0.2 da Execução, mas redesenha o pilar:**
Olavo trouxe um **3º agente** (vide §16) que não é da Execução — é
meta-agente do pilar Procedimentos. Definição dele em scoping separado.

---

## 15. Próximos passos

1. ✅ v0.2 incorporada.
2. ⏸ **Aguardando** definição do Curador (§16) — não bloqueia, mas pode
   afetar S1/§9 se o Curador exigir campos extras na Demanda (ex:
   `versao_sop_aplicada`).
3. Após teu OK final: derivo **SOP** + abro **DB `PHI - Demandas`** + **âncora**
   no Notion (canônico).
4. Rascunho os 2 **ADRs** (tiering, evento/BQ).
5. Brifo o **Codex** pro Lote 1 (engine mínimo), seguindo padrões inegociáveis
   do Lote 1 Onboarding.

---

## 16. Curador de Procedimentos (frente nova — scoping)

**Origem:** red-line do Olavo (2026-06-03). Pediu um agente que entenda
mudanças de escopo da agência (ex: entrada de Sites/Agentes IA além de
tráfego pago) e reorganize SOPs/SLAs/modelos de dados/prompts dos outros
agentes sem retrabalho manual.

**Status:** scoping. Detalhamento, análise estratégica de onde mora
(Procedimentos da Operação vs Execução vs PHI inteiro), trigger,
aplica-vs-propõe e tier do agente estão sendo discutidos com Olavo em
paralelo a este doc. **Não é o 3º agente da Execução** — é meta-agente
do pilar Procedimentos da Operação.

**Dependência crítica identificada:** o Curador exige um **Catálogo de
Artefatos Operacionais** vivo (inventário do que existe: SOPs, DBs, prompts,
ADRs, SLAs por área). Provavelmente vira o 1º entregável do Lote 0 dele.

Strawman do Curador entra como doc próprio quando o scoping fechar:
`docs/strategic-planning/curador-procedimentos/BRUTO-v0.1-design.md`.
