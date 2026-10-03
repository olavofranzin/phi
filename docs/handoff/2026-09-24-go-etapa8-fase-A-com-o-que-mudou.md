# [GO] Etapa 8 — Fase A liberada, com quatro coisas que mudaram desde 18/09

> Cole no **sub-chat da Saúde Digital** que está com a etapa 8. Substitui o go anterior, que não chegou.
> ✅ **Fases A → B → C liberadas, na ordem** · 🔴 **parada obrigatória depois da A** · **a C não começa
> sem o Olavo reconfirmar o D1 com a tabela na mão.**

---

## 1. O plano não mudou. O terreno mudou.

O brief de 18/09 continua válido. **Mas quatro coisas aconteceram entre 18 e 23/09 que mudam o que a
Fase A tem de olhar** — e duas delas **tocam exatamente o workflow que a Fase C vai aposentar**.

## 2. 🔴 O que mudou, em ordem de impacto

### 2.1. `raw_campaign_data` ganhou uma coluna nova — e ela é do outro sub-chat

**ADR-40, executado em 21/09:** `primary_metric_type` agora **viaja com a campanha**, gravada pelos
**dois** writers. `phi_score_history` também a ganhou.

> **A tabela de dono por coluna da Fase A tem de incluí-la** — e ela é o caso mais recente do padrão
> que este ADR combate: **dois writers, mesma coluna, escrita no mesmo dia.**

### 2.2. 🔴 Outro sub-chat está mexendo no `PHI - Subworkflow Campanhas` AGORA

O passo **B3 do ADR-39+40** — autorizado pelo Olavo em 22/09 — **remove o nó `Execute SQL
client_config sincronizado`** desse workflow. **É o mesmo workflow que a sua Fase C vai aposentar.**

| O risco | O que fazer |
|---|---|
| vocês dois lendo/editando o mesmo workflow em dias diferentes, cada um com a sua leitura | **na Fase A, releia a `activeVersion` no dia em que for usá-la** (R13) — não confie em leitura de 18/09 |
| a Fase C desabilitar a chamada antes de o B3 terminar | **a Fase C não começa sem o Olavo confirmar** — e ele saberá o estado do outro lado |

> ⚠️ **Não coordene diretamente com o outro sub-chat.** Reporte ao chat-mãe o que encontrar; a
> coordenação é daqui.

### 2.3. 🔴 O `ingestion_step` mente — e isso é material da sua Fase A

Achado de 23/09 (execução 41967 + análise da 42194): **o `WHEN MATCHED THEN UPDATE SET` do MERGE
atualiza `cost`, `conversions`, `primary_metric_type`, `ingested_at` — e NÃO atualiza
`ingestion_step`.**

Reescrita a linha, **o carimbo fica com o primeiro writer e os números com o último**. E o desempate
do SQL do score é literalmente `ORDER BY CASE WHEN ingestion_step = 'DAILY_ENTRY' THEN 0 ELSE 1 END`.

> **Isto é o argumento mais forte que a Fase C ganhou desde que foi escrita**: enquanto houver dois
> writers, **o campo que decide o vencedor não sabe quem escreveu.** Aposentar o segundo writer
> resolve o desempate por eliminação.
>
> **Para a Fase A:** a tabela de dono por coluna precisa de uma coluna a mais — **"é atualizada no
> `WHEN MATCHED`?"**. Uma coluna que existe no `INSERT` e não no `UPDATE` **tem dono diferente
> conforme o dia**, e isso não aparece lendo só quem escreve.

### 2.4. O CLI-13 não tem mais campanha ativa

Encerrada em 22/09. **Duas consequências:**
- a **P-26** (rótulo de plataforma) *"só afeta o CLI-13, que é teste"* — ela não sumiu, mas **perdeu
  o caso vivo**. Continua fora da Fase A/B, como já estava;
- **o parque hoje é só Google Ads.** A rodada do `sw metricas campanhas` processa 2 campanhas.

## 3. A ordem, e a parada

```
Fase A (ler + tabela de dono por coluna)
   ↓
🔴 PARADA OBRIGATÓRIA — traga a tabela e pare
   ↓
[DECISÃO do Olavo: P-20/D4 + reconfirmação do D1 COM A TABELA NA MÃO]
   ↓
Fase B (1.1 revenue + 1.4)   →   Fase C (aposentar — irreversível)
```

> **A Fase C é irreversível e o `D1` já foi invertido uma vez** (ADR-37 §3.0.3). **Ele não se
> reconfirma com o que o inventário supôs em 08/09 — se reconfirma com a tabela que você vai
> produzir.** É a **R6**: plano aceito não dispensa verificação.

## 4. O que a Fase A entrega

A tabela de dono por coluna de `raw_campaign_data`, **com três colunas obrigatórias por linha**:

| Coluna | Quem escreve no `INSERT` | **Quem atualiza no `WHEN MATCHED`** | Alguém lê? |
|---|---|---|---|

- a terceira coluna é a novidade de 23/09 (§2.3) e **não estava no brief original**;
- a quarta responde ao **M11** do `CONTRATO-PHI.md` (*todo dado escrito tem consumidor declarado*) —
  **coluna sem leitor vira candidata a sair**, não a migrar;
- inclua **`primary_metric_type`** (§2.1) e **`ingestion_step`**.

## 5. ⛔ Fora do escopo

- **Não conserte o `ingestion_step`** — ele some com a Fase C, e consertá-lo antes é trabalho
  descartável. **Registre no relatório.**
- **Não toque no `workflow_execution_log`** — a P-30 está decidida e é de outro trabalho
  (ADR-38 §25.11).
- **Não mexa no `client_config`** — é o ADR-39+40, outro sub-chat.
- **Não comece a Fase C** sem o OK explícito do Olavo, mesmo que a Fase A pareça conclusiva.

## 6. Leia antes (o que é novo)

| Documento | Por quê |
|---|---|
| `ADR-38` **§25.11** | a decisão da P-30 e o achado do `ingestion_step` |
| `ADR-40` **§10.2** | o mesmo achado, do lado da métrica |
| `saude-digital/CONTRATO-PHI.md` §3 | os invariantes **M1–M12**, que não existiam em 18/09 |
| `saude-digital/PLANO-ENTREGA-FINAL-PHI.md` §4 | os **8 critérios** do ponto final — sua Fase C serve ao **F2** |

## 7. Registro (R3)

Linha na DB Notion **"PHI — Registro de Execuções (Sub-chats)"** ao começar e ao encerrar a Fase A.
