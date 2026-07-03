# [BRUTO v0.1] Otimização de Campanhas — playbooks por fase de vida (Lote 0)

> **STATUS:** RASCUNHO DE DESIGN (git canônico, ADR-012). Autorizado por Olavo
> em 2026-07-03 ("pode começar") como **Lote 0 — design/extração do tácito**,
> com gate explícito: **Lote 1 (engine) só após o keystone PHI·Mídia ter sinal**
> (decisões do report 2026-07-02 + smoke do Agregador draft `cbd3568d`).
> **Não** é estado operacional; decisões viram ADR no Notion na red-line.
>
> **PRÉ-LEITURA:** `docs/handoff/2026-07-02-saude-digital-phi-midia-score-analise-report.md`
> (estado real do score) · `docs/handoff/2026-07-02-saude-digital-agregador-t28-analise-e-fix-draft.md`
> (§2 decisões, §4 matriz writer/consumer) · ADR-21 (guardas cognitivas) ·
> ADR-22 (loop O.D.A.E.) · `saude-digital/BRUTO-v0.1-arquitetura-saude-digital.md`.

---

## 0. Por que este doc existe

Na conversa de 2026-07-02/03, Olavo verbalizou o modelo mental de otimização
que até então era tácito — e perguntou se devíamos "passar para esta fase
agora". A resposta acordada: **sim para o design, não para a construção**.
O gargalo desta camada não é código (o loop alerta→tarefa→checklist→log já
existe em produção); é transformar o conhecimento de gestão de tráfego em
**playbooks versionados e roteáveis por fase de vida da campanha**. Esse
trabalho não depende do dado estar consertado — e informa de volta o modelo
do score (talvez a resposta ao que ES/RS/OS deveriam ser saia daqui).

**Princípio inegociável (regra 10 do CLAUDE.md):** o PHI **detecta, classifica
e orienta — nunca executa otimizações**. Esta camada estrutura a ORIENTAÇÃO;
quem executa é o gestor. Qualquer evolução para execução automática exige ADR
próprio e não está no escopo deste design.

---

## 1. O modelo conceitual — fase de vida define o playbook (extraído do tácito, 2026-07-02/03)

A mesma leitura ("zero conversões") significa coisas opostas dependendo da
fase da campanha. A fase não é metadado: é **a chave de roteamento** da
otimização.

| Fase | Definição operacional (v0.1) | Postura | O que é "normal" | O que dispara ação |
|---|---|---|---|---|
| **Aprendizado** | 0–14 dias desde criação OU desde última alteração vital (público, criativo, meta de conversão, orçamento >20%) e ainda sem ~50 conversões/semana no conjunto | **Verificação DIÁRIA + correções leves.** NÃO mexer no que reseta o aprendizado | CPA alto e instável; entrega variando | Anúncio reprovado; tracking não disparando; gasto ≠ orçamento; erro estrutural |
| **Aprendizado limitado** | Passou da janela sem atingir eventos suficientes (status da plataforma ou proxy: <50 conv/semana persistente) | Reduzir fricção para o algoritmo | Entrega menos eficiente e mais cara | Trocar meta de conversão por evento mais frequente (ex.: page view em vez de compra); consolidar conjuntos |
| **Madura** | Saiu do aprendizado (idade > 14d sem alteração vital E volume atingido, ou estabilizada) | Leitura por janela (D-7/D-30); playbooks por sintoma | Flutuação dentro do ruído (Tema 19) | Sintomas do §3 |
| **Madura SEM conversão** | >14 dias e zero conversões | **"Outro caminho de otimização"** — deixou de ser problema de campanha iniciante | — (nada é normal aqui) | Diagnóstico estrutural: tracking → oferta → landing → segmentação → verba |

Notas de fronteira (a travar na red-line):
- Os limiares 14d/50conv vêm do guideline **Meta**; Google Ads tem semântica
  própria (aprendizado ~7 dias pós-mudança de lance). **Limiares por
  plataforma, em config** (`model_config` ou tabela própria), nunca hardcoded.
- "Alteração vital" reseta o relógio da fase — o Log de Otimizações é a fonte
  natural desse evento (ação registrada → recalcula fase).
- Distinção com a guarda ADR-21: **`fase_campanha` roteia playbook** (que ação
  cabe); **`volume_janela` guarda leitura** (se há dado para afirmar algo).
  São dimensões ortogonais: madura + zero conversões na janela = volume baixo
  E sinal fortíssimo — alerta máximo, não "sem dado". Substitui a flag única
  `volume_suficiente` atual (decisão pendente do Agregador, §2 item 2).

---

## 2. Posição na arquitetura — nada de sistema novo

A camada de otimização é **conteúdo + roteamento** sobre o que já roda:

```
score/flags (Pipeline_v2, t28, L3)         ← sinal (pós-keystone)
        │
        ▼
  [ROTEADOR DE PLAYBOOK]  fase_campanha × sintoma → playbook Pn   ← o que este design adiciona
        │
        ▼
  Loop O.D.A.E. (ADR-22, em produção): Alerta → Tarefa (DB Tasks)
        → Checklist (DB Checklist, itens = passos do playbook)
        → execução HUMANA → Log de Otimizações (write-back)
        → Fechar Otimização (`83vfKD8XMYmjZjFQ`) / Auto-Close
        │
        ▼
  aprendizado: efeito da ação medido na janela seguinte (t28/score)
```

Reuso explícito: DB Tasks (`19fb65e5-c72b-812d`), DB Checklist
(`19fb65e5-c72b-81cd`), Log de Otimizações (`19fb65e5c72b8106`), WF Fechar
Otimização, Auto-Close (hoje GOOD; EXCELLENT em backlog). O que NÃO existe
hoje: (a) noção de fase, (b) playbooks como conteúdo versionado, (c) roteador
sintoma→playbook, (d) medição de efeito pós-ação.

---

## 3. Taxonomia de playbooks (strawman — red-line com Olavo)

Cada playbook vira um **SOP versionado** (DB SOPs) cujo corpo é o checklist
instanciado na tarefa. Estrutura padrão: gatilho → diagnóstico (passos de
verificação) → ações candidatas → **o que NÃO fazer** → critério de saída →
prazo de reavaliação.

| # | Playbook | Fase | Gatilho (sinais já disponíveis) | Espírito das ações | O que NÃO fazer |
|---|---|---|---|---|---|
| P1 | Rotina diária de aprendizado | Aprendizado | fase=aprendizado (gatilho temporal diário) | Verificar: entrega ativa, anúncios aprovados, tracking disparando, gasto ≈ orçamento | Mexer em público/criativo/meta de conversão; orçamento >20%; pausar "para ver" |
| P2 | Destravar aprendizado limitado | Apr. limitado | <50 conv/semana persistente pós-janela | Meta de conversão mais frequente; consolidar conjuntos/orçamento | Multiplicar conjuntos; resets em sequência |
| P3 | Estrutural sem conversão | Madura s/ conv | >14d e conversions_janela = 0 | Ordem de diagnóstico: tracking → oferta → landing (Clarity: rage/dead clicks; GA4: bounce/engajamento) → segmentação (pct_* termos) → verba | Tratar como ajuste fino de lance; esperar mais uma janela sem hipótese |
| P4 | Eficiência (CPA/meta estourada) | Madura | conversões > 0 e métrica-mãe fora da meta (MAS baixo / miv > 0) | Termos de busca (pct_other/competitor altos → negativação), lances, horários/dispositivos | Mudanças estruturais que resetam aprendizado sem antes esgotar eficiência |
| P5 | Volume/leilão caindo | Madura | impressões↓, impression_share↓, budget_lost_is↑ | Verba, abrangência, competitividade de lance | Cortar orçamento em reação a CPA momentâneo |
| P6 | Fadiga de criativo | Madura (Meta) | CTR↓ com frequency↑ (t28_meta: reach/frequency) | Renovar criativo com sobreposição (novo entra antes do velho sair) | Trocar tudo de uma vez (reset total) |

Observação: os gatilhos usam colunas que o T28 **já persiste**
(impression_share, budget_lost_is, pct_*, frequency, Clarity, GA4) — a camada
de análise L3 (flags híbridas regras+LLM, decisão Olavo 2026-06-30) é quem
avalia o gatilho; o playbook é o que ela **recomenda**.

---

## 4. Contrato com o score e com as análises

- **Consome:** `fase_campanha` + `volume_janela` (a criar), `phi_classification`
  + componentes (pós-fix), flags L3 (`PHI - ANÁLISES`), colunas t28.
- **Devolve:** cada tarefa fechada com ação registrada no Log de Otimizações é
  um **experimento rotulado** (Temas 07/21 do ADR-21): ação → efeito na janela
  seguinte. É a matéria-prima da falseabilidade do PHI (o índice passa a ser
  validável contra resultados).
- **Candidato para ES/RS/OS (registrar, não decidir):** os placeholders do
  score podem ganhar semântica AQUI — ex.: RS = "responsiveness" (tempo em
  alerta até ação / tempo até efeito), OS = aderência ao playbook (checklist
  completado vs. abandonado), ES = saúde de execução da conta (frequência de
  resets vitais). Se confirmado, o ADR do modelo v1.2 nasce com fórmulas que
  significam algo — em vez de inventar métricas para preencher siglas.
- **Alertas em fase de aprendizado:** reinterpretados, não suprimidos —
  CRITICAL de CPA em aprendizado vira tarefa P1 (rotina), não P4 (eficiência).
  (Decisão D3 abaixo.)

## 5. Visão futura registrada (fora do escopo do Lote 0/1)

**Agente de planejamento de campanha** (Olavo, 2026-07-02): no planejamento,
um agente ajuda a definir e grava os campos que a otimização depois audita —
métrica-mãe (tipo), meta (valor), objetivo, orçamento, fase inicial. O
planejamento cria o contrato; a otimização cobra o contrato. Depende do padrão
(tipo, valor) da métrica-mãe (pendência 4 do report do Agregador).

---

## 6. Decisões a travar na red-line (D1–D7)

| # | Decisão | Proposta v0.1 |
|---|---|---|
| D1 | Definição e limiares das fases, por plataforma | Tabela do §1; limiares em config; "alteração vital" definida por lista fechada |
| D2 | Onde a fase é calculada e persistida | No T28 (colunas `fase_campanha` em t28_campaign) + espelho no score; fonte do relógio = Data de Início (Notion) + Log de Otimizações (resets) |
| D3 | Alertas durante aprendizado | Reinterpretar (rotear para P1/P2), nunca suprimir silenciosamente |
| D4 | Forma dos playbooks | SOPs versionados no DB SOPs; checklist da tarefa gerado a partir do SOP vigente (id do SOP registrado na tarefa — auditável) |
| D5 | Papel do LLM | Igual L3: regras determinísticas disparam, LLM contextualiza e recomenda playbook + preenche hipótese; humano executa |
| D6 | Métrica de sucesso da camada | Tempo médio em WARNING/CRITICAL até ação; % de otimizações fechadas com efeito positivo na janela seguinte (via Log); entra na Telemetria |
| D7 | Gate de construção | Lote 1 só inicia após: decisões keystone aplicadas + smoke verde do Pipeline_v2 corrigido + smoke do Agregador `cbd3568d` |

## 7. Plano de lotes

| Lote | Escopo | Depende de |
|---|---|---|
| **L0 (este)** | Strawman + red-line Olavo + escrever P1 e P3 completos como SOPs (os dois extremos: rotina e estrutural) | nada |
| L1 | Fase no T28/score + roteador sintoma→playbook no loop existente + checklists gerados por SOP | D7 (keystone com sinal) |
| L2 | Integração com framework §4 (análise LLM recomenda playbook e escreve hipótese na tarefa) | L3.x da Saúde Digital |
| L3 | Medição de efeito (ação → delta na janela seguinte) + telemetria D6 | L1 rodando 2+ ciclos |
| Futuro | Agente de planejamento (§5); Auto-Close EXCELLENT; ES/RS/OS derivados (§4) | ADRs próprios |

## 8. Tensões/riscos

1. **Autopilot creep:** cada automação nova desta camada deve passar no teste
   "isso executa na conta do cliente?" — se sim, está fora (regra 10).
2. **Fronteira com Execução de Demandas:** demandas internas (Pacing/verba) ≠
   tarefas de otimização de campanha (DB Tasks). Superfícies distintas hoje;
   revisitar quando o roteador existir (mesma tensão T4 do ESTADO).
3. **Amostra pequena:** 2 clientes ativos → playbooks nascem de heurística
   (guidelines de plataforma + tácito), não de estatística própria. D6 é o
   caminho para calibrar com dado real.
4. **Semântica Meta × Google:** guidelines de aprendizado diferem; não
   universalizar o 50/semana da Meta para Google local de baixo volume.
