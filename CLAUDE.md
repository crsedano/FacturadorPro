# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Facturador PRO 5** — Peruvian SaaS invoicing/billing platform. Laravel 5.7 + Vue 2 + multi-tenant architecture. Integrates with SUNAT (Peru tax authority) for electronic invoice signing and validation.

## Commands

### PHP / Laravel
```bash
php artisan serve                        # local dev server
php artisan migrate                      # run migrations
php artisan module:make ModuleName       # create new module
php artisan tinker                       # REPL

vendor/bin/phpunit                       # all tests
vendor/bin/phpunit --filter TestName     # single test
vendor/bin/phpunit tests/Unit/           # unit suite only
vendor/bin/phpunit tests/Feature/        # feature suite only
```

### Frontend
```bash
npm run dev        # dev build
npm run watch      # watch mode
npm run hot        # HMR dev server
npm run prod       # production build
```

## Architecture

### Modular Structure
30 modules in `modules/` using `nwidart/laravel-modules`. Each module is a self-contained mini-Laravel app:

```
modules/ModuleName/
├── Http/Controllers/     # Controllers
├── Http/Requests/        # Form validation
├── Http/Resources/       # API response transformers
├── Models/
├── Services/             # Business logic (prefer Services over fat controllers)
├── Routes/web.php
├── Routes/api.php
├── Resources/
│   ├── assets/js/views/  # Vue components for this module
│   └── views/            # Blade templates
├── Database/
│   ├── Migrations/
│   └── Seeders/
└── Providers/
    ├── ModuleServiceProvider.php   # registers routes, views, migrations, config
    └── RouteServiceProvider.php
```

Namespace pattern: `Modules\ModuleName\Http\Controllers\...`

### Routing Bifurcation (`routes/web.php`)
Lines 3-5 check `CurrentHostname` contract (hyn/multi-tenant):
- **Hostname found** → `Route::domain($fqdn)` wraps tenant routes under `auth`, `redirect.module`, `locked.tenant`
- **No hostname** → system admin routes under prefix `PREFIX_URL` env var, guard `auth:admin`

`routes/api.php` splits similarly:
- `auth:api` guard → tenant API (documents, sales, RUC/DNI)
- `auth:system_api` guard → system API (resellers, partner restaurants)

### Multi-Tenancy
Powered by `hyn/multi-tenant`. Each tenant = unique FQDN → separate MySQL DB with prefix from `PREFIX_DATABASE` env (default `tenancy`). `database/migrations/tenant/` auto-runs on new tenant creation via `TenancyDatabaseSeeder`. Models in `app/Models/System/*` use global DB; `app/Models/Tenant/*` auto-switch to tenant DB.

### App Core (`app/`)
- `app/CoreFacturalo/` — core invoicing engine:
  - `Facturalo.php` — main orchestrator (see Invoice Flow below)
  - `Services/Cpe/` — CPE (electronic invoice) validation
  - `Services/Ruc/Sunat.php` + `Services/Dni/Reniec.php` + `Essalud.php` — SUNAT/RENIEC lookups
  - `Services/IntegratedQuery/` — SUNAT integrated query
  - `Services/Extras/ExchangeRate` — daily USD/PEN rate fetch
  - `WS/BillSender.php` — submits invoices/boletas via SOAP
  - `WS/SummarySender.php` — submits daily summaries (resumen diario)
  - `WS/ConsultCdrService.php` — polls CDR status from SUNAT
  - `WS/Signed/XmlSigned.php` — RSA digital signature (xmlseclibs)
  - `WS/WsSecurityHeader.php` — WS-Security token generation
  - `WS/SunatEndpoints.php` — WSDL URLs (demo vs production)
  - `Templates/` — Blade → mPDF → PDF (A4, A5, ticket 58mm/80mm, guides)
  - `Helpers/QrCode/QrCodeGenerate.php` — QR for SUNAT verification
  - `Helpers/Storage/StorageDocument` — XML/PDF/CDR file storage trait
- `app/Models/System/` — system-wide models (Hostname, Website, etc.)
- `app/Models/Tenant/` — tenant-scoped models
- `app/Http/ViewComposers/` — shared data injected into views
- `app/helper.php` — globally autoloaded helper functions (PSR-4 autoload `files` entry)

### Invoice Flow (end-to-end)
```
Vue form → POST /api/documents
  → DocumentController@store
  → Facturalo::save()
      ├── detect type: invoice | credit-note | summary | voided | dispatch
      ├── persist: documents + invoices/notes + document_items + payments
      ├── Template (Blade) → unsigned XML
      ├── XmlSigned::signXml()  OR  SendDocumentPse (external PSE)
      ├── BillSender / SummarySender → SOAP to SUNAT
      ├── parse CDR ZIP response → update documents.state_type_id
      │     05=ACCEPTED  07=OBSERVED  09=REJECTED  13=CANCELING
      ├── mPDF → generate PDF
      ├── store XML + PDF + CDR in storage/tenant-{uuid}/
      └── if send_email=true → queue DocumentEmail (database queue)
  → JSON response → Vue updates document table
```

### Frontend
- Single Vue 2 app entry: `resources/js/app.js` → `public/js/`
- Module Vue components live in `modules/ModuleName/Resources/assets/js/views/`
- Core webpack aliases (`webpack.mix.js`):
  - `@components` → `resources/js/components`
  - `@views` → `resources/js/views/tenant`
  - `@helpers` → `resources/js/helpers`
  - `@mixins` → `resources/js/mixins`
  - `@viewsModule{Sale,Finance,Purchase,Expense,Order,Account,Item,Hotel,Documentary,Payment,MercadoPago,Suscription,MobileApp,LevelAccess,Report,Inventory}` → respective module assets
- SASS: `resources/sass/style.scss` + `auth.scss`

### Authentication — Complete Flow

**4 Guards** (`config/auth.php`):
| Guard | Driver | Provider | Used by |
|---|---|---|---|
| `web` | session | `App\Models\Tenant\User` | Tenant staff (browser) |
| `api` | token (`api_token` col) | same | Mobile / external API |
| `admin` | session | `App\Models\System\User` | Superadmin panel |
| `system_api` | token | `System\User` | Resellers / partner API |

**Flow 1 — Tenant web login** (`app/Http/Controllers/Auth/LoginController.php`):
```
POST /login (on tenant domain)
  → Auth\LoginController (uses AuthenticatesUsers trait)
  → guard: 'web' (session)
  → rate limit: 3 attempts, 5 min lockout
  → showLoginForm(): checks SystemConfiguration->use_login_global
      true  → uses global login config/branding
      false → uses tenant's own Configuration + Company logo
  → success → redirect /dashboard
```

**Flow 2 — System admin login** (`app/Http/Controllers/System/LoginController.php`):
```
POST /login (on system/admin domain)
  → System\LoginController overrides guard() → Auth::guard('admin')
  → provider: App\Models\System\User
  → success → redirect /dashboard (system panel)
```

**Flow 3 — Mobile/API login** (`app/Http/Controllers/Tenant/Api/MobileController.php`):
```
POST /login (api.php, no session)
  → Auth::attempt(['email','password'])
  → returns JSON: { token: user.api_token, name, email, series_id,
                    restaurant_role_id, ruc, app_logo, app_configuration }
  → subsequent requests: Authorization: Bearer {token}  OR  ?api_token={token}
```

**Post-auth middleware chain** (every authenticated tenant request):
```
Request arrives
  → locked.tenant   → Configuration::isLockedTenant() → abort(403) if true
  → redirect.module → maps URL path to module group, checks user->getModules()
                       → if group not in user's modules: log + redirect to user's default module
  → redirect.level  → maps URL path to level group, checks user->getLevels()
                       → if level not assigned: log + redirect to user's default level route
  → controller
```

**Module groups** (RedirectModule — what URL prefixes map to which access group):
| URL prefix | Module group |
|---|---|
| `documents`, `dashboard`, `quotations`, `items`, `summaries`, `voided` | `documents` |
| `purchases`, `expenses` | `purchases` |
| `retentions`, `dispatches`, `perceptions` | `advanced` |
| `pos`, `cash` | `pos` |
| `warehouses`, `inventory`, `reports/kardex` | `inventory` |
| `account` | `accounting` |
| `finances` | `finance` |
| `orders`, `ecommerce/*`, `promotions` | `ecommerce` |
| `hotels` | `hotels` |
| `documentary-procedure` | `documentary-procedure` |
| `suscription` | `suscription_app` |
| `digemid` | `digemid` |

**Level groups** (RedirectModuleLevel — fine-grained within a module):
`new_document`, `list_document`, `document_not_sent`, `items`, `quotations`, `sale_notes`, `contracts`, `incentives`, `sale-opportunity`, `order-note`, `technical-service`, `purchases_orders`, `configuration_advance`, `configuration_company`, `configuration_visual`, `suscription_app_{client,service,payments,plans}`

Both middleware log unauthorized access attempts via `SystemActivityTrait::saveGeneralSystemActivity()` with event types `module_access_error` / `level_module_access_error`.

### Key Middleware (`app/Http/Kernel.php`)
- `locked.admin` / `locked.tenant` — tenant locking
- `redirect.module` / `redirect.level` — module/level access control
- `input.request` — custom input sanitization (`CoreFacturalo\InputRequest`)
- `tenant.internal.mode` — internal tenant mode switching

### Scheduled Tasks (`app/Console/Kernel.php`)
```
* * * * *   php artisan tenancy:run tenant:run   # process jobs per tenant
0 * * * *   php artisan status:server            # CPU/memory monitoring
```
Requires `* * * * * php artisan schedule:run` in system crontab. Queue jobs use `database` driver — need `php artisan queue:work` running.

### Testing
PHPUnit config in `phpunit.xml`. Tests use SQLite in-memory + array cache/queue/mail (no real DB needed for unit/feature tests). Test suites: `Unit` (`tests/Unit/`) and `Feature` (`tests/Feature/`).

### Module Directory (30 modules)
| Module | Purpose |
|---|---|
| Account | GL accounts, ledger movements, export to accounting software |
| ApiPeruDev | apiperu.dev integration (RUC/DNI/CPE validation) |
| BusinessTurn | Business classification (giro empresarial) |
| Dashboard | KPI charts: revenue, top products, sales trends |
| Digemid | Peru pharmaceutical register for drug tracking |
| Document | Document mgmt: series config, CDR consultation, prepayment regularization |
| DocumentaryProcedure | Document workflow: offices, processes, status, requirements (trámite documentario) |
| Ecommerce | Online store: catalog, Culqi/PayPal, promotions |
| Expense | Expense tracking, bank loans, payment tracking |
| Finance | Cash movements, transfers, unpaid docs, payment methods |
| FullSuscription | Institutional SaaS subscriptions |
| Hotel | Rooms, rates, floors, reception, checkout |
| Inventory | Warehouses, kardex FIFO/LIFO, stock transfers, extra attributes (color/size/mold) |
| Item | Product catalog: categories, brands, zones, lots, web platforms |
| LevelAccess | Permission levels, activity logs, discount authorization, password policy |
| MercadoPago | MercadoPago payment gateway |
| MobileApp | Mobile client config, device sync settings |
| Offline | Offline mode: generates docs without internet, sync on reconnect |
| Order | Sales orders, drivers, dispatchers, tracking |
| Padron | SUNAT public registry queries |
| Payment | Payment link generation, public payment page |
| Pos | POS: fast sales, restaurant mode, garage mode |
| Production | Manufacturing: mills, machines, workers, production orders |
| Purchase | Supplier invoicing: quotations, orders, liquidaciones |
| Report | 30+ reports: sales, purchases, customers, kardex, commissions, detractions |
| Restaurant | Restaurant POS: items, promotions, orders, cash |
| Sale | Pre-sales: opportunities, contracts, agents, commissions, technical services |
| Services | Generic service support |
| Store | Generic store settings |
| Suscription | School subscriptions: plans, grades, sections, payment receipts |

### Database Schema Overview
**System DB (global)**:
- `websites` + `hostnames` — tenant registry
- `clients` — SaaS customers (`locked_emission`, `locked_tenant`, `locked_user` flags)
- `plans` + `plan_documents` — subscription tiers + allowed doc types
- `modules` + `module_levels` + `module_level_client` — permission hierarchy
- `jobs` + `failed_jobs` — queue tables

**Tenant DB (one per client, auto-created)**:
- `documents` + `invoices`/`notes`/`summaries`/`voided`/`dispatches` — SUNAT doc types
- `document_items` — line items (quantity, unit_price, affectation_igv_type_id)
- `persons` — customers & suppliers (`type_id` distinguishes)
- `items` + `warehouses` + `kardex` — inventory (FIFO/LIFO)
- `series` — SUNAT series/correlatives per establishment + doc type
- `cash` + `cash_documents` — POS registers
- `companies` — tenant business data (RUC, certificate path, soap_type_id)
- `exchange_rates` — daily USD/PEN rates
- `catalog_*` — read-only SUNAT catalogs (doc types, IGV types, units, currencies)

Key catalog values: `01`=Factura, `03`=Boleta, `07`=Nota Crédito, `08`=Nota Débito. IGV affectation: `10`=Gravado, `11`=Exonerado, `12`=Inafecto.

### Peru-Specific Integrations
- SUNAT XML signing: `robrichards/xmlseclibs`
- APIPERU config: `config/tenant.php` under `apiperu`
- IGV (tax) rates in tenant config
- Modules `Document`, `Sale`, `Purchase`, `Expense` handle SUNAT document types (boleta, factura, nota de crédito, etc.)

### Key Config Files
- `config/tenant.php` — per-tenant feature flags, PDF config, SUNAT endpoints, IGV periods
- `.env` — DB credentials, multi-tenant base URL (`APP_URL_BASE`), SUNAT credentials
- `webpack.mix.js` — all asset pipeline config including module aliases

### Notable `.env` Flags
| Variable | Purpose |
|---|---|
| `APP_URL_BASE` | Base domain for multi-tenant routing |
| `PREFIX_DATABASE` | Tenant DB prefix (default `tenancy`) |
| `SUNAT_ALTERNATE_SERVER` | Use alternate SUNAT endpoint |
| `PDF_TEMPLATE` | Default PDF template name |
| `IS_CLIENT` / `TOKEN_SERVER` | Offline/satellite mode config |
| `APIPERUDEV_VALIDATOR_CPE` | Toggle CPE validator via apiperu.dev |
| `RECREATE_DOCUMENT` | Allow document recreation |
| `QUEUE_CONNECTION=database` | Jobs persist in DB — run `php artisan queue:work` |
