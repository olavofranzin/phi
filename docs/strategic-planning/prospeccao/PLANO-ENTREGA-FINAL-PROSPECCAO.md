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

## 3. 🔴 O plano inteiro apoia numa base que hoje NÃO está sendo alimentada

O item mais importante do §1 é este: *"o desfecho final vai para a planilha para formar a base de
aprendizagem dos agentes"*. **Quase tudo do §2 come dessa base** — o agente analista, a priorização,
a abordagem, o ICP.

> **Essa alimentação está quebrada.** Medido em 2026-09-13: as colunas `id_hubspot` e
> `data_sync_hubspot` foram renomeadas para `id_crm` / `data_sync_crm`, e os nós do **P5** e do **P6**
> continuam apontando para os nomes antigos. Com `onError: continueRegularOutput`, **falham em
> silêncio** — sem erro, sem alerta. Ver ressalva 1 do `CONTRATO-PROSPECCAO.md`.

**Consequência para o planejamento:** não adianta desenhar agentes que aprendem com desfechos se
desfecho nenhum está chegando. **Isto é pré-requisito, não tarefa paralela.** Já está endereçado no
brief `2026-09-13-prosp05-prosp06-odoo-subchat-brief.md`.

**Falta descobrir:** *desde quando* parou. Define o tamanho do buraco na base de treino.

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

⚠️ **Antes de decidir, falta um número que ninguém tem: o custo por lead enriquecido.** Levantar isso
é barato e muda a conversa inteira. *(Ver §7, item 0.)*

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

**Sobre o item 12 (analisar redes sociais) — o que eu faria:** a parte difícil não é a análise, é a
**coleta**. Seguidores, posts e frequência não saem de API oficial sem autorização do dono do perfil.
As saídas reais são **Apify** (actors de Instagram/TikTok) ou coleta própria — as duas com custo e
com termos de uso a respeitar. **Decida a fonte antes de escrever a skill**, senão a skill nasce sem
de onde ler.

## 7. Ordem sugerida de execução

| # | Etapa | Por quê primeiro |
|---|---|---|
| **0** | **Levantar o custo por lead enriquecido** | é o número que decide o §4, e falta |
| **1** | **Consertar a volta do desfecho** (P5/P6 → Odoo) | sem isso não há base de aprendizagem |
| **2** | **Documentar as 6 dimensões do score** | nada pode ser avaliado sem isso — ver `2026-09-14-leitura-pesquisa-gbp-impacto-no-score.md` |
| **3** | **Workflow de 1 lead (P1)** | vira o banco de ensaio de todo o resto |
| **4** | **Enriquecimentos viram skills** (item 3) | versiona o que hoje só existe dentro do n8n |
| **5** | **Agente analista** (item 2) | depende de 1, 2 e 4 |
| **6** | **Cadência + DM Instagram** (itens 6 e 7) | depende de haver abordagem para disparar |

## 8. Perguntas em aberto — o que só o Olavo decide

1. **§4:** qual das três saídas para volume × custo?
2. **O "DB de estratégias de vendas e objeções" mora onde?** Notion, git, ou skill? (Se for consumido
   por agente a cada lead, git/skill é mais barato; se for editado por humano toda semana, Notion.)
3. **Item 12:** qual a fonte de dados das redes sociais — Apify, coleta própria, ou nenhuma por ora?
4. **DM no Instagram** é canal de contato oficial? (tem implicação de termos de uso e de volume)
5. **Quais são os ramos do Miro?** — ver §9.

## 9. Sobre "uma pasta para cada ramo do projeto"

⚠️ **Boa parte já existe.** `docs/strategic-planning/` já tem pasta por frente: `prospeccao`,
`saude-digital`, `otimizacao-campanhas`, `agregador-t28`, `camada-conhecimento`, `roadmap-expansao`,
`execucao-demandas`, `curador`, `telemetria-minima`, `skills`.

**O que falta não é a pasta — é o `CLAUDE.md` dentro dela.** Proposta: em vez de criar uma árvore
nova, **colocar um `CLAUDE.md` curto em cada pasta que já existe**, dizendo: o que é a frente, qual o
doc canônico, o que ler antes de agir, e o que **não** mexer.

**Preciso da lista dos ramos do Miro** para conferir se algum não tem pasta ainda.
