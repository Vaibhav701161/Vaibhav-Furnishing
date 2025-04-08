/**
 * Sales management functionality
 */

/**
 * Load the sales page
 */
function loadSales() {
    // Load sales template
    const content = loadTemplate(DOM_IDS.templates.sales);
    
    // Clear page content and append sales
    document.getElementById(DOM_IDS.pageContent).innerHTML = '';
    document.getElementById(DOM_IDS.pageContent).appendChild(content);
    
    // Set up event listeners
    setupSalesEventListeners();
    
    // Load sales table
    loadSalesTable();
}

/**
 * Set up event listeners for sales page
 */
function setupSalesEventListeners() {
    try {
        console.log('Setting up sales event listeners');
        
        // New sale button
        const newSaleBtn = document.getElementById(DOM_IDS.sales.newSaleBtn);
        if (newSaleBtn) {
            console.log('New sale button found, adding event listener');
            newSaleBtn.addEventListener('click', function() {
                console.log('New sale button clicked');
                showAddSaleForm();
            });
        } else {
            console.error('New sale button not found in the DOM');
        }
    } catch (error) {
        console.error('Error setting up sales event listeners:', error);
    }
}

/**
 * Load sales table
 */
function loadSalesTable() {
    const salesTable = document.getElementById(DOM_IDS.sales.salesTable).querySelector('tbody');
    salesTable.innerHTML = '';
    
    // Get all sales and sort by date (newest first)
    const sales = db.getSales().sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (sales.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="8" class="${CSS_CLASSES.textCenter}">No sales recorded yet</td>`;
        salesTable.appendChild(row);
        return;
    }
    
    // Add sales to table
    sales.forEach(sale => {
        const product = db.getProductById(sale.productId);
        const total = sale.price * sale.quantity;
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${sale.id}</td>
            <td>${formatDate(sale.date)}</td>
            <td>${product ? product.name : 'Unknown Product'}</td>
            <td>${sale.quantity}</td>
            <td>${formatCurrency(sale.price)}</td>
            <td>${formatCurrency(total)}</td>
            <td>${sale.customerMobile}</td>
            <td>
                <button class="${CSS_CLASSES.actionBtn} send-invoice" data-id="${sale.id}"><i class="fab fa-whatsapp"></i></button>
                <button class="${CSS_CLASSES.actionBtn} ${CSS_CLASSES.deleteBtn} delete-sale" data-id="${sale.id}"><i class="fas fa-trash"></i></button>
            </td>
        `;
        
        salesTable.appendChild(row);
    });
    
    // Set up action button event listeners
    setupSaleActionListeners();
}

/**
 * Set up sale action button listeners
 */
function setupSaleActionListeners() {
    // Send invoice buttons
    const invoiceButtons = document.querySelectorAll('.send-invoice');
    invoiceButtons.forEach(button => {
        button.addEventListener('click', function() {
            const saleId = this.getAttribute('data-id');
            sendInvoice(saleId);
        });
    });
    
    // Delete sale buttons
    const deleteButtons = document.querySelectorAll('.delete-sale');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const saleId = this.getAttribute('data-id');
            confirmDeleteSale(saleId);
        });
    });
}

/**
 * Show add sale form
 */
function showAddSaleForm() {
    try {
        console.log('Showing add sale form');
        
        // Create modal content from add sale template
        const modalContent = loadTemplate(DOM_IDS.templates.addSale);
        if (!modalContent) {
            console.error(`Failed to load ${DOM_IDS.templates.addSale}`);
            alert('Error: Could not load the sale form template');
            return;
        }
        
        // Load products into dropdown
        const productSelect = modalContent.querySelector(`#${DOM_IDS.saleForm.product}`);
        if (!productSelect) {
            console.error('Product select element not found in template');
            alert('Error: Form elements not found in template');
            return;
        }
        
        const products = db.getProducts();
        console.log('Available products:', products);
        
        if (products.length === 0) {
            alert('No products available. Please add products first.');
            return;
        }
        
        let hasInStockProducts = false;
        
        products.forEach(product => {
            // Only show products that are in stock
            if (product.stock > 0) {
                hasInStockProducts = true;
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = `${product.name} (${formatCurrency(product.sellingPrice)})`;
                option.dataset.price = product.sellingPrice;
                option.dataset.stock = product.stock;
                productSelect.appendChild(option);
            }
        });
        
        if (!hasInStockProducts) {
            alert('No products in stock. Please add stock first.');
            return;
        }
        
        // Set up product change event to update price
        productSelect.addEventListener('change', updateSalePrice);
        
        // Set up quantity change event to update total
        const quantityInput = modalContent.querySelector(`#${DOM_IDS.saleForm.quantity}`);
        if (quantityInput) {
            quantityInput.addEventListener('input', updateSaleTotal);
        } else {
            console.error('Quantity input not found in template');
        }
        
        // Set up price change event to update total
        const priceInput = modalContent.querySelector(`#${DOM_IDS.saleForm.price}`);
        if (priceInput) {
            priceInput.addEventListener('input', updateSaleTotal);
        } else {
            console.error('Price input not found in template');
        }
        
        // Initialize price and total if a product is selected
        if (productSelect.options.length > 1) {
            productSelect.selectedIndex = 1; // Select first product
            updateSalePrice();
        }
        
        // Set up form submission
        const form = modalContent.querySelector(`#${DOM_IDS.saleForm.form}`);
        if (!form) {
            console.error('Sale form not found in template');
            alert('Error: Form element not found in template');
            return;
        }
        
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Sale form submitted');
            addSale();
        });
        
        // Set up cancel button
        const cancelButton = modalContent.querySelector(`#${DOM_IDS.saleForm.cancelBtn}`);
        if (cancelButton) {
            cancelButton.addEventListener('click', closeModalBox);
        } else {
            console.warn(`Cancel button #${DOM_IDS.saleForm.cancelBtn} not found`);
        }
        
        // Show modal
        showModal(modalContent);
        
        // Give time for the DOM to update
        setTimeout(() => {
            // Verify form elements exist in the DOM
            const productSelect = document.getElementById(DOM_IDS.saleForm.product);
            const quantityInput = document.getElementById(DOM_IDS.saleForm.quantity);
            const priceInput = document.getElementById(DOM_IDS.saleForm.price);
            const totalInput = document.getElementById(DOM_IDS.saleForm.total);
            const customerMobileInput = document.getElementById(DOM_IDS.saleForm.customerMobile);
            
            if (!productSelect || !quantityInput || !priceInput || !totalInput || !customerMobileInput) {
                console.error('Some form elements not found in the DOM',
                    {productSelect, quantityInput, priceInput, totalInput, customerMobileInput});
            } else {
                console.log('All sale form elements found in the DOM');
                // Focus on the first field
                productSelect.focus();
                
                // Ensure the modal content is scrolled to show all elements
                const modalContent = document.querySelector('.modal-content');
                if (modalContent) {
                    // Give extra time for rendering
                    setTimeout(() => {
                        // First scroll to top
                        modalContent.scrollTop = 0;
                        // Then scroll to see the submit button if it exists
                        const submitButton = document.querySelector(`#${DOM_IDS.saleForm.form} button[type="submit"]`);
                        if (submitButton) {
                            submitButton.scrollIntoView({behavior: 'smooth', block: 'end'});
                        }
                    }, TIMING_CONFIG.scrollDelay);
                }
            }
        }, TIMING_CONFIG.domUpdateDelay);
    } catch (error) {
        console.error('Error showing add sale form:', error);
        alert('Failed to show add sale form: ' + error.message);
    }
}

/**
 * Update sale price when product changes
 */
function updateSalePrice() {
    try {
        const productSelect = document.getElementById(DOM_IDS.saleForm.product);
        const priceInput = document.getElementById(DOM_IDS.saleForm.price);
        const quantityInput = document.getElementById(DOM_IDS.saleForm.quantity);
        
        if (!productSelect || !priceInput || !quantityInput) {
            console.error('Required elements not found for updateSalePrice',
                {productSelect, priceInput, quantityInput});
            return;
        }
        
        if (productSelect.selectedIndex > 0) {
            const selectedOption = productSelect.options[productSelect.selectedIndex];
            const price = parseFloat(selectedOption.dataset.price);
            const maxStock = parseInt(selectedOption.dataset.stock);
            
            // Only set price if the field is empty or a product was just selected
            // This allows manual price adjustments to remain when changing quantity
            if (priceInput.value === '' || productSelect.dataset.lastSelected !== productSelect.value) {
                priceInput.value = price.toFixed(2);
                // Store the last selected product to detect changes
                productSelect.dataset.lastSelected = productSelect.value;
            }
            
            // Limit quantity to available stock
            quantityInput.max = maxStock;
            if (parseInt(quantityInput.value) > maxStock) {
                quantityInput.value = maxStock;
            }
            
            updateSaleTotal();
        } else {
            priceInput.value = '';
            const totalInput = document.getElementById(DOM_IDS.saleForm.total);
            if (totalInput) {
                totalInput.value = '';
            }
        }
    } catch (error) {
        console.error('Error updating sale price:', error);
    }
}

/**
 * Update sale total when quantity or price changes
 */
function updateSaleTotal() {
    try {
        const priceInput = document.getElementById(DOM_IDS.saleForm.price);
        const quantityInput = document.getElementById(DOM_IDS.saleForm.quantity);
        const totalInput = document.getElementById(DOM_IDS.saleForm.total);
        
        if (!priceInput || !quantityInput || !totalInput) {
            console.error('Required elements not found for updateSaleTotal',
                {priceInput, quantityInput, totalInput});
            return;
        }
        
        if (priceInput.value && quantityInput.value) {
            const price = parseFloat(priceInput.value);
            const quantity = parseInt(quantityInput.value);
            const total = price * quantity;
            
            totalInput.value = total.toFixed(2);
        } else {
            totalInput.value = '';
        }
    } catch (error) {
        console.error('Error updating sale total:', error);
    }
}

/**
 * Add a new sale
 */
function addSale() {
    try {
        console.log('Adding new sale');
        
        // Get form values
        const productSelect = document.getElementById(DOM_IDS.saleForm.product);
        const quantityInput = document.getElementById(DOM_IDS.saleForm.quantity);
        const priceInput = document.getElementById(DOM_IDS.saleForm.price);
        const customerMobileInput = document.getElementById(DOM_IDS.saleForm.customerMobile);
        
        if (!productSelect || !quantityInput || !priceInput || !customerMobileInput) {
            console.error('Required form elements not found for addSale',
                {productSelect, quantityInput, priceInput, customerMobileInput});
            alert('Error: Form elements not found');
            return;
        }
        
        const productId = productSelect.value;
        const quantity = parseInt(quantityInput.value);
        const price = parseFloat(priceInput.value);
        const customerMobile = customerMobileInput.value;
        
        // Validate inputs
        if (!productId) {
            alert('Please select a product');
            return;
        }
        
        if (isNaN(quantity) || quantity <= 0) {
            alert('Please enter a valid quantity');
            return;
        }
        
        if (isNaN(price) || price <= 0) {
            alert('Please enter a valid price');
            return;
        }
        
        // Mobile validation - assuming 10 digits for Indian mobile
        const MOBILE_LENGTH = 10;
        if (!customerMobile || customerMobile.length !== MOBILE_LENGTH) {
            alert(`Please enter a valid ${MOBILE_LENGTH}-digit mobile number`);
            return;
        }
        
        // Get product to check stock
        const product = db.getProductById(productId);
        if (!product) {
            console.error(`Product not found with ID: ${productId}`);
            alert('Error: Product not found');
            return;
        }
        
        if (product.stock < quantity) {
            alert(`Not enough stock. Only ${product.stock} available.`);
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
        
        console.log('Creating sale:', sale);
        
        // Add sale to database
        try {
            db.addSale(sale);
            console.log('Sale added successfully');
            
            // Close modal
            closeModalBox();
            
            // Refresh sales table
            loadSalesTable();
            
            // Refresh dashboard if we're on it
            if (currentPage === 'dashboard') {
                loadDashboard();
            }
            
            // Show success message
            alert('Sale recorded successfully!');
        } catch (dbError) {
            console.error('Database error adding sale:', dbError);
            alert('Failed to add sale: ' + dbError.message);
        }
    } catch (error) {
        console.error('Error adding sale:', error);
        alert('Failed to add sale: ' + error.message);
    }
}

/**
 * Send invoice for a sale
 * @param {string} saleId - Sale ID
 */
function sendInvoice(saleId) {
    // Get sale and product
    const sale = db.getSaleById(saleId);
    if (!sale) {
        alert('Sale not found');
        return;
    }
    
    const product = db.getProductById(sale.productId);
    if (!product) {
        alert('Product not found for this sale');
        return;
    }
    
    // Generate invoice
    const invoice = generateInvoice(sale, product);
    
    // Send via WhatsApp
    sendWhatsAppInvoice(sale.customerMobile, invoice);
}

/**
 * Generate invoice for WhatsApp
 * @param {Object} sale - Sale object
 * @param {Object} product - Product object
 * @returns {string} Invoice text
 */
function generateInvoice(sale, product) {
    const total = (sale.price * sale.quantity).toFixed(2);

    const shopName = "Vaibhav Furnishing";
    const slogan = "Furnishing your home like ours.";
    const owner = "Atul Mittal";
    const contact = "8178464560, 9205014813";
    const address = "Jain Gali, Main Market, Baniya Wada, Rajender Parshad Vali Gali, Ballabgarh";

    const invoiceText = `
🧾 *${shopName}*
_${slogan}_

👤 *Customer Invoice*
🛏️ Product: ${product.name}
✨ Quality: ${product.quality}
🔢 Quantity: ${sale.quantity}
💸 Price: ${formatCurrency(sale.price)}
📦 Total: ${formatCurrency(total)}

🧍‍♂️ Seller: ${owner}
📞 Contact: ${contact}
📍 Address: ${address}

🎁 *Special Offer:* Get an extra 5% discount on your next purchase!

🔄 *Replacement Policy:* We offer a 5-day replacement policy.
After 5 days, the product will not be replaced under any circumstances.
`;

    return invoiceText;
}

/**
 * Send WhatsApp message with invoice
 * @param {string} mobile - Customer mobile number
 * @param {string} message - Invoice message
 */
function sendWhatsAppInvoice(mobile, message) {
    // Ensure mobile has no leading + or country code
    const formattedMobile = mobile.replace(/^\+/, '');
    
    // Create WhatsApp URL
    const whatsappUrl = `${WHATSAPP_CONFIG.baseUrl}${formattedMobile}?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in new window
    window.open(whatsappUrl, '_blank');
}

/**
 * Confirm sale deletion
 * @param {string} saleId - Sale ID to delete
 */
function confirmDeleteSale(saleId) {
    // Get sale
    const sale = db.getSaleById(saleId);
    if (!sale) {
        alert('Sale not found');
        return;
    }
    
    const product = db.getProductById(sale.productId);
    const productName = product ? product.name : 'Unknown Product';
    
    // Create confirmation modal content
    const container = document.createElement('div');
    container.classList.add('confirmation-modal');
    
    container.innerHTML = `
        <h2>Confirm Deletion</h2>
        <p>Are you sure you want to delete this sale of "${productName}"?</p>
        <p>Note: This will not restore the product stock.</p>
        <div class="${CSS_CLASSES.formActions}">
            <button id="confirm-delete" class="${CSS_CLASSES.primaryBtn} ${CSS_CLASSES.dangerBtn}">Delete</button>
            <button id="cancel-delete" class="${CSS_CLASSES.secondaryBtn}">Cancel</button>
        </div>
    `;
    
    // Set up confirmation button
    const confirmButton = container.querySelector('#confirm-delete');
    confirmButton.addEventListener('click', function() {
        deleteSale(saleId);
    });
    
    // Set up cancel button
    const cancelButton = container.querySelector('#cancel-delete');
    cancelButton.addEventListener('click', closeModalBox);
    
    // Show modal
    showModal(container);
}

/**
 * Delete a sale
 * @param {string} saleId - Sale ID to delete
 */
function deleteSale(saleId) {
    // Delete sale from database
    const success = db.deleteSale(saleId);
    
    if (!success) {
        alert('Failed to delete sale');
        return;
    }
    
    // Close modal
    closeModalBox();
    
    // Reload sales table
    loadSalesTable();
    
    // Reload dashboard if we're on it
    if (currentPage === 'dashboard') {
        loadDashboard();
    }
} 