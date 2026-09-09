// ============================================================
// Q CRACKERS - PERSISTENT CART (FULLY WORKING)
// ✅ FIXED: Quotes in product names (6" ARABIAN ARCHER)
// ✅ FIXED: Remove & Add buttons working
// ✅ FIXED: Number products (6000, 1", 4", etc.)
// ✅ FIXED: Special characters in product names
// ✅ FIXED: Proper HTML-entity escaping (was using invalid backslash escaping)
// ✅ FIXED: Removed duplicate cart-modal event handlers (were conflicting with products.html)
// ============================================================

// ============================================================
// GLOBAL HTML ATTRIBUTE ESCAPER
// Used by both cart.js and products.html to safely embed
// product names (which may contain " ' < > &) into HTML attributes.
// ============================================================
function escapeHtmlAttr(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
window.escapeHtmlAttr = escapeHtmlAttr;

var CartManager = {
    STORAGE_KEY: 'qcrackers_cart',

    // ============================================================
    // GET CART FROM LOCALSTORAGE
    // ============================================================
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



    // ============================================================
    // SAVE CART TO LOCALSTORAGE
    // ============================================================
    saveCart: function (cart) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cart));
        this.updateAll();
    },

    // ============================================================
    // ADD ITEM TO CART
    // ============================================================
    addItem: function (productName, price, quantity, mrp) {
        if (quantity === undefined) quantity = 1;
        var name = String(productName);
        var cart = this.getCart();

        if (cart[name]) {
            cart[name].qty = (cart[name].qty || 0) + quantity;
            cart[name].price = price || cart[name].price || 0;
            if (mrp !== undefined) cart[name].mrp = mrp;
        } else {
            cart[name] = {
                qty: quantity,
                price: price || 0,
                mrp: mrp !== undefined ? mrp : (price || 0)
            };
        }
        if (cart[name].qty <= 0) {
            delete cart[name];
        }
        this.saveCart(cart);
        this.updateProductTable();
    },

    // ============================================================
    // REMOVE ITEM FROM CART
    // ============================================================
    removeItem: function (productName) {
        var name = String(productName);
        var cart = this.getCart();
        delete cart[name];
        this.saveCart(cart);
        this.updateProductTable();
    },

    // ============================================================
    // UPDATE QUANTITY
    // ============================================================
    updateQuantity: function (productName, quantity, price, mrp) {
        var name = String(productName);
        var cart = this.getCart();
        if (quantity <= 0) {
            delete cart[name];
        } else if (cart[name]) {
            cart[name].qty = quantity;
            if (price !== undefined) cart[name].price = price;
            if (mrp !== undefined) cart[name].mrp = mrp;
        } else {
            cart[name] = {
                qty: quantity,
                price: price || 0,
                mrp: mrp !== undefined ? mrp : (price || 0)
            };
        }
        this.saveCart(cart);
        this.updateProductTable();
    },

    // ============================================================
    // CLEAR CART
    // ============================================================
    clearCart: function () {
        localStorage.removeItem(this.STORAGE_KEY);
        this.updateAll();
        this.updateProductTable();
    },

    // ============================================================
    // GET TOTAL ITEMS
    // ============================================================
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

    // ============================================================
    // GET TOTAL AMOUNT
    // ============================================================
    getTotalAmount: function () {
        var items = this.getCartItems();
        var total = 0;
        items.forEach(function (item) {
            total += item.amount;
        });
        return total;
    },

    // ============================================================
    // GET TOTAL DISCOUNT
    // ============================================================
    getTotalDiscount: function () {
        var items = this.getCartItems();
        var total = 0;
        items.forEach(function (item) {
            total += item.discount;
        });
        return total;
    },

    // ============================================================
    // GET CART ITEMS AS ARRAY
    // ============================================================
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

    // ============================================================
    // GET ITEMS (alias)
    // ============================================================
    getItems: function () {
        return this.getCartItems();
    },

    // ============================================================
    // UPDATE BADGE
    // ============================================================
    updateBadge: function () {
        var totalItems = this.getTotalItems();
        var totalAmount = this.getTotalAmount();

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

        var headerTotal = document.getElementById('header-cart-total');
        if (headerTotal) {
            headerTotal.textContent = '₹' + totalAmount.toLocaleString('en-IN');
        }

        var cartModalCount = document.getElementById('cart-modal-count');
        if (cartModalCount) {
            cartModalCount.textContent = totalItems;
        }

        var cartItemsEl = document.getElementById('cart-items');
        if (cartItemsEl) {
            cartItemsEl.textContent = totalItems;
        }
    },

    // ============================================================
    // UPDATE PRODUCT TABLE
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

            var qtyInput = row.querySelector('.qty-input');
            if (qtyInput && document.activeElement !== qtyInput) {
                qtyInput.value = qty;
            }

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

        var itemsEl = document.getElementById('cart-items');
        var totalEl = document.getElementById('cart-total');
        var discountEl = document.getElementById('cart-discount');

        if (itemsEl) itemsEl.textContent = totalItems;
        if (totalEl) totalEl.textContent = '₹' + totalAmount.toLocaleString('en-IN');
        if (discountEl) discountEl.textContent = '₹' + totalDiscount.toLocaleString('en-IN');

        this.updateBadge();

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

        var modal = document.getElementById('cart-modal');
        if (modal && modal.classList.contains('active')) {
            this.renderCartModal();
        }
    },

    // ============================================================
    // SAFELY ESCAPE NAME FOR DATA ATTRIBUTE (valid HTML entity escaping)
    // ============================================================
    safeNameAttr: function (name) {
        return escapeHtmlAttr(name);
    },

    // ============================================================
    // SAFELY ESCAPE NAME FOR DISPLAY
    // ============================================================
    safeNameDisplay: function (name) {
        return name.replace(/"/g, '&quot;');
    },

    // ============================================================
    // RENDER CART MODAL - FIXED
    // ============================================================
    renderCartModal: function () {
        var items = this.getCartItems();
        var totalItems = this.getTotalItems();
        var totalAmount = this.getTotalAmount();
        var totalDiscount = this.getTotalDiscount();

        var emptyMsg = document.getElementById('cart-empty-msg');
        var table = document.getElementById('cart-modal-table');
        var tbody = document.getElementById('cart-modal-tbody');
        var countEl = document.getElementById('cart-modal-count');
        var totalProductsEl = document.getElementById('cart-modal-total-products');
        var discountEl = document.getElementById('cart-modal-discount');
        var overallTotalEl = document.getElementById('cart-modal-overall-total');
        var warningEl = document.getElementById('cart-min-order-warning');
        var warningTotalEl = document.getElementById('cart-warning-total');

        if (countEl) countEl.textContent = totalItems;
        if (totalProductsEl) totalProductsEl.textContent = totalItems;
        if (discountEl) discountEl.textContent = '₹' + totalDiscount.toLocaleString('en-IN');
        if (overallTotalEl) overallTotalEl.textContent = '₹' + totalAmount.toLocaleString('en-IN');

        if (items.length === 0) {
            if (emptyMsg) emptyMsg.style.display = 'block';
            if (table) table.style.display = 'none';
            if (warningEl) warningEl.style.display = 'none';
            return;
        }

        if (emptyMsg) emptyMsg.style.display = 'none';
        if (table) table.style.display = 'table';

        var self = this;

        // Build table rows with properly escaped names
        tbody.innerHTML = items.map(function (item) {
            var safeNameAttr = self.safeNameAttr(item.name);
            var safeNameDisplay = self.safeNameDisplay(item.name);

            // Try to find the product image from the table
            var imageHtml = '';
            try {
                var productRow = document.querySelector('.product-table tbody tr[data-name="' + safeNameAttr + '"]');
                if (productRow) {
                    var img = productRow.querySelector('.product-image');
                    if (img) {
                        imageHtml = '<img src="' + img.src + '" alt="' + safeNameDisplay + '" style="width:40px;height:40px;object-fit:cover;border-radius:6px;border:1px solid #ddd;margin-right:10px;">';
                    }
                }
            } catch (e) {
                // If selector fails, just skip the image
            }

            return `
                <tr>
                    <td>
                        <div style="display:flex;align-items:center;gap:0;">
                            ${imageHtml}
                            <strong>${safeNameDisplay}</strong>
                        </div>
                    </td>
                    <td>
                        <div class="cart-qty-control">
                            <button type="button" class="cart-qty-btn cart-qty-minus" data-name="${safeNameAttr}"><i class="fas fa-minus"></i></button>
                            <span class="cart-qty-value">${item.qty}</span>
                            <button type="button" class="cart-qty-btn cart-qty-plus" data-name="${safeNameAttr}"><i class="fas fa-plus"></i></button>
                        </div>
                    </td>
                    <td>₹${item.price.toLocaleString('en-IN')}</td>
                    <td>₹${item.amount.toLocaleString('en-IN')}</td>
                    <td><button type="button" class="cart-remove-btn" data-name="${safeNameAttr}"><i class="fas fa-trash-alt"></i> Remove</button></td>
                </tr>
            `;
        }).join('');

        // ============================================================
        // ATTACH EVENT LISTENERS
        // ============================================================

        // Plus button
        tbody.querySelectorAll('.cart-qty-plus').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var name = this.dataset.name;
                var current = self.getCartItems().find(function (i) {
                    return i.name === name;
                });
                if (current) {
                    self.updateQuantity(current.name, current.qty + 1, current.price, current.mrp);
                    self.renderCartModal();
                    self.updateBadge();
                }
            });
        });

        // Minus button
        tbody.querySelectorAll('.cart-qty-minus').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var name = this.dataset.name;
                var current = self.getCartItems().find(function (i) {
                    return i.name === name;
                });
                if (!current) return;
                if (current.qty > 1) {
                    self.updateQuantity(current.name, current.qty - 1, current.price, current.mrp);
                    self.renderCartModal();
                    self.updateBadge();
                } else {
                    if (confirm('Remove "' + current.name + '" from cart?')) {
                        self.removeItem(current.name);
                        self.renderCartModal();
                        self.updateBadge();
                    }
                }
            });
        });

        // Remove button
        tbody.querySelectorAll('.cart-remove-btn').forEach(function (btn) {
            btn.addEventListener('click', function (e) {
                e.stopPropagation();
                var name = this.dataset.name;
                var current = self.getCartItems().find(function (i) {
                    return i.name === name;
                });
                var displayName = current ? current.name : name;
                if (confirm('Remove "' + displayName + '" from cart?')) {
                    self.removeItem(displayName);
                    self.renderCartModal();
                    self.updateBadge();
                }
            });
        });

        // Update warning
        if (warningEl) {
            if (totalAmount > 0 && totalAmount < 2500) {
                warningEl.style.display = 'flex';
                if (warningTotalEl) warningTotalEl.textContent = '₹' + totalAmount.toLocaleString('en-IN');
            } else {
                warningEl.style.display = 'none';
            }
        }

        // Update badge
        this.updateBadge();
    },

    // ============================================================
    // UPDATE ALL UI ELEMENTS
    // ============================================================
    updateAll: function () {
        this.updateBadge();
        if (document.querySelector('.product-table')) {
            this.updateProductTable();
        }
    },

    // ============================================================
    // SYNC PRODUCT TABLE WITH CART
    // ============================================================
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

// ============================================================
// EXPOSE TO GLOBAL
// ============================================================
window.CartManager = CartManager;

console.log('🛒 Cart Manager loaded with quote fix!');

// ============================================================
// AUTO SYNC ON PAGE LOAD
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        if (typeof CartManager !== 'undefined') {
            CartManager.updateAll();
            CartManager.syncProductTable();
        }
    }, 200);

    setTimeout(function () {
        if (typeof CartManager !== 'undefined') {
            CartManager.updateAll();
            CartManager.syncProductTable();
        }
    }, 800);
});

// ============================================================
// NOTE: Cart-modal open/close/checkout button handlers are
// intentionally NOT attached here. products.html already
// attaches its own handlers for open-cart-btn, cart-modal-close,
// cart-continue-btn, cart-checkout-btn, and order-summary-close,
// and also drives renderOrderSummaryModal(). Having a second set
// of handlers here caused both to fire on every click, corrupting
// the rendered cart modal (this was the root cause of Remove/+/-
// behaving inconsistently). If you ever move cart-modal control
// fully into cart.js, remove the corresponding handlers from
// products.html first to avoid this conflict happening again.
// ============================================================

// ============================================================
// RESET CART (FOR DEBUGGING) - Remove if not needed
// ============================================================
// To reset cart, run in console: CartManager.clearCart();