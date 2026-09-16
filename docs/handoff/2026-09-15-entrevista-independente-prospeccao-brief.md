# [BRIEF sub-chat] Entrevista independente — frente Prospecção

> **Como usar:** abra um sub-chat **novo e limpo** e cole este arquivo como 1ª mensagem.
> **Modelo recomendado:** Opus. **Repo:** `olavofranzin/phi` · **Branch:** `claude/consolidacao-2026-08`.
> **Idioma com o Olavo:** português simples, sem jargão.

---

## 0. Missão

O chat-mãe já entrevistou o Olavo e desenhou o plano da Prospecção. **Você não vem revisar esse
trabalho — vem procurar o que ele não enxergou.**

> **Seu sucesso não é concordar. É trazer pelo menos um ponto que o plano não considera** — um risco,
> uma dependência, uma pergunta que ninguém fez.

## 1. 🔒 A regra que faz isto funcionar — leia antes de tudo

O plano está em `docs/strategic-planning/prospeccao/PLANO-ENTREGA-FINAL-PROSPECCAO.md`.

**Na Fase 1 você pode ler o documento inteiro, EXCETO as seções §10.2 a §10.6.**

| Pode ler agora | Não abra até a Fase 2 |
|---|---|
| §1 a §9 (o levantamento, o ponto final, as skills, a ordem) | **§10.2** — o dimensionamento que o chat-mãe calculou |
| §10.1 (as respostas do Olavo — são **fatos**, você precisa deles) | **§10.3** — as decisões de desenho que ele derivou |
| | **§10.4, §10.5, §10.6** — as tensões e riscos que ele encontrou |

**Por quê:** §10.1 são os **fatos**; §10.2–§10.6 são as **conclusões**. Se você ler as conclusões
antes, vai concordar com elas — é assim que funciona. Lendo só os fatos, você tem o mesmo material
bruto que ele teve, e dá para comparar a quem cada um chegou.

> **Se você já leu sem querer:** diga isso no relatório. Vale mais um relatório honesto e enviesado do
> que um relatório limpo e falso.

## 2. O que já está decidido (fatos — não rediscuta, não repergunte)

O Olavo já respondeu 12 perguntas em 14/09. **Estão em §10.1.** Em resumo, para você não gastar o
tempo dele repetindo:

- meta de clientes/mês · quem faz o contato · ticket de entrada · escopo da v1
- capacidade diária de contato · como tratar os setores · qual sinal de sucesso medir
- follow-up · canal do 1º contato · tamanho do ciclo · destino de quem não responde

**Não refaça essas perguntas.** Se precisar de um número, leia em §10.1. Você pode **questionar uma
decisão** se achar que ela não se sustenta — mas aí traga o motivo, não a pergunta de novo.

## 3. Fase 1 — a sua entrevista

**Conduza pelo `AskUserQuestion`** (perguntas com opções clicáveis; o Olavo responde rápido).
**Máximo 3 rodadas de até 4 perguntas.** Respeite o tempo dele.

**Regras das perguntas:**
- **Só pergunte o que muda o desenho.** Curiosidade não entra.
- **Nada que esteja respondido nos documentos.** Procure antes (é a **R7**).
- Ofereça opções concretas, com a consequência de cada uma escrita.
- Se recomendar uma, ponha em primeiro e diga por quê.

**Onde costumam morar os pontos cegos de um plano assim** *(são direções de busca, não respostas —
não pergunte sobre todas, escolha as que o material sugerir)*:

| Direção | A pergunta que ninguém faz |
|---|---|
| **Entrega, não só venda** | e depois que vender, quem executa o serviço? |
| **Ponto único de falha** | o que acontece quando a única pessoa que contata fica doente ou viaja? |
| **Jurídico e conformidade** | LGPD, termos de uso das plataformas, dado pessoal em planilha |
| **Quando dá errado** | e se a conta for bloqueada? e se a planilha for perdida? |
| **Manutenção** | quem mantém os workflows depois de prontos? |
| **Custo de oportunidade** | prospecção ativa é o melhor uso desse tempo, comparado a quê? |
| **O lead difícil** | o que fazer com quem responde "quanto custa?" na primeira mensagem |
| **Concorrência e preço** | o preço de entrada é competitivo? contra quem? |
| **O que acontece com o "não"** | o "não" é registrado de forma que ensine alguma coisa? |

⚠️ **Duas destas o chat-mãe já reconheceu ter deixado passar** (LGPD e capacidade de **entrega**).
Pode aprofundar — mas não ganhe o dia só com elas. **Procure as que ninguém citou.**

## 4. Fase 2 — a comparação

**Só depois** de conduzir a sua entrevista e escrever suas conclusões:

1. Abra **§10.2 a §10.6** do plano.
2. Monte a tabela:

| Achado | Chat-mãe | Você |
|---|---|---|
| *(um por linha)* | ✅ / — | ✅ / — |

3. **O que interessa é a terceira coluna:** o que **só você** viu.
4. Se discordar de alguma conclusão dele, diga **por quê**, com o dado.

## 5. Entregável

Escreva `docs/handoff/2026-09-15-entrevista-independente-prospeccao-resultado.md` com:

1. **Suas perguntas e as respostas do Olavo** (na íntegra — vira memória do projeto).
2. **Suas conclusões**, escritas **antes** de abrir §10.2–§10.6.
3. **A tabela de comparação** (§4).
4. **Os pontos novos**, cada um com: o que é · por que importa · o que fazer.
5. **Discordâncias**, se houver.

**Commit no git.** Depois, reporte ao chat-mãe em no máximo 15 linhas: só os pontos novos e as
discordâncias.

## 6. Obrigações

- **R3 — Notion:** ao **começar** e ao **encerrar**, escreva na DB **"PHI — Registro de Execuções
  (Sub-chats)"** (`8d8eb685f66249c7ba4f298d744feec3`): frente · o que foi feito · estado · próximo
  passo · link.
- **R2 — documentação na mesma sessão.** Commit.
- **Você NÃO executa nada.** Não mexe em workflow, planilha, CRM ou BigQuery. **Isto é entrevista e
  análise.** Se descobrir algo que exige ação, **escreva** — não faça.
- **Não gaste o tempo do Olavo.** Máximo 12 perguntas no total. Se 6 bastarem, use 6.

## 7. Fontes

| Documento | Para quê |
|---|---|
| `docs/strategic-planning/prospeccao/PLANO-ENTREGA-FINAL-PROSPECCAO.md` | o plano (**respeite o §1 deste brief**) |
| `docs/strategic-planning/prospeccao/CLAUDE.md` | contexto da frente e armadilhas conhecidas |
| `docs/strategic-planning/prospeccao/CONTRATO-PROSPECCAO.md` | donos por coluna e invariantes |
| `docs/strategic-planning/DEFINICAO-DE-PRONTO-PHI-V1.md` | como o projeto define "pronto" |
| `docs/strategic-planning/ESTADO-DO-PROJETO.md` §0 | onde o projeto está |
| `CLAUDE.md` (raiz) | regras R1–R10 |

> **Um aviso sobre o material:** este projeto já decidiu duas vezes contra a recomendação do chat-mãe,
> e as duas vezes o Olavo estava certo (`id_crm` em vez de `id_odoo`; identidade sem prefixo de
> plataforma). **Discordar aqui é esperado, não é atrito.**
