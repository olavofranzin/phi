# Correção — node "Code Recupera Metas p Comparação" (workflow "sw metricas campanhas")

> Comece rodando o comando **`/goal`** com este objetivo:
> *"Corrigir o erro do node 'Code Recupera Metas p Comparação' no workflow n8n 'sw metricas campanhas', mantendo o comportamento atual, com a solução mais simples possível."*

## Como você deve trabalhar (regras — siga sempre)
- **Fale comigo sempre em português, de forma simples e sem jargão.**
- **Antes de mudar algo grande, me explique o plano e espere eu aprovar.**
- **Prefira a solução mais simples que resolve. Nada de complicar sem motivo.**

---

## O problema (em linguagem simples)

O workflow **"sw metricas campanhas"** (id `W571K320aqIHsdtH`, no n8n via MCP) está dando erro no node **`Code Recupera Metas p Comparação`**:

```
Cannot assign to read only property 'name' of object
'Error: Node 'Edit Fields' hasn't been executed'
```

**Por que acontece:** esse node lê um valor de outro node chamado **`Edit Fields`**, com esta linha:

```js
const meta_valor = $('Edit Fields').first().json.meta_valor || 0;
```

Só que o node `Edit Fields` **nem sempre roda**. O fluxo tem dois caminhos que chegam no mesmo lugar (`Code Cálcula Métricas`, que alimenta o node com problema):

- **Caminho Google:** `Code Valida Dados → Edit Fields → Code Cálcula Métricas → Code Recupera Metas p Comparação`
- **Caminho Meta Ads:** `Merge Meta Ads → Code Cálcula Métricas → Code Recupera Metas p Comparação` (aqui o `Edit Fields` **não roda**)

Quando a execução vem pelo **caminho Meta Ads**, o `Edit Fields` não foi executado, então a linha acima quebra. A mensagem "Cannot assign to read only property 'name'" é só a forma confusa que o n8n 2.30.6 tem de mostrar o erro real, que é: **"Node 'Edit Fields' hasn't been executed"**.

## O que precisa ser feito

Fazer o node **ler o `meta_valor` de um jeito que não quebre** quando o `Edit Fields` não tiver rodado — sem mudar mais nada do comportamento.

Dois jeitos simples (escolha o mais simples que funcionar, **e me explique antes de aplicar**):

- **Opção 1 (mais simples, se funcionar):** ler o valor do próprio dado que já chega no node, em vez de buscar no `Edit Fields`:
  ```js
  const meta_valor = Number(data.meta_valor) || 0;
  ```
  → Só serve se o `meta_valor` já vier dentro do item nos **dois** caminhos (Google e Meta). Confirme isso antes (o caminho Meta passa por `Code Cálculo Dados Meta`, que também mexe em `meta_valor`).

- **Opção 2 (à prova de falha):** tentar ler do `Edit Fields` e, se não der, usar o dado que já chega:
  ```js
  let meta_valor = 0;
  try {
    meta_valor = Number($('Edit Fields').first().json.meta_valor) || 0;
  } catch (e) {
    meta_valor = Number(data.meta_valor) || 0;
  }
  ```
  → Importante: **no `catch`, não mexa no objeto de erro** (nada de `e.name = ...`) — foi justamente isso que o n8n não deixou fazer. Só ignore o erro e use o valor de reserva.

Essa é a **única** mudança necessária. Não altere a lógica dos limiares (`sop_thresholds`), o `metric_principal`, nem a estrutura do `return`.

## Regras do projeto (PHI)
- Code node em **sintaxe v2**: `$input.first()`, `$('Nome do Nó').item`.
- **Só aplique no n8n depois que eu aprovar o plano.** A mudança é num único node.
- Mantenha o resto do node exatamente como está.

---

## VERIFICAÇÃO
1. **Descreva como você vai verificar se o resultado está correto** — antes de aplicar, me diga em uma frase como vai testar. O esperado é:
   - **Testar o caminho Meta Ads** (o que estava quebrando): reexecutar uma execução que passou por `Merge Meta Ads` (sem `Edit Fields`) e confirmar que o node `Code Recupera Metas p Comparação` agora **conclui sem erro** (checkmark verde) e que `sop_config.meta_valor` sai com um número (não quebra, não vira `undefined`).
   - **Testar o caminho Google** (não pode regredir): reexecutar uma execução que passou por `Edit Fields` e confirmar que `meta_valor` continua vindo com o **mesmo valor de antes**.
2. Se possível, use uma execução histórica real de cada caminho (procure nas execuções do workflow `W571K320aqIHsdtH`) e faça o **retry** com o node já corrigido.
3. Me mostre o valor de `meta_valor` nos dois casos para eu confirmar que está certo.

Se em algum ponto você ficar na dúvida sobre qual valor é o "certo" para o `meta_valor`, **pare e me pergunte** — não invente um valor.
