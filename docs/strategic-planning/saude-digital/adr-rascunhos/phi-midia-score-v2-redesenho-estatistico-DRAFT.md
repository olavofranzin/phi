# [RASCUNHO de desenho — pré-ADR] PHI·Mídia Score v2 — redesenho estatístico

> **STATUS:** RASCUNHO de desenho (git, design-canônico). **Não é ADR ainda** — é o
> "repensar como calcular" que precede o ADR (pedido do Olavo, 2026-08-26). Vira ADR
> quando as curvas/limiares forem travados e validados contra dado real de mais campanhas.
>
> **Base metodológica:** skill `statistical-analysis` (tamanho de amostra, estatística
> robusta, tendência/anomalia, percentis, significância prática, paradoxo de Simpson,
> falsa precisão). **Evidência:** exports diários Google Ads de 2 campanhas KIL
> (`docs/analises/google_ads/Performance da campanha*.csv`), 26/jun–24/ago 2026.

---

## 1. Contexto e gatilho

Campanha **Barbearia** (`GADS-21149189736`) apareceu no Notion com **Score 60,21 / GOOD**
ao mesmo tempo que **Em Crise = SIM** e **Métrica-mãe Acima da Meta**. Contradição real.

Causa-raiz (confirmada no código do `Pipeline_v2` + relatório 2026-07-02):

1. **Dois sistemas que não conversam.** "Score/Status" vem do score ponderado no BigQuery;
   "Em Crise / Status da Métrica-mãe" vem de outro caminho (desvio vs meta). O alerta de
   crise **não tem poder** sobre a classificação.
2. **O score dilui a métrica-mãe.** É média ponderada de MAS/TSS/FIS (es/rs/os já com peso
   0 na v1.2). A métrica-mãe (MAS) é ~⅓; **TSS** (estabilidade) e **FIS** (fatia de gasto)
   somam ~⅔ e premiam "estável" e "barata" — nada a ver com resultado.
3. **O caso real é pior que "CPA acima da meta".** O dado mostra que a Barbearia
   **quase não converte** (ver §3): o "CPA 14,64" é miragem sobre **1 conversão** em 7 dias.

## 2. Princípios (o que muda)

1. **A métrica-mãe governa.** Deixa de ser mais um item na média e passa a **definir a
   classe**. Sinais secundários só podem **rebaixar**, nunca inflar.
2. **Confiança por volume.** CPA = custo÷conversões tem erro relativo ≈ `1/√conversões`.
   Poucas conversões ⇒ CPA não confiável ⇒ o score **não crava** número (alinha ADR-21
   "volume insuficiente" e o selo de confiança do ADR-29).
3. **Tendência direcional e anomalia robusta** (não "estabilidade" cega). Piora penaliza;
   estar "estavelmente ruim" não dá ponto.
4. **Composição antes de tudo** (hard vs soft) — senão a própria métrica-mãe é artefato de
   mistura (paradoxo de Simpson; caso Salão do ADR-29).
5. **Sem falsa precisão.** Reporta **faixa + confiança + o motivo**, não "60,21".
6. **FIS (fatia de gasto) sai do score de saúde.** Correlaciona com o **tamanho** da
   campanha, não com desempenho. No máximo vira insumo de **prioridade**.

## 3. Evidência real (o que os CSVs mostram)

| | **Barbearia** (`21149189736`) | **Salão** (`21116045403`) |
|---|---|---|
| Lançada | abr/2024 (madura) | mar/2024 (madura) |
| Meta (CPA) | **R$ 5,20** | **R$ 3,50** |
| Dias analisados | 58 (26/jun–24/ago) | 51 |
| **Conversões no total** | **7,00** | 480,99 |
| Dias com **zero** conversão | **54 / 58** | 0 / 51 |
| Custo total | R$ 86,85 (orçamento R$11/dia ⇒ ~13% gasto) | R$ 1.740 |
| CPA 7D final | **14,64** (de **1 conversão**) | 3,68 |
| **C7** (conv. primárias 7d) | **1** | 82 |
| CPA diário (dias c/ conv.) | mediana 3,11 · IQR [1,08–4,41] · n=4 | mediana 3,46 · IQR [2,62–5,57] · n=51 |
| Tendência CPA (7d vs 7d ant.) | +5,5% | **+39,5%** |

**Leitura:** a Barbearia não está "cara" — ela **não converte** (7 em 60 dias, e nem gasta
o orçamento). O "14,64" é ruído sobre 1 conversão (erro ≈ 100%). O Salão é legítimo: volume
alto, CPA ~na meta (mediana diária 3,46 ≈ meta 3,5), com **piora de tendência** a vigiar.

**Por que o score velho deu 60/GOOD na Barbearia:** TSS altíssimo (54/58 dias zerados = "super
estável") + FIS alto (gasta quase nada) afogaram um MAS que era lixo.

## 4. Especificação das fórmulas (v0 — constantes a calibrar)

Base única (serve CPA e ROAS): **`r`** = razão de desempenho.
`r = meta / CPA_7d` (CPA, menor melhor) · `r = ROAS_7d / meta` (ROAS, maior melhor).
`r = 1` na meta · `r > 1` batendo · `r < 1` furando. **CPA da janela = custo_7d ÷
conversões_7d** (média ponderada robusta), nunca média dos CPAs diários.

### Peça 0 — Portão de dados (idade × volume)
```
C7 = conversões primárias na janela 7d ; idade = dias desde o lançamento
SE idade ≤ 7 E C7 < 50   → N/D (INSUFFICIENT_DATA): não pontua, não classifica
SENÃO                    → julga (Regime A se C7 ≥ 50 ; Regime B se C7 < 50)
```
`C7_min = 50`: em 50 conv. o erro relativo do CPA (~1/√C7) é ~14%; abaixo de ~30–50 vira ruído.

### Regime A — volume confiável (C7 ≥ 50): a métrica-mãe governa
```
Nível(0–100) = curva(r)   [linear por partes, com clamp 0..100]
     r ≤ 0,50 → 0 | r = 0,85 → 40 | r = 1,00 → 65 | r ≥ 1,30 → 100
Confiança (só p/ veto): ε = 1/√C7 ; r_lo = r·(1 − ε)
VETO da métrica-mãe:
     r < 0,85            → teto WARNING
     r < 0,60            → CRITICAL
     r_lo < 0,75         → teto WARNING ("pode estar furando, sem confiança")
Tendência (janelas 7d NÃO sobrepostas; CPA subindo = piora):
     piora% > 25         → teto WARNING (flag "piorando")
     anomalia: |z| do último dia vs média móvel > 2 → flag "salto"
Banda base pelo Nível: EXCELLENT ≥85 · GOOD ≥65 · WARNING ≥40 · CRITICAL <40
     (bandas/vetos acima só REBAIXAM)
```

### Regime B — volume ralo (C7 < 50) e campanha madura (idade > 7): o volume manda
> A métrica-mãe **não é confiável** aqui; volume baixo em campanha madura **é o problema**
> (regra do Olavo, 2026-08-26).
```
esperado_7d = custo_7d / meta       (conversões que o gasto deveria comprar na meta)
cobertura   = C7 / esperado_7d
entrega     = custo_7d / (orçamento_diário × 7)
Veredito:
     C7 < 10                       → CRITICAL ("volume crítico: quase não converte")
     10 ≤ C7 < 50 e cobertura<0,6  → CRITICAL
     10 ≤ C7 < 50 e cobertura≥0,6  → WARNING ("volume baixo p/ julgar CPA com segurança")
     entrega < 0,5                 → flag "subentrega de orçamento"
Regime B NUNCA emite GOOD/EXCELLENT (sem volume não se afirma sucesso).
```

### Peça 3 — Composição (aplica nos dois regimes)
```
soft = Engajamento + Ver rotas + Visualização de página (do export "Resultados")
se ação soft estiver como primary_for_goal (infla "Conversões") → flag + teto WARNING
```
> Nos 2 casos KIL a "Conversões" já é hard (Contato/Outro/Lead); sem inflação hoje. Check
> mantido para o portfólio (é o caso Salão original do ADR-29).

### "Porquê da nota" (saída auditável, obrigatória)
Ex.: *"CRITICAL — volume crítico: 1 conv. em 7d (7 em 60 dias); subentrega 19% do orçamento;
CPA não confiável (C7=1). Meta 5,20."* / *"WARNING — CPA 3,68 vs meta 3,50 (~5% acima) e
piorando +39% na semana; C7=82."*

## 5. Testes de aceitação (dado real → veredito)

| Campanha | Regime | Conta | Veredito v2 | Score velho |
|---|---|---|---|---|
| **Barbearia** | B (C7=1, madura) | C7<10 ⇒ CRITICAL; cobertura 1/(14,64/5,2)=0,35; entrega 14,64/77=0,19 | **CRITICAL** "volume crítico + subentrega" | 60 GOOD ❌ |
| **Salão** | A (C7=82) | r=3,5/3,68=0,951 → Nível ~57; sem veto duro (r≥0,85; r_lo=0,85); piora +39% → teto WARNING | **WARNING** "na meta, piorando" | 67 GOOD (≈ok) |

O redesenho corrige o falso-GOOD da Barbearia **sem** punir o Salão injustamente.

## 6. Calibração pendente / decisões abertas

1. **Âncoras da curva e cortes de banda** (0,85/1,00/1,30; 85/65/40): recalibrar por
   **percentis** da distribuição real quando houver mais campanhas (skill: percentis).
2. **k da confiança** (usei 1) e limiar de anomalia (usei |z|>2): confirmar com mais série.
3. **Fonte em produção:** o score roda no BQ, mas a tendência/anomalia exige **série diária**.
   Decidir: Agregador escreve a série diária limpa no BQ (**Camada 0 do ADR-29 / writer
   canônico**) ou o score lê da API. **Não resolver aqui.**
4. **Ramo ROAS** (simétrico; CLI-5 estava inativado) — reativar quando entrar cliente ROAS.
5. **Onde o veto vive:** no próprio MERGE do score (recomendado) ou num pós-passo.

## 7. Conexões com ADRs

- **ADR-003** (autoridade do score): mantida, agora com **selo de confiança** (score de
  baixa confiança não é fato limpo).
- **ADR-21** (degradação em dado ralo): o Regime B e o N/D são a implementação disso.
- **ADR-29** (Guardião da Métrica-Mãe): este redesenho **é** a "Camada 1 — selo no score" +
  usa os checks #5 (salto vs histórico) e #6 (conversions=0). Destrava sem a credencial
  Google Ads (que só é necessária para os checks #1/#2 de composição — Onda B).

## 8. Próximo passo

Travar §6.1–6.2 com o Olavo → promover este rascunho a **ADR** (design) → implementar em
`phi_dev` com smoke (Barbearia + Salão) → backfill → produção. **Nada aplicado sem OK + smoke.**
