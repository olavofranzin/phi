import csv, statistics, math
from datetime import date, timedelta
def brnum(s):
    s=(s or "").strip().strip('"')
    if s in ("","--"," --"): return 0.0
    s=s.replace(".","").replace(",",".")
    try: return float(s)
    except: return 0.0
def load(fname):
    rows=list(csv.reader(open(fname,encoding="utf-8"))); data={}; orc=None
    for r in rows[3:]:
        if len(r)<21 or not r[8].strip(): continue
        data[r[8].strip()]=dict(custo=brnum(r[13]),conv=brnum(r[14])); orc=brnum(r[4])
    return data,orc
def dparse(s): y,m,dd=s.split("-"); return date(int(y),int(m),int(dd))
def window(data,end,days):
    c=v=0.0
    for i in range(days):
        d=(end-timedelta(days=i)).isoformat()
        if d in data: c+=data[d]["custo"]; v+=data[d]["conv"]
    return c,v
def cpa_band(desvio):
    if desvio<=-0.15: return "EXCELLENT"
    if desvio<=0.10:  return "GOOD"
    if desvio<=0.50:  return "WARNING"
    return "CRITICAL"
def score_day(data,end,meta,orc):
    c7,v7=window(data,end,7)
    entrega=c7/(orc*7) if orc>0 else 0
    esperado=c7/meta if meta>0 else 0
    cobertura=v7/esperado if esperado>0 else 0
    if v7>=10:  # Regime A: julga pelo CPA (confiança graduada)
        cpa=c7/v7; desvio=(cpa-meta)/meta; eps=1/math.sqrt(v7)
        band=cpa_band(desvio)
        c7b,v7b=window(data,end-timedelta(days=7),7)
        piora=None
        if v7b>=1: 
            cpab=c7b/v7b; piora=(cpa-cpab)/cpab*100
            if piora>25 and band in("EXCELLENT","GOOD"): band="WARNING"
        # guarda do EXCELLENT (decisão #2): só com volume alto e sem piora
        if band=="EXCELLENT" and not (v7>=50 and (piora is None or piora<=0)): band="GOOD"
        return dict(regime="A",band=band,cpa=round(cpa,2),desvio=round(desvio,3),C7=round(v7,1),piora=(round(piora,1) if piora is not None else None))
    else:  # Regime B: volume insuficiente p/ CPA -> vale a entrega (subentrega = problema)
        band = "CRITICAL" if (entrega<0.5 or cobertura<0.6 or v7<5) else "WARNING"
        return dict(regime="B",band=band,C7=round(v7,1),entrega=round(entrega,2),cobertura=round(cobertura,2))
def run(fname,label,meta):
    data,orc=load(fname); dts=sorted(data); d0,d1=dparse(dts[0]),dparse(dts[-1])
    from collections import Counter
    cnt=Counter(); regs=Counter(); dd=d0+timedelta(days=14)
    while dd<=d1:
        s=score_day(data,dd,meta,orc); cnt[s["band"]]+=1; regs[s["regime"]]+=1; dd+=timedelta(days=1)
    tot=sum(cnt.values())
    print(f"\n{label} (meta {meta}):")
    for b in ["EXCELLENT","GOOD","WARNING","CRITICAL"]:
        n=cnt.get(b,0); print(f"   {b:9s}: {n:3d} ({100*n/tot:.0f}%)")
    print(f"   Regime A={regs['A']} B={regs['B']}")
    print(f"   >> ATUAL ({dts[-1]}): {score_day(data,d1,meta,orc)}")
run("barb_janago.csv","BARBEARIA",5.20)
run("salao_janago.csv","SALÃO",3.50)
