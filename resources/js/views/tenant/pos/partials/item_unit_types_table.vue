<template>
    <el-dialog   :title="titleDialog" :model-value="showDialog" :close-on-click-modal="true" @close="close" @open="create" append-to-body top="7vh" width="30%">

        <form autocomplete="off" @submit.prevent="submit">
            <div class="form-body">
                <div class="row">
                    <div class="col-md-12">     
                        <label class="control-label">Información de atajos
                            <el-tooltip class="item" effect="dark" placement="top-start">
                                <i class="fa fa-info-circle"></i>
                                <div slot="content">
                                    <strong>DESPLAZARSE ARRIBA DE LA LISTA - TECLA F8 </strong><br/><br/>
                                    <strong>DESPLAZARSE ABAJO DE LA LISTA - TECLA F9 </strong><br/><br/>
                                    <strong>SELECCIONAR UN ELEMENTO DE LA LISTA (PRECIO) - TECLA F4 </strong><br/><br/>
                                </div>
                            </el-tooltip>
                        </label>
                    </div> 
                    <div class="col-md-12">     
                        <el-table
                            ref="tableItemUnitTypes"
                            :data="itemUnitTypes"
                            highlight-current-row
                            @current-change="handleCurrentChange"
                            style="width: 100%"
                        >  
                            <el-table-column label="Precio">
                                <template #default="{ row }">
                                    {{getDescription(row)}}
                                </template>
                            </el-table-column>
                        </el-table>
                    </div> 
                </div>   
            </div>
            <div class="form-actions text-right mt-4">
                <el-button @click.prevent="close()">Cerrar</el-button>
            </div>
        </form>
    </el-dialog>
</template> 
<script>

    
    export default {
        components: { },
        props: ['showDialog', 'itemUnitTypes'],
        data() {
            return {
                currentIndex: 0,
                selected_price: null,  
                titleDialog: 'Seleccionar precio',
                currentRow:null
            }
        },
        async created() {

        },
        mounted() {
            this._keyupHandlerUp119 = (e) => { if (e.code === 'F8') this.handleUp119(e) }
            this._keyupHandlerDown120 = (e) => { if (e.code === 'F9') this.handleDown120(e) }
            this._keyupHandlerPrice115 = (e) => { if (e.code === 'F4') this.handleSetPrice115(e) }
            document.addEventListener('keyup', this._keyupHandlerUp119)
            document.addEventListener('keyup', this._keyupHandlerDown120)
            document.addEventListener('keyup', this._keyupHandlerPrice115)
        },
        beforeUnmount() {
            document.removeEventListener('keyup', this._keyupHandlerUp119)
            document.removeEventListener('keyup', this._keyupHandlerDown120)
            document.removeEventListener('keyup', this._keyupHandlerPrice115)
        },
        methods: {   
            handleSetPrice115(){

                if(!this.currentRow){
                    return this.$message.warning('No ha seleccionado un precio')
                }

                this.selectedPrice()
            },
            handleDown120() {
                
                this.currentIndex += 1;

                if (this.itemUnitTypes[this.currentIndex]) {
                    this.setCurrent(this.itemUnitTypes[this.currentIndex]);
                } else {
                    this.currentIndex = 0;
                    this.setCurrent(this.itemUnitTypes[0]);
                }

            },
            handleUp119() { 

                if (this.currentIndex == 0) {
                    return;
                }
                this.currentIndex -= 1;
                this.setCurrent(this.itemUnitTypes[this.currentIndex])

            },
            handleCurrentChange(val) {
                this.currentRow = val;
            }, 
            setCurrent(row) {
                // console.log(row, "setCurrent")
                this.$refs.tableItemUnitTypes.setCurrentRow(row);
            },
            async selectedPrice(){

                let unit_type = await _.find(this.itemUnitTypes, {id : this.currentRow.id})

                if(unit_type){
                    this.$eventHub.$emit("selectedItemUnitTypeTable", (unit_type))
                    this.close()
                }else{
                    this.$message.warning('No ha seleccionado un precio')
                }

            },
            getDescription(option){
                 
                let price = 0

                switch (option.price_default) {
                    case 1:
                        price = option.price1
                        break;
                    case 2:
                        price = option.price2
                        break;
                    case 3:
                        price = option.price3
                        break; 
                }

                return `Precio: ${price} - Unidad: ${option.unit_type_id}`
            },  
            create() {
                
                this.$nextTick(() => {
                    this.initTableRow()
                }); 

            },  
            initTableRow() {

                if(this.itemUnitTypes.length > 0){
                    this.currentIndex = 0;
                    this.setCurrent(this.itemUnitTypes[0]);
                }
            },
            close() {
                this.currentRow = null
                this.$emit('update:showDialog', false)
            }, 
        }
    }
</script>