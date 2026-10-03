# PROSP-05 — repontar do HubSpot para o Odoo

> Estado: **plano, aguardando OK do Olavo.** Nada executado.
> Data: 2026-09-09 · Workflow: `PROSP-05 CRM-out (deal + id)` (`94lSWJfxfu653KdN`)

## 1. R6 — o rascunho divergente foi resolvido

O `CONTRATO-PROSPECCAO.md` descrevia o P5 como **inativo, 7 nós**. A instância diz
**ativo, 10 nós**, com `versionId` ≠ `activeVersionId` — um rascunho não publicado.
Antes de tocar em qualquer coisa, comparei rascunho e versão publicada nó a nó.

**Veredito: a divergência é cosmética.** Os 10 nós são os mesmos (mesmos ids, nomes,
tipos e parâmetros). A única diferença é **posição no canvas**: seis nós deslocados
+224px em X, de "Buscar deal" para a direita. Alguém arrastou o desenho em 08/09.
As outras diferenças de serialização (`inputSource`, `mode: manual`, `type: string`)
são valores-padrão que o rascunho omite — sem efeito.

Os 3 nós "a mais" frente à doc entraram em 28/08, com descrição própria: `[SMOKE]
Trigger manual`, `[SMOKE] Lead de teste` e `[P5] Dados de entrada`. **A doc está
velha, não descreve outro workflow.** Corrigir o contrato faz parte desta entrega.

Nota: `active: true` com `triggerCount: 0`. O P5 é sub-workflow — "ativo" aqui não
significa que roda sozinho; ele só roda quando o P4 o chama, ou pelo trigger manual.

## 2. O achado que muda a ordem

O nó de planilha do **P5** grava a coluna **`id_hubspot`**, casando por `id`.
O nó de planilha do **P6** também casa por **`id_hubspot`** e grava
**`data_sync_hubspot`** — e é aí que o loop de aprendizado está parado há 11 dias.

Ou seja: **os dois workflows dependem do mesmo nome de coluna.** Se a planilha já foi
renomeada para `id_crm`, o P5 está falhando calado exatamente como o P6 — o nó tem
`onError: continueRegularOutput`, que engole o erro e reporta sucesso.

**Não sei qual é o cabeçalho real da planilha hoje.** Os `schema` dos nós no n8n são
cache do momento em que foram configurados, não leitura ao vivo. **Isto precisa ser
conferido na planilha antes de qualquer escrita** — é a premissa que sustenta o plano
inteiro (R6).

## 3. O plano de repontar (5 passos)

1. **Conferir o cabeçalho da aba `leads`** e anotar aqui o nome real da coluna do id.
2. **Trocar os 2 nós HubSpot por Odoo** no P5:
   - `[P5] Buscar deal por place_id` → Odoo, recurso `custom`, modelo `crm.lead`,
     filtro `gbp_place_id = {{ $json.place_id }}`
   - `[P5] Criar deal` → Odoo `create` em `crm.lead`, com `gbp_place_id`, `name`,
     `phone`, `description`
3. **Renomear a coluna escrita** de `id_hubspot` para `id_crm` no nó de planilha,
   e o campo derivado para `id_crm`.
4. **Tirar o `onError: continueRegularOutput`** do nó de planilha. Foi ele que
   escondeu a quebra do P6 por 11 dias. Falha de escrita tem que aparecer.
5. **Smoke com o lead Niti** (já tem `place_id`, exercita o ramo de reuso e não cria
   nada), depois carga inicial em dry-run.

## 4. Guardrails que valem aqui

- O P5 **nunca** escreve `stage_id`, ganho ou perdido — o estágio é do humano.
- Upsert sempre por `gbp_place_id`. **Nome nunca é chave.**
- A `UNIQUE(gbp_place_id)` no banco é a rede de segurança: se dois processos criarem
  o mesmo lead ao mesmo tempo, o segundo é recusado pelo Postgres, não por nós.
- **Nada de carga real sem OK.**

## 5. Pendências fora deste plano

- Credencial de API do Odoo (usuário-bot + chave de 3 meses) — bloqueia o passo 2.
- P6 lendo do Odoo com os nomes `crm*` — adiado pelo Olavo.
- 127 linhas da planilha sem `place_id` — sem explicação até agora.
