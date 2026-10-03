# Ficha — `operador unico metricas`

| | |
|---|---|
| **Tipo** | workflow n8n · `cLcimNoefTOnVVbd` · 🟢 **ativo, 04:00 BRT** |
| **Verificado em** | 2026-10-03, pelo **sub-chat da Fase 1**, **contra** `panorama-workflows-phi.md` (linha 72), o verbatim do Olavo em `PLANO-ENTREGA-FINAL-PHI.md` §3.3.1 e os handoffs `2026-05-09-A5-auditoria-execution-id.md` / `2026-05-10-A6-pipeline-execution-id-fix.md` / `2026-05-11-A6c-implementation-adr010.md` |
| ⬜ **NÃO verificado contra o n8n** | esta fase não abriu o n8n. **O artefato vence** (**R13**) |

## O que faz
**Orquestra os 3 grãos de coleta** (campanha, conjunto, anúncio) às 04:00 BRT e **dá a eles um
`execution_id` único**. Não escreve dado próprio — **carimba identidade de rodada**.

## 🔴 Por que existe
🟡 **Parcialmente sourced.** O **propósito** está escrito (`panorama` linha 72): *“dá `execution_id`
único aos 3 grãos”*, e há uma linhagem de handoffs sobre `execution_id` (**A5**, **A6**, **A6c /
ADR-010**) que mostra que **isso foi um conserto deliberado, não um acidente**.

🔴 **E ele acumulou um segundo papel que ninguém desenhou, mas que é hoje o mais importante:**

> **Olavo, verbatim, 2026-09-20:** *“o único alerta que recebo é quando há algum erro que impediu o wf
> operador único de rodar.”*

**Ele é o único detector de falha do PHI que chega a um humano.** ⬜ **Se isso foi intenção ou efeito
colateral, não está escrito. A perguntar ao Olavo.**

## O que substituiu, e por quê
| | |
|---|---|
| **substituiu** | ⬜ **a perguntar.** A série A5/A6/A6c sugere que antes **cada grão gerava o seu próprio `execution_id`** — mas **não achei o texto que afirma isso**, e **não deduzo** |
| **por quê** | 🟡 o problema que os handoffs atacavam era de **`execution_id`** (identidade de rodada). **O porquê exato da centralização: ⬜ a perguntar** |

## Quem escreve / quem lê
| | |
|---|---|
| **chama** | `sw metricas campanhas` (às 04h) · `sw metricas conjuntos` · `sw métricas anúncios` |
| **escreve** | — (orquestra; o `execution_id` viaja com os dados dos chamados) |
| **quem depende dele** | 🔴 **o Olavo** — é a única fonte de alarme que lhe chega |

## O que acontece quando a fonte falta
| | |
|---|---|
| **se ELE falha** | 🟢 **chega alarme.** É o único caso coberto |
| 🔴 **se um dos chamados falha** | **silêncio.** *“Se houver falha na coleta, não haver coleta, enfim, qualquer outra falha só sei se abrir o Notion e ver alguma incoerência”* |
| ⚠️ **o defeito estrutural medido** | *“espera por 2 que não produzem”* — ele aguarda `conjuntos` e `anúncios`, e **`raw_ad_data` ficou vazia 3 meses, verde**. Viola o **M10** |

## A prova, com número
| | |
|---|---|
| **a cobertura real do alarme, medida** | **1** evento coberto (*“o operador único não conseguiu rodar”*) contra **todas** as outras falhas silenciosas. O chat-mãe havia escrito *“5 workflows dos 26 cobertos”*; **o Olavo corrigiu para pior** (§3.3.1) |
| **o detector real** | *“o olho do Olavo, abrindo o Notion e reparando numa incoerência”*. 🔴 **Com 1 cliente dá; com 12, não** — é o que transforma o **F3** de critério de qualidade em **condição de escala** |
| **grãos esperados × grãos produtivos** | **3 chamados, 1 produzindo** (`raw_ad_data` vazia 3 meses; `conjuntos` classificado 2× como *“ativo que não produz nada”*) |

> 🔴 **E o `sw metricas conjuntos` estava certo o tempo todo.** Ele *“existe, roda e escreve no
> Notion”*, e foi chamado de improdutivo por **duas varreduras seguidas** porque **a régua faltava** —
> o Olavo mostrou em 20/09 que o nível do conjunto é onde **metade das causas vive**
> ([`BASE-01` §7](../BASE-01-PRINCIPIOS.md)). **Não era workflow inútil; era documentação ausente.**

## ⬜ O que falta perguntar
| # | |
|---|---|
| **1** | **Ele foi feito para ser o alarme, ou virou o alarme por acidente?** Muda o desenho do **F3** |
| **2** | **O que havia antes da centralização do `execution_id`?** |
| **3** | 🔴 **Ele deve continuar esperando por grãos que não produzem?** |
