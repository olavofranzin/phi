# Fila de decisões do Olavo — ordenada por importância (2026-09-27)

| | |
|---|---|
| **O que é** | as decisões que **só o Olavo** pode tomar, em ordem de quanto custa **não** tomá-las |
| **Por que existe** | o painel diz *"o que falta"* e *"o que trava"*. **Não dizia de quem é a bola.** Decisão sem dono e sem lugar volta como surpresa |
| **Como usar** | responder de cima para baixo. As duas primeiras mudam o que acontece nesta semana; as outras não |
| **Regra** | quando ele responder, a resposta vai para o **documento canônico do assunto** (ADR ou plano) na mesma sessão — **R2**. Este arquivo é fila, não é memória |
| **Atualizado** | 2026-09-27 |

---

## Bloco 1 — mudam o que acontece nos próximos dias

### 🔴 D-1. O PHI v1 atende cliente de **qualquer** Métrica-Mãe, ou só de **CPA**?

**A pergunta que decide:** *algum cliente que você vai cadastrar nos próximos 30 dias tem métrica
diferente de CPA?*

| | |
|---|---|
| **O fato** | o `Pipeline_v2` reprova `primary_metric_type != 'CPA'` como `INSUFFICIENT_DATA`. **CPL, ROAS, CPM entram e saem sem nota** |
| **Onde já está escrito** | cabeçalho do **ADR-40** (22/09): *"precisa de ADR próprio"*. **Cinco dias depois o ADR não existe** |
| **Custo de não decidir** | o **F1** pode "fechar" sem entregar: *"aparece no PHI"* ≠ *"é monitorado pelo PHI"*. Foi o caso do **CHA**, que é CPL |
| **Recomendação do planejador** | **se a resposta for "não": declarar por escrito que a v1 é só CPA** (é de graça) e abrir o ADR do motor multi-métrica **sem prazo apertado**. **Se for "sim": o motor vira prioridade 1**, à frente do F4 |

### 🔴 D-2. Fechado o ADR-39 amanhã, **qual é o próximo da fila?**

| Opção | O que é | Argumento |
|---|---|---|
| **A — D1-d** | uma credencial ruim **derruba a coleta de todos os clientes** (o laço do writer não avança) | desenho **já aprovado** no ADR-38 §28.4, só não foi executado. É o defeito que mais se repete |
| **B — as 3 fontes paradas** | GA4 **20 dias**, GA4 D-30 **57 dias**, GBP **97 dias** | **sem elas o índice não tem dado.** É o que trava o **F5** |
| **C — F4, grão de anúncio** | *"quero o anúncio culpado"* — o que você pediu para os 15 dias | entrega visível. **Sobre base que ainda cai** |
| **D — construir o índice** | os pilares de API primeiro (decisão O2) | é a frente nova, e ela está esperando |

> **Recomendação do planejador: A → B → C.** Os dois primeiros são *"o sistema não coleta"*.
> **Construir índice sobre coleta que cai é construir sobre areia** — e é literalmente o erro do
> `raw_ad_data`, três meses de escrita para tabela vazia.

---

## Bloco 2 — travam o índice, não travam esta semana

### D-3. Na **v0.1**, quem lê a nota — e para decidir o quê?
Você corrigiu, com razão, que *"zero leitor vivo"* era falso: o consumo é interno primeiro. **Falta o
nome e a decisão.** Sem isso o **M11** (*todo dado escrito tem consumidor declarado*) não é aplicável
ao índice — e foi por não ter isso que o `raw_ad_data` passou 3 meses vazio sem ninguém notar.

### D-4. Qual **evento** faz o cliente passar a ver a nota? (o gatilho do **O4**)
Hoje está escrito *"até segunda ordem"*. **"Segunda ordem" não é gatilho** — é ausência de gatilho.
Pode ser: *N semanas sem alerta falso* · *os 3 pilares de API no ar* · *a agência como cliente-zero
rodando 30 dias*. **Qualquer um serve; nenhum é o padrão.**

### D-5. Quem é o **dono de cada pilar** — a agência ou o cliente?
Precisa entrar no `DICIONARIO-DE-INDICADORES`. É o que decide **de quem é a culpa** quando um pilar
está baixo — e, por consequência, **o que é upsell e o que é nossa falha**.

### D-6. Com que **frequência** o cliente recebe o relatório, e **o que vai dentro**?
É o molde do **F8**. Já sabemos duas coisas suas: o relatório **já é feito à mão** por você, e a
reunião **é falada**. Então o F8 não é criar valor novo: é **devolver as suas horas** e **municiar a
conversa**.

### D-7. Aprovo o **ADR-42** (normalização de indicador de alvo)?
Está em rascunho desde 25/09. É adendo do ADR-41, não superseção.

### D-8. Os **§1 e §2** do `PLANO-ENTREGA-FINAL-PHI` — nas suas palavras.
O §1 tem resposta parcial vinda de escolha de opção; **escolher chip não é redigir.** O §2 está em
branco.

---

## Bloco 3 — sim ou não, custam um minuto

### D-9. Crio o campo **`Tipo`** (Real / Teste / Interno) na DB Clientes do Notion?
Sem ele, cliente de teste e cliente que paga são indistinguíveis para todo workflow — e foi por isso
que o `CLI-13` apareceu como defeito no vigia sendo cadastro de teste.

### D-10. Gasto **uma rodada de limpeza** na Prospecção?
Arquivar os **5 workflows mortos** do ADR-35 §3.5 (medidos hoje: os 5 continuam de pé) e renomear
`Comercial - Guarda-Schema + Backup` → `PROSP-07`. **É o único item de acabamento que resta na
frente.**

### D-11. O **T28 continua parado** — por decisão ou por esquecimento?
Medido em 27/09: os dois workflows **inativos**, sem alteração desde **24/07** e **01/08**. Se é por
decisão (consome o score, que está em obra), **escrever isso** vale mais que o silêncio: evita a
próxima auditoria levantar o mesmo alarme.

---

## O que NÃO está nesta fila, de propósito

| Assunto | Por que não é decisão sua |
|---|---|
| o **4.4** e o **4.5** de amanhã | já pré-autorizados por você, com condição escrita |
| as **07h** | **decidido** em 26/09 e registrado no ADR-37 em 27/09 |
| **nota por pilar + composta · lotes · cliente-zero · Clarity fora do índice** | **decididos** em 26/09 |
| a ordem **F1→F3→F2** antes do F4 | **decidida** em 20/09 |
| o desenho do **D1-d** | aprovado no desenho; o que falta é **quando**, e isso é o D-2 |
