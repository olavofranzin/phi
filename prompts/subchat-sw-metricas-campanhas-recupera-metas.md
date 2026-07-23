# Correção — node "Code Recupera Metas p Comparação" (workflow "sw metricas campanhas")

> Comece rodando o comando **`/goal`** com este objetivo:
> *"Deixar o node 'Code Recupera Metas p Comparação' do workflow n8n 'sw metricas campanhas' à prova de falha na leitura do meta_valor, com a solução mais simples possível e sem mudar o comportamento."*

## Como você deve trabalhar (regras — siga sempre)
- **Fale comigo sempre em português, de forma simples e sem jargão.**
- **Antes de mudar algo grande, me explique o plano e espere eu aprovar.**
- **Prefira a solução mais simples que resolve. Nada de complicar sem motivo.**

---

## O problema (em linguagem simples)

O workflow **"sw metricas campanhas"** (id `W571K320aqIHsdtH`, no n8n via MCP) deu erro no node **`Code Recupera Metas p Comparação`**:

```
Cannot assign to read only property 'name' of object
'Error: Node 'Edit Fields' hasn't been executed'
```

**Por que acontece:** esse node lê um valor de outro node chamado **`Edit Fields`**, com esta linha:

```js
const meta_valor = $('Edit Fields').first().json.meta_valor || 0;
```

O problema é buscar o valor **direto no `Edit Fields`**. Se em alguma execução o `Edit Fields` não tiver rodado, essa linha quebra — o n8n acusa **"Node 'Edit Fields' hasn't been executed"**, e a mensagem confusa "Cannot assign to read only property 'name'" é só a forma como o n8n 2.30.6 mostra esse mesmo erro.

O node recebe os dados do node anterior (`Code Cálcula Métricas`). O caminho ativo é:
`Code Valida Dados → Edit Fields → Code Cálcula Métricas → Code Recupera Metas p Comparação`.

## O que precisa ser feito

Fazer o node **ler o `meta_valor` de um jeito que não quebre** caso o `Edit Fields` não tenha rodado — sem mudar mais nada do comportamento.

Dois jeitos simples (escolha o mais simples que funcionar, **e me explique antes de aplicar**):

- **Opção 1 (mais simples, se funcionar):** ler o valor do próprio dado que já chega no node, em vez de buscar no `Edit Fields`:
  ```js
  const meta_valor = Number(data.meta_valor) || 0;
  ```
  → Só serve se o `meta_valor` já vier dentro do item que chega no node. Confirme isso primeiro (veja o output do `Code Cálcula Métricas` numa execução real).

- **Opção 2 (à prova de falha):** tentar ler do `Edit Fields` e, se não der, usar o dado que já chega:
  ```js
  let meta_valor = 0;
  try {
    meta_valor = Number($('Edit Fields').first().json.meta_valor) || 0;
  } catch (e) {
    meta_valor = Number(data.meta_valor) || 0;
  }
  ```
  → Importante: **no `catch`, não mexa no objeto de erro** (nada de `e.name = ...`) — foi exatamente isso que o n8n não deixou fazer. Só ignore o erro e use o valor de reserva.

Essa é a **única** mudança necessária. Não altere a lógica dos limiares (`sop_thresholds`), o `metric_principal`, nem a estrutura do `return`.

## Regras do projeto (PHI)
- Code node em **sintaxe v2**: `$input.first()`, `$('Nome do Nó').item`.
- **Só aplique no n8n depois que eu aprovar o plano.** A mudança é num único node.
- Mantenha o resto do node exatamente como está.

---

## VERIFICAÇÃO
1. **Descreva como você vai verificar se o resultado está correto** — antes de aplicar, me diga em uma frase como vai testar. O esperado é:
   - **Reexecutar uma execução real** do workflow `W571K320aqIHsdtH` (caminho ativo) e confirmar que o node `Code Recupera Metas p Comparação` **conclui sem erro** (checkmark verde).
   - Confirmar que `sop_config.meta_valor` sai com **o mesmo número de antes** (não pode regredir, não pode virar `undefined`).
2. Se possível, use uma execução histórica real e faça o **retry** com o node já corrigido.
3. Me mostre o valor de `meta_valor` para eu confirmar que está certo.

Se em algum ponto você ficar na dúvida sobre qual valor é o "certo" para o `meta_valor`, **pare e me pergunte** — não invente um valor.
