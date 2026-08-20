// ============================================================
// Q CRACKERS — Load Products from Firebase with Fallback
// ============================================================

import { db, collection, getDocs, query, orderBy } from "./firebase-init.js";

// Fallback Products (if Firebase fails)
const FALLBACK_PRODUCTS = [
    // Sparklers
    { name: '10" Electric Sparklers', category: 'sparklers', price: 49, oldPrice: 120, badge: 'Bestseller', sub: 'Pack of 10' },
    { name: 'Colour Sparklers', category: 'sparklers', price: 59, oldPrice: 150, badge: '', sub: 'Pack of 10' },
    { name: '15 cm Green Sparklers', category: 'sparklers', price: 90, oldPrice: 230, badge: '', sub: 'Pack of 10' },
    // Aerial Shots
    { name: '7-Shot Colour Cake', category: 'aerial', price: 199, oldPrice: 450, badge: 'Bestseller', sub: 'Box of 1' },
    { name: '25-Shot Sky Cake', category: 'aerial', price: 699, oldPrice: 1450, badge: 'New', sub: 'Box of 1' },
    // Ground Chakkars
    { name: 'Ground Chakkar Deluxe', category: 'ground', price: 79, oldPrice: 180, badge: '', sub: 'Pack of 5' },
    { name: 'Twin Sound Chakkar', category: 'ground', price: 65, oldPrice: 140, badge: '', sub: 'Pack of 3' },
    // Sound Crackers
    { name: 'Atom Bomb Pack', category: 'sound', price: 99, oldPrice: 220, badge: '', sub: 'Pack of 10' },
    { name: 'Bijili Crackers', category: 'sound', price: 149, oldPrice: 300, badge: '', sub: 'Pack of 5 bundles' },
    // Rockets
    { name: 'Sky Screamer Rocket', category: 'rockets', price: 129, oldPrice: 280, badge: '', sub: 'Pack of 5' },
    { name: 'Colour Burst Rocket', category: 'rockets', price: 159, oldPrice: 320, badge: 'New', sub: 'Pack of 5' },
    // Gift Boxes
    { name: 'Family Gift Box', category: 'gift', price: 999, oldPrice: 2499, badge: 'Combo', sub: '25 items' },
    { name: 'Deluxe Celebration Box', category: 'gift', price: 1999, oldPrice: 4999, badge: 'Combo', sub: '45 items' }
];

// Category display names and icons
const categoryMap = {
    sparklers: { label: 'Sparklers', icon: 'fa-star', offer: 'Flat 60% OFF' },
    aerial: { label: 'Aerial Shots', icon: 'fa-fire', offer: 'Flat 55% OFF' },
    ground: { label: 'Ground Chakkars', icon: 'fa-compact-disc', offer: 'Flat 55% OFF' },
    sound: { label: 'Sound Crackers', icon: 'fa-bolt', offer: 'Flat 80% OFF' },
    rockets: { label: 'Rockets', icon: 'fa-rocket', offer: 'Flat 55% OFF' },
    gift: { label: 'Gift Boxes', icon: 'fa-gift', offer: 'Flat 60% OFF' }
};

// Global product data
let allProducts = [];

// ============================================================
// Load Products from Firebase with Fallback
// ============================================================

async function loadProducts() {
    const container = document.getElementById('products-container');
    
    try {
        console.log('🔄 Loading products from Firebase...');
        const q = query(collection(db, "products"), orderBy("category"));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            console.log('⚠️ No products in Firebase, using fallback data...');
            allProducts = FALLBACK_PRODUCTS;
        } else {
            allProducts = [];
            querySnapshot.forEach((doc) => {
                allProducts.push({ id: doc.id, ...doc.data() });
            });
            console.log(`✅ Loaded ${allProducts.length} products from Firebase`);
        }
        
        renderProducts(allProducts);
        
        // Update hero text
        const heroP = document.querySelector('.products-hero p');
        if (heroP) {
            heroP.textContent = `${allProducts.length}+ crackers across every category, factory-priced straight from Sivakasi.`;
        }
            
    } catch (error) {
        console.error('❌ Error loading from Firebase:', error);
        console.log('🔄 Using fallback data...');
        allProducts = FALLBACK_PRODUCTS;
        renderProducts(allProducts);
    }
}

// ============================================================
// Render Products
// ============================================================

function renderProducts(products) {
    const container = document.getElementById('products-container');
    
    if (!container) {
        console.error('❌ Container not found!');
        return;
    }
    
    if (products.length === 0) {
        const noResults = document.getElementById('no-results-msg');
        if (noResults) noResults.style.display = 'block';
        container.innerHTML = '';
        return;
    }
    
    const noResults = document.getElementById('no-results-msg');
    if (noResults) noResults.style.display = 'none';
    
    // Group products by category
    const grouped = {};
    products.forEach(p => {
        const cat = p.category || 'other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(p);
    });
    
    let html = '';
    let sno = 0;
    
    for (const [cat, items] of Object.entries(grouped)) {
        const catInfo = categoryMap[cat] || { 
            label: cat.charAt(0).toUpperCase() + cat.slice(1), 
            icon: 'fa-tag', 
            offer: 'Special Offer' 
        };
        
        html += `
            <div class="cat-section" data-cat="${cat}">
                <div class="cat-header">
                    <h3><i class="fas ${catInfo.icon}"></i> ${catInfo.label}</h3>
                    <span class="offer-tag">${catInfo.offer}</span>
                </div>
                <div class="table-wrap">
                    <table class="product-table">
                        <thead>
                            <tr>
                                <th>S.No</th>
                                <th>Image</th>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Qty</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        items.forEach((product) => {
            sno++;
            const price = product.price || 0;
            const oldPrice = product.oldPrice || 0;
            
            html += `
                <tr data-id="${product.id || ''}" data-name="${product.name}" data-mrp="${oldPrice}" data-price="${price}">
                    <td>${sno}</td>
                    <td>
                        <div class="mini-cracker"></div>
                    </td>
                    <td>
                        <span class="product-name">${product.name}</span>
                        <span class="sub">${product.sub || 'Pack of 1'}</span>
                        ${product.badge ? `<span class="badge-tag">${product.badge}</span>` : ''}
                    </td>
                    <td>
                        <span class="price-cell">
                            ${oldPrice > price ? `<del>₹${oldPrice}</del>` : ''}
                            <span class="price-tag">₹${price}</span>
                        </span>
                    </td>
                    <td>
                        <div class="qty-stepper">
                            <button type="button" class="qty-btn minus">−</button>
                            <input type="number" class="qty-input" value="0" min="0">
                            <button type="button" class="qty-btn plus">+</button>
                        </div>
                    </td>
                    <td class="row-amount">₹0</td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    // Initialize quantity steppers
    setTimeout(initSteppers, 100);
    
    // Reset cart summary
    updateCartSummary();
}

// ============================================================
// Quantity Stepper Logic
// ============================================================

function initSteppers() {
    document.querySelectorAll('.qty-stepper').forEach(function(stepper) {
        const minusBtn = stepper.querySelector('.minus');
        const plusBtn = stepper.querySelector('.plus');
        const input = stepper.querySelector('.qty-input');
        const row = stepper.closest('tr');
        
        if (!input) return;
        
        if (minusBtn) {
            minusBtn.addEventListener('click', function() {
                let val = parseInt(input.value, 10) || 0;
                if (val > 0) {
                    input.value = val - 1;
                    updateRowAmount(row);
                }
            });
        }
        
        if (plusBtn) {
            plusBtn.addEventListener('click', function() {
                let val = parseInt(input.value, 10) || 0;
                input.value = val + 1;
                updateRowAmount(row);
            });
        }
        
        input.addEventListener('change', function() {
            let val = parseInt(input.value, 10) || 0;
            if (val < 0) input.value = 0;
            updateRowAmount(row);
        });
        
        input.addEventListener('keyup', function() {
            updateRowAmount(row);
        });
    });
}

// ============================================================
// Update Row Amount
// ============================================================

function updateRowAmount(row) {
    if (!row) return;
    const qtyInput = row.querySelector('.qty-input');
    const amountCell = row.querySelector('.row-amount');
    const priceTag = row.querySelector('.price-cell .price-tag');
    
    if (!qtyInput || !amountCell) return;
    
    let price = 0;
    if (priceTag) {
        const priceText = priceTag.textContent.trim();
        const priceMatch = priceText.match(/₹(\d+)/);
        price = priceMatch ? parseInt(priceMatch[1], 10) : 0;
    }
    
    const qty = parseInt(qtyInput.value, 10) || 0;
    const total = price * qty;
    amountCell.textContent = total > 0 ? '₹' + total.toLocaleString() : '₹0';
    
    updateCartSummary();
}

// ============================================================
// Update Cart Summary
// ============================================================

function updateCartSummary() {
    let totalItems = 0;
    let totalAmount = 0;
    let totalDiscount = 0;
    
    document.querySelectorAll('.product-table tbody tr').forEach(function(row) {
        const qtyInput = row.querySelector('.qty-input');
        const qty = parseInt(qtyInput ? qtyInput.value : 0, 10) || 0;
        
        if (qty > 0) {
            totalItems += qty;
            
            const priceTag = row.querySelector('.price-cell .price-tag');
            let price = 0;
            if (priceTag) {
                const priceText = priceTag.textContent.trim();
                const priceMatch = priceText.match(/₹(\d+)/);
                price = priceMatch ? parseInt(priceMatch[1], 10) : 0;
            }
            
            const mrp = parseInt(row.dataset.mrp, 10) || price;
            
            totalAmount += price * qty;
            totalDiscount += (mrp - price) * qty;
        }
    });
    
    const itemsEl = document.getElementById('cart-items');
    const totalEl = document.getElementById('cart-total');
    const discountEl = document.getElementById('cart-discount');
    
    if (itemsEl) itemsEl.textContent = totalItems;
    if (totalEl) totalEl.textContent = '₹' + totalAmount.toLocaleString();
    if (discountEl) discountEl.textContent = '₹' + totalDiscount.toLocaleString();
}

// ============================================================
// Search & Filter
// ============================================================

function filterProducts() {
    const searchTerm = document.getElementById('product-search')?.value?.toLowerCase().trim() || '';
    const category = document.getElementById('category-select')?.value || 'all';
    
    const rows = document.querySelectorAll('.product-table tbody tr');
    let visibleCount = 0;
    
    rows.forEach(function(row) {
        const name = row.dataset.name || '';
        const rowText = row.textContent.toLowerCase();
        const matchesSearch = name.toLowerCase().includes(searchTerm) || rowText.includes(searchTerm);
        const rowCategory = row.closest('.cat-section')?.dataset?.cat || '';
        const matchesCategory = category === 'all' || rowCategory === category;
        
        if (matchesSearch && matchesCategory) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });
    
    // Show/hide section headers
    document.querySelectorAll('.cat-section').forEach(function(section) {
        const visibleRows = section.querySelectorAll('tbody tr[style*="display: none"]');
        const allRows = section.querySelectorAll('tbody tr');
        const hasVisible = visibleRows.length < allRows.length;
        const header = section.querySelector('.cat-header');
        const wrap = section.querySelector('.table-wrap');
        if (header) header.style.display = hasVisible ? 'flex' : 'none';
        if (wrap) wrap.style.display = hasVisible ? 'block' : 'none';
    });
    
    const noResults = document.getElementById('no-results-msg');
    if (noResults) noResults.style.display = visibleCount === 0 ? 'block' : 'none';
}

// ============================================================
// Submit Enquiry
// ============================================================

function submitEnquiry() {
    const itemsEl = document.getElementById('cart-items');
    const totalItems = parseInt(itemsEl ? itemsEl.textContent : '0', 10) || 0;
    
    if (totalItems === 0) {
        alert('Please add at least one item to your cart.');
        return;
    }
    
    let message = 'Q Crackers Order Enquiry\n\n';
    message += '--- Order Details ---\n\n';
    
    document.querySelectorAll('.product-table tbody tr').forEach(function(row) {
        const qtyInput = row.querySelector('.qty-input');
        const qty = parseInt(qtyInput ? qtyInput.value : 0, 10) || 0;
        
        if (qty > 0) {
            const nameEl = row.querySelector('.product-name');
            const priceEl = row.querySelector('.price-cell .price-tag');
            const amountEl = row.querySelector('.row-amount');
            
            const name = nameEl ? nameEl.textContent.trim() : '';
            const price = priceEl ? priceEl.textContent.trim() : '';
            const amount = amountEl ? amountEl.textContent.trim() : '';
            
            message += `${qty} x ${name}\n`;
            message += `  ${price} × ${qty} = ${amount}\n\n`;
        }
    });
    
    const totalEl = document.getElementById('cart-total');
    const discountEl = document.getElementById('cart-discount');
    
    message += '--- Summary ---\n';
    message += `Total Items: ${itemsEl ? itemsEl.textContent : '0'}\n`;
    message += `Total Amount: ${totalEl ? totalEl.textContent : '₹0'}\n`;
    message += `Total Discount: ${discountEl ? discountEl.textContent : '₹0'}\n\n`;
    message += 'Please confirm my order.';
    
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/919655586461?text=${encoded}`, '_blank');
}

// ============================================================
// Event Listeners
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Products page loaded');
    
    // Load products
    loadProducts();
    
    // Search
    const searchInput = document.getElementById('product-search');
    if (searchInput) {
        searchInput.addEventListener('input', filterProducts);
    }
    
    // Category filter
    const categorySelect = document.getElementById('category-select');
    if (categorySelect) {
        categorySelect.addEventListener('change', filterProducts);
    }
    
    // Submit enquiry
    const submitBtn = document.getElementById('submit-enquiry');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitEnquiry);
    }
});