# [RASCUNHO] ADR-30 — Cadência de intervenção (Janelas) no Maestro + Ordem Sagrada no Agente 5

> **STATUS:** RASCUNHO (git, design-canônico). Aprovado em princípio por Olavo
> 2026-07-31 (Passo 2 da leitura do Método Subido). Vira `Aceito` quando os prompts
> refinados estiverem no nó vivo + validados.
>
> **ESCOPO:** deliberadamente **separado** do Guardião (ADR-29) e da consolidação das
> regras (doc `regras-otimizacao-metodo-subido.md`, commit `085e232`). Aqui só as **duas
> regras que viram cláusula dura** em dois prompts.

## Contexto

O doc `regras-otimizacao-metodo-subido.md` destilou o Método Subido em substrato. Duas
regras não bastam ficar "no substrato" — precisam virar **comportamento** dentro dos
prompts, senão o agente pode: (a) recomendar mexer **fora de hora** (destrói o aprendizado
do algoritmo / age por ansiedade), ou (b) propor mudança de **estrutura/destino** antes de
esgotar **lance/criativo**. São a §4 (Janelas — *quando* agir) e a §5 (Ordem Sagrada —
*o que* mexer, e em que ordem).

## Decisão

1. **Maestro (Agente 0) — JANELA na triagem.** Além de ruído vs sinal:
   - Análise **diária = só monitoramento** (não recomendar mudança na conta, salvo
     anomalia/falha técnica ou emergência).
   - Cadência por tipo: curta (≤~30d) a cada 2-3 dias · média (~60d) a cada 4 dias ·
     perene a cada 7 dias.
   - **Exceção (intervir já):** resultado catastrófico ("penhasco") ou pressão
     estratégica real.
   - Fora da janela e sem emergência (ou sem saber a janela) → **OBSERVAR** até a próxima.

2. **Agente 5 (Hipóteses & Priorização) — ORDEM SAGRADA.** Além do ICE/RICE:
   - Ordenar/taguear por **medição (precondição) → Lances → Criativos → Públicos →
     Estrutura → Destino**.
   - Não propor nível superior (estrutura/destino) antes de esgotar os inferiores, salvo
     justificativa explícita.
   - Novo campo de saída **`camada_alteracao`**.

Aplicado no **doc canônico** (`modulo-28-analise-cognitiva.md`, Agentes 0 e 5) e
**sincronizado no nó Maestro** do `WF-T28-Analise-Campaign` (mesma disciplina do ADR-28).

## Alternativas consideradas

1. **Deixar as regras só no doc de substrato.** Rejeitado: substrato é citável, mas não
   força comportamento — o agente poderia ignorar.
2. **Implementar a Janela como gate determinístico num nó.** Rejeitado *por ora*: a janela
   depende do tipo/estado da campanha (julgamento contextual) e o payload ainda não carrega
   "dias desde a última intervenção". Pode virar gate determinístico depois, quando o
   payload tiver esse dado.

## Consequências

- (+) Evita **otimização por ansiedade** (Janela) e **preserva o aprendizado** do algoritmo
  (Ordem Sagrada).
- (+) **Auditável:** cada hipótese carrega `camada_alteracao`; a decisão do Maestro registra
  a janela aplicada.
- (−) Depende de o payload informar **tipo de campanha / última intervenção**; sem isso o
  Maestro é conservador (observa) e marca `[HIPÓTESE]` → candidato a enriquecer no payload
  (Client Knowledge Pack).
- (−) "Medição é precondição" na Ordem Sagrada **reforça a dependência do Guardião**
  (ADR-29): não adianta otimizar performance sobre métrica-mãe podre.

## Reavaliar quando

- O payload passar a carregar tipo de campanha + dias-desde-última-intervenção → parte da
  Janela pode migrar para gate determinístico.
- E2 entrar (Agente 5 vira nó): re-sincronizar o prompt com o nó, como no Maestro.

## Conexões com ADRs vigentes

- `regras-otimizacao-metodo-subido.md` §4/§5 (fonte destilada).
- **ADR-28** (Maestro E1): o nó Maestro é sincronizado com o Agente 0 canônico.
- **ADR-29** (Guardião): "medição é precondição" na Ordem Sagrada conecta aqui.
- **Roster:** Agente 5 (Hipóteses & Priorização) e Maestro.
