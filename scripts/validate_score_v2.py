import csv, statistics, math
from datetime import date, timedelta

def brnum(s):
    s=(s or "").strip().strip('"')
    if s in ("","--"," --"): return 0.0
    s=s.replace(".","").replace(",",".")
    try: return float(s)
    except: return 0.0

SOFT=["Engajamento","Ver rotas","Visualização de página","Visita à loja"]
def parse_results(s):
    out={}
    for part in (s or "").split(";"):
        if ":" in part:
            k,v=part.rsplit(":",1); out[k.strip()]=brnum(v)
    return out

def load(fname):
    rows=list(csv.reader(open(fname,encoding="utf-8")))
    data={}
    orc=None
    for r in rows[3:]:
        if len(r)<21 or not r[8].strip(): continue
        d=r[8].strip()
        comp=parse_results(r[19])
        soft=sum(comp.get(k,0) for k in SOFT)
        allc=brnum(r[20])
        data[d]=dict(custo=brnum(r[13]),conv=brnum(r[14]),soft=soft,allc=allc)
        orc=brnum(r[4])
    return data, orc

def dparse(s): 
    y,m,dd=s.split("-"); return date(int(y),int(m),int(dd))

def window(data, end, days):
    c=v=0.0
    for i in range(days):
        d=(end-timedelta(days=i)).isoformat()
        if d in data: c+=data[d]["custo"]; v+=data[d]["conv"]
    return c,v

def score_day(data, end, meta, orc):
    c7,v7 = window(data,end,7)
    if v7>=50:  # Regime A
        cpa=c7/v7
        desvio=(cpa-meta)/meta
        eps=1/math.sqrt(v7)
        # banda por desvio (ponto)
        if desvio<=-0.15: band="EXCELLENT"
        elif desvio<=0.10: band="GOOD"
        elif desvio<=0.50: band="WARNING"
        else: band="CRITICAL"
        # tendencia: 7d atual vs 7d anterior (nao sobreposto)
        c7b,v7b=window(data,end-timedelta(days=7),7)
        piora=None
        if v7b>=1 and v7>=1:
            cpab=c7b/v7b; piora=(cpa-cpab)/cpab*100
            if piora>25 and band in("EXCELLENT","GOOD"): band="WARNING"
        return dict(regime="A",band=band,cpa=cpa,desvio=desvio,eps=eps,C7=v7,piora=piora)
    else:  # Regime B (maduro)
        esperado=c7/meta if meta>0 else 0
        cobertura=v7/esperado if esperado>0 else 0
        entrega=c7/(orc*7) if orc>0 else 0
        if v7<10: band="CRITICAL"
        elif cobertura<0.6: band="CRITICAL"
        else: band="WARNING"
        return dict(regime="B",band=band,C7=v7,cobertura=cobertura,entrega=entrega,cpa=(c7/v7 if v7>0 else None))

def run(fname,label,meta):
    data,orc=load(fname)
    dts=sorted(data.keys())
    d0,d1=dparse(dts[0]),dparse(dts[-1])
    tot_c=sum(x["custo"] for x in data.values()); tot_v=sum(x["conv"] for x in data.values())
    zero=sum(1 for x in data.values() if x["conv"]==0)
    cpas=[x["custo"]/x["conv"] for x in data.values() if x["conv"]>0]
    print(f"\n{'='*72}\n{label} | meta CPA {meta:.2f} | orç {orc:.0f}/dia | {len(data)} dias ({dts[0]}..{dts[-1]})")
    print(f"  Conv total {tot_v:.1f} | custo total {tot_c:.2f} | dias zerados {zero}/{len(data)}")
    if cpas:
        q1,q3=statistics.quantiles(cpas,n=4)[0],statistics.quantiles(cpas,n=4)[2]
        print(f"  CPA diário: média {statistics.mean(cpas):.2f} mediana {statistics.median(cpas):.2f} IQR[{q1:.2f},{q3:.2f}]")
    # verdito por dia (a partir do 14o dia de calendario p/ ter janela anterior)
    from collections import Counter
    cnt=Counter(); regs=Counter()
    start=d0+timedelta(days=14)
    dd=start
    per_day=[]
    while dd<=d1:
        s=score_day(data,dd,meta,orc)
        cnt[s["band"]]+=1; regs[s["regime"]]+=1
        per_day.append((dd.isoformat(),s))
        dd+=timedelta(days=1)
    total=sum(cnt.values())
    print(f"  Distribuição de banda ao longo da história ({total} dias-calendário):")
    for b in ["EXCELLENT","GOOD","WARNING","CRITICAL"]:
        n=cnt.get(b,0); print(f"     {b:9s}: {n:3d} ({100*n/total:.0f}%)")
    print(f"  Regimes: A={regs['A']}  B={regs['B']}")
    # verdito ATUAL (ultimo dia)
    cur=score_day(data,d1,meta,orc)
    print(f"  >> VEREDITO ATUAL ({dts[-1]}): {cur['band']}  [Regime {cur['regime']}]")
    print(f"     {cur}")
    return data,orc

run("barb_janago.csv","BARBEARIA (21149189736)",5.20)
run("salao_janago.csv","SALÃO (21116045403)",3.50)
