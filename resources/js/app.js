import './bootstrap'

import { createApp, defineAsyncComponent } from 'vue'
import axios from 'axios'
import store from './store'
import ElementPlus from 'element-plus'
import es from 'element-plus/es/locale/lang/es'
import * as ElementPlusIcons from '@element-plus/icons-vue'
import eventHub from './eventHub'
import moment from 'moment'

const app = createApp({})

// ── Element Plus ──────────────────────────────────────────────────────────────
app.use(ElementPlus, { locale: es, size: 'small' })

// Register all Element Plus icons globally
for (const [name, component] of Object.entries(ElementPlusIcons)) {
    app.component(name, component)
}

// ── Vuex ──────────────────────────────────────────────────────────────────────
app.use(store)

// ── Global properties ─────────────────────────────────────────────────────────
app.config.globalProperties.$eventHub = eventHub
app.config.globalProperties.$http = axios
app.config.globalProperties.$setStorage = (name, obj) => localStorage.setItem(name, JSON.stringify(obj))
app.config.globalProperties.$getStorage = (name) => JSON.parse(localStorage.getItem(name))

app.config.globalProperties.$filters = {
    toDecimals(number, decimal = 2) {
        return Number(number).toFixed(decimal)
    },
    DecimalText(number, decimal = 2) {
        return isNaN(parseFloat(number)) ? number : Number(number).toFixed(decimal)
    },
    toDate(date) {
        if (date) return moment(date).format('DD/MM/YYYY')
        return ''
    },
    toTime(time) {
        if (time) {
            if (time.length === 5) return moment(time + ':00', 'HH:mm:ss').format('HH:mm:ss')
            return moment(time, 'HH:mm:ss').format('HH:mm:ss')
        }
        return ''
    },
    pad(value, fill = '', length = 3) {
        if (value) return String(value).padStart(length, fill)
        return value
    },
}

// ── Global mixin (axiosError helper) ──────────────────────────────────────────
app.mixin({
    methods: {
        axiosError(error) {
            const response = error.response
            const status = response.status
            if (status === 422) {
                this.errors = response.data
            }
            if (status === 500) {
                this.$message({ type: 'info', message: response.data.message })
            }
        }
    }
})

// ── Core components ───────────────────────────────────────────────────────────
app.component('tenant-item-aditional-info-selector', defineAsyncComponent(() => import('./views/tenant/components/partials/item_extra_info.vue')));
app.component('tenant-item-aditional-info-modal', defineAsyncComponent(() => import('./views/tenant/components/partials/modal_item_info_attributes.vue')));

app.component('tenant-dashboard-index', defineAsyncComponent(() => import('../../modules/Dashboard/Resources/assets/js/views/index.vue')));
app.component('tenant-dashboard-sales-by-product', defineAsyncComponent(() => import('../../modules/Dashboard/Resources/assets/js/views/items/SalesByProduct.vue')));

app.component('x-graph', defineAsyncComponent(() => import('./components/graph/src/Graph.vue')));
app.component('x-graph-line', defineAsyncComponent(() => import('./components/graph/src/GraphLine.vue')));

app.component('tenant-signature-pse-index', defineAsyncComponent(() => import('./views/tenant/companies/signature_pse/index.vue')))

app.component('tenant-companies-form', defineAsyncComponent(() => import('./views/tenant/companies/form.vue')));
app.component('tenant-companies-logo', defineAsyncComponent(() => import('./views/tenant/companies/logo.vue')));
app.component('tenant-certificates-index', defineAsyncComponent(() => import('./views/tenant/certificates/index.vue')));
app.component('tenant-certificates-form', defineAsyncComponent(() => import('./views/tenant/certificates/form.vue')));
app.component('tenant-configurations-form', defineAsyncComponent(() => import('./views/tenant/configurations/form.vue')));
app.component('tenant-configurations-form-purchases', defineAsyncComponent(() => import('./views/tenant/configurations/partials/purchases.vue')));
app.component('tenant-configurations-visual', defineAsyncComponent(() => import('./views/tenant/configurations/visual.vue')));
app.component('tenant-configurations-pdf', defineAsyncComponent(() => import('./views/tenant/configurations/pdf_templates.vue')));
app.component('tenant-configurations-ticket-pdf', defineAsyncComponent(() => import('./views/tenant/configurations/pdf_ticket_templates.vue')));
app.component('tenant-configurations-sale-notes', defineAsyncComponent(() => import('./views/tenant/configurations/sale_notes.vue')));
app.component('tenant-configurations-pdf-guide', defineAsyncComponent(() => import('./views/tenant/configurations/pdf_guide_templates.vue')));
app.component('tenant-configurations-preprinted-pdf', defineAsyncComponent(() => import('./views/tenant/configurations/pdf_preprinted_templates.vue')));
app.component('tenant-dialog-header-menu', defineAsyncComponent(() => import('./views/tenant/configurations/partials/dialog_header_menu.vue')));
app.component('tenant-bank_accounts-index', defineAsyncComponent(() => import('./views/tenant/bank_accounts/index.vue')));
app.component('tenant-items-index', defineAsyncComponent(() => import('./views/tenant/items/index.vue')));
app.component('tenant-persons-index', defineAsyncComponent(() => import('./views/tenant/persons/index.vue')));
app.component('tenant-person-form', defineAsyncComponent(() => import('./views/tenant/persons/form.vue')));

app.component('tenant-users-form', defineAsyncComponent(() => import('./views/tenant/users/form.vue')));
app.component('tenant-documents-index', defineAsyncComponent(() => import('./views/tenant/documents/index.vue')));
app.component('tenant-documents-invoice', defineAsyncComponent(() => import('./views/tenant/documents/invoice.vue')));
app.component('tenant-documents-invoice-generate', defineAsyncComponent(() => import('./views/tenant/documents/invoice_generate.vue')));
app.component('tenant-documents-invoicetensu', defineAsyncComponent(() => import('./views/tenant/documents/invoicetensu.vue')));
app.component('tenant-documents-note', defineAsyncComponent(() => import('./views/tenant/documents/note.vue')));

app.component('tenant-purchase-settlements-index', defineAsyncComponent(() => import('./views/tenant/purchase-settlements/index.vue')));
app.component('tenant-purchase-settlements-form', defineAsyncComponent(() => import('./views/tenant/purchase-settlements/form.vue')));

app.component('tenant-documents-items-list', defineAsyncComponent(() => import('./views/tenant/documents/partials/item.vue')));
app.component('tenant-summaries-index', defineAsyncComponent(() => import('./views/tenant/summaries/index.vue')));
app.component('tenant-voided-index', defineAsyncComponent(() => import('./views/tenant/voided/index.vue')));
app.component('tenant-search-index', defineAsyncComponent(() => import('./views/tenant/search/index.vue')));
app.component('tenant-options-form', defineAsyncComponent(() => import('./views/tenant/options/form.vue')));
app.component('tenant-unit_types-index', defineAsyncComponent(() => import('./views/tenant/unit_types/index.vue')));
app.component('tenant-detraction_types-index', defineAsyncComponent(() => import('./views/tenant/detraction_types/index.vue')));
app.component('tenant-users-index', defineAsyncComponent(() => import('./views/tenant/users/index.vue')));
app.component('tenant-establishments-index', defineAsyncComponent(() => import('./views/tenant/establishments/index.vue')));
app.component('tenant-charge_discounts-index', defineAsyncComponent(() => import('./views/tenant/charge_discounts/index.vue')));
app.component('tenant-banks-index', defineAsyncComponent(() => import('./views/tenant/banks/index.vue')));
app.component('tenant-exchange_rates-index', defineAsyncComponent(() => import('./views/tenant/exchange_rates/index.vue')));
app.component('tenant-currency-types-index', defineAsyncComponent(() => import('./views/tenant/currency_types/index.vue')));
app.component('tenant-retentions-index', defineAsyncComponent(() => import('./views/tenant/retentions/index.vue')));
app.component('tenant-retentions-form', defineAsyncComponent(() => import('./views/tenant/retentions/form.vue')));
app.component('tenant-perceptions-index', defineAsyncComponent(() => import('./views/tenant/perceptions/index.vue')));
app.component('tenant-perceptions-form', defineAsyncComponent(() => import('./views/tenant/perceptions/form.vue')));
app.component('tenant-dispatches-index', defineAsyncComponent(() => import('./views/tenant/dispatches/index.vue')));
app.component('tenant-dispatches-form', defineAsyncComponent(() => import('./views/tenant/dispatches/form.vue')));
app.component('tenant-dispatches-create', defineAsyncComponent(() => import('./views/tenant/dispatches/create.vue')));
app.component('tenant-guides-modal', defineAsyncComponent(() => import('./views/tenant/components/guides.vue')));
app.component('tenant-purchases-index', defineAsyncComponent(() => import('./views/tenant/purchases/index.vue')));
app.component('tenant-purchases-form', defineAsyncComponent(() => import('./views/tenant/purchases/form.vue')));
app.component('tenant-purchases-edit', defineAsyncComponent(() => import('./views/tenant/purchases/form_edit.vue')));
app.component('tenant-transfer-reason-types-index', defineAsyncComponent(() => import('./views/tenant/transfer_reason_types/index.vue')));

app.component('tenant-purchases-items', defineAsyncComponent(() => import('./views/tenant/dispatches/items.vue')));
app.component('tenant-attribute_types-index', defineAsyncComponent(() => import('./views/tenant/attribute_types/index.vue')));
app.component('tenant-calendar', defineAsyncComponent(() => import('./views/tenant/components/calendar.vue')));
app.component('tenant-warehouses', defineAsyncComponent(() => import('./views/tenant/components/warehouses.vue')));
app.component('tenant-calendar-quotation', defineAsyncComponent(() => import('./views/tenant/components/calendarquotations.vue')));
app.component('tenant-product', defineAsyncComponent(() => import('./views/tenant/components/products.vue')));

app.component('tenant-tasks-lists', defineAsyncComponent(() => import('./views/tenant/tasks/lists.vue')));
app.component('tenant-tasks-form', defineAsyncComponent(() => import('./views/tenant/tasks/form.vue')));
app.component('tenant-reports-consistency-documents-lists', defineAsyncComponent(() => import('./views/tenant/reports/consistency-documents/lists.vue')));
app.component('tenant-contingencies-index', defineAsyncComponent(() => import('./views/tenant/contingencies/index.vue')));

app.component('tenant-quotations-index', defineAsyncComponent(() => import('./views/tenant/quotations/index.vue')));
app.component('tenant-quotations-form', defineAsyncComponent(() => import('./views/tenant/quotations/form.vue')));
app.component('tenant-quotations-edit', defineAsyncComponent(() => import('./views/tenant/quotations/form_edit.vue')));
app.component('tenant-quotations-item-form', defineAsyncComponent(() => import('./views/tenant/quotations/partials/item.vue')));

app.component('tenant-sale-notes-index', defineAsyncComponent(() => import('./views/tenant/sale_notes/index.vue')));
app.component('tenant-sale-notes-form', defineAsyncComponent(() => import('./views/tenant/sale_notes/form.vue')));
app.component('tenant-pos-index', defineAsyncComponent(() => import('./views/tenant/pos/index.vue')));
app.component('cash-index', defineAsyncComponent(() => import('./views/tenant/cash/index.vue')));
app.component('tenant-card-brands-index', defineAsyncComponent(() => import('./views/tenant/card_brands/index.vue')));
app.component('tenant-pos-fast', defineAsyncComponent(() => import('./views/tenant/pos/fast.vue')));
app.component('tenant-pos-garage', defineAsyncComponent(() => import('./views/tenant/pos/garage.vue')));

app.component('tenant-payment-method-index', defineAsyncComponent(() => import('./views/tenant/payment_method/index.vue')));

// ── Inventory module ──────────────────────────────────────────────────────────
app.component('inventory-index', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/inventory/index.vue')));
app.component('inventory-transfers-index', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/transfers/index.vue')));
app.component('warehouses-index', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/warehouses/index.vue')));
app.component('tenant-report-kardex-index', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/kardex/index.vue')));
app.component('tenant-inventories-form', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/config/form.vue')));
app.component('tenant-expenses-index', defineAsyncComponent(() => import('../../modules/Expense/Resources/assets/js/views/expenses/index.vue')));
app.component('tenant-expenses-form', defineAsyncComponent(() => import('../../modules/Expense/Resources/assets/js/views/expenses/form.vue')));
app.component('tenant-account-export', defineAsyncComponent(() => import('../../modules/Account/Resources/assets/js/views/account/export.vue')));
app.component('tenant-account-summary-report', defineAsyncComponent(() => import('../../modules/Account/Resources/assets/js/views/summary_report/index.vue')));
app.component('tenant-account-format', defineAsyncComponent(() => import('../../modules/Account/Resources/assets/js/views/account/format.vue')));
app.component('tenant-company-accounts', defineAsyncComponent(() => import('../../modules/Account/Resources/assets/js/views/company_accounts/form.vue')));
app.component('tenant-ledger-accounts', defineAsyncComponent(() => import('../../modules/Account/Resources/assets/js/views/ledger_accounts/form.vue')));

app.component('inventory-review-index', defineAsyncComponent(() => import('@viewsModuleInventory/inventory-review/index.vue')));

app.component('tenant-inventory-report', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/inventory/reports/index.vue')));

app.component('tenant-inventory-color-index', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/extra_info/color/index.vue')));
app.component('tenant-inventory-item-units-per-package-index', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/extra_info/item_units_per_package/index.vue')));
app.component('tenant-inventory-item-units-business', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/extra_info/item_units_business/index.vue')));
app.component('tenant-inventory-item-package-measurements', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/extra_info/item_package_measurements/index.vue')));
app.component('tenant-inventory-mold-cavities', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/extra_info/item_mold_cavities/index.vue')));
app.component('tenant-inventory-mold-property', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/extra_info/item_mold_property/index.vue')));
app.component('tenant-inventory-size-property', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/extra_info/item_size/index.vue')));
app.component('tenant-inventory-item-status', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/extra_info/item_status/index.vue')));
app.component('tenant-inventory-item-product-family', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/extra_info/item_product_family/index.vue')));
app.component('tenant-inventory-extra-info-list', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/extra_info/index.vue')));

app.component('tenant-inventory-devolutions-index', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/devolutions/index.vue')));
app.component('tenant-inventory-devolutions-form', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/devolutions/form.vue')));

// ── Document module ───────────────────────────────────────────────────────────
app.component('tenant-documents-not-sent', defineAsyncComponent(() => import('../../modules/Document/Resources/assets/js/views/documents/not_sent.vue')));
app.component('tenant-report-purchases-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/purchases/index.vue')));
app.component('tenant-report-documents-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/documents/index.vue')));
app.component('tenant-report-customers-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/customers/index.vue')));
app.component('tenant-report-items-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/items/index.vue')));
app.component('tenant-report-items-extra-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/items/index_extra.vue')));
app.component('tenant-report-download-tray-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/download_tray/index.vue')));
app.component('tenant-report-guide-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/guide/index.vue')));
app.component('tenant-report-discount-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/discount/index.vue')));
app.component('tenant-report-sale_notes-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/sale_notes/index.vue')));
app.component('tenant-report-quotations-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/quotations/index.vue')));
app.component('tenant-report-cash-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/cash/index.vue')));
app.component('tenant-index-configuration', defineAsyncComponent(() => import('../../modules/BusinessTurn/Resources/assets/js/views/configurations/index.vue')));
app.component('tenant-report-document_hotels-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/document_hotels/index.vue')));
app.component('tenant-report_hotels-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/report_hotels/index.vue')));
app.component('tenant-report-commercial_analysis-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/commercial_analysis/index.vue')));
app.component('tenant-offline-configurations-index', defineAsyncComponent(() => import('../../modules/Offline/Resources/assets/js/views/offline_configurations/index.vue')));
app.component('tenant-series-configurations-index', defineAsyncComponent(() => import('../../modules/Document/Resources/assets/js/views/series_configurations/index.vue')));
app.component('tenant-validate-documents-index', defineAsyncComponent(() => import('../../modules/Document/Resources/assets/js/views/validate_documents/index.vue')));
app.component('tenant-report-document-detractions-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/document-detractions/index.vue')));
app.component('tenant-report-commissions-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/commissions/index.vue')));
app.component('tenant-report-order-notes-consolidated-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/order_notes_consolidated/index.vue')));
app.component('tenant-report-general-items-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/general_items/index.vue')));
app.component('tenant-report-order-notes-general-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/order_notes_general/index.vue')));
app.component('tenant-report-sales-consolidated-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/sales_consolidated/index.vue')));
app.component('tenant-report-user-commissions-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/user_commissions/index.vue')));
app.component('tenant-report-fixed-asset-purchases-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/fixed-asset-purchases/index.vue')));
app.component('tenant-report-massive-downloads-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/massive-downloads/index.vue')));
app.component('tenant-documents-regularize-shipping', defineAsyncComponent(() => import('../../modules/Document/Resources/assets/js/views/documents/regularize_shipping.vue')));
app.component('tenant-report-commissions-detail-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/commissions_detail/index.vue')));
app.component('tenant-report-tips-index', defineAsyncComponent(() => import('../../modules/Report/Resources/assets/js/views/tips/index.vue')));

// ── Item module ───────────────────────────────────────────────────────────────
app.component('tenant-categories-index', defineAsyncComponent(() => import('../../modules/Item/Resources/assets/js/views/categories/index.vue')));
app.component('tenant-brands-index', defineAsyncComponent(() => import('../../modules/Item/Resources/assets/js/views/brands/index.vue')));
app.component('tenant-zone-index', defineAsyncComponent(() => import('../../modules/Item/Resources/assets/js/views/zone/index.vue')));
app.component('tenant-incentives-index', defineAsyncComponent(() => import('../../modules/Item/Resources/assets/js/views/incentives/index.vue')));
app.component('tenant-item-lots-index', defineAsyncComponent(() => import('../../modules/Item/Resources/assets/js/views/item-lots/index.vue')));

// ── Ecommerce module ──────────────────────────────────────────────────────────
app.component('tenant-ecommerce-configuration-info', defineAsyncComponent(() => import('../../modules/Ecommerce/Resources/assets/js/views/configuration/index.vue')));
app.component('tenant-ecommerce-configuration-culqi', defineAsyncComponent(() => import('../../modules/Ecommerce/Resources/assets/js/views/configuration_culqi/index.vue')));
app.component('tenant-ecommerce-configuration-paypal', defineAsyncComponent(() => import('../../modules/Ecommerce/Resources/assets/js/views/configuration_paypal/index.vue')));
app.component('tenant-ecommerce-configuration-logo', defineAsyncComponent(() => import('../../modules/Ecommerce/Resources/assets/js/views/configuration_logo/index.vue')));
app.component('tenant-ecommerce-configuration-social', defineAsyncComponent(() => import('../../modules/Ecommerce/Resources/assets/js/views/configuration_social/index.vue')));
app.component('tenant-ecommerce-configuration-tag', defineAsyncComponent(() => import('../../modules/Ecommerce/Resources/assets/js/views/configuration_tags/index.vue')));
app.component('tenant-ecommerce-item-sets-index', defineAsyncComponent(() => import('../../modules/Ecommerce/Resources/assets/js/views/item_sets/index.vue')));

// ── Purchase module ───────────────────────────────────────────────────────────
app.component('tenant-purchase-quotations-index', defineAsyncComponent(() => import('../../modules/Purchase/Resources/assets/js/views/purchase-quotations/index.vue')));
app.component('tenant-purchase-quotations-form', defineAsyncComponent(() => import('../../modules/Purchase/Resources/assets/js/views/purchase-quotations/form.vue')));
app.component('tenant-purchase-orders-index', defineAsyncComponent(() => import('../../modules/Purchase/Resources/assets/js/views/purchase-orders/index.vue')));
app.component('tenant-purchase-orders-form', defineAsyncComponent(() => import('../../modules/Purchase/Resources/assets/js/views/purchase-orders/form.vue')));
app.component('tenant-purchase-orders-generate', defineAsyncComponent(() => import('../../modules/Purchase/Resources/assets/js/views/purchase-orders/generate.vue')));

app.component('moves-index', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/moves/index.vue')));
app.component('inventory-form-masive', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/transfers/form_masive.vue')));

app.component('tenant-report-kardex-master', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/kardex_master/index.vue')));
app.component('tenant-report-kardex-lots', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/kardex/lots.vue')));
app.component('tenant-report-kardex-series', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/kardex/series.vue')));

// ── Order module ──────────────────────────────────────────────────────────────
app.component('tenant-order-notes-index', defineAsyncComponent(() => import('../../modules/Order/Resources/assets/js/views/order_notes/index.vue')));
app.component('tenant-order-notes-form', defineAsyncComponent(() => import('../../modules/Order/Resources/assets/js/views/order_notes/form.vue')));
app.component('tenant-order-notes-edit', defineAsyncComponent(() => import('../../modules/Order/Resources/assets/js/views/order_notes/form_edit.vue')));
app.component('tenant-report-valued-kardex', defineAsyncComponent(() => import('../../modules/Inventory/Resources/assets/js/valued_kardex/index.vue')));
app.component('tenant-mitiendape-config', defineAsyncComponent(() => import('../../modules/Order/Resources/assets/js/views/mi_tienda_pe/form.vue')));

// ── Finance module ────────────────────────────────────────────────────────────
app.component('tenant-finance-global-payments-index', defineAsyncComponent(() => import('../../modules/Finance/Resources/assets/js/views/global_payments/index.vue')));
app.component('tenant-finance-balance-index', defineAsyncComponent(() => import('../../modules/Finance/Resources/assets/js/views/balance/index.vue')));
app.component('tenant-finance-modal-transfer-between-accounts', defineAsyncComponent(() => import('../../modules/Finance/Resources/assets/js/views/transfer_between_accounts/options.vue')));
app.component('tenant-finance-payment-method-types-index', defineAsyncComponent(() => import('../../modules/Finance/Resources/assets/js/views/payment_method_types/index.vue')));
app.component('tenant-finance-unpaid-index', defineAsyncComponent(() => import('@viewsModuleFinance/unpaid/index.vue')));
app.component('tenant-finance-to-pay-index', defineAsyncComponent(() => import('@viewsModuleFinance/to_pay/index.vue')));
app.component('tenant-finance-income-index', defineAsyncComponent(() => import('@viewsModuleFinance/income/index.vue')));
app.component('tenant-finance-income-form', defineAsyncComponent(() => import('@viewsModuleFinance/income/form.vue')));
app.component('tenant-income-types-index', defineAsyncComponent(() => import('@viewsModuleFinance/income_types/index.vue')));
app.component('tenant-income-reasons-index', defineAsyncComponent(() => import('@viewsModuleFinance/income_reasons/index.vue')));
app.component('tenant-finance-movements-index', defineAsyncComponent(() => import('@viewsModuleFinance/movements/index.vue')));

// ── Sale module ───────────────────────────────────────────────────────────────
app.component('tenant-sale-opportunities-index', defineAsyncComponent(() => import('@viewsModuleSale/sale_opportunities/index.vue')));
app.component('tenant-sale-opportunities-form', defineAsyncComponent(() => import('@viewsModuleSale/sale_opportunities/form.vue')));
app.component('tenant-payment-method-types-index', defineAsyncComponent(() => import('@viewsModuleSale/payment_method_types/index.vue')));
app.component('tenant-contracts-index', defineAsyncComponent(() => import('@viewsModuleSale/contracts/index.vue')));
app.component('tenant-contracts-form', defineAsyncComponent(() => import('@viewsModuleSale/contracts/form.vue')));
app.component('tenant-production-orders-index', defineAsyncComponent(() => import('@viewsModuleSale/production_orders/index.vue')));
app.component('tenant-agents-index', defineAsyncComponent(() => import('@viewsModuleSale/agents/index.vue')));
app.component('tenant-web-platforms-index', defineAsyncComponent(() => import('@viewsModuleItem/web-platforms/index.vue')));
app.component('tenant-technical-services-index', defineAsyncComponent(() => import('@viewsModuleSale/technical-services/index.vue')));
app.component('tenant-user-commissions-index', defineAsyncComponent(() => import('@viewsModuleSale/user-commissions/index.vue')));

// ── Purchase extras ───────────────────────────────────────────────────────────
app.component('tenant-fixed-asset-items-index', defineAsyncComponent(() => import('@viewsModulePurchase/fixed_asset_items/index.vue')));
app.component('tenant-fixed-asset-purchases-index', defineAsyncComponent(() => import('@viewsModulePurchase/fixed_asset_purchases/index.vue')));
app.component('tenant-fixed-asset-purchases-form', defineAsyncComponent(() => import('@viewsModulePurchase/fixed_asset_purchases/form.vue')));

// ── Expense module ────────────────────────────────────────────────────────────
app.component('tenant-expense-types-index', defineAsyncComponent(() => import('@viewsModuleExpense/expense_types/index.vue')));
app.component('tenant-expense-reasons-index', defineAsyncComponent(() => import('@viewsModuleExpense/expense_reasons/index.vue')));
app.component('tenant-expense-method-types-index', defineAsyncComponent(() => import('@viewsModuleExpense/expense_method_types/index.vue')));

// ── Order logistics ───────────────────────────────────────────────────────────
app.component('tenant-drivers-index', defineAsyncComponent(() => import('@viewsModuleOrder/drivers/index.vue')));
app.component('tenant-dispatchers-index', defineAsyncComponent(() => import('@viewsModuleOrder/dispatchers/index.vue')));
app.component('tenant-order-forms-index', defineAsyncComponent(() => import('@viewsModuleOrder/order_forms/index.vue')));
app.component('tenant-order-forms-form', defineAsyncComponent(() => import('@viewsModuleOrder/order_forms/form.vue')));

// ── System components ─────────────────────────────────────────────────────────
app.component('system-clients-index', defineAsyncComponent(() => import('./views/system/clients/index.vue')));
app.component('system-clients-form', defineAsyncComponent(() => import('./views/system/clients/form.vue')));
app.component('system-users-form', defineAsyncComponent(() => import('./views/system/users/form.vue')));
app.component('system-certificate-index', defineAsyncComponent(() => import('./views/system/certificate/index.vue')));
app.component('system-companies-form', defineAsyncComponent(() => import('./views/system/companies/form.vue')));
app.component('system-accounting-index', defineAsyncComponent(() => import('@viewsModuleAccount/system/accounting/index.vue')));

// ── Hotel module ──────────────────────────────────────────────────────────────
app.component('tenant-hotel-rates', defineAsyncComponent(() => import('@viewsModuleHotel/rates/List.vue')));
app.component('tenant-hotel-categories', defineAsyncComponent(() => import('@viewsModuleHotel/categories/List.vue')));
app.component('tenant-hotel-floors', defineAsyncComponent(() => import('@viewsModuleHotel/floors/List.vue')));
app.component('tenant-hotel-rooms', defineAsyncComponent(() => import('@viewsModuleHotel/rooms/List.vue')));
app.component('tenant-hotel-reception', defineAsyncComponent(() => import('@viewsModuleHotel/rooms/Reception.vue')));
app.component('tenant-hotel-rent', defineAsyncComponent(() => import('@viewsModuleHotel/rooms/Rent.vue')));
app.component('tenant-hotel-rent-add-product', defineAsyncComponent(() => import('@viewsModuleHotel/rooms/AddProductToRoom.vue')));
app.component('tenant-hotel-rent-checkout', defineAsyncComponent(() => import('@viewsModuleHotel/rooms/Checkout.vue')));

// ── Documentary procedure module ──────────────────────────────────────────────
app.component('tenant-documentary-offices', defineAsyncComponent(() => import('@viewsModuleDocumentary/offices/Offices.vue')));
app.component('tenant-documentary-status', defineAsyncComponent(() => import('@viewsModuleDocumentary/status/Status.vue')));
app.component('tenant-documentary-processes', defineAsyncComponent(() => import('@viewsModuleDocumentary/processes/Processes.vue')));
app.component('tenant-documentary-documents', defineAsyncComponent(() => import('@viewsModuleDocumentary/documents/Documents.vue')));
app.component('tenant-documentary-actions', defineAsyncComponent(() => import('@viewsModuleDocumentary/actions/Actions.vue')));
app.component('tenant-documentary-files', defineAsyncComponent(() => import('@viewsModuleDocumentary/files/Files.vue')));
app.component('tenant-documentary-requirements', defineAsyncComponent(() => import('@viewsModuleDocumentary/requirements/Requirements.vue')));
app.component('tenant-documentary-statistic', defineAsyncComponent(() => import('@viewsModuleDocumentary/statistic/Index.vue')));
app.component('tenant-documentary-files-simplify', defineAsyncComponent(() => import('@viewsModuleDocumentary/files_simplify/Files.vue')));
app.component('tenant-documentary-files-simplify-form', defineAsyncComponent(() => import('@viewsModuleDocumentary/files_simplify/FilesNew.vue')));

app.component('system-plans-index', defineAsyncComponent(() => import('./views/system/plans/index.vue')));
app.component('system-plans-form', defineAsyncComponent(() => import('./views/system/plans/form.vue')));

app.component('x-input-service', defineAsyncComponent(() => import('../../modules/ApiPeruDev/Resources/assets/js/components/InputService.vue')));

app.component('tenant-items-ecommerce-index', defineAsyncComponent(() => import('./views/tenant/items_ecommerce/index.vue')));
app.component('tenant-ecommerce-cart', defineAsyncComponent(() => import('./views/tenant/ecommerce/cart_dropdown.vue')));
app.component('tenant-tags-index', defineAsyncComponent(() => import('./views/tenant/tags/index.vue')));
app.component('tenant-promotions-index', defineAsyncComponent(() => import('./views/tenant/promotions/index.vue')));
app.component('tenant-item-sets-index', defineAsyncComponent(() => import('./views/tenant/item_sets/index.vue')));
app.component('tenant-person-types-index', defineAsyncComponent(() => import('./views/tenant/person_types/index.vue')));
app.component('tenant-orders-index', defineAsyncComponent(() => import('./views/tenant/orders/index.vue')));

app.component('tenant-account-payment-index', defineAsyncComponent(() => import('./views/tenant/account/payment_index.vue')));
app.component('tenant-account-configuration-index', defineAsyncComponent(() => import('./views/tenant/account/configuration.vue')));

app.component('system-update', defineAsyncComponent(() => import('./views/system/update/index.vue')));
app.component('system-backup', defineAsyncComponent(() => import('./views/system/backup/index.vue')));
app.component('system-configuration-culqi', defineAsyncComponent(() => import('./views/system/configuration/culqi.vue')));
app.component('system-configuration-apk-url', defineAsyncComponent(() => import('./views/system/configuration/apk-url.vue')));
app.component('system-configuration-token', defineAsyncComponent(() => import('./views/system/configuration/token_ruc_dni.vue')));
app.component('system-php-configuration', defineAsyncComponent(() => import('./views/system/configuration/php_info.vue')));
app.component('system-server-status', defineAsyncComponent(() => import('./views/system/configuration/server_status.vue')));
app.component('system-login-settings', defineAsyncComponent(() => import('./views/system/configuration/login.vue')));
app.component('system-login-other-configuration', defineAsyncComponent(() => import('./views/system/configuration/other_configuration.vue')));
app.component('tenant-login-page', defineAsyncComponent(() => import('./views/tenant/login/index.vue')));

// ── Digemid module ────────────────────────────────────────────────────────────
app.component('tenant-digemid-index', defineAsyncComponent(() => import('../../modules/Digemid/Resources/assets/js/view/index.vue')));

// ── Suscripcion module ────────────────────────────────────────────────────────
app.component('tenant-suscription-client-index', defineAsyncComponent(() => import('../../modules/Suscription/Resources/assets/js/clients/index.vue')));
app.component('tenant-suscription-plans-index', defineAsyncComponent(() => import('../../modules/Suscription/Resources/assets/js/plans/index.vue')));
app.component('tenant-suscription-payments-index', defineAsyncComponent(() => import('../../modules/Suscription/Resources/assets/js/payments/index.vue')));
app.component('data-table-payment-receipt', defineAsyncComponent(() => import('../js/components/DataTablePaymentReceipt.vue')));
app.component('tenant-index-payment-receipt', defineAsyncComponent(() => import('../../modules/Suscription/Resources/assets/js/payment_receipt/index.vue')));
app.component('tenant-suscription-grades-index', defineAsyncComponent(() => import('@viewsModuleSuscription/grades/index.vue')));
app.component('tenant-suscription-sections-index', defineAsyncComponent(() => import('@viewsModuleSuscription/sections/index.vue')));

// ── Full Suscripcion module ───────────────────────────────────────────────────
app.component('tenant-full-suscription-client-index', defineAsyncComponent(() => import('../../modules/FullSuscription/Resources/assets/js/clients/index.vue')));
app.component('tenant-full-suscription-plans-index', defineAsyncComponent(() => import('../../modules/FullSuscription/Resources/assets/js/plans/index.vue')));
app.component('tenant-full-suscription-payments-index', defineAsyncComponent(() => import('../../modules/FullSuscription/Resources/assets/js/payments/index.vue')));
app.component('tenant-full-suscription-index-payment-receipt', defineAsyncComponent(() => import('../../modules/FullSuscription/Resources/assets/js/payment_receipt/index.vue')));

// ── Expense extras ────────────────────────────────────────────────────────────
app.component('tenant-bankloans-index', defineAsyncComponent(() => import('../../modules/Expense/Resources/assets/js/views/bank_loans/index.vue')));
app.component('tenant-bankloans-form', defineAsyncComponent(() => import('../../modules/Expense/Resources/assets/js/views/bank_loans/form.vue')));

// ── Production module ─────────────────────────────────────────────────────────
app.component('tenant-mill-index', defineAsyncComponent(() => import('../../modules/Production/Resources/assets/js/view/mill/index.vue')));
app.component('tenant-mill-form', defineAsyncComponent(() => import('../../modules/Production/Resources/assets/js/view/mill/form.vue')));
app.component('tenant-machine-index', defineAsyncComponent(() => import('../../modules/Production/Resources/assets/js/view/machine/index.vue')));
app.component('tenant-machine-type-index', defineAsyncComponent(() => import('../../modules/Production/Resources/assets/js/view/machine/index_type.vue')));
app.component('tenant-machine-form', defineAsyncComponent(() => import('../../modules/Production/Resources/assets/js/view/machine/form.vue')));
app.component('tenant-machine-type-form', defineAsyncComponent(() => import('../../modules/Production/Resources/assets/js/view/machine/form_type.vue')));
app.component('tenant-workers-index', defineAsyncComponent(() => import('../../modules/Production/Resources/assets/js/view/workers/index.vue')));
app.component('tenant-production-index', defineAsyncComponent(() => import('../../modules/Production/Resources/assets/js/view/production/index.vue')));
app.component('tenant-production-form', defineAsyncComponent(() => import('../../modules/Production/Resources/assets/js/view/production/form.vue')));
app.component('tenant-packaging-index', defineAsyncComponent(() => import('../../modules/Production/Resources/assets/js/view/packaging/index.vue')));
app.component('tenant-packaging-form', defineAsyncComponent(() => import('../../modules/Production/Resources/assets/js/view/packaging/form.vue')));

// ── Restaurant module ─────────────────────────────────────────────────────────
app.component('tenant-restaurant-list-items', defineAsyncComponent(() => import('../../modules/Restaurant/Resources/assets/js/views/items/index.vue')));
app.component('tenant-restaurant-promotions-index', defineAsyncComponent(() => import('../../modules/Restaurant/Resources/assets/js/views/promotions/index.vue')));
app.component('tenant-restaurant-orders-index', defineAsyncComponent(() => import('../../modules/Restaurant/Resources/assets/js/views/orders/index.vue')));
app.component('tenant-restaurant-cash-index', defineAsyncComponent(() => import('../../modules/Restaurant/Resources/assets/js/views/cash/index.vue')));
app.component('tenant-restaurant-cash-filter-pos', defineAsyncComponent(() => import('../../modules/Restaurant/Resources/assets/js/views/cash/filter-pos.vue')));
app.component('tenant-restaurant-configuration', defineAsyncComponent(() => import('../../modules/Restaurant/Resources/assets/js/views/configuration/index.vue')));

// ── Payment module ────────────────────────────────────────────────────────────
app.component('tenant-payment-configurations-index', defineAsyncComponent(() => import('@viewsModulePayment/payment_configurations/index.vue')));
app.component('tenant-public-payment-links-index', defineAsyncComponent(() => import('@viewsModulePayment/payment_links/public/index.vue')));
app.component('tenant-payment-links-index', defineAsyncComponent(() => import('@viewsModulePayment/payment_links/index.vue')));

// ── Mobile App module ─────────────────────────────────────────────────────────
app.component('tenant-mobile-app-configuration', defineAsyncComponent(() => import('@viewsModuleMobileApp/configuration/index.vue')));
app.component('tenant-mobile-app-permissions', defineAsyncComponent(() => import('@viewsModuleMobileApp/permissions/index.vue')));

// ── Level Access module ───────────────────────────────────────────────────────
app.component('tenant-system-activity-logs-generals-index', defineAsyncComponent(() => import('@viewsModuleLevelAccess/system_activity_logs/generals/index.vue')));
app.component('tenant-system-activity-logs-transactions-index', defineAsyncComponent(() => import('@viewsModuleLevelAccess/system_activity_logs/transactions/index.vue')));
app.component('tenant-remember-change-password', defineAsyncComponent(() => import('./views/tenant/users/partials/remember_change_password.vue')));

// ── System reports ────────────────────────────────────────────────────────────
app.component('system-report-login-lockout-index', defineAsyncComponent(() => import('@viewsModuleReport/system/report_login_lockout/index.vue')));
app.component('system-user-not-change-password-index', defineAsyncComponent(() => import('@viewsModuleReport/system/user_not_change_password/index.vue')));

// ── Mount ─────────────────────────────────────────────────────────────────────
app.mount('#main-wrapper')
