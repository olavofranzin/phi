# Três decisões do Olavo — nota dupla, liberação por lotes, e a agência como cliente-zero

| | |
|---|---|
| **Data** | 2026-09-26 |
| **Decisor** | **Olavo** |
| **Origem** | resposta ao `2026-09-25-parecer-do-planejador-sobre-a-reformulacao.md` |
| **Estado** | 🟢 as três **decididas**. As condições do §4 são recomendação do chat-mãe e ainda não foram aprovadas |
| **Efeito** | derruba a recomendação 2 do parecer · define a ordem de construção da v0.1 · abre uma frente nova (cliente-zero) |
| **🔴 Adendo 26/09** | **O cliente NÃO vê a nota até segunda ordem (O4).** Muda a razão da O1 e barateia a v0.1 — ver §O4 |
| **Vira ADR** | sim — adendo ao ADR-41 (a O1 e a O2 mexem no D3 e no D10) |

---

## O1 — As duas notas: por pilar **e** composta

> **Olavo:** *"Podemos atribuir uma nota por pilar e a nota final, comercialmente também funcionará porque podemos fazer upsell."*

✅ **Decidido. E derruba a minha recomendação 2** — eu propus segurar a nota composta por causa da instabilidade do D3. A razão comercial vence: **a nota baixa do pilar que é do cliente é a lista de upsell**, e sem a composta não existe a frase *"sua saúde digital é 58"*, que é a que abre a conversa.

**A objeção do D3 continua de pé e agora tem conserto obrigatório.** Com a liberação por lotes (O2), **pilar entrando deixa de ser evento raro e vira o plano** — a nota vai se mover várias vezes de propósito.

### 🔴 A condição: o histórico tem de ser recalculável

| O que gravar, por `(client_id, período)` | Por quê |
|---|---|
| o **valor normalizado de cada indicador** | sem ele não dá para recalcular nada depois |
| **quais pilares entraram na conta** | é o que diz se duas datas são comparáveis |
| a **nota publicada na época** | imutável — é fato, como o `phi_value` é pelo ADR-003 |

**Duas linhas no gráfico do cliente, e elas respondem coisas diferentes:**

- **a nota emitida na época** — o que a gente disse naquele dia, nunca alterada;
- **a série recomputada sob a cobertura de hoje** — a única que pode ser comparada mês a mês.

> **Sem isso, o dia em que o GBP destravar a nota de todo cliente se mexe e ninguém sabe explicar.** Com isso, a resposta é *"ligamos mais um sensor; a linha comparável mostra que você subiu de 61 para 64"*.

---

> 🔴 **Adendo de 26/09 — a razão desta decisão mudou, a decisão não.** Com a **O4** (cliente não vê a
> nota), **a nota composta não serve ao upsell ainda: serve a você, para priorizar entre clientes.**
> O upsell continua sendo o motivo de ela existir — só não é o motivo de ela existir **agora**.
>
> **E as duas linhas no gráfico do cliente deixam de ser necessárias na v0.1.** O que **não** pode ser
> adiado é o que as torna possíveis depois: ver o §O4.

---

## O2 — Liberação por lotes: **API → nós → cliente**

> **Olavo:** *"E se formos liberando os pilares conforme eles sejam configurados? Primeiro os que a extração de dados dependa de API, depois de dados que dependam de nós e por fim os que dependam do cliente?"*

✅ **Decidido, e é melhor do que parece. A ordem de custo coincide com a ordem de dono** — o que faz dela, sozinha, o roteiro comercial:

| Lote | Pilares | Dono | O que a entrega prova |
|---|---|---|---|
| **1 — API em produção** | Aquisição · Conversão *(Experiência como alerta, per A3)* | **agência** | *"o trabalho que você me paga está sendo feito"* |
| **1b — API bloqueada** | Visibilidade e Reputação | agência/cliente | entra no gatilho do D10: a cota do GBP destravar |
| **2 — depende de nós** | Dados e governança · Presença e infraestrutura · Redes sociais *(quando a agência gerencia)* | **agência** | *"o nosso processo é auditável"* |
| **3 — depende do cliente** | Relacionamento e atendimento · avaliações · site que não é nosso | **cliente** | 🟢 **é aqui que mora o upsell** |

### Três observações que precisam estar escritas antes do lote 1

1. 🔴 **O lote 1 não começa antes do F3.** Clarity e GA4 estão mortos desde 06/09 e o vigia não olha para lá. *Índice que lê tabela morta nasce mentindo* — e o V4 precisa de **período esperado por tabela** (diária × semanal), senão nasce cego para esse caso exato.
2. ⚠️ **O lote 2 mede a agência, não o cliente.** *Dados e governança* mede se a otimização foi registrada e verificada (ADR-22); *Presença e infraestrutura* mede se a auditoria de ativos virou procedimento. **É honesto e é a primeira vez que o sistema aponta para dentro de casa.** Melhor saber antes de ligar.
3. 🔴 **Fonte não basta para um pilar entrar.** O S3 pede fonte; a experiência de junho mostra que falta uma volta. Um pilar entra quando tem **(a) fonte · (b) régua com o tipo de cada limite declarado** (A2/S7) **· (c) alavanca declarada, e de quem ela é**. *Pilar que detecta sem alavanca não produz ação — produz reclamação.*

---

## O3 — A agência entra como cliente-zero, pelo funil inteiro

> **Olavo:** *"Inclusive podemos cadastrar a agência como um lead e testar desde todo o processo do CRM, onboarding, redes sociais, site, etc."*

✅ **Decidido. É a melhor ideia desta rodada, e resolve quatro problemas que estavam separados.**

| Problema aberto | Como o cliente-zero resolve |
|---|---|
| **A cadeia inteira nunca foi exercida ponta a ponta** | a casa perdeu **8 dias** com a Fase 3 morta e **19 dias** com duas tabelas mortas — **as duas verdes**. Só um caso real percorrendo tudo pega isso |
| **Os pilares do lote 3 não têm dado** | 🟢 **para a agência temos acesso a tudo**: WhatsApp, CRM, site, GBP, redes. É o cliente ideal justamente para o que falta |
| **A amostra de calibração é n=2** | vira n=3, e o terceiro é o único sobre o qual sabemos tudo |
| **O Raio-X como produto de entrada não tem material de venda** | o primeiro Raio-X completo é o da própria agência — e dá para mostrar |

**E exercita o `Board Agência`**, que nunca foi percorrido: passagem de bastão entre Comercial e Operações, planejamento de entregas, pontos de contato, plantão de dúvidas.

### 🔴 As cinco condições — e a primeira não é negociável

| # | Condição | Por quê |
|---|---|---|
| **1** | 🔴 **Cliente interno declarado no primeiro registro:** `client_id` próprio **+ flag `is_internal`** em `client_config`, e **toda média, régua e calibração exclui interno por padrão** | A casa **já tem essa ferida**: 318 linhas em `t28_campaign` sem `client_id`, com padrão `CMP.CHA.CAMP-10`, dentro de `phi_prod` — e agora **toda consulta do índice precisa de filtro explícito**. Dado de teste sem marca não se distingue depois |
| **2** | **Sem atalho em ponto nenhum.** Entra como lead pela Prospecção, vira oportunidade no Odoo, passa a passagem de bastão, o onboarding e a entrega | Atalho em qualquer etapa faz o teste **provar nada** — e a casa já confundiu *"rodou"* com *"funcionou"* cinco vezes (R11) |
| **3** | **O roteiro sai do `Board Agência`**, não é inventado | O `CLAUDE.md` manda consultá-lo antes de planejar qualquer coisa do depois da venda. Em 15/09 ele **já previa** a passagem de bastão que o plano da Prospecção tinha deixado sem dono |
| **4** | **Critério de aceite escrito ANTES** de começar: o que se espera ver em cada etapa, e o que significa falhar | R9 item 4. Sem isso o teste vira passeio e conclui *"foi bem"* |
| **5** | **Aquisição pode ficar sem dado** se a agência não roda campanha paga para si — e tudo bem | os pilares que faltam são exatamente os outros. **É uma vantagem do caso, não um defeito** |

> ⚠️ **O que ninguém vai gostar, e é o ponto:** o primeiro cliente a receber nota baixa em *Dados e governança* ou em *Relacionamento* **vai ser a agência**. Se isso não acontecer, o índice não está medindo nada.

---

## O4 — 🔴 O cliente não vê a nota até segunda ordem

> **Olavo, 26/09:** *"o cliente não terá acesso a nota até segunda ordem."*

✅ **Decidido.** O índice nasce **interno**. O cliente continua recebendo o relatório periódico e a
reunião — **sem nota**.

### O que isto barateia

| O que cai da v0.1 | Por quê |
|---|---|
| as **duas linhas** no gráfico do cliente (O1) | não há gráfico do cliente ainda |
| explicar cobertura **2 de 8** para fora | ninguém de fora vê |
| o nome *"Índice Experimental"* como cuidado comercial (D8) | vira cuidado interno, e basta o rótulo no documento |
| a fragilidade comercial apontada no ADR-41 §7 | **deixa de existir hoje**; volta no dia da liberação |

**A v0.1 deixa de ser produto e vira painel: nota por pilar + alertas, na sua bancada.**

### 🔴 O que NÃO pode ser adiado, mesmo assim

**Uma coisa só, e ela é barata agora e impossível depois: a régua tem de ser versionada com data.**

| Guardar desde o 1º cálculo | Consequência de não guardar |
|---|---|
| `L` · `Ti` · `Ts` · `U` de cada indicador, **com data de vigência** | no dia da liberação, **não há como recalcular o passado** — a nota antiga foi feita com uma régua que ninguém sabe mais qual era |
| **quais pilares entraram na conta** em cada período | duas datas deixam de ser comparáveis e não há como descobrir depois |

> O valor bruto já está guardado (`raw_campaign_data`, `t28_*`). **A régua, não.** Sem a régua datada,
> o histórico não se reconstrói nem com o dado bruto na mão.

### O leitor — corrigido em 26/09

> 🔴 **Eu escrevi aqui que *"o índice nasce com zero leitor vivo"*. Está errado, e o Olavo corrigiu:**
> *"além de ser consumido internamente, ele poderá ser também usado por agentes; será liberado para o
> cliente quando tivermos plena confiança de que ele reflete o que desejamos. Isso não é falha, não é
> limitação — tudo isso está sendo desenvolvido para que o consumo interno venha primeiro."*

**O M11 está satisfeito, não ameaçado.** A ordem dos leitores é **declarada e deliberada**:

| Ordem | Leitor | Estado |
|---|---|---|
| **1º** | **Olavo**, no painel semanal | ✅ é o leitor da v0.1 |
| **2º** | os **agentes** (cadeia de análise) | planejado — entra quando a cadeia estiver ativa |
| **3º** | o **cliente** | quando houver confiança de que a nota reflete o que se quer dizer |

**A diferença que eu apaguei:** *"ninguém lê"* e *"o leitor é humano antes de ser automático"* não são
a mesma coisa. As 17 colunas órfãs não tinham consumidor **nenhum**; aqui o consumidor é uma pessoa
com nome, e liberar para fora só depois de confiar **é sequenciamento, não lacuna**.

**O que continua valendo, e já está feito:** o leitor da v0.1 está escrito. Era só isso que faltava.

### ⚠️ *"Até segunda ordem"* precisa de gatilho (R12)

*Estado temporário sem prazo vira estado permanente invisível* — já custou três vezes nesta casa.

**Gatilho proposto** (meu, você troca): a nota vai ao cliente quando **(a)** o Raio-X do cliente-zero
estiver completo **e (b)** houver ao menos **4 pilares pontuados**, sendo pelo menos um do lote 3 —
porque é o lote 3 que sustenta a conversa de upsell.

### O que a O4 destrava

🟢 **A pendência nº 3 do §4 deixa de bloquear o índice.** A frequência do relatório ao cliente segue
pendente **para o relatório**, mas **o período do índice passa a ser definido pelo que você precisa
para agir** — e não pelo que o cliente recebe.

---

## 4. O que ainda falta decidir

| # | Pergunta | De quem |
|---|---|---|
| 1 | As condições do §O2 e do §O3 acima — são recomendação minha, não estão aprovadas | Olavo |
| 2 | O `client_id` do cliente-zero e se `is_internal` entra no `client_config` (**mexe no schema — tem ADR próprio, o 39**) | Olavo |
| 3 | A frequência e o conteúdo do relatório ao cliente — pendente desde 21/09 (`PLANO-ENTREGA-FINAL-PHI.md` §1). 🟢 **Deixou de bloquear o índice pela O4** | Olavo |
| 5 | 🔴 **O gatilho da O4** — quando a nota vai ao cliente. Proposta no §O4; sem gatilho vira permanente por esquecimento | Olavo |
| 6 | **Quem é o leitor vivo do índice na v0.1**, e o que ele faz diferente por causa da nota | Olavo |
| 4 | O **dono por pilar** (`agência`/`cliente`) no dicionário — proposto no parecer, ainda não respondido; **a O2 depende dele para contar a história comercial** | Olavo |

---

## 5. O que isto muda nos documentos existentes

| Documento | O que muda |
|---|---|
| **ADR-41** | o **D3** ganha a exigência de histórico recalculável · o **D10** ganha os lotes como ordem declarada · o **S3** ganha as letras (b) e (c) |
| **ADR-42** | nada — a O1 e a O2 não tocam a fórmula |
| **PLANO-F3** | o **V4** passa a exigir período esperado por tabela |
| **Dicionário** | coluna de **dono** por indicador · coluna de **lote** |
| **Frente nova** | cliente-zero: é **operação antes de software** — mora no `Board Agência`, não em `docs/strategic-planning/<frente>/` |
| **ADR-41 (de novo)** | o **D8** (nome experimental) passa a ser cuidado interno enquanto a O4 valer · a consequência negativa nº 2 do §7 (*fragilidade comercial*) fica **suspensa, não resolvida** |
