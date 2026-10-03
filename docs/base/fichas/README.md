# `docs/base/fichas/` — a história de cada artefato

| | |
|---|---|
| **O que é uma ficha** | o que o artefato faz · 🔴 **por que existe** · o que substituiu e por quê · quem escreve / quem lê · o que acontece quando a fonte falta · **a prova (com número)** · `verificado em` |
| **Dono de qual fato** | 🔴 **a história de um artefato.** O que ele **faz agora** é do próprio artefato (**R13**) — a ficha **não vence o artefato** |
| **Quando nasce uma ficha** | 🔴 **quando o artefato é TOCADO** (é a **R5**, e o teto do `BASE-00` §3). ⛔ **Nunca em lote** — lote vira pilha que ninguém lê |
| **Escritas em** | 2026-10-03, na Fase 1 da memória compartilhada — **as 7 sementes**, por pedido explícito do plano |

---

## 🔴 A regra do campo *“por que existe”*, e ela é a razão de esta pasta existir

**Procura-se em três lugares:** a **descrição do próprio artefato**, o **ADR** correspondente, e o
**`ESTADO-DO-PROJETO`**. **Se não achar: `⬜ a perguntar ao Olavo`.** ⛔ **Não se deduz.**

> **Ficha com porquê inventado é pior que ficha sem porquê:** a sem-porquê **mostra o buraco**; a
> inventada **o tampa com mentira**, e a próxima auditoria acredita. É exatamente o defeito que esta
> pasta existe para curar.

### ⚠️ O que aconteceu quando eu procurei, em 03/10 — e vale como medição

| Lugar | O que achei |
|---|---|
| **a descrição do artefato no n8n** | 🔴 **vazia.** Nos dois snapshots em git (`sw metricas campanhas.json` e `PHI — Agregador…json`), o campo `description` é **`null`**, e `settings.description` também |
| **sticky notes** (o substituto informal) | 🔴 **pior que vazio no Agregador:** 4 notas em **inglês genérico** (*“Step 1: Trigger & Report Type Detection… weekly or monthly”*) que **descrevem outro workflow**. É a **R5** — *“descrição copiada de outro artefato é bug”* — **na própria peça central do T28** |
| **o ADR** | 🟢 **foi a fonte que funcionou.** 4 das 7 fichas têm o porquê **sourced em ADR** |
| **o `ESTADO-DO-PROJETO` e o `panorama`** | 🟡 dão **o que faz**, quase nunca **por que existe** — e o panorama **está vencido em pelo menos um ponto** (ver a ficha do `client_config`) |

> 🔴 **A conclusão honesta: 3 das 7 fichas têm o porquê em aberto, e isso não é falha da ficha — é o
> retrato do que a casa sabe.** As perguntas estão juntas no relatório da Fase 1 e no fim de cada ficha.

---

## As 7 sementes

| # | Ficha | Porquê |
|---|---|---|
| 1 | [`sw-metricas-campanhas.md`](sw-metricas-campanhas.md) | 🟡 parcial |
| 2 | [`phi-pipeline-v2.md`](phi-pipeline-v2.md) | ⬜ **a perguntar** |
| 3 | [`agregador-metricas-multi-fonte.md`](agregador-metricas-multi-fonte.md) | 🟢 ADR-23 |
| 4 | [`operador-unico-metricas.md`](operador-unico-metricas.md) | 🟡 parcial |
| 5 | [`wf-t28-analise-campaign.md`](wf-t28-analise-campaign.md) | 🟢 ADR-28 |
| 6 | [`phi-prod-client-config.md`](phi-prod-client-config.md) | 🟢 ADR-39 |
| 7 | [`webview-server.md`](webview-server.md) | 🟡 parcial |
