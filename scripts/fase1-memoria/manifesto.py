# -*- coding: utf-8 -*-
"""
Manifesto da Fase 1 da memoria compartilhada do PHI.

Fonte unica das fronteiras no `CLAUDE.md` da raiz, medido no commit BASE_COMMIT:
  - HISTORIAS: blocos de motivo/historia que SAEM da raiz para o BASE-04-INCIDENTES.
  - FATOS:     blocos de fato que SAEM da raiz para o doc que ja e dono deles.
  - A regiao de regras (REGRAS_REGIAO) menos tudo o que sai = o texto imperativo,
    que tem de sobreviver BYTE-IDENTICO no `CLAUDE.md` novo.

Os intervalos sao [inicio, fim], 1-indexados, inclusivos, sobre o CLAUDE.md
do BASE_COMMIT. Nada aqui e opiniao: `provar.py` le estes numeros e falha se
qualquer bloco nao estiver byte-identico no destino.
"""

BASE_COMMIT = "d543f1662709965003e5b89867b78ef16b744e89"
RAIZ = "CLAUDE.md"
BASE04 = "docs/base/BASE-04-INCIDENTES.md"

# A regiao do arquivo que contem as regras R1-R15 (da secao "Regras que você
# deve seguir" ate a linha antes do bloco RTK).
REGRAS_REGIAO = (172, 599)

# ---------------------------------------------------------------------------
# HISTORIAS — vao para o BASE-04, agrupadas pela DOENCA (nao pela data).
# `ocorrencias` = quantas vezes aquela doenca ja aconteceu, segundo o proprio
# texto movido. E o que define a ordem do BASE-04 (CA9).
# ---------------------------------------------------------------------------
DOENCAS = [
    dict(
        id="D1-vazio-vira-outra-coisa",
        titulo="A falta de critério vira “todos”, “pare” ou “zero”",
        ocorrencias=7,
        regra="R11",
        resumo=(
            "Nó verde fazendo o contrário do que o nome diz. Sempre a mesma raiz: "
            "o vazio herdou o padrão de alguém — do nó, da query, da linguagem — e "
            "ninguém escolheu esse padrão pensando neste caso."
        ),
        blocos=[
            dict(id="H-R11-7CASOS", inicio=398, fim=406,
                 rotulo="Os 7 casos, como estavam escritos na R11"),
        ],
    ),
    dict(
        id="D2-documento-que-mente",
        titulo="O documento mente — e o cabeçalho mente primeiro",
        ocorrencias=5,
        regra="R2 · R13",
        resumo=(
            "Corpo do documento certo, cabeçalho errado. Ninguém lê §14 a §19 para "
            "saber se uma etapa aconteceu: lê a primeira tabela. Doc desatualizada "
            "custa mais caro que doc inexistente, porque faz decidir errado."
        ),
        blocos=[
            dict(id="H-R2-PROSPECCAO-0809", inicio=229, fim=232,
                 rotulo="2026-09-08 — a doc da Prospecção descrevia workflows mortos"),
            dict(id="H-R2-ADR38-CABECALHO", inicio=238, fim=242,
                 rotulo="2026-09-18 — o ADR-38 estava executado havia 9 dias, e o cabeçalho dizia que não"),
            dict(id="H-R13-TRES-DOCS", inicio=525, fim=529,
                 rotulo="Uma semana, três documentos que o artefato contradizia"),
        ],
    ),
    dict(
        id="D3-estado-temporario-que-nao-volta",
        titulo="Estado temporário sem prazo vira estado permanente invisível",
        ocorrencias=4,
        regra="R12",
        resumo=(
            "Mudou para testar e não voltou. Nó desabilitado e draft não publicado "
            "não têm cor, não têm alarme e não aparecem em lista nenhuma — são as "
            "mudanças mais silenciosas que existem no n8n."
        ),
        blocos=[
            dict(id="H-R12-4LINHAS", inicio=450, fim=455,
                 rotulo="As 4 linhas da R12, como estavam escritas"),
        ],
    ),
    dict(
        id="D4-numero-e-gravidade-herdados",
        titulo="Número e gravidade herdados de documento, sem medir de novo",
        ocorrencias=4,
        regra="R6",
        resumo=(
            "Um documento registra o que era verdade no dia em que foi escrito; um "
            "critério de aceite afirma o que é verdade agora. Alarme repassado ganha "
            "autoridade a cada repasse, e quem recebe não vê que a urgência foi "
            "inventada no caminho."
        ),
        blocos=[
            dict(id="H-R6-FASE02-ADR37", inicio=281, fim=290,
                 rotulo="2026-09-08 — a Fase 0.2 do ADR-37 cancelada na hora de executar"),
            dict(id="H-R6-COROLARIO2", inicio=292, fim=311,
                 rotulo="2026-09-26 — dois critérios de aceite em cima de defeitos que já não existiam"),
            dict(id="H-R6-GRAVIDADE-0210", inicio=313, fim=326,
                 rotulo="2026-10-02 — o chat-mãe inflou gravidade duas vezes no mesmo dia"),
        ],
    ),
    dict(
        id="D5-rascunho-confundido-com-o-ar",
        titulo="O rascunho confundido com o que está no ar",
        ocorrencias=3,
        regra="R13",
        resumo=(
            "No n8n a leitura mais natural devolve o rascunho — e o rascunho é uma "
            "proposta, não o sistema. Já escondeu um caminho de produção quebrado "
            "por dois dias."
        ),
        blocos=[
            dict(id="H-R13-EMENDA-0210", inicio=490, fim=512,
                 rotulo="2026-10-02 — a comparação de id é peneira, não veredito (e fez um executor recusar a ação certa)"),
            dict(id="H-R13-MOTIVO-1609", inicio=514, fim=520,
                 rotulo="2026-09-16 — o `[P5] CRM-out` repontado só no rascunho"),
        ],
    ),
    dict(
        id="D6-identidade-por-posicao",
        titulo="Identidade casada por posição no array ou por chave coagível",
        ocorrencias=2,
        regra="R14",
        resumo=(
            "Duas frentes independentes, na mesma semana, com a mesma doença: "
            "`[0]`, `.first()`, “o primeiro item” e “o que chegou agora” são "
            "acidentes de execução, não chaves."
        ),
        blocos=[
            dict(id="H-R14-DUAS-FRENTES", inicio=545, fim=548,
                 rotulo="As duas frentes, como estavam escritas na R14"),
        ],
    ),
    dict(
        id="D7-branch-ditada-por-engano",
        titulo="Branch ditada por engano — o executor tem duas ordens e obedece à mais perto",
        ocorrencias=2,
        regra="R15",
        resumo=(
            "Declarar a branch no brief não resolveu: a instrução da sessão venceu o "
            "brief duas vezes. O conserto não foi repetir a branch com mais destaque — "
            "foi mandar reconciliar antes de existir commit."
        ),
        blocos=[
            dict(id="H-BRANCH-2609", inicio=197, fim=199,
                 rotulo="2026-09-26 — o ADR-41 passou a citar um documento que não existia na branch dele"),
            dict(id="H-BRANCH-2909", inicio=201, fim=217,
                 rotulo="2026-09-29 — aconteceu de novo, pelo mesmo motivo (e a trava que saiu daí)"),
        ],
    ),
    dict(
        id="D8-intencao-nao-escrita",
        titulo="A intenção só existia na cabeça do Olavo",
        ocorrencias=1,
        regra="R5",
        resumo="Inventário pega estrutura; intenção só existe se alguém escrever.",
        blocos=[
            dict(id="H-R5-DAILYENTRY", inicio=263, fim=268,
                 rotulo="2026-09-08 — a auditoria não descobriu por que o `Daily Entry` foi desativado"),
        ],
    ),
    dict(
        id="D9-construir-o-que-ja-existia",
        titulo="Construir o que já existia, ou o que não podia ser auditado depois",
        ocorrencias=1,
        regra="R7",
        resumo="Corrigir um plano em texto custa minutos; corrigir uma construção custa semanas.",
        blocos=[
            dict(id="H-R7-MOTIVO", inicio=337, fim=340,
                 rotulo="O `1º Enriquecimento`, o `id_hubspot` e as 6 dimensões do score"),
        ],
    ),
    dict(
        id="D10-entrevista-atrasada",
        titulo="Entrevista de alinhamento pedida depois da construção",
        ocorrencias=1,
        regra="R9",
        resumo="Entrevista atrasada não é entrevista — é autópsia.",
        blocos=[
            dict(id="H-R9-1609", inicio=387, fim=393,
                 rotulo="2026-09-16 — quatro das nove perguntas já tinham sido respondidas por incidente"),
        ],
    ),
    dict(
        id="D11-execucao-no-chat-mae",
        titulo="Execução morando no chat-mãe",
        ocorrencias=1,
        regra="R1",
        resumo="Quando a execução mora no chat-mãe, o planejamento — que é o que só ele faz — se perde.",
        blocos=[
            dict(id="H-R1-CONTEXTO", inicio=219, fim=220,
                 rotulo="O motivo da R1, como estava escrito"),
        ],
    ),
    dict(
        id="D12-orquestracao-onde-skill-bastava",
        titulo="Orquestrar agente onde uma skill bastava",
        ocorrencias=1,
        regra="R8",
        resumo="O `phi-diagnostico` é o exemplo da casa: um agente que virou skill e passou a poder ser testado sem gastar token no n8n.",
        blocos=[
            dict(id="H-R8-MOTIVO", inicio=355, fim=357,
                 rotulo="O motivo da R8, como estava escrito"),
        ],
    ),
]

# ---------------------------------------------------------------------------
# FATOS — saem da raiz. Cada um tem um destino, e `provar.py` confere que o
# texto esta byte-identico la. `acao`:
#   "mover"     -> tem de aparecer byte-identico em `destino`
#   "apagar"    -> NAO vai para destino nenhum; o dono ja afirma o fato.
#                  `sentinelas` sao trechos que provam que o dono afirma mesmo.
#   "corrigir"  -> o bloco muda de proposito (a contradicao da branch, CA14).
#                  Conferido por `sentinelas_destino` e `proibido_na_raiz`.
# ---------------------------------------------------------------------------
FATOS = [
    dict(id="F-IDENTIDADE-PHI", inicio=8, fim=12, acao="mover",
         destino="docs/base/BASE-01-PRINCIPIOS.md",
         rotulo="O que é o PHI + o princípio central"),
    dict(id="F-T28", inicio=16, fim=41, acao="mover",
         destino="docs/strategic-planning/otimizacao-campanhas/CLAUDE.md",
         rotulo="Frente estratégica ativa: Otimização (T28)"),
    dict(id="F-STACK", inicio=44, fim=53, acao="apagar",
         dono="docs/base/BASE-02-SUPERFICIES.md",
         sentinelas=["phi_prod", "n8n-n8n-editor.1unqx7.easypanel.host",
                     "phi-workflow-sa@phi-production-488720.iam.gserviceaccount.com"],
         rotulo="Stack"),
    # 🔴 CORRIGIDO EM 03/10, contra a premissa do brief (§9.1 mandava APAGAR).
    # Medido: o BASE-02 §3 NAO tinha estes ids — ele escrevia "ver `CLAUDE.md`",
    # isto e, APONTAVA DE VOLTA para a raiz. Apagar da raiz teria perdido 6 ids e
    # quebrado o ponteiro do proprio dono. Entao: MOVER, nao apagar.
    dict(id="F-NOTION-IDS", inicio=56, fim=67, acao="mover",
         destino="docs/base/BASE-02-SUPERFICIES.md",
         rotulo="Notion — IDs dos Databases"),
    dict(id="F-BQ-TABELAS", inicio=70, fim=81, acao="mover",
         destino="docs/strategic-planning/saude-digital/CONTRATO-PHI.md",
         rotulo="BigQuery — Tabelas Principais"),
    dict(id="F-REGRAS-CRITICAS", inicio=90, fim=106, acao="mover",
         destino="docs/strategic-planning/saude-digital/REGRAS-CRITICAS-IMPLEMENTACAO.md",
         rotulo="As 14 Regras Críticas de Implementação"),
    dict(id="F-CLIENTE-REF", inicio=109, fim=118, acao="mover",
         destino="docs/strategic-planning/saude-digital/REGRAS-CRITICAS-IMPLEMENTACAO.md",
         rotulo="Cliente de Referência para Testes"),
    dict(id="F-REPO-GITHUB", inicio=121, fim=127, acao="corrigir",
         destino="docs/base/BASE-02-SUPERFICIES.md",
         sentinelas_destino=["olavofranzin/phi", "claude/consolidacao-2026-08"],
         proibido_na_raiz=["claude/create-phi-folder-n2RXF"],
         rotulo="Repositório GitHub — a contradição da branch (CA14)"),
    # 🔴 CORRIGIDO EM 03/10, contra a premissa do brief (§9.1 mandava APAGAR).
    # Medido: o MAPA-DE-DOCUMENTACAO tinha 3 dos 7 ids. Apagar da raiz teria
    # perdido 4. Entao: MOVER para o dono, nao apagar.
    dict(id="F-DOCS-NOTION", inicio=130, fim=141, acao="mover",
         destino="docs/strategic-planning/MAPA-DE-DOCUMENTACAO.md",
         rotulo="Documentação Completa no Notion"),
    dict(id="F-RTK", inicio=602, fim=630, acao="mover",
         destino="docs/ferramentas/rtk.md",
         rotulo="RTK — Rust Token Killer"),
]


def todos_os_blocos_de_historia():
    for d in DOENCAS:
        for b in d["blocos"]:
            yield d, b


# ---------------------------------------------------------------------------
# DEDUPLICADOS — exigencia que estava escrita em DOIS lugares e passa a ter UM
# dono. Nao e historia e nao e fato: e a regra 1.1 do BASE-00 aplicada as
# proprias regras (emenda 10 do brief). `provar.py` confere que a exigencia
# continua viva no dono, e que nao ficou repetida.
# ---------------------------------------------------------------------------
DEDUPLICADOS = [
    dict(
        id="DEDUP-BRANCH-R1-R15",
        inicio=193, fim=195,
        rotulo="A exigencia de declarar a branch saiu da R1; o dono agora e a R15",
        dono="R15",
        # Trechos que provam que a exigencia continua viva na raiz, dentro da R15.
        sentinelas_na_raiz=[
            "**ONDE COMMITO** — a branch | nome + **URL completa** + o comando de `checkout`",
            "Antes do PRIMEIRO commit, o sub-chat compara a branch do brief com a da instrução da sua",
        ],
        # Nao pode voltar a existir na raiz fora da R15.
        proibido_na_raiz=["(pedido do Olavo,"],
    ),
]

# Cabecalhos de regra que TEM de continuar existindo na raiz (nenhuma regra migra).
REGRAS_OBRIGATORIAS = [
    "### R1 — ", "### R2 — ", "### R3 — ", "### R4 — ", "### R5 — ",
    "### R6 — ", "### R7 — ", "### R8 — ", "### R9 — ", "### R10 — ",
    "### R11 — ", "### R12 — ", "### R13 — ", "### R14 — ", "### R15 — ",
]


# Regras que ficam FORA da regiao 172-599 e tambem nao podem mudar.
REGRAS_EXTRA = [
    (84, 87),    # secao VERIFICACAO
]
