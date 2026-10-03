# -*- coding: utf-8 -*-
"""
Prova MECANICA da Fase 1 da memoria compartilhada.

Nao confia em leitura humana. Le o `CLAUDE.md` do commit base, recorta os
blocos declarados no manifesto e exige que:

  CA3  toda HISTORIA que saiu da raiz esteja BYTE-IDENTICA no BASE-04.
  CA18 todo FATO que saiu da raiz exista no destino (byte-identico), ou,
       quando foi apagado por ja ter dono, que o dono realmente o afirme.
  CA4  todo o texto de REGRA sobreviva BYTE-IDENTICO na raiz. A regiao de
       regras menos as historias/dedups declaradas = o texto imperativo.
       Nenhuma palavra, nenhum numero.
  CA13 nenhuma regra R1-R15 tenha saido da raiz.
  CA14 a contradicao da branch tenha sido consertada.
  CA19 a exigencia de branch nao tenha ficado duplicada entre R1 e R15.

Uso:  python3 scripts/fase1-memoria/provar.py
Saida: relatorio + os 4 numeros. Codigo de saida 1 se qualquer prova falhar.
"""
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import manifesto as M  # noqa: E402

VERDE, VERM, AMAR, FIM = "\033[32m", "\033[31m", "\033[33m", "\033[0m"
falhas = []


def git_show(commit, caminho):
    return subprocess.run(
        ["git", "show", f"{commit}:{caminho}"],
        check=True, capture_output=True, text=True,
    ).stdout


def ler(caminho):
    with open(caminho, encoding="utf-8") as fh:
        return fh.read()


def recorta(linhas, inicio, fim):
    """Recorta [inicio, fim] 1-indexado inclusivo, como texto."""
    return "".join(linhas[inicio - 1:fim])


def ok(cond, rotulo, detalhe=""):
    if cond:
        print(f"  {VERDE}OK{FIM}   {rotulo}")
    else:
        print(f"  {VERM}FALHA{FIM} {rotulo}")
        if detalhe:
            print(f"        {detalhe}")
        falhas.append(rotulo)
    return cond


print("=" * 78)
print("PROVA MECANICA — Fase 1 da memoria compartilhada do PHI")
print("=" * 78)
print(f"commit base: {M.BASE_COMMIT}")

original = git_show(M.BASE_COMMIT, M.RAIZ)
linhas_orig = original.splitlines(keepends=True)
print(f"CLAUDE.md original: {len(linhas_orig)} linhas, {len(original.encode('utf-8'))} bytes")

novo = ler(M.RAIZ)
print(f"CLAUDE.md novo:     {len(novo.splitlines())} linhas, {len(novo.encode('utf-8'))} bytes")

# ---------------------------------------------------------------------------
# CA3 — nenhuma historia perdida
# ---------------------------------------------------------------------------
print(f"\n{AMAR}CA3 — toda historia byte-identica no BASE-04{FIM}")
base04 = ler(M.BASE04)
n_hist = 0
for doenca, bloco in M.todos_os_blocos_de_historia():
    texto = recorta(linhas_orig, bloco["inicio"], bloco["fim"])
    presente = texto.rstrip("\n") in base04
    ok(presente,
       f'{bloco["id"]} (linhas {bloco["inicio"]}-{bloco["fim"]}, {doenca["regra"]})',
       "bloco NAO encontrado byte-identico no BASE-04")
    n_hist += 1
print(f"  -> {n_hist} blocos de historia conferidos")

# e nenhuma historia continua na raiz (nao foi copiada, foi movida)
print(f"\n{AMAR}CA2 — a historia saiu da raiz (foi movida, nao copiada){FIM}")
for doenca, bloco in M.todos_os_blocos_de_historia():
    texto = recorta(linhas_orig, bloco["inicio"], bloco["fim"]).rstrip("\n")
    ok(texto not in novo, f'{bloco["id"]} nao ficou duplicado na raiz')

# ---------------------------------------------------------------------------
# CA18 — nenhum fato perdido
# ---------------------------------------------------------------------------
print(f"\n{AMAR}CA18 / CA16 — todo fato que saiu da raiz existe no destino{FIM}")
for fato in M.FATOS:
    texto = recorta(linhas_orig, fato["inicio"], fato["fim"]).rstrip("\n")
    acao = fato["acao"]
    if acao == "mover":
        destino = ler(fato["destino"])
        ok(texto in destino,
           f'{fato["id"]} -> {fato["destino"]} (byte-identico)',
           "bloco NAO encontrado byte-identico no destino")
    elif acao == "apagar":
        dono = ler(fato["dono"])
        faltando = [s for s in fato["sentinelas"] if s not in dono]
        ok(not faltando,
           f'{fato["id"]} apagado; dono e {fato["dono"]}',
           f"o dono NAO afirma: {faltando}")
    elif acao == "corrigir":
        destino = ler(fato["destino"])
        faltando = [s for s in fato["sentinelas_destino"] if s not in destino]
        ok(not faltando,
           f'{fato["id"]} corrigido e levado para {fato["destino"]}',
           f"faltando no destino: {faltando}")
    # em todos os casos: o bloco original nao pode ter ficado na raiz
    ok(texto not in novo, f'  {fato["id"]} saiu da raiz')

# ---------------------------------------------------------------------------
# CA4 / CA13 — nenhuma regra alterada, nenhuma regra fora da raiz
# ---------------------------------------------------------------------------
print(f"\n{AMAR}CA4 — texto de regra byte-identico na raiz (nem palavra, nem numero){FIM}")
ini_reg, fim_reg = M.REGRAS_REGIAO
removidos = []
for _, bloco in M.todos_os_blocos_de_historia():
    if ini_reg <= bloco["inicio"] <= fim_reg:
        removidos.append((bloco["inicio"], bloco["fim"]))
for d in M.DEDUPLICADOS:
    removidos.append((d["inicio"], d["fim"]))
removidos.sort()

segmentos, cursor = [], ini_reg
for a, b in removidos:
    if a > cursor:
        segmentos.append((cursor, a - 1))
    cursor = max(cursor, b + 1)
if cursor <= fim_reg:
    segmentos.append((cursor, fim_reg))


def substantivo(texto):
    """Segmento com conteudo real — evita prova vazia com linha em branco."""
    return sum(1 for l in texto.splitlines() if len(l.strip()) > 3) >= 1


conferidos = 0
for a, b in segmentos:
    texto = recorta(linhas_orig, a, b).strip("\n")
    if not substantivo(texto):
        continue
    ok(texto in novo, f"segmento de regra {a}-{b} intacto",
       "texto de regra ALTERADO ou perdido")
    conferidos += 1
print(f"  -> {conferidos} segmentos de regra conferidos, cobrindo "
      f"{sum(b - a + 1 for a, b in segmentos)} das {fim_reg - ini_reg + 1} linhas da regiao de regras")

print(f"\n{AMAR}CA13 — as 15 regras continuam na raiz{FIM}")
for cab in M.REGRAS_OBRIGATORIAS:
    ok(cab in novo, f'cabecalho "{cab.strip()}" presente na raiz')

# ---------------------------------------------------------------------------
# CA14 / CA19 — a branch
# ---------------------------------------------------------------------------
print(f"\n{AMAR}CA14 / CA19 — a contradicao da branch, e a exigencia sem duplicata{FIM}")
for d in M.DEDUPLICADOS:
    for s in d["sentinelas_na_raiz"]:
        ok(s in novo, f'{d["id"]}: exigencia viva no dono ({d["dono"]})',
           f"sentinela ausente: {s[:60]}")
    for p in d["proibido_na_raiz"]:
        ok(p not in novo, f'{d["id"]}: exigencia nao ficou duplicada na raiz')
for fato in M.FATOS:
    for p in fato.get("proibido_na_raiz", []):
        ok(p not in novo, f"CA14: a branch obsoleta `{p}` saiu da raiz")

# ---------------------------------------------------------------------------
# CA10 — o teto da pasta
# ---------------------------------------------------------------------------
print(f"\n{AMAR}CA10 — docs/base/ com no maximo 6 documentos + fichas/{FIM}")
docs = sorted(f for f in os.listdir("docs/base") if f.endswith(".md"))
base = [f for f in docs if f.startswith("BASE-")]
ok(len(base) <= 6, f"documentos BASE-*: {len(base)} (<= 6)", str(base))
print(f"        {base}")
outros = [f for f in docs if not f.startswith("BASE-")]
print(f"        outros .md em docs/base/: {outros}")
if len(docs) + 1 > 6 + len(outros):
    pass
if len(base) == 5 and outros:
    print(f"  {AMAR}AVISO{FIM} o teto e 6 documentos. Hoje: {len(base)} BASE-* + {len(outros)} outro(s) "
          f"= {len(docs)}. O BASE-05 (Fase 3) fara {len(docs) + 1}: o teto ESTOURA, "
          f"a menos que o PLANO saia de docs/base/ quando a Fase 3 fechar.")

# ---------------------------------------------------------------------------
# Os 4 numeros
# ---------------------------------------------------------------------------
lo, bo = len(linhas_orig), len(original.encode("utf-8"))
ln, bn = len(novo.splitlines()), len(novo.encode("utf-8"))
print("\n" + "=" * 78)
print("OS 4 NUMEROS DO CLAUDE.md (CA5)")
print("=" * 78)
print(f"  linhas: {lo} -> {ln}   ({ln - lo:+d}, {100 * (lo - ln) / lo:.1f}% menor)")
print(f"  bytes:  {bo} -> {bn}   ({bn - bo:+d}, {100 * (bo - bn) / bo:.1f}% menor)")

print("\n" + "=" * 78)
if falhas:
    print(f"{VERM}PROVA REPROVADA — {len(falhas)} falha(s){FIM}")
    for f in falhas:
        print(f"  - {f}")
    sys.exit(1)
print(f"{VERDE}PROVA APROVADA — nenhuma historia perdida, nenhum fato perdido, "
      f"nenhuma regra alterada{FIM}")
print("=" * 78)
