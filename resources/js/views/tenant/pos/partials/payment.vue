<template>
    <div v-loading="loading_submit" class="pos-pay-wrap">

        <!-- ═══════════════ LEFT PANEL — order summary ═══════════════ -->
        <div class="pos-sidebar">

            <!-- Customer header -->
            <div class="pos-sidebar-header">
                <div class="pos-customer-avatar">
                    {{ customer.description ? customer.description.charAt(0).toUpperCase() : 'C' }}
                </div>
                <div class="pos-customer-info">
                    <div class="pos-customer-name">{{ customer.description }}</div>
                    <div class="pos-customer-label">Cliente</div>
                </div>
                <!-- puntos -->
                <div v-if="enabledPointSystem" class="pos-points-badge">
                    <i class="fas fa-star"></i> {{ customer_accumulated_points }} pts
                </div>
            </div>

            <!-- Items -->
            <div class="pos-item-list">
                <div v-for="(item, index) in form.items" :key="index" class="pos-item-row">
                    <div class="pos-item-qty-badge">{{ item.quantity }}</div>
                    <div class="pos-item-body">
                        <div class="pos-item-name">{{ item.item.description }}</div>
                        <div v-if="isAvailablePointSystem(item)" class="pos-item-points-toggle">
                            <el-checkbox v-model="item.item.exchanged_for_points"
                                         @change="changeRowExchangePoints(item, index)">
                                <span class="pos-points-label">{{ getExchangePointDescription(item) }}</span>
                            </el-checkbox>
                        </div>
                    </div>
                    <div class="pos-item-price">
                        {{ currencyTypeActive.symbol }}&nbsp;{{ item.total }}
                    </div>
                </div>
            </div>

            <!-- Tax breakdown -->
            <div class="pos-breakdown">
                <div class="pos-breakdown-row">
                    <span>Subtotal</span>
                    <span>{{ currencyTypeActive.symbol }} {{ form.total_taxed }}</span>
                </div>
                <div class="pos-breakdown-row">
                    <span>IGV (18%)</span>
                    <span>{{ currencyTypeActive.symbol }} {{ form.total_igv }}</span>
                </div>
                <div v-if="form.total_isc > 0" class="pos-breakdown-row">
                    <span>ISC</span>
                    <span>{{ currencyTypeActive.symbol }} {{ form.total_isc }}</span>
                </div>
                <div v-if="form.total_plastic_bag_taxes > 0" class="pos-breakdown-row">
                    <span>ICBPER</span>
                    <span>{{ currencyTypeActive.symbol }} {{ form.total_plastic_bag_taxes }}</span>
                </div>
            </div>

            <!-- Grand total -->
            <div class="pos-grand-total">
                <div class="pos-grand-label">TOTAL A COBRAR</div>
                <div class="pos-grand-amount">
                    <span class="pos-grand-currency">{{ currencyTypeActive.symbol }}</span>
                    <span class="pos-grand-number">{{ form.total }}</span>
                </div>
            </div>

            <!-- Actions -->
            <div class="pos-sidebar-actions">
                <button class="pos-btn-cobrar"
                        :disabled="button_payment && payment_method_type_id != '09'"
                        @click="clickPayment">
                    <i class="fas fa-check-circle"></i>
                    <span>COBRAR</span>
                </button>
                <button class="pos-btn-cancelar" @click="clickCancel">
                    <i class="fas fa-times"></i>
                    <span>Cancelar</span>
                </button>
            </div>
        </div>

        <!-- ═══════════════ RIGHT PANEL — payment form ═══════════════ -->
        <div class="pos-main">

            <!-- Top bar: doctype + series + back -->
            <div class="pos-topbar">
                <button class="pos-back-btn" @click="back">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div class="pos-doctype-group">
                    <button v-for="dtype in [{id:'01',label:'Factura'},{id:'03',label:'Boleta'},{id:'80',label:'N. Venta'}]"
                            :key="dtype.id"
                            class="pos-dtype-btn"
                            :class="{ active: form.document_type_id === dtype.id }"
                            @click="form.document_type_id = dtype.id; filterSeries()">
                        {{ dtype.label }}
                    </button>
                </div>
                <el-select v-model="form.series_id" class="pos-series-sel" size="small">
                    <el-option v-for="s in series" :key="s.id" :label="s.number" :value="s.id"/>
                </el-select>
            </div>

            <!-- Payment amount hero card -->
            <div class="pos-hero-card">
                <div class="pos-hero-top">
                    <div class="pos-hero-left">
                        <div class="pos-hero-label">Monto recibido</div>
                        <el-input ref="enter_amount"
                                  v-model="enter_amount"
                                  class="pos-hero-input"
                                  @input="enterAmount()"
                                  @keyup.enter.native="keyupEnterAmount()">
                            <template slot="prepend">{{ currencyTypeActive.symbol }}</template>
                        </el-input>
                    </div>
                    <div class="pos-hero-divider"></div>
                    <div class="pos-hero-right" :class="difference < 0 ? 'is-faltante' : 'is-vuelto'">
                        <div class="pos-change-label">
                            <i :class="difference < 0 ? 'fas fa-arrow-down' : 'fas fa-arrow-up'"></i>
                            {{ difference < 0 ? 'Faltante' : 'Vuelto' }}
                        </div>
                        <div class="pos-change-amount">
                            {{ currencyTypeActive.symbol }}&nbsp;{{ difference !== '-' ? Math.abs(difference) : '—' }}
                        </div>
                    </div>
                </div>

                <!-- Quick cash -->
                <div v-if="form_payment.payment_method_type_id === '01'" class="pos-quick-row">
                    <div class="pos-quick-label"><i class="fas fa-coins"></i> Billetes rápidos</div>
                    <div class="pos-quick-btns">
                        <button v-for="amt in [10, 20, 50, 100, 200]" :key="amt"
                                class="pos-quick-btn"
                                @click="setAmountCash(amt)">
                            {{ currencyTypeActive.symbol }}{{ amt }}
                        </button>
                        <button class="pos-quick-btn pos-quick-exact"
                                @click="enter_amount = form.total; enterAmount()">
                            Exacto
                        </button>
                    </div>
                </div>
            </div>

            <!-- Payments added -->
            <div class="pos-card">
                <div class="pos-card-header">
                    <div class="pos-card-title">
                        <i class="fas fa-layer-group"></i> Métodos de pago
                    </div>
                    <button class="pos-add-pay-btn" @click="clickAddPayment()">
                        <i class="fas fa-plus"></i> Agregar
                    </button>
                </div>
                <div v-if="form.payments.length === 0" class="pos-empty-pay">
                    <i class="fas fa-credit-card pos-empty-icon"></i>
                    <span>Sin pagos adicionales</span>
                </div>
                <div v-for="(pay, index) in form.payments" :key="index" class="pos-pay-row">
                    <div class="pos-pay-badge">{{ index + 1 }}</div>
                    <div class="pos-pay-method">{{ getDescriptionPaymentMethodType(pay.payment_method_type_id) }}</div>
                    <div class="pos-pay-amount">{{ currencyTypeActive.symbol }} {{ pay.payment }}</div>
                </div>
            </div>

            <!-- Discount + plate (row) -->
            <div class="pos-card pos-discount-card">
                <div class="pos-card-header">
                    <div class="pos-card-title"><i class="fas fa-tag"></i> Descuento</div>
                    <el-switch v-model="enabled_discount" @change="changeEnabledDiscount"/>
                </div>
                <transition name="pos-slide">
                    <div v-if="enabled_discount" class="pos-discount-body">
                        <div class="pos-discount-type">
                            <el-checkbox v-model="is_discount_amount" @change="changeTypeDiscount">
                                {{ is_discount_amount ? 'Monto fijo' : 'Porcentaje' }}
                            </el-checkbox>
                            <el-tooltip v-if="global_discount_type && global_discount_type.description"
                                        :content="global_discount_type.description" effect="dark" placement="top">
                                <i class="fa fa-info-circle ml-1 text-muted"/>
                            </el-tooltip>
                        </div>
                        <el-input v-model="discount_amount" @change="inputDiscountAmount()">
                            <template slot="prepend" v-if="is_discount_amount">{{ currencyTypeActive.symbol }}</template>
                            <template slot="append" v-else>%</template>
                        </el-input>
                    </div>
                </transition>
                <div v-if="businessTurns.active" class="pos-plate-row">
                    <label class="pos-field-label"><i class="fas fa-car"></i> N° Placa</label>
                    <el-input v-model="form.plate_number" size="small"/>
                </div>
            </div>

            <!-- Tips -->
            <div v-if="enabledTipsPos" class="pos-card">
                <div class="pos-card-header">
                    <div class="pos-card-title">
                        <i class="fas fa-hand-holding-usd"></i> Propina
                        <el-tooltip content="Ingrese empleado y monto mayor a 0 para registrar la propina"
                                    effect="dark" placement="top">
                            <i class="fa fa-info-circle ml-1 text-muted"/>
                        </el-tooltip>
                    </div>
                </div>
                <div class="pos-tips-body">
                    <div class="flex-grow-1">
                        <label class="pos-field-label">Empleado</label>
                        <el-input v-model="form.worker_full_name_tips" size="small"/>
                    </div>
                    <div class="pos-tip-amt">
                        <label class="pos-field-label">Monto</label>
                        <el-input-number v-model="form.total_tips" :min="0" controls-position="right" size="small"/>
                    </div>
                </div>
            </div>

            <!-- Agent + reference -->
            <div class="pos-card">
                <div v-if="configuration.enabled_sales_agents" class="mb-2">
                    <search-agent @changeAgent="changeAgent"/>
                </div>
                <label class="pos-field-label"><i class="fas fa-sticky-note"></i> Referencia</label>
                <el-input v-model="form.reference_data" type="textarea" :rows="2" size="small"/>
            </div>

        </div>

        <!-- ─── Dialogs ─── -->
        <options-form :recordId="documentNewId" :resource="resource_options"
                      v-model:showDialog="showDialogOptions" :statusDocument="statusDocument"/>
        <multiple-payment-form :payments="payments" v-model:showDialog="showDialogMultiplePayment"
                               :total="form.total" @add="addRow" @setPaymentMethod="setPaymentMethod"/>
        <card-brands-form :external="true" :recordId="null" v-model:showDialog="showDialogNewCardBrand"/>
        <discount-permission-form v-model:showDialog="showDialogDiscountPermission"
                                  :totalDiscountPercentage="totalDiscountPercentage"
                                  :sellers-discount-limit="configuration.sellers_discount_limit"
                                  @tokenValidated="tokenValidated"/>
    </div>
</template>

<style scoped>
/* ── light/dark CSS variables ────────────────────────────── */
:global(:root) {
    --pos-sb-bg:          #f8fafc;
    --pos-sb-border:      rgba(0,0,0,.08);
    --pos-sb-hdr-bg:      rgba(0,0,0,.03);
    --pos-sb-hdr-border:  #e2e8f0;
    --pos-sb-scroll:      rgba(0,0,0,.15);
    --pos-sb-row-hover:   rgba(0,0,0,.03);
    --pos-sb-row-sep:     #e8f0f8;
    --pos-sb-qty-bg:      rgba(99,102,241,.1);
    --pos-sb-qty-border:  rgba(99,102,241,.25);
    --pos-sb-qty-color:   #6366f1;
    --pos-sb-item-color:  #1e293b;
    --pos-sb-price-color: #374151;
    --pos-sb-bkdn-border: rgba(0,0,0,.07);
    --pos-sb-grand-border:#e2e8f0;
    --pos-sb-grand-bg:    rgba(16,185,129,.06);
    --pos-sb-grand-label: #059669;
    --pos-sb-grand-cur:   #059669;
    --pos-sb-grand-num:   #064e3b;
    --pos-sb-act-bg:      rgba(0,0,0,.04);
    --pos-sb-act-border:  #e2e8f0;
    --pos-sb-cust-name:   #1e293b;
}
:global(html.dark) {
    --pos-sb-bg:          #0f172a;
    --pos-sb-border:      rgba(255,255,255,.07);
    --pos-sb-hdr-bg:      rgba(255,255,255,.04);
    --pos-sb-hdr-border:  rgba(255,255,255,.07);
    --pos-sb-scroll:      rgba(255,255,255,.12);
    --pos-sb-row-hover:   rgba(255,255,255,.04);
    --pos-sb-row-sep:     rgba(255,255,255,.05);
    --pos-sb-qty-bg:      rgba(99,102,241,.25);
    --pos-sb-qty-border:  rgba(99,102,241,.4);
    --pos-sb-qty-color:   #a5b4fc;
    --pos-sb-item-color:  #e2e8f0;
    --pos-sb-price-color: #94a3b8;
    --pos-sb-bkdn-border: rgba(255,255,255,.07);
    --pos-sb-grand-border:rgba(255,255,255,.1);
    --pos-sb-grand-bg:    rgba(16,185,129,.08);
    --pos-sb-grand-label: #34d399;
    --pos-sb-grand-cur:   #6ee7b7;
    --pos-sb-grand-num:   #ecfdf5;
    --pos-sb-act-bg:      rgba(0,0,0,.2);
    --pos-sb-act-border:  rgba(255,255,255,.06);
    --pos-sb-cust-name:   #f1f5f9;
}

/* ── reset & wrap ────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }

.pos-pay-wrap {
    display: flex;
    height: calc(100vh - 110px);
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: var(--pos-sb-bg);
}

/* ═══════════════════════════════════════════════════════════
   SIDEBAR (left panel)
═══════════════════════════════════════════════════════════ */
.pos-sidebar {
    width: 420px;
    min-width: 320px;
    display: flex;
    flex-direction: column;
    background: var(--pos-sb-bg);
    border-right: 1px solid var(--pos-sb-border);
    position: relative;
}

/* customer */
.pos-sidebar-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px 12px;
    background: var(--pos-sb-hdr-bg);
    border-bottom: 1px solid var(--pos-sb-hdr-border);
    flex-shrink: 0;
}
.pos-customer-avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--theme-color, #6366f1), var(--theme-color, #8b5cf6));
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.pos-customer-info { flex: 1; min-width: 0; }
.pos-customer-name {
    color: var(--pos-sb-cust-name);
    font-weight: 600;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}
.pos-customer-label { color: #64748b; font-size: 11px; margin-top: 1px; }
.pos-points-badge {
    background: rgba(234,179,8,.15);
    color: #fbbf24;
    border: 1px solid rgba(251,191,36,.25);
    border-radius: 20px;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
    flex-shrink: 0;
}

/* item list */
.pos-item-list {
    flex: 1;
    overflow-y: auto;
    padding: 6px 0;
    scrollbar-width: thin;
    scrollbar-color: var(--pos-sb-scroll) transparent;
}
.pos-item-list::-webkit-scrollbar { width: 4px; }
.pos-item-list::-webkit-scrollbar-track { background: transparent; }
.pos-item-list::-webkit-scrollbar-thumb { background: var(--pos-sb-scroll); border-radius: 2px; }

.pos-item-row {
    display: flex;
    align-items: center;
    padding: 10px 16px;
    gap: 12px;
    transition: background .15s;
}
.pos-item-row:hover { background: var(--pos-sb-row-hover); }
.pos-item-row + .pos-item-row { border-top: 1px solid var(--pos-sb-row-sep); }

.pos-item-qty-badge {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: var(--pos-sb-qty-bg);
    border: 1px solid var(--pos-sb-qty-border);
    color: var(--pos-sb-qty-color);
    font-size: 15px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.pos-item-body { flex: 1; min-width: 0; }
.pos-item-name {
    color: var(--pos-sb-item-color);
    font-size: 14px;
    font-weight: 500;
    line-height: 1.3;
    word-break: break-word;
}
.pos-item-points-toggle { margin-top: 3px; }
.pos-points-label { color: #fbbf24; font-size: 11px; }
.pos-item-price {
    color: var(--pos-sb-price-color);
    font-size: 15px;
    font-weight: 700;
    white-space: nowrap;
    flex-shrink: 0;
}

/* tax breakdown */
.pos-breakdown {
    padding: 10px 16px 6px;
    border-top: 1px solid var(--pos-sb-bkdn-border);
    flex-shrink: 0;
}
.pos-breakdown-row {
    display: flex;
    justify-content: space-between;
    color: #64748b;
    font-size: 12px;
    padding: 2px 0;
}

/* grand total */
.pos-grand-total {
    padding: 12px 16px 10px;
    border-top: 1px solid var(--pos-sb-grand-border);
    flex-shrink: 0;
    background: var(--pos-sb-grand-bg);
}
.pos-grand-label {
    font-size: 10px;
    letter-spacing: 1.5px;
    color: var(--pos-sb-grand-label);
    font-weight: 600;
    text-transform: uppercase;
    margin-bottom: 4px;
}
.pos-grand-amount {
    display: flex;
    align-items: baseline;
    gap: 4px;
}
.pos-grand-currency {
    font-size: 20px;
    font-weight: 700;
    color: var(--pos-sb-grand-cur);
}
.pos-grand-number {
    font-size: 38px;
    font-weight: 800;
    color: var(--pos-sb-grand-num);
    line-height: 1;
    letter-spacing: -1px;
}

/* sidebar action buttons */
.pos-sidebar-actions {
    padding: 12px 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex-shrink: 0;
    background: var(--pos-sb-act-bg);
    border-top: 1px solid var(--pos-sb-act-border);
}
.pos-btn-cobrar {
    width: 100%;
    padding: 13px;
    border: none;
    border-radius: 12px;
    background: linear-gradient(135deg, #10b981, #059669);
    color: #fff;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: .5px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: opacity .2s, transform .1s;
    box-shadow: 0 4px 14px rgba(16,185,129,.35);
}
.pos-btn-cobrar:hover:not(:disabled) { opacity: .93; transform: translateY(-1px); }
.pos-btn-cobrar:active:not(:disabled) { transform: translateY(0); }
.pos-btn-cobrar:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }

.pos-btn-cancelar {
    width: 100%;
    padding: 9px;
    border: 1px solid rgba(248,113,113,.3);
    border-radius: 10px;
    background: transparent;
    color: #f87171;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: background .15s, border-color .15s;
}
.pos-btn-cancelar:hover { background: rgba(248,113,113,.1); border-color: rgba(248,113,113,.5); }

/* ═══════════════════════════════════════════════════════════
   MAIN PANEL (right)
═══════════════════════════════════════════════════════════ */
.pos-main {
    flex: 1;
    overflow-y: auto;
    background: #f1f5f9;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px 18px 18px;
    scrollbar-width: thin;
    scrollbar-color: #cbd5e1 transparent;
}

/* topbar */
.pos-topbar {
    display: flex;
    align-items: center;
    gap: 10px;
    background: #fff;
    border-radius: 12px;
    padding: 10px 14px;
    box-shadow: 0 1px 4px rgba(0,0,0,.07);
    flex-wrap: wrap;
}
.pos-back-btn {
    width: 34px;
    height: 34px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: #fff;
    color: #64748b;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    transition: background .15s, color .15s;
    flex-shrink: 0;
}
.pos-back-btn:hover { background: #f8fafc; color: #334155; }

.pos-doctype-group { display: flex; gap: 6px; flex-wrap: wrap; }
.pos-dtype-btn {
    padding: 6px 14px;
    border: 1.5px solid #e2e8f0;
    border-radius: 20px;
    background: #fff;
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all .15s;
    white-space: nowrap;
}
.pos-dtype-btn:hover { border-color: var(--theme-color, #6366f1); color: var(--theme-color, #6366f1); }
.pos-dtype-btn.active {
    background: var(--theme-color, #6366f1);
    border-color: var(--theme-color, #6366f1);
    color: #fff;
    box-shadow: 0 2px 8px rgba(99,102,241,.3);
}

.pos-series-sel { width: 110px; }

/* hero card */
.pos-hero-card {
    background: #fff;
    border-radius: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,.07);
    overflow: hidden;
}
.pos-hero-top {
    display: flex;
    align-items: stretch;
}
.pos-hero-left {
    flex: 1;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.pos-hero-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #94a3b8;
    font-weight: 600;
}
.pos-hero-input { font-size: 18px; }
.pos-hero-divider {
    width: 1px;
    background: #f1f5f9;
    margin: 14px 0;
    flex-shrink: 0;
}
.pos-hero-right {
    flex: 1;
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 4px;
    transition: background .2s;
}
.pos-hero-right.is-vuelto { background: rgba(16,185,129,.05); }
.pos-hero-right.is-faltante { background: rgba(239,68,68,.05); }
.pos-change-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
}
.is-vuelto .pos-change-label { color: #10b981; }
.is-faltante .pos-change-label { color: #ef4444; }
.pos-change-amount {
    font-size: 28px;
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.5px;
}
.is-vuelto .pos-change-amount { color: #059669; }
.is-faltante .pos-change-amount { color: #dc2626; }

/* quick cash */
.pos-quick-row {
    border-top: 1px solid #f1f5f9;
    padding: 12px 18px;
}
.pos-quick-label {
    font-size: 11px;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .8px;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    gap: 5px;
}
.pos-quick-btns {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}
.pos-quick-btn {
    flex: 1;
    min-width: 52px;
    padding: 8px 6px;
    border: 1.5px solid #e2e8f0;
    border-radius: 10px;
    background: #f8fafc;
    color: #475569;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all .15s;
    text-align: center;
}
.pos-quick-btn:hover {
    border-color: #6366f1;
    background: #eef2ff;
    color: #4f46e5;
}
.pos-quick-exact {
    background: #eff6ff;
    border-color: #bfdbfe;
    color: #2563eb;
}
.pos-quick-exact:hover {
    background: #dbeafe;
    border-color: #3b82f6;
    color: #1d4ed8;
}

/* generic card */
.pos-card {
    background: #fff;
    border-radius: 12px;
    padding: 14px 16px;
    box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.pos-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}
.pos-card-title {
    font-size: 12px;
    font-weight: 700;
    color: #334155;
    text-transform: uppercase;
    letter-spacing: .8px;
    display: flex;
    align-items: center;
    gap: 6px;
}
.pos-card-title i { color: #6366f1; }

/* payments */
.pos-add-pay-btn {
    padding: 5px 12px;
    border: 1.5px solid #6366f1;
    border-radius: 20px;
    background: transparent;
    color: #6366f1;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all .15s;
    display: flex;
    align-items: center;
    gap: 4px;
}
.pos-add-pay-btn:hover { background: #6366f1; color: #fff; }

.pos-empty-pay {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 0 4px;
    color: #cbd5e1;
    font-size: 13px;
}
.pos-empty-icon { font-size: 16px; }
.pos-pay-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 0;
    border-bottom: 1px solid #f1f5f9;
    font-size: 13px;
}
.pos-pay-row:last-child { border-bottom: none; }
.pos-pay-badge {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #eef2ff;
    color: #6366f1;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
.pos-pay-method { flex: 1; color: #475569; font-weight: 500; }
.pos-pay-amount { color: #1e293b; font-weight: 700; }

/* discount */
.pos-discount-body {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 4px;
    flex-wrap: wrap;
}
.pos-discount-type { display: flex; align-items: center; white-space: nowrap; }
.pos-slide-enter-active, .pos-slide-leave-active { transition: all .2s ease; overflow: hidden; }
.pos-slide-enter-from, .pos-slide-leave-to { opacity: 0; max-height: 0; }
.pos-slide-enter-to, .pos-slide-leave-from { opacity: 1; max-height: 80px; }

.pos-plate-row { margin-top: 10px; }
.pos-field-label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: .6px;
    margin-bottom: 5px;
}

/* tips */
.pos-tips-body {
    display: flex;
    gap: 12px;
    align-items: flex-end;
    flex-wrap: wrap;
}
.pos-tip-amt { min-width: 130px; flex-shrink: 0; }
</style>

<script>
import CardBrandsForm from '../../card_brands/form.vue'
import SaleNotesOptions from '../../sale_notes/partials/options.vue'
import OptionsForm from './options.vue'
import MultiplePaymentForm from './multiple_payment.vue'
import {pointSystemFunctions} from '@mixins/functions'
import {calculateRowItem} from "@helpers/functions"
import DiscountPermissionForm from './discount_permission.vue'
import SearchAgent from '@components/SearchAgent.vue'


export default {
    components: {OptionsForm, CardBrandsForm, SaleNotesOptions, MultiplePaymentForm, DiscountPermissionForm, SearchAgent},
    mixins: [pointSystemFunctions],

    props: [
        'form',
        'customer',
        'currencyTypeActive',
        'exchangeRateSale',
        'is_payment',
        'soapCompany',
        'businessTurns',
        'isPrint',
        'globalDiscountTypeId',
        'enabledTipsPos',
        'hidePdfViewDocuments',
        'enabledPointSystem',
        'affectationIgvTypes',
        'percentageIgv',
        'configuration',
        'typeUser',
    ],

    data() {
        return {
            enabled_discount: false,
            discount_amount: 0,
            loading_submit: false,
            showDialogOptions: false,
            showDialogMultiplePayment: false,
            showDialogSaleNote: false,
            showDialogNewCardBrand: false,
            documentNewId: null,
            saleNotesNewId: null,
            resource_options: null,
            has_card: false,
            resource: 'pos',
            resource_documents: 'documents',
            resource_payments: 'document_payments',
            amount: 0,
            enter_amount: 0,
            difference: 0,
            button_payment: false,
            input_item: '',
            form_payment: {},
            series: [],
            all_series: [],
            cards_brand: [],
            cancel: false,
            form_cash_document: {},
            statusDocument: {},
            payment_method_types: [],
            payments: [],
            locked_submit: false,
            global_discount_types: [],
            global_discount_type: {},
            error_global_discount: false,
            is_discount_amount: false,
            payment_method_type_id: null,
            showDialogDiscountPermission: false,
            totalDiscountPercentage: 0,
        }
    },

    async created() {
        await this.initLStoPayment()
        await this.getTables()
        this.initFormPayment()
        this.inputAmount()
        this.form.payments = []
        this.$eventHub.$on('reloadDataCardBrands', (card_brand_id) => {
            this.reloadDataCardBrands(card_brand_id)
        })
        this.$eventHub.$on('localSPayments', (payments) => {
            this.payments = payments
        })
        await this.setInitialAmount()
        await this.getFormPosLocalStorage()

        if (!qz.websocket.isActive() && this.isPrint) {
            startConnection();
        }

        if (this.enabledPointSystem) {
            await this.setCustomerAccumulatedPoints(this.form.customer_id, true)
            this.setTotalExchangePoints()
            this.checkUsedPointsByItem()
        }

        this.setTotalPointsBySale(this.configuration)
    },

    computed: {
        isGlobalDiscountBase() {
            return (this.globalDiscountTypeId === '02')
        },
        isInvoiceDocument() {
            return ['01', '03'].includes(this.form.document_type_id)
        }
    },

    methods: {
        changeAgent(agent_id) {
            this.form.agent_id = agent_id
        },
        checkUsedPointsByItem() {
            this.form.items.forEach(row => {
                this.recalculateUsedPointsForExchange(row)
            })
        },
        isAvailablePointSystem(row) {
            return (this.enabledPointSystem && this.customer_accumulated_points > 0 && row.item.exchange_points)
        },
        changeRowExchangePoints(row, index) {
            row.item.used_points_for_exchange = row.item.exchanged_for_points ? this.getUsedPoints(row) : null
            this.setTotalExchangePoints()
            this.changeRowFreeAffectationIgv(row, index)
        },
        async changeRowFreeAffectationIgv(row, index) {
            this.form.items[index].affectation_igv_type_id = (row.item.exchanged_for_points) ? '15' : this.form.items[index].item.original_affectation_igv_type_id
            this.form.items[index].affectation_igv_type = await _.find(this.affectationIgvTypes, {id: this.form.items[index].affectation_igv_type_id})
            let new_row = await calculateRowItem(row, this.form.currency_type_id, this.form.exchange_rate_sale, this.percentageIgv)
            new_row['unit_type_id'] = row.unit_type_id
            this.form.items[index] = new_row
            await this.reCalculateTotal()
        },
        handleFn113() {
            const code = this.form.document_type_id
            if (code == '01') this.form.document_type_id = '03'
            else if (code == '03') this.form.document_type_id = '80'
            else if (code == '80') this.form.document_type_id = '01'
            this.filterSeries()
        },
        keyupEnterAmount() {
            if (this.button_payment) {
                return this.$message.warning("El monto a pagar es menor al total")
            }
            if (this.locked_submit) return;
            this.clickPayment()
        },
        async setInitialAmount() {
            this.enter_amount = this.form.total
            await this.$refs.enter_amount.$el.getElementsByTagName('input')[0].focus()
            await this.$refs.enter_amount.$el.getElementsByTagName('input')[0].select()
        },
        changeEnabledDiscount() {
            if (!this.enabled_discount) {
                this.discount_amount = 0
                this.deleteDiscountGlobal()
                this.reCalculateTotal()
            }
        },
        changeTypeDiscount() {
            this.inputDiscountAmount()
        },
        inputDiscountAmount() {
            if (this.enabled_discount) {
                if (this.discount_amount && !isNaN(this.discount_amount) && parseFloat(this.discount_amount) > 0) {
                    if (this.is_discount_amount) {
                        if (this.discount_amount >= this.form.total)
                            return this.$message.error("El monto de descuento debe ser menor al total de venta")
                    }
                    this.deleteDiscountGlobal()
                    this.reCalculateTotal()
                } else {
                    this.deleteDiscountGlobal()
                    this.reCalculateTotal()
                }
            }
        },
        isExonerated() {
            let not_exonerated = this.form.items.find((item) => item.affectation_igv_type_id != '20')
            return (not_exonerated) ? false : true
        },
        setConfigGlobalDiscountType() {
            this.global_discount_type = _.find(this.global_discount_types, {id: this.globalDiscountTypeId})
        },
        setGlobalDiscount(factor, amount, base) {
            let discount_text = (this.global_discount_type && this.global_discount_type.description) ? this.global_discount_type.description : ''
            this.form.discounts.push({
                discount_type_id: this.global_discount_type.id,
                description: discount_text,
                factor: factor,
                amount: _.round(amount, 2),
                base: base
            })
        },
        async discountGlobal() {
            const input_global_discount = parseFloat(this.discount_amount)
            let discount = _.find(this.form.discounts, {'discount_type_id': this.globalDiscountTypeId})

            if (input_global_discount > 0 && !discount) {
                const percentage_igv = this.percentageIgv * 100
                let base = (this.isGlobalDiscountBase) ? parseFloat(this.form.total_taxed) : parseFloat(this.form.total)
                let amount = 0
                let factor = 0

                if (this.is_discount_amount) {
                    amount = input_global_discount
                    factor = _.round(amount / base, 5)
                } else {
                    factor = _.round(input_global_discount / 100, 5)
                    amount = factor * base
                }

                this.form.total_discount = _.round(amount, 2)

                if (this.isGlobalDiscountBase) {
                    this.form.total_taxed = _.round(base - this.form.total_discount, 2)
                    this.form.total_value = this.form.total_taxed
                    this.form.total_igv = _.round(this.form.total_taxed * (percentage_igv / 100), 2)
                    this.form.total_taxes = _.round(this.form.total_igv + this.form.total_isc + this.form.total_plastic_bag_taxes, 2)
                    this.form.total = _.round(this.form.total_taxed + this.form.total_taxes, 2)
                    this.form.subtotal = this.form.total
                    if (this.form.total <= 0) this.$message.error("El total debe ser mayor a 0, verifique el tipo de descuento asignado (Configuración/Avanzado/Contable)")
                } else {
                    this.form.total = _.round(this.form.total - amount, 2)
                }

                this.setGlobalDiscount(factor, amount, base)
            }

            this.difference = _.round(this.enter_amount - this.form.total, 2)
        },
        reCalculateTotal() {
            let total_discount = 0, total_charge = 0, total_exportation = 0
            let total_taxed = 0, total_exonerated = 0, total_unaffected = 0
            let total_free = 0, total_igv = 0, total_value = 0, total = 0
            let total_plastic_bag_taxes = 0, total_base_isc = 0, total_isc = 0, total_igv_free = 0

            this.form.items.forEach((row) => {
                total_discount += parseFloat(row.total_discount)
                total_charge += parseFloat(row.total_charge)
                if (row.affectation_igv_type_id === '10') total_taxed += (row.total_value_without_rounding) ? parseFloat(row.total_value_without_rounding) : parseFloat(row.total_value)
                if (row.affectation_igv_type_id === '20') total_exonerated += (row.total_value_without_rounding) ? parseFloat(row.total_value_without_rounding) : parseFloat(row.total_value)
                if (row.affectation_igv_type_id === '30') total_unaffected += parseFloat(row.total_value)
                if (row.affectation_igv_type_id === '40') total_exportation += parseFloat(row.total_value)
                if (['10', '20', '30', '40'].indexOf(row.affectation_igv_type_id) < 0) total_free += parseFloat(row.total_value)
                if (['10', '20', '30', '40'].indexOf(row.affectation_igv_type_id) > -1) {
                    total_igv += (row.total_igv_without_rounding) ? parseFloat(row.total_igv_without_rounding) : parseFloat(row.total_igv)
                    total += (row.total_without_rounding) ? parseFloat(row.total_without_rounding) : parseFloat(row.total)
                }
                total_value += (row.total_value_without_rounding) ? parseFloat(row.total_value_without_rounding) : parseFloat(row.total_value)
                total_plastic_bag_taxes += parseFloat(row.total_plastic_bag_taxes)

                if (['11', '12', '13', '14', '15', '16'].includes(row.affectation_igv_type_id)) {
                    let unit_value = row.total_value / row.quantity
                    let total_value_partial = unit_value * row.quantity
                    row.total_taxes = row.total_value - total_value_partial + parseFloat(row.total_plastic_bag_taxes)
                    row.total_igv = total_value_partial * (row.percentage_igv / 100)
                    row.total_base_igv = total_value_partial
                    total_value -= row.total_value
                    total_igv_free += row.total_igv
                    total += parseFloat(row.total)
                }
                total_isc += parseFloat(row.total_isc)
                total_base_isc += parseFloat(row.total_base_isc)
            })

            this.form.total_base_isc = _.round(total_base_isc, 2)
            this.form.total_isc = _.round(total_isc, 2)
            this.form.total_igv_free = _.round(total_igv_free, 2)
            this.form.total_exportation = _.round(total_exportation, 2)
            this.form.total_taxed = _.round(total_taxed, 2)
            this.form.total_exonerated = _.round(total_exonerated, 2)
            this.form.total_unaffected = _.round(total_unaffected, 2)
            this.form.total_free = _.round(total_free, 2)
            this.form.total_igv = _.round(total_igv, 2)
            this.form.total_value = _.round(total_value, 2)
            this.form.total_taxes = _.round(total_igv + total_isc + total_plastic_bag_taxes, 2)
            this.form.total_plastic_bag_taxes = _.round(total_plastic_bag_taxes, 2)
            this.form.total = _.round(total, 2)
            this.form.subtotal = this.form.total
            this.discountGlobal()
            this.setTotalPointsBySale(this.configuration)
        },
        deleteDiscountGlobal() {
            this.form.discounts = []
            this.form.total_discount = 0
        },
        back() {
            this.$emit('update:is_payment', false)
        },
        async initLStoPayment() {
            this.amount = await this.getLocalStoragePayment('amount', 0)
            this.enter_amount = await this.getLocalStoragePayment('enter_amount', 0)
            this.difference = await this.getLocalStoragePayment('difference', 0)
        },
        getFormPosLocalStorage() {
            let form_pos = localStorage.getItem('form_pos')
            form_pos = JSON.parse(form_pos)
            if (form_pos) {
                this.form.payments = form_pos.payments
            }
        },
        clickAddPayment() {
            this.showDialogMultiplePayment = true
        },
        reloadDataCardBrands(card_brand_id) {
            this.$http.get(`/${this.resource}/table/card_brands`).then((response) => {
                this.cards_brand = response.data
                this.form_payment.card_brand_id = card_brand_id
                this.changePaymentMethodType()
            })
        },
        getDescriptionPaymentMethodType(id) {
            let pmt = _.find(this.payment_method_types, {'id': id})
            return pmt ? pmt.description : ''
        },
        changePaymentMethodType() {
            let pmt = _.find(this.payment_method_types, {'id': this.form_payment.payment_method_type_id})
            if (!pmt) return
            this.has_card = pmt.has_card
            this.form_payment.card_brand_id = pmt.has_card ? this.form_payment.card_brand_id : null
        },
        addRow(payments) {
            this.form.payments = payments
            let acum_payment = 0
            this.form.payments.forEach((item) => {
                acum_payment += parseFloat(item.payment)
            })
            this.setAmount(acum_payment)
        },
        setPaymentMethod(id) {
            this.payment_method_type_id = id
        },
        setAmount(amount) {
            this.amount = parseFloat(amount)
            this.enter_amount = parseFloat(amount)
            this.inputAmount()
        },
        setAmountCash(amount) {
            if (this.payments.length === 0) return
            let row = _.last(this.payments)
            if (!row) return
            row.payment = parseFloat(row.payment || 0) + parseFloat(amount)

            this.form.payments = this.payments
            let acum_payment = 0
            this.form.payments.forEach((item) => {
                acum_payment += parseFloat(item.payment)
            })
            this.setAmount(acum_payment)
        },
        async enterAmount() {
            const typed = parseFloat(this.enter_amount) || 0

            // Update last payment row if exists
            if (this.payments.length > 0) {
                const r_item = _.last(this.payments)
                if (r_item) r_item.payment = typed
            }
            if (this.form.payments.length > 0) {
                this.form.payments[this.form.payments.length - 1].payment = typed
            }

            let acum_payment = 0
            if (this.form.payments.length > 0) {
                this.form.payments.forEach((item) => {
                    acum_payment += parseFloat(item.payment) || 0
                })
            } else {
                acum_payment = typed
            }

            this.amount = acum_payment
            this.difference = _.round(this.amount - this.form.total, 2)

            if (isNaN(this.difference)) {
                this.button_payment = true
                this.difference = '-'
            } else if (this.difference >= 0) {
                this.button_payment = false
            } else {
                this.button_payment = true
            }

            this.$eventHub.$emit('eventSetFormPosLocalStorage', this.form)
            await this.lStoPayment()
        },
        getLocalStoragePayment(key, re_default = null) {
            let ls_obj = localStorage.getItem(key)
            ls_obj = JSON.parse(ls_obj)
            return ls_obj !== null ? ls_obj : re_default
        },
        setLocalStoragePayment(key, obj) {
            localStorage.setItem(key, JSON.stringify(obj))
        },
        inputAmount() {
            this.difference = this.amount - this.form.total
            if (this.payment_method_type_id == '09') {
                this.button_payment = false
            } else if (isNaN(this.difference)) {
                this.button_payment = true
                this.difference = '-'
            } else if (this.difference >= 0) {
                this.button_payment = false
                this.difference = _.round(this.amount - this.form.total, 2)
            } else {
                this.button_payment = true
            }
            if (this.difference !== '-') this.difference = _.round(this.difference, 2)
            this.$eventHub.$emit('eventSetFormPosLocalStorage', this.form)
            this.lStoPayment()
        },
        lStoPayment() {
            this.setLocalStoragePayment('enter_amount', this.enter_amount)
            this.setLocalStoragePayment('amount', this.amount)
            this.setLocalStoragePayment('difference', this.difference)
        },
        initFormPayment() {
            this.difference = -this.form.total
            this.form_payment = {
                id: null,
                date_of_payment: moment().format('YYYY-MM-DD'),
                payment_method_type_id: '01',
                reference: null,
                card_brand_id: null,
                document_id: null,
                sale_note_id: null,
                payment: this.form.total,
            }
            this.form_cash_document = {
                document_id: null,
                sale_note_id: null
            }
            this.is_discount_amount = true
        },
        filterSeries() {
            this.form.series_id = null
            this.series = _.filter(this.all_series, {'document_type_id': this.form.document_type_id})
            this.form.series_id = (this.series.length > 0) ? this.series[0].id : null
            if (!this.form.series_id) {
                return this.$message.warning('El establecimiento no tiene series disponibles para el comprobante')
            }
        },
        async clickCancel() {
            this.loading_submit = true
            await this.sleep(800)
            this.loading_submit = false
            this.cleanLocalStoragePayment()
            this.$eventHub.$emit('cancelSale')
        },
        cleanLocalStoragePayment() {
            this.setLocalStoragePayment('amount', null)
            this.setLocalStoragePayment('enter_amount', null)
            this.setLocalStoragePayment('difference', null)
        },
        sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms))
        },
        async asignPlateNumberToItems() {
            if (this.form.plate_number) {
                await this.form.items.forEach(item => {
                    let at = _.find(item.attributes, {'attribute_type_id': '5010'})
                    if (!at) {
                        item.attributes.push({
                            attribute_type_id: '7000',
                            description: "Gastos Art. 37 Renta:  Número de Placa",
                            value: this.form.plate_number,
                            start_date: null,
                            end_date: null,
                            duration: null,
                        })
                    }
                })
            }
        },
        getDiscountPercentages() {
            if (this.form.discounts) {
                return _.sumBy(this.form.discounts, (discount) => discount.factor * 100)
            }
            return 0
        },
        tokenValidated() {
            this.form.token_validated_for_discount = true
        },
        validateRestrictSellerDiscount() {
            if (this.configuration.restrict_seller_discount && this.typeUser !== 'admin') {
                const all_percentages = this.getDiscountPercentages()
                if (all_percentages > parseFloat(this.configuration.sellers_discount_limit) && !this.form.token_validated_for_discount) {
                    this.totalDiscountPercentage = _.round(all_percentages, 2)
                    this.showDialogDiscountPermission = true
                    return {success: false}
                }
            }
            return {success: true}
        },
        async clickPayment() {
            const validate_restrict_seller_discount = this.validateRestrictSellerDiscount()
            if (!validate_restrict_seller_discount.success) return

            if (this.enabledPointSystem) {
                const validate_exchange_points = this.validateExchangePoints()
                if (!validate_exchange_points.success) return this.$message.error(validate_exchange_points.message)
            } else {
                if (this.form.total <= 0) return this.$message.error('El total debe ser mayor a 0')
            }

            if (!moment(moment().format("YYYY-MM-DD")).isSame(this.form.date_of_issue)) {
                return this.$message.error('La fecha de emisión no coincide con la del día actual')
            }
            if (!this.form.series_id) {
                return this.$message.warning('El establecimiento no tiene series disponibles para el comprobante')
            }

            if (this.form.document_type_id === "80") {
                this.form.prefix = "NV"
                this.form.paid = 1
                this.resource_documents = "sale-notes"
                this.resource_payments = "sale_note_payments"
                this.resource_options = this.resource_documents
            } else {
                this.form.prefix = null
                this.resource_documents = "documents"
                this.resource_payments = "document_payments"
                this.resource_options = this.resource_documents
                await this.asignPlateNumberToItems()
            }

            this.loading_submit = true
            this.locked_submit = true

            await this.$http.post(`/${this.resource_documents}`, this.form).then(response => {
                if (response.data.success) {
                    if (this.form.document_type_id === "80") {
                        this.form_cash_document.sale_note_id = response.data.data.id
                    } else {
                        this.form_cash_document.document_id = response.data.data.id
                        this.statusDocument = response.data.data.response
                    }
                    this.documentNewId = response.data.data.id
                    this.showOptionsDialog(response)
                    this.saveCashDocument()
                    this.cleanLocalStoragePayment()
                    if (this.isPrint) this.gethtml()
                    this.$eventHub.$emit('saleSuccess')
                } else {
                    this.$message.error(response.data.message)
                }
            }).catch(error => {
                if (error.response.status === 422) {
                    this.errors = error.response.data
                } else {
                    this.$message.error(error.response.data.message)
                }
            }).then(() => {
                this.loading_submit = false
                this.locked_submit = false
            })
        },
        showOptionsDialog(response) {
            if (this.hidePdfViewDocuments) {
                const response_data = response.data.data
                if (this.form.document_type_id === '80') {
                    this.$message.success(`Nota de venta registrada: ${response_data.number_full}`)
                } else {
                    if (response_data.response.sent) {
                        this.$message.success(response_data.response.description)
                    } else {
                        this.$message.success(`Comprobante registrado: ${response_data.number_full}`)
                    }
                }
                this.clickCancel()
            } else {
                this.showDialogOptions = true
            }
        },
        gethtml() {
            this.form.datahtml = ""
            var route = `/printticket/document/${this.documentNewId}/ticket`
            if (this.resource_documents !== 'documents') {
                route = `/sale-notes/ticket/${this.documentNewId}/ticket`
            }
            this.$http.get(route)
                .then(response => {
                    if (response.data.length > 0) {
                        this.form.datahtml = response.data
                        this.printticket()
                    }
                })
                .catch(error => console.log(error))
        },
        async printticket() {
            await this.sleep(400)
            var configg = getUpdatedConfig()
            var opts = getUpdatedConfig()
            var printData = [{type: 'html', format: 'plain', data: this.form.datahtml, options: opts}]
            qz.print(configg, printData)
                .then(() => {
                    this.$notify({title: '', message: 'Impresión en proceso...', type: 'success'})
                })
                .catch(displayError)
        },
        saveCashDocument() {
            this.$http.post(`/cash/cash_document`, this.form_cash_document)
                .then(response => {
                    if (!response.data.success) this.$message.error(response.data.message)
                })
                .catch(error => console.log(error))
        },
        savePaymentMethod() {
            this.$http.post(`/${this.resource_payments}`, this.form_payment)
                .then(response => {
                    if (!response.data.success) this.$message.error(response.data.message)
                })
                .catch(error => {
                    if (error.response.status === 422) {
                        this.records[index].errors = error.response.data
                    } else {
                        console.log(error)
                    }
                })
        },
        getTables() {
            this.$http.get(`/${this.resource}/payment_tables`)
                .then(response => {
                    this.all_series = response.data.series
                    this.payment_method_types = response.data.payment_method_types
                    this.cards_brand = response.data.cards_brand
                    this.global_discount_types = response.data.global_discount_types
                    this.filterSeries()
                    this.setConfigGlobalDiscountType()
                })
        },
    }
}
</script>
