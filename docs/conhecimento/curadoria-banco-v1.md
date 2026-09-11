# Curadoria do Banco de Estratégias v1 — promoção Rascunho → Ativa

> ## ✅ DECISÃO APROVADA (Olavo, 2026-07-05) — AÇÃO PENDENTE (bloqueada em Notion offline)
> **Executar quando o MCP Notion reconectar** (data source `collection://0c6f2e04-b7fe-4e09-92b5-189b716c1dc2`):
> 1. **Promover Tier A + Tier B → `Status = Ativa`** — os 19: #1,2,3,4,5,6,7,8,9,10,11,12 (G2) + #13,15,17,18,19,20,21 (G3). Resolver título→page_id por busca no data source. Idempotente (Status=Ativa já-Ativa = no-op).
> 2. **#14 (Escala Baiana) → NÃO promover.** `Status = Deprecada`. **Folding aprovado:** anexar à `Contraindicações` da **#9** (Escalar 20–30% com CPS) o texto: *"Não fragmentar o orçamento em muitos conjuntos idênticos sem calibrar — a 'Escala Baiana' reduzida (1-20-1, R$7/dia) deu 0 vendas em teste (esperado 2–3 a CPA R$60–80); a fragmentação trava o algoritmo no aprendizado [Sobral, teste n=1]."* Guardar contra duplicação (só anexar se ainda não estiver lá). No #14 deprecado, anotar em Contraindicações: "Consolidada como contraindicação da estratégia de escala (#9)."
> 3. **Manter Rascunho:** #16 e #22 (recursos Meta em rollout).
> **page_ids já resolvidos** (busca 17:29–17:32): #1 `394b65e5-c72b-8114-8380-ebfe7de0dcaf` · #4 `394b65e5-c72b-81e2-a1ea-fc6d67287e69` · #5 `394b65e5-c72b-8101-ac1f-f7432334e33c` · #7 `394b65e5-c72b-8177-9800-de1357584854` · #9 `394b65e5-c72b-81af-a63f-edaeb54b2f54` · #10 `394b65e5-c72b-811c-93fe-c0b5477fd30d` · #13 `394b65e5-c72b-810e-82c3-eca0bb8206d5` · #14 `394b65e5-c72b-811e-855f-c5ff7eea644b` · #16 `394b65e5-c72b-8176-a529-d9f9959ac4af` (hold) · #17 `394b65e5-c72b-816c-b84b-f0ec514fe6e2` · #18 `394b65e5-c72b-8126-8a69-fd7b0b35df79` · #20 `394b65e5-c72b-8121-b9a9-c970995255d1` · #21 `394b65e5-c72b-81e3-a029-e8da33ea3662`. **Faltam resolver por busca:** #2,3,6,8,11,12,15,19,22.
> **Resultado esperado:** 19 Ativa · 1 Deprecada (#14, folded) · 2 Rascunho (#16,#22). Reportar ao Olavo pós-execução.


> **Como usar:** as 22 estratégias do K3b estão no Notion como **Rascunho**. Nenhum
> agente as usa como playbook enquanto Rascunho (a força de evidência A–D governa a
> *confiança da citação*; o Status governa o *endosso humano*). Marque a coluna
> **Decisão** (ou me diga "promover Tier A", "A+B", ou os números) que eu viro o
> Status para **Ativa** em lote via MCP. Escopo por modelo: G2 = E-Commerce, G3 = Infoproduto.
>
> **Recomendação-resumo:** promover **Tier A (9)** já · revisar **Tier B (10)** comigo ·
> **segurar Tier C (3)**. A regra "D nunca sustenta [CERTEZA]" continua protegendo os agentes,
> então promover uma estratégia D não a transforma em fato — só a coloca no playbook endossado.

---

## Tier A — Promover já (evidência B, princípio bem documentado, baixo risco)

| # | Estratégia | Alavanca | Ev. | Por que promover | Decisão |
|---|---|---|---|---|---|
| 2 | Ancorar preço (de/por), parcelamento no hero, preço psicológico | Oferta | B | Economist: 84% vs 68%; princípio de ancoragem, não opinião | ☐ |
| 4 | Prova social específica, nota 4,2–4,5 > 5,0 | Landing/CRO | B | Northwestern (+270%); contraintuitivo e bem-sustentado | ☐ |
| 5 | Coleta de avaliações nos SKUs campeões de tráfego | Landing/CRO | B | Ataca causa real (pagar clique p/ página sem prova) | ☐ |
| 8 | Velocidade mobile LCP ≤ 2,5s | Landing/CRO | B | Deloitte/Google (0,1s → +8,4% conversão) | ☐ |
| 11 | ROAS de aquisição (Novos/Engajados/Recorrentes) | Rastreamento/Dados | B | eBay/Tadelis; corrige viés de crédito do remarketing | ☐ |
| 13 | Mensagem contextual por nível de consciência (quente) | Criativo | B | CPL 8,68 vs 9,56; princípio de relevância, aditivo | ☐ |
| 17 | YouTube: janelas longas de público quente + 1 criativo validado | Segmentação/Público | B | Escala sem deteriorar CPL (14,25 vs 13,95) | ☐ |
| 20 | Advantage+ Audience sem públicos manuais (venda) | Segmentação/Público | B | Melhor CPA da conta; alinha com direção da plataforma | ☐ |
| 21 | Envolvimento Supremo (interseção 365d ∩ 7d) | Segmentação/Público | B | CPL 7,76 vs 8,32 com 9k+ leads; método replicável | ☐ |

## Tier B — Promover com ressalva (útil, mas evidência D/opinião ou parâmetro/n=1 a localizar)

| # | Estratégia | Alavanca | Ev. | Ressalva | Decisão |
|---|---|---|---|---|---|
| 1 | Auditar 6 pilares da oferta antes de escalar | Oferta | D | Framework sólido; limiar ATC 4% é referência, varia por nicho | ☐ |
| 3 | Frete transparente, frete grátis piso 1,5× ticket | Oferta | D | Princípio sólido; o piso 1,5× é parâmetro a calibrar por margem | ☐ |
| 6 | Hero 8 elementos + PDP 11 seções | Landing/CRO | D | Checklist operacional útil; limiares de bounce são referência | ☐ |
| 7 | Garantia incondicional visível na PDP | Landing/CRO | D | Princípio sólido; exige operação de troca/reembolso real | ☐ |
| 9 | Escalar 20–30% com CPS como gatilho | Lance/Orçamento | D | Regra de escala amplamente aceita; CPS R$1,50 é parâmetro | ☐ |
| 10 | Google Ads: separar Lost IS budget vs rank | Lance/Orçamento | D | Tecnicamente correto; sem números, mas mecânica válida | ☐ |
| 12 | Recompra via CRM + mídia paga p/ aquisição | Funil/Automação | D | Princípio sólido; cuidar LGPD/opt-in no WhatsApp | ☐ |
| 15 | TikTok: Community Interaction p/ crescer base | Estrutura de campanha | B | Case forte, mas tática específica de 1 KPI (seguidores) | ☐ |
| 18 | Demand Gen: isolar posicionamentos | Estrutura de campanha | B | Método válido; n=1, números não divulgados | ☐ |
| 19 | Testar nome do produto como variável isolada | Landing/CRO | B | Método de teste válido; n=1 (CPA 66,59 vs 81,45) | ☐ |

## Tier C — Segurar (não promover agora)

| # | Estratégia | Alavanca | Motivo do hold | Decisão |
|---|---|---|---|---|
| 14 | Escala Baiana (1-50-1) reduzida | Estrutura de campanha | **Case NEGATIVO** (0 vendas). Promover a "Ativa" leria como "faça isso". Melhor destino: virar **contraindicação** de uma futura estratégia de escala, não estratégia própria. | ☐ manter Rascunho |
| 16 | Remarketing em camadas por intervalo/frequência | Segmentação/Público | Depende de **recurso Meta em rollout** (pode não estar disponível); sem números | ☐ manter Rascunho |
| 22 | Conversão "vídeo ao vivo" IG (objetivo Tráfego) | Estrutura de campanha | Depende de **recurso em rollout**; entrega "buga" se a live atrasar | ☐ manter Rascunho |

---

## Mecânica da promoção
- Ao decidir, eu resolvo título → page_id (via busca no data source `0c6f2e04-…`) e atualizo `Status` de cada página em lote.
- Sugestão de destino do #14: em vez de `Ativa`, transformá-lo numa **contraindicação** dentro da estratégia #9 (escala) — mantém o aprendizado ("não fragmentar orçamento sem calibrar") sem virar recomendação. Me confirme se quer assim.
- Estratégias promovidas continuam com seu **Nível de Evidência** — agentes citam D como [HIPÓTESE], B como case. Promoção ≠ virar fato.
