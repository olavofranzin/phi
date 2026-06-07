#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificação independente das 3 cópias de workflows de métricas (n8n) + campos Notion.

Objetivo
--------
Auditar, de forma reprodutível e sem depender de nenhuma análise prévia, se os nós
de cálculo de métricas das 3 cópias refletem corretamente as fórmulas do documento
"Gestão de Tráfego Pago, Métricas e Benchmarks (2026)" e se o CPM foi adicionado
ponta a ponta em conjuntos e anúncios.

NUANCE CRÍTICA (não trate como bug)
-----------------------------------
Os campos Notion "CTR" e "Taxa de Conversão" são number_format = "percent".
No Notion, um campo "percent" ARMAZENA a fração (0.03) e EXIBE "3%".
Logo, o código DEVE gravar a fração (clicks/impressions, conversions/clicks) SEM "* 100".
Multiplicar por 100 mostraria 300% — seria um bug. Portanto este verificador
CONFIRMA a ausência de "* 100" nessas linhas (e falharia se alguém adicionar ×100).

Exceção: no WF1 ("campanhas"), o nó "Code Tendência Real" usa "* 100" internamente
para uma razão de tendência (cancela na divisão), e ali a regra é só usar o
numerador/denominador certo por métrica (CTR = clicks/impr ; Taxa de Conversão = conv/clicks).

Como rodar
----------
Requisitos: Python 3.8+ (somente stdlib).
Variáveis de ambiente:
  N8N_BASE_URL   ex.: https://n8n-n8n-editor.1unqx7.easypanel.host
  N8N_API_KEY    API key do n8n (Settings > API). Header: X-N8N-API-KEY
  NOTION_API_KEY (opcional) token de integração do Notion; habilita a checagem de formato dos campos.

  python3 scripts/verify_sw_metrics.py

Saída: relatório PASS/FAIL por checagem. Exit code 0 se tudo passou, 1 se houve falha.
"""

import json
import os
import re
import sys
import urllib.request
import urllib.error

# ----------------------------------------------------------------------------
# Configuração: IDs e expectativas
# ----------------------------------------------------------------------------
WF = {
    "conjuntos": "t0DH5N5maws4egnG",   # sw métricas conjuntos copy
    "anuncios":  "uqEHxuJPWRiZS6ai",   # sw métricas e diagnósticos anúncios copy
    "campanhas": "W571K320aqIHsdtH",   # sw metricas campanhas copy
}

# Bases Notion (database IDs) e o formato esperado de cada campo de taxa/custo.
NOTION_DBS = {
    "Conjuntos de Anúncios": {
        "id": "19fb65e5-c72b-81e0-a3ad-c8017d4275e5",
        "expect": {"CTR": "percent", "Taxa de Conversão": "percent", "CPM": "real",
                   "CPC": "real", "CPA": "real"},
    },
    "Anúncios": {
        "id": "297b65e5-c72b-8061-89b3-f31bd41d7e7f",
        "expect": {"CTR": "percent", "Taxa de Conversão": "percent", "CPM": "real",
                   "CPC": "real", "CPA": "real"},
    },
}

N8N_BASE_URL = os.environ.get("N8N_BASE_URL", "").rstrip("/")
N8N_API_KEY = os.environ.get("N8N_API_KEY", "")
NOTION_API_KEY = os.environ.get("NOTION_API_KEY", "")

# ----------------------------------------------------------------------------
# Helpers
# ----------------------------------------------------------------------------
def compact(s):
    """Minúsculas e sem espaços — robusto a formatação."""
    return re.sub(r"\s+", "", s or "").lower()

def http_get_json(url, headers):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))

def fetch_workflow(wf_id):
    if not N8N_BASE_URL or not N8N_API_KEY:
        raise RuntimeError("Defina N8N_BASE_URL e N8N_API_KEY no ambiente.")
    url = "%s/api/v1/workflows/%s" % (N8N_BASE_URL, wf_id)
    return http_get_json(url, {"X-N8N-API-KEY": N8N_API_KEY, "accept": "application/json"})

def node_by_name(wf, name):
    for n in wf.get("nodes", []):
        if n.get("name") == name:
            return n
    return None

def jscode(wf, name):
    n = node_by_name(wf, name)
    return (n or {}).get("parameters", {}).get("jsCode", "") if n else None

def notion_prop_value_keys(wf, node_name):
    n = node_by_name(wf, node_name)
    if not n:
        return []
    pv = n.get("parameters", {}).get("propertiesUi", {}).get("propertyValues", [])
    return [e.get("key", "") for e in pv if isinstance(e, dict)]

# ----------------------------------------------------------------------------
# Motor de checagens
# ----------------------------------------------------------------------------
RESULTS = []  # (scope, ok, msg)

def check(scope, ok, msg):
    RESULTS.append((scope, bool(ok), msg))
    flag = "PASS" if ok else "FAIL"
    print("  [%s] %s" % (flag, msg))

def must_contain(scope, code, needle, msg):
    check(scope, needle in compact(code), msg)

def must_not_contain(scope, code, needle, msg):
    check(scope, needle not in compact(code), msg)

# ----------------------------------------------------------------------------
# Checagens por workflow
# ----------------------------------------------------------------------------
def verify_adlevel(scope, code, update_keys, has_two_branches):
    """conjuntos e anúncios compartilham o mesmo rubrico de normalização."""
    if code is None:
        check(scope, False, "nó de normalização não encontrado")
        return
    c = compact(code)

    # CPM (novo) — gasto/impressões*1000, com guarda
    must_contain(scope, code, "cpm:impressions>0?number((cost_brl/impressions*1000)",
                 "CPM = cost_brl/impressions*1000 com guarda impressions>0")
    if has_two_branches:
        check(scope, c.count("cost_brl/impressions*1000") >= 2,
              "CPM presente nos DOIS ramos (Google e Meta)")

    # CPC / CPA / ROAS — denominadores e guardas corretos
    must_contain(scope, code, "cpc:clicks>0?number((cost_brl/clicks)",
                 "CPC = cost_brl/clicks com guarda clicks>0")
    must_contain(scope, code, "cpa:conversions>0?number((cost_brl/conversions)",
                 "CPA = cost_brl/conversions (denominador = conversões) com guarda")
    must_contain(scope, code, "roas:cost_brl>0?number((revenue/cost_brl)",
                 "ROAS = revenue/cost_brl com guarda cost_brl>0")

    # CTR / CVR — denominador certo, GUARDA presente e SEM *100 (campo Notion = percent)
    must_contain(scope, code, "ctr:impressions>0?number((clicks/impressions)",
                 "CTR = clicks/impressions (denominador = impressões) com guarda")
    must_not_contain(scope, code, "clicks/impressions*100",
                     "CTR NÃO multiplica por 100 (campo Notion é percent → fração correta)")
    must_contain(scope, code, "conversion_rate:clicks>0?number((conversions/clicks)",
                 "CVR = conversions/clicks (denominador = cliques) com guarda")
    must_not_contain(scope, code, "conversions/clicks*100",
                     "CVR NÃO multiplica por 100 (campo Notion é percent → fração correta)")

    # Mapeamento do CPM no nó de update do Notion
    keys_compact = [compact(k) for k in update_keys]
    check(scope, any(k.startswith("cpm|") for k in keys_compact),
          "nó de update do Notion mapeia a propriedade CPM")

def verify_campanhas(scope, code):
    """WF1: só o nó Code Tendência Real (correção de CVR) é verificado aqui."""
    if code is None:
        check(scope, False, "nó 'Code Tendência Real' não encontrado")
        return
    c = compact(code)
    # CTR e Taxa de Conversão devem estar SEPARADOS, cada um com a fórmula certa.
    must_contain(scope, code, "if(tipo==='ctr')returnimpr>0?(clicks/impr)*100:null;",
                 "CTR isolado: impr>0 ? (clicks/impr)*100")
    must_contain(scope, code, "if(tipo==='taxadeconversão')returnclicks>0?(conv/clicks)*100:null;",
                 "Taxa de Conversão isolada: clicks>0 ? (conv/clicks)*100")
    # Regressão: não pode voltar a tratar CVR com a fórmula do CTR.
    must_not_contain(scope, code, "tipo==='ctr'||tipo==='taxadeconversão')returnimpr>0?(clicks/impr)",
                     "REGRESSÃO: CTR e Taxa de Conversão NÃO podem compartilhar clicks/impr")

# ----------------------------------------------------------------------------
# Checagem de formatos no Notion (opcional)
# ----------------------------------------------------------------------------
def verify_notion_formats():
    if not NOTION_API_KEY:
        print("\n[Notion] NOTION_API_KEY ausente — pulando checagem de formato dos campos.")
        return
    for db_name, cfg in NOTION_DBS.items():
        print("\n== Notion: %s ==" % db_name)
        try:
            url = "https://api.notion.com/v1/databases/%s" % cfg["id"]
            data = http_get_json(url, {
                "Authorization": "Bearer %s" % NOTION_API_KEY,
                "Notion-Version": "2022-06-28",
                "accept": "application/json",
            })
        except Exception as e:
            check("notion:%s" % db_name, False, "falha ao buscar base no Notion: %s" % e)
            continue
        props = data.get("properties", {})
        for field, expected_fmt in cfg["expect"].items():
            prop = props.get(field)
            if not prop or prop.get("type") != "number":
                check("notion:%s" % db_name, False,
                      "campo '%s' ausente ou não-numérico" % field)
                continue
            fmt = prop.get("number", {}).get("format")
            check("notion:%s" % db_name, fmt == expected_fmt,
                  "campo '%s' tem format='%s' (esperado '%s')" % (field, fmt, expected_fmt))

# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------
def main():
    print("=== Verificação das 3 cópias sw + campos Notion ===\n")

    # WF2 conjuntos
    print("== sw métricas conjuntos copy (%s) ==" % WF["conjuntos"])
    try:
        wf = fetch_workflow(WF["conjuntos"])
        verify_adlevel("conjuntos",
                       jscode(wf, "Code Normalizar Metricas Conjuntos"),
                       notion_prop_value_keys(wf, "Update database page Conjuntos"),
                       has_two_branches=True)
    except Exception as e:
        check("conjuntos", False, "erro ao buscar/validar workflow: %s" % e)

    # WF3 anúncios
    print("\n== sw métricas e diagnósticos anúncios copy (%s) ==" % WF["anuncios"])
    try:
        wf = fetch_workflow(WF["anuncios"])
        verify_adlevel("anuncios",
                       jscode(wf, "Code Normalizar Metricas Anuncios"),
                       notion_prop_value_keys(wf, "Update database page Anuncios"),
                       has_two_branches=False)
    except Exception as e:
        check("anuncios", False, "erro ao buscar/validar workflow: %s" % e)

    # WF1 campanhas (somente correção CVR; CPM é derivável e fica fora por design)
    print("\n== sw metricas campanhas copy (%s) ==" % WF["campanhas"])
    try:
        wf = fetch_workflow(WF["campanhas"])
        verify_campanhas("campanhas", jscode(wf, "Code Tendência Real"))
    except Exception as e:
        check("campanhas", False, "erro ao buscar/validar workflow: %s" % e)

    # Notion
    verify_notion_formats()

    # Sumário
    total = len(RESULTS)
    fails = [r for r in RESULTS if not r[1]]
    print("\n=== Resumo: %d checagens, %d PASS, %d FAIL ===" % (total, total - len(fails), len(fails)))
    if fails:
        print("FALHAS:")
        for scope, _, msg in fails:
            print("  - [%s] %s" % (scope, msg))
        sys.exit(1)
    print("Tudo OK.")
    sys.exit(0)

if __name__ == "__main__":
    main()
