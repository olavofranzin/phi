# Brief — webview: segurança do `.env`, lista de vulnerabilidades, e apagar a casca `webview/`

| | |
|---|---|
| **Repo de código** | `olavofranzin/phi-dashboard-webview`, branch **`webview`** |
| **No ar hoje** | `https://app-app.1unqx7.easypanel.host/` · HEAD/rollback **`c37d0b0c9dcd169609eff4060b04fa72a37de8be`** |
| **Branch dos documentos** | `claude/consolidacao-2026-08` · `https://github.com/olavofranzin/phi/tree/claude/consolidacao-2026-08` |
| **Checkout (docs)** | `git fetch origin claude/consolidacao-2026-08 && git checkout claude/consolidacao-2026-08` |
| 🔴 **Antes do 1º commit** | **compare a branch deste brief com a da instrução da sua sessão. Se divergirem, PARE e avise** (**R1**, emenda de 29/09 — já falhou duas vezes) |
| **Limite** | **3 voltas** |

> 🔴 **Três trabalhos, nesta ordem. Os dois primeiros são LEITURA. Só o terceiro toca produção.**

---

## 0. 🔴 O que eu NÃO sei, e por que isso vem primeiro

**O Olavo pediu *"uma lista das vulnerabilidades"*. Eu não tenho essa lista.**

Tudo que existe é uma frase do relatório de 28/09: *"`npm audit --omit=dev`: **12 vulnerabilidades**
preexistentes (10 high, 1 moderate, 1 low), incluindo React Router."* **Nome de pacote: um. CVE:
nenhum. Caminho: nenhum.**

> **Inventar a lista seria o pior resultado possível** — um documento com CVEs plausíveis que a
> próxima pessoa trataria como medição. **A lista é o seu primeiro entregável, não a minha entrada.**
>
> ⚠️ **E o número tem 4 dias.** Remeça (**R6 corolário 2**: *este número eu medi, ou eu li?*).

### 🔴 R7 antes de tudo: a lista talvez já exista

| # | Procure ANTES de gerar à mão | Por quê |
|---|---|---|
| **1** | **Dependabot alerts** do repositório no GitHub | **se estiver ligado, a lista está feita** — com CVE, severidade e correção |
| **2** | **Secret scanning** do repositório (há a ferramenta `run_secret_scanning`) | mesma coisa para o item do `.env` |
| **3** | `npm audit --json` | o caminho manual, se os dois acima não derem |

**Registre o que procurou e o que não achou** — senão a próxima sessão procura de novo.

---

## 1. 🔴 TRABALHO 1 — o `.env` versionado (leitura; a rotação é do Olavo)

### A regra que manda em tudo aqui

> 🔴 **Diga ONDE está. NUNCA cole o valor.** Nem em relatório, nem em commit, nem em mensagem.
> **Nome de chave, sim. Conteúdo, nunca.** (É o mesmo tratamento que a casa já dá à chave do n8n,
> referenciada só pelo id de credencial.)

### O que medir

| # | Medição | Por que importa |
|---|---|---|
| **1** | **os NOMES das chaves** dentro do `.env` versionado | sem isso não se sabe **o que** rotacionar |
| **2** | **desde quando está no git** (`git log --diff-filter=A -- .env`) | é a **janela de exposição** |
| **3** | 🔴 **o repositório é público ou privado?** E quem tem acesso? | **muda a gravidade inteira.** Público ⇒ suponha colhido por robô no primeiro minuto |
| **4** | **onde cada chave é consumida** (VPS, workflow, código) | é o que impede a rotação de derrubar o serviço |
| **5** | o `.gitignore` ignora `.env` hoje? | confirmado que **não** em 28/09 — reconfirme |

### 🔴 A ordem do conserto — e ela tem uma inversão que derruba serviço

**Rotacionar não é revogar. São dois passos, e inverter a ordem apaga o site.**

```
1. CRIAR a credencial nova
2. PÔR a nova no .env da VPS
3. PROVAR que o serviço funciona com a nova   ← /api/clients responde
4. SÓ ENTÃO REVOGAR a antiga
5. tirar o .env do índice + pôr no .gitignore
```

> **É a mesma lição do Agregador, de outra frente: o certo entra antes de o errado sair.** Quem
> revoga primeiro tira o PHI do ar e depois descobre onde a chave era usada.

### Minha recomendação sobre o histórico do git: **não reescrever**

| O que é | O que faz |
|---|---|
| 🟢 **rotação** | **É O CONSERTO.** Depois dela, o valor no histórico **não vale nada** |
| 🟡 tirar do índice + `.gitignore` | **higiene.** Impede o próximo commit, **não apaga o passado** |
| ⛔ reescrever o histórico | **cosmético** — e **caro**: o repo está ligado ao deploy da VPS e **o Lovable também escreve nele**. Reescrever quebra clones e não desfaz nada que já foi lido |

**Proponha, não execute.** 🔴 **Os passos 1 a 4 são do Olavo** (a credencial é dele). Você entrega a
medição e o plano; ele rotaciona; você verifica e faz o passo 5.

### E a pergunta que precisa de resposta de verdade

**O plano de projeto no Notion tem a linha *"rotação de credenciais expostas — não confirmado"*.**
🔴 **É a mesma coisa que este `.env`, ou são duas?** **Não junte sem evidência** (**R6**). A medição
do §1 responde.

---

## 2. TRABALHO 2 — a lista de vulnerabilidades (leitura; não conserte)

### O que entregar

| # | Coluna | Observação |
|---|---|---|
| **1** | pacote · versão instalada · severidade · aviso/CVE | o básico |
| **2** | **quem puxa** (dependência direta ou de quem) | decide se dá para subir |
| **3** | **existe correção?** É `major` (quebra) ou `patch`? | é o custo real |
| **4** | 🔴 **onde ele roda: servidor, bundle do navegador, ou só build?** | **é a coluna que ordena a lista** |

> 🔴 **Severidade não é prioridade.** Um `high` no bundle de um painel interno **view-only** não é a
> mesma coisa que um `high` no Express que serve a API. O `npm audit` não sabe a diferença — **você
> sabe.** Separe, e diga qual é qual.

### 🔴 E o achado que vem antes das correções: sem lockfile, não há conserto

| Medido em 28/09 | Consequência |
|---|---|
| `package-lock.json` **não fecha** com `package.json` | — |
| o `Dockerfile` usa **`npm install`** | 🔴 **a VPS resolve versões por conta própria, a cada build** |
| os logs de build do EasyPanel **não são públicos** (medido em 02/10) | **não se pode observar o que foi instalado** |

> 🔴 **Logo: `npm audit fix` hoje é teatro.** Você corrigiria a sua árvore local, e a VPS resolveria
> outra na próxima build. **Não se corrige vulnerabilidade que não se consegue fixar.**
>
> **A ordem é: fechar o lockfile → trocar para `npm ci` → aí o audit passa a significar algo.** E
> **`npm ci` dá o brinde de tornar o build observável**: ele falha quando o lockfile não bate, em vez
> de improvisar em silêncio. **É a R11 aplicada ao build** — hoje o build *"roda verde"* instalando
> algo que ninguém declarou.

**⛔ Não aplique nada.** Entregue a lista, a ordem proposta e o custo de cada degrau. **Subir React
Router de major é mudança que precisa de teste e de OK do Olavo.**

---

## 3. 🟢 TRABALHO 3 — apagar a pasta `webview/` (AUTORIZADO, e é produção)

**Autorizado pelo Olavo em 2026-10-02.**

> 🔴 **Isto NÃO é limpeza cosmética. O contexto do Docker é a raiz (`/`)** — a pasta **está dentro do
> contexto de build**. Apagar muda o que o Docker copia. **Trate como mudança de produção.**

| # | Passo |
|---|---|
| **1** | 🔴 **PROVE que está morta.** Procure referência a `webview/` em: imports do `src/` e do `server/`, `Dockerfile`, `vite.config`, `tsconfig` (`paths`), `package.json` (scripts), e qualquer `COPY` |
| **2** | **se achar QUALQUER referência viva → PARE e devolva.** *"Resíduo morto"* é rótulo herdado do relatório, não medição sua |
| **3** | anote o **HEAD atual** antes de mexer — o rollback é `c37d0b0…` ou o que estiver no ar |
| **4** | apague · `npm run build` na raiz **tem de passar** |
| **5** | **publique sozinho** — 🔴 **não junte com nenhuma outra mudança**, para o rollback ser limpo |
| **6** | **reconfirme os três endpoints** depois: `/api/clients` (6 de 11 telefones), o KIL real, `/api/phi-snapshot` igual |
| **7** | registre **por que** foi apagada e **que foi provada morta** (**R5**) — senão em três meses alguém recria |

---

## 4. Critérios de aceite — escritos antes (R9)

| # | Critério | Prova |
|---|---|---|
| **CA1** | Procurou **Dependabot** e **secret scanning** antes de gerar lista à mão, e registrou (**R7**) | o que achou / não achou |
| **CA2** | 🔴 **Nenhum valor de segredo** em relatório, commit ou mensagem — só nomes de chave | — |
| **CA3** | Está escrito **desde quando** o `.env` está no git e se o repo é **público ou privado** | os dois fatos |
| **CA4** | Lista de vulnerabilidades **remedida hoje**, com as 4 colunas, inclusive **onde roda** | a tabela |
| **CA5** | 🔴 A lista diz explicitamente o que é **servidor** e o que é **bundle** | — |
| **CA6** | Está escrito que **`npm audit fix` sem lockfile é teatro**, e a ordem proposta | — |
| **CA7** | A pasta `webview/` foi **provada morta** antes de apagar | a busca, colada |
| **CA8** | Build passou e a publicação do `webview/` foi **sozinha**, com rollback anotado | ids |
| **CA9** | Os **três endpoints** reconfirmados depois | as capturas |
| **CA10** | **Nada foi corrigido nem rotacionado** por conta própria | — |
| **CA11** | Linha no **Registro de Execuções** no começo e no fim (**R3**) | — |
| **CA12** | 🔴 Respondeu: o `.env` **é ou não é** a mesma coisa que *"rotação de credenciais expostas"* do plano | com evidência |

---

## 5. Fora de escopo

| Fora | Por quê |
|---|---|
| **rotacionar qualquer credencial** | 🔴 **é do Olavo** — a credencial é dele, e revogar na ordem errada derruba o site |
| **reescrever histórico do git** | recomendei **não**; e se mudar, é decisão dele |
| `npm audit fix` / subir major | 🔴 **sem lockfile fechado é teatro.** E major precisa de teste |
| mexer em `src/integrations/supabase/` e `supabase/functions/` | intocados até hoje; **não é esta etapa** |
| W4b, escrita no Notion/BigQuery, score | nunca estiveram no escopo |

---

## 6. O relatório de volta

1. os **12 critérios**
2. a **lista** — e se veio do Dependabot ou do `npm audit`
3. o que o `.env` tem (**nomes**), desde quando, e **público ou privado**
4. o veredito do **CA12**
5. o que a medição **desmentiu** — este brief foi escrito sem acesso ao repo de código; **se eu errei
   alguma premissa, quero saber**

---

## 7. 🟢 VOLTA 1 — respondida em 2026-10-02. Confirmei medindo, e dividi o passo 1

### 7.1. O que eu conferi sozinho, no commit publicado

**Não aceitei o *"sem consumidor"* no relatório — medi** com `git grep` em **`c37d0b0`** (o commit que
está no ar), não no clone local.

| Rota | Consumidor em `src/` | Veredito |
|---|---|---|
| `/api/phi-snapshot` | `usePhiData.ts` | 🟢 **vivo** |
| `/api/clients` | `useClientData` + teste | 🟢 **vivo** |
| `/api/notion-debug` | **0** | ✅ **confirmado órfão** |
| `/api/campaign-detail` | **0** | ✅ **confirmado órfão** |
| `/api/health` | **0** em `src/` · **e nenhum `HEALTHCHECK` em arquivo versionado** | 🟡 **pergunta aberta — ver 7.3** |
| `/api/phi-score-history` | **0** | 🔴 **pergunta aberta, e é a mais séria — ver 7.2** |

> ⚠️ **Correção minha, no caminho:** a primeira medição que fiz foi num **clone local atrasado** e me
> fez pensar que a branch tinha andado depois da publicação. **Dei `fetch` e não tinha:** `origin/webview`
> está em **`c37d0b0`**, o commit publicado, e `9e4ab45` é o **pai** dele. **Ninguém escreveu depois.**
> É a **R13 na forma git**: *li o que estava no meu disco, não o que está no ar.*

### 7.2. 🔴 `/api/phi-score-history` não é código morto — é funcionalidade que desapareceu

**O `CHECKLIST-webview.md` diz, no W5 marcado CONCLUÍDO:**

> *"status e **tendência real** (gráfico **Evolução do Score** ligado a `/api/phi-score-history` →
> `phi_score_history`)"*

**A medição diz: zero consumidores.** Então uma das duas é verdade:

| | |
|---|---|
| **(a)** | o gráfico **existiu e sumiu** — e apagar a rota **torna a regressão permanente**, com nome de limpeza |
| **(b)** | o checklist **sempre esteve errado**, e *"tendência real"* foi declarado entregue sem ter sido |

> 🔴 **Nos dois casos, a resposta não é apagar.** É **o Olavo decidir se o gráfico volta** — *"tendência
> real"* foi anunciado como entregue, e isso é escopo de produto, não faxina.
>
> **E é a R2 regra 5 outra vez:** o checklist (o lugar onde se procura) afirma uma coisa que o artefato
> contradiz. **Esta é a terceira vez em uma semana.**

### 7.3. 🟡 `/api/health` — o repo não pode responder isso

Não há `HEALTHCHECK` em nenhum arquivo versionado. **Mas o healthcheck do EasyPanel mora no painel do
EasyPanel, não no repositório** — e você mesmo escreveu que **a config do EasyPanel é uma das duas
coisas que não deu para confirmar.**

> 🔴 **Apagar o `/api/health` sem saber se a plataforma o sonda é como desabilitar nó no n8n:** não
> tem cor, não tem alarme, **e aparece como loop de restart no deploy seguinte.** O Olavo olha no
> painel em 20 segundos. **Até lá, não encoste.**

### 7.4. 🟢 O passo 1, dividido — faça a parte sem pergunta

| | |
|---|---|
| 🟢 **APAGUE AGORA** | `/api/notion-debug` · `/api/campaign-detail` · **e as linhas de `server/notion.js` que só eles usam** |
| ⏸️ **NÃO ENCOSTE** | `/api/health` (espera o painel do EasyPanel) · `/api/phi-score-history` (espera decisão de produto do Olavo) |

**Por que isso não enfraquece o ganho:** o **CRITICAL** era o `notion-debug` lendo qualquer base do
Notion. **Ele morre hoje**, e a maior parte das ~240 linhas vai com ele. **O que ficou de fora são
exatamente as duas com pergunta aberta** — e nenhuma delas é o buraco de segurança.

🔴 **Regras do apagamento:** publique **sozinho** (sem nenhuma outra mudança), anote o rollback
`c37d0b0…` antes, e **reconfirme os dois endpoints vivos depois** (`/api/clients` com 6 de 11
telefones · `/api/phi-snapshot` igual). **E registre o porquê** (**R5**), senão alguém recria em três
meses.

### 7.5. 🔴 Os três trabalhos deste brief continuam sem fazer

**A revisão é boa, mas não é o que estava pedido.** Nenhum dos três voltou:

| # | Pedido | Estado |
|---|---|---|
| **1** | **os nomes das chaves do `.env`, desde quando está no git, repo público ou privado** | ⬜ **não feito — e é o que o Olavo chamou de urgente** |
| **2** | **a lista de vulnerabilidades** (Dependabot ou `npm audit`), com as 4 colunas | ⬜ **não feito** |
| **3** | apagar a pasta `webview/`, provada morta | ⬜ **não feito** |

> **O item 1 é o que corre risco por esperar.** Os outros dois podem andar junto com o apagamento.

### 7.6. ⛔ Os passos 2 a 6 do seu plano não estão autorizados

**Eles são bons. E são escopo novo** — autenticação, banner de erro, conserto do join, `strictNullChecks`
são **projeto**, não continuação de faxina. Você mesmo escreveu sobre o passo 6: *"espere trabalho:
vai acusar bastante coisa de uma vez."*

> 🔴 **R7: nada se constrói sem plano aprovado pelo Olavo.** Eu levo os seis a ele como **decisão**,
> com o custo de cada um. **Não comece nenhum.**

**Mas registro o que você achou, porque é valioso** — inclusive os três testes propostos, e
especialmente o de `buildCampaigns`, que é *"toda a matemática que o produto exibe e está sem teste
nenhum"*.

### 7.7. 🔴 O join quebrado é a MESMA doença do Agregador

**Vale dizer em voz alta:** o `CRITICAL` do join por `client_id` — que **dois agentes apontaram
independentemente** — e o defeito que fechamos hoje no Agregador **são a mesma falha**: *identidade
casada pela coisa errada.*

| Frente | O que era |
|---|---|
| **Agregador** | casava por **posição no array** (`nodeFirst`, `sd[0]`) em vez de por `client_id` |
| **Webview** | casa por `client_id` **que pode ser coagido** — você mesmo pôs *"`client_id` com zero à esquerda"* na tabela de teste |

> **Dois times, duas semanas, duas frentes, a mesma doença.** 🔴 **Isso não é um bug: é um padrão da
> casa**, e provavelmente merece invariante próprio. Levo ao Olavo.
