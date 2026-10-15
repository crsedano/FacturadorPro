<template>
    <div>
        <div class="page-header pr-0">
            <h2><a href="/dashboard"><i class="fas fa-tachometer-alt"></i></a></h2>
            <ol class="breadcrumbs">
                <li class="active"><span>{{ title }}</span></li>
            </ol>
            <div class="right-wrapper pull-right">
                <!--<button type="button" class="btn btn-custom btn-sm  mt-2 mr-2" @click.prevent="clickImport()"><i class="fa fa-upload"></i> Importar</button>-->
                <button type="button" class="btn btn-custom btn-sm  mt-2 mr-2" @click.prevent="clickCreate()"><i class="fa fa-plus-circle"></i> Ingreso</button>
            </div>
        </div>
        <div class="card mb-0">
            <div class="card-header bg-info">
                <h3 class="my-0">Listado de {{ title }}</h3>
            </div>
            <div class="card-body">
                <data-table :resource="resource">
                    <template #heading>
                    <tr>
                        <th>#</th>
                        <th>Producto</th>
                        <th>Almacén</th>
                        <th class="text-right">Stock</th>
                        <th class="text-right">Acciones</th>
                    </tr>
                    </template>
                    <template #default="{ index, row }">
                    <tr>
                        <td>{{ index }}</td>
                        <td>{{ row.item_description }}</td>
                        <td>{{ row.warehouse_description }}</td>
                        <td class="text-right">{{ row.stock }}</td>
                        <td class="text-right">
                            <button type="button" class="btn waves-effect waves-light btn-xs btn-info"
                                    @click.prevent="clickMove(row.id)">Trasladar</button>
                            <button type="button" class="btn waves-effect waves-light btn-xs btn-warning"
                                    @click.prevent="clickRemove(row.id)">Remover</button>
                        </td>
                    </tr>
                    </template>
                </data-table>
            </div>

            <inventories-form v-model:showDialog="showDialog"></inventories-form>
            <inventories-move v-model:showDialog="showDialogMove"
                              :recordId="recordId"></inventories-move>
            <inventories-remove v-model:showDialog="showDialogRemove"
                                :recordId="recordId"></inventories-remove>
        </div>
    </div>
</template>

<script>

    import InventoriesForm from './form.vue'
    import InventoriesMove from './move.vue'
    import InventoriesRemove from './remove.vue'
    import DataTable from '../../../components/DataTable.vue'

    export default {
        props: ['type'],
        components: {DataTable, InventoriesForm, InventoriesMove, InventoriesRemove},
        data() {
            return {
                title: null,
                showDialog: false,
                showDialogMove: false,
                showDialogRemove: false,
                resource: 'inventories',
                recordId: null,
            }
        },
        created() {
            this.title = 'Inventario'
        },
        methods: {
            clickMove(recordId)
            {
                this.recordId = recordId
                this.showDialogMove = true
            },
            clickCreate() {
                this.recordId = null
                this.showDialog = true
            },
            clickRemove(recordId) {
                this.recordId = recordId
                this.showDialogRemove = true
            }
        }
    }
</script>
