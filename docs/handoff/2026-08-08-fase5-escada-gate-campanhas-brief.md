# Brief sub-chat — Fase 5: escada de evidência + fim do `.first()` no gate de Campanhas

Data: 2026-08-08
Branch: `claude/consolidacao-2026-08`
Fases anteriores: `2026-08-08-{prefixo-expressao,tendencia-serie-diaria-fix,desvio-indefinido-fix,fase4-campanhas-first-forameta}-*`
Execution log a produzir: `docs/handoff/2026-08-08-fase5-escada-gate-campanhas-execution-log.md`

> **A assimetria que você apontou no item (f) da fase 4.** As fases 3–4 destravaram o gate
> dos **anúncios** (escada de evidência) mas o gate das **campanhas** continua no limiar
> binário antigo (100 cliques / 10 conv em 7d) + `.first()`. Por isso a campanha da
> barbearia ficou "Dados Insuficientes" (3 conv < 10) enquanto o anúncio já classifica
> certo. Olavo aprovou fechar essa simetria. É a última correção contida desta rodada.

Workflow: `sw metricas campanhas`. Ativo agora = **`67e0366e`** (rollback).

---

## 1. O que portar (do `sw metricas anuncios / Code classificar status`, já vivo)

Você conhece o código — foi você que o publicou. Traga para o `Code classificar status` do
`sw metricas campanhas`:

1. **Escada de evidência** no lugar do gate binário:
   - PLENO: ≥100 cliques **e** ≥10 conv (na 7d **ou** na 30d) → `confianca: certeza`.
   - PARCIAL: ≥30 cliques **e** ≥3 conv → `confianca: hipotese`, registrar a janela.
   - NENHUM: só aqui deixa de classificar.
   - Avaliar 7d **e** 30d; o melhor nível vence.
2. **Matar o `.first()`** do fallback de volume (o do HTTP D7). Use os `raw_*_7d` /
   volume do **item corrente** — exatamente como você fez na fase 4 no workflow de anúncios.
3. **`final_score` = `null`** (não 50) quando não classifica; nunca o 50 mágico.
4. **Objeto `significancia`** com `nivel / janela_evidencia / confianca / clicks_7d /
   conversions_7d / clicks_30d / conversions_30d`.

---

## 2. Adaptações obrigatórias (campanha ≠ anúncio — não copie cego)

1. **"anúncio novo" → "campanha nova".** No workflow de anúncios a idade vem de
   `Data de Lançamento` do item. Para campanhas:
   - se o item carregar uma data de início/lançamento da campanha, use-a (mesma lógica,
     `DIAS_APRENDIZADO`);
   - **se não houver essa data no item, NÃO invente** — quando `nivel = nenhum` e não há
     data, caia em `Sem Dados` (não em "Em aprendizado"). Registre no log qual caminho
     valeu.
2. **Rótulos DENTRO das opções do DB Campanhas.** As opções de select do banco de
   **Campanhas** podem diferir das de Anúncios. **Antes de escrever qualquer rótulo, busque
   o schema do data source de Campanhas** (a coleção-mãe da página de campanha) e confirme
   as opções válidas de status/prioridade/tendência. Se um rótulo que você usaria (ex.:
   "Em aprendizado") **não existir** lá, use o equivalente que existir e registre a
   correspondência no log. Não crie opção nova no Notion.
3. **Quem consome o status.** Mapeie o nó que escreve o status/score da campanha no Notion
   (o equivalente ao `Code Diagnóstico Criativo` + `Update a database page` do fluxo de
   anúncios). Ele precisa aceitar `final_score = null` (não gravar 0/100 nesse caso) e os
   novos níveis. Se o fluxo de campanhas **não** tiver um nó de diagnóstico separado e
   escrever direto do `Code classificar status`, ajuste ali. Descreva no log o que achou.
4. **`.first()` residuais.** Se ao mexer você cruzar outros `.first()` de dado por-item no
   fluxo de campanhas, **apenas mapeie** (não corrija) — mesma disciplina da fase 4. A
   exceção é o do próprio `Code classificar status`, que está no escopo.

---

## 3. Aceite

Smoke **antes** de publicar (execução manual usa o rascunho). Depois publicar.

Na página de campanha da **barbearia** (`GADS-21149189736` — a campanha, não o anúncio):

- **não** mais "Dados Insuficientes"/"Em aprendizado" — deve classificar com evidência
  (parcial ou pleno) a partir do volume 30d;
- o desvio real da campanha refletido (a fase 4 já corrigiu o cálculo; agora o gate deixa
  de barrar a leitura).

E, para não regredir a fase 4:
- campanha do **salão** (`GADS-21116045403`) mantém `Crítico` / desvio ~27% / "Acima da Meta".

Se o smoke falhar, **reverta na hora** para `67e0366e` e volte com o relatório.

---

## 4. Não fazer

1. Não mexer no prefixo `=`; não tocar nos nós de escrita BigQuery
   (`Execute SQL inserir daily entry`, `BigQuery Persistir Sinais Criativo`).
2. **Não arquivar** o `PHI - Subworkflow Campanhas`.
3. Não corrigir `.first()` fora do `Code classificar status` de campanhas — só mapear.
4. Não calcular D1/D3. Não perseguir o `Merge Meta Ads`.
5. Não criar opções de select novas no Notion — use as existentes.
6. Sem force-push, sem deletar branch, sem abrir PR.

---

## 5. Entregável

`docs/handoff/2026-08-08-fase5-escada-gate-campanhas-execution-log.md`, formato dos
anteriores. Seções: estado inicial · escada portada (nó a nó) · adaptações campanha
(data de início? rótulos que casaram/divergiram; nó que consome) · publicação (versionId
antes/depois) · smoke com a campanha da barbearia + a do salão (não-regressão) · `.first()`
residuais mapeados · pendências.

Commit + `git push -u origin claude/consolidacao-2026-08`.

Retorno compacto PT-BR: (a) o que mudou por nó; (b) versionId antes/depois; (c) aceite —
barbearia deixou de ser "Dados Insuficientes"? qual classificação recebeu? salão regrediu?;
(d) rótulos: algum divergiu do DB Campanhas?; (e) log + hash; (f) o que sobrou.
