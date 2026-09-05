from odoo import fields, models

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
    gbp_score_atualizado_em = fields.Datetime(
        string="Diagnostico GBP em",
        help="[IA] Quando o pipeline PHI escreveu o scoring. VAZIO significa "
             "'nunca diagnosticado' (N/D) - e nao score zero. Preenchido "
             "significa que todos os valores GBP abaixo sao reais, zeros inclusive.",
    )

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
