# [ADENDO ao brief do ADR-39] Quatro verificações para o ADR-40

> **Como usar:** cole no sub-chat **que já está executando o ADR-39**. Não é um brief novo.
> **Não muda o escopo do ADR-39.** Os 5 passos e os 6 critérios seguem exatamente como estão.

---

## 0. Por que isto chegou agora

Você propôs a **opção D** — `primary_metric_type` viajar com a campanha em `raw_campaign_data`.
**O Olavo repassou ao chat-mãe, que avaliou e concordou com a direção:** ela é melhor que a opção A,
porque não escolhe dono para uma coluna que está no lugar errado — **tira a coluna do lugar errado**.

Virou o **`ADR-40 — A Métrica-Mãe viaja com a campanha`**, e está **proposto, não aceito**. O que
falta para aceitar são quatro leituras — e **você já está com esses nós abertos**, o que as torna
quase de graça.

⚠️ **Você não vai executar o ADR-40.** Só medir o que decide se ele é pequeno ou grande.

## 1. 🔴 A frase que precisa ser provada

Na sua proposta:

> *"Os dois writers já leem a Métrica-Mãe da campanha; só precisam gravá-la."*

**Se for verdade, o ADR-40 é barato. Se for falsa, é outro ADR inteiro** — porque passa a incluir
*"de onde vem a Métrica-Mãe"*, que é problema diferente de *"onde ela é guardada"*.

E o **as-built §A9 diz o contrário sobre um deles**: o workflow `client_config` deriva
`primary_metric_type` de um **mapa fixo** (`metricDefaultMap`), não da Métrica-Mãe.

> **Isto não é desconfiança do seu trabalho** — é o procedimento que esta casa passou a ter depois do
> **P-27**, em que o chat-mãe autorizou *"corrija agora, é uma linha"* com base numa afirmação
> escrita. Sete linhas abaixo, aquele prefixo alimentava um `WHERE`, e o PHI passou dias reportando
> *"sem histórico"* em campanha com **250 dias** de série. **A regra virou: premissa que decide custo
> se lê no artefato** (R6).

## 2. As 4 verificações

Todas são **leitura**. Nenhuma escreve, altera ou executa.

| # | Verificação | O que responder, exatamente |
|---|---|---|
| **V1** | **Os dois writers leem a Métrica-Mãe da campanha?** | para **cada um** dos dois: **de qual campo, de qual DB/tabela**, e **em qual nó**. Se um deles usa mapa fixo, diga qual e onde |
| **V2** | **Onde a Métrica-Mãe mora no Notion** — DB **Campanhas** ou DB **Clientes**? | o ID da DB e o nome exato da propriedade. 🔴 **Se estiver em Clientes, o ADR-40 exige mudar o cadastro** — e isso é trabalho do Olavo, não de workflow |
| **V3** | **Quantos lugares leem `client_config.primary_metric_type` hoje?** | a lista: workflow + nó. O SQL do score é um; **procure os outros** (Agregador, T28, Vigia, qualquer SQL) |
| **V4** | **A coluna sai de `client_config` ou fica órfã?** | sua recomendação, com o porquê. Regra do Olavo (21/09): **descartar exige dizer o que entra no lugar** |

## 3. ⛔ O que NÃO fazer

- **Não altere schema, writer nem SQL.** O ADR-40 não foi aceito.
- **Não conserte** o mapa fixo além do que o passo 4.1 do ADR-39 já manda.
- **Se uma verificação mostrar que a premissa é falsa — reporte, não conserte.** Premissa refutada é
  entrega valiosa, não fracasso (R6, corolário).

## 4. Uma decisão fina que o chat-mãe tomou, e o motivo

**O passo 4.1 do ADR-39** — corrigir a derivação para ler a Métrica-Mãe em vez do `ROAS` fixo —
**vira trabalho descartável se o ADR-40 for aceito.**

> **Mantenha mesmo assim.** É barato, e entre um ADR e outro haverá semanas. **Cliente novo entrando
> com `ROAS` fixo nesse intervalo é pior que o retrabalho** — e, pela regra de entrada que o Olavo
> definiu (*"todos os clientes que contratarem tráfego pago"*), cliente novo pode entrar a qualquer
> momento.

## 5. O que devolver

1. **As 4 verificações**, cada uma com **onde você leu** (workflow + nó, ou DB + propriedade).
2. **Sua recomendação para o V4.**
3. 🔴 **Se a sua própria afirmação do §1 não se sustentar, diga isso primeiro** — antes das outras
   três. É a que mais muda o plano.
4. **Estimativa do custo do ADR-40** à luz do que você leu: quantos artefatos, quais.
5. Tudo isso **junto com o relatório do ADR-39** — não abra sessão nova.

## 6. Contexto, se quiser ler

- `saude-digital/adr-rascunhos/ADR-40-metrica-mae-viaja-com-a-campanha.md` — **a avaliação completa**,
  incluindo o bug da *"última campanha ganha"* que você apontou e por que a régua histórica deve ser
  imutável.
- `saude-digital/PLANO-ENTREGA-FINAL-PHI.md` §4.2 — a prova documental de que a Métrica-Mãe é da
  campanha: o `regras-otimizacao-metodo-subido.md` §2 titula a tabela *"Métrica-mãe por objetivo"*.
