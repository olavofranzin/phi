#!/usr/bin/env bash
# =============================================================================
# HubSpot C1 setup (Camada Comercial / PHI) — cria via API REST:
#   - grupo de propriedades "IA / Enriquecimento" em Deals e em Meetings
#   - migra 2 campos existentes de single-line -> multi-line (+ move p/ grupo)
#   - 6 propriedades novas em Deal + 1 em Meeting
#   - 2 produtos do catalogo (SVC-IA, SVC-GBP)
#
# POR QUE CLI LOCAL: o ambiente do agente Claude nao alcanca api.hubapi.com
# (egress bloqueado). Rode este script NA SUA MAQUINA, que tem acesso.
#
# PRE-REQUISITOS
#   1) HubSpot > Settings > Integrations > Private Apps > Create.
#      Scopes necessarios:
#        crm.schemas.deals.read      crm.schemas.deals.write
#        crm.objects.deals.read
#        crm.schemas.custom.read     crm.schemas.custom.write   (propriedade de Meeting)
#        e-commerce                                             (criar produtos)
#      (Se algum POST retornar 403 citando um scope, adicione-o e rode de novo.)
#   2) Copie o "Access token" (pat-...) e exporte no seu shell:
#        export HUBSPOT_TOKEN='pat-na1-xxxxxxxx'
#      O token NUNCA entra neste arquivo nem no git.
#   3) Ferramentas: bash, curl. (python3 opcional — so p/ o read-back bonito.)
#
# USO
#   export HUBSPOT_TOKEN='pat-...'
#   bash scripts/hubspot-c1-setup.sh
#
# SEGURO PARA RE-RODAR (idempotente): 409 "ja existe" e tratado como OK;
# produtos sao checados por SKU antes de criar (nao duplica).
#
# APOS RODAR: revogue/rotacione o token no HubSpot se preferir (higiene).
# =============================================================================
set -uo pipefail

: "${HUBSPOT_TOKEN:?ERRO: defina HUBSPOT_TOKEN='pat-...' antes de rodar}"
API="https://api.hubapi.com"
AUTH="Authorization: Bearer ${HUBSPOT_TOKEN}"
CT="Content-Type: application/json"
TMP="$(mktemp)"; trap 'rm -f "$TMP"' EXIT
FAIL=0

req(){ # metodo path [json]
  local m="$1" p="$2" d="${3:-}"
  if [ -n "$d" ]; then
    curl -sS -o "$TMP" -w '%{http_code}' -X "$m" -H "$AUTH" -H "$CT" -d "$d" "$API$p"
  else
    curl -sS -o "$TMP" -w '%{http_code}' -X "$m" -H "$AUTH" "$API$p"
  fi
}
okcode(){ case "$1" in 2*) return 0;; 409) return 0;; *) return 1;; esac; }
line(){ printf '  %-34s -> %s\n' "$1" "$2"; }
body(){ head -c 500 "$TMP"; echo; }

step(){ # rotulo metodo path json  (para POST/PATCH que criam/alteram)
  local rot="$1" m="$2" p="$3" d="${4:-}"
  local c; c="$(req "$m" "$p" "$d")"
  line "$rot" "$c"
  if ! okcode "$c"; then echo "     ! resposta:"; body; FAIL=1; fi
}

echo "== 0. validar token/conexao =="
c="$(req GET "/crm/v3/properties/deals/followup")"; line "auth check (GET followup)" "$c"
if [ "$c" != "200" ]; then echo "   ! FALHA de auth/conexao:"; body; echo "Abortando."; exit 1; fi

echo "== 1. grupo 'IA / Enriquecimento' (Deals) =="
step "group deals" POST "/crm/v3/properties/deals/groups" \
  '{"name":"ia_enriquecimento","label":"IA / Enriquecimento","displayOrder":-1}'

echo "== 2. migrar 2 campos p/ multi-line + mover p/ grupo (Deals) =="
step "migrate dados_enriquecimento" PATCH "/crm/v3/properties/deals/dados_enriquecimento" \
  '{"fieldType":"textarea","groupName":"ia_enriquecimento"}'
step "migrate proxima_acao_recomendada" PATCH "/crm/v3/properties/deals/proxima_acao_recomendada" \
  '{"fieldType":"textarea","groupName":"ia_enriquecimento"}'
step "move followup -> grupo" PATCH "/crm/v3/properties/deals/followup" \
  '{"groupName":"ia_enriquecimento"}'

echo "== 3. 6 propriedades novas (Deals) =="
step "deal.proxima_acao_aceite" POST "/crm/v3/properties/deals" \
  '{"name":"proxima_acao_aceite","label":"NBA - Aceite","type":"enumeration","fieldType":"select","groupName":"ia_enriquecimento","options":[{"label":"Pendente","value":"pendente","displayOrder":0},{"label":"Aceita","value":"aceita","displayOrder":1},{"label":"Rejeitada","value":"rejeitada","displayOrder":2}]}'
step "deal.proxima_acao_aceite_data" POST "/crm/v3/properties/deals" \
  '{"name":"proxima_acao_aceite_data","label":"NBA - Data do aceite","type":"datetime","fieldType":"date","groupName":"ia_enriquecimento"}'
step "deal.abordagem_sugerida_ia" POST "/crm/v3/properties/deals" \
  '{"name":"abordagem_sugerida_ia","label":"Abordagem sugerida (IA)","type":"string","fieldType":"textarea","groupName":"ia_enriquecimento"}'
step "deal.analise_gbp_ia" POST "/crm/v3/properties/deals" \
  '{"name":"analise_gbp_ia","label":"Analise GBP (IA)","type":"string","fieldType":"textarea","groupName":"ia_enriquecimento"}'
step "deal.analise_site_ia" POST "/crm/v3/properties/deals" \
  '{"name":"analise_site_ia","label":"Analise site (IA)","type":"string","fieldType":"textarea","groupName":"ia_enriquecimento"}'
step "deal.analise_instagram_ia" POST "/crm/v3/properties/deals" \
  '{"name":"analise_instagram_ia","label":"Analise Instagram (IA)","type":"string","fieldType":"textarea","groupName":"ia_enriquecimento"}'

echo "== 4. propriedade em Meetings =="
step "group meetings" POST "/crm/v3/properties/meetings/groups" \
  '{"name":"ia_enriquecimento","label":"IA / Enriquecimento"}'
step "meeting.transcricao_ia" POST "/crm/v3/properties/meetings" \
  '{"name":"transcricao_ia","label":"Transcricao (IA)","type":"string","fieldType":"textarea","groupName":"ia_enriquecimento"}'

echo "== 5. produtos (checa SKU antes; nao duplica) =="
create_product(){ # sku nome desc
  local sku="$1" nome="$2" desc="$3"
  local c total
  c="$(req POST "/crm/v3/objects/products/search" "{\"filterGroups\":[{\"filters\":[{\"propertyName\":\"hs_sku\",\"operator\":\"EQ\",\"value\":\"$sku\"}]}],\"properties\":[\"hs_sku\"],\"limit\":1}")"
  if okcode "$c"; then
    total="$(grep -o '"total"[: ]*[0-9]*' "$TMP" | grep -o '[0-9]*' | head -1)"
    if [ "${total:-0}" != "0" ]; then line "produto SKU $sku" "ja existe (skip)"; return; fi
  fi
  step "produto $nome (SKU $sku)" POST "/crm/v3/objects/products" \
    "{\"properties\":{\"name\":\"$nome\",\"hs_sku\":\"$sku\",\"description\":\"$desc\"}}"
}
create_product 1004 "Agentes de IA e automacao" "SVC-IA (catalogo PHI v1 2026-07-05)"
create_product 1005 "Configuracao e gestao do GBP" "SVC-GBP (catalogo PHI v1 2026-07-05)"

echo "== 6. READ-BACK =="
if command -v python3 >/dev/null 2>&1; then
  curl -sS -H "$AUTH" "$API/crm/v3/properties/deals" > "$TMP"
  echo "-- Deals no grupo ia_enriquecimento --"
  python3 -c "import json;d=json.load(open('$TMP'));[print('  ',p['name'],'|',p.get('type'),p.get('fieldType')) for p in d['results'] if p.get('groupName')=='ia_enriquecimento']"
  echo "-- Meeting.transcricao_ia --"
  curl -sS -H "$AUTH" "$API/crm/v3/properties/meetings/transcricao_ia" > "$TMP"
  python3 -c "import json;p=json.load(open('$TMP'));print('  ',p.get('name'),'|',p.get('fieldType'))" 2>/dev/null || echo "  (nao encontrada)"
  echo "-- Produtos 1004/1005 --"
  curl -sS -H "$AUTH" "$API/crm/v3/objects/products?properties=name,hs_sku&limit=100" > "$TMP"
  python3 -c "import json;d=json.load(open('$TMP'));[print('  ',o['properties'].get('hs_sku'),o['properties'].get('name'),'id='+o['id']) for o in d['results'] if o['properties'].get('hs_sku') in ('1004','1005')]"
else
  echo "  (python3 ausente — pule o read-back bonito; os codigos HTTP acima ja confirmam)"
fi

echo
if [ "$FAIL" = "0" ]; then
  echo "OK — C1 concluido. Confira no HubSpot: Settings > Properties (grupo 'IA / Enriquecimento') e Produtos."
else
  echo "ATENCAO — houve pelo menos 1 falha acima (procure '!'). Corrija (scope? nome ja existe?) e rode de novo (e idempotente)."
fi
