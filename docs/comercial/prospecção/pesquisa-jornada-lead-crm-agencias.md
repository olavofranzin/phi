# Jornada do lead em CRM — benchmark de mercado e blueprint para agências digitais B2B

**Data:** 03/09/2026
**Escopo:** como empresas estruturam lifecycle, pipeline, scoring, automações, cadências, handoffs e pós-venda em CRM — com recorte para agências digitais / serviços B2B recorrentes.

---

## 0. Nota metodológica e limitações (leia antes de usar qualquer número)

### 0.1 Como classifico cada afirmação

| Marcador | Significado |
|---|---|
| `[DOC]` | Comportamento documentado do produto (HubSpot, RD Station, Salesforce). Verificável no produto. |
| `[FRAMEWORK]` | Framework público e nomeado (SiriusDecisions/Forrester, Winning by Design, MEDDIC, BANT). Existência é fato; adoção varia. |
| `[ESTUDO]` | Número originado de estudo quantitativo identificável (autor, amostra, ano). |
| `[BENCH-2]` | Número que circula em blogs de fornecedores/agências sem amostra ou metodologia publicada. **Trate como direcional, não como fato.** |
| `[INFERÊNCIA]` | Conclusão minha a partir das evidências acima. |
| `[RECOMENDAÇÃO]` | Proposta de desenho minha. Não é benchmark. |
| `[NÃO ENCONTRADO]` | Procurei e não achei informação pública confiável. |

### 0.2 Limitação séria desta pesquisa

O ambiente onde esta pesquisa rodou tem um proxy de egress que **bloqueou o acesso direto** aos seguintes domínios, que eram exatamente as fontes primárias mais importantes:

- `knowledge.hubspot.com` (documentação oficial de lifecycle stages)
- `blog.hubspot.com`
- `www.forrester.com` (Demand Unit Waterfall)
- `winningbydesign.com` (Bowtie Standard, SPICED)
- `www.rswus.com` (RSW/US New Business Survey)
- `handbook.gitlab.com` (opportunity stages públicos da GitLab)
- `timkilroy.com` (playbook comercial de agência)

Consegui o conteúdo dessas páginas **através da síntese do mecanismo de busca**, não lendo as páginas. Isso significa: a existência dos frameworks e as definições estruturais têm confiança alta (são consistentes entre múltiplas fontes independentes), mas **números específicos atribuídos a essas fontes não foram verificados por mim na origem**. Onde isso importa, sinalizo.

### 0.3 Alerta sobre a qualidade dos "benchmarks" disponíveis publicamente

Boa parte dos números de funil B2B que circulam hoje (taxas de conversão por etapa, taxas de no-show, tempo de resposta) vem de conteúdo de fornecedor otimizado para SEO, sem amostra, sem metodologia e frequentemente citando uns aos outros em círculo. Encontrei, por exemplo, valores conflitantes para a mesma métrica:

- MQL→SQL: "12–18%", "15–21%", "13%" e "39%" — em fontes diferentes, todas apresentadas como "benchmark 2025/2026".
- Lead→MQL: "20–25%", "20–40%" e "41%".

**Isso não é ruído aleatório — é diferença de definição.** Cada empresa define MQL de um jeito, então a taxa de conversão entre etapas é praticamente incomparável entre empresas. A conclusão útil disso é: `[INFERÊNCIA]` **benchmarks externos de conversão por etapa de funil têm valor quase nulo para calibrar uma operação. O benchmark que importa é a sua própria série histórica.** Use números externos apenas para detectar ordem de grandeza absurda, não para definir meta.

### 0.4 Autoavaliação de confiança (por bloco)

| Bloco | Confiança | Por quê |
|---|---|---|
| Distinção lifecycle vs. pipeline; comportamento do HubSpot | **0,88** | Consistente entre muitas fontes independentes + comportamento conhecido do produto |
| Existência e conteúdo dos frameworks (Waterfall, Bowtie, SPICED, MEDDIC, BANT) | **0,90** | Frameworks públicos, amplamente documentados |
| Estudo de speed-to-lead (5 minutos / 21x) | **0,85** | Origem bem estabelecida (Oldroyd/McElheran/Elkington, MIT/InsideSales); métrica derivada muito citada |
| Estrutura de pipeline típica de agência (Qualificação→Discovery→Diagnóstico→Proposta→Fechamento) | **0,80** | Convergência forte entre fontes, mas nenhuma amostra estatística |
| Números específicos de benchmark de agência (win rate por porte, churn, tenure) | **0,45** | Fontes secundárias, sem metodologia acessível |
| Taxas de conversão por etapa de funil | **0,35** | Contraditórias entre si e sem definição comum |
| Arquitetura recomendada (seções 5 em diante) | **n/a — é recomendação, não fato** | Derivada das evidências + julgamento operacional |

---

## 1. Executive Summary

1. **Lifecycle e pipeline são duas coisas diferentes e a confusão entre elas é o erro de configuração mais comum.** `[DOC]` No HubSpot, *lifecycle stage* é uma propriedade de **contato/empresa** que descreve o relacionamento; *deal stage* é uma propriedade de **negócio** que descreve o processo comercial. Misturar os dois quebra tanto o relatório de funil quanto o forecast.

2. **`lifecycle stage` no HubSpot é uma marca d'água, não um estado.** `[DOC]` Por padrão ele **só anda para frente** — nem via automação. Para retroceder é preciso limpar o campo e depois setar. Isso tem consequência de desenho: se você quer representar "lead que voltou para nutrição", isso **não** pertence ao lifecycle; pertence a um campo separado de status.

3. **O padrão de nomenclatura dominante no mercado é o do HubSpot** (Subscriber → Lead → MQL → SQL → Opportunity → Customer → Evangelist → Other), porque é o default de um produto com adoção massiva — não porque seja o desenho mais correto. `[INFERÊNCIA]` Prática mais comum ≠ melhor prática.

4. **O framework "acadêmico" da categoria é o Demand Waterfall da SiriusDecisions (hoje Forrester)**: Inquiry → MQL → SAL → SQL → Closed/Won (2006), depois quebrado com AQL/TQL (2012) e finalmente substituído pelo **Demand Unit Waterfall** (2017), que abandona o lead individual em favor da unidade de compra (comitê). `[FRAMEWORK]`

5. **A tendência recente mais relevante é o abandono do MQL como métrica de handoff.** A própria Forrester passou a tratar o MQL como obstáculo e a recomendar buying groups. Agências como a Refine Labs construíram posicionamento inteiro em substituir relatório de MQL por relatório de pipeline + atribuição autodeclarada ("como você nos conheceu?"). `[FRAMEWORK]` `[ESTUDO]` — o estudo da Refine Labs (620 conversões declaradas, 12 meses) reporta ~90% de gap entre atribuição por software e dado autodeclarado.

6. **Para negócios de receita recorrente, o modelo mais adequado não é o funil, é o Bowtie (Winning by Design)** — que dá peso simétrico a aquisição e a onboarding/retenção/expansão. `[FRAMEWORK]` Para agência com contrato de fee mensal, isso é estruturalmente mais correto que o funil clássico, porque o valor de um cliente de agência está quase todo depois do Closed Won.

7. **Velocidade de resposta é a variável com melhor evidência causal de toda a operação.** `[ESTUDO]` O estudo de referência (Oldroyd, McElheran & Elkington — MIT/InsideSales, dados de 3 anos, 6 empresas, >15.000 leads e >100.000 tentativas de contato) mostra que contatar em até 5 min vs. 30 min multiplica a chance de qualificar por ~21x. A auditoria complementar de 2.241 empresas encontrou tempo médio de primeira resposta de **42 horas**. **Este é o maior arbitragem disponível para uma agência: o mercado é lento.**

8. **Cadência: a convergência das fontes é 7–12 toques ao longo de 10–21 dias, multicanal.** `[BENCH-2]` A média de tentativas até conectar por telefone é ~3, e o volume de conversas que vão acontecer se esgota por volta da 3ª–8ª tentativa. Nenhuma dessas fontes publica metodologia — trate como faixa de desenho, não como verdade.

9. **Scoring maduro usa dois scores separados, não um.** `[DOC]` `[FRAMEWORK]` **Fit** (quem é: porte, segmento, verba de mídia, cargo — muda quando a empresa muda) e **Engagement/Intent** (o que está fazendo agora: páginas, respostas, reuniões — decai com o tempo). O HubSpot hoje suporta os dois modelos separados. Um score único agrada ninguém: inbound quer que ele se mova com comportamento, outbound quer que ele fique estável.

10. **Agência é vendida por referência, não por funil.** `[ESTUDO]` A pesquisa da Hinge com compradores de serviços profissionais indica que **71%** encontram um novo fornecedor perguntando a alguém, e que ~**48%** do novo negócio por valor vem de referência. `[INFERÊNCIA]` Um CRM de agência que só modela inbound/outbound e não modela **indicação, parceiro e reputação** está modelando a minoria da receita.

11. **A estrutura de pipeline específica de agência que aparece de forma mais consistente** é: Qualificação → Discovery → Diagnóstico/Escopo → Proposta → Negociação → Fechamento → **Handoff/Onboarding**. A etapa de **escopo/diagnóstico** é o que distingue agência de SaaS: agência não vende produto fixo, cada deal exige definir o que será entregue. O playbook público de Tim Kilroy formaliza isso em 5 estágios e 5 "gates" (Qualify, Discovery, Alignment, Proposal & Review, Handoff), com a tese de que **a etapa avança por decisão do comprador, não por atividade do vendedor**. `[FRAMEWORK]`

12. **O handoff comercial→operação é onde agência perde cliente.** `[BENCH-2]` As fontes convergem em que uma fração grande do churn de serviços B2B acontece nos primeiros 90 dias e que a causa dominante não é qualidade do trabalho, é o gap entre o que o comercial prometeu e o que o onboarding entregou. `[INFERÊNCIA]` Portanto, o **Closed Won não é o fim do processo no CRM** — o handoff precisa ser uma etapa com critério e responsável, não um e-mail.

13. **Motivo de perda: 5–8 opções, obrigatório, mutuamente exclusivo, escolhido a partir de evidência e não de opinião do vendedor.** `[BENCH-2]` Mais que isso e o vendedor escolhe aleatoriamente; menos e você perde sinal. Um campo de motivo de perda mal desenhado é pior que não ter: gera relatório que parece informação e não é.

14. **Menos etapas ganham.** `[BENCH-2]` A recomendação convergente é 5–7 etapas de pipeline, cada uma com um evento de saída distinto. Regra de corte: se duas etapas não mudam como você treinaria/coacharia o deal, elas são uma etapa só.

15. **O maior risco de qualquer arquitetura de CRM não é ser incompleta — é não ser usada.** `[BENCH-2]` As estimativas de falha de implantação de CRM circulam entre 30% e 63%, com adoção do usuário apontada como causa nº 1. `[INFERÊNCIA]` Para uma agência (time pequeno, sócio vendendo, operação puxando atenção), **a complexidade é o inimigo principal.** A arquitetura recomendada neste relatório é deliberadamente enxuta por causa disso.

---

## 2. Benchmark de mercado

> **Aviso:** só listo aqui estruturas **publicamente divulgadas**. Onde não há divulgação pública, escrevo `[NÃO ENCONTRADO]` em vez de inventar. Não reconstruí processo interno de nenhuma empresa a partir de suposição.

| Fonte / Empresa | Segmento | CRM / Ferramenta | Lifecycle | Pipeline | Automação | Scoring | Observações |
|---|---|---|---|---|---|---|---|
| **HubSpot** (default de produto) | Vendor de CRM | HubSpot | Subscriber, Lead, MQL, SQL, Opportunity, Customer, Evangelist, Other `[DOC]` | Deal stages customizáveis; pipeline default de vendas | Workflows; lifecycle avança automaticamente por criação de deal/negócio ganho `[DOC]` | Fit score + Engagement score separados `[DOC]` | Define o vocabulário de fato do mercado. Lifecycle só anda pra frente por padrão. |
| **RD Station CRM** (default de produto) | Vendor BR | RD Station CRM | Não há objeto "lifecycle" equivalente ao do HubSpot; estágio é do lead no RD Marketing | Funil default: Sem contato → Contato feito → Identificação do interesse → Apresentação → Proposta enviada `[DOC]` | Integração RD Marketing→CRM cria negociação por comportamento; RD Conversas centraliza WhatsApp `[DOC]` | Lead scoring no RD Marketing | Funil default é **orientado a atividade do vendedor**, não a decisão do comprador — ver anti-pattern §12. |
| **Salesforce** (prática documentada) | Vendor de CRM | Salesforce | Lead → Contact/Account (conversão) | Opportunity stages com **entry/exit criteria** por etapa; Lightning Path expõe critérios na UI `[DOC]` | Flows, Path guidance | — | O conceito forte que Salesforce popularizou é **exit criteria explícito por etapa**. |
| **SiriusDecisions / Forrester** | Analista | Framework | Inquiry → MQL → SAL → SQL → Closed/Won (2006); AQL/TQL (2012); **Demand Unit Waterfall** (2017): Target Demand → Active Demand → Engaged → Prioritized → … → Closed Won `[FRAMEWORK]` | — | — | AQL = qualificado por automação/score | Posição atual publicada: MQL como barreira; migrar para buying groups. |
| **Winning by Design** | Consultoria GTM | Framework | **Bowtie**: aquisição + onboarding + retenção + expansão, simétrico | — | — | **SPICED** (Situation, Pain, Impact, Critical Event, Decision) como framework de diagnóstico contínuo `[FRAMEWORK]` | O mais adequado conceitualmente a contrato recorrente (fee de agência). |
| **Refine Labs** (agência de demand gen) | Agência B2B | `[NÃO ENCONTRADO]` qual CRM | Rejeita MQL como métrica de handoff | Reporta **pipeline sourced**, não leads | — | — | Publica estudo próprio: ~90% de gap entre atribuição por software e autodeclarada (620 conversões, 12 meses) `[ESTUDO]`. Usa "como você nos conheceu?" como fonte primária de atribuição. |
| **Tim Kilroy** (consultoria de agências) | Consultoria p/ agências | Agnóstico | — | **Qualify → Discovery → Alignment → Proposal & Review → Handoff**, com 5 "gates" `[FRAMEWORK]` | — | — | Tese central: etapa avança por **compromisso do comprador**, não por atividade. Inclui Handoff como etapa formal — quase nenhum framework de vendas faz isso. |
| **GitLab** (handbook público) | SaaS B2B | Salesforce | — | Opportunity stages públicos com critérios | — | — | ⚠️ Não consegui abrir o handbook (domínio bloqueado). Cito apenas como **exemplo verificável de que existe empresa publicando stages com exit criteria**, sem afirmar quais são. |
| **Kalungi** (agência B2B SaaS) | Agência | `[NÃO ENCONTRADO]` | — | Publica playbook de marketing de 6 meses e usa T2D3 como framework de milestones `[FRAMEWORK]` | — | — | Playbook publicado é de **entrega ao cliente**, não do processo comercial interno. Não confundir. |
| **Hinge Research Institute** | Pesquisa (serviços profissionais) | — | — | — | — | — | Fonte de dados de **como o comprador de serviços escolhe**: 71% via indicação pessoal; ~48% do novo negócio por valor vem de referência `[ESTUDO]`. |
| **Agências digitais em geral** | — | HubSpot / Pipedrive / RD Station | `[NÃO ENCONTRADO]` padrão único | Convergência: Lead → Qualificação → Discovery → Escopo/Diagnóstico → Proposta → Negociação → Contrato/SOW → Onboarding | Variável | Raro | ⚠️ Isto é **agregação de conteúdo de fornecedores e consultorias**, não amostra estatística. `[BENCH-2]` |

### O que eu NÃO encontrei

- `[NÃO ENCONTRADO]` Nenhuma agência digital de porte publicando o **desenho interno real do seu CRM** (etapas, campos, automações, SLAs) com nível de detalhe auditável. O que existe é: (a) conteúdo de fornecedor descrevendo como *deveria* ser; (b) consultores vendendo playbook; (c) case study de fornecedor sem detalhe operacional. **Isso é uma lacuna real do mercado, não uma falha de busca.**
- `[NÃO ENCONTRADO]` Estudo quantitativo com metodologia publicada sobre taxas de conversão de funil **especificamente em agências**.
- `[NÃO ENCONTRADO]` Dado confiável sobre adoção de CRM em agências brasileiras.

---

## 3. O conceito que resolve metade dos problemas: lifecycle ≠ pipeline ≠ status

`[DOC]` `[INFERÊNCIA]` Três eixos independentes, três objetos diferentes:

| Eixo | Objeto no CRM | Pergunta que responde | Direção | Dono |
|---|---|---|---|---|
| **Lifecycle stage** | Contato / Empresa | "Qual é a natureza do relacionamento com essa conta?" | Só para frente (marca d'água) | Marketing/RevOps |
| **Deal stage (pipeline)** | Negócio / Oportunidade | "Onde está esta negociação específica?" | Frente e trás | Comercial |
| **Status / sub-estado** | Contato ou Negócio | "O que está acontecendo agora com ele?" (em cadência, sem resposta, nutrição, reciclado, disqualificado) | Livre | SDR / RevOps |

**Por que isso importa na prática:**

- Um cliente antigo que volta a negociar um novo escopo é **Customer no lifecycle** e **etapa inicial no pipeline** ao mesmo tempo. Se você tentou representar isso só com lifecycle, quebrou.
- Um lead que sumiu não "volta para MQL" — ele continua MQL no lifecycle e vira `status = reciclado` com um motivo. `[DOC]` Tentar retroceder o lifecycle no HubSpot exige limpar o campo antes, o que corrompe o histórico de datas de entrada em estágio.
- Uma empresa com 3 contatos: o lifecycle vive na **empresa**, não no contato, se você vende para comitê. `[FRAMEWORK]` É exatamente esse o argumento do Demand Unit Waterfall.

`[RECOMENDAÇÃO]` **Regra de ouro:** se um valor precisa retroceder, ele não é lifecycle. É status.

---

## 4. Arquitetura de referência recomendada

`[RECOMENDAÇÃO]` — desenho meu, derivado das evidências acima. Otimizado para **agência digital B2B, time comercial pequeno (1–5 pessoas), fee recorrente, inbound + outbound + indicação**.

### 4.1 Princípios de desenho (e a evidência por trás de cada um)

| Princípio | Evidência que o justifica |
|---|---|
| **1. Um pipeline principal, 6 etapas.** | `[BENCH-2]` Convergência em 5–7 etapas; cada etapa precisa de evento de saída distinto. `[BENCH-2]` Falha de CRM é dirigida por adoção, não por funcionalidade. |
| **2. Etapa avança por compromisso do comprador, não por atividade do vendedor.** | `[FRAMEWORK]` Tese central do playbook de agência de Tim Kilroy; `[DOC]` alinha com exit criteria do Salesforce. Contraste com o funil default do RD Station ("Contato feito", "Apresentação"), que é orientado a atividade. |
| **3. Lifecycle separado do pipeline, e status separado dos dois.** | `[DOC]` Comportamento de marca d'água do lifecycle stage do HubSpot. |
| **4. Dois scores: Fit e Intent. Nunca um só.** | `[DOC]` HubSpot suporta modelos separados; `[FRAMEWORK]` racional de que fit muda com a empresa e intent decai com o tempo. |
| **5. SLA de primeiro contato agressivo (minutos, não horas).** | `[ESTUDO]` 5 min vs 30 min ≈ 21x na qualificação; média de mercado de 42h de primeira resposta. |
| **6. Indicação e parceiro como origens de primeira classe, com pipeline e régua próprios.** | `[ESTUDO]` 71% dos compradores de serviços profissionais acham fornecedor perguntando a alguém; ~48% do novo negócio por valor vem de referência. |
| **7. Etapa formal de Handoff/Onboarding dentro do CRM, depois do Closed Won.** | `[BENCH-2]` Churn concentrado nos primeiros 90 dias e causado por gap promessa↔entrega; `[FRAMEWORK]` Bowtie dá peso simétrico ao pós-venda. |
| **8. Pipeline separado de expansão/renovação.** | `[FRAMEWORK]` Bowtie; `[BENCH-2]` retenção de receita >100% é comum e vem de expansão de conta. |
| **9. "Como você nos conheceu?" como campo obrigatório na conversão.** | `[ESTUDO]` Refine Labs: ~90% de gap entre atribuição por software e autodeclarada. |
| **10. Motivo de perda obrigatório, 6 opções, com campo de texto de evidência.** | `[BENCH-2]` 5–8 opções é o ponto de equilíbrio entre sinal e adoção. |

### 4.2 Objetos do CRM

| Objeto | Usar? | Papel na agência |
|---|---|---|
| **Empresa (Company)** | **Sim — objeto central** | A agência vende para empresa, não para pessoa. Fit score, segmento, verba de mídia, faturamento vivem aqui. |
| **Contato** | Sim | Comitê de compra: dono/CEO, head de marketing, financeiro. Intent score vive aqui. |
| **Negócio (Deal)** | Sim | Uma negociação = um contrato/escopo. Fee mensal + setup + prazo. |
| **Lead (objeto separado)** | **Não** | `[RECOMENDAÇÃO]` Em Salesforce o objeto Lead existe por legado. Em HubSpot/Pipedrive/RD, criar um objeto "lead" separado só duplica dado. Use Contato + lifecycle stage. |
| **Ticket** | Só depois que houver operação | Suporte/solicitação do cliente. Não usar no comercial. |
| **Produto/Serviço (line items)** | Sim, a partir do momento em que houver upsell | Necessário para medir mix de serviço, expansão e ticket médio por linha. |
| **Pipeline de Expansão/Renovação** | Sim | Segundo pipeline, dono = CS/Account. |

---

## 5. Jornada completa do lead (desenho recomendado)

```
ORIGENS                    LIFECYCLE (contato/empresa)      PIPELINE (deal)              PÓS-VENDA
─────────────────────────  ──────────────────────────────   ──────────────────────────   ─────────────────────
Indicação / parceiro   ┐
Inbound (site, SEO)    │
Mídia paga / LP        ├──► Subscriber ─► Lead ─────────────────────────────────────────────────────────┐
Conteúdo / newsletter  │         │           │                                                          │
Evento / networking    │         │           ▼ (Fit ok + Intent ok)                                     │
Outbound / prospecção  ┘         │        MQL/SAL ──► [SLA de contato]                                  │
   (pipeline n8n)                │           │                                                          │
                                 │           ▼ (respondeu + reunião agendada)                           │
                                 │         SQL ─────► 1. QUALIFICADO ──► 2. DISCOVERY                    │
                                 │                         │                  │                         │
                                 │                         │                  ▼                         │
                                 │                    Opportunity ──► 3. DIAGNÓSTICO/ESCOPO             │
                                 │                                            │                         │
                                 │                                            ▼                         │
                                 │                                    4. PROPOSTA ──► 5. NEGOCIAÇÃO     │
                                 │                                            │              │          │
                                 │                                            ▼              ▼          │
                                 │                                     CLOSED LOST      6. FECHAMENTO   │
                                 │                                            │              │          │
                                 ▼                                            │              ▼          │
                          [Status: reciclado / nutrição] ◄────────────────────┘        Customer         │
                                 │                                                          │          │
                                 └──────── reativação por sinal/tempo ──────────────────────┼──────────┘
                                                                                            ▼
                                                                              7. HANDOFF/ONBOARDING (0–90d)
                                                                                            │
                                                                                            ▼
                                                                       PIPELINE 2: EXPANSÃO / RENOVAÇÃO
                                                                       (upsell, cross-sell, renovação,
                                                                        indicação → volta pro topo)
```

**Duas diferenças relevantes em relação ao desenho genérico do briefing:**

1. `[RECOMENDAÇÃO]` **Não separo "Reunião agendada" e "Reunião realizada" como etapas de pipeline.** Reunião realizada não é decisão do comprador, é evento de agenda. Trate no-show como **atributo da etapa Discovery** (data da reunião + flag de no-show), não como etapa. Isso evita duas etapas que não mudam como você coacha o deal.
2. `[RECOMENDAÇÃO]` **Diagnóstico/Escopo é etapa própria e é a mais importante do pipeline de agência.** É onde o negócio deixa de ser genérico e vira um escopo com fee. `[BENCH-2]` É também a etapa que distingue agência de SaaS nas fontes: agência raramente vende produto fixo.

---

## 6. Tabela mestra: critérios de entrada, saída, dono, SLA e automação

`[RECOMENDAÇÃO]` — desenho meu. Os SLAs marcados `[ESTUDO]`/`[BENCH-2]` têm lastro externo; o resto é proposta.

### 6.1 Lifecycle (contato/empresa)

| Estágio | Objetivo | Critério de entrada | Critério de saída | Responsável | SLA | Automação |
|---|---|---|---|---|---|---|
| **Subscriber** | Manter na órbita | Assinou newsletter/blog, sem intenção comercial | Converte em material de fundo/pede contato | Marketing | — | Entra na régua de conteúdo |
| **Lead** | Identificar quem é | Conversão em formulário, WhatsApp, lista de outbound importada, indicação registrada | Fit score ≥ limiar **e** Intent ≥ limiar | Marketing / RevOps | Enriquecimento em até 24h | Enriquecimento automático (porte, segmento, site, verba de mídia estimada) |
| **MQL** | Handoff para pré-venda | Fit ok + Intent ok (ver §8) | SDR aceita (→SQL) ou rejeita com motivo (→reciclado) | Marketing entrega / SDR aceita | **Primeiro contato ≤ 5 min em horário comercial** `[ESTUDO]`; aceite/rejeição ≤ 24h `[BENCH-2]` | Task automática + notificação; rodízio/roteamento |
| **SQL** | Confirmar que vale reunião | SDR conversou e confirmou fit + dor + interlocutor | Reunião de Discovery agendada → cria Deal | SDR | Agendar em ≤ 5 dias úteis | Cria Deal automaticamente; agenda + lembretes |
| **Opportunity** | — | Deal criado e associado | Deal ganho ou perdido | AE/sócio | — | `[DOC]` HubSpot já move lifecycle para Opportunity ao criar deal |
| **Customer** | — | Deal ganho | Churn | CS/Account | — | Move lifecycle e dispara onboarding |
| **Evangelist** | Alimentar o motor de indicação | Cliente indicou alguém **ou** deu depoimento/case | — | CS/sócio | — | Entra em régua de advocacy; `[ESTUDO]` justificado pelo peso da indicação |
| **Churned** (custom) | Reativação futura | Contrato encerrado | Reativação | CS | — | Régua de win-back em D+90 |

### 6.2 Pipeline comercial (6 etapas)

| # | Etapa | Objetivo | Critério de entrada (evento do comprador) | Critério de saída / "gate" | Campos obrigatórios | Responsável | SLA | Automação |
|---|---|---|---|---|---|---|---|---|
| 1 | **Qualificado** | Confirmar que existe negócio possível | Prospect **aceitou** conversa de descoberta | Discovery agendada com data no calendário | Origem, Como nos conheceu, Fit score, Contato principal | SDR | Deal criado ≤ 1h após aceite | Cria deal, associa empresa/contato, seta owner |
| 2 | **Discovery** | Entender situação, dor e impacto | Reunião de descoberta **realizada** | Prospect confirma dor + impacto quantificado + concorda em avançar para diagnóstico | Dor principal, Impacto (R$ ou métrica), Verba de mídia atual, Decisor identificado, Urgência/evento crítico | AE/sócio | Follow-up ≤ 24h após a call | Lembretes D-2/D-1/D0 (no-show); nota de call obrigatória |
| 3 | **Diagnóstico / Escopo** | Transformar dor em escopo e fee | Prospect forneceu **acesso a dados** (contas de mídia, analytics, números) ou aceitou auditoria | Escopo e faixa de fee **verbalizados e não rejeitados**; decisor econômico confirmado | Serviços no escopo, Fee mensal estimado, Setup, Prazo do contrato, Decisor econômico, Concorrência | AE/sócio | Diagnóstico entregue ≤ 7 dias | Checklist de acessos; task de preparação |
| 4 | **Proposta** | Formalizar | Proposta **enviada** após alinhamento de faixa de preço | Prospect deu feedback explícito (aceite, objeção ou recusa) — **não** apenas "vou ver" | Valor do deal, Data prevista de fechamento, Proposta anexada | AE/sócio | Follow-up estruturado em D+2, D+5, D+10 | Sequência de follow-up automática; alerta de deal parado |
| 5 | **Negociação** | Resolver objeções e fechar termos | Prospect entrou em discussão de termos/escopo/preço | Aceite verbal + envio de contrato | Motivo da negociação, Desconto aplicado, Próximo passo com data | Sócio | Nenhum deal >21 dias sem próximo passo datado | Alerta de deal parado; aprovação de desconto |
| 6 | **Fechamento** | Assinatura | Contrato enviado | Contrato assinado → **Closed Won** | Data de início, Fee final, Serviços contratados | Sócio | Assinatura ≤ 10 dias | Assinatura eletrônica; ao ganhar → cria projeto de onboarding |
| — | **Closed Lost** | Aprender e reciclar | Recusa, silêncio prolongado ou desqualificação | — | **Motivo de perda (obrigatório)** + evidência em texto + data de reabordagem | Quem perdeu | Registrar ≤ 48h | Move contato para status `reciclado`; agenda reativação |
| 7 | **Handoff / Onboarding** *(pipeline separado)* | Não perder o cliente nos primeiros 90 dias | Closed Won | Kickoff feito + acessos + primeiro entregável + baseline definido | Escopo assinado, Promessas feitas no comercial, KPIs acordados, Account owner | Account/CS | Kickoff ≤ 5 dias úteis `[BENCH-2]` | Cria projeto/checklist; reunião comercial→operação obrigatória |

**Regras de retrocesso** `[RECOMENDAÇÃO]`:
- Deal volta de **Proposta → Diagnóstico** se o escopo mudar materialmente (novo serviço, novo decisor).
- Deal volta de **Negociação → Proposta** se houver reproposta com valor diferente.
- Deal **não volta** de Discovery para Qualificado — se o discovery mostrou que não há fit, é Closed Lost com motivo `sem fit`.
- **Lifecycle nunca retrocede.** Reciclagem é status, não lifecycle. `[DOC]`

---

## 7. Campos do CRM: o mínimo viável e o que gera complexidade inútil

`[RECOMENDAÇÃO]` A lógica de corte: **um campo só existe se alguém toma uma decisão diferente por causa dele.** Campo que ninguém filtra, ninguém segmenta e ninguém reporta é dívida operacional.

### 7.1 Empresa

| Campo | Classificação | Por quê |
|---|---|---|
| Segmento/vertical | **Obrigatório** | Entra no Fit score e define caso/prova social |
| Porte (faixa de funcionários) | **Obrigatório** | Fit score |
| Faturamento (faixa) | Recomendado | Difícil de obter, use faixa e não valor exato |
| **Verba de mídia mensal (faixa)** | **Obrigatório para agência de performance** | É o proxy nº 1 de fee possível e de fit `[BENCH-2]` |
| Maturidade de marketing (sem time / time interno / já tem agência) | **Obrigatório** | Muda completamente a abordagem e o ciclo |
| Já tem agência? Contrato até quando? | Recomendado | Define timing |
| Site / redes / stack | Recomendado | Insumo de diagnóstico |
| Fit score | **Obrigatório** (calculado) | — |
| Cidade/UF | Recomendado | Roteamento e eventos |
| Número exato de funcionários, CNAE detalhado, faturamento exato | **Opcional / evitar** | Alta manutenção, baixo uso decisório |

### 7.2 Contato

| Campo | Classificação | Por quê |
|---|---|---|
| Nome, e-mail, telefone/WhatsApp | **Obrigatório** | — |
| Cargo + senioridade | **Obrigatório** | Fit; identificação de decisor |
| Papel no comitê (decisor econômico / champion / usuário / técnico) | **Obrigatório a partir do Discovery** | `[ESTUDO]` Multithreading tem correlação forte com win rate |
| **Como nos conheceu? (autodeclarado)** | **Obrigatório na primeira conversão** | `[ESTUDO]` Refine Labs: ~90% de gap vs atribuição por software |
| Origem / canal / campanha (UTM) | **Obrigatório** (automático) | Nunca preencher à mão |
| Intent score | **Obrigatório** (calculado) | — |
| Opt-in / base legal (LGPD) | **Obrigatório** | Obrigação legal no Brasil, especialmente com prospecção ativa e WhatsApp |
| Aniversário, hobbies, "campos de rapport" | **Opcional / evitar** | Nunca preenchidos de forma consistente |

### 7.3 Negócio (Deal)

| Campo | Classificação |
|---|---|
| Fee mensal, Setup/one-off, Prazo do contrato (meses) | **Obrigatório** |
| **Valor total do contrato (fee × prazo + setup)** | **Obrigatório** (calculado) — é o número que importa em receita recorrente, não o "valor do deal" solto |
| Serviços no escopo (multi-seleção) | **Obrigatório** |
| Dor principal + Impacto | **Obrigatório a partir do Discovery** |
| Decisor econômico | **Obrigatório a partir do Diagnóstico** |
| Evento crítico / urgência | Recomendado (é o "C" do SPICED) |
| Concorrência | Recomendado |
| Data prevista de fechamento | **Obrigatório** |
| **Motivo de perda + evidência** | **Obrigatório em Closed Lost** |
| Próximo passo + data do próximo passo | **Obrigatório** enquanto aberto — é o campo que impede o "lead esquecido" |
| Probabilidade manual por deal | **Evitar** — use probabilidade por etapa, calibrada com histórico |

### 7.4 Campos que costumam gerar complexidade desnecessária `[INFERÊNCIA]`

- Score único combinando fit e intent (ver §8).
- Mais de ~8 opções em picklists de motivo de perda.
- Campos de "temperatura" (quente/morno/frio) preenchidos por sensação — duplicam o score e são inconsistentes entre pessoas.
- Múltiplos campos de origem (origem, origem original, sub-origem, canal, mídia, campanha, conteúdo) preenchidos manualmente.
- Campos obrigatórios em etapas iniciais: matam a adoção. Torne obrigatório **na saída da etapa**, não na entrada.

---

## 8. Scoring e qualificação

### 8.1 Fit vs. Intent — os dois eixos

| | **Fit** | **Intent / Engagement** |
|---|---|---|
| Pergunta | "Essa empresa **deveria** comprar de nós?" | "Essa empresa está demonstrando intenção **agora**?" |
| Objeto | Empresa | Contato |
| Fonte | Dados firmográficos + enriquecimento | Comportamento |
| Muda quando | A empresa muda | O tempo passa (decai) |
| Uso | Priorização de outbound, roteamento, decisão de investir tempo | Timing de abordagem |

`[DOC]` O HubSpot suporta hoje modelos separados de fit e engagement. `[FRAMEWORK]` O argumento contra o score único: inbound quer que o número se mova com comportamento, outbound quer que ele fique estável depois do enriquecimento — um score único frustra os dois.

### 8.2 Modelo de scoring proposto para agência digital `[RECOMENDAÇÃO]`

**Fit Score (0–100), na Empresa:**

| Critério | Peso sugerido | Racional |
|---|---|---|
| Verba de mídia mensal na faixa-alvo | 30 | Proxy direto de fee possível |
| Segmento entre os verticais onde a agência tem caso | 20 | Prova social encurta ciclo |
| Porte na faixa-alvo | 15 | — |
| Maturidade de marketing compatível | 15 | Cliente sem nenhuma maturidade custa caro para servir |
| Modelo de negócio com recorrência/LTV que suporta fee | 10 | — |
| Região / fuso / idioma | 5 | — |
| Acesso plausível ao decisor (empresa pequena o bastante) | 5 | — |
| **Desqualificadores (zeram o fit)** | — | Verba abaixo do piso; setor vetado; pede spec work; exige exclusividade sem fee |

**Intent Score (0–100), no Contato, com decaimento:**

| Sinal | Peso | Decaimento |
|---|---|---|
| Pediu contato / preencheu form de proposta | 40 | 30 dias |
| Respondeu WhatsApp/e-mail de prospecção | 25 | 21 dias |
| Visitou página de preços/serviços 2+ vezes | 15 | 14 dias |
| Abriu/clicou em sequência 3+ vezes | 10 | 14 dias |
| Baixou material de fundo de funil (auditoria, calculadora) | 15 | 30 dias |
| Compareceu a evento/webinar | 10 | 45 dias |
| **Negativos** | | |
| Cargo irrelevante / e-mail pessoal genérico | −20 | permanente |
| Sem nenhuma interação em 60 dias | −30 | — |

**Matriz de decisão (é isso que gera a ação, não o score isolado):**

```
                 INTENT ALTO              INTENT BAIXO
              ┌───────────────────────┬───────────────────────┐
  FIT ALTO    │  MQL → SDR agora      │  Outbound ativo       │
              │  SLA 5 min            │  (cadência + ABM)     │
              ├───────────────────────┼───────────────────────┤
  FIT BAIXO   │  Triagem humana:      │  Nutrição automática  │
              │  pode ser fit oculto  │  ou descarte          │
              └───────────────────────┴───────────────────────┘
```

`[RECOMENDAÇÃO]` **MQL = Fit ≥ 60 E Intent ≥ 50.** Fit alto + intent baixo **não é MQL** — é alvo de outbound. Essa distinção é o que impede o SDR de queimar tempo com lead que baixou um e-book.

### 8.3 Frameworks de qualificação: qual usar em agência

| Framework | Origem `[FRAMEWORK]` | Adequação para agência |
|---|---|---|
| **BANT** (Budget, Authority, Need, Timeline) | IBM, anos 1950/60 | Serve como filtro rápido no SDR. Insuficiente para venda consultiva: qualifica uma vez e para. |
| **MEDDIC / MEDDPICC** | PTC, anos 1990 | Overhead alto demais para ticket de agência típico. Elementos úteis isolados: *Economic Buyer* e *Champion*. |
| **SPICED** (Situation, Pain, Impact, Critical Event, Decision) | Winning by Design | **Melhor encaixe.** Foi desenhado para receita recorrente e para ser usado do comercial ao CS — ou seja, o mesmo diagnóstico atravessa o handoff. |
| **Modelo próprio** | — | `[RECOMENDAÇÃO]` Use SPICED como estrutura de campos do deal e BANT como checklist do SDR. |

`[RECOMENDAÇÃO]` Para agência, adicionaria duas letras próprias ao diagnóstico:
- **Recorrência**: esse escopo sustenta fee mensal ou é projeto de uma vez? (define LTV)
- **Fit cultural / operacional**: esse cliente vai consumir 3x a margem em atendimento? `[BENCH-2]` Red flags recorrentes nas fontes: pedido de spec work grátis, expectativa irrealista de ROAS, prazo indefinido, disputa por controle de contas de mídia.

---

## 9. Régua de interação e automações

### 9.1 Matriz de régua `[RECOMENDAÇÃO]` (com o SLA de D0 lastreado em `[ESTUDO]`)

| Momento | Gatilho | Canal | Ação | Timing | Responsável | Automação |
|---|---|---|---|---|---|---|
| Conversão inbound | Form/WhatsApp recebido | E-mail + WhatsApp | Confirmação + o que esperar + link de agenda | **Imediato** | Sistema | Sim |
| Conversão inbound | Form recebido | Interno | Enriquecer empresa, calcular Fit, rotear, criar task | **≤ 2 min** | Sistema | Sim |
| Conversão inbound | Fit ok | Telefone/WhatsApp | **1ª tentativa de contato humano** | **≤ 5 min em horário comercial** `[ESTUDO]` | SDR | Task + notificação |
| Sem resposta | D0 sem contato | Telefone + WhatsApp | 2ª e 3ª tentativa no mesmo dia, horários diferentes | D0 | SDR | Sequência |
| Sem resposta | D+1 | Telefone + e-mail | 4ª tentativa + e-mail com prova social do segmento | D+1 | SDR | Sequência |
| Sem resposta | D+3 | WhatsApp + LinkedIn | 5ª tentativa, ângulo novo | D+3 | SDR | Sequência |
| Sem resposta | D+7 | E-mail | Conteúdo útil, sem pedir reunião (case/diagnóstico gratuito) | D+7 | Automação | Sim |
| Sem resposta | D+12 | Telefone + e-mail | 6ª–7ª tentativa | D+12 | SDR | Sequência |
| Sem resposta | D+16 | E-mail | "Break-up" — encerra a cadência explicitamente | D+16 | Automação | Sim |
| Fim da cadência | 7–9 toques sem resposta | — | `status = nutrição`; retirar da fila do SDR | D+16 | Sistema | Sim |
| Reunião agendada | Evento criado | E-mail + WhatsApp | Confirmação + ICS + 1 pergunta de preparação | Imediato | Sistema | Sim |
| Anti-no-show | D-1 e D0−1h | WhatsApp | Lembrete curto com opção de remarcar | D-1, D0 | Sistema | Sim `[BENCH-2]` |
| No-show | Não compareceu | WhatsApp + e-mail | Remarcar em ≤ 2h; 3 tentativas em 5 dias | D0 +2h | SDR | Sequência |
| Pós-Discovery | Reunião realizada | E-mail | Resumo do que ouvi + próximos passos + data | **≤ 24h** | AE | Template |
| Diagnóstico | Acessos concedidos | — | Task de auditoria + prazo | D+7 | AE | Checklist |
| Proposta enviada | Deal → Proposta | E-mail + WhatsApp | Follow-ups D+2, D+5, D+10 com ângulos diferentes (risco de não agir, case, prazo) | D+2/5/10 | AE | Sequência |
| Deal parado | Sem atividade 14 dias | Interno | Alerta ao dono + exige próximo passo datado | D+14 | Sistema | Sim |
| Closed Lost | Motivo registrado | — | Roteia para régua de reciclagem específica do motivo | Imediato | Sistema | Sim |
| Reciclagem `sem timing` | Data de reabordagem | WhatsApp/tel | Reabordagem ativa | Na data + trimestral | SDR | Task |
| Reciclagem `sem budget` | 90 dias | E-mail | Nutrição + oferta de escopo menor | D+90 | Automação | Sim |
| Reativação por sinal | Ex-lead volta ao site de preços / responde e-mail | Interno | Alerta ao dono anterior + task | Imediato | Sistema | Sim |
| Closed Won | Deal ganho | Interno | Cria projeto de onboarding + reunião comercial→operação | **≤ 24h** | Sistema | Sim |
| Onboarding | Contrato assinado | Reunião | Kickoff com cliente | **≤ 5 dias úteis** `[BENCH-2]` | Account | Task |
| D+30 cliente | 30 dias de contrato | Reunião | Primeira entrega visível + check-in | D+30 | Account | Task |
| D+90 cliente | 90 dias | Reunião | Business review com resultado em métrica do cliente | D+90 | Account | Task |
| D+90 cliente | Business review feita | — | **Pedir indicação** (gatilho explícito) | D+90 | Account | Task `[ESTUDO]` |
| Trimestral | A cada 90 dias | Reunião | QBR + identificar gap de serviço → deal de expansão | Trimestral | Account | Task |
| Pré-renovação | 60 dias do fim do contrato | Interno | Cria deal no pipeline de renovação | D-60 | Sistema | Sim |
| Churn | Contrato encerrado | E-mail | Pesquisa de saída + régua de win-back em D+90 | D0 / D+90 | Automação | Sim |

### 9.2 Automações mínimas (ordem de implantação) `[RECOMENDAÇÃO]`

**Nível 1 — implante primeiro, resolve 80% do problema:**
1. Roteamento + task de primeiro contato com SLA de minutos.
2. Confirmação automática ao lead (e-mail + WhatsApp).
3. Criação automática de deal quando SQL.
4. Motivo de perda obrigatório em Closed Lost.
5. Alerta de deal parado (14 dias sem atividade).
6. Lembretes anti-no-show.

**Nível 2:**
7. Enriquecimento automático da empresa + cálculo de Fit.
8. Sequências de cadência (inbound e outbound separadas).
9. Reciclagem automática por motivo de perda.
10. Criação do projeto de onboarding no Closed Won.

**Nível 3:**
11. Intent score com decaimento.
12. Alerta de reativação por sinal.
13. Pipeline de expansão/renovação com criação automática em D-60.

`[INFERÊNCIA]` **Automação em excesso é anti-pattern real.** Cada automação é código sem teste rodando em produção sobre a sua receita. Uma agência com 3 pessoas no comercial não deve ter 40 workflows — deve ter ~12 que funcionam e são auditados.

---

## 10. Cadência comercial — o que os dados suportam

### 10.1 Velocidade de resposta (a evidência mais forte de toda a pesquisa)

`[ESTUDO]` O estudo de referência é **Oldroyd, McElheran & Elkington (MIT / InsideSales, ~2011)** — 3 anos de dados, 6 empresas, mais de 15.000 leads e mais de 100.000 tentativas de contato. Achados centrais reportados:
- Contatar em **≤5 min** vs. **30 min** → ~**21x** mais chance de qualificar o lead.
- ~**100x** mais chance de conectar.
- Auditoria paralela de **2.241 empresas americanas**: tempo médio de primeira resposta de **42 horas**; apenas **37%** responderam em até 1 hora.

⚠️ **Ressalva importante:** não consegui abrir a fonte primária (domínios bloqueados). A existência e o desenho do estudo são consistentes em muitas fontes independentes, mas o número "21x" é frequentemente citado sem contexto — ele compara 5 min contra 30 min, **não** contra "responder rápido em geral". Além disso, o estudo tem ~15 anos e o comportamento de compra mudou. Confiança: **0,85** na existência e no sentido do efeito; **0,60** na magnitude exata hoje.

`[BENCH-2]` Números que circulam mas que **não** consegui rastrear até uma metodologia: "53% de conversão para SQL respondendo em 1h vs 17% após 24h", "2,6x mais close respondendo em 5 min", "9x mais chance de conversão respondendo em 5 min (Brasil)". Não use esses em apresentação sem qualificar.

**A conclusão robusta, independente do número exato:** `[INFERÊNCIA]` a distribuição de tempo de resposta do mercado é péssima (42h de média). Uma agência que responde em minutos captura uma vantagem estrutural que não depende de ter o melhor pitch.

### 10.2 Número de tentativas e duração

`[BENCH-2]` Convergência das fontes (nenhuma com metodologia publicada):

| Parâmetro | Faixa reportada |
|---|---|
| Toques em cadência outbound fria | 7–12, ao longo de 10–21 dias |
| Toques para lead inbound quente | 4–7, dentro de ~1 semana |
| Tentativas de ligação até conectar | média ~3; grande parte das conversas possíveis se esgota até a 3ª–8ª |
| Deals maiores / enterprise | 10–18 toques, 4–12 semanas |
| Canais | telefone + e-mail + LinkedIn + (no Brasil) WhatsApp |

`[RECOMENDAÇÃO]` Para agência digital no Brasil: **8 toques em 16 dias**, mix de WhatsApp (canal dominante localmente), telefone e e-mail, com break-up explícito. Regra de parada: 8 toques sem **nenhuma** resposta → nutrição. Uma resposta negativa clara ("não temos interesse") → Closed Lost com motivo, não continuar a cadência.

### 10.3 No-show

`[BENCH-2]` Faixas reportadas: no-show de 18% (2020) a ~32% (2025) em reuniões agendadas a frio; show rate mediano de 62–72% em SaaS B2B; reuniões marcadas para o mesmo dia têm no-show muito menor que as marcadas com 8+ dias de antecedência. Nenhuma dessas fontes publica amostra.

`[INFERÊNCIA]` O mecanismo é plausível e consistente (quanto maior o intervalo entre agendar e realizar, maior a chance de esfriar), e a mitigação é barata: **agende o mais próximo possível e faça lembrete em D-1 e 1h antes.**

---

## 11. Handoff: Marketing → SDR → AE → CS

| Passagem | Critério objetivo | O que é transferido | Registro no CRM | SLA | Se falhar |
|---|---|---|---|---|---|
| **Marketing → SDR** (Lead→MQL) | Fit ≥ 60 **e** Intent ≥ 50 | Origem, como nos conheceu, histórico de páginas/conteúdo, dados firmográficos enriquecidos | Lifecycle = MQL + owner = SDR + `data_mql` | Contato ≤5 min; aceite/rejeição ≤24h | SDR rejeita com **motivo obrigatório** → volta para nutrição com feedback ao marketing |
| **SDR → AE** (MQL→SQL→Deal) | Conversa realizada + dor confirmada + interlocutor com influência + reunião agendada | Notas da conversa, dor, contexto, expectativa de verba, quem é quem | Deal criado, etapa 1, owner = AE, campos SPICED iniciais preenchidos | Deal criado ≤1h após aceite | AE devolve com motivo → SDR requalifica ou recicla |
| **AE → Closed Won** | Contrato assinado | — | Lifecycle = Customer | — | — |
| **AE → CS/Operação** (handoff) | Contrato assinado + **reunião de passagem realizada** | **Promessas feitas na venda** (campo explícito), escopo, KPIs acordados, contexto político da conta, riscos | Projeto de onboarding criado + campo `promessas_comerciais` | Reunião de passagem ≤48h; kickoff ≤5 dias úteis | Sem reunião de passagem, o onboarding não inicia |
| **CS → Expansão** | QBR realizado + gap de serviço identificado | Resultado entregue, gap, budget disponível | Deal no pipeline de Expansão | Trimestral | — |
| **CS → Indicação** | Cliente satisfeito em D+90 / após resultado | — | Lifecycle = Evangelist; nova origem = Indicação | — | — |

### O ponto mais negligenciado

`[BENCH-2]` `[INFERÊNCIA]` **O campo `promessas_comerciais` é a automação de maior ROI e menor custo desta lista inteira.** As fontes convergem em que a causa dominante de churn precoce em serviços B2B não é qualidade de entrega, é divergência entre o que foi vendido e o que foi entregue. Um campo de texto obrigatório no Closed Won, lido em voz alta na reunião de passagem, resolve boa parte disso. Custo: 5 minutos de configuração.

### Leads que não estão prontos para vendas

`[RECOMENDAÇÃO]` Nunca fiquem "no limbo do SDR". Toda saída da fila comercial tem que ter destino e data:

| Situação | Destino | Reentrada |
|---|---|---|
| Fit alto, intent baixo | Outbound/ABM (não é MQL) | Quando intent subir |
| Fit baixo, intent alto | Triagem humana única; se confirmado sem fit → descarte com motivo | Só se dados mudarem |
| Fit alto, sem timing | `nutrição` + data de reabordagem explícita | Na data + a cada trimestre |
| Sem budget hoje | `nutrição` + oferta de escopo reduzido | D+90 |
| Não responde | `nutrição` após 8 toques | Por sinal comportamental |

---

## 12. Closed Lost e motivos de perda

### 12.1 Taxonomia proposta `[RECOMENDAÇÃO]` (6 opções + evidência obrigatória)

| Motivo | Definição operacional (para não virar caixa-preta) | Quem deve agir |
|---|---|---|
| **Sem fit** | Não atende ao ICP (verba, segmento, maturidade). Deveria ter sido barrado antes. | Marketing + SDR (ajustar targeting/scoring) |
| **Sem budget / fee acima do possível** | Quer, precisa, não tem verba para o fee proposto. | Comercial (oferta escalonada) + Financeiro (pricing) |
| **Sem timing / prioridade** | Fit e budget existem, decisão adiada. **Exige data de reabordagem obrigatória.** | Marketing (nutrição) |
| **Perdeu para concorrente** | Escolheu outro fornecedor. **Exige nome do concorrente + razão declarada.** | Posicionamento / proposta |
| **Optou por fazer interno** | Vai montar time próprio ou já tem. | Oferta (modelo híbrido/consultoria) |
| **Sem resposta / evaporou** | Sumiu após engajamento. | Operação comercial (é sintoma de processo, não de mercado) |

**Regras que fazem a diferença entre um campo útil e um campo decorativo** `[RECOMENDAÇÃO]` `[BENCH-2]`:
1. **Obrigatório**, com **um único** motivo primário (mutuamente exclusivo).
2. **Campo de evidência em texto livre obrigatório** — "o que o cliente literalmente disse". Sem isso, "preço" absorve tudo e a informação morre.
3. **"Sem resposta" não é um motivo de mercado, é um alerta de processo.** Se >30% das perdas caem aqui, o problema é a cadência, não o lead.
4. **Data de reabordagem obrigatória** para `sem timing` e `sem budget`.
5. Revisar a taxonomia a cada 6 meses. `[BENCH-2]` Não deixe o vendedor "corrigir a própria prova" — cruze o motivo declarado com o que aparece na gravação/nota da call.

### 12.2 O que cada área faz com esse dado

| Motivo dominante | Leitura | Ação |
|---|---|---|
| Sem fit alto | Aquisição desalinhada com o ICP | Rever segmentação de mídia, formulário, critérios de outbound, Fit score |
| Sem budget alto | Oferta cara demais para o público captado, ou público errado | Criar escopo de entrada; subir o piso de qualificação |
| Concorrente alto | Problema de posicionamento/proposta | Diferenciação, prova, estrutura da proposta |
| Sem timing alto | Captação está pegando gente cedo demais | Investir em nutrição de longo prazo; medir reativação |
| Sem resposta alto | Falha de processo comercial | Cadência, velocidade de resposta, qualidade da reunião |

---

## 13. Métricas

### 13.1 KPIs essenciais por etapa `[RECOMENDAÇÃO]`

| Camada | KPI | Fórmula / definição | Por que importa em agência |
|---|---|---|---|
| Aquisição | Leads por origem | — | Com **origem autodeclarada**, não só UTM `[ESTUDO]` |
| Aquisição | CPL por canal | Investimento / leads | — |
| Aquisição | **% de receita vinda de indicação** | — | `[ESTUDO]` É a origem dominante em serviços profissionais; se você não mede, não gerencia |
| Handoff | **Tempo de primeira resposta (mediana e p90)** | — | `[ESTUDO]` O KPI com melhor evidência causal. Use mediana e p90, nunca média |
| Handoff | Taxa de aceite de MQL pelo SDR | SQL / MQL | Mede a qualidade do scoring |
| Comercial | Taxa de reunião realizada / agendada (1 − no-show) | — | `[BENCH-2]` |
| Comercial | Conversão por etapa | — | ⚠️ Comparar **só com a própria série histórica** |
| Comercial | **Win rate** | Ganhos / (Ganhos + Perdidos) | `[BENCH-2]` Faixas externas variam de 19% a 55% — inúteis para meta |
| Comercial | Ciclo de vendas (mediana) | — | Mediana, não média (outliers distorcem) |
| Comercial | **Pipeline velocity** | (Oportunidades × Ticket × Win rate) ÷ Ciclo | `[BENCH-2]` Única métrica que junta as quatro alavancas |
| Comercial | Tempo em etapa (p50/p90) | — | Diagnostica gargalo melhor que taxa de conversão |
| Comercial | Deals sem próximo passo datado | — | Métrica de higiene; alvo = 0 |
| Receita | **Fee mensal contratado (MRR novo)** | — | **Mais importante que "valor do deal"** em modelo de fee |
| Receita | **Valor total do contrato** (fee × prazo + setup) | — | — |
| Receita | CAC e **CAC payback em meses de fee** | CAC / fee mensal | `[RECOMENDAÇÃO]` A métrica de sanidade nº 1 de agência: quantos meses de fee pagam a aquisição |
| Pós-venda | **Retenção logo vs. retenção de receita (NRR)** | — | `[BENCH-2]` Podem divergir muito; medir separado |
| Pós-venda | Churn em 90 dias | — | `[BENCH-2]` Concentração de churn precoce |
| Pós-venda | Tenure médio (meses) | — | `[BENCH-2]` Retainer >> projeto |
| Pós-venda | **LTV = fee × tenure × margem** | — | — |
| Pós-venda | Expansão (upsell/cross-sell) como % da receita nova | — | — |
| Reciclagem | Taxa de reativação | Deals reabertos / Closed Lost reciclados | Raramente medido; costuma ser o canal mais barato |

### 13.2 Se a agência só puder acompanhar 6 números `[RECOMENDAÇÃO]`

1. **Tempo mediano de primeira resposta**
2. **MRR novo contratado no mês**
3. **Win rate** (com N absoluto ao lado — com 12 deals/mês, win rate isolado é ruído)
4. **CAC payback em meses de fee**
5. **NRR (retenção de receita)**
6. **% da receita nova originada em indicação**

`[INFERÊNCIA]` As duas últimas costumam ser as que mais mudam o resultado de uma agência e as menos acompanhadas. Uma agência com NRR >100% e forte motor de indicação precisa de muito menos topo de funil — o que inverte a prioridade de investimento em relação ao que a maioria faz.

---

## 14. Comparação entre modelos

| | **M1 — CRM simples** | **M2 — Funil tradicional MKT+Vendas** | **M3 — RevOps completo** | **M4 — Agência digital (recomendado)** |
|---|---|---|---|---|
| **Estrutura** | 3–5 etapas de pipeline, sem lifecycle, sem scoring | Lead→MQL→SQL→Opportunity→Customer + pipeline | Lifecycle + pipeline + fit/intent + SLAs + handoffs + pós-venda + atribuição | Lifecycle enxuto + 6 etapas por decisão do comprador + fit/intent + handoff formal + pipeline de expansão |
| **Vantagens** | Adoção quase garantida; custo zero de manutenção | Vocabulário comum; comparável com o mercado; suportado nativamente | Previsibilidade real; diagnóstico de gargalo; escala | Encaixa no que a agência realmente vende (escopo consultivo + fee recorrente); dá peso ao pós-venda e à indicação |
| **Desvantagens** | Não diagnostica nada; forecast por intuição; leads somem | MQL é métrica frágil e questionada; ignora pós-venda; assume comprador individual | Alto custo de manutenção; exige alguém dono do processo; quebra sem disciplina | Exige disciplina no handoff e no registro de escopo; segundo pipeline aumenta a superfície |
| **Complexidade operacional** | Muito baixa | Média | **Alta** — exige RevOps dedicado | **Média** — deliberadamente cortado |
| **Quando usar** | <20 deals/ano; sócio único vendendo | Time com marketing e vendas separados; volume razoável | >50 pessoas, múltiplos segmentos, forecast para board/investidor | Agência 5–80 pessoas, fee recorrente, inbound+outbound+indicação |
| **Riscos** | Teto rápido; nenhuma memória institucional | Otimizar MQL e não receita; guerra marketing×vendas | Ninguém usa; `[BENCH-2]` estimativas de falha de CRM 30–63%, adoção é a causa nº 1 | Virar M3 por acréscimo incremental de campos |
| **Exemplos / lastro** | Funil default do RD Station usado sem customização `[DOC]` | Default do HubSpot `[DOC]`; SiriusDecisions Waterfall `[FRAMEWORK]` | Demand Unit Waterfall `[FRAMEWORK]`; Bowtie `[FRAMEWORK]` | Playbook de 5 gates de Tim Kilroy `[FRAMEWORK]` + Bowtie + evidência de indicação da Hinge `[ESTUDO]` |

`[INFERÊNCIA]` **O erro mais caro não é escolher o modelo errado, é escolher M3 e operar M1.** Um CRM configurado com 14 etapas, 60 campos e 40 workflows, mas em que ninguém preenche motivo de perda e metade dos deals está parada, é estritamente pior que um M1 honesto: ele produz relatórios que parecem informação.

---

## 15. Modelo específico para agência digital B2B

### 15.1 Por que agência é diferente

| Característica | Consequência no desenho do CRM |
|---|---|
| Não vende produto fixo — cada deal exige definir escopo `[BENCH-2]` | Etapa de **Diagnóstico/Escopo** obrigatória entre Discovery e Proposta |
| Receita é fee recorrente, não transação | Métrica é **MRR + tenure**, não "valor do deal". Modelo mental = **Bowtie**, não funil `[FRAMEWORK]` |
| Maior parte do valor vem depois do Closed Won | Handoff é etapa; pipeline de expansão existe |
| Comprado majoritariamente por indicação `[ESTUDO]` | Origem "indicação" é primeira classe, com pipeline e régua próprios; Evangelist é estágio útil, não decorativo |
| Vendido pelo sócio, com tempo escasso | **Menos etapas, menos campos, mais automação de nível 1** |
| Cliente ruim custa margem, não só receita | Fit score com **desqualificadores absolutos**, não só pontos |
| Brasil: WhatsApp é o canal dominante `[BENCH-2]` | WhatsApp é canal de primeira classe na régua e precisa estar logado no CRM |

### 15.2 Entrada: origens e tratamento diferenciado `[RECOMENDAÇÃO]`

| Origem | Fit presumido | Tratamento |
|---|---|---|
| **Indicação de cliente** | Alto | **Pular Qualificação.** Vai direto para Discovery, SLA de contato em minutos, avisar quem indicou `[ESTUDO]` |
| **Indicação de parceiro** | Alto | Idem, com registro do parceiro para comissionamento |
| Inbound de fundo (pediu proposta/diagnóstico) | Médio-alto | SLA de 5 min; cadência quente de 4–7 toques |
| Inbound de topo (e-book, newsletter) | Baixo | **Não é MQL.** Nutrição até intent subir |
| Mídia paga / LP | Variável | Depende do Fit; formulário deve capturar verba de mídia |
| Evento / networking | Médio | Cadência manual, janela curta (intent decai rápido) |
| **Outbound / prospecção ativa** | Definido pelo Fit | Pipeline de cadência separado; nunca misturar métrica de outbound com inbound no mesmo relatório |

### 15.3 Pipeline de agência — comparação com os modelos encontrados

| Fonte | Etapas |
|---|---|
| Funil default do RD Station `[DOC]` | Sem contato → Contato feito → Identificação do interesse → Apresentação → Proposta enviada |
| Padrão que emerge do conteúdo de mercado `[BENCH-2]` | Lead qualificado → Discovery → Escopo → Proposta → Negociação → SOW assinado → Onboarding |
| Playbook de Tim Kilroy `[FRAMEWORK]` | Qualify → Discovery → Alignment → Proposal & Review → **Handoff** (5 gates, avanço por compromisso do comprador) |
| **Recomendado aqui** `[RECOMENDAÇÃO]` | Qualificado → Discovery → **Diagnóstico/Escopo** → Proposta → Negociação → Fechamento → *(pipeline 2)* Handoff/Onboarding |

**Diferenças de opinião entre os benchmarks — e como resolvo:**
- O default do RD Station é **orientado a atividade** ("Contato feito", "Apresentação"). O playbook de Kilroy é **orientado a decisão do comprador**. `[RECOMENDAÇÃO]` Fico com o segundo: etapa orientada a atividade permite que o vendedor "avance" um deal morto.
- Kilroy junta escopo dentro de "Alignment"; o padrão de mercado separa "Scope Defined". `[RECOMENDAÇÃO]` Separo, porque em agência o momento em que o cliente **dá acesso aos dados** é um compromisso real e observável — é um gate de qualidade excelente.

### 15.4 Pós-venda

| Fase | Momento | Objetivo | Gate |
|---|---|---|---|
| Passagem comercial→operação | ≤48h do Closed Won | Zerar o gap promessa↔entrega | Reunião realizada + campo `promessas_comerciais` lido |
| Kickoff com cliente | ≤5 dias úteis `[BENCH-2]` | Alinhar expectativa, prazo, KPIs | Ata + KPIs acordados registrados |
| Baseline | ≤7 dias | Acessos + números de partida | Sem baseline não há como provar resultado depois |
| Primeira entrega visível | ≤30 dias `[BENCH-2]` | Reduzir risco de churn precoce | Entrega aceita |
| Business review | 90 dias | Resultado na métrica do cliente | **Gatilho de pedido de indicação** `[ESTUDO]` |
| QBR | Trimestral | Identificar gap de serviço | Gera deal de expansão se houver gap |
| Renovação | D-60 do fim | — | Deal criado automaticamente |
| Churn | — | Aprender | Pesquisa de saída + win-back D+90 |

---

## 16. Anti-patterns

`[INFERÊNCIA]` / `[BENCH-2]` — priorizados por dano real:

| # | Anti-pattern | Sintoma observável | Correção |
|---|---|---|---|
| 1 | **Misturar lifecycle e pipeline** | Etapas tipo "MQL" dentro do pipeline de deals; cliente antigo que não consegue voltar ao topo | Separar em três eixos (§3) |
| 2 | **Etapa sem critério objetivo** | Duas pessoas discordam de onde o deal está | Um evento de saída observável por etapa, escrito |
| 3 | **Etapa orientada a atividade do vendedor** | "Apresentação feita", "Contato realizado" | Reescrever como compromisso do comprador |
| 4 | **Excesso de etapas** | >8 etapas; deals que pulam etapas sistematicamente | Fundir etapas que não mudam o coaching `[BENCH-2]` |
| 5 | **Sem SLA de primeiro contato** | Ninguém sabe a mediana de resposta | Medir p50/p90; alarme; `[ESTUDO]` maior alavanca disponível |
| 6 | **Sem motivo de perda, ou com 20 opções** | Relatório de perda inútil; "preço" com 60% | 6 opções + evidência em texto obrigatória `[BENCH-2]` |
| 7 | **Leads esquecidos** | Deals sem atividade há 30+ dias | Campo `próximo passo + data` obrigatório + alerta de 14 dias |
| 8 | **Sem ownership** | Deal sem dono, ou "todo mundo" | Um dono por registro, sempre |
| 9 | **Campos demais** | Campos com >50% de preenchimento vazio | Auditar trimestralmente; deletar o que ninguém filtra |
| 10 | **Automação demais** | Ninguém sabe por que o lead recebeu aquele e-mail | Limitar ao nível 1–2 (§9.2); documentar cada workflow |
| 11 | **CRM como agenda** | Só tarefa e contato; nenhum campo de diagnóstico | Tornar SPICED obrigatório na saída do Discovery |
| 12 | **Score único fit+intent** | Outbound e inbound brigam pelo mesmo número | Dois scores `[DOC]` |
| 13 | **Otimizar MQL em vez de receita** | Marketing bate meta e vendas não vende | Meta de marketing em pipeline/receita, não em leads `[FRAMEWORK]` |
| 14 | **Closed Won como fim do processo** | Nenhum registro do que foi prometido | Handoff como etapa com gate `[BENCH-2]` |
| 15 | **Confiar só em atribuição por software** | Indicação e boca a boca aparecem como "direto" | Campo autodeclarado obrigatório `[ESTUDO]` |
| 16 | **Copiar benchmark externo como meta** | "Nossa MQL→SQL tem que ser 39%" | Comparar com a própria série histórica (§0.3) |

---

## 17. Blueprint final — CRM de agência digital B2B

```
LIFECYCLE (empresa/contato)
  Subscriber → Lead → MQL → SQL → Opportunity → Customer → Evangelist   [+ Churned]
  Regra: só anda pra frente. Retrocesso = campo STATUS, nunca lifecycle.

STATUS (paralelo, livre)
  novo | enriquecido | em_cadencia | sem_resposta | nutricao | reciclado | desqualificado | reativado

PIPELINE 1 — NOVOS NEGÓCIOS (6 etapas, avanço por compromisso do comprador)
  1 Qualificado    ← aceitou conversa            → discovery agendada
  2 Discovery      ← reunião realizada           → dor + impacto confirmados
  3 Diagnóstico    ← deu acesso aos dados        → escopo + faixa de fee não rejeitados
  4 Proposta       ← proposta enviada            → feedback explícito
  5 Negociação     ← discutindo termos           → aceite verbal
  6 Fechamento     ← contrato enviado            → assinado  →→ CLOSED WON
     CLOSED LOST → motivo (6 opções) + evidência + data de reabordagem

PIPELINE 2 — ONBOARDING (0–90 dias)
  Passagem (≤48h) → Kickoff (≤5d) → Acessos+baseline (≤7d) → 1ª entrega (≤30d) → Review (90d)

PIPELINE 3 — EXPANSÃO / RENOVAÇÃO
  QBR trimestral → gap identificado → Proposta de expansão → Ganho
  Renovação criada em D-60 automaticamente

CRITÉRIOS
  MQL  = Fit ≥60 E Intent ≥50        (fit alto + intent baixo = outbound, NÃO é MQL)
  SQL  = SDR conversou + dor + interlocutor + reunião agendada
  Lost = 6 motivos, mutuamente exclusivos, com evidência textual

CAMPOS OBRIGATÓRIOS (o núcleo — 14 campos)
  Empresa : segmento | porte | verba_midia_mensal | maturidade_marketing | fit_score
  Contato : cargo | papel_no_comite | como_nos_conheceu | origem_utm | intent_score | opt_in_lgpd
  Deal    : fee_mensal | prazo_contrato | servicos_escopo | dor | impacto | decisor_economico |
            proximo_passo + data | motivo_perda + evidencia | promessas_comerciais

SCORING
  Fit (empresa, estático, com desqualificadores absolutos) × Intent (contato, com decaimento)

AUTOMAÇÃO (nível 1 primeiro — 6 workflows resolvem 80%)
  roteamento+task SLA | confirmação ao lead | criar deal no SQL | motivo de perda obrigatório |
  alerta de deal parado 14d | lembretes anti-no-show

RÉGUA
  D0 (≤5min, tel/WhatsApp) → D0 2ª/3ª → D+1 → D+3 → D+7 conteúdo → D+12 → D+16 break-up → nutrição
  Pós-venda: kickoff 5d → entrega 30d → review 90d + PEDIR INDICAÇÃO → QBR trimestral → renovação D-60

SLA
  1º contato ≤5 min [ESTUDO] | aceite MQL ≤24h | deal criado ≤1h | follow-up pós-call ≤24h |
  diagnóstico ≤7d | nenhum deal >14d sem próximo passo | passagem ≤48h | kickoff ≤5 dias úteis

MÉTRICAS (6 números)
  tempo mediano de 1ª resposta | MRR novo | win rate (com N) | CAC payback em meses de fee |
  NRR | % de receita nova vinda de indicação

HANDOFF
  MKT→SDR (fit+intent) | SDR→AE (dor+reunião) | AE→CS (promessas_comerciais + reunião ≤48h) |
  CS→Expansão (QBR) | CS→Indicação (D+90)
```

---

## 18. Resposta à pergunta final

> **Se você tivesse que desenhar hoje, do zero, o CRM de uma agência digital B2B com inbound + outbound, venda consultiva e contratos recorrentes — qual arquitetura e com que evidência?**

**Resposta curta:** um **M4 enxuto** — lifecycle de 7 estágios só-para-frente + status paralelo, **um** pipeline comercial de 6 etapas cujos gates são compromissos observáveis do comprador, dois scores separados (fit e intent), ~14 campos obrigatórios, 6 automações de nível 1, SLA de primeiro contato em minutos, motivo de perda com 6 opções e evidência, e **dois pipelines pós-venda** (onboarding e expansão/renovação). Não M3.

**As cinco decisões que mais importam e a evidência de cada uma:**

| Decisão | Evidência | Confiança |
|---|---|---|
| **SLA de primeiro contato em minutos, medido em p50/p90** | `[ESTUDO]` MIT/InsideSales: 5 min vs 30 min ≈ 21x na qualificação; média de mercado de 42h de primeira resposta em 2.241 empresas. O efeito é robusto mesmo que a magnitude atual seja menor. | **0,85** |
| **Indicação como origem de primeira classe, com pipeline e gatilho de pedido no D+90** | `[ESTUDO]` Hinge: 71% dos compradores de serviços profissionais acham fornecedor perguntando a alguém; ~48% do novo negócio por valor vem de referência. `[ESTUDO]` Refine Labs: ~90% de gap entre atribuição por software e autodeclarada — sem campo autodeclarado, você nem enxerga essa origem. | **0,80** |
| **Etapa de Diagnóstico/Escopo separada, com "deu acesso aos dados" como gate** | `[BENCH-2]` Convergência de que agência não vende produto fixo e precisa de etapa de escopo; `[FRAMEWORK]` tese de avanço por compromisso do comprador (Kilroy). | **0,70** |
| **Handoff formal com campo `promessas_comerciais` e pipeline de onboarding** | `[BENCH-2]` Churn de serviços B2B concentrado nos primeiros 90 dias, causado por gap promessa↔entrega; `[FRAMEWORK]` Bowtie dá peso simétrico ao pós-venda. ⚠️ Os números específicos de churn precoce vêm de fontes secundárias. | **0,60 no número, 0,85 na direção** |
| **Manter enxuto (6 etapas, 14 campos obrigatórios, 6 automações no dia 1)** | `[BENCH-2]` Falha de CRM estimada em 30–63%, com adoção como causa nº 1; `[BENCH-2]` recomendação convergente de 5–7 etapas. | **0,65 nos números, 0,90 na direção** |

**O que eu não sei e não vou fingir que sei:**
- `[NÃO ENCONTRADO]` Não existe estudo público com metodologia sólida sobre estrutura de CRM **especificamente em agências digitais**. Tudo que existe é conteúdo de fornecedor e consultoria. Toda a seção de agência deste relatório é **convergência qualitativa + inferência**, não evidência estatística.
- `[NÃO ENCONTRADO]` Nenhuma agência digital reconhecida publica o desenho real do seu CRM em detalhe auditável.
- Os números de conversão por etapa que circulam no mercado são incomparáveis entre empresas por diferença de definição, e não devem ser usados como meta.

---

## 19. Apêndice — conexão com o pipeline n8n existente neste repositório

`[INFERÊNCIA]` Este repositório já contém uma operação de prospecção outbound em n8n:

- `workflow-0-wpp-intake.js` — questionário conversacional por WhatsApp (segmento, localização, tem site, avaliação mínima) que dispara o Workflow A.
- `workflow-a-extracao-enriquecimento.js` — extração via Apify/Google Maps, normalização, gravação em Sheets, enriquecimento por agente Gemini, criação de **deal no HubSpot com stage `prospectado`**, teto de 500 leads/mês.
- `workflow-b-hubspot-status.js` — sincronização de status com HubSpot.

**Onde essa operação encaixa no blueprint** `[RECOMENDAÇÃO]`:

1. **Ela é uma fonte de origem `outbound`, não um pipeline comercial.** Hoje ela cria **deal** direto no HubSpot com stage `prospectado`. Isso mistura os eixos: um registro prospectado que ainda não teve nenhuma interação não é um negócio — é uma **empresa + contato com lifecycle = Lead**. `[DOC]` Criar deal cedo demais infla o pipeline, distorce win rate e ciclo de vendas.
   **Correção sugerida:** o workflow cria **Empresa + Contato** com `lifecycle = Lead`, `origem = outbound_google_maps` e `status = enriquecido`. O **deal só nasce na etapa 1 (Qualificado)**, quando o prospect aceitar uma conversa.

2. **O enriquecimento por Gemini deveria alimentar o Fit score,** não só texto livre. Extrair explicitamente: segmento normalizado, porte estimado, indício de verba de mídia (roda anúncio? tem pixel? tem site profissional?), maturidade de marketing. Esses são exatamente os campos obrigatórios da §7.1.

3. **O intake por WhatsApp já é o canal certo para o Brasil** `[BENCH-2]`, mas as conversas precisam ficar logadas no CRM — senão o histórico de interação vive fora do registro e o CRM vira agenda (anti-pattern #11).

4. **Falta o outro lado:** o pipeline atual resolve topo de funil outbound. Pelo que a pesquisa mostra `[ESTUDO]`, a origem com maior peso em serviços profissionais é **indicação** — que não tem nenhum workflow aqui. `[RECOMENDAÇÃO]` Um workflow simples de "pedido de indicação em D+90 do cliente" tem, plausivelmente, ROI maior que ampliar o volume de scraping.

5. **Teto de 500 leads/mês sem SLA de contato é risco.** `[ESTUDO]` Volume sem velocidade de resposta desperdiça a maior alavanca disponível. Antes de aumentar o teto, instrumentar o tempo mediano de primeiro contato.

---

## 20. Fontes

**Frameworks e documentação de produto**
- HubSpot — lifecycle stages (definições e comportamento de sincronização): https://knowledge.hubspot.com/object-settings/manage-how-lifecycle-stages-sync-between-objects · ⚠️ *acesso direto bloqueado neste ambiente; conteúdo obtido via síntese de busca*
- RD Station CRM — funil de vendas: https://www.rdstation.com/produtos/crm/vendas/funil-de-vendas/ · RD CRM para agências: https://www.rdstation.com/produtos/crm/solucoes/para-agencia-de-marketing/
- Salesforce Trailhead — oportunidades e path: https://trailhead.salesforce.com/content/learn/modules/leads_opportunities_lightning_experience/work-your-opportunities
- Forrester (ex-SiriusDecisions) — Demand Waterfall: https://www.forrester.com/blogs/meetthenewestsiriusdecisionsdemandwaterfall/ · ⚠️ *bloqueado*
- Forrester — AQL e lead scoring: https://www.forrester.com/blogs/the-aql-a-missed-opportunity-with-lead-scoring
- Winning by Design — The Bowtie Standard: https://winningbydesign.com/resources/research/bowtie-standard/ e https://winningbydesign.com/wp-content/uploads/2026/02/The-Bowtie-A-Proposed-Standard.pdf · ⚠️ *bloqueado*
- Winning by Design — SPICED (workshop PDF): https://winningbydesign.com/wp-content/uploads/2023/05/SPICED-Blueprints-Workshop.pdf
- MEDDICC — comparação com outros frameworks: https://meddicc.com/resources/meddicc-versus-other-qualification-frameworks-like-bant
- GitLab handbook — opportunity stages públicos: https://handbook.gitlab.com/handbook/sales/commercial/comm-sales-opp-stages/ · ⚠️ *bloqueado*

**Estudos e pesquisa**
- Oldroyd, McElheran & Elkington — Lead Response Management (MIT/InsideSales); base do "5 minutos / 21x". Referências secundárias consultadas: https://www.leadangel.com/blog/operations/lead-response-time/ e https://never-drop.com/blog/speed-to-lead/ · ⚠️ *fonte primária não acessada*
- Hinge Research Institute — How Buyers Buy Professional Services: https://hingemarketing.com/library/article/new_study_highlights_how_buyers_buy_professional_services · Referral Marketing: https://hingemarketing.com/blog/story/new-research-report-referral-marketing-for-professional-services-firms
- Hinge — High Growth Study 2026: https://hingemarketing.com/library/article/high-growth-study-2026-executive-summary
- Refine Labs — Hybrid Attribution Framework (620 conversões, 12 meses): https://www.refinelabs.com/article/hybrid-attribution-framework
- Ebsta × Pavilion — B2B Sales Benchmark Reports: https://www.joinpavilion.com/resource/2025-gtm-benchmarks-ebsta-pavilion e https://www.ebsta.com/wp-content/uploads/2023/02/2023-B2B-Sales-Benchmark-Report.pdf
- RSW/US — 2025 New Business Survey: https://www.rswus.com/survey/2025-rsw-us-survey-report-rolling-into-2026/ · ⚠️ *bloqueado*

**Prática de agência**
- Tim Kilroy — Agency Sales Playbook (5 estágios / 5 gates): https://timkilroy.com/agency-sales-playbook e https://timkilroy.com/playbooks · ⚠️ *bloqueado*
- Agency Management Institute — sales playbook: https://agencymanagementinstitute.com/the-secret-to-success-for-agencies-the-sales-playbook/
- Swydo — client onboarding / churn KPIs: https://www.swydo.com/blog/client-onboarding/ e https://www.swydo.com/blog/client-churn-kpis/
- Promethean Research — client retention rate: https://prometheanresearch.com/client-retention-rate/

**Secundárias `[BENCH-2]` (usadas apenas como direcional)**
- Lifecycle stages HubSpot (interpretação de parceiros): https://www.blendb2b.com/blog/hubspots-lifecycle-stages-explained · https://www.pedowitzgroup.com/blog/hubspot-lifecycle-stages-blog · https://www.pineriverdata.com/blog/hubspot-lifecycle-stage-quirks-fixes
- Fit vs engagement scoring: https://checkpointgtm.com/insights/2026-W07-fit-vs-engagement-scoring/ · https://thedigitalring.com/insights/how-to-implement-lead-scoring-in-hubspot-crm
- SLA marketing/vendas: https://www.pedowitzgroup.com/blog/how-to-write-a-sales-and-marketing-sla-that-both-teams-actually-respect · https://www.leandata.com/blog/lead-response-time/
- Motivos de perda: https://academy.leanlayer.com/resources/closed-lost-reasons-dont-let-sellers-grade-their-own-homework · https://www.saber.app/glossary/loss-reasons
- Reciclagem de leads: https://www.thegtmadvisor.com/blog/lead-lifecycle-management · https://www.revenueoperationsalliance.com/lead-stage-vs-lead-status-whats-the-difference/
- Cadência: https://www.apollo.io/insights/whats-the-ideal-cadence-for-a-multi-channel-outbound-sequence · https://www.outreach.ai/resources/blog/sales-cadence
- No-show: https://ziellab.com/post/sales-meeting-no-show-rate-b2b-revops-guide
- Número de etapas / forecast: https://forecastio.ai/blog/pipeline-forecasting · https://demandzen.com/define-sales-pipeline-stages-for-forecasting/
- Falha de adoção de CRM: https://www.lowcode.agency/blog/crm-implementation-failure-rate · https://www.superoffice.com/blog/50-crm-statistics/
- WhatsApp/CRM Brasil: https://www.socialhub.pro/relatorio-crm-whatsapp-brasil-2026/ · https://blog.ploomes.com/melhor-crm-com-whatsapp-no-brasil/
- Pipeline de agência: https://www.resonatehq.com/blog/sales-pipeline-examples · https://www.hq-digital.com/blog/how-to-set-up-deal-stages-in-hubspot-crm

---

## 21. Autoavaliação final

**Confiança global no relatório: 0,82.**

Decomposto:
- **Estrutura conceitual e arquitetura recomendada (§3–§9, §15–§17):** 0,88. Baseada em convergência forte entre fontes independentes e em comportamento documentado de produto.
- **Frameworks nomeados e suas definições (§2, §8.3):** 0,90.
- **Números específicos de benchmark:** 0,45. É o elo fraco e está marcado como tal em todo o documento.
- **Seção de agência digital:** 0,70 no desenho, 0,45 nos números. Não existe base estatística pública sobre CRM em agências — isso é uma lacuna do mercado, não desta pesquisa.

**O que eu faria para elevar a confiança acima de 0,90:** acessar diretamente as fontes primárias bloqueadas (HubSpot KB, Forrester, Winning by Design, RSW/US, GitLab handbook) e, principalmente, entrevistar 8–12 agências brasileiras sobre a configuração real do CRM delas. Essa segunda parte é a única forma de sair do território de inferência na seção de agências — e não existe substituto documental para ela.
