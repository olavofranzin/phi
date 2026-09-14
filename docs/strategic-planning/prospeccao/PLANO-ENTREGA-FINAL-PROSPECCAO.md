# Plano da Entrega Final — Prospecção

| | |
|---|---|
| **Status** | 🟡 **RASCUNHO** — base escrita pelo Olavo em 2026-09-14, complementada neste documento |
| **Papel** | **Documento-base do planejamento da frente Prospecção.** Trabalha junto com o `CLAUDE.md` |
| **Método** | Desenhar o **ponto final** primeiro; depois engenharia reversa até o que existe hoje |
| **Por que só Prospecção** | é a frente-piloto. O que aprendermos aqui vai para as outras |
| **Regra que o rege** | **R7** — nada se cria sem plano pronto, e cada etapa checa se há skill que já resolve |

---

## 1. O que existe hoje (escrito pelo Olavo, preservado)

- **Workflows de prospecção no Google Maps** (Places API ou Apify) entregando: endereço, site (se
  houver), redes sociais (se houver), horário, quantidade de fotos, quantidade de reviews, nota e
  mais alguns itens.
- **Algumas notas são atribuídas.**
- **Se há site e ele não é rede social:** análise pela **API do PageSpeed**; os dados vão a um agente
  que faz o **enriquecimento do site**, o **enriquecimento do GBP** (com base nas pontuações) e o
  **enriquecimento do lead**.
- **Nota de potencial comercial** é gerada e atribuída ao lead; ela e outras informações (como o que
  do portfólio será ofertado) são **cadastradas no CRM**.
- **Nota de corte existe, mas está desligada de propósito** — hoje é apenas indicativa. A decisão é
  observar **qual perfil faz sentido para o nosso processo** e se essa pontuação serve de base para
  definir o **ICP**. *(Ver §4 — tem consequência de custo.)*
- **No CRM:**
  - Agentes **ainda não ativados** que fariam: inclusão do **NBA**; acompanhamento de **follow-ups e
    transcrições de reunião**; **sugestão de abordagem**.
  - A cada etapa do lead, o **status** é atualizado na planilha, assim como NBA e abordagem sugerida.
  - O **desfecho final** (ganho/perdido + motivo) vai para a planilha para **formar a base de
    aprendizagem** dos agentes da área comercial.
- **A planilha:** é a base de aprendizagem dos agentes; tem **backup diário**.
- **Restrição declarada:** estamos presos aos **limites gratuitos** das ferramentas.

## 2. O que poderemos fazer (escrito pelo Olavo, preservado)

1. Prospectar **todo o setor de uma localidade** (cidade ou região).
2. Um **agente analista** que lê **tudo** o que está na planilha para aquele lead (pontuações, nota,
   quantidade de avaliações, todos os enriquecimentos) e atribui: **serviços da oferta**, **potencial
   comercial**, **prioridade** e **abordagem sugerida**. Terá acesso a um **DB de estratégias de
   vendas e objeções**.
3. Transformar em **skills** os prompts dos agentes de enriquecimento.
4. Um workflow onde se inclui **1 lead** e recebe de volta **todas as análises**.
5. Uma **pasta no GitHub para cada ramo do projeto** (o do Miro), cada uma com seu `CLAUDE.md`.
6. Uma **cadência** de contato com o lead.
7. **DM no Instagram** como 2ª etapa do pipeline — "abordagem de aquecimento".
8. `CLAUDE.md` organizado para que **cada sessão nova saiba o histórico** e **onde achar o que
   precisa** por assunto.
9. **Enriquecimentos mais diretos:** são consumo interno. Relatar de forma clara e estruturada, sem
   escrever "texto para o lead ler". Quem escreve para o lead é o agente de abordagem.
10. No enriquecimento do site, **obter o e-mail de contato**.
11. Uma **skill** para descobrir se o lead tem perfil em **Instagram, LinkedIn, TikTok e YouTube**.
12. Uma **skill** para analisar as redes encontradas: seguidores, contas seguidas, total de posts,
    como a bio está escrita, frequência de postagem, sinais de engajamento.

---

# COMPLEMENTO (Claude, 2026-09-14)

## 3. A base de aprendizagem — corrigido pelo Olavo (2026-09-14)

O item mais importante do §1 é este: *"o desfecho final vai para a planilha para formar a base de
aprendizagem"*. Quase tudo do §2 come dessa base.

> ✅ **Correção do Olavo:** *"estas alterações estavam a cargo de um sub-chat e foram parcialmente
> sanadas."* O alarme de 13/09 (`id_hubspot` → `id_crm` quebrando P5/P6 em silêncio) **já foi
> parcialmente resolvido**. Registrado aqui porque **hipótese desmentida também se registra** (R6).

**Mas a verificação precisa olhar a coluna certa.** O Olavo citou que *"vários leads já possuem até os
enriquecimentos preenchidos"* — e isso é verdade, **mas prova outra coisa**:

| Coluna preenchida | Quem escreve | O que prova |
|---|---|---|
| `enriquecimento`, `enriquecimento_site`, `analise_gbp_ia` | **P4** | que o **enriquecimento** funciona — o P4 nunca quebrou |
| `status_crm`, `motivo_perda`, `motivo_ganho`, `data_fechamento`, `data_sync_crm` | **P6** | que a **base de aprendizagem** está sendo alimentada |

**São workflows diferentes.** Enriquecimento é o que sabemos *antes* de falar com o lead; desfecho é o
que aprendemos *depois*. O aprendizado vive no segundo.

> ✅ **Resposta do Olavo (2026-09-14): "o processo ainda não está rodando".** Não há lead fechado
> para conferir. **O alarme se dissolve — mas vira outra coisa, mais importante:**
>
> 🎯 **A base de aprendizagem não está quebrada: ela está VAZIA, e o caminho até ela nunca foi
> percorrido inteiro.** Ninguém jamais marcou ganho/perdido no CRM e viu chegar na planilha.
>
> **Isso muda o critério P4.** Ele não se verifica por consulta — só se verifica **fechando um lead de
> verdade**. E enquanto isso não acontecer, todo agente que "aprende com o desfecho" está sendo
> desenhado sobre um caminho **não testado**.
>
> **Consequência prática para a ordem de trabalho:** o **primeiro lead fechado ponta a ponta vale mais
> que qualquer lote**. Ele é que prova o circuito — prospectar → CRM → contato → desfecho → planilha.
> Antes disso, escalar volume é multiplicar algo que ainda não se sabe se fecha o ciclo.

### 3.1 🔴 O backup está incompleto — e a base de aprendizagem é o ativo

> *"o bkp ainda não pega algumas colunas apesar de eu já ter trocado no db nativo do n8n."* — Olavo

Isso é mais sério do que parece. **Se a planilha é a base de aprendizagem de toda a área comercial,
um backup que perde colunas é uma perda silenciosa do ativo principal.**

**A causa é de desenho:** um backup que lista colunas **uma a uma** fica desatualizado a cada coluna
nova — e já criamos `sync_por`, e vamos criar mais.

**A correção:** o backup deve copiar **a aba inteira**, sem enumerar coluna. Backup que precisa ser
mantido em dia não é backup — é mais um lugar para esquecer. *(Tarefa pequena, entra no §7.)*

## 4. ⚖️ A tensão central do plano: volume × custo

Dois itens do §2 puxam para lados opostos:

| | |
|---|---|
| **"Prospectar todo o setor de uma localidade"** | multiplica o volume |
| **"Ficamos presos aos limites free"** | limita o volume |

E há um terceiro fator, que é **decisão consciente sua e está certa**: a nota de corte está desligada
para não enviesar a formação do ICP (é o invariante **I5** — filtrar a entrada torna o score
irrefutável). Só que o corte é **exatamente o mecanismo que governa gasto de Apify/IA**.

> **Resumo honesto:** hoje **todo lead recebe enriquecimento completo**. Isso é ótimo para aprender e
> caro para escalar. **Aprender e escalar não podem crescer juntos sem uma decisão.**

**Três saídas (a escolher, não a descobrir na fatura):**
1. **Limitar a geografia por lote** — prospecta tudo, mas de uma cidade/setor por vez. Mantém o
   aprendizado íntegro e o custo previsível. *(mais simples)*
2. **Enriquecimento em dois passos** — 1º passo barato para todos (dados do Maps, sem LLM e sem
   PageSpeed); 2º passo caro só para uma faixa **+ amostra aleatória** dos de fora. A amostra é o que
   preserva o I5.
3. **Aceitar o custo** e sair do limite gratuito, com teto declarado.

**4ª saída, proposta pelo Olavo:** *"criar várias credenciais do Apify... seria trabalhoso mas
manteria o volume × custo."*

⚠️ **Funciona tecnicamente, mas carrega dois riscos que precisam estar escritos antes de virar plano:**
1. **Termos de uso.** Criar contas múltiplas para contornar o limite gratuito costuma ser proibido
   expressamente pelos termos. O risco não é a multa — é o **banimento**, e aí a prospecção inteira
   para de uma vez, sem aviso.
2. **Custo operacional escondido.** Rodízio de credencial, controle de qual esgotou, falha
   intermitente quando uma cai. É trabalho recorrente para sempre, não uma vez.

> **E o principal:** essa decisão estaria sendo tomada **para economizar um valor que ainda não
> medimos**. Pode ser que o pay-as-you-go custe pouco o bastante para o rodízio não valer o risco.

⚠️ **Falta o número que decide tudo: o custo por lead enriquecido.** Levantar é barato e muda a
conversa. **Sem ele, qualquer das quatro saídas é chute.** *(Ver §7, item 0.)*

**Alavanca que vale mais que credencial nova:** não chamar a API duas vezes pelo mesmo lead. Dedup por
`place_id` e cache do que já foi coletado reduzem chamada sem custar termo de uso nenhum.

## 5. O ponto final — o que é "Prospecção pronta"

O §2 é uma lista de **capacidades**. Ponto final é outra coisa: é saber **quando parar**. Proposta de
critérios, no mesmo espírito da `DEFINICAO-DE-PRONTO-PHI-V1.md`:

| # | Critério | Como se verifica |
|---|---|---|
| **P1** | **Um lead entra e sai analisado** pelo workflow de lead único | rodar com 1 lead real e conferir a saída completa |
| **P2** | **Uma cidade + setor** roda ponta a ponta sem intervenção manual | 1 execução completa, sem ninguém tocar |
| **P3** | Todo lead no CRM chega com **oferta, prioridade, abordagem e NBA** | abrir 10 leads no Odoo e conferir os 4 campos |
| **P4** | O **desfecho volta à planilha** com motivo, automaticamente | marcar ganho/perdido no CRM e ver chegar |
| **P5** | A **cadência existe e roda** — com registro de tentativas | `tentativas_contato` avança sozinho |
| **P6** | Os **enriquecimentos são skills versionadas no git** | o prompt vivo é byte-idêntico ao do repositório |
| **P7** | Cada **dimensão do score tem definição escrita** e status de evidência | ler o doc e achar as 6 |
| **P8** | O **custo por lead é conhecido** e cabe no teto decidido | uma conta, escrita |

> 🟡 **Estes 8 critérios são PROPOSTA — aguardam aprovação do Olavo** (ele pediu que fossem criados
> em 14/09). Ao aprovar, este bloco vira a **Definição de Pronto da Prospecção** e entra como frente
> própria na `DEFINICAO-DE-PRONTO-PHI-V1.md`.

> **Regra de escopo (herdada):** corta escopo, não empurra a data. Um critério que não couber, sai da
> v1 explicitamente — não fica "para depois" sem dono.

**O P1 é o mais valioso e o mais barato.** O workflow de lead único não é uma conveniência: é o
**banco de ensaio** do sistema inteiro. Toda alteração passa a poder ser testada com 1 lead em vez de
um lote — e isso é o que torna as outras sete tratáveis.

## 6. Skills — a resposta da R7 para cada item do §2

*(Procurei antes de propor construir. Registrado para a próxima sessão não procurar de novo.)*

| Item do §2 | Skill instalada que ajuda | Veredito |
|---|---|---|
| 3 — prompts de enriquecimento → skills | **`skill-creator`** | ✅ usar |
| 4 — workflow de 1 lead | **`n8n-workflow-patterns`**, **`n8n-node-configuration`**, **`n8n-code-javascript`**, **`n8n-validation-expert`**, **`n8n-mcp-tools-expert`** | ✅ 5 skills, já instaladas |
| 2 — agente analista (oferta/prioridade/abordagem) | **`phi-diagnostico`** como **modelo de forma** (é o padrão de agente que já funciona aqui) · **`marketing-psychology`** · **`customer-research`** | ✅ usar como molde |
| 6 — cadência de contato | **`cold-email`** (sequências e follow-up) · **`email-sequence`** | ✅ usar |
| 8 — `CLAUDE.md` com histórico e mapa | **`memory-management`** (memória em dois níveis) | ✅ usar |
| documentação do plano | **`doc-coauthoring`** | ✅ opcional |
| pesquisa para o DB de objeções | **`deep-research`** · **`customer-research`** | ✅ usar |
| CRM / Odoo | **`phi-odoo-crm`**, **`odoo-19-dev`** | ✅ já em uso |
| 11 e 12 — descobrir e analisar redes sociais | **procurei: NÃO existe skill instalada** | ❌ **construir** |
| entrevista de alinhamento (`grill-me`) | **procurei: NÃO existe** — nem instalada, nem no catálogo | ❌ **candidata a virar skill nossa** (R8: é tarefa repetida e estruturada) |

**Sobre o item 12 (analisar redes sociais) — o que eu faria:** a parte difícil não é a análise, é a
**coleta**. Seguidores, posts e frequência não saem de API oficial sem autorização do dono do perfil.
As saídas reais são **Apify** (actors de Instagram/TikTok) ou coleta própria — as duas com custo e
com termos de uso a respeitar. **Decida a fonte antes de escrever a skill**, senão a skill nasce sem
de onde ler.

## 7. Ordem sugerida de execução

| # | Etapa | Por quê primeiro |
|---|---|---|
| **0** | **Levantar o custo por lead enriquecido** | é o número que decide o §4, e falta |
| **1** | **Confirmar a volta do desfecho** (§3) + **corrigir o backup para copiar a aba inteira** (§3.1) | sem isso não há base de aprendizagem — e o que há não está protegido |
| **2** | **Documentar as 6 dimensões do score** | nada pode ser avaliado sem isso — ver `2026-09-14-leitura-pesquisa-gbp-impacto-no-score.md` |
| **3** | **Workflow de 1 lead (P1)** | vira o banco de ensaio de todo o resto |
| **4** | **Enriquecimentos viram skills** (item 3) | versiona o que hoje só existe dentro do n8n |
| **5** | **Agente analista** (item 2) | depende de 1, 2 e 4 |
| **6** | **Cadência + DM Instagram** (itens 6 e 7) | depende de haver abordagem para disparar |

## 8. Perguntas em aberto — o que só o Olavo decide

1. **§4:** qual das três saídas para volume × custo?
2. ✅ **DECIDIDO — o "DB de estratégias de vendas e objeções" será arquivo `.md` no GitHub.**
   (Olavo, 14/09: *"ainda não existe no Notion mas poderá ser também um arquivo .md salvo no
   GitHub."*) Consequências boas: versionado, revisável por diff, e — pela **R8** — ele nasce já no
   formato de **skill**, que é exatamente "instrução determinística em pasta". Local sugerido:
   `docs/comercial/base-vendas/`. **Falta definir o conteúdo mínimo da v1** (quantas objeções, em que
   estrutura).
3. **Item 12:** qual a fonte de dados das redes sociais — Apify, coleta própria, ou nenhuma por ora?
4. **DM no Instagram** é canal de contato oficial? (tem implicação de termos de uso e de volume)
5. ✅ **Miro — board vigente confirmado (Olavo, 14/09): `Board Agência`**
   → `https://miro.com/app/board/uXjVHecmR7c=/`. A leitura do conteúdo pediu aprovação e ficou
   pendente; com ela eu mapeio os ramos contra as pastas que já existem.
   ⚠️ A `Cópia de Board Agência` (`uXjVHI3gP6s=`) **não é a vigente** — renomear com prefixo
   `[HISTÓRICO]` ou arquivar, pela **R5**. Board duplicado é o mesmo risco de doc duplicada:
   alguém planeja em cima do errado.

## 9. Sobre "uma pasta para cada ramo do projeto"

⚠️ **Boa parte já existe.** `docs/strategic-planning/` já tem pasta por frente: `prospeccao`,
`saude-digital`, `otimizacao-campanhas`, `agregador-t28`, `camada-conhecimento`, `roadmap-expansao`,
`execucao-demandas`, `curador`, `telemetria-minima`, `skills`.

**O que falta não é a pasta — é o `CLAUDE.md` dentro dela.** Proposta: em vez de criar uma árvore
nova, **colocar um `CLAUDE.md` curto em cada pasta que já existe**, dizendo: o que é a frente, qual o
doc canônico, o que ler antes de agir, e o que **não** mexer.

**Preciso da lista dos ramos do Miro** para conferir se algum não tem pasta ainda.

---

# 10. Entrevista de alinhamento — resultado (2026-09-14)

> **R9, item 1.** 12 perguntas em 3 rodadas. A skill `grill-me` **não existe** (procurei; ver §6).

## 10.1 As respostas

| Tema | Resposta do Olavo |
|---|---|
| Meta de clientes/mês | **ainda não sei — descobrir rodando** |
| Quem contata | **só o Olavo** |
| Ticket de entrada | **até R$ 500/mês** — e é **isca para crescer a conta depois** |
| Escopo v1 | vários setores, uma cidade |
| Capacidade real | **4 a 10 contatos novos por dia** |
| Setores | **prospectar todos, contatar um por vez** |
| Sinal de aprendizado | **os três em etapas:** respondeu → aceitou conversa → virou cliente |
| Follow-up | **automatizado + número de toques reduzido** |
| Canal do 1º contato | **DM no Instagram** |
| Ciclo por setor | **100 contatos** antes de concluir |
| Quem não responde | **perdido, sai da fila** |

## 10.2 O dimensionamento que sai daí

| Conta | Valor |
|---|---|
| Contatos por mês | **88 a 220** (4–10/dia × ~22 dias) |
| Duração de um ciclo de setor | **~1 mês** (100 contatos) |
| Tempo para testar 3 setores | **~3 meses** |
| Leads **enriquecidos** necessários por mês | **~300 a 500** — não milhares |

> 🎯 **A conclusão que muda o projeto:** **o gargalo nunca foi achar leads — é falar com eles.**
> Prospectar uma cidade inteira produziria milhares de leads que ninguém contataria em anos.
>
> **Consequências diretas:**
> - a tensão **volume × custo** do §4 praticamente se dissolve: o volume necessário é pequeno;
> - o **rodízio de credenciais do Apify perde o motivo** — não vale risco de banimento para economizar
>   num volume que a agenda não consome;
> - o **score muda de função**: não serve para *filtrar* volume, serve para **ordenar uma fila curta**.
>   A pergunta deixa de ser "quais leads descartar?" e vira **"se eu só puder falar com 10 pessoas esta
>   semana, quais são?"**

## 10.3 Decisões de desenho (derivadas, a confirmar)

| # | Decisão | Por quê |
|---|---|---|
| **DD1** | **Duas velocidades:** coleta ampla e barata (Maps puro) para todos; enriquecimento caro (PageSpeed + IA) **só na fila** | preserva o **I5**, forma a base do ICP e mantém o custo proporcional à agenda |
| **DD2** | **O sistema entrega FILA, não lote** — sempre os próximos N prontos e ordenados | a capacidade varia por semana; lote agendado quebra, fila não |
| **DD3** | **Um setor por vez no contato**, ciclo de **100** | é o que dá sinal; contatar cinco setores rasos não ensina nada sobre nenhum |
| **DD4** | **Cadência curta e automatizada do 2º toque em diante** | ver §10.4 — é o que impede o afogamento |
| **DD5** | Sinal registrado em **3 etapas** | responde "o problema é o alvo ou a mensagem?" — a etapa onde perde diz qual |
| **DD6** | Quem não responde sai da **fila**, mas **permanece na base** | o "não respondeu" é dado de treino; sair da fila ≠ sair da planilha |

## 10.4 ⚠️ A armadilha do follow-up (resolvida na entrevista)

Com **8 toques por lead** e 4–10 novos por dia, na 6ª semana seriam ~30 novos **+ ~150 follow-ups**
por semana. **Não cabe em agenda nenhuma.** É o modo mais comum de uma máquina de prospecção morrer:
não por falta de lead, mas por afogamento — e acontece na semana 4, quando já se investiu tudo.

**Decidido:** follow-up **automatizado** + **número de toques reduzido**.
⬜ **Falta fixar o número.** Proposta: **4 toques**. ⚠️ O contrato hoje assume **cadência ≥ 8**
(`tentativas_contato`) — **ao fixar, atualizar o CONTRATO** (R2).

## 10.5 🔴 O conflito que a entrevista abriu: DM automatizada no Instagram

Duas respostas se chocam:

| Resposta | |
|---|---|
| Canal do 1º contato | **DM no Instagram** |
| Follow-up | **automatizado** |

> **Automatizar DM no Instagram é exatamente o comportamento que a plataforma pune com bloqueio ou
> banimento de conta.** E aqui o ativo em risco não é uma ferramenta trocável: é **o perfil da
> agência** — que também é prova social e canal de marca.

**Some-se a isso uma dependência nova:** se o 1º contato é DM, **o lead precisa TER Instagram**. Isso
promove o item 11 do §2 (*skill para descobrir perfis sociais*) de "desejável" a **pré-requisito da
fila** — sem ele não há como saber quem é contatável.

⚠️ **Nota:** no §2 o Olavo havia previsto o Instagram como **2ª etapa, de "aquecimento"**. Na
entrevista ele virou **1º contato**. **Confirmar se a mudança é intencional.**

**Três saídas, a decidir:**
1. **DM manual no 1º toque** (é aquecimento, é pessoal, é baixo volume) **+ follow-up automatizado em
   outro canal** (e-mail ou WhatsApp). ⬅️ *preserva a intenção e tira o risco do lugar errado*
2. **1º contato em canal automatizável** (e-mail — daí o item "extrair e-mail do site" vira crítico),
   com Instagram só como aquecimento anterior, como estava no §2.
3. **Tudo no Instagram, tudo manual** — seguro, mas contraria a decisão de automatizar o follow-up e
   traz de volta o afogamento do §10.4.

## 10.6 Pendência que a estratégia de isca criou

R$ 500 como **isca** só funciona se existir um **segundo passo desenhado**: quando e como oferecer o
serviço seguinte. Sem isso, a conta nunca cresce e a carteira fica cheia de clientes de R$ 500 que
custam a mesma conversa de um de R$ 3.000.

⬜ **Não é da v1**, mas tem de estar no plano — senão "isca" vira só "barato".
