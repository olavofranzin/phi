# [RASCUNHO] ADR-33 · ANEXO — Design de Implementação: Contrato de Identidade nos Gatilhos

> **STATUS:** RASCUNHO de design (git). Companheiro do **ADR-33** (a decisão). Este anexo é o
> **"como"**: mudança por nó, ordem faseada e plano de teste. Escrito 2026-08-09 após o Passo
> 0-C (arquitetura de gatilhos magros + pareamento revelada). **Nenhuma linha de código foi
> aplicada por este anexo** — Item A já está no rascunho (ver ADR-33); o resto abaixo é
> especificação para aprovar antes de tocar.

---

## 1. O achado que fundamenta tudo (por que é raiz, não patch)

`Code Cálcula Métricas` (linha 151) **já tenta** ler a identidade do gatilho:

```js
const campaignId = data.google_ads_id || data.raw_notion_data?.clean_id_google
                 || data.campaign?.id || data.campaign_id;
```

E `aggregateGoogleResponse` (linha 49) **já filtraria** as linhas da resposta Google por essa
identidade:

```js
if (normalizedCampaignId && rowCampaignId && rowCampaignId !== normalizedCampaignId) continue;
```

**Mas o gatilho Google (`Edit Fields`) entrega só `{meta_valor: 3.5}`** — sem `campaignId`.
Logo `campaignId` fica `undefined`, `normalizedCampaignId` vira `''`, e **o filtro da linha
49 nunca dispara**: o nó agrega o que o **pareamento** (`$('HTTP...').item`) trouxer, sem
conferir de quem é. É essa a associação frágil que vazou nas Fases 1–6.

> **Conclusão de design:** basta **carimbar `entity_id` no gatilho** para o filtro por-chave
> (que já existe no código) **passar a valer**. A associação deixa de ser "confia no
> pareamento" e vira "confere por id". Mudança pequena, efeito na raiz.

O `Edit Fields` (Set **v3.4**) estripa o item porque está com `includeOtherFields`
**desligado** (só o assignment `meta_valor` sobrevive). Confirmado na config real.

---

## 2. Mudanças por nó — lado Google

| Nó | Mudança | Fonte da identidade |
|---|---|---|
| **`Edit Fields`** (Set v3.4) | Adicionar 3 assignments: `entity_id`, `entity_name`, `platform` (além de `meta_valor`). Mantém o item magro, mas **com identidade**. | `={{ $json.entity_id }}`, `={{ $json.entity_name }}`, `={{ $json.platform }}` — produzidos pelo **Item A** em `Code Valida Dados`. |
| **`Code Cálcula Métricas`** | (a) linha 151: acrescentar `data.entity_id` **no início** da cadeia de `campaignId`. (b) No objeto de saída: **carimbar** `entity_id`/`entity_name`/`platform` para o downstream (Notion/SQL) casar por chave. | O próprio gatilho, agora carimbado. |

Efeito: o filtro da linha 49 passa a valer → cada campanha agrega **só as próprias linhas**;
o vazamento por pareamento morre na raiz; a identidade segue para Notion/SQL.

> **Alternativa rejeitada:** ligar `includeOtherFields: true` no `Edit Fields`. Funciona, mas
> arrasta o payload pesado (`results`, agregados) adiante à toa. Assignments explícitos =
> item magro + identidade. (CLAUDE.md: solução mais simples.)

---

## 3. Mudanças por nó — lado Meta (movimento 1 do ADR)

O branch Meta perde a identidade em `Code Valida Dados Meta` (emite `{data:[],
has_data:false}`) e some de vez em `Code Cálculo Dados Meta` (emite `{}`). Fonte da identidade
Meta: `Code clean propriedades` (`clean_id_meta_campaign`, `clean_id_meta_ads`,
`clean_notion_id_{camp,adset,ads}`, `platform`).

| Nó | Mudança |
|---|---|
| **`Code Valida Dados Meta`** | Nunca emitir item sem identidade. Carimbar `platform` + `entity_id` (`clean_id_meta_campaign`/`clean_id_meta_ads`) + `entity_name` + `page_id` (`clean_notion_id_*`), **inclusive no caminho `no_results`**. Fonte: `$('Code clean propriedades').item.json` (com dado, também de `data[0].campaign_id/ad_id`). |
| **`Code Cálculo Dados Meta`** | No ramo "sem dado", **não** dar `push(item)` de um `{}` — emitir um item com identidade + `has_data:false`. |

> **Ressalva de teste:** o `$('Code clean propriedades').item` depende do pareamento e **só é
> verificável dentro do n8n** (pinned smoke, sem escrita) — não em sandbox local. Registrar
> como passo obrigatório antes de publicar o lado Meta.

---

## 4. Guarda (movimento 3) — *(feito, rascunho)* versão mínima, alinhada à Opção A

> **APLICADO 2026-08-09.** Depois de comparar shapes reais, a guarda ficou **mais
> conservadora** que o rascunho inicial — dropa **só o `{}` de 0 chaves**:

```js
// ADR-33 B3: dropa itens vazios {} (quirk do Merge Meta em cliente sem aquela plataforma).
const items = $input.all().filter((it) => it && it.json && Object.keys(it.json).length > 0);
```

**Por que NÃO usar o clause `!entity_id && !platform && !data_source`:** o `Edit Fields`
(Set, `includeOtherFields` off) mantém só `meta_valor`+identidade; uma campanha **Google
configurada sem dado** chega com `entity_id` vazio, `platform` vazio e `data_source`
**estripado** — o clause a dropava, violando a **Opção A** (sem-dado ⇒ linha, não sumiço).
A guarda mínima a **preserva** (tem `meta_valor` ⇒ ≠ 0 chaves).

**Limite conhecido:** o fantasma **Meta `no_results` (5 chaves)** em cliente Google-only
**ainda passa** — separá-lo de um `no_results` de Meta **real** exige identidade no item
Meta, que só vem na **B2**. Verificado local: dropa os 2 `{}`, mantém Google real,
Google-sem-dado e Meta `no_results`.

---

## 5. Coalesce (movimento 2) — quando houver dado Meta real

Com `entity_id` nos itens Meta, o `Merge Meta Ads` vira coalesce por chave: D-1 se
`has_data`, senão D-2 do **mesmo** `entity_id`, senão **um** item "sem dado" com identidade.
Resolve o fan-in das 2 saídas do `If D-2 exist1`. **Só implementar/testar quando CHA (ou
outra campanha) tiver métrica Meta populada** — hoje toda run Meta volta `data:[]`.

---

## 6. Decisão de PRODUTO pendente (é sua, Olavo)

Quando o Meta (ou o Google) **volta vazio** para uma campanha configurada:

- **(A) Linha com identidade + `has_data:false`** (não zerada como métrica válida). O Guardião
  (ADR-29) sinaliza "campanha existe, sem dado hoje". **Recomendado** — nada some em silêncio.
- **(B) Nenhuma linha.** Mais limpo no Notion, mas "sem dado" fica invisível (risco T11:
  flatline silencioso).

> **DECIDIDO 2026-08-09 (Olavo): opção (A).** Campanha configurada sem dado ⇒ **linha com
> identidade + `has_data:false`**, nunca sumir em silêncio nem virar métrica zerada válida.
> Consequências no design: (1) a **guarda** (secção 4) dropa só `{}`/sem-origem — **preserva**
> item `no_results` com identidade; (2) o **coalesce** (secção 5) emite, no pior caso, **um**
> item "sem dado" **com identidade**, não zero itens; (3) o `Code Cálcula Métricas` deve
> **preservar** `validation_status`/`has_data` na saída para o Guardião ler.

Esta decisão define o comportamento final do coalesce (mov. 2) e da guarda (mov. 3).

---

## 7. Ordem de implementação (faseada, do mais seguro ao mais arriscado)

| Fase | O quê | Testável com dado real? | Risco |
|---|---|---|---|
| **A** | *(feito, rascunho)* Identidade no `Code Valida Dados` (Google) | ✅ sandbox **+ n8n end-to-end (exec `26854`)** | baixo — no rascunho |
| **B1** | *(feito, rascunho)* `Edit Fields` carrega `entity_id`/`entity_name`/`platform` + `Code Cálcula Métricas` lê `data.entity_id` (ativa o filtro por-campanha) e carimba identidade na saída | ✅ sandbox **+ n8n end-to-end (exec `26854`)**: gatilho carrega id, saída carimbada, `cpa_7d=6.17` = campanha certa | baixo-médio — **maior valor**: ativa filtro por-chave, mata vazamento por pareamento |
| **B2** | *(feito, rascunho)* Identidade Meta nos 2 validadores (`Code Valida Dados Meta` + `... D-2 Meta`) via `$('Code clean propriedades').first()`, em todos os caminhos (secção 3) | ✅ **n8n (exec `26867`, CHA)**: validadores + `Cálcula Métricas` com `entity_id`/`platform`/`page_id`; linha Opção A (sem-dado com identidade, não `{}`) | médio |
| **B3** | *(feito, rascunho)* Guarda mínima: dropa `{}` de 0 chaves (secção 4) | ✅ sandbox **+ n8n (exec `26854`: 1 item limpo, sem `{}`)** | baixo — preserva Google-sem-dado (Opção A); `no_results` Google-only aguarda B2 |
| **B4** | Coalesce (secção 5) | ❌ até haver dado Meta | alto — adiar |

> **Recomendação:** a próxima fase de código é a **B1** — pequena, testável com dado real, e
> é ela que transforma a associação de "pareamento" em "por-chave". As demais dependem de
> pinned smoke (B2), são triviais depois de B1 (B3), ou esperam dado Meta (B4).

---

## 8. Plano de verificação

1. **Baseline:** execuções `26355` (Google-only, KIL) e `26180` (mista, com Meta CHA) — já
   capturadas no ADR.
2. **Pós-B1:** rodar e conferir — (a) `campaignId` resolve de `data.entity_id`; (b)
   `aggregateGoogleResponse` **filtra por campanha** (nenhuma linha do vizinho entra);
   (c) a saída carrega `entity_id`/`platform`; (d) valores por campanha batem com o baseline.
3. **Pós-B2:** pinned smoke (sem escrita) — item Meta `no_results` sai **com** identidade, não
   `{}`.
4. **Pós-B3:** `{}` some do `Code Cálcula Métricas`; contagem de itens = nº real de campanhas.
5. **Publicar** só com OK de budget do Olavo; `versionId` de rollback no Ledger (ADR-32).

---

## 9. Estado final (2026-08-10) — lote pronto para publicar

**A + B1 + B2 + B3 aplicados e validados end-to-end no n8n** (Google exec `26854`, Meta exec
`26867`). Rascunho `bc245b0b`; ativo intacto `96dd7975`. A associação métrica↔campanha↔Notion
passou a ser **por `entity_id`**, nos dois lados; os fantasmas `{}` são dropados; sem-dado
vira linha com identidade (Opção A). Falta só: **publicar** (com OK de budget) e conferir o
próximo run agendado, com rollback pronto para `96dd7975`.

> **Nota de processo (aprendizado):** editar via API **enquanto o editor n8n está aberto**
> gera conflito — um `Ctrl+S` na aba sobrescreve o que a API gravou (aconteceu com a B2 na
> exec `26863`). Regra: com o editor aberto, mudanças de nó vão **para colar no canvas** (não
> via API); publicar/salvar é ação do canvas.

---

*Anexo de design. Item A permanece no rascunho até publicar em lote — agora o lote está
completo e validado.*
