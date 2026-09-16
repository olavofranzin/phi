# Regras de Planejamento de Campanhas (destilado para os agentes de Planejamento)

> **[GOVERNANÇA — substrato de Planejamento, 2026-07-31]** Destila em regras acionáveis a
> pesquisa **"Planejamento de Mídia Paga para PME, Brasil 2023–2026"** e as mapeia para os
> agentes do PHI. É a **camada 3 (doutrina)** do ADR-31 para a frente Planejamento — paralela
> ao `regras-otimizacao-metodo-subido.md` da frente Otimização.
>
> **FONTE (canônica, git):** `planejamento-midia-paga-pme-brasil-2023-2026.md` *(citado como
> **[D1]** com §seção)*. O curso `docs/conhecimento/IA Cognitiva Planejamento.md` **[D2]** já
> foi absorvido no roster (§4/§5) e no Client Knowledge Pack — aqui só se referencia, não se
> recopia.
>
> **FRONTEIRA COM OTIMIZAÇÃO:** **Planejamento constrói o portfólio** (que campanhas criar,
> como dividir verba, que estrutura). **Otimização ajusta o que já está no ar** (Método
> Subido). Não confundir as duas cadências.
>
> **DISCIPLINA DE VALIDADE (ADR-31):** o **corpo** deste doc é **doutrina estável** (processo,
> frameworks, decisões). **Números de mercado** (budget mínimo, tempo de aprendizado, faixas
> de verba) **envelhecem** e vivem **só no §13 (anexo datado, com selo `fonte + data`)** ou são
> buscados ao vivo (camada 5 do ADR-31) — **nunca no corpo de uma regra.**

---

## 1. Enquadramento

Planejamento é **desenhar o portfólio antes de veicular**: do objetivo de negócio ao conjunto
de campanhas, orçamento, estrutura e metas. O "play" (veicular) é sempre humano. O que segue é
*como decidir*, não *o que está atual na plataforma* (isso é camada 1/2 do ADR-31).

## 2. Diagnóstico-antes-do-plano (remissão)

Antes de montar o plano, rodar os **5 pareceres** (Planner · Analista de performance · Audiência
· Criativos/Narrativa · Risco/QA) → síntese de 3–5 recomendações priorizadas. **Já é o squad
"Planejamento — diagnóstico-antes-do-plano" do roster (§4b)** — não duplicar; o Planejador
consome essa síntese. Inclui a **Etapa 2 "Diagnóstico de dados"** [D1 §2.1]: histórico da conta,
GA4, CRM, benchmarks, sazonalidade, share of search.

## 3. Dossiê do cliente / ICP (ponte com o Client Knowledge Pack)

- **STP** (Segmentar → Escolher segmentos prioritários → Posicionar) [D1 §2.2].
- **Job to Be Done**: ancore mensagem/oferta na "tarefa" que o cliente resolve, não em features
  [D1 §2.2].
- Campos obrigatórios do plano: segmentos STP + JTBD + diferenciais competitivos [D1 §4.8].
- Estes campos **moram no Client Knowledge Pack (bloco B — Market Intelligence)** — o Planejador
  lê de lá, não recria.

## 4. Matriz: objetivo + modelo de negócio → canal + estrutura [D1 §4.6]

Framework de decisão (o **roteador mental**: por objetivo → 4 regras if/then [D1 §4.6.2]).
Dimensões: **modelo de negócio → abordagem → plataformas prioritárias → estrutura base**.

| Modelo de negócio | Canal prioritário | Estrutura base |
|---|---|---|
| **Negócio local** *(= KIL barbearia/salão)* | Google (Search local + PMax local / GBP); Meta como descoberta | Search local + PMax; captar chamada/WhatsApp |
| E-commerce PME | Google (PMax/Shopping) + Meta (Advantage+) | Prospecção + remarketing por catálogo |
| B2B ciclo longo | Google Search + LinkedIn | Lead gen + nutrição; janela de atribuição longa |
| B2C ticket baixo | Meta (descoberta) + Google Search | Volume + criativo de alto giro |

> A linha **Negócio local** é o perfil exato do cliente de referência **KIL** (CLAUDE.md). A
> escolha final passa pela **métrica-mãe por objetivo** (Método Subido §2) e pelo **Consultor de
> Plataforma** (ADR-31), que confirma o que a conta/plataforma oferece hoje.

## 5. Estrutura de conta + nomenclatura + UTM [D1 §2.6]

- **Hierarquia:** Conta → Campanhas (por objetivo) → Grupos/ad sets → Anúncios →
  Keywords/Audiências. **Consolidar, não fragmentar** (poucos ad groups, broad match + Smart
  Bidding). Fragmentação excessiva é erro comum (§12).
- **Nomenclatura (contrato de saída do Construtor de Campanha):**
  - Campanha: `[PLATAFORMA]_[OBJETIVO]_[FUNIL]_[NEGOCIO]_[LOCAL]_[PERIODO]_[VERSAO]`
  - Ad set: `[SEGMENTO]_[INTENCAO]_[OFERTA]` · Anúncio: `[FORMATO]_[ANGULO]_[CTA]`
- **UTM completo** (`utm_source/medium/campaign/content/term`) em toda URL.
- Sempre: listas de remarketing + **exclusão de compradores recentes**; landing page alinhada por
  ad group.

## 6. Media Plan e alocação de orçamento [D1 §2.7]

- **60/40 marca/performance** (Binet & Field/IPA) como **ponto de partida, não mandamento** —
  ajustar por categoria/maturidade. **Não vale** para microanunciante nem tática pura [D1 §4.1].
- **5 métodos de alocação:** por objetivo · por share of voice · por **teste incremental**
  (geo-test/holdout) · por MMM · por regra histórica — cada um com sua premissa/limite.
- **Prospecção vs remarketing:** cap de **~25–30% em públicos quentes** (anti-saturação).
- **Orçamento "de trás pra frente":** meta de receita → ticket → nº vendas → taxa lead→venda → nº
  leads → CPL alvo → verba de mídia [D1 §2.3].
- **Maturidade:** migrar de percentuais fixos para teste incremental conforme a escala permite.

## 7. Metas e KPIs por etapa de funil [D1 §2.4]

Ler o funil inteiro; cada etapa tem objetivo de plataforma, KPI primário e sinal a otimizar
(*os números de verba mínima / tempo de aprendizado são datados → §13*):

| Etapa | Objetivo | KPI primário | Sinal a otimizar |
|---|---|---|---|
| Awareness | Reconhecimento | CPM / alcance | frequência, incrementalidade |
| Tráfego | Tráfego | CPC / visita à LP | Connect Rate, qualidade |
| Lead | Cadastro | **CPA/CPL** | qualidade do lead |
| Conversão | Vendas | **CPA/ROAS** | conversão de fundo |
| Retenção | Recompra/LTV | ROAS / LTV | recorrência |

> Complementa o **ADR-29** (que trata métrica-mãe por *objetivo*): aqui entra a dimensão **estágio
> de funil + janela de atribuição**. **Anatomia completa da campanha** = 16 elementos [D1 §2.3].

## 8. Processo de planejamento (briefing → go-live) + checklist [D1 §4.4/§4.7]

- **9 etapas** (briefing → diagnóstico → estratégia → media plan → estrutura → criativos →
  tracking → QA/checklist → go-live), cada uma com responsável, entradas/saídas e **critério de
  conclusão**. É a cadência de **montar** um plano — distinta das Janelas de Otimização.
- **Checklist pré-lançamento** por blocos (tracking, estrutura, criativo, orçamento, política) —
  gate antes de veicular.

## 9. Decisões obrigatórias antes do lançamento [D1 §4.9]

**10 decisões**, cada uma com **quem decide + informação necessária + custo de adiar** (ex.:
objetivo/métrica-mãe, verba total e divisão, canais, estrutura, tracking, oferta, criativos,
públicos, metas numéricas, plano de teste). Serve de governança do Planejador antes do "play".

## 10. Plano de testes e Learning Log [D1 §2.3/§2.8]

- **Test Plan** com hipótese explícita, variável, tamanho de amostra, janela e critério de sucesso
  (ex.: mín. ~20 conv/variação; diferença de CPA ≥15% para declarar vencedor — *limiares em §13*).
- **Matriz criativa** ângulo × formato × público.
- Ponte: alimenta **Hipóteses & Priorização** e **Insights & Aprendizado** (roster). Refinamento
  futuro: **multi-armed bandit** para criativos [D2 Tema 07], mais sofisticado que o loop
  Generate→Evaluate→Critique→Refine atual.

## 11. Cadência de revisão do portfólio [D1 §2.11]

Ciclo contínuo de 7 fases (pesquisa→planejamento→implementação→monitoramento→otimização→
aprendizado→reaproveitamento) com revisão de **mix de canais e estratégia** em cadência
mensal/trimestral. **Distinto das Janelas de Otimização** (que ajustam uma campanha viva): aqui é
"o portfólio ainda faz sentido?".

## 12. Erros comuns de planejamento [D1 §2.12]

6 erros por frequência×impacto, cada um com sintoma/causa/custo/prevenção: **começar pela
plataforma, não pelo objetivo** · tracking incompleto · fragmentação excessiva · criativos
genéricos · alocação sem incrementalidade · ignorar política/regulatório. *(Complementa o Método
Subido, que cataloga erros de execução, não de design do plano.)*

## 13. ⏳ Anexo datado — benchmarks Brasil 2023–2026 (selo obrigatório; NÃO é corpo de regra)

> **Cada número abaixo carrega `[D1 §x · captura 2023–2026]` e deve ser tratado como
> [HIPÓTESE] datada.** Antes de usar, revalidar (camada 5 do ADR-31: fetch dos dev docs) — muitos
> o próprio D1 marca como "sem fonte, prática comum". **Nunca citar como fato permanente.**

- Automação estável (PMax/Advantage+): **~30–50 conv/mês** por segmento [D1 §2.2].
- Smart Bidding: budget diário **≥ 10× o target CPA** [D1 §2.3].
- Meta Advantage+ Shopping: **≥50 conv/30d + budget ≥ US$50/dia** [D1 §2.5].
- Criativos ativos: **10–15** por campanha automatizada [D1 §2.8].
- Faixas de verba mínima por etapa (awareness/lead/conversão) — **D1 marca "sem fonte"** [D1 §2.4].
- Janelas de atribuição: e-commerce ~7d, B2B ~30–90d [D1 §2.5].
- Test Plan: mín. ~20 conv/variação, ΔCPA ≥15% p/ vencedor [D1 §4.8].
- **Tabela por-plataforma completa (11 plataformas)** [D1 §2.5] — a mais volátil; **preferir
  buscar ao vivo (ADR-31 camada 5)** a congelar aqui.

---

## Mapa regra → agente / artefato

| Regra | Agente / artefato |
|---|---|
| Diagnóstico-antes-do-plano (§2) | Squad Planejamento (roster §4b) |
| Dossiê/ICP (§3) | **Client Knowledge Pack** bloco B |
| Matriz objetivo×negócio (§4) | **Planejador** + **Consultor de Plataforma** (ADR-31) |
| Media Plan / orçamento (§6) | **Estrategista** + **Planejador** (`PC-xxx`) — **lacuna nova** |
| Estrutura + nomenclatura + UTM (§5) | **Construtor de Campanha** (contrato de saída) — **lacuna nova** |
| KPI por funil (§7) | **Guardião da Métrica-Mãe** (ADR-29) + Planejador |
| Processo + checklist + decisões (§8/§9) | **Planejador** (governança de planejamento) — **lacuna nova** |
| Test Plan / Learning Log (§10) | **Hipóteses & Priorização** · **Insights & Aprendizado** |
| Cadência de portfólio (§11) | **Planejador** / revisão mensal-trimestral |
| Erros de planejamento (§12) | Risco/QA + Planejador |
| Benchmarks datados (§13) | **Curador** (selo) → **camada 5 ADR-31** (fetch on-demand) |

## Conexões

- **`regras-otimizacao-metodo-subido.md`**: doc irmão; a fronteira portfólio↔campanha-viva.
- **ADR-29** (Guardião): §7 adiciona a dimensão funil+atribuição à métrica-mãe.
- **ADR-30** (Ordem Sagrada/Janelas): a cadência de portfólio (§11) é distinta das Janelas.
- **ADR-31** (camada de conhecimento): §13 é o exemplo vivo do "benchmark datado → camada 5".
- **Roster:** Planejador, Estrategista, Audiência, Construtor de Campanha; Banco de Estratégias
  (Notion) = camada 4 / memória própria.
- **Fonte D2** já em: roster §4/§5 + `client-knowledge-pack.md`.
