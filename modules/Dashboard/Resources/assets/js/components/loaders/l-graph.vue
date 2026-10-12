<template> 
    <div>
        <vcl-table :rows="rows" :columns="columns"></vcl-table>
        <template v-if="!hideCircle">
            <br/><br/>
            <el-skeleton animated>
                <circle cx="50%" cy="50%" :r="radius"/>
            </el-skeleton>
        </template>
    </div>
</template>


<script>
    
    // vue-content-loading removed — using el-skeleton;

    export default {
        props: {
            hideCircle: Boolean,
            radius: Number,
            rows: Number,
            columns: Number,
        },
        components: { },
        data () {
            return {  
            }
        },
        computed: {
        },
        created() { 
        }, 
        methods: { 
        }
    }
</script>