import { defineConfig } from 'vite'
import laravel from 'laravel-vite-plugin'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/js/app.js',
                'resources/sass/style.scss',
                'resources/sass/auth.scss',
            ],
            refresh: true,
        }),
        vue(),
    ],
    css: {
        preprocessorOptions: {
            scss: {
                // Allow bare node_modules imports without ~ prefix
                loadPaths: ['node_modules'],
            }
        }
    },
    resolve: {
        alias: {
            '@components': path.resolve(__dirname, 'resources/js/components'),
            '@views':      path.resolve(__dirname, 'resources/js/views/tenant'),
            '@helpers':    path.resolve(__dirname, 'resources/js/helpers'),
            '@mixins':     path.resolve(__dirname, 'resources/js/mixins'),

            '@viewsModuleSale':          path.resolve(__dirname, 'modules/Sale/Resources/assets/js/views'),
            '@viewsModuleFinance':       path.resolve(__dirname, 'modules/Finance/Resources/assets/js/views'),
            '@viewsModulePurchase':      path.resolve(__dirname, 'modules/Purchase/Resources/assets/js/views'),
            '@viewsModuleExpense':       path.resolve(__dirname, 'modules/Expense/Resources/assets/js/views'),
            '@viewsModuleOrder':         path.resolve(__dirname, 'modules/Order/Resources/assets/js/views'),
            '@viewsModuleAccount':       path.resolve(__dirname, 'modules/Account/Resources/assets/js/views'),
            '@viewsModuleItem':          path.resolve(__dirname, 'modules/Item/Resources/assets/js/views'),
            '@viewsModuleHotel':         path.resolve(__dirname, 'modules/Hotel/Resources/assets/js/views'),
            '@viewsModuleDocumentary':   path.resolve(__dirname, 'modules/DocumentaryProcedure/Resources/assets/js/views'),
            '@viewsModulePayment':       path.resolve(__dirname, 'modules/Payment/Resources/assets/js/views'),
            '@viewsModuleMercadoPago':   path.resolve(__dirname, 'modules/MercadoPago/Resources/assets/js/views'),
            '@viewsModuleSuscription':   path.resolve(__dirname, 'modules/Suscription/Resources/assets/js/views'),
            '@viewsModuleMobileApp':     path.resolve(__dirname, 'modules/MobileApp/Resources/assets/js/views'),
            '@viewsModuleLevelAccess':   path.resolve(__dirname, 'modules/LevelAccess/Resources/assets/js/views'),
            '@viewsModuleReport':        path.resolve(__dirname, 'modules/Report/Resources/assets/js/views'),
            '@viewsModuleInventory':     path.resolve(__dirname, 'modules/Inventory/Resources/assets/js'),
        }
    },
})
