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
| **reaproveitada** | `redes_sociais` (coluna AR, antiga `hubspot_estagio`) | **P4** | perfis achados pelo Apify — ver D5 |

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

#### `PROSP-02 Descoberta (Places API)` — ✅ **reestruturado 2026-08-29** (`n7Z0xwi1dCDioln1`)

O `L2b Discovery` virou `PROSP-02 Descoberta (Places API)`, publicado (`0b40a434`).

| Mudança do plano | Estado |
|---|---|
| Remover a credencial residual `Evolution API Header Auth` do nó de busca | ✅ |
| **Extrair o bloco de scoring para o `PROSP-03`** | ✅ nó removido; P2 chama o P3 |
| Gravar **vazio** em `nao_reivindicado`, `Patrocinado`, `Agendamento`, `Posts` | ✅ já estava certo |
| Reativar os nós desabilitados | ✅ upsert religado |
| Ser o **único** com `append` | ✅ `appendOrUpdate` por `id`, a exceção legítima de **I2** |
| Re-colar a chave da Places API | 🔴 **do Olavo** — ver abaixo |
| Rodar os 6 testes de validação contra o L2 | ⬜ depende da chave |

Fluxo depois da reestruturação:

```
[P2] Inicio manual ─┐
                    ├→ Set Parametros → Places Text Search → Separar Leads
[P2] Entrada ───────┘                                            │
                                                                 ▼
                              Chamar PROSP-03 ← Upsert Planilha ← Normalizar
```

**O que saiu, e por quê.** Removi o nó de scoring, o IF de fila e a chamada ao L3:

- score, dimensões e oferta são colunas do **P3** (I1) — o P2 não é dono delas;
- a fila por `prioridade ≥ 60` é critério do **P4**, não da descoberta. Deixá-la aqui misturava
  "quem descobre" com "quanto gastamos com quem".

##### 🔴 O mesmo defeito do `new URL()` estava aqui

Como eu havia previsto ao construir o P3, o `classificarSite` do L2b tinha o mesmo código:
`try { new URL(url) } catch { return 'none' }`. A função não existe no sandbox do Code node, então
**toda URL caía no catch e todo lead sairia como `none`** — e como o L2b nunca rodou em produção,
o defeito nunca apareceu. Corrigido com extração de host por regex, igual ao P3. Corrigi também o
casamento de domínio, que usava `includes` e faria `phoenix.com.br` casar com `x.com`.

##### O que o smoke provou — execução `33451`

A execução falhou, e a falha é informativa. A requisição sai **bem formada**: o header
`X-Goog-Api-Key` é injetado pela credencial templated, o `X-Goog-FieldMask` e o corpo estão
corretos. A resposta foi:

```
400 API_KEY_INVALID — "API key not valid. Please pass a valid API key."
```

**Isso corrige o diagnóstico anterior.** O contrato registrava *"funciona via curl, falha dentro
do n8n"*, o que sugeria problema de como o n8n envia a chave. Não é: o mecanismo de injeção
funciona. O que está inválido é **o valor guardado na credencial** `Google Places API`
(`wTDtqdkU2IpqFVf8`).

Isso converge com a pendência de segurança já aberta: a chave foi exposta em texto claro e
precisa ser rotacionada de qualquer forma. **Uma ação resolve as duas:** gerar chave nova no
Google Cloud e colar na credencial.

##### Dois pontos menores registrados

- **`data extração` tinha dois formatos.** O normalizador escrevia ISO (`2026-08-29`) e as 89
  linhas existentes usam `dd/MM/yyyy`. Alinhado ao formato existente — trocar formato no meio de
  uma coluna é pior do que um formato ruim.
##### ✅ Negócio fechado permanentemente é descartado (decisão Olavo, 2026-08-29)

Eu havia deixado o lead com `businessStatus: CLOSED_PERMANENTLY` entrar na planilha, invocando
**I5**. **Estava errado.** O Olavo decidiu: descartar no próprio código, antes de virar linha.

I5 diz que todo *lead* descoberto entra — não que todo *registro retornado pela API* entra. Um
negócio permanentemente fechado não é um lead de baixa prioridade; **não é um lead.** Isso é
validade do registro, não filtro de score, e por isso não cria o viés de seleção que I5 existe
para impedir: nenhum desfecho comercial deixa de ser observado, porque não há desfecho possível.

Duas escolhas dentro dessa decisão:

- **`CLOSED_TEMPORARILY` continua entrando.** Um negócio temporariamente fechado ainda existe e
  ainda compra. Contado em `_fechados_temporariamente`.
- **O descarte não é silencioso.** `_descartados_fechados` traz a contagem e `_descartados_nomes`
  os nomes, no diagnóstico da execução. Exclusão invisível foi a origem de metade dos defeitos
  desta frente.

Se a busca não render nenhuma linha válida, o normalizador devolve vazio — o upsert e o P3
simplesmente não rodam, que é o comportamento correto, e o resumo fica no log.

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

##### ✅ Gravado — execução `33445` (2026-08-29)

O Olavo criou as três colunas (`fit` BL, `oportunidade` BM, `modelo_versao` BN). Antes de gravar,
conferi os cabeçalhos na leitura da execução `33444`: chegaram com os nomes exatos. A conferência
não era zelo excessivo — o nó de escrita está com `handlingExtraData: ignoreIt`, então um
cabeçalho com um caractere diferente seria **descartado em silêncio**, sem erro.

Execução real `33445`: sucesso. Conferência `33446`, de volta em `dry_run`:

```
_pontuados                : 89
_ja_gravados_nesta_versao : 89
_sem_identidade           : 47
```

**89 de 89** — nenhuma linha perdida. As 47 sem identidade seguem sem score novo, como projetado.
O contador `_ja_gravados_nesta_versao` ficou permanente: uma execução em `dry_run` agora serve de
conferência do que já foi gravado por versão de modelo.

##### 🔴 Corrigido: `flags_score` estava misturando dois assuntos

Apontado pelo Olavo em 2026-08-29. Eu havia colocado na `flags_score` dois tipos de informação:

| Tipo | Exemplos | Sobre o quê |
|---|---|---|
| Sinal comercial | `SEM_SITE`, `SITE_REDE`, `POUCAS_FOTOS`, `SEM_TELEFONE`, `VOLUME_FRACO` | **o lead** |
| Observabilidade | `AVALIACAO_NAO_OBSERVADA`, `HORARIO_NAO_OBSERVADO` | **o nosso dado** |

Como `Avaliação` e `Horário` estão em 0/136, as flags de observabilidade apareciam em **100% das
89 linhas**. Uma coluna constante não informa nada — e pior, escondia o sinal que importa: um lead
com site próprio e sem problema nenhum não recebe `SEM_SITE`, então só sobrava o ruído.

`flags_score` sempre foi sobre o lead — o motor antigo gravava `sem-site`, `site=rede`,
`não-reivind.`, `vol(N)`. Restaurado esse papel.

A observabilidade não se perdeu: virou `_sinais_nao_observados` e `_cobertura_sinais` (fração dos
4 sinais efetivamente observados), campos internos visíveis na execução e **não gravados** na
planilha. Hoje a cobertura é 0,25 ou 0,50 — nenhum lead tem os 4 sinais.

Regravado na execução `33448`. Amostra:

```
Clínica Padovani     POUCAS_FOTOS     cobertura 0,50
Clinica Guerra       SITE_REDE        cobertura 0,25
p9.digital           SEM_TELEFONE     cobertura 0,25
OrthoDontic          (vazio)          cobertura 0,25
```

**Lição:** uma coluna tem um assunto. Misturar diagnóstico do lead com diagnóstico do pipeline na
mesma célula é o mesmo erro de dono múltiplo que o **I1** existe para impedir — só que dentro de
uma coluna em vez de entre workflows.

⚠️ **O vocabulário de `site_tipo` mudou.** O motor antigo gravava `site`; o P3 grava `own`,
`social` ou `none` — o vocabulário do desenho e do L2b. Quem consumir essa coluna precisa saber:
`site` e `own` são o mesmo conceito, escritos por motores diferentes. Linhas ainda não repontuadas
podem carregar o valor antigo.

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

---

## `PROSP-04 Enriquecimento` — construído 2026-08-29 (`EFD7Drr0LDMqfDXw`, publicado)

Reconstruído em cima do `L3`, que já tinha o esqueleto certo mas fazia coisas que
hoje são de outros donos. 14 nós:

```
[P4] Entrada (sub-workflow) ─┐
[SMOKE] Trigger manual ──────┴→ [P4] Buscar leads → [P4] Fila → [P4] Tem lead na fila?
                                                                    │(sim)
                                                                    ▼
   ┌──────────────────────────────────────────── Loop Over Items ───┘
   │(loop)
   ▼
[P4] Apify deep-dive → [P4] Sinais do Apify → [P4] Agente de enriquecimento
   → [P4] Ler resposta do agente → [P4] Gravar enriquecimento → Wait ──┐
                                                                       │
   └───────────────────────────────────────────────────────────────────┘
```

### O que saiu do L3

| Nó removido | Por quê |
|---|---|
| `02+03+04 Motor de Regras` | O scoring é do **P3** desde 2026-08-29. Dois motores = dois números diferentes para a mesma coisa |
| `Montar Campos HubSpot` | Montava `score_tecnico`, `ipc`, as 6 `dim_*`, `site_tipo` e `flags_score` — todas do P3 (I1) |
| `Atualizar Deal (HubSpot)` | **I8:** só o P5 escreve no CRM |
| `Call 'Enriquecimento Site L4'` | Estava na saída 0 do `splitInBatches` (= *done*) e **sem saída** — disparava uma vez, no fim, e o resultado não ia a lugar nenhum. A análise de site nunca chegava à planilha por esse caminho |

O `Site L4` foi absorvido pelo agente único, **sem** o `"="` que ele gravava em
`enriquecimento` e `site_tipo`, e sem o `appendOrUpdate` (I2).

### A fila (`[P4] Fila`)

Guard do **I6** — só enriquece com `nome` **E** (`site` **OU** `Categoria 1`) — mais o
corte `potencial_comercial ≥ 60` e o descarte de quem já tem `analise_gbp_ia`.
A fila governa o **gasto** de Apify e IA; não governa a entrada de lead (I5).

**Por que o IF continua existindo.** Fila vazia devolve um item sem `id`, e o IF manda
esse item para o ramo falso: o loop não roda e o diagnóstico continua visível na
execução. Sem o IF, fila vazia seria uma execução muda.

### Dry-run 33517 — sem gastar Apify nem Gemini

O IF foi desligado do loop, a execução rodou até a fila e a conexão foi religada.

| | |
|---|---|
| `_total_lidos` | 136 |
| `_na_fila` | **14** |
| `_fora_sem_nome` | 47 |
| `_fora_sem_ancora_i6` | 0 |
| `_fora_sem_prioridade` | 0 |
| `_fora_abaixo_do_corte` | 47 |
| `_fora_ja_enriquecido` | 28 |

14 + 47 + 0 + 0 + 47 + 28 = **136**. A conta fecha — nenhum lead sumiu no caminho.

Os 47 sem nome são exatamente as 47 linhas sem identidade já registradas em §
`PROSP-03`. `_fora_sem_ancora_i6 = 0` diz que, entre os leads **com** nome, nenhum está
sem site e sem categoria: o I6 hoje não barra ninguém além do que a falta de nome já
barra. Ele é uma trava para o que vier, não uma peneira do que já existe.

### Decisões do Olavo (2026-08-29)

**Um agente só, não dois.** Uma chamada por lead devolve JSON com `analise_gbp`,
`analise_site` e `resumo_comercial`. Custa 1/3 do token de três chamadas e — o que
importa mais — o agente vê a ficha do Google e o site **juntos**. No desenho antigo o
`L3` lia a ficha e o `Site L4` lia o site, e nenhum dos dois enxergava o outro.

**Corte fica em 60.** Volta ao normal sozinho quando o P2 povoar `Avaliação` e
`Horário` e o teto da prioridade subir de 80 para 100. Não há número mágico para
corrigir depois.

### Se a resposta não vier em JSON

O `[P4] Ler resposta do agente` procura o primeiro `{` e o último `}`. Se ainda assim
não parsear, **a análise não é jogada fora**: o texto cru vai para `enriquecimento` e
`_resposta_em_json: false` fica na execução. Perder o trabalho do agente por causa de
uma cerca de código seria pior que gravá-lo no lugar aproximado.

### Colunas que o P4 escreve — e só

`e-mail`, `Patrocinado`, `Atributos`, `Agendamento`, `Posts`, `nao_reivindicado`,
`enriquecimento`, `enriquecimento_site`, `analise_gbp_ia`. Nove, todas dele na matriz
do §3. Não escreve `id_hubspot` (P5), `status hubspot` (P6) nem `site_tipo` (P3).

**Redes sociais não ganharam coluna.** O contrato pede extração de e-mail *e* redes; a
coluna `e-mail` existe, a de redes não. Em vez de inventar a 64ª coluna, os perfis
encontrados entram no fim do texto de `enriquecimento`, sob `Redes:`. Se virarem
critério de score, aí sim viram coluna.

### Apify — `scrapeContacts`

O `customBody` do L3 pedia só `scrapeSocialMediaProfiles: { instagrams: true }`. Sem
`scrapeContacts: true` o ator não devolve `emails`, e a coluna `e-mail` continuaria
vazia para sempre — o P4 escreveria vazio corretamente (I3) sobre um dado que ninguém
pediu. Corrigido junto com as demais redes.

### O que falta para o P4 rodar de verdade

O caminho do lead (Apify → agente → planilha) **ainda não foi executado** — isso gasta
Apify e Gemini nos 14 leads da fila e depende do OK de budget. A fila está provada; o
corpo do loop, não.

---

## D5 — `redes_sociais` reaproveita a coluna AR (2026-08-30)

**Decisão do Olavo:** as redes sociais encontradas pelo Apify ganham coluna própria, e essa
coluna é a **AR** — a antiga `hubspot_estagio`, que o **D4** havia declarado descontinuada
(ninguém escreve; o estágio vive em `status hubspot`).

Reaproveitar é melhor que criar a 64ª coluna: a planilha já tinha uma coluna morta ocupando
espaço e confundindo quem lê. O D4 não é revogado — `hubspot_estagio` continua não existindo
como conceito. A célula é que foi reciclada.

Isso muda o que eu tinha escrito na seção do `PROSP-04`. Lá dizia que os perfis entrariam no
fim do texto de `enriquecimento`, sob `Redes:`, "em vez de inventar a 64ª coluna". O raciocínio
estava certo quanto a não inventar coluna nova, e errado quanto à saída: havia uma coluna
disponível que eu não considerei. Agora `enriquecimento` carrega só o resumo comercial e
`redes_sociais` carrega os perfis — cada informação no seu lugar, pesquisável.

### Verificação — dry-run 33561

O header real da planilha foi lido antes de qualquer gravação, com o IF desligado do loop
(zero gasto de Apify e Gemini). A coluna AR volta como `redes_sociais`: o rename já estava
feito na planilha. Sem essa conferência, um header divergente produziria **gravação parcial
sem erro nenhum** — a falha silenciosa que já nos custou tempo antes.

### ⚠️ A coluna veio com o conteúdo antigo

O rename preservou os valores. Hoje a AR guarda os estágios do HubSpot sob o nome novo:

```
"redes_sociais": "Prospectado"
```

Ou seja: a coluna diz "redes sociais" e contém "Prospectado". O P4 corrige isso conforme
enriquece, mas **só nas linhas que passarem pela fila** — as demais seguem mentindo. Limpar a
coluna inteira antes do primeiro lote é o certo, e é ação destrutiva: aguarda o OK do Olavo.

### Dívida menor registrada

O esquema (`columns.schema`) do nó `[P4] Gravar enriquecimento` ainda lista `hubspot_estagio`
na posição 43. O esquema é metadado de interface — quem grava de fato é o `columns.value`, que
já diz `redes_sociais` — então **não afeta a execução**. A API do n8n recusa `setNodeParameter`
com índice dentro de array (`cannot descend into non-object at '/columns/schema'`), e trocar o
esquema inteiro por causa de uma entrada cosmética não se paga. Fica anotado para quem abrir o
nó e estranhar.

---

## Primeiro lote real do P4 (2026-08-30) — o que ele ensinou

O Olavo autorizou o lote. Ele rodou duas vezes e parou nas duas — nenhuma das duas
por defeito de lógica do fluxo.

| Execução | Onde parou | Causa |
|---|---|---|
| 33564 | lead 1 | Gemini `503 — high demand`. Corrigido com repetição automática (5 tentativas, 5 s) |
| 33566 | lead 5 | **Apify sem crédito**: `402 — exceeds your remaining usage of $0.213216` |

**4 de 14 gravados:** MundiDents, OdontoNeo, Oral Sin, OrthoDontic.

### Dois defeitos meus que só dado real revelou

**`Agendamento` gravou `[object Object]`** no Oral Sin e no OrthoDontic. O `bookingLinks`
do Apify é array de **objetos**, não de strings; o `String(obj)` produziu o literal. Agora
existe um `urlDe()` que extrai a URL de dentro do objeto.

**`redes_sociais` do OdontoNeo colheu 9 URLs `youtube.com/embed/`** — vídeo incorporado na
página, não canal da empresa. O regex era largo demais. Agora `/embed/`, `/watch` e `/share`
são descartados e repetições removidas.

Os dois têm a mesma forma: eu supus o formato do dado em vez de olhar. Nenhum apareceria
num dry-run com fila vazia — só com resposta real do Apify na mão.

### O `scrapeContacts` funcionou

A coluna `e-mail` estava vazia na base inteira. Voltou preenchida em 3 dos 4:
`odontoneoriopreto@gmail.com`, `sjriopreto@oralsin.com.br`, `sjriopreto@orthodonticbrasil.com.br`.

### A análise de site nunca funcionou — nem antes, nem comigo

O `chainLlm` **não navega**. Nunca teve acesso à internet. Absorvi a "análise de site" do
`Site L4` sem notar que lá ela também não funcionava: o relatório legado na planilha afirma
*"~13,5 mil seguidores (verificado em 20/05/2024)"* — número e data que o modelo não tinha
como saber. E o OrthoDontic, neste lote, recebeu *"A página **deve conter** informações
detalhadas sobre os serviços"* — especulação escrita com cara de observação.

Meu `enriquecimento_site` dizia "não foi observado", o que é honesto e melhor que inventar,
mas não é a função que o contrato pede.

**Decisão do Olavo (2026-08-30):** medir o site de verdade, incluindo velocidade, SEO e GEO.

### `[P4] Medir o site` — o agente para de adivinhar

Nó novo entre `[P4] Sinais do Apify` e o agente. Baixa o HTML e mede:

| Bloco | Campos |
|---|---|
| Velocidade | `resposta_ms`, `peso_kb`, `scripts_externos`, `css_externos` |
| SEO | `titulo` e tamanho, `meta_description_tamanho`, `h1_qtd`, `canonical`, `lang`, `imagens_sem_alt` |
| GEO | `schema_localbusiness`, `endereco_no_site`, `telefone_no_site`, `cidade_no_site` |
| Conversão | `formulario`, `whatsapp`, `viewport_mobile`, `https` |
| Mídia | `ga4`, `gtm`, `meta_pixel` — se o negócio já mede o que gasta |
| Contato | `mailto:` alimenta `e-mail`; links de rede completam `redes_sociais` |

Mais a **API PageSpeed Insights**: `psi_performance`, `psi_seo`, `psi_acessibilidade`,
`psi_lcp`, `psi_cls`, `psi_tbt`, `psi_fcp`, `psi_speed_index`, `psi_resposta_servidor`.

O prompt do agente foi reescrito para citar o número medido em cada afirmação. Ele não
navega e não pesquisa: tudo o que existe está no JSON.

### Verificação — workflow descartável, zero gasto de Apify e Gemini

Criado, usado e arquivado (`rJfKgCQBVKj1uz55`). Foi a decisão certa: **o desenho estava
errado de duas maneiras que nenhuma leitura de código pegaria.**

**Sonda 33579** — `$helpers is not defined`. O sandbox do Code node **não** expõe `$helpers`,
e também não tem `fetch`. Tem `this.helpers.httpRequest`. É a mesma armadilha do `new URL()`:
código plausível que morre em silêncio dentro do sandbox.

**Teste 33580** — a medição funciona, e achou mais dois problemas:

```
Zelo Odontologia · ok · 784 ms · 40 KB · https sim
titulo 64 · meta description 206 (teto 160) · h1 1 · canonical nao
13 imagens, 0 sem alt · schema LocalBusiness NAO
formulario nao · whatsapp sim · GA4 nao · GTM nao · Meta Pixel NAO
```

O bloco de mídia é argumento comercial direto, e é **fato medido**, não opinião.

1. **`cidade_no_site: nao`** — mas o título do site diz "São José do Rio Preto". A planilha
   guarda sem acento e o site escreve com. Falso negativo por acento. Agora os dois lados
   passam por `normalize('NFD')` antes de comparar.
2. **PageSpeed devolveu `429`.** Sem chave, o Google limita. A constante `CHAVE_PAGESPEED`
   está no topo do nó, vazia; sem ela as métricas de velocidade ficam vazias (I3) e o resto
   da medição continua funcionando.

### O que trava agora

| Bloqueio | De quem |
|---|---|
| **Apify sem crédito** — trava o P4 **e** o P2 | Olavo |
| **Chave do PageSpeed** — sem ela, sem Core Web Vitals | Olavo |
| **Chave da Places** — exposta e inválida; trava os 6 testes do P2 | Olavo |

As duas chaves do Google saem do **mesmo lugar**: uma chave do Google Cloud com Places API
e PageSpeed Insights API habilitadas resolve as duas de uma vez.

### Os 4 já gravados

Ficaram com `analise_gbp_ia` boa e `enriquecimento_site` especulativa, e a fila pula quem
tem `analise_gbp_ia`. O Olavo escolheu **passada corretiva**: depois que o crédito voltar,
rodar uma vez com o critério de "já feito" trocado para `enriquecimento_site`.

---

## PageSpeed pela credencial, sem chave em texto (2026-08-30)

O Olavo trocou a conta do Apify, reconfigurou a credencial da Places e ativou a API do
PageSpeed — **no mesmo projeto do Google Cloud**.

Esse "mesmo projeto" muda o desenho para melhor. Eu ia pedir o valor da chave para colar
numa constante `CHAVE_PAGESPEED` dentro do código do nó, porque a regra 14 do CLAUDE.md diz
que o n8n self-hosted não aceita esse tipo de token em credencial ou variável. Sendo a mesma
chave da Places, **não preciso do valor**: a chamada virou um nó `HTTP Request` usando a
credencial `Google Places API` (`wTDtqdkU2IpqFVf8`) que já existe, com o mesmo
`genericAuthType: httpTemplatedCustomAuth` do `[P2] Places Text Search`.

O segredo fica onde já estava. Uma chave a menos exposta em texto.

```
[P4] Medir o site → [P4] PageSpeed → [P4] Juntar PageSpeed → [P4] Agente
```

O `[P4] PageSpeed` roda com `onError: continueRegularOutput` e a URL só é montada quando
`_site_site_status === 'ok'` — site inexistente ou fora do ar não gasta chamada. O
`[P4] Juntar PageSpeed` só aceita métrica quando o site respondeu: sem isso, a métrica não
existe e grava vazio (I3), nunca zero.

### Credencial do Apify — reapontada pelo Olavo

O nó estava preso na `Apify account yahoo`, que estourou o crédito. Agora está na
`Apify account gmail` (`JnC3lvdmcqxngZy1`). Existem **quatro** credenciais de Apify na
instância; vale saber que trocar de conta no Apify não reaponta o nó sozinho.

### Smoke 33856 — a costura completa, um lead

Corte subido a 80 de propósito, para gastar **uma** chamada de Apify em vez de dez. Passou
só o Ipê Park Hotel. Apify → medição → agente → planilha, `_resposta_em_json: true`.

A diferença na coluna `enriquecimento_site` é a razão de todo este trabalho. Antes:
*"O conteúdo do site não foi observado para análise."* Agora, com número em cada afirmação:
sem HTTPS, 2 H1 quando o certo é 1, meta description com 0 caracteres, 3 imagens sem alt,
sem schema LocalBusiness, sem viewport mobile, sem GA4, sem GTM, sem Meta Pixel.

**`e-mail` capturado: `meuemail@email.com.br`.** Não é defeito da extração — é o que está no
site do hotel, texto de modelo que ninguém trocou. Um endereço assim não é contato: agora
uma lista de padrões (`seuemail`, `meuemail`, `exemplo@`, `example.com`, `noreply@`…) mantém
a coluna `e-mail` limpa e o achado vira `_site_email_de_modelo`, que o agente pode citar.
Site que publica e-mail de modelo é argumento comercial, não lixo.

### Smoke 33858 — a credencial chega, a chave é recusada

Corte em 78, um lead: Hotel Michelangelo.

```
_site_psi_status: indisponivel
_site_psi_erro: 400 — "API key not valid. Please pass a valid API key."
                reason: API_KEY_INVALID
                service: pagespeedonline.googleapis.com
```

Isto **não** é o `429` de antes. O `429` era ausência de chave; agora a credencial injeta uma
chave e o Google a recusa **para esse serviço específico** — o campo `service` nomeia o
`pagespeedonline`. Ativar a API no projeto e permitir a API **na chave** são coisas
diferentes: uma chave do Google Cloud pode ter *Restrições de API* limitando-a a uma lista,
e uma chave restrita a "Places API" devolve exatamente esse erro no PageSpeed.

**Ação:** console → APIs e Serviços → Credenciais → a chave → *Restrições de API* → incluir
**PageSpeed Insights API**.

Isso também deixa uma pergunta em aberto que vale checar junto: se a chave estiver
igualmente inválida (e não só restrita), o P2 continua travado pelo mesmo motivo. O erro do
P2 registrado antes era o mesmo `400 API_KEY_INVALID`, com `service` apontando para a Places.

### Hotel Michelangelo — o que a medição achou

```
1.930 avaliações · 4,4 · 1.974 fotos
site: titulo "HWEB" (4 caracteres) · 2 KB · 0 H1 · meta description 0
sem HTTPS · sem endereco, telefone ou cidade no site
sem formulario · sem WhatsApp · sem GA4, GTM ou Meta Pixel
```

Um hotel com quase duas mil avaliações e um site de 2 KB que não diz onde ele fica. Nenhuma
dessas frases é opinião do modelo: todas saem de campo medido.

### Estado da fila

Corte de volta em **60**. Seis leads já enriquecidos (os 4 do lote + Ipê Park + Michelangelo);
**9 continuam na fila**, e não foram rodados de propósito: rodá-los antes de o PageSpeed
funcionar só aumentaria a passada corretiva de 6 para 15.

---

## A chave do Google é inválida — não é restrição de API (2026-08-30)

O Olavo incluiu a PageSpeed Insights API nas restrições da chave e autorizou rodar os nove
leads restantes. Antes de gastar Apify, testei o PageSpeed isolado — e ele continuou
recusando. Testei então a **mesma credencial contra a Places**, para separar as hipóteses:

```
service: places.googleapis.com          → API_KEY_INVALID
service: pagespeedonline.googleapis.com → API_KEY_INVALID
```

Execução 33867, sem escrever nada e sem gastar Apify nem Gemini.

**Meu diagnóstico anterior estava errado.** Eu disse que restrição de API era "quase certa",
apoiado no campo `service` do erro. O formato do erro já dizia o contrário e eu não li:

| Erro do Google | Significado |
|---|---|
| `PERMISSION_DENIED` — *"requests to this API are blocked"* | chave **existe**, mas a API não está liberada nela → restrição |
| `API_KEY_INVALID` — *"API key not valid"* | chave **não é reconhecida** |

O que voltou nas duas chamadas foi o segundo. Incluir a PageSpeed nas restrições não tinha
como resolver, porque nunca foi esse o problema.

**O valor guardado na credencial `Google Places API` (`wTDtqdkU2IpqFVf8`) não é uma chave
válida.** Causas usuais: chave regenerada no console (o valor antigo morre na hora), chave
excluída, valor colado com espaço/quebra/truncado, ou chave de outro projeto.

Isso reabre o registro anterior deste contrato, que atribuía a falha do P2 a "credencial
reconfigurada". A reconfiguração não deixou uma chave válida no lugar.

### Um workflow de diagnóstico ficou de pé

`DIAG - Conferir chave Google (Places + PageSpeed)` (`u0EODAKSXHBJkAKX`): bate nos dois
serviços com a credencial e devolve `places_ok` e `ok`. Roda em ~3 segundos, não escreve em
lugar nenhum e não gasta Apify nem Gemini. É o teste a rodar **antes** de qualquer lote,
depois de mexer na chave. Não entra na conta dos 8 workflows do §9 — é ferramenta, não etapa
do pipeline.

### Os nove não foram rodados

A autorização do Olavo veio apoiada em o PageSpeed estar funcionando. Não está. Rodar agora
gravaria nove leads sem Core Web Vitals e levaria a passada corretiva de 6 para 15 — o mesmo
desperdício que já havia sido evitado uma vez. Fica esperando ou a chave, ou uma decisão
explícita de aceitar a análise de site incompleta.

---

## Lote 33884 — o P4 rodando inteiro, com PageSpeed (2026-08-31)

O Olavo corrigiu a chave e rodou o `DIAG - Conferir chave Google`: `places_ok` e `ok`
verdadeiros. **A causa era o valor da chave, como o teste 33867 indicava — não a restrição
de API que eu havia diagnosticado.**

Lote de 8 leads, 29 minutos, execução com status `success`. A espera entre leads foi de 5
para **2 minutos**: ela existe contra limite de Apify e Gemini, e o próprio PageSpeed já
gasta de 20 a 60 s por lead — 5 minutos davam 45 minutos de espera parada.

### A conta fecha

```
_total_lidos 136 = _na_fila 8 + _fora_sem_nome 47 + _fora_abaixo_do_corte 47
                 + _fora_ja_enriquecido 34
_fora_sem_ancora_i6 = 0 · _fora_sem_prioridade = 0
```

Os 34 já enriquecidos são os 28 antigos + os 6 dos smokes. 8 gravações, 8 sucessos.

### PageSpeed real, 7 dos 8

| Lead | perf | SEO | LCP | CLS | pixel/GA4/GTM | schema |
|---|---|---|---|---|---|---|
| Zelo Odontologia | **100** | 100 | 0,8 s | 0 | não/não/não | não |
| Dr. Fábio Pantaleão | 83 | 100 | 4,2 s | 0 | **sim/sim/não** | sim |
| Urologista Dr. Alexandre | 69 | 85 | 8,6 s | 0,068 | não/não/sim | não |
| DR. Saúde Eldorado | 67 | 85 | 7,5 s | 0,065 | não/não/não | não |
| Clínica Veterinária Petiatria | 61 | 100 | 5,7 s | 0,011 | não/não/sim | não |
| Dra. Ana Valéria Ramirez | 49 | 92 | 3,3 s | **0,179** | não/não/sim | sim |
| Unimed — Sede | 48 | 77 | **31,4 s** | 0,122 | não/não/sim | não |
| Clínica Padovani | — | — | — | — | — | — |

O oitavo, Padovani, deu `inacessivel`: `getaddrinfo ENOTFOUND www.clinicapadovani.com.br`.
O agente tratou como **achado comercial**, que é o desenho: *"o site está inacessível... uma
falha crítica para a presença online do negócio."* Domínio que não resolve é a conversa mais
fácil da lista, e antes ele teria virado um parágrafo inventado.

O limite recomendado de LCP é 2,5 s. **Sete dos sete o estouram menos o Zelo.** A Unimed leva
**31,4 segundos** — não é lentidão, é site quebrado. Apenas um lead (Fábio Pantaleão) tem
Meta Pixel e GA4: os outros seis gastam em mídia sem nada que meça.

### Mais um defeito meu, mesma família

**2 dos 8 gravaram o literal `[object Object]` em `enriquecimento_site`** — Zelo e Urologista.
O agente devolveu `analise_site` como **objeto** (as quatro seções viraram chaves) em vez de
string, e o `String()` produziu isso.

É exatamente o bug do `bookingLinks`, uma camada acima: eu supus o formato em vez de tratá-lo.
Duas vezes o mesmo erro na mesma frente. A correção agora é geral — objeto e array viram texto
legível, e `_formato_inesperado` registra quando o agente saiu do contrato de três strings,
para que isso não passe despercebido depois de o texto já estar salvo bonito.

Vale notar o que se perdeu: **nada**. As duas análises existiam e foram descartadas na
serialização. Um `String()` sobre tipo não verificado apagou trabalho já pago.

### Passada corretiva — agora 8 leads

| Motivo | Leads |
|---|---|
| Análise de site especulativa (antes da medição) | 4 do lote 33566 + Ipê Park + Michelangelo |
| `[object Object]` em `enriquecimento_site` | Zelo + Urologista |

Os 6 primeiros também ganham Core Web Vitals, que não existiam quando rodaram. O critério de
"já feito" da passada deve ser `enriquecimento_site`, não `analise_gbp_ia`.

### Estado da fila

`_na_fila` = 0. Todos os leads com nome e `potencial_comercial >= 60` estão enriquecidos.
Os 47 sem nome e os 47 abaixo do corte seguem fora, por desenho.

---

## Teste do P2 contra o L2 (2026-08-31) — e dois defeitos no P3

Busca escolhida: `Clinica odontologica São José do Rio Preto`, a maior que o `L2` já havia
rodado (47 linhas). O contrato pede "na mesma busca", e usar uma busca já existente também
evita despejar leads de outro segmento na base.

### Antes de rodar: um default que prospectava a cidade errada

O `[P2] Set Parametros` tinha:

```
textQuery = {{ $json.textQuery || "dentista em Curitiba, PR" }}
```

O gatilho manual entrega `{}`. **Qualquer clique em "executar" no P2 sairia prospectando
dentistas em Curitiba** e criando ~60 linhas de outra cidade — e o P2 é o único workflow
autorizado a criar linha (I2). Um default que prospecta a cidade errada é pior que default
nenhum.

Corrigido: o gatilho manual passa pelo `[P2] Busca manual`, que carrega a busca
explicitamente; a entrada de sub-workflow usa a busca recebida; e o `[P2] Tem busca?` faz
nada rodar sem busca.

### Resultado da descoberta

| | antes | depois |
|---|---|---|
| linhas na base | 136 | **179** |
| `Clinica odontologica…` | 47 | 90 |
| com `Avaliação` | **0** | 60 |
| com `Horário` | **0** | 60 |

O P2 gerou **60 leads** contra os **47** do `L2` na mesma busca. Criou **43 linhas novas**
(179 − 136), logo apenas **17 dos 60 bateram** com place_ids que o `L2` já tinha.

Os quatro campos do I3 (`nao_reivindicado`, `Posts`, `Agendamento`, `Patrocinado`, `Atributos`)
vieram **todos vazios**, como devem: a Places não os observa.

### ⚠️ Aberto: o P2 não é superconjunto do L2

**30 dos 47 leads do `L2` não foram reencontrados pelo P2.** Nenhum sumiu da base — eles
continuam lá como linha —, mas isso desmonta a suposição de que o `02` simplesmente substitui
o `L2`. Hipóteses não testadas: a Places Text Search está limitada a 60 resultados (20 × 3
páginas) e ranqueia diferente do Apify; e as linhas do `L2` são de maio, então parte pode ter
mudado de ficha.

**Isto precisa ser resolvido antes de arquivar o `L2`.** O §9.5 condiciona o arquivamento aos
testes, e o teste devolveu uma pergunta, não um aval.

### Dois defeitos no P3, achados por este teste

**1. `dry_run` ficou `true` desde a construção.** O P3 lia, calculava certo e **não gravava**.
Por isso as 43 linhas novas apareceram sem score. Eu construí o P3 em 29/08 com o modo de
teste ligado e nunca voltei para religá-lo.

**2. O P3 lia a planilha uma vez por item de entrada.** O P2 entrega 60 itens; o nó de leitura
não tinha `executeOnce`. Os contadores denunciaram:

```
_pontuados 7920 + _sem_identidade 2820 = 10.740 = 179 × 60
```

A planilha inteira foi lida 60 vezes e cada linha pontuada 60 vezes. É o padrão N×M que a
própria referência do SDK do n8n descreve: nó que busca dado por conta própria, encadeado
depois de outra fonte.

Depois do `executeOnce`:

```
_pontuados 132 + _sem_identidade 47 = 179          motor: 117 ms (era 29.471 ms)
                                                   execução: 4 s (era 88 s)
```

### O teto da prioridade caiu — o payoff do P2

Com `Avaliação` e `Horário` finalmente preenchidos, o `qual` deixou de ser constante 0,5:

```
Dentista 24 horas Rio Preto Dr. Rodrigo Belmonte
  _qual 1 · _porte 0,98 · fit 0,99 · oportunidade 1 · potencial_comercial 99
```

**99, não 80.** Era exatamente isto que o P2 destravava, e é por isso que ele vinha antes da
passada corretiva na ordem recomendada.

Verificação final: `_sem_score: 0` nas 179 linhas.

### Ferramenta de diagnóstico

`DIAG - Buscas ja rodadas na base` (`W0Rx5xLLIWAp1eDt`): lê a aba `leads` e devolve buscas
distintas, cobertura de `Avaliação`/`Horário`/score e linhas sem score. Não escreve nada. Foi
o que permitiu comparar antes e depois sem abrir a planilha na mão. Como o `DIAG` da chave,
é ferramenta, não etapa do pipeline.

---

## 🔴 A credencial da Places carrega um FieldMask inválido (2026-09-01)

Ao investigar a lacuna dos 30 leads, o experimento não chegou a rodar: toda chamada à
`places:searchText` passou a voltar `400`.

```
"field": "id,displayName"
"description": "Error expanding 'fields' parameter. Cannot find matching fields for path 'id'."
```

### Como foi isolado

O erro não mudou quando troquei a máscara do nó, nem quando tirei a paginação. O dump da
requisição (execução 34519) mostrou **dois** cabeçalhos de máscara:

```
"x-goog-fieldmask": "places.id,places.displayName,…,nextPageToken"   ← do no
"X-Goog-FieldMask": "**hidden**"                                     ← da CREDENCIAL
```

Desligando `sendHeaders` por completo (execução 34520), a requisição **ainda** saiu com
`X-Goog-FieldMask` e **ainda** deu o mesmo `400`. Prova direta: a máscara vem da credencial,
e ela é `id,displayName` — sem o prefixo `places.` que o `searchText` exige.

### O conserto é na credencial — ação do Olavo

A credencial `Google Places API` (`wTDtqdkU2IpqFVf8`) deve carregar **apenas a chave**
(`X-Goog-Api-Key`). O `X-Goog-FieldMask` **não pode** estar nela: cada chamada pede campos
diferentes, e uma máscara fixa na credencial ou quebra a chamada ou empobrece a resposta em
silêncio. Remover o `X-Goog-FieldMask` do template resolve.

### O "ok" que eu dei ao DIAG da chave era falso

Na execução 34517 o `DIAG - Conferir chave Google` devolveu `places_ok: true` — mas o objeto
veio com **apenas `id` e `displayName`**, embora o nó pedisse seis campos. Eu li o `true` e
não olhei o conteúdo. Uma verificação que só checa "respondeu?" não é verificação: **tinha de
conferir se veio o que foi pedido.** O DIAG passou a olhar o conteúdo, não só o status.

### Consequência para o P2

O P2 rodou bem em 34195 (60 leads, todos os campos), **antes** desta edição da credencial. Do
jeito que está agora, ele volta a falhar com o mesmo `400`, ou — pior — poderia gravar linhas
com quase tudo vazio se a máscara fosse válida porém curta. As 60 linhas já gravadas estão
íntegras.

**Enquanto a credencial não for corrigida, o P2 está parado** e a lacuna dos 30 leads segue
sem resposta.

### O que a lacuna ainda espera

Hipóteses não testadas, na ordem em que eu testaria: (1) a Places Text Search entrega no
máximo 60 resultados por busca — se sim, o `L2` cobre mais fundo e isso decide o arquivamento;
(2) os leads do `L2` são de maio e parte pode ter mudado de ficha. O workflow
`DIAG - Lacuna P2 vs L2` (`G5msnvZXjNRJso8H`) já está montado para responder assim que a
credencial voltar.

---

## A lacuna dos 30 respondida: a Places para em 60 (2026-09-01)

### A credencial: existiam duas, e a errada estava ligada

O Olavo esclareceu: a credencial certa é **`Google Places`** (`O66L35GGMYXRDlAM`, tipo
`httpHeaderAuth`). A `Google Places API` (`wTDtqdkU2IpqFVf8`, `httpTemplatedCustomAuth`) havia
sido **substituída mas não deletada** — e era a que estava ligada no P2 e nos diagnósticos.
Era ela que injetava o `X-Goog-FieldMask: id,displayName` inválido.

O erro seguinte que o Olavo viu — *"FieldMask is a required parameter"* — **era esperado**: na
minha última sonda eu havia desligado os cabeçalhos do nó de propósito, para provar que a
máscara vinha da credencial. Com a credencial nova (que corretamente só carrega a chave) e sem
header no nó, ninguém informava a máscara. É a confirmação do diagnóstico, não um problema novo.

O **P2 foi reapontado** para a credencial correta e republicado. Sem isso ele estava quebrado.

**Lição de arquitetura:** credencial carrega **identidade**, não conteúdo de requisição. Uma
máscara de campos dentro da credencial ou quebra a chamada ou empobrece a resposta em silêncio
— e, por ser invisível no nó, custa horas para achar.

### O experimento (execução 34527)

```
_paginas_pedidas          5
_paginas_recebidas        3
_por_pagina               20 +token | 20 +token | 20 SEM token
_ultima_pagina_tem_token  nao
_places_distintos         60
_planilha_tem             90
_nos_dois                 57
_so_na_planilha           33
_so_na_places              3
```

**A terceira página volta sem `nextPageToken`.** O limite de 60 resultados por busca é da
Places API, não da nossa configuração — aumentar `maxRequests` não traz mais nada. A hipótese
(1) está confirmada; a (2), leads desatualizados, não é necessária para explicar a lacuna.

### O que isso decide

**O P2 sozinho não substitui o `L2` em cobertura.** Nesta busca, 33 negócios reais que o
Apify achou não voltam da Places nem pedindo tudo o que ela dá. Os nomes dizem o tipo:
`Dr. Gabriel Nunes`, `Dra. Jéssica Fernanda`, `Consultório Odontológico Dra Mayle Coelho` —
consultórios individuais —, mas também clínicas claramente no alvo, como
`ODONTOLOGIA 24 HORAS - RIO PRETO` e `OdontoNeo Implantes Dentários`.

Isso **não** condena o P2. O teto é por *busca*, então mais buscas, mais estreitas, multiplicam
a cobertura: por especialidade (`implantes dentários`, `ortodontista`, `harmonização facial`)
ou por região. Cada uma tem seus próprios 60.

### Decisão que fica com o Olavo

| Caminho | O que custa |
|---|---|
| **Várias buscas estreitas no P2** | Nada de Apify. Exige montar e manter a lista de buscas por segmento/região. Cobertura cresce por multiplicação, não por profundidade |
| **Manter uma descoberta Apify ao lado** | Cobertura profunda numa busca só, mas mantém dois caminhos vivos — exatamente o que esta reformulação veio eliminar |

Enquanto isso não for decidido, **o `L2` não é arquivado**, e o §9.5 continua com a ordem
obrigatória de pé.

### Correção de um erro meu de medição

A primeira versão do indicador marcava `_sobrou_next_page_token: sim` se **qualquer** página
trouxesse token — o que não responde nada, já que as páginas 1 e 2 sempre trazem. A pergunta é
sobre a **última**. Corrigido antes de eu afirmar qualquer coisa: um indicador que sempre diz
"sim" não é medida, é enfeite.

---

## Buscas estreitas: a estratégia testada, não suposta (2026-09-01)

**Decisão do Olavo:** cobrir o mercado com várias buscas estreitas no P2, sem manter uma
descoberta Apify em paralelo.

Antes de montar a lista, duas perguntas dele mereciam resposta com dado, não com teoria.

### "Dá para rejeitar um lead e a API trazer outro?"

**Não.** A Places não tem parâmetro de exclusão. Ela decide os 60 do lado dela, a partir da
busca; nós filtramos depois que chegam. Descartar um repetido deixa 59 — não puxa substituto.

### "O limite é por pesquisa. Duas pesquisas trazem 120?"

**Duas pesquisas *diferentes*, sim. A mesma pesquisa duas vezes, não.** O teto é por *busca*,
não por chamada. Isso já tinha sido medido sem querer: entre duas execuções da mesma busca,
57 dos 60 vieram idênticos e 3 mudaram por variação de ranking.

### O experimento (execução 34601)

Cinco buscas do mesmo segmento, sendo a primeira a larga que já usávamos:

```
Clinica odontologica São José do Rio Preto      => 60
implantes dentários São José do Rio Preto       => 60
ortodontista São José do Rio Preto              => 60
consultório odontológico São José do Rio Preto  => 60
dentista 24 horas São José do Rio Preto         => 48
```

| | |
|---|---|
| união de leads distintos | **180** |
| só a busca larga | 60 |
| **ganho** | **+120 — o triplo** |
| dos 33 que a larga perdia, recuperados | **12** |
| ainda perdidos | 21 |

Entre os 12 recuperados estão justamente os dois que eu havia apontado como claramente no
alvo: **`ODONTOLOGIA 24 HORAS - RIO PRETO`** e **`OdontoNeo Implantes Dentários`**.

A busca `dentista 24 horas` devolveu **48**, não 60 — ela esgotou o universo dela. Prova de
que o teto não é uma cota artificial: quando existe menos, vem menos.

### Os 21 que restam dizem qual é a próxima busca

`Drª Lilian Amêndola | Harmonização Facial`, `Dra. Andrieli Castro Harmonização facial e
Facetas em Resina` — falta uma busca por **harmonização facial**. O mesmo raciocínio vale para
clareamento, prótese, odontopediatria, periodontia.

E pelo menos um dos 21 não é perda: `Mirassol Hospitalar – Distribuidora de Produtos Médicos
e Farmacêuticos` não é consultório. Era ruído que o Apify trouxe.

**A lista de buscas se autocorrige:** o que sobra na lacuna nomeia o segmento que falta.

### Custo

5 buscas gastaram 13 requisições (3 páginas cada, menos a que esgotou em 3). A cota gratuita
da Places é de 10.000 requisições por mês. Cinquenta buscas por mês custam ~130 requisições —
**1,3% da cota**. O caminho A é gratuito na prática.

### O que isso libera

Com a cobertura resolvida por multiplicação de buscas, **o `L2` pode ser arquivado** e o §9.5
sai do bloqueio. A ordem obrigatória foi cumprida: o `02` provou fazer o trabalho, com um
método diferente do `L2` e um resultado maior.

---

## `PROSP-01 Intake` reconstruído — a conversa que dá o play (2026-09-01)

**Desenho do Olavo:** a mensagem chega no Telegram, um agente propõe como ampliar a busca,
ele concorda ou ajusta, o agente devolve o resumo do que vai ser buscado, e só depois de um
botão de "iniciar prospecção" o fluxo segue.

Isso é o princípio do PHI aplicado à prospecção: **o sistema propõe, o humano dá o play.**

### O problema de estado se resolveu sozinho

Eu tinha listado três dificuldades — botão do Telegram limitado a 64 bytes, memória entre
turnos, e escutar `callback_query`. **Nenhuma existe.** O `sendAndWait` do nó Telegram
**bloqueia a execução** e o n8n guarda o estado. O Intake já usava isso no formulário antigo e
eu não tinha reparado.

Melhor ainda, o modo `approval` traz de fábrica o que faltava:

| Recurso do nó | Resolve |
|---|---|
| `chatApproval: true` | botão **dentro do chat**, um toque, sem abrir navegador |
| `approverIds` | trava **quem pode aprovar** — apontado para o chat que iniciou |
| `limitWaitTime` | desiste em 12h, para não deixar execução pendurada |
| `postDecisionBehavior` | a mensagem mostra o desfecho depois do toque |

Lição: **ler o nó antes de projetar em volta dele.** Eu ia construir gestão de estado que já
vinha pronta.

### O fluxo

```
[P1] Telegram Trigger → [P1] Config → [P1] Chat autorizado?
   ├─(nao)→ [P1] Nao autorizado
   └─(sim)→ [P1] Briefing (formulario) → [P1] Montar pedido → [P1] Agente propoe buscas
          → [P1] Ler proposta → [P1] Proposta valida?
              ├─(nao)→ [P1] Proposta falhou
              └─(sim)→ [P1] Aprovar prospeccao?  ← BOTAO
                     → [P1] Aprovado?
                         ├─(nao)→ [P1] Cancelado
                         └─(sim)→ [P1] Uma busca por item → [P1] Loop buscas
                                       ├─(done)→ [P1] Prospeccao concluida
                                       └─(loop)→ [P2] Descoberta → espera → volta
```

### A trava de acesso se apresenta sozinha

Não achei o `chat_id` do Olavo nas execuções guardadas — são todas manuais e não têm dado do
Telegram. Em vez de travar o trabalho numa pergunta, o `[P1] Config` tem a constante
`CHAT_AUTORIZADO` vazia e, **enquanto ela estiver vazia, nada dispara**: o bot responde
dizendo o `chat_id` de quem escreveu, para colar na configuração. Uma mensagem resolve.

Fechado por padrão, não aberto por padrão. Disparar prospecção gasta cota de API e cria linha
na planilha — o custo de errar para o lado aberto é maior.

### O agente propõe só as frases

Decisão do Olavo. Tipo de negócio e região seguem como estão, o que manteve o contrato de
entrada do P2 intacto (`textQuery` e nada mais). O prompt carrega o motivo do exercício — o
teto de 60 — e a regra que veio do experimento 34601: **variar por especialidade e serviço,
não por sinônimo.** `clinica odontologica` e `consultorio odontologico` trazem gente
diferente; `dentista` e `odontologista` trazem quase os mesmos.

O `[P1] Ler proposta` remove frases repetidas antes de mostrar: frase repetida gasta cota e
não traz lead novo. E se o agente não devolver JSON válido, **a proposta não é inventada** — o
fluxo avisa e para.

### O Intake deixou de ser quatro workflows num só

Saíram 22 nós: a descoberta via Apify, a normalização, a gravação de lead, o guard I6, o
agente de enriquecimento e a chamada do P5. Tudo isso vive hoje no P2, P3 e P4. O §9.4 do
contrato pedia exatamente isso.

### ⚠️ O P5 perdeu o chamador — e ganhou outro

O Intake era **o único** que chamava o P5. Removê-lo sem mais nada faria lead novo parar de
virar deal no HubSpot. O `[P5] CRM-out` foi ligado no **P4**, que é o lugar natural: é ele que
tem o texto de enriquecimento que vira a descrição do deal.

O `[P4] Sinais do Apify` passou a carregar `telefone` (de `a.phone`), que o P5 usa e que não
existia no caminho do P4.

### O que ainda não foi testado

O fluxo inteiro depende de mensagem real no Telegram — não dá para exercitar por execução
manual. **Nada disto foi rodado ponta a ponta.** O primeiro teste é o Olavo mandar uma
mensagem ao bot e colar o `chat_id` que ele responder.

---

## Trava de acesso fechada e passada corretiva armada (2026-09-02)

### O bot já tem dono

`CHAT_AUTORIZADO = '930549271'` no `[P1] Config`. A partir daqui qualquer outro chat que
escreva ao bot recebe recusa e **nada dispara** — sem busca na Places, sem linha na planilha.

### O critério de "já enriquecido" estava olhando para a coluna errada

A fila do P4 pulava o lead que tivesse `analise_gbp_ia`. Isso dava **falso positivo em duas
situações reais**, e as duas escondiam trabalho que não foi feito:

- os 6 primeiros leads rodaram **antes** de o site passar a ser medido: têm análise de GBP,
  não têm análise de site nem Core Web Vitals;
- Zelo e Urologista gravaram o literal `[object Object]` em `enriquecimento_site` — a coluna
  está preenchida e o conteúdo não existe.

O critério passou a ser `enriquecimento_site` **válido**, e `[object Object]` conta como
inválido. Os 8 leads voltam para a fila sozinhos; quem já está completo continua fora e não
paga token de novo. O diagnóstico da execução ganhou `_na_fila_passada_corretiva`, que conta
quantos entraram por esse motivo — se vier diferente de 8, alguma premissa aqui está errada e
é para olhar antes de gastar Apify.

**Como verificar:** rodar o P4 pelo `[SMOKE] Trigger manual` e ler o `[P4] Fila` **antes** de
deixar o loop seguir. `_na_fila_passada_corretiva: 8` confirma; qualquer outro número, parar.

### ⚠️ Credencial velha ainda existe no n8n

`Google Places API` (`wTDtqdkU2IpqFVf8`, `httpTemplatedCustomAuth`) — a que injetava o
FieldMask inválido — foi substituída mas **não deletada**, e continua pendurada como metadado
no nó `[P4] PageSpeed`. Hoje é inerte, porque o nó usa `httpHeaderAuth`. Deletá-la no n8n
resolve em todos os workflows de uma vez e elimina o risco de alguém religá-la sem querer.

### Continua pendente

- **Rotacionar a chave da Places** — foi exposta em texto claro numa conversa anterior.
- **Arquivar os 11 workflows mortos** (19 → 8), agora desbloqueado.

---

## Teste do fluxo, e a fila que era sete vezes maior (2026-09-02)

### O P1 não pode ser testado por fora

O `[P1] Telegram Trigger` não é executável por execução manual: o n8n só dispara por fora
triggers de agenda, webhook, formulário e chat. Mensagem de Telegram só chega do Telegram, e o
botão de aprovação espera um toque humano. **Essa metade do fluxo só o Olavo testa.**

### P2 → P3 rodou ponta a ponta

Busca nova `clinica de implante dentario em Sao Jose do Rio Preto` (execução 34808):
60 leads lidos, 60 linhas geradas, nenhum descarte, nenhum sem `place_id`. O P3 (34809)
pontuou **163 leads em 5 s** com `dry_run: false` e gravou. O `executeOnce` continua segurando
o tempo — antes disto eram 29 s e 10.740 linhas pontuadas à toa.

### ⚠️ Eu disse 8 leads na passada corretiva. São 30.

A sonda de fila (execução 34810, com o `Loop Over Items` desligado de propósito para **medir
sem gastar Apify**) devolveu:

```
_na_fila: 56   _na_fila_passada_corretiva: 30   _fora_ja_enriquecido: 12
```

O erro foi meu: contei só os 8 leads do lote 33884 e esqueci que **o pipeline antigo (L2/L3)
gravou `analise_gbp_ia` em dezenas de leads que nunca tiveram o site medido**. Trocar o
critério para `enriquecimento_site` trouxe todos eles de volta — o que está correto, e é sete
vezes o que eu tinha anunciado.

Rodar os 56 seriam mais de 3 horas de Apify e IA. **A sonda existiu exatamente para isso não
acontecer por clique.** Medir antes de gastar deixou de ser zelo e passou a ser o
procedimento: o `[P4] Fila` só lê planilha, então a sonda custa ~1 s.

### `LIMITE_LOTE` — o teto que faltava

O P4 ganhou `LIMITE_LOTE` no `[P4] Fila`. `0` = sem teto. A fila é ordenada por prioridade
decrescente **antes** de cortar, então o lote leva sempre os leads mais valiosos e o corte cai
sobre o menos valioso. O diagnóstico separa o que é elegível do que entrou:

- `_elegiveis` — quantos passariam
- `_na_fila` — quantos entraram neste lote
- `_adiados_pelo_limite` — quantos ficaram para a próxima

Sem esse teto, uma busca nova no P2 (até 60 leads, quase todos acima do corte) transformava um
clique no P4 em horas de gasto sem ninguém ter decidido isso.

### P4 → P5 rodou de verdade (execução 34811, lote de 3)

| Lead | site | PSI performance | LCP | SEO | JSON | deal HubSpot |
|------|------|-----------------|-----|-----|------|--------------|
| Dentista 24 horas Dr. Rodrigo Belmonte | ok | **38** | 13,0 s | 83 | válido | 60167122736 |
| Mariani Odontologia | ok | **53** | 11,2 s | 100 | válido | 60042979863 |
| OrthoDontic | ok | **87** | 2,6 s | 92 | válido | 64574424718 (novo) |

Nenhum `[object Object]`, nenhum `_formato_inesperado`. A correção do `paraTexto()` segurou.
A cadeia inteira fechou: Apify → medição do site → PageSpeed → agente → planilha → HubSpot.

Os números têm valor comercial imediato: **LCP de 13 s e 11,2 s** em dois dos três sites. É
argumento medido, não opinião — exatamente o que a narração antiga não entregava.

### ⚠️ E a telemetria mentiu — no sentido tranquilizador, que é o pior

`_psi_status` voltou **vazio nos três**, o que parecia PageSpeed quebrado. Não estava: o PSI
funcionou nos três. O `[P4] Ler resposta do agente` lia `_site_psi_status` de
`[P4] Medir o site`, que roda **antes** do PageSpeed e nunca teve esse campo.

O agente sempre recebeu o PSI (ele lê de `[P4] Juntar PageSpeed`), então nenhuma análise saiu
pobre. Só o indicador estava cego. Corrigido para ler do nó certo, e agora carrega também
`_psi_performance`, para o indicador mostrar um número em vez de só dizer "ok".

**É o terceiro defeito desta frente na mesma família:** um campo lido do lugar errado que
falha em silêncio. `bookingLinks`, `analise_site` e agora `_psi_status`. Nos três, o dado
existia e a leitura é que estava errada — e nos três só apareceu porque alguém foi conferir o
conteúdo, não o status. Se eu tivesse aceitado "execução: success", os três teriam passado.

### Estado ao fim do teste

- `LIMITE_LOTE = 3` continua posto. **Cada execução do P4 processa 3 leads**, os de maior
  prioridade primeiro. Sobram 53 elegíveis; subir esse número é decisão de gasto do Olavo.
- `[P2] Busca manual` está com `clinica de implante dentario em Sao Jose do Rio Preto`.
- P1 continua **sem teste** — depende de mensagem real no Telegram.

---

## Primeiro teste real do P1 no Telegram (execução 34822)

O Olavo mandou "Iniciar prospecção" às 11:17. O que funcionou, funcionou inteiro:

| Etapa | Resultado |
|---|---|
| Trava de acesso | passou — `chat_id 930549271`, `autorizado: true` |
| Briefing (`sendAndWait`) | botão apareceu no chat e voltou preenchido: `Clínica odontológica` / `São José do Rio Preto/SP` |
| Agente propõe buscas | **503 do Gemini** — "this model is currently experiencing high demand" |

A conversa em si está de pé: a trava, o formulário dentro do Telegram e o retorno do
`sendAndWait` são exatamente o que o desenho previa. Quebrou no serviço externo.

### ⚠️ Dois defeitos meus, e o segundo é o grave

**Primeiro:** pus `retryOnFail` no agente do P4 e **esqueci do agente do P1**. Uma tentativa
única contra um serviço que cai. Agora são 5 tentativas com 5 s entre elas.

**Segundo, e pior:** o Olavo preencheu o briefing e **não recebeu resposta nenhuma**. A
execução morreu calada. O nó `[P1] Proposta falhou` existia, mas só é alcançado quando o
agente responde e o JSON vem torto — quando o nó *estoura*, a execução termina em erro e o
caminho de aviso nunca roda.

Corrigido com `onError: continueRegularOutput`: a falha passa a fluir para o
`[P1] Ler proposta`, que não acha frase nenhuma, marca `proposta_valida: false` e cai no aviso
já existente. O texto passou a dizer que costuma ser o modelo fora do ar por alguns minutos, e
que **nada foi buscado e nada entrou na planilha** — porque depois de preencher um formulário,
silêncio é indistinguível de "está rodando".

**A regra que sai daqui:** todo ponto do fluxo onde o humano já investiu uma ação (respondeu
formulário, tocou botão) precisa de um caminho de aviso que sobreviva ao nó estourar. Não
basta tratar a resposta ruim; é preciso tratar a resposta que não vem.

### Ainda não testado

O botão **Iniciar prospecção** e o disparo do P2 pelo loop de frases. A execução parou antes
de chegar lá. O próximo "Iniciar prospecção" no Telegram exercita esse trecho.
