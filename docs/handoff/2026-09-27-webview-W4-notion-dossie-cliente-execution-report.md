# Relatório de execução — W4 Notion dossiê do cliente

| | |
|---|---|
| **Data** | 2026-09-27 |
| **Estado** | 🔴 **BLOQUEADO antes da primeira linha de código** |
| **Motivo** | Premissa crítica do deploy desmentida por leitura e build reproduzido |
| **Código** | `phi-dashboard-webview`, branch `webview` |
| **Documentação** | `phi`, branch `claude/consolidacao-2026-08` |

## Decisão de parada

O brief afirma que a VPS constrói com contexto na raiz e `webview/Dockerfile`, e proíbe alterar
esse Dockerfile. O artefato real contradiz a premissa:

1. `webview/Dockerfile` executa `COPY webview/ .`;
2. `webview/` não contém `src/` nem `server/`;
3. a reprodução do build falhou ao resolver `/src/main.tsx` referenciado por
   `webview/index.html`;
4. mesmo que o front compilasse, o estágio final executaria `node index.js` em `/app/server`, mas
   nenhum comando copia `server/` para a imagem.

```text
Rollup failed to resolve import "/src/main.tsx" from "webview/index.html"
```

Docker não está instalado no host. A etapa interna relevante foi reproduzida chamando o Vite
instalado dentro de `webview/`, sem editar arquivos rastreados. Pela regra final do brief — se uma
premissa cair, parar e devolver — nenhuma implementação W4 foi feita.

## Medições adicionais

- As peças do §2 existem: `server/index.js` tem 414 linhas, `server/notion.js` tem 423,
  `/api/clients` está na linha 368 e o hook ainda devolve o mock.
- O bug `x["Fone"]` está vivo; a propriedade real é `Telefone/WhatsApp`.
- A DB Clientes tem **11 clientes casados** e **6 com telefone**. O código atual encontra **0**
  porque `Fone` não existe. O ganho potencial 0 → 6 não foi implementado.
- As nove seções têm **41 chaves**, não “~35”.
- Existem `INATIVO`; o único `Segmento` selecionável é `Negócio Local`. Os enums do front estão
  desatualizados e não admitem aproximação.
- O ledger não possui `Frente = Webview`; foi usado `Produto PHI (core)` sem mudar o schema.

## Critérios de aceite

| CA | Estado | Prova / motivo |
|---|---|---|
| CA1 | ⏸ | `/api/clients` não alterado; parada anterior à implementação |
| CA2 | ❌ baseline | `useClientData.ts` ainda importa e devolve `CLIENT_DOSSIERS` |
| CA3 | ⏸ | mapa medido abaixo; destinos não implementados |
| CA4 | ⏸ | Notion: 11 casados, 6 com telefone; código atual: 0 pela chave inexistente |
| CA5 | ⏸ | depende do mapper W4, não criado |
| CA6 | ✅ | nenhum arquivo movido, renomeado ou editado no repo de código |
| CA7 | ✅ | nenhuma escrita no Notion adicionada |
| CA8 | ✅ | `.env` intocado; nenhum segredo entrou no diff |
| CA9 | ❌ bloqueante | contexto copiado não contém `src/main.tsx` nem `server/` |
| CA10 | ⏸ | sem implementação; caminho do score permaneceu intocado |

## Mapa completo: 41 chaves

“Destino” é o contrato planejado; nada abaixo foi implementado nesta volta.

| Seção | Chave → propriedade | Destino |
|---|---|---|
| Presença Digital | `instagram` → `Instagram` | valor ou `N/D` |
| Presença Digital | `site` → `Site` | valor ou `N/D` |
| Presença Digital | `gmb` → `Google Meu Negócio` | valor ou `N/D` |
| Presença Digital | `endereco` → `Endereço` | valor ou `N/D` |
| Presença Digital | `whatsappGrupo` → `Grupo WhatsApp` | valor ou `N/D` |
| Presença Digital | `drive` → `Pasta Google Drive` | valor ou `N/D` |
| Marca | `nome` → `Nome da Marca` | valor ou `N/D` |
| Marca | `tagline` → `Tagline` | valor ou `N/D` |
| Marca | `proposito` → `Propósito` | valor ou `N/D` |
| Marca | `valores` → `Valores` | valor ou `N/D` |
| Marca | `personalidade` → `Personalidade` | valor ou `N/D` |
| Comunicação | `tomVoz` → `Tom de Voz` | valor ou `N/D` |
| Comunicação | `mensagensChave` → `Mensagens-chave` | valor ou `N/D` |
| Comunicação | `evitar` → `O que Evitar` | valor ou `N/D` |
| Comunicação | `referencias` → `Referências de Marcas` | valor ou `N/D` |
| Mercado | `publicoAlvo` → `Público-alvo` | valor ou `N/D` |
| Mercado | `personas` → `Personas` | valor ou `N/D` |
| Mercado | `concorrentes` → `Concorrentes` | valor ou `N/D` |
| Mercado | `diferenciais` → `Diferenciais Competitivos` | valor ou `N/D` |
| Contatos | `responsavel` → `Responsável Principal` | valor ou `N/D` |
| Contatos | `email` → `Email` | valor ou `N/D` |
| Contatos | `telefone` → `Telefone/WhatsApp` | valor ou `N/D` |
| Contatos | `financeiro` → `Contato Financeiro` | valor ou `N/D` |
| Contatos | `operacional` → `Contato Operacional` | valor ou `N/D` |
| Comercial | `produtos` → `Produtos & Serviços` | valor ou `N/D` |
| Comercial | `ticket` → `Ticket/LTV` | moeda BRL ou `N/D` |
| Comercial | `funil` → `Funil de Vendas` | valor ou `N/D` |
| Comercial | `objecoes` → `Principais Objeções` | valor ou `N/D` |
| Comercial | `gatilhos` → `Gatilhos de Compra` | valor ou `N/D` |
| Arquivos | `logos` → `Pasta de Logos` | valor ou `N/D` |
| Arquivos | `fotos` → `Banco de Fotos` | valor ou `N/D` |
| Arquivos | `videos` → `Banco de Vídeos` | valor ou `N/D` |
| Arquivos | `documentos` → `Documentos Legais` | URL de `files` ou `N/D` |
| Branding | `paleta` → `Paleta de Cores` | valor ou `N/D` |
| Branding | `tipografia` → `Tipografia` | valor ou `N/D` |
| Branding | `grafismos` → `Grafismos & Elementos` | link ou `N/D` |
| Branding | `manualMarca` → `Manual da Marca` | valor ou `N/D` |
| Metas | `metaPrincipal` → `Meta Principal` | valor ou `N/D` |
| Metas | `kpis` → `KPIs` | valor ou `N/D` |
| Metas | `prazo` → `Prazo` | `DD/MM/AAAA` ou `N/D` |
| Metas | `orcamento` → `Orçamento` | moeda BRL ou `N/D` |

Cabeçalho: `client` ← `Sigla Cliente`; `id` mantém a rota; `status` usa o valor real sem transformar
`INATIVO` em `Pausado`; `niche` usa `Segmento` sem forçar enum; `tags` ← `Serviços Prestados`;
`notionUrl` ← `page.url`.

## Cobertura por cliente e seção

Não produzida: depende do mapper W4. Produzi-la com mock ou mapper não integrado violaria a regra
de parada. A leitura direta do Notion foi usada só para os fatos independentes (11 clientes e 6
telefones).

## Segurança e fora de escopo

1. `.env` da raiz está versionado e `.gitignore` não o ignora. Não foi editado nem removido.
2. `src/integrations/supabase/` e `supabase/functions/` existem. Não foram alterados.
3. W4b, escrita no Notion/BigQuery, score e Lovable pago ficaram fora, como previsto.
4. `CHECKLIST-webview.md` só existe em `claude/webview-metricas-clientes-lxps0l`; não foi marcado
   porque o lote não foi concluído e a branch não é a branch autorizada desta execução.

## Próxima decisão

O chat-mãe precisa reconciliar o deploy real e autorizar uma direção: corrigir os `COPY` do
Dockerfile, restaurar a aplicação completa sob `webview/`, ou comprovar que a VPS usa outro
commit/contexto. Só então o W4 pode recomeçar com TDD.
