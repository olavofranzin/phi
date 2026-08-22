// App Card — Diagnóstico GBP no record do Deal (HubSpot). Camada B da spec
// (docs/comercial/card-gbp-record-spec.md §3). READ-ONLY: o card EXIBE dados,
// nunca escreve propriedade nem move o deal.
//
// Plataforma: developer platform 2026.03 / @hubspot/ui-extensions.
// Leitura de dados: actions.fetchCrmObjectProperties([...]) em runtime.

import {
  hubspot,
  Divider,
  Flex,
  Heading,
  ProgressBar,
  StatusTag,
  Tag,
  Text,
} from '@hubspot/ui-extensions';
import { useEffect, useState } from 'react';

// Propriedades lidas do Deal (spec §1 — só as compactas; textões vão na aba nativa).
const PROPS = [
  'potencial_comercial', 'oferta_recomendada', 'ipc', 'score_tecnico',
  'dim_saude', 'dim_seo', 'dim_autoridade', 'dim_conversao', 'dim_engajamento', 'dim_conteudo',
  'site_tipo', 'nao_reivindicado', 'flags_score', 'proxima_acao_aceite',
];

const DIMS: Array<[string, string]> = [
  ['dim_saude', 'Saúde do perfil'],
  ['dim_seo', 'SEO local'],
  ['dim_autoridade', 'Autoridade'],
  ['dim_conversao', 'Conversão'],
  ['dim_engajamento', 'Engajamento'],
  ['dim_conteudo', 'Conteúdo'],
];

const SITE_TIPO: Record<string, string> = {
  site: 'Site próprio', social: 'Rede social', none: 'Sem site',
};

const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// Bandas de status (spec §4): forte ≥70 · médio 40–69 · fraco <40.
// ProgressBar.variant só aceita 'success'|'warning'|'danger' (doc oficial 2026.03 — NÃO tem 'default').
// Dimensão sem dado (null) não renderiza barra; ver o call-site abaixo.
const bandVariant = (v: number): 'success' | 'warning' | 'danger' => {
  if (v >= 70) return 'success';
  if (v >= 40) return 'warning';
  return 'danger';
};

// Paleta por serviço (spec §4) — só variants seguros do StatusTag.
const offerVariant = (svc: string): 'success' | 'default' =>
  svc === 'SVC-GBP' ? 'success' : 'default';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
hubspot.extend<'crm.record.tab'>(({ actions }: any) => <GbpCard actions={actions} />);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const GbpCard = ({ actions }: { actions: any }) => {
  const [p, setP] = useState<Record<string, string>>({});
  const [state, setState] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');

  useEffect(() => {
    actions
      .fetchCrmObjectProperties(PROPS)
      .then((res: Record<string, string>) => {
        const data = res || {};
        setP(data);
        const hasGbp =
          num(data.potencial_comercial) !== null ||
          num(data.ipc) !== null ||
          num(data.score_tecnico) !== null;
        setState(hasGbp ? 'ready' : 'empty');
      })
      .catch(() => setState('error'));
  }, []);

  if (state === 'loading') return <Text>Carregando diagnóstico…</Text>;

  if (state === 'empty') {
    return (
      <Flex direction="column" align="center" gap="small">
        <Text format={{ fontWeight: 'bold' }}>Sem diagnóstico GBP</Text>
        <Text variant="microcopy">
          Este lead não veio do fluxo Maps — nenhum dado de scoring para exibir.
        </Text>
      </Flex>
    );
  }

  if (state === 'error') {
    return (
      <Flex direction="column" align="center" gap="small">
        <Text format={{ fontWeight: 'bold' }}>Não foi possível ler o diagnóstico</Text>
        <Text variant="microcopy">Recarregue o record e tente de novo.</Text>
      </Flex>
    );
  }

  const oferta = p.oferta_recomendada || '—';
  const naoReiv = String(p.nao_reivindicado).toLowerCase() === 'true';
  const siteTipo = p.site_tipo || null;
  const flags = String(p.flags_score || '').split(',').map((s) => s.trim()).filter(Boolean);
  const nba = p.proxima_acao_aceite || 'pendente';

  return (
    <Flex direction="column" gap="medium">
      {/* 1. Topo: Potencial (grande) + Oferta (badge) */}
      <Flex direction="row" justify="between" align="center" wrap="wrap" gap="small">
        <Flex direction="column" gap="extra-small">
          <Text variant="microcopy">Potencial comercial</Text>
          <Heading>{num(p.potencial_comercial) ?? '—'}</Heading>
          <ProgressBar value={num(p.potencial_comercial) ?? 0} maxValue={100} variant="success" />
        </Flex>
        <Flex direction="column" align="end" gap="extra-small">
          <Text variant="microcopy">Oferta recomendada</Text>
          <StatusTag variant={offerVariant(oferta)}>{oferta}</StatusTag>
        </Flex>
      </Flex>

      <Divider />

      {/* 2. IPC × Score — rotular a diferença (spec §4) */}
      <Flex direction="row" gap="large" wrap="wrap">
        <Flex direction="column" gap="extra-small">
          <Text variant="microcopy">IPC — oportunidade de venda</Text>
          <Heading>{num(p.ipc) ?? '—'}</Heading>
        </Flex>
        <Flex direction="column" gap="extra-small">
          <Text variant="microcopy">Score técnico — quão otimizado</Text>
          <Heading>{num(p.score_tecnico) ?? '—'}</Heading>
        </Flex>
      </Flex>
      <Text variant="microcopy">
        IPC alto = muita margem a ganhar. IPC baixo + Score alto = perfil já forte.
      </Text>

      <Divider />

      {/* 3. 6 dimensões — valor sempre visível (cor nunca é o único sinal) */}
      <Text format={{ fontWeight: 'bold' }}>Dimensões (0–100)</Text>
      {DIMS.map(([key, label]) => {
        const v = num(p[key]);
        return (
          <Flex key={key} direction="column" gap="extra-small">
            <Flex direction="row" justify="between">
              <Text>{label}</Text>
              <Text format={{ fontWeight: 'bold' }}>{v ?? '—'}</Text>
            </Flex>
            {v !== null && <ProgressBar value={v} maxValue={100} variant={bandVariant(v)} />}
          </Flex>
        );
      })}

      <Divider />

      {/* 4. Sinais de ouro + 5. NBA */}
      <Flex direction="row" wrap="wrap" gap="extra-small" align="center">
        {naoReiv && <StatusTag variant="warning">Perfil não reivindicado</StatusTag>}
        {siteTipo && <Tag>{SITE_TIPO[siteTipo] || siteTipo}</Tag>}
        {flags.map((f) => <Tag key={f}>{f}</Tag>)}
        <StatusTag variant={nba === 'aceita' ? 'success' : nba === 'rejeitada' ? 'danger' : 'default'}>
          NBA: {nba}
        </StatusTag>
      </Flex>
    </Flex>
  );
};
