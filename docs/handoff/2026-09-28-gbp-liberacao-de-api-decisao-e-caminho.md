# GBP — a cota zero é falta de aprovação, não excesso de uso (decisão do Olavo, 28/09)

| | |
|---|---|
| **Decisão** | ✅ **Olavo, 2026-09-28: pedir a liberação.** *"1 e 2 = ok"* |
| **O que destrava** | **12 indicadores** e **2 pilares inteiros** do Índice de Saúde Digital do Negócio — Visibilidade/Descoberta e Reputação, hoje com **peso zero e rótulo "não medido"** (ADR-41, D7) |
| **Quem faz** | 🔴 **o Olavo.** Não é tarefa de sub-chat: é pedido ao fornecedor, com a conta que administra os locais |
| **Prazo** | **do Google, não nosso** |

---

## 1. O diagnóstico, medido em 28/09

| | |
|---|---|
| **Erro exato** | `429 RESOURCE_EXHAUSTED` · `RATE_LIMIT_EXCEEDED`, **toda rodada** |
| **A quota lida** | 🔴 **`DefaultRequestsPerMinutePerProject = 0`** no projeto **`641951006374`** |
| **Desperdício?** | ❌ **não** — as duas chamadas da rodada são de **`id_gbp_local` distintos**. A hipótese de "chamada errada gastando cota" foi verificada e **derrubada** |
| **Estado da tabela** | `phi_prod.t28_gbp_daily`: **1 linha, de 21/06**, ingerida em 22/06 e nunca mais |

---

## 2. 🔴 O que a cota zero significa — e por que a porta óbvia é a errada

**Cota 0 não é "passamos do limite". É "este projeto nunca foi aprovado".**

Pela documentação do Google e pelos relatos públicos da comunidade:

| Cota do projeto | O que significa |
|---|---|
| **0 QPM** | 🔴 **não aprovado** — o acesso básico **nunca foi concedido** |
| **300 QPM** | 🟢 aprovado (é o padrão da maioria das APIs do Business Profile depois da aprovação) |

> 🔴 **E a armadilha, que já fez gente esperar meses:** com cota **0**, **não se pede aumento de
> cota** — pedido de aumento é para quem **já tem** acesso básico. O caminho certo é a
> **Application for Basic API Access**, pelo formulário de contato das APIs do Business Profile.
> **Bater na porta errada não dá erro: dá silêncio** — e é isso que os relatos da comunidade mostram.

---

## 3. O caminho, e o que eu NÃO pude verificar

1. **Pedir o acesso básico** (*Application for Basic API Access*) pelo **formulário de contato das
   APIs do Business Profile**, para o projeto **`641951006374`**.
2. Depois de aprovado, a cota padrão entra (**300 QPM** na maioria das APIs da família) — e **só
   então**, se for pouco, se pede aumento pelo mesmo formulário, opção *Quota Increase Request*.

> ⚠️ **O que eu não consegui conferir daqui:** a página de pré-requisitos do Google
> (`developers.google.com/my-business/content/prereqs`) **está bloqueada pela política de rede deste
> ambiente**. Confirme na própria página quais APIs precisam estar ativadas no projeto e o que o
> formulário pede — **não escrevi aqui campo de formulário que eu não li**.
>
> *(Se quiser que eu leia essas páginas em sessões futuras, o host `developers.google.com` precisa
> entrar nos domínios permitidos do ambiente, em Editar → Acesso à rede.)*

---

## 4. Enquanto não vem — o que fica combinado

| | |
|---|---|
| **O índice NÃO espera** | os dois pilares seguem com **peso zero e rótulo "não medido"**, que é exatamente o desenho do **D3/D7 do ADR-41**. **Pilar sem fonte não vira zero, nem some: aparece declarado** |
| **O gatilho já está escrito** | ADR-41, **D10**: *"Visibilidade · Reputação entram quando a cota do GBP for destravada e `t28_gbp_daily` receber a 1ª linha"*. **É gatilho, não data — dispara sozinho quando acontecer** |
| **Quem avisa** | o **V4 do vigia**, todo dia às 08h. No dia em que a tabela receber linha nova, **o alarme dela some** |
| 🔴 **O que NÃO fazer** | **não tirar o GBP do índice** por estar parado, e **não estimar** os indicadores dele. Estimar seria inventar nota — é o que o **S1** proíbe |

---

## 5. Fonte

- [Usage limits — Google Business Profile APIs](https://developers.google.com/my-business/content/limits)
- [Prerequisites — Google Business Profile APIs](https://developers.google.com/my-business/content/prereqs)
- [My Business API enabled but 0 quota (Google Cloud Dev)](https://groups.google.com/g/google-cloud-dev/c/-PMXjld3OL8)
- [Business Profile API quota increase request — no response from Google](https://support.google.com/business/thread/222003029/business-profile-api-quota-increase-request-no-response-from-google?hl=en)
