# [BRIEF sub-chat] Grão de anúncio — medir, decidir, e só então construir

> **Como usar:** cole este arquivo como **primeira mensagem** de um sub-chat.
> **Modelo:** Opus. **Repo:** `olavofranzin/phi` · **Branch:** `claude/consolidacao-2026-08`.
> **Idioma com o Olavo:** português simples, sem jargão.
> **Prioridade:** o Olavo elegeu o grão de anúncio para os **próximos 15 dias** (D1 e B20).

---

## 0. 🔴 Leia isto antes de qualquer coisa: NÃO é um conserto

A leitura natural é *"o `sw metricas anuncios` está quebrado, conserte"*. **O as-built de 20/09
mostrou que consertá-lo não produziria um único anúncio.** A cadeia medida:

1. A entrada do workflow **não é a API do Google** — é a **DB Notion "Anúncios"**
   (`297b65e5-c72b-8061-89b3-f31bd41d7e7f`), filtrada por `Status do Anúncio = Iniciado`.
2. Essa DB tem **2 anúncios, os dois da Meta**. **Nenhum do Google.**
3. A Meta devolve **0 resultados** para eles.
4. Sem `ad_id`, o SQL sai vazio e o `IF Gate PMAX` corta o ramo.
5. **A Meta ficou para depois do v1** (D11 do contrato).

> **Portanto: o gate não é a causa — é o sintoma.** A causa é que **ninguém decidiu de onde vem a
> lista de anúncios.** Isso é arquitetura, e é decisão do Olavo (**R7**).

**E existe um atalho que precisa ser medido antes de construir qualquer coisa:** o
`PHI — Agregador de Métricas Multi-fonte` **já roda** `SELECT ad_group_ad.ad.id, … FROM ad_group_ad`
toda segunda — e **joga o resultado fora** depois de alimentar um relatório de LLM. **A consulta que
faltaria talvez já exista e esteja funcionando.**

## 1. Leia antes

| # | Documento | Por quê |
|---|---|---|
| 1 | `docs/handoff/2026-09-20-parque-phi-lista-A-as-built.md` §A2, §A3, §A6 | **o que já foi medido. Não remeça** |
| 2 | `saude-digital/CONTRATO-PHI.md` §3 (M1–M12), §6 (D1, D1b, D11) | os invariantes e o que o Olavo decidiu |
| 3 | `saude-digital/CLAUDE.md` | contexto da frente |
| 4 | `CLAUDE.md` da raiz | R1–R13 |

**O que o Olavo já decidiu, e não se repergunta:**
- **D1** — sim, quer o anúncio culpado. O grão entra.
- **D1b** — três consumidores: **tela do Notion · T28 · relatório para o cliente**. **Não** entra no
  `phi_value` (então o ADR-34 não se mexe).
- **D1b** — precisa ser **diário e persistido**, não o snapshot semanal do Agregador.
- **D11** — **Meta fica para depois do v1.**

## 2. As 3 etapas — nesta ordem

```
ETAPA 1 — MEDIR      4 perguntas, nenhuma depende de decisão. Só leitura.
ETAPA 2 — DECIDIR    levar ao Olavo UMA pergunta, com o dado na mão.
ETAPA 3 — CONSTRUIR  só depois do OK dele (R7). Brief novo, não este.
```

🔴 **Não pule para a Etapa 3.** Este brief **não autoriza construir nada** — autoriza medir e
perguntar. Se a Etapa 1 mostrar que a resposta é óbvia, escreva isso e **ainda assim pergunte**.

## 3. ETAPA 1 — as 4 medições

Todas são **leitura**. Nenhuma escreve, nenhuma ativa, nenhuma executa workflow de produção.

| # | Pergunta | Como |
|---|---|---|
| **G1** | **Existem anúncios do Google nas campanhas ativas?** Quantos, por campanha? | rodar o GAQL `FROM ad_group_ad` **fora do n8n** ou ler o `runData` de uma execução do Agregador. Se o KIL tem 2 campanhas, quantos anúncios elas têm? |
| **G2** | **O que o GAQL do Agregador devolve por anúncio?** Quais campos, e eles bastam? | ler o nó `Google Ads Anúncios (GAQL)` na `activeVersion` `c54114b3` + o `runData` de uma execução |
| **G3** | **A `raw_ad_data` tem schema, e ele bate com o G2?** | `__TABLES__` + `INFORMATION_SCHEMA.COLUMNS`. Criada em 30/06 com 0 linhas — **tem colunas ou é casca?** |
| **G4** | **O Agregador é uma fonte confiável?** | o as-built achou que ele **falha silenciosamente toda rodada**: na execução 39103, 2 erros do `HTTP Request GBP` por **cota**, e **3 dos 6 destinos `t28_*` não receberam escrita**. Isso é impedimento ou é independente? |

> ⚠️ **G4 importa mais do que parece.** Se o Agregador virar a fonte do grão, **ele herda o defeito**.
> Um workflow que termina `success` roteando erros para o error-handler é exatamente o modo de falha
> da casa (**R11**), e o Olavo disse que o que mais dói é **dado errado** (B18).

## 4. ETAPA 2 — a pergunta para o Olavo

Uma pergunta, com as consequências escritas. **Não pergunte "o que você prefere?" — sirva as opções.**

> **De onde sai a lista de anúncios que o PHI vai medir?**

| | Opção | O que significa | Consequência |
|---|---|---|---|
| **A** | **Da API** — todos os anúncios das campanhas já cadastradas | o PHI descobre sozinho | nada para cadastrar à mão; volume maior; **muda a entrada** do `sw metricas anuncios` |
| **B** | **Do Notion** — o gestor cadastra o anúncio que quer acompanhar | controle fino | 🔴 depende de alguém lembrar; é **por que a DB tem só 2 anúncios hoje**, ambos da plataforma errada |
| **C** | **Persistir o que o Agregador já busca** | reaproveita consulta que já funciona | 🔴 é **semanal**, e a D1b pediu **diário** — só serve se virar diário |

**Some a isso o que a medição disser.** Se o G1 mostrar que as campanhas ativas têm poucos anúncios,
a conversa é outra; se mostrar dezenas, o custo de API entra na conta.

## 5. Um pedido separado, que não depende da decisão

🔴 **O caminho Meta precisa ser desligado explicitamente.** O `PHI - Subworkflow Campanhas` manda
Meta para um noOp chamado **`Meta Ads — em breve`**, e há **cadastro Meta em produção sem caminho de
ingestão** (o cliente CHA). A D11 adiou a Meta — então o contrato manda **desligar e declarar**, não
deixar o "em breve" no ar (**R12**: estado temporário sem prazo vira permanente invisível).

**Traga a proposta de como desligar** (sticky? nó desabilitado com nota de religar? filtro explícito
com motivo?) — **mas não execute** sem o OK.

## 6. ⛔ Fora do escopo

- **Não conserte** o `IF Gate PMAX` — consertar o sintoma antes de decidir a entrada é trabalho
  jogado fora.
- **Não toque** no `client_config` (é o **ADR-39**, outro sub-chat, em andamento), no score 3× no
  Notion, nem na Prospecção.
- **Não mexa** no `phi_value` nem no ADR-34 — a D1b tirou o grão do score.
- **Não construa nada.** Este brief é medir e perguntar.

## 7. As armadilhas

1. **Nome não é conteúdo.** Esta frente já errou por isso duas vezes em três dias: `sw metricas
   conjuntos` não tem nó de BigQuery nenhum, apesar do nome. **Abra os nós.**
2. **Leia o que está NO AR** — `activeVersion.nodes` (**R13**).
3. 🔴 **Zero nunca é ausência** (M4) — e o as-built achou a quebra **dentro do item**: ele sai com
   `has_data: false` **e mesmo assim** `cost=0, clicks=0, cpa=0`. Hoje não faz estrago porque o item
   não chega ao BigQuery — **mas o mesmo padrão existe no `sw metricas conjuntos`, e lá chega ao
   Notion do gestor.** Se topar com isso, **reporte; não conserte por conta própria.**
4. **Verde não é produção.** Conte os itens que chegam ao nó de escrita (R11 regra 4).
5. **Antes de propor construir, responda por escrito o que já existe** (R7) — e **registre que
   procurou**, senão a próxima sessão procura de novo.

## 8. Registro obrigatório (R3)

Linha na DB Notion **"PHI — Registro de Execuções (Sub-chats)"** ao começar e ao encerrar:
frente `Saúde Digital / Grão de anúncio` · o que foi feito · estado · próximo passo · link.

## 9. O que devolver

1. **As 4 medições**, cada uma com **onde você leu** (workflow + nó, ou tabela + query).
2. **A pergunta da Etapa 2 feita ao Olavo**, e a resposta dele **verbatim**.
3. **A proposta de desligamento do caminho Meta** (§5) — proposta, não execução.
4. **Sua recomendação** entre A, B e C, com o porquê — em primeiro lugar, como manda o brief.
5. **O que o dado desmentiu** (R6, corolário).
6. **Commit no git** na mesma sessão (R2), com o cabeçalho dos documentos atualizado.

## 10. Skills

`n8n-mcp-tools-expert` · `n8n-node-configuration` · `find-skills`.
