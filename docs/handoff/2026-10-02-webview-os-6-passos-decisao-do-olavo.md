# Webview — os 6 passos propostos, apresentados ao Olavo para decisão

| | |
|---|---|
| **Origem** | revisão de código do sub-chat, 2026-10-02 (4 dimensões, 2 CRITICAL de segurança + 1 de funcionalidade) |
| **Papel deste documento** | **decisão do Olavo.** Nada aqui está autorizado, exceto o que o §1 marca como já liberado |
| **Branch** | `claude/consolidacao-2026-08` · `https://github.com/olavofranzin/phi/tree/claude/consolidacao-2026-08` |
| 🔴 **R7** | nada se constrói sem plano aprovado por ele. Os passos 2 a 6 **são escopo novo** |

---

## 0. A observação que muda como ler a lista

> 🔴 **Quatro dos seis passos não constroem nada. Eles tiram mentira da tela.**

| Passo | O que é | Natureza |
|---|---|---|
| **1** · apagar rotas órfãs | remover código que ninguém chama | **subtração** |
| **2** · tirar a tela `/sites` | remover a única tela 100% ficção | **subtração** |
| **3** · autenticação | fechar a porta | **configuração** |
| **4** · banner de erro | parar de apresentar falha como boa notícia | **honestidade** |
| **5** · conserto do join | 🔴 **a função central do produto** | **construção** |
| **6** · `strictNullChecks` | ligar a rede de segurança do compilador | **construção, de tamanho desconhecido** |

**Só o 5 e o 6 são trabalho de verdade.** Os outros quatro são baratos — e dois deles são de
segurança.

---

## 1. Os seis, com custo, risco e recomendação

### Passo 1 — apagar as rotas sem consumidor 🟢 **PARCIALMENTE LIBERADO**

| | |
|---|---|
| **O que** | 4 rotas sem consumidor + ~240 linhas mortas de `server/notion.js` |
| **Medido por mim** em `c37d0b0` | `notion-debug` e `campaign-detail` **órfãos** · `phi-snapshot` e `clients` **vivos** |
| **Custo** | baixo | **Risco** | baixo, **para duas delas** |
| 🟢 **Já liberado** | apagar `/api/notion-debug` (era o CRITICAL — lia **qualquer** base do Notion) e `/api/campaign-detail` |
| ⏸️ **Retido** | `/api/health` (depende do painel do EasyPanel) · `/api/phi-score-history` (**decisão de produto**, ver §3) |

### Passo 2 — tirar a tela `/sites` 🟢 **RECOMENDO FAZER**

| | |
|---|---|
| **O que é hoje** | *"a única tela 100% ficção"* — apresenta dado inventado com cara de dado |
| **Por que importa** | 🔴 **é pior que uma tela vazia.** Tela vazia informa; tela que inventa **desinforma com confiança**. Se você ou um cliente abrir, lê número que não existe |
| **Custo** | **mínimo** — fechar a porta (tirar da navegação/rota) |
| **Risco** | ~zero. Ninguém depende de ficção |
| 🟢 **Recomendação** | **fazer.** E **fechar a porta basta** — não precisa apagar o componente agora, o que mantém a opção de construir a tela de verdade depois |

### Passo 3 — autenticação 🔴 **O DE MAIOR RETORNO, E RECOMENDO MUDAR COMO**

| | |
|---|---|
| **O problema hoje** | quem souber o endereço **lê a carteira de clientes inteira** — nomes, endereços, sites — **e os scores e investimentos** |
| **Como ele propôs** | autenticar os 2 endpoints **em código** |
| 🟢 **Minha recomendação: no EasyPanel, não no código** | autenticação básica no domínio inteiro. **Zero linha de código, zero teste, zero risco de deploy** — e protege **as 6 rotas**, não 2 |
| **Custo** | **minutos, e nenhum deles de programação** |
| **Efeito colateral bom** | com a porta fechada, **a discussão sobre as rotas órfãs deixa de ser de segurança** e passa a ser só de código morto |
| 🔴 **Por que é o primeiro** | é o único item da lista que **reduz exposição real hoje** sem tocar no produto |

> **É a regra do Olavo aplicada: a solução mais simples que resolve.** Autenticar em código é
> construir o que a plataforma já faz.

### Passo 4 — banner de erro compartilhado 🔴 **RECOMENDO FAZER**

| | |
|---|---|
| **O que acontece hoje** | com a API caída, a tela mostra **"🎉"**, *"nenhuma campanha em estado crítico"*, *"nenhum cliente com esses filtros"* e esqueletos eternos |
| 🔴 **Por que isso é grave** | **é a R11 na interface: falha renderizada como boa notícia.** *"Zero campanhas críticas"* com a API morta é **o mesmo erro** que `conversions = 0 ⇒ CPA ótimo` |
| **E viola o contrato da casa** | `M4` (zero nunca é ausência) e `S1` (pilar não medido nunca é zero) valem no dado — **mas a tela está quebrando os dois** |
| **Custo** | baixo — um componente, 5 páginas |
| **Risco** | baixo |
| 🟢 **Recomendação** | **fazer junto com o 2.** É a diferença entre *"o painel está quebrado"* e *"está tudo bem"* — e a segunda é como se passam semanas sem ninguém ver |

### Passo 5 — conserto do join por `client_id` 🔴 **O MAIS IMPORTANTE, E PRECISA DE TESTE**

| | |
|---|---|
| **O que é** | casar campanha com cliente — **a função central do produto** |
| **Confiança** | 🔴 **dois agentes apontaram independentemente** |
| **Custo** | médio |
| 🔴 **Risco próprio** | **é mudança de comportamento.** Depois do conserto a tela mostra **pareamentos diferentes** — e, se alguém decidiu algo olhando a tela de hoje, decidiu sobre pareamento possivelmente errado |
| 🔴 **Condição** | **não sai sem o teste** que ele propôs: uma página do Notion + uma linha do BigQuery do mesmo cliente, afirmando que casam. **Consertar sem teste é consertar de novo em dois meses** |
| 🟢 **Recomendação** | **fazer, com o teste, e sozinho** — publicação própria, para o rollback ser limpo |

> 🔴 **E é a MESMA doença do Agregador:** identidade casada pela coisa errada. Lá era **posição no
> array**; aqui é **chave que pode ser coagida** (ele pôs *"`client_id` com zero à esquerda"* na
> tabela de teste). **Dois times, duas frentes, mesmo padrão** — candidato a invariante próprio.

### Passo 6 — ligar `strictNullChecks` 🟡 **RECOMENDO MEDIR ANTES DE DECIDIR**

| | |
|---|---|
| **O que é** | hoje `strict: false`, `strictNullChecks: false`, `noImplicitAny: false` |
| **O que custou** | 🔴 **é a causa raiz do bug do 1970:** o tipo diz `string`, o servidor manda `null`, **o compilador não reclama.** O `tsc --noEmit` passar limpo hoje **não prova nada sobre nulos** |
| **Custo estimado por ele** | *"espere trabalho: vai acusar bastante coisa de uma vez"* |
| 🔴 **O problema da estimativa** | ***"bastante coisa" não é um número.*** Decidir o maior item da lista por um adjetivo é a **R6 corolário 2** ao contrário |
| 🟢 **Recomendação** | **ligar, rodar `tsc --noEmit`, CONTAR os erros, não consertar nada, e devolver o número.** Um comando. Aí a decisão tem tamanho |
| **Depois** | com o número na mão: ou big-bang, ou ligar só para arquivo novo (incremental) |

---

## 2. 🔴 Três achados dele que NÃO estão nos seis passos — e dois são piores que alguns deles

### 2.1. Um cliente malformado derruba a lista inteira

`useClientData.ts:27` — `!dossiers.every(isClientDossier)` → `throw`. **Uma linha fora de formato e
os 40 clientes somem**, com *"Resposta inválida"* na tela.

> 🔴 **É a R11 regra 1 com outra roupa: um item inválido significa "nenhum item".** *A falta de
> critério nunca pode significar "todos" — e aqui o inverso: um defeito não pode significar "zero".*
> **Validar por item e descartar a linha ruim perde 1 cliente em vez de 100%.**
>
> **Custo: baixo. Recomendo fazer junto com o passo 4** — são a mesma família, *a tela mentindo sobre
> o que não tem*.

### 2.2. 🔴 `readProp` sem caso para `rollup` e `relation` — e isso muda o que eu te disse

Campos que no Notion são **rollup** ou **relation** caem no `default: return null` ⇒ aparecem **`N/D`
estando preenchidos**.

> 🔴 **Consequência direta sobre o que eu afirmei:** eu te disse *"o melhor cliente tem 3 de 41 campos
> preenchidos"*. Aquela contagem foi feita **lendo a fonte direto**, então ela vale para a **fonte**.
> **Mas "a tela mostra N/D" e "a fonte está vazia" são duas coisas** — e este defeito garante que elas
> **não coincidem**. Parte dos `N/D` da tela pode ser **campo preenchido que o leitor não entende**.
>
> **E tem um irmão:** `readProp` devolve `number` como **número** e `formula.number` como **string**.
> A mesma métrica chega `1234.5` ou `"1234.5"` conforme a coluna — **e qualquer `.toFixed()` adiante
> quebra**.

### 2.3. Dois leitores de propriedade concorrentes

`plain()` entende 4 tipos; `readProp()` entende 12. **A mesma coluna lida por um ou por outro conforme
o caminho** — o Overview pode listar o ID cru e o detalhe o nome certo. **Mesma base, dois
resultados.**

> **É o M1 da casa (um writer por campo) virado do avesso: dois LEITORES para o mesmo campo.**
> Custo de unificar: baixo-médio. **Recomendo junto do passo 5**, porque é o mesmo tipo de conserto.

---

## 3. ⬜ E as duas decisões que já estavam esperando

| # | Decisão | Por quê |
|---|---|---|
| **1** | 🔴 **o gráfico "Evolução do Score" volta ou sai?** | o `CHECKLIST` diz que o W5 o entregou; a medição diz **zero consumidores**. **Apagar a rota tornaria a regressão permanente com nome de limpeza** |
| **2** | **há healthcheck em `/api/health` no EasyPanel?** | 20 segundos no painel, e libera a última rota órfã |

---

## 4. 🟢 A ordem que eu recomendo

```
1. AUTENTICAÇÃO no EasyPanel        ← minutos, zero código, protege as 6 rotas
2. apagar notion-debug + campaign-detail   ← já liberado
3. fechar a porta do /sites  +  banner de erro  +  validar cliente por item
4. conserto do JOIN, com o teste, publicado sozinho
5. medir o custo do strictNullChecks (contar, não consertar)
```

**Por que a autenticação vem antes do apagamento:** é mais barata, cobre mais, e **não espera decisão
nenhuma**. O apagamento é limpeza; a porta aberta é exposição.

---

## 5. 🔴 E o que continua fora de tudo isso, esperando

| # | | Estado |
|---|---|---|
| **1** | **os nomes das chaves do `.env`** + desde quando está no git + repo público ou privado | ⬜ **não feito. É o que o Olavo chamou de urgente** |
| **2** | a **lista de vulnerabilidades** + o lockfile (`npm ci`) | ⬜ não feito |
| **3** | apagar a pasta `webview/` | ⬜ não feito (autorizado) |

> 🔴 **CORRIGIDO em 02/10 — ver §6.** Eu escrevi aqui que o `.env` era *"o único item da casa que
> piora sozinho com o tempo"*. **Medi: não há segredo nele** — três chaves `VITE_SUPABASE_*`, que são
> públicas por construção, em repo privado com zero forks, e **sem `NOTION_TOKEN`**. **Não é urgente e
> não há o que rotacionar.** O que sobra é pôr `.env` no `.gitignore`, pelo risco do que pode cair lá
> amanhã.

---

## 6. 🔴 CORREÇÃO DE 2026-10-02 — eu medi o `.env`, e exagerei a gravidade

**O Olavo pediu o passo a passo para fazer ele mesmo. Duas das três perguntas eu respondi medindo
daqui** — e o resultado **desinfla o que eu tinha escalado.**

### O que o `.env` tem, de fato

| Pergunta | Resposta medida |
|---|---|
| **público ou privado?** | 🟢 **PRIVADO**, `forks: 0`, criado em 23/09 |
| **desde quando está no git?** | `01e1907` (23/08, pelo bot do Lovable) e `7a2f175` (23/09, *"Add Supabase configuration"*) |
| 🟢 **quais chaves?** | **três, e só três:** `VITE_SUPABASE_PROJECT_ID` · `VITE_SUPABASE_PUBLISHABLE_KEY` · `VITE_SUPABASE_URL` — **idem no `webview/.env`** |
| 🔴 **tem `NOTION_TOKEN`?** | **NÃO.** Ele aparece **só como NOME** em `.env.example`, `server/index.js` e `server/notion.js`. **O valor nunca entrou no git** |

### 🔴 Por que isso muda o veredito

**`VITE_*` é, por construção, embutido no pacote do navegador** — o Vite inlina essas variáveis no JS
do cliente. **Quem abre a página já tem as três.** E `PUBLISHABLE_KEY` é a chave *anon* do Supabase:
ela **existe para ser pública** e é protegida por RLS, não por sigilo.

> 🟢 **Conclusão: não há segredo exposto neste `.env`.** O token do Notion — o único segredo de
> verdade do webview — **mora só na VPS, exatamente como a regra da casa manda.** A regra estava sendo
> cumprida.

### O que eu errei, e como

**O relatório do executor afirmou um fato correto:** *"`.env` da raiz continua versionado e o
`.gitignore` não o ignora."* 🔴 **A gravidade fui eu que pus**: chamei de *"das urgentes"*, de *"o
único item da casa que piora sozinho com o tempo"*, e levantei que podia ser **a mesma coisa** que a
linha *"rotação de credenciais expostas — não confirmado"* do plano no Notion.

| | |
|---|---|
| **Não é urgente** | não há segredo lá |
| 🔴 **Não é a mesma coisa** que a linha do plano | aquela linha **continua de pé, sozinha e não confirmada** |
| **Nada a rotacionar** | não existe credencial comprometida aqui |

> **É a R6 virada contra mim, e é a mesma frase que eu uso nos outros:** *o que se mede vence o que
> está escrito — inclusive o que está escrito por mim.* **Custo de medir: dois comandos. Preço de não
> medir: eu teria mandado o Olavo rotacionar uma chave que existe para ser pública.**

### 🟢 O que SOBRA, e vale fazer — é pequeno e não é rotação

| # | O que | Por quê |
|---|---|---|
| **1** | 🔴 **pôr `.env` no `.gitignore`** | **o risco não é o que está lá — é o que pode cair lá amanhã.** Hoje, se alguém puser um segredo de verdade no `.env`, ele entra no git **sem resistência nenhuma** |
| **2** | ⚠️ **e tem uma ironia:** o próprio `server/.env.example` diz *"NUNCA versione o `.env` preenchido (**o `.gitignore` já ignora**)"* | **é falso.** O exemplo afirma o estado certo e o artefato contradiz — **R13 regra 3**, agora dentro de um `.env.example` |
| **3** | o `webview/.env` sai junto com a pasta | já está na fila |

### ⬜ A única parte que precisa de você — e é no Supabase, não no git

O Supabase é **resíduo do andaime do Lovable**: sobrou **um** arquivo que o referencia
(`src/integrations/supabase/client.ts`), e o commit anterior ao publicado chama-se *"Removed supabase
client req"*.

**A chave ser pública não é o problema. A pergunta é se existe projeto vivo atrás dela:**

| # | Passo (em `supabase.com`, com o seu login) |
|---|---|
| **1** | **existe um projeto** com esse `PROJECT_ID`? |
| **2** | se existe, **tem dado dentro** — alguma tabela com linha? |
| **3** | se tem dado, **o RLS está ligado** nas tabelas? |

| Resultado | O que fazer |
|---|---|
| **não existe projeto**, ou existe e **está vazio** | 🟢 **nada a proteger.** O `src/integrations/supabase/` e o `supabase/functions/` **saem junto com a limpeza** |
| **existe com dado** | ⚠️ aí sim é assunto: **ou liga RLS, ou apaga o projeto**. A chave pública dá acesso ao que o RLS permitir |

---

## 7. 🟢 As outras duas respostas do Olavo (2026-10-02)

### 7.1. O gráfico "Evolução do Score" — **VOLTA** (decisão do Olavo)

| | |
|---|---|
| ⛔ **`/api/phi-score-history` NÃO se apaga** | fica, e sai da lista de rotas órfãs **em definitivo** |
| 🟢 **Vira tarefa de construção** | **religar** o gráfico de tendência real na tela de métricas, consumindo a rota que já existe |
| 🔴 **E vira incidente, não só tarefa** | o `CHECKLIST` marcou o **W5 como CONCLUÍDO** com esse gráfico, e ele **parou de existir sem ninguém ver**. **É o M10 no nível de funcionalidade: declarado entregue, verde, ausente** |
| **O que teria pego** | um teste que afirme que o gráfico renderiza. **Não existe.** Entra na lista de testes do passo 5 |

### 7.2. `/api/health` — a API do EasyPanel não está ativada na versão dele

**Então a pergunta não tem como ser respondida por fora.** 🟢 **Resolvo sem precisar do painel:**

| | |
|---|---|
| 🟢 **A rota FICA** | são ~10 linhas, e **health endpoint é coisa legítima de um serviço ter**. Apagar arrisca loop de restart por um ganho de nada |
| 🔴 **Mas o que ela CONTA muda** | hoje ela *"confirma de fora se o token do Notion está ativo"*. **Health diz "o serviço está de pé" — não diz se uma credencial é válida.** Tirar essa parte são duas linhas |
| **Efeito** | a rota sobrevive para a plataforma, **e o vazamento de informação morre** |

> **Nenhuma das duas precisava de decisão nova do Olavo** — precisavam de alguém escolher a opção que
> resolve os dois lados.

---

## 8. 🔴 02/10 — *"por que a checagem do Supabase?"*. A minha razão estava errada; a verdadeira é pior

**O Olavo perguntou, e a pergunta desmontou a minha justificativa.** Eu disse para checar *"se há
dado atrás da chave pública"*. **Medi, e essa pergunta se responde sozinha — a resposta é NÃO:**

| Medição | Resultado |
|---|---|
| `supabase/migrations/` | 🟢 **nenhuma.** **Nenhuma tabela jamais foi definida** |
| `.insert` · `.upsert` · `.rpc` · `supabase.auth` em `src`/`server` | 🟢 **nenhuma** (os `.from(` são `Buffer.from` e `Array.from`) |
| quem importa `integrations/supabase/client.ts` | 🟢 **ninguém** — a única referência é um `import` **comentado dentro do próprio arquivo** |

> **Andaime morto. Não havia o que checar, e eu quase mandei o Olavo checar.** É a mesma falha do
> `.env`, uma camada abaixo: **eu herdei um alarme e aumentei o volume em vez de medir.**

### 🔴 Mas a pasta `supabase/functions/` não é andaime — é a ARQUITETURA ANTERIOR

| Arquivo | O que é |
|---|---|
| `supabase/functions/phi-snapshot/index.ts` | **o mesmo nome** da rota viva `/api/phi-snapshot` |
| `supabase/functions/phi-score-history/index.ts` | **o mesmo nome** de `/api/phi-score-history` |
| `supabase/functions/_shared/bq.ts` | 🔴 **fala com o BigQuery** |
| `supabase/config.toml` | `project_id = "mfnrldnhcxaftwfdolsk"` |

**Antes do servidor Node, os dados vinham de Edge Functions do Supabase lendo o BigQuery.** O
`server/index.js` as **substituiu** — e elas **ficaram para trás**, exatamente como o draft do
`Reclassifica IDs` ficou.

### 🔴 E o que `_shared/bq.ts` lê:

```
const saKey = Deno.env.get("GCP_SA_KEY");
// "Missing secret GCP_SA_KEY. Add the full service-account JSON in Project Settings → Secrets."
```

> 🔴 **Ou seja: se essas funções foram publicadas, existe o JSON COMPLETO de uma service account do
> Google — chave privada incluída — guardado nos segredos de um projeto Supabase que nada no
> aplicativo usa mais.**

**E tem a consequência que muda o passo da autenticação:**

| | |
|---|---|
| **A chave `anon` é pública** (está no pacote do navegador) | e **ela é um JWT válido** para chamar Edge Function |
| **As funções vivem em `*.supabase.co`** | 🔴 **FORA do domínio do EasyPanel** |
| 🔴 **Logo** | a autenticação básica que eu recomendei **não cobre essa porta.** Seria **trancar uma das duas** |

### O que é medido e o que NÃO é — para não repetir o erro

| | |
|---|---|
| 🟢 **Medido** | o código existe no git · lê `GCP_SA_KEY` · projeto `mfnrldnhcxaftwfdolsk` · nada no app usa Supabase · zero migrations |
| 🔴 **NÃO medido** | **se as funções estão publicadas** · **se o `GCP_SA_KEY` foi realmente preenchido** nos segredos daquele projeto · se aquela service account ainda é válida |

**Os três só o Olavo resolve** — é a conta dele. **E é por isso que a checagem vale**, não pela razão
que eu tinha dado.

### ⬜ O passo a passo, corrigido (em `supabase.com`)

| # | |
|---|---|
| **1** | o projeto **`mfnrldnhcxaftwfdolsk`** ainda existe? |
| **2** | em **Edge Functions**: `phi-snapshot` e `phi-score-history` aparecem como **deployed**? |
| **3** | em **Project Settings → Secrets**: existe um segredo chamado **`GCP_SA_KEY`**? 🔴 **(só se existe. Não abra, não copie)** |

### 🟢 E a recomendação, se a resposta for sim — **apagar, não rotacionar**

| Caminho | Avaliação |
|---|---|
| **rotacionar a service account** | 🔴 **perigoso:** o `.env.example` do próprio webview nomeia `phi-workflow-sa@phi-production-488720` — **é provavelmente a MESMA service account que o PHI inteiro usa.** Rotacionar mexe no n8n, no servidor do webview, em tudo |
| 🟢 **apagar as Edge Functions (ou o projeto)** | **mesmo efeito, raio de explosão zero.** A porta fecha e nada que está vivo sente |

> 🔴 **É o procedimento de aposentadoria da R5 aplicado a recurso de nuvem:** quando a função foi
> substituída, **desligar o chamador não bastou — o serviço antigo continuou de pé, com credencial
> dentro.** *Apagar o código não apaga o projeto.*

> ⚠️ **E isto é candidato melhor para a linha *"rotação de credenciais expostas — não confirmado"* do
> plano no Notion** do que o `.env` que eu apontei. **Candidato — não confirmado.** Os três passos
> acima dizem.
