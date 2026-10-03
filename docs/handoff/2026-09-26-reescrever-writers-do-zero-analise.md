# "Não seria melhor criar workflows novos do zero?" — análise e recomendação

| | |
|---|---|
| **Data** | 2026-09-26 |
| **Quem propôs** | **Olavo** — *"se o problema é de escrita, vamos escrever novos escritores e arquivar os antigos"* |
| **Resposta curta** | 🟢 **Sim — e você não está propondo uma virada: está propondo terminar o ADR-37, que já é lei e está pela metade** |
| **Mas** | 🔴 **por destino, não em bloco.** E **só onde o contrato do destino está escrito** |

---

## 1. Primeiro, a parte em que você já venceu a discussão

**O ADR-37 se chama *"writers canônicos — um destino, um dono"*.** Ele foi aceito. A **Fase 2 e a Fase 3 nunca foram executadas.**

Ou seja: **a casa já decidiu fazer o que você está propondo, e parou no meio.** Isto não é frente nova — é dívida.

E o **M1** (*um destino, um dono*) é o primeiro invariante do contrato. Hoje o `raw_campaign_data` tem **dois writers** usando a **mesma chave** — um sobrescreve os números do outro em silêncio, e o carimbo `ingestion_step` **mente**, porque o `UPDATE` de um deles não o atualiza.

> **Isso não se conserta depurando. Um dos dois tem de sair.** É exatamente a sua proposta.

---

## 2. Mas metade dos defeitos não é de escrita

**Dos nove defeitos conhecidos, a reescrita de writers resolve quatro:**

| Defeito | É de escrita? |
|---|---|
| Dois writers no `raw_campaign_data`, mesma chave | 🟢 **sim** |
| `ingestion_step` mente | 🟢 **sim** |
| Data-sentinela `2000-01-01` | 🟢 **sim** |
| `client_config` sem `INSERT` — cliente novo nunca entra | 🟢 **sim** (é o ADR-39) |
| GA4 e Clarity pararam | 🔴 **não — é extração**, dentro do Agregador |
| Clarity só grava zeros | 🔴 **não — é extração**: a API não devolve o que se pede |
| `t28_gbp_daily` — cota do GBP | 🔴 **não — é limite externo** |
| `phi_score_current` sem `platform` | 🔴 **não — é definição de view.** Uma linha de SQL |
| 318 linhas órfãs | 🟡 resíduo de um produtor antigo |

🔴 **Consequência direta: o Agregador NÃO é caso de reescrita.** O que está quebrado nele é a coleta. O resto — 6 construtores de MERGE idempotente, um error-handler com 15 saídas de erro, o adaptador com `readOrThrow`/`safeOptional` — **funciona e custou quatro rodadas de smoke para ficar assim.** Reescrevê-lo seria jogar fora o que está certo para consertar o que está errado ao lado.

---

## 3. A regra de corte, e é a única coisa que eu peço que fique

> ### Para cada destino, pergunte: **o contrato dele está escrito?**
>
> | | |
> |---|---|
> | 🟢 **Está escrito** | **reescrever do zero é permitido, e provavelmente mais barato** que depurar |
> | 🔴 **Não está** | **ler o fluxo primeiro é obrigatório** — e é barato, porque é leitura, não tentativa |

**Por que essa regra existe, e não é teoria:** em 08/09 a **Fase 0.2 do ADR-37 foi cancelada na hora de executar**. O inventário tinha visto *"dois workflows escrevem o mesmo campo"* e chamado de conflito. A leitura do fluxo mostrou **três transições distintas** — e que executar teria **quebrado a Fase 3**.

> **Reescrever é barato quando se sabe o que o velho faz.** E esta casa tem prova documentada de que muitas vezes **não sabe**: dos 81 workflows do parque, **um único** passa no teste da R5 (a descrição diz o que faz e por quê).
>
> **O risco da reescrita não é o código novo. É o comportamento antigo que ninguém escreveu.**

✅ **E a boa notícia:** o `CONTRATO-PHI.md` **já tem a matriz de dono por tabela** — quem escreve, quando, quem lê. **Onde ela está preenchida, você tem contrato e pode reescrever.**

---

## 4. Menos workflows ou mais específicos? **Nenhum dos dois: escolha a fronteira, não o número**

Você ofereceu as duas saídas, e elas puxam para lados opostos:

| | Ganho | Custo |
|---|---|---|
| **Menos workflows** | menos coisa para vigiar | raio de estrago maior, e mais difícil de testar |
| **Mais específicos** | cada um auditável | 🔴 **mais superfície de silêncio** — e morrer calado é o modo de falha desta casa |

> ### A resposta é o **M1**: **um destino, um dono.**
> **Divida por tabela de destino, e o número cai sozinho.** Não se escolhe quantos workflows existem — se escolhe o que cada um **é dono**. O número é consequência.

🟢 **E há um argumento novo, que não existia ontem:** com o vigia no ar, **cada writer novo é verificável no dia seguinte** — o V4 confere a tabela dele. **Antes de hoje, um writer reescrito não tinha como provar que funcionou. Agora tem.**

**Isso muda o cálculo a favor da sua proposta.**

---

## 5. O seu argumento mais forte não é técnico — e eu concordo com ele

> *"…do que gastarmos tempo, tokens em tentativas e erros"*

**Reescrever não é obviamente mais barato em token** — construir consome SDK, tipos de nó, validação, smoke. **Mas é mais barato em uma coisa que importa mais: término.**

**Diagnóstico não tem fim natural; construção tem.** Olhe as últimas semanas: muito achado, pouco conserto. **A reescrita converte *"entender a coisa velha"* em *"construir a coisa nova"* — e a segunda acaba.**

---

## 6. O que eu recomendo, em ordem

| # | O quê | Por quê agora |
|---|---|---|
| **1** | 🔴 **Terminar o ADR-37 no `raw_campaign_data`** — um writer só | O contrato **está escrito**. É o destino mais importante da casa. Resolve dois defeitos de uma vez (dois relógios + `ingestion_step` que mente) |
| **2** | **Fechar o ADR-39** — `client_config` com `INSERT` | Sem ele, **cliente novo nunca entra no score**. É o F1 |
| **3** | **Consertos pontuais, não reescrita**: a view sem `platform`, a sentinela | São linhas, não workflows |
| **4** | **Investigar a coleta** do GA4/Clarity/GBP | 🔴 **Não é reescrita.** É achar por que parou — e trava o F5 |

**Arquivar sempre pelo procedimento da R5, nunca apagar:** consolidar a função → desabilitar o nó chamador → desativar → renomear com `[APOSENTADO <data>]` → sticky dizendo **por que** e proibindo reuso.

> **O nome e o sticky são a memória.** Foi a falta deles que fez a auditoria de 08/09 não descobrir que o `Daily Entry` tinha sido desligado **porque** o `sw metricas campanhas` entrou no lugar.

---

## 7. O que NÃO fazer, mesmo concordando com a direção

- ❌ **Reescrever o Agregador.** O problema dele é coleta (§2)
- ❌ **Reescrever tudo de uma vez.** Um destino por vez, com o vigia conferindo no dia seguinte
- ❌ **Reescrever destino sem contrato escrito.** Ler primeiro — é a §3, e custou o cancelamento da Fase 0.2
- ❌ **Apagar workflow antigo.** R5, cinco passos
