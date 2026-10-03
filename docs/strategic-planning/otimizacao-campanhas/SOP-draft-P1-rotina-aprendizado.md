# [SOP DRAFT] P1 — Rotina diária de campanha em fase de aprendizado

> **Estado:** rascunho (git, ADR-012). Vira SOP `Vigente` no DB SOPs após
> red-line do Olavo. Fonte: tácito Olavo 2026-07-02/03 + guidelines de
> fase de aprendizado das plataformas.
> **Fase-alvo:** `fase_campanha = aprendizado` (0–14 dias desde criação ou
> última alteração vital; ainda sem volume de conversões da plataforma).
> **Cadência:** DIÁRIA (1x/dia por campanha em aprendizado).
> **Princípio:** nesta fase o objetivo é PROTEGER a coleta de dados do
> algoritmo, não melhorar performance. CPA alto/instável é esperado.

## Gatilho

- Tarefa gerada automaticamente (futuro L1) ou aberta manualmente para toda
  campanha com `fase_campanha = aprendizado`, 1x/dia.
- Alertas de score (WARNING/CRITICAL) durante aprendizado NÃO abrem P4/P5:
  são reinterpretados e roteados para esta rotina (decisão D3).

## Checklist de verificação (executar em ordem)

1. **Entrega ativa?** Campanha/conjuntos/anúncios com status ativo na
   plataforma (nada pausado por engano ou por política).
2. **Anúncios aprovados?** Nenhum criativo reprovado/limitado. Se reprovado:
   corrigir/appelar HOJE (reprovação para a coleta de dados).
3. **Tracking disparando?** Conversões registrando na plataforma E no GA4
   (evento-chave da campanha visível nas últimas 24–48h, se houve tráfego).
   Divergência plataforma×GA4 > 30% → investigar tag/pixel.
4. **Gasto ≈ orçamento?** Gasto diário próximo do orçamento definido.
   Gasto ~0 com campanha ativa → problema de leilão/lance/segmentação
   estreita — registrar; gasto muito acima → verificar tipo de orçamento.
5. **Volume de eventos no ritmo?** Projeção da semana alcança o volume de
   conversões esperado pela plataforma? Se claramente não → marcar candidata
   a P2 (aprendizado limitado) para avaliação no fim da janela.
6. **Registrar observação do dia** (DB Observações Diárias) — 1 linha:
   ok / anomalia encontrada + ação leve tomada.

## Ações permitidas (correções leves)

- Corrigir reprovações, erros de tag/pixel, links quebrados na landing.
- Ajustes de orçamento ≤ 20% (e preferir orçamento total a diário, quando
  a plataforma permitir).
- Negativar termo claramente irrelevante (Google) que esteja drenando gasto.

## O que NÃO fazer (reseta o aprendizado)

- ❌ Mudar público/segmentação, criativo (imagem/vídeo), meta de conversão.
- ❌ Alterar orçamento > 20% de uma vez.
- ❌ Pausar/reativar "para ver o que acontece".
- ❌ Reagir a CPA do dia: variação de custo por resultado é comportamento
  esperado da fase.

## Critério de saída da rotina

- Campanha sai do aprendizado (idade > 14d sem alteração vital OU volume de
  conversões atingido/estabilizado) → P1 encerra; campanha entra no regime
  de leitura por janela (playbooks de fase madura).
- 14 dias completos SEM conversão → encerrar P1 e abrir **P3 (estrutural)**.
- Volume claramente insuficiente ao fim da janela → abrir **P2**.

## Registro

- Toda ação leve executada → linha no Log de Otimizações (componente, ação,
  hipótese "proteção de aprendizado").
- Alteração vital (se inevitável, decisão consciente do gestor) → registrar
  no Log com flag de reset: o relógio da fase reinicia (D2).
