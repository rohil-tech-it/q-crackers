// ============================================================
// Q CRACKERS - PERSISTENT CART (Works on ALL Pages)
// ============================================================

var CartManager = {
    STORAGE_KEY: 'qcrackers_cart',

    // Get cart from localStorage
    getCart: function() {
        try {
            var data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (e) {
            return {};
        }
    },

    // Save cart to localStorage
    saveCart: function(cart) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
        this.updateAll();
    },

    // Add item to cart
    addItem: function(productName, price, quantity) {
        if (quantity === undefined) quantity = 1;
        var cart = this.getCart();
        if (cart[productName]) {
            cart[productName].qty = (cart[productName].qty || 0) + quantity;
            cart[productName].price = price || cart[productName].price || 0;
        } else {
            cart[productName] = {
                qty: quantity,
                price: price || 0
            };
        }
        this.saveCart(cart);
        this.updateProductTable();
    },

    removeItem: function(productName) {
        var cart = this.getCart();
        delete cart[productName];
        this.saveCart(cart);
        this.updateProductTable();
    },

    updateQuantity: function(productName, quantity) {
        var cart = this.getCart();
        if (cart[productName]) {
            if (quantity <= 0) {
                delete cart[productName];
            } else {
                cart[productName].qty = quantity;
            }
        }
        this.saveCart(cart);
        this.updateProductTable();
    },

    clearCart: function() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.updateAll();
        this.updateProductTable();
    },

    // ✅ Get total number of items (1, 2, 3...)
    getTotalItems: function() {
        var cart = this.getCart();
        var total = 0;
        for (var key in cart) {
            if (cart.hasOwnProperty(key)) {
                total += cart[key].qty || 0;
            }
        }
        return total;
    },

    // ✅ Get total amount
    getTotalAmount: function() {
        var items = this.getCartItems();
        var total = 0;
        items.forEach(function(item) {
            total += item.amount;
        });
        return total;
    },

    getCartItems: function() {
        var cart = this.getCart();
        var items = [];
        for (var name in cart) {
            if (cart.hasOwnProperty(name)) {
                items.push({
                    name: name,
                    qty: cart[name].qty || 0,
                    price: cart[name].price || 0,
                    amount: (cart[name].qty || 0) * (cart[name].price || 0)
                });
            }
        }
        return items;
    },

    // ============================================================
    // ✅ UPDATE BADGE ON ALL PAGES - FIXED
    // ============================================================
    updateBadge: function() {
        var totalItems = this.getTotalItems();
        console.log('🛒 Updating badge - Items:', totalItems);

        // Update ALL cart badges on the page
        var badges = document.querySelectorAll('.cart-badge');
        
        badges.forEach(function(badge) {
            badge.textContent = totalItems;
            if (totalItems > 0) {
                badge.style.display = 'flex';
                badge.style.visibility = 'visible';
                badge.style.opacity = '1';
                badge.style.background = '#e60000';
            } else {
                badge.style.display = 'none';
            }
        });

        // Update header cart total
        var headerTotal = document.getElementById('header-cart-total');
        if (headerTotal) {
            var amount = this.getTotalAmount();
            headerTotal.textContent = '₹' + amount.toLocaleString('en-IN');
        }

        // Update cart modal count
        var cartModalCount = document.getElementById('cart-modal-count');
        if (cartModalCount) {
            cartModalCount.textContent = totalItems;
        }

        // Update cart items count in summary bar
        var cartItemsEl = document.getElementById('cart-items');
        if (cartItemsEl) {
            cartItemsEl.textContent = totalItems;
        }

        console.log('✅ Badge updated to:', totalItems);
    },

    // ============================================================
    // ✅ UPDATE PRODUCT TABLE
    // ============================================================
    updateProductTable: function() {
        console.log('🔄 Updating product table...');
        var rows = document.querySelectorAll('.product-table tbody tr');
        var cart = this.getCart();
        var totalItems = 0;
        var totalAmount = 0;
        var totalDiscount = 0;

        rows.forEach(function(row) {
            var name = row.dataset.name || '';
            if (!name) {
                var nameEl = row.querySelector('.product-name');
                if (nameEl) name = nameEl.textContent.trim();
            }
            if (!name) return;

            var cartItem = cart[name];
            var qty = cartItem ? cartItem.qty || 0 : 0;
            var price = parseFloat(row.dataset.price) || 0;

            // Update quantity input
            var qtyInput = row.querySelector('.qty-input');
            if (qtyInput) {
                qtyInput.value = qty;
            }

            // Update amount
            var amountCell = row.querySelector('.row-amount');
            if (amountCell) {
                amountCell.textContent = qty > 0 ? '₹' + (price * qty).toLocaleString('en-IN') : '₹0';
            }

            if (qty > 0) {
                totalItems += qty;
                totalAmount += price * qty;
                var mrp = parseFloat(row.dataset.mrp) || price;
                totalDiscount += (mrp - price) * qty;
            }
        });

        // Update summary bar
        var itemsEl = document.getElementById('cart-items');
        var totalEl = document.getElementById('cart-total');
        var discountEl = document.getElementById('cart-discount');

        if (itemsEl) itemsEl.textContent = totalItems;
        if (totalEl) totalEl.textContent = '₹' + totalAmount.toLocaleString('en-IN');
        if (discountEl) discountEl.textContent = '₹' + totalDiscount.toLocaleString('en-IN');

        // ✅ Update badge with total items
        this.updateBadge();

        // Update submit button
        var submitBtn = document.getElementById('submit-enquiry');
        var minOrder = 2500;
        if (submitBtn) {
            if (totalAmount === 0 || totalAmount < minOrder) {
                submitBtn.classList.add('btn-submit-disabled');
                submitBtn.classList.remove('btn-submit-enabled');
            } else {
                submitBtn.classList.remove('btn-submit-disabled');
                submitBtn.classList.add('btn-submit-enabled');
            }
        }

        var warningEl = document.getElementById('submit-warning');
        var warningTotal = document.getElementById('submit-warning-total');
        if (warningEl && warningTotal) {
            if (totalAmount > 0 && totalAmount < minOrder) {
                warningEl.style.display = 'flex';
                warningTotal.textContent = '₹' + totalAmount.toLocaleString('en-IN');
            } else {
                warningEl.style.display = 'none';
            }
        }

        console.log('✅ Product table updated! Items:', totalItems);
    },

    // ============================================================
    // ✅ UPDATE ALL (Badge + Table)
    // ============================================================
    updateAll: function() {
        this.updateBadge();
        // Only update product table if we're on products page
        if (document.querySelector('.product-table')) {
            this.updateProductTable();
        }
    }
};

// Make CartManager global
window.CartManager = CartManager;

console.log('🛒 Cart Manager loaded!');

// ============================================================
// ✅ AUTO SYNC WHEN PAGE LOADS (WORKS ON ALL PAGES)
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Page loaded:', window.location.pathname);
    
    // First sync
    setTimeout(function() {
        if (typeof CartManager !== 'undefined') {
            CartManager.updateAll();
            console.log('🔄 Auto-sync complete!');
        }
    }, 200);
    
    // Second sync (retry)
    setTimeout(function() {
        if (typeof CartManager !== 'undefined') {
            CartManager.updateAll();
            console.log('🔄 Auto-sync retry complete!');
        }
    }, 800);
});