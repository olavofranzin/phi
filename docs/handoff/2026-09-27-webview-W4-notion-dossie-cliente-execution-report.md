# Relatório de execução — W4 Notion dossiê do cliente

| | |
|---|---|
| **Data** | 2026-09-28 |
| **Estado** | 🟡 **IMPLEMENTAÇÃO LOCAL CONCLUÍDA; aceite real pendente de publicação** |
| **Código** | `phi-dashboard-webview`, branch `webview`, commit local `c37d0b0` |
| **Documentação** | `phi`, branch `claude/consolidacao-2026-08` |
| **Build provado** | `npm run build` na raiz — 2.538 módulos; Docker indisponível no host |

## 1. Cobertura real por cliente e seção

Medi diretamente a data source Clientes em 2026-09-28. A contagem considera texto/URL não vazio,
arquivo não vazio, número não nulo (zero continua sendo valor) e data com início presente.

| CLI | Cliente | Presença 6 | Marca 5 | Comunicação 4 | Mercado 4 | Contatos 5 | Comercial 5 | Arquivos 4 | Branding 4 | Metas 4 | Total 41 |
|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | PRO VISÃO | 0/6 | 0/5 | 0/4 | 0/4 | 1/5 | 0/5 | 0/4 | 0/4 | 0/4 | 1/41 |
| 2 | FÁBIO CASTRO | 1/6 | 0/5 | 0/4 | 0/4 | 1/5 | 0/5 | 0/4 | 0/4 | 0/4 | 2/41 |
| 3 | DRA GIULIANA FRANÇA ESTÉTICA AVANÇADA | 1/6 | 0/5 | 0/4 | 0/4 | 1/5 | 0/5 | 0/4 | 0/4 | 0/4 | 2/41 |
| 4 | KILDARE & BRUNA BECKER | 2/6 | 0/5 | 0/4 | 0/4 | 0/5 | 0/5 | 0/4 | 0/4 | 0/4 | 2/41 |
| 5 | IMPACTO WEB CURSOS | 1/6 | 0/5 | 0/4 | 0/4 | 1/5 | 0/5 | 0/4 | 0/4 | 0/4 | 2/41 |
| 6 | NPORTO | 0/6 | 0/5 | 0/4 | 0/4 | 0/5 | 0/5 | 0/4 | 0/4 | 0/4 | 0/41 |
| 7 | RODRIGO VIEIRA CLARA | 1/6 | 0/5 | 0/4 | 0/4 | 1/5 | 0/5 | 0/4 | 0/4 | 0/4 | 2/41 |
| 8 | NEW VERTICE APOIO EMPRESARIAL LTDA | 1/6 | 0/5 | 0/4 | 0/4 | 2/5 | 0/5 | 0/4 | 0/4 | 0/4 | 3/41 |
| 9 | MARIAH ACESSÓRIOS | 0/6 | 0/5 | 0/4 | 0/4 | 0/5 | 0/5 | 0/4 | 0/4 | 0/4 | 0/41 |
| 10 | **Nome ausente no Notion** | 0/6 | 0/5 | 0/4 | 0/4 | 0/5 | 0/5 | 0/4 | 0/4 | 0/4 | 0/41 |
| 13 | CHARLES AZEVEDO ADVOGADO | 1/6 | 0/5 | 0/4 | 0/4 | 1/5 | 0/5 | 0/4 | 0/4 | 0/4 | 2/41 |

O KIL real tem **Site** (`https://kbbecker.com.br/`) e **Endereço** preenchidos. O restante das 41
chaves está vazio na fonte e deve aparecer como `N/D`; não é falha do mapper.

## 2. Mapa implementado — 41 chaves, propriedade e destino

Não ficou nenhuma das 41 chaves sem fonte. `Documentos Legais` deixou de cair silenciosamente em
`null`: `readProp` agora lê tanto arquivo externo quanto arquivo hospedado pelo Notion.

| Seção | Chave | Propriedade exata | Destino implementado |
|---|---|---|---|
| Presença Digital | `instagram` | `Instagram` | URL ou `N/D` |
| Presença Digital | `site` | `Site` | URL ou `N/D` |
| Presença Digital | `gmb` | `Google Meu Negócio` | URL ou `N/D` |
| Presença Digital | `endereco` | `Endereço` | texto ou `N/D` |
| Presença Digital | `whatsappGrupo` | `Grupo WhatsApp` | URL ou `N/D` |
| Presença Digital | `drive` | `Pasta Google Drive` | URL ou `N/D` |
| Marca | `nome` | `Nome da Marca` | texto ou `N/D` |
| Marca | `tagline` | `Tagline` | texto ou `N/D` |
| Marca | `proposito` | `Propósito` | texto ou `N/D` |
| Marca | `valores` | `Valores` | texto ou `N/D` |
| Marca | `personalidade` | `Personalidade` | texto ou `N/D` |
| Comunicação | `tomVoz` | `Tom de Voz` | texto ou `N/D` |
| Comunicação | `mensagensChave` | `Mensagens-chave` | texto ou `N/D` |
| Comunicação | `evitar` | `O que Evitar` | texto ou `N/D` |
| Comunicação | `referencias` | `Referências de Marcas` | texto ou `N/D` |
| Mercado | `publicoAlvo` | `Público-alvo` | texto ou `N/D` |
| Mercado | `personas` | `Personas` | texto ou `N/D` |
| Mercado | `concorrentes` | `Concorrentes` | texto ou `N/D` |
| Mercado | `diferenciais` | `Diferenciais Competitivos` | texto ou `N/D` |
| Contatos | `responsavel` | `Responsável Principal` | texto ou `N/D` |
| Contatos | `email` | `Email` | e-mail ou `N/D` |
| Contatos | `telefone` | `Telefone/WhatsApp` | texto ou `N/D` |
| Contatos | `financeiro` | `Contato Financeiro` | texto ou `N/D` |
| Contatos | `operacional` | `Contato Operacional` | texto ou `N/D` |
| Comercial | `produtos` | `Produtos & Serviços` | texto ou `N/D` |
| Comercial | `ticket` | `Ticket/LTV` | moeda BRL ou `N/D` |
| Comercial | `funil` | `Funil de Vendas` | texto ou `N/D` |
| Comercial | `objecoes` | `Principais Objeções` | texto ou `N/D` |
| Comercial | `gatilhos` | `Gatilhos de Compra` | texto ou `N/D` |
| Arquivos | `logos` | `Pasta de Logos` | URL ou `N/D` |
| Arquivos | `fotos` | `Banco de Fotos` | URL ou `N/D` |
| Arquivos | `videos` | `Banco de Vídeos` | URL ou `N/D` |
| Arquivos | `documentos` | `Documentos Legais` | primeira URL de `files` ou `N/D` |
| Branding | `paleta` | `Paleta de Cores` | texto ou `N/D` |
| Branding | `tipografia` | `Tipografia` | texto ou `N/D` |
| Branding | `grafismos` | `Grafismos & Elementos` | URL clicável ou `N/D` |
| Branding | `manualMarca` | `Manual da Marca` | URL ou `N/D` |
| Metas | `metaPrincipal` | `Meta Principal` | texto ou `N/D` |
| Metas | `kpis` | `KPIs` | texto ou `N/D` |
| Metas | `prazo` | `Prazo` | `DD/MM/AAAA` ou `N/D` |
| Metas | `orcamento` | `Orçamento` | moeda BRL ou `N/D` |

## 3. Campos que não encaixam

- **Status:** `ATIVO` vira apenas `Ativo`; `INATIVO` permanece literalmente `INATIVO`. Não foi
  aproximado para `Pausado`.
- **Nicho:** `Segmento = Negócio Local` permanece literalmente `Negócio Local`. O tipo do front foi
  aberto para `string`; não foi forçado a um dos quatro valores antigos.
- **Documentos Legais:** tem fonte e tipo `files`. O destino é a primeira URL disponível, externa ou
  temporária do Notion; sem arquivo vira `N/D`.
- **Cabeçalho:** `client` usa a fórmula `Sigla Cliente`; `tags` usa `Serviços Prestados`;
  `notionUrl` usa `page.url`; a rota conserva o slug existente.

## 4. CA1 — KIL real e limite da prova local

A leitura direta da página real `CLI-4` em 2026-09-28 mediu:

```json
{
  "id": "kil",
  "clientId": "CLI-4",
  "client": "KIL",
  "status": "Ativo",
  "niche": "Negócio Local",
  "tags": ["GOOGLE ADS"],
  "notionUrl": "https://app.notion.com/19fb65e5c72b81ddb7a0f295fe304d60",
  "fields": {
    "instagram": "N/D",
    "site": "https://kbbecker.com.br/",
    "gmb": "N/D",
    "endereco": "AV. PAULISTA, 648 - LOJA 2, 3 e 7 - BELA VISTA",
    "whatsappGrupo": "N/D",
    "drive": "N/D",
    "nome": "N/D",
    "tagline": "N/D",
    "proposito": "N/D",
    "valores": "N/D",
    "personalidade": "N/D",
    "tomVoz": "N/D",
    "mensagensChave": "N/D",
    "evitar": "N/D",
    "referencias": "N/D",
    "publicoAlvo": "N/D",
    "personas": "N/D",
    "concorrentes": "N/D",
    "diferenciais": "N/D",
    "responsavel": "N/D",
    "email": "N/D",
    "telefone": "N/D",
    "financeiro": "N/D",
    "operacional": "N/D",
    "produtos": "N/D",
    "ticket": "N/D",
    "funil": "N/D",
    "objecoes": "N/D",
    "gatilhos": "N/D",
    "logos": "N/D",
    "fotos": "N/D",
    "videos": "N/D",
    "documentos": "N/D",
    "paleta": "N/D",
    "tipografia": "N/D",
    "grafismos": "N/D",
    "manualMarca": "N/D",
    "metaPrincipal": "N/D",
    "kpis": "N/D",
    "prazo": "N/D",
    "orcamento": "N/D"
  }
}
```

Isto é **fonte real + saída determinística do mapper**, mas ainda não é uma captura HTTP de
`GET /api/clients`: o host local não possui `NOTION_TOKEN` e a implementação ainda não foi publicada
na branch ligada ao EasyPanel. Portanto o CA1 continua pendente; não contei fixture como endpoint.

## 5. Telefone como termômetro

- Fonte real após a implementação: **6 de 11** clientes têm `Telefone/WhatsApp` preenchido.
- Antes, o código lia `Fone`: **0 de 11**.
- O mapper agora lê exclusivamente `Telefone/WhatsApp`, e o teste cobre também a presença simultânea
  de um `Fone` errado para provar que ele é ignorado.
- Número final esperado no endpoint novo: **6 de 11**. Número final HTTP ainda não medido porque o
  código não foi publicado; se o smoke retornar menos de 6, a volta deve ser rejeitada.

## 6. Critérios de aceite

| CA | Estado | Prova / motivo |
|---|---|---|
| CA1 | ⏸ pendente | KIL real medido e objeto acima produzido; falta captura HTTP após publicação |
| CA2 | ✅ | `rg clientMock src`: única importação está no teste, onde o mock virou fixture deliberada |
| CA3 | ✅ | 41/41 destinos na tabela do §2; nenhuma chave sem fonte |
| CA4 | 🟡 | fonte e mapper: **0 → 6 de 11**; smoke HTTP deve confirmar 6 após publicação |
| CA5 | ✅ | tabela por cliente e por seção no §1, medida na data source real |
| CA6 | ✅ | sem rename; `Dockerfile`, `webview/`, manifests, configs TS/Vite e `.env` intocados |
| CA7 | ✅ | nenhuma escrita no Notion adicionada; os `POST` existentes são somente queries read-only |
| CA8 | ✅ | `.env` sem diff e nenhum segredo novo no git |
| CA9 | ✅ | Docker indisponível; `npm run build` na raiz passou com 2.538 módulos |
| CA10 | ⏸ pendente | caminho `/api/phi-snapshot` sem diff; falta comparação HTTP antes/depois da publicação |

## 7. Verificação técnica

- TDD: RED confirmado antes da implementação; depois, `npm run test` = **21/21** e
  `npm test -- --coverage` = **22/22**.
- Cobertura medida: global do projeto **12,03% statements** porque o V8 inclui a aplicação inteira,
  inclusive UI não exercitada e a pasta proibida `webview/`. Nas unidades tocadas diretamente:
  `server/clientDossier.js` **97,1%**, `useClientData.ts` **100%**, `dossierValue.ts` **100%** e
  `sections.ts` **100%**.
- TypeScript: `tsc --noEmit` passou.
- Lint dos arquivos alterados: passou.
- Lint global: falha em cinco erros preexistentes fora do W4, inclusive um dentro da pasta
  proibida `webview/`; nenhum foi “limpo” nesta volta.
- Build: `npm run build` na raiz passou. Aviso não bloqueante: chunk JS de 877,57 kB.
- `npm audit --omit=dev`: **12 vulnerabilidades preexistentes** (10 high, 1 moderate, 1 low),
  incluindo React Router. Não rodei `npm audit fix`: dependências/lockfile são a tarefa separada
  determinada pelo Olavo.

## 8. O que a medição desmentiu

1. O brief dizia “~35” chaves: são **41**.
2. O brief original dizia `webview/Dockerfile`: o EasyPanel usa o **Dockerfile da raiz** com contexto
   `/`; a pasta `webview/` é resíduo morto e ficou intocada.
3. O conserto de telefone não era abstrato: o ganho medido é **0 → 6 de 11**.
4. A base é muito mais vazia do que a forma do dossiê sugere: nenhum dos 11 clientes tem conteúdo
   em Marca, Comunicação, Mercado, Comercial, Arquivos, Branding ou Metas; isso é vazio real da fonte.
5. Não apareceu terceira premissa estrutural falsa nesta volta. Apareceu uma dívida já incorporada ao
   brief: `package-lock.json` não fecha com `package.json`, e o Dockerfile usa `npm install`; não foi
   corrigida por decisão explícita de escopo.

## 9. Segurança, fora de escopo e checklist

1. `.env` da raiz continua versionado e `.gitignore` não o ignora. Não foi editado nem removido.
2. `src/integrations/supabase/` e `supabase/functions/` continuam presentes e intocados.
3. W4b, escrita no Notion/BigQuery, score, lockfile, limpeza de `webview/` e Lovable pago ficaram fora.
4. `CHECKLIST-webview.md` só existe em `claude/webview-metricas-clientes-lxps0l`. Não foi movido nem
   editado na branch de consolidação; o W4 ainda não pode ser marcado concluído antes de CA1/CA10.
5. O relatório da volta 1 foi publicado no repositório de documentação como commit `8bc8151`
   (o hash local anterior `899f0f9` mudou no rebase).

## Próximo passo obrigatório

A publicação da branch `webview` aciona o caminho ligado ao EasyPanel e exige autorização externa
explícita. Depois da publicação: capturar `/api/clients`,
confirmar **6/11 telefones**, colar o KIL real do endpoint, comparar `/api/phi-snapshot` e só então
marcar W4 concluído e atualizar o ledger/checklist.
