import type { DossierSection } from "./clientTypes";

/** Display metadata for the read-only client dossier. Not a form. */
export const DOSSIER_SECTIONS: DossierSection[] = [
  {
    id: "presenca-digital",
    index: "01",
    title: "Presença Digital",
    subtitle: "Links e endereços públicos do cliente.",
    fields: [
      { key: "instagram", label: "Instagram", type: "url" },
      { key: "site", label: "Site", type: "url" },
      { key: "gmb", label: "Google Meu Negócio", type: "url" },
      { key: "endereco", label: "Endereço", type: "text" },
      { key: "whatsappGrupo", label: "Grupo WhatsApp", type: "url" },
      { key: "drive", label: "Pasta Google Drive", type: "url" },
    ],
  },
  {
    id: "marca",
    index: "02",
    title: "Marca",
    subtitle: "Identidade verbal e posicionamento.",
    fields: [
      { key: "nome", label: "Nome da marca", type: "text" },
      { key: "tagline", label: "Tagline", type: "text" },
      { key: "proposito", label: "Propósito", type: "textarea" },
      { key: "valores", label: "Valores", type: "textarea" },
      { key: "personalidade", label: "Personalidade", type: "textarea" },
    ],
  },
  {
    id: "comunicacao",
    index: "03",
    title: "Comunicação",
    subtitle: "Tom, voz e mensagens-chave.",
    fields: [
      { key: "tomVoz", label: "Tom de voz", type: "textarea" },
      { key: "mensagensChave", label: "Mensagens-chave", type: "textarea" },
      { key: "evitar", label: "O que evitar", type: "textarea" },
      { key: "referencias", label: "Referências de marcas", type: "textarea" },
    ],
  },
  {
    id: "mercado",
    index: "04",
    title: "Mercado",
    subtitle: "Público, concorrência e diferenciais.",
    fields: [
      { key: "publicoAlvo", label: "Público-alvo", type: "textarea" },
      { key: "personas", label: "Personas", type: "textarea" },
      { key: "concorrentes", label: "Concorrentes", type: "textarea" },
      { key: "diferenciais", label: "Diferenciais competitivos", type: "textarea" },
    ],
  },
  {
    id: "contatos",
    index: "05",
    title: "Contatos",
    subtitle: "Pessoas-chave do cliente.",
    fields: [
      { key: "responsavel", label: "Responsável principal", type: "text" },
      { key: "email", label: "E-mail", type: "email" },
      { key: "telefone", label: "Telefone / WhatsApp", type: "tel" },
      { key: "financeiro", label: "Contato financeiro", type: "text" },
      { key: "operacional", label: "Contato operacional", type: "text" },
    ],
  },
  {
    id: "comercial",
    index: "06",
    title: "Comercial",
    subtitle: "Oferta, preço e funil.",
    fields: [
      { key: "produtos", label: "Produtos & serviços", type: "textarea" },
      { key: "ticket", label: "Ticket médio", type: "text" },
      { key: "funil", label: "Funil de vendas", type: "textarea" },
      { key: "objecoes", label: "Principais objeções", type: "textarea" },
      { key: "gatilhos", label: "Gatilhos de compra", type: "textarea" },
    ],
  },
  {
    id: "arquivos",
    index: "07",
    title: "Arquivos",
    subtitle: "Pastas e materiais de apoio.",
    fields: [
      { key: "logos", label: "Pasta de logos", type: "url" },
      { key: "fotos", label: "Banco de fotos", type: "url" },
      { key: "videos", label: "Banco de vídeos", type: "url" },
      { key: "documentos", label: "Documentos legais", type: "url" },
    ],
  },
  {
    id: "branding",
    index: "08",
    title: "Branding",
    subtitle: "Sistema visual da marca.",
    fields: [
      { key: "paleta", label: "Paleta de cores", type: "textarea" },
      { key: "tipografia", label: "Tipografia", type: "text" },
      { key: "grafismos", label: "Grafismos & elementos", type: "textarea" },
      { key: "manualMarca", label: "Manual da marca", type: "url" },
    ],
  },
  {
    id: "metas",
    index: "09",
    title: "Metas",
    subtitle: "Objetivos mensuráveis do projeto.",
    fields: [
      { key: "metaPrincipal", label: "Meta principal", type: "textarea" },
      { key: "kpis", label: "KPIs", type: "textarea" },
      { key: "prazo", label: "Prazo", type: "text" },
      { key: "orcamento", label: "Orçamento", type: "text" },
    ],
  },
];
