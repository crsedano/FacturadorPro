<template>
    <el-dialog :close-on-click-modal="false"
               :close-on-press-escape="false"
               :show-close="false"
               :title="titleDialog"
               :model-value="showDialog"
               append-to-body
               width="85%"
               @open="create">
        <div v-loading="loading">
            <div v-if="form.response_message"
                 class="row mb-2">
                <div class="col-md-12">
                    <el-alert
                        :title="form.response_message"
                        :type="form.response_type"
                        show-icon>
                    </el-alert>
                </div>
            </div>

            <div v-if="!locked_emission.success" class="row mb-2">
                <div class="col-lg-12 col-md-12 col-sm-12 text-center font-weight-bold">
                    <el-alert :title="locked_emission.message"
                              show-icon
                              type="warning"></el-alert>
                </div>
            </div>

            <div class="row" v-if="form.send_to_pse">
                <div class="col-lg-12 col-md-12 col-sm-12" v-if="form.response_signature_pse">
                    <el-alert :title="`Firma Xml PSE: ${form.response_signature_pse}`"
                              show-icon type="success"></el-alert>
                </div>
                <div class="col-lg-12 col-md-12 col-sm-12 mt-2" v-if="form.response_send_cdr_pse">
                    <el-alert :title="`Envio CDR PSE: ${form.response_send_cdr_pse}`"
                              show-icon type="success"></el-alert>
                </div>
            </div>

            <div class="row">
                <div class="col-lg-8 col-md-12">
                    <!-- Format selector -->
                    <div class="d-flex align-items-center flex-wrap gap-2 mb-2">
                        <span class="font-weight-bold mr-2">Formato:</span>

                        <button :class="['btn btn-sm waves-effect waves-light', previewFormat === 'a4' ? 'btn-primary' : 'btn-outline-secondary']"
                                type="button"
                                @click="selectFormat('a4')">
                            <i class="fa fa-file-alt mr-1"></i>A4
                        </button>

                        <button :class="['btn btn-sm waves-effect waves-light', previewFormat === 'a5' ? 'btn-primary' : 'btn-outline-secondary']"
                                type="button"
                                @click="selectFormat('a5')">
                            <i class="fa fa-file-alt mr-1"></i>A5
                        </button>

                        <button v-if="ShowTicket80"
                                :class="['btn btn-sm waves-effect waves-light', previewFormat === 'ticket' ? 'btn-primary' : 'btn-outline-secondary']"
                                type="button"
                                @click="selectFormat('ticket')">
                            <i class="fa fa-receipt mr-1"></i>80MM
                        </button>

                        <button v-if="ShowTicket58"
                                :class="['btn btn-sm waves-effect waves-light', previewFormat === 'ticket_58' ? 'btn-primary' : 'btn-outline-secondary']"
                                type="button"
                                @click="selectFormat('ticket_58')">
                            <i class="fa fa-receipt mr-1"></i>58MM
                        </button>

                        <button v-if="ShowTicket50"
                                :class="['btn btn-sm waves-effect waves-light', previewFormat === 'ticket_50' ? 'btn-primary' : 'btn-outline-secondary']"
                                type="button"
                                @click="selectFormat('ticket_50')">
                            <i class="fa fa-receipt mr-1"></i>50MM
                        </button>

                        <a v-if="previewUrl"
                           :href="previewUrl"
                           target="_blank"
                           class="btn btn-sm btn-info waves-effect waves-light ml-auto">
                            <i class="fa fa-external-link-alt mr-1"></i>Abrir en nueva pestaña
                        </a>
                    </div>

                    <!-- PDF preview iframe -->
                    <div class="preview-wrapper" style="position:relative;">
                        <div v-if="previewLoading"
                             class="preview-loading d-flex align-items-center justify-content-center"
                             style="position:absolute;inset:0;background:rgba(255,255,255,.7);z-index:10;">
                            <i class="fa fa-spinner fa-spin fa-2x text-primary"></i>
                        </div>
                        <iframe v-if="previewUrl"
                                :src="previewUrl"
                                class="preview-iframe"
                                style="width:100%;height:65vh;border:1px solid #dee2e6;border-radius:4px;"
                                @load="previewLoading = false"
                                @error="previewLoading = false">
                        </iframe>
                        <div v-else
                             class="d-flex align-items-center justify-content-center"
                             style="height:65vh;border:1px dashed #dee2e6;border-radius:4px;color:#adb5bd;">
                            <div class="text-center">
                                <i class="fa fa-file-pdf fa-3x mb-2"></i>
                                <p class="mb-0">Cargando vista previa...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Side panel -->
                <div class="col-lg-4 col-md-12 mt-3 mt-lg-0">

                    <div v-if="form.image_detraction" class="mb-3">
                        <a :href="form.image_detraction"
                           class="btn btn-sm btn-outline-secondary btn-block"
                           download>
                            <i class="fa fa-download mr-1"></i>Constancia detracción
                        </a>
                    </div>

                    <div v-if="company.soap_type_id == '02' && form.group_id == '01'" class="mb-3">
                        <button class="btn btn-sm btn-outline-primary btn-block"
                                type="button"
                                @click.prevent="clickConsultCdr(form.id)">
                            <i class="fa fa-sync mr-1"></i>Consultar CDR
                        </button>
                    </div>

                    <div class="opt-channel-card opt-channel-card--email mb-3">
                        <div class="opt-channel-header mb-1">
                            <i class="fas fa-envelope"></i> Correo electrónico
                        </div>
                        <el-input v-model="form.customer_email" placeholder="cliente@correo.com">
                            <template #append>
                                <el-button :loading="loading" @click="clickSendEmail">
                                    <i class="fas fa-paper-plane"></i>
                                </el-button>
                            </template>
                        </el-input>
                        <small v-if="errors.customer_email" class="form-control-feedback" v-text="errors.customer_email[0]"></small>
                    </div>

                    <div class="opt-channel-card opt-channel-card--whatsapp">
                        <div class="opt-channel-header mb-1">
                            <i class="fab fa-whatsapp"></i> WhatsApp
                            <el-tooltip effect="dark" content="Requiere WhatsApp Web abierto" placement="top">
                                <i class="fas fa-info-circle" style="font-size:10px;opacity:.6"></i>
                            </el-tooltip>
                        </div>
                        <el-input v-model="form.customer_telephone" placeholder="987654321">
                            <template #prepend>+51</template>
                            <template #append>
                                <el-button @click="clickSendWhatsapp">
                                    <i class="fab fa-whatsapp"></i>
                                </el-button>
                            </template>
                        </el-input>
                        <small v-if="errors.customer_telephone" class="form-control-feedback" v-text="errors.customer_telephone[0]"></small>
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <template v-if="showClose">
                <el-button @click="clickClose">Cerrar</el-button>
            </template>
            <template v-else>
                <el-button class="list" @click="clickFinalize">Ir al listado</el-button>

                <el-popover
                    :open-delay="1000"
                    placement="top-start"
                    width="145"
                    trigger="hover"
                    content="Presiona ALT + N">
                    <template #reference>
                        <el-button v-if="!isUpdate"
                                   type="primary"
                                   @click="clickNewDocument">
                            Nuevo comprobante
                        </el-button>
                    </template>
                </el-popover>
            </template>
        </template>
    </el-dialog>
</template>

<script>
import {mapState, mapActions} from "vuex/dist/vuex.mjs";

export default {
    props: ['showDialog', 'recordId', 'showClose', 'isContingency', 'generatDispatch', 'dispatchId', 'isUpdate', 'configuration', 'table'],
    components: {},
    data() {
        return {
            titleDialog: null,
            loading: false,
            previewLoading: false,
            previewUrl: null,
            previewFormat: 'a4',
            resource: 'documents',
            errors: {},
            form: {},
            multiple: [
                { keyCode: 78, modifiers: ['altKey'], preventDefault: true },
                { keyCode: 80, modifiers: ['altKey'], preventDefault: true },
            ],
            company: {},
            locked_emission: {},
        }
    },
    created() {
        this.loadConfiguration(this.$store)
        this.$store.commit('setConfiguration', this.configuration)
    },
    mounted() {
        this._keyupHandlerAlt = (e) => this.checkKeyWithAlt(e)
        document.addEventListener('keyup', this._keyupHandlerAlt)
        this.initForm()
    },
    beforeUnmount() {
        document.removeEventListener('keyup', this._keyupHandlerAlt)
    },
    computed: {
        ...mapState(['config']),
        ShowTicket58() {
            return this.config?.show_ticket_58 ?? false;
        },
        ShowTicket80() {
            return this.config?.show_ticket_80 ?? false;
        },
        ShowTicket50() {
            return this.config?.show_ticket_50 ?? false;
        },
    },
    methods: {
        ...mapActions(['loadConfiguration']),
        initForm() {
            this.errors = {};
            this.previewUrl = null;
            this.previewFormat = 'a4';
            this.form = {
                customer_email: null,
                download_pdf: null,
                external_id: null,
                number: null,
                image_detraction: null,
                id: null,
                response_message: null,
                response_type: null,
                customer_telephone: null,
                message_text: null,
                group_id: null,
                send_to_pse: false,
                response_signature_pse: null,
                response_send_cdr_pse: null,
            };
            this.locked_emission = { success: true, message: null };
            this.company = { soap_type_id: null };
        },
        async create() {
            await this.getCompany();
            await this.getRecord();
            this.loading = true;
            await this.$http.get(`/${this.resource}/locked_emission`).then(response => {
                this.locked_emission = response.data;
            }).finally(() => this.loading = false);
        },
        async getCompany() {
            this.loading = true;
            await this.$http.get(`/companies/record`).then(response => {
                if (response.data !== '') this.company = response.data.data;
            }).finally(() => this.loading = false);
        },
        async getRecord() {
            this.loading = true;
            await this.$http.get(`/${this.resource}/record/${this.recordId}`).then(response => {
                this.form = response.data.data;
                this.titleDialog = 'Comprobante: ' + this.form.number;
                if (this.generatDispatch) window.open(`/dispatches/create/${this.form.id}/i/${this.dispatchId}`);
                if (this.form.external_id) {
                    this.selectFormat('a4');
                }
            }).finally(() => this.loading = false);
        },
        selectFormat(format) {
            if (!this.form.external_id) {
                this.$message.warning('Cargando información del comprobante, intente nuevamente.');
                return;
            }
            this.previewFormat = format;
            this.previewLoading = true;
            this.previewUrl = `/print/document/${this.form.external_id}/${format}`;
        },
        clickSendWhatsapp() {
            if (!this.form.customer_telephone) {
                return this.$message.error('El número es obligatorio');
            }
            window.open(`https://wa.me/51${this.form.customer_telephone}?text=${this.form.message_text}`, '_blank');
        },
        clickSendEmail() {
            this.loading = true;
            this.$http.post(`/${this.resource}/email`, {
                customer_email: this.form.customer_email,
                id: this.form.id,
            }).then(response => {
                if (response.data.success) {
                    this.$message.success('El correo fue enviado satisfactoriamente');
                } else {
                    this.$message.error('Error al enviar el correo');
                }
            }).catch(error => {
                if (error.response.status === 422) {
                    this.errors = error.response.data.errors;
                } else {
                    this.$message.error(error.response.data.message);
                }
            }).then(() => {
                this.loading = false;
            });
        },
        clickConsultCdr(document_id) {
            this.$http.get(`/${this.resource}/consult_cdr/${document_id}`).then(response => {
                if (response.data.success) {
                    this.$message.success(response.data.message);
                    this.getRecord();
                    this.$eventHub.$emit('reloadData');
                } else {
                    this.$message.error(response.data.message);
                }
            }).catch(error => {
                this.$message.error(error.response.data.message);
            });
        },
        clickFinalize() {
            if (this.table) {
                location.href = `/${this.table}`;
            } else {
                location.href = (this.isContingency) ? `/contingencies` : `/${this.resource}`;
            }
        },
        clickNewDocument() {
            if (this.table) {
                location.href = `/${this.table}/create`;
            } else {
                this.clickClose();
            }
        },
        clickClose() {
            this.$emit('update:showDialog', false);
            this.initForm();
        },
        checkKeyWithAlt(e) {
            const code = e.code;
            if (code === 'KeyN') this.clickClose();
            if (code === 'KeyP') this.selectFormat('ticket_50');
        },
    },
}
</script>

<style scoped>
.gap-2 {
    gap: 0.5rem;
}
.btn-block {
    display: block;
    width: 100%;
}
</style>
