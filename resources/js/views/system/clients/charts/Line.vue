<script>
    import {Line} from 'vue-chartjs';
    import {lineChartOptions} from "./config";

    export default {
        extends: Line,
        props: ["data"],
        data() {
            return {
                options: lineChartOptions
            };
        },
        mounted() {
            // renderChart removed (vue-chartjs v5 is reactive);
        }
    };
</script>
