/**
 * Application Configuration
 * This file contains all configuration settings and constants for the application
 */

// Shop Information
const SHOP_CONFIG = {
    name: "Vaibhav Furnishings",
    currency: {
        code: "₹",
        locale: "en-IN"
    },
    copyright: {
        year: "2023",
        text: "All rights reserved"
    }
};

// Database Configuration
const DB_CONFIG = {
    storageKeys: {
        products: "products",
        sales: "sales",
        expenses: "expenses"
    },
    lowStockThreshold: 5
};

// Product Categories
const PRODUCT_CATEGORIES = [
    { id: "carpets", name: "Carpets" },
    { id: "cushions", name: "Cushions" },
    { id: "bedsheets", name: "Bedsheets" },
    { id: "curtains", name: "Curtains" }
];

// DOM Element IDs
const DOM_IDS = {
    // Main elements
    pageContent: "page-content",
    modal: "modal",
    modalBody: "modal-body",
    
    // Templates
    templates: {
        dashboard: "dashboard-template",
        inventory: "inventory-template",
        addProduct: "add-product-template",
        sales: "sales-template",
        addSale: "add-sale-template",
        showroom: "showroom-template",
        reports: "reports-template"
    },
    
    // Dashboard
    dashboard: {
        todaySales: "today-sales",
        weeklySales: "weekly-sales",
        monthlySales: "monthly-sales",
        yearlySales: "yearly-sales",
        recentSalesTable: "recent-sales-table",
        lowStockTable: "low-stock-table"
    },
    
    // Inventory
    inventory: {
        addProductBtn: "add-product-btn",
        categoryFilter: "category-filter",
        priceMin: "price-min",
        priceMax: "price-max",
        stockStatus: "stock-status",
        applyFilters: "apply-filters",
        resetFilters: "reset-filters",
        inventoryTable: "inventory-table"
    },
    
    // Product Form
    productForm: {
        form: "product-form",
        name: "product-name",
        category: "product-category",
        quality: "product-quality",
        stock: "product-stock",
        sellingPrice: "selling-price",
        purchasePrice: "purchase-price",
        cancelBtn: "cancel-add-product",
        debugBtn: "debug-form-btn",
        submitBtn: "add-product-submit"
    },
    
    // Sales
    sales: {
        newSaleBtn: "new-sale-btn",
        salesTable: "sales-table"
    },
    
    // Sale Form
    saleForm: {
        form: "sale-form",
        product: "sale-product",
        quantity: "sale-quantity",
        price: "sale-price",
        total: "sale-total",
        customerMobile: "customer-mobile",
        cancelBtn: "cancel-add-sale"
    },
    
    // Showroom
    showroom: {
        category: "showroom-category",
        priceMin: "showroom-price-min",
        priceMax: "showroom-price-max",
        quality: "showroom-quality",
        applyFilters: "apply-showroom-filters",
        resetFilters: "reset-showroom-filters",
        productsGrid: "showroom-products"
    },
    
    // Reports
    reports: {
        startDate: "start-date",
        endDate: "end-date",
        generateBtn: "generate-report",
        exportBtn: "export-csv",
        totalSales: "report-total-sales",
        itemsSold: "report-items-sold",
        profit: "report-profit",
        reportTable: "report-table"
    }
};

// CSS Classes
const CSS_CLASSES = {
    // Navigation
    navLink: "nav-link",
    active: "active",
    
    // Tables
    textCenter: "text-center",
    
    // Product Status
    inStock: "in-stock",
    lowStock: "low-stock",
    outOfStock: "out-of-stock",
    
    // Buttons
    primaryBtn: "primary-btn",
    secondaryBtn: "secondary-btn",
    dangerBtn: "danger-btn",
    actionBtn: "action-btn",
    deleteBtn: "delete-btn",
    
    // Form Actions
    formActions: "form-actions"
};

// Timing Configuration
const TIMING_CONFIG = {
    domUpdateDelay: 100,
    scrollDelay: 200
};

// WhatsApp Configuration
const WHATSAPP_CONFIG = {
    baseUrl: "https://wa.me/",
    invoiceTemplate: `*${SHOP_CONFIG.name}*
---------------------------
*INVOICE*
Date: {{date}}

*Product*: {{productName}}
*Quality*: {{productQuality}}
*Quantity*: {{quantity}}
*Price*: {{price}} each
*Total*: {{total}}

Thank you for your purchase!
Visit us again soon.`
}; 