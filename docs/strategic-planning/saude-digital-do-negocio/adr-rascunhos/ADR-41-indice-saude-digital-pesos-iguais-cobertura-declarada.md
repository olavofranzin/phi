# ADR-41 — Índice de Saúde Digital do Negócio: pesos iguais provisórios, cobertura declarada, e superseção parcial do ADR-21

| | |
|---|---|
| **Status** | 🟢 **ACEITO** — aprovado pelo Olavo em **2026-09-25**. Publicado no DB `PHI™ — Decisões (ADR)`: [página no Notion](https://app.notion.com/p/3e6b65e5c72b8150857cea4596fb6ffe) |
| **Data** | 2026-09-25 |
| **Autor** | sub-chat da reformulação da Saúde Digital (branch `claude/exciting-bardeen-ozheq6`) |
| **Decisor** | **Olavo** |
| **Tipo** | Arquitetura |
| **Supersede** | 🔴 **parcialmente o ADR-21** — só a **tabela de pesos**. Ver §6 |
| **Base factual** | `DICIONARIO-DE-INDICADORES-v0.md` (92 indicadores, canônico) · `Metodologia Estatística…md` · `Análise Estatística.md` · `fundamentos-presenca-digital.md` · substrato (`2026-09-25-substrato-estatistico-do-phi-brief.md`) |

> ⚠️ **Numeração — corrigido na publicação.** O título diz **41** porque 41 estava livre na sequência de rascunhos em git. **Não há número para escolher no Notion:** o campo `Número ADR` daquela DB é **`auto_increment_id` — de sistema, somente leitura**. O Notion atribui sozinho, e é por isso que **título e número não batem naquela DB desde antes deste ADR** (a página titulada *"ADR-21"* tem `Número ADR = ADR-25`; a *"ADR-22"*, 26). Os rascunhos ADR-37 a ADR-40 existem só em git.
>
> 🔴 **Isto é um defeito de governança de numeração, não uma escolha deste ADR** — e não é consertável escolhendo melhor no momento de publicar, porque o campo não aceita escrita. Consertar exige um campo de número editável, ou parar de pôr número no título. **Fica registrado; não é escopo daqui.**

---

## 1. Contexto

O material de fundamentos trazido pelo Olavo em 25/09 descreve um índice de saúde digital com 8 pilares. A leitura da casa revelou que **essa decisão já havia sido tomada**: o **ADR-21** (`Aceito` em **2026-06-11**) promoveu o PHI de score de campanha a **Índice de Saúde Digital**, com 6 pilares e pesos — Paga **35** · Funil 20 · Orgânico 15 · Social 10 · Reputação 10 · Dados/Exp 10.

**Ele nunca foi construído.** Três meses e meio depois, nenhum dos cinco pilares novos existe.

E o levantamento produziu **quatro tabelas de peso incompatíveis** na casa — duas delas dentro do mesmo documento:

| | Origem | Estrutura | Pesos |
|---|---|---|---|
| **A** | ADR-21 (`Aceito`) | 6 pilares | 35 · 20 · 15 · 10 · 10 · 10 |
| **B** | `Análise Estatística` §Score recomendado | 7 dimensões | 20 · 15 · 15 · 10 · 10 · 20 · 10 |
| **C** | `Análise Estatística` §Índice de saúde = `fundamentos` | 8 pilares | 10 · 15 · 10 · 10 · 10 · 15 · 20 · 10 |
| **D** | `Metodologia Estatística` | 8 pilares | **iguais** |

**A `Metodologia` abre desqualificando A, B e C como ponto de partida:** *"Não é recomendável começar atribuindo pesos 'intuitivos' e simplesmente somando notas."*

### 1.1. 🔴 Por que o ADR-21 não saiu do papel — a causa raiz desta decisão

**Ele atribuiu peso a fonte que não existia.**

| Pilar do ADR-21 | Peso | Fonte declarada | Estado em 25/09, 3½ meses depois |
|---|---|---|---|
| Orgânico | **15** | **GSC** | 🔴 Search Console **nunca foi ligado a nada** |
| Social | **10** | IG Business Discovery | 🔴 **nenhuma credencial de Instagram** na casa |
| Reputação | 10 | GBP | 🟡 tabela `t28_gbp_daily` existe e está **vazia** (cota) |
| Funil | 20 | GA4, Clarity | 🟢 **tem dado desde 14/09 — e nenhum leitor** |
| Dados/Exp | 10 | Log de Otimizações | 🟡 tem writer; **falta a metade de verificação** (ADR-22) |
| Mídia Paga | 35 | Google/Meta Ads | 🟢 funciona |

**25 dos 100 pontos foram atribuídos a pilares sem fonte alguma.** Um índice assim não tem primeiro passo possível: não se consegue calcular nem uma vez. **Foi por isso que ficou parado — não por falta de prioridade.**

> 🔴 **Esta é a lição que o ADR precisa transformar em regra, e é a razão de ele existir.** Escolher pesos novos sem corrigir isso repetiria junho com outros números.

---

## 2. Decisão

### D1 — O PHI é o Índice de Saúde Digital do Negócio; o PHI·Mídia é o motor de **um** pilar

**Revalida o ADR-21 nisto.** Não é mudança: é confirmação do que já era lei e estava esquecido.

- **"Saúde Digital do Negócio"** = o índice do negócio, 0–100, por `(client_id, período)`.
- **"PHI·Mídia"** = o `phi_value`, por `(client_id, platform, campaign_id, date)`.
- 🔴 **Nunca "Saúde Digital" sozinho** — o termo isolado é do setor médico, e a agência prospecta clínicas e dentistas.
- Artefatos técnicos `phi_*` mantêm os nomes (política *going-forward* do ADR-21, preservada).

### D2 — **Pesos iguais entre pilares**, declarados provisórios

Todos os pilares entram com **peso idêntico** até existir dado que justifique diferença. Com 8 pilares, 12,5 cada.

**Isto não é escolher a candidata D. É escolher uma regra que adia a escolha de peso sem adiar o produto.**

### D3 — 🔴 **Cobertura declarada: pilar não medido NÃO é zero e NÃO entra na média**

Todo cálculo do índice publica, junto com a nota:

```
índice = <nota>   ·   cobertura = <pilares_medidos> de <pilares_totais>
pilares não medidos: <lista nominal>
```

**O peso de um pilar não medido é redistribuído entre os medidos, e a ausência é declarada — nunca estimada, nunca zerada.**

> **Por quê:** é o **M4** (*"zero nunca é ausência"*) subido da coluna para o índice. Sem isso, um cliente sem Instagram medido recebe nota baixa por **falta de dado**, não por falta de saúde — e o índice deixa de ser medida.

### D4 — Agregação: **aritmética dentro** do pilar, **geométrica entre** pilares

| Nível | Regra | Por quê |
|---|---|---|
| **Dentro do pilar** | média aritmética ponderada | indicadores próximos podem se compensar moderadamente |
| **Entre pilares** | **média geométrica ponderada** | impede que um pilar excelente esconda outro crítico |

> ⚠️ **Isto NÃO reescreve o `phi_value`.** O `phi_value` é **um indicador dentro de um pilar** (`SD-AQU-08` do dicionário). A soma ponderada dos seus 6 componentes (MIV/MAS/TSS/FIS/ES/RS) **continua como está** — a `Metodologia` endossa aritmética dentro do pilar. A geométrica se aplica **à agregação do índice, que ainda não existe.**
>
> **Consequência prática: nada que está no ar precisa ser reescrito por causa do D4.** Era o item que parecia mais caro e é o mais barato.

### D5 — Normalização por **distância à meta com limites fixos**. Percentil da base é **proibido**

Para indicador positivo: `z = 100 × clip((x − L) / (T − L), 0, 1)` · negativo: `z = 100 × clip((U − x) / (U − T), 0, 1)`
onde `L` = piso crítico, `T` = meta saudável, `U` = limite ruim.

🔴 **Percentil dentro de coorte é proibido como normalização do índice**, porque *"uma empresa não muda de nota apenas porque novos concorrentes entraram na base"*.

> ✅ **E é isto que mantém o `potencial_comercial` separado**, por método e não por opinião: ele usa **rank percentil dentro da `Searchstring`** — o que o D5 proíbe. **Os dois scores continuam sendo coisas diferentes,** como o `CLAUDE.md` já avisava.

### D6 — **Falha crítica é alerta, não desconto**

Sem controle do domínio, da conta de anúncios ou do rastreamento, o índice **não sofre desconto na média**: emite **alerta independente** e a classe vira, por exemplo, *"72 — atenção crítica em governança"*.

### D7 — 🔴 **Peso só se atribui a pilar com fonte** — a regra que impede repetir junho

> **Um pilar só recebe peso se tiver ao menos UM indicador com (a) dado já em produção, ou (b) fonte contratada e credencial existente.**
>
> **Pilar sem fonte entra na estrutura com peso ZERO e rótulo "não medido"** — visível no índice, per D3, e **sem nota**.

**Consequência imediata, aplicando ao dicionário:**

| Pilar | Entra com peso? | Por quê |
|---|---|---|
| **Experiência digital** | ✅ **sim** | 7 indicadores com dado (`t28_clarity_daily` · `t28_ga4_landing`) |
| **Aquisição** | ✅ **sim** | 11 com dado (`raw_campaign_data` · `t28_campaign` · GA4 orgânico) |
| **Conversão** | ✅ **sim** (parcial) | 7 com dado — a fatia de campanha e de site |
| Visibilidade · Reputação | ⬜ **não ainda** | colunas existem, **tabela vazia por cota** — viram ✅ quando a cota do GBP for destravada |
| Presença e infraestrutura | ⬜ **não ainda** | só de lead |
| Redes sociais e conteúdo | ⬜ **não** | credencial por cliente inexistente |
| **Conversão e atendimento** (a parte de atendimento) | ⬜ **não** | **10 de 10 indicadores inexistentes** — e o dado não está na agência |
| Dados e governança (do cliente) | ⬜ **não ainda** | maioria ☑, coletável por auditoria |

**O índice v0.1 nasce com 3 pilares medidos de 8, e diz isso na cara.**

### D8 — Nome enquanto os pesos forem provisórios: **"Índice Experimental de Saúde Digital do Negócio"**

Com metodologia publicada, pesos transparentes e aviso de que os benchmarks serão recalibrados conforme a base crescer. *"A versão comercial inicial não precisa fingir precisão científica que ainda não possui."*

### D9 — Toda nota carrega evidência

Nenhum ponto é atribuído sem: **evidência observada · fonte · período · força de evidência (A/B/C/D, e `D` nunca sustenta certeza) · problema · impacto (marcado como hipótese quando for) · prioridade · responsável · próxima ação**.

### D10 — Entrada de pilar por **gatilho**, não por data

Um pilar entra quando **a condição do D7 for satisfeita** — não numa data de calendário. *Tarefa sem data apodrece; gatilho dispara sozinho quando a condição acontece.*

| Pilar | Gatilho de entrada |
|---|---|
| Visibilidade · Reputação | **a cota do GBP ser destravada** e `t28_gbp_daily` receber a 1ª linha |
| Presença e infraestrutura | auditoria de ativos existir como procedimento |
| Conversão e atendimento | 🔴 **decisão pendente** — ver §4 |
| Redes sociais e conteúdo | credencial de Instagram por cliente |

---

## 3. Invariantes S1–S6 — não mudam sem novo ADR

Numerados **S** (Saúde Digital) para não colidir com **M1–M12** (Mídia) nem **I1–I11** (Prospecção).

| # | Invariante |
|---|---|
| **S1** | 🔴 **Pilar não medido nunca é zero.** Extensão do **M4** para a camada do índice |
| **S2** | **O índice publica a própria cobertura.** Nota sem cobertura ao lado é nota incompleta |
| **S3** | 🔴 **Peso só para pilar com fonte** (D7). Peso sem fonte foi o que matou o ADR-21 |
| **S4** | **Normalização por distância à meta com limites fixos.** Percentil de coorte proibido |
| **S5** | **Falha crítica é alerta, não desconto na média** |
| **S6** | **Toda nota carrega evidência, fonte, período e força de evidência** |

---

## 4. O que este ADR **NÃO** decide

| # | Em aberto | De quem é |
|---|---|---|
| **1** | 🔴 **Os pesos finais.** Só saem com base rodando + análise de sensibilidade comparando os esquemas | Olavo, depois |
| **2** | 🔴 **Se o pilar "Conversão e atendimento" é do PHI ou do `Board Agência`.** O dado mora no WhatsApp e na agenda do cliente — **[DEDUZO] é procedimento antes de ser software** | Olavo |
| **3** | Se o **Raio-X de Saúde Digital** vira produto de entrada (o que cobriria o item 2 e forneceria a amostra de calibração). **É decisão comercial, não de arquitetura** | Olavo |
| **4** | O `volume_suficiente` — ⚠️ **é produção e tem ADR próprio (ADR-29 D1). Este ADR não o toca** | Olavo |
| **5** | O `criativo_score_operacional` e os benchmarks hardcoded do `sw metricas anuncios`: entram no dicionário, são realinhados ao YAML, ou o score é aposentado? | Olavo |
| **6** | A estrutura nominal dos pilares (6 do ADR-21 × 7 da B × 8 da C) — **o D2 torna a escolha menos urgente**, porque com pesos iguais a diferença é de agrupamento, não de nota | Olavo |

---

## 5. Alternativas consideradas

| # | Alternativa | Por que foi rejeitada |
|---|---|---|
| **1** | **Revalidar os pesos do ADR-21** (Paga 35) | 25 dos 100 pontos vão para pilares sem fonte. **É o estado que já provou não produzir nada em 3½ meses** |
| **2** | **Adotar a tabela C** (a do material novo, Conversão 20) | Move o peso para o pilar de que a casa tem **zero** indicadores. Índice ficaria com 20 pontos permanentemente não medidos, e a `Metodologia` chama esses pesos de intuitivos |
| **3** | **Adotar a tabela B** | Mesma objeção da 2, e ela conflita com a C **no mesmo documento** — adotar uma sem explicar a outra deixaria contradição registrada |
| **4** | **Esperar a validação estatística completa antes de publicar qualquer índice** | A `Metodologia` pede piloto com **30 a 50 empresas auditadas por dois auditores**. A agência tem **1 cliente com 2 campanhas**. Esperar = nunca começar |
| **5** | **Pilar não medido entra como zero** | 🔴 **rejeitada com força:** faria o índice punir ausência de dado como se fosse ausência de saúde. É o **M4** quebrado na camada mais visível do produto |
| **6** | **Só média aritmética entre pilares** (mais simples de explicar) | Permite compensação total: conteúdo excelente esconderia atendimento crítico. É o oposto da ideia de saúde sistêmica |

---

## 6. O que acontece com o ADR-21 — superseção **parcial**, com banner

🔴 **O ADR-21 NÃO é aposentado nem apagado.** Ele acertou mais do que errou.

| O que **permanece** do ADR-21 | O que este ADR **supersede** |
|---|---|
| ✅ o PHI é o índice amplo; PHI·Mídia é o pilar de mídia paga | 🔴 **a tabela de pesos** (35 · 20 · 15 · 10 · 10 · 10) → **pesos iguais provisórios** (D2) |
| ✅ a política *going-forward* (artefatos `phi_*` mantêm nome) | 🔴 a atribuição de peso a pilares sem fonte → **D7/S3** |
| ✅ o fundamento na IA Cognitiva (janela estatística, sinal vs ruído, multiobjetivo, experimentação) | |
| ✅ a escala CRITICAL / WARNING / GOOD / EXCELLENT | |

**Procedimento, na aprovação (R2 — o histórico ganha banner, não é apagado):**

1. Pôr **banner de HISTÓRICO** no topo do ADR-21 no Notion, apontando para este ADR e dizendo **o que foi superseado e por quê** — *"atribuiu peso a fontes que não existiam; 25 dos 100 pontos ficaram sem primeiro passo possível"*.
2. **Não alterar o corpo** do ADR-21. Ele é o registro do raciocínio.
3. Registrar no `Reavaliar Quando` do ADR-21 que a reavaliação **ocorreu** em 25/09.

> ✅ **Executado em 2026-09-25, na aprovação.** Confere-se lendo a página do ADR-21 (`37db65e5-c72b-814b-b3c1-eb6b8ceab705`), não este parágrafo:
>
> | Passo | Estado | Onde se confere |
> |---|---|---|
> | 1. Banner de HISTÓRICO no topo do ADR-21, apontando para cá e dizendo o que caiu e por quê | ✅ feito | primeiro bloco da página do ADR-21 |
> | 2. Corpo do ADR-21 **não alterado** | ✅ preservado | o conteúdo abaixo do banner é o de 2026-06-11 |
> | 3. `Reavaliar Quando` do ADR-21 registra que a reavaliação **ocorreu** em 25/09 | ✅ feito | propriedade `Reavaliar Quando`, que agora começa com *"✅ OCORREU EM 2026-09-25"* — o gatilho original ficou preservado no mesmo campo |
> | 4. `Status` do ADR-21 permanece **Aceito** | ✅ de propósito | a superseção é **parcial**: só a tabela de pesos caiu |

---

## 7. Consequências

**Positivas**

- ✅ **O índice passa a ter primeiro passo possível.** 3 pilares calculáveis **hoje**, sem coleta nova.
- ✅ **Os 17 indicadores que escrevem sem leitor ganham leitor — e o leitor é o índice.** O **M11** é pago sem trabalho novo de coleta: não é escopo novo, é dívida existente quitada.
- ✅ **Nenhuma decisão de peso fica travada** esperando dado que não existe.
- ✅ **Nada que está no ar precisa ser reescrito** (ver nota do D4).
- ✅ A separação `phi_value` × `potencial_comercial` ganha **fundamento estatístico** (D5), não só aviso em caixa alta.
- ✅ O `S3` dá um teste objetivo para futuras propostas de pilar: **"tem fonte?"**

**Negativas / atenção**

- ⚠️ **Pesos iguais são estatisticamente ingênuos**, e a `Metodologia` reconhece: pesos de especialista têm viés, pesos estatísticos conflitam com a teoria. **Iguais é o menos errado para o piloto, não o certo.**
- ⚠️ **Um índice com cobertura 3/8 é frágil como argumento comercial.** Mitigação: o D8 (nome experimental) e a declaração de cobertura transformam a fragilidade em transparência — mas **é fragilidade real.**
- 🔴 **O pilar mais pesado de duas candidatas segue não medido**, e este ADR não resolve — só declara (§4 item 2).
- ⚠️ **Redistribuir peso entre pilares medidos (D3) muda a nota quando um pilar entra.** A série histórica precisa gravar **quais pilares entraram na conta** em cada data, senão a comparação temporal mente. **[DEDUZO] isso é requisito de schema, e precisa estar no ADR de construção.**
- ⚠️ A média geométrica **não aceita zero** — exige piso técnico ou regra de veto explícita. O **D6** resolve por veto/alerta, mas **o piso precisa ser escrito na spec de construção.**

---

## 8. Reavaliar quando

- **A cota do GBP for destravada** → Visibilidade e Reputação entram; recalcular cobertura.
- **Houver ~30 clientes ou auditorias** com índice calculado → rodar sensibilidade e **substituir pesos iguais por pesos com evidência** (é o gatilho do D2).
- **A decisão do §4 item 2** sair (atendimento é do PHI ou da operação).
- **Qualquer pilar novo for proposto** → aplicar o **S3** antes de discutir peso.
- **Se a média geométrica se mostrar dura demais na prática** (cliente saudável em 7 pilares e crítico em 1 recebendo nota que ninguém aceita) → reavaliar o D4, **com o dado na mão, não por impressão**.

---

## 9. Conexões

- **ADR-21** — superseado parcialmente (§6). O que permanece está na tabela da esquerda.
- **ADR-22** (loop alerta→tarefa→Log) — 🟢 **é o `SD-GOV-07`**, o indicador de *"a orientação funcionou?"*. A metade de escrita existe; **a de verificação é o que falta** para o pilar Dados e governança ter conteúdo.
- **ADR-29** (destino do contract T28) — as tabelas `t28_*` são a fonte física de quase todo indicador 🟢. ⚠️ **Este ADR não toca o `volume_suficiente` (D1 de lá).**
- **ADR-37 / ADR-38** — writers canônicos e identidade neutra: **o piso sobre o qual qualquer pilar é mensurável.** Não são um pilar; são a condição de todos.
- **ADR-39 / ADR-40** — em execução. 🔴 **Devem seguir:** o ADR-39 conserta a entrada de cliente, de que **qualquer** versão deste índice precisa. **O sub-chat que os executa precisa ser avisado de que o calendário de 30/11 foi destravado.**
- **ADR-012** — este documento é rascunho em git justamente por causa dele.
- **`benchmarks-canonicos.yaml`** — a hierarquia de consulta (*percentis da própria conta > YAML > estratégia > conceito*) é compatível com o **D5**: a 1ª régua é a história do próprio cliente, que é distância à meta própria.
- **`CONTRATO-PHI.md`** — os **M1–M12** permanecem. Os **S1–S6** são a camada do índice, acima deles.

---

## 10. Como verificar esta decisão

| O que | Como se confere |
|---|---|
| Os pesos do ADR-21 e sua data | página Notion `37db65e5-c72b-814b-b3c1-eb6b8ceab705`, `Status: Aceito`, `Data da Decisão: 2026-06-11` |
| Que o GSC nunca foi ligado | `grep -ri "search console" docs/` → 1 ocorrência, em `pesquisa-trafego-pago.md`, como recomendação |
| Que `t28_clarity_daily` e `t28_ga4_landing` têm dado | `CONTRATO-PHI.md` §4.1 (*"✅ escreveram em 14/09"*) · smoke `11755` no `ESTADO-DO-PROJETO.md` |
| Que elas não têm leitor | mesma tabela, coluna *"Consumidor declarado"* |
| A contagem de indicadores por pilar | `DICIONARIO-DE-INDICADORES-v0.md` §3 e o placar |
| As regras de método (D4, D5, D6) | `Metodologia Estatística…md` §Modelo recomendado e §Escolha recomendada |
| 🔴 **O que NÃO foi verificado** | **nenhuma query no BigQuery.** A afirmação *"tem dado"* vem de as-built documentado, não de medição deste sub-chat. **Antes de construir, confirmar com query** (R6) |

**Confiança na análise que sustenta o ADR: 0,86.** **Confiança em que esta é a decisão certa: não é minha para dar** — o D2, o D3 e o D7 são propostas; o Olavo decide. O ponto mais frágil é a consequência negativa nº 2: **um índice com cobertura 3/8 pode não servir comercialmente**, e isso é julgamento dele, não meu.
