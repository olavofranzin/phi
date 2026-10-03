# -*- coding: utf-8 -*-
"""
Gera o `CLAUDE.md` novo da raiz.

🔴 O texto das REGRAS nao e digitado aqui. E RECORTADO do `CLAUDE.md` do commit
base, linha por linha, pulando apenas os intervalos declarados no manifesto como
HISTORIA (vao para o BASE-04) ou DEDUPLICADO (a exigencia passou a ter um dono).
No lugar de cada bloco removido entra UMA linha de ponteiro.

Por construcao: nenhuma palavra de regra passa pela digitacao de ninguem.

Uso: python3 scripts/fase1-memoria/gerar-claude-md.py
"""
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import manifesto as M  # noqa: E402

DATA = "2026-10-03"

# Uma linha por bloco removido: meia frase de motivo + link.
# A meia frase e DESCRITIVA do incidente, nunca um pedaco da regra.
PONTEIRO = {
    "H-R1-CONTEXTO":
        "execução morando aqui lota o contexto e o planejamento se perde",
    "H-BRANCH-2609":
        "em 26/09 a instrução da sessão venceu o brief e o ADR-41 citou documento inexistente",
    "H-BRANCH-2909":
        "em 29/09 aconteceu de novo — declarar a branch com mais destaque não resolveu; a trava é a R15",
    "H-R2-PROSPECCAO-0809":
        "em 08/09 a doc da Prospecção descrevia workflows mortos havia semanas",
    "H-R2-ADR38-CABECALHO":
        "em 18/09 o ADR-38 estava executado havia 9 dias e o cabeçalho dizia que não",
    "H-R5-DAILYENTRY":
        "em 08/09 a auditoria não descobriu por que o `Daily Entry` saiu do ar",
    "H-R6-FASE02-ADR37":
        "em 08/09 a Fase 0.2 do ADR-37 foi cancelada na hora de executar, e salvou a Fase 3",
    "H-R6-COROLARIO2":
        "em 26/09 dois critérios de aceite nasceram de defeitos que já não existiam",
    "H-R6-GRAVIDADE-0210":
        "em 02/10 o chat-mãe inflou gravidade duas vezes no mesmo dia",
    "H-R7-MOTIVO":
        "o `1º Enriquecimento`, o `id_hubspot` e as 6 dimensões do score custaram semanas",
    "H-R8-MOTIVO":
        "o `phi-diagnostico` é o agente que virou skill e passou a ser testável sem token",
    "H-R9-1609":
        "em 16/09 a entrevista chegou depois da construção — autópsia, não entrevista",
    "H-R11-7CASOS":
        "sete nós verdes fazendo o contrário do nome, de 09 a 10/2026",
    "H-R12-4LINHAS":
        "quatro estados temporários que não voltaram, de 16/09 a 01/10",
    "H-R13-EMENDA-0210":
        "em 02/10 a igualdade de ids revelou-se inalcançável, e fez recusar a ação certa",
    "H-R13-MOTIVO-1609":
        "em 16/09 duas leituras do workflow leram o rascunho e esconderam produção quebrada por 2 dias",
    "H-R13-TRES-DOCS":
        "três documentos, numa semana, afirmaram o que o artefato contradizia",
    "H-R14-DUAS-FRENTES":
        "duas frentes independentes, na mesma semana, casando identidade por posição e por chave coagível",
}

PONTEIRO_DEDUP = {
    "DEDUP-BRANCH-R1-R15":
        "> 🔴 **A branch de trabalho é declarada no brief, não aqui** — a exigência e o seu formato são da\n"
        "> **R15**, e as duas histórias de branch estão em\n"
        "> [`docs/base/BASE-04-INCIDENTES.md`](docs/base/BASE-04-INCIDENTES.md#7-D7-branch-ditada-por-engano).",
}


def git_show(commit, caminho):
    return subprocess.run(
        ["git", "show", f"{commit}:{caminho}"],
        check=True, capture_output=True, text=True,
    ).stdout


def ancora_por_bloco():
    """Mapeia bloco -> (indice da doenca, id da doenca), na MESMA ordem do BASE-04."""
    doencas = sorted(M.DOENCAS, key=lambda d: (-d["ocorrencias"], int(d["id"].split("-")[0][1:])))
    m = {}
    for i, d in enumerate(doencas, 1):
        for b in d["blocos"]:
            m[b["id"]] = (i, d["id"])
    return m


def main():
    linhas = git_show(M.BASE_COMMIT, M.RAIZ).splitlines(keepends=True)
    anc = ancora_por_bloco()

    # Mapa linha-inicial -> (tipo, bloco) do que sai, e o conjunto de linhas a pular.
    remocoes = {}
    pular = set()
    for _, b in M.todos_os_blocos_de_historia():
        remocoes[b["inicio"]] = ("historia", b)
        pular.update(range(b["inicio"], b["fim"] + 1))
    for d in M.DEDUPLICADOS:
        remocoes[d["inicio"]] = ("dedup", d)
        pular.update(range(d["inicio"], d["fim"] + 1))

    out = []
    w = out.append

    # ---------------------------------------------------------------- cabecalho
    w("# PHI™ — as REGRAS. Leia este arquivo antes de qualquer implementação")
    w("")
    w("| | |")
    w("|---|---|")
    w("| 🔴 **A linha que não se cruza** | **A RAIZ guarda REGRA. As FRENTES guardam FATO.** "
      "*Regra não lida causa estrago; fato não lido causa pergunta* — e pergunta o ponteiro resolve |")
    w("| **O que este arquivo é** | as **regras de trabalho R1–R15**, e só elas. "
      "É lido no início de **toda** sessão, inclusive nas que nunca tocarão numa frente |")
    w("| **O que ele NÃO é** | não é stack, não é id de Notion, não é tabela, não é história. "
      "Cada um desses tem dono, e os donos estão na tabela de ponteiros abaixo |")
    w(f"| **Verificado em** | {DATA}, pelo **sub-chat da Fase 1 da memória compartilhada**, "
      f"**contra o próprio `CLAUDE.md` no commit `{M.BASE_COMMIT[:7]}`** — "
      "o texto das regras foi **recortado** por script, não redigitado |")
    w("| **A porta da memória** | 🔴 [`docs/base/BASE-00-PORTA.md`](docs/base/BASE-00-PORTA.md) — "
      "**se você não sabe onde procurar, comece ali** |")
    w("")
    w("---")
    w("")
    w("## O que é o PHI")
    w("")
    w("Monitoramento e gestão de campanhas de tráfego pago. Calcula um score de saúde diário por "
      "campanha e **orienta o gestor — nunca executa otimizações.**")
    w("")
    w("🔴 **O porquê, o que o PHI não é, e as decisões-mãe:** "
      "[`docs/base/BASE-01-PRINCIPIOS.md`](docs/base/BASE-01-PRINCIPIOS.md). "
      "Este arquivo **não é dono** desse fato.")
    w("")
    w("---")
    w("")
    # ------------------------------------------------------------- ponteiros
    w("## Por onde começar, por assunto")
    w("")
    w("> **Nenhuma linha desta tabela afirma um fato — todas apontam para o dono dele.** "
      "É a regra 1.1 do `BASE-00` aplicada a este arquivo.")
    w("")
    w("| Se a conversa é sobre… | Leia (o dono do fato) |")
    w("|---|---|")
    w("| 🔴 **Não sei onde procurar / quem é dono deste fato** | "
      "[`docs/base/BASE-00-PORTA.md`](docs/base/BASE-00-PORTA.md) |")
    w("| **Por que o PHI existe, e o que ele não é** | "
      "[`docs/base/BASE-01-PRINCIPIOS.md`](docs/base/BASE-01-PRINCIPIOS.md) |")
    w("| **Stack, credencial, id de Notion, onde cada coisa vive e se está no ar** | "
      "[`docs/base/BASE-02-SUPERFICIES.md`](docs/base/BASE-02-SUPERFICIES.md) |")
    w("| **Qual invariante existe, e se já foi violado** | "
      "[`docs/base/BASE-03-INVARIANTES.md`](docs/base/BASE-03-INVARIANTES.md) |")
    w("| 🔴 **Já tentamos isso e deu errado? Quanto custou?** | "
      "[`docs/base/BASE-04-INCIDENTES.md`](docs/base/BASE-04-INCIDENTES.md) |")
    w("| **Por que este workflow/tabela existe** | "
      "[`docs/base/fichas/`](docs/base/fichas/) + a descrição do próprio artefato (**R5**) |")
    w("| **Onde o projeto está · quanto falta · achar qualquer doc** | "
      "`docs/strategic-planning/ESTADO-DO-PROJETO.md` (§0 PAINEL) · "
      "`DEFINICAO-DE-PRONTO-PHI-V1.md` · `MAPA-DE-DOCUMENTACAO.md` |")
    w("| **Score de mídia / parque PHI** (métricas, BigQuery, Notion, vigias) | "
      "`docs/strategic-planning/saude-digital/CLAUDE.md` |")
    w("| 🔴 **Regras críticas de n8n / BigQuery / Google Ads, e o cliente de teste** | "
      "`docs/strategic-planning/saude-digital/REGRAS-CRITICAS-IMPLEMENTACAO.md` |")
    w("| **Otimização / cérebro de análise (“Módulo 28” / T28)** | "
      "`docs/strategic-planning/otimizacao-campanhas/CLAUDE.md` |")
    w("| **Webview** (o que está no ar, e as dívidas declaradas) | "
      "`docs/strategic-planning/webview/CLAUDE.md` |")
    w("| **Saúde Digital do Negócio** (o pilar não medido) | "
      "`docs/strategic-planning/saude-digital-do-negocio/CLAUDE.md` |")
    w("| **Prospecção** (leads, GBP, planilha, CRM) | "
      "`docs/strategic-planning/prospeccao/CLAUDE.md` |")
    w("| **CRM Odoo** | skills `phi-odoo-crm` e `odoo-19-dev` |")
    w("| **RTK** (o proxy de token) | `docs/ferramentas/rtk.md` |")
    w("| **Procedimentos da agência** (quem faz o quê) | "
      "**Miro — `Board Agência`** · `https://miro.com/app/board/uXjVHecmR7c=/` "
      "⚠️ **não a `Cópia`** |")
    w("| **Tarefa, estado, quem destrava** | "
      "**Notion — `PHI - Gestão de Projetos`** (`774518d2128a4b10aede511718737058`) |")
    w("")
    w("> ⚠️ **Dois scores diferentes, não confundir:** `phi_value` (saúde da **campanha**) e "
      "`potencial_comercial` (qualidade do **lead**). Frentes, donos e ADRs distintos.")
    w("")
    w("---")
    w("")
    # ------------------------------------------- VERIFICACAO (recortado, regra)
    for n in range(M.REGRAS_EXTRA[0][0], M.REGRAS_EXTRA[0][1] + 1):
        w(linhas[n - 1].rstrip("\n"))
    w("")
    w("---")
    w("")

    # --------------------------------------------- REGRAS (recortadas, 172-599)
    ini, fim = M.REGRAS_REGIAO
    n = ini
    while n <= fim:
        if n in remocoes:
            tipo, b = remocoes[n]
            if tipo == "historia":
                i, did = anc[b["id"]]
                w(f'> **Motivo:** {PONTEIRO[b["id"]]} — história completa em '
                  f'[`BASE-04-INCIDENTES`](docs/base/BASE-04-INCIDENTES.md#{i}-{did}).')
            else:
                w(PONTEIRO_DEDUP[b["id"]])
            n = b["fim"] + 1
            continue
        if n in pular:
            n += 1
            continue
        w(linhas[n - 1].rstrip("\n"))
        n += 1

    # ------------------------------------------------------------------ rodape
    w("")
    w("---")
    w("")
    w("## O que saiu deste arquivo na Fase 1, e para onde")
    w("")
    w("| O que saiu | Para onde | Por quê |")
    w("|---|---|---|")
    w("| **as histórias** dos motivos das regras | `docs/base/BASE-04-INCIDENTES.md` | "
      "ordenadas por **frequência da doença**, que a ordem cronológica escondia |")
    w("| **Stack** · **ids do Notion** | `docs/base/BASE-02-SUPERFICIES.md` | **já era dono** — "
      "duas cópias divergirem é questão de tempo |")
    w("| **tabelas do BigQuery** | `saude-digital/CONTRATO-PHI.md` | já era dono |")
    w("| **as 14 Regras Críticas** · **o cliente de teste** | "
      "`saude-digital/REGRAS-CRITICAS-IMPLEMENTACAO.md` | é fato de frente, não regra de raiz |")
    w("| **o bloco T28** | `otimizacao-campanhas/CLAUDE.md` | idem |")
    w("| **Documentação no Notion** | `MAPA-DE-DOCUMENTACAO.md` | já era dono |")
    w("| **RTK** | `docs/ferramentas/rtk.md` | é ferramenta, não regra |")
    w("| **o repositório e a branch** | `docs/base/BASE-02-SUPERFICIES.md` §3.2 | "
      "🔴 e a **contradição foi consertada**: este arquivo declarava **uma branch obsoleta** "
      "(último commit em abril/2026) numa seção, e a branch certa na R1. "
      "**Qual é a branch, quem diz é o brief — R15** |")
    w("")
    w("> 🔴 **A prova de que nada se perdeu é mecânica:** "
      "`python3 scripts/fase1-memoria/provar.py`. Ela recorta cada bloco do commit "
      f"`{M.BASE_COMMIT[:7]}` e falha se qualquer história, qualquer fato ou qualquer palavra de "
      "regra não estiver onde deveria.")
    w("")
    w(f"*PHI™ — regras R1–R15. Enxugado na Fase 1 da memória compartilhada, {DATA}.*")

    conteudo = "\n".join(out).rstrip("\n") + "\n"
    with open(M.RAIZ, "w", encoding="utf-8") as fh:
        fh.write(conteudo)
    print(f"CLAUDE.md gerado: {len(conteudo.splitlines())} linhas, "
          f"{len(conteudo.encode('utf-8'))} bytes")


if __name__ == "__main__":
    main()
