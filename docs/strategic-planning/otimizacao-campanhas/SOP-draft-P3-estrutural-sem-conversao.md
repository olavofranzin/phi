# [SOP DRAFT] P3 — Diagnóstico estrutural: campanha madura sem conversão

> **Estado:** rascunho (git, ADR-012). Vira SOP `Vigente` no DB SOPs após
> red-line do Olavo. Fonte: tácito Olavo 2026-07-02/03 ("após 14 dias sem
> conversão deixa de ser problema de campanha iniciante — outro caminho").
> **Fase-alvo:** `fase_campanha = madura` E conversões = 0 na janela
> (>14 dias de vida). Este é um SINAL FORTE, não "falta de dado".
> **Cadência:** tarefa única com prazo; reavaliação por janela (D-7).
> **Princípio:** o problema quase nunca é ajuste fino. Diagnosticar na ordem
> de maior probabilidade × menor custo de verificação, e SÓ ENTÃO agir.
> Uma hipótese por vez — mudanças simultâneas destroem a leitura do efeito.

## Gatilho

- `fase_campanha = madura` + `conversions` = 0 na janela D-7 (ou D-14),
  com gasto > 0 (se gasto = 0, o problema é de entrega → P5).
- Encerramento de P1 por "14 dias sem conversão".

## Ordem de diagnóstico (parar no primeiro culpado encontrado)

### Etapa 1 — Tracking (custo de verificação: minutos)
- Evento de conversão dispara em teste real (formulário/compra/WhatsApp)?
- Tag/pixel presente na página final? GA4 registra o evento-chave?
- Conversão importada corretamente na plataforma (fonte certa, sem duplicata,
  janela de atribuição sã)?
- **Se quebrado:** consertar tracking e encerrar — a campanha pode até estar
  convertendo. Reavaliar na próxima janela antes de qualquer outra mudança.

### Etapa 2 — Oferta (custo: análise)
- A oferta/promessa do anúncio é competitiva? (preço, prova social, urgência
  vs. concorrentes anunciando pelos mesmos termos)
- O volume de busca/demanda existe? (termos de busca com impressões reais)
- **Se fraca:** problema de negócio, não de mídia — levar ao cliente com
  evidência. Registrar no Log como hipótese estrutural.

### Etapa 3 — Landing page (custo: leitura de dados já coletados)
- Sinais T28: Clarity `rage_clicks`/`dead_clicks` altos? `avg_scroll_depth`
  baixo? GA4 `bounce_rate` alto / `engagement_rate` baixo / duração ínfima?
- Coerência anúncio→página (promessa, termo buscado, CTA visível mobile)?
- Velocidade de carregamento mobile aceitável?
- **Se ruim:** tarefa de LP (fora da plataforma de ads). NÃO mexer na
  campanha enquanto a LP não mudar — gastaria o reset à toa.

### Etapa 4 — Segmentação/termos (custo: análise nos dados T28)
- `pct_other_terms` alto → gasto vazando para busca irrelevante: negativar.
- `pct_competitor_terms` dominante sem oferta comparativa → repensar.
- Palavras/públicos amplos demais para o orçamento? Local: raio/região certa?
- **Ação:** refinar (negativação primeiro — não reseta; troca de público por
  último — reseta, volta para P1).

### Etapa 5 — Verba/leilão (custo: análise)
- `impression_share` muito baixo + `budget_lost_is` alto → orçamento abaixo
  do mínimo viável do leilão: ou aumenta (≤20%/vez), ou reduz escopo
  (menos termos/região), ou pausa consciente com registro.

## Regras da execução

- **Uma hipótese por janela.** Ação → esperar a janela → medir efeito
  (delta em t28/score) → próxima etapa se necessário.
- Ações que resetam aprendizado (público, criativo, meta de conversão)
  devolvem a campanha à fase de aprendizado → reabrir P1.
- Se as 5 etapas se esgotarem sem caminho: recomendação de encerramento/
  reestruturação da campanha ao cliente, com o diagnóstico documentado.

## Registro e saída

- Cada etapa verificada → item de checklist na tarefa; culpado encontrado →
  hipótese no Log de Otimizações (componente + ação + hipótese + prazo).
- Saída: primeira conversão registrada em janela pós-ação (encerra com
  efeito) OU decisão estrutural registrada (encerra sem efeito, com causa).
