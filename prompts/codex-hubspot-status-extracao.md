# Brief — Correção do workflow "HubSpot - Atualizar status e disparar extracao"

> **Canal de comunicação Claude ↔ Executor.** Este arquivo é o único ponto de troca.
> O brief está no topo. Você (executor) **anexa sua resposta no FINAL** deste arquivo.
> Claude (revisor) anexa a revisão logo abaixo. O ciclo se repete. **Máximo 3 tentativas.**

- **Workflow n8n:** `HubSpot - Atualizar status e disparar extracao` — ID `kED2AlXJjIYgvHXH` (`active: false`, 47 nós)
- **Arquivo que você edita:** `workflows/hubspot-status-extracao.json` (repo `olavofranzin/phi`, branch `claude/fix-daily-entry-workflow-dC96Q`)
- **Revisor / arquiteto:** Claude (Opus 4.8) — faz a análise pós-execução e a validação real no n8n.
- **Executor:** você.
- **Data:** 15/07/2026

---

## 0. REGRAS DO CICLO — LEIA PRIMEIRO

1. **Você edita APENAS o arquivo `workflows/hubspot-status-extracao.json`.** É JSON de workflow n8n exportado (com `id`, `nodes`, `connections`, `settings`). Preserve TODOS os `id` de nós e o `id` do workflow.
2. **NÃO toque no n8n vivo.** Não chame `update_workflow`, `publish_workflow`, `restore_workflow_version` nem ative o workflow. **Quem sobe ao n8n é o Claude, e só após o aceite final.** Você pode usar ferramentas de LEITURA do n8n MCP (`get_node_types`, `search_nodes`, `get_sdk_reference`) para conferir parâmetros, mas nada que escreva na instância.
3. **Sem validador de JSON ao vivo para você.** O `validate_workflow` do n8n MCP valida *código SDK*, não JSON — então sua validação é: (a) JSON bem-formado, (b) referências entre nós intactas (todo `$('Nome do Nó')` aponta para um nó que existe), (c) coerência com este brief. A validação real no n8n (`update_workflow` + execução de teste) é feita pelo Claude no aceite.
4. **Você tem TODAS as autorizações liberadas.** Execute sem pedir confirmação ao usuário. O dono quer ver o resultado pronto.
5. **3 tentativas.** Cada rodada = você corrige o JSON + anexa sua resposta neste arquivo → Claude revisa e anexa veredito → você aplica os ajustes. Se após a 3ª o resultado não fechar, Claude escala ao dono.
6. **Se travar, PARE e peça orientação.** Se encontrar algo que você não sabe resolver E cuja solução arriscaria **contrariar o papel deste workflow ou o dos workflows irmãos da prospecção** (seção 6), **NÃO invente**. Anexe um bloco `BLOQUEIO — PRECISO DE ORIENTAÇÃO` no fim do arquivo descrevendo o impasse. Claude repassa ao dono.
7. **Como responder:** use exatamente o formato da seção 8. Termine SEMPRE com a linha `=> AGUARDO ANÁLISE DO CLAUDE`.

---

## 1. PAPEL DO WORKFLOW (o que ele DEVE fazer)

Fonte: dono do projeto. O desenho atual **não** cumpre isto — por isso a correção. **Mantenha este papel; não o contrarie.**

1. **Atualizar a planilha** (Google Sheets "Quantidade de Leads por Mês") quando um lead **muda de status** no HubSpot (ex.: passa de "Prospectado" → "Interação Instagram").
2. A planilha deve manter **SEMPRE 50 leads com status "Prospectado"**. Quando um lead muda de status, ele é atualizado na planilha e **1 vaga se abre** (50 → 49).
3. Em seguida, o wf **solicita ao Apify a extração de 1 lead** (ou de quantos faltarem para 50) para preencher a(s) vaga(s). Os parâmetros do que o Apify vai pesquisar vêm de um **nó de tabela de dados do n8n** (Data Table). O lead extraído é **salvo na planilha E no HubSpot**.
4. Os leads passam por **enriquecimento de um agente de IA (Gemini)**, que atualiza planilha e HubSpot com os dados enriquecidos.
5. Um **loop** verifica se há lead na planilha já enviado ao HubSpot mas **sem o deal id** do HubSpot — e atualiza essa informação na planilha.
6. Verifica também se algum lead **ficou sem enriquecimento** (por limite de chamadas do free tier do Gemini — o wf **não pode ser interrompido** se esse nó retornar erro). Se ficou, **reenvia ao agente** e, **se os dados vierem preenchidos corretamente**, atualiza o campo também no HubSpot.
7. **Ao final, dispara o workflow "GBP Scoring - L2 Discovery (Pipeline A)".**

---

## 2. ARQUITETURA TRAVADA PELO DONO (não alterar sem autorização)

O dono já decidiu estes 3 pontos. **Não mude — se algo exigir mudar, é BLOQUEIO (seção 0.6).**

| Ponto | Decisão | Implicação |
|---|---|---|
| **Gatilho** | Manter **Schedule 2x/dia** (08h e 21h) — **não** trocar por webhook HubSpot | Adicionar **watermark** para não reprocessar deals já vistos (ver §4.1). |
| **Contagem das 50 vagas** | Manter a **leitura da célula agregada** `Quantidade de Leads por Mês` (aba `qtd leads mes`) | **Não** substituir por contagem de linhas. Mas o caminho de atualização de status TEM que gravar corretamente na aba `leads` para a fórmula dessa célula refletir a realidade (ver §4.1/§4.2 — dependência crítica). |
| **Repositório** | `olavofranzin/phi`, arquivo `workflows/hubspot-status-extracao.json` | Não criar repo novo. |

---

## 3. DIAGNÓSTICO DO ESTADO ATUAL (confirmado lendo o JSON)

**Trigger:** `Schedule Trigger1` (08h/21h) → `Get recently created/updated deals` → `Deals que mudaram de status`. Não há webhook.

**Fluxo real (resumido):**
- **Ramo 1 (status):** `Deals que mudaram de status` (search `dealstage NEQ Prospectado`) → `Loop deals novo status` → `Dados do deal` → `Mapear estagio para status` (Code) → `If Vencido/Perdido` → `Atualizar status do lead na planilha`.
- **Ramo 2 (vagas+Apify):** ao fim do loop → `Get row(s)` (Data Table "Prospeccao") → `Preparar parametros de re-extracao` → `Ler contagem de leads` → `Calcular vagas disponiveis` → `If Quantidade_vagas` → `Run Google Maps Scraper` → `Get dataset items` → `Remove Duplicates` → `Normalizar campos do lead` → `If place_id valido` → `Buscar lead por place_id` → `If lead ja existe` → (novo) `Salvar lead bruto na planilha` → `Agente de Enriquecimento` → `Atualizar lead enriquecido na planilha` → `Search deal por place_id` → `If deal ja existe` → `Criar deal no HubSpot` → `Atualizar status prospectado na planilha` → `Wait` → `Loop Over Items`.
- **Ramo 3 (deal id):** `Get lead bruto sem id_deal` → `Loop id_deal` → `Search deal` → `Update id_deal`.
- **Ramo 4 (re-enriquecimento + fim):** `Get lead bruto sem id_deal1` (filtra `enriquecimento` vazio) → `If id valido da planilha` → `Loop enriquecimento leads` → `Normalizar campos do lead1` → `Agente de Enriquecimento1` → `Atualizar lead enriquecido na planilha1` → `Search deal no HubSpot` → `Update enriquecimento` → `Wait1` → (done) → `Call 'GBP Scoring - L2 Discovery (Pipeline A)'`.

**Integrações (ids verbatim):**
- Google Sheets doc `1MuetJ4N7xiazkw55YOSHtq_nIaHPRKOE-g6GwfaNJKM`; aba `leads` = `gid=0`; aba `qtd leads mes` = `gid=624786381` (`firstDataRow: 7`, coluna lida `Quantidade de Leads por Mês`).
- HubSpot: `deal`, stage "Prospectado" = `70807682-148b-4914-acd0-97aad8c2a000`.
- Apify actor `nwua9Gu5YrADL7ZDj` (Google Maps Scraper), `maxCrawledPlacesPerSearch: {{ $json.vagas }}`.
- Data Table `y1kpcfZuJZZqUPf3` ("Prospeccao"), projeto `QAumYwlPGm37G3p1`.
- Gemini: `Google Gemini Chat Model` e `...Model1` — **`modelName` VAZIO nos dois**.
- Sub-wf final: `executeWorkflow` → `5j79f7oR8x1Nxs4q`.

**BUGS CONFIRMADOS (12):**
1. **Gemini sem modelo** — ambos `lmChatGoogleGemini` com `modelName` vazio → agente falha. (itens 4 e 6)
2. **`Salvar lead bruto na planilha` perde os dados do lead novo** — lê `$json` vindo de `Buscar lead por place_id` (lookup **vazio** para lead novo) e referencia cabeçalhos da planilha (`hubspot_estagio`, `mês extração`, `id`, `nome`…), não os campos normalizados. Deveria referenciar `$('Normalizar campos do lead')`. Colunas `oferta_recomendada`/`potencial_comercial`/`score_tecnico` = `"="` (vazias). (item 3)
3. **`Buscar lead por place_id` sem tratamento de "no match"** — `returnFirstMatch: true` sem `whenFilterHasNoMatch`; para lead genuinamente novo, a lógica novo-vs-existente quebra. (item 3)
4. **`Atualizar status do lead na planilha` casa pela coluna `id_hubspot`** que **nenhum nó popula** (os demais usam `id`/`id_deal_hubspot`) → `appendOrUpdate` cria linha duplicada em vez de atualizar. **Isto quebra o papel central (item 1).**
5. **Sem watermark na detecção** — `Deals que mudaram de status` traz TODOS os deals não-Prospectado a cada run (reprocessa 2x/dia). `Get recently created/updated deals` tem a saída **ignorada** (nó vestigial). (item 1)
6. **Code `Mapear estagio para status` em modo errado** — sem `mode`, default "Run Once for All Items", mas o código usa `$input.item.json` → deveria ser "Run Once for Each Item". (item 1)
7. **"Manter 50" depende só da célula externa** — `vagas = max(0, 50 - contagem)`, contagem = célula `Quantidade de Leads por Mês`. Nenhum nó decrementa a vaga; depende da fórmula externa refletir a aba `leads`. (item 2) — **mantido por decisão do dono**, mas exige que o item 1 grave certo.
8. **Data Table filter malformado** — `{"conditions":[{"keyValue":"1"}]}` **sem `keyName`** → pode não selecionar a linha certa de "Prospeccao". (item 3)
9. **`Get dataset items`** — `offset: "="` (vazio) e `limit: null`. (item 3)
10. **`Loop Over Items` re-scrape** — saída "loop" religada a `Run Google Maps Scraper` → risco de re-executar o Apify (custo duplicado) a cada batch. (item 3)
11. **Item 6 sem validação de sucesso** — `Update enriquecimento` grava `description = output` sem checar se veio preenchido; reenvio pode sobrescrever com vazio. (item 6)
12. **Sub-wf final sem inputs** — `Call 'GBP Scoring...'` com `workflowInputs` vazio; confirmar se o L2 Discovery precisa de entrada. (item 7)

---

## 4. CORREÇÕES EXIGIDAS (por comportamento) — mantenha o papel

> Em toda gravação em Google Sheets, **confirme os nomes reais dos cabeçalhos** da aba antes de mapear (você pode ler uma amostra da planilha). Não invente nomes de coluna.

### 4.1 Item 1 — atualização de status na planilha (PRIORIDADE MÁXIMA)
- **Corrigir a coluna de match** em `Atualizar status do lead na planilha`: casar pela coluna que identifica o lead que já tem deal — **`id_deal_hubspot` = `deal_id`** (o id do deal HubSpot) — e escrever a coluna de status (confirmar o header exato; hoje o código escreve em `"status hubspot"`). **NÃO** usar `id_hubspot`. Se o lead ainda não tiver `id_deal_hubspot` gravado, usar a chave disponível (`id`/place_id) — mas o normal é casar pelo deal id.
- **Watermark:** usar o nó `Get recently created/updated deals` (que já filtra por data de modificação) como **fonte** dos deals a processar, em vez do `search` irrestrito — ou adicionar filtro `hs_lastmodifieddate > <última execução>` (persistir o timestamp da última run em Data Table ou `staticData`). Remover/neutralizar o nó vestigial.
- **Code `Mapear estagio para status`:** definir `mode: "runOnceForEachItem"` (ou reescrever com `$input.all()`), para `$input.item.json` funcionar.
- **Semântica de "abre vaga":** qualquer mudança **para fora** de "Prospectado" abre vaga; retorno **para** "Prospectado" não deve abrir vaga (e idealmente re-ocupa). Manter o `If` que exclui `status == Prospectado`. Se surgir ambiguidade real aqui, é candidato a BLOQUEIO.

### 4.2 Item 2 — manter 50 (decisão: manter célula agregada)
- Manter `Ler contagem de leads` lendo a célula `Quantidade de Leads por Mês` (aba `qtd leads mes`), mas garantir leitura **robusta de um único valor** (hoje lê da linha 7 e pega o primeiro item — assegure que pega a célula certa).
- Manter `vagas = Math.max(0, 50 - contagem)`.
- **`If Quantidade_vagas` (hoje IF v1 malformado):** simplificar para condição única **`vagas > 0`** (o `≤ 50` é redundante). Recomendado migrar para IF v2.
- **Dependência crítica:** para as vagas baterem, o item 1 precisa gravar certo na aba `leads`. Documente isso.

### 4.3 Item 3 — extração Apify + salvar planilha/HubSpot
- **`Salvar lead bruto na planilha`:** mapear os campos a partir de **`$('Normalizar campos do lead')`** (dados scrapeados), não do lookup vazio. Mapear placeId→`id`, título→`nome`, telefone→`contato`, site→`site`, categoria→`Categoria 1` etc. (confirmar headers). Remover mapeamentos `"="` vazios ou preenchê-los.
- **`Buscar lead por place_id` / `If lead ja existe`:** tratar corretamente "sem match" (definir `whenFilterHasNoMatch` para emitir item vazio previsível) e garantir que o ramo **lead novo** carregue os dados normalizados adiante (referenciar o nó `Normalizar campos do lead`, não `$json` do lookup). Lógica: **novo** → salvar + enriquecer + criar deal + gravar `id_deal_hubspot`; **existente** → não duplicar.
- **`Get row(s)` (Data Table):** corrigir o filtro incluindo o `keyName` (nome da coluna) correto para selecionar a linha de parâmetros de "Prospeccao".
- **`Get dataset items`:** `offset = 0`; `limit` = valor são (ex.: o nº de vagas ou um teto).
- **`Loop Over Items`:** revisar a religação da saída "loop" para **não** re-executar `Run Google Maps Scraper` a cada batch — o loop deve iterar sobre os itens já obtidos do dataset. Corrigir o alvo do loop-back.
- **Vínculo deal↔planilha:** após `Criar deal no HubSpot`, gravar o `id_deal_hubspot` retornado na linha da planilha (`Atualizar status prospectado na planilha`).

### 4.4 Item 4 — enriquecimento Gemini
- **Selecionar o modelo** em `Google Gemini Chat Model` **e** `Google Gemini Chat Model1` (`modelName`). Escolher um modelo compatível com o **free tier** do projeto (ex.: um `gemini-*-flash`). Confirme o id exato disponível pela credencial. **Sem isto, itens 4 e 6 não funcionam.**
- **Ferramentas do agente:** o prompt manda "acessar o site / pesquisar fontes", mas não há tool anexada. O padrão do projeto (ver wf irmão `Enriquecimento Site L4`) é **Gemini + Google Search grounding**. Recomendado: habilitar o grounding/Google Search no nó Gemini para alinhar ao padrão. Se não for possível na versão do nó, **suavizar o prompt** para usar só os dados fornecidos. (Se isto virar decisão de produto, sinalize.)
- Manter gravação em `enriquecimento` (planilha) e `description` (HubSpot).

### 4.5 Item 5 — loop preencher deal id
- Fluxo já coerente (`Get lead bruto sem id_deal` → `Loop id_deal` → `Search deal` → `Update id_deal`). Apenas conferir a robustez do match do `Search deal` (nome + telefone) e o guard de regex `^ChI…`.

### 4.6 Item 6 — re-enriquecimento (não interromper o wf)
- Manter `onError: continueRegularOutput` + `retryOnFail: true` nos nós Agente (garante que o wf **não** para se o Gemini falhar — requisito explícito).
- **Adicionar validação:** antes de `Atualizar lead enriquecido na planilha1` e `Update enriquecimento` (HubSpot), inserir um `If` que só grava se `output` estiver **não-vazio** — para um Gemini que falhou não sobrescrever com vazio. Isto cumpre "se os dados vierem preenchidos corretamente".

### 4.7 Item 7 — disparar L2 Discovery
- Manter `Call 'GBP Scoring - L2 Discovery (Pipeline A)'` (`5j79f7oR8x1Nxs4q`) na saída "done" do loop de re-enriquecimento.
- **Confirmar se o L2 Discovery espera inputs.** Se sim, preencher `workflowInputs`. (Claude pode exportar o JSON desse sub-wf a seu pedido — ver §6.)

---

## 5. RESTRIÇÕES TÉCNICAS DO PROJETO PHI
- **Code nodes em sintaxe v2:** `$input.first()`, `$input.all()`, `$('Nome do Nó').item`. Nunca `items[0]`.
- **Preservar todos os `id`** de nós e o `id` do workflow no JSON.
- **Rate limit do Gemini (free tier):** manter os nós `Wait`/`Wait1` (2 min) entre iterações; não removê-los.
- **Não ativar** o workflow nem alterar `active`. Claude decide ativação com o dono.
- IDs de planilha, aba, stage HubSpot, actor Apify e Data Table são os da §3 — não trocar.

---

## 6. WORKFLOWS IRMÃOS DA PROSPECÇÃO (considere para não conflitar)
Este wf faz parte de um conjunto. Ao corrigir, **não crie comportamento que conflite** com estes:

| Workflow | ID | Relação |
|---|---|---|
| GBP Scoring - L2 Discovery (Pipeline A) | `5j79f7oR8x1Nxs4q` | **Disparado no fim** deste wf (item 7). |
| GBP Scoring - L3 Enriquecimento (Pipeline B / C2) | `EFD7Drr0LDMqfDXw` | Enriquecimento profundo posterior. |
| Enriquecimento Site L4 | `5L3SyzDkZqf1N6vW` | **Padrão de enriquecimento** Gemini + Google Search grounding (referência p/ §4.4). |
| Comercial - Deduplicar Leads HubSpot | `izimrLm19H4i6LOq` | Deduplica deals em "Prospectado" — cuidado com duplicatas que este wf cria. |
| Comercial - Sync HubSpot → Planilha (loop de aprendizado) | `WRFU2NM8rLJU7bRT` | **Também sincroniza HubSpot→planilha** — verifique sobreposição com o item 1 para não gravar em conflito. |

> **Claude pode exportar o JSON de qualquer um destes para `workflows/` se você precisar ler** — peça no seu bloco de resposta (ex.: "preciso do JSON de `WRFU2NM8rLJU7bRT` e `5j79f7oR8x1Nxs4q`").

---

## 7. COMO VALIDAR (você, antes de responder)
1. **JSON bem-formado** (`jq . workflows/hubspot-status-extracao.json` sem erro).
2. **Referências intactas:** todo `$('Nome')` referencia um nó existente; toda conexão em `connections` aponta para nós existentes.
3. **Cobertura:** cada um dos 7 comportamentos endereçado; cada um dos 12 bugs tratado ou justificado.
4. **Sem tocar no n8n vivo.** A validação/execução real é do Claude no aceite.

---

## 8. FORMATO EXATO DA SUA RESPOSTA (anexe ao FINAL deste arquivo)

```
## RESPOSTA DO EXECUTOR — Tentativa <N> — <seu modelo>
STATUS: CONCLUÍDO            (ou: BLOQUEIO)

### Resumo
<2-4 linhas do que você fez>

### CHANGELOG (por nó)
- <Nome do nó>: <o que mudou — param/expressão exata, antes → depois>
- ...

### Comportamentos endereçados
[1] <como> · [2] <como> · [3] <como> · [4] <como> · [5] <como> · [6] <como> · [7] <como>

### Bugs tratados
1..12: <ok / como / justificativa se não tratado>

### Validações feitas
<jq ok, referências ok, etc.>

### Dúvidas / decisões assumidas
<qualquer suposição que fez>

### BLOQUEIO (só se STATUS: BLOQUEIO)
<o impasse, por que arrisca contrariar o papel, e o que precisa do dono>

=> AGUARDO ANÁLISE DO CLAUDE
```

---

## 9. O QUE ACONTECE DEPOIS (papel do Claude)
- Claude monitora este arquivo (via git). Ao ver sua resposta, **lê o JSON corrigido**, confere contra §1/§4, considerando os wfs irmãos (§6), e anexa `## REVISÃO DO CLAUDE — Tentativa <N>` com veredito **APROVADO** / **AJUSTES NECESSÁRIOS** / **ESCALADO AO DONO**.
- Se **AJUSTES**: você lê a revisão, corrige o JSON, e responde de novo (próxima tentativa).
- Se **APROVADO**: Claude aplica o diff no n8n vivo via `update_workflow`, roda **execução de teste real**, e só então reporta o resultado ao dono. Você não sobe nada.
- **Limite: 3 tentativas.** Depois, Claude escala ao dono.

---
<!-- ↓↓↓ EXECUTOR: escreva sua resposta abaixo desta linha ↓↓↓ -->
