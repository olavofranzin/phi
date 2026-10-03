# [BRIEF] Entrevista de alinhamento — antes de construir o PROSP-05/06 → Odoo

> **Para quem:** o sub-chat que já está com o brief `2026-09-13-prosp05-prosp06-odoo-subchat-brief.md`.
> **Cole isto como próxima mensagem nele.** Não abra sessão nova.
> **Antes de escrever qualquer nó.** Se já começou a cabear, **pare e faça isto primeiro.**

---

## 0. Missão — duas entregas

1. **Entrevistar o Olavo** sobre as decisões que, se não forem feitas agora, **você fará sozinho e em
   silêncio** — e que viram invariante depois, quando já custam caro desfazer.
2. **Escrever o critério de aceite ANTES de construir.**

> **Por que agora:** é a **R9**. E o item 4 dela — *"o critério de aceite é escrito antes"* — é o
> **único pedaço da regra que este projeto ainda não pratica**. Está escrito no `CLAUDE.md` que é o
> buraco em aberto. **Você é o primeiro a fechá-lo.**

Já fizemos isso três vezes no planejamento (alinhamento, entrevista independente, entrevista
estratégica). As três acharam coisa que ninguém tinha visto — inclusive erros do chat-mãe. **Esta é a
mesma disciplina, aplicada à execução.**

## 1. ⛔ O que NÃO reperguntar

Muita coisa já está decidida. **Leia antes:** o **§12** do seu brief, o `PLANO-ENTREGA-FINAL-PROSPECCAO.md`
(**FECHADO** desde 15/09) e o `CONTRATO-PROSPECCAO.md`.

Decidido e fora de discussão: oferta e preço · cidade · canal do 1º contato · 4 toques provisórios ·
piloto de 10–20 leads · sorteio por regra fixa · quem escreve cada coluna · `id_crm` como junção ·
`place_id` como chave · cadência para na resposta.

> **Perguntar o que já está escrito queima a confiança do Olavo no processo.** Já aconteceu aqui com o
> `score_tecnico`. Gaste 15 minutos lendo antes de gastar uma pergunta dele.

## 2. As decisões que você tomaria em silêncio

*(direções de busca — escolha as que o código sugerir; **não pergunte sobre todas**)*

| # | Território | A pergunta que ninguém fez |
|---|---|---|
| **1** | 🔴 **Conflito de escrita** | o humano corrigiu o telefone **no CRM**; a planilha ainda tem o antigo. Na próxima rodada, **quem vence?** Isto é o problema dos dois writers reaparecendo num lugar novo |
| **2** | **Lead em estágio avançado** | um lead em "Proposta" ainda recebe atualização dos campos GBP pelo robô? E um lead **perdido**? O módulo já diz que **deal fechado é imutável para a IA** — e o que está **em andamento**? |
| **3** | **Falha parcial** | são 20 leads e 3 falham. Continua os 17 e reporta, ou para tudo? E os 3 — **ficam num lugar visível** ou somem no log? |
| **4** | **Odoo fora do ar** | o PROSP-05 roda e o Odoo não responde. Repete? Enfileira? Perde em silêncio? ⚠️ `onError: continueRegularOutput` foi o que **escondeu** a quebra do `id_hubspot` por semanas |
| **5** | **Idempotência** | rodar a mesma carga **duas vezes** produz o quê? Um lead, dois, ou um com dado sobrescrito? |
| **6** | **Dono do lead no Odoo** | todo lead nasce com qual `user_id`? Sem dono, ele some das telas que filtram por responsável |
| **7** | **Backfill × contínuo** | é o **mesmo** workflow nos dois modos (decisão herdada do F3). **Como ele sabe em qual está?** E o que muda entre os dois? |
| **8** | **Campo vazio × campo ausente** | o **I3** diz: não observado grava **vazio, nunca 0**. No Odoo, `Integer` **não tem nulo** — vira 0. **Como o 0 honesto se distingue do 0 falso?** *(o módulo `phi_crm` já enfrentou isso — leia o README dele antes de perguntar)* |
| **9** | **A volta do `id_crm`** | o Odoo criou o lead e a escrita do `id_crm` na planilha falha. O lead existe no CRM e a planilha não sabe. **Na próxima rodada vira duplicata?** |

🔴 **O nº 1 é o mais perigoso.** Não é bug: é **contrato**. Se o robô sobrescrever o que o humano
corrigiu, o time deixa de confiar no CRM — e um CRM em que não se confia volta a ser planilha.

## 3. A segunda entrega: o critério de aceite

**Antes de cabear**, escreva **o que vai ser verificado no fim** — e mostre ao Olavo.

Cada critério precisa de **três coisas**: o que se testa · **como** se testa · **qual resultado passa**.

Exemplo do formato (não copie o conteúdo, é só a forma):
> **CA1 — não duplica.** Rodar a carga do mesmo lead 2×. **Passa se:** 1 lead no Odoo, `gbp_place_id`
> único, `id_crm` igual nas duas rodadas.

Cubra pelo menos: **não duplica** · **não apaga dado alheio** · **falha aparece** (nada de erro mudo) ·
**`id_crm` volta à planilha** · **desfecho volta pelo P6** · **nenhum campo escrito pelos dois lados**.

> **Regra do critério de aceite:** se um critério não puder ser testado com um comando ou uma tela,
> **ele não é critério — é desejo.** Reescreva.

## 4. Como conduzir

- `AskUserQuestion` ou texto — o Olavo prefere **conversa**; adapte-se a ele.
- **Máximo 3 rodadas de até 4 perguntas.** Se 6 bastarem, use 6.
- **Opções concretas, com a consequência de cada uma escrita.** Ele decide melhor escolhendo do que
  redigindo.
- Recomendou alguma? Ponha em primeiro e diga por quê.
- **Discordar é esperado.** Este projeto já decidiu **quatro vezes** contra a recomendação do
  chat-mãe, e nas quatro o Olavo estava certo.

## 5. Entregável

`docs/handoff/2026-09-16-entrevista-execucao-prosp05-06-resultado.md`:

1. **Premissas técnicas implícitas** do seu brief — e o ataque a pelo menos duas.
2. **Perguntas e respostas na íntegra.**
3. **O critério de aceite completo** (§3).
4. **O que muda** no brief ou no `CONTRATO` — cada item com **justificativa e alternativa**
   (o plano está **FECHADO**; §12.3).

**Commit no git.** Depois reporte ao chat-mãe em **≤15 linhas**: decisões novas e o que mudou.

**Só então comece a construir.**

## 6. Obrigações

- **R3 — Notion** (`8d8eb685f66249c7ba4f298d744feec3`): ao começar e ao encerrar.
- **R2** — doc na mesma sessão. Commit.
- **Não ativar/executar workflow sem OK de budget do Olavo.**
- **I2** — nunca `appendOrUpdate`. **I4** — `place_id` é a chave, nome nunca. **I8** — P5 escreve no
  CRM, P6 só lê. **I11** — o lead é `crm.lead`, nunca Company.
- **Nesta etapa você não constrói.** Entrevista, critério de aceite, e o OK do Olavo.

## 7. A régua

Os três sub-chats anteriores de entrevista entregaram, somados, **mais de 20 pontos novos** e
**corrigiram 8 coisas do chat-mãe** — incluindo uma recomendação que o próprio escopo do projeto
proibia e um número aceito que não era preço de nada.

> **Concordar com o brief não é entrega. Ache o que ninguém viu — inclusive no seu próprio brief.**
