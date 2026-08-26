# [RASCUNHO] ADR-34 — PHI·Mídia Score v2: a métrica-mãe governa

> **STATUS:** RASCUNHO (git, design-canônico). **Aprovado em princípio por Olavo
> 2026-08-26** (bandas de tolerância +10%/+50%/−15%, anomalia por IQR, regime de volume,
> percentil só para anomalia/prioridade — nunca no veredito). Vira **Aceito** quando rodar
> em `phi_dev` com smoke (Barbearia + Salão) e Olavo aprovar.
>
> **ESCOPO:** *como* o PHI·Mídia Score de campanha classifica. **Fora de escopo** (decisão
> à parte, ADR-29 Camada 0): *de onde* vem a série diária que alimenta a tendência.
>
> **Base metodológica:** skill `statistical-analysis`. **Evidência:** exports diários
> Google Ads (`docs/analises/google_ads/Performance da campanha*.csv`), 2 campanhas KIL,
> 26/jun–24/ago 2026.

---

## Contexto

A campanha **Barbearia** (`GADS-21149189736`) apareceu no Notion com **Score 60,21 / GOOD**
e, ao mesmo tempo, **Em Crise = SIM / Métrica-mãe Acima da Meta**. Contradição real.

Causas (confirmadas no código do `Pipeline_v2` e no relatório 2026-07-02):

1. **Dois sistemas desconexos.** "Score/Status" vem do score ponderado (BigQuery); "Em
   Crise / Status da Métrica-mãe" vem de outro caminho (desvio vs meta). O alerta de crise
   **não tem poder** sobre a classificação.
2. **O score dilui a métrica-mãe.** Média ponderada de MAS/TSS/FIS (es/rs/os já com peso 0
   na v1.2): a métrica-mãe é ~⅓; **TSS** (estabilidade) e **FIS** (fatia de gasto) somam
   ~⅔ e premiam "estável" e "barata".
3. **O real é pior.** O dado mostra que a Barbearia **quase não converte** — 7 conversões
   em 60 dias, 54/58 dias zerados, gastando ~13% do orçamento. O "CPA 14,64" é **miragem
   sobre 1 conversão** (erro ≈ 100%). O score velho deu GOOD porque **TSS** (54/58 dias
   zerados = "super estável") + **FIS** (gasta quase nada) afogaram um MAS que era lixo.

## Decisão

**A métrica-mãe deixa de ser um item na média e passa a definir a classe.** Sinais
secundários só **rebaixam**, nunca inflam. Base única (serve CPA e ROAS): **desvio
relativo direcional** vs meta.

```
CPA  (menor melhor): desvio = (CPA_7d  − meta) / meta
ROAS (maior melhor): desvio = (meta − ROAS_7d) / meta
desvio > 0  ⇒ pior que a meta.   CPA da janela = custo_7d ÷ conversões_7d (robusto).
```

### Peça 0 — Portão de dados (idade × volume)
```
C7 = conversões primárias (hard) na janela 7d ; idade = dias desde o lançamento
idade ≤ 7 E C7 < 50  → N/D (INSUFFICIENT_DATA): não pontua, não classifica
senão                → Regime A (C7 ≥ 50)  |  Regime B (C7 < 50)
```
`C7_min = 50`: erro relativo do CPA ≈ `1/√C7` (~14% em 50 conv.); abaixo de ~30–50 é ruído.

### Regime A (C7 ≥ 50) — a métrica-mãe governa, por **tolerância absoluta**
Bandas sobre o `desvio` (verdade de negócio, **não** percentil de vizinhos):

| Faixa | Regra | Ex. Salão (meta CPA 3,50) |
|---|---|---|
| **EXCELLENT** | desvio ≤ −15% | CPA ≤ 2,98 |
| **GOOD** | −15% < desvio ≤ +10% | 2,98 < CPA ≤ 3,85 |
| **WARNING** | +10% < desvio ≤ +50% | 3,85 < CPA ≤ 5,25 |
| **CRITICAL** | desvio > +50% | CPA > 5,25 |

**Confiança (não punir no ruído):** `ε = 1/√C7`. Para **rebaixar**, usa `desvio − ε`
(benefício da dúvida de 1 erro-padrão); para **premiar** (EXCELLENT), exige `desvio + ε`
(só dá crédito com folga). *(Tratamento fino do IC = calibração.)*

**Rebaixamentos (só descem, nunca sobem):**
```
Tendência (janelas 7d NÃO sobrepostas; piora = CPA subindo / ROAS caindo):
    piora > 25%  → teto WARNING (flag "piorando")
Anomalia diária: método IQR na série de CPA diário da campanha
    dia fora de [Q1 − 1,5·IQR , Q3 + 1,5·IQR] → flag "salto"
Composição: ação soft (Engajamento/Ver rotas/Visualização) como primary_for_goal
    → flag "conversão inflada" + teto WARNING
```
> IQR (não z-score) porque o CPA é **assimétrico** (Salão: média 4,78 > mediana 3,46).

### Regime B (C7 < 50 e idade > 7) — o **volume** manda
> Aqui a métrica-mãe não é confiável; volume baixo em campanha madura **é o problema**.
```
esperado_7d = custo_7d / meta ; cobertura = C7 / esperado_7d ; entrega = custo_7d/(orç.diário×7)
C7 < 10                        → CRITICAL ("volume crítico: quase não converte")
10 ≤ C7 < 50 e cobertura < 0,6 → CRITICAL
10 ≤ C7 < 50 e cobertura ≥ 0,6 → WARNING ("volume baixo p/ julgar com segurança")
entrega < 0,5                  → flag "subentrega de orçamento"
Regime B NUNCA emite GOOD/EXCELLENT.
```

### Saída
- **FIS (fatia de gasto) sai** do score de saúde (correlaciona com tamanho, não desempenho;
  paradoxo de Simpson). No máximo vira insumo de **prioridade**.
- **Percentil** só em **anomalia** (IQR) e em **ordenar prioridade** entre CRITICALs — nunca
  no veredito.
- **Score 0–100** continua existindo (campo Notion) como **transformação de exibição** do
  desvio, **subordinada à faixa + motivo**. Sem falsa precisão: reporta "≈60 / WARNING /
  motivo", não "60,21".
- **"Porquê da nota" (obrigatório):** ex. *"CRITICAL — volume crítico: 1 conv. em 7d (7 em
  60 dias); subentrega 19%; CPA não confiável. Meta 5,20."*

## Testes de aceitação (dado real)

| Campanha | Regime | Conta | Veredito v2 | (velho) |
|---|---|---|---|---|
| **Barbearia** (meta 5,20) | B (C7=1, madura) | C7<10 ⇒ CRITICAL; cobertura 1/(14,64/5,2)=0,35; entrega 0,19 | **CRITICAL** | 60 GOOD ❌ |
| **Salão** (meta 3,50) | A (C7=82) | desvio +5,1% → GOOD no nível; piora +39% → teto WARNING | **WARNING** | 67 GOOD (≈ok) |

Corrige o falso-GOOD **sem** punir o Salão injustamente.

## Alternativas consideradas
1. **Percentil no veredito.** Rejeitado: é nota na curva — sempre haveria "top/bottom X%"
   independente de bater a meta; a meta é verdade absoluta do negócio.
2. **Manter a média ponderada (v1.2), só ligando "Em Crise" ao status.** Rejeitado: não
   conserta os indicadores (TSS/FIS continuam premiando o errado).
3. **Tolerância absoluta + confiança por volume + tendência robusta (escolhida).**

## Consequências
- (+) Mata o falso-GOOD; veredito honesto e **auditável** (porquê da nota).
- (+) **Destrava sem** a credencial Google Ads (usa checks #5/#6 do ADR-29; composição
  #1/#2 é melhoria futura — Onda B).
- (+) É a **Camada 1 (selo no score)** do ADR-29.
- (−) Exige **série diária** para tendência/anomalia — fonte é decisão à parte (ADR-29
  Camada 0 / writer canônico).
- (−) Larguras de tolerância são v0 (podem precisar ser por cliente com o tempo).

## Reavaliar quando
- Houver campanhas suficientes → revisar larguras de tolerância (por cliente/modelo).
- Reativar cliente **ROAS** → validar o ramo simétrico.
- Fonte da série diária decidida (ADR-29 Camada 0).

## Conexões
- **ADR-003** (autoridade do score): mantida + selo de confiança.
- **ADR-21** (degradação em dado ralo): Regime B e N/D o implementam.
- **ADR-29** (Guardião da Métrica-Mãe): este ADR **é** a Camada 1.
- **ADR-32** (ledger): registrar a implementação no ledger de execuções.
