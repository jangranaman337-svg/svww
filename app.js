// ================================
// DATA MANAGEMENT
// ================================

const ADMIN_PASSWORD = "#@Naman1199";
const DEFAULT_BANNER = "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=1600&h=600&fit=crop";

// Initialize data from localStorage or use defaults
let products = JSON.parse(localStorage.getItem('vishwakarma-products')) || getDefaultProducts();
let feedbacks = JSON.parse(localStorage.getItem('vishwakarma-feedbacks')) || [];
let pinnedDesigns = JSON.parse(localStorage.getItem('vishwakarma-pinned')) || [];
let bannerImage = localStorage.getItem('vishwakarma-banner') || DEFAULT_BANNER;
let selectedCategory = 'All';
let currentZoom = 100;
let isAdminAuthenticated = false;

// Default products
function getDefaultProducts() {
    return [
        {
            id: "1",
            name: "Classic Wooden Bed",
            description: "Elegant teak wood bed with intricate carvings",
            price: 45000,
            category: "Beds",
            image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600",
            type: "previous-work",
            mostLiked: true
        },
        {
            id: "2",
            name: "Modern Wardrobe",
            description: "Spacious wardrobe with mirror and sliding doors",
            price: 38000,
            category: "Almirah",
            image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
            type: "previous-work",
            mostLiked: false
        },
        {
            id: "3",
            name: "Designer Main Door",
            description: "Handcrafted main door with traditional designs",
            price: 55000,
            category: "Doors",
            image: "https://images.unsplash.com/photo-1540079769940-274ed82e6ae7?w=600",
            type: "inspiration",
            mostLiked: false
        },
        {
            id: "4",
            name: "Modular Kitchen",
            description: "Complete modular kitchen with premium finish",
            price: 125000,
            category: "Kitchens",
            image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600",
            type: "inspiration",
            mostLiked: true
        },
        {
            id: "5",
            name: "LED Panel Wall Unit",
            description: "Modern LED panel with storage",
            price: 32000,
            category: "LED Panels",
            image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600",
            type: "previous-work",
            mostLiked: false
        },
        {
            id: "6",
            name: "Luxury Dressing Table",
            description: "Elegant dressing table with mirror and drawers",
            price: 28000,
            category: "Dressing Tables",
            image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600",
            type: "inspiration",
            mostLiked: false
        },
        {
            id: "7",
            name: "LED Panel",
            description: "Elegant LED Panel with mirror and drawers",
            price: 29999,
            category: "LED Panels",
            image: "https://www.bing.com/images/search?view=detailV2&ccid=dUC1tBi%2f&id=D530FE84063066015DD322C3091AA1C05765482E&thid=OIP.dUC1tBi_qZ1XjeuMUoDawAHaHa&mediaurl=https%3a%2f%2fwww.99acres.com%2fmicrosite%2fwp-content%2fblogs.dir%2f6161%2ffiles%2f2023%2f07%2fBacklit-TV-Wall-LED-Panel.jpg&exph=512&expw=512&q=led+tv+panels&FORM=IRPRST&ck=62E161606DF429AA8C0B2708019C4A85&selectedIndex=2&itb=0",
            type: "inspiration",
            mostLiked: false
        }
    ];
}

// Save data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('vishwakarma-products', JSON.stringify(products));
    localStorage.setItem('vishwakarma-feedbacks', JSON.stringify(feedbacks));
    localStorage.setItem('vishwakarma-pinned', JSON.stringify(pinnedDesigns));
    localStorage.setItem('vishwakarma-banner', bannerImage);
}

// ================================
// UI RENDERING
// ================================

function renderCategories() {
    const container = document.getElementById('category-buttons');
    const categories = ['All', 'Beds', 'Almirah', 'Doors', 'Kitchens', 'LED Panels', 'Dressing Tables', 'Study Tables', 'Tables'];
    const mostLikedCount = products.filter(p => p.mostLiked).length;
    
    let html = '';
    
    categories.forEach(category => {
        const isActive = category === selectedCategory;
        html += `
            <button 
                class="category-btn ${isActive ? 'active' : ''}" 
                onclick="selectCategory('${category}')"
            >
                ${category}
            </button>
        `;
    });
    
    // Add Most Liked category if there are any
    if (mostLikedCount > 0) {
        const isActive = selectedCategory === 'Most Liked';
        html += `
            <button 
                class="category-btn most-liked ${isActive ? 'active' : ''}" 
                onclick="selectCategory('Most Liked')"
            >
                <svg class="icon-small" viewBox="0 0 24 24" fill="${isActive ? 'white' : '#f59e0b'}" stroke="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                Most Liked
                <span class="category-badge">${mostLikedCount}</span>
            </button>
        `;
    }
    
    container.innerHTML = html;
}

function filterProducts(type) {
    let filtered = products.filter(p => p.type === type);
    
    if (selectedCategory === 'All') {
        return filtered;
    } else if (selectedCategory === 'Most Liked') {
        return filtered.filter(p => p.mostLiked);
    } else {
        return filtered.filter(p => p.category === selectedCategory);
    }
}

function renderProducts() {
    const previousWorks = filterProducts('previous-work');
    const inspirations = filterProducts('inspiration');
    
    // Render Previous Works (show only first 4)
    const previousGrid = document.getElementById('previous-works-grid');
    const displayedPrevious = previousWorks.slice(0, 4);
    
    if (displayedPrevious.length > 0) {
        previousGrid.innerHTML = displayedPrevious.map(product => createProductCard(product)).join('');
    } else {
        previousGrid.innerHTML = '<p class="text-center p-4" style="grid-column: 1/-1; color: var(--text-light)">No previous works in this category yet.</p>';
    }
    
    // Show/hide View All button for previous works
    const viewAllPrevious = document.getElementById('view-all-previous');
    const previousCount = document.getElementById('previous-count');
    if (previousWorks.length > 4) {
        viewAllPrevious.classList.remove('hidden');
        previousCount.textContent = `(${previousWorks.length})`;
    } else {
        viewAllPrevious.classList.add('hidden');
    }
    
    // Render Inspirations (show only first 4)
    const inspirationsGrid = document.getElementById('inspirations-grid');
    const displayedInspirations = inspirations.slice(0, 4);
    
    if (displayedInspirations.length > 0) {
        inspirationsGrid.innerHTML = displayedInspirations.map(product => createProductCard(product)).join('');
    } else {
        inspirationsGrid.innerHTML = '<p class="text-center p-4" style="grid-column: 1/-1; color: var(--text-light)">No inspiration designs in this category yet.</p>';
    }
    
    // Show/hide View All button for inspirations
    const viewAllInspirations = document.getElementById('view-all-inspirations');
    const inspirationCount = document.getElementById('inspiration-count');
    if (inspirations.length > 4) {
        viewAllInspirations.classList.remove('hidden');
        inspirationCount.textContent = `(${inspirations.length})`;
    } else {
        viewAllInspirations.classList.add('hidden');
    }
}

function createProductCard(product) {
    const isPinned = pinnedDesigns.some(item => item.product.id === product.id);
    
    return `
        <div class="product-card" onclick="viewProduct('${product.id}')">
            <div class="product-image-container">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="price-badge">₹${product.price.toLocaleString('en-IN')}</div>
                <button 
                    class="pin-btn ${isPinned ? 'pinned' : ''}" 
                    onclick="togglePin(event, '${product.id}')"
                    title="${isPinned ? 'Unpin' : 'Pin'} this design"
                >
                    ${isPinned ? `
                        <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 17v5m-7-5l7-7 7 7m-7-7v-5l-3 1v5z"/>
                        </svg>
                    ` : `
                        <svg class="icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 17v5m-7-5l7-7 7 7m-7-7v-5l-3 1v5z"/>
                        </svg>
                    `}
                </button>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
            </div>
        </div>
    `;
}

function updateBanner() {
    const hero = document.getElementById('hero-banner');
    hero.style.backgroundImage = `url(${bannerImage})`;
}

function updatePinnedBadge() {
    const badge = document.getElementById('pinned-badge');
    const count = pinnedDesigns.length;
    
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// ================================
// EVENT HANDLERS
// ================================

function selectCategory(category) {
    selectedCategory = category;
    renderCategories();
    renderProducts();
}

function togglePin(event, productId) {
    event.stopPropagation();
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingIndex = pinnedDesigns.findIndex(item => item.product.id === productId);
    
    if (existingIndex !== -1) {
        pinnedDesigns.splice(existingIndex, 1);
        showToast('Design unpinned');
    } else {
        pinnedDesigns.push({ product, pinnedAt: Date.now() });
        showToast('Design pinned successfully', 'success');
    }
    
    saveToLocalStorage();
    updatePinnedBadge();
    renderProducts();
}

function viewProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        openImageViewer(product.image, product.name);
    }
}

function viewAllSection(type) {
    showToast(`View All ${type === 'previous-work' ? 'Previous Works' : 'Inspirations'} feature coming soon!`);
}

function showPinnedDesigns() {
    if (pinnedDesigns.length === 0) {
        showToast('No designs pinned yet');
        return;
    }
    
    let html = `
        <div style="max-height: 60vh; overflow-y: auto;">
            <h3 style="margin-bottom: 1rem; font-size: 1.25rem; font-weight: 600;">Pinned Designs (${pinnedDesigns.length})</h3>
            <div class="product-grid">
                ${pinnedDesigns.map(item => createProductCard(item.product)).join('')}
            </div>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2>Pinned Designs</h2>
                <button onclick="this.closest('.modal').remove()" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                ${html}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

let logoClickCount = 0;
let logoClickTimer;

function handleLogoClick() {
    logoClickCount++;
    
    clearTimeout(logoClickTimer);
    logoClickTimer = setTimeout(() => {
        logoClickCount = 0;
    }, 2000);
    
    if (logoClickCount >= 5) {
        window.location.hash = '#admin';
        logoClickCount = 0;
    }
}

// ================================
// MODAL FUNCTIONS
// ================================

function openAdminModal() {
    const modal = document.getElementById('admin-modal');
    modal.classList.remove('hidden');
    
    if (!isAdminAuthenticated) {
        renderAdminLogin();
    } else {
        renderAdminPanel();
    }
}

function closeAdminModal() {
    const modal = document.getElementById('admin-modal');
    modal.classList.add('hidden');
    isAdminAuthenticated = false;
}

function renderAdminLogin() {
    const title = document.getElementById('admin-title');
    const body = document.getElementById('admin-body');
    
    title.textContent = 'Admin Access';
    body.innerHTML = `
        <form onsubmit="handleAdminLogin(event)" style="max-width: 400px; margin: 0 auto;">
            <div class="form-group">
                <label>Password</label>
                <input type="password" id="admin-password" required placeholder="Enter admin password" autocomplete="off">
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%;">Login</button>
        </form>
    `;
}

function handleAdminLogin(event) {
    event.preventDefault();
    const password = document.getElementById('admin-password').value;
    
    if (password === ADMIN_PASSWORD) {
        isAdminAuthenticated = true;
        renderAdminPanel();
        showToast('Login successful', 'success');
    } else {
        showToast('Incorrect password!', 'error');
        document.getElementById('admin-password').value = '';
    }
}

function renderAdminPanel() {
    const title = document.getElementById('admin-title');
    const body = document.getElementById('admin-body');
    
    title.textContent = 'Admin Panel';
    body.innerHTML = `
        <div style="margin-bottom: 1rem; display: flex; justify-content: flex-end;">
            <button onclick="isAdminAuthenticated = false; closeAdminModal();" class="btn btn-outline">Logout</button>
        </div>
        <div class="admin-tabs">
            <button class="admin-tab active" onclick="switchAdminTab('products')">Manage Products</button>
            <button class="admin-tab" onclick="switchAdminTab('mostLiked')">Most Liked (${products.filter(p => p.mostLiked).length})</button>
            <button class="admin-tab" onclick="switchAdminTab('banner')">Banner Image</button>
            <button class="admin-tab" onclick="switchAdminTab('feedbacks')">Feedbacks (${feedbacks.length})</button>
        </div>
        <div id="admin-content"></div>
    `;
    
    switchAdminTab('products');
}

function switchAdminTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    event?.target?.classList.add('active');
    
    const content = document.getElementById('admin-content');
    
    switch(tab) {
        case 'products':
            renderProductsTab(content);
            break;
        case 'mostLiked':
            renderMostLikedTab(content);
            break;
        case 'banner':
            renderBannerTab(content);
            break;
        case 'feedbacks':
            renderFeedbacksTab(content);
            break;
    }
}

function renderProductsTab(content) {
    content.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
            <button onclick="showAddProductForm()" class="btn btn-primary">Add New Design</button>
        </div>
        <div id="product-form-container"></div>
        <div style="overflow-x: auto;">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Price</th>
                        <th>Most Liked</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => `
                        <tr>
                            <td><img src="${product.image}" alt="${product.name}" onclick="openImageViewer('${product.image}', '${product.name}')"></td>
                            <td>${product.name}</td>
                            <td>${product.category}</td>
                            <td><span class="type-badge ${product.type === 'previous-work' ? 'type-previous' : 'type-inspiration'}">${product.type === 'previous-work' ? 'Previous Work' : 'Inspiration'}</span></td>
                            <td>₹${product.price.toLocaleString('en-IN')}</td>
                            <td>
                                <button onclick="toggleMostLiked('${product.id}')" class="btn ${product.mostLiked ? 'btn-primary' : 'btn-outline'}" style="padding: 0.25rem 0.5rem;">
                                    <svg class="icon-small" viewBox="0 0 24 24" fill="${product.mostLiked ? 'currentColor' : 'none'}" stroke="currentColor">
                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                    </svg>
                                </button>
                            </td>
                            <td>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button onclick="editProduct('${product.id}')" class="btn btn-outline" style="padding: 0.25rem 0.5rem;">Edit</button>
                                    <button onclick="deleteProduct('${product.id}')" class="btn btn-outline" style="padding: 0.25rem 0.5rem; color: var(--danger);">Delete</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function showAddProductForm() {
    const container = document.getElementById('product-form-container');
    container.innerHTML = `
        <div style="background: var(--bg); padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
            <h3 style="margin-bottom: 1rem; font-size: 1.25rem; font-weight: 600;">Add New Design</h3>
            <form onsubmit="saveProduct(event)" id="product-form">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                    <div class="form-group">
                        <label>Name *</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>Price (₹) *</label>
                        <input type="number" name="price" required>
                    </div>
                    <div class="form-group">
                        <label>Category *</label>
                        <select name="category" required>
                            <option value="Beds">Beds</option>
                            <option value="Almirah">Almirah</option>
                            <option value="Doors">Doors</option>
                            <option value="Kitchens">Kitchens</option>
                            <option value="LED Panels">LED Panels</option>
                            <option value="Dressing Tables">Dressing Tables</option>
                            <option value="Study Tables">Study Tables</option>
                            <option value="Tables">Tables</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Type *</label>
                        <select name="type" required>
                            <option value="previous-work">Previous Work</option>
                            <option value="inspiration">Inspiration</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Description *</label>
                    <textarea name="description" required rows="3"></textarea>
                </div>
                <div class="form-group">
                    <label>Product Image *</label>
                    <p style="font-size: 0.875rem; color: var(--text-light); margin-bottom: 0.5rem;">Supports 4K images and all common formats</p>
                    <div id="image-preview" style="margin-bottom: 0.75rem; display: none;">
                        <img src="" alt="Preview" style="width: 128px; height: 128px; object-fit: cover; border-radius: 0.5rem; border: 1px solid var(--border);">
                    </div>
                    <input type="file" accept="image/*" onchange="handleImageUpload(event, 'product')" style="margin-bottom: 0.5rem;">
                    <div style="text-align: center; margin: 0.5rem 0; color: var(--text-light); font-size: 0.875rem;">OR</div>
                    <input type="text" name="image" placeholder="Enter image URL (https://...)" onchange="updateImagePreview(this.value)">
                </div>
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" name="mostLiked" style="width: auto;">
                        <span>Mark as Most Liked</span>
                    </label>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Save Product</button>
                    <button type="button" onclick="cancelProductForm()" class="btn btn-outline">Cancel</button>
                </div>
            </form>
        </div>
    `;
}

function handleImageUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showToast('Please upload an image file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
        const imageUrl = reader.result;
        
        if (type === 'product') {
            const form = document.getElementById('product-form');
            const imageInput = form.querySelector('input[name="image"]');
            imageInput.value = imageUrl;
            updateImagePreview(imageUrl);
        } else if (type === 'banner') {
            bannerImage = imageUrl;
            saveToLocalStorage();
            updateBanner();
            showToast('Banner updated successfully', 'success');
            renderBannerTab(document.getElementById('admin-content'));
        }
    };
    
    reader.readAsDataURL(file);
}

function updateImagePreview(url) {
    const preview = document.getElementById('image-preview');
    if (url) {
        preview.style.display = 'block';
        preview.querySelector('img').src = url;
    } else {
        preview.style.display = 'none';
    }
}

function saveProduct(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const product = {
        id: Date.now().toString(),
        name: formData.get('name'),
        description: formData.get('description'),
        price: parseInt(formData.get('price')),
        category: formData.get('category'),
        image: formData.get('image'),
        type: formData.get('type'),
        mostLiked: formData.get('mostLiked') === 'on'
    };
    
    products.push(product);
    saveToLocalStorage();
    showToast('Product added successfully', 'success');
    renderProductsTab(document.getElementById('admin-content'));
    renderProducts();
    renderCategories();
}

function cancelProductForm() {
    document.getElementById('product-form-container').innerHTML = '';
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    const container = document.getElementById('product-form-container');
    container.innerHTML = `
        <div style="background: var(--bg); padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
            <h3 style="margin-bottom: 1rem; font-size: 1.25rem; font-weight: 600;">Edit Design</h3>
            <form onsubmit="updateProduct(event, '${id}')" id="product-form">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                    <div class="form-group">
                        <label>Name *</label>
                        <input type="text" name="name" value="${product.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Price (₹) *</label>
                        <input type="number" name="price" value="${product.price}" required>
                    </div>
                    <div class="form-group">
                        <label>Category *</label>
                        <select name="category" required>
                            ${['Beds', 'Almirah', 'Doors', 'Kitchens', 'LED Panels', 'Dressing Tables', 'Study Tables', 'Tables'].map(cat => 
                                `<option value="${cat}" ${product.category === cat ? 'selected' : ''}>${cat}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Type *</label>
                        <select name="type" required>
                            <option value="previous-work" ${product.type === 'previous-work' ? 'selected' : ''}>Previous Work</option>
                            <option value="inspiration" ${product.type === 'inspiration' ? 'selected' : ''}>Inspiration</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Description *</label>
                    <textarea name="description" required rows="3">${product.description}</textarea>
                </div>
                <div class="form-group">
                    <label>Product Image *</label>
                    <p style="font-size: 0.875rem; color: var(--text-light); margin-bottom: 0.5rem;">Supports 4K images and all common formats</p>
                    <div id="image-preview" style="margin-bottom: 0.75rem;">
                        <img src="${product.image}" alt="Preview" style="width: 128px; height: 128px; object-fit: cover; border-radius: 0.5rem; border: 1px solid var(--border);">
                    </div>
                    <input type="file" accept="image/*" onchange="handleImageUpload(event, 'product')" style="margin-bottom: 0.5rem;">
                    <div style="text-align: center; margin: 0.5rem 0; color: var(--text-light); font-size: 0.875rem;">OR</div>
                    <input type="text" name="image" value="${product.image}" placeholder="Enter image URL (https://...)" onchange="updateImagePreview(this.value)">
                </div>
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                        <input type="checkbox" name="mostLiked" ${product.mostLiked ? 'checked' : ''} style="width: auto;">
                        <span>Mark as Most Liked</span>
                    </label>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Update Product</button>
                    <button type="button" onclick="cancelProductForm()" class="btn btn-outline">Cancel</button>
                </div>
            </form>
        </div>
    `;
    
    container.scrollIntoView({ behavior: 'smooth' });
}

function updateProduct(event, id) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return;
    
    products[index] = {
        id: id,
        name: formData.get('name'),
        description: formData.get('description'),
        price: parseInt(formData.get('price')),
        category: formData.get('category'),
        image: formData.get('image'),
        type: formData.get('type'),
        mostLiked: formData.get('mostLiked') === 'on'
    };
    
    saveToLocalStorage();
    showToast('Product updated successfully', 'success');
    renderProductsTab(document.getElementById('admin-content'));
    renderProducts();
    renderCategories();
}

function deleteProduct(id) {
    if (!confirm('Are you sure you want to delete this design?')) return;
    
    products = products.filter(p => p.id !== id);
    saveToLocalStorage();
    showToast('Product deleted successfully', 'success');
    renderProductsTab(document.getElementById('admin-content'));
    renderProducts();
    renderCategories();
}

function toggleMostLiked(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    product.mostLiked = !product.mostLiked;
    saveToLocalStorage();
    renderProductsTab(document.getElementById('admin-content'));
    renderProducts();
    renderCategories();
}

function renderMostLikedTab(content) {
    const mostLiked = products.filter(p => p.mostLiked);
    
    if (mostLiked.length === 0) {
        content.innerHTML = '<p class="text-center p-4" style="color: var(--text-light)">No products marked as most liked yet. Use the star button in the products tab to add items here.</p>';
        return;
    }
    
    content.innerHTML = `
        <div class="product-grid">
            ${mostLiked.map(product => `
                <div class="product-card">
                    <div class="product-image-container">
                        <img src="${product.image}" alt="${product.name}" class="product-image" onclick="openImageViewer('${product.image}', '${product.name}')">
                        <div class="price-badge">₹${product.price.toLocaleString('en-IN')}</div>
                    </div>
                    <div class="product-info">
                        <div class="product-category">${product.category}</div>
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-description">${product.description}</p>
                        <button onclick="toggleMostLiked('${product.id}')" class="btn btn-outline" style="width: 100%; margin-top: 0.75rem;">
                            Remove from Most Liked
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderBannerTab(content) {
    content.innerHTML = `
        <div>
            <h3 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;">Banner Background Image</h3>
            
            <div style="background: var(--bg); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                <h4 style="font-weight: 500; margin-bottom: 0.5rem;">Current Banner</h4>
                <img src="${bannerImage}" alt="Current banner" onclick="openImageViewer('${bannerImage}', 'Banner Image')" style="width: 100%; height: 200px; object-fit: cover; border-radius: 0.5rem; cursor: pointer;">
            </div>
            
            <div style="border: 1px solid var(--border); padding: 1rem; border-radius: 0.5rem;">
                <h4 style="font-weight: 500; margin-bottom: 0.5rem;">Upload New Banner Image</h4>
                <p style="font-size: 0.875rem; color: var(--text-light); margin-bottom: 1rem;">Supports 4K images and all common formats (JPG, PNG, WebP)</p>
                
                <input type="file" accept="image/*" onchange="handleImageUpload(event, 'banner')" style="margin-bottom: 1rem;">
                
                <div style="text-align: center; margin: 1rem 0; color: var(--text-light); font-size: 0.875rem;">OR</div>
                
                <div class="form-group">
                    <label>Enter Image URL</label>
                    <input type="text" value="${bannerImage}" onchange="updateBannerUrl(this.value)" placeholder="https://...">
                </div>
            </div>
        </div>
    `;
}

function updateBannerUrl(url) {
    bannerImage = url;
    saveToLocalStorage();
    updateBanner();
    showToast('Banner updated successfully', 'success');
}

function renderFeedbacksTab(content) {
    if (feedbacks.length === 0) {
        content.innerHTML = '<p class="text-center p-4" style="color: var(--text-light)">No feedbacks received yet.</p>';
        return;
    }
    
    content.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${feedbacks.map(feedback => `
                <div style="border: 1px solid var(--border); border-radius: 0.5rem; padding: 1rem; background: white;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                        <div>
                            <h4 style="font-weight: 600; font-size: 1.125rem;">${feedback.name}</h4>
                            <p style="font-size: 0.875rem; color: var(--text-light);">${feedback.email} • ${feedback.phone}</p>
                            <p style="font-size: 0.75rem; color: var(--text-light); margin-top: 0.25rem;">${new Date(feedback.timestamp).toLocaleString('en-IN')}</p>
                        </div>
                        <button onclick="deleteFeedback('${feedback.id}')" class="btn btn-outline" style="padding: 0.25rem 0.5rem; color: var(--danger);">Delete</button>
                    </div>
                    <p style="color: var(--text);">${feedback.message}</p>
                </div>
            `).join('')}
        </div>
    `;
}

function deleteFeedback(id) {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    
    feedbacks = feedbacks.filter(f => f.id !== id);
    saveToLocalStorage();
    showToast('Feedback deleted successfully', 'success');
    renderFeedbacksTab(document.getElementById('admin-content'));
    
    // Update tab count
    document.querySelectorAll('.admin-tab')[3].textContent = `Feedbacks (${feedbacks.length})`;
}

// Feedback Modal
function openFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    modal.classList.remove('hidden');
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    modal.classList.add('hidden');
    document.getElementById('feedback-form').reset();
}

function submitFeedback(event) {
    event.preventDefault();
    const form = event.target;
    
    const feedback = {
        id: Date.now().toString(),
        name: form.querySelector('#feedback-name').value,
        email: form.querySelector('#feedback-email').value,
        phone: form.querySelector('#feedback-phone').value,
        message: form.querySelector('#feedback-message').value,
        timestamp: Date.now()
    };
    
    feedbacks.unshift(feedback);
    saveToLocalStorage();
    
    showToast('Thank you for your feedback! We\'ll get back to you soon.', 'success');
    
    setTimeout(() => {
        closeFeedbackModal();
    }, 1500);
}

// Image Viewer
function openImageViewer(url, name) {
    const modal = document.getElementById('image-viewer-modal');
    const title = document.getElementById('image-viewer-title');
    const image = document.getElementById('viewer-image');
    
    title.textContent = name;
    image.src = url;
    currentZoom = 100;
    updateZoomDisplay();
    
    modal.classList.remove('hidden');
}

function closeImageViewer() {
    const modal = document.getElementById('image-viewer-modal');
    modal.classList.add('hidden');
}

function zoomImage(direction) {
    const image = document.getElementById('viewer-image');
    
    if (direction === 'in' && currentZoom < 300) {
        currentZoom += 25;
    } else if (direction === 'out' && currentZoom > 50) {
        currentZoom -= 25;
    }
    
    image.style.transform = `scale(${currentZoom / 100})`;
    updateZoomDisplay();
}

function updateZoomDisplay() {
    document.getElementById('zoom-level').textContent = `${currentZoom}%`;
}

function downloadImage() {
    const image = document.getElementById('viewer-image');
    const link = document.createElement('a');
    link.href = image.src;
    link.download = document.getElementById('image-viewer-title').textContent + '.jpg';
    link.click();
}

// Toast Notifications
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ================================
// INITIALIZATION
// ================================

document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    // Initialize UI
    updateBanner();
    renderCategories();
    renderProducts();
    updatePinnedBadge();
    
    // Modal click outside to close
    document.getElementById('admin-modal').addEventListener('click', (e) => {
        if (e.target.id === 'admin-modal') closeAdminModal();
    });
    
    document.getElementById('feedback-modal').addEventListener('click', (e) => {
        if (e.target.id === 'feedback-modal') closeFeedbackModal();
    });
    
    document.getElementById('image-viewer-modal').addEventListener('click', (e) => {
        if (e.target.id === 'image-viewer-modal') closeImageViewer();
    });
});
