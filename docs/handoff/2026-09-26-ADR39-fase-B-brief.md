# [BRIEF sub-chat] ADR-39 Fase B — dar dono único ao `client_config` e matar o `phi_dev`

> **Como usar:** sub-chat **novo**. Cole este arquivo como primeira mensagem.
> **Modelo:** Opus · **Repo:** `olavofranzin/phi` · **Branch:** `claude/consolidacao-2026-08`
> **Papel do Olavo:** **ponte.** Decisão que aparecer → **pare e devolva ao chat-mãe.**
>
> 🔴 **Esta etapa ALTERA PRODUÇÃO e tem um passo irreversível.** Leia o §3 antes de tocar em nada.

---

> 🔴 **REVISADO EM 26/09, depois da Fase R do ADR-37 — leia antes de seguir qualquer passo.**
>
> A pergunta **R7** foi medida e **derrubou a premissa deste brief.** Eu tinha escrito que o ADR-40
> já esvaziara o `UPDATE` do `client_config`. **Não esvaziou:**
>
> | O que foi medido (execuções `43393`, `43396`, `43261`) | |
> |---|---|
> | No **cálculo do score** | ✅ **0 de 2 campanhas dependem do `COALESCE`** — aí a coluna é redundante |
> | Na **entrega operacional** | 🔴 **três SQLs publicados do `Pipeline_v2` ainda leem `cc.primary_metric_type`**, e **2 alertas de hoje saíram por esse caminho** |
>
> **O ADR-40 migrou o cálculo. Não migrou os consumidores.** Ver §3.1 — ele mudou os passos 4.4 e 4.5.
>
> **E o CA3a mudou:** eu exigia Métrica-Mãe `CPA` no cliente de teste. **Estava errado** — isso
> inventa um atributo de cliente que o ADR-40 decidiu que pertence à campanha. **O CA3a prova que a
> linha nasce; não precisa de métrica nenhuma.**

---

> 🔴 **VOLTA 1 PAROU EM 27/09, NO CA3a — e há um estado vivo falhando. Leia o §0.1.**
>
> | Passo | Estado |
> |---|---|
> | **4.2 / 4.3** | ✅ publicados — `client_config` em `df62def3` |
> | **4.3b** | ✅ publicado — `Pipeline_v2` em `88c65762`, consulta validada na execução `43693` |
> | **CA3a** | 🔴 **FALHOU** (execução `43699`): o BigQuery recusou o `INSERT` do `CLI-14` — **`primary_metric_type` é `REQUIRED`** |
> | **4.4** | ⬜ não executado, corretamente |
>
> 🔴 **O erro é meu:** escrevi *"coluna vazia é o comportamento certo"* **sem ler o schema.** O schema
> proíbe. É a terceira vez em dois dias que eu afirmo comportamento de artefato a partir da intenção
> de design — e é exatamente o que o corolário 2 da R6 manda não fazer.
>
> ⚠️ **E há um achado por trás:** **não existe DDL do `client_config` versionada no repositório.**
> Procurei: zero `.sql` menciona a tabela. **Por isso ninguém sabia que a coluna era obrigatória.**
>
> ## §0.1 🔴 O estado vivo que precisa de decisão hoje
>
> O workflow `client_config` está **publicado apontando para `phi_prod`** e tem gatilho de **1 hora**.
> O **CLI-13 existe no Notion e não existe em `phi_prod`** → **o `MERGE` vai tentar inserir e falhar,
> de hora em hora.**
>
> **Não corrompe dado** — falha e para. **Mas é barulho recorrente e a sincronização fica morta.**
>
> | Saída | Quando usar |
> |---|---|
> | 🟢 **Aplicar a opção A** (abaixo) | **é a saída.** Uma DDL resolve |
> | 🟡 **Desativar o gatilho do `client_config`** | **se a decisão demorar.** Reversível, e **a nota diz quando religar** (R12) |
> | ❌ Reverter o 4.2 | só se A e B caírem — desfaz trabalho bom |
>
> ## §0.2 🟢 OPÇÃO A AUTORIZADA — Olavo, 27/09: *"pode aplicar a A"*
>
> **Relaxar `phi_prod.client_config.primary_metric_type` de `REQUIRED` para `NULLABLE`**, repetir o
> CA3a e seguir.
>
> | ✅ Cobre | ❌ Não cobre |
> |---|---|
> | a relaxação dessa coluna, nessa tabela | qualquer outra alteração de schema |
> | repetir o CA3a com cliente de teste **declarado, datado e removido na mesma sessão** | o **4.4**, que continua parando e pedindo |
> | — | improvisar contorno se a relaxação for recusada |
>
> 🔴 **Se o BigQuery recusar a relaxação: PARE.** Aí só resta a **B** (migrar os outros dois leitores
> e remover a coluna), o escopo muda, e isso é nova decisão.
>
> 📌 **Entrega nova, e ela conserta a causa:** escrever a **DDL do `client_config` no repositório**
> — `docs/strategic-planning/agregador-t28/ddl/phi_prod_client_config.sql`, com o schema **como ficou
> depois da mudança** e um comentário dizendo o que mudou, quando e por quê. **A falha do CA3a
> aconteceu porque essa tabela nunca teve schema escrito em lugar nenhum.**
>
> ## §0.3 A escolha entre A, B e C — recomendação do chat-mãe
>
> **Concordo com o executor: é a A.**
>
> | | O que é | Veredito |
> |---|---|---|
> | 🟢 **A** | tornar `primary_metric_type` **NULLABLE** e repetir o CA3a | ✅ **uma DDL.** É a direção do ADR-40 — a coluna está a caminho de sair, e relaxar é um passo para lá, não um desvio |
> | 🟡 **B** | migrar os outros 2 leitores e **remover a coluna** | certo no fim, **e maior agora**. A vira pré-requisito natural dela |
> | ❌ **C** | manter o schema e preencher CPA/ROAS no cliente | **reinstala o grão que o ADR-40 aboliu.** Rejeitada |
>
> **Os três leitores aguentam `NULL`:** `Buscar Clientes Ativos` usa a coluna para listar;
> o `COALESCE` do score **existe exatamente para isso**; e o `Buscar Campanhas Alertas` **já foi
> migrado no 4.3b**.
>
> ⚠️ **Dois avisos sobre a A:**
> 1. 🔴 **Relaxar `REQUIRED` → `NULLABLE` é caminho de uma direção só** no BigQuery. Voltar exige
>    recriar a tabela. **Por isso precisa do OK do Olavo, e não da minha escolha técnica.**
> 2. **Confirme o comando aceito pelo ambiente antes de rodar.** Se o BigQuery recusar a relaxação,
>    **PARE** — aí a B passa a ser a única saída e o escopo muda.
>
> **Consequência a observar depois do CA3a passar:** o **CLI-13 entra** em `client_config`. Se entrar
> como ativo, o `Pipeline_v2` passa a processá-lo. **O V3B do vigia já o acompanha** — não é bloqueio,
> é coisa para olhar no dia seguinte.

---

> 🟢 **TRÊS DECISÕES DO OLAVO — 26/09.** Elas mudam os passos 4.4 e 4.5.
>
> | Pergunta | Resposta |
> |---|---|
> | A que horas o dia fecha? | **07h** — a coleta das 07h fica. Ver §3.2 |
> | Pode congelar o metadado (4.4)? | *"deixo para sua escolha técnica"* → **não congelar. Migrar UM leitor antes.** Ver §3.1 |
> | O `phi_dev` pode morrer? | 🟢 **pode** — mas **a tabela agora, o dataset depois.** Ver §3.3 |

---

## 0. Por que esta etapa, e por que agora

**Hoje, um cliente novo que você cadastra no Notion nunca chega ao score.** O writer de produção do `phi_prod.client_config` é um `UPDATE` **sem `INSERT`**; o que **insere** grava no `phi_dev`, que o score não lê. O `INNER JOIN` elimina o cliente — **sem erro e sem alarme**.

> *"A única razão de o KIL funcionar é que alguém inseriu aquela linha à mão, um dia, e o `UPDATE` a mantém viva."* — ADR-39 §2

| | |
|---|---|
| **ADR** | `ADR-39-dono-unico-client-config.md` — **ACEITO**, Fase A concluída em 21/09, **Fase B nunca começou** |
| **Fecha** | o **F1** do ponto final · o **D2** (`phi_dev` some) |
| **Destrava** | a **Fase 3 do ADR-37** e, por consequência, a **Fase 2** |
| **Custo de modelo** | **zero** — nenhum nó de LLM |
| 🔴 **Pré-requisito** | **a Fase R do ADR-37** (`2026-09-26-ADR37-raw-campaign-data-fase-R-brief.md`) — a resposta **R7** dela diz se o `UPDATE` do passo 4.4 ainda tem função. **Sem ela, o 4.4 é chute** |

---

## 1. 🔴 As seis regras desta etapa

| # | Regra |
|---|---|
| **1** | **Janela de manutenção 09h–23h** (D9). Fora dela, não execute |
| **2** | **Os passos 4.2, 4.3 e 4.4 acontecem na MESMA SESSÃO** (R12). Entre o 4.2 e o 4.4 existe uma janela com **dois writers vivos na mesma coluna** — ela é aceitável só porque é **curta e declarada** |
| **3** | 🔴 **O 4.4 é o único irreversível na prática.** Antes dele, o CA1 e o CA2 têm de estar provados |
| **4** | **R13 inteira**: leia `activeVersion`, compare `versionId` com `activeVersionId`, e **releia depois de publicar** |
| **5** | 🔴 **Remeça a linha de base antes de mexer** (R6, corolário 2). A do ADR é de **20/09** — seis dias. **Número lido não é número medido** |
| **6** | **Limite de 3 voltas** (R9). Se o dado desmentir o plano: **pare, não execute, registre** |

---

## 2. O que mudou desde que o ADR foi escrito — leia antes de seguir o §4 dele

| Mudança | Efeito no plano |
|---|---|
| **ADR-40 aceito** — `primary_metric_type` viaja com a campanha | 🔴 o passo **4.1 está REVOGADO**. A coluna **sai** do `client_config`; não se corrige a derivação de um campo que será removido |
| **Fase A executada** (21/09) | os dois writers de `raw_campaign_data` já gravam a Métrica-Mãe |
| 🔴 **O CA3 perdeu o caso de prova** | a campanha do CHA foi **encerrada em 22/09**, e a Métrica-Mãe dela é **`CPL`**, que o motor do score **não sabe calcular**. O CHA chegaria e sairia com `phi_value` NULL |
| **O vigia está no ar** (26/09) | o **V3** pergunta todo dia se todo cliente ativo aparece no score — **a falha deixou de ser silenciosa** |

---

## 3. 🔴 O CA3 estava conflando duas coisas — e é por isso que esta etapa travou

**O ADR pede: *"um cliente novo do Notion chega ao score"*. São duas perguntas, e só uma é deste ADR:**

| | Pergunta | De quem é | Dá para provar hoje? |
|---|---|---|---|
| **CA3a** | o cliente novo **ganha linha em `phi_prod.client_config`** | 🟢 **deste ADR** | ✅ **sim** |
| **CA3b** | o cliente novo **recebe `phi_value`** | 🔴 **do F1** — exige campanha real coletando | ❌ **não** — não há cliente novo |

> **Separar os dois destrava a etapa sem fingir nada.** O ADR-39 entrega o CA3a. O CA3b fica
> explicitamente em aberto, **e o V3 do vigia avisa no dia em que acontecer.**

### Como provar o CA3a sem esperar cliente real

**Com um cliente de teste declarado e datado**, no padrão que a casa acabou de adotar:

1. Cadastre no Notion um cliente de teste, **com `Tipo = Teste`** (ou, se a propriedade ainda não existir, com a palavra `TESTE` no nome **e** registrado neste brief e no relatório)
2. Rode o `client_config` e confirme a linha nascendo em **`phi_prod`** por `WHEN NOT MATCHED`
3. **Remova-o na mesma sessão** e registre a remoção

🔴 **CORRIGIDO EM 26/09 — não defina Métrica-Mãe nenhuma no cliente de teste.** Eu exigia `CPA`
aqui; **estava errado.** A métrica pertence à **campanha** (ADR-40), e pedir um valor no cliente
reinstala o grão que a casa acabou de abandonar. **O CA3a prova que a linha nasce em `phi_prod` —
só isso.** Se a coluna nascer vazia, **é o comportamento correto.**

⚠️ **Sem declarar e sem datar, você cria o terceiro caso de dado de teste morando em produção.** Os dois primeiros já custaram uma exceção no vigia cada um.

---

## 4. Os passos — nesta ordem, e só nesta

| # | Passo | Se fizer fora de ordem |
|---|---|---|
| ~~4.1~~ | 🔴 **REVOGADO** (ADR-40) | — |
| **4.0** | 🔴 **Remedir a linha de base**: quem escreve hoje, o que tem a linha do `CLI-4`, e o que o `phi_dev` ainda guarda | sem isso você opera em cima de número de seis dias atrás |
| **4.2** | Repontar o `MERGE` do workflow `client_config` (`SI5NSzRb8lVUz74RwOhIT`) de `phi_dev` para **`phi_prod`** | — |
| **4.3** | Garantir que o `MERGE` **INSERE** e provar o **CA3a** com o cliente de teste (§3) | 🔴 sem isso, o bug do cliente-fantasma continua |
| **4.4** | 🔴 **Só então** remover o `UPDATE` do `PHI - Subworkflow Campanhas` | 🔴 **antes do 4.3, o KIL fica sem nenhum writer e o CPA vira o que estiver na linha** |
| **4.3b** | 🔴 **NOVO** — migrar o `Buscar Campanhas Alertas` para a métrica da campanha (§3.1) | sem ele, o 4.4 congela um valor que ainda chega ao Olavo |
| **4.5** | Apagar **`phi_dev.client_config`** e fechar o **D2**. 🔴 **O dataset inteiro só depois da varredura** (§3.3) | apagar o dataset quebra o `WF-T28-Orquestrador` |

### 3.1 🔴 Os três leitores que o ADR-40 não migrou — medidos em 26/09

| Nó publicado no `Pipeline_v2` | O que lê |
|---|---|
| `Buscar Clientes Ativos` | `SELECT client_id, model_id, primary_metric_type FROM phi_prod.client_config` |
| `Calcular e Persistir PHI Score` | `COALESCE(j.primary_metric_type, cc.primary_metric_type)` |
| 🔴 `Buscar Campanhas Alertas` | seleciona `cc.primary_metric_type`, **que segue para o fluxo operacional** — 2 alertas de hoje saíram por aí (execução `43261`) |

**O que isso muda nos passos:**

| | |
|---|---|
| **Retirar só o `UPDATE` (4.4)** | não quebra nada **hoje**, e **não é inofensivo**: congela um metadado que ainda é lido. Mudança futura de métrica **deixa de chegar aos alertas** |
| **Retirar a COLUNA** | 🔴 **quebra os três SQLs.** Não está neste brief e **não pode ser feita sem migrar os três leitores antes** |

### 🟢 A escolha técnica, feita pelo chat-mãe em 26/09: **não congelar — migrar um leitor**

O Olavo delegou (*"não sei dizer, deixo para sua escolha técnica"*). **A escolha é esta, com o porquê:**

| Saída | Veredito |
|---|---|
| **Congelar** (tirar o `UPDATE` e deixar a coluna parada) | ❌ **não.** Hoje é inofensivo — 1 cliente, 2 campanhas, as duas `CPA`. **Mas instala um valor que ninguém mais atualiza e que continua chegando ao humano pelos alertas.** É a doença do cabeçalho que mente |
| **Migrar o `UPDATE` para o novo dono** | ❌ **não.** Preserva o **grão errado**: a métrica é da campanha (ADR-40) |
| **Migrar os TRÊS leitores e remover a coluna** | 🟡 certo, **e maior do que precisa ser agora** |
| 🟢 **Migrar UM leitor — o que chega ao humano** | ✅ **é esta.** Ver abaixo |

**Dos três leitores, só um propaga a métrica para fora:**

| Leitor | Precisa da coluna fresca? |
|---|---|
| `Buscar Clientes Ativos` | ❌ **não** — usa a coluna para listar cliente, não para julgar |
| `Calcular e Persistir PHI Score` | ❌ **não** — o `COALESCE` tem **0 dependências** hoje (medido) |
| 🔴 `Buscar Campanhas Alertas` | ✅ **sim** — é o que leva a métrica ao alerta que o Olavo lê |

**Passo novo, e o 4.4 fica preso a ele:**

| # | Passo |
|---|---|
| **4.3b** | 🔴 **`Buscar Campanhas Alertas` passa a ler a métrica DA CAMPANHA**, não de `cc.primary_metric_type`. ⚠️ **Confirme antes que o valor da campanha está disponível na consulta dele** — se não estiver, **PARE e devolva**: o 4.4 não é urgente |
| **4.4** | **Só depois do 4.3b.** Aí remover o `UPDATE` não congela nada que chegue a humano |

> **A coluna continua existindo.** Removê-la exige mexer nos outros dois leitores, **e não urge** —
> nada quebra por ela estar lá.

### 3.2 🔴 "O dia fecha às 07h" — e isso cria um requisito para o ADR-37, não para cá

**Decisão do Olavo, 26/09.** Hoje quem coleta às 07h é o **W2** (`PHI - Subworkflow Campanhas`) — exatamente o workflow que a Fase 2 do ADR-37 quer aposentar. O **W1** roda às **00h e 04h**.

> 🔴 **Consequência que ninguém tinha escrito: aposentar o W2 sem mover o relógio fecha o dia às 04h
> — e o número do score muda.** Medido hoje: Salão, custo **33,948977** às 04h contra **34,49** às
> 07h, com **1 clique e 3 impressões a mais**.

**Requisito novo para a Fase 2 do ADR-37 (não é desta etapa):** antes de aposentar o W2, **o W1 tem
de rodar às 07h e produzir os mesmos números que o W2 produzia** — provado com os dois vivos, em
double-write, comparando. **É o padrão que já funcionou em 21/07 com o `PHI - Loop Alerta Fase 1`.**

### 3.3 🟢 O `phi_dev` pode morrer — a TABELA agora, o DATASET depois

**Autorizado pelo Olavo, 26/09.** Mas em dois tempos, e o motivo é o **CA5**:

| | |
|---|---|
| 🟢 **`phi_dev.client_config`** | pode ser apagada assim que o 4.3 estiver provado |
| 🔴 **o dataset `phi_dev` inteiro** | **só depois da varredura.** O `WF-T28-Orquestrador` lê `phi_dev.t28_campaign` — **apagar o dataset o quebra** |

**Antes de qualquer `DROP SCHEMA`: varra os workflows por `phi_dev` e liste quem ainda lê.** Se a
lista não estiver vazia, **apague só a tabela e registre a lista** — o dataset morre noutra etapa.

> ⚠️ **E não transfira o `UPDATE` para o novo dono "para preservar a função".** Seria preservar o
> **grão errado** — a métrica é da campanha. O que precisa migrar é o **leitor**, não o escritor.

> ✅ **Hipótese já refutada, não a levante de novo:** *"repontar sobrescreveria o CPA do KIL com ROAS"*
> — **falso.** O KIL cai em `WHEN MATCHED`, que não toca essa coluna. A precaução continua certa, mas
> protege **o cliente novo**, não o existente.

---

## 5. Critérios de aceite — escritos antes (R9)

| # | Critério | Como se prova |
|---|---|---|
| **CA1** | `phi_prod.client_config` tem **UM** writer | ler os nós dos dois workflows e confirmar |
| **CA2** | O KIL continua **`CPA`** | consultar a linha do `CLI-4` **depois** do 4.4, nunca antes |
| **CA3a** | 🟢 Cliente novo **ganha linha em `phi_prod`** | o cliente de teste do §3, nascendo por `WHEN NOT MATCHED`. **Sem exigir métrica** — coluna vazia é o certo |
| **CA3b** | ⬜ Cliente novo **recebe score** | **fica em aberto** — não há cliente real. O V3 do vigia avisa no dia |
| **CA5** | `phi_dev` não é mais escrito nem lido | varrer os workflows por `phi_dev` — 🔴 **inclui o `WF-T28-Orquestrador`**, que lê `phi_dev.t28_campaign` |
| **CA6** | Nada rodou fora da janela **09h–23h** | horário das execuções |
| **CA7** | 🔴 **O que foi publicado é o que está no ar** | reler: `versionId == activeVersionId` |
| **CA8** | **O cliente de teste foi removido na mesma sessão** | consultar a tabela ao fim (R12) |

> ⚠️ **O CA4 do ADR original** (*"a Métrica-Mãe do Notion vence o mapa fixo"*) **ficou inválido**: com
> o ADR-40 a coluna sai do `client_config`. **Não tente prová-lo.**

---

## 6. ⛔ Fora do escopo

- ❌ **Não aposente o `PHI - Subworkflow Campanhas`** — isso é a Fase 2 do ADR-37, que esta etapa **destrava** e não executa
- ❌ **Não toque no `WF-T28-Orquestrador`.** O CA5 só o **denuncia**
- ❌ **Não conserte o `client_id` vazio** do `sw metricas campanhas` — é da Fase R
- ❌ **Não mexa no vigia, no índice, no Agregador**
- ❌ **Nenhum nó de LLM**

---

## 7. O que entregar

| # | Entrega |
|---|---|
| 1 | **Relatório de execução** com a prova de cada CA, número de execução ao lado — `docs/handoff/2026-09-__-ADR39-fase-B-relatorio.md` |
| 2 | **ADR-39 atualizado**: cabeçalho dizendo que a Fase B ocorreu, a data, e o que ficou diferente do plano (R2 item 5 — **o cabeçalho é o que se lê**) |
| 3 | **Descrições dos workflows alterados** (R5), dizendo o que mudou e por quê |
| 4 | **Linha no Notion** ao começar e ao encerrar (R3) |
| 5 | Se algum passo não ocorrer: **qual, por quê, e o que ficou no lugar** |

---

## 8. Como falar com o Olavo

- Ele é **ponte**. Decisão → **pare, escreva a pergunta com opções e consequências, devolva.**
- 🔴 **Publicar/ativar nesta etapa NÃO está pré-autorizado** — a autorização de 26/09 valia para o vigia. **Aqui você para antes do 4.4 e pede**, porque é o passo irreversível.
- **Separe o que leu do que mediu.** Nesta etapa, **só o medido conta**.

---

## 8. 🔴 Se quem executar NÃO for um Claude Code com o `CLAUDE.md` carregado

**Este brief cita regras pelo número** (R6, R9, R11, R12, R13) e **invariantes** (M1–M12). Num
ambiente que não carrega o `CLAUDE.md` da raiz automaticamente — **Codex, por exemplo** — esses
números não querem dizer nada, e o brief perde metade do peso.

**Leia estes arquivos ANTES de qualquer coisa, na ordem:**

| # | Arquivo | O que tirar dele |
|---|---|---|
| 1 | `CLAUDE.md` (raiz) | **R6** (o dado vence o plano) + **corolário 2** (número lido ≠ medido) · **R11** (sucesso silencioso, as 5 regras) · **R12** · **R13** (leia o que está no ar) · **R9** (3 voltas) |
| 2 | `docs/strategic-planning/saude-digital/CONTRATO-PHI.md` | os invariantes **M1–M12** e a matriz de dono por tabela |
| 3 | o ADR desta etapa, **inteiro** | não só a parte citada aqui |

🔴 **Três coisas que esta casa exige e que não são padrão em lugar nenhum:**

1. **No n8n, o que roda é `activeVersion.nodes`** — `nodes` é o rascunho. Antes de afirmar o que um
   workflow faz, compare `versionId` com `activeVersionId`.
2. **Zero nunca é ausência.** `COUNT(x IS NOT NULL)` prova que a coluna foi escrita, **não que algo
   foi medido**. Olhe valor, distribuição e mín/máx.
3. **Um `SELECT` agregado sempre devolve uma linha** — *"não achei"* e *"achei zero"* saem idênticos.
   **Traga a contagem do que casou, ao lado.**

### E o portão que vale para qualquer executor

- 🔴 **Ferramentas:** esta etapa precisa de acesso ao **n8n** e, por ele, ao **BigQuery**. **Confirme
  que você tem antes de começar** — se não tiver, diga logo, em vez de improvisar outro caminho.
- 🔴 **Quem revisa não é quem executou** (R9). **Traga os números e a sua leitura em blocos
  separados.** O chat-mãe revisa a leitura; os números são seus.
- **Precedente da casa:** em 28/06 o Codex entregou a idempotência do MERGE e a **pré-revisão
  encontrou um dedup que perdia `PARTITION`/`CLUSTER`.** O trabalho estava certo e a revisão pegou o
  que faltava — **é assim que funciona aqui, e não é desconfiança.**

> 🔴 **E nesta etapa há um passo irreversível (4.4).** Seja qual for o executor, ele **para antes do 4.4 e pede** — a autorização de publicar de 26/09 valia para o vigia, não para cá.
