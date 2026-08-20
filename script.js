// ============================================================
// Q CRACKERS — PERSISTENT CART COUNTER
// ============================================================

// Cart state management
const CartManager = {
    // Storage key
    STORAGE_KEY: 'qcrackers_cart',
    
    // Get cart from localStorage
    getCart() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch {
            return {};
        }
    },
    
    // Save cart to localStorage
    saveCart(cart) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
        this.updateCartBadge();
    },
    
    // Add item to cart
    addItem(productName, quantity = 1) {
        const cart = this.getCart();
        cart[productName] = (cart[productName] || 0) + quantity;
        this.saveCart(cart);
    },
    
    // Remove item from cart
    removeItem(productName) {
        const cart = this.getCart();
        delete cart[productName];
        this.saveCart(cart);
    },
    
    // Update item quantity
    updateQuantity(productName, quantity) {
        const cart = this.getCart();
        if (quantity <= 0) {
            delete cart[productName];
        } else {
            cart[productName] = quantity;
        }
        this.saveCart(cart);
    },
    
    // Clear entire cart
    clearCart() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.updateCartBadge();
    },
    
    // Get total number of items in cart
    getTotalItems() {
        const cart = this.getCart();
        return Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    },
    
    // Get cart as array of {name, quantity}
    getCartItems() {
        const cart = this.getCart();
        return Object.entries(cart).map(([name, quantity]) => ({
            name,
            quantity
        }));
    },
    
    // Update the cart badge in the header
    updateCartBadge() {
        const total = this.getTotalItems();
        
        // Update all cart badge elements
        document.querySelectorAll('.cart-badge').forEach(badge => {
            badge.textContent = total;
            badge.style.display = total > 0 ? 'flex' : 'none';
        });
        
        // Update header cart total
        const headerCartTotal = document.getElementById('header-cart-total');
        if (headerCartTotal) {
            headerCartTotal.textContent = total > 0 ? `₹${this.getCartTotal()}` : '₹0';
        }
        
        // Update cart-modal count
        const cartModalCount = document.getElementById('cart-modal-count');
        if (cartModalCount) {
            cartModalCount.textContent = total;
        }
    },
    
    // Get cart total price
    getCartTotal() {
        const cart = this.getCart();
        let total = 0;
        
        // Get all product rows and calculate total
        document.querySelectorAll('.product-table tbody tr').forEach(row => {
            const name = row.dataset.name || row.querySelector('.product-name')?.textContent || '';
            const price = parseFloat(row.dataset.price) || 0;
            const qty = cart[name] || 0;
            total += price * qty;
        });
        
        return total;
    },
    
    // Increase item quantity (for cart modal)
    increaseItem(name) {
        const cart = this.getCart();
        cart[name] = (cart[name] || 0) + 1;
        this.saveCart(cart);
        // Re-render cart modal
        if (typeof renderCartModal === 'function') {
            renderCartModal();
        }
    },
    
    // Decrease item quantity (for cart modal)
    decreaseItem(name) {
        const cart = this.getCart();
        if (cart[name] > 1) {
            cart[name]--;
            this.saveCart(cart);
        } else {
            this.removeItem(name);
        }
        // Re-render cart modal
        if (typeof renderCartModal === 'function') {
            renderCartModal();
        }
    }
};

// ============================================================
// SYNC PRODUCT TABLE WITH CART
// ============================================================

function syncProductTableWithCart() {
    const rows = document.querySelectorAll('.product-table tbody tr');
    const cart = CartManager.getCart();
    
    rows.forEach(row => {
        const name = row.dataset.name || row.querySelector('.product-name')?.textContent || '';
        const qtyInput = row.querySelector('.qty-input');
        const cartQty = cart[name] || 0;
        
        if (qtyInput) {
            qtyInput.value = cartQty;
        }
        
        // Update row amount
        const price = parseFloat(row.dataset.price) || 0;
        const amount = cartQty * price;
        const amountCell = row.querySelector('.row-amount');
        if (amountCell) {
            amountCell.textContent = amount > 0 ? '₹' + amount.toLocaleString('en-IN') : '₹0';
        }
    });
    
    updateCartTotals();
}

// ============================================================
// UPDATE CART TOTALS
// ============================================================

function updateCartTotals() {
    const rows = document.querySelectorAll('.product-table tbody tr');
    const cart = CartManager.getCart();
    let items = 0, discount = 0, total = 0;
    
    rows.forEach(row => {
        const name = row.dataset.name || row.querySelector('.product-name')?.textContent || '';
        const qty = cart[name] || 0;
        const mrp = parseFloat(row.dataset.mrp) || 0;
        const price = parseFloat(row.dataset.price) || 0;
        const amount = qty * price;
        
        items += qty;
        discount += qty * (mrp - price);
        total += amount;
    });
    
    // Update UI elements
    const itemsEl = document.getElementById('cart-items');
    const discountEl = document.getElementById('cart-discount');
    const totalEl = document.getElementById('cart-total');
    const headerCartTotal = document.getElementById('header-cart-total');
    const cartBadge = document.getElementById('cart-badge');
    const cartModalCount = document.getElementById('cart-modal-count');
    const cartModalTotalProducts = document.getElementById('cart-modal-total-products');
    const cartModalDiscount = document.getElementById('cart-modal-discount');
    const cartModalOverallTotal = document.getElementById('cart-modal-overall-total');
    
    if (itemsEl) itemsEl.textContent = items;
    if (discountEl) discountEl.textContent = '₹' + discount.toLocaleString('en-IN');
    if (totalEl) totalEl.textContent = '₹' + total.toLocaleString('en-IN');
    if (headerCartTotal) headerCartTotal.textContent = '₹' + total.toLocaleString('en-IN');
    if (cartBadge) {
        cartBadge.textContent = items;
        cartBadge.style.display = items > 0 ? 'flex' : 'none';
    }
    if (cartModalCount) cartModalCount.textContent = items;
    if (cartModalTotalProducts) cartModalTotalProducts.textContent = items;
    if (cartModalDiscount) cartModalDiscount.textContent = '₹' + discount.toLocaleString('en-IN');
    if (cartModalOverallTotal) cartModalOverallTotal.textContent = '₹' + total.toLocaleString('en-IN');
    
    // Update cart modal warning
    const minOrder = 2500;
    const warningEl = document.getElementById('cart-min-order-warning');
    const warningTotalEl = document.getElementById('cart-warning-total');
    if (warningEl) {
        if (total > 0 && total < minOrder) {
            warningEl.style.display = 'flex';
            if (warningTotalEl) warningTotalEl.textContent = '₹' + total.toLocaleString('en-IN');
        } else {
            warningEl.style.display = 'none';
        }
    }
    
    // Update submit button
    const submitBtn = document.getElementById('submit-enquiry');
    const submitWarning = document.getElementById('submit-warning');
    const submitWarningTotal = document.getElementById('submit-warning-total');
    if (submitBtn) {
        if (total === 0 || total < minOrder) {
            submitBtn.classList.add('btn-submit-disabled');
            submitBtn.classList.remove('btn-submit-enabled');
        } else {
            submitBtn.classList.remove('btn-submit-disabled');
            submitBtn.classList.add('btn-submit-enabled');
        }
    }
    if (submitWarning && submitWarningTotal) {
        if (total > 0 && total < minOrder) {
            submitWarning.style.display = 'flex';
            submitWarningTotal.textContent = '₹' + total.toLocaleString('en-IN');
        } else {
            submitWarning.style.display = 'none';
        }
    }
}

// ============================================================
// PRODUCT TABLE EVENT SETUP
// ============================================================

function setupProductTableEvents() {
    const rows = document.querySelectorAll('.product-table tbody tr');
    
    rows.forEach(row => {
        const qtyInput = row.querySelector('.qty-input');
        const minusBtn = row.querySelector('.qty-btn.minus');
        const plusBtn = row.querySelector('.qty-btn.plus');
        
        // Update cart when quantity changes
        const updateQuantity = () => {
            const name = row.dataset.name || row.querySelector('.product-name')?.textContent || '';
            const qty = parseInt(qtyInput?.value, 10) || 0;
            
            if (qty > 0) {
                CartManager.updateQuantity(name, qty);
            } else {
                CartManager.removeItem(name);
            }
            
            syncProductTableWithCart();
        };
        
        if (qtyInput) {
            qtyInput.addEventListener('change', updateQuantity);
            qtyInput.addEventListener('keyup', function(e) {
                if (e.key === 'Enter') updateQuantity();
            });
        }
        
        if (minusBtn) {
            minusBtn.addEventListener('click', () => {
                const current = parseInt(qtyInput?.value, 10) || 0;
                if (qtyInput) {
                    qtyInput.value = Math.max(0, current - 1);
                    updateQuantity();
                }
            });
        }
        
        if (plusBtn) {
            plusBtn.addEventListener('click', () => {
                const current = parseInt(qtyInput?.value, 10) || 0;
                if (qtyInput) {
                    qtyInput.value = current + 1;
                    updateQuantity();
                }
            });
        }
    });
}

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart badge
    CartManager.updateCartBadge();
    
    // Check if on products page
    if (document.querySelector('.product-table')) {
        // First sync from localStorage
        syncProductTableWithCart();
        // Then setup events
        setTimeout(setupProductTableEvents, 100);
    }
    
    // Cart modal open/close
    const openCartBtn = document.getElementById('open-cart-btn');
    const cartModal = document.getElementById('cart-modal');
    const cartModalClose = document.getElementById('cart-modal-close');
    const cartContinueBtn = document.getElementById('cart-continue-btn');
    const cartCheckoutBtn = document.getElementById('cart-checkout-btn');
    
    if (openCartBtn && cartModal) {
        openCartBtn.addEventListener('click', function() {
            cartModal.classList.add('active');
            // Re-render cart modal
            if (typeof renderCartModal === 'function') {
                renderCartModal();
            }
        });
    }
    
    if (cartModalClose && cartModal) {
        cartModalClose.addEventListener('click', function() {
            cartModal.classList.remove('active');
        });
    }
    
    if (cartContinueBtn && cartModal) {
        cartContinueBtn.addEventListener('click', function() {
            cartModal.classList.remove('active');
        });
    }
    
    // Click outside to close modal
    if (cartModal) {
        cartModal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    }
    
    // Checkout button
    if (cartCheckoutBtn) {
        cartCheckoutBtn.addEventListener('click', function() {
            const totalItems = CartManager.getTotalItems();
            if (totalItems === 0) {
                alert('Cart is empty!');
                return;
            }
            
            // Check minimum order
            const cart = CartManager.getCart();
            let totalAmount = 0;
            document.querySelectorAll('.product-table tbody tr').forEach(row => {
                const name = row.dataset.name || row.querySelector('.product-name')?.textContent || '';
                const price = parseFloat(row.dataset.price) || 0;
                const qty = cart[name] || 0;
                totalAmount += price * qty;
            });
            
            if (totalAmount < 2500) {
                alert(`Minimum order is ₹2500. Current total: ₹${totalAmount.toLocaleString('en-IN')}`);
                return;
            }
            
            // Close cart modal and open order summary
            if (cartModal) cartModal.classList.remove('active');
            const orderSummaryModal = document.getElementById('order-summary-modal');
            if (orderSummaryModal) {
                orderSummaryModal.classList.add('active');
                const orderDate = document.getElementById('os-order-date');
                if (orderDate) {
                    orderDate.textContent = new Date().toLocaleDateString('en-GB');
                }
                if (typeof renderOrderSummaryModal === 'function') {
                    renderOrderSummaryModal();
                }
            }
        });
    }
    
    // Submit enquiry button
    const submitBtn = document.getElementById('submit-enquiry');
    if (submitBtn) {
        submitBtn.addEventListener('click', function() {
            const cart = CartManager.getCart();
            let totalAmount = 0, totalItems = 0;
            
            document.querySelectorAll('.product-table tbody tr').forEach(row => {
                const name = row.dataset.name || row.querySelector('.product-name')?.textContent || '';
                const price = parseFloat(row.dataset.price) || 0;
                const qty = cart[name] || 0;
                totalAmount += price * qty;
                totalItems += qty;
            });
            
            if (totalItems === 0) {
                alert('Please add items to your cart.');
                return;
            }
            
            if (totalAmount < 2500) {
                alert(`Minimum order amount is ₹2500. Your current total is ₹${totalAmount.toLocaleString('en-IN')}. Please add more items.`);
                return;
            }
            
            const orderSummaryModal = document.getElementById('order-summary-modal');
            if (orderSummaryModal) {
                orderSummaryModal.classList.add('active');
                const orderDate = document.getElementById('os-order-date');
                if (orderDate) {
                    orderDate.textContent = new Date().toLocaleDateString('en-GB');
                }
                if (typeof renderOrderSummaryModal === 'function') {
                    renderOrderSummaryModal();
                }
            }
        });
    }
});

// ============================================================
// EXPOSE FUNCTIONS TO GLOBAL
// ============================================================

window.CartManager = CartManager;
window.syncProductTableWithCart = syncProductTableWithCart;
window.updateCartTotals = updateCartTotals;

console.log('🛒 Q Crackers Cart Manager loaded!');
console.log(`📦 Items in cart: ${CartManager.getTotalItems()}`);