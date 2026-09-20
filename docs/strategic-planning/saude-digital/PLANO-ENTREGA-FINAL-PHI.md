# Plano da Entrega Final — PHI (Saúde Digital)

| | |
|---|---|
| **Status** | 🟡 **ESQUELETO** — 2026-09-20. **Os §1 e §2 são do Olavo e estão em branco de propósito** |
| **Papel** | **Documento-base do planejamento da frente.** Trabalha junto com o `CLAUDE.md` e o `CONTRATO-PHI.md` |
| **Método** | Desenhar o **ponto final** primeiro; depois **engenharia reversa** até o que existe hoje |
| **Precedente** | `prospeccao/PLANO-ENTREGA-FINAL-PROSPECCAO.md` — a frente-piloto. Mesma forma, outra frente |
| **Por que agora** | o parque tem **as-built completo** (20/09) e **contrato com 11 decisões**. Falta a pergunta que ordena tudo: **para quê** |
| **Regra que o rege** | **R7** — nada se cria sem plano pronto |

---

## 0. Por que este documento precisa existir

A varredura do parque respondeu **o que cada workflow faz**. Não respondeu **se ele deveria existir** —
e essa é a pergunta que o contrato transformou em invariante:

> **M11 — todo dado escrito tem consumidor declarado. Tabela sem leitor é custo, não ativo.**

**O M11 não é aplicável hoje**, porque ninguém escreveu qual é a entrega final. Sem isso, *"quem lê
`workflow_execution_log`?"* não tem resposta possível: não há régua.

**Foi o que aconteceu com `raw_ad_data`** — três meses de escrita diária para uma tabela que ninguém
lia, e o defeito era invisível porque não havia contra o que comparar.

---

## 1. O que existe hoje — ✍️ **a escrever pelo Olavo**

> *Preservar a redação dele, como no plano da Prospecção.*
> O que a agência entrega hoje aos clientes na gestão de tráfego: o que o cliente recebe, com que
> frequência, e o que dá trabalho fazer.

⬜ *em branco*

## 2. O que poderemos fazer — ✍️ **a escrever pelo Olavo**

> O que o PHI deveria permitir que hoje não é possível.

⬜ *em branco*

---

## 3. O que as decisões já revelam sobre o ponto final

*(derivado do `CONTRATO-PHI.md` §6 e do as-built — **é pista, não é o ponto final**)*

| Pista | De onde vem | O que sugere |
|---|---|---|
| O grão de anúncio tem **três** consumidores: tela do Notion · T28 · **relatório para o cliente** | D1b | **O PHI tem entregável externo.** Não é só ferramenta interna |
| O que acorda o Olavo é **número errado no Notion** — *"porque ele age em cima dele"* | D10 | **O Notion é a bancada de trabalho**, não um relatório. A superfície é operacional |
| O que mais dói é **dado errado**, não dado que falta | B18 | O ponto final é sobre **confiança**, não sobre cobertura |
| *"Quero o anúncio culpado"* | B1 | A entrega não é diagnóstico genérico — é **apontar o responsável pelo desvio** |
| O PHI **detecta e orienta, nunca executa** | princípio central | O ponto final inclui um **humano que dá o play** |
| O score é **fato**, não opinião | ADR-003 | Há uma fronteira dura entre **medir** e **interpretar** |

> **Tensão registrada:** o Olavo elegeu o **grão de anúncio** (dado que falta) para os 15 dias, mas
> diz que o que dói é **dado errado**. As duas foram mantidas por ele quando reperguntado. Isso só se
> resolve quando o §1 e o §2 existirem.

## 4. O ponto final — ⬜ **a escrever depois da entrevista**

> Formato do precedente: uma lista curta de critérios em linguagem de negócio, não de sistema.
> *"Prospecção pronta"* virou **8 critérios**. *"PHI pronto"* provavelmente vira 5 a 8.

⬜ *aguarda §1, §2 e a entrevista do §6*

## 5. A engenharia reversa — a pergunta única

Escrito o §4, **cada um dos ~26 workflows ativos responde a uma pergunta só**:

> ### *"Que pedaço do ponto final você serve?"*

| Resposta | Destino |
|---|---|
| **Serve** | fica, e **ganha descrição dizendo qual pedaço** (R5) |
| **Servia, e outro assumiu** | aposentadoria pela **R5** (5 passos) |
| **Nunca serviu** | apagar — é o caso dos templates importados (D8) |
| **Deveria servir e não serve** | é **defeito**, e vira brief |

⚠️ **Esta é a etapa que o parque não pôde fazer em 20/09.** O as-built classificou por camada
técnica — ingestão, cálculo, entrega, vigilância, consumo. **Camada técnica não decide existência;
só a entrega final decide.**

## 6. As perguntas que faltam — a dívida declarada da entrevista de 20/09

A entrevista do parque respondeu **11 decisões** e deixou **8 perguntas sem resposta**. Lidas juntas,
elas não são detalhes soltos: **são exatamente as perguntas do propósito.**

| # | Pergunta | Por que ela define o ponto final |
|---|---|---|
| **B5** | O PHI é **ferramenta interna** ou **o produto que se vende**? | muda tudo: interface, confiabilidade exigida, quem paga |
| **B4** | Quantos clientes **hoje**, e quantos em **30/11**? | 1 cliente e 20 clientes são arquiteturas diferentes |
| **B7** | Quando um alarme chega, **o que você faz**? Qual você já **ignorou**? | alarme ignorado é alarme que não deveria existir |
| **B8** | **Quantos alarmes por dia** é demais? | define o orçamento de atenção, que é o recurso mais escasso |
| **B9** | Se o PHI ficasse **3 dias sem rodar**, você perceberia? Por qual sinal? | a resposta honesta mede o valor real percebido |
| **B12** | Os workflows merecem **prefixo de nome**? | hoje não dá para olhar a lista e saber o que é PHI |
| **B19** | Há **orçamento de API**? | o grão de anúncio multiplica chamadas |
| **B22** | O que você **já tentou consertar e desistiu**? | costuma ser onde o ponto final está mal desenhado |

> **A B5 é a raiz.** Todas as outras mudam de resposta conforme ela.

## 7. Controle de mudança (herdado do precedente §12.3)

Fechado o §4: **nada entra ou sai sem justificativa e pelo menos uma alternativa. Se algo entra,
algo sai.** Foi o que impediu a Prospecção de crescer sem fim.
