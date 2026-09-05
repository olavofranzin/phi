{
    "name": "PHI CRM",
    "version": "19.0.1.0.0",
    "summary": "Campos de diagnostico GBP/IA e pipeline do PHI sobre o CRM do Odoo",
    "description": """
PHI CRM
=======

Extensao pura de ``crm.lead``. NAO cria modelo novo e NAO tem automacao.

Guardrail-mae do PHI: a IA diagnostica e recomenda; o humano da o play.
Este modulo so define campos e layout. Nenhuma linha aqui move estagio,
marca ganho/perdido ou escreve em nome do usuario.
""",
    "category": "Sales/CRM",
    "license": "LGPL-3",
    "author": "Franz Comunicacao",
    "depends": ["crm"],
    "data": [
        "data/crm_stage_data.xml",
        "views/crm_lead_views.xml",
    ],
    "installable": True,
    "application": False,
}
