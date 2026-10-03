# -*- coding: utf-8 -*-
"""
Gera o `docs/base/BASE-04-INCIDENTES.md` a partir do manifesto.

O texto de cada historia NAO e digitado aqui: e RECORTADO do `CLAUDE.md` do
commit base e colado verbatim. Por construcao, a identidade byte e garantida —
`provar.py` so confirma.

A forma de cada incidente (brief §2): data · o que parecia · o que era ·
o custo medido · a regra que saiu · link de volta.
A ordem e por FREQUENCIA DA DOENCA, nao por data (CA9).

Uso: python3 scripts/fase1-memoria/gerar-base04.py
"""
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import manifesto as M  # noqa: E402

DATA = "2026-10-03"
QUEM = "sub-chat da Fase 1 da memória compartilhada"

# Metadados por bloco. NADA aqui e deduzido: cada campo sai do proprio texto
# movido. Onde o texto nao diz, esta escrito "nao declarado no texto de origem".
FICHA = {
    "H-R11-7CASOS": dict(
        data="2026-09 a 2026-10 (sete casos)",
        parecia="nó verde, execução sem erro, nome do nó dizendo o que se esperava",
        era="o nó fazia o contrário — ou processava tudo, ou nada, ou devolvia zero como se fosse resposta",
        custo="duas semanas escrevendo em coluna inexistente · Fase 3 morta por 8 dias, verde todo dia · "
              "smoke de 1 virou escrita em 20 · 100% das linhas de um writer descartadas · "
              "`n_dias = 0` em campanhas com 250 dias de série",
    ),
    "H-R2-PROSPECCAO-0809": dict(
        data="2026-09-08",
        parecia="a documentação da Prospecção descrevia o parque de workflows",
        era="descrevia workflows que já não existiam havia semanas",
        custo="não sabíamos que a frente estava praticamente pronta (custo em decisão, não medido em horas)",
    ),
    "H-R2-ADR38-CABECALHO": dict(
        data="2026-09-18 (o fato era de 2026-09-09)",
        parecia="o cabeçalho do ADR-38 dizia *“Data efetiva do corte: ⬜ ainda não ocorreu”*, e o checklist do brief estava em branco",
        era="as 7 etapas estavam executadas havia 9 dias, inclusive a destrutiva — e o corpo do ADR narrava tudo",
        custo="uma frente parada como “bloqueada” sem estar · uma rotina agendada à toa · uma sessão inteira de conferência",
    ),
    "H-R13-TRES-DOCS": dict(
        data="uma semana de 2026-09",
        parecia="três documentos afirmavam uma configuração",
        era="o artefato contradizia os três",
        custo="três testemunhas falsas que a auditoria seguinte acreditaria",
    ),
    "H-R12-4LINHAS": dict(
        data="2026-09-16 a 2026-10-01 (quatro casos)",
        parecia="configuração mudada “só para testar”, que alguém voltaria depois",
        era="ninguém voltou — e nó desabilitado e draft não publicado não aparecem em lista nenhuma",
        custo="o backfill inteiro carimbado como contínuo · vazão presa em 3 depois do motivo acabar · "
              "a repontagem do M6 nunca exercida · um draft que **regredia** um conserto já provado, "
              "pronto para embarcar na publicação seguinte",
    ),
    "H-R6-FASE02-ADR37": dict(
        data="2026-09-08",
        parecia="o inventário viu “dois workflows escrevem o mesmo campo” e chamou de conflito; o plano estava aceito num ADR",
        era="eram três transições distintas — e executar o plano teria quebrado a Fase 3",
        custo="zero, porque a premissa foi verificada antes de desabilitar qualquer nó. "
              "É o único caso desta pasta cujo custo foi zero **por causa da regra**",
    ),
    "H-R6-COROLARIO2": dict(
        data="2026-09-26",
        parecia="dois critérios de aceite apoiados em “defeitos vivos” — o score 3× e o `t28_ga4_landing` morto há 19 dias",
        era="nenhum dos dois estava acontecendo; o score 3× era real em 19/09 e foi consertado até 26/09 sem ninguém registrar",
        custo="uma etapa inteira parou antes do primeiro nó · três das quatro premissas caíram · "
              "cinco briefs seguidos mandaram não tocar num defeito que já não existia. "
              "Custo de obedecer à regra: uma query",
    ),
    "H-R6-GRAVIDADE-0210": dict(
        data="2026-10-02 (duas vezes no mesmo dia)",
        parecia="o relatório traz o fato; quem leu acrescentou a urgência (*“das urgentes”*, *“pode ser credencial exposta”*)",
        era="três chaves `VITE_*` públicas por construção em repo privado, nada a rotacionar; "
            "e uma pasta `supabase/` com zero migrations e zero chamadas, nada a checar",
        custo="trabalho mandado ao Olavo em cima de duas urgências inventadas no caminho. "
              "Custo de medir, nos dois casos: dois comandos",
    ),
    "H-R13-EMENDA-0210": dict(
        data="2026-10-02",
        parecia="a regra dizia comparar `versionId` com `activeVersionId` — ids diferentes = mudança pendente",
        era="“Descartar alterações” cria um rascunho NOVO a partir do ativo: ids diferentes, "
            "conteúdo idêntico (68 nós, zero nós diferentes). A igualdade de ids não é estado alcançável",
        custo="um executor recusou `restore_workflow_version` — que era a ação certa — "
              "porque ela “reprovaria a R13”. A cautela estava correta; a regra estava incompleta",
    ),
    "H-R13-MOTIVO-1609": dict(
        data="2026-09-16",
        parecia="o `[P5] CRM-out` do PROSP-04 estava repontado para o Odoo, e duas leituras do workflow confirmaram",
        era="a repontagem estava só no rascunho; o que rodava chamava o P5 do HubSpot já aposentado, "
            "com `onError: continueRegularOutput`. As duas leituras leram o rascunho",
        custo="caminho de produção quebrado escondido por **dois dias**; "
              "a próxima prospecção teria alimentado nada e seguido verde",
    ),
    "H-R14-DUAS-FRENTES": dict(
        data="uma semana de 2026-09 (Agregador consertado em 29/09; Webview ainda aberto)",
        parecia="a identidade do cliente estava casada",
        era="casada por posição no array (`[0]`, `.first()`) numa frente, e por chave coagível na outra",
        custo="dado do KIL gravado sob o `CLI-13` · o guarda convertendo `error` em `not_configured` · "
              "campanha atribuída ao cliente errado na tela, que é a função central do produto",
    ),
    "H-BRANCH-2609": dict(
        data="2026-09-26",
        parecia="o brief declarava a branch, com URL completa",
        era="a instrução da sessão do sub-chat apontava para outra, e venceu",
        custo="o ADR-41 passou a citar como base um documento que não existia na branch dele — "
              "merge, conflito e documento canônico que mente",
    ),
    "H-BRANCH-2909": dict(
        data="2026-09-29",
        parecia="a regra de 26/09 tinha sido escrita, com mais destaque",
        era="aconteceu de novo, pelo mesmo motivo: o executor tem DUAS ordens e obedece à que está mais perto dele",
        custo="o relatório nasceu em `claude/plano-projeto-notion-v20z3g` e o chat-mãe teve de ir buscar. "
              "**Declarar a branch com mais destaque não resolveu** — o conserto foi mandar reconciliar antes de existir commit",
    ),
    "H-R5-DAILYENTRY": dict(
        data="2026-09-08",
        parecia="a auditoria por inventário cobria o parque",
        era="não descobriu que o `Daily Entry` tinha sido desativado **porque** o `sw metricas campanhas` "
            "entrou no lugar — isso só existia na cabeça do Olavo",
        custo="não declarado em horas no texto de origem. O custo nomeado é estrutural: "
              "“inventário pega estrutura; intenção só existe se alguém escrever”",
    ),
    "H-R7-MOTIVO": dict(
        data="não declarada no texto de origem (três casos nomeados)",
        parecia="construir era o caminho",
        era="já existia, ou o que se construiu não podia ser auditado depois",
        custo="semanas, no `1º Enriquecimento`, no `id_hubspot` e nas 6 dimensões do score",
    ),
    "H-R9-1609": dict(
        data="2026-09-16",
        parecia="pedir a entrevista de alinhamento era cumprir a R9",
        era="o sub-chat construía desde 13/09; a entrevista chegou depois",
        custo="quatro das nove perguntas já tinham sido respondidas por incidente. "
              "“Entrevista atrasada não é entrevista — é autópsia”",
    ),
    "H-R1-CONTEXTO": dict(
        data="não declarada no texto de origem",
        parecia="resolver a execução no chat-mãe era mais rápido",
        era="o contexto lota de detalhe operacional",
        custo="o planejamento — que é o que só o chat-mãe faz — se perde. Não medido em horas",
    ),
    "H-R8-MOTIVO": dict(
        data="não declarada no texto de origem",
        parecia="orquestrar vários agentes dava mais poder",
        era="skill tem carga de contexto baixa e saída previsível; orquestração tem o efeito oposto",
        custo="não declarado. O ganho medido é o inverso: o `phi-diagnostico` virou skill e "
              "passou a poder ser testado sem gastar token no n8n",
    ),
}

# Incidente que NAO estava no CLAUDE.md. Entra citando a fonte, e com a
# divergencia declarada em vez de resolvida por deducao.
EXTRA = """\
### 13. 2026-10-02 — o `W5` marcado “concluído” com um gráfico que deixou de existir

| | |
|---|---|
| **data** | 2026-10-02 |
| **o que parecia** | o `CHECKLIST-webview` marcava o lote **W5 concluído**, com *“tendência real (gráfico Evolução do Score ligado a `/api/phi-score-history`)”* |
| **o que era** | 🔴 **o gráfico parou de existir sem ninguém ver.** O `BASE-00-PORTA.md` §1.3 registra que a prova anexada era *“um gráfico que não existe”*; o handoff de 02/10 confirma e qualifica: *“declarado entregue, verde, ausente”* |
| **o custo medido** | não declarado em horas. O custo nomeado: **o `M10` no nível de funcionalidade**, e uma rota (`/api/phi-score-history`) que **quase foi apagada como órfã** por não ter mais consumidor — o Olavo reteve a decisão e mandou **religar o gráfico** |
| **o que teria pego** | 🔴 **um teste que afirme que o gráfico renderiza. Não existe** — entrou na lista de testes do conserto do join |
| **a regra que saiu** | `BASE-00-PORTA.md` §1.3 — **prova de concluído** |
| **link de volta** | [`BASE-00-PORTA.md` §1.3](BASE-00-PORTA.md) · [`webview/CLAUDE.md` §4](../strategic-planning/webview/CLAUDE.md) |

> 🔴 **Este incidente tem uma segunda camada, e ela está acontecendo AGORA.** O
> `docs/strategic-planning/webview/CHECKLIST-webview.md` **ainda não foi corrigido**: medido em
> 03/10, ele continua descrevendo o W5 como concluído **com** o gráfico. **O documento que mentiu
> sobre a entrega continua mentindo** — e é por isso que este caso aparece aqui e **também** na
> doença nº 2 (*“o documento mente, e o cabeçalho mente primeiro”*).
>
> ⚠️ **Fonte da reconciliação:** o `CHECKLIST` e o `BASE-00` se contradiziam, e eu não resolvi a
> contradição por dedução — **achei a resposta em
> `docs/handoff/2026-10-02-webview-os-6-passos-decisao-do-olavo.md` §7.1**, que é a decisão do Olavo
> sobre a rota. **O `BASE-00` está certo; o `CHECKLIST` está vencido.**
"""


def git_show(commit, caminho):
    return subprocess.run(
        ["git", "show", f"{commit}:{caminho}"],
        check=True, capture_output=True, text=True,
    ).stdout


def main():
    linhas = git_show(M.BASE_COMMIT, M.RAIZ).splitlines(keepends=True)
    doencas = sorted(M.DOENCAS, key=lambda d: (-d["ocorrencias"], d["id"]))

    out = []
    w = out.append

    w("# BASE-04 — INCIDENTES. O que já deu errado nesta casa, e quanto custou\n")
    w("")
    w("| | |")
    w("|---|---|")
    w("| **O que este documento é** | 🔴 **o dono das HISTÓRIAS que justificam as regras.** "
      "As regras moram no `CLAUDE.md` da raiz; o **porquê** delas mora aqui |")
    w(f"| **Escrito em** | {DATA} |")
    w(f"| **Verificado em** | {DATA}, pelo **{QUEM}**, **contra o `CLAUDE.md` da raiz no commit "
      f"`{M.BASE_COMMIT[:7]}`** — cada história abaixo foi **recortada** dele por script, não redigitada |")
    w("| **Dono de qual fato** | o que já deu errado, o que parecia, o que era, e o que custou |")
    w("| **Quem NÃO é dono** | o **texto das regras** (é o `CLAUDE.md` da raiz) · o **estado de hoje** "
      "(é o `ESTADO-DO-PROJETO.md`) · **onde cada integração vive** (é o `BASE-02-SUPERFICIES.md`) |")
    w("| **Gerado por** | `scripts/fase1-memoria/gerar-base04.py` · provado por `scripts/fase1-memoria/provar.py` |")
    w("")
    w("---")
    w("")
    w("## Como ler este documento")
    w("")
    w("🔴 **A ordem é por FREQUÊNCIA DA DOENÇA, não por data.** Uma doença que aconteceu sete vezes e "
      "uma que aconteceu uma vez não merecem a mesma atenção, e a ordem cronológica esconde exatamente "
      "isso: espalha as sete pelo calendário e faz cada uma parecer um acidente isolado.")
    w("")
    w("🔴 **O texto de cada história é byte-idêntico ao que estava no `CLAUDE.md`.** Ele aparece em "
      "bloco de citação, recortado por script. **Nada foi reescrito**, para que a prova de não-perda "
      "possa ser automática — e para que o enxugamento da constituição não possa ter perdido uma palavra "
      "sem o script acusar.")
    w("")

    # Placar
    w("## O placar das doenças")
    w("")
    w("| # | A doença | Vezes | Regra que saiu |")
    w("|---|---|---|---|")
    for i, d in enumerate(doencas, 1):
        w(f'| {i} | [{d["titulo"]}](#{i}-{d["id"]}) | **{d["ocorrencias"]}** | `{d["regra"]}` |')
    w("")
    w("> **O que o placar mostra, e a ordem cronológica escondia:** as duas primeiras doenças respondem "
      "por **12 dos incidentes desta pasta**. Elas não são sete e cinco acidentes — são **duas doenças**, "
      "cada uma repetida. Quem for consertar causa-raiz nesta casa, começa por elas.")
    w("")
    w("---")
    w("")

    # Incidentes
    n = 0
    for i, d in enumerate(doencas, 1):
        w(f'## {i}. {d["titulo"]} <a id="{i}-{d["id"]}"></a>')
        w("")
        w(f'**Vezes que aconteceu:** {d["ocorrencias"]} · **Regra que saiu:** `{d["regra"]}`')
        w("")
        w(f'> {d["resumo"]}')
        w("")
        for bloco in d["blocos"]:
            n += 1
            f = FICHA[bloco["id"]]
            w(f'### {n}. {bloco["rotulo"]}')
            w("")
            w("| | |")
            w("|---|---|")
            w(f'| **data** | {f["data"]} |')
            w(f'| **o que parecia** | {f["parecia"]} |')
            w(f'| **o que era** | {f["era"]} |')
            w(f'| **o custo medido** | {f["custo"]} |')
            w(f'| **a regra que saiu** | `{d["regra"]}` |')
            w(f'| **link de volta** | [`CLAUDE.md` → {d["regra"]}](../../CLAUDE.md) '
              f'· âncora `{bloco["id"]}` |')
            w("")
            w(f'**Como estava escrito no `CLAUDE.md`** (linhas {bloco["inicio"]}–{bloco["fim"]} '
              f'do commit `{M.BASE_COMMIT[:7]}`, byte-idêntico):')
            w("")
            texto = "".join(linhas[bloco["inicio"] - 1:bloco["fim"]]).rstrip("\n")
            w(texto)
            w("")
        w("---")
        w("")

    # O incidente de fora
    w(EXTRA)
    w("---")
    w("")
    w("## O que esta pasta ainda não sabe")
    w("")
    w("| ⬜ | O que falta |")
    w("|---|---|")
    w("| **o custo em horas** da maioria dos incidentes | o texto de origem quase nunca o declarou. "
      "Onde não está, está escrito *“não declarado no texto de origem”* — **não estimado** |")
    w("| **o `W5`** | a divergência do incidente 13, acima |")
    w("| **os incidentes antes de 2026-09** | o `CLAUDE.md` só começou a guardar história em setembro. "
      "O que aconteceu antes **não está escrito em lugar nenhum que eu tenha achado** |")
    w("")

    conteudo = "\n".join(out).rstrip("\n") + "\n"
    with open(M.BASE04, "w", encoding="utf-8") as fh:
        fh.write(conteudo)
    print(f"{M.BASE04} gerado: {len(conteudo.splitlines())} linhas, "
          f"{len(conteudo.encode('utf-8'))} bytes, {n} incidentes recortados + 1 citado de fonte externa")


if __name__ == "__main__":
    main()
