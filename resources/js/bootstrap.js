import _ from 'lodash';
window._ = _;

import moment from 'moment';
window.moment = moment;

import Popper from 'popper.js';
window.Popper = Popper;

import $ from 'jquery';
// Keep Vite's jQuery internal — do NOT overwrite window.$ which porto jQuery owns.
// Bootstrap is loaded as a <script> tag from porto vendor in the layout.

import axios from 'axios';

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

let token = document.head.querySelector('meta[name="csrf-token"]');

if (token) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
    window.headers_token = {
        'X-CSRF-TOKEN': token.content,
    }
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

window.axios = axios;

// Theme vendor scripts loaded as regular <script> tags in layout (public/js/vendor/)
// so they register on porto-light's jQuery, not the Vite-bundled jQuery.

$(function () {
    const listElements = document.getElementsByClassName('nav-active');
    if (listElements.length > 0) {
        listElements[0].scrollIntoView();
    }
});

const mercadopago = window.Mercadopago;

if (mercadopago) {
    mercadopago.setPublishableKey(window.token_mercado_pago);
    mercadopago.getIdentificationTypes();
}
