# Brief sub-chat — Fase 3: desvio INDEFINIDO ≠ zero + fim do vazamento entre anúncios

Data: 2026-08-08
Branch: `claude/consolidacao-2026-08`
Fases anteriores: `2026-08-08-prefixo-expressao-n8n-*` · `2026-08-08-tendencia-serie-diaria-fix-*`
Execution log a produzir: `docs/handoff/2026-08-08-desvio-indefinido-fix-execution-log.md`

> **Olavo aprovou a opção A: corrigir para frente.** Sua fase 2 está aceita — a opção B
> funciona e a série do BigQuery entrou (CORTE.CABELO, `tendencia_real=57.82`). Seu
> diagnóstico do `Code calculo desvio meta` foi verificado de forma independente e está
> correto. Esta fase conserta o que você encontrou.

**Urgência:** a página do anúncio da barbearia hoje afirma **"Dentro da meta (CPA desvio 0%)"**
com CPA 76% acima da meta. O run automático das **07:00 de amanhã** reescreve as páginas.
Precisa estar publicado antes disso.

---

## 1. A causa (confirmada em duas pontas)

Em `Code calculo desvio meta`:

```js
const calcDesvio = (valor) => {
  if (meta === 0 || valor === 0) return 0;   // <-- AQUI
  ...
};
```

**`valor = 0` significa "não sei", e está devolvendo `0` — que a jusante lê como
"desvio zero = dentro da meta".** É a mesma classe de erro da **regra 8 do BLOCO COMUM**
(`conversions = 0 ⇒ CPA/ROAS INDEFINIDOS, nunca zero`): confundir *ausência de informação*
com *valor neutro*.

E o `valor` chega zerado por causa do fallback:

```js
if (v_d1 === 0 && v_3d === 0 && v_7d === 0) {
  const u = $("Code Unificar Períodos (D1, 3D, 7D)").first().json;   // <-- .first()
  v_d1 = Number(u.v_d1||0); v_3d = Number(u.v_3d||0); v_7d = Number(u.v_7d||0);
}
```

`.first()` devolve **sempre o primeiro item**, não o do anúncio corrente — é o vazamento
que você observou (o anúncio Meta recebendo os números do CORTE.CABELO). O nó roda em
`runOnceForAllItems`, então `.first()` é o mesmo objeto para todos.

> Nota de escopo: `.first()` aparece em **8 nós** deste workflow, todos em
> `runOnceForAllItems`. **Corrija apenas o `Code calculo desvio meta`.** Mapeie os outros
> no log (nó, o que busca, se é dado por-item ou de configuração global) — só isso.
> `.first()` para config global é legítimo; para dado por-item é bug.

---

## 2. O que fazer

### 2.1 `Code calculo desvio meta` — desvio indefinido

```js
const calcDesvio = (valor) => {
  if (!meta || meta === 0) return null;    // sem meta -> INDEFINIDO
  if (!valor || valor === 0) return null;  // sem valor -> INDEFINIDO, nunca 0
  return isMaiorMelhor ? ((meta - valor)/meta)*100 : ((valor - meta)/meta)*100;
};
```

`d1/d3/d7.desvio` passam a poder ser `null`. Registre também, no `analise_desvios`, um
campo diagnosticável (ex.: `desvio_motivo`: `'ok' | 'sem_meta' | 'sem_valor'`).

### 2.2 `Code calculo desvio meta` — valor por item, sem `.first()`

`v_d1/v_3d/v_7d` têm de ser os valores **do item corrente**. Trace de onde eles realmente
podem vir (o item já carrega `cpa_7d`, `metricas_calculadas.d7`, etc. — você viu
`cpa_7d: 6.17` no mesmo item onde o desvio saiu 0). Escolha o mecanismo que couber:

- ler do próprio `data` (preferível — sem dependência cross-node); ou
- `runOnceForEachItem` + `.item` (como você fez na fase 2, e que se provou correto).

**Proibido:** `.first()` para dado por-item. Se o valor não resolver, deixe `null` e deixe
o `calcDesvio` devolver `null` — degradar para "não sei" é o comportamento certo.

### 2.3 `Code classificar status` — tratar `null` ANTES de comparar

⚠️ **Armadilha de JavaScript:** `null <= 0` é `true`. O código atual faz
`if (d7 <= 0) status = "OK"` — com `desvio: null` ele classificaria como **OK/Bom**,
que é exatamente o bug que estamos consertando. E `Math.max(null, 0)` é `0`, o que daria
**score 100**.

Guarde **antes** de qualquer comparação ou aritmética: se `analise.d7.desvio` for
`null`/`undefined`, o item não é classificável por desempenho → mesma saída do ramo
"sem base" que você já tem lá (`final_status: "Sem Dados"`, `final_score: null`), com o
motivo registrado em `significancia`.

### 2.4 `Code Tendência Real` — rótulo honesto

Hoje `metodo = 'sem_historico'` cobre dois casos diferentes. Separe:

| condição | rótulo |
|---|---|
| `nDias < 4` | `sem_historico` |
| `nDias >= 4` mas a métrica não computa (ex.: `conv_3 = 0` → CPA indefinido) | `sem_metrica_na_janela` |

É o caso real da barbearia: `n_dias = 21` (histórico existe) com `conv_3 = 0`.
O guardrail está certo; só o rótulo mentia.

### 2.5 `sw metricas campanhas` — aplicar a opção B

A mesma correção da fase 2 (SQL da série montado em Code node, id de campanha correto).
Anote o `activeVersionId` **antes**.

---

## 3. Ordem e critério de aceite

1. Aplicar 2.1 → 2.4 em `sw metricas anuncios` (`vVAdXAJh6MW2Z5Hp`).
2. **Smoke ANTES de publicar**, se conseguir. Se não der, publique e rode o smoke em
   seguida — mas então **reverta na hora** se o aceite falhar (não repita a fase 2).
3. **Critério de aceite** na página `AD01-PMAX_BARBEARIA_10/01/26`
   (Notion `29db65e5-c72b-8013-9418-edfaee111e8c`), com CPA 7d R$6,17 vs meta R$3,50:

   | campo | esperado |
   |---|---|
   | `ad_diagnostico` | desvio **~76%** (não 0%) |
   | `ad_status_operacional` | **Crítico** |
   | `ad_prioridade_otimizacao` | **Alta** (Urgente rebaixado por evidência parcial) |
   | `ad_score_operacional` | número calculado, **não** 100 e **não** vazio |

   E **nenhum anúncio** com `analise_desvios` de outro anúncio (checar a passada do Meta).
4. Só depois, `sw metricas campanhas` (2.5) + publicar + smoke.

**Rollback:** `restore_workflow_version`.
`sw metricas anuncios` ativo agora = **`ba9f1aec`**. Se precisar voltar mais fundo,
`f618a9d6` é o estado pré-sessão.

---

## 4. Não fazer

1. **Não corrigir os outros 7 `.first()`** — só mapear.
2. Não mexer no prefixo `=` de outras queries; não tocar em
   `Execute SQL inserir daily entry` nem `BigQuery Persistir Sinais Criativo`.
3. **Não arquivar** o `PHI - Subworkflow Campanhas` — sua fase 2 provou que está vivo
   (chamado pelo `Pipeline_v2`).
4. Não perseguir a **passada duplicada do anúncio Meta** (4 runs para 3 anúncios).
   Pré-existente, provavelmente o `Merge Meta Ads`. Só registre.
5. Sem force-push, sem deletar branch, sem abrir PR.

---

## 5. Entregável

`docs/handoff/2026-08-08-desvio-indefinido-fix-execution-log.md`, no formato dos anteriores.
Seções mínimas: estado inicial · mudanças por nó · publicação (versionIds) · smoke com os
números reais e os 4 campos do aceite · mapa dos `.first()` restantes · pendências.

Commit + `git push -u origin claude/consolidacao-2026-08`.
