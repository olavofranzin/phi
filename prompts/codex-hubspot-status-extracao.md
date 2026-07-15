# Correções — workflow "HubSpot - Atualizar status e disparar extracao"

- **Workflow n8n:** ID `kED2AlXJjIYgvHXH` — 47 nós, `active: false`
- **Arquivo a editar:** `workflows/hubspot-status-extracao.json` (repo `olavofranzin/phi`)

---

## Papel do workflow (objetivo que a correção deve cumprir)

1. **Atualizar a planilha** (Google Sheets "Quantidade de Leads por Mês") quando um lead **muda de status** no HubSpot (ex.: "Prospectado" → "Interação Instagram").
2. Manter **SEMPRE 50 leads com status "Prospectado"**. Ao mudar de status, o lead é atualizado na planilha e **abre 1 vaga** (50 → 49).
3. Solicitar ao **Apify** a extração de N leads (quantos faltarem para 50). Os parâmetros da busca vêm de um **nó de tabela de dados do n8n** (Data Table). O lead extraído é **salvo na planilha E no HubSpot**.
4. Os leads passam por **enriquecimento com IA (Gemini)**, que atualiza planilha e HubSpot.
5. Um **loop** identifica leads já enviados ao HubSpot mas **sem o deal id** e grava o deal id na planilha.
6. Um **loop** identifica leads **sem enriquecimento** (falha por limite do free tier do Gemini — o wf **não pode ser interrompido** por esse erro), **reenvia ao agente** e, **se o output vier preenchido**, atualiza o HubSpot.
7. **Ao final, dispara** o workflow "GBP Scoring - L2 Discovery (Pipeline A)".

---

## Restrições (não alterar)

- **Gatilho:** manter **Schedule 2x/dia** (08h/21h) + adicionar **watermark**. **Não** trocar por webhook.
- **Contagem das 50:** manter a leitura da **célula agregada** `Quantidade de Leads por Mês` (aba `qtd leads mes`). **Não** trocar por contagem de linhas.
- **Code nodes em sintaxe v2:** `$input.first()`, `$input.all()`, `$('Nome do Nó').item`. Nunca `items[0]`.
- **Preservar** todos os `id` de nós e o `id` do workflow. **Não ativar** o workflow.
- **Manter os `Wait`/`Wait1`** (2 min) — são o respiro do rate limit do Gemini free tier.
- **IDs fixos (não trocar):** Sheets doc `1MuetJ4N7xiazkw55YOSHtq_nIaHPRKOE-g6GwfaNJKM`; aba `leads` = `gid=0`; aba `qtd leads mes` = `gid=624786381` (`firstDataRow: 7`); HubSpot stage "Prospectado" = `70807682-148b-4914-acd0-97aad8c2a000`; Apify actor `nwua9Gu5YrADL7ZDj`; Data Table `y1kpcfZuJZZqUPf3` ("Prospeccao"); sub-wf final = `5j79f7oR8x1Nxs4q`.
- Em toda gravação em Sheets, **confirme os nomes reais dos cabeçalhos** da aba antes de mapear — não invente nomes de coluna.

---

## Problemas confirmados (base das correções)

1. **Gemini sem modelo** — `Google Gemini Chat Model` e `...Model1` com `modelName` vazio → agente falha.
2. **`Salvar lead bruto na planilha` perde os dados do lead novo** — lê `$json` de `Buscar lead por place_id` (lookup vazio p/ lead novo) e referencia cabeçalhos da planilha, não os campos normalizados; colunas `oferta_recomendada`/`potencial_comercial`/`score_tecnico` = `"="` (vazias).
3. **`Buscar lead por place_id` sem tratamento de "no match"** (`returnFirstMatch: true`, sem `whenFilterHasNoMatch`) → lógica novo-vs-existente quebra.
4. **`Atualizar status do lead na planilha` casa pela coluna `id_hubspot`** que nenhum nó popula → cria linha duplicada em vez de atualizar (quebra o item 1).
5. **Sem watermark** — `Deals que mudaram de status` traz todos os deals não-Prospectado a cada run; `Get recently created/updated deals` está com a saída ignorada (vestigial).
6. **Code `Mapear estagio para status` em modo errado** — usa `$input.item.json` sem `mode: runOnceForEachItem`.
7. **"Manter 50" depende só da célula externa** — nenhum nó decrementa a vaga; exige que o item 1 grave certo na aba `leads`.
8. **Data Table `Get row(s)` com filtro malformado** — `{"conditions":[{"keyValue":"1"}]}` sem `keyName`.
9. **`Get dataset items`** — `offset: "="` (vazio) e `limit: null`.
10. **`Loop Over Items`** — saída "loop" religada a `Run Google Maps Scraper` → risco de re-scrape (custo Apify duplicado).
11. **`Update enriquecimento`** grava `description = output` sem checar se veio preenchido.
12. **`Call 'GBP Scoring...'`** com `workflowInputs` vazio — confirmar se o L2 Discovery precisa de input.

---

## Correções por comportamento

### Item 1 — atualização de status na planilha (prioridade máxima)
- Em `Atualizar status do lead na planilha`, **casar pela coluna `id_deal_hubspot` = `deal_id`** (id do deal HubSpot) e escrever a coluna de status (confirmar o header exato; hoje escreve em `"status hubspot"`). **Não** usar `id_hubspot`. Se o lead ainda não tiver `id_deal_hubspot`, usar a chave disponível (`id`/place_id).
- **Watermark:** usar `Get recently created/updated deals` (que já filtra por data de modificação) como fonte dos deals, ou adicionar filtro `hs_lastmodifieddate > <última execução>` (persistir o timestamp em Data Table ou `staticData`). Remover/neutralizar o nó vestigial.
- Em `Mapear estagio para status`, definir `mode: "runOnceForEachItem"` (ou reescrever com `$input.all()`).
- Manter o `If` que exclui `status == Prospectado` (só mudanças **para fora** de Prospectado abrem vaga; retorno **para** Prospectado não abre vaga).

### Item 2 — manter 50 (célula agregada)
- Manter `Ler contagem de leads` lendo a célula `Quantidade de Leads por Mês` (aba `qtd leads mes`), garantindo leitura de **um único valor** correto.
- Manter `vagas = Math.max(0, 50 - contagem)`.
- `If Quantidade_vagas`: simplificar para condição única **`vagas > 0`** (migrar para IF v2).
- Dependência: para as vagas baterem, o item 1 precisa gravar certo na aba `leads`.

### Item 3 — extração Apify + salvar planilha/HubSpot
- `Salvar lead bruto na planilha`: mapear os campos a partir de **`$('Normalizar campos do lead')`** (dados scrapeados) — placeId→`id`, título→`nome`, telefone→`contato`, site→`site`, categoria→`Categoria 1` etc. (confirmar headers). Remover mapeamentos `"="` vazios.
- `Buscar lead por place_id` / `If lead ja existe`: tratar "sem match" (`whenFilterHasNoMatch` emitindo item previsível) e garantir que o ramo **lead novo** carregue os dados normalizados adiante (referenciar `Normalizar campos do lead`, não `$json` do lookup). Novo → salvar + enriquecer + criar deal + gravar `id_deal_hubspot`; existente → não duplicar.
- `Get row(s)` (Data Table): corrigir o filtro incluindo o `keyName` (nome da coluna) correto para selecionar a linha de "Prospeccao".
- `Get dataset items`: `offset = 0`; `limit` = valor são (ex.: nº de vagas ou um teto).
- `Loop Over Items`: revisar a religação da saída "loop" para **não** re-executar `Run Google Maps Scraper` a cada batch (iterar sobre os itens já obtidos do dataset).
- Após `Criar deal no HubSpot`, gravar o `id_deal_hubspot` retornado na linha da planilha (`Atualizar status prospectado na planilha`).

### Item 4 — enriquecimento Gemini
- **Selecionar o modelo** em `Google Gemini Chat Model` **e** `Google Gemini Chat Model1` (`modelName`) — usar um modelo compatível com o **free tier** (ex.: um `gemini-*-flash`); confirmar o id exato pela credencial.
- **Ferramentas do agente:** o prompt manda "acessar site / pesquisar fontes" mas não há tool anexada. Padrão do projeto (wf irmão `Enriquecimento Site L4`) = Gemini + **Google Search grounding**. Habilitar o grounding no nó Gemini; se não for possível na versão do nó, suavizar o prompt para usar só os dados fornecidos.
- Manter gravação em `enriquecimento` (planilha) e `description` (HubSpot).

### Item 5 — loop preencher deal id
- Fluxo já coerente (`Get lead bruto sem id_deal` → `Loop id_deal` → `Search deal` → `Update id_deal`). Conferir robustez do match do `Search deal` (nome + telefone) e o guard de regex `^ChI…`.

### Item 6 — re-enriquecimento (sem interromper o wf)
- Manter `onError: continueRegularOutput` + `retryOnFail: true` nos nós Agente (garante que o wf não para se o Gemini falhar).
- **Adicionar validação:** antes de `Atualizar lead enriquecido na planilha1` e `Update enriquecimento` (HubSpot), inserir um `If` que só grava se `output` estiver **não-vazio** (não sobrescrever com vazio quando o Gemini falha).

### Item 7 — disparar L2 Discovery
- Manter `Call 'GBP Scoring - L2 Discovery (Pipeline A)'` (`5j79f7oR8x1Nxs4q`) na saída "done" do loop de re-enriquecimento.
- **Confirmar se o L2 Discovery espera inputs.** Se sim, preencher `workflowInputs`.

---

## Workflows irmãos da prospecção (não conflitar)

| Workflow | ID | Relação |
|---|---|---|
| GBP Scoring - L2 Discovery (Pipeline A) | `5j79f7oR8x1Nxs4q` | Disparado no fim deste wf (item 7). |
| GBP Scoring - L3 Enriquecimento (Pipeline B / C2) | `EFD7Drr0LDMqfDXw` | Enriquecimento profundo posterior. |
| Enriquecimento Site L4 | `5L3SyzDkZqf1N6vW` | Padrão de enriquecimento Gemini + Google Search grounding (ref. item 4). |
| Comercial - Deduplicar Leads HubSpot | `izimrLm19H4i6LOq` | Deduplica deals em "Prospectado" — cuidado com duplicatas criadas. |
| Comercial - Sync HubSpot → Planilha (loop de aprendizado) | `WRFU2NM8rLJU7bRT` | Também sincroniza HubSpot→planilha — verificar sobreposição com o item 1. |
