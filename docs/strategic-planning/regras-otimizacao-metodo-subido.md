# Regras de Otimização — Método Subido (destilado para os agentes T28)

> **[GOVERNANÇA — substrato de Otimização, 2026-07-31]** Este doc **destila em regras
> acionáveis** os dois manuais do "Método Subido" e as **mapeia para os agentes do T28**.
> Não substitui os manuais — é a ponte entre "método" e "build".
>
> **FONTES (canônicas, `docs/conhecimento/`):**
> - `Manual de Otimização_ Estratégias de Alta Performance para E-commerce e Infoprodutos.md`
>   — manifesto + bússola + funil + benchmarks + protocolo de decisão. *(citado abaixo como **[Manual]**)*
> - `Plano de Intervenção Estratégica_ Reestruturação e Otimização de Campanhas de Tráfego.md`
>   — as 19 métricas operacionais + hierarquia de alterações + matriz de objetivos. *(**[Plano]**)*
>
> **DISCIPLINA:** os agentes **citam** estas regras/benchmarks entre colchetes (`[BM-*]`,
> `[Ordem Sagrada]`, `[Janela]`), como manda o BLOCO COMUM. Benchmark é **referência**, não
> veredito — vence o número real do negócio (regra do "So What", §3).
>
> **TRADUÇÃO DE CANAL:** os manuais são **Meta Ads / e-commerce / infoproduto**-cêntricos.
> A operação hoje é **Google Ads / lead-gen local**. A §9 marca o que é **universal
> (aplica já)** vs **canal-específico (espera a vertical)**. Não aplicar regra de checkout
> a uma campanha de salão local.

---

## 1. O enquadramento: "da porta para dentro" vs "da porta para fora"

- **Da porta para dentro** [Manual §1, Plano §1]: manobras internas no gerenciador (lances,
  criativos, públicos, estrutura) — o foco dos agentes de performance.
- **Da porta para fora**: oferta, produto, preço, negócio — decisão humana/estratégica.
- **Otimizar = intervir em janelas pré-determinadas buscando melhora**, lendo o que os dados
  dizem. "Se você não itera com dado, não faz gestão — aposta." [Plano §1]

---

## 2. Métrica-mãe (Bússola) por objetivo — [Manual §2, Plano §2]

O objetivo escolhido é a **ordem que se dá ao algoritmo**; a Bússola é o norte.

| Objetivo de campanha | Métrica-mãe (Bússola) |
|---|---|
| **Vendas** | ROAS / CPA |
| **Cadastro / Leads** | CPA (Custo por Lead/Aquisição) |
| **Tráfego** | CPC (ou Visualização da Página de Destino) |
| **Engajamento** | CPE / CPMen (mensagem) / CPV |
| **Reconhecimento** | CPM (+ alcance / incrementalidade) |
| **Visualização de Vídeo** | CPV |
| **Promoção de App** | CPIa (Custo por Instalação) |

> **Dica sênior** [Manual §2]: otimizar para "Clique no Link" sem pixel traz tráfego ruim;
> prefira "Visualização da Página" (garante que o usuário abriu o site). Liga direto na
> **regra 9 do Guardião** (integridade de medição, ADR-29).

---

## 3. Bússola vs Alavancas + o "So What?" — [Plano §2]

- **Bússola (métrica principal)** decide se a campanha **vive ou morre**.
- **Alavancas (métricas secundárias)** só servem para **diagnosticar qual parafuso apertar**
  (onde o cano vaza). Nunca são conclusão. *(= guardrail 4: métrica de vaidade não paga conta.)*
- **"So What? / E daí?"**: um lead de R$3 não vale nada se a **margem** não sustenta o CAC.
  **O número real do negócio (ticket × conversão comercial × margem) vence o número da
  plataforma.** → É a lente do **Julgamento Multiobjetivo** e a razão de existir do Guardião.

---

## 4. Janelas de Otimização (QUANDO agir) — [Manual §8, Plano §4]

Não intervir por ansiedade. Respeitar o tempo de maturação do algoritmo.

| Cadência | Quando |
|---|---|
| **Diária** | **Só monitoramento de saúde** (detectar anomalia/falha técnica). **Não intervir.** |
| **2/2 ou 3/3 dias** | Lançamentos / campanhas de tiro curto (até ~30 dias) |
| **4/4 dias** | Campanhas de duração média (~60 dias) |
| **7/7 dias** | Campanhas perenes / longas |

- **Exceções (intervir na hora):** resultados catastróficos — *"filha caindo do penhasco"* —
  ou pressão estratégica real — *"Pressão do Mário"*.
- **Ligação com o PHI:** a análise diária **detecta**; a **intervenção** respeita a janela.
  Casa com a fase **"Esperar"** do O.D.A.E. e com a **triagem do Maestro** (ruído vs sinal).

---

## 5. A Ordem Sagrada das Alterações (O QUE mexer, e em que ordem) — [Manual §8, Plano §4]

Seguir **rigorosamente** esta ordem para **não destruir o aprendizado do algoritmo**:

1. **Lances (Bidding)** — a alavanca mais rápida (↑lance = +gasto/+alcance/+caro; ↓ = o oposto).
2. **Criativos** — pausar o ruim, subir novos testes com base nos ganchos vencedores.
3. **Públicos / Segmentações** — expandir, refinar ou testar novas.
4. **Estrutura de Campanhas** — reorganizar arquitetura (CBO/ABO etc.).
5. **Destino** — LP / checkout / fluxo / WhatsApp ("da porta para fora").

> Regra dura para o **Agente 5 (Hipóteses & Priorização)**: o backlog de experimentos é
> **priorizado por ICE/RICE, mas ordenado/tagueado por esta hierarquia** — não propor mudança
> de estrutura antes de esgotar lance/criativo, salvo justificativa explícita.

---

## 6. Cadeia de diagnóstico do funil (ONDE o cano vaza) — [Manual §3-5, Plano §3]

Ler o vetor completo, de cima para baixo; cada elo tem sintoma → alavanca:

| Elo | Mede | Sintoma → ação |
|---|---|---|
| **CPM** | competitividade do leilão | alto → criativo fraco ou público restrito; melhorar relevância/ampliar |
| **Hook Rate** (3s, vídeo) | retenção da abertura | baixo → trocar o gancho imediatamente |
| **CTR** | atratividade/relevância | baixo → o algoritmo encarece o leilão; novos hooks/headlines |
| **CPC** | pedágio até o destino | caro → elevar CTR; oferta do anúncio não "fisga" |
| **Connect Rate** | clique vs LP carregada | perda técnica → velocidade/mobile/**API de Conversão** |
| **"Curioso"** (CPC baixo × conversão zero) | clareza/congruência | clickbait/ambiguidade → CTA explícita, promessa = 1ª dobra do destino |
| **ViewContent → Carrinho → Checkout → Abandono** | jornada e-commerce | fricção/frete/confiança → checkout 1-etapa, selos, WhatsApp |
| **CPA** | eficiência final | acima da margem → operação inviável; desenhar funil e achar o gargalo |
| **ROAS** | saúde financeira | concentrar verba no rentável; subir ticket; reduzir CPA |
| **LTV** | valor no tempo | retenção/recompra; define quanto se pode pagar por cliente |

> O **"Curioso"** (CPC baixo, muitos cliques, conversão zero) é **exatamente o padrão da
> Salão/CLI-4** — e o motivo de o Guardião checar a composição da conversão (ADR-29).

---

## 7. Benchmarks "Battlefield" (referência, não veredito) — [Manual §6]

| Métrica | Referência de mercado |
|---|---|
| CPC | R$0,50 a R$3,00 |
| ROAS | 3 a 5 (mínimo para saúde) |
| CPM | R$5,00 a R$15,00 |
| CTR | 0,5% a 2% (**Search: 5% a 10%**) |
| Taxa de Landing Page | Ideal 70% \| Em escala 30% a 50% |
| Conversão E-commerce | ~1% das visitas |
| Custo por Lead | R$3,00 a R$12,00 (varia por nicho) |

> Ressalva do próprio método [Plano §2]: benchmark é só referência — **o gestor prioriza os
> próprios números** (o "So What", §3).

---

## 8. Medição e qualidade de lead — [Manual §4/§7, Plano §3]

- **API de Conversão** para não depender só do pixel; corrigir Connect Rate (site rápido/mobile).
- **Qualidade > volume**: não focar só no CPL. Usar **UTM + Lead Scoring** para separar o
  "lead comprador" do "baixador de PDF". **Criar evento de conversão só para o lead
  qualificado** (treina o algoritmo no alvo certo).
- Isto **valida o Guardião (ADR-29)**: conversão configurada errada (soft como primária) é a
  falha da Salão; a regra do método é justamente configurar a medição no lead que importa.

---

## 9. Universal vs canal-específico (o filtro de tradução)

| Aplica **já** (universal) | Espera a vertical (canal-específico) |
|---|---|
| Métrica-mãe por objetivo (§2) | Hook Rate — vídeo/Meta (§6) |
| Bússola vs Alavancas + "So What" (§3) | Carrinho / Checkout / AOV — e-commerce (§6) |
| Janelas de Otimização (§4) | Comparecimento a Webinar — infoproduto |
| Ordem Sagrada das Alterações (§5) | Custo por Seguidor/Inscrito — social |
| Cadeia de diagnóstico até CPA/ROAS/LTV (§6) | |
| Benchmarks (§7) — com ajuste de canal (Search vs Feed) | |
| Medição/qualidade de lead (§8) | |

> Operação atual = **Google Ads / lead-gen local**. As regras universais entram no substrato
> agora; as de canal ficam catalogadas para quando E-commerce/Meta/Infoproduto entrarem.

---

## 10. Mapa regra → agente / artefato

| Regra | Agente / artefato do T28 |
|---|---|
| Métrica-mãe por objetivo (§2) | `contexto.metrica_mae` no payload · **Guardião (ADR-29)** · Diagnóstico (3) |
| Bússola vs Alavancas (§3) | **Todos** (guardrail 4, BLOCO COMUM) |
| "So What?" / número real (§3) | **Julgamento Multiobjetivo (4)** · Guardião |
| Janelas de Otimização (§4) | **Maestro** (triagem) · fase "Esperar" do O.D.A.E. |
| Ordem Sagrada (§5) | **Hipóteses & Priorização (5)** · Estrategista · Construtor |
| Cadeia de diagnóstico (§6) | **Leitura & Anomalia (1)** · Atribuição (2) · Diagnóstico (3) |
| Benchmarks (§7) | Substrato `[BM-*]` (Leitura & Anomalia cita) |
| Medição/qualidade de lead (§8) | **Guardião (ADR-29)** · Interpretação de Leads (Comercial) |

---

## Conexões

- **ADR-29** (Guardião da Métrica-Mãe): §2, §3, §8 são a base conceitual do portão.
- **Guardrails 8/9** (cpa:0, source_status): §8 (medição) e §3 (não confiar na plataforma).
- **Módulo 28 / roster**: este doc é o substrato de regras que os 7 prompts citam.
- **Refino futuro (ADR-30)**: as regras §4 (Janelas) e §5 (Ordem Sagrada) viram cláusula dura
  no Maestro e no Agente 5 — **passo separado**, não neste doc.
