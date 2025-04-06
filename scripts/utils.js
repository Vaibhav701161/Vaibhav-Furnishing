// Utility functions for the Vaibhav Furnishing Portal

window.utils = (function() {
    // Storage keys
    const PRODUCTS_KEY = 'vaibhav_furnishing_products';
    const SALES_KEY = 'vaibhav_furnishing_sales';
    const SETTINGS_KEY = 'vaibhav_furnishing_settings';

    // Get and save products
    function getProducts() {
        const products = localStorage.getItem(PRODUCTS_KEY);
        return products ? JSON.parse(products) : [];
    }

    function saveProducts(products) {
        localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
    }

    // Get and save sales
    function getSales() {
        const sales = localStorage.getItem(SALES_KEY);
        return sales ? JSON.parse(sales) : [];
    }

    function saveSales(sales) {
        localStorage.setItem(SALES_KEY, JSON.stringify(sales));
    }

    // Get and save settings
    function getSettings() {
        const settings = localStorage.getItem(SETTINGS_KEY);
        return settings ? JSON.parse(settings) : {
            taxRate: 18,
            currency: '₹',
            businessName: 'Vaibhav Furnishing',
            businessAddress: '123 Main Street, City, State, 123456',
            businessPhone: '+91 9876543210',
            businessEmail: 'info@vaibhavfurnishing.com'
        };
    }

    function saveSettings(settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }

    // Generate unique ID
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // Format currency
    function formatCurrency(amount) {
        const settings = getSettings();
        return `${settings.currency}${parseFloat(amount).toFixed(2)}`;
    }

    // Format date
    function formatDate(date) {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    }

    // Show toast notification
    function showToast(message, type = 'info') {
        const toastContainer = document.querySelector('.toast-container') || createToastContainer();
        const toast = createToast(message, type);
        toastContainer.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 5000);
    }

    function createToastContainer() {
        const container = document.createElement('div');
        container.classList.add('toast-container');
        document.body.appendChild(container);
        return container;
    }

    function createToast(message, type) {
        const toast = document.createElement('div');
        toast.classList.add('toast', `toast-${type}`);
        
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fas fa-${icon}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${getToastTitle(type)}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add close event
        toast.querySelector('.toast-close').addEventListener('click', function() {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
        
        return toast;
    }

    function getToastTitle(type) {
        switch (type) {
            case 'success': return 'Success';
            case 'error': return 'Error';
            case 'warning': return 'Warning';
            default: return 'Information';
        }
    }

    // Get product categories
    function getCategories() {
        const products = getProducts();
        const categoriesSet = new Set(products.map(product => product.category));
        return Array.from(categoriesSet);
    }

    // Calculate stock value
    function calculateStockValue() {
        const products = getProducts();
        return products.reduce((total, product) => {
            return total + (product.sellingPrice * product.quantity);
        }, 0);
    }

    // Calculate sales statistics
    function calculateSalesStats() {
        const sales = getSales();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todaySales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            saleDate.setHours(0, 0, 0, 0);
            return saleDate.getTime() === today.getTime();
        });
        
        const todayTotal = todaySales.reduce((total, sale) => total + sale.total, 0);
        
        // Get yesterday
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const yesterdaySales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            saleDate.setHours(0, 0, 0, 0);
            return saleDate.getTime() === yesterday.getTime();
        });
        
        const yesterdayTotal = yesterdaySales.reduce((total, sale) => total + sale.total, 0);
        
        // Get last 7 days
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weekSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= weekAgo && saleDate < today;
        });
        
        const weekTotal = weekSales.reduce((total, sale) => total + sale.total, 0);
        
        // Get month
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const monthSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= monthStart && saleDate <= today;
        });
        
        const monthTotal = monthSales.reduce((total, sale) => total + sale.total, 0);
        
        return {
            today: todayTotal,
            yesterday: yesterdayTotal,
            week: weekTotal,
            month: monthTotal,
            salesCount: sales.length,
            averageSale: sales.length ? (sales.reduce((total, sale) => total + sale.total, 0) / sales.length) : 0
        };
    }

    // Get low stock products
    function getLowStockProducts(threshold = 5) {
        const products = getProducts();
        return products.filter(product => product.quantity <= threshold);
    }

    // Get product by ID
    function getProductById(id) {
        const products = getProducts();
        return products.find(product => product.id === id);
    }

    // Update product quantity
    function updateProductQuantity(id, newQuantity) {
        const products = getProducts();
        const updatedProducts = products.map(product => {
            if (product.id === id) {
                return { ...product, quantity: newQuantity };
            }
            return product;
        });
        saveProducts(updatedProducts);
    }

    // Generate invoice number
    function generateInvoiceNumber() {
        const sales = getSales();
        const prefix = 'INV';
        const number = (sales.length + 1).toString().padStart(4, '0');
        return `${prefix}${number}`;
    }

    // Export to CSV
    function exportToCSV(data, filename) {
        if (!data || !data.length) {
            showToast('No data to export', 'error');
            return;
        }
        
        // Get headers
        const headers = Object.keys(data[0]);
        
        // Create CSV
        const csv = [
            headers.join(','),
            ...data.map(row => {
                return headers.map(header => {
                    const value = row[header];
                    
                    // If value contains comma or new line, wrap in quotes
                    if (typeof value === 'string' && (value.includes(',') || value.includes('\n'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    
                    return value;
                }).join(',');
            })
        ].join('\n');
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename || 'export.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    // Format time ago
    function timeAgo(date) {
        const now = new Date();
        const secondsPast = (now.getTime() - new Date(date).getTime()) / 1000;
        
        if (secondsPast < 60) {
            return 'just now';
        }
        if (secondsPast < 3600) {
            return `${Math.floor(secondsPast / 60)} minutes ago`;
        }
        if (secondsPast < 86400) {
            return `${Math.floor(secondsPast / 3600)} hours ago`;
        }
        if (secondsPast < 2592000) {
            return `${Math.floor(secondsPast / 86400)} days ago`;
        }
        if (secondsPast < 31536000) {
            return `${Math.floor(secondsPast / 2592000)} months ago`;
        }
        return `${Math.floor(secondsPast / 31536000)} years ago`;
    }

    // Return public functions
    return {
        getProducts,
        saveProducts,
        getSales,
        saveSales,
        getSettings,
        saveSettings,
        generateId,
        formatCurrency,
        formatDate,
        showToast,
        getCategories,
        calculateStockValue,
        calculateSalesStats,
        getLowStockProducts,
        getProductById,
        updateProductQuantity,
        generateInvoiceNumber,
        exportToCSV,
        debounce,
        timeAgo
    };
})(); 