# -*- coding: utf-8 -*-
"""
Substitui marcadores `<<<BLOCO:ID>>>` pelo texto BYTE-IDENTICO do bloco
recortado do `CLAUDE.md` do commit base.

Assim os documentos de destino recebem o fato exatamente como ele estava na
raiz, sem passar pela digitacao de ninguem — e `provar.py` confirma.

Uso: python3 scripts/fase1-memoria/inserir-blocos.py <arquivo> [<arquivo>...]
"""
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import manifesto as M  # noqa: E402

MARCADOR = re.compile(r"^<<<BLOCO:([A-Z0-9\-]+)>>>$", re.M)


def git_show(commit, caminho):
    return subprocess.run(
        ["git", "show", f"{commit}:{caminho}"],
        check=True, capture_output=True, text=True,
    ).stdout


def main(arquivos):
    linhas = git_show(M.BASE_COMMIT, M.RAIZ).splitlines(keepends=True)
    faixas = {f["id"]: (f["inicio"], f["fim"]) for f in M.FATOS}
    for _, b in M.todos_os_blocos_de_historia():
        faixas[b["id"]] = (b["inicio"], b["fim"])

    for arq in arquivos:
        with open(arq, encoding="utf-8") as fh:
            texto = fh.read()
        achados = MARCADOR.findall(texto)
        if not achados:
            print(f"  (sem marcador) {arq}")
            continue

        def troca(m):
            bid = m.group(1)
            if bid not in faixas:
                raise SystemExit(f"ERRO: bloco desconhecido no manifesto: {bid}")
            a, b = faixas[bid]
            return "".join(linhas[a - 1:b]).rstrip("\n")

        novo = MARCADOR.sub(troca, texto)
        with open(arq, "w", encoding="utf-8") as fh:
            fh.write(novo)
        print(f"  {arq}: {len(achados)} bloco(s) inserido(s) -> {achados}")


if __name__ == "__main__":
    main(sys.argv[1:])
