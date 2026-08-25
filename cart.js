// ============================================================
// Q CRACKERS - PERSISTENT CART (Works on ALL Pages)
// ============================================================

var CartManager = {
    STORAGE_KEY: 'qcrackers_cart',

    // Get cart from localStorage (sanitizes any corrupted entries
    // left over from the old two-format bug)
    getCart: function () {
        try {
            var data = localStorage.getItem(this.STORAGE_KEY);
            var cart = data ? JSON.parse(data) : {};
            var changed = false;
            for (var key in cart) {
                if (cart.hasOwnProperty(key)) {
                    var entry = cart[key];
                    if (typeof entry !== 'object' || entry === null || typeof entry.qty !== 'number' || isNaN(entry.qty)) {
                        delete cart[key];
                        changed = true;
                    }
                }
            }
            if (changed) {
                try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart)); } catch (e) { }
            }
            return cart;
        } catch (e) {
            return {};
        }
    },

    // Save cart to localStorage
    saveCart: function (cart) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
        this.updateAll();
    },

    // Add item to cart. mrp is optional (used for discount calculation).
    addItem: function (productName, price, quantity, mrp) {
        if (quantity === undefined) quantity = 1;
        var cart = this.getCart();
        if (cart[productName]) {
            cart[productName].qty = (cart[productName].qty || 0) + quantity;
            cart[productName].price = price || cart[productName].price || 0;
            if (mrp !== undefined) cart[productName].mrp = mrp;
        } else {
            cart[productName] = {
                qty: quantity,
                price: price || 0,
                mrp: mrp !== undefined ? mrp : (price || 0)
            };
        }
        if (cart[productName].qty <= 0) {
            delete cart[productName];
        }
        this.saveCart(cart);
        this.updateProductTable();
    },

    removeItem: function (productName) {
        var cart = this.getCart();
        delete cart[productName];
        this.saveCart(cart);
        this.updateProductTable();
    },

    // Sets the absolute quantity for a product (used by the qty-stepper
    // and the cart modal's +/- controls). Pass price/mrp so a brand-new
    // entry has correct data even if the item wasn't added via addItem first.
    updateQuantity: function (productName, quantity, price, mrp) {
        var cart = this.getCart();
        if (quantity <= 0) {
            delete cart[productName];
        } else if (cart[productName]) {
            cart[productName].qty = quantity;
            if (price !== undefined) cart[productName].price = price;
            if (mrp !== undefined) cart[productName].mrp = mrp;
        } else {
            cart[productName] = {
                qty: quantity,
                price: price || 0,
                mrp: mrp !== undefined ? mrp : (price || 0)
            };
        }
        this.saveCart(cart);
        this.updateProductTable();
    },

    clearCart: function () {
        localStorage.removeItem(this.STORAGE_KEY);
        this.updateAll();
        this.updateProductTable();
    },

    // ✅ Get total number of items (1, 2, 3...)
    getTotalItems: function () {
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
    getTotalAmount: function () {
        var items = this.getCartItems();
        var total = 0;
        items.forEach(function (item) {
            total += item.amount;
        });
        return total;
    },

    // ✅ Get total discount (sum of (mrp - price) * qty across cart)
    getTotalDiscount: function () {
        var items = this.getCartItems();
        var total = 0;
        items.forEach(function (item) {
            total += item.discount;
        });
        return total;
    },

    getCartItems: function () {
        var cart = this.getCart();
        var items = [];
        for (var name in cart) {
            if (cart.hasOwnProperty(name)) {
                var qty = cart[name].qty || 0;
                var price = cart[name].price || 0;
                var mrp = (cart[name].mrp !== undefined ? cart[name].mrp : price);
                items.push({
                    name: name,
                    qty: qty,
                    price: price,
                    mrp: mrp,
                    amount: qty * price,
                    discount: (mrp - price) * qty
                });
            }
        }
        return items;
    },

    // Back-compat alias — some callers use getItems()
    getItems: function () {
        return this.getCartItems();
    },

    // ============================================================
    // ✅ UPDATE BADGE ON ALL PAGES - FIXED
    // ============================================================
    updateBadge: function () {
        var totalItems = this.getTotalItems();
        var totalAmount = this.getTotalAmount();

        // Update ALL cart badges on the page
        var badges = document.querySelectorAll('.cart-badge');
        badges.forEach(function (badge) {
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
            headerTotal.textContent = '₹' + totalAmount.toLocaleString('en-IN');
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
    },

    // ============================================================
    // ✅ UPDATE PRODUCT TABLE (qty inputs + row amounts + summary bar)
    // ============================================================
    updateProductTable: function () {
        var rows = document.querySelectorAll('.product-table tbody tr');
        var cart = this.getCart();
        var totalItems = 0;
        var totalAmount = 0;
        var totalDiscount = 0;

        rows.forEach(function (row) {
            var name = row.dataset.name || '';
            if (!name) {
                var nameEl = row.querySelector('.product-name');
                if (nameEl) name = nameEl.textContent.trim();
            }
            if (!name) return;

            var cartItem = cart[name];
            var qty = cartItem ? cartItem.qty || 0 : 0;
            var price = parseFloat(row.dataset.price) || 0;
            var mrp = parseFloat(row.dataset.mrp) || price;

            // Update quantity input
            var qtyInput = row.querySelector('.qty-input');
            if (qtyInput && document.activeElement !== qtyInput) {
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
    },

    // ============================================================
    // ✅ UPDATE ALL (Badge + Table)
    // ============================================================
    updateAll: function () {
        this.updateBadge();
        // Only update product table if we're on products page
        if (document.querySelector('.product-table')) {
            this.updateProductTable();
        }
    },

    // Sync the product table qty inputs from the stored cart
    // (used right after the product table is (re)rendered from Firebase)
    syncProductTable: function () {
        var items = this.getCartItems();
        document.querySelectorAll('.product-table tbody tr').forEach(function (row) {
            var name = row.dataset.name;
            if (!name) return;
            var cartItem = items.find(function (i) { return i.name === name; });
            var qtyInput = row.querySelector('.qty-input');
            if (qtyInput) {
                qtyInput.value = cartItem ? cartItem.qty : 0;
                var amountCell = row.querySelector('.row-amount');
                if (amountCell) {
                    var price = parseFloat(row.dataset.price) || 0;
                    var qty = cartItem ? cartItem.qty : 0;
                    amountCell.textContent = qty > 0 ? '₹' + (price * qty).toLocaleString('en-IN') : '₹0';
                }
            }
        });
        this.updateBadge();
    }
};

// Make CartManager global
window.CartManager = CartManager;

console.log('🛒 Cart Manager loaded!');

// ============================================================
// ✅ AUTO SYNC WHEN PAGE LOADS (WORKS ON ALL PAGES)
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        if (typeof CartManager !== 'undefined') {
            CartManager.updateAll();
        }
    }, 200);

    setTimeout(function () {
        if (typeof CartManager !== 'undefined') {
            CartManager.updateAll();
        }
    }, 800);
});