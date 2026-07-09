# Rubrica — Auditoria de Google Business Profile (10 pilares)

> **O que é:** a **lente de análise** (rubrica) que o agente de auditoria de GBP usa para
> estruturar o diagnóstico. NÃO é fonte de dados — é *o que avaliar e como priorizar*.
> **Fonte:** Olavo (metodologia própria de auditoria de SEO local + conversão), 2026-07-05.
> **Força de evidência:** A (validada internamente — expertise do dono). **Domínio:** local/GBP.
> **Consumo:** entra no **prompt do agente** de enriquecimento (C2) como as regras comportamentais
> da lente (Guia de Agentes §4/§6 — "a lente transparece na saída") e como ativo da Camada de
> Conhecimento. **Aplicabilidade:** Negócio Local; complementa a oferta `SVC-GBP` (catálogo).

## Como o agente usa
1. Coleta os dados do perfil (fonte a definir — ver §"Fonte de dados por pilar" abaixo).
2. Percorre os 10 pilares, marcando cada achado com `[CERTEZA]`/`[HIPÓTESE]` e **ancorado** no dado
   observado (ex.: "nota 3,9 com 12 avaliações"). Guarda de volume (Tema 10): poucos dados → "sinal fraco".
3. Classifica cada gap em **🔴 Crítica / 🟠 Alta / 🟡 Média / 🟢 Baixa** e fecha com **plano de ação priorizado**.
4. Mapeia gaps materiais → oferta `SVC-GBP` (input para a NBA / C3).

---

## Os 10 pilares (rubrica do Olavo, preservada)

**1. Informações básicas** — completude e consistência: nome (sem excesso de palavra-chave), categoria principal, categorias secundárias, telefone, site, endereço, áreas de atendimento, horário, atributos preenchidos.

**2. Otimização para SEO Local** — palavra-chave principal usada naturalmente; relevância da categoria principal; descrição otimizada; serviços cadastrados; produtos (quando aplicável); uso correto das palavras-chave; cobertura dos serviços principais; coerência GBP × site × citações (NAP).

**3. Fotos e vídeos** — quantidade, qualidade, frequência de postagem, diversidade (fachada, interior, equipe, produtos, serviços, antes/depois, logotipo, capa, vídeos); existência de fotos feitas por clientes.

**4. Avaliações** — quantidade, nota média, crescimento, frequência, **respostas do proprietário**, uso de palavras-chave nas respostas, reclamações recorrentes, sentimento dos clientes, distribuição das notas (1–5★).

**5. Perguntas e respostas** — existência de perguntas, qualidade das respostas, FAQ estratégico, perguntas sem resposta, uso de palavras-chave.

**6. Serviços e Produtos** — todos os serviços cadastrados, descrições, produtos, fotos dos produtos, organização, cobertura completa do negócio.

**7. Postagens** — frequência, qualidade, CTAs, tipos (promoções, atualizações, eventos, novidades).

**8. Conversão** — clareza da proposta de valor, botões disponíveis, link de agendamento, WhatsApp, site funcional, facilidade de contato, CTA da descrição, diferenciais evidentes.

**9. Presença Local (vs concorrentes)** — quem aparece no Local Pack, volume de avaliações, categorias usadas, conteúdo publicado, fotos, autoridade local, oportunidades não exploradas.

**10. Performance (só com acesso ao perfil)** — pesquisas diretas, pesquisas por descoberta, cliques no site, ligações, solicitações de rota, mensagens, visualizações de fotos, comparação de fotos com concorrentes, termos de pesquisa dos usuários.

**Itens técnicos adicionais** — perfil verificado; nome em conformidade com as políticas do Google; categoria principal adequada; categorias secundárias estratégicas; todos os campos preenchidos; uso correto dos atributos; horários especiais; link de agendamento; integração com cardápio/catálogo/produtos; perfil sem suspensões/alertas.

## Resultado — 4 níveis de prioridade
| Prioridade | Objetivo |
|---|---|
| 🔴 Crítica | Problemas que impedem o bom desempenho (categoria errada, perfil incompleto, poucas avaliações). |
| 🟠 Alta | Melhorias com grande impacto em posicionamento e conversão. |
| 🟡 Média | Otimizações que fortalecem a autoridade ao longo do tempo. |
| 🟢 Baixa | Ajustes finos e oportunidades adicionais. |

---

## Fonte de dados por pilar (por que a rubrica define o requisito da fonte)
Esta rubrica **elimina a opção "Places API only"** e empurra para uma fonte rica (Local API paga tipo
SerpAPI/Outscraper **ou** agente navegador/visão). Mapa do que cada pilar exige:

| Pilar | Places API (A) | Local API paga (B) | Navegador/Visão (C) |
|---|---|---|---|
| 1 Info básicas | ✅ maioria | ✅ | ✅ |
| 2 SEO local (descrição/serviços/NAP) | parcial | ✅ | ✅ |
| 3 Fotos/vídeos (qualidade) | contagem só | contagem | ✅ (visão avalia qualidade) |
| 4 Avaliações (respostas do dono, distribuição, crescimento) | ❌ (só nota+5 reviews) | ✅ | ✅ |
| 5 Q&A | ❌ | ✅ | ✅ |
| 6 Serviços/Produtos | ❌/parcial | ✅ | ✅ |
| 7 Postagens | ❌ | ✅ (alguns) | ✅ |
| 8 Conversão (proposta/CTAs) | parcial | parcial | ✅ (avalia qualitativo) |
| 9 Concorrentes/Local Pack | ❌ | ✅ (local pack) | ✅ |
| 10 Performance | ❌ (só dono) | ❌ | ❌ — só via Business Profile API em cliente gerenciado |

**Conclusão:** o MVP mínimo fiel a esta rubrica exige **B** (dados estruturados) e/ou **C** (navegador/visão
para os pilares qualitativos 3/8 e para P9). Pilar 10 só para clientes já gerenciados (não prospects).
