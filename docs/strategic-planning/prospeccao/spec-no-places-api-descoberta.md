# Spec — Nó de Descoberta via Places API (Fase 1 do Híbrido)

> **Frente:** Prospecção · **Caminho:** A (híbrido Places + Apify) · **Data:** 2026-08-27
> **Decisão de origem:** Olavo, 2026-08-27 — substituir Apify por Places API **apenas na descoberta**.
> **Compatível com:** decisão 2026-07-09 ("a rubrica dos 10 pilares elimina a Places API") — aquela
> decisão governa o **enriquecimento**, que continua sendo Apify. Esta spec cobre a camada anterior.

---

## 1. Por que workflow novo e não editar o L2

O L2 Discovery (`5j79f7oR8x1Nxs4q`) está **em produção**. A regra da casa é não editar prod sem
re-importar canônico. Além disso, precisamos **comparar** Places vs Apify na mesma busca antes de
aposentar o scraper — o que exige os dois vivos ao mesmo tempo.

**Decisão:** criar `GBP Scoring - L2b Discovery (Places API)` como workflow paralelo, `active:false`.
Depois de validado lado a lado, decide-se se substitui o nó Apify do L2 ou se o L2b vira o caminho padrão.

---

## 2. Arquitetura

```
[Manual Trigger]  (+ Execute Workflow Trigger, para o L2b ser chamável)
      │
[Set: Parâmetros]        ← textQuery, regionCode, maxPages, pageSize
      │
[HTTP: Text Search]      ← POST places:searchText
      │
[Code: Paginação]        ← acumula nextPageToken até maxPages (máx 3 = 60 lugares)
      │
[Split Out: places]
      │
[Code: 02_normalizer_places]   ← mapeia p/ schema canônico + deriva endereço
      │
[Code: 03_scoring_fase1]       ← leadScore recalibrado + roteamento de oferta
      │
[Sheets: upsert por id]        ← aba `leads`, chave `id` (place_id)
      │
[Sort: potencial_comercial DESC]
      │
[IF: entra na fila de enriquecimento?]  ← priorização, NÃO descarte
      │
   (true) → [Execute Workflow: L3 Enriquecimento]
```

**Nota sobre o IF:** ele decide *"vale gastar Apify + Gemini neste lead agora?"* — não *"este lead
presta?"*. Lead abaixo da linha permanece na planilha com score, aguardando na fila. Isso respeita a
decisão de 2026-07-10: *"o IPC não gateia 'abordar ou não' — ele roteia para a oferta certa."*

---

## 3. Chamada HTTP — Text Search

| | |
|---|---|
| Método | `POST` |
| URL | `https://places.googleapis.com/v1/places:searchText` |
| Auth | Credencial n8n tipo **Header Auth** — `X-Goog-Api-Key: <chave>` (do cofre, nunca hardcoded) |
| Content-Type | `application/json` |

### FieldMask (header `X-Goog-FieldMask`)

```
places.id,places.displayName,places.formattedAddress,places.addressComponents,
places.types,places.primaryTypeDisplayName,places.businessStatus,
places.rating,places.userRatingCount,places.nationalPhoneNumber,
places.websiteUri,places.regularOpeningHours,places.photos,
nextPageToken
```

**SKU resultante: Text Search Enterprise** (puxada por `rating`/`userRatingCount`/`nationalPhoneNumber`/
`websiteUri`/`regularOpeningHours`). Cota grátis: 10.000 req/mês. Cada req devolve até 20 lugares →
**até 200.000 leads/mês sem custo**.

⚠️ **Nunca usar `*`.** Força a SKU Enterprise + Atmosphere e traz payload inútil.

### Body

```json
{
  "textQuery": "{{ $json.textQuery }}",
  "regionCode": "BR",
  "languageCode": "pt-BR",
  "pageSize": 20,
  "pageToken": "{{ $json.pageToken || '' }}"
}
```

`regionCode: "BR"` é obrigatório por boa prática (relevância geográfica + omite "Brasil" do
`formattedAddress`, encurtando o campo).

### Paginação

Text Search devolve no máximo **20 por página** e **3 páginas** (60 lugares por query). Para volume,
varie os termos e a geografia — não tente paginar além disso. O `nextPageToken` leva alguns segundos
para ficar válido; se vier `INVALID_ARGUMENT` na página 2, inserir `[Wait 2s]` antes.

---

## 4. Mapeamento de campos → schema canônico

Contra `docs/comercial/planilha-leads-schema.json` (63 colunas; 24 de origem `apify.*` na descoberta).

### ✅ Cobertos (18)

| Coluna planilha | Apify | Places API |
|---|---|---|
| `id` | `placeId` | `id` |
| `nome` | `title` | `displayName.text` |
| `setor` | `categoryName` | `primaryTypeDisplayName.text` |
| `contato` | `phone` | `nationalPhoneNumber` |
| `site` | `website` | `websiteUri` |
| `Avaliação` | `totalScore` | `rating` |
| `Quantidade reviews` | `reviewsCount` | `userRatingCount` |
| `Horário` | `openingHours` | `regularOpeningHours.weekdayDescriptions` |
| `Endereço` | `address` | `formattedAddress` |
| `Rua/Avenida` | `street` | `addressComponents[route]` |
| `Bairro` | `neighborhood` | `addressComponents[sublocality_level_1]` |
| `Cidade` | `city` | `addressComponents[locality]` |
| `Estado` | `state` | `addressComponents[administrative_area_level_1]` |
| `CEP` | `postalCode` | `addressComponents[postal_code]` |
| `Posição Pesquisa` | `rank` | índice no array `places[]` |
| `Searchstring` | `searchString` | o `textQuery` enviado |
| `data extração` | `$now` | `$now` |
| `mês extração` | derivado | derivado |

`addressComponents` está na SKU **Essentials** — não eleva o custo e destrava 5 colunas de endereço.

### ⚠️ Degradados (2)

| Coluna | Problema |
|---|---|
| `Quantidade fotos` | `photos[]` retorna **no máximo 10**, não a contagem real. Fica censurado à direita: um perfil com 200 fotos e outro com 10 são indistinguíveis. **Ainda serve como sinal binário** — `<10` identifica perfil claramente fraco, que é justamente o lead de `SVC-GBP`. Gravar como `>=10` quando saturar. |
| `Categoria 1` / `Categoria 2` | `types[]` é taxonomia do Google (`dentist`, `doctor`), não as categorias GBP que o dono escolheu. Não equivalente — gravar mesmo assim, marcado como origem diferente. |

### ❌ Ausentes (4) — recuperados só na Fase 2 (Apify)

| Coluna | Impacto |
|---|---|
| `nao_reivindicado` (`claimThisBusiness`) | **O sinal mais forte do motor.** Regra 🔴 Crítica + "puxa forte" no IPC |
| `Posts` (`ownerUpdates`) | Dimensão Conteúdo (pilar 7) |
| `Agendamento` (`bookingLinks`) | Dimensão Conversão (pilar 8) |
| `Patrocinado` (`isAdvertisement`) | Sinal de que o lead já investe em mídia |

**Regra de escrita:** estas colunas **não devem ser gravadas como `0`/`false` na Fase 1** — isso seria
afirmar um fato não observado. Gravar vazio, e deixar o L3 preencher. Mesma disciplina do guardrail
`source_status error/missing ⇒ N/D, não 0` do BLOCO COMUM.

---

## 5. Recalibração do leadScore (Fase 1)

O design original distribui 100 pontos, mas 30 dependem de features ausentes. Recalibrar em vez de
normalizar — porque as ausentes não se distribuem igual (`claimThisBusiness` é binário e concentrado).

| Indicador | Peso original | Peso Fase 1 | Nota |
|---|---|---|---|
| Nº avaliações | 25 | **30** | |
| Δ concorrentes | 20 | **25** | os outros 19 da mesma busca são o benchmark |
| Categoria principal | 10 | **15** | |
| Site ausente | 5 | **15** | ↑ vira o melhor proxy de perfil negligenciado sem `claimThisBusiness` |
| Horário | 5 | **10** | |
| Nota média | 5 | **5** | com guarda de volume |
| ~~Fotos / cat. secundárias / atributos~~ | 30 | — | migram para Fase 2 |

**Guarda de volume (Tema 10):** nota 5,0 com n=1 não é ponto forte. Exigir `userRatingCount >= 5`
antes de tratar `rating` como sinal.

---

## 6. Roteamento de oferta — roda já na Fase 1

Duas das três regras de 2026-07-10 funcionam só com dado da Places API:

| Regra | Campo | Fase 1? |
|---|---|---|
| Sem site próprio → `SVC-SITE` | `websiteUri` vazio ou domínio de rede social | ✅ |
| Site próprio + GBP sólido → `SVC-ADS` | `websiteUri` + `rating` + `userRatingCount` | ✅ |
| GBP fraco → `SVC-GBP` | precisa de fotos/atributos/claim | 🟡 parcial |

**Ganho:** a fila já sai roteada por oferta antes de gastar Apify.

**Refino v1.1 anotado no design:** negócio pujante com site = rede social (ex.: 259 reviews,
site=Instagram) é lead de `SVC-SITE→ADS` de alto valor, mas a régua o subvaloriza. A classificação
`site_tipo` precisa distinguir `none` / `social` / `own` — e ponderar o valor de `SVC-SITE` pela
**força do GBP**, não tratá-lo como gap pequeno.

---

## 7. Plano de validação (antes de aposentar o Apify)

Rodar **a mesma busca** nos dois caminhos e comparar:

| # | Teste | Critério de aprovação |
|---|---|---|
| 1 | Mesmo `textQuery` no L2 (Apify) e L2b (Places) | ≥80% de sobreposição dos `place_id` retornados |
| 2 | Campos cobertos | `nome`, `contato`, `site`, `Avaliação`, `Quantidade reviews` idênticos ou equivalentes |
| 3 | Ordem/rank | Correlação de ranking entre as duas fontes |
| 4 | `leadScore` recalibrado vs original | Top-10 do Places contém ≥7 do top-10 do Apify |
| 5 | Roteamento de oferta | Mesma oferta recomendada em ≥85% dos leads coincidentes |
| 6 | Custo/cota | Consumo real na cota confere com o previsto |

**Amostra sugerida:** os mesmos 30 dentistas usados na validação do IPC em 2026-07-10 — já existe
baseline para comparar.

---

## 8. Riscos e limites

| Risco | Mitigação |
|---|---|
| 60 resultados máx por query | Variar termos + geo. O Índice de Visibilidade Local já prevê múltiplos termos |
| `photos` capado em 10 | Tratar como sinal binário; contagem real só na Fase 2 |
| Ranking do Text Search ≠ Local Pack | O `Posição Pesquisa` da Places não é o mesmo rank que o Apify lê do Maps. **Não comparar diretamente** — documentar como métricas diferentes |
| Cota compartilhada com outros projetos | Confirmar no console se outro workflow já consome a mesma cota |
| `NOT_FOUND` em place_id antigo | Tratar exceção; usar `movedPlace`/`movedPlaceId` quando vier |

---

## 9. Pendências

- [ ] Aprovação para chamadas MCP do n8n (bloqueia o build)
- [ ] Confirmar credencial Header Auth com a chave da Places API no cofre n8n
- [ ] Confirmar no console do Google Cloud: modelo de cota por SKU ativo, Places API (New) habilitada
- [ ] Decidir se `Categoria 1/2` recebe `types[]` do Google ou fica vazio até a Fase 2
