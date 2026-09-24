# [BRIEF sub-chat] Reformular o entendimento de PHI e Saúde Digital

> **Como usar:** abra um sub-chat **novo** e cole este arquivo como primeira mensagem.
> **Modelo:** Opus. **Repo:** `olavofranzin/phi` · **Branch:** `claude/consolidacao-2026-08`.
> **Idioma com o Olavo:** português simples, sem jargão.
> **Seu papel:** **estudar e mapear.** Não construir, não alterar nada.

---

## 0. Por que você existe

O Olavo parou a etapa 8 do ADR-38 e disse:

> *"É preciso reformular tudo o que entendemos sobre o PHI e a Saúde Digital."*

**O motivo está em `saude-digital-do-negocio/fundamentos-presenca-digital.md`:** o material descreve
**8 pilares somando 100**, e o PHI hoje mede **uma fatia de um deles** — a parte paga do pilar
"Aquisição", peso 15.

**Isto não é uma correção de rota. É descobrir que o mapa era maior do que a parte que estava
desenhada.**

## 1. 🔴 As cinco regras desta frente

| # | Regra |
|---|---|
| **1** | **Não altere nada que está no ar.** Nenhum workflow, nenhuma tabela, nenhuma coluna. **Nem para melhorar.** |
| **2** | **Não altere os documentos que descrevem o que existe** — `CONTRATO-PHI.md`, ADR-37/38/39/40, `DEFINICAO-DE-PRONTO`. Eles são o retrato do presente e continuam válidos. **Você escreve na pasta nova.** |
| **3** | **Nada aqui é decisão até virar ADR aprovado pelo Olavo** (R7). Mapa, comparação e proposta — sim. Spec de construção — não. |
| **4** | 🔴 **O escopo explode se você deixar.** 8 pilares × 10 dimensões × dezenas de métricas. **O PHI v1 tem data: 30/11/2026.** Toda vez que escrever algo novo, responda: *isso é v1, é depois, ou é nunca?* |
| **5** | **Procure antes de propor** (R7). Boa parte do que o material pede **já existe em algum lugar da casa** — e descobrir isso vale mais que desenhar de novo. |

**E as R1–R13 do `CLAUDE.md` da raiz valem integralmente.** Leia-as: elas foram escritas a partir de
erros que custaram semanas, e **a R11 (sucesso silencioso) e a R13 (o rascunho mente) são as que mais
pegam nesta casa.**

## 2. Leia nesta ordem

| # | Documento | Para quê |
|---|---|---|
| 1 | `saude-digital-do-negocio/fundamentos-presenca-digital.md` | **o material novo** |
| 2 | `saude-digital-do-negocio/README.md` | a leitura preliminar do chat-mãe — **confirme ou derrube** |
| 3 | `saude-digital/PLANO-ENTREGA-FINAL-PHI.md` | **as 4 razões de o PHI existir e os 8 critérios (F1–F8)**, escritos com o Olavo em 20–21/09 |
| 4 | `strategic-planning/DEFINICAO-DE-PRONTO-PHI-V1.md` | os 14 critérios do v1 e a data |
| 5 | `strategic-planning/regras-otimizacao-metodo-subido.md` | **o método de otimização do Olavo** — a cadeia do funil do §6 é a régua do diagnóstico |
| 6 | `strategic-planning/catalogo-produtos-servicos.md` | o que a agência vende hoje |
| 7 | `prospeccao/CONTRATO-PROSPECCAO.md` §3 | **as 63 colunas da planilha de leads** — veja quantas são presença digital |
| 8 | `saude-digital/CONTRATO-PHI.md` | o que existe e é lei hoje (**não altere**) |
| 9 | `CLAUDE.md` da raiz | R1–R13 |

> ⚠️ **O `ESTADO-DO-PROJETO.md` tem 190 mil caracteres e ninguém consegue lê-lo.** Já está registrado
> como defeito. **Não tente.** Se precisar de algo dele, procure por trecho.

## 3. A primeira entrega — e é só isso

**O MAPA: o que o material cobre × o que a casa já tem.**

Uma tabela por **pilar** (os 8) e por **dimensão** (as 10), respondendo para cada:

| Coluna | O que responder |
|---|---|
| **existe hoje?** | sim / parcial / não |
| **onde** | workflow, tabela, coluna, skill, documento — **com nome** |
| **quem consome** | ou "ninguém" |
| **é v1, é depois, ou é nunca?** | sua leitura, para o Olavo confirmar |

🔴 **Pare aí e devolva.** Não desenhe índice novo, não proponha score novo, não escreva spec.
**O mapa é que diz se a reformulação é grande ou pequena** — e ninguém sabe isso ainda, nem o
chat-mãe.

## 4. Duas hipóteses do chat-mãe — para você atacar, não para aceitar

**Ataque-as. Se caírem, a queda vale mais que a confirmação** (R6, corolário).

### H1 — as duas frentes são duas metades da mesma coisa

A **Prospecção** já diagnostica presença digital: GBP, reviews, site, fotos, horário. Só que **de
leads, para vender**. A **Saúde Digital** diagnostica **de clientes, para entregar**.

> Se for verdade, **o `potencial_comercial` e o `phi_value` medem coisas da mesma família em momentos
> diferentes do funil** — e a casa tem dois scores que nunca se olharam.
>
> ⚠️ **Mas o `CLAUDE.md` avisa em letras garrafais que são coisas diferentes**, e esse aviso nasceu
> de confusão real. **Leve a sério antes de concordar comigo.**

### H2 — nada do que foi construído é desperdício

O trabalho das últimas semanas — writers canônicos, identidade neutra, contrato, vigias — **é o pilar
"Dados, automação e governança" inteiro** (peso 10). Muda de lugar no mapa, não de valor.

> **Se isso for falso, o Olavo precisa saber agora.**

## 5. As três coisas que o material diz e a casa não faz

Aponte-as no mapa, sem resolver:

1. 🔴 **"Conversão e atendimento" pesa 20 — o maior de todos.** O PHI não toca nisso. O CRM Odoo toca
   em parte. **Tempo até a primeira resposta**, taxa de comparecimento, reativação: nada disso é
   medido.
2. 🔴 **A jornada tem vazamentos, e o material diz que eles importam mais que a nota.** *"Gera leads,
   mas demora para responder"* é um vazamento. **O PHI hoje dá nota, não acha vazamento.**
3. 🔴 **"A auditoria deve realizar testes reais"** — abrir o site no celular, enviar formulário,
   **verificar se o contato chega ao CRM**. Isso é o oposto de ler API. **A casa nunca fez isso.**

## 6. ⛔ Fora do escopo — e é a maior parte

Não toque: Prospecção em produção · o parque PHI · o ADR-39+40 (em execução por outro sub-chat) ·
a etapa 8 do ADR-38 (**parada por decisão do Olavo**) · o CRM Odoo · qualquer credencial.

**Não crie:** workflow, tabela, coluna, skill, agente — **nada.**

## 7. Registro obrigatório (R3)

Linha na DB Notion **"PHI — Registro de Execuções (Sub-chats)"** ao começar e ao encerrar:
frente `Saúde Digital do Negócio / reformulação` · o que foi feito · estado · próximo passo · link.

## 8. Como falar com o Olavo

- **Rodadas de até 6 perguntas**, com **opções concretas e a consequência de cada uma** — ele decide
  melhor escolhendo do que redigindo.
- **Separe o que leu do que deduziu.** Escreva "deduzo que" quando for dedução — o chat-mãe trata as
  duas de forma diferente.
- 🔴 **Escolha de opção não é redação dele.** Se ele marcar uma alternativa que você escreveu, **a
  definição continua sendo sua** — não a cite como palavra dele num documento normativo. *(Esta
  lição é de 22/09, e quem errou foi o chat-mãe.)*
- **Aceite a discordância.** Este projeto já decidiu **cinco vezes** contra a recomendação do
  chat-mãe, e nas cinco o Olavo estava certo.
