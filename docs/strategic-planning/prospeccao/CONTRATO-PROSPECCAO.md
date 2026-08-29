# CONTRATO DA FRENTE PROSPECÇÃO — documento canônico

> **Status:** proposta para aprovação · **Data:** 2026-08-28 · **Autoridade:** este documento
> **Escopo:** quem grava o quê na planilha `leads` e no HubSpot, e o que não pode mudar sem ADR.
>
> **Regra de precedência:** divergência entre este contrato e um workflow é **bug do workflow**.
> Divergência entre este contrato e a planilha real é **bug do contrato** — corrigir aqui primeiro.

---

## 0. Por que este documento existe

Hoje não é possível responder **quem grava, quem apaga e quem some com registro**. Nas últimas 48h,
com o sistema em produção, encontramos:

| Achado | Consequência |
|---|---|
| `Site L4` gravava `"="` em `enriquecimento` e `site_tipo` | Apagava coluna de outro dono |
| `1º Enriquecimento` com `executeOnce` dentro do loop | Só o 1º lead do lote recebia `id_hubspot` |
| Linhas criadas só com `place_id` | Gemini recusava, a recusa marcava a linha como pronta **para sempre** |
| Deduplicador filtra por `dealstage` sem pedir `dealstage` | **Nunca encontrou uma duplicata** |
| 3 intakes idênticos ativos ao mesmo tempo | Disparo duplicado |
| 4 nós fazendo `appendOrUpdate` sem garantir a chave | Risco de linha órfã em 4 lugares |

Nenhum desses é um bug difícil. **Todos são consequência de não haver dono declarado por coluna.**

---

## 1. Princípio único

> **Uma coluna, um dono.**
> Cada coluna da aba `leads` tem exatamente **um** workflow autorizado a escrevê-la.
> Todos os outros podem ler; nenhum outro pode escrever — nem para "limpar", nem para "atualizar".

Tudo neste documento decorre disso.

---

## 2. Arquitetura alvo — 7 workflows

```
[P1 Intake]  nicho + região
     │
[P2 Descoberta]  Places API  ──▶ chave · identidade · feature(GBP) · controle
     │
[P3 Scoring]  motor de regras ──▶ scoring
     │
     ├──▶ [P5 CRM-out]  cria deal ──▶ id_hubspot
     │
[P4 Enriquecimento]  Apify + IA ──▶ enriquecimento · analise_gbp_ia   (só fila ≥ corte)
     │
[P6 Aprendizado]  HubSpot → planilha ──▶ as 17 colunas de aprendizado
     │
[P7 Zeladoria]  guarda-schema · backup diário · dedup
```

| # | Workflow | Papel — uma frase | Base atual |
|---|---|---|---|
| **P1** | Intake | Recebe nicho + região e dispara P2. **Não escreve na planilha.** | `Intake - Telegram API` (`kmsaomlIzj48YnCL`) — **decidido D2** |
| **P2** | Descoberta | Única fonte de identidade e métricas do GBP. Escreve a linha nova. | `L2b (Places API)` |
| **P3** | Scoring | Motor determinístico. Único a escrever score, dimensões e oferta. | motor de regras do `L2` |
| **P4** | Enriquecimento | Apify + IA nos leads acima do corte. Escreve só texto de enriquecimento. | `L3` |
| **P5** | CRM-out | Cria/atualiza o **DEAL** e grava `id_hubspot`. **Único a escrever no HubSpot.** Não cria Company — ver D1 | `5VRPLUB3` + parte do `1º Enriquecimento` |
| **P6** | Aprendizado | Lê o HubSpot, escreve as 17 colunas de aprendizado. **Nunca altera o CRM.** | `WRFU2NM8rLJU7bRT` ✅ já correto |
| **P7** | Zeladoria | Guarda-schema, backup diário, dedup. Não escreve dado de lead. | `vUI0pPlDASf64Htn` + `izimrLm19H4i6LOq` |

**Tudo o que não estiver nesta lista é arquivado.**

---

## 3. Matriz de propriedade — as 63 colunas

| Bloco | Colunas | **Dono** | Momento |
|---|---|---|---|
| **chave** | `id` (place_id) | **P2** | criação da linha |
| | `id_hubspot` | **P5** | após criar o deal |
| **identidade** (9) | `nome`, `contato`, `Cidade`, `Estado`, `Bairro`, `CEP`, `Endereço`, `Rua/Avenida` | **P2** | criação |
| | `e-mail` | **P4** | extraído do site |
| **feature** (16) | `setor`, `site`, `Categoria 1/2`, `Searchstring`, `Posição Pesquisa`, `Quantidade reviews`, `Avaliação`, `Quantidade fotos`, `Horário` | **P2** | criação |
| | `Patrocinado`, `Atributos`, `Agendamento`, `Posts` | **P4** | só Apify observa |
| | `enriquecimento`, `enriquecimento_site` | **P4** | após o agente |
| **controle** (2) | `data extração`, `mês extração` | **P2** | criação |
| **scoring** (16) | `score_tecnico`, `ipc`, `potencial_comercial`, `oferta_recomendada`, 6 × `dim_*`, `site_tipo`, `flags_score`, `data_processamento_score`, `score_gbp` | **P3** | após P2 |
| | `nao_reivindicado` | **P4** | só Apify observa |
| | `analise_gbp_ia` | **P4** | após o agente |
| **aprendizado** (17) | `status hubspot` *(estágio — D4)*, `hubspot_status`, `motivo_perda`, `motivo_ganho`, `valor`, `via_aquisicao`, `num_interacoes`, `ultimo_contato`, `data_criacao_deal`, `data_fechamento`, `dias_no_funil`, `probabilidade`, `nba_recomendada`, `nba_aceite`, `abordagem_ia`, `acerto_previsao`, `data_sync_hubspot` | **P6** | a cada 6h |
| **descontinuada** | `hubspot_estagio` | — | **D4:** ninguém escreve. O estágio vive em `status hubspot` |

### Colunas com conflito ativo hoje

| Coluna | Quem escreve hoje | Quem deve escrever |
|---|---|---|
| `enriquecimento` | `1º Enriquecimento` **e** `Site L4` (com `"="`) | **P4**, só |
| `site_tipo` | motor **e** `Site L4` (com `"="`) | **P3**, só |
| `status hubspot`, `hubspot_status` | `1º Enriquecimento`, `kED2` **e** R3 | **P6**, só |
| `id_hubspot` | `1º Enriquecimento`, `Update id_deal`, `kED2` | **P5**, só |

---

## 4. Invariantes — não mudam sem ADR

| # | Invariante | Por que |
|---|---|---|
| **I1** | Uma coluna, um dono | É o que torna "quem apagou?" respondível |
| **I2** | **Nunca `appendOrUpdate`** em escrita por chave. Só `update`. Append só na criação da linha, e só por P2 | Foi a origem do risco de linha órfã em 4 nós |
| **I3** | Campo **não observado** grava **vazio** — nunca `0`, `false` ou `"="` | Espelha o guardrail BLOCO COMUM (`source_status error/missing ⇒ N/D, não 0`). `false` afirma um fato |
| **I4** | Dedup por `place_id`. Junção planilha↔CRM por `id_hubspot`. **Nome nunca é chave** | Nome é texto livre; foi o que quebrou o dedup e o `Search deal` |
| **I5** | **Todos** os leads descobertos vão à planilha e ao CRM. O corte governa gasto de Apify/IA, não entrada | Filtrar a entrada torna o score irrefutável (viés de seleção). Decisão Olavo 2026-08-27 |
| **I6** | **Nenhum gasto de LLM antes de validar identidade mínima** (`nome` não vazio E (`site` OU `Categoria 1`)) | Gastamos Gemini para produzir recusas que marcavam o lead como pronto |
| **I7** | Score é **fato**. Quem não é P3 não recalcula nem sobrescreve | ADR-003 |
| **I8** | P6 **só lê** o HubSpot. P5 é o único que escreve no CRM | Evita duas fontes alterando o mesmo deal |
| **I9** | O `Potencial Comercial` roteia oferta, **não** gateia abordagem: `max(gap, prontidão) × viabilidade` | Decisão Olavo 2026-07-10 — perfil forte vira lead de ADS, não é descartado |
| **I10** | Todo workflow ativo tem descrição **fiel**. Descrição copiada é bug | 3 workflows hoje têm descrição de outro |
| **I11** | O lead é sempre um **DEAL**. `Company` só é criada quando o lead **vira cliente**, por processo de pós-venda — nunca pela Prospecção | Decisão Olavo 2026-08-28 (D1). Evita 353 companies órfãs no CRM |

---

## 5. Regras de escrita

1. **Antes de escrever por chave, garanta que a chave existe.** Sem correspondência → desviar o
   item, nunca criar linha.
2. **Escreva apenas as colunas que você possui.** Não inclua colunas alheias no mapeamento "para
   não perder o valor" — ler e reescrever é a forma mais comum de apagar.
3. **Nunca use expressão vazia** (`"="`) como valor. Se não há o que gravar, omita a coluna.
4. **`executeOnce` é proibido em nó dentro de loop** que grava dado por item.
5. **Ao pedir dados de uma API, peça todos os campos que o código usa.** O dedup filtra por
   `dealstage` sem pedir `dealstage`.
6. **Toda escrita em produção carimba a data**: `data_processamento_score`, `data_sync_hubspot`,
   `data extração`. Sem carimbo não há como auditar.

---

## 6. Plano de migração

### Fase 0 — Estancar (nada é construído)

| # | Ação | Estado |
|---|---|---|
| 0.1 | Desativar `Site L4` | ✅ feito |
| 0.2 | Remover `executeOnce` do `1º Enriquecimento` | ✅ feito |
| 0.3 | Reduzir a 1 intake | ✅ feito |
| 0.4 | R3: `update` em vez de `appendOrUpdate` | ✅ feito |
| 0.5 | Guard I6 no IF do `1º Enriquecimento` | ⬜ |
| 0.6 | Limpar `enriquecimento` nas linhas com a recusa do Gemini | ⬜ (depois de 0.5) |
| 0.7 | Corrigir o deduplicador (pedir `dealstage`/`createdate`, chave por `place_id`) | ⬜ |
| 0.8 | Arquivar os 8 workflows mortos | ⏳ agendado |

### Fase 1 — Consolidar (sem funcionalidade nova)

| # | Ação |
|---|---|
| 1.1 | Extrair **P5** do `1º Enriquecimento` + `5VRPLUB3` — único dono do CRM e do `id_hubspot` |
| 1.2 | Reduzir o `1º Enriquecimento` a **P4**: enriquece e escreve só o que é dele |
| 1.3 | Remover do `1º Enriquecimento` a escrita de `hubspot_status`/`hubspot_estagio` (é de P6) |
| 1.4 | Desmembrar/arquivar o `kED2` (48 nós, 7 funções) |
| 1.5 | Backfill do `id_hubspot` nos 64 leads sem chave |

### Fase 2 — Migrar a descoberta

| # | Ação |
|---|---|
| 2.1 | Validar `L2b` (Places API) contra o `L2` na mesma busca — plano de 6 testes já escrito |
| 2.2 | Promover `L2b` a **P2**; `L2` vira fonte só do que a Places não observa, dentro de P4 |
| 2.3 | Aplicar I3 aos 4 campos ausentes da Places (`nao_reivindicado` etc.) |

### Fase 3 — Melhorar o modelo

| # | Ação |
|---|---|
| 3.1 | `fit × oportunidade` com rank percentil (testado: 18 valores distintos em 20) |
| 3.2 | Eixo Intent retroativo sobre os backups diários |
| 3.3 | `origem_fila` (`topo`/`exploracao`) + amostra de exploração de 10–15% |

### Fase 4 — Só quando houver dado

`EV`, `CLV` e modelo preditivo. Bloqueados por **ticket por serviço** (não definido) e **rótulo**
(0 `closedlost` no CRM). Não construir antes.

---

## 7. O que a proposta do GBP contribui — e onde entra

| Contribuição | Onde |
|---|---|
| E-mail e redes sociais do site | **P4** — a coluna `e-mail` existe e está vazia |
| Dedup por telefone e domínio | **P7** — hoje o dedup casa por nome, que é o pior critério |
| Tier de esforço Hot/Warm/Cold | **P3** — complementa o roteamento por oferta: *o que vender* × *quanto investir* |
| Formulário de entrada | **P1** |

Não adotados, com motivo: `TotalScore` aditivo (satura), `priority` com `EV_norm` (pode ficar
negativo e inverter o sinal), Intent multiplicativo (zera prospecção fria), filtrar entrada do CRM
(viola I5).

---

## 8. Decisões — Olavo, 2026-08-28

| # | Decisão | Consequência no contrato |
|---|---|---|
| **D1** | ✅ **O lead continua sendo só DEAL.** Company é criada **apenas quando o lead vira cliente** | P5 cria e atualiza apenas `DEAL`. A criação de Company passa a ser evento de **pós-venda**, fora do escopo da Prospecção. Simplifica P5 e evita a migração |
| **D2** | ✅ **Telegram.** P1 = `Intake - Telegram API` (`kmsaomlIzj48YnCL`) | Os outros 3 intakes vão para a lista de arquivamento |
| **D3** | ✅ **Não tratar o passivo agora.** Corrigir o deduplicador e observar se ele resolve | O passivo de duplicatas fica conhecido só depois da 1ª execução real. Rodar em `DRY_RUN = true` primeiro e conferir o relatório antes de deixar arquivar |
| **D4** | ✅ **Manter `status hubspot`; descartar `hubspot_estagio`** | Fica **uma** coluna de estágio, e o dono passa a ser **P6** — ver §8.1 |

### 8.1 D4 — como fica

Decisão do Olavo, contrária à minha recomendação (eu sugeria o inverso). O critério dele prevalece:
a coluna que **já existe e é lida** é `status hubspot`; criar dependência de uma coluna nova só
para renomear a mesma informação não agrega.

**O que muda:**

| Coluna | Antes | Agora |
|---|---|---|
| `status hubspot` | escrita por `1º Enriquecimento` (fixo `"Prospectado"`) e `kED2` | **dono: P6.** Recebe o estágio real do CRM a cada 6h |
| `hubspot_estagio` | escrita por P6 | **descontinuada.** Ninguém escreve; conteúdo histórico permanece |

O ganho da coluna nova não se perde: o que valia não era o nome, era **ter um dono só e ser
atualizada de verdade**. Isso passa para a `status hubspot`.

**Ação concreta:** no P6 (`WRFU2NM8rLJU7bRT`), o mapeamento `hubspot_estagio` vira `status hubspot`.
E o `1º Enriquecimento` deixa de gravar `status hubspot` (I1) — hoje ele grava `"Prospectado"` fixo,
o que reintroduziria a divergência.

> ⚠️ **Não confundir com `hubspot_status`.** São colunas diferentes:
>
> | Coluna | Conteúdo | Situação |
> |---|---|---|
> | `status hubspot` | o **estágio** do funil: `Prospectado`, `Reunião Agendada`, `Contrato Enviado`… | **mantida**, dono P6 |
> | `hubspot_status` | o **desfecho**: `Aberto` / `Vencido` / `Perdido` | **mantida** — é o rótulo mestre do aprendizado e alimenta `acerto_previsao` |
> | `hubspot_estagio` | duplicava o estágio | **descontinuada** |
>
> A decisão D4 remove apenas a terceira. Remover `hubspot_status` quebraria o cálculo de
> `acerto_previsao` e a variável-alvo do modelo.

---

*Uma coluna, um dono. Sem isso, toda descoberta obriga a reentender o conjunto inteiro.*

---

## 9. O parque final — nomes, ordem e o que muda em cada um

### 9.1 Convenção de nome

`PROSP-NN Nome curto` — o prefixo numérico ordena a lista do n8n na ordem do fluxo. Hoje os nomes
não têm padrão (`L2`, `L2b`, `1º Enriquecimento`, `kED2`) e a ordem alfabética não diz nada.

### 9.2 Os 8 workflows

| # | Nome novo | Base atual | Papel |
|---|---|---|---|
| 01 | `PROSP-01 Intake (Telegram)` | `Intake - Telegram API` `kmsaomlIzj48YnCL` | Recebe nicho + região, dispara o 02 |
| 02 | `PROSP-02 Descoberta (Places API)` | `L2b Discovery` `n7Z0xwi1dCDioln1` | Busca, normaliza, cria a linha |
| 03 | `PROSP-03 Scoring (motor de regras)` | motor extraído do `L2` | Calcula score, dimensões e oferta |
| 04 | `PROSP-04 Enriquecimento` | `L3` `EFD7Drr0LDMqfDXw` | Apify + IA nos leads acima do corte |
| 05 | `PROSP-05 CRM-out (deal + id)` | construído do zero `94lSWJfxfu653KdN` | Cria/reusa o deal, grava `id_hubspot` |
| 06 | `PROSP-06 Aprendizado (HubSpot→planilha)` | `WRFU2NM8rLJU7bRT` | Traz o desfecho de volta |
| 07 | `PROSP-07 Zeladoria (schema + backup)` | `vUI0pPlDASf64Htn` | Guarda-schema e backup diário |
| 08 | `PROSP-08 Dedup CRM` | `izimrLm19H4i6LOq` | Remove deals duplicados |

**19 → 8.** As 7 funções da §2 viram 8 workflows porque a Zeladoria tem dois trabalhos distintos
(planilha e CRM), com cadências diferentes, e juntá-los não traz ganho.

### 9.3 Por que o 03 é sub-workflow e não um bloco dentro do 02

O scoring precisa rodar em **duas** situações: logo após a descoberta, e **sozinho**, quando a
fórmula mudar e for preciso repontuar a base sem redescobrir. Se ele viver dentro do 02, a
repontuação obriga a refazer a busca — gasto e risco de sobrescrever dado bom.

**Decisão:** `PROSP-03` é sub-workflow (`executeWorkflowTrigger`), chamado pelo 02 no fluxo normal e
executável isoladamente para recalibração.

---

### 9.4 O que muda em cada um

#### `PROSP-01 Intake (Telegram)` — 🔴 inspecionado 2026-08-28: **não é um intake**

`Intake - Telegram API` (`kmsaomlIzj48YnCL`, **ativo**) contém o pipeline inteiro:

```
Telegram → formulário → Apify Google Maps → dedup por placeId → normaliza
   → busca na planilha → salva lead → Gemini enriquece → cria deal → grava status
```

São **P1 + P2 + P4 + P5 num workflow só**. Ele escreve na planilha em **3 nós** e escreve no
HubSpot. E é ele que roda de verdade: o `L2 Discovery`, apesar de `active`, tem `triggerCount: 0`.

##### 🔴 É a origem dos leads envenenados — confirmado no código

```
Normalizar campos do lead  →  Buscar lead por place_id  →  If lead ja existe
                                                              └─(falso)→ Salvar lead bruto
```

`Salvar lead bruto na planilha` mapeia `={{ $json.nome }}`, `={{ $json.place_id }}` etc. — mas
seu `$json` vem do **`Buscar lead por place_id`**, não do `Normalizar campos do lead`. Para lead
**novo** o lookup não acha nada e (com `alwaysOutputData: true`) emite item vazio. **A linha é
gravada com os campos de identidade em branco.**

É exatamente o defeito 2 do brief do Codex, agora confirmado no nó. Fecha a cadeia da §7 do
panorama: linha sem identidade → Gemini recusa → recusa marca a linha como pronta para sempre.

##### 🔴 Duas referências a nós que não existem

| Nó | Referência | Existe? |
|---|---|---|
| `Criar deal no HubSpot` | `$('Salvar lead bruto na planilha1')` → `dealName` | ❌ o nó chama-se `…planilha`, sem o `1` |
| `Atualizar status prospectado na planilha` | `$('Atualizar lead enriquecido na planilha1')` → `id` | ❌ idem |

Consequências diretas:

- `dealName` fica indefinido → **deal criado sem nome** — os que o Olavo apagou à mão
- `id` fica indefinido no `appendOrUpdate` → não casa → **acrescenta linha** só com
  `status hubspot: "Prospectado"`

São sobras de cópia do `1º Enriquecimento`, que tem nós com sufixo `1`. Os dois workflows são
variantes um do outro.

##### Outros defeitos

| Defeito | Efeito |
|---|---|
| `Agente de Enriquecimento` sem guarda de identidade | Gasta Gemini em lead sem nome — **é aqui que o I6 tem de entrar** |
| Agente ligado em paralelo a `Atualizar lead` **e** `Criar deal` | O deal é criado mesmo se o enriquecimento falhar |
| `Calcular vagas disponiveis` só copia `total_leads` | O nome mente; não calcula vaga nenhuma |
| `Update row(s)` na Data Table com `filters: [{keyValue: "1"}]` sem `keyName` | Filtro malformado |
| Credencial Apify diferente da do `L2` (`Apify account gmail`) | Duas contas Apify em uso |

##### O que fazer

**Desmembrar**, não corrigir no lugar. Ele vira:

| Vai para | O quê |
|---|---|
| `PROSP-01` | Telegram trigger, formulário, parâmetros, mensagem de confirmação. **Parou de escrever no CRM em 2026-08-28**; ainda escreve na planilha |
| `PROSP-02` | Apify/Places, dedup, normalização, gravação da linha — com `$json` vindo do **Normalizar**, não do lookup |
| `PROSP-04` | Agente de enriquecimento **com o guard do I6** |
| `PROSP-05` | Criação do deal e `id_hubspot`, com as referências corrigidas |

##### ✅ Correções aplicadas 2026-08-28 (`activeVersionId f62f1f21`)

Autorizado pelo Olavo. O workflow segue ativo, mas só dispara por mensagem específica no Telegram.

| # | Correção | Efeito |
|---|---|---|
| 1 | `Salvar lead bruto na planilha` lê de **`Normalizar campos do lead`**, não do lookup | **Estanca a raiz** — linhas param de nascer sem identidade |
| 2 | `Criar deal no HubSpot` → `dealName` vem de `Normalizar` | Para de criar deal sem nome |
| 3 | `Atualizar status prospectado` grava **`id_hubspot`** com chave `place_id` | **Passa a fechar o elo planilha↔CRM**, que este workflow nunca fechava |
| 4 | 🔴 Removida a ligação direta `Agente → Criar deal` | O nó tinha **duas entradas** (direta e via `Atualizar lead enriquecido`) e **criava o deal duas vezes** |
| 5 | Guard do **I6** antes do agente | Não gasta Gemini sem `nome` e (`site` ou `categoria`) |
| 6 | Os 2 nós de atualização passam a `update` + `onError: continueRegularOutput` | I2 — nunca acrescentam linha |
| 7 | `Atualizar lead enriquecido` para de gravar `nome` | I1 — é coluna do P2 |

**O item 4 é o achado mais consequente:** explica os deals duplicados que o Olavo relatou. Não era
falha do deduplicador sozinho — este workflow **produzia** duplicatas na origem, dois deals por lead.
O deduplicador, quebrado, nunca as removeu.

O fluxo ficou linear:

```
Salvar lead bruto → [I6] guard ─(sim)→ Agente → Atualizar enriquecido → Criar deal → grava id_hubspot
                              └─(não)→ NoOp → volta ao loop
```

⚠️ **Isto estanca, não conclui.** O desmembramento em 01/02/04/05 continua pendente — o workflow
ainda acumula quatro papéis.

##### Defeitos conhecidos e **não** corrigidos

| Defeito | Por que ficou |
|---|---|
| `Endereço` recebe `rua_avenida`; `Rua/Avenida` nunca é escrita | Mapeamento errado, mas mexer exigiria alterar o schema do nó. Corrigir no P2 |
| `Calcular vagas disponiveis` só copia `total_leads` | Nome mente, comportamento é inofensivo |
| `Update row(s)` com `filters: [{keyValue: "1"}]` sem `keyName` | Filtro malformado na Data Table `Prospeccao` |
| Duas contas Apify em uso | Decisão de custo, não de código |
| Nada escreve `mês extração`, `Avaliação`, `Quantidade fotos`, `Horário` | Colunas do contrato que este workflow ignora — entram no P2 |

#### `PROSP-02 Descoberta (Places API)`

| Mudança | Motivo |
|---|---|
| Re-colar a chave da Places API na credencial | Funciona via curl, falha dentro do n8n |
| Remover a credencial residual `Evolution API Header Auth` do nó de busca | Sobra de cópia |
| Reativar os 2 nós desabilitados (`Upsert Planilha`, `Chamar L3`) | Foram desligados no smoke |
| **Extrair o bloco de scoring para o `PROSP-03`** | I1 — P2 não é dono das colunas de score |
| Gravar **vazio** em `nao_reivindicado`, `Patrocinado`, `Agendamento`, `Posts` | I3 — a Places não observa esses campos |
| Rodar os 6 testes de validação contra o L2 | Antes de aposentar o Apify na descoberta |
| Ser o **único** com `append` (criação de linha) | I2 |

#### `PROSP-03 Scoring` — ✅ **construído 2026-08-29** (`V0f80LU1ZH8PUtdc`)

Sub-workflow com dois gatilhos: `executeWorkflowTrigger` (chamado pelo P2) e manual (repontuação
da base sem redescobrir — a razão de ser sub-workflow, §9.3). Lê a aba `leads`, pontua e grava.

**Decisões do Olavo (2026-08-29):** PRIORIDADE grava em `potencial_comercial`, preservando o corte
60; criar `fit`, `oportunidade` e `modelo_versao`; `score_tecnico` e `dim_*` ficam vazias (I3) e o
`ipc` é **mantido** — não aposentado — para ser calculado quando o P4 povoar `Atributos`/`Posts`.

##### 🔴 Dois defeitos meus, pegos pelo dry run `33377`

**1. `new URL()` não funciona no sandbox do Code node.** O classificador de site fazia
`try { new URL(url) } catch { return 'none' }`. Toda URL caía no catch: **os 89 leads com site
saíram como `site_tipo: none`**, incluindo `http://www.orthodonticbrasil.com.br/`. Com todos em
`none`, o `gap` virava 1,0 para a base inteira e a oferta virava `SVC-SITE` para todo mundo —
o modelo teria trocado uma saturação por outra. Trocado por extração de host via regex.

⚠️ **O `L2b` tem exatamente o mesmo código** (`try { new URL(url) } ... catch { return 'none' }`).
A classificação de site dele está quebrada do mesmo jeito e precisa da mesma correção antes de
virar P2.

**2. Casamento de domínio por `indexOf`.** `host.indexOf('x.com') !== -1` casa `phoenix.com.br`.
Trocado por igualdade ou sufixo (`host === d || host.endsWith('.' + d)`).

##### ❌ O documento de modelagem está desatualizado num ponto

A última linha da modelagem estatística afirma: *"O código do L2b implementa este desenho"*.
**Não implementa.** O `[L2b] Scoring Fase 1` calcula `max(gap, prontidão) × viabilidade` com
termos aditivos e comparação contra a **média** — o modelo antigo. Não há eixo `fit`, não há
percentil, não há `100 · fit · oport`. Pela regra de precedência do próprio documento, isso é
bug do código. O P3 é a primeira implementação real do desenho.

##### O que o dry run revelou sobre a base

| Coluna que o modelo usa | Preenchimento |
|---|---|
| `Quantidade reviews` | 89/136 |
| `contato` | 87/136 |
| `site` | 89/136 |
| `Quantidade fotos` | 41/136 |
| **`Avaliação`** | **0/136** |
| **`Horário`** | **0/136** |

Duas das quatro entradas do modelo **nunca foram povoadas**. Consequências medidas:

- `qual` fica constante em 0,5 para todos ⇒ `fit ≤ 0,8` ⇒ **o teto da prioridade hoje é 80, não
  100**. O corte 60 se comporta como um corte 75 na escala pretendida.
- O termo de gap por horário nunca dispara. Por **I3** ele não dispara *como ausência* — vazio é
  `HORARIO_NAO_OBSERVADO`, não "não tem horário". Tratar o vazio como ausência daria +0,15 de gap
  a 136 leads por um fato que ninguém observou.

**Isso inverte uma dependência que eu havia assumido.** O P3 não destrava o P2 — é o P2 (Places
API) que precisa rodar para o P3 sair da meia-força, porque `Avaliação` e `Horário` só vêm de lá.

##### 47 linhas sem identidade

Das 136, **47 têm `id`, `score_tecnico`, `ipc`, `potencial_comercial` e as 6 `dim_*` preenchidas
— e mais nada.** Sem `nome`, sem `site`, sem `contato`, sem reviews. São os leads envenenados
(§7) com o score do motor antigo por cima: pontuação sem lead atrás.

O P3 **não pontua** essas linhas e as tira do benchmark de percentil — 47 linhas com 0 reviews
puxariam o percentil de todos os outros para cima. Elas voltam a ser pontuáveis quando o P2
reobservar a identidade. Os scores velhos delas ficam como estão; apagá-los é decisão do Olavo.

##### Distribuição — execução `33379`, 89 leads pontuados

| Critério (§7 da modelagem) | Exigido | Medido |
|---|---|---|
| Valores distintos | ≥ 15 | **53** |
| Empates no topo | ≤ 2 | **2** |
| Site próprio + porte alto fora do `SVC-ADS` | nenhum | **nenhum** |
| Fila com corte 60 | ~50% | 20/89 (**22%**) |

Os 22% não são o alvo de 50%, mas o alvo foi medido noutra base (20 dentistas de Curitiba) e com
`Avaliação` observada. Comparar as duas taxas só faz sentido depois que o P2 rodar.

##### ⬜ Falta para o P3 gravar

Três colunas não existem na aba `leads`: **`fit`, `oportunidade`, `modelo_versao`**. O nó de
escrita está com `handlingExtraData: ignoreIt`, então uma execução real hoje gravaria as outras
seis e **descartaria essas três em silêncio** — por isso o `dry_run` continua `true`.

---

#### `PROSP-03 Scoring` — plano original (referência)

| Mudança | Motivo |
|---|---|
| Extrair o motor de regras do `L2` para sub-workflow próprio | I1 e §9.3 |
| Trocar `max()` por `fit × oportunidade`, com rank percentil | Fase 3 — 18 valores distintos em 20, contra 6 |
| Aplicar piso `fit ≥ 0,05` | Nenhum lead sai da fila para sempre |
| Preservar `max(gap, prontidão)` **dentro** do eixo oportunidade | I9 |
| Corrigir ou aposentar o `ipc` | Máximo 23 numa escala 0–100 |
| Único a escrever `site_tipo` | Hoje o `Site L4` também escrevia |

#### `PROSP-04 Enriquecimento`

| Mudança | Motivo |
|---|---|
| **Adicionar o guard do I6** — só enriquece com `nome` E (`site` OU `Categoria 1`) | Impede novos leads envenenados |
| Absorver o enriquecimento do `1º Enriquecimento` | Uma função, um dono |
| Absorver a análise de site do `Site L4` — **sem** o `"="` | Regra de escrita 3 |
| **Adicionar extração de e-mail e redes sociais** do site | Contribuição da proposta GBP; a coluna `e-mail` está vazia |
| **Parar de gravar** `id_hubspot`, `status hubspot`, `site_tipo` | I1 — são de P5, P6 e P3 |
| Rodar só na fila `prioridade ≥ 60` | Governa o gasto de Apify/IA, não a entrada (I5) |

#### `PROSP-05 CRM-out` — ✅ **construído e ligado 2026-08-28** (`94lSWJfxfu653KdN`, publicado)

7 nós, sub-workflow. Recebe `place_id`, `nome`, `telefone`, `descricao`:

```
[P5] Entrada (sub-workflow) ─────────────┐
                                         ├→ [P5] Dados de entrada → Buscar deal por place_id → Deal ja existe?
[SMOKE] Trigger manual → Lead de teste ──┘                                                       ├─(sim)→ Reusar deal existente ─┐
                                                                                                 └─(nao)→ Criar deal → Novo ────┴→ Gravar id_hubspot
```

**Por que existe o nó `[P5] Dados de entrada`.** Os nós seguintes liam `$('[P5] Entrada')`, que
só existe quando o P5 é chamado como sub-workflow — pelo caminho manual essas referências
quebrariam. O `[P5] Dados de entrada` é o **ponto único de leitura das entradas**: as duas portas
desaguam nele e todas as referências apontam para ele. As duas conexões chegam na mesma entrada,
mas isso **não** repete a execução como no defeito do Intake: lá as duas pontas traziam dados de
verdade; aqui só uma das portas produz item por vez.

| Invariante | Como é cumprido |
|---|---|
| I8 — único a escrever no CRM | É o único com nó de criação de deal |
| I1 — único dono de `id_hubspot` | Grava a coluna; ninguém mais deve |
| I4 — dedup por `place_id` | A busca filtra por `place_id`, nunca por `dealname` |
| I11 — só DEAL | Não há nó de Company |
| I2 — nunca append | `operation: update`; se a linha não existir, não cria |

O deal criado passa a carregar `place_id` como propriedade — o que torna a próxima busca eficaz.

##### ✅ Backfill construído e executado 2026-08-28

`PROSP-BF Backfill place_id nos deals` (`nJOHONMffxiO6dxp`, 9 nós, manual). Lê a aba `leads`,
seleciona as linhas que têm `place_id` **e** `id_hubspot`, e grava o `place_id` no deal
correspondente. Loop de 1 em 1 com retry, `dry_run` e `limite` no nó `[BF] Config`.

**Dry run mediu — e o número corrige uma estimativa minha:**

```
linhas lidas na aba leads : 263
elegiveis (place_id + id_hubspot) :  88
sem place_id              : 127
sem id_hubspot            :  48
```

Eu havia estimado ~289 elegíveis a partir da exportação markdown do Drive. **O número real é 88.**
A estimativa anterior veio de uma fonte que já sabíamos ser não confiável (nomes com `|`, abas
concatenadas); esta veio do nó Google Sheets lendo a planilha ao vivo. Vale mais.

##### ✅ As 127 linhas sem `place_id`, explicadas

**Não são linhas em branco esperando novos leads.** Analisando as 263 linhas que a execução
`33144` leu da planilha:

| | |
|---|---|
| Linhas com `place_id` (leads reais) | 136 |
| Linhas órfãs | 127 (`row_number` 138 → 264, contíguas) |
| Delas totalmente vazias | **0** |

Todas as 127 têm exatamente as **mesmas 7 colunas** preenchidas, e só elas:

```
id_hubspot · hubspot_estagio · hubspot_status · data_criacao_deal
dias_no_funil · probabilidade · data_sync_hubspot
```

Sem `nome`, sem `contato`, sem `site`, sem `id`. **São exatamente as colunas do P6** — e todas
as 127 carregam o mesmo `data_sync_hubspot`: `2026-08-26T21:00:26`. Uma única execução do sync
escreveu as 127 de uma vez.

**Causa:** o P6 usava `appendOrUpdate` com chave `id_hubspot`. Em 26/08 o Intake criou um lote
de deals, e naquele momento quase nenhuma linha da planilha tinha `id_hubspot` — o Intake só
passou a gravar essa coluna depois da correção de 28/08. Sem encontrar linha para casar, o
`appendOrUpdate` **acrescentou uma linha nova por deal**. É a violação de **I2** em estado puro.

Já corrigido: o P6 passou a `update` (versão `a4c3f6f7`) e não consegue mais acrescentar linha.

**Os 127 deals não existem mais.** Consultei os 127 `id_hubspot` no HubSpot em dois lotes:
`total: 0` nos dois. Todos apontam para deals excluídos. São referências mortas — resíduo, não
espaço reservado.

Nenhum dos 127 `id_hubspot` coincide com alguma das 136 linhas completas, então apagá-las não
perde vínculo nenhum. Linhas genuinamente em branco abaixo da 264 não são afetadas: o nó do
Google Sheets nem as devolve.

##### ✅ Linhas órfãs apagadas 2026-08-29

`PROSP-LO Limpar linhas orfas do sync` (`K3nfaJhbzfPW41fC`, 9 nós, manual). Detecta a órfã por
**guarda tripla** — `id` (place_id) vazio **E** `id_hubspot` preenchido **E** `nome` vazio —,
agrupa os `row_number` em blocos contíguos e apaga **de baixo para cima**, porque apagar linha
desloca tudo o que está abaixo.

Dry run (`33360`):

```
total_linhas        : 263
linhas_com_place_id : 136
total_orfas         : 127
linhas_ignoradas    :   0
blocos              :   1   (inicio 138, fim 264)
```

Bloco único e nenhuma linha em estado ambíguo — uma única chamada de exclusão.

Execução real (`33362`): `success: true`.

Conferência (`33363`, de volta em dry run):

```
total_linhas        : 136
linhas_com_place_id : 136
total_orfas         :   0
```

A planilha ficou com exatamente os 136 leads reais. O `[LO] Config` voltou a `dry_run = true`,
o que também deixa o workflow utilizável como conferência recorrente: se ele voltar a achar
órfã, é sinal de que alguém reintroduziu `appendOrUpdate` em escrita por chave (**I2**).

##### ✅ Dependência fechada: backfill de `place_id` nos deals existentes

A propriedade `place_id` foi criada em 2026-08-28 (grupo *IA / Enriquecimento*). Os deals já
existentes tinham o campo vazio — e sem ele o P5 não encontraria o deal e criaria um segundo.

**Execução real `33144` (2026-08-28, 20:37–20:38, `status: success`):**

```
elegiveis                        : 88
deals com place_id apos o backfill: 86
```

Os **2 restantes não falharam por erro de escrita** — os `id_hubspot` `59548516267` e
`60039981326` (place_ids `ChIJt32NyfOtvZQR5atsNFCRhsY` e `ChIJ_aWOm5mzvZQRNo_g2GG2JPE`)
apontam para deals que **não existem mais** no HubSpot: uma busca por `hs_object_id IN (...)`
retorna `total: 0`. São referências órfãs deixadas na planilha pela exclusão manual de deals.

Isso não bloqueia nada: o P5 procura o deal por `place_id` **no HubSpot**, não pelo `id_hubspot`
da planilha. Para essas duas linhas ele simplesmente não vai achar nada, vai criar o deal e vai
sobrescrever o `id_hubspot` órfão. O elo se conserta sozinho na próxima passagem.

O `[BF] Config` foi devolvido a `dry_run = true` para impedir re-execução acidental.

**Ordem obrigatória — cumprida:**

| # | Passo | Estado |
|---|---|---|
| 1 | Backfill do `place_id` nos deals existentes | ✅ execução `33144` |
| 2 | Ligar o P5 no fluxo | ✅ versão `603c4147` do Intake |
| 3 | Arquivar a criação de deal do `Intake - Telegram API` | ✅ nós removidos |

##### ✅ Intake passou a delegar o CRM ao P5 (2026-08-28)

Foram **removidos** do `Intake - Telegram API` os nós `Criar deal no HubSpot` e
`Atualizar status prospectado na planilha`. No lugar entrou um único nó
`[P5] CRM-out` (`executeWorkflow`, `mode: each`, `waitForSubWorkflow: true`,
`onError: continueRegularOutput`, retry 2×):

```
Atualizar lead enriquecido → [P5] CRM-out → Wait → Loop Over Items
```

Entradas passadas ao P5: `place_id`, `nome` e `telefone` de `Normalizar campos do lead`;
`descricao` de `Agente de Enriquecimento`.

Com isso o Intake deixa de escrever no HubSpot (**I8**) e deixa de ser dono da coluna
`id_hubspot` (**I1**). O P5 precisou ser publicado antes — o n8n recusa publicar um workflow
que referencia sub-workflow não publicado.

O ramo `[I6] Sem identidade - nao enriquece` continua indo direto ao loop, sem CRM. Não é
exceção a **I5**: uma linha sem nome não é um lead, é um registro quebrado — e foi
exatamente o que produziu os deals sem nome que o Olavo apagou à mão.

##### ✅ Smoke executado 2026-08-28 (execução `33170`, `success`)

Foi acrescentado um `[SMOKE] Trigger manual` com um lead de teste escolhido de propósito: a
**Niti Odontologia** (`ChIJw97SGvGzvZQRtT6_JH7z7T0`), que **já tem** deal `60040868935` com
`place_id` gravado pelo backfill. Assim o teste exercita o ramo de **reuso** e não cria nada.

Percurso real, nó a nó:

| Nó | Resultado |
|---|---|
| `Buscar deal por place_id` | achou `60040868935` |
| `Deal ja existe?` | saída 0 com 1 item, **saída 1 vazia** — não foi para `Criar deal` |
| `Reusar deal existente` | `id_hubspot: "60040868935"`, `criado_agora: false` |
| `Gravar id_hubspot na planilha` | gravou na linha `id = ChIJw97SGvGzvZQRtT6_JH7z7T0` |

Confirmado depois no HubSpot: busca por esse `place_id` devolve **`total: 1`**. Nenhum deal
duplicado foi criado, e o `dealname` original ficou intacto — o nome do lead de teste não
sobrescreveu nada, porque o ramo de reuso não toca no deal.

**É a prova de que o defeito central da frente está fechado**: o P5 encontra o deal existente e
o reaproveita, em vez de criar um segundo como o Intake fazia.

##### O que ainda falta no P5

| Item | Nota |
|---|---|
| Smoke com lead real | ✅ execução `33170` — ver abaixo |
| Aviso de validação `resource: deal` | Falso positivo do validador; o nó idêntico roda em produção |

---

#### `PROSP-05` — plano original (referência)

| Mudança | Motivo |
|---|---|
| Promover a oficial e absorver a criação de deal do `1º Enriquecimento` | Único escritor do CRM (I8) |
| **Buscar deal por `place_id`, nunca por `dealname`** | I4 — a busca por nome é a origem das duplicatas |
| Único a gravar `id_hubspot`, **uma vez por lead** | I1 + regra 4 (nada de `executeOnce` em loop) |
| Criar apenas **DEAL**, nunca Company | I11 |
| Backfill dos 64 leads sem `id_hubspot` | Passivo atual |
| **Não** gravar `status hubspot` | I1 — é de P6 |

#### `PROSP-06 Aprendizado` — ✅ já conforme

| Mudança | Estado |
|---|---|
| `update` em vez de `appendOrUpdate` | ✅ feito |
| Estágio em `status hubspot` | ✅ feito (D4) |
| Renomear | ⬜ |
| Conferir na 1ª execução com deals que nenhuma linha nova aparece | ⬜ pendente de verificação |

#### `PROSP-07 Zeladoria` — ✅ conforme

Só renomear. Produz o backup diário que viabiliza o eixo Intent retroativo.

#### `PROSP-08 Dedup CRM` — ✅ consertado e medido 2026-08-28

O diagnóstico anterior estava **incompleto**. Pedir `dealstage` resolveu só metade: o nó HubSpot
`getAll` devolve o **formato v1**, em que cada propriedade é um **objeto** `{value, timestamp,
versions}` e o id do deal vem em `json.dealId`, não `json.id`.

```js
p.dealstage === STAGE      // objeto === string  →  SEMPRE falso
item.json.id               // sempre undefined
```

| Correção | Estado |
|---|---|
| Pedir `dealstage`, `createdate`, `telefone` em `properties` | ✅ |
| Helper `prop()` que aceita v1 e v3 | ✅ |
| `deal_id` de `dealId` com fallback para `id` | ✅ |
| Chave: telefone normalizado (10 últimos dígitos) → nome **completo** normalizado | ✅ |
| Faixa de acentos corrigida; `slice(0,3)` removido | ✅ |
| `DRY_RUN = true` | ✅ |
| 🔴 **SyntaxError nos 2 nós de relatório** — quebra de linha literal dentro de string | ✅ |

O último é grave e era invisível: `linhas.join('` + quebra de linha real + `')`. O workflow
**morria antes de enviar o relatório**. Mesmo que tivesse achado duplicatas, o Telegram nunca
receberia nada. Dois bugs independentes garantiam silêncio total.

##### O passivo, medido — e depois medido de novo

Primeira medição (2026-08-28, `DRY_RUN`):

```
deals lidos         : 101
em Prospectado      :  98   (antes: 0)
grupos com duplicata:   4
deals a arquivar    :   8
```

Segunda medição, execução `33177`, algumas horas depois:

```
deals lidos         :  93
em Prospectado      :  90
grupos com duplicata:   1
```

O portal tem **8 deals a menos**. Dos 4 grupos, sobrou **1** — exatamente o ambíguo. Os grupos
inequívocos (Mariana Aguiar, Dentz, Fabrício Correa) foram removidos à mão entre as duas
medições, mesmo padrão de intervenção manual já registrado na §7.

##### ❌ Correção: não havia truncamento de paginação

Eu havia registrado que *"só 101 dos ~141 deals foram lidos; o `getAll` parece truncar a
paginação"*. **Está errado e o número ~141 não tinha fonte.** A API devolve `total: 93` para
todos os deals do portal, e a execução `33177` leu exatamente 93. O `returnAll: true` lê tudo.

##### ✅ O grupo ambíguo resolvido: são dois negócios, não uma duplicata

| | `60167122736` | `60050259305` |
|---|---|---|
| Nome | Dentista 24 horas Rio Preto Dr. Rodrigo Belmonte | ODONTOLOGIA 24 HORAS - RIO PRETO |
| Telefone | +55 17 98161-3934 | +55 17 98161-3934 |
| Endereço | R. Raul de Carvalho, 2244 – sala 3 | R. Adibo Bassitt, 790 |
| Site | `sites.google.com/view/dentist24hrp` | `sites.google.com/view/dentista24hriopreto` |
| Instagram | `@dentista24hrp` (~1.300) | `@odontologia24h_riopreto` (~1.900) |
| `place_id` | `ChIJf0GTCguzvZQRH6HrbkuQWRs` | `ChIJ6_xUXSBNvJQRqT7XC3oV9Kk` |

Telefone igual, **todo o resto diferente**. Duas fichas distintas no Google Business.
Arquivar uma delas apagaria um lead real.

##### ✅ `place_id` vira a autoridade do dedup (execução `33211`)

Telefone e nome continuam sendo a chave de **recall** — é o que agrupa candidatos. O `place_id`
entra como **veto**: dentro de um grupo, `place_id`s distintos significam leads distintos, o
grupo é marcado **ambíguo** e nada é arquivado dele. Dentro de um mesmo `place_id` a duplicata
continua sendo tratada normalmente.

É a leitura correta de **I4**. A regra não podia ser aplicada antes porque nenhum deal tinha
`place_id` — só o backfill de hoje tornou o campo utilizável.

Resultado da execução `33211`:

```
duplicatas a arquivar : 0
grupos ambiguos       : 1   (tel:7981613934, corretamente barrado)
```

##### ✅ Arquivamento parou de destruir o enriquecimento

O nó `[ComAb] Arquivar Deal HubSpot` sobrescrevia a propriedade `description` com um carimbo
de auditoria. Essa propriedade guarda **a análise do agente de enriquecimento** — sobrescrever
apagava esse dado de forma irrecuperável, num workflow cujo papel é limpeza, não escrita de
conteúdo. Removido: agora ele só muda o estágio para `closedlost`, que é reversível. O rastro
do arquivamento fica no relatório do Telegram e no log de execução.

##### ✅ Fora do `DRY_RUN` (versão `5b2a55fe`)

A conferência exigida pela decisão **D3** foi feita. `DRY_RUN = false`, publicado, e executado
uma vez em modo real (`33213`): seguiu o ramo de execução e produziu **0 itens para arquivar**,
como esperado. O IF de saída passou a considerar `duplicatas + ambíguos`, para que o relatório
não se perca quando não há nada a arquivar mas há algo a revisar.

**Confirma a causa dos duplicados:** 3 dos 4 grupos originais eram o **mesmo lead criado 2–4
vezes** — o padrão que a ligação dupla do `Criar deal` (§9.4, correção 4) produzia e que o P5
agora impede.

---

### 9.5 Os 11 que saem

| Arquivar | Motivo |
|---|---|
| `WPP Intake - Evolution API` · `WPP Intake copy 2` · `Intake - db's apify` | D2 escolheu Telegram |
| `L2 Discovery (Pipeline A)` | Substituído pelo 02 — **só depois** dos 6 testes |
| `L2 Discovery (ignora id hubspot)` · `L1 Core Engine (teste)` | Fork e teste |
| `Automate Scrape Google Maps` · `Apify vide II` · `SCRATCH reviews` | Legado e template |
| `Enriquecimento Site L4` | Absorvido pelo 04 |
| `1º Enriquecimento` | Desmembrado em 04 e 05 |
| `HubSpot - Atualizar status e disparar extracao` (`kED2`, 48 nós) | Desmembrado; a parte de status morre (o 06 já faz melhor) |

⚠️ **Ordem obrigatória:** o `1º Enriquecimento` e o `L2` só são arquivados **depois** que o 04, o 05
e o 02 estiverem rodando. Hoje o `1º Enriquecimento` é o único que cria deals.
