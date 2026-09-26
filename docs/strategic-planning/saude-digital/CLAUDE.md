# Saúde Digital / PHI·Mídia — contexto da frente

> Leia este arquivo ao trabalhar em **qualquer coisa do parque PHI**: métrica, score, Notion,
> vigilância, T28. Ele complementa o `CLAUDE.md` da raiz, não o substitui.
> **Regras R1–R13 da raiz valem aqui integralmente.**

## O que é esta frente
Coletar métrica de campanha das plataformas, calcular diariamente um **score de saúde (0–100)**,
classificar em EXCELLENT / GOOD / WARNING / CRITICAL e pôr o diagnóstico **onde o gestor trabalha**
(Notion), acionando tarefa com checklist. **O PHI detecta e orienta; otimizar é humano.**

## Ler antes de agir — nesta ordem
| # | Documento | Para quê |
|---|---|---|
| 1 | `../DEFINICAO-DE-PRONTO-PHI-V1.md` | **o ponto final** — os 14 critérios do PHI v1 |
| 2 | `CONTRATO-PHI.md` | **matriz de donos por destino + invariantes M1–M12.** Lei quando a entrevista fechar |
| 3 | `panorama-workflows-phi.md` | o parque: 81 workflows, quem faz o quê, quem só está ligado |
| 4 | `adr-rascunhos/ADR-37-writers-canonicos-um-destino-um-dono.md` | por que o contrato existe |
| 5 | `adr-rascunhos/ADR-38-identidade-neutra-e-rebuild-serie-historica.md` | a identidade sem prefixo e o rebuild |
| 6 | `../../modulo-28-analise-cognitiva.md` | o T28 — a camada de análise sobre o score |

## Os invariantes que mais se quebram aqui
- **M1** — um destino, um dono. Exceção só no padrão S4 (mesmo workflow, colunas disjuntas).
- **M2** — `campaign_id` é o **ID nativo, sem prefixo**. A plataforma mora em `platform`.
- **M4** — **zero nunca é ausência.** `conversions=0 ⇒ CPA/ROAS indefinidos`, nunca "CPA 0 = ótimo".
- **M5** — o score é **fato**: não recalcular `phi_value`, flags ou severidade fora do Pipeline_v2.
- **M6** — **Fase 3 é imutável:** Fechamento → Escalada → Abertura.
- **M9** — **um ambiente só: `phi_prod`.** Produção não toca `phi_dev`.
- **M10** — workflow ativo tem **saída observável**. Verde sem produção é o modo de falha da casa.
- **M11** — dado escrito tem **consumidor declarado**. Tabela sem leitor é custo.

## Armadilhas conhecidas (já custaram caro)
1. 🔴 **Verde não é produção.** `raw_ad_data` passou **3 meses vazia** com dois workflows ativos
   escrevendo nela, todo dia, sem um único alarme. **Conte os itens que chegam ao nó de escrita.**
2. 🔴 **Você está lendo o rascunho** (**R13**). `nodes` é proposta; o que roda é
   `activeVersion.nodes`. Compare `versionId` com `activeVersionId` **antes** de afirmar.
3. 🔴 **Salvaguarda também quebra.** A checagem de unicidade instalada para proteger o score matou a
   **Fase 3 por 8 dias**. Teste sempre *"o que acontece no dia em que ela não pega nada?"*.
4. **Query agregada sempre devolve linha** — `COUNT`/`SUM` sem `GROUP BY` faz *"não achei"* sair
   como **`0`**. Traga junto a contagem do que casou.
5. **`ingestion_step` não é linhagem** — é "quem tocou por último", e o `UPDATE` alheio o sobrescreve.
6. **Dois scores no projeto.** Aqui é `phi_value` (campanha). `potencial_comercial` é lead —
   outra frente, outro contrato, **não confundir**.
7. **Descrição copiada de outro workflow é bug** (R5). Há pelo menos um caso ativo no parque.

## Onde as coisas moram
| Coisa | Onde |
|---|---|
| Workflows | n8n — sem prefixo padronizado ⚠️ (`PHI - *`, `sw *`, `WF-*`, `Onb - *`) |
| Dado cru e score | BigQuery `phi_prod` — ver a matriz do §4 do contrato |
| Interface do gestor | Notion — IDs das DBs no `CLAUDE.md` da raiz |
| Alarmes | Telegram do Olavo |
| ADRs de design | `adr-rascunhos/` |
| Briefs de execução | `docs/handoff/` |

> ⚠️ **Não existe prefixo de nomenclatura nesta frente** — diferente da Prospecção (`PROSP-01..08`).
> Isso é parte do problema: não dá para olhar a lista do n8n e saber o que é PHI. **Propor um
> padrão é assunto do contrato, não decisão de sub-chat.**
