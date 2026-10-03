# Resultado — Entrevista Estratégica da Prospecção

| | |
|---|---|
| **Status** | ✅ **CONCLUÍDO** — entendimento comum confirmado pelo Olavo em 2026-09-15 |
| **Brief** | `docs/handoff/2026-09-15-entrevista-estrategica-prospeccao-brief.md` |
| **Plano atacado** | `docs/strategic-planning/prospeccao/PLANO-ENTREGA-FINAL-PROSPECCAO.md` (§1–§12) |
| **Método** | 12 perguntas em 3 rodadas (skill `grilling`), em texto — preferência registrada do Olavo |
| **Registro R3** | Notion, DB *PHI — Registro de Execuções (Sub-chats)* |
| **Papel** | Entrevista + análise + rascunho. **Nada executado.** A arquitetura do plano segue com o chat-mãe |

> **Leitura feita antes de perguntar (R7):** PLANO §1–§12 · entrevista independente (resultado) ·
> `catalogo-produtos-servicos.md` · `plano-operacional-agencia-checklist.md` ·
> `client-knowledge-pack.md` · `decisao-substituicao-crm-hubspot-para-odoo.md` ·
> `DEFINICAO-DE-PRONTO-PHI-V1.md` (§1, §4) · `ESTADO-DO-PROJETO.md` (§1, §7) ·
> `pesquisa-jornada-lead-crm-agencias.md` (§1) · `2026-09-14-leitura-pesquisa-gbp-impacto-no-score.md`
> (fatores de ranking) · `planejamento-midia-paga-pme-brasil-2023-2026.md` (busca dirigida, não integral).

> ✅ **Correção de registro (R6):** o §6 do PLANO diz que a skill `grill-me` "não existe". Em 2026-09-14
> foram instaladas **`grill-me`** e **`grilling`** (`~/.claude/skills/`). Esta entrevista rodou com `grilling`.

---

## 1. As premissas implícitas — e o ataque

### 1.1 A lista

| # | O plano assumia, sem defender | O que o próprio repositório dizia | Destino na entrevista |
|---|---|---|---|
| **P1** | prospecção ativa é o canal certo | `pesquisa-jornada-lead-crm-agencias.md` §1.10: **71%** dos compradores de serviço profissional acham fornecedor **perguntando a alguém**; ~**48%** do novo negócio por valor vem de **indicação**. O plano não tinha nenhuma linha sobre indicação | **Defendida** (Q1): segue canal principal, e a indicação ganha estrutura (Q5) |
| **P2** | o lead quer um diagnóstico/score | o score é a régua **nossa**; o dono quer cliente | **Substituída** (Q6): o mini mostra falhas em clientes perdidos + concorrentes, **sem score** |
| **P3** | "R$ 500" é um preço | o catálogo tem 4 serviços e **nenhum tem preço** ("faixa de ticket: detalhar depois"). R$ 500 não era preço **de nada** | **Substituída** (Q2, Q12): R$ 500/mês = **gestão do GBP**, com fidelidade |
| **P4** | o PHI é "diferencial invisível" (Fase 1, `ESTADO-DO-PROJETO` §1) | o mini-diagnóstico como isca (N9) já tornava o PHI **visível** — antecipa a Fase 2 sem ninguém ter decidido | **Substituída** (Q3, Q7): o PHI vira **vitrine** na prospecção e **direção de produto** na entrega |
| **P5** | vale qualquer setor; a saúde já tinha case | ~~Niti e Clínica Guerra seriam clientes da saúde~~ | ❌ **Hipótese minha desmentida** (Q4): **não há cliente na saúde**. São deals de teste |
| **P6** | o gargalo é comercial | dimensionou-se quanto **vender**, não quanto **entregar** (§11.3-c) | **Substituída** (Q7, Q9): entrega manual no início, automação por **gatilho** |
| **P7** | primeiro a máquina, depois a venda | 13 rodadas de planejamento, **zero** lead fechado, base de aprendizagem **vazia** (§3) | **Aberta** — a oferta GBP é vendável com pouca máquina; ver §3, conclusão 7 |
| **P8** | "dar muito certo" = mais clientes | 50 clientes × R$ 500 com uma pessoa só é armadilha operacional | **Respondida** (Q7): crescer com **software**, não com horas |
| **P9** | o que medimos por fora (nota, fotos, PageSpeed) importa ao lead | ninguém validou; as 6 dimensões do score nem têm definição escrita | **Mitigada** (Q6, Q10): falha traduzida em cliente perdido e placar contra concorrentes |

### 1.2 Ataque 1 — P1: a máquina foi desenhada para o canal minoritário

A pesquisa que **já está no repositório** diz que agência se vende por indicação, não por funil. O plano
montou uma máquina inteira (score, fila, cadência, agentes) para o outro canal, sem comparar os dois.

**Defesa do Olavo (Q1):** a prospecção ativa segue como canal principal — **ainda não há clientes em
número suficiente para indicação**. É uma defesa válida: indicação precisa de carteira. **Mas a premissa
deixa de ser implícita:** a indicação passa a ter regra (Q5), e o canal de cada cliente fica registrado
para comparação (N5, já decidido).

### 1.3 Ataque 2 — P3: R$ 500 em anúncios é isca que morde a própria agência

`planejamento-midia-paga-pme-brasil-2023-2026.md`: abaixo de **~R$ 2.000/mês de verba**, uma única
campanha de conversão consome tudo. Um cliente de R$ 500 em gestão de anúncios, com verba pequena, tende
a ter resultado fraco → cancela → vira **prova social negativa** na mesma cidade que estamos prospectando.

**Substituição do Olavo (Q2):** o produto de entrada é **gestão do GBP** — entrega leve, controlável, e é
exatamente o que o diagnóstico mostra de fraco. Anúncios viram o **segundo passo** (§10.6).

> ⚠️ **O ataque 2 volta pela porta da Q12** (campanha teste dentro dos R$ 500) — ver risco **RE3**.

### 1.4 Ataque 3 — P4: o "PHI invisível" já tinha deixado de ser

A estratégia de 3 fases diz: Fase 1 **invisível**, Fase 2 **produto**. Usar o enriquecimento como
mini-diagnóstico para o lead (N9) é mostrar o PHI — é Fase 2 entrando pela porta dos fundos. **Não é
erro; era decisão não tomada.** Agora está tomada (Q3, Q6, Q7).

---

## 2. Perguntas e respostas (na íntegra)

### Rodada 1

**Q1 — Qual é o papel da prospecção ativa?**
A pesquisa do repositório diz que 71% acham fornecedor por indicação e ~48% do negócio novo vem dela.
Opções: A) canal principal, o plano segue · B) canal de teste, lado a lado com indicação simples (clientes
atuais + 2–3 parceiros locais) · C) indicação e parceria primeiro, prospecção depois.
Recomendado: B.
> **Olavo:** *"1A (ainda não temos clientes o suficiente para um programa de indicação, mas devemos
> estruturar um sim)"*

**Q2 — O que exatamente se vende por R$ 500?**
Opções: A) gestão do GBP (`SVC-GBP`) — entrega leve, é o que o diagnóstico mostra · B) gestão de anúncios
com verba à parte — risco de verba pequena → resultado fraco → cancelamento · C) site parcelado ·
D) pacote pequeno.
Recomendado: A.
> **Olavo:** *"2A"*

**Q3 — O diagnóstico aparece para o lead ou fica escondido?**
Opções: A) aparece, grátis e com a marca — vira vitrine; exige padrão de produto · B) escondido, só
prepara a conversa · C) aparece, mas pago — vira o produto de entrada.
Recomendado: A, com a consequência escrita (o "PHI invisível" deixa de valer na prospecção).
> **Olavo:** *"3A (depende, se for um mini diagnóstico pode ser grátis, diagnóstico completo apenas para
> cliente)"*

**Q4 — Os clientes da saúde contam na escolha de setores?**
Opções: A) começar pela saúde (case + linguagem; atenção às regras de CFM/CFO) · B) pesquisa neutra +
critério S5 "já temos case no setor" · C) ignorar — 2 clientes não fazem padrão.
Recomendado: B.
> **Olavo:** *"4C (não temos nenhum cliente na área da saúde e o GBP pode ser um bom quebra barreira
> porque não será "publicidade""*

### Rodada 2

**Q5 — Quando começar a estruturar a indicação?**
Opções: A) no gatilho do 3º cliente (mesmo momento do CK5) · B) por tempo: todo cliente recebe o pedido
após 60 dias com resultado visível · C) já: campo "como nos conheceu?" no Odoo desde o 1º lead, + A.
Recomendado: C.
> **Olavo:** *"5B"*

**Q6 — O que entra no mini-diagnóstico grátis?**
O código atual (`code-normalizer-places.js`) já guarda os **concorrentes da mesma busca** do Maps.
Opções: A) as 3 falhas mais visíveis traduzidas em clientes perdidos, sem score · B) score + barras das
dimensões · C) você contra os 3 concorrentes da mesma busca (nota, avaliações, fotos, horário).
Recomendado: C + A.
> **Olavo:** *"6A + C"*

**Q7 — E se o GBP a R$ 500 der muito certo?**
Opções: A) teto declarado de clientes (ex.: 15 = R$ 7.500/mês); ao atingir, fecha a entrada ou sobe o
preço · B) gatilho para terceirizar a entrega · C) automatizar a entrega de GBP com o PHI — a carteira
cresce com software.
Recomendado: A agora, C como direção.
> **Olavo:** *"7C"*

**Q8 — Por que pagar R$ 500 à Franz pelo GBP?**
O GBP é grátis e o dono pode mexer sozinho. Não há preço de concorrente no repositório.
Opções: A) "feito para você" — vende tempo · B) "resultado medido" — todo mês, ligações, rotas e posição
contra os 3 concorrentes · C) "porta de entrada" — GBP hoje, anúncios depois.
Recomendado: B, com A no discurso.
> **Olavo:** *"8B + A"*

### Rodada 3

> **Fatos verificados antes da rodada:** (1) o Google declara **só 3** fatores de ranking local —
> relevância, **distância**, destaque — e a distância ninguém controla
> (`2026-09-14-leitura-pesquisa-gbp-impacto-no-score.md`); (2) **não há, no repositório, fonte para
> "ligações e pedidos de rota"** — o C2 usa Apify (visão de fora); esses números só saem de dentro do
> perfil, com acesso do cliente.

**Q9 — A 7C fura o escopo da v1** (`DEFINICAO-DE-PRONTO` §4 corta "empacotar o PHI como produto").
Opções: A) entrega manual nos primeiros clientes; automação começa num gatilho (ex.: 3º cliente de GBP =
CK5); fora da v1, com data para entrar · B) entra na v1 trocando algo (candidato: itens 11–12) ·
C) depois de 30/11, sem gatilho.
Recomendado: A.
> **Olavo:** *"9A"*

**Q10 — O que a Franz promete ao cliente de GBP?**
Como a distância não se controla, prometer "mais clientes" ou "1º lugar" é prometer o que o Google não
garante. Opções: A) promete o trabalho (perfil completo, avaliações respondidas, fotos e posts) ·
B) promete o placar mensal contra 3 concorrentes · C) promete resultado (ligações/rotas +X%).
Recomendado: A + B.
> **Olavo:** *"10A + B (iremos sempre que possível, seja na descrição da empresa, nas respostas, utilizar
> palavras-chaves com alto volume no setor melhorando a descoberta do perfil, auxiliando para que ele
> apareça nas recomendações das ferramentas de IA)"*

**Q11 — A oferta GBP deixa parte do plano sem uso?**
Item 11 (descobrir perfis) segue útil para o quebra-gelo; item 12 (analisar redes) servia a outra oferta.
Opções: A) item 12 sai da v1, item 11 fica · B) os dois ficam · C) os dois saem (checagem manual).
Recomendado: A.
> **Olavo:** *"11B (poderemos acrescentar como "bônus" a entrega da saúde digital do cliente, preparando
> assim para podermos oferecer um upsell)"*

**Q12 — No 4º mês, o cliente paga por quê?** ("o perfil já está arrumado, para que pagar?")
Opções: A) implantação cobrada uma vez + mensalidade menor · B) R$ 500/mês com fidelidade mínima (ex.: 6
meses) · C) R$ 500/mês sem fidelidade — o placar segura.
Recomendado: A.
> **Olavo:** *"12B (poderemos inclusive destinar parte deste valor para uma campanha teste que poderá
> fazer o cliente agregar mais um serviço)"*

### Resumo das decisões

| # | Tema | Decisão |
|---|---|---|
| Q1 | Canal | prospecção ativa = **canal principal**; indicação **será estruturada** |
| Q2 | Produto de entrada | **gestão do GBP** (`SVC-GBP`) por até R$ 500/mês |
| Q3 | Diagnóstico | **mini grátis** para o lead; **completo só para cliente** |
| Q4 | Setor | case da saúde **não conta** (não há cliente na saúde); GBP **não é publicidade** → abre setores regulados |
| Q5 | Indicação | pedido **60 dias** após resultado visível |
| Q6 | Mini-diagnóstico | **3 falhas em clientes perdidos + você × 3 concorrentes**; sem score |
| Q7 | Se der certo | **automatizar a entrega de GBP com o PHI** (sem teto declarado) |
| Q8 | Posicionamento | **resultado medido todo mês**, **feito para você** |
| Q9 | Escopo | entrega **manual** no início; automação por **gatilho**; **fora da v1** |
| Q10 | Promessa | **trabalho + placar**, nunca resultado; **palavras-chave** em descrição e respostas (inclui descoberta por IA) |
| Q11 | Itens 11 e 12 | **ficam**; **saúde digital como bônus** que prepara o upsell |
| Q12 | Formato | **R$ 500/mês com fidelidade**; parte pode ir para **campanha teste** → upsell |

---

## 3. Conclusões

1. **A prospecção tinha máquina e não tinha oferta.** Treze rodadas definiram *como* chegar ao lead e
   nenhuma definiu *o que* vender a ele. Agora existe: **GBP por R$ 500/mês, com fidelidade**.
2. **A oferta decide o diagnóstico, não o contrário.** Com GBP na entrada, o mini-diagnóstico deixa de ser
   "o nosso score" e vira "quem está levando o seu cliente" — dado que o código **já coleta**.
3. **O PHI saiu do armário na prospecção.** A estratégia "invisível na Fase 1" continua valendo para
   anúncios; na prospecção ele é **vitrine** (mini + placar) — e, pela Q7, **o primeiro pedaço real da
   Fase 2** é a entrega de GBP automatizada.
4. **Existe agora uma escada, não uma isca solta** (§10.6 cobrava isso): GBP → saúde digital como bônus →
   campanha teste → `SVC-ADS`.
5. **A promessa ficou do lado controlável** (trabalho + placar). É o que protege a reputação numa cidade só,
   onde cliente insatisfeito fala com o próximo lead.
6. **A entrega virou o novo caminho crítico, e tem um buraco de dado:** o placar prometido (Q8-B) cita
   ligações e rotas, e **não existe fonte construída** para isso. O placar pré-venda (concorrentes, por
   fora) já é possível; o pós-venda depende de acesso do cliente e de integração ainda não desenhada.
7. **P7 continua aberta, e ficou mais barata de resolver.** Vender GBP a um lead não exige agente analista,
   cadência automatizada nem skill de redes: exige Maps + mini-diagnóstico + contato manual. **O primeiro
   cliente pode vir antes da máquina.** Não foi perguntado de novo (Q4 da entrevista independente decidiu
   esperar o Odoo) — fica registrado para o chat-mãe.
8. **Setores com publicidade regulada deixam de ser ruins e viram bons** (comentário do Olavo na Q4): o
   GBP não é publicidade, então é onde o concorrente anunciante tem menos espaço.
9. **Três respostas da rodada 3 abriram riscos novos** — RE1 a RE3 (§4, bloco 13.7). Não são objeções: são
   condições para as respostas funcionarem.

---

## 4. Rascunho das seções levantadas por esta entrevista

> **Para o chat-mãe:** blocos prontos, **só** das seções novas. Numeração sugerida (§13); encaixe e
> coerência com o resto do plano ficam com você.

### 13. A estratégia de entrada — o que a prospecção vende

#### 13.1 Por que prospecção ativa

A prospecção ativa é o **canal principal** da v1 porque indicação exige carteira, e a carteira ainda não
existe. Isso é uma escolha, não um desconhecimento: a pesquisa do próprio repositório
(`pesquisa-jornada-lead-crm-agencias.md` §1.10) mostra que a maior parte do negócio de agência vem de
indicação. Por isso: (1) o canal de cada cliente é registrado (N5); (2) a indicação tem regra desde o
primeiro cliente (§13.6); (3) quando houver carteira, os dois canais são **comparados**, não presumidos.

#### 13.2 A oferta de entrada

| | |
|---|---|
| **Produto** | Gestão do Google Business Profile (`SVC-GBP`) |
| **Preço** | até **R$ 500/mês**, com **fidelidade mínima** (prazo a fixar) |
| **Por que GBP** | entrega leve e controlável; é o que o diagnóstico mostra de fraco; **não é publicidade** — entra em setores com restrição a anúncio |
| **Por que não anúncios na entrada** | com verba pequena o resultado é fraco → cancelamento → prova social negativa na cidade prospectada |

#### 13.3 O mini-diagnóstico (grátis) × o diagnóstico completo (cliente)

| | Mini (lead) | Completo (cliente) |
|---|---|---|
| **Conteúdo** | as **3 falhas mais visíveis**, traduzidas em clientes perdidos + **você × 3 concorrentes da mesma busca** (nota, avaliações, fotos, horário) | tudo o que o enriquecimento produz, incluindo o score |
| **Score** | **não aparece** | aparece |
| **Fonte** | dados já coletados (Places/Apify + bench de concorrentes do normalizador) — **sem custo novo** | enriquecimento completo |
| **Uso** | 1º contato e resposta a "quanto custa?" (N9) | entrega e renovação |

#### 13.4 Posicionamento e promessa

**Posicionamento:** *resultado medido todo mês, feito para você.* O dono não tem tempo de cuidar do
perfil (feito para você) e ninguém mais mostra a ele, todo mês, onde ele está contra a concorrência
(resultado medido).

**O que se promete:** o **trabalho** (perfil completo, avaliações respondidas, fotos e posts em dia,
palavras-chave do setor na descrição e nas respostas) e o **placar** mensal contra 3 concorrentes.

**O que nunca se promete:** "mais clientes", "1º lugar no Maps", "aparecer nas IAs". O Google declara
distância como fator de ranking — ninguém a controla. Descoberta por IA é **trabalho feito**, não resultado
garantido.

#### 13.5 A escada de upsell

```
GBP (R$ 500/mês, fidelidade) → saúde digital como bônus → campanha teste → SVC-ADS
```

Cada degrau prepara o seguinte: o bônus de saúde digital mostra o que falta além do perfil; a campanha
teste mostra o que anúncios fariam. **Condições:** RE2 e RE3 (§13.7).

#### 13.6 Indicação

Todo cliente recebe um **pedido de indicação 60 dias** depois de ter **resultado visível**. "Resultado
visível" = **o placar mensal melhorou** contra os concorrentes (definição proposta — a confirmar).

#### 13.7 Entrega e o gatilho da automação

- **Início:** entrega de GBP **manual**.
- **Direção:** a entrega passa a ser **automatizada pelo PHI** (placar, alertas, rotina de perfil) — a
  carteira cresce com software, não com horas.
- **Gatilho:** ao fechar o **3º cliente de GBP** (coincide com o **CK5**), abre-se a construção da
  automação. **Fora da v1** (`DEFINICAO-DE-PRONTO` §4), mas com gatilho, não "para depois".
- **Não há teto de clientes declarado** — o gatilho é a única proteção da agenda na fase manual.

**Riscos estratégicos (abertos, para decisão):**

| # | Risco | Por quê | Condição proposta | Alternativa |
|---|---|---|---|---|
| **RE1** | **Palavra-chave no nome da empresa** | é violação das diretrizes do Google e pode **suspender o perfil** do cliente — o pior resultado possível para quem pagou para melhorar o GBP | regra escrita da entrega: palavra-chave **só em descrição, serviços e respostas**, nunca no nome | nenhuma segura |
| **RE2** | **Bônus de saúde digital na fase manual** | exige acessos do cliente (GA4, contas de anúncio) e tempo de entrega justamente quando a entrega é manual e sem teto | o bônus começa **junto com o gatilho** da automação (§13.7) | bônus desde o 1º cliente, aceitando o custo de agenda |
| **RE3** | **Campanha teste paga com parte dos R$ 500** | verba de ~R$ 100–150 dá pouco resultado → argumento **contra** o upsell (é o Ataque 2 voltando); e há questão fiscal de a agência comprar mídia com dinheiro do cliente | verba do teste **paga à parte pelo cliente**, com **mínimo declarado** | manter dentro dos R$ 500, com a expectativa escrita de que é demonstração, não resultado |
| **RE4** | **Placar pós-venda sem fonte** | ligações e rotas não saem do Apify; exigem acesso do cliente ao perfil e integração não desenhada | até a fonte existir, o placar mensal usa **só o que se vê por fora** (nota, avaliações, fotos, posição na busca) | construir a integração antes do 1º cliente |

---

## 5. O que muda no plano atual

> Plano em 🟡 **RASCUNHO** — mudanças são revisitáveis. Mesmo assim, cada item segue o formato do §12.3.

| # | O que muda | Por quê | Alternativa (e consequência) | O que sai |
|---|---|---|---|---|
| **M1** | **§13 novo** (blocos acima): oferta, mini-diagnóstico, posicionamento, escada, indicação, entrega | o plano tinha máquina e não tinha oferta (conclusão 1) | não criar §13 e espalhar nos §10–§12 → decisões estratégicas somem entre táticas | nada |
| **M2** | **§10.1 "Ticket de entrada: até R$ 500/mês — isca"** passa a dizer **"gestão do GBP, R$ 500/mês, com fidelidade"** | Q2, Q12: R$ 500 não era preço de nenhum serviço | manter genérico → o agente analista (item 2) não sabe o que ofertar | a palavra "isca" sem objeto |
| **M3** | **§10.6 fechada:** o "segundo passo" é a escada do §13.5 | Q11, Q12 | deixar aberta → "isca vira só barato" (o próprio §10.6) | a pendência §10.6 |
| **M4** | **N9 (mini-diagnóstico) ganha formato:** 3 falhas + × 3 concorrentes, **sem score** | Q3, Q6 | mostrar score e barras → régua nossa, que o dono não entende | score no material do lead |
| **M5** | **`catalogo-produtos-servicos.md`:** `SVC-GBP` recebe faixa de ticket, fidelidade e o papel de **produto de entrada** | Q2, Q12; o catálogo adiava "faixa de ticket" | só no plano → o catálogo segue sem preço e o agente analista lê a fonte errada | nada |
| **M6** | **CK5 ganha segunda ação:** além de "decidir quem entrega", **abre a automação da entrega de GBP** | Q7, Q9 | CK5 só como está → a direção da Q7 não tem quando começar | nada |
| **M7** | **`DEFINICAO-DE-PRONTO` §4:** acrescentar *"automação da entrega de GBP (primeiro pedaço da Fase 2) — fora da v1, entra pelo gatilho do CK5"* | Q9: fora da v1, mas com gatilho | incluir na v1 trocando um critério → exige escolher o que sai de P1–P8/§2 | nada da v1 |
| **M8** | **§6 da entrevista independente (pesquisa de setores):** novo critério **S5 — setor com restrição a publicidade** conta **a favor** | comentário do Olavo na Q4: GBP não é publicidade | não incluir → a pesquisa pode eliminar os setores onde a oferta tem **menos** concorrência | nada |
| **M9** | **§6 do PLANO (skills):** corrigir "`grill-me` não existe" → **`grill-me` e `grilling` instaladas** em 2026-09-14 | fato (R6) | manter → próxima sessão procura de novo e propõe construir o que existe | a linha errada |
| **M10** | **Riscos RE1–RE4** entram no plano (junto do §12.2) | respostas da rodada 3 (conclusão 9) | não registrar → RE1 suspende perfil de cliente sem aviso | nada |
| **M11** | **Contrato/Odoo:** "resultado visível" (Q5) precisa de definição e de onde fica o placar mensal | Q5, Q8 | deixar implícito → o gatilho de indicação nunca dispara | nada |

> ⚠️ **Não mudam** (defendidos na entrevista): prospecção ativa como canal principal (Q1); itens 11 e 12 na
> v1 (Q11); ausência de teto de clientes (Q7 — registrada como decisão, com o gatilho como proteção).

> 🟡 **Para o chat-mãe decidir se reabre:** P7 (conclusão 7) — a oferta GBP permite vender **antes** do
> Odoo e da máquina. A Q4 da entrevista independente decidiu esperar; o custo dessa espera mudou.
