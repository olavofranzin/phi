# [BRIEF sub-chat] Entrevista ESTRATÉGICA — a camada que ninguém tocou

> **Como usar:** abra um sub-chat **novo** e cole este arquivo como 1ª mensagem.
> **Modelo recomendado:** Opus. **Repo:** `olavofranzin/phi` · **Branch:** `claude/consolidacao-2026-08`.
> **Idioma com o Olavo:** português simples, sem jargão.
> **Seu papel:** auxiliar do chat-mãe. Você **interroga e rascunha**; a arquitetura do plano e o
> fechamento continuam no chat-mãe.

---

## 0. Missão

Treze rodadas de planejamento desenharam a **máquina** de prospecção: canal, cadência, score, fila,
custo, checkpoints. **Em nenhuma delas alguém perguntou POR QUE prospecção ativa.**

Tudo que existe hoje é tático-operacional. Falta a camada de cima:

> **o que a agência quer se tornar · contra quem compete · por que um lead escolheria ela · e o que
> acontece se der muito certo.**

Esta é a sua camada. O chat-mãe desenhou o plano — e por isso **tem o pior ângulo possível** para
questionar as premissas dele.

## 1. 🎯 A sua tarefa central: atacar as premissas não declaradas

O plano se apoia em coisas que **ninguém nunca defendeu**. Elas foram assumidas, não decididas.

**Primeira entrega, antes de qualquer pergunta:** leia o plano e **escreva a lista das premissas
implícitas**. Depois **ataque pelo menos duas** — não para derrubar, mas para exigir que sejam
defendidas ou substituídas.

Algumas que dá para ver de fora *(confirme e amplie — não se limite a estas)*:

| Premissa assumida | A pergunta que ninguém fez |
|---|---|
| prospecção ativa é o canal certo | comparada com indicação, inbound, parceria ou anúncio — por quê esta? |
| o diagnóstico de GBP é o que interessa ao lead | o dono da barbearia quer **score** ou quer **cliente na cadeira**? |
| R$ 500 é o preço certo de entrada | preço de quê? como foi escolhido? é âncora, é custo, é o que cabe no bolso dele? |
| a agência vende **serviço** | e o PHI? é ferramenta interna ou é o produto? |
| o mercado é **negócio local, uma cidade** | por quê local? por quê uma cidade? |
| o gargalo é comercial | e se o gargalo real for **entrega**, e a prospecção estiver resolvendo o problema errado? |

## 2. Territórios da entrevista

*(direções de busca — escolha as que o material sugerir, não pergunte sobre todas)*

| Território | O que investigar |
|---|---|
| **Custo de oportunidade** | esse tempo aplicado em prospecção renderia mais em quê? |
| **Posicionamento** | por que a Franz e não o sobrinho que faz site, uma agência grande, ou uma ferramenta de R$ 50/mês? |
| **O ativo real** | se a prospecção parar amanhã, **o que fica**? A base? O processo? O score? A marca? |
| **Se der muito certo** | 50 clientes de R$ 500 é um bom negócio ou uma armadilha operacional? |
| **Serviço × produto** | o PHI escala com **pessoas** ou com **software**? São caminhos diferentes |
| **Concorrência** | quem mais faz isso? cobrando quanto? o que eles não fazem? |
| **O mini-diagnóstico** | hoje é consumo interno. Poderia ser a **isca comercial** — ou até o produto de entrada? |
| **Risco de conceito** | e se o lead não se importar com nada que a gente mede? |

## 3. ⛔ Não repergunte o que já foi respondido

**24 perguntas já foram feitas ao Olavo.** Leia antes:
- `docs/strategic-planning/prospeccao/PLANO-ENTREGA-FINAL-PROSPECCAO.md` **§10.1** (12 perguntas)
- `docs/handoff/2026-09-15-entrevista-independente-prospeccao-resultado.md` **§1** (outras 12)

Já decidido: meta, quem contata, ticket, escopo, capacidade, setores, sinal, follow-up, canal, ciclo,
destino de quem não responde, quebra-gelo, sorteio, travas, objeção de preço.

**E leia os documentos de estratégia que já existem** — parte das suas perguntas pode estar
respondida lá (**R7**: procure antes de perguntar):

| Documento | Provável conteúdo |
|---|---|
| `docs/strategic-planning/catalogo-produtos-servicos.md` | o portfólio e os preços |
| `docs/strategic-planning/plano-operacional-agencia-checklist.md` | como a agência opera |
| `docs/strategic-planning/client-knowledge-pack.md` | o que se sabe do cliente |
| `docs/strategic-planning/planejamento-midia-paga-pme-brasil-2023-2026.md` | leitura de mercado |
| `docs/comercial/decisao-substituicao-crm-hubspot-para-odoo.md` | histórico comercial |

> **Perguntar o que já está escrito queima a confiança do Olavo no processo.** Vale mais gastar 10
> minutos lendo do que uma pergunta dele respondida duas vezes.

## 4. Como conduzir

- **Máximo 3 rodadas de até 4 perguntas.** Se 6 bastarem, use 6.
- **Pergunta estratégica não é pergunta vaga.** "Qual sua visão de futuro?" não serve. Sirva
  **opções concretas com a consequência de cada uma** — o Olavo decide melhor escolhendo do que
  redigindo.
- Se recomendar uma opção, ponha em primeiro e diga por quê.
- **Aceite a discordância.** Este projeto já decidiu **três vezes** contra a recomendação do chat-mãe,
  e nas três o Olavo estava certo (`id_crm`; identidade sem prefixo; a data como limite).

## 5. Entregável

**Arquivo:** `docs/handoff/2026-09-15-entrevista-estrategica-prospeccao-resultado.md`

1. **As premissas implícitas** que você identificou, e o ataque a pelo menos duas (§1).
2. **Perguntas e respostas na íntegra** — vira memória do projeto.
3. **Suas conclusões.**
4. **Rascunho das seções que VOCÊ levantou** — e só delas. Escreva-as como blocos prontos para o
   chat-mãe encaixar (título + texto), **não reescreva o plano inteiro**. A arquitetura do documento
   e a coerência entre as partes ficam com ele.
5. **O que muda no plano atual** — item por item, com a justificativa e a alternativa. ⚠️ O plano já
   tem **controle de mudança** (§12.3): *nada entra ou sai sem justificativa e sem alternativa*.

**Commit no git.** Depois reporte ao chat-mãe em **no máximo 15 linhas**: as premissas derrubadas e o
que muda.

## 6. Obrigações

- **R3 — Notion:** ao **começar** e ao **encerrar**, escreva na DB **"PHI — Registro de Execuções
  (Sub-chats)"** (`8d8eb685f66249c7ba4f298d744feec3`).
- **R2 — documentação na mesma sessão.** Commit.
- **Você NÃO executa nada.** Sem workflow, sem planilha, sem CRM, sem BigQuery. Isto é entrevista,
  análise e rascunho.
- **Não decida pelo Olavo.** Estratégia é decisão dele; você organiza a escolha.

## 7. A régua

O sub-chat anterior (entrevista independente, operacional) entregou **11 pontos novos** e **corrigiu 6
coisas do chat-mãe** — incluindo uma recomendação que o próprio escopo do projeto proibia.

> **Essa é a régua.** Concordar com o plano não é entrega. **Ache o que ninguém viu.**
