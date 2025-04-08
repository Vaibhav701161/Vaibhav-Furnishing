/**
 * Main application script
 */

// DOM Elements
const pageContent = document.getElementById(DOM_IDS.pageContent);
const navLinks = document.querySelectorAll(`.${CSS_CLASSES.navLink}`);
const modal = document.getElementById(DOM_IDS.modal);
const modalBody = document.getElementById(DOM_IDS.modalBody);
const closeModal = document.querySelector('.close-modal');

// Current active page
let currentPage = 'dashboard';

/**
 * Run diagnostic checks for the application
 */
function runDiagnosticChecks() {
    console.log('Running diagnostic checks...');
    
    // Check if DB_CONFIG is properly defined
    if (!DB_CONFIG) {
        console.error('ERROR: DB_CONFIG is not defined');
    } else if (!DB_CONFIG.storageKeys) {
        console.error('ERROR: DB_CONFIG.storageKeys is not defined');
    } else {
        console.log('DB_CONFIG.storageKeys:', DB_CONFIG.storageKeys);
    }
    
    // Test localStorage availability
    try {
        const testKey = '_test_' + Math.random();
        localStorage.setItem(testKey, 'test');
        localStorage.removeItem(testKey);
        console.log('localStorage is available and working');
        
        // Check existing data
        for (const key in DB_CONFIG.storageKeys) {
            const storageKey = DB_CONFIG.storageKeys[key];
            try {
                const value = localStorage.getItem(storageKey);
                console.log(`localStorage["${storageKey}"] =`, value ? value.substring(0, 50) + '...' : 'null/empty');
            } catch (e) {
                console.error(`Error reading localStorage["${storageKey}"]:`, e);
            }
        }
    } catch (e) {
        console.error('localStorage test failed:', e);
    }
    
    console.log('Diagnostic checks completed');
}

/**
 * Initialize the application
 */
function initApp() {
    console.log('Initializing application...');
    
    // Show loading state
    if (pageContent) {
        pageContent.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>Loading application...</p>
            </div>
        `;
    }
    
    // Run diagnostic checks
    runDiagnosticChecks();
    
    // Initialize UI with config values
    initializeUI();
    
    // Ensure database is initialized
    if (!isDatabaseInitialized()) {
        console.log('Database not initialized, initializing now...');
        ensureEmptyDatabaseStructure();
    }
    
    // Set up navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.getAttribute('data-page');
            navigateTo(page);
        });
    });
    
    // Set up refresh all button
    const refreshAllBtn = document.getElementById('refresh-all-btn');
    if (refreshAllBtn) {
        refreshAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Refreshing app UI from existing data');
            refreshAllBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            
            try {
                refreshApp();
                console.log('App UI refresh completed successfully');
                refreshAllBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    refreshAllBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
                }, 2000);
            } catch (error) {
                console.error('Error during app UI refresh:', error);
                alert('Error refreshing application: ' + error.message);
                refreshAllBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
            }
        });
    }
    
    // Load initial page after ensuring database is ready
    setTimeout(() => {
        navigateTo('dashboard');
    }, 500);
}

/**
 * Initialize UI elements with configuration values
 */
function initializeUI() {
    try {
        // Set shop name
        const shopNameElement = document.getElementById('shop-name');
        if (shopNameElement) {
            shopNameElement.textContent = SHOP_CONFIG.name;
        }
        
        // Set copyright text
        const copyrightElement = document.getElementById('copyright-text');
        if (copyrightElement) {
            copyrightElement.textContent = `© ${SHOP_CONFIG.copyright.year} ${SHOP_CONFIG.name}. ${SHOP_CONFIG.copyright.text}`;
        }
        
        // Set document title
        document.title = `${SHOP_CONFIG.name} - Shop Management`;
        
        console.log('UI initialized with configuration values');
    } catch (error) {
        console.error('Error initializing UI:', error);
    }
}

/**
 * Navigate to a specific page
 * @param {string} page - Page name
 */
function navigateTo(page) {
    // Don't reload if already on this page
    if (page === currentPage) {
        console.log(`Already on page: ${page}`);
        return;
    }
    
    console.log(`Navigating to: ${page} from: ${currentPage}`);
    
    // Update active navigation link
    navLinks.forEach(link => {
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Update current page
    currentPage = page;
    
    // Load page content
    switch (page) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'inventory':
            loadInventory();
            break;
        case 'sales':
            loadSales();
            break;
        case 'showroom':
            loadShowroom(); // This now includes refreshing the data
            break;
        case 'reports':
            loadReports();
            break;
        default:
            loadDashboard();
    }
}

/**
 * Load page content from template
 * @param {string} templateId - ID of the template to load
 * @returns {DocumentFragment} Content fragment
 */
function loadTemplate(templateId) {
    try {
        console.log(`Loading template: ${templateId}`);
        
        const template = document.getElementById(templateId);
        if (!template) {
            console.error(`Template not found: ${templateId}`);
            return document.createDocumentFragment();
        }
        
        let content;
        if (template.content) {
            console.log(`Template ${templateId} found and has content`);
            content = template.content.cloneNode(true);
        } else {
            console.warn(`Template ${templateId} has no content property, using fallback`);
            
            // Fallback for older browsers that don't support template.content
            const fragment = document.createDocumentFragment();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = template.innerHTML;
            
            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }
            
            content = fragment;
        }
        
        // Apply dynamic content
        applyDynamicContent(content, templateId);
        
        return content;
    } catch (error) {
        console.error(`Error loading template ${templateId}:`, error);
        return document.createDocumentFragment();
    }
}

/**
 * Apply dynamic content to a template
 * @param {DocumentFragment} content - Template content
 * @param {string} templateId - Template ID for context
 */
function applyDynamicContent(content, templateId) {
    try {
        // Apply currency symbols
        const currencyElements = content.querySelectorAll('.currency-symbol');
        currencyElements.forEach(element => {
            element.textContent = SHOP_CONFIG.currency.code;
        });
        
        // Populate category selects based on template
        let categorySelect = null;
        
        // Inventory template
        if (templateId === DOM_IDS.templates.inventory) {
            categorySelect = content.querySelector(`#${DOM_IDS.inventory.categoryFilter}`);
        } 
        // Add product template
        else if (templateId === DOM_IDS.templates.addProduct) {
            categorySelect = content.querySelector(`#${DOM_IDS.productForm.category}`);
        } 
        // Showroom template
        else if (templateId === DOM_IDS.templates.showroom) {
            categorySelect = content.querySelector(`#${DOM_IDS.showroom.category}`);
        }
        
        // Populate found category select
        if (categorySelect) {
            populateCategoryOptions(categorySelect);
        }
        
    } catch (error) {
        console.error('Error applying dynamic content:', error);
    }
}

/**
 * Populate a select element with category options
 * @param {HTMLSelectElement} selectElement - Select element to populate
 * @param {boolean} keepExistingOptions - Whether to keep existing options
 */
function populateCategoryOptions(selectElement, keepExistingOptions = true) {
    try {
        if (!selectElement) return;
        
        // Clear existing options if specified
        if (!keepExistingOptions) {
            // Keep only the first option (typically "All Categories" or similar)
            while (selectElement.options.length > 1) {
                selectElement.remove(1);
            }
        } else {
            // Replace all options
            selectElement.innerHTML = '<option value="">All Categories</option>';
        }
        
        // Add category options from config
        PRODUCT_CATEGORIES.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            selectElement.appendChild(option);
        });
        
    } catch (error) {
        console.error('Error populating category options:', error);
    }
}

/**
 * Show modal with content
 * @param {HTMLElement} content - Content to show in modal
 */
function showModal(content) {
    try {
        console.log('Showing modal with content');
        
        if (!modalBody) {
            console.error('Modal body element not found');
            alert('Error: Modal element not found');
            return;
        }
        
        if (!content) {
            console.error('No content provided to modal');
            alert('Error: No content to display');
            return;
        }
        
        // Clear previous content
        modalBody.innerHTML = '';
        
        // Append new content
        modalBody.appendChild(content);
        
        // Show modal
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent scrolling
            console.log('Modal displayed successfully');
        } else {
            console.error('Modal element not found');
        }
    } catch (error) {
        console.error('Error showing modal:', error);
        alert('Failed to show modal: ' + error.message);
    }
}

/**
 * Close modal
 */
function closeModalBox() {
    try {
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = ''; // Restore scrolling
            console.log('Modal closed');
        } else {
            console.error('Modal element not found for closing');
        }
    } catch (error) {
        console.error('Error closing modal:', error);
    }
}

/**
 * Generate invoice for WhatsApp
 * @param {Object} sale - Sale object
 * @param {Object} product - Product object
 * @returns {string} Invoice text
 */
function generateInvoice(sale, product) {
    const total = (sale.price * sale.quantity).toFixed(2);

    // Dates
    const purchaseDate = new Date();
    const deliveryDate = new Date(purchaseDate);
    deliveryDate.setDate(purchaseDate.getDate() + 3); // estimated 3-day delivery

    const formatDate = (date) => date.toLocaleDateString('en-IN');

    // Shop Details
    const shopName = "Vaibhav Furnishing";
    const slogan = "Furnishing your home like ours.";
    const owner = "Atul Mittal";
    const contact = "8178464560, 9205014813";
    const address = "Jain Gali, Main Market, Baniya Wada, Rajender Parshad Vali Gali, Ballabgarh";

    // Thank-you Note
    const thankYouNote = "🙏 Thank you for shopping with us. We appreciate your trust and support. Looking forward to serving you again!";

    // Create formatted invoice string
    const invoiceText = `
🧾 *${shopName}*
_${slogan}_

🗓️ *Purchase Date:* ${formatDate(purchaseDate)}
🚚 *Estimated Delivery:* ${formatDate(deliveryDate)}

🛏️ *Product:* ${product.name}
✨ *Quality:* ${product.quality}
🔢 *Quantity:* ${sale.quantity}
💸 *Price:* ${formatCurrency(sale.price)}
📦 *Total:* ${formatCurrency(total)}

🧍‍♂️ *Seller:* ${owner}
📞 *Contact:* ${contact}
📍 *Address:* ${address}

🎁 *Special Offer:* Enjoy an extra 5% discount on your next purchase!

🔄 *Replacement Policy:* We offer a 5-day replacement policy.
After 5 days, the product will not be replaced under any circumstances.

${thankYouNote}
`;

    return invoiceText;
}


/**
 * Export data to CSV
 * @param {Array} data - Array of objects
 * @param {string} filename - Filename
 */
function exportToCsv(data, filename) {
    if (!data || !data.length) {
        alert('No data to export');
        return;
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create CSV content
    let csvContent = headers.join(',') + '\n';
    
    // Add data rows
    data.forEach(item => {
        const row = headers.map(header => {
            // Ensure values with commas are quoted
            let value = item[header] || '';
            if (typeof value === 'string' && value.includes(',')) {
                value = `"${value}"`;
            }
            return value;
        });
        
        csvContent += row.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Ensure database is properly initialized with empty arrays
 */
function ensureEmptyDatabaseStructure() {
    try {
        // Check if each required storage key exists and create if not
        const storageKeys = DB_CONFIG.storageKeys;
        
        for (const key in storageKeys) {
            const storageKey = storageKeys[key];
            
            // Only create storage if it doesn't exist yet
            if (!localStorage.getItem(storageKey)) {
                console.log(`Creating empty storage for ${key} with key ${storageKey}`);
                localStorage.setItem(storageKey, JSON.stringify([]));
            }
        }
        
        console.log('Database structure initialized - existing data preserved');
    } catch (error) {
        console.error('Error initializing database structure:', error);
    }
}

/**
 * Refresh the application state
 * This function can be called to refresh all dynamic content throughout the application
 */
function refreshApp() {
    console.log('Refreshing app state');
    
    // Refresh current page
    switch (currentPage) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'inventory':
            loadInventory();
            break;
        case 'sales':
            loadSales();
            break;
        case 'showroom':
            loadShowroom();
            break;
        case 'reports':
            loadReports();
            break;
    }
    
    console.log('App state refreshed for page:', currentPage);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initApp); 