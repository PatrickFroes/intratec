# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request

class Five9IframeController(http.Controller):
    @http.route('/five9/iframe', type='http', auth='user', website=True)
    def five9_iframe(self, **kwargs):
        # URL do Five9 ADT (pode parametrizar se quiser)
        five9_url = 'https://app.five9.com/clients/integrations/adt.main.html'
        return request.render('five9_iframe_template', {
            'five9_url': five9_url
        })

'''
<template id="five9_iframe_template" name="Five9 Iframe">
    <t t-call="website.layout">
        <div class="container mt32 mb32">
            <h2>Five9 Softphone</h2>
            <iframe src="${five9_url}" width="360" height="600" allow="microphone; autoplay; camera; geolocation; display-capture" sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox" style="border:1px solid #ccc; border-radius:12px;"></iframe>
        </div>
    </t>
</template>
'''
