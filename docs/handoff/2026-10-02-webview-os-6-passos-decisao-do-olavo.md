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

> 🔴 **O item 1 é o único da casa inteira que piora sozinho com o tempo.** Os outros esperam sem
> custo; uma credencial exposta não.
