# [RASCUNHO] ADR-25 — Sub-WFs reutilizáveis: Social + GBP (cliente↔prospecto)

> **STATUS:** RASCUNHO (git, ADR-012). Vira `Aceito` no Lote 4/L5.
> Aprovado em princípio por Olavo 2026-06-22 (D11).

## Contexto

Olavo apontou que a análise de redes sociais e de Google Business Profile
(GBP) serve **dois** consumidores: (a) a Saúde Digital do cliente (T28
camada 2) e (b) os workflows de prospecção (avaliar um prospecto antes de
fechar). Duplicar a lógica em dois lugares geraria drift.

## Decisão

**Análise Social e Análise GBP são sub-WFs únicos, parametrizados por
`tipo_alvo` (`cliente` \| `prospecto`) e `id_alvo`, com contrato de
saída estável.**

- Um único `SUB-WF Análise Social` serve T28 e Prospecção.
- Um único `SUB-WF Análise GBP` serve T28 e Prospecção.
- Contratos de saída versionados: `features_social_v1`, `features_gbp_v1`.
- Consumidores dependem da **interface** (contrato), não da implementação.

## Contrato de saída (esboço — fechar no L4)

```
features_social_v1 = {
  tipo_alvo, id_alvo, plataforma, janela,
  followers, growth_rate, engagement_rate, post_frequency,
  sentiment_score, response_time_hours, flags[]
}

features_gbp_v1 = {
  tipo_alvo, id_alvo, janela,
  reviews_count, reviews_avg_rating, response_rate,
  search_views, maps_views, website_clicks, phone_calls,
  direction_requests, flags[]
}
```

## Alternativas consideradas

1. **Lógica duplicada em T28 e Prospecção.** Rejeitado: drift garantido;
   melhoria num lado não chega no outro.
2. **Biblioteca de Code compartilhada (copy-paste de jsCode).** Rejeitado:
   n8n não tem import real; copy-paste é drift disfarçado.
3. **Sub-WF parametrizado (escolhida).** Uma fonte, dois chamadores,
   contrato versionado.

## Consequências

- (+) Zero drift entre Saúde Digital e Prospecção.
- (+) Contrato versionado permite evoluir sem quebrar consumidores.
- (+) Prospecção ganha análise de qualidade sem reimplementar.
- (-) Sub-WF precisa lidar com diferenças cliente vs prospecto (ex:
  prospecto não tem histórico interno; cliente tem).
- (-) Acoplamento de roadmap entre frente T28 e frente Comercial.

## Reavaliar quando

- Surgir 3º consumidor com requisitos divergentes (forçaria generalizar mais).
- Diferenças cliente/prospecto ficarem grandes o bastante para justificar split.

## Conexões com ADRs vigentes

- **ADR-012** (separação de concerns): sub-WF reutilizável é aplicação.
- **ADR-010** (BQ analítico): features sociais podem materializar em `t28_social_*` (L4).
- **ADR-23/24** (camadas + rollup): Análise Social/GBP alimentam a Análise Saúde Cliente.
- Área **Comercial** (ESTADO §3.6): consumidor de prospecção; coordenar owner.
