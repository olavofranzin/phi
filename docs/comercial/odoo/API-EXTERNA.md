# API externa do Odoo — como o n8n fala com o CRM

> **Status: confirmado em 09/09/2026** na instância `crm.franzcomunicacao.com`
> (Odoo 19 Community, self-hosted).

## A dúvida que isso resolve

Ao criar a credencial Odoo no n8n aparece:

> *"Requires Odoo 19+ and a Custom pricing plan (not available on One App Free or
> Standard). Uses the /json/2 External JSON-2 API."*

E a documentação oficial diz:

> *"Access to data via the external API is only available on Custom Odoo pricing
> plans. Access to the external API is not available on One App Free or Standard
> plans."*

**Isso NÃO se aplica a nós.** "One App Free", "Standard" e "Custom" são planos de
assinatura do **Odoo Online (SaaS)**. Nossa instalação é **Community self-hosted** —
não existe assinatura para o Odoo consultar. A mensagem do n8n é aviso estático,
não verificação da instância.

## A prova

Requisição sem chave e sem `Content-Type`:

```
POST https://crm.franzcomunicacao.com/json/2/res.users/context_get

HTTP/1.1 415 Unsupported Media Type
Accept: application/json

Request inferred type is compatible with ['http'] but
'/json/2/<__model__>/<__method__>' is type='json2'.
```

O servidor **repete o padrão da rota** na resposta: ele reconheceu o endpoint e
parou na negociação de conteúdo — passo posterior ao roteamento.

| Se fosse | Resposta |
|---|---|
| endpoint inexistente | 404 |
| bloqueado por plano | 403 com menção a plano |
| **existe, faltou header** | **415** ← foi o que veio |

Reforça: o traceback do exemplo de erro na própria doc da Odoo mostra o caminho
`/opt/Odoo/community/odoo/http.py` — o `/json/2` rodando em **Community**.

## Como chamar

```
POST /json/2/<model>/<method>
Authorization: bearer <API_KEY>
Content-Type: application/json; charset=utf-8
X-Odoo-Database: phi_crm      (opcional — só se o dbfilter não resolver pelo Host)
```

O corpo é um objeto JSON com `ids`, `context` e os parâmetros do método, **todos
nomeados** — não há argumento posicional no JSON-2.

## Usuário-bot, não o administrador

A doc recomenda explicitamente usuário dedicado para integração:

- permissão mínima → menor estrago se a chave vazar;
- **senha vazia** → desabilita login por senha;
- o log de acesso mostra o bot, não uma pessoa.

Para nós: **`n8n@franzcomunicacao.com`**, interno, com acesso só a Vendas/CRM.

## ⚠️ A chave expira em 3 meses — sem exceção

> *"it is not possible to create keys that last for more than three months. This
> means that long lasting keys must be rotated at least once every three months."*

**Isto é compromisso operacional, não detalhe.** Sem rotação, a integração para.

E o precedente é ruim: o `PROSP-06` ficou **11 dias reportando sucesso sem gravar
nada** porque o erro era engolido. Uma chave expirada tem que **falhar alto**.

Rotação programática existe — `res.users.apikeys.generate()` — destravada pelo
parâmetro de sistema `base.enable_programmatic_api_keys`.

## Uma chamada = uma transação

> *"All calls to the JSON-2 endpoint run in their own SQL transaction... it is not
> possible to chain multiple calls inside a single transaction."*

O upsert é `buscar` → `criar`: **duas transações**. Entre elas, outra execução pode
criar o mesmo lead.

**A restrição `UNIQUE(gbp_place_id)` do módulo cobre isso** — o banco recusa a
segunda. Se um dia virmos corrida de verdade, o caminho que a doc aponta é um
método único no `phi_crm` que faça tudo numa transação só.

## XML-RPC — plano B que não precisamos

`/xmlrpc/2` e `/jsonrpc` continuam funcionando no Odoo 19; a doc marca remoção só
no **Odoo 22 (outono de 2028)**. Como o JSON-2 funciona, não vamos usá-los.

## Testar a qualquer momento

**Windows (CMD)** — aspas duplas, tudo numa linha:

```
curl -i -X POST https://crm.franzcomunicacao.com/json/2/res.users/context_get -H "Content-Type: application/json" -d "{}"
```

Esperado sem chave: **401** com `"Invalid apikey"` — prova que o endpoint responde.
Com chave válida: **200** com o contexto do usuário.

> No CMD do Windows a barra `\` não quebra linha e aspas simples não agrupam
> argumentos. Comando de exemplo em formato Linux falha com
> `Could not resolve host: application`.

## Fontes

- `https://www.odoo.com/documentation/19.0/developer/reference/external_api.html`
- Teste na instância, 09/09/2026 (a resposta 415 acima)
