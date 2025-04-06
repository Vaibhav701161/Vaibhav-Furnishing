document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const productSelect = document.getElementById('product-select');
    const productInfo = document.querySelector('.product-info');
    const productImage = document.getElementById('product-image');
    const productName = document.getElementById('product-name');
    const productCategory = document.getElementById('product-category');
    const stockStatus = document.getElementById('stock-status');
    const stockQuantity = document.getElementById('stock-quantity');
    const sellingPrice = document.getElementById('selling-price');
    const minPrice = document.getElementById('min-price');
    const finalPrice = document.getElementById('final-price');
    const quantity = document.getElementById('quantity');
    const discountPercentage = document.getElementById('discount-percentage');
    const subtotal = document.getElementById('subtotal');
    const totalDiscount = document.getElementById('total-discount');
    const grandTotal = document.getElementById('grand-total');
    const salesForm = document.getElementById('sales-form');
    const resetBtn = document.getElementById('reset-btn');
    const billPreview = document.getElementById('bill-preview');
    const billContent = document.getElementById('bill-content');
    const printBill = document.getElementById('print-bill');
    const downloadBill = document.getElementById('download-bill');

    // Initialize
    let products = window.utils.getProducts() || [];
    let selectedProduct = null;
    populateProductSelect();

    // Event Listeners
    productSelect.addEventListener('change', handleProductSelect);
    finalPrice.addEventListener('input', handlePriceChange);
    quantity.addEventListener('input', updateTotals);
    salesForm.addEventListener('submit', handleFormSubmit);
    resetBtn.addEventListener('click', resetForm);
    printBill.addEventListener('click', handlePrintBill);
    downloadBill.addEventListener('click', handleDownloadBill);

    // Functions
    function populateProductSelect() {
        productSelect.innerHTML = `
            <option value="">Choose a product...</option>
            ${products.map(product => `
                <option value="${product.id}">${product.name} - ₹${product.sellingPrice}</option>
            `).join('')}
        `;
    }

    function handleProductSelect() {
        const productId = productSelect.value;
        if (!productId) {
            productInfo.classList.add('hidden');
            selectedProduct = null;
            return;
        }

        selectedProduct = products.find(p => p.id === productId);
        if (!selectedProduct) return;

        productInfo.classList.remove('hidden');
        updateProductDisplay();
        resetPriceInputs();
    }

    function updateProductDisplay() {
        productImage.src = selectedProduct.image;
        productImage.alt = selectedProduct.name;
        productName.textContent = selectedProduct.name;
        productCategory.textContent = selectedProduct.category;
        
        const stockClass = getStockClass(selectedProduct.quantity);
        stockStatus.className = stockClass;
        stockStatus.textContent = getStockLabel(selectedProduct.quantity);
        stockQuantity.textContent = `${selectedProduct.quantity} units available`;

        sellingPrice.textContent = `₹${selectedProduct.sellingPrice.toFixed(2)}`;
        minPrice.textContent = `₹${selectedProduct.minPrice.toFixed(2)}`;
        
        finalPrice.min = selectedProduct.minPrice;
        finalPrice.max = selectedProduct.sellingPrice;
        finalPrice.value = selectedProduct.sellingPrice;
        
        quantity.max = selectedProduct.quantity;
        
        updateTotals();
    }

    function getStockClass(quantity) {
        if (quantity === 0) return 'out-of-stock';
        if (quantity <= 5) return 'low-stock';
        return 'in-stock';
    }

    function getStockLabel(quantity) {
        if (quantity === 0) return 'Out of Stock';
        if (quantity <= 5) return 'Low Stock';
        return 'In Stock';
    }

    function handlePriceChange() {
        if (!selectedProduct) return;

        const price = parseFloat(finalPrice.value);
        if (isNaN(price)) return;

        if (price < selectedProduct.minPrice) {
            showToast('Price cannot be lower than the minimum price!', 'error');
            finalPrice.value = selectedProduct.minPrice;
        } else if (price > selectedProduct.sellingPrice) {
            showToast('Price cannot be higher than the selling price!', 'error');
            finalPrice.value = selectedProduct.sellingPrice;
        }

        const discount = ((selectedProduct.sellingPrice - price) / selectedProduct.sellingPrice) * 100;
        discountPercentage.textContent = `${discount.toFixed(1)}%`;
        
        updateTotals();
    }

    function updateTotals() {
        if (!selectedProduct) return;

        const price = parseFloat(finalPrice.value);
        const qty = parseInt(quantity.value);
        
        if (isNaN(price) || isNaN(qty)) return;

        const subtotalValue = selectedProduct.sellingPrice * qty;
        const discountValue = (selectedProduct.sellingPrice - price) * qty;
        const grandTotalValue = price * qty;

        subtotal.textContent = `₹${subtotalValue.toFixed(2)}`;
        totalDiscount.textContent = `₹${discountValue.toFixed(2)}`;
        grandTotal.textContent = `₹${grandTotalValue.toFixed(2)}`;
    }

    function handleFormSubmit(e) {
        e.preventDefault();

        if (!selectedProduct) {
            showToast('Please select a product', 'error');
            return;
        }

        const customerName = document.getElementById('customer-name').value;
        const customerPhone = document.getElementById('customer-phone').value;

        const sale = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            product: selectedProduct,
            quantity: parseInt(quantity.value),
            finalPrice: parseFloat(finalPrice.value),
            subtotal: parseFloat(subtotal.textContent.replace('₹', '')),
            discount: parseFloat(totalDiscount.textContent.replace('₹', '')),
            total: parseFloat(grandTotal.textContent.replace('₹', '')),
            customer: {
                name: customerName,
                phone: customerPhone
            }
        };

        // Update product quantity
        selectedProduct.quantity -= sale.quantity;
        window.utils.saveProducts(products);

        // Save sale
        const sales = window.utils.getSales() || [];
        sales.push(sale);
        window.utils.saveSales(sales);

        // Show bill preview
        generateBill(sale);
        billPreview.classList.remove('hidden');
        
        showToast('Sale completed successfully!', 'success');
    }

    function generateBill(sale) {
        const date = new Date(sale.date).toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        billContent.innerHTML = `
            <div class="bill">
                <div class="bill-header">
                    <h2>Vaibhav Furnishing</h2>
                    <p>Premium Home Furnishing Solutions</p>
                    <p class="bill-date">Date: ${date}</p>
                    <p>Bill No: ${sale.id}</p>
                </div>
                
                <div class="customer-info">
                    <p><strong>Customer Name:</strong> ${sale.customer.name}</p>
                    <p><strong>Phone:</strong> ${sale.customer.phone}</p>
                </div>

                <table class="bill-table">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Price</th>
                            <th>Qty</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>${sale.product.name}</td>
                            <td>₹${sale.finalPrice.toFixed(2)}</td>
                            <td>${sale.quantity}</td>
                            <td>₹${sale.total.toFixed(2)}</td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colspan="3">Subtotal</td>
                            <td>₹${sale.subtotal.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td colspan="3">Discount</td>
                            <td>₹${sale.discount.toFixed(2)}</td>
                        </tr>
                        <tr class="grand-total">
                            <td colspan="3">Grand Total</td>
                            <td>₹${sale.total.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>

                <div class="bill-footer">
                    <p>Thank you for shopping with us!</p>
                    <p>For any queries, please contact: +91 1234567890</p>
                </div>
            </div>
        `;
    }

    function handlePrintBill() {
        window.print();
    }

    function handleDownloadBill() {
        const billHtml = billContent.innerHTML;
        const blob = new Blob([billHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bill-${Date.now()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function resetForm() {
        salesForm.reset();
        productInfo.classList.add('hidden');
        billPreview.classList.add('hidden');
        selectedProduct = null;
    }

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        document.querySelector('.toast-container').appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Update date in the header
    const dateElement = document.querySelector('.subtitle');
    if (dateElement) {
        dateElement.textContent = `Create new sale with discount validation • ${new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })}`;
    }
}); 