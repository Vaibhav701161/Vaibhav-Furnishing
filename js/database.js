/**
 * Database management utility for local storage
 */
class Database {
    constructor() {
        this.initializeDatabase();
    }

    /**
     * Initialize database with default values if it doesn't exist
     */
    initializeDatabase() {
        try {
            console.log('Initializing database...');
            
            // Test localStorage availability
            const testKey = '_test_' + Math.random();
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            
            // Check if each required storage key exists and create if not
            const storageKeys = DB_CONFIG.storageKeys;
            
            for (const key in storageKeys) {
                const storageKey = storageKeys[key];
                // Only create if the key doesn't exist at all
                if (!localStorage.getItem(storageKey)) {
                    console.log(`Creating storage for ${key} with key ${storageKey}`);
                    localStorage.setItem(storageKey, JSON.stringify([]));
                } else {
                    console.log(`Storage for ${key} already exists - preserving data`);
                }
            }
            
            console.log('Database initialized successfully - existing data preserved');
        } catch (error) {
            console.error('Error initializing database:', error);
            alert('Failed to initialize database. LocalStorage may be disabled in your browser. Please enable it to use this application.');
        }
    }

    /**
     * Get all products from database
     * @returns {Array} Array of products
     */
    getProducts() {
        try {
            console.log('Retrieving products from localStorage');
            const productsJson = localStorage.getItem(DB_CONFIG.storageKeys.products);
            
            if (!productsJson) {
                console.warn('No products found in localStorage');
                return [];
            }
            
            const products = safeJsonParse(productsJson, []);
            
            if (!Array.isArray(products)) {
                console.error('Products data is not an array, resetting to empty array');
                localStorage.setItem(DB_CONFIG.storageKeys.products, JSON.stringify([]));
                return [];
            }
            
            console.log(`Retrieved ${products.length} products from localStorage`);
            return products;
        } catch (error) {
            console.error('Error getting products from localStorage:', error);
            alert('Error accessing product data. LocalStorage may be blocked or corrupted.');
            return [];
        }
    }

    /**
     * Get a product by ID
     * @param {string} id - Product ID
     * @returns {Object|null} Product object or null if not found
     */
    getProductById(id) {
        const products = this.getProducts();
        return products.find(product => product.id === id) || null;
    }

    /**
     * Add a new product
     * @param {Object} product - Product object
     * @returns {Object} Added product with generated ID
     */
    addProduct(product) {
        try {
            const products = this.getProducts();
            
            // Generate unique ID
            product.id = generateUniqueId();
            
            // Ensure numeric values are stored as numbers
            product.stock = parseInt(product.stock) || 0;
            product.sellingPrice = parseFloat(product.sellingPrice) || 0;
            product.purchasePrice = parseFloat(product.purchasePrice) || 0;
            
            products.push(product);
            localStorage.setItem(DB_CONFIG.storageKeys.products, JSON.stringify(products));
            
            return product;
        } catch (error) {
            console.error('Error adding product to database:', error);
            throw new Error('Failed to add product to database');
        }
    }

    /**
     * Update an existing product
     * @param {string} id - Product ID
     * @param {Object} updatedProduct - Updated product data
     * @returns {Object|null} Updated product or null if not found
     */
    updateProduct(id, updatedProduct) {
        try {
            const products = this.getProducts();
            const index = products.findIndex(product => product.id === id);
            
            if (index === -1) return null;
            
            // Keep the original ID
            updatedProduct.id = id;
            
            // Ensure numeric values are stored as numbers
            updatedProduct.stock = parseInt(updatedProduct.stock) || 0;
            updatedProduct.sellingPrice = parseFloat(updatedProduct.sellingPrice) || 0;
            updatedProduct.purchasePrice = parseFloat(updatedProduct.purchasePrice) || 0;
            
            products[index] = updatedProduct;
            
            localStorage.setItem(DB_CONFIG.storageKeys.products, JSON.stringify(products));
            return updatedProduct;
        } catch (error) {
            console.error('Error updating product in database:', error);
            throw new Error('Failed to update product in database');
        }
    }

    /**
     * Delete a product
     * @param {string} id - Product ID
     * @returns {boolean} Success status
     */
    deleteProduct(id) {
        const products = this.getProducts();
        const filteredProducts = products.filter(product => product.id !== id);
        
        if (filteredProducts.length === products.length) return false;
        
        localStorage.setItem(DB_CONFIG.storageKeys.products, JSON.stringify(filteredProducts));
        return true;
    }

    /**
     * Update product stock
     * @param {string} id - Product ID
     * @param {number} quantity - Quantity to subtract from stock
     * @returns {boolean} Success status
     */
    updateProductStock(id, quantity) {
        const product = this.getProductById(id);
        
        if (!product) return false;
        
        // Ensure we're not trying to remove more than available
        if (product.stock < quantity) return false;
        
        product.stock -= quantity;
        
        return this.updateProduct(id, product) !== null;
    }

    /**
     * Get all sales from database
     * @returns {Array} Array of sales
     */
    getSales() {
        return safeJsonParse(localStorage.getItem(DB_CONFIG.storageKeys.sales), []);
    }

    /**
     * Get a sale by ID
     * @param {string} id - Sale ID
     * @returns {Object|null} Sale object or null if not found
     */
    getSaleById(id) {
        const sales = this.getSales();
        return sales.find(sale => sale.id === id) || null;
    }

    /**
     * Add a new sale
     * @param {Object} sale - Sale object
     * @returns {Object} Added sale with generated ID
     */
    addSale(sale) {
        const sales = this.getSales();
        
        // Generate unique ID and add timestamp if not provided
        sale.id = generateUniqueId();
        
        if (!sale.date) {
            sale.date = getCurrentISODate();
        }
        
        // Update product stock
        if (!this.updateProductStock(sale.productId, sale.quantity)) {
            throw new Error('Failed to update product stock. Insufficient quantity.');
        }
        
        sales.push(sale);
        localStorage.setItem(DB_CONFIG.storageKeys.sales, JSON.stringify(sales));
        
        return sale;
    }

    /**
     * Delete a sale
     * @param {string} id - Sale ID
     * @returns {boolean} Success status
     */
    deleteSale(id) {
        const sales = this.getSales();
        const filteredSales = sales.filter(sale => sale.id !== id);
        
        if (filteredSales.length === sales.length) return false;
        
        localStorage.setItem(DB_CONFIG.storageKeys.sales, JSON.stringify(filteredSales));
        return true;
    }

    /**
     * Get sales for a specific date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Array} Filtered sales
     */
    getSalesByDateRange(startDate, endDate) {
        const sales = this.getSales();
        
        return sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= startDate && saleDate <= endDate;
        });
    }

    /**
     * Get sales for today
     * @returns {Array} Today's sales
     */
    getTodaySales() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return this.getSalesByDateRange(today, tomorrow);
    }

    /**
     * Get sales for current week
     * @returns {Array} This week's sales
     */
    getWeeklySales() {
        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7); // End of week (next Sunday)
        
        return this.getSalesByDateRange(startOfWeek, endOfWeek);
    }

    /**
     * Get sales for current month
     * @returns {Array} This month's sales
     */
    getMonthlySales() {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);
        
        return this.getSalesByDateRange(startOfMonth, endOfMonth);
    }

    /**
     * Get sales for current year
     * @returns {Array} This year's sales
     */
    getYearlySales() {
        const today = new Date();
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        
        const endOfYear = new Date(today.getFullYear(), 11, 31);
        endOfYear.setHours(23, 59, 59, 999);
        
        return this.getSalesByDateRange(startOfYear, endOfYear);
    }

    /**
     * Get all expenses from database
     * @returns {Array} Array of expenses
     */
    getExpenses() {
        return safeJsonParse(localStorage.getItem(DB_CONFIG.storageKeys.expenses), []);
    }

    /**
     * Add a new expense
     * @param {Object} expense - Expense object
     * @returns {Object} Added expense with generated ID
     */
    addExpense(expense) {
        const expenses = this.getExpenses();
        
        // Generate unique ID and add timestamp if not provided
        expense.id = generateUniqueId();
        
        if (!expense.date) {
            expense.date = getCurrentISODate();
        }
        
        expenses.push(expense);
        localStorage.setItem(DB_CONFIG.storageKeys.expenses, JSON.stringify(expenses));
        
        return expense;
    }

    /**
     * Get expenses for a specific date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Array} Filtered expenses
     */
    getExpensesByDateRange(startDate, endDate) {
        const expenses = this.getExpenses();
        
        return expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= startDate && expenseDate <= endDate;
        });
    }

    /**
     * Calculate profit for a date range
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @returns {Object} Profit calculation
     */
    calculateProfit(startDate, endDate) {
        const sales = this.getSalesByDateRange(startDate, endDate);
        const expenses = this.getExpensesByDateRange(startDate, endDate);
        
        let totalSales = 0;
        let totalCost = 0;
        
        // Calculate sales revenue and product costs
        for (const sale of sales) {
            const product = this.getProductById(sale.productId);
            
            if (product) {
                totalSales += sale.price * sale.quantity;
                totalCost += product.purchasePrice * sale.quantity;
            }
        }
        
        // Add other expenses
        let totalExpenses = 0;
        for (const expense of expenses) {
            totalExpenses += expense.amount;
        }
        
        const profit = totalSales - totalCost - totalExpenses;
        
        return {
            totalSales,
            totalCost,
            totalExpenses,
            profit
        };
    }

    /**
     * Get products with low stock
     * @param {number} threshold - Low stock threshold
     * @returns {Array} Products with stock below threshold
     */
    getLowStockProducts(threshold = DB_CONFIG.lowStockThreshold) {
        const products = this.getProducts();
        return products.filter(product => product.stock <= threshold);
    }

    /**
     * Clear all data in the database
     * Can be called when needed to start with a clean slate
     * @returns {boolean} Success status
     */
    clearAllData() {
        try {
            console.log('Clearing all data from database...');
            
            // Clear all storage keys
            const storageKeys = DB_CONFIG.storageKeys;
            
            for (const key in storageKeys) {
                const storageKey = storageKeys[key];
                localStorage.setItem(storageKey, JSON.stringify([]));
                console.log(`Cleared data for ${key}`);
            }
            
            console.log('All data cleared successfully');
            return true;
        } catch (error) {
            console.error('Error clearing database:', error);
            return false;
        }
    }
}

/**
 * Check if database is properly initialized
 * @returns {boolean} True if database is initialized, false otherwise
 */
function isDatabaseInitialized() {
    try {
        // Check if each required storage key exists
        const storageKeys = DB_CONFIG.storageKeys;
        
        for (const key in storageKeys) {
            const storageKey = storageKeys[key];
            if (!localStorage.getItem(storageKey)) {
                console.error(`Database not initialized: ${key} storage key missing`);
                return false;
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error checking database initialization:', error);
        return false;
    }
}

// Create a singleton instance
const db = new Database(); 