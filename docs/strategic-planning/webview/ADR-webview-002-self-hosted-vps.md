# ADR-webview-002 — Mudar hospedagem de Lovable/Supabase para VPS self-hosted

- **Status:** Aceito (decidido com o Olavo em 2026-08-24)
- **Data:** 2026-08-24
- **Frente:** Webview · Lote 3 (backend)
- **Supersede parcialmente:** o §3 do brief e o PLANO-W3 assumiam Supabase (edge
  functions do Lovable). Este ADR troca a camada de execução.

## Contexto

Durante o W3, o build do backend no Lovable **travou** (>1h sem retorno, sem
commit). Investigando alternativas, o Olavo informou que possui **VPS** e
**hospedagem compartilhada** na Hostinger e o código do PHI Dashboard baixado.

Além do travamento, trabalhar via agente do Lovable tem custos recorrentes
(créditos), é opaco (não dá para depurar o código com precisão) e mais lento
para iterar do que editar código diretamente.

## Decisão

**Migrar o webview para self-hosted no VPS da Hostinger**, versionado no
repositório git `olavofranzin/phi` (pasta `webview/`):

- **Frontend:** o mesmo app React (Vite + shadcn), inalterado no essencial.
- **Backend:** **Node/Express** (`webview/server/`) substitui as edge functions
  do Supabase. Guarda o segredo da service account e lê o BigQuery via REST.
- **Deploy:** tudo no VPS (Node serve a API **e** o build estático). Deploy por
  `git pull` + build. A hospedagem compartilhada não é usada.
- **Lovable:** deixa de ser a plataforma de execução. Permanece só como
  histórico/lab; a fonte de verdade do código passa a ser o git.

## Justificativa

1. **Destrava o W3** — o build no Lovable estava inviável.
2. **Controle e depuração** — o código é editado, revisado e testado
   diretamente (build do front validado, servidor com smoke test).
3. **Sem custo recorrente** de créditos por iteração.
4. **Segurança preservada** — o segredo continua **só no servidor** (variável de
   ambiente do VPS), nunca no bundle do navegador. Mesma garantia do plano
   original.
5. **Aproveita a infra que o Olavo já tem** (VPS).

## Consequências

- **Positivas:** iteração rápida por git; deploy simples (`git pull` + build +
  restart); mesma arquitetura lógica do plano (navegador → backend com segredo →
  BigQuery); guardrails intactos.
- **Custos/risco:** operação do VPS passa a ser responsabilidade nossa
  (Node em execução, TLS/proxy reverso, restart). Mitigado com guia de deploy e
  uso de gerenciador de processo (pm2/systemd).
- **W2 preservado:** o repo `phi-dashboard` (sync do Lovable) estava
  desatualizado (sem o W2). O W2 foi **reaplicado no git** a partir do conteúdo
  já validado (7 arquivos + 2 edições), então nada se perdeu.
- **Dossiê (W4) segue em mock** até ligarmos o Notion — fase híbrida aceita.

## Verificação (feita)

- `npm run build` do front: **passou** (TypeScript + Vite, 2531 módulos).
- Backend: `node --check` OK; sobe na porta; `/api/health` responde
  `{ok:true,hasSecret:false}`; `/api/phi-snapshot` sem segredo devolve **502
  JSON tratado** (sem crash) — a UI mostra erro, não dados falsos.
- Segredo nunca referenciado no front (só `import.meta.env.VITE_PHI_API_BASE`,
  que é a URL da API, não credencial).

## Pendências (próximos passos)

- Olavo gera a chave JSON da service account e a coloca como env `GCP_SA_KEY` no
  VPS (ver `docs/strategic-planning/webview/GUIA-DEPLOY-VPS.md`).
- Validar com a campanha KIL (`GADS-21149189736`) via `/api/phi-snapshot?debug=1`
  e ajustar o objeto `COLS` (nomes reais das colunas) se necessário.
