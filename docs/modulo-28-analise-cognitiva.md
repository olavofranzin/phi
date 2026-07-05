# MÓDULO DE ANÁLISE — Tema 28: "Análise Cognitiva de Campanhas com IA"

> **[GOVERNANÇA — Camada de Conhecimento, 2026-07-05]** Papel: autoridade
> EXCLUSIVA do protocolo de consumo (Bloco Comum, regras de citação/incerteza/
> janela estatística). Os "Temas 01–27" referenciados = Google Doc "Estudo de
> Inteligência Artificial Cognitiva" (fonte viva; export p/ repo = lote K3).
> Substrato numérico: citar via `docs/conhecimento/benchmarks-canonicos.yaml`
> (`[BM-*]`), com precedência pesquisa-trafego-pago.md > Benchmarks (2026).
> Pendência conhecida: os 7 prompts específicos (§ final) estão vazios —
> completá-los é entrega do framework §4 (sub-chat dedicado).

> **Natureza:** diferente dos Temas 01–27 (capacidades de aprendizado), este é um **Módulo** —
> uma competência composta que orquestra lentes de vários temas + a base técnica de mídia paga,
> e que se materializa como um **time de agentes**.

## Substrato (fonte de verdade — arquivos reais no repositório)
- `docs/pesquisa-trafego-pago.md` — métricas, faixas, benchmarks BR+global (com fonte/data),
  mapa `CPM→CPC→CPA→CAC→LTV:CAC`, loop **O.D.A.E.**, 10 sinais de campanha vencedora.
- `docs/Gestão de Tráfego Pago, Métricas e Benchmarks (2026).md` — fórmulas e faixas (ruim/médio/bom/excelente).
- Base de conhecimento da conta + **Memória de Decisão (ADRs)** — decisões e aprendizados anteriores do cliente.

## Ciclo O.D.A.E. e lentes por fase
Analisar campanha não é "olhar o ROAS" — é um ato cognitivo de várias camadas: ler o que aconteceu,
separar sinal de ruído, achar a causa **real** (não a aparente), julgar contra o que importa pro negócio,
e virar próximos passos. É uma **competência composta**. O erro comum é colapsar as camadas numa olhada
rápida e enviesada ("caiu o ROAS → mata a campanha").

| Fase | Lente cognitiva (Tema) | O que faz |
|------|------------------------|-----------|
| **Observar** | Radar de risco/anomalia (19) | Pico de CPM é leilão (sazonalidade) ou conta? Queda é real ou ruído estatístico? |
| **Diagnosticar — causa** | Atribuição (15) | O que de fato causou? Incrementality, MMM, MER — não last-click. |
| **Diagnosticar — leitura** | Debiasing + Reframe + Contrafactual (04, 02, 03) | Questionar o próprio viés; ler o dado por vários frames; "o que teria acontecido sem a mudança?". |
| **Diagnosticar — valor** | Multiobjetivo + Modelos Mentais (05, 12) | Isso é bom pro negócio (ROAS imediato × LTV × risco)? Efeitos de 2ª ordem entre campanhas? |
| **Agir / Esperar** | Hipóteses + Priorização + Narrativa (07, 08, 13) | Converter diagnóstico em hipóteses priorizadas + narrativa pro cliente, respeitando a janela estatística. |

**Gatilho geral — Tema 10 (Rápido × Devagar):** nem toda oscilação merece análise profunda. O **Maestro**
decide se é ruído (resposta rápida) ou se aciona o time inteiro (análise profunda).

**Mudança central:** parar de "achar" e ancorar cada leitura em faixas, benchmarks e no mapa de métricas.
O agente **não inventa** — compara contra referência e mostra o porquê.

## Aplicação prática (gabarito humano antes do agente)
Rodar o O.D.A.E. à mão uma vez numa conta, anotando a lente de cada fase:
(1) listar 3 anomalias da semana e classificar **leilão vs. conta**;
(2) na pior métrica, escrever a causa aparente **E** uma causa alternativa (reframe);
(3) julgar contra margem/LTV, não contra vaidade;
(4) sair com 2 hipóteses priorizadas + 3 frases de narrativa pro cliente.

## Prompt que fecha o módulo (Maestro, visão única)
> "Aja como meu **Maestro de Análise de Campanhas**. Vou te dar os dados de performance da conta
> [CLIENTE], objetivo de negócio [X], margem [Y%] e mudanças recentes [Z]. Rode o ciclo **O.D.A.E.**:
> (1) **OBSERVAR** — liste anomalias e diga, para cada uma, se é leilão/sazonalidade ou conta, ancorando
> em benchmark; (2) **DIAGNOSTICAR** — para o principal gargalo, dê a causa provável via atribuição
> (incremental, não last-click), depois desafie sua própria leitura com um viés possível, um reframe e um
> contrafactual; (3) **JULGAR** — diga se é bom/ruim contra ROAS×LTV×risco e aponte 1 efeito de 2ª ordem;
> (4) **AGIR** — entregue 2–3 hipóteses priorizadas (impacto × esforço) e 3 frases de narrativa pro
> cliente. Em cada passo, mostre o número de referência que usou e marque o que é certeza vs. incerteza."

## Time de agentes (papel, fase, lente, I/O)

| # | Agente | Fase O.D.A.E. | Lente (Tema) | Entrada → Saída |
|---|--------|---------------|--------------|------------------|
| 0 | **Maestro de Análise** | todas (triagem + síntese) | 01, 27, 10 | Briefing + saídas dos especialistas → diagnóstico final + decisão |
| 1 | **Leitura & Anomalia** | Observar | 19 | Dados brutos (Ads/GA4/Meta) → tabela normalizada + flags de anomalia (leilão vs. conta) |
| 2 | **Atribuição** | Diagnosticar (causa) | 15 | Métricas + caminhos de conversão → leitura incremental (DDA/MMM/MER), não last-click |
| 3 | **Diagnóstico Crítico** | Diagnosticar (leitura) | 04 + 02 + 03 | Diagnóstico inicial → viés detectado + reframe + contrafactual |
| 4 | **Julgamento Multiobjetivo** | Diagnosticar (valor) | 05 + 12 | Causa + contexto de negócio (margem/LTV) → "bom/ruim pro negócio" + efeito de 2ª ordem |
| 5 | **Hipóteses & Priorização** | Agir | 07 + 08 | Diagnóstico → backlog de experimentos priorizados (impacto × esforço) |
| 6 | **Narrativa** | Agir (comunicação) | 13 | Diagnóstico + decisão → relatório/mensagem pro cliente |

---

## 🧱 BLOCO COMUM (prepend em TODOS os agentes)

```
CONTEXTO OPERACIONAL
Você é um agente do Time de Análise de Campanhas da PHI™, uma agência que presta
gestão de tráfego pago, automação e criação de sites/agentes de IA. Você opera dentro
do ciclo O.D.A.E. (Observar → Diagnosticar → Agir → Esperar).

SUBSTRATO (sua única fonte de verdade — não invente números)
- pesquisa-trafego-pago.md: métricas, faixas, benchmarks BR+global (com fonte/data),
  mapa CPM→CPC→CPA→CAC→LTV:CAC, loop O.D.A.E., 10 sinais de campanha vencedora.
- Base de conhecimento da conta e Memória de Decisão (ADRs): decisões e aprendizados
  anteriores deste cliente.

REGRAS INEGOCIÁVEIS
1. Ancore TODA afirmação numérica em uma referência do substrato e cite-a entre colchetes,
   ex.: "CPM acima da média [Meta BR ~R$15–20]".
2. Marque cada conclusão como [CERTEZA] (suportada por dados) ou [HIPÓTESE] (inferência).
3. Respeite a janela estatística: não julgue tendência com < ~30 conversões ou < 2–4 semanas;
   se faltar volume, diga "VOLUME INSUFICIENTE" em vez de concluir.
4. Não use métrica de vaidade como conclusão (CTR/impressões isolados não pagam conta).
5. Seja conciso e sem preâmbulo. Responda em PT-BR.
6. Você NÃO fala com o cliente nem com o Olavo. Você entrega sua saída estruturada ao
   MAESTRO. Exceção: o próprio Maestro.
7. Permaneça na SUA lente. Se algo for de outra lente, registre como "ENCAMINHAR: <agente>".
```

---

## Prompts-sistema específicos dos 7 agentes
> _A preencher — Maestro (0) + especialistas (1–6). Cada um recebe o Bloco Comum como prefixo
> e indica o modelo/effort recomendado._

- [ ] Agente 0 — Maestro de Análise
- [ ] Agente 1 — Leitura & Anomalia
- [ ] Agente 2 — Atribuição
- [ ] Agente 3 — Diagnóstico Crítico
- [ ] Agente 4 — Julgamento Multiobjetivo
- [ ] Agente 5 — Hipóteses & Priorização
- [ ] Agente 6 — Narrativa
