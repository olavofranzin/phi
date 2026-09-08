# ADR-35 — Contrato da Frente Prospecção: uma coluna, um dono

| | |
|---|---|
| **Status** | ✅ **ACEITO** — 2026-09-08 |
| **Substitui** | `CONTRATO-PROSPECCAO.md` (que era "proposta para aprovação" desde 2026-08-28) |
| **Escopo** | Quem grava o quê na planilha `leads` e no CRM; qual é o parque de workflows da Prospecção |
| **Decisor** | Olavo |
| **Documentos-filho** | `CONTRATO-PROSPECCAO.md` (detalhe normativo) · `panorama-workflows-prospeccao.md` (inventário) |

---

## 1. Contexto

A frente Prospecção chegou a **19 workflows para 7 funções reais**, com até 3 implementações
concorrentes ativas ao mesmo tempo. Isso produziu uma classe de defeitos que não eram bugs de
código, e sim **ausência de dono declarado por coluna**:

| Achado (2026-08) | Consequência |
|---|---|
| `Site L4` gravava `"="` em colunas de outro dono | Apagava dado bom |
| `executeOnce: true` dentro de loop | Só o 1º lead do lote recebia `id_hubspot` |
| Linhas nascendo só com `place_id` | Gemini recusava; a recusa marcava a linha como "pronta" para sempre |
| Dedup filtrava por `dealstage` sem pedir `dealstage` | Nunca encontrou uma duplicata |
| Ligação dupla no `Criar deal` | Produzia 2 deals por lead na origem |

**O problema-raiz não era quantidade de workflow — era que nenhum deles era dono de um contrato.**

## 2. Decisão

Adotar como **norma vigente** o `CONTRATO-PROSPECCAO.md`, com três pilares:

### 2.1. Princípio único
> **Uma coluna, um dono.** Cada coluna da aba `leads` tem exatamente **um** workflow autorizado a
> escrevê-la. Todos podem ler; nenhum outro pode escrever — nem para "limpar", nem para "atualizar".

### 2.2. Parque canônico — 8 workflows `PROSP-NN`
```
[01 Intake] → [02 Descoberta] → [03 Scoring] → [04 Enriquecimento] → [05 CRM-out]
                                                                          ↓
                                   [06 Aprendizado] ← CRM · [07 Zeladoria] · [08 Dedup]
```
**Tudo o que não estiver nessa lista é arquivado.**

### 2.3. Invariantes (I1–I11) — não mudam sem novo ADR
`I1` uma coluna um dono · `I2` nunca `appendOrUpdate` em escrita por chave (só `update`; append só na
criação, só pelo 02) · `I3` campo não observado grava **vazio**, nunca `0`/`false`/`"="` · `I4` dedup
por `place_id`, junção por `id_hubspot`, **nome nunca é chave** · `I5` todos os leads descobertos vão
à planilha e ao CRM (o corte governa **gasto**, não entrada) · `I6` nenhum gasto de LLM antes de
validar identidade mínima · `I7` score é fato (ADR-003) · `I8` só o 05 escreve no CRM; o 06 só lê ·
`I9` `Potencial Comercial` roteia oferta, não gateia abordagem · `I10` descrição de workflow fiel ·
`I11` lead é sempre **DEAL**; Company só no pós-venda.

### 2.4. Decisões incorporadas (Olavo, 2026-08-28)
`D1` lead = DEAL apenas · `D2` intake = Telegram · `D3` não tratar o passivo de duplicatas agora ·
`D4` manter `status hubspot` (dono: 06) e descontinuar `hubspot_estagio`.

---

## 3. As-built reconciliado — **inventário real do n8n em 2026-09-08**

> ⚠️ **Esta seção existe porque a documentação anterior estava desatualizada.** O panorama de
> 2026-08-27 descrevia workflows que **não existem mais** (ex.: `1º Enriquecimento`). O que segue é
> leitura direta do n8n via MCP em 2026-09-08.
> **Método:** inventário por nome, descrição, estado ativo e data de atualização. **Não** foi
> refeita a auditoria nó a nó — ver §5.

### 3.1. O parque existe e está ATIVO (muito além do que a doc dizia)

| # | Workflow | ID | Ativo | Atualizado | Doc anterior dizia |
|---|---|---|---|---|---|
| 01 | `PROSP-01 Intake (Telegram)` | `kmsaomlIzj48YnCL` | ✅ | 2026-09-02 | "desmembrar — pendente" → **feito** |
| 02 | `PROSP-02 Descoberta (Places API)` | `n7Z0xwi1dCDioln1` | ✅ | 2026-09-03 | "inativo, em validação" → **ativo** |
| 03 | `PROSP-03 Scoring (motor de regras)` | `V0f80LU1ZH8PUtdc` | ✅ | 2026-09-04 | "⬜ a criar" → **criado e ativo** |
| 04 | `PROSP-04 Enriquecimento` | `EFD7Drr0LDMqfDXw` | ✅ | 2026-09-08 | "absorver o L4" → **feito + PageSpeed** |
| 05 | `PROSP-05 CRM-out (deal + id)` | `94lSWJfxfu653KdN` | ✅ | 2026-08-30 | "construído, inativo" → **ativo** |
| 06 | `Comercial - Sync HubSpot → Planilha` | `WRFU2NM8rLJU7bRT` | ✅ | 2026-09-04 | conforme — **falta renomear** |
| 07 | `Comercial - Guarda-Schema + Backup` | `vUI0pPlDASf64Htn` | ✅ | 2026-08-27 | conforme — **falta renomear** |
| 08 | `Comercial - Deduplicar Leads HubSpot` | `izimrLm19H4i6LOq` | ✅ | 2026-08-29 | conforme — **falta renomear** |

**Ganhos não documentados até hoje:**
- **O 01 virou intake de verdade**: conversa no Telegram, o agente propõe frases de busca, resumo com
  **botão de aprovação** e só então dispara o 02 — uma vez por frase. Não descobre, não pontua, não
  enriquece. O desmembramento (P1+P2+P4+P5 num workflow só) **está concluído**.
- **O 03 nasceu já com a Fase 3.1 do plano**: `fit × oportunidade` com **rank percentil dentro da
  mesma `Searchstring`** — não é o `max()` antigo.
- **O 04 mede o site** (HTML + **PageSpeed**) e o agente redige **sobre a medição**, com guard I6 e
  fila `potencial_comercial ≥ 60`. Escreve 10 colunas, todas dele.
- **O 05 está ativo** como único escritor do CRM.

### 3.2. Migrações únicas (rodam sob demanda, corretamente inativas)
| Workflow | ID | Papel |
|---|---|---|
| `PROSP-BF Backfill place_id nos deals` | `nJOHONMffxiO6dxp` | grava `place_id` nos deals antigos |
| `PROSP-LO Limpar linhas órfãs do sync` | `K3nfaJhbzfPW41fC` | **novo, não documentado antes** — apaga as órfãs do P6 antigo |

### 3.3. Diagnóstico (novos, inativos, custo zero — não documentados antes)
`DIAG - Conferir chave Google (Places + PageSpeed)` `u0EODAKSXHBJkAKX` ·
`DIAG - Lacuna P2 vs L2 (cobertura da Places)` `G5msnvZXjNRJso8H` ·
`DIAG - Buscas já rodadas na base (Searchstring)` `W0Rx5xLLIWAp1eDt` ·
`DIAG - Custo das execuções do Apify` `CprF1aeBAJouF95T`

### 3.4. Já **deletados** do n8n (a doc ainda os listava como "a arquivar")
`1º Enriquecimento` · `L2 Discovery (Pipeline A)` · `L2 Discovery (ignora id hubspot)` ·
`L1 Core Engine (teste)` · `Automate Scrape Google Maps Business Leads` · `Enriquecimento Site L4` ·
`kED2 HubSpot - Atualizar status` (48 nós) · `5VRPLUB3 Criar deal` (absorvido pelo 05).

### 3.5. Ainda presentes e inativos — **arquivar** (único item de limpeza que resta)
`WPP Intake - Evolution API` `tDdJIhFLyyDqqSNE` · `WPP Intake copy 2` `ZV1fFFrRTRQX2dik` ·
`Intake - db's apify` `GUQkIWnMZEH32PXH` · `SCRATCH reviews` `2BWz5V6MGK5IBaxa` ·
`💥 Apify vide II` `nuEJi4WO8NFJjrUP`

### 3.6. Placar

| | 2026-08-27 (doc antiga) | **2026-09-08 (real)** |
|---|---|---|
| Workflows de prospecção | 19 | **8 canônicos + 2 migração + 4 diagnóstico** |
| Funções com implementação concorrente | 5 | **0** |
| Do parque-alvo construído | 3 de 8 | **8 de 8** |
| Fases do plano de migração concluídas | 0 e parte da 1 | **0, 1, 2 e a 3.1** |

---

## 4. Consequências

1. **A frente Prospecção está essencialmente construída.** O que resta é **acabamento**, não obra:
   renomear 06/07/08, arquivar 5 workflows mortos e rodar as migrações únicas.
2. **O `CONTRATO-PROSPECCAO.md` deixa de ser proposta** e passa a valer como norma. Divergência
   entre contrato e workflow é bug do workflow.
3. **Toda mudança nos invariantes I1–I11 exige novo ADR.**
4. 🔴 **Ponto aberto que este ADR NÃO resolve — a migração do CRM.** Todo o contrato foi escrito
   para **HubSpot**. A decisão de migrar para **Odoo** (`decisao-substituicao-crm-hubspot-para-odoo.md`)
   muda o **alvo** do `PROSP-05` (CRM-out) e do `PROSP-06` (Aprendizado). Enquanto isso não for
   decidido, a Prospecção continua escrevendo no HubSpot. **Requer ADR próprio** (proposto: ADR-36).

## 5. O que NÃO foi verificado (honestidade de método)

- O inventário de 2026-09-08 foi feito por **nome, descrição, estado e data** via MCP do n8n.
  **Não** foi refeita a leitura nó a nó de cada workflow.
- Portanto: os defeitos residuais listados no panorama antigo (mapeamento `Endereço`/`Rua/Avenida`,
  `Update row(s)` com filtro malformado, duas contas Apify) **não foram reconfirmados nem
  desmentidos**. Ficam como pendência de auditoria.
- O passivo de dados (linhas sem `place_id`, leads sem `id_hubspot`) **não foi remedido** neste ADR.

## 6. Pendências desta frente (a lista fechada)

| # | Pendência | Tipo |
|---|---|---|
| P-1 | Renomear 06/07/08 para `PROSP-06/07/08` | acabamento |
| P-2 | Arquivar os 5 workflows inativos da §3.5 | acabamento |
| P-3 | Rodar `PROSP-BF` e `PROSP-LO` fora de dry-run | migração única |
| P-4 | Auditoria nó a nó dos 8 canônicos (fechar os defeitos residuais) | qualidade |
| P-5 | **Decidir o alvo do CRM (HubSpot × Odoo) → ADR-36** | 🔴 bloqueante estratégico |
| P-6 | 127 linhas sem `place_id` na coluna A — causa não explicada | dado |

---

*Uma coluna, um dono. E: se não está escrito, não aconteceu.*
