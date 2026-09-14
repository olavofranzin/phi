# Leitura da pesquisa GBP (2026-09-14) — o que ela muda no nosso score

> **Status:** nota de planejamento. **Não é ADR** — não decide nada ainda.
> **Origem:** 5 documentos trazidos pelo Olavo em 14/09/2026 (2 de pesquisa sobre Google Business
> Profile com fontes oficiais; 3 sobre arquitetura agêntica).
> **Para quê:** alimentar a próxima fase de planejamento.

---

## 1. O achado principal

**As 6 dimensões do nosso score (`dim_saude`, `dim_seo`, `dim_autoridade`, `dim_conversao`,
`dim_engajamento`, `dim_conteudo`) não estão definidas em lugar nenhum do repositório.**

Elas aparecem em 9 documentos — sempre como *nome de coluna*, nunca como *definição*. Não há registro
de **o que cada uma mede**, **de que dado ela sai** nem **com que peso**. A fórmula existe só dentro do
nó `Motor de Regras` (Code) no n8n.

Consequência: **ninguém consegue auditar se o score mede o que o Google diz que importa.** E é o score
que sustenta a frase que a gente diz ao prospect — *"seu perfil tem problemas que custam clientes"*.

Único rastro encontrado: `docs/comercial/planilha-quantidade-leads-por-mes-colunas.md` §55 diz que a
coluna **`Posts`** (`ownerUpdates`) alimenta **`dim_conteudo`** e **`dim_engajamento`**.

## 2. Por que isso virou urgente agora

As duas pesquisas de GBP são **baseadas em documentação oficial** e classificam cada afirmação:
**[DG]** documentado pelo Google · **[IR]** inferência razoável · **[NC]** não confirmado.

O Google declara **três** fatores de ranking local, e só três:

| Fator | O que é |
|---|---|
| **Relevância** | quanto o perfil corresponde ao que a pessoa buscou |
| **Distância** | proximidade física |
| **Prominência** | reputação — inclui **quantidade e nota das avaliações** |

E as pesquisas listam explicitamente o que **NÃO** é fator de ranking confirmado:

- **frequência de Posts** ⚠️
- quantidade de fotos
- velocidade de resposta a avaliações
- geotag/EXIF em fotos
- consistência NAP em diretórios de terceiros

> ⚠️ **O cruzamento incômodo:** `Posts` alimenta **duas** das nossas seis dimensões, e Posts é
> justamente um dos itens marcados **[NC]**. Se o diagnóstico disser ao prospect que a baixa
> frequência de posts está derrubando o ranking dele, **estamos afirmando o que o Google não afirma.**

## 3. A separação que resolve — e que melhora o pitch

Não é caso de jogar fora as dimensões. É caso de **separar duas perguntas que hoje estão misturadas**:

| Pergunta | O que a governa | Nossas dimensões |
|---|---|---|
| **"Por que eu não apareço?"** | Relevância · Distância · Prominência | categoria, endereço/área, avaliações |
| **"Por que aparecendo eu não sou escolhido?"** | fotos, descrição, posts, atributos, respostas | conteúdo, engajamento, conversão |

Um perfil pode aparecer em 1º e mesmo assim perder o cliente para o 3º que tem fotos boas e horário
correto. **Isso é verdade, é defensável, e não exige alegar fator de ranking.**

> O pitch honesto é mais forte que o pitch inflado: *"isto aqui te faz aparecer; aquilo ali te faz ser
> escolhido"* — duas ofertas distintas, cada uma com sua evidência.

## 4. Sinais de compra — o que a pesquisa confirma que já temos

O protocolo de prospecção lista 4 sinais. **Os quatro já estão no nosso modelo** — isso é confirmação,
não novidade:

| Sinal da pesquisa | Nossa coluna |
|---|---|
| Ficha não reivindicada (*claim this business: false*) | `nao_reivindicado` ✅ |
| Sem website | `site` vazio ✅ |
| Website é rede social (Instagram/Facebook) | `site_tipo` ✅ |
| Poucas avaliações / nota baixa | `Quantidade reviews` · `Avaliação` ✅ |

⚠️ **Uma hipótese a testar:** a pesquisa trata "site = Instagram" como **sinal de ALTA intenção**
(a empresa sabe que precisa de link, mas não tem domínio) — **não** como "já tem site". Vale conferir
se o nosso `site_tipo` trata esse caso como oportunidade ou como porta fechada. Se tratar como porta
fechada, estamos descartando o melhor lead da lista.

## 5. Os 3 documentos de arquitetura agêntica — o que aproveitar e o que descartar

**O que já fazemos** (e em alguns pontos melhor, porque nosso contrato tem dono por campo e
invariantes numerados): planejar antes de executar, contexto isolado por sub-chat, executor separado
do revisor, memória de decisão.

**A crítica que nos acerta:** `CLAUDE.md` acumula peso morto. O nosso carrega uma seção inteira de
**RTK** que não tem relação com o PHI, além de tabelas de IDs (Notion, BigQuery) que são **dado de
consulta**, não regra de comportamento. As regras R1–R6 **merecem** o espaço que ocupam — o "Motivo" é
o que impede que a próxima pessoa apague a regra. O que pode sair é a referência, não o princípio.

🔴 **O que NÃO deve entrar no planejamento:** esses três documentos afirmam números sem fonte —
modelos e preços (`GPT 5.6 Luna`, `DeepSeek V4 Flash a US$ 0,14/milhão`, `Fable 5 a US$ 10`),
"desconto de 98%", "740 bilhões de parâmetros em 25 GB de RAM", "4 minutos → 22 segundos". **Nada
disso é verificável aqui.** Não use como base de custo nem de escolha de modelo.

> **O contraste é a lição:** duas das cinco fontes **mostram a evidência de cada afirmação**; três
> **pedem confiança**. Decisão se toma sobre a primeira espécie. É a **R6** aplicada a leitura.

## 6. O que fazer com isso

1. **Documentar as 6 dimensões** — ler o `Motor de Regras` e escrever, para cada uma: o que mede, de
   que campo sai, com que peso. Sem isso nada mais pode ser avaliado. *(Execução: sub-chat.)*
2. **Carimbar cada dimensão com o status de evidência** `[DG]`/`[IR]`/`[NC]`, como a pesquisa faz.
   Dimensão `[NC]` continua pontuando — o que muda é **o que o texto de abordagem pode alegar**.
3. **Separar ranking × conversão** no diagnóstico (§3).
4. **Testar a hipótese do `site_tipo`** com rede social (§4) — é barato e pode estar escondendo leads.

> Nada disso mexe no **ADR-38** (frente do Score de Mídia, outro score). São duas frentes e dois
> scores diferentes: `phi_value` (campanha) e `potencial_comercial` (lead). Não confundir.
