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
def build_benchmark(norms):
    """Média dos concorrentes = pares do mesmo set + entradas de peopleAlsoSearch com reviews>0."""
    revs, imgs, scs = [], [], []
    for n in norms:
        revs.append(n["reviews"]); imgs.append(n["images"])
        if n["score"] > 0: scs.append(n["score"])
        for x in n["pas"]:
            revs.append(x.get("reviewsCount") or 0)
            if (x.get("totalScore") or 0) > 0: scs.append(x["totalScore"])
    avg = lambda a: (sum(a)/len(a)) if a else 0
    return {"avgReviews": avg(revs), "avgImages": avg(imgs), "avgScore": avg(scs)}

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
    """IPC = gap_endereçável × viabilidade. NÃO é 100 - técnico."""
    gap = 0
    gap += 22*(1-min(n["reviews"]/max(bm["avgReviews"],1),1))    # SVC-GBP: reviews
    gap += 16*(1-min(n["images"]/max(bm["avgImages"],1),1))      # SVC-GBP: fotos
    gap += 12*(1-min(n["nAttrGroups"]/6,1))                      # SVC-GBP: atributos/SEO
    gap += 8 *(n["nCategories"]<2)                               # SVC-GBP: categorias
    gap += 6 *(not n["hasHours"])                                # SVC-GBP: horário
    gap += 12*n["unclaimed"]                                     # SVC-GBP: perfil não reivindicado
    gap += 14*(n["websiteType"]!="site")                         # SVC-SITE: sem site próprio
    gap += 10*((n["ownerResponseRate"] or 0) < 0.5)             # reputação: baixa resposta
    return round(clamp(gap) * viability(n))

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
    print(f"Benchmark (n={len(norms)}): avgReviews={bm['avgReviews']:.0f} "
          f"avgImages={bm['avgImages']:.0f} avgScore={bm['avgScore']:.2f}\n")
    rows = []
    for n in norms:
        dims = dimensions(n, bm); tech = technical(dims)
        lead, gaps = lead_opportunity(n, bm); i = ipc(n, bm, tech)
        rows.append((n, dims, tech, lead, i))
    rows.sort(key=lambda r: r[4], reverse=True)      # ordena por IPC (prioridade comercial)
    for n, dims, tech, lead, i in rows:
        flags = []
        if n["unclaimed"]: flags.append("NÃO-REIVINDICADO")
        if n["websiteType"]=="social": flags.append("site=rede-social→SVC-SITE")
        if n["reviews"]<5: flags.append(f"volume-fraco(n={n['reviews']})")
        print(f"■ {n['name'][:48]}")
        print(f"   score={n['score']} reviews={n['reviews']} imgs={n['images']} "
              f"cats={n['nCategories']} attr={n['nAttrGroups']} posts={n['nPosts']} "
              f"orr={n['ownerResponseRate']}")
        print(f"   dims={dims}")
        print(f"   >> TÉCNICO={tech}  leadOpp={lead}  IPC={i}   {' | '.join(flags)}")
        print()

if __name__ == "__main__":
    main(sys.argv[1:] or [])
