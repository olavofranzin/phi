#!/usr/bin/env python3
"""
Protótipo do Motor de Scoring GBP (PHI / Comercial-Prospecção).
Especificação executável dos módulos 02_normalizer + 03_scoring_engine + 04_benchmark_engine.
NÃO é produção — é o artefato de calibração (v0) que o n8n Code node vai portar para JS.

Entrada: datasets do actor Apify "Google Maps Scraper" (compass/crawler-google-places).
Saída: por perfil — 6 dimensões, Score Técnico, Lead Opportunity Score e IPC.

Rodar:  python3 scripts/gbp_scoring_prototype.py <arquivo1.json> [<arquivo2.json> ...]
"""
import json, sys, re

SOCIAL = re.compile(r"instagram|facebook|linktr|linktree|wa\.me|api\.whatsapp|t\.me|tiktok|twitter|x\.com|youtu", re.I)

# ---------- 02_normalizer -------------------------------------------------
def classify_website(url):
    if not url: return "none"
    return "social" if SOCIAL.search(url) else "site"

def owner_response_rate(reviews):
    scr = [r for r in reviews]
    if not scr: return None
    resp = sum(1 for r in scr if r.get("responseFromOwnerText"))
    return resp / len(scr)

def normalize(p):
    reviews = p.get("reviews") or []
    ai = p.get("additionalInfo") or {}
    return {
        "name": p.get("title"),
        "placeId": p.get("placeId"),
        "rank": p.get("rank"),
        "category": p.get("categoryName"),
        "nCategories": len(p.get("categories") or []),
        # null->0 (edge case real: negócio sem review devolve null, não 0)
        "score": p.get("totalScore") or 0,
        "reviews": p.get("reviewsCount") or 0,
        "images": p.get("imagesCount") or 0,
        "hasHours": len(p.get("openingHours") or []) > 0,
        "nAttrGroups": len(ai),
        "hasPayments": "Pagamentos" in ai,
        # claimThisBusiness True == perfil NÃO reivindicado
        "claimed": not bool(p.get("claimThisBusiness")),
        "unclaimed": bool(p.get("claimThisBusiness")),
        "websiteType": classify_website(p.get("website")),
        "hasBooking": len(p.get("bookingLinks") or []) > 0,
        "nPosts": len(p.get("ownerUpdates") or []),
        "ownerResponseRate": owner_response_rate(reviews),
        "nReviewsTags": len(p.get("reviewsTags") or []),
        "closed": bool(p.get("permanentlyClosed")) or bool(p.get("temporarilyClosed")),
        # peers extras que o próprio JSON entrega (para engrossar o benchmark)
        "pas": [x for x in (p.get("peopleAlsoSearch") or []) if (x.get("reviewsCount") or 0) > 0],
    }

# ---------- 04_benchmark_engine ------------------------------------------
def pct(v, arr):
    """Percentil de v no segmento (fração de pares <= v). Robusto a outliers (ex.: o gigante de 711 reviews)."""
    if not arr: return 0.0
    return sum(1 for a in arr if a <= v) / len(arr)

def build_benchmark(norms):
    """Média + PREVALÊNCIA de features do segmento (pares do set + peopleAlsoSearch)."""
    revs, imgs, scs = [], [], []
    for n in norms:
        revs.append(n["reviews"]); imgs.append(n["images"])
        if n["score"] > 0: scs.append(n["score"])
        for x in n["pas"]:
            revs.append(x.get("reviewsCount") or 0)
            if (x.get("totalScore") or 0) > 0: scs.append(x["totalScore"])
    avg = lambda a: (sum(a)/len(a)) if a else 0
    frac = lambda cond: (sum(1 for n in norms if cond(n))/len(norms)) if norms else 0
    attrs = sorted(n["nAttrGroups"] for n in norms)
    return {
        "avgReviews": avg(revs), "avgImages": avg(imgs), "avgScore": avg(scs),
        "revsList": revs, "imgsList": imgs,
        # PREVALÊNCIA no segmento (v1): só é gap o que os pares de fato têm
        "prevSite": frac(lambda n: n["websiteType"]=="site"),
        "prevBooking": frac(lambda n: n["hasBooking"]),
        "prevPosts": frac(lambda n: n["nPosts"]>0),
        "prevSecondary": frac(lambda n: n["nCategories"]>=2),
        "attrRef": max(attrs[len(attrs)*3//4] if attrs else 4, 4),  # p75 de grupos de atributo
        "maxPosts": max([n["nPosts"] for n in norms] + [8]),
    }

# ---------- 03_scoring_engine --------------------------------------------
clamp = lambda x, lo=0, hi=100: max(lo, min(hi, x))
def vol_conf(reviews, k=25):     # guarda de volume: confiança na nota cresce com volume
    return min(reviews / k, 1.0)

def dimensions(n, bm):
    # Saúde do Perfil (completude técnica)
    saude = (20*n["hasHours"] + 20*n["claimed"] + 20*min(n["nAttrGroups"]/6,1)
             + 10 + 10*(n["websiteType"]!="none") + 10 + 10*(not n["closed"]))
    # SEO Local (categoria + secundárias + atributos + site próprio)
    seo = (25 + 25*min((n["nCategories"]-1)/2,1) + 30*min(n["nAttrGroups"]/6,1)
           + 20*(n["websiteType"]=="site"))
    # Autoridade (nota ponderada por volume + posição vs benchmark)
    rel = (n["reviews"]/bm["avgReviews"]) if bm["avgReviews"] else 0
    autoridade = 100*(0.6*(n["score"]/5)*vol_conf(n["reviews"]) + 0.4*min(rel,1))
    # Conversão (agendamento, site, telefone, pagamentos, horário)
    conv = (30*n["hasBooking"] + 25*(n["websiteType"]=="site") + 15 + 15*n["hasPayments"] + 15*n["hasHours"])
    # Engajamento (resposta ao cliente + posts)
    orr = n["ownerResponseRate"]
    engaj = 100*(0.7*(orr if orr is not None else 0) + 0.3*min(n["nPosts"]/8,1))
    # Conteúdo (fotos vs benchmark + posts)
    relimg = (n["images"]/bm["avgImages"]) if bm["avgImages"] else 0
    conteudo = 100*(0.7*min(relimg,1) + 0.3*min(n["nPosts"]/8,1))
    return {k: round(clamp(v)) for k,v in dict(
        saude=saude, seo=seo, autoridade=autoridade, conversao=conv,
        engajamento=engaj, conteudo=conteudo).items()}

WEIGHTS = dict(saude=.15, seo=.20, autoridade=.20, conversao=.15, engajamento=.15, conteudo=.15)
def technical(dims):
    return round(sum(dims[k]*w for k,w in WEIGHTS.items()))

def lead_opportunity(n, bm):
    """Camada 1 — pontos de OPORTUNIDADE (mais gap = lead melhor). Pesos do Olavo."""
    g = {}
    g["avaliacoes"]   = 25 * (1 - min(n["reviews"]/max(bm["avgReviews"],1),1))
    g["dif_concorr"]  = 20 * (1 - min((0.5*n["reviews"]/max(bm["avgReviews"],1)
                                       + 0.5*n["images"]/max(bm["avgImages"],1)),1))
    g["fotos"]        = 15 * (1 - min(n["images"]/max(bm["avgImages"],1),1))
    g["cat_principal"]= 10 if not n["category"] else 0
    g["cat_secund"]   = 10 if n["nCategories"] < 2 else 0
    g["site"]         = 5 if n["websiteType"]!="site" else 0
    g["horario"]      = 5 if not n["hasHours"] else 0
    g["atributos"]    = 5 * (1 - min(n["nAttrGroups"]/6,1))
    # nota: com guarda de volume — poucas reviews => gap da nota é neutro (não confiável)
    g["nota"]         = (5*(1 - n["score"]/5)) if n["reviews"]>=5 else 2.5
    return round(sum(g.values())), {k:round(v,1) for k,v in g.items()}

def viability(n):
    v = 0.4 + 0.3*n["hasHours"] + 0.2*(n["reviews"]>0) + 0.1*(n["category"] is not None)
    if n["closed"]: v = 0.1
    return round(v,2)

def ipc(n, bm, tech):
    """v0 — IPC = gap_endereçável × viabilidade (média absoluta)."""
    gap = 0
    gap += 22*(1-min(n["reviews"]/max(bm["avgReviews"],1),1))
    gap += 16*(1-min(n["images"]/max(bm["avgImages"],1),1))
    gap += 12*(1-min(n["nAttrGroups"]/6,1))
    gap += 8 *(n["nCategories"]<2)
    gap += 6 *(not n["hasHours"])
    gap += 12*n["unclaimed"]
    gap += 14*(n["websiteType"]!="site")
    gap += 10*((n["ownerResponseRate"] or 0) < 0.5)
    return round(clamp(gap) * viability(n))

# ---------- v1: percentil + prevalência (gap = só o que os pares têm) ------
def ipc_v1(n, bm):
    pr, pi = pct(n["reviews"], bm["revsList"]), pct(n["images"], bm["imgsList"])
    gap = 0
    gap += 22*(1-pr)                                            # SVC-GBP: reviews (percentil)
    gap += 16*(1-pi)                                            # SVC-GBP: fotos (percentil)
    gap += 12*(1-min(n["nAttrGroups"]/bm["attrRef"],1))         # SEO: atributos vs p75 do segmento
    gap += 8 *bm["prevSecondary"]*(n["nCategories"]<2)          # só se secundárias forem comuns no ramo
    gap += 6 *(not n["hasHours"])
    gap += 12*n["unclaimed"]
    gap += 14*bm["prevSite"]*(n["websiteType"]!="site")         # SVC-SITE: gap ∝ prevalência de site no ramo
    gap += 6 *bm["prevBooking"]*(not n["hasBooking"])           # só penaliza booking se o ramo usa
    return round(clamp(gap) * viability(n))

def lead_opportunity_v1(n, bm):
    pr, pi = pct(n["reviews"], bm["revsList"]), pct(n["images"], bm["imgsList"])
    g = (25*(1-pr) + 20*(1-0.5*pr-0.5*pi) + 15*(1-pi)
         + 10*bm["prevSecondary"]*(n["nCategories"]<2)
         + 5*bm["prevSite"]*(n["websiteType"]!="site")
         + 5*(not n["hasHours"]) + 5*(1-min(n["nAttrGroups"]/bm["attrRef"],1))
         + (5*(1-n["score"]/5) if n["reviews"]>=5 else 2.5))
    return round(g)

# ---------- roteamento de OFERTA (ponto Olavo 2026-07-10) ------------------
# Duas forças opostas: FUNDAÇÃO (SVC-GBP/SITE) alta em perfil fraco;
# AMPLIFICAÇÃO (SVC-ADS) alta em perfil FORTE + site próprio. Sequência lógica: SITE -> GBP -> ADS.
def weak_gbp(n, bm, dims):
    return (dims["autoridade"] < 40 or dims["conteudo"] < 30 or n["unclaimed"]
            or n["nAttrGroups"] < bm["attrRef"]*0.6)

def ads_readiness(n, dims):
    """SVC-ADS só faz sentido com site próprio + GBP sólido + negócio viável (fundação pronta p/ escalar)."""
    if n["websiteType"] != "site" or n["unclaimed"]: return 0
    base = 0.55*dims["autoridade"] + 0.35*dims["conteudo"] + 10
    return round(clamp(base) * viability(n))

def recommend_offer(n, bm, dims):
    offers = []
    if n["websiteType"] != "site": offers.append("SVC-SITE")     # sem site próprio: base primeiro
    if weak_gbp(n, bm, dims):      offers.append("SVC-GBP")      # GBP fraco: consertar fundação
    if n["websiteType"] == "site" and not weak_gbp(n, bm, dims):
        offers.append("SVC-ADS")                                 # forte + site: amplificar
    return offers or ["SVC-GBP"]

def commercial_potential(n, bm, dims):
    """Potencial = melhor oferta disponível. Inclui ADS p/ perfil forte (não descarta)."""
    return max(ipc_v1(n, bm), ads_readiness(n, dims))

# ---------- runner --------------------------------------------------------
def load(files):
    seen, norms = set(), []
    for f in files:
        data = json.load(open(f))
        for p in data:
            if "placeId" not in p: continue          # pula saídas de comparação (LLM do actor)
            if p["placeId"] in seen: continue
            seen.add(p["placeId"]); norms.append(normalize(p))
    return norms

def main(files):
    norms = load(files)
    bm = build_benchmark(norms)
    print(f"Benchmark (n={len(norms)}): avgReviews={bm['avgReviews']:.0f} avgImages={bm['avgImages']:.0f} "
          f"avgScore={bm['avgScore']:.2f}")
    print(f"Prevalência: site={bm['prevSite']:.0%} booking={bm['prevBooking']:.0%} "
          f"posts={bm['prevPosts']:.0%} 2+cats={bm['prevSecondary']:.0%} attrRef(p75)={bm['attrRef']}\n")
    rows = []
    for n in norms:
        dims = dimensions(n, bm); tech = technical(dims)
        found = ipc_v1(n, bm); ads = ads_readiness(n, dims)
        pot = commercial_potential(n, bm, dims); offers = recommend_offer(n, bm, dims)
        rows.append((n, tech, found, ads, pot, offers))
    rows.sort(key=lambda r: r[4], reverse=True)      # ordena por POTENCIAL comercial
    print(f"{'#':>2} {'Perfil':32} {'Téc':>3} {'Fund':>4} {'ADS':>3} {'POT':>3}  {'Oferta':16} flags")
    for i,(n,tech,found,ads,pot,offers) in enumerate(rows,1):
        fl = []
        if n["unclaimed"]: fl.append("não-reivind.")
        if n["websiteType"]=="social": fl.append("site=rede")
        elif n["websiteType"]=="none": fl.append("sem-site")
        if n["reviews"]<5: fl.append(f"vol({n['reviews']})")
        print(f"{i:>2} {n['name'][:32]:32} {tech:>3} {found:>4} {ads:>3} {pot:>3}  "
              f"{'+'.join(offers):16} {', '.join(fl)}")

if __name__ == "__main__":
    main(sys.argv[1:] or [])
