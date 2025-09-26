// THIS VERSION THE XBEE IS WORKING WITH THE GCS INDEPENDENTLY OF ARDUINO AND RECIEVES TELEMENTRY DATA BUT CANOT SEND COMMANDS TO FSW YET
//3101,12:34:56,123,F,A,1234.56,25.4,101.3,3.7,0.01,0.02,0.03,0.04,0.05,0.06,0.07,0.08,0.09,1.23,12:34:56,1234.56,37.7749,-122.4194,7,OK
// initialize variables for map and coordinates
var map = null;
var lineCoordinates = [];
var lightTileLayer = null;
var darkTileLayer = null;

// simulation mode variables
let isSimulationMode = false;
let simulationData = [];
let currentSimulationIndex = 0;
let simulationInterval = null;

// initialize everything when the page loads
document.addEventListener("DOMContentLoaded", () => {
    // Simulation button functionality
    const simulationBtn = document.querySelector('.simulation-btn');
    const csvUpload = document.getElementById('csv-upload');

    // update file input to accept both .txt and .csv files
    csvUpload.setAttribute('accept', '.txt,.csv');

    simulationBtn.addEventListener('click', () => {
        if (!isSimulationMode) {
            // reset file input to allow selecting the same file again
            csvUpload.value = '';
            // switch to simulation mode
            csvUpload.click(); // trigger file upload dialog
        } else {
            // switch back to telemetry mode
            stopSimulation();
        }
    });

    csvUpload.addEventListener('change', async (event) => {
        const file = event.target.files[0];
        if (file) {
            try {
                const text = await file.text();
                // parse the simulation commands based on file extension
                const fileExt = file.name.split('.').pop().toLowerCase();
                
                if (fileExt === 'csv') {
                    // For CSV files, parse each line and extract pressure values
                    simulationData = text.split('\n')
                        .map(line => line.trim())
                        .filter(line => line && !line.startsWith('#')) // remove comments and empty lines
                        .map(line => {
                            const values = line.split(',');
                            // Assuming pressure is in the 8th column (index 7) in your CSV format
                            return values.length >= 8 ? parseFloat(values[7]) : null;
                        })
                        .filter(value => value !== null && !isNaN(value));
                } else {
                    // For TXT files, keep existing format (CMD,$,SIMP,value)
                    simulationData = text.split('\n')
                        .map(line => line.trim())
                        .filter(line => line && !line.startsWith('#'))
                        .map(line => {
                            const match = line.match(/CMD,\$,SIMP,(\d+)/);
                            return match ? parseInt(match[1]) : null;
                        })
                        .filter(value => value !== null);
                }

                if (simulationData.length > 0) {
                    startSimulation();
                } else {
                    throw new Error('No valid simulation data found in file');
                }
            } catch (error) {
                console.error('Error loading simulation file:', error);
                alert('Error loading simulation file. Please check the format.');
                stopSimulation();
            }
        }
    });

    function startSimulation() {
        if (!globalCmdInterface.port || !globalCmdInterface.writer) {
            alert('Please connect to Arduino first before starting simulation');
            stopSimulation();
            return;
        }

        // reset simulation mode
        currentSimulationIndex = 0;
        isSimulationMode = true;
        simulationBtn.classList.add('active');
        console.log('Started simulation with', simulationData.length, 'commands');

        // clear any existing interval
        if (simulationInterval) {
            clearInterval(simulationInterval);
        }

        // start the 1Hz simulation loop
        simulationInterval = setInterval(() => {
            if (currentSimulationIndex < simulationData.length) {
                const pressure = simulationData[currentSimulationIndex];
                // Send only the simulated pressure value to the command history
                if (globalCmdInterface) {
                    const command = `CMD,3101,SIMP,${pressure}`;
                    globalCmdInterface.addToHistory(`Simulation: ${command}`, 'response');
                    // Send the command to Arduino
                    globalCmdInterface.sendCommand(command);
                }
                currentSimulationIndex++;
            } else {
                // stop simulation when we reach the end
                stopSimulation();
            }
        }, 1000); // 1Hz interval
    }

    function stopSimulation() {
        isSimulationMode = false;
        simulationBtn.classList.remove('active');
        simulationData = [];
        currentSimulationIndex = 0;
        if (simulationInterval) {
            clearInterval(simulationInterval);
            simulationInterval = null;
        }
        // reset file input to allow selecting the same file again
        csvUpload.value = '';
        console.log('Stopped simulation');
        if (globalCmdInterface) {
            globalCmdInterface.addToHistory('Simulation stopped', 'success');
        }
    }

    // delay map initialization slightly to ensure Leaflet is loaded
    setTimeout(() => {
        initializeMap();
    }, 500);

    function initializeMap() {
        try {
            if (typeof L === 'undefined') {
                throw new Error('Leaflet library not loaded');
            }
            
            const mapElement = document.getElementById('map');
            if (!mapElement) {
                throw new Error('Map container not found');
            }

            map = L.map('map', {
                center: [0, 0],
                zoom: 2,
                zoomControl: true,
                attributionControl: true
            });

            // tile layers for different themes
            lightTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '©OpenStreetMap, ©CartoDB',
                subdomains: 'abcd',
                maxZoom: 19
            });

            darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '©OpenStreetMap, ©CartoDB',
                subdomains: 'abcd',
                maxZoom: 19
            });

            // initial tile layer based on current theme
            const currentTheme = document.body.getAttribute('data-theme') || 'dark';
            updateMapTheme(currentTheme);

            // force map to recalculate its size
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        } catch (error) {
            console.error('Error initializing map:', error);
            const mapContainer = document.getElementById('map');
            if (mapContainer) {
                mapContainer.innerHTML = '<div style="color: red; padding: 20px;">Error loading map. Please refresh the page.</div>';
            }
        }
    }

     // Chart.js graphs
    const ctx1 = document.getElementById('line-chart1').getContext('2d');
    const ctx2 = document.getElementById('line-chart2').getContext('2d');
    const ctx3 = document.getElementById('line-chart3').getContext('2d');
    const ctx4 = document.getElementById('line-chart4').getContext('2d');
    const ctx5 = document.getElementById('line-chart5').getContext('2d');
    const ctx6 = document.getElementById('line-chart6').getContext('2d');
    const ctx7 = document.getElementById('line-chart7').getContext('2d');
    const ctx8 = document.getElementById('line-chart8').getContext('2d');
    const ctx9 = document.getElementById('line-chart9').getContext('2d');

    [ctx1, ctx2, ctx3, ctx4, ctx5, ctx6, ctx7, ctx8, ctx9].forEach(ctx => {
        const canvas = ctx.canvas;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);
    });

    const chart1 = createChart(ctx1, "Temperature (°C)", "red");
    const chart2 = createChart(ctx2, "Altitude (m)", "red");
    const chart3 = createChart(ctx3, "Pressure (kPa)", "red");
    const chart4 = createChart(ctx4, "Auto Rotation (°/s)", "green");
    const chart5 = createChart(ctx5, "Voltage (V)", "green");
    const chart6 = createChart(ctx6, "Gyroscope", "blue", true);
    const chart7 = createChart(ctx7, "Accelerometer", "blue", true);
    const chart8 = createChart(ctx8, "Magnetometer", "blue", true);
    const chart9 = createChart(ctx9, "GPS Altitude (m)", "purple");

    // Modal functionality
    const modal = document.getElementById('graph-modal');
    const modalGraph = document.getElementById('modal-graph');
    const closeModal = document.querySelector('.close-modal');
    let modalChart = null;

    [chart1, chart2, chart3, chart4, chart5, chart6, chart7, chart8, chart9].forEach(chart => {
    chart.canvas.addEventListener('click', () => {
        showGraphInModal(chart);
    });
});
    
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        if (modalChart) {
            modalChart.destroy();
            modalChart = null;
        }
    });


    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
            if (modalChart) {
                modalChart.destroy();
                modalChart = null;
            }
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === "Escape" && modal.style.display === "block") {
            modal.style.display = "none";
            if (modalChart) {
                modalChart.destroy();
                modalChart = null;
            }
        }
    });

    function showGraphInModal(chart) {
        if (modalChart) {
            modalChart.destroy();
        }

        const ctx = modalGraph.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const rect = modalGraph.getBoundingClientRect();
        modalGraph.width = rect.width * dpr;
        modalGraph.height = rect.height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); 
        
        const config = {
    type: chart.config.type,
    data: JSON.parse(JSON.stringify(chart.data)),   // deep clone
    options: JSON.parse(JSON.stringify(chart.options)) // deep clone
};

// Modal-specific tweaks
config.options.responsive = true;
config.options.maintainAspectRatio = false;
config.options.animation = false;

if (config.options.scales) {
    if (config.options.scales.x?.ticks) config.options.scales.x.ticks.font = { size: 20 };
    if (config.options.scales.y?.ticks) config.options.scales.y.ticks.font = { size: 20 };
}
if (config.options.plugins?.legend?.labels) {
    config.options.plugins.legend.labels.font = { size: 24 };
    config.options.plugins.legend.labels.boxWidth = 30;
    config.options.plugins.legend.position = 'top';
}

modalChart = new Chart(ctx, config);


        modal.style.display = 'block';
        setTimeout(() => modalChart.resize(), 100);
    }

    function createChart(ctx, label, borderColor, isMultiDataset = false) {
        const canvas = ctx.canvas;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = 350 * dpr;
        canvas.height = 200 * dpr;
        ctx.scale(dpr, dpr);

        canvas.style.cursor = 'pointer';
        canvas.addEventListener('click', () => {
            const chart = Chart.getChart(canvas);
            if (chart) {
                showGraphInModal(chart);
            }
        });

        canvas.addEventListener('mouseover', () => {
            canvas.style.transform = 'scale(1.02)';
            canvas.style.transition = 'transform 0.2s ease';
        });

        canvas.addEventListener('mouseout', () => {
            canvas.style.transform = 'scale(1)';
        });

        if (isMultiDataset) {
            const legendContainer = document.createElement('div');
            legendContainer.className = 'chart-legend';
            legendContainer.style.display = 'flex';
            legendContainer.style.gap = '15px';
            legendContainer.style.marginTop = '1px';
            legendContainer.style.justifyContent = 'center';
            legendContainer.style.alignItems = 'center';
            
            const colors = ['#FF0000', '#00FF00', '#800080'];
            const axes = ['X', 'Y', 'Z'];
            
            axes.forEach((axis, index) => {
                const button = document.createElement('button');
                button.className = 'axis-toggle';
                button.style.backgroundColor = 'var(--content-bg-color)';
                button.style.border = `1px solid ${colors[index]}`;
                button.style.color = colors[index];
                button.style.padding = '4px 12px';
                button.style.borderRadius = '4px';
                button.style.cursor = 'pointer';
                button.style.fontFamily = 'Oswald';
                button.style.fontSize = '12px';
                button.style.transition = 'all 0.3s ease';
                button.style.display = 'flex';
                button.style.alignItems = 'center';
                button.style.gap = '6px';
                
                const circle = document.createElement('span');
                circle.style.width = '8px';
                circle.style.height = '8px';
                circle.style.borderRadius = '50%';
                circle.style.backgroundColor = colors[index];
                circle.style.display = 'inline-block';
                
                button.appendChild(circle);
                button.appendChild(document.createTextNode(`${axis}-Axis`));
                button.dataset.axis = axis.toLowerCase();
                button.dataset.index = index;
                
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const chart = Chart.getChart(canvas);
                    if (chart) {
                        const dataset = chart.data.datasets[index];
                        dataset.hidden = !dataset.hidden;
                        button.style.backgroundColor = dataset.hidden ? 'rgba(0,0,0,0.2)' : 'var(--content-bg-color)';
                        button.style.opacity = dataset.hidden ? '0.6' : '1';
                        chart.update();
                    }
                });
                
                button.addEventListener('mouseover', () => {
                    button.style.transform = 'translateY(-1px)';
                    button.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
                });
                
                button.addEventListener('mouseout', () => {
                    button.style.transform = 'translateY(0)';
                    button.style.boxShadow = 'none';
                });
                
                legendContainer.appendChild(button);
            });
            
            canvas.parentElement.appendChild(legendContainer);
        }

        const datasets = isMultiDataset ? [
            {
                label: label + " (X)",
                data: [],
                borderWidth: 2,
                borderColor: '#FF0000',
                fill: false,
                tension: 0.4,
                hidden: false
            },
            {
                label: label + " (Y)",
                data: [],
                borderWidth: 2,
                borderColor: '#00FF00',
                fill: false,
                tension: 0.4,
                hidden: false
            },
            {
                label: label + " (Z)",
                data: [],
                borderWidth: 2,
                borderColor: '#800080',
                fill: false,
                tension: 0.4,
                hidden: false
            }
        ] : [{
            label: label,
            data: [],
            borderWidth: 2,
            borderColor: borderColor,
            fill: false,
            tension: 0.4,
            hidden: false
        }];

        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: datasets
            },
            options: {
                responsive: false,
                maintainAspectRatio: false,
                animation: {
                    duration: 0
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: label,
                        color: document.body.getAttribute('data-theme') === 'light' ? '#2c2c2c' : '#ffffff',
                        font: {
                            family: 'Oswald',
                            size: 18
                        },
                        padding: {
                            top: 10,
                            bottom: 10
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: "rgba(255, 255, 255, 0.1)",
                            lineWidth: 1
                        },
                        ticks: {
                            color: document.body.getAttribute('data-theme') === 'light' ? '#2c2c2c' : '#ffffff',
                            maxTicksLimit: 5,
                            font: {
                                family: 'Oswald',
                                size: 14
                            }
                        },
                        title: {
                            display: true,
                            color: document.body.getAttribute('data-theme') === 'light' ? '#2c2c2c' : '#ffffff',
                            font: {
                                family: 'Oswald',
                                size: 14
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: "rgba(255, 255, 255, 0.1)",
                            lineWidth: 1
                        },
                        ticks: {
                            color: document.body.getAttribute('data-theme') === 'light' ? '#2c2c2c' : '#ffffff',
                            font: {
                                family: 'Oswald',
                                size: 14
                            }
                        },
                        title: {
                            display: true,
                            color: document.body.getAttribute('data-theme') === 'light' ? '#2c2c2c' : '#ffffff',
                            font: {
                                family: 'Oswald',
                                size: 14
                            }
                        }
                    }
                },
                layout: {
                    padding: {
                        left: 10,
                        right: 10,
                        top: 30,
                        bottom: 10
                    }
                }
            }
        });
    }

    function adjustColor(color, percent) {
        const num = parseInt(color.replace("#", ""), 16),
            amt = Math.round(2.55 * percent),
            R = (num >> 16) + amt,
            G = (num >> 8 & 0x00FF) + amt,
            B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }


    // // Chart.js graphs
    // const ctx1 = document.getElementById('line-chart1').getContext('2d');
    // const ctx2 = document.getElementById('line-chart2').getContext('2d');
    // const ctx3 = document.getElementById('line-chart3').getContext('2d');
    // const ctx4 = document.getElementById('line-chart4').getContext('2d');
    // const ctx5 = document.getElementById('line-chart5').getContext('2d');
    // const ctx6 = document.getElementById('line-chart6').getContext('2d');
    // const ctx7 = document.getElementById('line-chart7').getContext('2d');
    // const ctx8 = document.getElementById('line-chart8').getContext('2d');

    // // set canvas size for high DPI displays
    // [ctx1, ctx2, ctx3, ctx4, ctx5, ctx6, ctx7, ctx8].forEach(ctx => {
    //     const canvas = ctx.canvas;
    //     const dpr = window.devicePixelRatio || 1;
    //     const rect = canvas.getBoundingClientRect();
    //     canvas.width = rect.width * dpr;
    //     canvas.height = rect.height * dpr;
    //     ctx.scale(dpr, dpr);
    // });

    // const chart1 = createChart(ctx1, "Temperature (°C)", "red");
    // const chart2 = createChart(ctx2, "Altitude (m)", "red");
    // const chart3 = createChart(ctx3, "Pressure (hPa)", "red");
    // const chart4 = createChart(ctx4, "Auto Rotation (°/s)", "green");
    // const chart5 = createChart(ctx5, "Voltage (V)", "green");
    // const chart6 = createChart(ctx6, "Gyroscope", "blue", true);  // Combined gyro data
    // const chart7 = createChart(ctx7, "Accelerometer", "blue", true);  // Combined accel data
    // const chart8 = createChart(ctx8, "Magnetometer", "blue", true);  // Combined mag data

    // // Modal functionality
    // const modal = document.getElementById('graph-modal');
    // const modalGraph = document.getElementById('modal-graph');
    // const closeModal = document.querySelector('.close-modal');
    // let modalChart = null;

    // // Add click event listeners to all graphs
    // [chart1, chart2, chart3, chart4, chart5, chart6, chart7, chart8].forEach((chart, index) => {
    //     chart.canvas.parentElement.addEventListener('click', () => {
    //         showGraphInModal(chart, index);
    //     });
    // });

    // // Close modal when clicking the close button
    // closeModal.addEventListener('click', () => {
    //     modal.style.display = 'none';
    //     if (modalChart) {
    //         modalChart.destroy();
    //         modalChart = null;
    //     }
    // });

    // // Close modal when clicking outside
    // window.addEventListener('click', (event) => {
    //     if (event.target === modal) {
    //         modal.style.display = 'none';
    //         if (modalChart) {
    //             modalChart.destroy();
    //             modalChart = null;
    //         }
    //     }
    // });

    // function showGraphInModal(chart, index) {
    //     // Destroy existing modal chart if any
    //     if (modalChart) {
    //         modalChart.destroy();
    //     }

    //     // Create new chart in modal
    //     const ctx = modalGraph.getContext('2d');
    //     const dpr = window.devicePixelRatio || 1;
    //     const rect = modalGraph.getBoundingClientRect();
    //     modalGraph.width = rect.width * dpr;
    //     modalGraph.height = rect.height * dpr;
    //     ctx.scale(dpr, dpr);

    //     // Clone the chart configuration
    //     const config = JSON.parse(JSON.stringify(chart.config));
        
    //     // Adjust options for modal view
    //     config.options.responsive = true;
    //     config.options.maintainAspectRatio = false;
    //     config.options.animation = {
    //         duration: 0
    //     };
        
    //     // Adjust font sizes for modal view
    //     config.options.scales.x.ticks.font.size = 20;
    //     config.options.scales.y.ticks.font.size = 20;
    //     config.options.plugins.legend.labels.font.size = 24;
    //     config.options.plugins.legend.position = 'top';
    //     config.options.plugins.legend.labels.boxWidth = 30;
        
    //     // Create new chart in modal
    //     modalChart = new Chart(ctx, config);
        
    //     // Copy the current data
    //     modalChart.data.labels = [...chart.data.labels];
    //     modalChart.data.datasets = chart.data.datasets.map(dataset => ({
    //         ...dataset,
    //         data: [...dataset.data],
    //         borderWidth: 3,
    //         pointRadius: 2,
    //         pointHoverRadius: 4
    //     }));
        
    //     // Show modal
    //     modal.style.display = 'block';
        
    //     // Force chart to resize and update
    //     setTimeout(() => {
    //         modalChart.resize();
    //         modalChart.update();
    //     }, 100);
    // }

    // function createChart(ctx, label, borderColor, isMultiDataset = false) {
    //     const canvas = ctx.canvas;
    //     const dpr = window.devicePixelRatio || 1;

    //     canvas.width = 350 * dpr;
    //     canvas.height = 250 * dpr;
    //     ctx.scale(dpr, dpr);

    //     const datasets = isMultiDataset ? [
    //         {
    //             label: label + " (X)",
    //             data: [],
    //             borderWidth: 2,
    //             borderColor: '#FF0000', // Red for X
    //             fill: false,
    //             tension: 0.4,
    //             hidden: false
    //         },
    //         {
    //             label: label + " (Y)",
    //             data: [],
    //             borderWidth: 2,
    //             borderColor: '#00FF00', // Green for Y
    //             fill: false,
    //             tension: 0.4,
    //             hidden: false
    //         },
    //         {
    //             label: label + " (Z)",
    //             data: [],
    //             borderWidth: 2,
    //             borderColor: '#800080', // Purple for Z (instead of blue)
    //             fill: false,
    //             tension: 0.4,
    //             hidden: false
    //         }
    //     ] : [{
    //         label: label,
    //         data: [],
    //         borderWidth: 2,
    //         borderColor: borderColor,
    //         fill: false,
    //         tension: 0.4,
    //         hidden: false
    //     }];

    //     return new Chart(ctx, {
    //         type: 'line',
    //         data: {
    //             labels: [],
    //             datasets: datasets
    //         },
    //         options: {
    //             responsive: false,
    //             maintainAspectRatio: false,
    //             animation: {
    //                 duration: 0
    //             },
    //             scales: {
    //                 x: {
    //                     grid: {
    //                         color: "rgba(255, 255, 255, 0.1)",
    //                         lineWidth: 1
    //                     },
    //                     ticks: {
    //                         color: "white",
    //                         maxTicksLimit: 5,
    //                         font: {
    //                             family: 'Oswald',
    //                             size: 14
    //                         }
    //                     }
    //                 },
    //                 y: {
    //                     beginAtZero: true,
    //                     grid: {
    //                         color: "rgba(255, 255, 255, 0.1)",
    //                         lineWidth: 1
    //                     },
    //                     ticks: {
    //                         color: "white",
    //                         font: {
    //                             family: 'Oswald',
    //                             size: 14
    //                         }
    //                     }
    //                 }
    //             },
    //             plugins: {
    //                 legend: {
    //                     display: isMultiDataset, // Only show legend for multi-dataset charts
    //                     position: 'top',
    //                     labels: {
    //                         color: document.body.getAttribute('data-theme') === 'light' ? '#2c2c2c' : '#ffffff',
    //                         font: {
    //                             family: 'Oswald',
    //                             size: 18
    //                         },
    //                         boxWidth: 20,
    //                         usePointStyle: true,
    //                         pointStyle: 'circle',
    //                         padding: 20,
    //                         generateLabels: function(chart) {
    //                             const datasets = chart.data.datasets;
    //                             return datasets.map((dataset, i) => ({
    //                                 text: dataset.label,
    //                                 fillStyle: dataset.hidden ? 'transparent' : dataset.borderColor,
    //                                 strokeStyle: dataset.borderColor,
    //                                 lineWidth: 2,
    //                                 hidden: dataset.hidden,
    //                                 index: i,
    //                                 color: document.body.getAttribute('data-theme') === 'light' ? '#2c2c2c' : '#ffffff',
    //                                 strikethrough: false
    //                             }));
    //                         }
    //                     },
    //                     onClick: function(e, legendItem, legend) {
    //                         const index = legendItem.index;
    //                         const chart = legend.chart;
    //                         const dataset = chart.data.datasets[index];
    //                         dataset.hidden = !dataset.hidden;
    //                         chart.update();
    //                     }
    //                 },
    //                 title: {
    //                     display: true,
    //                     text: label,
    //                     color: "white",
    //                     font: {
    //                         family: 'Oswald',
    //                         size: 18
    //                     },
    //                     padding: {
    //                         top: 10,
    //                         bottom: 10
    //                     }
    //                 }
    //             },
    //             layout: {
    //                 padding: {
    //                     left: 10,
    //                     right: 10,
    //                     top: 10,
    //                     bottom: 10
    //                 }
    //             }
    //         }
    //     });
    // }

    // // Function to adjust color brightness for multi-dataset charts
    // function adjustColor(color, percent) {
    //     const num = parseInt(color.replace("#", ""), 16),
    //         amt = Math.round(2.55 * percent),
    //         R = (num >> 16) + amt,
    //         G = (num >> 8 & 0x00FF) + amt,
    //         B = (num & 0x0000FF) + amt;
    //     return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    // }

    // initialise packet counters 

    let packetsReceived = 0;
    let packetsDisplayed = 0;

    function sendXBeeTransmitRequest(writer, dest64, dest16, rfDataString) {
        // dest64: Array of 8 bytes
        // dest16: Array of 2 bytes
        // rfDataString: CSV string to send

        const FRAME_TYPE = 0x10;
        const FRAME_ID = 0x01;
        const BROADCAST_RADIUS = 0x00;
        const OPTIONS = 0x00;

        // Convert RF data string to bytes
        const rfDataBytes = new TextEncoder().encode(rfDataString);

        // Calculate length: 14 bytes header + RF data length
        const length = 14 + rfDataBytes.length;
        const lengthMSB = (length >> 8) & 0xFF;
        const lengthLSB = length & 0xFF;

        // Build frame
        const frame = [
            0x7E, // Start delimiter
            lengthMSB,
            lengthLSB,
            FRAME_TYPE,
            FRAME_ID,
            ...dest64,
            ...dest16,
            BROADCAST_RADIUS,
            OPTIONS,
            ...rfDataBytes
        ];

        // Calculate checksum
        const checksum = 0xFF - (frame.slice(3).reduce((sum, b) => sum + b, 0) & 0xFF);
        frame.push(checksum);

        // Send frame as Uint8Array
        writer.write(new Uint8Array(frame));
    }

    // arduino CLI
    class ArduinoCommandInterface {
        constructor() {
            this.port = null;
            this.writer = null;
            this.reader = null;
            this.userInput = document.getElementById('user-input');
            this.sendButton = document.getElementById('send-command');
            this.commandHistory = document.getElementById('command-history');
            this.quickCommands = document.querySelectorAll('.quick-commands .cmd-button');
            this.shouldAutoScroll = true;
            
            // add scroll event listener to detect manual scrolling
            this.commandHistory.addEventListener('scroll', () => {
                const isAtBottom = this.commandHistory.scrollHeight - this.commandHistory.clientHeight <= this.commandHistory.scrollTop + 1;
                this.shouldAutoScroll = isAtBottom;
            });
            
            this.initializeEventListeners();
        }

        initializeEventListeners() {
            this.userInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    const command = this.userInput.value.trim();
                    if (command) {
                        this.sendCommand(command);
                    }
                }
            });

            this.quickCommands.forEach(button => {
                button.addEventListener('click', () => {
                    if (button.classList.contains('toggle')) {
                        const currentState = button.getAttribute('data-state');
                        const newState = currentState === 'on' ? 'off' : 'on';
                        const command = newState === 'on' ? 
                            button.getAttribute('data-command-on') : 
                            button.getAttribute('data-command-off');
                        
                        button.setAttribute('data-state', newState);
                        button.textContent = button.textContent.replace(
                            currentState === 'on' ? 'ON' : 'OFF',
                            newState === 'on' ? 'ON' : 'OFF'
                        );
                        
                        this.sendCommand(command);
                    } else {
                        const command = button.dataset.command;
                        this.sendCommand(command);
                    }
                });
            });
        }

        async sendCommand(command) {
            if (!this.port || !this.writer) {
                this.addToHistory('Not connected to Arduino', 'error');
                return;
            }

            // Get current mission time
            // const missionTime = `${hrs.textContent}:${min.textContent}:${sec.textContent}`;
            // const teamId = "3101";
            // const packetCount = packetsReceived + 1;
            const csvCommand = `${command.toUpperCase()}`;

            // XBee destination address (your provided address)
            const dest64 = [0x00, 0x13, 0xA2, 0x00, 0x41, 0xA3, 0x8C, 0xD0];
            const dest16 = [0xFF, 0xFE]; // Unknown 16-bit address

            try {
                sendXBeeTransmitRequest(this.writer, dest64, dest16, csvCommand);
                this.lastSentCommand = csvCommand;
                this.addToHistory(`Sent (XBee API): ${csvCommand}`, 'sent');
            } catch (error) {
                console.error('Error sending command:', error);
                this.addToHistory(`Error sending command: ${error.message}`, 'error');
            }
        }

        addToHistory(message, type) {
            if (!this.commandHistory) return;
            
            const entry = document.createElement('div');
            entry.className = `command-entry ${type || 'info'}`;
            entry.textContent = message;
            
            this.commandHistory.appendChild(entry);
            
            if (this.shouldAutoScroll) {
                this.commandHistory.scrollTop = this.commandHistory.scrollHeight;
            }
        }
    }

    // refresh state indicators
    function updateStates(stateChar) {
        if (!stateChar) return;

        // map state characters to indices
        const stateMap = {
            'L': 0, // Launch
            'A': 1, // Ascent
            'P': 2, // Apogee
            'D': 3, // Descent
            'R': 4, // Released
            'E': 5  // End/Landed
        };

        const currentStateIndex = stateMap[stateChar];
        if (currentStateIndex === undefined) return;

        const states = document.querySelectorAll('.status');
        
        states.forEach((stateElement, index) => {
            if (index < currentStateIndex) {
                // past states are green
                stateElement.style.backgroundColor = 'var(--green-dot-color)';
                stateElement.style.boxShadow = '0 0 10px var(--green-dot-color)';
            } else if (index === currentStateIndex) {
                // current state is yellow
                stateElement.style.backgroundColor = 'var(--warning-color)';
                stateElement.style.boxShadow = '0 0 10px var(--warning-color)';
            } else if (index === states.length - 1) {
                // last state (Landed) is blue when not active
                stateElement.style.backgroundColor = 'var(--wait-color)';
                stateElement.style.boxShadow = '0 0 10px var(--wait-color)';
            } else {
                // future states (except last) are red
                stateElement.style.backgroundColor = 'var(--red-dot-color)';
                stateElement.style.boxShadow = '0 0 10px var(--red-dot-color)';
            }
        });
    }

    // processSerialData function to handle simulation mode
    function processSerialData(data) {
        // console.log("Raw payload received:", JSON.stringify(data));
        if (typeof data !== 'string') {
            console.error('Received non-string data:', data);
            return;
        }

        const trimmedData = data.trim();
        if (trimmedData === this.lastSentCommand) {
            console.log('Echo detected, ignoring:', data);
            return;
        }

        // Ensure data is in CSV format
        if (!trimmedData.includes(',')) {
            console.warn('Received non-CSV data:', data);
            return;
        }

        // Log packet if logging is enabled
        if (trimmedData.includes(',')) {
            packetLogger.logPacket(trimmedData);
        }
        const values = data.trim().split(",");
        
        // Check if this is a command response (not telemetry data)
        if (data.includes('CMD') || data.includes('command') || data.includes('Error')) {
            // This is a command response, don't count it as a packet
            return;
        }
        
        // Increment received packets counter
        packetsReceived++;
        document.getElementById("packets-received").textContent = packetsReceived;
        
        // Check if we have all expected values (25 values in the new format)
        if (values.length < 25) {
            console.warn("Incomplete data received:", data);
            document.getElementById("packets-failed").textContent = packetsReceived - packetsDisplayed;
            return;
        }

        // Parse the packet fields
        const teamId = values[0];          // 3101
        const missionTime = values[1];     // HH:MM:SS format from telemetry
        const packetCount = values[2];     // Packet counter
        const mode = values[3];            // F
        const state = values[4];           // State character
        const altitude = parseFloat(values[5]);        // Altitude
        const temperature = parseFloat(values[6]);     // Temperature
        const pressure = parseFloat(values[7]);        // Pressure
        const voltage = parseFloat(values[8]);         // Voltage
        const gyroR = parseFloat(values[9]);          // Gyro Roll
        const gyroP = parseFloat(values[10]);         // Gyro Pitch
        const gyroY = parseFloat(values[11]);         // Gyro Yaw
        const accelR = parseFloat(values[12]);        // Accel Roll
        const accelP = parseFloat(values[13]);        // Accel Pitch
        const accelY = parseFloat(values[14]);        // Accel Yaw
        const magR = parseFloat(values[15]);          // Mag Roll
        const magP = parseFloat(values[16]);          // Mag Pitch
        const magY = parseFloat(values[17]);          // Mag Yaw
        const autoRotation = parseFloat(values[18]);   // Auto Gyro Rotation Rate
        const gpsTime = values[19];       // GPS Time
        const gpsAltitude = values[20];    // GPS Altitude
        const gpsLatitude = values[21];    // GPS Latitude
        const gpsLongitude = values[22];   // GPS Longitude
        const gpsSats = values[23];       // GPS Satellites

        // Update state indicator
        updateStates(state);

        // Update graphs with single values
        updateSingleGraph(chart1, temperature, missionTime);
        updateSingleGraph(chart2, altitude, missionTime);
        updateSingleGraph(chart3, pressure, missionTime);
        updateSingleGraph(chart4, autoRotation, missionTime);
        updateSingleGraph(chart5, voltage, missionTime);
        updateSingleGraph(chart9, gpsAltitude, missionTime);

        updateCombinedGraph(chart6, [gyroR, gyroP, gyroY], missionTime);
        updateCombinedGraph(chart7, [accelR, accelP, accelY], missionTime);
        updateCombinedGraph(chart8, [magR, magP, magY], missionTime);
        // Update map with GPS coordinates
        const lat = parseFloat(gpsLatitude);
        const lon = parseFloat(gpsLongitude);
        if (!isNaN(lat) && !isNaN(lon)) {
            updateMap(lat, lon);
        }

        // Update mission time display from telemetry data
        if (missionTime && missionTime.includes(':')) {
            const [hours, minutes, seconds] = missionTime.split(':');
            document.getElementById("hrs").textContent = hours.padStart(2, '0');
            document.getElementById("min").textContent = minutes.padStart(2, '0');
            document.getElementById("sec").textContent = seconds.padStart(2, '0');
        }

        // Update altitude display
        document.getElementById("altitude-display").textContent = altitude.toFixed(2);

        // Increment displayed packets counter
        packetsDisplayed++;
        document.getElementById("packets-displayed").textContent = packetsDisplayed;
        // Update failed packets
        document.getElementById("packets-failed").textContent = packetsReceived - packetsDisplayed;
    }

    function updateSingleGraph(chart, value, missionTime) {
        chart.data.labels.push(missionTime);
        chart.data.datasets[0].data.push(value);

        if (chart.data.labels.length > 50) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }

        chart.update();
    }

    function updateCombinedGraph(chart, values, missionTime) {
        chart.data.labels.push(missionTime);
        
        values.forEach((value, index) => {
            chart.data.datasets[index].data.push(value);
            
            if (chart.data.datasets[index].data.length > 50) {
                chart.data.datasets[index].data.shift();
            }
        });

        if (chart.data.labels.length > 50) {
            chart.data.labels.shift();
        }

        chart.update();
    }

    // function to update map theme
    function updateMapTheme(theme) {
        if (!map || !lightTileLayer || !darkTileLayer) return;

        try {
            // remove existing tile layers
            map.eachLayer((layer) => {
                if (layer instanceof L.TileLayer) {
                    map.removeLayer(layer);
                }
            });

            // use light tile layer for all themes
            lightTileLayer.addTo(map);

            // redraw any existing markers and polylines
            if (lineCoordinates.length > 0) {
                const lastCoord = lineCoordinates[lineCoordinates.length - 1];
                L.marker(lastCoord).addTo(map);

                if (lineCoordinates.length >= 2) {
                    let lineColor, lineWeight, lineOpacity;
                    
                    switch(theme) {
                        case 'panther':
                            lineColor = '#FFD700';
                            lineWeight = 3;
                            lineOpacity = 0.8;
                            break;
                        case 'dark':
                            lineColor = '#40E0D0';
                            lineWeight = 2;
                            lineOpacity = 1;
                            break;
                        default:
                            lineColor = '#3498db';
                            lineWeight = 2;
                            lineOpacity = 1;
                            break;
                    }
                    
                    L.polyline(lineCoordinates, { 
                        color: lineColor,
                        weight: lineWeight,
                        opacity: lineOpacity
                    }).addTo(map);
                }
            }

            // force map to update
            map.invalidateSize();
        } catch (error) {
            console.error('Error updating map theme:', error);
        }
    }

    // update map with new coordinates
    function updateMap(latitude, longitude) {
        document.getElementById("latitude-display").textContent = latitude.toFixed(6);
        document.getElementById("longitude-display").textContent = longitude.toFixed(6);

        lineCoordinates.push([latitude, longitude]);
        
        // clear existing markers and polylines
        map.eachLayer((layer) => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                map.removeLayer(layer);
            }
        });
        
        // add marker for current position
        L.marker([latitude, longitude]).addTo(map);

        // update polyline with theme-specific color
        if (lineCoordinates.length >= 2) {
            const currentTheme = document.body.getAttribute('data-theme');
            let lineColor, lineWeight, lineOpacity;
            
            switch(currentTheme) {
                case 'panther':
                    lineColor = '#FFD700';
                    lineWeight = 3;
                    lineOpacity = 0.8;
                    break;
                case 'dark':
                    lineColor = '#40E0D0';
                    lineWeight = 2;
                    lineOpacity = 1;
                    break;
                default:
                    lineColor = '#3498db';
                    lineWeight = 2;
                    lineOpacity = 1;
                    break;
            }
            
            L.polyline(lineCoordinates, { 
                color: lineColor,
                weight: lineWeight,
                opacity: lineOpacity
            }).addTo(map);
        }

        // only set view once when we receive the first coordinates
        if (lineCoordinates.length === 1) {
            map.setView([latitude, longitude], 13);  
        }
    }

    // theme switching functionality
    const themeToggle = document.querySelector('.theme-toggle');
    const body = document.body;
    
    // check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.setAttribute('data-theme', savedTheme);
        updateChartTheme(savedTheme);
    }
    
    // theme toggle handler
    themeToggle.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme') || 'dark';
        let newTheme;
        
        // cycle through themes: dark to light to panther to dark
        switch(currentTheme) {
            case 'dark':
                newTheme = 'light';
                break;
            case 'light':
                newTheme = 'panther';
                break;
            case 'panther':
            default:
                newTheme = 'dark';
                break;
        }
        
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateChartTheme(newTheme);
        updateMapTheme(newTheme);
    });
    
    // fn to update chart colors based on theme
    function updateChartTheme(theme) {
        const charts = [chart1, chart2, chart3, chart4, chart5, chart6, chart7, chart8, chart9];
        let gridColor, lineColor, textColor;
        
        switch(theme) {
            case 'light':
                gridColor = 'rgba(0, 0, 0, 0.1)';
                lineColor = '#3498db';  // Blue for light theme
                textColor = '#2c2c2c';  // Dark text for light theme
                break;
            case 'panther':
                gridColor = 'rgba(155, 107, 243, 0.2)';  // Purple for grid
                lineColor = '#FFD700';  // Gold for lines
                textColor = '#B4A7D6';  // Light purple for text
                break;
            case 'dark':
            default:
                gridColor = 'rgba(255, 255, 255, 0.1)';
                lineColor = '#40E0D0';  // Turquoise for lines
                textColor = '#ffffff';  // White for text
                break;
        }
        
        charts.forEach(chart => {
            // Update grid colors
            chart.options.scales.x.grid.color = gridColor;
            chart.options.scales.y.grid.color = gridColor;
            
            // Update text colors
            chart.options.scales.x.ticks.color = textColor;
            chart.options.scales.y.ticks.color = textColor;
            chart.options.plugins.legend.labels.color = textColor;
            chart.options.plugins.title.color = textColor;
            
            // Update line colors
            if (lineColor) {
                if (chart.data.datasets.length === 1) {
                    // Single dataset charts
                    chart.data.datasets[0].borderColor = lineColor;
                } else {
                    // Multi-dataset charts (Gyro, Accel, Mag)
                    chart.data.datasets[0].borderColor = '#FF0000';  // Red for X
                    chart.data.datasets[1].borderColor = '#00FF00';  // Green for Y
                    chart.data.datasets[2].borderColor = '#800080';  // Purple for Z
                }
            }
            
            chart.update();
        });
    }

    // ...existing code...

    let isConnected = false;
    let isProcessing = false;
    let currentReader = null;
    let currentWriter = null;
    let currentInputDone = null;
    let currentOutputDone = null;
    const powerButton = document.querySelector('.restart');
    let globalCmdInterface = new ArduinoCommandInterface();

    if (powerButton) {
        powerButton.addEventListener("click", async () => {
            if (isProcessing) return;
            isProcessing = true;

            try {
                if (!isConnected) {
                    const port = await navigator.serial.requestPort();
                    await port.open({ 
                        baudRate: 9600,
                        dataBits: 8,
                        stopBits: 1,
                        parity: 'none',
                        bufferSize: 1024, // Increased buffer size
                        flowControl: 'none'
                    });
                    
                    window.currentPort = port;

                    // Set up reader for raw bytes (not text)
                    const inputStream = port.readable;
                    currentReader = inputStream.getReader();

                    // Set up writer stream
                    // const encoder = new TextEncoderStream();
                    // currentOutputDone = encoder.readable.pipeTo(port.writable).catch(error => {
                    //     console.error('Error in write stream:', error);
                    //     handleDisconnect();
                    // });
                    // const outputStream = encoder.writable;
                    currentWriter = port.writable.getWriter();

                    console.log("Connected to XBee.");
                    powerButton.style.color = 'var(--green-dot-color)';
                    isConnected = true;

                    globalCmdInterface.port = port;
                    globalCmdInterface.writer = currentWriter;
                    globalCmdInterface.addToHistory("Connected to XBee", 'success');

                    // Start reading loop for XBee API frames
                    let buffer = new Uint8Array(0);
                    const BUFFER_MAX = 2048;
                    
                    while (isConnected) {
                        try {
                            const { value, done } = await currentReader.read();
                            if (done) break;
                            if (value) {
                                // console.log("Raw bytes received:", value);
                                // Concatenate new bytes to buffer
                                buffer = concatUint8Arrays(buffer, value);
                                // console.log("Buffer before parsing:", buffer);
                                // Only log expected frame length if we have at least 3 bytes
                                let offset = 0;
                                while (offset < buffer.length) {
                                    // Look for start delimiter
                                    if (buffer[offset] !== 0x7E) {
                                        offset++;
                                        continue;
                                    }
                                    // Only log expected frame length if we have at least 3 bytes
                                    if (offset + 3 > buffer.length) break; // Not enough for length
                                    const length = (buffer[offset + 1] << 8) | buffer[offset + 2];
                                    const expectedFrameLength = 3 + length + 1;
                                    // console.log("Buffer length:", buffer.length, "Expected frame length:", expectedFrameLength);
                                    if (offset + expectedFrameLength > buffer.length) break; // Wait for full frame

                                    const frame = buffer.slice(offset, offset + expectedFrameLength); // +1 for checksum
                                    const payload = parseXBeeApiFrame(frame);
                                    if (payload) {
                                        // console.log("Calling processSerialData with:", payload);
                                        processSerialData(payload);
                                        globalCmdInterface.addToHistory(`Received: ${payload}`, 'response');
                                    }
                                    offset += expectedFrameLength;
                                }
                                // Keep any leftover bytes for next read
                                buffer = buffer.slice(offset);

                                if (buffer.length > BUFFER_MAX) {
                                console.warn("Buffer exceeded max size without finding valid frame. Resyncing...");
                                buffer = new Uint8Array(0);
                                }
                            }
                        } catch (error) {
                            if (!isConnected) break;
                            console.error("Error reading from XBee:", error);
                            await handleDisconnect();
                            break;
                        }
                    }

                } else {
                    await handleDisconnect();
                }
            } catch (error) {
                console.error("Connection error:", error);
                await handleDisconnect();
            } finally {
                isProcessing = false;
            }
        });
    }

    // Helper to concatenate Uint8Arrays
    function concatUint8Arrays(a, b) {
        const c = new Uint8Array(a.length + b.length);
        c.set(a, 0);
        c.set(b, a.length);
        return c;
    }

    // Parse XBee API RX16 (0x81) frame and extract telemetry payload as CSV string
    function parseXBeeApiFrame(frame) {
        
    if (frame[0] !== 0x7E) return null;
    const length = (frame[1] << 8) | frame[2];
    if (frame.length < 3 + length + 1) return null; // incomplete

    const frameType = frame[3];
    let payloadStart, payloadEnd;
    if (frameType === 0x81) {
        payloadStart = 8;
        payloadEnd = 3 + length - 1;
    } else if (frameType === 0x90) {
        payloadStart = 15;
        payloadEnd = 3 + length - 1;
    } else if (frameType === 0x80) {
        payloadStart = 13;
        payloadEnd = 3 + length - 1;
    } else {
        console.warn("Unknown frame type:", frameType.toString(16));
        return null;
    }
    if (payloadEnd <= payloadStart) {
        console.warn("Payload end before start:", payloadStart, payloadEnd);
        return null;
    }
    const payloadBytes = frame.slice(payloadStart, payloadEnd);
    const payloadString = new TextDecoder().decode(payloadBytes).trim();
    // console.log("Parsed payload:", payloadString, "length:", payloadString.length);
    return payloadString;
}
// ...rest of your code...

    async function handleDisconnect() {
        console.log("Starting disconnect process...");
        
        // set flag first to stop the read loop
        isConnected = false;
        
        // stop any ongoing simulation
        if (isSimulationMode) {
            stopSimulation();
        }

        // clean up reader first
        if (currentReader) {
            try {
                console.log("Canceling reader...");
                await currentReader.cancel();
                console.log("Releasing reader lock...");
                await currentReader.releaseLock();
                currentReader = null;
                console.log("Reader cleanup complete");
            } catch (error) {
                console.error("Error cleaning up reader:", error);
            }
        }

        // clean up writer next
        if (currentWriter) {
            try {
                console.log("Closing writer...");
                await currentWriter.close();
                console.log("Releasing writer lock...");
                await currentWriter.releaseLock();
                currentWriter = null;
                globalCmdInterface.writer = null;
                console.log("Writer cleanup complete");
            } catch (error) {
                console.error("Error cleaning up writer:", error);
            }
        }

        // wait for streams to finish with timeout
        const streamCleanup = async () => {
            if (currentInputDone) {
                try {
                    console.log("Cleaning up input stream...");
                    await Promise.race([
                        currentInputDone.catch(() => {}),
                        new Promise(resolve => setTimeout(resolve, 1000))
                    ]);
                    currentInputDone = null;
                } catch (error) {
                    console.error("Error closing input stream:", error);
                }
            }

            if (currentOutputDone) {
                try {
                    console.log("Cleaning up output stream...");
                    await Promise.race([
                        currentOutputDone.catch(() => {}),
                        new Promise(resolve => setTimeout(resolve, 1000))
                    ]);
                    currentOutputDone = null;
                } catch (error) {
                    console.error("Error closing output stream:", error);
                }
            }
        };

        await streamCleanup();

        // close port last
        if (window.currentPort) {
            try {
                console.log("Closing port...");
                await window.currentPort.close();
                window.currentPort = null;
                console.log("Port closed successfully");
            } catch (error) {
                console.error("Error closing port:", error);
            }
        }

        // reset interface
        globalCmdInterface.port = null;
        powerButton.style.color = 'var(--warning-color)';
        globalCmdInterface.addToHistory("Disconnected from Arduino", 'error');
        
        // reset all displays
        resetDisplays();
        console.log("Disconnect process complete");
    }

    function resetDisplays() {
        // Reset charts
        [chart1, chart2, chart3, chart4, chart5, chart6, chart7, chart8, chart9].forEach(chart => {
            chart.data.labels = [];
            chart.data.datasets[0].data = [];
            chart.update();
        });

        // reset map
        lineCoordinates = [];
        if (map) {
            map.eachLayer((layer) => {
                if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                    map.removeLayer(layer);
                }
            });
            map.setView([0, 0], 2);
        }

        // reset displays
        document.getElementById("latitude-display").textContent = "00.00";
        document.getElementById("longitude-display").textContent = "00.00";
        
        // Reset packet counters
        packetsReceived = 0;
        packetsDisplayed = 0;
        document.getElementById("packets-received").textContent = "0";
        document.getElementById("packets-displayed").textContent = "0";
        document.getElementById("packets-failed").textContent = "0";

        // Reset states
        const states = document.querySelectorAll('.status');
        states.forEach(state => {
            state.style.backgroundColor = 'var(--red-dot-color)';
            state.style.boxShadow = '0 0 10px var(--red-dot-color)';
        });
    }

    let hrs = document.getElementById("hrs");
    let min = document.getElementById("min");
    let sec = document.getElementById("sec");

    // Initialize mission time display to 00:00:00
    hrs.textContent = "00";
    min.textContent = "00";
    sec.textContent = "00";


    // tis is the extra buttons class
    
    class PacketLogger {
        constructor() {
            this.packets = [];
            this.isLogging = false;
            this.startTime = null;
            
            this.downloadBtn = document.createElement('button');
            this.downloadBtn.className = 'cmd-button';
            this.downloadBtn.innerHTML = '<i class="fa-solid fa-download"></i> Download Log';
            this.downloadBtn.addEventListener('click', () => this.downloadLog());
            
            this.toggleBtn = document.createElement('button');
            this.toggleBtn.className = 'cmd-button toggle';
            this.toggleBtn.setAttribute('data-state', 'off');
            this.toggleBtn.innerHTML = '<i class="fa-solid fa-circle"></i> Logging OFF';
            this.toggleBtn.addEventListener('click', () => this.toggleLogging());

            this.uploadBtn = document.createElement('button');
            this.uploadBtn.className = 'cmd-button';
            this.uploadBtn.innerHTML = '<i class="fa-solid fa-upload"></i> Upload Log';
            this.uploadBtn.addEventListener('click', () => this.fileInput.click()); 

            //file input
            this.fileInput = document.createElement('input');
            this.fileInput.type = 'file';
            this.fileInput.accept = '.csv'; 
            this.fileInput.style.display = 'none'; 
            this.fileInput.addEventListener('change', (event) => this.handleFileUpload(event));

            
            const quickCommands = document.querySelector('.quick-commands');
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'command-row'; 
            buttonContainer.appendChild(this.toggleBtn);
            buttonContainer.appendChild(this.downloadBtn);
            buttonContainer.appendChild(this.uploadBtn);
            document.body.appendChild(this.fileInput); 
            quickCommands.appendChild(buttonContainer);
        }
        
        toggleLogging() {
            this.isLogging = !this.isLogging;
            this.toggleBtn.setAttribute('data-state', this.isLogging ? 'on' : 'off');
            this.toggleBtn.innerHTML = `<i class="fa-solid fa-circle"></i> Logging ${this.isLogging ? 'ON' : 'OFF'}`;
            
            if (this.isLogging) {
                this.startTime = new Date();
                this.packets = [];
                globalCmdInterface.addToHistory('Started packet logging', 'info');

            } else {
                globalCmdInterface.addToHistory('Stopped packet logging', 'info');
            }
        }
        
        logPacket(data) {
            if (!this.isLogging) return;
            console.log("Logging packet:", data);
            
            const timestamp = new Date().toISOString();
            const missionTime = `${hrs.textContent}:${min.textContent}:${sec.textContent}`;
            this.packets.push({
                data
            });
        }
        
        downloadLog() {
            if (this.packets.length === 0) {
                globalCmdInterface.addToHistory('No packets to download', 'error');
                return;
            }
            
            const headers = ['Team ID','Mission Time', 'Packet Count', 'Mode', 'State',     
                            'Altitude', 'Temperature', 'Pressure', 'Voltage', 'Gyro Roll', 'Gyro Pitch', 
                            'Gyro Yaw', 'Accel Roll', 'Accel Pitch', 'Accel Yaw', 'Mag Roll', 'Mag Pitch', 
                            'Mag Yaw', 'Auto Rotation', 'GPS Time','GPS Altitude', 'GPS Latitude', 'GPS Longitude', 
                            'GPS Satellites', 'Command Status'];
            
            let csvContent = headers.join(',') + '\n';
            
            this.packets.forEach(packet => {
                const values = packet.data.split(',');
                const row = [
                    ...values
                ];
                csvContent += row.join(',') + '\n';
            });
            
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', `telemetry_log_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            globalCmdInterface.addToHistory(`Downloaded ${this.packets.length} packets`, 'success');
        }

        handleFileUpload(event) {
            const file = event.target.files[0];
            if (!file) {
                globalCmdInterface.addToHistory('No file selected.', 'warning');
                return;
            }

            const reader = new FileReader();

            reader.onload = (e) => {
                const content = e.target.result;
                this.parseCSV(content);
            };
            
            reader.onerror = () => {
                globalCmdInterface.addToHistory(`Error reading file: ${reader.error}`, 'error');
            };

            reader.readAsText(file);
        }

        // New method to parse the CSV content
        parseCSV(csvContent) {
            // Clear previous data
            this.telemetryData = [];
            
            const lines = csvContent.split('\n').filter(line => line.trim() !== ''); // Split by line and remove empty lines
            if (lines.length < 2) {
                globalCmdInterface.addToHistory('CSV file is empty or has no data rows.', 'error');
                return;
            }

            const headers = lines[0].trim().split(',').map(h => h.trim());
            
            // Find the index for each required column. This makes the code robust against column reordering.
            const requiredColumns = {
                altitude: headers.indexOf('Altitude'),
                temperature: headers.indexOf('Temperature'),
                pressure: headers.indexOf('Pressure'),
                autoRotation: headers.indexOf('Auto Rotation'),
                voltage: headers.indexOf('Voltage'),
                gpsAltitude: headers.indexOf('GPS Altitude'),
                gyroRoll: headers.indexOf('Gyro Roll'),
                gyroPitch: headers.indexOf('Gyro Pitch'),
                gyroYaw: headers.indexOf('Gyro Yaw'),
                accelRoll: headers.indexOf('Accel Roll'),
                accelPitch: headers.indexOf('Accel Pitch'),
                accelYaw: headers.indexOf('Accel Yaw'),
                magRoll: headers.indexOf('Mag Roll'),
                magPitch: headers.indexOf('Mag Pitch'),
                magYaw: headers.indexOf('Mag Yaw')
            };
            
            // Check if all required headers are present
            for (const [key, index] of Object.entries(requiredColumns)) {
                if (index === -1) {
                    globalCmdInterface.addToHistory(`CSV missing required header: ${key.replace(/([A-Z])/g, ' $1').trim()}`, 'error');
                    return; // Stop processing if a header is missing
                }
            }

            // Process data rows (starting from the second line)
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].trim().split(',');
                
                const rowData = {
                    altitude: parseFloat(values[requiredColumns.altitude]),
                    temperature: parseFloat(values[requiredColumns.temperature]),
                    pressure: parseFloat(values[requiredColumns.pressure]),
                    autoRotation: parseFloat(values[requiredColumns.autoRotation]),
                    voltage: parseFloat(values[requiredColumns.voltage]),
                    gpsAltitude: parseFloat(values[requiredColumns.gpsAltitude]),
                    gyro: {
                        roll: parseFloat(values[requiredColumns.gyroRoll]),
                        pitch: parseFloat(values[requiredColumns.gyroPitch]),
                        yaw: parseFloat(values[requiredColumns.gyroYaw])
                    },
                    accel: {
                        roll: parseFloat(values[requiredColumns.accelRoll]),
                        pitch: parseFloat(values[requiredColumns.accelPitch]),
                        yaw: parseFloat(values[requiredColumns.accelYaw])
                    },
                    mag: {
                        roll: parseFloat(values[requiredColumns.magRoll]),
                        pitch: parseFloat(values[requiredColumns.magPitch]),
                        yaw: parseFloat(values[requiredColumns.magYaw])
                    }
                };
                this.telemetryData.push(rowData);
            }
            
            globalCmdInterface.addToHistory(`Successfully parsed ${this.telemetryData.length} data rows from the log.`, 'success');
            
            // For now, we'll just log it to the console. You can use this data to feed into your charts.
            console.log("Parsed Telemetry Data:", this.telemetryData);
            this.plotTelemetry();
        }

        plotTelemetry() {
            if (!this.telemetryData || this.telemetryData.length === 0) return;
            
            
            
            const charts = [
                chart1, chart2, chart3,
                chart4, chart5, chart6,
                chart7, chart8, chart9
            ];
            
            charts.forEach(chart => {
                chart.data.labels = [];
                chart.data.datasets.forEach(dataset => dataset.data = []);
                chart.update();
            });
            
            this.telemetryData.forEach((row, index) => {
                const x = index; // or use Mission Time if you want real timestamps

                // match charts to telemetry fields
                chart1.data.labels.push(x);
                chart1.data.datasets[0].data.push(row.temperature);

                chart2.data.labels.push(x);
                chart2.data.datasets[0].data.push(row.altitude);

                chart3.data.labels.push(x);
                chart3.data.datasets[0].data.push(row.pressure);

                chart4.data.labels.push(x);
                chart4.data.datasets[0].data.push(row.autoRotation);

                chart5.data.labels.push(x);
                chart5.data.datasets[0].data.push(row.voltage);

               chart6.data.labels.push(x);
               chart6.data.datasets[0].data.push(row.gyro.roll);
               chart6.data.datasets[1].data.push(row.gyro.pitch);
               chart6.data.datasets[2].data.push(row.gyro.yaw);
               
               chart7.data.labels.push(x);
               chart7.data.datasets[0].data.push(row.accel.roll);
               chart7.data.datasets[1].data.push(row.accel.pitch);
               chart7.data.datasets[2].data.push(row.accel.yaw);

                chart8.data.labels.push(x);
                chart8.data.datasets[0].data.push(row.mag.roll);
                chart8.data.datasets[1].data.push(row.mag.pitch);
                chart8.data.datasets[2].data.push(row.mag.yaw);

                chart9.data.labels.push(x);
                chart9.data.datasets[0].data.push(row.gpsAltitude);
            });

            charts.forEach(chart => {
                chart.update();
            });
        }

    } 

    const packetLogger = new PacketLogger();
});



