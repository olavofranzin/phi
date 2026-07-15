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

---

## Testes a conduzir (para averiguar as alterações)

> A execução real contra n8n/HubSpot/Apify/Sheets ao vivo é feita pelo Claude no aceite. O executor conduz os testes abaixo **sobre o arquivo JSON** (estrutural + rastreio lógico). Marque como `PENDENTE-LIVE` o que só puder ser confirmado em execução real.

### Bloco A — Validação estrutural (obrigatória; cada item = PASS/FAIL)
1. `jq . workflows/hubspot-status-extracao.json` roda sem erro (JSON válido).
2. Toda expressão `$('Nome do Nó')` referencia um nó que existe; toda entrada em `connections` aponta para nós existentes (sem referência órfã).
3. Todos os `id` de nós e o `id` do workflow preservados; nós novos têm `id`.
4. `Google Gemini Chat Model` **e** `Google Gemini Chat Model1` com `modelName` **não-vazio**.
5. `Atualizar status do lead na planilha`: `matchingColumns` contém **`id_deal_hubspot`** (e **não** `id_hubspot`).
6. `Mapear estagio para status`: `mode = "runOnceForEachItem"`.
7. `If Quantidade_vagas`: condição única **`vagas > 0`** (IF v2), sem 2ª condição malformada.
8. `Get row(s)` (Data Table): filtro com **`keyName` preenchido**.
9. `Get dataset items`: `offset = 0` e `limit` numérico (não `null`/vazio).
10. `Salvar lead bruto na planilha`: mapeamentos referenciam **`$('Normalizar campos do lead')`**; nenhum mapeamento `"="` vazio.
11. `Buscar lead por place_id`: `whenFilterHasNoMatch` definido (trata lead novo).
12. Nós Agente (`Agente de Enriquecimento`, `Agente de Enriquecimento1`): `onError = "continueRegularOutput"` e `retryOnFail = true`.
13. Item 6: existe um `If` que só grava quando `output` é **não-vazio**, antes de `Atualizar lead enriquecido na planilha1` e de `Update enriquecimento`.
14. `Loop Over Items`: a saída "loop" **não** religa a `Run Google Maps Scraper` (sem re-scrape por batch).
15. Watermark presente: `Deals que mudaram de status`/`Get recently created/updated deals` limita por data de modificação; nó vestigial removido/neutralizado.
16. Restrições respeitadas: gatilho ainda é Schedule 2x/dia (sem webhook); contagem ainda lê a célula agregada; `Wait`/`Wait1` presentes; `active` continua `false`.

### Bloco B — Rastreio lógico por cenário (simular o fluxo com estes dados)
Para cada cenário, percorra o grafo e registre a saída esperada de cada nó-chave:

- **C1 — mudança de status:** entrada `deal_id="D123"`, `novo_estagio="qualifiedtobuy"`. Esperado: `status_mapeado="Interação Instagram"`; `Atualizar status do lead na planilha` casa a linha por `id_deal_hubspot="D123"` e grava o status (atualiza, **não** cria linha nova).
- **C2 — cálculo de vagas:** célula agregada = `47`. Esperado: `vagas=3`; `If Quantidade_vagas` passa (true); `Run Google Maps Scraper` recebe `maxCrawledPlacesPerSearch=3`.
- **C3 — lead novo:** `place_id="ChIJnovo..."` não existe na planilha. Esperado: ramo "novo" → `Salvar lead bruto` grava campos **não-vazios** vindos do Normalizar → `Criar deal no HubSpot` → `id_deal_hubspot` gravado na planilha.
- **C4 — lead já existente:** `place_id` já na planilha. Esperado: ramo "existente" → **não** duplica linha nem deal.
- **C5 — Gemini falha (free tier):** `Agente de Enriquecimento` retorna erro. Esperado: wf **não interrompe**; lead segue sem `enriquecimento`; o loop do item 6 o recaptura, reenvia, e **se o output vier vazio, NÃO grava** no HubSpot/planilha.
- **C6 — fechamento:** loop de re-enriquecimento chega em "done". Esperado: dispara `Call 'GBP Scoring - L2 Discovery (Pipeline A)'` (`5j79f7oR8x1Nxs4q`).

### Bloco C — Execução real (gate final; conduzida pelo Claude no aceite)
Push ao n8n (`update_workflow` no ID `kED2AlXJjIYgvHXH`) + execução controlada; confere: linha atualizada (não duplicada) na aba `leads`; Apify chamado com nº de vagas correto; deal criado no HubSpot com `id_deal_hubspot` refletido na planilha; enriquecimento gravado só quando preenchido; L2 Discovery disparado. Se o executor tiver acesso de escrita a uma **cópia de teste**, pode antecipar este bloco; caso contrário, deixar para o Claude.

---

## Meta — critérios para reportar "correção efetuada"

Só reporte a correção como **efetuada** quando **TODOS** os itens abaixo forem verdadeiros. Se algum depender de execução real que você não pôde rodar, reporte-o como `PENDENTE-LIVE (Claude)` — não como concluído.

1. **Bloco A 100% PASS** (16/16 checagens estruturais).
2. **Bloco B**: os **7 comportamentos** rastreáveis de ponta a ponta com as saídas esperadas dos 6 cenários (C1–C6).
3. **12 bugs corrigidos** (checklist da seção "Problemas confirmados"), cada um com PASS.
4. **Zero referências quebradas** e JSON válido.
5. **Zero restrições violadas** (gatilho schedule mantido, célula agregada mantida, ids preservados, waits mantidos, `active=false`).

Enquanto qualquer item de 1–5 estiver FAIL, a correção **não** está efetuada. O relatório final deve trazer o resultado item a item (PASS / FAIL / PENDENTE-LIVE) para que o Claude faça a validação real (Bloco C) e o aceite.
