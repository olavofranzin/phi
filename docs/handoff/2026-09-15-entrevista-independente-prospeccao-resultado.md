# Resultado — Entrevista Independente da Prospecção

| | |
|---|---|
| **Status** | ✅ **CONCLUÍDO** — entendimento comum confirmado pelo Olavo em 2026-09-14 |
| **Brief** | `docs/handoff/2026-09-15-entrevista-independente-prospeccao-brief.md` |
| **Plano comparado** | `docs/strategic-planning/prospeccao/PLANO-ENTREGA-FINAL-PROSPECCAO.md` §10.2–§10.6 |
| **Método** | 12 perguntas em 3 rodadas (skill `grilling`), conduzidas **em texto** e não por formulário — preferência registrada do Olavo por conversa |
| **Registro R3** | Notion, DB *PHI — Registro de Execuções (Sub-chats)* |

> **Declaração de leitura (honestidade pedida no brief §1):** as seções §10.2–§10.6 **não foram lidas**
> antes de escrever a §2 deste documento. O plano §1–§9 e §10.1 foi obtido por uma leitura filtrada
> que excluía §10.2–§10.6; só abri o arquivo completo depois da confirmação do Olavo. Os documentos de
> apoio (`CLAUDE.md` da frente, `CONTRATO-PROSPECCAO.md`, `ESTADO-DO-PROJETO.md` §0, `CLAUDE.md` raiz)
> foram lidos em versão **resumida**, não byte a byte — detalhe fino deles pode ter escapado.

---

## 1. Perguntas e respostas (na íntegra)

### Rodada 1

**Q1 — Follow-up automático no Instagram pode não ser possível.**
A API oficial de mensagens do Instagram só permite responder a quem escreveu antes, numa janela curta;
não inicia conversa com desconhecido nem repete mensagem sem resposta. Automatizar DM fria exige
ferramenta não oficial (contra os termos). E existe **uma só conta** que envia: se cair, a prospecção
para e a agência perde o canal de vitrine.
Opções: A) 1º contato manual no Instagram + follow-up automático em outro canal · B) tudo manual no
Instagram · C) ferramenta de automação aceitando o risco.
Recomendado: A.
> **Olavo:** *"A (podemos também eleger alguns leads que receberão este contato por DM — que a
> finalidade é criar um "quebra-gelo", para não chegar um "desconhecido" oferecendo serviço)"*

**Q2 — E o lead que não tem Instagram?**
Sem perfil, não há como contatar por DM; a skill de descoberta de redes (item 11) não existe; e o ICP
seria aprendido só com quem está no Instagram (viés do tipo do I5, na saída).
Opções: A) fila de outro canal, com o canal registrado · B) não contata na v1, marca "sem canal" ·
C) escolher setores com alta presença no Instagram.
Recomendado: B + C.
> **Olavo:** *"A"*

**Q3 — "Não respondeu" não é "não quer".**
DM de desconhecido cai em "Solicitações de mensagem". O silêncio pode ser falha do canal. Marcar como
perdido ensina aos agentes que aquele perfil é ruim.
Opções: A) motivo próprio "sem resposta", separado de "recusou"; volta depois por outro canal ·
B) manter perdido · C) motivo próprio, sem volta.
Recomendado: A.
> **Olavo:** *"A"*

**Q4 — Contatar antes ou depois da troca HubSpot → Odoo?**
Os workflows ainda gravam no HubSpot; o Odoo (F3/F5) está previsto perto de 30/11.
Opções: A) começar agora pelo HubSpot · B) começar agora com desfecho anotado à mão na planilha ·
C) esperar o Odoo.
Recomendado: B.
> **Olavo:** *"C"*

### Rodada 2

**Q5 — Esperar o Odoo pode derrubar o B2 da v1.**
O B2 ("um lead percorreu os 6 estágios") vence em 30/11; se os contatos só começam com o Odoo pronto,
o B2 falha por calendário.
Opções: A) um **lead piloto** assim que o F3 permitir; o volume continua esperando · B) B2 sai da v1 ·
C) manter e torcer pelo checkpoint de 31/10.
Recomendado: A.
> **Olavo:** *"A"*

**Q6 — Canal do follow-up, se WhatsApp API e ESP próprio estão fora da v1.**
`DEFINICAO-DE-PRONTO-PHI-V1.md` §4 corta "ESP de e-mail próprio" e "WhatsApp Cloud API/BSP". O e-mail
do lead depende do item 10, que não existe.
Opções: A) e-mail por conta Gmail/Workspace via n8n, limite baixo; item 10 vira pré-requisito ·
B) follow-up todo manual por WhatsApp na v1 · C) trocar critério para incluir WhatsApp API.
Recomendado: A, com B de reserva.
> **Olavo:** *"A (o CRM tem como configurar um servidor de e-mail para envio, com relação ao whatsapp
> se não for possível o envio automático, será feito manual e anotado no CRM, o importante é a
> estratégia da cadência de contatos, dias entre uma atividade e outra, indicação do NBA, mensagens
> personalizadas por canal; o tático, ou seja, como se dará o envio pode ser adaptado às
> circunstâncias, principalmente enquanto o volume for pequeno. Inclusive acredito que a estratégia de
> cadência pode iniciar diferente para cada lead.)"*

**Q7 — Como escolher quem recebe o quebra-gelo.**
Se forem os melhores leads, nunca se sabe se responderam pelo quebra-gelo ou por serem melhores.
Opções: A) sorteio 50/50 no setor, coluna `aquecimento` · B) por prioridade · C) todos.
Recomendado: A.
> **Olavo:** *"A (escolha pode ser realizada pelo agente)"*

**Q8 — Enriquecer todos os setores agora, se o contato começa em dezembro?**
Cada setor leva 2–5 semanas de contato; o último setor seria contatado meses depois de enriquecido —
dados velhos e custo pago cedo.
Opções: A) descoberta de todos agora; enriquecimento caro só do setor da vez, perto do ciclo ·
B) enriquecer tudo agora · C) enriquecer agora e refazer antes do contato.
Recomendado: A.
> **Olavo:** *"A mas neste inicio B (como o setor também não tem um critério estabelecido no momento,
> acredito que possamos fazer uma pesquisa profunda para escolhermos 2 setores e fazermos ao mesmo
> tempo, o que acha?)"*
>
> **Resposta dada ao Olavo:** boa ideia, com a condição da Q9. Critérios sugeridos para a pesquisa de
> setores: volume de empresas do setor na cidade · capacidade de pagar até R$ 500/mês · presença ativa
> no Instagram · falhas digitais visíveis nos dados que já coletamos.

### Rodada 3

**Q9 — Variáveis demais para 100 contatos por setor.**
2 setores × quebra-gelo × canal × cadência por lead, com 2–5 clientes esperados por setor: não se
separa o que funcionou. E 2 setores juntos levam o dobro do tempo para fechar 100 contatos cada.
Opções: A) 1º ciclo com 2 setores e **cadência padrão única**; cadência por lead no 2º ciclo ·
B) cadência por lead já no 1º (aprendizado só qualitativo) · C) 1 setor por vez.
Recomendado: A.
> **Olavo:** *"A"*

**Q10 — O sorteio não deve ser do agente.**
LLM não sorteia de verdade: "escolher metade ao acaso" vira escolha por características, e o problema
da Q7 volta. Pela R8, regra fixa é skill/código, não agente.
Opções: A) regra fixa no workflow (ex.: par/ímpar derivado do `place_id`), agente só lê `aquecimento` ·
B) agente sorteia.
Recomendado: A.
> **Olavo:** *"A"*

**Q11 — Cadência automática com uma pessoa só para responder.**
Os e-mails continuam saindo com o Olavo doente, viajando ou ocupado entregando para os primeiros
clientes; o lead responde e ninguém atende.
Opções: A) (1) resposta do lead **para a cadência** e cria tarefa com prazo; (2) **pausa geral** para
ausência ou limite de clientes em entrega · B) só (1) · C) nenhuma.
Recomendado: A.
> **Olavo:** *"A (a trava 2 apenas para ausência)"*

**Q12 — Resposta a "quanto custa?" no primeiro contato.**
O enriquecimento já é um diagnóstico do lead e pode ser a resposta.
Opções: A) faixa de preço + mini-diagnóstico gratuito; CRM registra "perguntou preço" · B) não fala de
preço antes de conversa · C) preço cheio.
Recomendado: A.
> **Olavo:** *"oferecer o mini-diagnóstico, o CRM registra a objeção e eu decidirei se o lead receberá
> uma mensagem com uma faixa de preço ou se tentaremos marcar uma reunião para apresentar o
> mini-diagnóstico e tentar o fechamento."*

### Resumo das decisões

| # | Tema | Decisão |
|---|---|---|
| Q1 | Canal e automação | 1º contato **manual**; follow-up automático em **outro canal**; DM no Instagram para **alguns leads** como **quebra-gelo**, não oferta |
| Q2 | Sem Instagram | **fila de outro canal**, com **canal registrado** |
| Q3 | Sem resposta | motivo **"sem resposta"** ≠ "recusou"; pode voltar por outro canal |
| Q4 | Início | contato em volume **espera o Odoo** |
| Q5 | B2 | **lead piloto** assim que o F3 permitir |
| Q6 | Cadência | e-mail pelo **servidor de e-mail do Odoo**; WhatsApp manual anotado no CRM; **estratégia > tática**; cadência pode diferir por lead |
| Q7 | Quebra-gelo | **sorteio**, coluna `aquecimento` |
| Q8 | Enriquecimento | regra: descoberta de todos, enriquecimento do setor da vez; **no início, enriquece tudo**; **pesquisa profunda** para escolher **2 setores simultâneos** |
| Q9 | 1º ciclo | 2 setores, **cadência padrão única**; cadência por lead no **2º ciclo** |
| Q10 | Sorteio | **regra fixa no workflow**; agente só lê |
| Q11 | Travas | resposta **para a cadência** + tarefa; **pausa geral só para ausência** |
| Q12 | "Quanto custa?" | **mini-diagnóstico** + objeção registrada; **Olavo decide** entre faixa de preço ou reunião |

---

## 2. Conclusões (escritas ANTES de abrir §10.2–§10.6)

1. **O canal escolhido não aceita o que foi planejado para ele.** DM fria automatizada viola os termos
   do Instagram. O Instagram deixa de ser canal de cadência e vira canal de quebra-gelo.
2. **O follow-up automático esbarrava no próprio escopo da v1.** WhatsApp API e ESP próprio estão
   cortados. A saída é o servidor de e-mail do Odoo — o que torna o **item 10 (e-mail do lead)
   pré-requisito da cadência**.
3. **"Não respondeu" gravado como "perdido"** ensinaria errado aos agentes desde o 1º ciclo.
4. **Contatar só por Instagram distorceria o ICP** — o viés do I5, só que na saída.
5. **Esperar o Odoo quebra o B2 por calendário.** Solução: lead piloto.
6. **Enriquecer muito antes de contatar** desperdiça dinheiro e envelhece o dado — problema de
   *momento*, distinto do *volume × custo* do §4.
7. **Variáveis demais para amostra pequena.** Com 100 contatos por setor não se separam causas;
   cadência por lead fica para o 2º ciclo.
8. **Agente de IA não sorteia.** Sorteio é regra fixa (R8).
9. **Cadência automática com uma pessoa só queima leads que responderam.** Parar cadência na resposta +
   pausa geral na ausência.
10. **O enriquecimento já é um mini-diagnóstico pronto** — é a resposta para a objeção de preço.

**Ponto aberto, registrado como risco aceito e sem dono:** a pausa geral ficou só para ausência. **Não
há trava para quando a entrega aos clientes consumir o tempo de prospecção.**

---

## 3. Comparação com o chat-mãe (§10.2–§10.6)

| Achado | Chat-mãe | Eu |
|---|---|---|
| Gargalo é falar com o lead, não achar lead (88–220 contatos/mês) | ✅ §10.2 | — |
| Rodízio de credenciais Apify perde o motivo | ✅ §10.2 | — |
| Score passa a ordenar fila curta, não filtrar | ✅ §10.2 | — |
| Duas velocidades: coleta barata p/ todos, enriquecimento caro só na fila | ✅ DD1 (motivo: custo) | ✅ Q8 (motivo: dado envelhece) |
| Sistema entrega fila, não lote | ✅ DD2 | — |
| Sinal em 3 etapas | ✅ DD5 | — |
| Afogamento de follow-up; contrato assume cadência ≥ 8 | ✅ §10.4 | — |
| Automatizar DM no Instagram arrisca banimento do perfil da agência | ✅ §10.5 | ✅ Q1 |
| Mudança do Instagram de 2ª etapa (§2) para 1º contato | ✅ §10.5 | ✅ (resolvido: vira quebra-gelo) |
| Lead precisa ter Instagram → item 11 vira pré-requisito | ✅ §10.5 | ✅ Q2 |
| "Isca" de R$ 500 precisa de 2º passo desenhado | ✅ §10.6 | — |
| **Lead sem Instagram enviesa o ICP** (não só "não é contatável") | — | ✅ Q2 |
| **"Sem resposta" precisa de rótulo próprio**, não só permanecer na base | parcial (DD6) | ✅ Q3 |
| **WhatsApp API e ESP estão fora da v1** — follow-up automático sem canal permitido | — | ✅ Q6 |
| **Item 10 (e-mail) é pré-requisito da cadência** | parcial (citado na saída 2 do §10.5) | ✅ Q6 |
| **Esperar Odoo derruba B2 por calendário → lead piloto** | — | ✅ Q5 |
| **Dado enriquecido envelhece entre enriquecer e contatar** | — | ✅ Q8 |
| **Variáveis demais para 100 contatos → cadência padrão no 1º ciclo** | — | ✅ Q9 |
| **Sorteio feito por LLM não é aleatório** | — | ✅ Q10 |
| **Cadência continua após resposta / na ausência do único contato** | — | ✅ Q11 |
| **Mini-diagnóstico como resposta à objeção de preço** | — | ✅ Q12 |
| **Sem trava entre carga de entrega e prospecção** | (reconhecido fora do doc) | ✅ risco aceito |

---

## 4. Pontos novos

| # | O que é | Por que importa | O que fazer |
|---|---|---|---|
| **N1** | WhatsApp Cloud API e ESP próprio estão **fora da v1** (`DEFINICAO-DE-PRONTO` §4) | o DD4 ("automatizado do 2º toque") não tinha canal permitido | e-mail pelo **servidor de e-mail do Odoo** (não é ESP próprio); WhatsApp manual anotado no CRM. **Confirmar que "servidor de e-mail do Odoo" não fere o corte da §4** e registrar |
| **N2** | **Item 10 (extrair e-mail do site) vira pré-requisito** da cadência | sem e-mail, não há toque automático; lead sem site cai para manual | subir o item 10 na ordem do §7, antes da etapa 6 |
| **N3** | **B2 falha por calendário** se o contato só começa com Odoo pronto | regra "corta escopo, não empurra data" tiraria B2 da v1 sem necessidade | **lead piloto** no Odoo assim que o F3 permitir; registrar na `DEFINICAO-DE-PRONTO` |
| **N4** | Motivo **"sem resposta" ≠ "recusou"**, com reentrada por outro canal | DD6 mantém o lead na base, mas com rótulo errado o dado de treino ensina errado | nova opção em `motivo_perda` + regra de reentrada; atualizar `CONTRATO` (R2) |
| **N5** | **Canal usado** registrado por contato | com multi-canal (Q2), resultado sem canal não é comparável; evita viés de ICP só-Instagram | coluna de canal do 1º contato; atualizar `CONTRATO` |
| **N6** | **Coluna `aquecimento`** preenchida por **regra fixa** (derivada do `place_id`) | mede se o quebra-gelo funciona; LLM não sorteia | regra no workflow, agente só lê; atualizar `CONTRATO` com o dono da coluna |
| **N7** | **1º ciclo com cadência padrão única** e 2 setores | com 100 contatos/setor, variar cadência por lead impede saber o que funcionou | cadência por lead só no 2º ciclo; ciclo de 2 setores dura ~2× o estimado em §10.2 |
| **N8** | **Resposta do lead interrompe a cadência** + tarefa com prazo; **pausa geral** na ausência | evita follow-up automático para quem já respondeu e lead ignorado | requisito da etapa 6 (cadência) |
| **N9** | **Mini-diagnóstico** como resposta a "quanto custa?"; objeção registrada; Olavo decide faixa de preço ou reunião | reaproveita o enriquecimento e diferencia a agência | 1º item do DB de objeções (`docs/comercial/base-vendas/`) |
| **N10** | **Pesquisa profunda para escolher 2 setores** | não há critério de setor hoje | critérios: volume no município · capacidade de pagar até R$ 500 · presença ativa no Instagram · falha digital visível nos nossos dados |
| **N11** | **Risco aceito:** nenhuma trava entre carga de entrega e prospecção | primeiros clientes consomem o tempo de contato justamente quando a venda funciona | registrar como risco sem dono; revisitar ao fechar o 1º cliente |

---

## 5. Discordâncias com o chat-mãe

1. **DD3 — "um setor por vez".** O Olavo decidiu **2 setores simultâneos** no 1º ciclo (Q8/Q9), com
   cadência padrão para manter a comparação limpa. Consequência: o §10.2 ("~1 mês por ciclo") vira
   **~2 meses** para fechar 100 contatos em cada um dos dois.
2. **DD1 — "enriquecimento só na fila".** Correto como regra, mas o Olavo decidiu **enriquecer tudo no
   início** (Q8), porque ainda não há critério de setor. O motivo mais forte do DD1 não é só custo: é
   o **dado envelhecer** até o contato — que ganha peso com a espera pelo Odoo (Q4).
3. **DD4 — "cadência automatizada".** Não tinha canal permitido na v1 (N1). E o Olavo deslocou o foco:
   **o que precisa estar desenhado é a estratégia** (intervalos, NBA, mensagem por canal); o envio é
   tático e pode ser manual enquanto o volume for pequeno.
4. **§10.2 — 88–220 contatos/mês.** Supõe que toda a capacidade diária vai para contato **novo**. Com
   follow-up manual por WhatsApp (Q6) e quebra-gelo (Q1), parte desses 4–10 por dia é toque de lead
   antigo — o número real de contatos novos é menor.
5. **§10.5 — o problema não é só "automatizar DM".** A API oficial **não permite iniciar** conversa com
   desconhecido; qualquer semi-automação de 1º contato já cai fora dos termos. Por isso a decisão do
   Olavo (quebra-gelo manual para alguns leads sorteados) é mais segura que a saída 1 do §10.5.
