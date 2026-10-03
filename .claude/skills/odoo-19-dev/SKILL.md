---
name: odoo-19-dev
description: Desenvolvimento de módulos no Odoo 19 — modelos e campos do ORM, restrições, views XML (form, list, kanban), herança por xpath, segurança e estrutura de módulo. Use ao criar ou alterar qualquer coisa em docs/comercial/odoo/addons/, ao mexer em layout de tela do Odoo, ao escrever campo, constraint, view ou arquivo de dados, e ao interpretar erro de instalação/upgrade de módulo. Cobre o que MUDOU no Odoo 19 frente ao 17/18. Para as regras do módulo phi_crm e do CRM do PHI, ver a skill phi-odoo-crm.
metadata:
  version: 1.0.0
---

# Odoo 19 — desenvolvimento de módulo

> **Fonte da verdade:** o código do Odoo 19, via Context7 `/odoo/odoo/19.0`.
> **Não chute API do Odoo.** Consulte antes de escrever. As diferenças entre 17, 18
> e 19 são reais e silenciosas — erram sem avisar.
>
> Referência complementar (18 guias, não verificados linha a linha):
> `github.com/unclecatvn/agent-skills/tree/main/skills/odoo-19.0`

## O que mudou no 19 — verificado na fonte

| Assunto | Antigo | **Odoo 19** |
|---|---|---|
| View de lista | `<tree>` | **`<list>`**, e `list,form` no `view_mode` |
| Restrição SQL | lista `_sql_constraints = [...]` | **`models.Constraint(...)` como atributo de classe** |
| Modificadores na view | `attrs="{'invisible': [...]}"` | expressão direta: `invisible="not campo"` |

```python
# Odoo 19 — restrição de banco
class MinhaModel(models.Model):
    _inherit = "crm.lead"

    _minha_chave_unica = models.Constraint(
        "UNIQUE(minha_chave)",
        "Mensagem que o usuário vê quando o banco recusa.",
    )
```

## Widgets: exibição ≠ edição

**Antes de usar um widget num campo editável, confirme que ele tem modo de edição.**

`widget="badge"` é **só exibição**. Num campo editável ele:
- deixa o campo **sem onde digitar**;
- renderiza o valor `0` como **vazio** — apaga o zero verdadeiro.

**Regra:** `badge` só em campo **derivado/computado**. Para colorir um número
editável, use o número como campo normal e ponha a cor numa etiqueta computada ao
lado, com `decoration-success/warning/danger`.

## Herança de view

Ancore o `xpath` em **estrutura**, não em campo específico — campos mudam de nome
entre versões, `//notebook` não:

```xml
<xpath expr="//notebook" position="before">  <!-- grupos antes das abas -->
<xpath expr="//notebook" position="inside">  <!-- nova aba -->
```

`position` aceita: `inside`, `replace`, `before`, `after`, `attributes`.

## Armadilha: o campo que revela o próprio bloco

Um campo usado em `invisible="not X"` de um grupo **não pode morar dentro desse
grupo** — ficaria impossível de preencher pela tela. Deixe-o fora e sempre visível.

## Arquivos de dados: `noupdate`

`<odoo noupdate="1">` manda o Odoo **pular registros que já existem**. Se o objetivo
do arquivo é **renomear ou corrigir** registro nativo, `noupdate="1"` anula isso —
os registros novos entram, os existentes ficam intactos. Só use `noupdate` para
semente que o usuário pode editar livremente.

## Deploy: Python exige reinício

O Odoo importa os `.py` no boot e os mantém em memória. O botão **Atualizar** do
módulo recarrega **XML apenas**. Mexeu em `models/` → **reinicie o container antes**,
senão a view nova referencia campo que o modelo em memória ainda não tem:

```
O campo "<nome>" não existe no modelo "<model>"
```

Não é erro de código — é código que ainda não foi carregado.

## Antes de dar o módulo por pronto

1. Python compila (`python3 -m compileall`)
2. XML bem formado
3. **Todo campo do modelo tem par na view, e vice-versa**
4. Nenhum widget de exibição em campo editável
5. Descreva como verificar cada item **na instância** — o resto só o install confirma
