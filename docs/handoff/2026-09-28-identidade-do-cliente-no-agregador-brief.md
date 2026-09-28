# Brief de execução — O cliente errado no Agregador (`nodeFirst`, o mesmo defeito do ADR-33)

| | |
|---|---|
| **Frente** | Saúde Digital / Agregador — **e é a fonte do Índice do Negócio** |
| **Artefato** | `PHI — Agregador de Métricas Multi-fonte` (`4sdG2UKMCBuFq8xn`) — **ATIVO**, 66 nós, semanal (segundas 09h) |
| **Achado por** | a volta 1 do diagnóstico, 28/09 — **derrubando a premissa do chat-mãe**, que era *"coletou e não escreveu"* |
| **Branch dos documentos** | `claude/consolidacao-2026-08` · `https://github.com/olavofranzin/phi/tree/claude/consolidacao-2026-08` |
| **Janela** | 🔴 **09h–23h BRT (D9)** |
| **Limite** | **3 voltas** |

---

## 1. O defeito, provado

O `Adaptador Input T28` usa **`nodeFirst(...)`** para casar `Set dados` com as respostas das fontes
**depois que o laço terminou**. Resultado: **o dado é associado ao PRIMEIRO cliente do lote, não ao
cliente da passagem que o coletou.**

| Execução | Primeiro item de `Set dados` | O que foi gravado em `t28_ga4_landing` |
|---|---|---|
| **`41535`** (21/09) | **`CLI-13`** (CHA — **sem `id_ga4`**) | 🔴 **2 linhas sob `CLI-13`**, com o GA4 coletado nas passagens do **`CLI-4`** |
| **`44023`** (28/09) | `CLI-4` | 2 linhas sob `CLI-4` — **certo por acaso**, porque o primeiro já era o dono |

> ## 🔴 Dado que falta é visível. Dado no cliente errado parece certo.
>
> **Não há alarme possível para isso pelo lado do frescor:** a tabela recebe linha, no período certo,
> com `execution_id` válido. **Tudo passa.** O que está errado é **de quem** é o dado.

**E o consumidor é o pior possível:** `t28_ga4_landing` alimenta o **pilar de Experiência** do Índice
de Saúde Digital do Negócio. Do jeito que está, **o CHA receberia nota calculada com o tráfego do
KIL** — plausível, entregável, e errada.

---

## 2. 🔴 R7 — isto NÃO é desenho novo. Já existe ADR, de 09/08

**Leia antes de propor qualquer coisa:**
`docs/strategic-planning/saude-digital/adr-rascunhos/ADR-33-identidade-estavel-item-pipeline-metricas.md`

> **Título dele, verbatim:** *"Identidade Estável do Item na Pipeline de Métricas — **o fim do
> `results[0]` e do merge sem chave**"*.

| | |
|---|---|
| **Escrito em** | **2026-08-09**, como desenho dos *"2 itens estruturais"* que sobraram das Fases 1–6 |
| **Sobre o quê** | **vazamento entre itens** por pegar `results[0]` em vez de casar por chave |
| **Estado** | 🔴 **RASCUNHO. Nunca executado.** *"Vira Aceito quando o Contrato de Identidade rodar em produção"* |
| **Escopo declarado dele** | `sw metricas anuncios` / `sw metricas campanhas` |

> 🔴 **`nodeFirst()` no Agregador é o mesmo defeito que `results[0]` nos writers — sete semanas
> depois, em outro workflow.** A raiz foi diagnosticada, o desenho foi escrito, **e ninguém executou**.
>
> **Sua primeira tarefa de desenho é responder:** *o Contrato de Identidade do ADR-33 resolve o caso
> do Agregador como está, ou precisa de extensão?* **Se resolve, isto não é ADR novo — é o ADR-33
> finalmente saindo do papel, com escopo ampliado.** Reusar vale mais que inventar (R7/R8).

---

## 3. 🔴 Primeiro o passivo, depois o conserto

**É a regra que o ADR-38 já ensinou nesta casa:** *identidade se resolve antes de reconstruir a
série*. Consertar o nó **sem saber quanto dado já está no dono errado** deixa o passivo invisível para
sempre — e ele **não se vê**, porque parece certo.

### 3.1. A assinatura barata que identifica linha contaminada

**Achada na própria execução `41535`:** o item do `CLI-13` traz **`id_ga4: null`**.

> ### 🟢 Se o cliente não tem `id_ga4` no cadastro, ele **não pode** ter linha em `t28_ga4_landing`.
> **Toda linha assim é provadamente contaminada.** Não é heurística: é impossibilidade.

**O mesmo raciocínio vale por fonte:**

| Tabela | Linha é impossível quando o cliente não tem… |
|---|---|
| `t28_ga4_landing` | `id_ga4` |
| `t28_clarity_daily` | projeto de Clarity |
| `t28_gbp_daily` | `id_gbp_local` |
| `t28_campaign` / `t28_adset` / `t28_meta_campaign` | a conta da plataforma correspondente |

> ⚠️ **Isso pega o caso óbvio, não todos.** Dois clientes **ambos com GA4** trocados entre si passam
> por essa peneira. **Diga isso no relatório** — peneira que não pega tudo e não avisa é a terceira
> cara do vazio outra vez.

### 3.2. E há um segundo rastro, para conferir

Na execução `41535`, **as métricas de Clarity que vieram no contexto do `CLI-13` falam de
`kbbecker.com.br`** — que é o site do **KIL**. **Confirme:** se for o mesmo vício, `t28_clarity_daily`
está contaminada também, e o defeito **não é só do GA4**.

---

## 4. Ordem de trabalho

| # | Passo | Cuidado |
|---|---|---|
| **4.1** | Ler o **ADR-33** e dizer se o Contrato de Identidade dele cobre o Agregador | §2 |
| **4.2** | **Medir o passivo** pela assinatura do §3.1, tabela por tabela: **quantas linhas, quais clientes, desde quando** | é o portão. Sem isso, nada de conserto |
| **4.3** | Confirmar o rastro do Clarity (§3.2) e varrer as **6 fontes** | as 6 compartilham `Adaptador Input T28 → Reclassifica IDs → Normalizador T28` |
| **4.4** | Desenhar o conserto: **o cliente viaja junto do dado**, casado por chave, nunca por posição | **devolva o desenho. NÃO publique** |
| **4.5** | Propor o que fazer com o passivo: **apagar, remarcar ou deixar declarado** | 🔴 **decisão do Olavo** — mexe em dado histórico |

> ⚠️ **O Agregador é semanal.** Conserto errado **só aparece sete dias depois**, e a próxima rodada
> natural é o único teste que existe. **Por isso esta volta termina em desenho, não em publicação.**

---

## 5. Critérios de aceite — escritos antes (R9)

| # | Critério | Prova |
|---|---|---|
| **CA1** | O ADR-33 foi lido e há veredito: **cobre / não cobre**, com o porquê | §2 |
| **CA2** | **O passivo está medido** por tabela: linhas, clientes, período | as queries e os números |
| **CA3** | O limite da peneira está **declarado** (o que ela não pega) | §3.1 |
| **CA4** | Está dito se o defeito atinge **só o GA4** ou também Clarity e as outras | §3.2 |
| **CA5** | 🔴 **Nada publicado no Agregador** | `versionId` igual ao do início (`c54114b3`) |
| **CA6** | O conserto voltou como **desenho**, casando por chave e não por posição | §4.4 |
| **CA7** | A proposta sobre o passivo tem as **três saídas com custo** | §4.5 |

---

## 6. Fora de escopo

| Fora | Por quê |
|---|---|
| consertar sem aprovação | §4 |
| o **GBP** | é cota, e a decisão do Olavo já saiu |
| mexer no vigia | **ele fez o trabalho dele** — o V4 apontou uma tabela e o fio puxou um defeito de identidade que ninguém procurava |
| executar o ADR-33 nos writers (`sw metricas *`) | 🔴 **tentador e proibido aqui.** Se o ADR-33 cobre os dois lugares, **isso é uma decisão de escopo do Olavo**, não uma extensão que o executor faz por conta |

---

## 7. Registro (R3) e fechamento (R2)

- Linha na DB Notion **"PHI — Registro de Execuções (Sub-chats)"**, frente **Saúde Digital/Agregador**.
- Ao terminar: atualizar o **ADR-33** (ele ganhou um caso novo e uma data), e o
  `PLANO-F3-vigia-de-consistencia.md`, que já carrega a correção da volta 1.

---

## 8. O relatório de volta

1. Os **7 critérios**
2. O **veredito sobre o ADR-33**
3. **O tamanho do passivo**, por tabela
4. O **desenho** do conserto e as **três saídas** para o passivo
5. **O que você mediu e me desmentiu** — este brief nasce de um brief meu que **já foi desmentido uma vez hoje**, e a refutação foi a melhor entrega do dia

> 🔴 **Regra que esta etapa já provou valer:** *se a premissa cair, pare e devolva.* A volta 1
> derrubou a minha e **achou um defeito maior do que o que eu tinha descrito.**
