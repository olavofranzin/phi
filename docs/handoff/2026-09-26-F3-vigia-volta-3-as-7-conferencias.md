# F3 — volta 3: as 7 conferências no ar, e o V3 deixou de dar falso crítico

| | |
|---|---|
| **Data** | 2026-09-26 |
| **Resultado** | ✅ **7 de 7 conferências no ar.** `versionId == activeVersionId == 125b437b-dcce-414b-839f-8e61ffd2a3a9`, 8 nós, ativo |
| **O que destravou** | três respostas do Olavo: a URL da credencial estava errada (corrigida por ele), **o CLI-7 não é cliente de tráfego pago**, e **o dado do CLI-13 é de teste do caminho Meta Ads** |
| **Substitui** | o `V1 AUSENTE` do relatório da volta 2 — aquele documento está **superado neste ponto** |
| **Custo de modelo** | **zero** |

---

## 1. A chave era URL errada, e agora funciona

**Retestei antes de construir.** `workflow: getAll` voltou **200 com dado real** — `PROSP-05O CRM-out Odoo`
e `Onb - Briefing to Client`. Não era API desabilitada: **era a URL-base da credencial**, como o Olavo
suspeitou.

> **O 404 tinha me deixado com a leitura certa e a causa aberta.** Eu escrevi *"desabilitada ou
> URL-base errada, e as duas são ação de tela"* — e era a segunda. **Ter escrito as duas
> possibilidades em vez de escolher uma foi o que fez o reteste ser barato.**

### O que a API entregou de brinde

Para o V1 eu precisava do nome do último nó do `Pipeline_v2`. Em vez de puxar o workflow inteiro,
li **uma execução** e extraí só as chaves do `runData` — e apareceu mais do que eu procurava:

| exec | quando | status | parou em |
|---|---|---|---|
| **43261** | 26/09 07:00 BRT | success | `If Operacional OK?` ← o fim |
| **42949** | 25/09 **09:10** BRT | success | `If Operacional OK?` |
| **42903** | 25/09 **07:00** BRT | 🔴 **error** | `Buscar Clientes Ativos` |

🔴 **Isto fecha um mistério da volta 2.** Eu tinha notado que o score de 24/09 foi escrito às 09:10 BRT
em vez das 07h e registrei como anomalia sem causa. **A causa está aqui: a rodada das 07h de 25/09
falhou, e houve uma rerodada às 09:10.** O `errorWorkflow` gritou (é falha dura), mas ninguém ligou uma
coisa à outra.

**O último nó em rodada sadia é `If Operacional OK?`** — é a expectativa que o V1 usa.

---

## 2. O V1 que entrou, e por que ele não é "status == success"

```js
if (ult.status === 'success' && !chegou) {
  criticos.push('V1 Pipeline_v2 exec ' + ult.id + ': TERMINOU VERDE SEM CHEGAR AO FIM...');
}
```

**O defeito de 18/09 foi exatamente este caso:** verde, sem chegar ao fim, 8 dias. Um V1 que olhasse só
o status **não pegaria nada**. Por isso ele lê o dado detalhado da execução e confere se
`If Operacional OK?` está entre os nós que rodaram.

**E o caso que nenhum `errorWorkflow` pega:** se não houver execução nenhuma hoje, o V1 grita
`NAO RODOU hoje`. Dos 45 dias perdidos até 08/09, **43 não tiveram execução** — não houve erro, houve
ausência, e ausência não dispara handler.

## 3. O V6 ficou completo, como o plano pedia

O plano escreveu o V6 como *"o `operador unico` e o `Pipeline_v2` rodaram na janela esperada?"*. Na volta
2 eu só conseguia o lado do dado. Agora são os dois:

| workflow | janela esperada (BRT) | hoje |
|---|---|---|
| `operador unico metricas` | 03:30–05:30 | ✅ rodou na janela |
| `PHI - Pipeline_v2` | 06:30–08:00 | ✅ rodou na janela |

O lado do dado (`ingestion_step`) **continua**, com o cuidado declarado de que ele é *"quem tocou por
último"*, não linhagem.

## 4. O V5 deixou de supor e passou a confirmar

Antes: *"há erro roteado na `t28_errors`"* — e eu **presumia** que a execução terminou verde.
Agora o SQL devolve o `execution_id`, o código extrai o número de `EXEC-T28-41535` e **casa com o status
real da execução**:

```
| CONFIRMADO: a execucao 41535 terminou VERDE tendo roteado erro
```

**A cobertura continua limitada** — só vê erro que chega na `t28_errors`, ou seja, quem usa o
error-handler do T28. **Isso continua escrito na mensagem diária**, porque parcial silencioso é o modo de
falha da casa. O que mudou é que a afirmação agora é verificada, não suposta.

---

## 5. 🔴 O "não" do CLI-7 consertou um falso crítico que eu ia entregar

**Pergunta:** o CLI-7 é cliente de tráfego pago? **Resposta do Olavo: não.**

Conferi no cadastro e bate: `Serviços Prestados` do CLI-7 = **CRIAÇÃO DE SITE**. O meu V3 alertava
*"ATIVO no Notion e sem score"* para ele — **todo dia, para sempre, sobre um cliente que o PHI não
deveria monitorar.** Era ruído crítico, e ruído crítico é o que faz desligarem um vigia.

**O V3 passou a ter portão de mídia:** só entra cliente `ATIVO` **com `GOOGLE ADS` ou `META ADS`** nos
serviços.

### E a medição achou a contradição inversa

Ao conferir os serviços de todos, apareceu isto:

| cliente | Status | Serviços | tem dado de mídia? |
|---|---|---|---|
| CLI-4 | ATIVO | GOOGLE ADS | sim ✅ |
| CLI-7 | ATIVO | CRIAÇÃO DE SITE | **não** — fora do escopo, correto |
| **CLI-13** | ATIVO | **CRIAÇÃO DE SITE** | 🔴 **sim: 12 linhas de `meta_ads` até 20/09** |

🔴 **O cadastro do CLI-13 não declara mídia, e o PHI tem dado de mídia dele.** Se eu só tivesse
apertado o portão, o CLI-13 ficaria **invisível para o vigia, em silêncio** — trocando um falso
positivo por um falso negativo, que é pior.

**Então entrou o V3B:** *tem dado de tráfego pago e o cadastro não o declara como cliente de mídia
ativo*. Fica em **ATENÇÃO**, não em crítico, porque não sei qual dos dois lados está velho.

> **É o mesmo princípio do M4 aplicado a cadastro:** a ausência de declaração não é declaração de
> ausência. **Um portão sem a contradição do lado de fora vira cegueira educada.**

---

## 6. O efeito na estreia: de 2 críticos para 0, e nenhum achado perdido

| | volta 2 | volta 3 |
|---|---|---|
| **críticos** | 2 (CLI-7 e CLI-13 como "cliente pago sem monitoramento") | **0** |
| **atenção** | 6 | **7** (entrou o V3B do CLI-13) |
| **conferidas** | 28 | **31** |
| **conferências no ar** | 6 de 7 | **7 de 7** |

**Nenhum achado verdadeiro se perdeu:** o CLI-13 continua aparecendo — três vezes, por três motivos
diferentes e todos corretos (V4 parou de receber, V4B sem dado ontem, V3B cadastro × dado). O que saiu
foi a **acusação errada** de que ele e o CLI-7 eram clientes pagos sem monitoramento.

---

## 7. Os 9 critérios, revisados

| # | Estado | Prova |
|---|---|---|
| **CA1** | ✅ | exec 43341 (volta 2), ambiente controlado: *"Conferi 12 itens, 12 ok"* |
| **CA2** | ✅ **7 de 7** | V1 e V6 ao vivo (exec **43352**, ambos passam com dado real) · V3, V3B e V4 ao vivo · V5, V6-dado e V7 por dado histórico (exec 43339) · V2 e V2b sintéticos |
| **CA3′** | ✅ | exec 43339 |
| **CA4′** | ✅ | exec 43352: `t28_gbp_daily`, atraso 97 dias |
| **CA5** | ✅ | o `return []` morreu; 1 item sempre |
| **CA6** | ✅ | uma mensagem por execução |
| **CA7** | ✅ | as 318 linhas sem cliente não aparecem |
| **CA8** | ✅ | `errorWorkflow = UZ7sIE5cWrrO8xea` |
| **CA9** | ✅ | `versionId == activeVersionId == 8c19e88f`, relido depois de publicar |

**A ressalva do CA2 que eu tinha registrado na volta 2 caiu.** Não há mais conferência ausente.

---

## 8. R12 — o que mudei para teste

| Mudado | Estado agora | Prova |
|---|---|---|
| nó `TESTE chave n8n` | **removido** | o que está no ar tem 8 nós, e os dois de n8n são `V1 - Pipeline_v2 chegou ao fim?` e `Execucoes recentes (n8n)` |
| nó `TESTE extrair` | **removido** | idem |

**Nada ficou desabilitado, nada ficou pinado, nenhum ambiente controlado sobrou.**

---

## 8b. 🔴 O CLI-13 não era cadastro velho: era dado de teste em produção

**Resposta do Olavo:** *"a campanha cadastrada foi para configurar e testar o caminho do Meta Ads, os
dados não pertencem a ele."*

**Isso reescreve o achado.** O V3B estava certo em apontar a divergência e **errado na explicação** que
eu tinha oferecido — não é cadastro velho nem coleta sobrando: é **dado de teste morando em `phi_prod`**,
a mesma família das 318 linhas sem `client_id` da `t28_campaign`.

**Quatro alertas do vigia eram ruído**, todos com a mesma raiz: `V4 raw_campaign_data | CLI-13`,
`V4 t28_errors | CLI-13`, `V4B CLI-13 | meta_ads` e `V3B CLI-13`.

### Como tratei, e por que não silenciei

Virou **exceção declarada e datada** no código, que o vigia **lista todo dia em vez de alertar**:

```js
const DADO_NAO_E_DO_CLIENTE = {
  'CLI-13': 'campanha criada para configurar e testar o caminho do Meta Ads; o dado nao pertence ao cliente (Olavo, 26/09)',
};
```

E a exceção sai num **bloco próprio da mensagem, todos os dias, inclusive no dia bom**:

```
Excecao declarada: CLI-13 - campanha criada para configurar e testar o caminho do
Meta Ads; o dado nao pertence ao cliente (Olavo, 26/09). Enquanto esse dado estiver
em phi_prod, ele nao gera alerta.
```

> **Por que não uma exclusão simples:** exceção que ninguém vê vira silêncio permanente — o defeito que
> este vigia existe para combater. É a **R12** aplicada a regra de negócio: *coisa desligada não tem cor,
> não tem alarme e não aparece em lista nenhuma*. **Uma linha no resumo custa nada e impede o
> esquecimento.** E acrescentar nome nessa lista é decisão do Olavo, nunca minha — está escrito no nó.

### O efeito no ruído

| | antes do CLI-13 | depois |
|---|---|---|
| críticos | 0 | **0** |
| atenção | 7 | **3** |
| listados | 8 | 12 |

**As 3 atenções que sobraram são todas do CLI-4 e todas reais:** `t28_ga4_landing` D-7 parado há 20
dias, o mesmo D-30 há 57, e `t28_gbp_daily` há 97. **O sinal ficou limpo — o que resta é o que precisa
de ação.** (exec **43358**)

---

## 9. O que continua em aberto

1. 🔴 **Dado de teste dentro de `phi_prod`.** O CLI-13 é o segundo caso: as 318 linhas sem `client_id`
   da `t28_campaign` são o primeiro. **Isto é padrão, não acidente** — e vale uma decisão de onde
   testar caminho novo. **Pergunta devolvida, não resolvida.**
2. **CLI-9 e CLI-10 sem Status.** O vigia lista como *não conferido* em vez de adivinhar.
3. **Os dois relógios da `raw_campaign_data`** (`ingested_at` em BRT+3 e `execution_id` noutra base).
   Não investiguei, e é por isso que o V6-dado olha o step.
4. **A view `phi_score_current` sem `platform`** — multiplicador armado, contraria o M2. O V2b vigia o
   sintoma; a causa continua lá.
5. **`t28_ga4_landing` do CLI-4 parado há 20 dias** e `t28_gbp_daily` há 97. O vigia avisa; consertar é
   outro brief.

**Nada disso foi consertado, de propósito.**
