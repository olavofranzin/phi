# Brief de execução — D1-d: uma credencial ruim não pode derrubar a coleta de todos os clientes

| | |
|---|---|
| **Frente** | Saúde Digital — parque PHI |
| **Artefato** | `sw metricas campanhas` (`W571K320aqIHsdtH`) — **ATIVO, escreve em produção** |
| **Origem do desenho** | **ADR-38 §28.4**, proposto e aprovado no desenho em **24/09** |
| **Por que agora** | 🟢 **fila decidida pelo Olavo em 27/09: A → B → C.** O ADR-39 fechou em 28/09, então **o D1-d é a vez** |
| **Branch dos documentos** | `claude/consolidacao-2026-08` · `https://github.com/olavofranzin/phi/tree/claude/consolidacao-2026-08` |
| **Onde o trabalho acontece** | **n8n** (`https://n8n-n8n-editor.1unqx7.easypanel.host`) — não é repositório de código |
| **Janela** | 🔴 **09h–23h BRT (D9).** Fora dela, não execute |
| **Limite** | **3 voltas** |

---

## 1. O defeito, em uma frase

**Um erro em qualquer nó do corpo do laço encerra a execução inteira — e os clientes seguintes
ficam sem coleta, em silêncio, com a execução terminando verde.**

Aconteceu em **22/09** e custou um dia de coleta.

> 🔴 **E piora sozinho.** Hoje uma credencial ruim custa o dia de **1** cliente. Com a regra
> *"todos os que contratarem tráfego pago"*, com 12 clientes custa o dia de **12**. **O defeito não
> está parado: ele cresce com a carteira.**

---

## 2. O que eu MEDI hoje (2026-09-28) — e o que você mede antes de tocar

**Li o artefato vivo antes de escrever este brief.** `versionId == activeVersionId == fa2bb6ef`,
**38 nós**, última alteração **24/09** — ou seja, **o artefato não mudou desde que o desenho foi
escrito**, e o desenho continua válido.

| O que medi | Resultado |
|---|---|
| Nós com `onError` configurado | 🔴 **zero.** Nenhum dos 38 |
| `retryOnFail` | 🟢 ligado em todos os nós de chamada externa — **e não salva**: credencial expirada não é erro transitório |
| Quem fecha o laço | **só `Execute SQL inserir daily entry`** reconecta ao `Loop Over Items` |
| Corpo do laço | uma **corrente única** de 26 nós, de `Code Clean Campanhas` até o SQL |

### 🔴 2.1. A correção que a medição impõe ao desenho de 24/09

O ADR-38 §28.4 diz *"`onError` nos nós **HTTP**"*. **São 8 nós HTTP — mas há 12 portas externas
dentro do laço.** As outras 4 derrubam a execução exatamente igual.

| Porta externa dentro do laço | Quantos | No desenho de 24/09? |
|---|---|---|
| Google Ads — `v23 Bloco 1 Core` · `v23 Bloco 2 Termos` · `v23 Bloco 3 Canais` · `HTTP Request Google Ontem (D1)` · `(D3)` · `(D7)` | 6 | ✅ sim |
| Meta Ads — `HTTP Request Meta Ads` · `HTTP Request Meta Ads D-2` | 2 | ✅ sim |
| BigQuery — `BigQuery Série Diária` (lê) · `Execute SQL inserir daily entry` (escreve) | 2 | 🔴 **não** |
| Notion — `Create a database page Create Observation` · `Update a database page` | 2 | 🔴 **não** |

> ⚖️ **Decisão do planejador, 28/09: a fronteira cobre as 12, não as 8.** Não é ampliação de escopo —
> é **o mesmo conserto aplicado ao conjunto inteiro**. Fronteira que cobre 8 de 12 portas deixa três
> quartos do problema com a aparência de resolvido, **que é pior que não consertar**, porque ninguém
> volta a olhar.
>
> ⚠️ **`Get many database Campanhas` fica de fora, de propósito:** ele está **antes** do laço. Se
> falhar, nada roda — é outra falha, com outra consequência, e o vigia já a pega pelo **V4**.

---

## 3. O que construir — uma fronteira, não doze

| # | Mudança |
|---|---|
| **1** | `onError: continueErrorOutput` nas **12 portas** do §2.1 |
| **2** | 🆕 um nó **`Campanha pulada`** que recebe **todas** as saídas de erro |
| **3** | esse nó **reconecta ao `Loop Over Items`** — é o que faz o laço avançar (**Regra Crítica nº 5**) |
| **4** | e manda **Telegram** com **cliente · campanha · nó · motivo** — **R11 regra 2:** `continueErrorOutput` só com destino visível. **Erro que só existe no log de execução não existe** |

**O que o desenho recusa, de propósito** (e as recusas valem mais que a proposta):

| Recusado | Por quê |
|---|---|
| reordenar a fila para o Google vir antes | **esconderia o bug** |
| extrair o corpo do laço para subworkflow | é obra, e a **R7** manda preferir a solução mais simples que resolve |
| engolir o erro sem avisar | é o `onError: continueRegularOutput` que já custou duas semanas nesta casa |

---

## 4. 🔴 Como se prova — e o teste que importa não é o que você pensa

**O teste NÃO é *"o laço continua?"*.** É ***"o que acontece no dia em que nada falha?"*** — que é
**todo dia**.

> **É a lição de 18/09, a mais cara da casa:** *"o maior estrago não veio da mudança — veio da
> salvaguarda que instalei para protegê-la."* A checagem instalada para proteger o score **matou a
> Fase 3 por 8 dias, verde todo dia**, porque ninguém testou o caso saudável.
> **Salvaguarda é código novo em produção e exige o mesmo smoke que aquilo que ela protege.**

### 4.1. Teste A — o dia saudável (faça este PRIMEIRO)

1. conte as linhas de `phi_prod.raw_campaign_data` para **D-1**, **antes**;
2. rode o workflow manualmente, **sem nada quebrado**;
3. confira: **todas** as campanhas processadas · **nenhuma** mensagem de "pulada" no Telegram ·
   a contagem de D-1 **igual ou maior**, nunca menor.

🔴 **Se o caso saudável mudar de comportamento, PARE.** A salvaguarda está pior que o defeito.

### 4.2. Teste B — a falha forçada

1. **declare por escrito** o que vai quebrar e por quanto tempo (**R12**);
2. quebre **uma** porta de **uma** campanha (ex.: URL inválida em um HTTP);
3. confira: as **outras** campanhas entraram · o **Telegram chegou** com cliente, campanha, nó e
   motivo · a execução **terminou**, e não morreu no meio;
4. 🔴 **desfaça na mesma sessão** e **releia o nó** confirmando que voltou — *voltar se prova lendo,
   não lembrando*;
5. rode de novo e confirme verde.

> ⚠️ **Sobre rodar manualmente em produção:** este workflow coleta **D-1**, um dia já fechado, e
> grava por `MERGE` na chave `(client_id, platform, campaign_id, date)`. Reescrever a linha de ontem
> com os mesmos números é inofensivo — **mas prove**, com a contagem do 4.1 antes e depois. Campanha
> pulada **não escreve**, então a linha que já existia **permanece**.

---

## 5. 🔴 Uma medição a mais, que não é para consertar — é para relatar

Ao abrir o workflow, medi que o nó **`Schedule Trigger`** (tipo `executeWorkflowTrigger`, a porta
pela qual **outro workflow chama este**) está **DESABILITADO**.

**E a descrição do próprio workflow diz:** *"Roda 2x/dia: gatilho proprio 00h BRT e **operador unico
04h**"*.

| Se a porta estiver mesmo fechada | Consequência |
|---|---|
| o `operador unico metricas` (`cLcimNoefTOnVVbd`, 04h) **não consegue chamar** este workflow | ele roda **só às 00h**, não 2× |
| e a descrição do artefato **mente** | R13, regra 3 |
| e muda a conta da **Fase 2 do ADR-37** | o requisito das **07h** foi desenhado supondo o W1 rodando às 04h |

**O que fazer:** olhar a última execução do `operador unico` e ver **se ela chamou este workflow e o
que aconteceu**. 🔴 **Medir e relatar. NÃO religar o nó** — é outro defeito, com outro dono, e
religar sem entender é a **R12 ao contrário**. (Precedente exato: o `[P5] Entrada` desabilitado num
smoke de 16/09, que fechou a porta pela qual o P4 chamava o P5O.)

---

## 6. Critérios de aceite — escritos antes (R9)

| # | Critério | Prova |
|---|---|---|
| **CA1** | As **12 portas** do §2.1 têm `onError: continueErrorOutput` | listar os 12 nós e o valor lido **de volta** |
| **CA2** | Existe **um** nó `Campanha pulada` recebendo as 12 saídas de erro | contagem das conexões de erro = 12 |
| **CA3** | Esse nó **reconecta** ao `Loop Over Items` | ler as conexões e mostrar o caminho de volta |
| **CA4** | O alerta chega com **cliente · campanha · nó · motivo** | colar a mensagem do Telegram do teste B |
| **CA5** | 🔴 **O dia saudável não mudou** | teste A: contagem D-1 antes/depois + zero alerta falso |
| **CA6** | 🔴 **A falha de uma campanha não derruba as outras** | teste B: quantas entraram com uma quebrada |
| **CA7** | 🔴 **O que foi quebrado para testar VOLTOU** | releitura do nó, com o valor, **não** "eu desfiz" |
| **CA8** | O publicado é o que está no ar (**R13**) | `versionId == activeVersionId` depois de publicar |
| **CA9** | A descrição do workflow conta a mudança (**R5**) | duas frases: o que ganhou e por quê |
| **CA10** | A porta do `operador unico` foi **medida e relatada** (§5) | o que a última execução dele mostra |

---

## 7. Fora de escopo

| Fora | Por quê |
|---|---|
| religar o `Schedule Trigger` desabilitado | §5 — medir e relatar, não consertar |
| a **P-34** (o workflow mistura versões da API do Google Ads) | achado separado, já registrado no ADR-38 §28.5 |
| avisar que uma **credencial expirou** | 🔴 **o D1-d NÃO resolve isso.** Ele faz os outros clientes sobreviverem; **ninguém ainda avisa que o token do Meta venceu.** Adjacente e declarado — não amplie por conta própria |
| aposentar ou mexer no `PHI - Subworkflow Campanhas` | é a Fase 2 do ADR-37, travada pelas 07h |

---

## 8. Registro obrigatório (R3)

Ao **começar** e ao **encerrar**: linha na DB Notion **"PHI — Registro de Execuções (Sub-chats)"** —
frente · o que foi feito · estado · próximo passo · link.

**Ao terminar (R2):** atualizar o **ADR-38 §28.4** marcando o D1-d como executado, com a data e as
execuções; e o **as-built** se o real divergir deste plano — **o real vence o plano**.

---

## 9. O relatório de volta

1. Os **10 critérios**, com prova ou motivo da falha
2. Os **dois testes** do §4, com os números
3. A medição do **§5** — a porta do `operador unico`
4. **O que você mediu e me desmentiu.** Este brief foi escrito lendo o artefato hoje, e leitura erra
5. O que ficou de fora e por quê

> 🔴 **Se uma premissa cair, PARE e devolva.** Já aconteceu duas vezes esta semana, e **as duas vezes
> foi o trabalho certo** — a etapa que para antes do primeiro nó custa uma query; a que segue em cima
> de premissa falsa custa uma semana.
