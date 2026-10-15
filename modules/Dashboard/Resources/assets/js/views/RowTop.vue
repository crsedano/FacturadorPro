<template>
  <div class="row dash-kpi-row">
    <div class="col-6 col-md-2" v-if="company.certificate_due">
      <div class="dash-kpi-card" :class="isDueWarning ? 'dash-kpi-card--danger' : 'dash-kpi-card--success'">
        <div class="dash-kpi-icon">
          <i class="fa fa-certificate"></i>
        </div>
        <div class="dash-kpi-label">Venc. Certificado</div>
        <div class="dash-kpi-value dash-kpi-value--sm"
          :class="isDueWarning ? 'text-danger' : 'text-success'">
          {{ company.certificate_due }}
        </div>
      </div>
    </div>
    <div class="col-6 col-md-2">
      <div class="dash-kpi-card dash-kpi-card--theme">
        <div class="dash-kpi-icon">
          <i class="fa fa-file-text-o"></i>
        </div>
        <div class="dash-kpi-label">CPE Emitidos</div>
        <div class="dash-kpi-value">{{ total_cpe }}</div>
      </div>
    </div>
    <div class="col-6 col-md-2">
      <div class="dash-kpi-card dash-kpi-card--blue">
        <div class="dash-kpi-icon">
          <i class="fa fa-file-invoice-dollar"></i>
        </div>
        <div class="dash-kpi-label">Total Comprobantes</div>
        <div class="dash-kpi-value dash-kpi-value--sm">{{ document_total_global }}</div>
      </div>
    </div>
    <div class="col-6 col-md-2">
      <div class="dash-kpi-card dash-kpi-card--teal">
        <div class="dash-kpi-icon">
          <i class="fa fa-shopping-cart"></i>
        </div>
        <div class="dash-kpi-label">Total Notas Venta</div>
        <div class="dash-kpi-value dash-kpi-value--sm">{{ sale_note_total_global }}</div>
      </div>
    </div>
    <div class="col-6 col-md-2">
      <div class="dash-kpi-card dash-kpi-card--purple">
        <div class="dash-kpi-icon">
          <i class="fa fa-bar-chart"></i>
        </div>
        <div class="dash-kpi-label">Total General</div>
        <div class="dash-kpi-value dash-kpi-value--sm">{{ $filters.toDecimals(total) }}</div>
      </div>
    </div>
    <div class="col-6 col-md-2" v-if="utilities.totals">
      <div class="dash-kpi-card dash-kpi-card--green">
        <div class="dash-kpi-icon">
          <i class="fa fa-line-chart"></i>
        </div>
        <div class="dash-kpi-label">Utilidad Neta</div>
        <div class="dash-kpi-value dash-kpi-value--sm">{{ utilities.totals.utility }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import moment from "moment";

export default {
  props: ["company", 'utilities'],
  data() {
    return {
      document_total_global: 0,
      total_cpe: 0,
      sale_note_total_global: 0,
      total: 0,
    };
  },
  mounted() {
    this.onFetchData();
  },
  computed: {
    isDueWarning() {
      if (this.company.certificate_due) {
        const dueDate = moment(this.company.certificate_due);
        const now = moment();
        return dueDate.diff(now, 'days') <= 15;
      }
      return false;
    },
  },
  methods: {
    onFetchData() {
      this.$http.get("/dashboard/global-data").then((response) => {
        const data = response.data;
        this.document_total_global = data.document_total_global;
        this.total_cpe = data.total_cpe;
        this.sale_note_total_global = data.sale_note_total_global;
        this.total =
          parseFloat(this.document_total_global) +
          parseFloat(this.sale_note_total_global);
      });
    },
  },
};
</script>

<style scoped>
.dash-kpi-row {
  padding: 0 4px;
}
.dash-kpi-card {
  border-radius: 12px;
  padding: 16px 14px 14px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 6px;
  border: 1px solid rgba(0,0,0,.07);
  background: #fff;
  transition: box-shadow .15s, transform .12s;
}
.dash-kpi-card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,.1);
  transform: translateY(-2px);
}
.dash-kpi-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  border-radius: 12px 12px 0 0;
}
.dash-kpi-card--theme::before  { background: var(--theme-color, #398bf7); }
.dash-kpi-card--blue::before   { background: #3b82f6; }
.dash-kpi-card--teal::before   { background: #14b8a6; }
.dash-kpi-card--purple::before { background: #8b5cf6; }
.dash-kpi-card--green::before  { background: #10b981; }
.dash-kpi-card--success::before{ background: #10b981; }
.dash-kpi-card--danger::before { background: #ef4444; }

.dash-kpi-icon {
  font-size: 18px;
  opacity: .55;
}
.dash-kpi-card--theme  .dash-kpi-icon { color: var(--theme-color, #398bf7); }
.dash-kpi-card--blue   .dash-kpi-icon { color: #3b82f6; }
.dash-kpi-card--teal   .dash-kpi-icon { color: #14b8a6; }
.dash-kpi-card--purple .dash-kpi-icon { color: #8b5cf6; }
.dash-kpi-card--green  .dash-kpi-icon { color: #10b981; }
.dash-kpi-card--success .dash-kpi-icon { color: #10b981; }
.dash-kpi-card--danger  .dash-kpi-icon { color: #ef4444; }

.dash-kpi-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: #94a3b8;
  line-height: 1.3;
}
.dash-kpi-value {
  font-size: 26px;
  font-weight: 800;
  color: #1e293b;
  line-height: 1.1;
  letter-spacing: -0.5px;
}
.dash-kpi-value--sm {
  font-size: 18px;
  letter-spacing: -0.3px;
}

/* dark mode */
:global(html.dark) .dash-kpi-card {
  background: #283046;
  border-color: rgba(255,255,255,.07);
}
:global(html.dark) .dash-kpi-label { color: #64748b; }
:global(html.dark) .dash-kpi-value  { color: #e2e8f0; }
</style>
