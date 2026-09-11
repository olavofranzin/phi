# Brief sub-chat — Fase 4: desvio em Campanhas + matar os `.first()` + "Fora da Meta?"

Data: 2026-08-08
Branch: `claude/consolidacao-2026-08`
Fases anteriores: `2026-08-08-{prefixo-expressao,tendencia-serie-diaria-fix,desvio-indefinido-fix}-*`
Execution log a produzir: `docs/handoff/2026-08-08-fase4-campanhas-first-forameta-execution-log.md`

> **Você fechou a fase 3 com aceite verde** (barbearia: Crítico / Alta / 76,3% / score 60,
> vazamento eliminado). Verificado direto no Notion. Esta fase estende a mesma correção ao
> workflow de campanhas e mata a classe de bug que você mapeou. Olavo aprovou executar as
> quatro correções com as recomendações abaixo.

**Urgência:** o run automático das **07:00** reescreve as páginas. Campanhas (item A) tem
que estar publicado antes.

---

## Item A (URGENTE) — `sw metricas campanhas`: mesmo bug de desvio da fase 3

Você confirmou que o `Code calculo desvio meta` desse workflow **ainda** tem `return 0` e
`.first()`. É a mesma correção que você já validou no workflow de anúncios — **cópia
direta**, adaptada ao contexto de campanha:

1. `calcDesvio` / `calcTendencia` → devolvem `null` (INDEFINIDO) quando meta ou valor são 0.
   Nunca `0`. Registrar `desvio_motivo`.
2. `v_d1/v_3d/v_7d` do **item corrente** (não `.first()`).
3. Quem consome o desvio (o classificador de campanhas, se houver nó equivalente) tem que
   guardar `null` **antes** de comparar — lembre da armadilha `null <= 0 === true`.

**Aceite (item A):** nenhuma página de Campanha no Notion afirmando "dentro da meta" /
"desvio 0%" quando o CPA da campanha está claramente fora da meta. Campanha determinada →
classificada certo. Use como página-teste a campanha da barbearia
(`GADS-21149189736`) e a do salão (`GADS-21116045403`) — ambas têm CPA real e meta.

---

## Item B — matar a classe `.first()` (7 ocorrências, 3 nós, todas dado por-item)

Você mapeou: nenhuma é config global, todas são dado por-item, e "acertam" só por
coincidência de índices — **quebram quando as contagens de run divergem** (a passada
duplicada do Meta). O `Code Recupera Metas p Comparação` é o mais perigoso (aplica a
**meta de um anúncio a outro**).

**Recomendação (a correção durável): casar por ID, não por índice.** Trocar
`$("Nó").first().json` por uma busca pelo id do item corrente:

```js
const alvo = $("Nó").all().find(x => String(x.json.<id_estavel>) === String(idCorrente));
```

Índice posicional é exatamente o que a passada duplicada quebra; casar por id
(`id_google_ad` / `clean_id_google_camp` / o id que fizer sentido em cada nó)
sobrevive à divergência. Onde não houver id estável para casar, use índice **alinhado**
(`.all()[idx]`), nunca `.first()`, e registre no log por que aquele nó não pôde casar por id.

**Escopo:** os 3 nós de `sw metricas anuncios` que você listou
(`Code Recupera Metas p Comparação`, `Code Unificar Períodos`, `Code classificar status`).
Cuidado no `Code classificar status`: ele **itera os itens internamente**
(`for (const item of items)`), então a correção lá é alinhamento por índice/id dentro do
loop, não `.item` (que exige `runOnceForEachItem`).

**Se algum desses nós, ao casar por id, revelar que o item corrente não tem o campo
esperado** (como aconteceu na origem do bug de desvio), **pare e registre** — pode ser o
mesmo `Code Valida Dados` espalhando a resposta da API por cima dos campos limpos. Não
force.

---

## Item C — `Fora da Meta?`: eliminar a contradição na tela

Hoje a página mostra `Fora da Meta? = NÃO` ao lado de `ad_diagnostico = "76,3% acima da
meta"`. O campo não é escrito por nenhum workflow (é checkbox, provavelmente manual/velho).

**Recomendação — escrever, mas só em leitura determinada:**

- status `Crítico` ou `Atenção` (desvio > 0) → `Fora da Meta? = __YES__`
- status `OK` (desvio ≤ 0) → `Fora da Meta? = __NO__`
- **indefinido / Sem Dados / Em Aprendizado → NÃO escrever** (deixa como está)

A regra do "não escrever quando indefinido" é deliberada: sem informação, não sobrescreve
o que estiver lá. Deriva do mesmo status que já alimenta `ad_status_operacional`, então é
uma linha no `Code Diagnóstico Criativo` + uma propriedade nova no
`Update a database page` (passa de 23 → 24 props). Não invente valor; use o status que já
existe.

---

## Item D — D1/D3 inexistentes: sem mudança de comportamento, só honestidade

`Code Cálcula Métricas` só produz 7d e 30d; a regra `if (d1 > 30)` no `Code classificar
status` **nunca dispara** (D1 sai indefinido). Depois da fase 3 já está null-safe.

**Recomendação — não calcular D1/D3 agora** (seria escopo novo: novas janelas de API sem
demanda). Apenas **deixar um comentário** no nó marcando que D1/D3 não são produzidos neste
fluxo e a regra dorme até que sejam, e **registrar a decisão no log**. Zero mudança de
comportamento. Se preferir remover a linha morta em vez de comentar, tudo bem — o efeito é
idêntico (ela nunca roda). Não gaste tempo além disso.

---

## Ordem, aceite e rollback

1. **Item A primeiro** (campanhas, urgente). Smoke **antes** de publicar. Publicar.
2. **Itens B + C + D** juntos em `sw metricas anuncios`. Smoke antes de publicar. Publicar.
3. **Aceite consolidado** na página `AD01-PMAX_BARBEARIA_10/01/26`
   (`29db65e5-c72b-8013-9418-edfaee111e8c`): manter Crítico / Alta / ~76% / score calculado
   **e** `Fora da Meta? = YES`. E: nenhum anúncio com `analise_desvios` de outro (item B).

**Rollback** (`restore_workflow_version`):
- `sw metricas anuncios` ativo agora = **`b40de4dd`**
- `sw metricas campanhas` ativo agora = **`bb59dde5`**

Se o smoke falhar em qualquer item, reverta aquele workflow na hora e volte com o relatório.

---

## Não fazer

1. Não corrigir o prefixo `=` de outras queries (falso positivo, já provado).
2. Não tocar em `Execute SQL inserir daily entry` nem `BigQuery Persistir Sinais Criativo`.
3. **Não arquivar** o `PHI - Subworkflow Campanhas` (vivo, chamado pelo `Pipeline_v2`).
4. Não perseguir a passada duplicada do Meta — o item B a neutraliza (casar por id), mas a
   **causa** dela (provável `Merge Meta Ads`) fica para outro brief. Só registre.
5. Não calcular D1/D3 (item D).
6. Sem force-push, sem deletar branch, sem abrir PR.

---

## Entregável

`docs/handoff/2026-08-08-fase4-campanhas-first-forameta-execution-log.md`, formato dos
anteriores. Seções: estado inicial (2 workflows) · item A · item B (nó a nó, casou por id
ou índice, por quê) · item C · item D · publicação (versionIds) · smoke com números reais +
os 5 campos de aceite do anúncio KIL + prova em ≥1 campanha · pendências.

Commit + `git push -u origin claude/consolidacao-2026-08`.

No retorno ao chat principal, compacto e em PT-BR:
(a) o que mudou por nó e por workflow;
(b) versionIds antes/depois, o que virou ativo;
(c) aceite: os 5 campos do anúncio KIL + prova numa campanha;
(d) item B: quais nós casaram por id, quais por índice, e por quê;
(e) log + hash do commit;
(f) o que sobrou (esp. o `Merge Meta Ads` e o bug de desvio se aparecer em mais algum lugar).
