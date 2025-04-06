// Product management functionality
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const adminProfile = document.getElementById('admin-profile');
    const addProductBtn = document.getElementById('addProductBtn');
    const emptyStateAddBtn = document.getElementById('emptyStateAddBtn');
    const downloadReportBtn = document.getElementById('downloadReportBtn');
    const viewAllBtn = document.getElementById('viewAllBtn');
    const productModal = document.getElementById('productModal');
    const modalTitle = document.getElementById('modalTitle');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const productForm = document.getElementById('productForm');
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortBy = document.getElementById('sortBy');
    const gridViewBtn = document.getElementById('gridViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    const productsContainer = document.getElementById('productsContainer');
    const emptyState = document.getElementById('emptyState');
    const sellingPrice = document.getElementById('sellingPrice');
    const costPrice = document.getElementById('costPrice');
    const minPrice = document.getElementById('minPrice');
    const saveProductBtn = document.getElementById('saveProductBtn');
    const currentDateElement = document.getElementById('current-date');

    // State
    let products = window.utils.getProducts() || [];
    let currentProduct = null;
    let currentView = 'grid';
    let filteredProducts = [...products];

    // Initialize
    updateProductsDisplay();
    updateDateDisplay();

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

    // Modal Events
    addProductBtn.addEventListener('click', openAddProductModal);
    emptyStateAddBtn.addEventListener('click', openAddProductModal);
    closeModal.addEventListener('click', closeProductModal);
    cancelBtn.addEventListener('click', closeProductModal);
    productForm.addEventListener('submit', handleFormSubmit);

    // Price Calculation
    sellingPrice.addEventListener('input', calculateMinPrice);
    costPrice.addEventListener('input', calculateMinPrice);

    // Search and Filter Events
    searchInput.addEventListener('input', filterProducts);
    categoryFilter.addEventListener('change', filterProducts);
    sortBy.addEventListener('change', filterProducts);

    // View Toggle
    gridViewBtn.addEventListener('click', function() {
        setView('grid');
    });
    
    listViewBtn.addEventListener('click', function() {
        setView('list');
    });

    // Download Report
    downloadReportBtn.addEventListener('click', downloadProductsReport);

    // View All
    viewAllBtn.addEventListener('click', viewAllProducts);

    // Functions
    function updateDateDisplay() {
        if (currentDateElement) {
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            const today = new Date().toLocaleDateString('en-US', options);
            currentDateElement.textContent = `Manage your product inventory • ${today}`;
        }
    }

    function openAddProductModal() {
        modalTitle.textContent = 'Add New Product';
        productForm.reset();
        currentProduct = null;
        calculateMinPrice();
        productModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function openEditProductModal(product) {
        modalTitle.textContent = 'Edit Product';
        currentProduct = product;
        
        // Fill form with product data
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('sellingPrice').value = product.sellingPrice;
        document.getElementById('costPrice').value = product.costPrice;
        document.getElementById('minPrice').value = product.minPrice;
        document.getElementById('stockQuantity').value = product.quantity;
        document.getElementById('productImage').value = product.image;
        document.getElementById('productDescription').value = product.description;
        
        productModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeProductModal() {
        productModal.classList.remove('active');
        document.body.style.overflow = '';
        setTimeout(() => productForm.reset(), 300);
    }

    function calculateMinPrice() {
        const selling = parseFloat(sellingPrice.value) || 0;
        const cost = parseFloat(costPrice.value) || 0;
        
        if (selling > 0 && cost > 0) {
            const calculatedMin = ((selling - cost) / 2) + cost;
            minPrice.value = calculatedMin.toFixed(2);
        } else {
            minPrice.value = '';
        }
    }

    function handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            sellingPrice: parseFloat(document.getElementById('sellingPrice').value),
            costPrice: parseFloat(document.getElementById('costPrice').value),
            minPrice: parseFloat(document.getElementById('minPrice').value),
            quantity: parseInt(document.getElementById('stockQuantity').value),
            image: document.getElementById('productImage').value,
            description: document.getElementById('productDescription').value
        };

        if (currentProduct) {
            // Update existing product
            const index = products.findIndex(p => p.id === currentProduct.id);
            if (index !== -1) {
                products[index] = { ...currentProduct, ...formData };
                window.utils.showToast('Product updated successfully!', 'success');
            }
        } else {
            // Add new product
            const newProduct = {
                id: Date.now().toString(),
                ...formData,
                dateAdded: new Date().toISOString()
            };
            
            products.unshift(newProduct);
            window.utils.showToast('Product added successfully!', 'success');
        }
        
        // Save products and update display
        window.utils.saveProducts(products);
        filteredProducts = [...products];
        updateProductsDisplay();
        closeProductModal();
    }

    function filterProducts() {
        const searchTerm = searchInput.value.toLowerCase();
        const category = categoryFilter.value;
        const sort = sortBy.value;
        
        // Filter by search term and category
        filteredProducts = products.filter(product => {
            const matchesSearch = 
                product.name.toLowerCase().includes(searchTerm) || 
                product.description.toLowerCase().includes(searchTerm);
                
            const matchesCategory = category === 'all' || product.category === category;
            
            return matchesSearch && matchesCategory;
        });
        
        // Sort products
        filteredProducts.sort((a, b) => {
            switch (sort) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'price':
                    return a.sellingPrice - b.sellingPrice;
                case 'priceDesc':
                    return b.sellingPrice - a.sellingPrice;
                case 'stock':
                    return b.quantity - a.quantity;
                default:
                    return 0;
            }
        });
        
        updateProductsDisplay();
    }

    function updateProductsDisplay() {
        // Clear products container except for empty state
        const productsHtml = [];
        
        if (filteredProducts.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            
            filteredProducts.forEach(product => {
                const stockStatus = getStockStatus(product.quantity);
                
                productsHtml.push(`
                    <div class="product-card" data-id="${product.id}">
                        <div class="product-image">
                            <img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                        </div>
                        <div class="product-details">
                            <h3 class="product-title">${product.name}</h3>
                            <p class="product-category">${product.category}</p>
                            <div class="product-price">
                                <span class="selling-price">₹${product.sellingPrice.toFixed(2)}</span>
                                <span class="min-price">Min: ₹${product.minPrice.toFixed(2)}</span>
                            </div>
                            <div class="product-stock">
                                <span class="stock-badge ${stockStatus.class}">${stockStatus.label}</span>
                                <span class="stock-text">${product.quantity} units</span>
                            </div>
                            <div class="product-actions">
                                <button class="action-btn edit-btn" data-id="${product.id}">
                                    <i class="fas fa-edit"></i>
                                    <span>Edit</span>
                                </button>
                                <button class="action-btn delete-btn" data-id="${product.id}">
                                    <i class="fas fa-trash"></i>
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    </div>
                `);
            });
        }
        
        // Update container with products
        productsContainer.innerHTML = emptyState.outerHTML + productsHtml.join('');
        
        // Add event listeners to edit and delete buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', handleEditProduct);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteProduct);
        });
    }

    function getStockStatus(quantity) {
        if (quantity === 0) {
            return { class: 'out-of-stock', label: 'Out of Stock' };
        } else if (quantity <= 5) {
            return { class: 'low-stock', label: 'Low Stock' };
        } else {
            return { class: 'in-stock', label: 'In Stock' };
        }
    }

    function handleEditProduct(e) {
        const productId = e.currentTarget.dataset.id;
        const product = products.find(p => p.id === productId);
        
        if (product) {
            openEditProductModal(product);
        }
    }

    function handleDeleteProduct(e) {
        const productId = e.currentTarget.dataset.id;
        const product = products.find(p => p.id === productId);
        
        if (product) {
            if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
                products = products.filter(p => p.id !== productId);
                window.utils.saveProducts(products);
                window.utils.showToast('Product deleted successfully!', 'success');
                filteredProducts = filteredProducts.filter(p => p.id !== productId);
                updateProductsDisplay();
            }
        }
    }

    function setView(view) {
        currentView = view;
        
        if (view === 'grid') {
            productsContainer.classList.remove('list-view');
            productsContainer.classList.add('grid-view');
            gridViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
        } else {
            productsContainer.classList.remove('grid-view');
            productsContainer.classList.add('list-view');
            gridViewBtn.classList.remove('active');
            listViewBtn.classList.add('active');
        }
    }

    function downloadProductsReport() {
        const report = {
            date: new Date().toISOString(),
            totalProducts: products.length,
            totalValue: products.reduce((sum, product) => sum + (product.sellingPrice * product.quantity), 0),
            products: products.map(product => ({
                id: product.id,
                name: product.name,
                category: product.category,
                sellingPrice: product.sellingPrice,
                costPrice: product.costPrice,
                minPrice: product.minPrice,
                quantity: product.quantity,
                value: product.sellingPrice * product.quantity
            }))
        };
        
        const reportString = JSON.stringify(report, null, 2);
        const blob = new Blob([reportString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `product-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        window.utils.showToast('Product report downloaded successfully!', 'success');
    }

    function viewAllProducts() {
        // Reset all filters and display all products
        searchInput.value = '';
        categoryFilter.value = 'all';
        sortBy.value = 'name';
        filteredProducts = [...products];
        updateProductsDisplay();
        window.utils.showToast('Showing all products', 'success');
    }

    // Generate some dummy data if no products exist
    function generateDummyData() {
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
            filteredProducts = [...products];
            window.utils.showToast('Sample products loaded!', 'success');
            updateProductsDisplay();
        }
    }
    
    // Initialize with dummy data if needed
    generateDummyData();
}); 