/**
 * Dashboard functionality
 */

/**
 * Load the dashboard page
 */
function loadDashboard() {
    console.log('Loading dashboard page...');
    
    try {
        // Show loading state
        const pageContentElement = document.getElementById(DOM_IDS.pageContent);
        if (!pageContentElement) {
            throw new Error('Page content element not found');
        }
        
        pageContentElement.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        `;
        
        // Check if database is initialized
        if (!isDatabaseInitialized()) {
            console.error('Database not initialized, initializing now...');
            ensureEmptyDatabaseStructure();
        }
        
        // Load dashboard template with a slight delay to ensure database is ready
        setTimeout(() => {
            try {
                const content = loadTemplate(DOM_IDS.templates.dashboard);
                if (!content) {
                    throw new Error('Could not load dashboard template');
                }
                
                pageContentElement.innerHTML = '';
                pageContentElement.appendChild(content);
                console.log('Dashboard template loaded and appended to page');
                
                // Initialize dashboard data
                updateDashboardData();
                console.log('Dashboard data updated');
            } catch (error) {
                console.error('Error in dashboard delayed loading:', error);
                pageContentElement.innerHTML = `
                    <div class="error-container">
                        <i class="fas fa-exclamation-triangle"></i>
                        <p>Error loading dashboard: ${error.message}</p>
                        <button onclick="loadDashboard()" class="btn btn-primary">
                            <i class="fas fa-sync-alt"></i> Retry
                        </button>
                    </div>
                `;
            }
        }, 300);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        if (pageContentElement) {
            pageContentElement.innerHTML = `
                <div class="error-container">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading dashboard: ${error.message}</p>
                    <button onclick="loadDashboard()" class="btn btn-primary">
                        <i class="fas fa-sync-alt"></i> Retry
                    </button>
                </div>
            `;
        } else {
            alert('Failed to load dashboard: ' + error.message);
        }
    }
}

/**
 * Update dashboard data
 */
function updateDashboardData() {
    try {
        console.log('Updating dashboard data...');
        
        // Get sales data
        console.log('Getting sales data...');
        const todaySales = getTotalSalesAmount(db.getTodaySales());
        const weeklySales = getTotalSalesAmount(db.getWeeklySales());
        const monthlySales = getTotalSalesAmount(db.getMonthlySales());
        const yearlySales = getTotalSalesAmount(db.getYearlySales());
        
        console.log('Sales data retrieved:', {
            today: todaySales,
            weekly: weeklySales,
            monthly: monthlySales,
            yearly: yearlySales
        });
        
        // Update sales summary
        console.log('Updating sales summary...');
        updateSalesSummary(todaySales, weeklySales, monthlySales, yearlySales);
        
        // Update recent sales
        console.log('Updating recent sales...');
        updateRecentSales();
        
        // Update low stock products
        console.log('Updating low stock products...');
        updateLowStockProducts();
        
        console.log('Dashboard data update completed');
    } catch (error) {
        console.error('Error updating dashboard data:', error);
        alert('Error updating dashboard data: ' + error.message);
    }
}

/**
 * Calculate total sales amount from sales array
 * @param {Array} sales - Array of sales
 * @returns {number} - Total sales amount
 */
function getTotalSalesAmount(sales) {
    return sales.reduce((total, sale) => {
        return total + (sale.price * sale.quantity);
    }, 0);
}

/**
 * Update sales summary on dashboard
 * @param {number} todaySales - Today's sales total
 * @param {number} weeklySales - Weekly sales total
 * @param {number} monthlySales - Monthly sales total
 * @param {number} yearlySales - Yearly sales total
 */
function updateSalesSummary(todaySales, weeklySales, monthlySales, yearlySales) {
    const todaySalesElement = document.getElementById(DOM_IDS.dashboard.todaySales);
    const weeklySalesElement = document.getElementById(DOM_IDS.dashboard.weeklySales);
    const monthlySalesElement = document.getElementById(DOM_IDS.dashboard.monthlySales);
    const yearlySalesElement = document.getElementById(DOM_IDS.dashboard.yearlySales);
    
    if (todaySalesElement) todaySalesElement.textContent = formatCurrency(todaySales);
    if (weeklySalesElement) weeklySalesElement.textContent = formatCurrency(weeklySales);
    if (monthlySalesElement) monthlySalesElement.textContent = formatCurrency(monthlySales);
    if (yearlySalesElement) yearlySalesElement.textContent = formatCurrency(yearlySales);
}

/**
 * Update recent sales table
 */
function updateRecentSales() {
    const recentSalesTable = document.getElementById(DOM_IDS.dashboard.recentSalesTable)?.querySelector('tbody');
    if (!recentSalesTable) return;
    
    recentSalesTable.innerHTML = '';
    
    // Get all sales and sort by date (newest first)
    const sales = db.getSales().sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Show only the latest 5 sales
    const recentSales = sales.slice(0, 5);
    
    if (recentSales.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" class="${CSS_CLASSES.textCenter}">No sales recorded yet</td>`;
        recentSalesTable.appendChild(row);
        return;
    }
    
    // Add sales to table
    recentSales.forEach(sale => {
        const product = db.getProductById(sale.productId);
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDate(sale.date)}</td>
            <td>${product ? product.name : 'Unknown Product'}</td>
            <td>${sale.quantity}</td>
            <td>${formatCurrency(sale.price)}</td>
            <td>${sale.customerMobile}</td>
        `;
        
        recentSalesTable.appendChild(row);
    });
}

/**
 * Update low stock products table
 */
function updateLowStockProducts() {
    const lowStockTable = document.getElementById(DOM_IDS.dashboard.lowStockTable)?.querySelector('tbody');
    if (!lowStockTable) return;
    
    lowStockTable.innerHTML = '';
    
    // Get low stock products
    const lowStockProducts = db.getLowStockProducts();
    
    if (lowStockProducts.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="3" class="${CSS_CLASSES.textCenter}">No products with low stock</td>`;
        lowStockTable.appendChild(row);
        return;
    }
    
    // Add products to table
    lowStockProducts.forEach(product => {
        const row = document.createElement('tr');
        
        // Find category name from ID
        const category = PRODUCT_CATEGORIES.find(cat => cat.id === product.category);
        const categoryName = category ? category.name : product.category;
        
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${categoryName}</td>
            <td>${product.stock}</td>
        `;
        
        lowStockTable.appendChild(row);
    });
} 