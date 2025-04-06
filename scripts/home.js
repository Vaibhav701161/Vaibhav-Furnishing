document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const adminProfile = document.getElementById('admin-profile');
    const totalProductsElement = document.getElementById('total-products');
    const todaySalesElement = document.getElementById('today-sales');
    const totalCustomersElement = document.getElementById('total-customers');
    const lowStockElement = document.getElementById('low-stock');
    const productsChangeElement = document.getElementById('products-change');
    const salesChangeElement = document.getElementById('sales-change');
    const customersChangeElement = document.getElementById('customers-change');
    const stockChangeElement = document.getElementById('stock-change');
    const downloadReportBtn = document.getElementById('download-report');
    const viewAllActivitiesBtn = document.getElementById('view-all-activities');
    const activitiesContainer = document.getElementById('activities-container');
    const currentDateElement = document.getElementById('current-date');
    const chartPeriodButtons = document.querySelectorAll('.chart-actions button[data-period]');
    const chartMetricButtons = document.querySelectorAll('.chart-actions button[data-metric]');

    // State
    let products = window.utils.getProducts() || [];
    let sales = window.utils.getSales() || [];
    let currentPeriod = 'month';
    let currentMetric = 'sales';
    let salesChart = null;
    let categoriesChart = null;

    // Initialize
    updateDateTime();
    updateDashboardStats();
    initializeCharts();
    loadRecentActivities();

    // Set up auto-refresh of dashboard data (every 5 minutes)
    setInterval(updateDashboardStats, 5 * 60 * 1000);

    // User Profile Dropdown
    adminProfile.addEventListener('click', function() {
        this.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!adminProfile.contains(event.target)) {
            adminProfile.classList.remove('active');
        }
    });

    // Chart Period Buttons
    chartPeriodButtons.forEach(button => {
        button.addEventListener('click', function() {
            const period = this.dataset.period;
            setActivePeriod(period);
            updateSalesChart(period);
        });
    });

    // Chart Metric Buttons
    chartMetricButtons.forEach(button => {
        button.addEventListener('click', function() {
            const metric = this.dataset.metric;
            setActiveMetric(metric);
            updateCategoriesChart(metric);
        });
    });

    // Download Report Button
    downloadReportBtn.addEventListener('click', downloadDashboardReport);

    // View All Activities Button
    viewAllActivitiesBtn.addEventListener('click', function() {
        // Load all activities instead of just recent ones
        loadAllActivities();
    });

    // Functions
    function updateDateTime() {
        if (currentDateElement) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const today = new Date().toLocaleDateString('en-US', options);
            currentDateElement.textContent = `Welcome to Vaibhav Furnishing • ${today}`;
        }
    }

    function updateDashboardStats() {
        // Calculate statistics
        const totalProducts = products.length;
        const previousTotalProducts = totalProducts - 2; // Mocked previous value
        const productsChange = previousTotalProducts > 0 ? 
            Math.round(((totalProducts - previousTotalProducts) / previousTotalProducts) * 100) : 0;

        const todaySales = calculateTodaySales();
        const yesterdaySales = todaySales * 0.9; // Mocked previous value
        const salesChange = yesterdaySales > 0 ? 
            Math.round(((todaySales - yesterdaySales) / yesterdaySales) * 100) : 0;

        const uniqueCustomers = getUniqueCustomers();
        const previousCustomers = uniqueCustomers - 3; // Mocked previous value
        const customersChange = previousCustomers > 0 ? 
            Math.round(((uniqueCustomers - previousCustomers) / previousCustomers) * 100) : 0;

        const lowStockItems = getLowStockItems();
        const previousLowStock = lowStockItems - 1; // Mocked previous value
        const stockChange = previousLowStock > 0 ? 
            Math.round(((lowStockItems - previousLowStock) / previousLowStock) * 100) : 0;

        // Update UI
        totalProductsElement.textContent = totalProducts;
        todaySalesElement.textContent = `₹${todaySales.toFixed(2)}`;
        totalCustomersElement.textContent = uniqueCustomers;
        lowStockElement.textContent = lowStockItems;

        // Update change percentages
        productsChangeElement.textContent = `${productsChange}%`;
        salesChangeElement.textContent = `${salesChange}%`;
        customersChangeElement.textContent = `${customersChange}%`;
        stockChangeElement.textContent = `${stockChange}%`;

        // Update sales chart if initialized
        if (salesChart) {
            updateSalesChart(currentPeriod);
        }

        // Update categories chart if initialized
        if (categoriesChart) {
            updateCategoriesChart(currentMetric);
        }
    }

    function calculateTodaySales() {
        // Filter sales for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaySales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            saleDate.setHours(0, 0, 0, 0);
            return saleDate.getTime() === today.getTime();
        });

        // Calculate total sales amount
        return todaySales.reduce((total, sale) => total + sale.total, 0);
    }

    function getUniqueCustomers() {
        const uniqueCustomerIds = new Set();
        
        sales.forEach(sale => {
            if (sale.customer && sale.customer.phone) {
                uniqueCustomerIds.add(sale.customer.phone);
            }
        });
        
        return uniqueCustomerIds.size;
    }

    function getLowStockItems() {
        const LOW_STOCK_THRESHOLD = 5;
        return products.filter(product => product.quantity <= LOW_STOCK_THRESHOLD).length;
    }

    function setActivePeriod(period) {
        currentPeriod = period;
        chartPeriodButtons.forEach(button => {
            if (button.dataset.period === period) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    function setActiveMetric(metric) {
        currentMetric = metric;
        chartMetricButtons.forEach(button => {
            if (button.dataset.metric === metric) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    function initializeCharts() {
        // Initialize Sales Chart
        const salesChartCtx = document.getElementById('sales-chart').getContext('2d');
        salesChart = new Chart(salesChartCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Sales',
                    backgroundColor: 'rgba(74, 144, 226, 0.1)',
                    borderColor: '#4a90e2',
                    borderWidth: 2,
                    pointBackgroundColor: '#ffffff',
                    pointBorderColor: '#4a90e2',
                    pointRadius: 4,
                    tension: 0.4,
                    fill: true,
                    data: []
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `Sales: ₹${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '₹' + value;
                            }
                        }
                    }
                }
            }
        });

        // Initialize Categories Chart
        const categoriesChartCtx = document.getElementById('categories-chart').getContext('2d');
        categoriesChart = new Chart(categoriesChartCtx, {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#4a90e2', '#5c6ac4', '#34d399', '#fbbf24', '#ef4444', '#8b5cf6'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            boxWidth: 12,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${percentage}%`;
                            }
                        }
                    }
                }
            }
        });

        // Initial chart updates
        updateSalesChart('month');
        updateCategoriesChart('sales');
    }

    function updateSalesChart(period) {
        let labels = [];
        let data = [];

        switch (period) {
            case 'week':
                // Generate data for last 7 days
                const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const today = new Date();
                for (let i = 6; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(today.getDate() - i);
                    labels.push(weekDays[date.getDay()]);
                    
                    // Mock data or calculate from sales
                    data.push(Math.floor(Math.random() * 5000) + 1000);
                }
                break;
                
            case 'month':
                // Generate data for current month
                const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                for (let i = 1; i <= daysInMonth; i++) {
                    labels.push(i);
                    
                    // Mock data or calculate from sales
                    data.push(Math.floor(Math.random() * 5000) + 1000);
                }
                break;
                
            case 'year':
                // Generate data for 12 months
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                for (let i = 0; i < 12; i++) {
                    labels.push(months[i]);
                    
                    // Mock data or calculate from sales
                    data.push(Math.floor(Math.random() * 50000) + 10000);
                }
                break;
        }

        // Update chart data
        salesChart.data.labels = labels;
        salesChart.data.datasets[0].data = data;
        salesChart.update();
    }

    function updateCategoriesChart(metric) {
        // Get unique categories
        const categories = [...new Set(products.map(product => product.category))];
        let data = [];

        if (metric === 'sales') {
            // Calculate sales by category
            categories.forEach(category => {
                const categorySales = sales.reduce((total, sale) => {
                    if (sale.product && sale.product.category === category) {
                        return total + sale.total;
                    }
                    return total;
                }, 0);
                
                // If no sales data, use mock data
                data.push(categorySales > 0 ? categorySales : Math.floor(Math.random() * 20000) + 5000);
            });
        } else {
            // Calculate stock by category
            categories.forEach(category => {
                const categoryStock = products
                    .filter(product => product.category === category)
                    .reduce((total, product) => total + product.quantity, 0);
                
                data.push(categoryStock);
            });
        }

        // Update chart data
        categoriesChart.data.labels = categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1));
        categoriesChart.data.datasets[0].data = data;
        categoriesChart.update();
    }

    function loadRecentActivities() {
        // Combine product and sales activities
        const activities = [];

        // Add recent product additions
        products.slice(0, 3).forEach(product => {
            activities.push({
                type: 'product',
                title: `New Product Added: ${product.name}`,
                details: `Category: ${product.category}, Price: ₹${product.sellingPrice.toFixed(2)}`,
                icon: 'box',
                date: product.dateAdded || new Date().toISOString()
            });
        });

        // Add recent sales
        sales.slice(0, 3).forEach(sale => {
            activities.push({
                type: 'sale',
                title: `New Sale: ${sale.product.name}`,
                details: `Customer: ${sale.customer.name}, Amount: ₹${sale.total.toFixed(2)}`,
                icon: 'tag',
                date: sale.date
            });
        });

        // Add stock alerts
        products.filter(p => p.quantity <= 5).slice(0, 3).forEach(product => {
            activities.push({
                type: 'alert',
                title: `Low Stock Alert: ${product.name}`,
                details: `Only ${product.quantity} units remaining`,
                icon: 'exclamation-triangle',
                date: new Date().toISOString()
            });
        });

        // Sort activities by date
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Render activities
        renderActivities(activities.slice(0, 5));
    }

    function loadAllActivities() {
        // Here we would load more activities
        // For now, simulate with 10 activities
        const activities = [];

        // Add product activities
        products.forEach(product => {
            activities.push({
                type: 'product',
                title: `New Product Added: ${product.name}`,
                details: `Category: ${product.category}, Price: ₹${product.sellingPrice.toFixed(2)}`,
                icon: 'box',
                date: product.dateAdded || new Date().toISOString()
            });
        });

        // Add sales
        sales.forEach(sale => {
            activities.push({
                type: 'sale',
                title: `New Sale: ${sale.product.name}`,
                details: `Customer: ${sale.customer.name}, Amount: ₹${sale.total.toFixed(2)}`,
                icon: 'tag',
                date: sale.date
            });
        });

        // Add stock alerts
        products.filter(p => p.quantity <= 5).forEach(product => {
            activities.push({
                type: 'alert',
                title: `Low Stock Alert: ${product.name}`,
                details: `Only ${product.quantity} units remaining`,
                icon: 'exclamation-triangle',
                date: new Date().toISOString()
            });
        });

        // Sort activities by date
        activities.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Render activities
        renderActivities(activities.slice(0, 10));

        // Change button text
        viewAllActivitiesBtn.textContent = 'Show Less';
        viewAllActivitiesBtn.removeEventListener('click', loadAllActivities);
        viewAllActivitiesBtn.addEventListener('click', function() {
            loadRecentActivities();
            viewAllActivitiesBtn.textContent = 'View All';
            viewAllActivitiesBtn.removeEventListener('click', arguments.callee);
            viewAllActivitiesBtn.addEventListener('click', loadAllActivities);
        });
    }

    function renderActivities(activities) {
        if (activities.length === 0) {
            activitiesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No recent activities</p>
                </div>
            `;
            return;
        }

        activitiesContainer.innerHTML = activities.map(activity => {
            let iconColor = '';
            switch (activity.type) {
                case 'product':
                    iconColor = 'var(--primary-color)';
                    break;
                case 'sale':
                    iconColor = 'var(--success-color)';
                    break;
                case 'alert':
                    iconColor = 'var(--danger-color)';
                    break;
            }

            const activityDate = new Date(activity.date);
            const formattedDate = activityDate.toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short'
            });
            const formattedTime = activityDate.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });

            return `
                <div class="activity-item">
                    <div class="activity-icon" style="color: ${iconColor}">
                        <i class="fas fa-${activity.icon}"></i>
                    </div>
                    <div class="activity-details">
                        <h4>${activity.title}</h4>
                        <p>${activity.details}</p>
                        <span class="activity-time">${formattedDate} at ${formattedTime}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    function downloadDashboardReport() {
        const report = {
            date: new Date().toISOString(),
            stats: {
                totalProducts: products.length,
                todaySales: calculateTodaySales(),
                totalCustomers: getUniqueCustomers(),
                lowStockItems: getLowStockItems()
            },
            products: products.map(product => ({
                id: product.id,
                name: product.name,
                category: product.category,
                sellingPrice: product.sellingPrice,
                costPrice: product.costPrice,
                minPrice: product.minPrice,
                quantity: product.quantity,
                value: product.sellingPrice * product.quantity
            })),
            recentSales: sales.slice(0, 10).map(sale => ({
                id: sale.id,
                date: sale.date,
                product: sale.product.name,
                customer: sale.customer.name,
                quantity: sale.quantity,
                total: sale.total
            }))
        };
        
        const reportString = JSON.stringify(report, null, 2);
        const blob = new Blob([reportString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        window.utils.showToast('Dashboard report downloaded successfully!', 'success');
    }

    // Generate some dummy data if no data exists
    function generateDummyData() {
        // Generate products if none exist
        if (products.length === 0) {
            const dummyProducts = [
                {
                    id: '1',
                    name: 'Luxury Curtains',
                    category: 'curtains',
                    sellingPrice: 4999.99,
                    costPrice: 2500.00,
                    minPrice: 3750.00,
                    quantity: 15,
                    image: 'https://images.unsplash.com/photo-1590725140246-20acddc1fb9c?w=800&auto=format&fit=crop&q=60',
                    description: 'Premium quality curtains for your living room.',
                    dateAdded: new Date().toISOString()
                },
                {
                    id: '2',
                    name: 'King Size Bedsheet',
                    category: 'bedsheets',
                    sellingPrice: 3499.99,
                    costPrice: 1800.00,
                    minPrice: 2650.00,
                    quantity: 8,
                    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&auto=format&fit=crop&q=60',
                    description: 'Premium cotton king size bedsheets with 2 pillow covers.',
                    dateAdded: new Date().toISOString()
                },
                {
                    id: '3',
                    name: 'Decorative Cushions (Set of 5)',
                    category: 'cushions',
                    sellingPrice: 1999.99,
                    costPrice: 1000.00,
                    minPrice: 1500.00,
                    quantity: 20,
                    image: 'https://images.unsplash.com/photo-1560833558-cf650ab68c7c?w=800&auto=format&fit=crop&q=60',
                    description: 'Set of 5 decorative cushions with premium filling.',
                    dateAdded: new Date().toISOString()
                },
                {
                    id: '4',
                    name: 'Coffee Table',
                    category: 'furniture',
                    sellingPrice: 12999.99,
                    costPrice: 7000.00,
                    minPrice: 10000.00,
                    quantity: 5,
                    image: 'https://images.unsplash.com/photo-1532499016263-f2c3e89de9cd?w=800&auto=format&fit=crop&q=60',
                    description: 'Elegant coffee table made from premium wood.',
                    dateAdded: new Date().toISOString()
                },
                {
                    id: '5',
                    name: 'Dining Chair (Set of 6)',
                    category: 'furniture',
                    sellingPrice: 24999.99,
                    costPrice: 15000.00,
                    minPrice: 20000.00,
                    quantity: 3,
                    image: 'https://images.unsplash.com/photo-1577140917170-285929fb55b7?w=800&auto=format&fit=crop&q=60',
                    description: 'Set of 6 dining chairs made from premium wood with comfortable seating.',
                    dateAdded: new Date().toISOString()
                },
                {
                    id: '6',
                    name: 'Designer Curtains',
                    category: 'curtains',
                    sellingPrice: 7999.99,
                    costPrice: 4000.00,
                    minPrice: 6000.00,
                    quantity: 2,
                    image: 'https://images.unsplash.com/photo-1580462766213-0814c3a2e9ba?w=800&auto=format&fit=crop&q=60',
                    description: 'Designer curtains for your bedroom with premium fabric.',
                    dateAdded: new Date().toISOString()
                }
            ];
            
            products = dummyProducts;
            window.utils.saveProducts(products);
        }

        // Generate sales if none exist
        if (sales.length === 0) {
            const dummySales = [
                {
                    id: '1',
                    date: new Date().toISOString(),
                    product: products[0],
                    quantity: 2,
                    finalPrice: products[0].sellingPrice * 0.9,
                    subtotal: products[0].sellingPrice * 2,
                    discount: products[0].sellingPrice * 0.1 * 2,
                    total: products[0].sellingPrice * 0.9 * 2,
                    customer: {
                        name: 'Rahul Sharma',
                        phone: '9876543210'
                    }
                },
                {
                    id: '2',
                    date: new Date().toISOString(),
                    product: products[1],
                    quantity: 1,
                    finalPrice: products[1].sellingPrice * 0.95,
                    subtotal: products[1].sellingPrice,
                    discount: products[1].sellingPrice * 0.05,
                    total: products[1].sellingPrice * 0.95,
                    customer: {
                        name: 'Priya Patel',
                        phone: '9876543211'
                    }
                },
                {
                    id: '3',
                    date: new Date().toISOString(),
                    product: products[2],
                    quantity: 3,
                    finalPrice: products[2].sellingPrice,
                    subtotal: products[2].sellingPrice * 3,
                    discount: 0,
                    total: products[2].sellingPrice * 3,
                    customer: {
                        name: 'Amit Singh',
                        phone: '9876543212'
                    }
                }
            ];
            
            sales = dummySales;
            window.utils.saveSales(sales);
        }

        window.utils.showToast('Sample data loaded for dashboard!', 'success');
        updateDashboardStats();
        loadRecentActivities();
    }
    
    // Initialize with dummy data if needed
    generateDummyData();
}); 