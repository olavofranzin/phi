# Prospecção — contexto da frente

> Leia este arquivo ao trabalhar em qualquer coisa de Prospecção. Ele complementa o `CLAUDE.md` da
> raiz, não o substitui. **Regras R1–R9 da raiz valem aqui integralmente.**

## O que é esta frente
Descobrir negócios locais no Google Maps, pontuar o potencial comercial de cada um, enriquecer com
análise de GBP e de site, e levar ao CRM o lead com a oferta certa. **O PHI diagnostica e recomenda;
mover estágio e fechar é humano.**

## Ler antes de agir — nesta ordem
| # | Documento | Para quê |
|---|---|---|
| 1 | `PLANO-ENTREGA-FINAL-PROSPECCAO.md` | **o ponto final** — onde esta frente termina |
| 2 | `CONTRATO-PROSPECCAO.md` | **matriz de donos por coluna + invariantes I1–I11**. É lei |
| 3 | `ADR-35-...md` | por que o contrato existe e o que ele aposentou |
| 4 | `ADR-36-odoo-crm-canonico-reapontar-prospeccao.md` | a troca de HubSpot por Odoo |
| 5 | `2026-09-14-leitura-pesquisa-gbp-impacto-no-score.md` | o que a documentação oficial do Google diz — e o que ela **não** diz |
| 6 | `panorama-workflows-prospeccao.md` | o parque PROSP-01..08 |

## Os invariantes que mais se quebram aqui
- **I1** — uma coluna, um dono. Antes de escrever, confira a matriz do §3 do contrato.
- **I2** — nunca `appendOrUpdate`. Só `update`.
- **I3** — campo não observado grava **vazio**, nunca `0`.
- **I4** — a chave é o `place_id`. **Nome nunca é chave.**
- **I5** — todos os leads vão à planilha e ao CRM. Filtro de entrada enviesa o score.
- **I8** — **P5 escreve no CRM; P6 só lê** e atualiza a planilha.
- **I11** — o lead é sempre um **deal** (`crm.lead`). Company só no pós-venda.

## Armadilhas conhecidas (já custaram caro)
1. **Renomear coluna na planilha quebra workflow em silêncio.** Os nós casam por **nome de
   cabeçalho**, e com `onError: continueRegularOutput` a falha não aparece. Foi o que aconteceu com
   `id_hubspot` → `id_crm`. **Ao renomear qualquer coluna, caçar todos os nós que a citam.**
2. **O contrato já se contradisse** (listava `score_tecnico` e `ipc` como colunas que não existem).
   **Ler a seção inteira, não só a tabela.**
3. **As 6 dimensões do score não têm definição escrita** — a fórmula só existe no nó `Motor de Regras`.
   Não afirme o que uma dimensão mede sem ler o nó.
4. **Dois scores no projeto.** Aqui é `potencial_comercial` (lead). `phi_value` é campanha, outra
   frente.

## Onde as coisas moram
| Coisa | Onde |
|---|---|
| Workflows | n8n, prefixo **PROSP-01..08** |
| Base de leads e de aprendizagem | planilha `leads` (Google Sheets), backup diário |
| CRM | **Odoo 19** — `https://crm.franzcomunicacao.com`, módulo `phi_crm` |
| Módulo do CRM | `docs/comercial/odoo/addons/phi_crm/` |
| Briefs de execução | `docs/handoff/` |
