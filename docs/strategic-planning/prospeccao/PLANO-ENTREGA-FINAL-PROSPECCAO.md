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
| entrevista de alinhamento | ~~não existe~~ → ✅ **`grill-me` e `grilling` instaladas em 2026-09-14** | ✅ usar (corrigido em 15/09) |

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
| Ticket de entrada | ~~até R$ 500/mês, isca~~ → **gestão do GBP (`SVC-GBP`), R$ 500/mês com fidelidade** (definido em 15/09 — ver §13.2) |
| Escopo v1 | vários setores, uma cidade — ✅ **São José do Rio Preto** (15/09) |
| Capacidade real | **4 a 10 contatos novos por dia** |
| Setores | **prospectar todos, contatar um por vez** |
| Sinal de aprendizado | **os três em etapas:** respondeu → aceitou conversa → virou cliente |
| Follow-up | **automatizado + número de toques reduzido** |
| Canal do 1º contato | **DM no Instagram** |
| Ciclo por setor | **100 contatos** antes de concluir |
| Quem não responde | **perdido, sai da fila** |

## 10.2 O dimensionamento que sai daí

> ⚠️ **CORRIGIDO — ver §11.** A conta abaixo supõe que **toda** a capacidade diária vai para contato
> **novo**. Com follow-up manual e quebra-gelo, parte dos 4–10/dia é toque de lead antigo: **o número
> real de contatos novos é menor.**

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

> ⚠️ **DD1, DD3 e DD4 foram corrigidos pela entrevista independente — ver §11.**

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
✅ **DECIDIDO (Olavo, 15/09): 4 toques no piloto; o número real se fixa depois de medir.**
É o **RQ2** aplicado — o piloto mostra **em que toque as respostas chegam**, e aí o número vira dado em
vez de palpite. ⬜ **O contrato precisa registrar "4 (provisório, revisto após o piloto)"**, não 4 fixo.
⚠️ O contrato hoje assume **cadência ≥ 8**
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

✅ **FECHADO em 15/09** — o segundo passo existe e é a escada do **§13.5**: GBP → saúde digital como bônus → campanha teste → `SVC-ADS`.

---

# 11. Correções vindas da entrevista independente (2026-09-15)

> **Fonte:** `docs/handoff/2026-09-15-entrevista-independente-prospeccao-resultado.md`
> (sub-chat, 12 perguntas, sem ler §10.2–§10.6 antes de concluir).
> **R6:** o que foi desmentido fica escrito.

## 11.1 O que o sub-chat corrigiu no meu trabalho

| # | Eu havia escrito | A correção | Gravidade |
|---|---|---|---|
| 1 | **DD4** — follow-up automatizado do 2º toque | **Não havia canal permitido.** A `DEFINICAO-DE-PRONTO` §4 corta **WhatsApp Cloud API** e **ESP de e-mail próprio**. Saída: servidor de e-mail do **Odoo** | 🔴 recomendei algo que o escopo do próprio projeto proíbe |
| 2 | **§10.5** — "automatizar DM arrisca banimento" | Mais forte: a API oficial **não permite iniciar** conversa com desconhecido. Qualquer semi-automação de 1º contato já está fora dos termos | 🔴 o problema era maior do que descrevi |
| 3 | **§10.2** — 88 a 220 contatos/mês | Supõe capacidade **inteira** em contato novo. Parte dela é follow-up manual e quebra-gelo → **o número real é menor** | 🟠 meu dimensionamento era otimista |
| 4 | **DD6** — quem não responde permanece na base | Permanecer não basta: com o rótulo **"perdido"**, o dado **ensina errado**. Precisa de motivo **"sem resposta"**, distinto de "recusou" | 🟠 a base de treino era o objetivo — eu errei o rótulo |
| 5 | **DD3** — um setor por vez | O Olavo escolheu **2 setores simultâneos** com **cadência padrão única**. Ciclo passa de ~1 para **~2 meses** | 🟡 decisão do Olavo, não erro |
| 6 | **DD1** — enriquecimento caro só na fila | O motivo mais forte não é custo: é o **dado envelhecer** entre enriquecer e contatar | 🟡 razão incompleta |

## 11.2 Os achados que só ele teve

1. **Item 10 (e-mail do lead) virou pré-requisito da cadência** — sem e-mail não há toque automático.
2. **O B2 cai por calendário** se o contato só começa com o Odoo pronto → **lead piloto** no F3.
3. **Registrar o canal de cada contato** — com multi-canal, resultado sem canal não é comparável.
4. **LLM não sorteia.** "Escolha metade ao acaso" vira escolha por característica, e o teste do
   quebra-gelo perde o sentido. Sorteio é **regra fixa** (R8), derivada do `place_id`.
5. **Variáveis demais para amostra pequena** — com 100 contatos e 2–5 clientes esperados, não se separa
   o que funcionou. Cadência por lead só no **2º ciclo**.
6. **A cadência precisa parar quando o lead responde** — e pausar na ausência. Sem isso o automático
   segue mandando para quem já respondeu: o jeito mais rápido de queimar um lead quente.
7. **O enriquecimento já é o mini-diagnóstico** — é a resposta pronta para "quanto custa?", e é
   diferencial. O ativo que construímos para consumo interno também é peça comercial.

## 11.3 🔴 O que só aparece juntando as duas entrevistas

### (a) ~~O calendário não fecha~~ — PREMISSA CORRIGIDA PELO OLAVO (2026-09-15)

> **Correção:** *"A data da Prospecção é uma data **limite**, não o dia de lançamento... acredito que
> esta data será antecipada."*
>
> **Meu alarme media a coisa errada.** Uma data-limite não é violada por começar o teste depois dela —
> é violada por **chegar nela sem ter andado**. O instrumento certo não é a data: é o **checkpoint**
> (ver §12.2). O texto abaixo fica como registro do raciocínio (R6), mas **não é mais um problema
> aberto.**

### (a-histórico) O que eu havia escrito

O Olavo decidiu **esperar o Odoo** para contatar em volume (Q4). O Odoo (F3/F5) está previsto para
perto de **30/11** — que é **a data-alvo do projeto inteiro**.

> **Consequência:** a Prospecção começa a ser testada **em dezembro**. Nenhum dos critérios **P1–P8**
> pode ser cumprido até 30/11 — e o **B2** só sobrevive pelo lead piloto.

**Não é problema de execução, é de plano.** Três saídas, e é decisão do Olavo:
1. **Prospecção ganha data-alvo própria** (ex.: 31/01), e a de 30/11 vale para as outras frentes;
2. **antecipar o F3** para liberar o contato antes;
3. **contatar antes do Odoo**, anotando o desfecho à mão — foi a opção **B** da Q4, que o Olavo
   recusou. *(Registrado porque a recusa pode mudar agora que o custo dela está claro.)*

### (b) ✅ RESOLVIDO — "enriquecer tudo agora" (Olavo, 2026-09-15)

> *"se preciso for faremos novamente, será um custo mais aceitável do que percebermos que alguns
> pontos deveriam ser tratados antes."*
>
> **Decidido: enriquecer agora e, se envelhecer, re-enriquecer.** A troca é consciente — paga-se
> re-trabalho para **descobrir cedo** o que estaria errado. Fica registrado que o custo do
> envelhecimento (§11.3-b) foi **visto e aceito**, não ignorado.

### (b-histórico) O raciocínio que levou à decisão

Na Q8 o Olavo escolheu **"A, mas neste início B"** — enriquecer tudo — **e** propôs uma **pesquisa para
escolher 2 setores**. As duas coisas não convivem:

| Se a pesquisa escolhe 2 setores | então enriquecer "tudo" paga por setores que **não serão contatados** |
|---|---|
| **E somando o calendário (a):** | enriquecido em setembro, contatado em dezembro = **3 meses de envelhecimento**, no volume máximo, pago adiantado |

> É a pior combinação possível: **custo máximo, o mais cedo possível, no dado que mais envelhece, para
> a frente que ainda não foi provada.**

**Proposta:** **descoberta barata de tudo agora** (Maps puro — forma a base do ICP e alimenta a
pesquisa de setores, item S4) · **pesquisa escolhe os 2 setores** · **enriquecimento caro só dos 2
setores, perto do ciclo de contato.** Isso é o DD1 aplicado, e a pesquisa passa a se pagar.

### (c) O buraco que continua sem dono: quem ENTREGA

A Q11 tratou do **tempo** (pausa por ausência), mas ninguém perguntou **quem executa o serviço depois
de vendido**. O Olavo aceitou a trava só para ausência — logo o risco segue aberto:

> Dimensionamos com cuidado quantos clientes dá para **vender**. Não dimensionamos quantos dá para
> **atender**. Se a máquina funcionar, ela entrega o problema na porta de quem construiu.

> ✅ **Posição do Olavo (2026-09-15):** *"iremos atacar quando for a hora... todos estes passos devem
> ser capazes de terem seus fluxos aumentados ou diminuídos conforme nossa necessidade."*
>
> **Aceito — e vira requisito de desenho (RQ1, §12.1).** Com uma condição: *"quando for a hora"*
> precisa de **alarme**, senão "a hora" é descoberta quando já virou crise. O gatilho está no §12.2.

---

# 12. Como este documento se governa

> Escrito a partir das definições do Olavo em 2026-09-15.

## 12.1 Requisitos que nasceram das decisões

| # | Requisito | De onde vem |
|---|---|---|
| **RQ1** | **Toda etapa tem vazão ajustável.** Nenhum passo pode ter volume fixo no código: descoberta, enriquecimento, entrada na fila e disparo de cadência precisam de um limite configurável, para cima e para baixo | *"nada é extremamente fixo"* |
| **RQ2** | **Os números do plano são estimativa, não compromisso.** Estão aqui para dimensionar e para serem **comparados com o real** — não para travar decisão | *"temos que estimar mas não travar"* |
| **RQ3** | **Nenhum número entra sem um checkpoint que o confronte.** Estimativa sem medição vira folclore: seis meses depois ninguém lembra que era chute | consequência do RQ2 |

> **O RQ1 tem consequência prática imediata:** ao construir, **nunca escrever o volume dentro do nó**.
> Um `Set` no topo do workflow com os limites — o mesmo padrão já adotado para o `corte_potencial`
> (§2). Volume enterrado em nó é o que impede aumentar ou diminuir sem mexer no código.

## 12.2 Checkpoints — os alarmes que protegem a data-limite

Um checkpoint só serve se tiver **gatilho** e **o que fazer**. Data no calendário sem condição vira
lembrete ignorado.

| # | O que observa | Quando dispara | O que fazer |
|---|---|---|---|
| **CK1** | **Custo por lead** | ao enriquecer os **primeiros 100** | comparar com a estimativa. Se destoar muito, rever a escolha de ferramenta **antes** de enriquecer o resto |
| **CK2** | **Capacidade real de contato** | após **2 semanas** de contato | contar contatos **novos** por dia e comparar com os 4–10 estimados. O número real redimensiona o ciclo |
| **CK3** | **Taxa de resposta** | aos **30 contatos** de um ciclo | se muito baixa, parar e decidir: o problema é **o alvo** ou **a mensagem**? Não esperar os 100 |
| **CK4** | 🔴 **Afogamento de follow-up** | quando os toques pendentes do dia **passarem** dos contatos novos do dia | acionar o RQ1: **reduzir a entrada** até a fila drenar. É o alarme do §10.4 |
| **CK5** | 🔴 **Carga de entrega** | ao fechar o **3º cliente** | **duas ações:** (1) decidir **quem entrega**, antes de a agenda estourar; (2) **abrir a construção da automação da entrega de GBP** (§13.7) |
| **CK6** | **Envelhecimento do dado** | quando um setor for contatado **mais de 60 dias** após o enriquecimento | re-enriquecer aquele setor (decisão §11.3-b) |

> **CK4 e CK5 são os que salvam o projeto.** Os dois avisam de um problema que, quando percebido sem
> alarme, já é crise: a fila afogada e a agenda estourada **acontecem exatamente quando a máquina
> começa a funcionar** — o pior momento possível para descobrir.

## 12.3 Controle de mudança — o que vale depois de fechado

> *"a partir do momento em que fecharmos o documento, nada poderá ser acrescentado ou retirado sem uma
> boa justificativa e sem apresentação de uma opção."* — Olavo, 2026-09-15

**Regra:** com o documento **FECHADO**, toda mudança exige, por escrito:
1. **o que muda**; 2. **por que** (o dado ou o fato que mudou); 3. **pelo menos uma alternativa**, com
a consequência de cada uma; 4. **o que sai**, se algo entra — escopo não cresce de graça.

**Enquanto está 🟡 RASCUNHO**, tudo é revisitável — inclusive decisões anteriores, *"à luz dos novos
passos"*. **O fechamento é o corte.**

> É a mesma disciplina do ADR, aplicada ao plano: **invariante não muda sem justificativa e
> alternativa.** A diferença é que aqui a alternativa é obrigatória — proibir mudança sem oferecer
> saída é como o plano morre engessado.

---

# 13. A estratégia de entrada — o que a prospecção vende

> Origem: `docs/handoff/2026-09-15-entrevista-estrategica-prospeccao-resultado.md` (12 perguntas).
> **Este capítulo não existia — e era o que faltava.** O plano tinha máquina e não tinha oferta.

## 13.1 Por que prospecção ativa

É o **canal principal da v1** porque indicação exige carteira, e a carteira ainda não existe.

⚠️ **É escolha, não desconhecimento:** a pesquisa do próprio repositório
(`pesquisa-jornada-lead-crm-agencias.md` §1.10) mostra que **71%** dos compradores de serviço
profissional acham fornecedor **perguntando a alguém**, e ~**48%** do negócio novo em valor vem de
**indicação**. Construímos a máquina para o canal **minoritário**. Por isso:
1. o **canal de cada cliente é registrado** (N5);
2. a indicação ganha regra desde o 1º cliente (§13.6);
3. quando houver carteira, os dois canais são **comparados**, não presumidos.

## 13.2 A oferta de entrada

| | |
|---|---|
| **Produto** | **Gestão do Google Business Profile** (`SVC-GBP`) |
| **Preço** | **R$ 500/mês**, fidelidade de **6 meses** (Olavo, 15/09) — tempo de o placar mostrar evolução |
| **Por que GBP** | entrega leve e controlável · é o que o diagnóstico mostra fraco · **não é publicidade** — entra em setores com restrição a anúncio |
| **Por que NÃO anúncios na entrada** | abaixo de ~R$ 2.000/mês de verba o resultado é fraco → cancela → **prova social negativa na mesma cidade que estamos prospectando** |

## 13.3 Mini-diagnóstico (grátis) × diagnóstico completo (cliente)

| | **Mini** — para o lead | **Completo** — para o cliente |
|---|---|---|
| Conteúdo | **3 falhas mais visíveis**, traduzidas em **clientes perdidos** + **você × 3 concorrentes da mesma busca** | tudo do enriquecimento, incluindo o score |
| Score | **não aparece** | aparece |
| Fonte | dados **já coletados** — sem custo novo | enriquecimento completo |
| Uso | 1º contato e resposta a "quanto custa?" | entrega e renovação |

✅ **DECIDIDO (Olavo, 15/09): sem nome** — *"os 3 melhores da sua busca"*. Os números aparecem, a
identidade não. Entrega a mesma informação útil sem produzir um documento que compara pessoas que se
conhecem — e os concorrentes citados **também estão na nossa base** (§14.3).

## 13.4 Posicionamento e promessa

**Posicionamento:** *resultado medido todo mês, feito para você.*

> ✅ **Precisão do Olavo (2026-09-15):** *"não disse que a medição fazia parte da promessa mas sim do
> entregável para o lead que contratar."* **A medição é ENTREGÁVEL, não promessa.** A diferença não é
> retórica: "eu meço e te mostro" é trabalho — verificável; "você vai ter mais clientes" é resultado —
> que depende de fatores fora do nosso controle (a **distância**, entre eles).

**Promete-se ao LEAD:** o **trabalho** (perfil completo, avaliações respondidas, fotos e posts em dia,
palavras-chave do setor **na descrição e nas respostas**).

**Entrega-se ao CLIENTE:** o trabalho **mais o placar mensal** contra 3 concorrentes.

**Nunca se promete:** "mais clientes", "1º lugar no Maps", "aparecer nas IAs". O Google declara
**distância** como fator de ranking — e ninguém a controla.

## 13.5 A escada de upsell

```
GBP (R$ 500/mês, fidelidade) → saúde digital como bônus → campanha teste → SVC-ADS
```
Cada degrau prepara o seguinte. **Condições:** RE2 e RE3 (§13.7).

## 13.6 Indicação

Pedido **60 dias** após **resultado visível** = o placar mensal melhorou contra os concorrentes.
✅ **M11 aplicado:** *resultado visível* = **o placar mensal melhorou** contra os concorrentes.

## 13.7 Entrega, gatilho e riscos estratégicos

- **Início:** entrega de GBP **manual**.
- **Direção:** entrega **automatizada pelo PHI** — a carteira cresce com software, não com horas.
- **Gatilho:** **3º cliente de GBP** (= **CK5**). **Fora da v1**, mas com gatilho, não "para depois".
- **Sem teto de clientes declarado** — o gatilho é a única proteção da agenda na fase manual.

| # | Risco | Condição proposta |
|---|---|---|
| **RE1** | palavra-chave **no nome** da empresa **suspende o perfil** do cliente | regra escrita: palavra-chave **só** em descrição, serviços e respostas — **nunca no nome**. *(O Olavo já havia dito "descrição e respostas"; a regra existe para o executor não derivar.)* |
| **RE2** | bônus de saúde digital exige acessos e tempo **na fase manual** | começa **junto com o gatilho** da automação |
| **RE3** | campanha teste paga com parte dos R$ 500 → verba de ~R$ 100–150 dá pouco resultado e vira argumento **contra** o upsell | verba **paga à parte** pelo cliente, com mínimo declarado |
| **RE4** | **o placar pós-venda depende de dado de dentro do perfil** — ligações e rotas não saem do Apify | ⬇️ **reenquadrado, ver abaixo** |

> **RE4 — reenquadrado (2026-09-15).** Com a medição sendo **entregável** e não promessa, o risco
> muda de natureza e **diminui**: quem paga é **dono do próprio perfil**, e como gestores do GBP temos
> acesso aos números de dentro (ligações, rotas, visualizações). **A fonte existe — o que não existe é
> a integração** que tira esse dado e monta o relatório mensal.
>
> ⚠️ **Mas o prazo aperta em vez de afrouxar:** promessa não cumprida custa reputação; **entregável
> não cumprido custa reembolso**. O relatório mensal do 1º cliente vence **30 dias depois de ele
> assinar** — e é item de construção que ainda não estava em lista nenhuma.
>
> ⬜ **Entra no caminho crítico como item 8 do §14.2.1** (depois do piloto começar, antes do 1º
> fechamento).
>
> **Antes da venda**, o placar usa só o que se vê por fora (Apify) — isso já funciona hoje.

---

# 14. O que aparece cruzando as três entrevistas

> Escrito pelo chat-mãe em 2026-09-15, depois de ler o resultado da entrevista estratégica.

## 14.1 O erro mais fundo do planejamento foi meu

A entrevista estratégica descobriu que **`catalogo-produtos-servicos.md` não tem preço em nenhum dos
4 serviços** — "faixa de ticket: detalhar depois".

> Na minha rodada 1, eu perguntei *"qual a faixa de ticket do primeiro serviço vendido?"* e aceitei
> "até R$ 500". **Aquele número não era o preço de nada.** Toda a conta que veio depois — economia
> unitária, custo por lead, se a máquina se paga — foi construída sobre um número sem objeto.

**Por que eu não vi:** não apliquei a minha própria **R7** — procurar antes de perguntar. O catálogo
estava no repositório. A pergunta certa não era *"qual o ticket?"*, era ***"qual serviço, e ele tem
preço definido?"***

**Hoje existe oferta:** `SVC-GBP`, R$ 500/mês, com fidelidade (§13.2).

## 14.2 🔴 A decisão que o cruzamento força: vender antes de terminar a máquina

Três fatos que só se encontram agora:

| Fato | De onde vem |
|---|---|
| Vender GBP exige **só** Maps + mini-diagnóstico + contato manual | entrevista estratégica, conclusão 7 |
| Contatar em volume **espera o Odoo** (~30/11) | entrevista independente, Q4 |
| **Zero leads fechados**, base de aprendizagem **vazia**, tudo ainda é estimativa | §3, §12.1 (RQ2) |

**E a premissa que sustentava a espera mudou.** A Q4 escolheu esperar o Odoo **porque o desfecho
precisava ser registrado em algum lugar** — e a opção "anotar à mão" pareceu frágil. Mas ela foi
recusada **quando a oferta não existia e o volume era grande**. Com **10 a 20 leads-piloto** e uma
oferta definida, anotar à mão é trivial. **A premissa caiu; a decisão merece ser reaberta (R6).**

> 🎯 **O argumento decisivo:** a máquina inteira foi desenhada **antes de existir uma oferta**. Tudo
> o que foi planejado em treze rodadas serve para vender algo que só foi definido hoje.
>
> **Continuar construindo antes de vender é apostar que a oferta funciona.** Vender primeiro
> transforma seis checkpoints — CK1 custo, CK2 capacidade, CK3 taxa de resposta — de **estimativa em
> medição**, meses antes. E se a oferta não pegar, descobrimos com 20 contatos manuais em vez de com
> a máquina pronta.

**Proposta:** um **piloto manual de 10 a 20 leads**, agora, em paralelo à construção. Não substitui a
máquina — **valida a oferta que ela vai escalar**. É também o que prova o circuito completo (§3) e
destrava o **B2**.

### ✅ DECIDIDO (Olavo, 2026-09-15) — piloto pequeno, mas com a MÁQUINA rodando

> *"o piloto deve ocorrer já com a máquina em tese em funcionamento porque devemos também analisar o
> funcionamento dos agentes, as indicações e abordagens e as automações do follow-up... com um pequeno
> número de leads mas com a máquina funcionando."*

**A proposta do chat-mãe era mais estreita que o problema.** Ela testava a **oferta**; o Olavo quer
testar o **circuito** — e o circuito inclui o agente escrevendo a abordagem, o NBA, o follow-up
disparando e o desfecho voltando. **Nada disso se observa com contato manual.**

E com 10–20 leads não é preciso amostra estatística: **é preciso ver funcionar.** Um smoke test não
mede taxa de conversão — mede se o circuito fecha. É o mesmo raciocínio do §3 (*"o primeiro lead
fechado ponta a ponta vale mais que qualquer lote"*), agora completo: o circuito inclui os agentes.

> ⚠️ **O risco que sobra, e como tratá-lo:** com oferta e máquina estreando juntas, ninguém sabe se o
> silêncio veio da **mensagem** ou do **mercado**. **Mitigação barata:** antes de enviar, **ler as 20
> abordagens que o agente escreveu**. Se estiverem ruins, o problema é a máquina e se descobre **antes**
> de gastar os leads. Julgamento humano de 20 textos custa meia hora.

## 14.2.1 🎯 O piloto vira a especificação da primeira entrega

A decisão não adia o piloto — ela **define o que construir primeiro**. Tudo que as 20 abordagens não
exigem sai do caminho crítico e vira v1.1.

### O que o piloto EXIGE (caminho crítico, nesta ordem)

| # | Peça | Estado |
|---|---|---|
| 1 | **F3** — PROSP-05 escrevendo no Odoo (lead, oferta, campos GBP) | brief escrito, não executado |
| 2 | **Mini-diagnóstico** (3 falhas + × 3 concorrentes, **sem score**) | dados já coletados; falta montar a peça |
| 3 | **Agente de abordagem + NBA** escrevendo no CRM | não existe |
| 4 | **Cadência com follow-up** pelo servidor de e-mail do Odoo | não existe |
| 5 | **PROSP-06** trazendo o desfecho de volta | existe, apontado para o HubSpot |
| 6 | **Colunas novas:** canal do contato (N5), `aquecimento` (N6), motivo "sem resposta" (N4), `data_envio_crm` | a criar |
| 7 | **Item 10** — e-mail do lead extraído do site | pré-requisito da cadência (N2) |

### O que o piloto NÃO exige — e por isso NÃO se constrói antes

| Peça | Por que sai do caminho crítico |
|---|---|
| **Documentar as 6 dimensões do score** | 🎯 **o mini-diagnóstico não usa score** (decisão Q6/M4). Continua necessário para o produto — **não para o piloto** |
| **Fila ordenada por score** | com 20 leads, a ordem é escolhida a dedo |
| **Skills de redes sociais** (itens 11–12) | para 20 leads, checagem manual resolve |
| **Pesquisa dos 2 setores** | 20 leads podem sair de um setor qualquer; a pesquisa serve ao **ciclo de 100** |
| **Vazão ajustável (RQ1)** | com 20 leads não há o que estrangular — mas **o padrão do `Set` no topo já se adota desde o 1º nó** |
| **Automação da entrega de GBP** | já estava fora da v1, com gatilho no CK5 |

> **O reordenamento mais relevante:** a documentação das 6 dimensões era o **passo 2** da ordem do §7.
> Sai do caminho crítico do piloto — porque a peça que vai ao lead **não mostra score**. Continua
> obrigatória antes de qualquer promessa apoiada em score, e antes do ciclo de 100.

⬜ **Consequência a aceitar:** o piloto depende do **F3** (Odoo). Ele é agora **a peça que governa a
data** de tudo. Se houver qualquer aceleração possível no projeto, é ali.

## 14.3 Um efeito colateral do mini-diagnóstico, numa cidade só

O mini compara o lead com **3 concorrentes da mesma busca** — e esses concorrentes, por construção,
**também estão na nossa base** (mesma `Searchstring`).

> Ou seja: mandaríamos ao lead **A** um documento dizendo que **B** está à frente e, semanas depois,
> mandaríamos a **B** um documento nosso onde **A** aparece melhor em outra dimensão. **Numa cidade
> onde os donos se conhecem, os dois documentos podem se encontrar.**

**Correção barata:** **não nomear o concorrente.** Dizer *"os 3 melhores da sua busca"* e mostrar os
números sem identificar quem é. Entrega a mesma informação útil — *você está atrás nisto* — sem
produzir um documento que compara pessoas que se conhecem.

⬜ **Decidir antes do primeiro envio.** Depois de enviado, não tem volta.

## 14.4 Aplicado deste relatório

| Mudança | Estado |
|---|---|
| **M1** — §13 novo (oferta, mini, posicionamento, escada, indicação, entrega) | ✅ aplicado |
| **M2** — ticket vira "gestão do GBP, R$ 500 com fidelidade" | ✅ aplicado |
| **M3** — §10.6 fechada pela escada | ✅ aplicado |
| **M4** — mini-diagnóstico sem score | ✅ aplicado (§13.3) |
| **M9** — `grill-me`/`grilling` existem | ✅ aplicado (§6) |
| **M10** — riscos RE1–RE4 | ✅ aplicado (§13.7) |
| **M5** — preço e fidelidade no `catalogo-produtos-servicos.md` | ✅ aplicado |
| **M6** — CK5 ganha 2ª ação (abrir a automação) | ✅ aplicado (§12.2) |
| **M7** — `DEFINICAO-DE-PRONTO` §4: automação da entrega, fora da v1, com gatilho | ⬜ pendente — outro doc |
| **M8** — critério **S5** (setor com restrição a publicidade conta **a favor**) | ⬜ pendente — roteiro da pesquisa |
| **M11** — definir "resultado visível" | ✅ aplicado (§13.6) |

---

# 15. Os critérios de pronto da Prospecção (v1)

> **Status:** 🟡 proposta — 8 critérios. P1–P7 vêm do §5; **P8 saiu**; **P9 entrou**.
> Ao serem aprovados, entram como frente própria na `DEFINICAO-DE-PRONTO-PHI-V1.md`.

| # | Critério | Como se verifica | Piloto cobre |
|---|---|---|---|
| **P1** | um lead entra e sai **analisado** pelo workflow de lead único | rodar com 1 lead real | ✅ |
| **P2** | um **recorte completo** (os 2 setores) roda ponta a ponta **sem intervenção** | 1 execução, ninguém toca | ❌ ciclo de 100 |
| **P3** | todo lead no CRM chega com **oferta, prioridade, abordagem e NBA** | abrir 10 leads e conferir | ✅ |
| **P4** | o **desfecho volta à planilha** com motivo, automaticamente | fechar no CRM e ver chegar | ✅ |
| **P5** | a **cadência roda**, registra tentativas e **para na resposta** | `tentativas_contato` avança; quem responde sai da fila | ✅ |
| **P6** | enriquecimentos são **skills versionadas no git** | prompt vivo byte-idêntico ao repositório | ❌ |
| **P7** | cada **dimensão do score** tem definição escrita e status de evidência | ler o doc e achar as 6 | ❌ |
| **P9** | o **mini-diagnóstico é gerado sem trabalho manual** para qualquer lead da base | pedir para 3 leads e receber os 3 | ✅ |

### O que saiu, e por quê

**P8 — "custo por lead conhecido"** → vira o **CK1**. *Saber* um custo não é entrega, é medição; como
critério, cumpria-se escrevendo um número numa planilha.

**P10 — "o relatório mensal do cliente existe"** → **fora desta frente** (decisão do Olavo, 15/09):

> *"ele é um entregável, ele é operacional e como relato dos serviços prestados, estará no escopo do
> projeto que será apresentado ao lead que contratar; na prospecção pode apenas constar que o perfil
> será constantemente monitorado e os resultados apontados conforme será acordado no escopo."*

**Está certo:** é entrega do **serviço**, não da **prospecção**. A Prospecção acha e contata; o que
vem depois da assinatura é outra frente. ⚠️ **O risco não sumiu — mudou de endereço:**

| | |
|---|---|
| **Onde mora agora** | no **escopo do projeto** — o documento de proposta apresentado ao lead |
| **Quando vence** | **30 dias depois do 1º cliente assinar** |
| **O problema** | ⬜ **esse documento ainda não existe.** Documentamos a prospecção à exaustão; **o que vamos vender não tem spec** |

**Redação aprovada para o pré-venda:** *"o perfil será constantemente monitorado e os resultados
apontados conforme acordado no escopo do projeto."* — diz o que se faz, sem prometer número (§13.4).
