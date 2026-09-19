# [BRIEF sub-chat] Parque PHI — entrevista de alinhamento + as-built do contrato

> **Como usar:** cole este arquivo como **primeira mensagem** de um sub-chat.
> **Modelo:** Opus. **Repo:** `olavofranzin/phi` · **Branch:** `claude/consolidacao-2026-08`.
> **Idioma com o Olavo:** português simples, sem jargão.
> **Seu papel:** você **lê, mede e pergunta**. A arquitetura e o fechamento continuam no chat-mãe (**R1**).

---

## 0. Missão, em uma frase

**Fazer com o parque PHI o que o `CONTRATO-PROSPECCAO` fez com a Prospecção** — mas na ordem certa:
**entrevista antes de contrato**, não depois.

Na Prospecção a entrevista chegou três dias depois do início da construção, e **quatro das nove
perguntas já tinham sido respondidas por incidente**. *Entrevista atrasada não é entrevista — é
autópsia.* Esta é a **R9** sendo praticada como deve.

O chat-mãe já escreveu o rascunho. **Ele tem ~25 células marcadas ❓, e a sua tarefa é apagar todas.**

## 1. O que já está escrito (leia nesta ordem, antes de qualquer coisa)

| # | Documento | O que é |
|---|---|---|
| 1 | `docs/strategic-planning/saude-digital/CLAUDE.md` | contexto da frente · invariantes · armadilhas |
| 2 | `docs/strategic-planning/saude-digital/CONTRATO-PHI.md` | **o rascunho v0.1** — é ele que você vai completar |
| 3 | `docs/strategic-planning/saude-digital/panorama-workflows-phi.md` | os 81 workflows classificados em 5 camadas |
| 4 | `docs/handoff/2026-09-18-achado-parque-workflows-sem-producao.md` | os 2 ativos que não produzem nada |
| 5 | `docs/handoff/2026-09-08-consolidacao-writers-lote1-inventario.md` | a única leitura nó a nó que já existe |
| 6 | ADR-37 e ADR-38 (`saude-digital/adr-rascunhos/`) | as duas decisões que já são lei |
| 7 | `CLAUDE.md` da raiz | **R1–R13** — valem integralmente |

> **R7 na prática:** antes de perguntar qualquer coisa ao Olavo, procure a resposta nesses sete.
> **Pergunta cuja resposta já está escrita queima a confiança dele no processo.**

## 2. A ordem do trabalho

```
ETAPA 1 — LEITURA      você responde sozinho as ~30 perguntas do §4 (as-built)
ETAPA 2 — ENTREVISTA   leva ao Olavo só as 22 do §5 (decisão), em rodadas de até 6
ETAPA 3 — AS-BUILT     preenche o §4 do CONTRATO-PHI com o que LEU
ETAPA 4 — DECISÕES     registra D1..D6 do §6 com a resposta do Olavo
ETAPA 5 — DEVOLVE      relatório ao chat-mãe (§8)
```

🔴 **Não inverta.** Etapa 2 depois da Etapa 1, porque **metade do que parece decisão é só leitura
que ninguém fez.** E não comece a Etapa 3 antes da 2: o as-built de um workflow que o Olavo vai
mandar aposentar é trabalho jogado fora.

---

## 3. ⛔ O que você NÃO vai fazer

| Não | Por quê |
|---|---|
| **Não altere workflow nenhum** | isto é leitura e entrevista. Conserto vem depois, com brief próprio |
| **Não ative, não desative, não publique** | inclusive os dois que não produzem nada. **Só o Olavo desliga** |
| **Não execute workflow** | consome cota de API e pode escrever em produção |
| **Não toque na Prospecção** | `PROSP-*`, `Comercial - *`, planilha `leads`, Odoo. Outra frente, outro contrato, e ele é lei lá |
| **Não construa nada** | nem workflow de teste, nem tabela, nem coluna (**R7**) |
| **Não afirme o que não leu** | ver §6 |

---

## 4. LISTA A — as ~30 perguntas que VOCÊ responde lendo

Responda **cada uma** com: a resposta, **onde leu** (workflow + nó, ou tabela + query) e a data.
Onde não conseguir responder, escreva **"não consegui, porque…"** — isso também é entrega.

### 4.1. Ingestão (camada 1)
| # | Pergunta |
|---|---|
| A1 | O `sw metricas campanhas` tem gatilho próprio às **00h** *e* é chamado às **04h**. Ele roda mesmo 2×/dia? O que a 2ª rodada faz com o que a 1ª escreveu? |
| A2 | `sw metricas anuncios` e `sw metricas conjuntos`: **rodam? terminam verdes? quantos itens chegam ao nó de escrita?** |
| A3 | Se chegam **zero** itens, **onde exatamente o ramo morre** — na chamada da API, num filtro, num IF? |
| A4 | `sw métricas e diagnósticos anúncios` (`uqEHxuJPWRiZS6ai`, inativo) é o **antecessor** dos dois? O que mudou? |
| A5 | A `raw_ad_data` **já teve linha alguma vez**? (histórico de execuções + `__TABLES__`) |
| A6 | O `PHI — Agregador de Métricas Multi-fonte` escreve **em qual tabela**? Ele **já traz grão de anúncio** (*"Meta level=ad"*, *"GAQL 3 níveis"*)? Se traz, **os dois de cima são redundantes, não quebrados** |
| A7 | O Agregador tem **2 gatilhos** — quais e a que horas? **Colidem** com a janela das 04h ou das 07h? |
| A8 | O `PHI - Subworkflow Campanhas` ainda é chamado pelo Pipeline_v2? **Em que ponto?** O que quebra se o nó chamador for desabilitado? |
| A9 | `client_config`: o nó de **INSERT** aponta para `phi_dev` e o de **UPDATE** para `phi_prod`, ou os dois para dev? Qual campo o dev preenche com **default fixo** (o caso `ROAS` × `CPA` do KIL)? |
| A10 | **Algum outro workflow** escreve `client_config`? |
| A11 | Quem escreve `model_config` e `client_goal_history` — workflow ou carga manual? |
| A12 | Quem escreve `workflow_execution_log` — e 🔴 **quem lê?** |

### 4.2. Cálculo e entrega (camadas 2 e 3)
| # | Pergunta |
|---|---|
| A13 | Com qual cláusula o Pipeline_v2 **desempata** `DAILY_ENTRY` × `GADS_INSERT`? **Ela surte efeito hoje?** |
| A14 | 🔴 Sobrou **algum `'GADS-' +`** no SQL do Pipeline depois do ADR-38? (é a doença do P-27: prefixo velho num `WHERE`) |
| A15 | O `INNER JOIN` com `client_config` continua lá? **Quantas campanhas ele descarta hoje?** |
| A16 | A **checagem de unicidade**: como está depois do conserto? Qual o comportamento **no dia em que não há duplicata** — que é todo dia? |
| A17 | A Fase 3 mantém **Fechamento → Escalada → Abertura** no `activeVersion`? |
| A18 | O `PHI - Fechar Otimização` **só fecha**, ou também abre / limpa órfãs? (é suposição minha, não verificada) |
| A19 | Quais campos do Notion o Pipeline_v2 escreve, **exatamente**? |

### 4.3. Vigilância (camada 4)
| # | Pergunta |
|---|---|
| A20 | O Vigia de Frescor olha **quais tabelas**? E como se comporta no dia em que **não falta nada** (zero itens = fim do ramo?) |
| A21 | O `errorWorkflow` está apontado em quais workflows? 🔴 **Quais dos ~26 ativos NÃO têm errorWorkflow?** |
| A22 | Quais workflows do PHI têm `onError: continueRegularOutput` **sem destino visível** para o erro? |
| A23 | Houve **até 4 disparos de alerta não identificados**. O que eram? |

### 4.4. Consumo e higiene (camada 5)
| # | Pergunta |
|---|---|
| A24 | `WF-T28-Error-Handler` está **ativo** com `triggerCount: 0` — **quem o aciona?** Já disparou alguma vez? |
| A25 | Os 3 `WF-EXEC-*` e o `WF-DOC-Telemetria-Diaria` **leem alguma coisa do PHI**? Qual tabela ou DB? |
| A26 | O `WF-T28-Orquestrador` lê `phi_dev` — **essa tabela existe e tem dado?** |
| A27 | `t28_campaign` com **3 identidades** (P-28, no corpo do ADR-38) — qual o estado hoje? |
| A28 | `L1 - Abertura de Projeto` lê a DB Clientes. **Conflita com o `client_config`?** |
| A29 | 🔴 `TMP - Evolution Header Echo` está **ATIVO desde 26/05**. O que faz? É seguro desligar? |
| A30 | 🔴 **Quantos dos ativos têm `versionId != activeVersionId`** — ou seja, alteração parada no rascunho como aconteceu com o PROSP-04? (**R13**) |

---

## 5. LISTA B — as 22 perguntas que SÓ o Olavo responde

**Regra de condução:** rodadas de **até 6 perguntas**. Se 4 bastarem, use 4. **Sirva opções concretas
com a consequência de cada uma** — o Olavo decide melhor escolhendo do que redigindo. Se recomendar
uma opção, ponha em primeiro e diga por quê.

### 5.1. Produto e grão *(decide o destino de 2 workflows ativos)*
| # | Pergunta |
|---|---|
| B1 | 🔴 Quando o PHI diz *"a campanha do Salão está em WARNING"*, o gestor quer que ele **aponte qual anúncio é o culpado**, ou ele abre o Google Ads para ver isso? |
| B2 | Se o grão de anúncio entrar, **quem consome**: o T28, um relatório, ou o próprio score? |
| B3 | O PHI hoje cobre Google Ads. **Meta entra quando?** É promessa feita a algum cliente? |
| B4 | Quantos clientes o PHI monitora **hoje**, e quantos deveria monitorar em **30/11**? |
| B5 | O PHI é **ferramenta interna** ou é **o produto que se vende**? |

### 5.2. Confiança e alarme *(decide a camada 4)*
| # | Pergunta |
|---|---|
| B6 | Hoje você **confia no número** que o PHI mostra? Se não, em **qual parte** especificamente? |
| B7 | Quando um alarme chega no Telegram, **o que você faz**? Qual alarme você **já ignorou**? |
| B8 | **Quantos alarmes por dia é demais?** |
| B9 | Se o PHI ficasse **3 dias sem rodar**, você perceberia? **Por qual sinal?** |
| B10 | Qual falha é **inaceitável** (tem que te acordar) e qual é **"conserta amanhã"**? |

### 5.3. Ambiente e disciplina
| # | Pergunta |
|---|---|
| B11 | 🔴 **`phi_dev` deve existir?** Se sim, **quem promove** de dev para prod, e quando? |
| B12 | Os workflows do PHI merecem **prefixo de nome** (como `PROSP-01..08`)? Hoje não dá para olhar a lista e saber o que é PHI. Vale a mexida? |
| B13 | Existe **janela de manutenção** — hora do dia em que é seguro mexer em produção? |

### 5.4. Escopo do contrato *(decide o que entra no documento)*
| # | Pergunta |
|---|---|
| B14 | O **Onboarding** (`Onb - *`, 7 ativos) é parque PHI ou **operação da agência** (`docs/operacao/`)? |
| B15 | O **T28** é frente própria, ou é a **camada 5** deste contrato? |
| B16 | Os **`WF-EXEC-*`** (execução de demandas) entram no contrato? |
| B17 | Os **~20 inativos**: aposentar todos pela R5, ou **apagar os óbvios** (templates importados, `TMP-*`) e aposentar só os que foram nossos? |

### 5.5. Prioridade e custo
| # | Pergunta |
|---|---|
| B18 | 🔴 O que **dói mais hoje**: dado que falta, dado errado, ou alarme que não chega? |
| B19 | Há **orçamento de API**? Alguma chamada tem custo que te incomoda? |
| B20 | Se só desse para consertar **uma coisa** nos próximos 15 dias, qual? |
| B21 | O PHI v1 tem data **30/11**. O **parque limpo** faz parte do v1, ou é depois? |
| B22 | O que você **já tentou consertar e desistiu**? |

> 💡 **B18 e B20 são as mais valiosas.** Elas ordenam tudo o que vem depois. Se a entrevista tiver
> que parar em duas perguntas, que sejam essas.

---

## 6. 🔴 As seis armadilhas desta frente

Não são teoria — **cada uma já custou caro nesta casa nas últimas duas semanas.**

1. **Você está lendo o rascunho.** `nodes` é proposta; o que roda é **`activeVersion.nodes`**.
   Compare `versionId` com `activeVersionId`. `triggerCount` conta gatilhos **ativos**, não
   declarados. **"Não deu erro" ≠ "está no ar"** (**R13**).
2. **Verde não é produção.** `raw_ad_data` passou 3 meses vazia, verde todo dia. **Antes de chamar
   um workflow de saudável, conte os itens que chegaram ao nó de escrita** (R11 regra 4).
3. **Query agregada sempre devolve linha.** `COUNT`/`SUM` sem `GROUP BY` faz *"não achei"* sair como
   **`0`**. Se um zero pode significar "não encontrei", **traga junto a contagem do que casou**.
4. **O número agregado não substitui o registro.** Eu já li `_fora_nao_modificado: 100` e concluí
   que nada havia mudado — tinha mudado. **Cite o id, não só o total.**
5. **Id nunca é contagem.** Não estime quantidade a partir do maior identificador.
6. **Dado de teste não vira evidência só porque foi gravado** (**R12** aplicada a dado). Se um
   número parecer contar uma história de negócio, **olhe os campos vizinhos antes de acreditar**.

> **Teste prático antes de cada afirmação:** *"eu li isso, ou eu deduzi?"* Se deduziu, escreva
> **"deduzo que"** — e o chat-mãe trata como hipótese, não como fato.

## 7. Registro obrigatório (R3)

Ao **começar** e ao **encerrar** cada bloco, crie/atualize uma linha na DB Notion
**"PHI — Registro de Execuções (Sub-chats)"** com: **frente** (`Saúde Digital / Parque PHI`) · **o
que foi feito** · **estado** · **próximo passo** · **link do artefato**.

Sem isso o digest das 08:30 avisa *"sem progresso"* e o Olavo perde a visão do projeto.

## 8. O que devolver ao chat-mãe

1. **As ~30 respostas da Lista A**, cada uma com **onde você leu**.
2. **As respostas do Olavo** da Lista B, verbatim — sem interpretar.
3. **O `CONTRATO-PHI.md` com o §4 preenchido** e os ❓ que sobraram marcados com o motivo.
4. **D1..D6 do §6** com decisão e data.
5. 🔴 **A lista do que você descobriu e ninguém tinha pedido.** Achado lateral é o produto mais
   valioso desta varredura — foi assim que apareceram os dois workflows vazios.
6. **Hipóteses suas que o dado desmentiu** (R6, corolário) — senão a próxima auditoria repete o
   trabalho.
7. **Commit no git** na mesma sessão (**R2**), com o cabeçalho dos documentos atualizado — **não só
   o corpo** (R2 item 5).

## 9. Skills instaladas que você pode usar

| Skill | Para quê, aqui |
|---|---|
| `n8n-mcp-tools-expert` | ler workflow, execução e versão **sem cair na armadilha do rascunho** |
| `n8n-node-configuration` | entender parâmetro de nó (o que é default, o que o editor tirou da tela) |
| `phi-diagnostico` | testar prompt do T28 **no chat**, sem gastar token no n8n |
| `find-skills` | se precisar de algo que não está nesta lista, procure antes de improvisar (**R7**) |

## 10. Como conduzir a entrevista

- **Rodadas de até 6 perguntas.** Máximo 3 rodadas na Lista B.
- **Pergunta boa não é pergunta vaga.** *"Qual sua visão para o PHI?"* não serve. **Dê opções com a
  consequência de cada uma.**
- **Aceite a discordância.** Este projeto já decidiu **quatro vezes** contra a recomendação do
  chat-mãe, e nas quatro o Olavo estava certo (`id_crm` · identidade sem prefixo · a data como
  limite · o motivo de perda que era teste). **Quando ele discordar, registre a refutação** — ela
  vale mais que a recomendação original.
- **Limite de 3 voltas** (R9): na terceira, o problema é o plano, não a execução. Devolva ao chat-mãe.
