// ============================================================
// Q CRACKERS — Seed Products Script
// ============================================================

import { 
    db, 
    collection, 
    getDocs, 
    addDoc, 
    doc, 
    deleteDoc,
    query,
    where,
    orderBy,
    limit
} from './firebase-config.js';

// ============================================================
// PRODUCT DATA (13 Products)
// ============================================================

const products = [
    { 
        name: '10" Electric Sparklers', 
        price: 49, 
        category: 'Sparklers', 
        badge: 'Bestseller', 
        description: 'Premium electric sparklers for kids and family celebrations',
        rating: 4.5,
        reviews: 189
    },
    { 
        name: 'Colour Sparklers', 
        price: 59, 
        category: 'Sparklers', 
        badge: '', 
        description: 'Colorful sparklers that light up any celebration',
        rating: 4.3,
        reviews: 156
    },
    { 
        name: '15 cm Green Sparklers', 
        price: 90, 
        category: 'Sparklers', 
        badge: '', 
        description: 'Long green sparklers for extended enjoyment',
        rating: 4.6,
        reviews: 234
    },
    { 
        name: '7-Shot Colour Cake', 
        price: 199, 
        category: 'Aerial Shots', 
        badge: 'Bestseller', 
        description: 'Multi-shot aerial cake with 7 colourful bursts',
        rating: 4.8,
        reviews: 423
    },
    { 
        name: '25-Shot Sky Cake', 
        price: 699, 
        category: 'Aerial Shots', 
        badge: 'New', 
        description: '25-shot aerial display for grand celebrations',
        rating: 4.7,
        reviews: 312
    },
    { 
        name: 'Ground Chakkar Deluxe', 
        price: 79, 
        category: 'Ground Chakkars', 
        badge: '', 
        description: 'Premium ground chakkar with spinning colourful wheels',
        rating: 4.4,
        reviews: 278
    },
    { 
        name: 'Twin Sound Chakkar', 
        price: 65, 
        category: 'Ground Chakkars', 
        badge: '', 
        description: 'Twin spinning chakkar with sound effects',
        rating: 4.2,
        reviews: 145
    },
    { 
        name: 'Atom Bomb Pack', 
        price: 99, 
        category: 'Sound Crackers', 
        badge: '', 
        description: 'Atom bomb crackers pack for thrill-seekers',
        rating: 4.1,
        reviews: 167
    },
    { 
        name: 'Bijili Crackers', 
        price: 149, 
        category: 'Sound Crackers', 
        badge: '', 
        description: 'Bijili sound crackers for loud celebrations',
        rating: 4.5,
        reviews: 289
    },
    { 
        name: 'Sky Screamer Rocket', 
        price: 129, 
        category: 'Rockets', 
        badge: '', 
        description: 'High flying rocket with bright streaks',
        rating: 4.6,
        reviews: 234
    },
    { 
        name: 'Colour Burst Rocket', 
        price: 159, 
        category: 'Rockets', 
        badge: 'New', 
        description: 'Color burst rocket with multiple colour explosions',
        rating: 4.7,
        reviews: 198
    },
    { 
        name: 'Family Gift Box', 
        price: 999, 
        category: 'Gift Boxes', 
        badge: 'Combo', 
        description: 'Family gift combo with a variety of crackers',
        rating: 4.9,
        reviews: 567
    },
    { 
        name: 'Deluxe Celebration Box', 
        price: 1999, 
        category: 'Gift Boxes', 
        badge: 'Combo', 
        description: 'Premium celebration box with the best of Sivakasi',
        rating: 4.9,
        reviews: 423
    }
];

const categories = ['Sparklers', 'Aerial Shots', 'Ground Chakkars', 'Sound Crackers', 'Rockets', 'Gift Boxes'];

// ============================================================
// FALLBACK IMAGES (If upload fails)
// ============================================================

const fallbackImages = {
    'Sparklers': 'https://via.placeholder.com/400x300/ffc93c/1a1200?text=✨+Sparklers',
    'Aerial Shots': 'https://via.placeholder.com/400x300/ffc93c/1a1200?text=🎇+Aerial+Shots',
    'Ground Chakkars': 'https://via.placeholder.com/400x300/ffc93c/1a1200?text=🌀+Ground+Chakkars',
    'Sound Crackers': 'https://via.placeholder.com/400x300/ffc93c/1a1200?text=💥+Sound+Crackers',
    'Rockets': 'https://via.placeholder.com/400x300/ffc93c/1a1200?text=🚀+Rockets',
    'Gift Boxes': 'https://via.placeholder.com/400x300/ffc93c/1a1200?text=🎁+Gift+Boxes'
};

// ============================================================
// MAIN SEED FUNCTION
// ============================================================

async function seedProducts() {
    const logContainer = document.getElementById('log') || document.body;
    
    function addLog(message, isError = false) {
        const p = document.createElement('p');
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        p.style.color = isError ? '#ff5a1f' : 'inherit';
        logContainer.appendChild(p);
        console.log(message);
    }

    try {
        addLog('🔥 Starting product seeding...');
        
        // Step 1: Get image uploads
        addLog('📸 Checking for uploaded images...');
        const imageUrls = {};
        let imagesUploaded = 0;
        
        // Check if there are file inputs on the page
        const fileInputs = document.querySelectorAll('.category-file-input');
        if (fileInputs.length > 0) {
            for (const input of fileInputs) {
                const category = input.dataset.category;
                const file = input.files[0];
                if (file) {
                    // Store file info - actual upload happens separately
                    imageUrls[category] = URL.createObjectURL(file);
                    imagesUploaded++;
                    addLog(`✅ Image selected for: ${category}`);
                }
            }
        }

        addLog(`🖼️ Images uploaded: ${imagesUploaded}/${categories.length}`);

        // Step 2: Clear existing products
        addLog('🔍 Checking existing products...');
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        
        if (!snapshot.empty) {
            addLog(`🗑️ Found ${snapshot.size} existing products. Deleting...`);
            let deletedCount = 0;
            for (const docSnapshot of snapshot.docs) {
                await deleteDoc(docSnapshot.ref);
                deletedCount++;
                if (deletedCount % 50 === 0) {
                    addLog(`⏳ Deleted ${deletedCount} products...`);
                }
            }
            addLog(`✅ ${deletedCount} old products deleted.`);
        }

        // Step 3: Add new products
        addLog(`📦 Adding ${products.length} products...`);
        let addedCount = 0;
        
        for (const product of products) {
            const productData = {
                name: product.name,
                price: product.price,
                category: product.category,
                badge: product.badge || '',
                description: product.description,
                rating: product.rating || 4.5,
                reviews: product.reviews || 100,
                imageUrl: imageUrls[product.category] || fallbackImages[product.category] || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            try {
                await addDoc(collection(db, 'products'), productData);
                addedCount++;
                addLog(`✅ Added: ${product.name} (₹${product.price})`);
            } catch (error) {
                addLog(`❌ Failed to add ${product.name}: ${error.message}`, true);
            }
        }

        // Step 4: Summary
        addLog(`🎉✅ ${addedCount}/${products.length} products added to Firebase!`);
        addLog(`📊 Total products in Firebase: ${addedCount}`);
        
        // Update UI if elements exist
        const seededCount = document.getElementById('seededCount');
        if (seededCount) seededCount.textContent = addedCount;
        
        const totalCount = document.getElementById('totalCount');
        if (totalCount) totalCount.textContent = products.length;
        
        return { success: true, added: addedCount, total: products.length };

    } catch (error) {
        addLog(`❌ Seeding failed: ${error.message}`, true);
        return { success: false, error: error.message };
    }
}

// ============================================================
// VIEW PRODUCTS FUNCTION
// ============================================================

async function viewProducts() {
    const logContainer = document.getElementById('log') || document.body;
    
    function addLog(message) {
        const p = document.createElement('p');
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logContainer.appendChild(p);
        console.log(message);
    }

    try {
        addLog('📋 Fetching products from Firebase...');
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        
        if (snapshot.empty) {
            addLog('📭 No products found in Firebase.');
            return;
        }

        addLog(`📦 Found ${snapshot.size} products:`);
        snapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            addLog(`   • ${data.name} (₹${data.price}) - ${data.category}`);
        });
        
        return snapshot.size;
    } catch (error) {
        addLog(`❌ Failed to fetch products: ${error.message}`);
        return 0;
    }
}

// ============================================================
// CLEAR ALL PRODUCTS
// ============================================================

async function clearAllProducts() {
    const logContainer = document.getElementById('log') || document.body;
    
    function addLog(message) {
        const p = document.createElement('p');
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        logContainer.appendChild(p);
        console.log(message);
    }

    try {
        addLog('🗑️ Clearing all products...');
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        
        if (snapshot.empty) {
            addLog('📭 No products to delete.');
            return 0;
        }

        let deletedCount = 0;
        for (const docSnapshot of snapshot.docs) {
            await deleteDoc(docSnapshot.ref);
            deletedCount++;
            if (deletedCount % 50 === 0) {
                addLog(`⏳ Deleted ${deletedCount} products...`);
            }
        }
        
        addLog(`✅ ${deletedCount} products deleted.`);
        return deletedCount;
    } catch (error) {
        addLog(`❌ Failed to clear products: ${error.message}`);
        return 0;
    }
}

// ============================================================
// EXPOSE FUNCTIONS TO WINDOW (For HTML button clicks)
// ============================================================

window.seedProducts = seedProducts;
window.viewProducts = viewProducts;
window.clearAllProducts = clearAllProducts;

// ============================================================
// AUTO-RUN IF CALLED FROM HTML
// ============================================================

console.log('🌱 Q Crackers — Seed Products Script Loaded!');
console.log('📋 Available functions:');
console.log('   • seedProducts() - Seed 13 products');
console.log('   • viewProducts() - View all products');
console.log('   • clearAllProducts() - Clear all products');

console.log('🚀 Ready to seed!');