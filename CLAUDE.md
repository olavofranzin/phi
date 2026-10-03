# PHI™ — as REGRAS. Leia este arquivo antes de qualquer implementação

| | |
|---|---|
| 🔴 **A linha que não se cruza** | **A RAIZ guarda REGRA. As FRENTES guardam FATO.** *Regra não lida causa estrago; fato não lido causa pergunta* — e pergunta o ponteiro resolve |
| **O que este arquivo é** | as **regras de trabalho R1–R15**, e só elas. É lido no início de **toda** sessão, inclusive nas que nunca tocarão numa frente |
| **O que ele NÃO é** | não é stack, não é id de Notion, não é tabela, não é história. Cada um desses tem dono, e os donos estão na tabela de ponteiros abaixo |
| **Verificado em** | 2026-10-03, pelo **sub-chat da Fase 1 da memória compartilhada**, **contra o próprio `CLAUDE.md` no commit `d543f16`** — o texto das regras foi **recortado** por script, não redigitado |
| **A porta da memória** | 🔴 [`docs/base/BASE-00-PORTA.md`](docs/base/BASE-00-PORTA.md) — **se você não sabe onde procurar, comece ali** |

---

## O que é o PHI

Monitoramento e gestão de campanhas de tráfego pago. Calcula um score de saúde diário por campanha e **orienta o gestor — nunca executa otimizações.**

🔴 **O porquê, o que o PHI não é, e as decisões-mãe:** [`docs/base/BASE-01-PRINCIPIOS.md`](docs/base/BASE-01-PRINCIPIOS.md). Este arquivo **não é dono** desse fato.

---

## Por onde começar, por assunto

> **Nenhuma linha desta tabela afirma um fato — todas apontam para o dono dele.** É a regra 1.1 do `BASE-00` aplicada a este arquivo.

| Se a conversa é sobre… | Leia (o dono do fato) |
|---|---|
| 🔴 **Não sei onde procurar / quem é dono deste fato** | [`docs/base/BASE-00-PORTA.md`](docs/base/BASE-00-PORTA.md) |
| **Por que o PHI existe, e o que ele não é** | [`docs/base/BASE-01-PRINCIPIOS.md`](docs/base/BASE-01-PRINCIPIOS.md) |
| **Stack, credencial, id de Notion, onde cada coisa vive e se está no ar** | [`docs/base/BASE-02-SUPERFICIES.md`](docs/base/BASE-02-SUPERFICIES.md) |
| **Qual invariante existe, e se já foi violado** | [`docs/base/BASE-03-INVARIANTES.md`](docs/base/BASE-03-INVARIANTES.md) |
| 🔴 **Já tentamos isso e deu errado? Quanto custou?** | [`docs/base/BASE-04-INCIDENTES.md`](docs/base/BASE-04-INCIDENTES.md) |
| **Por que este workflow/tabela existe** | [`docs/base/fichas/`](docs/base/fichas/) + a descrição do próprio artefato (**R5**) |
| **Onde o projeto está · quanto falta · achar qualquer doc** | `docs/strategic-planning/ESTADO-DO-PROJETO.md` (§0 PAINEL) · `DEFINICAO-DE-PRONTO-PHI-V1.md` · `MAPA-DE-DOCUMENTACAO.md` |
| **Score de mídia / parque PHI** (métricas, BigQuery, Notion, vigias) | `docs/strategic-planning/saude-digital/CLAUDE.md` |
| 🔴 **Regras críticas de n8n / BigQuery / Google Ads, e o cliente de teste** | `docs/strategic-planning/saude-digital/REGRAS-CRITICAS-IMPLEMENTACAO.md` |
| **Otimização / cérebro de análise (“Módulo 28” / T28)** | `docs/strategic-planning/otimizacao-campanhas/CLAUDE.md` |
| **Webview** (o que está no ar, e as dívidas declaradas) | `docs/strategic-planning/webview/CLAUDE.md` |
| **Saúde Digital do Negócio** (o pilar não medido) | `docs/strategic-planning/saude-digital-do-negocio/CLAUDE.md` |
| **Prospecção** (leads, GBP, planilha, CRM) | `docs/strategic-planning/prospeccao/CLAUDE.md` |
| **CRM Odoo** | skills `phi-odoo-crm` e `odoo-19-dev` |
| **RTK** (o proxy de token) | `docs/ferramentas/rtk.md` |
| **Procedimentos da agência** (quem faz o quê) | **Miro — `Board Agência`** · `https://miro.com/app/board/uXjVHecmR7c=/` ⚠️ **não a `Cópia`** |
| **Tarefa, estado, quem destrava** | **Notion — `PHI - Gestão de Projetos`** (`774518d2128a4b10aede511718737058`) |

> ⚠️ **Dois scores diferentes, não confundir:** `phi_value` (saúde da **campanha**) e `potencial_comercial` (qualidade do **lead**). Frentes, donos e ADRs distintos.

---

## VERIFICAÇÃO 
Antes de finalizar QUALQUER tarefa:
1. Descreva como você vai verificar se o resultado está correto.


---

## Regras que você deve seguir

### Comunicação
- Fale comigo sempre em português, de forma simples e sem jargão.
- Antes de mudar algo grande, me explique o plano e espere eu aprovar.
- Prefira a solução mais simples que resolve. Nada de complicar sem motivo.

### R1 — Seu papel no chat-mãe é PLANEJAMENTO ESTRATÉGICO, não execução
Este chat é o **chat-mãe**: estratégia, arquitetura, decisão, priorização, ADR, roadmap.
**Execução longa vai para sub-chat** — construir workflow, escrever módulo, depurar infra,
mexer em servidor, caçar bug.

**Como agir:**
- Tarefa de execução com mais de ~3 passos, ou que exija ler muitos arquivos/logs/telas →
  **PARE. Escreva o brief** (`docs/handoff/AAAA-MM-DD-<tema>-subchat-brief.md`) e **devolva o
  brief**. Não execute aqui.
- Se já gastou **várias rodadas em troubleshooting**, isso por si só é o sinal: diga
  explicitamente "isto virou execução, deveria ser sub-chat" e proponha a migração.
- **Fica no chat-mãe:** decisão, ADR, priorização, roadmap, leitura de estado, revisão de plano,
  desenho de arquitetura e escrita de brief.

> 🔴 **A branch de trabalho é declarada no brief, não aqui** — a exigência e o seu formato são da
> **R15**, e as duas histórias de branch estão em
> [`docs/base/BASE-04-INCIDENTES.md`](docs/base/BASE-04-INCIDENTES.md#7-D7-branch-ditada-por-engano).
>
> **Motivo:** em 26/09 a instrução da sessão venceu o brief e o ADR-41 citou documento inexistente — história completa em [`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#7-D7-branch-ditada-por-engano).

> **Motivo:** em 29/09 aconteceu de novo — declarar a branch com mais destaque não resolveu; a trava é a R15 — história completa em [`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#7-D7-branch-ditada-por-engano).

> **Motivo:** execução morando aqui lota o contexto e o planejamento se perde — história completa em [`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#11-D11-execucao-no-chat-mae).

### R2 — Etapa concluída = documentação atualizada NA MESMA SESSÃO
**Nenhuma etapa é "concluída" enquanto a documentação não refletir isso.** Ao terminar uma entrega:
1. Atualizar o **doc canônico** da frente (ADR / contrato / spec).
2. Registrar o **as-built** quando o real divergir do planejado — **o real vence o plano**.
3. Pôr **banner de HISTÓRICO** no topo de todo doc que virou retrato de um momento passado.
4. **Commit no git.**

> **Motivo:** em 08/09 a doc da Prospecção descrevia workflows mortos havia semanas — história completa em [`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#2-D2-documento-que-mente).

> 🔴 **5. Marque ONDE SE PROCURA, não só onde se narra.** Tabela do topo, checklist, placar. **O
> corpo do documento não substitui o cabeçalho** — ninguém lê §14 a §19 para saber se uma etapa
> aconteceu; lê a primeira tabela.
>
> **Motivo:** em 18/09 o ADR-38 estava executado havia 9 dias e o cabeçalho dizia que não — história completa em [`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#2-D2-documento-que-mente).
>
> **Um documento pode estar completo no corpo e mentir no cabeçalho — e o cabeçalho é o que se lê.**

### R3 — Sub-chat é OBRIGADO a registrar no Notion (senão o digest diário morre)
Existe um workflow n8n **ativo**: `PHI — Digest Diário de Progresso (Registro de Execuções)`
(`rhobbBEeQaiWIuiF`, 08:30 BRT). Ele lê a DB Notion **"PHI — Registro de Execuções (Sub-chats)"**
e manda o andamento do projeto no Telegram do Olavo.
**Hoje ele avisa "sem progresso" — não porque nada anda, mas porque ninguém escreve na DB.**

**Todo sub-chat DEVE**, ao **começar** e ao **encerrar** cada bloco de trabalho, criar/atualizar
uma linha na DB com: **frente · o que foi feito · estado** (em andamento / concluído / bloqueado)
**· próximo passo · link do artefato**. Sem isso o Olavo perde a visão do projeto. (Ver ADR-32.)

### R5 — Todo artefato carrega a própria história (descrição fiel)
A **descrição** de um workflow (n8n), módulo ou tabela deve dizer, em duas frases: **o que ele faz**
e **por que existe** — incluindo **o que ele substituiu e por quê**.

- Ao criar ou alterar um artefato, **atualize a descrição na mesma sessão**.
- **Descrição copiada de outro artefato é bug** (foi o caso de 3 workflows da Prospecção).

> **Motivo:** em 08/09 a auditoria não descobriu por que o `Daily Entry` saiu do ar — história completa em [`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#8-D8-intencao-nao-escrita).

**Procedimento canônico de aposentadoria** (precedente `[APOSENTADO 2026-07-21] PHI - Loop Alerta
Fase 1` — o único workflow do parque que hoje passa no teste da R5):
1. consolidar a função no workflow que fica; 2. **desabilitar o nó chamador**; 3. desativar o
workflow; 4. **renomear com o prefixo `[APOSENTADO <data>]`**; 5. sticky note dizendo **por que** e
**proibindo reuso**. Nunca apagar sem esses 5 passos — o nome e o sticky são a memória.

### R6 — Plano aceito não dispensa verificação (o dado vence o plano)
Antes de uma ação **irreversível ou em produção**, **verifique a premissa que a justifica** — mesmo
que o plano já esteja **aceito** num ADR. Se o dado desmentir o plano:
**pare, não execute, corrija o ADR e registre o porquê.**

> **Motivo:** em 08/09 a Fase 0.2 do ADR-37 foi cancelada na hora de executar, e salvou a Fase 3 — história completa em [`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#4-D4-numero-e-gravidade-herdados).

> **Motivo:** em 26/09 dois critérios de aceite nasceram de defeitos que já não existiam — história completa em [`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#4-D4-numero-e-gravidade-herdados).

> **Motivo:** em 02/10 o chat-mãe inflou gravidade duas vezes no mesmo dia — história completa em [`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#4-D4-numero-e-gravidade-herdados).

### R7 — Nada se cria sem plano pronto. E todo plano começa procurando o que já existe
**Antes de construir qualquer coisa nova** — workflow, skill, agente, coluna, tabela, pasta — **tem de
existir um plano escrito e aprovado pelo Olavo.**

E **em cada etapa do plano**, antes de propor construir, responder por escrito:
1. **Existe skill instalada** que já faz isso? (`ListSkills` / `SearchSkills` — não confie na memória)
2. **Existe workflow** que já faz? **Existe coluna** que já guarda?
3. Se procurei e **não existe**, **registrar que procurei** — senão a próxima sessão procura de novo.

> **Motivo:** o `1º Enriquecimento`, o `id_hubspot` e as 6 dimensões do score custaram semanas — história completa em [`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#9-D9-construir-o-que-ja-existia).

### R8 — Skill primeiro; subagente é a exceção
**O padrão é a skill** — instrução determinística, versionada em pasta. **Orquestrar vários agentes é
exceção**, reservada a tarefa de alta volatilidade.

| Escolha **skill** quando | Escolha **agente/subagente** quando |
|---|---|
| a tarefa se repete **com a mesma forma** | cada execução é diferente e exige **decidir** |
| é frequente e estruturada | precisa de **humano no loop** antes de publicar |
| você quer previsibilidade e custo baixo | há **paralelismo real** ou depuração ao vivo |

> **Teste prático:** *"se eu escrevesse isso num checklist, outra pessoa executaria igual?"* Se sim, é
> skill. Se a resposta depende de julgamento a cada caso, é agente.
>
> **Motivo:** o `phi-diagnostico` é o agente que virou skill e passou a ser testável sem token — história completa em [`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#12-D12-orquestracao-onde-skill-bastava).

### R10 — Modelo caro só onde há julgamento (escada de modelos)
Tarefa básica usa **modelo rápido e barato**; tarefa que exige **raciocínio e qualidade de entrega**
usa **modelo forte**. Escolher o modelo é decisão de arquitetura, não detalhe.

| Camada | Para quê | O que usamos hoje |
|---|---|---|
| **Rápido / barato** | extrair, estruturar, classificar, formatar, redigir com molde pronto | **Gemini Flash** (`gemini-2.5-flash`) na cadeia de enriquecimento |
| **Forte** | diagnosticar, decidir, priorizar, escrever abordagem, planejar | **Claude Sonnet 5** no nó de Diagnóstico (T28) · **Opus 5** no planejamento |

> **A regra é do degrau, não da marca.** Escreva "camada rápida" e "camada forte" — nunca prenda a
> regra ao nome de um fornecedor. Modelo troca de nome e de preço a cada poucos meses; **o degrau
> permanece.** É a mesma lição do `id_crm` e do `campaign_id` sem prefixo: **não grave no nome o que
> pertence a outro campo.**
>
> **Teste prático:** *se a resposta certa está determinada pelo dado de entrada, é camada rápida. Se
> duas pessoas competentes responderiam diferente, é camada forte.*
>
> ⚠️ **Antes de trocar de modelo para economizar, meça.** Custo estimado no papel já nos levou a
> discutir soluções trabalhosas para economizar valor que ninguém tinha medido.

### R9 — A ordem do trabalho: alinhar → planejar → isolar → revisar
1. **Entrevista de alinhamento antes do primeiro token de execução.** Perguntar até a ambiguidade
   acabar. Ambiguidade não resolvida vira retrabalho, não vira criatividade.
2. **Plano barato antes da construção** (é a **R7**).
3. **Contexto isolado por camada** — cada sub-chat com o seu (é a **R1**).
4. **Quem revisa não é quem executou**, e o critério de aceite é **escrito antes**. Reprovou, volta com
   relatório do defeito. **Limite de 3 voltas** — na terceira, o problema é o plano, não a execução.

> **Motivo:** em 16/09 a entrevista chegou depois da construção — autópsia, não entrevista — história completa em [`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#10-D10-entrevista-atrasada).

### R11 — Sucesso silencioso é o modo de falha desta casa
**Nó que roda verde fazendo o contrário do que o nome diz** já nos custou caro **sete vezes** —
**e as sete estão na tabela do `BASE-04`, contadas**:

> **Motivo:** sete nós verdes fazendo o contrário do nome, de 09 a 10/2026 — história completa em [`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#1-D1-vazio-vira-outra-coisa).

**As cinco regras que saem daí:**
1. 🔴 **A falta de critério nunca pode significar "todos".** Filtro sem valor, busca sem chave, lote
   sem limite → o fluxo **para**, não processa tudo. Use uma chave impossível (`__SEM_VALOR__`) em vez
   de deixar vazio.
2. **`onError: continueRegularOutput` só com destino visível para o erro** — coluna, alerta, tabela.
   Erro que só existe no log de execução **não existe**.
3. **Nó do n8n roda uma vez por item de entrada.** Chamada cara com muitos itens na entrada é
   **multiplicação**, não leitura. E **loop não conserta cota se o que custa ficou dentro dele** —
   antes de bater lote, pergunte o que está sendo repetido.
4. **Antes de chamar algo de "smoke", conte quantos itens entraram na fila.** Afirmar escopo sem medir
   é a **R6** quebrada, só que mais rápido.
5. 🔴 **O comportamento no caso VAZIO se escolhe de propósito. O vazio tem TRÊS caras, e as três já
   nos morderam:**

   | O vazio vira | Onde | O estrago |
   |---|---|---|
   | **"todos"** | filtro sem valor, busca sem chave | smoke de 1 virou escrita em 20 |
   | **"pare"** | nó n8n que devolve 0 itens | Fase 3 morta 8 dias, verde |
   | **"zero"** | **query agregada** (`COUNT`/`SUM` sem `GROUP BY`) | *"sem histórico"* em campanha com 250 dias |

   **A terceira é a mais traiçoeira: a query sempre devolve uma linha, então "não achei" e "achei
   zero" saem idênticos** — e o consumidor não tem como distinguir. É a mesma doença dos guardrails
   8/9 (`conversions=0 ⇒ CPA indefinido`) e do **I3** da Prospecção (*vazio nunca é 0*), agora na
   forma de **shape de consulta**, não de dado. **Se um zero pode significar "não encontrei", traga
   junto a contagem do que casou.**

   **Nunca deixe o vazio herdar o padrão** — do nó, da query, da linguagem. **O padrão é diferente em
   cada um, e nenhum deles foi escolhido pensando no seu caso.**

> 🔴 **E a lição mais cara da casa, de 2026-09-18:** *"o maior estrago não veio da mudança de
> identidade — veio da **salvaguarda** que instalei para protegê-la."*
>
> **Salvaguarda é código novo em produção e exige o mesmo smoke que a mudança que ela protege.** O
> teste que faltou não era *"a checagem pega duplicata?"* — era **"o que acontece no dia em que ela
> não pega nada?"**, que é **todo dia**.

> **Teste prático:** *"se este nó fizesse silenciosamente o oposto do que eu espero, eu perceberia?"*
> Se a resposta for não, **falta um limite ou um carimbo** — não falta confiança.

### R12 — Configuração mudada para teste volta na mesma sessão
**Estado temporário sem prazo vira estado permanente invisível.** Já nos custou **três vezes**:

> **Motivo:** quatro estados temporários que não voltaram, de 16/09 a 01/10 — história completa em [`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#3-D3-estado-temporario-que-nao-volta).

**As duas regras:**
1. **Antes de fechar a sessão, liste o que foi mudado para teste e releia o artefato confirmando que
   voltou.** Voltar se prova **lendo, não lembrando**.
2. **Ao desabilitar algo para testar, a nota ou o sticky diz quando religar.** Nó desabilitado não
   tem cor, não tem alarme e não aparece em lista nenhuma — **é a mudança mais silenciosa que existe
   no n8n.**
3. 🔴 **Antes de fechar, confirme `versionId == activeVersionId`.** Estado temporário não é só
   configuração mudada — **é também rascunho deixado para trás.** Um draft sobre workflow ativo não
   tem cor, não tem alarme e **não aparece em lista nenhuma**, igual ao nó desabilitado; só que ele
   **embarca na próxima publicação**, qualquer que seja o motivo dela.

> **Teste prático do fechamento:** *"o que está no ar é igual ao que está salvo?"* Se não, **ou
> publica de propósito, ou descarta de propósito.** Deixar diferente é escolher que outra pessoa
> decida por você, sem saber que está decidindo.

> ⚠️ **Ver também a R13:** o que a ferramenta devolve não é necessariamente o que está no ar.

### R13 — Leia o que está NO AR, não o que está na tela
**No n8n, a leitura mais natural devolve o rascunho — e o rascunho é uma proposta, não o sistema.**
Isso já escondeu um caminho de produção quebrado por **dois dias**.

| O que parece | O que é |
|---|---|
| `nodes` no retorno do workflow | **o RASCUNHO.** O que roda está em `activeVersion.nodes` |
| `triggerCount: 0` | conta gatilhos **ATIVOS**, não declarados — workflow inativo com `scheduleTrigger` dentro reporta zero |
| a chamada de update **não deu erro** | o n8n salva o rascunho **e depois** publica. **Publicação recusada deixa a alteração só no rascunho** |

**As duas regras:**
1. **Antes de afirmar o que um workflow ativo faz, compare `versionId` com `activeVersionId`.** Se
   `sameAsDraft` for `false`, **você está lendo uma proposta.**
2. **Depois de alterar workflow ativo, releia e confirme que publicou.** *"Não deu erro"* não é
   *"está no ar"*.

> **Motivo:** em 02/10 a igualdade de ids revelou-se inalcançável, e fez recusar a ação certa — história completa em [`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#5-D5-rascunho-confundido-com-o-ar).

> **Motivo:** em 16/09 duas leituras do workflow leram o rascunho e esconderam produção quebrada por 2 dias — história completa em [`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#5-D5-rascunho-confundido-com-o-ar).

**3. Documentação de configuração se escreve DEPOIS de reler o artefato.** Em uma semana, **três**
documentos afirmaram um fato que o artefato contradizia:

> **Motivo:** três documentos, numa semana, afirmaram o que o artefato contradizia — história completa em [`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#2-D2-documento-que-mente).

> **Escreva o que você leu de volta, não o que você mandou fazer.** Documentar a intenção no lugar do
> artefato é pior que não documentar: cria uma testemunha falsa que a próxima auditoria acredita.

**4. Duas coisas NÃO moram na versão — e por isso valem sem publicar.** `settings` (e dentro dele o
`errorWorkflow`) e a **descrição** são metadados **de workflow**, não conteúdo de versão: a
`activeVersion` só carrega `nodes`, `connections` e `nodeGroups`.

> Consequências práticas, medidas em 19/09: trocar a descrição **não muda o `versionId`**; e um
> `errorWorkflow` configurado **já protege** um workflow cujo rascunho nunca subiu. O inverso da
> armadilha acima — aqui o que você salvou está valendo, mesmo sem publicar.

### R14 — Identidade se casa por chave declarada e não-coagível
**Em uma semana, duas frentes independentes, a mesma doença:**

> **Motivo:** duas frentes independentes, na mesma semana, casando identidade por posição e por chave coagível — história completa em [`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#6-D6-identidade-por-posicao).

**As três regras:**
1. 🔴 **Posição em array, ordem de chegada e número que parece id NUNCA são identidade.** `[0]`,
   `.first()`, "o primeiro item" e "o que chegou agora" são **acidentes de execução**, não chaves.
2. **A chave viaja com o dado, carimbada no envelope** — `client_id` + `source` + `source_id` +
   janela. Quem consome **casa por chave**, nunca por índice.
3. 🔴 **Chave ausente ou em conflito PARA e grita, com nome.** Nunca cai para "o primeiro", nunca
   para "todos" (é a **R11 regra 1**). O sinal tem código próprio — `CLIENT_IDS_NOT_FOUND` é o
   precedente da casa.

> **Teste prático:** *se duas linhas trocassem de ordem na entrada, o resultado mudaria?* Se sim,
> **você está usando posição como identidade.**
>
> **E o corolário de tipo:** *id não é número.* `'007'` e `7` são o mesmo valor para o JavaScript e
> **clientes diferentes** para o negócio. **Compare como texto, normalize uma vez, e declare onde.**
> (É a mesma lição do `client_id` × `client_slug` da regra crítica 4, e do `campaign_id` sem prefixo.)

### R15 — Todo brief responde três perguntas: onde commito, onde leio, onde registro
**Executor nenhum deveria ter de adivinhar nenhuma das três.** Quando ele adivinha, acerta às vezes —
e esta casa já pagou por cada uma delas.

**O cabeçalho obrigatório de todo brief e de toda mensagem de execução:**

| # | O que o brief diz | Formato |
|---|---|---|
| **1** | 🔴 **ONDE COMMITO** — a branch | nome + **URL completa** + o comando de `checkout` |
| **2** | 🔴 **ONDE LEIO** — o `CLAUDE.md` da frente | caminho, **com o mesmo destaque da branch** |
| **3** | 🔴 **ONDE REGISTRO** — o doc canônico que fecha a etapa | o arquivo onde o as-built será escrito (**R2**) |

**E a trava que faz a 1 funcionar:**

> 🔴 **Antes do PRIMEIRO commit, o sub-chat compara a branch do brief com a da instrução da sua
> sessão. Se divergirem, PARA e avisa.** Não escolhe sozinho, não commita *"provisoriamente"*.
>
> **Teste prático:** *"eu tenho duas ordens sobre onde commitar?"* Se sim, **a dúvida vem antes do
> commit — depois vira mudança de histórico.**

> 🔴 **EMENDA 2026-10-03 — a trava disparou, funcionou, e abriu um buraco na R3.** O sub-chat da
> Fase 1 **parou certo** (as duas branches divergiam) — e **não registrou nada no Ledger**, porque
> tratou *"não commitar"* como *"não registrar"*. **São duas decisões diferentes, e ele as misturou.**
>
> **Resultado:** um sub-chat **parado esperando o Olavo** foi exatamente o que o digest das 08:30
> **deveria** ter mostrado, e mostrou *"sem progresso"*.
>
> **A regra:** **parar é um estado, e estado se registra.** Quem para pela trava **escreve a linha de
> abertura no Ledger ANTES de parar**, com estado **`bloqueado`** e o *próximo passo* = *"aguarda o
> Olavo decidir a branch"*. **A trava barra o commit; ela nunca barra o registro.**
>
> ⚠️ **E o corolário honesto:** linha de abertura **não se cria depois**. Criada no fim, ela afirma
> que alguém sabia do bloqueio no dia em que ninguém soube — é **testemunha falsa** (**R13** regra 3).
> **Perdeu a abertura, registre a perda; não a invente.**

**Motivo, as três medidas:** (1) **duas vezes** um sub-chat commitou na branch errada porque a
instrução da sessão dele vencia o brief — e **declarar a branch com mais destaque não resolveu**;
(2) a raiz deste arquivo **só aponta** o caminho das frentes, então **quem não recebe o ponteiro não
lê a frente**; (3) em 02/10 o chat-mãe escreveu **três** fechamentos no lugar do executor, porque o
brief não dizia **qual** documento fechava a etapa. *Histórias completas em
`docs/base/BASE-04-INCIDENTES.md`.*

> ⚠️ **A exigência da branch já vivia dentro da R1, em bloco de citação.** A **R15 é o lugar dela
> agora** — a R1 fica com o papel (chat-mãe × sub-chat) e o enxugamento a deixa só com o ponteiro.

### R4 — Uma pergunta que todo chat responde antes de fechar
> *"Onde estamos, quanto falta, e o que eu atualizei para provar isso?"*
Se não souber responder, a etapa não acabou.


---

## O que saiu deste arquivo na Fase 1, e para onde

| O que saiu | Para onde | Por quê |
|---|---|---|
| **as histórias** dos motivos das regras | `docs/base/BASE-04-INCIDENTES.md` | ordenadas por **frequência da doença**, que a ordem cronológica escondia |
| **Stack** · **ids do Notion** | `docs/base/BASE-02-SUPERFICIES.md` | **já era dono** — duas cópias divergirem é questão de tempo |
| **tabelas do BigQuery** | `saude-digital/CONTRATO-PHI.md` | já era dono |
| **as 14 Regras Críticas** · **o cliente de teste** | `saude-digital/REGRAS-CRITICAS-IMPLEMENTACAO.md` | é fato de frente, não regra de raiz |
| **o bloco T28** | `otimizacao-campanhas/CLAUDE.md` | idem |
| **Documentação no Notion** | `MAPA-DE-DOCUMENTACAO.md` | já era dono |
| **RTK** | `docs/ferramentas/rtk.md` | é ferramenta, não regra |
| **o repositório e a branch** | `docs/base/BASE-02-SUPERFICIES.md` §3.2 | 🔴 e a **contradição foi consertada**: este arquivo declarava **uma branch obsoleta** (último commit em abril/2026) numa seção, e a branch certa na R1. **Qual é a branch, quem diz é o brief — R15** |

> 🔴 **A prova de que nada se perdeu é mecânica:** `python3 scripts/fase1-memoria/provar.py`. Ela recorta cada bloco do commit `d543f16` e falha se qualquer história, qualquer fato ou qualquer palavra de regra não estiver onde deveria.

*PHI™ — regras R1–R15. Enxugado na Fase 1 da memória compartilhada, 2026-10-03.*
