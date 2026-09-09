from odoo import api, fields, models

# Constantes em nivel de modulo, nao atributos da classe: nomes _MAIUSCULOS
# dentro de um models.Model sao territorio da metaclasse do Odoo, e nao ha
# motivo para disputar espaco com ela.
GBP_BANDAS = [("forte", "Forte"), ("medio", "Medio"), ("fraco", "Fraco")]
GBP_DIMENSOES = ("saude", "seo", "autoridade", "conversao", "engajamento", "conteudo")

# Convencoes deste arquivo (guia-formatacao-crm.md §1.6 e §9):
#   - UM DONO POR CAMPO. Cada campo diz, no help, quem escreve nele:
#       [IA]  = pipeline PHI (F3, via API externa). O humano nao preenche a mao.
#       [HUM] = pessoa. Nenhum workflow escreve aqui.
#       [SIS] = Odoo/nativo.
#     Nada de dois workflows disputando o mesmo campo.
#   - N/D HONESTO: dado ausente e N/D, nunca 0 forjado. Ver gbp_score_atualizado_em.
#   - Prefixo por dominio: gbp_ = scoring; ia_ = textao de diagnostico.


class CrmLead(models.Model):
    _inherit = "crm.lead"

    # ------------------------------------------------------------------
    # 0. Chave externa — a identidade do lead para o pipeline PHI
    # ------------------------------------------------------------------
    # I4 (CONTRATO-PROSPECCAO): a chave e o place_id. NOME NUNCA E CHAVE.
    # Foi a busca por nome+telefone que gerou os deals duplicados no HubSpot e
    # obrigou a construir um deduplicador. Aqui o banco impede a repeticao.
    #
    # `copy=False`: duplicar um lead na tela nao pode arrastar o place_id junto —
    # a copia bateria na restricao e, pior, duas linhas disputariam a mesma chave.
    #
    # Nota sobre vazio: a restricao UNIQUE do Postgres aceita varios NULL, entao
    # leads sem place_id (criados na mao) convivem sem conflito. Se o Odoo gravar
    # string vazia em vez de NULL, dois leads em branco colidiriam — e o teste 9
    # do README existe exatamente para provar isso na instancia.
    gbp_place_id = fields.Char(
        string="Place ID (Google)",
        index=True,
        copy=False,
        help="[IA] Chave estavel do lead, vinda do Google Maps. E por ela que o "
             "pipeline PHI encontra o lead para atualizar, em vez de procurar "
             "pelo nome. Deixe vazio em lead criado a mao.",
    )

    _gbp_place_id_unico = models.Constraint(
        "UNIQUE(gbp_place_id)",
        "Ja existe um lead com este Place ID. A chave do lead e o place_id — "
        "o mesmo perfil do Google nao pode virar dois leads.",
    )

    # ------------------------------------------------------------------
    # 1. Governanca do ciclo
    # ------------------------------------------------------------------
    # O "lifecycle" NAO vira campo: no Odoo ele E o estagio (stage_id).
    # Origem = source_id/medium_id nativos. Datas de virada de estagio =
    # date_last_stage_update / day_open / day_close nativos. Motivo de perda =
    # lost_reason_id nativo (botao Perdido). Owner = user_id nativo.

    lead_status = fields.Selection(
        selection=[
            ("novo", "Novo"),
            ("aceito", "Aceito"),
            ("em_cadencia", "Em cadencia"),
            ("reciclado", "Reciclado"),
        ],
        string="Status do Lead",
        default="novo",
        help="[HUM] Nuance da cadencia, em paralelo ao estagio. O estagio nunca "
             "retrocede; a reciclagem se registra aqui.",
    )

    motivo_rejeicao_mql = fields.Selection(
        selection=[
            ("fit_fraco", "Fit fraco"),
            ("timing", "Timing"),
            ("fora_icp", "Fora do ICP"),
            ("sem_orcamento", "Sem orcamento"),
            ("duplicado", "Duplicado"),
        ],
        string="Motivo da Rejeicao (MQL)",
        help="[HUM] Preencher ao rejeitar a abordagem. E o feedback que fecha o "
             "buraco MQL->SAL: sem ele nao da para corrigir o alvo da prospeccao.",
    )

    data_primeiro_contato = fields.Datetime(
        string="Data do 1o Contato",
        help="[SIS/IA] Marca o 1o contato efetivo. Base do Speed to Lead "
             "(SLA de 5 min).",
    )

    tentativas_contato = fields.Integer(
        string="Tentativas de Contato",
        default=0,
        help="[IA/SIS] Cadencia minima de 8 tentativas multi-canal antes de "
             "reciclar.",
    )

    proxima_acao_data = fields.Date(
        string="Data da Proxima Acao",
        help="[IA/HUM] Anti-stall: enquanto o negocio estiver aberto, precisa "
             "existir um proximo passo com data.",
    )

    # ------------------------------------------------------------------
    # 2. Scoring GBP - o "card" (so numero/enum/bool)
    # ------------------------------------------------------------------
    # Regra de apresentacao (card-gbp-record-spec.md §1): NENHUMA string longa
    # aqui. Textao vai para a aba "IA / Diagnostico" (bloco 3).

    # --- N/D honesto -------------------------------------------------------
    # Integer no Odoo nao tem nulo: "nunca diagnosticado" le como 0, igual a um
    # score real de 0. E o zero real importa (no caso de aceitacao da Niti,
    # dim_engajamento = 0 e o achado critico do diagnostico) - entao apagar
    # zeros destruiria justamente o sinal mais valioso.
    # Como os 10 campos GBP sao escritos JUNTOS, na mesma chamada do pipeline,
    # a ausencia e do CONJUNTO, nao de campo isolado. Por isso um unico marcador
    # resolve, em vez de 10 booleanos companheiros:
    #   vazio      -> o PHI nunca rodou neste lead -> N/D (a view esconde o card)
    #   preenchido -> todos os scores sao reais, zeros inclusive
    gbp_score_atualizado_em = fields.Date(
        string="Diagnostico GBP em",
        help="[IA] DIA em que o pipeline PHI escreveu o scoring. E Date, nao "
             "Datetime, de proposito: a hora nao decide nada e o Datetime "
             "obrigava a converter fuso na integracao (o Odoo guarda UTC e "
             "exibe no fuso do usuario, o que deslocava o carimbo em 3h).",
    )

    # --- O que revela o card ------------------------------------------------
    # Ate 09/09/2026 quem revelava o card era gbp_score_atualizado_em. O efeito
    # colateral apareceu na primeira carga real: um lead com potencial comercial
    # e oferta preenchidos, mas sem o carimbo, ficava com o card inteiro
    # escondido - dado bom, invisivel. Agora quem revela e o CONTEUDO: se ha
    # decisao a tomar (oferta e/ou potencial), o card aparece.
    gbp_diagnostico = fields.Selection(
        selection=[("ativo", "Ativo"), ("inativo", "Inativo")],
        string="Diagnostico GBP",
        compute="_compute_gbp_diagnostico",
        help="[SIS] Derivado, ninguem escreve. ATIVO quando o lead tem oferta "
             "recomendada e/ou potencial comercial maior que zero - e so entao "
             "o card do diagnostico aparece na tela. INATIVO significa que o "
             "PHI nunca rodou neste lead (N/D honesto), nao score zero.",
    )

    @api.depends("gbp_oferta_recomendada", "gbp_potencial_comercial")
    def _compute_gbp_diagnostico(self):
        for lead in self:
            tem_oferta = bool(lead.gbp_oferta_recomendada)
            tem_potencial = (lead.gbp_potencial_comercial or 0) > 0
            lead.gbp_diagnostico = "ativo" if (tem_oferta or tem_potencial) else "inativo"

    gbp_potencial_comercial = fields.Integer(
        string="Potencial Comercial (GBP)",
        help="[IA] 0-100. E o numero que decide se vale abordar.",
    )

    gbp_oferta_recomendada = fields.Selection(
        selection=[
            ("SVC-GBP", "SVC-GBP - Perfil no Google"),
            ("SVC-SITE", "SVC-SITE - Site"),
            ("SVC-ADS", "SVC-ADS - Trafego pago"),
            ("SVC-IA", "SVC-IA - Automacao/IA"),
        ],
        string="Oferta Recomendada (GBP)",
        help="[IA] Servico com maior gap a vender neste perfil.",
    )

    gbp_ipc = fields.Integer(
        string="IPC - Indice de Potencial Comercial",
        help="[IA] 0-100. Oportunidade de venda: quanto ha a ganhar. "
             "Nao confundir com o Score Tecnico.",
    )

    gbp_score_tecnico = fields.Integer(
        string="Score Tecnico (GBP)",
        help="[IA] 0-100. Quao otimizado o perfil ja esta. "
             "IPC baixo + Score alto = perfil forte, pouco gap a vender.",
    )

    # As 6 dimensoes. Bandas de leitura: forte >= 70 / medio 40-69 / fraco < 40.
    # A cor entra na view (decoration-*); o valor numerico e SEMPRE exibido -
    # cor nunca e o unico sinal.
    gbp_dim_saude = fields.Integer(
        string="Dim. Saude do Perfil",
        help="[IA] 0-100.",
    )
    gbp_dim_seo = fields.Integer(
        string="Dim. SEO Local",
        help="[IA] 0-100.",
    )
    gbp_dim_autoridade = fields.Integer(
        string="Dim. Autoridade",
        help="[IA] 0-100.",
    )
    gbp_dim_conversao = fields.Integer(
        string="Dim. Conversao",
        help="[IA] 0-100.",
    )
    gbp_dim_engajamento = fields.Integer(
        string="Dim. Engajamento",
        help="[IA] 0-100.",
    )
    gbp_dim_conteudo = fields.Integer(
        string="Dim. Conteudo",
        help="[IA] 0-100.",
    )

    gbp_nao_reivindicado = fields.Boolean(
        string="GBP Nao Reivindicado",
        help="[IA] Sinal de ouro: o perfil existe e ninguem reivindicou.",
    )

    gbp_site_tipo = fields.Selection(
        selection=[
            ("site", "Site proprio"),
            ("social", "Rede social"),
            ("none", "Sem site"),
        ],
        string="Tipo de Site (GBP)",
        help="[IA] O que o perfil usa como destino.",
    )

    gbp_flags_score = fields.Char(
        string="Flags do Score (GBP)",
        help="[IA] Lista curta de marcadores do scoring (ex.: site=rede).",
    )

    # O unico campo do card com dono HUMANO. E o "play".
    proxima_acao_aceite = fields.Selection(
        selection=[
            ("pendente", "Pendente"),
            ("aceita", "Aceita"),
            ("rejeitada", "Rejeitada"),
        ],
        string="NBA - Aceite",
        default="pendente",
        help="[HUM] O play. A IA recomenda a abordagem; quem aceita ou rejeita "
             "e a pessoa. Nenhum workflow escreve neste campo.",
    )

    # --- Bandas de leitura das dimensoes ----------------------------------
    # Por que campo computado em vez de decoration direto no numero:
    # widget="badge" no Odoo e SO exibicao - nao tem modo de edicao. Usado no
    # proprio gbp_dim_*, ele deixava o campo sem onde digitar E renderizava o
    # valor 0 como vazio, engolindo justamente o zero real que o N/D honesto
    # existe para preservar (o caso Niti). Constatado na tela em 07/09/2026.
    # Solucao: o numero fica como Integer normal (editavel, sempre visivel) e a
    # COR vem desta etiqueta ao lado, que e derivada e por isso pode ser badge.
    # Nao sao armazenadas (sem store): nenhuma coluna nova, nenhum dono novo -
    # sao leitura do valor que o pipeline PHI escreveu.

    gbp_dim_saude_banda = fields.Selection(
        GBP_BANDAS, string="Banda - Saude", compute="_compute_gbp_bandas")
    gbp_dim_seo_banda = fields.Selection(
        GBP_BANDAS, string="Banda - SEO", compute="_compute_gbp_bandas")
    gbp_dim_autoridade_banda = fields.Selection(
        GBP_BANDAS, string="Banda - Autoridade", compute="_compute_gbp_bandas")
    gbp_dim_conversao_banda = fields.Selection(
        GBP_BANDAS, string="Banda - Conversao", compute="_compute_gbp_bandas")
    gbp_dim_engajamento_banda = fields.Selection(
        GBP_BANDAS, string="Banda - Engajamento", compute="_compute_gbp_bandas")
    gbp_dim_conteudo_banda = fields.Selection(
        GBP_BANDAS, string="Banda - Conteudo", compute="_compute_gbp_bandas")

    @api.depends(*[f"gbp_dim_{d}" for d in GBP_DIMENSOES])
    def _compute_gbp_bandas(self):
        """Forte >= 70 . Medio 40-69 . Fraco < 40 (card-gbp-record-spec.md §4)."""
        for lead in self:
            for dim in GBP_DIMENSOES:
                valor = lead[f"gbp_dim_{dim}"] or 0
                if valor >= 70:
                    banda = "forte"
                elif valor >= 40:
                    banda = "medio"
                else:
                    banda = "fraco"
                lead[f"gbp_dim_{dim}_banda"] = banda

    # ------------------------------------------------------------------
    # 3. Diagnostico por IA - a aba (textoes)
    # ------------------------------------------------------------------
    ia_analise_gbp = fields.Text(
        string="Analise GBP (IA)",
        help="[IA] Diagnostico do perfil no Google.",
    )
    ia_analise_site = fields.Text(
        string="Analise do Site (IA)",
        help="[IA] Diagnostico do site.",
    )
    ia_analise_instagram = fields.Text(
        string="Analise do Instagram (IA)",
        help="[IA] Diagnostico do Instagram.",
    )
    ia_abordagem_sugerida = fields.Text(
        string="Abordagem Sugerida (IA)",
        help="[IA] Como puxar a conversa. Sugestao - quem conduz o contato "
             "e a pessoa.",
    )
    ia_proxima_acao_recomendada = fields.Text(
        string="Proxima Acao Recomendada (IA)",
        help="[IA] A NBA por extenso. O aceite/rejeicao fica em "
             "proxima_acao_aceite, que e humano.",
    )
    ia_dados_enriquecimento = fields.Text(
        string="Dados de Enriquecimento (IA)",
        help="[IA] JSON com os dados publicos coletados.",
    )

    followup = fields.Text(
        string="Follow-up",
        help="[HUM] Anotacao livre da pessoa. Nenhum workflow escreve aqui.",
    )
