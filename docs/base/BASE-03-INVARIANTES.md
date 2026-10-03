# BASE-03 — INVARIANTES. O ÍNDICE: nome, uma linha, link — e se já foi violado

| | |
|---|---|
| **O que este documento é** | 🔴 **um ÍNDICE, não uma cópia.** Nome + uma linha + **link para o dono** + **a coluna que vale**: *já foi violado? quando?* |
| **Escrito em** | 2026-10-03 |
| **Verificado em** | 2026-10-03, pelo **sub-chat da Fase 1 da memória compartilhada**, **contra** `saude-digital/CONTRATO-PHI.md` (M1–M12), `prospeccao/CONTRATO-PROSPECCAO.md` (I1–I11), `saude-digital-do-negocio/adr-rascunhos/ADR-41` (S1) e o `CLAUDE.md` da raiz (R1–R15) |
| **Dono de qual fato** | 🔴 **de NENHUM invariante.** É dono apenas do **mapa** deles e do **histórico de violação** |
| **Quem é dono de cada um** | está na coluna *“dono”* de cada tabela. **Se você precisa do texto do invariante, abra o dono** |

> 🔴 **Este é o documento que mais tenta virar cópia. A regra que o protege:**
> **se uma linha daqui começar a dizer o que o invariante exige, em vez de onde ele mora, ela virou
> cópia** — e a segunda cópia divergir é questão de tempo (`BASE-00` §1.1).
>
> **Teste prático:** *dá para obedecer ao invariante lendo só esta página?* **Se dá, ela copiou.**

> ⚠️ **Por que a coluna *“já foi violado?”* é o valor real desta página.**
> **Invariante que nunca foi violado e invariante que nos custou duas semanas não merecem a mesma
> atenção** — e nenhuma das duas listas de contrato diz qual é qual. É isto que esta página
> acrescenta, e é a única razão de ela existir.

---

## 1. Como ler a coluna *“já foi violado?”*

| Selo | Significado |
|---|---|
| 🔴 **VIOLADO, e custou** | existe incidente com custo medido. **Link para a história** |
| 🟡 **quase** | foi pego **antes** de executar. Conta, e conta a favor: **a regra funcionou** |
| 🟢 **sem violação registrada** | ⚠️ **não quer dizer “nunca violado”** — quer dizer **“não achei registro”**. A ausência de prova não é prova de ausência |
| ⬜ **não verificado** | não procurei, ou não há como procurar sem abrir o artefato |

---

## 2. **M1–M12** — invariantes de mídia

**Dono:** [`docs/strategic-planning/saude-digital/CONTRATO-PHI.md`](../strategic-planning/saude-digital/CONTRATO-PHI.md) §(tabela de invariantes)

| # | Uma linha | Já foi violado? Quando? |
|---|---|---|
| **M1** | um destino, um dono | 🔴 **VIOLADO** — 2 writers em `raw_campaign_data`. É a origem do ADR-37 |
| **M2** | identidade neutra: `campaign_id` sem prefixo | 🔴 **VIOLADO, e custou** — o `'GADS-' + id` matou a Série Diária: *“sem histórico”* em campanha com **250 dias**. [História](BASE-04-INCIDENTES.md#1-D1-vazio-vira-outra-coisa) |
| **M3** | `client_id` sempre preenchido | 🔴 **VIOLADO** — 5 linhas com `client_id NULL` a limpar no Agregador (`ESTADO` v0.1.52) |
| **M4** | 🔴 zero nunca é ausência | 🔴 **VIOLADO várias vezes** — é **a doença nº 1 da casa**, 7 casos. [História](BASE-04-INCIDENTES.md#1-D1-vazio-vira-outra-coisa) |
| **M5** | o score é fato (ADR-003) | 🟢 **sem violação registrada** — mas ⬜ **não verificado contra os consumidores** |
| **M6** | 🔴 a ordem da Fase 3 é imutável | 🟡 **QUASE** — a Fase 0.2 do ADR-37 teria quebrado, e **foi cancelada na hora de executar**. [História](BASE-04-INCIDENTES.md#4-D4-numero-e-gravidade-herdados) |
| **M7** | `ingestion_step` não é linhagem | 🔴 **o próprio invariante foi corrigido** pelo as-built de 20/09 (dizia *“por último”*; é *“primeiro”*). **Não é violação: é o invariante que estava errado** |
| **M8** | o PHI detecta e orienta, nunca executa | 🟢 **sem violação registrada.** É o princípio central — dono do texto: [`BASE-01`](BASE-01-PRINCIPIOS.md) §1 |
| **M9** | um ambiente só: `phi_prod` | ⬜ **não verificado** |
| **M10** | 🔴 todo workflow ativo tem saída observável | 🔴 **VIOLADO** — `raw_ad_data` vazia **3 meses**, verde. E de novo no **nível de funcionalidade**: o `W5` *“concluído”* com gráfico ausente. [História](BASE-04-INCIDENTES.md#2-D2-documento-que-mente) |
| **M11** | todo dado escrito tem consumidor declarado | 🔴 **VIOLADO** — o grão de anúncio; e `t28_errors` **sem leitor declarado** (`CONTRATO-PHI` §186) |
| **M12** | escrita idempotente | 🟢 **sem violação registrada** — provada no smoke do L3.0 (runs `13046`/`13054`) |

---

## 3. **S1** — o invariante do índice (pilar não medido)

**Dono:** [`saude-digital-do-negocio/adr-rascunhos/ADR-41`](../strategic-planning/saude-digital-do-negocio/adr-rascunhos/ADR-41-indice-saude-digital-pesos-iguais-cobertura-declarada.md) §(tabela de invariantes), linha 157

| # | Uma linha | Já foi violado? Quando? |
|---|---|---|
| **S1** | 🔴 pilar não medido nunca é zero — **extensão do M4** para a camada do índice | 🟢 **sem violação registrada**, e por um motivo simples: **o motor do Índice não existe ainda** ([`BASE-01`](BASE-01-PRINCIPIOS.md) §7). ⚠️ **Nascer já escrito é o ponto** — o M4 só foi escrito depois de custar |

> 🔴 **O S1 é o único invariante da casa escrito ANTES do incidente.** Todos os outros são autópsia.
> Vale registrar que é possível.

---

## 4. **I1–I11** — invariantes da Prospecção

**Dono:** [`docs/strategic-planning/prospeccao/CONTRATO-PROSPECCAO.md`](../strategic-planning/prospeccao/CONTRATO-PROSPECCAO.md) §(tabela de invariantes), linhas 368–378

| # | Uma linha | Já foi violado? Quando? |
|---|---|---|
| **I1** | uma coluna, um dono | ⬜ **não verificado** |
| **I2** | nunca `appendOrUpdate` em escrita por chave | 🔴 **VIOLADO** — foi a origem do risco de **linha órfã em 4 nós** |
| **I3** | campo não observado grava **vazio**, nunca `0` | 🔴 **VIOLADO** — é o **M4 na Prospecção**, mesma doença nº 1 |
| **I4** | dedup por `place_id`; **nome nunca é chave** | 🔴 **VIOLADO** — quebrou o dedup **e** o `Search deal`. É a **R14** (identidade por chave errada) |
| **I5** | todos os leads vão à planilha e ao CRM | 🟢 **sem violação registrada** — decisão do Olavo 27/08 |
| **I6** | nenhum gasto de LLM antes de identidade mínima | 🔴 **VIOLADO, e custou dinheiro** — *“gastamos Gemini para produzir recusas que marcavam o lead como pronto”* |
| **I7** | score é fato (= **M5**, = ADR-003) | 🟢 **sem violação registrada** |
| **I8** | P6 **só lê** o CRM; P5 é o único que escreve | 🟡 **QUASE** — o §12.1 do brief de 13/09 **proibiu** o uploader separado que teria quebrado |
| **I9** | `Potencial Comercial` roteia oferta, não gateia abordagem | 🟢 **sem violação registrada** — decisão do Olavo 10/07 |
| **I10** | todo workflow ativo tem descrição **fiel** | 🔴 **VIOLADO AGORA** — **3 workflows têm descrição de outro.** É a **R5**, e está aberto. [História](BASE-04-INCIDENTES.md#8-D8-intencao-nao-escrita) |
| **I11** | o lead é sempre um **DEAL** | 🟢 **sem violação registrada** — decisão do Olavo 28/08. Evitou **353 companies órfãs** |

---

## 5. **R1–R15** — as regras de trabalho

**Dono:** 🔴 [`CLAUDE.md` da raiz](../../CLAUDE.md). **O texto de cada regra mora lá, e só lá.**
**As histórias** moram em [`BASE-04-INCIDENTES.md`](BASE-04-INCIDENTES.md).

| # | Uma linha | Já foi violada? Quando? |
|---|---|---|
| **R1** | chat-mãe planeja; execução vai para sub-chat | 🔴 **VIOLADA** (a regra nasceu disso). [História](BASE-04-INCIDENTES.md#11-D11-execucao-no-chat-mae) |
| **R2** | etapa concluída = doc atualizada na mesma sessão | 🔴 **VIOLADA 5 vezes** — **doença nº 2**. [História](BASE-04-INCIDENTES.md#2-D2-documento-que-mente) |
| **R3** | sub-chat registra no Notion, senão o digest morre | 🔴 **VIOLADA de forma contínua** — *“hoje ele avisa ‘sem progresso’ porque ninguém escreve na DB”* |
| **R4** | *“onde estamos, quanto falta, o que atualizei?”* | ⬜ **não verificado** |
| **R5** | todo artefato carrega a própria história | 🔴 **VIOLADA, e está aberta** — o `I10` acima: 3 descrições copiadas. [História](BASE-04-INCIDENTES.md#8-D8-intencao-nao-escrita) |
| **R6** | plano aceito não dispensa verificação | 🔴 **VIOLADA 4 vezes** — **doença nº 4**, duas delas pelo próprio chat-mãe em 02/10. [História](BASE-04-INCIDENTES.md#4-D4-numero-e-gravidade-herdados) |
| **R7** | nada se cria sem plano pronto | 🔴 **VIOLADA** — `1º Enriquecimento`, `id_hubspot`, 6 dimensões do score. [História](BASE-04-INCIDENTES.md#9-D9-construir-o-que-ja-existia) |
| **R8** | skill primeiro; subagente é exceção | 🟢 **sem violação registrada**. [Contexto](BASE-04-INCIDENTES.md#12-D12-orquestracao-onde-skill-bastava) |
| **R9** | alinhar → planejar → isolar → revisar | 🔴 **VIOLADA** — entrevista pedida **depois** da construção, 16/09. [História](BASE-04-INCIDENTES.md#10-D10-entrevista-atrasada) |
| **R10** | modelo caro só onde há julgamento | ⬜ **não verificado** |
| **R11** | sucesso silencioso é o modo de falha da casa | 🔴 **VIOLADA 7 vezes** — **doença nº 1**. [História](BASE-04-INCIDENTES.md#1-D1-vazio-vira-outra-coisa) |
| **R12** | configuração de teste volta na mesma sessão | 🔴 **VIOLADA 4 vezes** — **doença nº 3**. [História](BASE-04-INCIDENTES.md#3-D3-estado-temporario-que-nao-volta) |
| **R13** | leia o que está NO AR, não o que está na tela | 🔴 **VIOLADA 3 vezes** — **doença nº 5**. [História](BASE-04-INCIDENTES.md#5-D5-rascunho-confundido-com-o-ar) |
| **R14** | identidade por chave declarada e não-coagível | 🔴 **VIOLADA 2 vezes**, e **uma continua aberta** (o join do webview). [História](BASE-04-INCIDENTES.md#6-D6-identidade-por-posicao) |
| **R15** | todo brief diz onde commito, leio e registro | 🔴 **VIOLADA 2 vezes** (branch), **e uma 3ª vez em 03/10** — ver abaixo. [História](BASE-04-INCIDENTES.md#7-D7-branch-ditada-por-engano) |

> 🔴 **A R15 foi exercida em 03/10, e funcionou.** O brief desta Fase 1 declarava
> `claude/consolidacao-2026-08`; a **instrução da sessão** do executor declarava outra branch —
> **que não existe no remoto e é idêntica à `main`**. Pela R15 o executor **parou antes do primeiro
> commit e avisou**, em vez de escolher sozinho. **O Olavo decidiu, e só então houve commit.**
>
> **É a terceira ocorrência da mesma doença, e a primeira que não custou nada.** A diferença entre
> esta e as de 26/09 e 29/09 **não foi mais destaque no texto: foi uma trava que exige reconciliar
> antes de existir commit.**

---

## 6. 🔴 O que este índice revela — e é por isso que ele não é cópia

| O que a contagem mostra | Número |
|---|---|
| invariantes e regras mapeados | **39** (12 M + 1 S + 11 I + 15 R) |
| 🔴 **com violação registrada e custo** | **17** |
| 🟡 pegos antes de executar (a regra funcionou) | **3** (M6, I8, R15 em 03/10) |
| 🟢 sem violação registrada | **9** |
| ⬜ **não verificados** | **5** (M9, I1, R4, R10, e o M5 do lado dos consumidores) |

> 🔴 **A leitura que a lista de contrato não dá:** **os 4 invariantes mais violados da casa — M4, M10,
> M2 e I3 — são todos a MESMA doença**: *“não sei” e “zero” saindo iguais*. Eles estão em três
> documentos diferentes, com três nomes diferentes, e por isso **pareciam quatro problemas**. São um.
>
> **Quem for consertar causa-raiz nesta casa, começa por aí** — e não por ordem de numeração.

> ⚠️ **E os 5 ⬜ não-verificados são a dívida honesta desta página.** Não foram marcados 🟢 para a
> tabela ficar bonita. **`sem violação registrada` e `não procurei` são coisas diferentes, e aqui se
> escrevem diferente.**
