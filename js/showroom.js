/**
 * Showroom functionality
 */

/**
 * Refresh showroom when navigating to the page
 * This ensures the showroom always shows the latest products
 */
function refreshShowroom() {
    console.log('Performing complete showroom refresh');
    
    try {
        // Verify DB_CONFIG is available
        if (!DB_CONFIG || !DB_CONFIG.storageKeys || !DB_CONFIG.storageKeys.products) {
            console.error('DB_CONFIG not properly defined', DB_CONFIG);
            alert('Configuration error. Please reload the page.');
            return;
        }
        
        // Access products using the correct storage key
        const productsJson = localStorage.getItem(DB_CONFIG.storageKeys.products);
        console.log('Current products in localStorage key:', DB_CONFIG.storageKeys.products);
        console.log('Products data:', productsJson ? `${productsJson.substring(0, 50)}...` : 'empty');
        
        // Reload quality options to reflect any new qualities added
        loadQualityOptions();
        
        // Reload all products with fresh data from localStorage
        loadShowroomProducts();
        
        // Let the user know refresh was completed
        const refreshBtn = document.getElementById('refresh-showroom');
        if (refreshBtn) {
            const originalText = refreshBtn.innerHTML;
            refreshBtn.innerHTML = '<i class="fas fa-check"></i> Refreshed!';
            refreshBtn.classList.add('success-btn');
            
            // Reset button after 2 seconds
            setTimeout(() => {
                refreshBtn.innerHTML = originalText;
                refreshBtn.classList.remove('success-btn');
            }, 2000);
        }
        
        console.log('Showroom refreshed successfully');
    } catch (error) {
        console.error('Error refreshing showroom:', error);
        alert('Error refreshing showroom: ' + error.message);
    }
}

/**
 * Load the showroom page
 */
function loadShowroom() {
    try {
        console.log('Loading showroom page...');
        
        // Load showroom template
        const content = loadTemplate('showroom-template');
        if (!content) {
            console.error('Failed to load showroom template');
            alert('Error: Could not load showroom template');
            return;
        }
        
        // Clear page content and append showroom
        if (!pageContent) {
            console.error('Page content element not found');
            alert('Error: Page content element not found');
            return;
        }
        
        pageContent.innerHTML = '';
        pageContent.appendChild(content);
        console.log('Showroom template loaded and appended to page');
        
        try {
            // Load quality options for filter
            loadQualityOptions();
            console.log('Quality options loaded');
        } catch (qualityError) {
            console.error('Error loading quality options:', qualityError);
            // Continue even if quality options fail
        }
        
        try {
            // Set up event listeners
            setupShowroomEventListeners();
            console.log('Showroom event listeners set up');
        } catch (eventError) {
            console.error('Error setting up showroom event listeners:', eventError);
            // Continue even if event setup fails
        }
        
        try {
            // Load showroom products
            loadShowroomProducts();
            console.log('Showroom products loaded');
        } catch (productsError) {
            console.error('Error loading showroom products:', productsError);
            alert('Error loading products: ' + productsError.message);
            // Continue to add refresh button
        }
        
        try {
            // Add refresh button to showroom
            addShowroomRefreshButton();
            console.log('Refresh button added');
        } catch (buttonError) {
            console.error('Error adding refresh button:', buttonError);
            // Not critical, continue
        }
        
        console.log('Showroom page loaded successfully');
    } catch (error) {
        console.error('Critical error loading showroom:', error);
        alert('Failed to load showroom: ' + error.message);
        
        // Try to display at least an empty page with a message
        if (pageContent) {
            pageContent.innerHTML = `
                <div class="error-container">
                    <h2>Error Loading Showroom</h2>
                    <p>There was a problem loading the showroom. Please try refreshing the page.</p>
                    <p>Error details: ${error.message}</p>
                </div>
            `;
        }
    }
}

/**
 * Load quality options for filter
 */
function loadQualityOptions() {
    const qualitySelect = document.getElementById('showroom-quality');
    if (!qualitySelect) {
        console.error('Quality select element not found');
        return;
    }
    
    // Clear existing options, keeping only the first "All Qualities" option
    while (qualitySelect.options.length > 1) {
        qualitySelect.remove(1);
    }
    
    // Get unique quality types from products
    const products = db.getProducts();
    console.log('Loading quality options from products:', products);
    
    const qualities = [...new Set(products.map(product => product.quality))];
    
    // Sort alphabetically
    qualities.sort();
    
    console.log('Unique quality options:', qualities);
    
    // Add options
    qualities.forEach(quality => {
        const option = document.createElement('option');
        option.value = quality;
        option.textContent = quality;
        qualitySelect.appendChild(option);
    });
}

/**
 * Set up event listeners for showroom page
 */
function setupShowroomEventListeners() {
    // Apply filters button
    const applyFiltersBtn = document.getElementById('apply-showroom-filters');
    applyFiltersBtn.addEventListener('click', loadShowroomProducts);
    
    // Reset filters button
    const resetFiltersBtn = document.getElementById('reset-showroom-filters');
    resetFiltersBtn.addEventListener('click', resetShowroomFilters);
}

/**
 * Load showroom products with optional filters - Direct implementation
 */
function loadShowroomProducts() {
    try {
        console.log('Loading showroom products directly from localStorage');
        
        // Verify DB_CONFIG is available
        if (!DB_CONFIG || !DB_CONFIG.storageKeys || !DB_CONFIG.storageKeys.products) {
            console.error('DB_CONFIG not properly defined', DB_CONFIG);
            alert('Configuration error. Please reload the page.');
            return;
        }
        
        console.log('Using storage key:', DB_CONFIG.storageKeys.products);
        
        const productsContainer = document.getElementById('showroom-products');
        if (!productsContainer) {
            console.error('Products container not found');
            return;
        }
        
        // Clear current products
        productsContainer.innerHTML = '';
        
        // Get filter values with fallbacks in case elements don't exist
        const categoryFilter = document.getElementById('showroom-category')?.value || '';
        const priceMinFilter = document.getElementById('showroom-price-min')?.value ? 
            parseFloat(document.getElementById('showroom-price-min').value) : 0;
        const priceMaxFilter = document.getElementById('showroom-price-max')?.value ? 
            parseFloat(document.getElementById('showroom-price-max').value) : Infinity;
        const qualityFilter = document.getElementById('showroom-quality')?.value || '';
        
        // Get products directly from localStorage
        let products = [];
        try {
            const productsJson = localStorage.getItem(DB_CONFIG.storageKeys.products);
            console.log('Raw products from localStorage key:', DB_CONFIG.storageKeys.products);
            console.log('Products JSON:', productsJson);
            
            if (productsJson) {
                products = JSON.parse(productsJson);
                if (!Array.isArray(products)) {
                    console.error('Products data is not an array');
                    products = [];
                }
            } else {
                console.log('No products found in localStorage');
            }
        } catch (error) {
            console.error('Error getting products from localStorage:', error);
            alert('Error accessing product data');
            return;
        }
        
        console.log('Total products found:', products.length);
        
        // Apply filters
        let filteredProducts = [...products];
        
        if (categoryFilter) {
            filteredProducts = filteredProducts.filter(product => product.category === categoryFilter);
        }
        
        filteredProducts = filteredProducts.filter(product => 
            product.sellingPrice >= priceMinFilter && 
            product.sellingPrice <= priceMaxFilter
        );
        
        if (qualityFilter) {
            filteredProducts = filteredProducts.filter(product => product.quality === qualityFilter);
        }
        
        console.log('Filtered products:', filteredProducts.length);
        
        if (filteredProducts.length === 0) {
            const emptyMessage = document.createElement('div');
            emptyMessage.classList.add('empty-results');
            emptyMessage.textContent = 'No products found matching your criteria.';
            productsContainer.appendChild(emptyMessage);
            return;
        }
        
        // Create product cards
        filteredProducts.forEach(product => {
            const card = createProductCard(product);
            productsContainer.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading showroom products:', error);
        alert('Failed to load products. Please try again.');
    }
}

/**
 * Create a product card
 * @param {Object} product - Product object
 * @returns {HTMLElement} Product card element
 */
function createProductCard(product) {
    if (!product || typeof product !== 'object') {
        console.error('Invalid product object:', product);
        return document.createElement('div'); // Return empty div to avoid errors
    }

    const card = document.createElement('div');
    card.classList.add('product-card');
    
    // Default values for missing properties
    const name = product.name || 'Unnamed Product';
    const category = product.category || 'uncategorized';
    const quality = product.quality || 'Standard';
    const sellingPrice = product.sellingPrice || 0;
    const stock = typeof product.stock === 'number' ? product.stock : 0;
    
    let stockStatus = '';
    let stockClass = '';
    
    if (stock === 0) {
        stockStatus = 'Out of Stock';
        stockClass = 'out-of-stock';
    } else if (stock <= 5) {
        stockStatus = `Low Stock (${stock} left)`;
        stockClass = 'low-stock';
    } else {
        stockStatus = 'In Stock';
        stockClass = 'in-stock';
    }
    
    // Get a placeholder image for the category
    const imageSrc = getCategoryImage(category);
    
    try {
        card.innerHTML = `
            <div class="product-image">
                <img src="${imageSrc}" alt="${name}">
            </div>
            <div class="product-info">
                <h3 class="product-title">${name}</h3>
                <p class="product-category">${capitalizeFirstLetter(category)}</p>
                <p class="product-quality">Quality: ${quality}</p>
                <p class="product-price">${formatCurrency(sellingPrice)}</p>
                <p class="product-stock ${stockClass}">${stockStatus}</p>
            </div>
        `;
    } catch (error) {
        console.error('Error creating product card HTML:', error);
        card.innerHTML = `<div class="product-error">Error displaying product</div>`;
    }
    
    // Add click event to show product details
    card.addEventListener('click', () => {
        try {
            showProductDetails(product);
        } catch (error) {
            console.error('Error showing product details:', error);
            alert('Error displaying product details');
        }
    });
    
    return card;
}

/**
 * Reset showroom filters
 */
function resetShowroomFilters() {
    document.getElementById('showroom-category').value = '';
    document.getElementById('showroom-price-min').value = '';
    document.getElementById('showroom-price-max').value = '';
    document.getElementById('showroom-quality').value = '';
    
    loadShowroomProducts();
}

/**
 * Show product details in modal
 * @param {Object} product - Product object
 */
function showProductDetails(product) {
    // Create modal content
    const container = document.createElement('div');
    container.classList.add('product-details');
    
    let stockStatus = '';
    let stockClass = '';
    
    if (product.stock === 0) {
        stockStatus = 'Out of Stock';
        stockClass = 'out-of-stock';
    } else if (product.stock <= 5) {
        stockStatus = `Low Stock (${product.stock} left)`;
        stockClass = 'low-stock';
    } else {
        stockStatus = 'In Stock';
        stockClass = 'in-stock';
    }
    
    // Get a placeholder image for the category
    const imageSrc = getCategoryImage(product.category);
    
    container.innerHTML = `
        <div class="product-details-grid">
            <div class="product-details-image">
                <img src="${imageSrc}" alt="${product.name}">
            </div>
            <div class="product-details-info">
                <h2>${product.name}</h2>
                <p class="product-details-category">${capitalizeFirstLetter(product.category)}</p>
                <p class="product-details-quality">Quality: ${product.quality}</p>
                <p class="product-details-price">${formatCurrency(product.sellingPrice)}</p>
                <p class="product-details-stock ${stockClass}">${stockStatus}</p>
                
                ${product.stock > 0 ? `
                <div class="product-actions">
                    <button id="quick-sale-btn" class="primary-btn">Quick Sale</button>
                </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Add quick sale button event listener
    if (product.stock > 0) {
        const quickSaleBtn = container.querySelector('#quick-sale-btn');
        quickSaleBtn.addEventListener('click', () => {
            closeModalBox();
            quickSale(product.id);
        });
    }
    
    // Show modal
    showModal(container);
}

/**
 * Show quick sale form for a product
 * @param {string} productId - Product ID
 */
function quickSale(productId) {
    // Get product
    const product = db.getProductById(productId);
    if (!product) {
        alert('Product not found');
        return;
    }
    
    // Create container for modal content
    const container = document.createElement('div');
    container.className = 'form-container quick-sale-form';
    
    container.innerHTML = `
        <h2>Quick Sale: ${product.name}</h2>
        <form id="quick-sale-form">
            <div class="form-group">
                <label for="quick-sale-quantity">Quantity:</label>
                <input type="number" id="quick-sale-quantity" min="1" max="${product.stock}" value="1" required>
            </div>
            
            <div class="form-group">
                <label for="quick-sale-price">Selling Price (<span class="currency-symbol"></span>):</label>
                <input type="number" id="quick-sale-price" value="${product.sellingPrice.toFixed(2)}" step="0.01" min="0" required>
                <small>You can adjust the price for discounts</small>
            </div>
            
            <div class="form-group">
                <label for="quick-sale-total">Total Amount (<span class="currency-symbol"></span>):</label>
                <input type="number" id="quick-sale-total" value="${product.sellingPrice.toFixed(2)}" readonly>
            </div>
            
            <div class="form-group">
                <label for="quick-sale-customer">Customer Mobile:</label>
                <input type="tel" id="quick-sale-customer" placeholder="10 digit mobile number" required>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="primary-btn">Complete Sale</button>
                <button type="button" id="cancel-quick-sale" class="secondary-btn">Cancel</button>
            </div>
        </form>
    `;
    
    // Set up form submission
    const form = container.querySelector('#quick-sale-form');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        processQuickSale(productId);
    });
    
    // Set up cancel button
    const cancelButton = container.querySelector('#cancel-quick-sale');
    cancelButton.addEventListener('click', closeModalBox);
    
    // Set up quantity and price change event listeners
    const quantityInput = container.querySelector('#quick-sale-quantity');
    const priceInput = container.querySelector('#quick-sale-price');
    
    quantityInput.addEventListener('input', updateQuickSaleTotal);
    priceInput.addEventListener('input', updateQuickSaleTotal);
    
    // Show modal
    showModal(container);
}

/**
 * Update quick sale total when quantity or price changes
 */
function updateQuickSaleTotal() {
    const quantityInput = document.getElementById('quick-sale-quantity');
    const priceInput = document.getElementById('quick-sale-price');
    const totalInput = document.getElementById('quick-sale-total');
    
    if (quantityInput.value && priceInput.value) {
        const quantity = parseInt(quantityInput.value);
        const price = parseFloat(priceInput.value);
        
        if (quantity > 0 && price >= 0) {
            const total = quantity * price;
            totalInput.value = total.toFixed(2);
        }
    }
}

/**
 * Process a quick sale
 * @param {string} productId - Product ID
 */
function processQuickSale(productId) {
    try {
        // Get form values
        const quantity = parseInt(document.getElementById('quick-sale-quantity').value);
        const price = parseFloat(document.getElementById('quick-sale-price').value);
        const customerMobile = document.getElementById('quick-sale-customer').value;
        
        // Validate inputs
        if (isNaN(quantity) || quantity <= 0) {
            alert('Please enter a valid quantity (greater than zero)');
            return;
        }
        
        if (isNaN(price) || price <= 0) {
            alert('Please enter a valid price (greater than zero)');
            return;
        }
        
        if (!customerMobile || !/^\d{10}$/.test(customerMobile)) {
            alert('Please enter a valid 10-digit mobile number');
            return;
        }
        
        // Get product to confirm it still exists and has stock
        const product = db.getProductById(productId);
        if (!product) {
            alert('Product not found');
            return;
        }
        
        if (product.stock < quantity) {
            alert(`Not enough stock available. Only ${product.stock} units in stock.`);
            return;
        }
        
        // Create sale object
        const sale = {
            productId,
            quantity,
            price,
            customerMobile,
            date: new Date().toISOString()
        };
        
        // Add sale to database
        const addedSale = db.addSale(sale);
        
        // Close modal
        closeModalBox();
        
        // Ask if user wants to send invoice
        const confirmed = confirm('Sale recorded successfully! Would you like to send WhatsApp invoice to the customer?');
        if (confirmed) {
            // Get product and generate invoice
            const invoice = generateInvoice(addedSale, product);
            
            // Send via WhatsApp
            sendWhatsAppInvoice(customerMobile, invoice);
        }
        
        // Reload showroom products
        loadShowroomProducts();
        
        // Reload dashboard if we're on it
        if (currentPage === 'dashboard') {
            loadDashboard();
        }
    } catch (error) {
        console.error('Error adding sale:', error);
        alert(`Failed to add sale: ${error.message}`);
    }
}

/**
 * Get a placeholder image for a category
 * @param {string} category - Product category
 * @returns {string} Image URL
 */
function getCategoryImage(category) {
    // Use placeholder images
    switch (category) {
        case 'carpets':
            return 'https://via.placeholder.com/300x200/f5f5f5/666666?text=Carpet';
        case 'cushions':
            return 'https://via.placeholder.com/300x200/f0f4ff/666666?text=Cushion';
        case 'bedsheets':
            return 'https://via.placeholder.com/300x200/fff0f0/666666?text=Bedsheet';
        case 'curtains':
            return 'https://via.placeholder.com/300x200/f0fff0/666666?text=Curtain';
        default:
            return 'https://via.placeholder.com/300x200/f5f5f5/666666?text=Product';
    }
}

/**
 * Add a refresh button to the showroom filters section
 */
function addShowroomRefreshButton() {
    try {
        // Find the filters section
        const filtersSection = document.querySelector('.filters');
        if (!filtersSection) {
            console.error('Filters section not found');
            return;
        }
        
        // Create refresh button
        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'refresh-showroom';
        refreshBtn.className = 'secondary-btn';
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh Products';
        refreshBtn.style.marginRight = '10px';
        
        // Add click handler
        refreshBtn.addEventListener('click', refreshShowroom);
        
        // Create debug button
        const debugBtn = document.createElement('button');
        debugBtn.id = 'debug-showroom';
        debugBtn.className = 'secondary-btn';
        debugBtn.innerHTML = '<i class="fas fa-bug"></i> Debug Storage';
        
        // Add click handler for debug button
        debugBtn.addEventListener('click', function() {
            try {
                const productsJson = localStorage.getItem(DB_CONFIG.storageKeys.products);
                console.log('Viewing products in localStorage:', DB_CONFIG.storageKeys.products);
                
                let products = [];
                if (productsJson) {
                    products = JSON.parse(productsJson);
                }
                
                // Only show product count and names to avoid a huge alert
                let productList = products.map(p => `• ${p.name} (${p.category}, ${p.quality})`).join('\n');
                
                if (products.length === 0) {
                    alert('No products found in storage. Try adding some products first.');
                } else {
                    alert(`Found ${products.length} products in storage:\n\n${productList}`);
                }
            } catch (error) {
                console.error('Error viewing products:', error);
                alert('Error accessing localStorage: ' + error.message);
            }
        });
        
        // Add buttons to filters section
        filtersSection.appendChild(refreshBtn);
        filtersSection.appendChild(debugBtn);
        
        console.log('Added refresh and debug buttons to showroom');
    } catch (error) {
        console.error('Error adding buttons to showroom:', error);
    }
} 