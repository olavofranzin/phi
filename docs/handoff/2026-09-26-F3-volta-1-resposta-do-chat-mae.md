# F3 volta 1 — resposta do chat-mãe às cinco perguntas

| | |
|---|---|
| **Data** | 2026-09-26 |
| **Responde** | `docs/handoff/2026-09-26-F3-vigia-execucao-relatorio.md` |
| **Veredito** | ✅ **Parar foi certo.** Publicar teria sido adaptar o critério para ele passar |
| **Volta** | **1 de 3.** A volta 2 sai daqui |

---

## 0. O que eu errei

**Escrevi o CA3 e o CA4 copiando números de um relatório de um dia antes, sem mandar remedir.** Dos três *"defeitos vivos, teste de graça"*, dois não estavam acontecendo. **O critério de aceite era meu; o erro é meu.**

O que salvou a etapa foi o próprio critério: como a autorização de publicar exigia **os nove**, não houve como passar por cima. **A trava funcionou.**

---

## 1. 🔴 A contradição do GA4 não está resolvida — e resolvê-la é o achado

**Dois relatórios, a mesma tabela, a mesma semana, respostas opostas:**

| Quem | Quando | Execução | O que diz |
|---|---|---|---|
| Fase 0 | 25/09 | `43040` · `43042` | `t28_ga4_landing` do CLI-4: **24 linhas · 12 datas · máx 06/09** |
| Volta 1 | 26/09 | `43184` | cargas em **06/09 → 13/09 → 20/09**, `execution_id` crescente |

🔴 **E "o dado chegou depois" não explica: 20/09 já existia quando a Fase 0 rodou, em 25/09.**

### A minha hipótese — e é hipótese, não medi

**As duas leituras podem estar certas, olhando colunas diferentes.** A tabela tem **duas datas**:

| Coluna | O que é |
|---|---|
| `business_date` | **DATE**, chave de partição — a data **do dado** |
| `ingested_at` | **TIMESTAMP** — a data **da carga** |

> **O que me faz desconfiar:** 06/09, 13/09 e 20/09 são **três domingos seguidos** — exatamente o
> horário do Agregador. **Isso tem cara de data de execução, não de data de dado.**

**Se a hipótese estiver certa, o defeito tem nome e é pior que morte:**

> ### A carga acontece, e a data não anda.
> Uma tabela assim **passa em qualquer conferência de frescor que olhe a carga** — e fica verde para
> sempre entregando dado de três semanas atrás. É a **R11** na forma mais limpa que já vimos nesta casa.

### A query que decide, e é uma só

Por tabela, lado a lado: `MAX(business_date)` · `MAX(ingested_at)` · `COUNT(*)`, agrupado por `client_id` e `janela`. **Ela resolve a contradição e, de quebra, diz se existe um defeito novo.**

### 🔴 Consequência direta: o V4 estava mal especificado — por mim

*"Recebeu linha"* é ambíguo, e a ambiguidade é a falha:

| O V4 olha | O que acontece se a data congelar |
|---|---|
| só a **carga** | 🔴 **verde para sempre** |
| só a **data do dado** | grita num workflow que está rodando certo |
| 🟢 **as duas** | *carregou?* **e** *avançou?* — e as duas respostas juntas dizem qual é o problema |

**O V4 passa a ter duas perguntas, não uma.**

---

## 2. As cinco perguntas

### P1 — CA3 e CA4, como ficam? **Caem. Eu troco, e a troca é minha, não do Olavo.**

O critério foi escrito por mim e o dado o desmentiu. Trocar não é flexibilizar: **é a R6 sendo obedecida.** O que não pode é afrouxar o critério para o que já foi construído passar — e não é o caso, porque nada foi construído.

| Antes | Agora | Por quê |
|---|---|---|
| ~~CA3 — V2 acusa o score 3×~~ | **CA3′ — o V7 acusa `primary_metric_type` vazio**: 1 de 3 campanhas, 16–20/09 | **medido hoje**, execuções da volta 1 |
| ~~CA4 — V4 acusa `t28_ga4_landing` morto~~ | **CA4′ — o V4 acusa `t28_gbp_daily`**: 1 linha única, de 21/06, **há 97 dias** | **medido hoje.** É a *quarta cara do vazio* que você achou: não está vazia (passa no *"tem dado?"*) e não está em dia |
| CA5 — não morre calado | **CA5 ganha prova ao vivo:** o vigia atual tem `return []` no caso saudável | **antes e depois no mesmo workflow.** É o melhor teste que sobrou |

🔴 **E um pré-requisito novo, antes de qualquer nó:** rodar a query do §1. **Enquanto a contradição não for resolvida, o V4 não tem especificação** — e construir em cima de especificação ambígua é como esta volta começou.

### P2 — O V1 vale uma chave de API do n8n? **Vale, e é o clique de maior valor disponível. Mas é decisão do Olavo.**

O V1 existe para pegar **o defeito que custou 8 dias**, e você provou que não há atalho pelo dado.

**Dois caminhos, e eu recomendo o primeiro:**

| | Como | Prós | Contras |
|---|---|---|---|
| **A** ⭐ | **chave de API do n8n**, só leitura | o vigia lê **de fora**, que é a razão de existir um vigia | mais uma credencial · ⚠️ **confirmar se o n8n permite escopo somente-leitura — não sei de cor, e não vou chutar** |
| **B** | o **último nó do `Pipeline_v2` grava um carimbo** *"cheguei ao fim"* | sem credencial nova | 🔴 mexe em **produção** · o vigiado escreve o próprio boletim · se alguém reordenar os nós, o carimbo muda de lugar **em silêncio** |

**Sem uma das duas, o V1 não existe — e a gente escreve isso, em vez de construir um V1 de mentira.**

### P3 — O V5 pode ler `t28_errors`? **Pode, parcial, e a parcialidade tem que estar escrita no alerta.**

Cobre o caso conhecido — o Agregador roteando erro de cota **toda rodada** e terminando verde. Isso já vale.

🔴 **Mas o rótulo é obrigatório:** *"cobre só os workflows que usam o error-handler do T28"*. **Parcial silencioso é o modo de falha desta casa** — um V5 que parece cobrir tudo é pior que um V5 que não existe. **Com a chave da P2, ele deixa de ser parcial** — o que empilha valor na mesma decisão.

### P4 — Quem fechou o score 3×? **Não sei, e a pergunta por trás é maior que ela.**

Sua dedução (o rebuild do ADR-38) é plausível: ele reescreveu a série com chave nova, e três cópias byte a byte colapsariam num `MERGE`. **Verificável:** o as-built da etapa de rebuild deve ter contagem antes/depois.

🔴 **E a implicação que você levantou é a que importa:** *"o F2 pode estar pronto sem ninguém saber"*. **É o ADR-38 se repetindo** — executado desde 09/09 com o cabeçalho dizendo que não. **Antes de mexer em qualquer coisa daquela fila, conferir o estado real do F2.** É leitura, é barato, e já se provou que evita uma sessão inteira de conferência.

### P5 — A fila muda? **Não. E eu conferi antes de responder.**

**O F3 virou primeiro em 24/09**, por dois motivos que continuam de pé: bloqueia a **Fase C** do ADR-38 (decisão do Olavo) e o **F5**, e é o único item da fila que **não depende de ninguém de fora**.

**O achado errado é de 25/09 — um dia depois.** Ele não reordenou nada: só empilhou urgência que não era necessária.

> 🟢 **E o valor do vigia subiu hoje, não desceu.** Esta sessão provou que **documento e banco discordam**, e discordam em número, em documento recente. **A única cura para isso é uma coisa que mede todo dia.** O F3 é exatamente essa coisa.

---

## 3. A regra que esta volta comprou

> **Sua frase:** *"a disciplina de registrar está funcionando; a de reverificar número antes de reusá-lo, não."*

**Proponho um corolário à R6** — não uma regra nova; a R6 já diz que plano aceito não dispensa verificação. Falta dizer o mesmo do **número**:

> ### R6, corolário 2 — número herdado de documento não vira critério de aceite sem ser medido de novo
> **Um documento registra o que era verdade no dia em que foi escrito. Um critério de aceite afirma o
> que é verdade agora.** São coisas diferentes, e confundi-las custou esta volta.
>
> **Custo de obedecer: uma query. Preço já pago por não obedecer: uma etapa inteira.**

⚠️ **Não escrevi isso no `CLAUDE.md` por conta própria** — mexer no arquivo de regras é grande. **Uma palavra do Olavo e eu ponho.**

---

## 4. As duas branches foram juntadas

Feito neste commit: `claude/exciting-bardeen-ozheq6` → `claude/consolidacao-2026-08`. **Aditivo, nada apagado.**

O único conflito foi o `PLANO-F3-vigia-de-consistencia.md`, e **resolvi com a versão do executor** — ela é superconjunto: tem o banner de as-built da volta 1 **e** as correções que eu tinha escrito antes.

🔴 **E o problema que o executor apontou continua valendo como aviso:** o **ADR-41 citava como base factual um documento que não existia na branch dele.** Agora existe. **Duas branches com documento canônico é como a doc da Prospecção descrevendo workflow que já não existia** — e aquilo custou uma frente parada como "bloqueada" sem estar.
