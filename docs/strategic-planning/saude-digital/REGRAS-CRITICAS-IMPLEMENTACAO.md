# Regras Críticas de Implementação — n8n · BigQuery · Google Ads

> Leia **PRIMEIRO** o [`CLAUDE.md` da raiz](../../../CLAUDE.md) — as regras **R1–R15** valem aqui também.
> Esta frente é dona de: **as 14 regras críticas de implementação** (n8n, BigQuery, Google Ads API) e
> **o cliente de referência para testes**.
> Verificado em **2026-10-03**, pelo **sub-chat da Fase 1 da memória compartilhada**, contra o
> `CLAUDE.md` da raiz no commit `d543f16`.

| | |
|---|---|
| **Por que este arquivo existe** | estas 14 linhas eram lidas no início de **toda** sessão, inclusive nas que nunca abrem o n8n. **São fato de frente, não regra de raiz** — e a raiz guarda regra |
| 🔴 **O que NÃO está aqui** | as **regras de trabalho R1–R15**. Elas ficaram na raiz e **nenhuma migrou** |
| **Dono de qual fato** | como escrever nó, query e chamada de API **nesta casa**, sem repetir erro já pago |
| **Quem também manda aqui** | o [`CONTRATO-PHI.md`](CONTRATO-PHI.md) (matriz de donos + **M1–M12**) e os ADRs de `adr-rascunhos/` |

---

## As 14 regras críticas

**Byte-idênticas ao que estavam no `CLAUDE.md` da raiz** (commit `d543f16`):

## Regras Críticas de Implementação

1. **BigQuery:** SEMPRE usar `dataset.table` sem project ID entre backticks — ex: `phi_prod.raw_campaign_data`
2. **Nodes INSERT/MERGE:** `Always Output Data = true` obrigatório
3. **`primary_metric_goal`** = FLOAT64 (valor numérico ex: `5.20`). **`primary_metric_type`** = STRING (ex: `'CPA'`)
4. **`client_id`** = `CLI-4` (identificador). **`client_slug`** = `KIL` (sigla 3 letras). São campos diferentes
5. **splitInBatches v3:** branch 0 = done (dispara uma vez, ao fim), branch 1 = loop (dispara a cada item). O último node do corpo do loop DEVE reconectar ao splitInBatches, senão só o 1º item é processado. (Confirmado no SDK n8n: `.onDone` = saída 0, `.onEachBatch` = saída 1.)
6. **IF nodes:** branch 0 = TRUE, branch 1 = FALSE
7. **Conexões no JSON n8n:** usar NOMES dos nodes como chaves, não UUIDs
8. **Queries dinâmicas:** montar SQL no Code node, nunca usar `{{ }}` dentro da query BigQuery
9. **`phi_score` e `Score Diário`** no Notion: escritos pelo PHI após Fase 2 — nunca pelo Daily Entry
10. **PHI não executa otimizações** — detecta, classifica e orienta
11. **Ordem da Fase 3 é imutável:** Fechamento → Escalada → Abertura
12. **Google Ads API:** `developer-token` deve estar no header — NÃO é injetado automaticamente pelo `googleAdsOAuth2Api`
13. **Google Ads API v23:** `metrics.cost_per_conversion` é incompatível com `segments.conversion_action_name/category`
14. **Token Hardcoded no n8n:** o n8n self-hosted não permite que o token seja inserido uma credencial ou variável

---

## O cliente de referência para testes

**Byte-idêntico ao que estava no `CLAUDE.md` da raiz** (commit `d543f16`):

## Cliente de Referência para Testes

| Campo | Valor |
|-------|-------|
| Cliente | KIL |
| `client_id` | `CLI-4` |
| `client_slug` | `KIL` |
| Campanha Barbearia | `GADS-21149189736` |
| Campanha Salão | `GADS-21116045403` |

---

## ⬜ O que este arquivo não garante

| ⬜ | |
|---|---|
| **que as 14 estejam certas hoje** | esta fase **não abriu n8n, BigQuery nem a API do Google** (brief da Fase 1, §7). O recorte é fiel à raiz; **a raiz é hipótese até alguém medir** (`BASE-00` §1.2) |
| **a regra 11 e a Fase 3** | *“a ordem da Fase 3 é imutável”* é **decisão-mãe** — ver [`BASE-01-PRINCIPIOS.md`](../../base/BASE-01-PRINCIPIOS.md) §5. Ela já salvou a casa uma vez: a Fase 0.2 do ADR-37 teria quebrado a Fase 3 (`BASE-04` §4) |
| **a regra 10 e o princípio** | *“PHI não executa otimizações”* **não é regra de implementação, é princípio** — o dono é o [`BASE-01`](../../base/BASE-01-PRINCIPIOS.md) §1. Aqui ela aparece porque estava na lista original, **e não se apaga texto nesta fase** |
