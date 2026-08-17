// App Card — Diagnóstico GBP no record do Deal (HubSpot).
// Camada B da spec (docs/comercial/card-gbp-record-spec.md §3).
// READ-ONLY: o card EXIBE dados; nunca escreve propriedade nem move o deal.
//
// Componentes seguem o mapa da spec §3.2:
//   - Statistics/Text  → Potencial, IPC, Score (números)
//   - Tag/StatusTag    → Oferta, site_tipo, não-reivindicado, NBA
//   - ProgressBar      → 6 dimensões dim_*
//   - Flex/Divider     → layout compacto
//
// Se o Deal não veio do fluxo Maps (sem dados GBP) → estado vazio discreto (spec §3.5).

import React from 'react';
import {
  hubspot,
  Divider,
  Flex,
  ProgressBar,
  Statistics,
  StatisticsItem,
  StatusTag,
  Tag,
  Text,
} from '@hubspot/ui-extensions';

// Ordem canônica das dimensões (spec §4)
const DIMS = [
  ['dim_saude',       'Saúde do perfil'],
  ['dim_seo',         'SEO local'],
  ['dim_autoridade',  'Autoridade'],
  ['dim_conversao',   'Conversão'],
  ['dim_engajamento', 'Engajamento'],
  ['dim_conteudo',    'Conteúdo'],
];

// Bandas de status (spec §4): forte ≥70 · médio 40–69 · fraco <40
const bandVariant = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return 'default';
  if (n >= 70) return 'success';
  if (n >= 40) return 'warning';
  return 'danger';
};

// Paleta por serviço (spec §4)
const offerVariant = (svc) => ({
  'SVC-ADS':  'info',
  'SVC-SITE': 'default',
  'SVC-GBP':  'success',
}[svc] || 'default');

const SITE_TIPO_LABEL = {
  site:   'Site próprio',
  social: 'Rede social',
  none:   'Sem site',
};

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// Considera "sem GBP" quando nenhum score central chegou
const hasGbp = (p) =>
  num(p.potencial_comercial) !== null ||
  num(p.ipc) !== null ||
  num(p.score_tecnico) !== null;

hubspot.extend(({ context }) => (
  <GbpCard properties={context?.crm?.properties || {}} />
));

function GbpCard({ properties: p }) {
  if (!hasGbp(p)) {
    return (
      <Flex direction="column" align="center" gap="sm">
        <Text format={{ fontWeight: 'bold' }}>Sem diagnóstico GBP</Text>
        <Text variant="microcopy">
          Este lead não veio do fluxo Maps — nenhum dado de scoring para exibir.
        </Text>
      </Flex>
    );
  }

  const oferta   = p.oferta_recomendada || '—';
  const naoReiv  = String(p.nao_reivindicado).toLowerCase() === 'true';
  const siteTipo = p.site_tipo || null;
  const flags    = String(p.flags_score || '').split(',').map(s => s.trim()).filter(Boolean);
  const nba      = p.proxima_acao_aceite || 'pendente';

  return (
    <Flex direction="column" gap="md">
      {/* 1. Topo: Potencial (grande) + Oferta (badge) */}
      <Flex direction="row" justify="between" align="center" wrap="wrap" gap="sm">
        <Statistics>
          <StatisticsItem label="Potencial comercial" number={num(p.potencial_comercial) ?? '—'} />
        </Statistics>
        <Flex direction="column" align="end" gap="xs">
          <Text variant="microcopy">Oferta recomendada</Text>
          <StatusTag variant={offerVariant(oferta)}>{oferta}</StatusTag>
        </Flex>
      </Flex>

      <Divider />

      {/* 2. IPC × Score Técnico — rotular a diferença (spec §4) */}
      <Statistics>
        <StatisticsItem label="IPC" number={num(p.ipc) ?? '—'} />
        <StatisticsItem label="Score técnico" number={num(p.score_tecnico) ?? '—'} />
      </Statistics>
      <Text variant="microcopy">
        IPC = oportunidade de venda (quanto há a ganhar). Score técnico = quão otimizado o perfil já está.
      </Text>

      <Divider />

      {/* 3. 6 dimensões em barras (com valor SEMPRE visível — cor nunca é o único sinal) */}
      <Text format={{ fontWeight: 'bold' }}>Dimensões (0–100)</Text>
      {DIMS.map(([key, label]) => {
        const v = num(p[key]);
        return (
          <Flex key={key} direction="column" gap="xs">
            <Flex direction="row" justify="between">
              <Text>{label}</Text>
              <Text format={{ fontWeight: 'bold' }}>{v ?? '—'}</Text>
            </Flex>
            <ProgressBar
              value={v ?? 0}
              max={100}
              variant={bandVariant(v)}
              showPercentage={false}
            />
          </Flex>
        );
      })}

      <Divider />

      {/* 4. Sinais de ouro + 5. NBA */}
      <Flex direction="row" wrap="wrap" gap="xs" align="center">
        <Text variant="microcopy">Sinais:</Text>
        {naoReiv && (
          <StatusTag variant="warning">Perfil não reivindicado</StatusTag>
        )}
        {siteTipo && <Tag>{SITE_TIPO_LABEL[siteTipo] || siteTipo}</Tag>}
        {flags.map(f => <Tag key={f}>{f}</Tag>)}
        <StatusTag variant={nba === 'aceita' ? 'success' : nba === 'rejeitada' ? 'danger' : 'info'}>
          NBA: {nba}
        </StatusTag>
      </Flex>
    </Flex>
  );
}
