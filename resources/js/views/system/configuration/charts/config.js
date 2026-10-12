export const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    elements: {
        line: {
            tension: 0
        }
    },
    plugins: {
        legend: {
            display: false
        },
    },
    scales: {
        y: {
            grid: {
                display: true,
                lineWidth: 1,
                color: "rgba(0,0,0,0.1)",
            },
            border: { display: false },
            ticks: {
                beginAtZero: true,
            }
        },
        x: {
            grid: {
                display: true,
                lineWidth: 1,
                color: "rgba(0,0,0,0.1)",
            },
            border: { display: false },
        }
    }
};
