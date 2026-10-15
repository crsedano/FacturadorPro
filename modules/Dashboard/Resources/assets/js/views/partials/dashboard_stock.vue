<template>
    <section class="card card-dashboard">
        <div class="card-body" v-if="loader">
            <template>
                <vcl-table :rows="4" :columns="2"></vcl-table>
            </template>
        </div>
        <div class="card-body pb-0" v-show="!loader">
            <label>Productos por agotarse
                <el-tooltip class="item" effect="dark" content="Aplica filtro por establecimiento" placement="top-start">
                    <i class="fa fa-info-circle"></i>
                </el-tooltip>
            </label>
        </div>
        <div class="card-body p-0" v-show="!loader">
            <simple-data-table :resource="resource">
                <template #heading>
                <tr>
                    <th>#</th>
                    <th >Producto</th>
                    <th class="text-center">Stock</th>
                    <th>Estado</th>
                    <th>Almacén</th>
                    <th class="text-center">Aprovisionar</th>
                </tr>
                </template>
                <template #default="{ index, row }">
                <tr>
                    <td>{{ index }}</td>
                    <td  >{{ row.product }}</td>
                    <td class="text-center">{{ row.stock }}</td>
                    <td>
                        <span class="badge bg-danger text-white" v-if="row.state == '01'">Agotado</span>
                        <span class="badge bg-warning text-white" v-if="row.state == '02'">Pocas unidades</span>
                    </td>
                    <td>{{ row.warehouse }} </td>
                    <td  class="text-center">
                        <button type="button" style="min-width: 41px" class="btn waves-effect waves-light btn-xs btn-primary m-1__2"
                                    @click.prevent="clickProvision()"><i class="fas fa-shopping-cart"></i></button>
                    </td>

                </tr>
                </template>
            </simple-data-table>
        </div>
    </section>
</template>


<script>

    import SimpleDataTable from '../../components/SimpleDataTable.vue'
    // vue-content-loading removed — using el-skeleton;

    export default {
        components: {SimpleDataTable, },

        data () {
            return {
                loader: true,
                resource: 'dashboard/stock-by-product',
                records: []
            }
        },
        mounted(){
            this.events()

        },
        created() {
        },
        methods: {
            events(){
                this.$eventHub.$on('recordsSkeletonLoader', (status) => {
                    this.loader = status
                })

                this.$eventHub.$on('changeStock', (establishment_id) => {
                    this.$eventHub.$emit('reloadSimpleDataTable', establishment_id)
                    // console.log(establishment_id)
                })
            },
            clickProvision(){
                window.open('/purchases/create')
            },
        }
    }
</script>
