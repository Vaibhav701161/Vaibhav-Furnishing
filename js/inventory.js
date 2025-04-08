/**
 * Inventory management functionality
 */

/**
 * Load the inventory page
 */
function loadInventory() {
    // Check localStorage status for debugging
    checkLocalStorageStatus();

    // Load inventory template
    const content = loadTemplate('inventory-template');
    
    // Clear page content and append inventory
    pageContent.innerHTML = '';
    pageContent.appendChild(content);
    
    // Set up event listeners
    setupInventoryEventListeners();
    
    // Load inventory table
    loadInventoryTable();
}

/**
 * Check localStorage status
 */
function checkLocalStorageStatus() {
    try {
        // Test if localStorage is available
        const testKey = "_test_ls_" + Math.random();
        localStorage.setItem(testKey, "test");
        localStorage.removeItem(testKey);
        
        // Get products
        const productsJson = localStorage.getItem('products');
        let products = [];
        
        if (productsJson) {
            products = JSON.parse(productsJson);
            console.log('Current products in localStorage:', products);
        } else {
            console.log('No products found in localStorage');
        }
        
        console.log('localStorage is working properly');
        return true;
    } catch (e) {
        console.error('localStorage test failed:', e);
        alert('Warning: Your browser might be blocking localStorage, which is required for this application to work properly.');
        return false;
    }
}

/**
 * Set up event listeners for inventory page
 */
function setupInventoryEventListeners() {
    // Add product button
    const addProductBtn = document.getElementById('add-product-btn');
    if (addProductBtn) {
        addProductBtn.addEventListener('click', showAddProductForm);
    }
    
    // Apply filters button
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', loadInventoryTable);
    }
    
    // Reset filters button
    const resetFiltersBtn = document.getElementById('reset-filters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetInventoryFilters);
    }
    
    // Setup keyboard event for Enter key in filters
    const filterInputs = document.querySelectorAll('#category-filter, #price-min, #price-max, #stock-status');
    filterInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                loadInventoryTable();
            }
        });
    });
}

/**
 * Load inventory table with optional filters
 */
function loadInventoryTable() {
    try {
        console.log('Starting to load inventory table');
        
        // Get and validate the inventory table element
        const inventoryTable = document.getElementById('inventory-table');
        if (!inventoryTable) {
            console.error('Inventory table element not found in the DOM');
            alert('Error: Cannot find inventory table element');
            return;
        }
        
        const tableBody = inventoryTable.querySelector('tbody');
        if (!tableBody) {
            console.error('Inventory table tbody not found');
            alert('Error: Cannot find inventory table body');
            return;
        }
        
        // Clear the table
        tableBody.innerHTML = '';
        
        // Attempt to get filter elements and handle missing ones gracefully
        console.log('Getting filter elements');
        const categoryFilter = document.getElementById('category-filter')?.value || '';
        const priceMinFilter = document.getElementById('price-min')?.value ? parseFloat(document.getElementById('price-min').value) : 0;
        const priceMaxFilter = document.getElementById('price-max')?.value ? parseFloat(document.getElementById('price-max').value) : Infinity;
        const stockStatusFilter = document.getElementById('stock-status')?.value || '';
        
        console.log('Filters applied:', { 
            category: categoryFilter, 
            priceMin: priceMinFilter, 
            priceMax: priceMaxFilter, 
            stockStatus: stockStatusFilter 
        });
        
        // Get products from localStorage directly as a fallback
        console.log('Retrieving products');
        let products = [];
        
        try {
            // First try using the db object
            products = db.getProducts();
            console.log(`Retrieved ${products.length} products via db object`);
        } catch (dbError) {
            console.error('Error getting products from db:', dbError);
            
            // Fallback to direct localStorage access
            try {
                const productsJson = localStorage.getItem('products');
                if (productsJson) {
                    products = JSON.parse(productsJson);
                    console.log(`Retrieved ${products.length} products directly from localStorage`);
                    
                    if (!Array.isArray(products)) {
                        console.error('Products data is not an array:', products);
                        products = [];
                    }
                } else {
                    console.log('No products found in localStorage');
                }
            } catch (lsError) {
                console.error('Error accessing localStorage directly:', lsError);
                alert('Cannot access product data. LocalStorage may be disabled or corrupted.');
                return;
            }
        }
        
        // Apply filters
        console.log('Applying filters to products');
        let filteredProducts = [...products];
        
        if (categoryFilter) {
            filteredProducts = filteredProducts.filter(product => product.category === categoryFilter);
        }
        
        filteredProducts = filteredProducts.filter(product => 
            product.sellingPrice >= priceMinFilter && 
            product.sellingPrice <= priceMaxFilter
        );
        
        if (stockStatusFilter) {
            switch (stockStatusFilter) {
                case 'in-stock':
                    filteredProducts = filteredProducts.filter(product => product.stock > 5);
                    break;
                case 'low-stock':
                    filteredProducts = filteredProducts.filter(product => product.stock > 0 && product.stock <= 5);
                    break;
                case 'out-of-stock':
                    filteredProducts = filteredProducts.filter(product => product.stock === 0);
                    break;
            }
        }
        
        console.log(`Found ${filteredProducts.length} products after filtering`);
        
        if (filteredProducts.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="8" class="text-center">No products found</td>`;
            tableBody.appendChild(row);
            return;
        }
        
        // Add products to table
        console.log('Adding products to table');
        filteredProducts.forEach(product => {
            const row = document.createElement('tr');
            
            // Add class based on stock status
            if (product.stock === 0) {
                row.classList.add('out-of-stock');
            } else if (product.stock <= 5) {
                row.classList.add('low-stock');
            }
            
            const categoryName = getCategoryName(product.category);
            
            row.innerHTML = `
                <td>${product.id}</td>
                <td>${product.name}</td>
                <td>${categoryName}</td>
                <td>${product.quality}</td>
                <td>${product.stock}</td>
                <td>${formatCurrency(product.sellingPrice)}</td>
                <td>${formatCurrency(product.purchasePrice)}</td>
                <td>
                    <button class="action-btn edit-product" data-id="${product.id}"><i class="fas fa-edit"></i></button>
                    <button class="action-btn delete-btn delete-product" data-id="${product.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Set up action button event listeners
        setupProductActionListeners();
        
        console.log('Inventory table loaded successfully');
    } catch (error) {
        console.error('Error loading inventory table:', error);
        alert('An error occurred while loading the inventory table: ' + error.message);
    }
}

/**
 * Helper function to get category name from category id
 * @param {string} categoryId - Category ID
 * @returns {string} Category name or original ID if not found
 */
function getCategoryName(categoryId) {
    try {
        const category = PRODUCT_CATEGORIES.find(cat => cat.id === categoryId);
        return category ? category.name : categoryId;
    } catch (error) {
        console.error('Error getting category name:', error);
        return categoryId;
    }
}

/**
 * Reset inventory filters
 */
function resetInventoryFilters() {
    document.getElementById('category-filter').value = '';
    document.getElementById('price-min').value = '';
    document.getElementById('price-max').value = '';
    document.getElementById('stock-status').value = '';
    
    loadInventoryTable();
}

/**
 * Refresh inventory page 
 * Updates both the inventory table and dashboard if needed
 * Also updates showroom if that's the current page
 */
function refreshInventory() {
    // Reload inventory table if we're on the inventory page
    if (currentPage === 'inventory') {
        loadInventoryTable();
    }
    
    // Reload dashboard if we're on it
    if (currentPage === 'dashboard') {
        loadDashboard();
    }
    
    // Reload showroom if we're on it
    if (currentPage === 'showroom') {
        loadShowroomProducts();
        
        // Also refresh the quality filter options since a new product with a new quality might have been added
        loadQualityOptions();
    }
    
    console.log('Refreshed view for current page:', currentPage);
}

/**
 * Set up product action button listeners
 */
function setupProductActionListeners() {
    try {
        // Edit product buttons
        const editButtons = document.querySelectorAll('.edit-product');
        editButtons.forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                showEditProductForm(productId);
            });
        });
        
        // Delete product buttons
        const deleteButtons = document.querySelectorAll('.delete-product');
        deleteButtons.forEach(button => {
            button.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                confirmDeleteProduct(productId);
            });
        });
    } catch (error) {
        console.error('Error setting up product action listeners:', error);
    }
}

/**
 * Add a debug button to form to check values
 */
function addDebugButton() {
    try {
        // Check if the button already exists
        if (document.getElementById('debug-form-btn')) {
            return;
        }
        
        // Create debug button
        const debugBtn = document.createElement('button');
        debugBtn.type = 'button';
        debugBtn.id = 'debug-form-btn';
        debugBtn.className = 'secondary-btn';
        debugBtn.style.marginRight = 'auto'; // Position on left
        debugBtn.textContent = 'Check Form Values';
        
        // Add click handler
        debugBtn.addEventListener('click', function() {
            // Get form values
            const formData = {
                name: document.getElementById('product-name')?.value,
                category: document.getElementById('product-category')?.value,
                quality: document.getElementById('product-quality')?.value,
                stock: document.getElementById('product-stock')?.value,
                sellingPrice: document.getElementById('selling-price')?.value,
                purchasePrice: document.getElementById('purchase-price')?.value
            };
            
            // Log the values
            console.log('Current form values:', formData);
            
            // Show values in an alert for mobile debugging
            alert('Form values: ' + JSON.stringify(formData, null, 2));
        });
        
        // Find form actions div
        const formActions = document.querySelector('.form-actions');
        if (formActions) {
            formActions.prepend(debugBtn);
        }
    } catch (error) {
        console.error('Error adding debug button:', error);
    }
}

/**
 * Show add product form
 */
function showAddProductForm() {
    try {
        console.log('Showing add product form');
        
        // Create modal content from add product template
        const modalContent = loadTemplate('add-product-template');
        if (!modalContent) {
            console.error('Failed to load add-product-template');
            alert('Error: Could not load the product form template');
            return;
        }
        
        // Set up form submission
        const form = modalContent.querySelector('#product-form');
        if (!form) {
            console.error('Form #product-form not found in template');
            alert('Error: Form element not found in template');
            return;
        }
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Form submitted');
            addProduct();
        });
        
        // Set up cancel button
        const cancelButton = modalContent.querySelector('#cancel-add-product');
        if (cancelButton) {
            cancelButton.addEventListener('click', closeModalBox);
        } else {
            console.warn('Cancel button #cancel-add-product not found');
        }
        
        // Set up Add Product button
        const addProductButton = modalContent.querySelector('#add-product-submit');
        if (addProductButton) {
            addProductButton.addEventListener('click', function() {
                console.log('Add Product button clicked');
                addProduct();
            });
        } else {
            console.warn('Add Product button #add-product-submit not found');
        }
        
        // Show modal
        showModal(modalContent);
        
        // Give time for the DOM to update
        setTimeout(() => {
            // Verify form elements exist in the DOM
            const nameInput = document.getElementById('product-name');
            const categorySelect = document.getElementById('product-category');
            const qualityInput = document.getElementById('product-quality');
            const stockInput = document.getElementById('product-stock');
            const sellingPriceInput = document.getElementById('selling-price');
            const purchasePriceInput = document.getElementById('purchase-price');
            const addProductButton = document.getElementById('add-product-submit');
            
            if (!nameInput || !categorySelect || !qualityInput || !stockInput || 
                !sellingPriceInput || !purchasePriceInput) {
                console.error('Some form elements not found in the DOM',
                    {nameInput, categorySelect, qualityInput, stockInput, sellingPriceInput, purchasePriceInput});
            } else {
                console.log('All form elements found in the DOM');
                // Focus on the first field
                nameInput.focus();
                
                // Add debug button
                addDebugButton();
                
                // Make sure the add product button is visible
                if (addProductButton) {
                    // Ensure the modal content is scrolled to show the button
                    const modalContent = document.querySelector('.modal-content');
                    if (modalContent) {
                        // Give extra time for rendering
                        setTimeout(() => {
                            modalContent.scrollTop = 0; // First scroll to top
                            // Then scroll to see the button if needed
                            addProductButton.scrollIntoView({behavior: 'smooth', block: 'end'});
                        }, 200);
                    }
                }
            }
        }, 100);
    } catch (error) {
        console.error('Error showing add product form:', error);
        alert('Failed to show add product form: ' + error.message);
    }
}

/**
 * Add a new product - Direct implementation
 */
function addProduct() {
    try {
        // Get form values
        const name = document.getElementById('product-name').value;
        const category = document.getElementById('product-category').value;
        const quality = document.getElementById('product-quality').value;
        const stockInput = document.getElementById('product-stock').value;
        const sellingPriceInput = document.getElementById('selling-price').value;
        const purchasePriceInput = document.getElementById('purchase-price').value;
        
        // Validate inputs
        if (!name || name.trim() === '') {
            alert('Please enter a product name');
            return;
        }
        
        if (!category) {
            alert('Please select a category');
            return;
        }
        
        if (!quality || quality.trim() === '') {
            alert('Please enter product quality/type');
            return;
        }
        
        if (!stockInput || isNaN(parseInt(stockInput)) || parseInt(stockInput) < 0) {
            alert('Please enter a valid stock quantity (0 or greater)');
            return;
        }
        
        if (!sellingPriceInput || isNaN(parseFloat(sellingPriceInput)) || parseFloat(sellingPriceInput) <= 0) {
            alert('Please enter a valid selling price (greater than zero)');
            return;
        }
        
        if (!purchasePriceInput || isNaN(parseFloat(purchasePriceInput)) || parseFloat(purchasePriceInput) <= 0) {
            alert('Please enter a valid purchase price (greater than zero)');
            return;
        }
        
        // Convert to appropriate types
        const stock = parseInt(stockInput);
        const sellingPrice = parseFloat(sellingPriceInput);
        const purchasePrice = parseFloat(purchasePriceInput);
        
        // Create product object with unique ID
        const product = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
            name,
            category,
            quality,
            stock,
            sellingPrice,
            purchasePrice
        };
        
        // Get current products from localStorage
        let products = [];
        try {
            const productsJson = localStorage.getItem(DB_CONFIG.storageKeys.products);
            console.log('Current products in localStorage:', productsJson);
            
            if (productsJson) {
                products = JSON.parse(productsJson);
                if (!Array.isArray(products)) {
                    console.error('Products data is not an array, resetting');
                    products = [];
                }
            } else {
                console.log('No products found in localStorage, starting with empty array');
            }
        } catch (e) {
            console.error('Error parsing products from localStorage:', e);
            products = [];
        }
        
        // Add new product
        products.push(product);
        
        // Save back to localStorage with correct key
        localStorage.setItem(DB_CONFIG.storageKeys.products, JSON.stringify(products));
        
        // Close modal
        closeModalBox();
        
        // Refresh inventory page and dashboard if needed
        refreshInventory();
        
        // Show success message
        alert('Product added successfully!');
        
        // Log for debugging
        console.log('Product added with ID:', product.id);
        console.log('Updated products in localStorage:', products);
        console.log('localStorage key used:', DB_CONFIG.storageKeys.products);
    } catch (error) {
        console.error('Error adding product:', error);
        alert('Failed to add product: ' + error.message);
    }
}

/**
 * Show edit product form
 * @param {string} productId - Product ID to edit
 */
function showEditProductForm(productId) {
    try {
        console.log(`Showing edit product form for ID: ${productId}`);
    
        // Get product
        const product = db.getProductById(productId);
        if (!product) {
            console.error(`Product not found with ID: ${productId}`);
            alert('Product not found');
            return;
        }
        
        console.log('Product to edit:', product);
        
        // Create modal content from add product template
        const modalContent = loadTemplate('add-product-template');
        if (!modalContent) {
            console.error('Failed to load add-product-template');
            alert('Error: Could not load the product form template');
            return;
        }
        
        // Update title
        const titleElement = modalContent.querySelector('h2');
        if (titleElement) {
            titleElement.textContent = 'Edit Product';
        }
        
        // Set up form submission
        const form = modalContent.querySelector('#product-form');
        if (!form) {
            console.error('Form #product-form not found in template');
            alert('Error: Form element not found in template');
            return;
        }
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Edit form submitted');
            updateProduct(productId);
        });
        
        // Show modal first so elements will be in the DOM
        showModal(modalContent);
        
        // Give DOM time to update
        setTimeout(() => {
            // Get form elements
            const nameInput = document.getElementById('product-name');
            const categorySelect = document.getElementById('product-category');
            const qualityInput = document.getElementById('product-quality');
            const stockInput = document.getElementById('product-stock');
            const sellingPriceInput = document.getElementById('selling-price');
            const purchasePriceInput = document.getElementById('purchase-price');
            const submitButton = form.querySelector('button[type="submit"]');
            const cancelButton = document.getElementById('cancel-add-product');
            
            // Check if elements exist
            if (!nameInput || !categorySelect || !qualityInput || !stockInput || 
                !sellingPriceInput || !purchasePriceInput) {
                console.error('Some form elements not found in the DOM');
                alert('Error: Form elements not found');
                return;
            }
            
            // Fill form with product data
            nameInput.value = product.name || '';
            categorySelect.value = product.category || '';
            qualityInput.value = product.quality || '';
            stockInput.value = product.stock !== undefined ? product.stock : '';
            sellingPriceInput.value = product.sellingPrice !== undefined ? product.sellingPrice : '';
            purchasePriceInput.value = product.purchasePrice !== undefined ? product.purchasePrice : '';
            
            // Update button text if found
            if (submitButton) {
                submitButton.textContent = 'Update Product';
            }
            
            // Set up cancel button
            if (cancelButton) {
                cancelButton.addEventListener('click', closeModalBox);
            } else {
                console.warn('Cancel button #cancel-add-product not found');
            }
            
            // Focus on the first field
            if (nameInput) {
                nameInput.focus();
                // Select the text for easy editing
                nameInput.select();
            }
            
            // Add debug button
            addDebugButton();
            
            // Make sure the submit buttons are visible
            const addProductButton = document.getElementById('add-product-submit');
            if (addProductButton) {
                // Ensure the modal content is scrolled to show the button
                const modalContent = document.querySelector('.modal-content');
                if (modalContent) {
                    // Give extra time for rendering
                    setTimeout(() => {
                        addProductButton.scrollIntoView({behavior: 'smooth', block: 'end'});
                    }, 200);
                }
            }
            
            console.log('Edit form populated successfully');
        }, 100);
    } catch (error) {
        console.error('Error showing edit product form:', error);
        alert('Failed to show edit product form: ' + error.message);
    }
}

/**
 * Update an existing product - Direct implementation
 * @param {string} productId - Product ID to update
 */
function updateProduct(productId) {
    try {
        // Get form values
        const name = document.getElementById('product-name').value;
        const category = document.getElementById('product-category').value;
        const quality = document.getElementById('product-quality').value;
        const stockInput = document.getElementById('product-stock').value;
        const sellingPriceInput = document.getElementById('selling-price').value;
        const purchasePriceInput = document.getElementById('purchase-price').value;
        
        // Validate inputs
        if (!name || name.trim() === '') {
            alert('Please enter a product name');
            return;
        }
        
        if (!category) {
            alert('Please select a category');
            return;
        }
        
        if (!quality || quality.trim() === '') {
            alert('Please enter product quality/type');
            return;
        }
        
        if (!stockInput || isNaN(parseInt(stockInput)) || parseInt(stockInput) < 0) {
            alert('Please enter a valid stock quantity (0 or greater)');
            return;
        }
        
        if (!sellingPriceInput || isNaN(parseFloat(sellingPriceInput)) || parseFloat(sellingPriceInput) <= 0) {
            alert('Please enter a valid selling price (greater than zero)');
            return;
        }
        
        if (!purchasePriceInput || isNaN(parseFloat(purchasePriceInput)) || parseFloat(purchasePriceInput) <= 0) {
            alert('Please enter a valid purchase price (greater than zero)');
            return;
        }
        
        // Convert to appropriate types
        const stock = parseInt(stockInput);
        const sellingPrice = parseFloat(sellingPriceInput);
        const purchasePrice = parseFloat(purchasePriceInput);
        
        // Create updated product object
        const updatedProduct = {
            id: productId, // Keep the same ID
            name,
            category,
            quality,
            stock,
            sellingPrice,
            purchasePrice
        };
        
        // Get current products from localStorage
        let products = [];
        try {
            const productsJson = localStorage.getItem(DB_CONFIG.storageKeys.products);
            if (productsJson) {
                products = JSON.parse(productsJson);
                if (!Array.isArray(products)) {
                    products = [];
                }
            }
        } catch (e) {
            console.error('Error parsing products from localStorage:', e);
            products = [];
        }
        
        // Find product index
        const index = products.findIndex(p => p.id === productId);
        if (index === -1) {
            alert('Product not found');
            return;
        }
        
        // Update product
        products[index] = updatedProduct;
        
        // Save back to localStorage with correct key
        localStorage.setItem(DB_CONFIG.storageKeys.products, JSON.stringify(products));
        
        // Close modal
        closeModalBox();
        
        // Refresh inventory page and dashboard if needed
        refreshInventory();
        
        // Show success message
        alert('Product updated successfully!');
        
        // Log for debugging
        console.log('Product updated:', updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        alert('Failed to update product: ' + error.message);
    }
}

/**
 * Confirm product deletion
 * @param {string} productId - Product ID to delete
 */
function confirmDeleteProduct(productId) {
    // Get product
    const product = db.getProductById(productId);
    if (!product) {
        alert('Product not found');
        return;
    }
    
    // Create confirmation modal content
    const container = document.createElement('div');
    container.classList.add('confirmation-modal');
    
    container.innerHTML = `
        <h2>Confirm Deletion</h2>
        <p>Are you sure you want to delete "${product.name}"?</p>
        <div class="form-actions">
            <button id="confirm-delete" class="primary-btn danger-btn">Delete</button>
            <button id="cancel-delete" class="secondary-btn">Cancel</button>
        </div>
    `;
    
    // Set up confirmation button
    const confirmButton = container.querySelector('#confirm-delete');
    confirmButton.addEventListener('click', function() {
        deleteProduct(productId);
    });
    
    // Set up cancel button
    const cancelButton = container.querySelector('#cancel-delete');
    cancelButton.addEventListener('click', closeModalBox);
    
    // Show modal
    showModal(container);
}

/**
 * Delete a product - Direct implementation
 * @param {string} productId - Product ID to delete
 */
function deleteProduct(productId) {
    try {
        // Get current products from localStorage
        let products = [];
        try {
            const productsJson = localStorage.getItem(DB_CONFIG.storageKeys.products);
            if (productsJson) {
                products = JSON.parse(productsJson);
                if (!Array.isArray(products)) {
                    products = [];
                }
            }
        } catch (e) {
            console.error('Error parsing products from localStorage:', e);
            products = [];
        }
        
        // Filter out the product to delete
        const initialLength = products.length;
        products = products.filter(p => p.id !== productId);
        
        // Check if product was found and removed
        if (products.length === initialLength) {
            alert('Product not found');
            return;
        }
        
        // Save back to localStorage with correct key
        localStorage.setItem(DB_CONFIG.storageKeys.products, JSON.stringify(products));
        
        // Close modal
        closeModalBox();
        
        // Refresh inventory
        refreshInventory();
        
        // Show success message
        alert('Product deleted successfully!');
        
        // Log for debugging
        console.log('Product deleted. Remaining products:', products);
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product: ' + error.message);
    }
} 