# Mapeamento — Agentes de Otimização × Temas (Estudo + IA Cognitiva Otimização)

> **[GOVERNANÇA — Design & Análise, 2026-07-29]** Papel: registrar **a qual tema de cada um dos dois
> textos-fonte** cada um dos **7 agentes de Otimização** se relaciona. Análise de design; git é
> canônico. Nomenclatura: usamos **"Otimização"** (ex-"Módulo 28" — rename no repo é pendência aberta).
>
> **AGENTES ANALISADOS:** os 7 agentes de otimização de campanhas (o "Time de Análise"):
> `docs/modulo-28-analise-cognitiva.md` — **Maestro + 6 especialistas**.
>
> **TEXTOS-FONTE (os 2 pedidos):**
> - `docs/conhecimento/Estudo de Inteligencia Artificial Cognitiva.md` — a base-mãe, **27 temas**.
> - `docs/conhecimento/IA Cognitiva Otimização.md` — o curso da frente de Otimização, **9 temas**.
>
> **RELACIONADOS:** roster completo `docs/strategic-planning/roster-de-agentes.md` (§8 cross-ref).
> **VERSÃO.** v0.1 (2026-07-29).

---

## 1. Objetivo

Para cada um dos 7 agentes de Otimização, apontar **o(s) tema(s) real(is)** de cada texto que ele
encarna, com justificativa. Onde não há correspondência direta, marcamos explicitamente — sem forçar
encaixe.

## 2. Legenda dos temas citados (para o doc ser autocontido)

**`Estudo de Inteligência Artificial Cognitiva` (27 temas — subconjunto citado):**
01 Arquitetura Cognitiva Pessoal ("segundo cérebro") · 02 Reenquadramento (framing) · 03 Contrafactual ·
04 Debiasing · 05 Decisão Multiobjetivo (ROAS×LTV×risco) · 07 Geração de Hipóteses · 08 Priorizar
(backlog→portfólio) · 09 Arquitetura de Agentes · 10 Pensar Rápido × Devagar · 12 Modelos Mentais (2ª
ordem) · 13 Narrativa Estratégica · 14 Expectativas/Alinhamento c/ Clientes · 15 Atribuição Cognitiva
(incrementality/MMM) · 19 Gestão de Risco ("radares") · 21 Portfólio de Experimentos · 27 OS Cognitivo
de Marketing.

**`IA Cognitiva Otimização` (9 temas):**
01 Search cognitivo (ciclo Observar→Interpretar→Decidir→Executar→Aprender) · 02 Click-to-WhatsApp (funil
conversacional) · 03 Orquestração PMax/Demand Gen/AI Max (malha cognitiva) · 04 Negócios Locais (camada
NBA) · 05 Experimentação contínua (AutoResearch) · 06 Knowledge Brain (RAG) · 07 Arquitetura Cognitiva
de Funis (System 1/System 2) · 08 Medida Cognitiva (Incrementality/MMM/analytics) · 09 OS Cognitivo
Pessoal agêntico.

## 3. Mapeamento

| # · Agente | O que faz | `Estudo` (tema) | `Otimização` (tema) | Por quê |
|---|---|---|---|---|
| **0 · Maestro** | triagem rápido×devagar + orquestra + sintetiza | **10** Rápido×Devagar · **09** Arquitetura de Agentes · **27** OS Cognitivo · (01) | **09** OS Cognitivo agêntico · (01 ciclo/§3.3 · 03 orquestração) | O "interruptor cognitivo" (E10) é a triagem; a orquestração do "time" (E09/E27) = o OS agêntico da Otim 09 |
| **1 · Leitura & Anomalia** | lê cru, normaliza, flag leilão vs conta | **19** Gestão de Risco ("radares") | **01** Search cognitivo (fase *Observar*) · (03 agente de diagnóstico) | Radar de anomalia (E19) = a fase de Observação/leitura de dados dos agentes de Search (Otim 01) |
| **2 · Atribuição** | leitura incremental, não last-click | **15** Atribuição Cognitiva | **08** Medida Cognitiva (Incrementality/MMM) | **Match direto e forte** — E15 e Otim 08 são literalmente incrementality/MMM/portfólio |
| **3 · Diagnóstico Crítico** | viés + reframe + contrafactual | **04** Debiasing · **02** Reenquadramento · **03** Contrafactual | **— sem tema dedicado** (difuso em 01 §3.3 "IA como intérprete" e no diagnóstico de 03) | Lente puramente cognitiva: o Estudo dedica **3 temas**; a Otimização não decompôs isso |
| **4 · Julgamento Multiobjetivo** | bom/ruim pro negócio (ROAS×LTV×risco), 2ª ordem | **05** Decisão Multiobjetivo · **12** Modelos Mentais | **08** Medida (plataforma vs negócio) · (03 §3.3 "mapa de energia") | E05/E12 dedicados; na Otim o juízo de valor vive embutido em Medida (08) e na alocação (03) |
| **5 · Hipóteses & Priorização** | backlog priorizado de experimentos | **07** Geração de Hipóteses · **08** Priorizar · **21** Portfólio de Experimentos | **05** Experimentação contínua (AutoResearch) | **Match direto** — E07+E08(+21) ↔ Otim 05 (Agente de Hipótese/Planejamento, loop) |
| **6 · Narrativa** | relatório/mensagem pro cliente | **13** Narrativa Estratégica · **14** Expectativas/Alinhamento c/ cliente | **— sem tema dedicado** (tangencial: 03 §3.4 "tradução de insight") | Narrativa **pro cliente** é lente do Estudo (13/14); a Otimização foca execução de campanha, não comunicação com o cliente |

## 4. Leitura geral (3 achados)

1. **O `Estudo` casa 1:1 com os agentes** — cada agente tem tema(s) dedicado(s) lá (04 debiasing, 15
   atribuição, 05 multiobjetivo, 07/08 hipóteses…). Confirma a numeração que o próprio
   `modulo-28-analise-cognitiva.md` já trazia na tabela "Time de agentes".
2. **A `Otimização` cobre bem os agentes "operacionais/agênticos"** (Maestro→OS 09, Leitura→Search 01,
   Atribuição→Medida 08, Hipóteses→Experimentação 05), mas **não tem tema dedicado para as lentes
   puramente cognitivas** — **Diagnóstico Crítico (3)** e **Narrativa (6)** ficam "sem match direto"
   nela. Esses 2 agentes são **herança direta do `Estudo`**, não da frente de Otimização.
3. **Match mais forte:** **Atribuição (2)** e **Hipóteses & Priorização (5)** têm correspondência quase
   literal nos dois textos — candidatos mais "seguros" para implementar/validar primeiro.

> **Nota de método:** os temas do `Estudo` (01–27) são os mesmos referenciados pela tabela "Time de
> agentes" do `modulo-28-analise-cognitiva.md`; aqui foram confirmados contra os títulos reais do
> arquivo. Os temas da `Otimização` (01–09) são a numeração própria daquele curso (clusters
> operacionais), distinta da numeração do `Estudo`.
