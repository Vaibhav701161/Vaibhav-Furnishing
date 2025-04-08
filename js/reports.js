/**
 * Reports functionality
 */

// Current report data
let currentReportData = [];

/**
 * Load the reports page
 */
function loadReports() {
    // Load reports template
    const content = loadTemplate(DOM_IDS.templates.reports);
    
    // Clear page content and append reports
    document.getElementById(DOM_IDS.pageContent).innerHTML = '';
    document.getElementById(DOM_IDS.pageContent).appendChild(content);
    
    // Set default date range (current month)
    setDefaultDateRange();
    
    // Set up event listeners
    setupReportsEventListeners();
    
    // Generate initial report
    generateReport();
}

/**
 * Set default date range (current month)
 */
function setDefaultDateRange() {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const startDateInput = document.getElementById(DOM_IDS.reports.startDate);
    const endDateInput = document.getElementById(DOM_IDS.reports.endDate);
    
    startDateInput.value = formatDateForInput(startOfMonth);
    endDateInput.value = formatDateForInput(endOfMonth);
}

/**
 * Format date for input elements (YYYY-MM-DD)
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

/**
 * Set up event listeners for reports page
 */
function setupReportsEventListeners() {
    // Generate report button
    const generateReportBtn = document.getElementById(DOM_IDS.reports.generateBtn);
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateReport);
    }
    
    // Export CSV button
    const exportCsvBtn = document.getElementById(DOM_IDS.reports.exportBtn);
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', exportReportToCsv);
    }
}

/**
 * Generate report based on selected date range
 */
function generateReport() {
    try {
        // Get date range
        const startDateStr = document.getElementById(DOM_IDS.reports.startDate).value;
        const endDateStr = document.getElementById(DOM_IDS.reports.endDate).value;
        
        if (!startDateStr || !endDateStr) {
            alert('Please select both start and end dates');
            return;
        }
        
        // Parse dates
        const startDate = new Date(startDateStr);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(endDateStr);
        endDate.setHours(23, 59, 59, 999);
        
        // Validate date range
        if (startDate > endDate) {
            alert('Start date cannot be after end date');
            return;
        }
        
        // Get sales for the date range
        const sales = db.getSalesByDateRange(startDate, endDate);
        
        // Calculate profit
        const profitData = db.calculateProfit(startDate, endDate);
        
        // Update summary cards
        updateReportSummary(sales, profitData);
        
        // Prepare report data
        const reportData = prepareReportData(sales);
        
        // Store current report data for export
        currentReportData = reportData;
        
        // Load report table
        loadReportTable(reportData);
    } catch (error) {
        console.error('Error generating report:', error);
        alert('Failed to generate report: ' + error.message);
    }
}

/**
 * Update report summary cards with dynamic data
 * @param {Array} sales - Sales data
 * @param {Object} profitData - Profit calculation data
 */
function updateReportSummary(sales, profitData) {
    // Update total sales amount
    const totalSalesElement = document.getElementById(DOM_IDS.reports.totalSales);
    if (totalSalesElement) {
        totalSalesElement.textContent = formatCurrency(profitData.totalSales);
    }
    
    // Update total items sold
    const totalItemsSold = sales.reduce((total, sale) => total + sale.quantity, 0);
    const itemsSoldElement = document.getElementById(DOM_IDS.reports.itemsSold);
    if (itemsSoldElement) {
        itemsSoldElement.textContent = totalItemsSold;
    }
    
    // Update profit with color coding
    const profitElement = document.getElementById(DOM_IDS.reports.profit);
    if (profitElement) {
        profitElement.textContent = formatCurrency(profitData.profit);
        
        // Apply color based on profit value
        if (profitData.profit < 0) {
            profitElement.style.color = 'var(--danger-color)';
        } else {
            profitElement.style.color = 'var(--success-color)';
        }
    }
}

/**
 * Prepare report data from sales
 * @param {Array} sales - Sales data
 * @returns {Array} Formatted report data
 */
function prepareReportData(sales) {
    const reportData = [];
    
    sales.forEach(sale => {
        const product = db.getProductById(sale.productId);
        
        if (product) {
            const total = sale.price * sale.quantity;
            const cost = product.purchasePrice * sale.quantity;
            const profit = total - cost;
            
            // Find category name from ID
            const category = PRODUCT_CATEGORIES.find(cat => cat.id === product.category);
            const categoryName = category ? category.name : product.category;
            
            reportData.push({
                id: sale.id,
                date: sale.date,
                productId: sale.productId,
                productName: product.name,
                category: product.category,
                categoryName: categoryName,
                quantity: sale.quantity,
                price: sale.price,
                total: total,
                cost: cost,
                profit: profit
            });
        }
    });
    
    // Sort by date (newest first)
    return reportData.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Load report table with data
 * @param {Array} data - Report data
 */
function loadReportTable(data) {
    const reportTable = document.getElementById(DOM_IDS.reports.reportTable)?.querySelector('tbody');
    if (!reportTable) return;
    
    reportTable.innerHTML = '';
    
    if (data.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="7" class="${CSS_CLASSES.textCenter}">No sales data for the selected period</td>`;
        reportTable.appendChild(row);
        return;
    }
    
    // Add data to table
    data.forEach(item => {
        const row = document.createElement('tr');
        
        // Add profit class for styling
        const profitClass = item.profit < 0 ? 'negative-profit' : 'positive-profit';
        
        row.innerHTML = `
            <td>${formatDate(item.date)}</td>
            <td>${item.productName}</td>
            <td>${item.categoryName}</td>
            <td>${item.quantity}</td>
            <td>${formatCurrency(item.price)}</td>
            <td>${formatCurrency(item.total)}</td>
            <td class="${profitClass}">${formatCurrency(item.profit)}</td>
        `;
        
        reportTable.appendChild(row);
    });
}

/**
 * Export report to CSV
 */
function exportReportToCsv() {
    if (currentReportData.length === 0) {
        alert('No data to export');
        return;
    }
    
    // Format data for CSV
    const exportData = currentReportData.map(item => {
        return {
            Date: formatDate(item.date),
            Product: item.productName,
            Category: item.categoryName,
            Quantity: item.quantity,
            Price: item.price,
            Total: item.total,
            Profit: item.profit
        };
    });
    
    // Get date range for filename
    const startDate = document.getElementById(DOM_IDS.reports.startDate).value;
    const endDate = document.getElementById(DOM_IDS.reports.endDate).value;
    
    // Generate filename
    const filename = `sales_report_${startDate}_to_${endDate}.csv`;
    
    // Export
    exportToCsv(exportData, filename);
} 