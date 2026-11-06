// Vibe Tindahan - Smart Business Management System Controller
// State Management
const state = {
  products: [],
  customers: [],
  cart: [],
  sales: [],
  expenses: [],
  settings: {},
  analytics: {},
  aiBriefing: {},
  aiRestock: [],
  aiCombos: [],
  activeTab: 'pos',
  activeCategory: 'All',
  selectedPaymentMethod: 'Cash',
  currentLang: localStorage.getItem('vibe_tindahan_lang') || 'fil',
  soundEnabled: true,
  barcodeScannerInstance: null,
  currentReceiptData: null,
  charts: {
    salesTrend: null,
    paymentMethods: null
  }
};

// ==================== BILINGUAL LANGUAGE SWITCHER ====================
function setLanguage(lang) {
  if (lang !== 'fil' && lang !== 'en') lang = 'fil';
  state.currentLang = lang;
  localStorage.setItem('vibe_tindahan_lang', lang);

  // 1. Sync Ribbon Toggle Buttons
  const btnFil = document.getElementById('langBtnFil');
  const btnEn = document.getElementById('langBtnEn');
  if (btnFil && btnEn) {
    if (lang === 'fil') {
      btnFil.classList.add('active');
      btnEn.classList.remove('active');
    } else {
      btnEn.classList.add('active');
      btnFil.classList.remove('active');
    }
  }

  // 2. Sync Settings Dropdown
  const langSelect = document.getElementById('settingStoreLang');
  if (langSelect && langSelect.value !== lang) {
    langSelect.value = lang;
  }

  // 3. Update all [data-i18n] text
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translated = t(key, lang);
    if (translated) {
      el.textContent = translated;
    }
  });

  // 4. Update all [data-i18n-placeholder] placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const translated = t(key, lang);
    if (translated) {
      el.placeholder = translated;
    }
  });

  // 5. Update sound button
  const soundBtn = document.getElementById('soundToggleBtn');
  if (soundBtn) {
    soundBtn.textContent = state.soundEnabled ? t('sound_on', lang) : t('sound_off', lang);
  }

  // 6. Dynamic re-renders of active components
  updateNavMetrics();
  updateLowStockAlerts();
  renderPosCategories();
  renderPosProducts();
  renderCart();
  renderInventoryTable();
  renderUtangList();
  renderAnalyticsCharts();
  renderSalesLedger();
  renderExpensesList();
  fetchAiInsights().then(() => renderAiView());

  const msg = lang === 'fil' ? 'Naka-set sa Wikang Filipino 🇵🇭' : 'Language switched to English 🇺🇸';
  showToast(msg, 'info');
}

// Web Audio API Sound Synthesizer (No external audio files needed)
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playBeep() {
  if (!state.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, ctx.currentTime); // Cash register scanner beep
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  } catch (e) {
    console.warn('Audio beep error:', e);
  }
}

function playChime() {
  if (!state.soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 (Celebratory coin chime)
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
    });
  } catch (e) {
    console.warn('Audio chime error:', e);
  }
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  const btn = document.getElementById('soundToggleBtn');
  btn.textContent = state.soundEnabled ? t('sound_on', state.currentLang) : t('sound_off', state.currentLang);
  showToast(state.soundEnabled 
    ? (state.currentLang === 'en' ? 'Sound enabled' : 'Bukas ang tunog') 
    : (state.currentLang === 'en' ? 'Sound muted' : 'Naka-mute ang tunog'));
}

// Global Hardware Barcode Scanner Listener
let barcodeBuffer = '';
let lastKeyTime = Date.now();
window.addEventListener('keydown', (e) => {
  // If user is focused on a text input or textarea, let normal typing happen
  const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
  const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';
  
  const currentTime = Date.now();
  const timeDiff = currentTime - lastKeyTime;
  lastKeyTime = currentTime;

  // Scanners type at high speed (< 50ms per key)
  if (e.key === 'Enter') {
    if (barcodeBuffer.length >= 4) {
      const scannedCode = barcodeBuffer.trim();
      barcodeBuffer = '';
      if (state.activeTab === 'pos') {
        e.preventDefault();
        handleScannedBarcode(scannedCode);
      }
    } else {
      barcodeBuffer = '';
    }
  } else if (e.key.length === 1) {
    if (timeDiff > 100) {
      barcodeBuffer = '';
    }
    barcodeBuffer += e.key;
  }
});

function handleScannedBarcode(barcode) {
  const prod = state.products.find(p => p.barcode === barcode);
  if (prod) {
    playBeep();
    addToCart(prod.id);
    showToast(`Scanned: ${prod.name}`);
  } else {
    showToast(`Hindi nahanap ang barcode: ${barcode}`, 'warning');
  }
}

function simulateBarcodeScan(barcode) {
  handleScannedBarcode(barcode);
}

// Initial Data Loading
async function initApp() {
  try {
    await Promise.all([
      fetchSettings(),
      fetchProducts(),
      fetchCustomers(),
      fetchAnalytics(),
      fetchExpenses(),
      fetchSales(),
      fetchAiInsights()
    ]);
    const initialLang = localStorage.getItem('vibe_tindahan_lang') || state.settings.language || 'fil';
    setLanguage(initialLang);
  } catch (err) {
    console.error('Initialization error:', err);
    showToast('Error loading store data. Please refresh.', 'danger');
  }
}

// API Calls
async function fetchSettings() {
  const res = await fetch('/api/settings');
  state.settings = await res.json();
  applyStoreSettings(state.settings);
}

function applyStoreSettings(settings) {
  if (!settings) return;
  const name = settings.name || 'Vibe Tindahan';
  const logo = settings.logo || '🏪';
  const tagline = settings.tagline || (state.currentLang === 'en' ? 'Your Reliable Neighborhood Store' : 'Ang Maaasahang Tindahan ng Barangay');

  // 1. Update Header Navigation Branding
  const nameEl = document.getElementById('navStoreName');
  if (nameEl) nameEl.textContent = name;

  const logoEl = document.getElementById('navStoreLogo');
  if (logoEl) logoEl.textContent = logo;

  const taglineEl = document.getElementById('navStoreTagline');
  if (taglineEl) taglineEl.textContent = tagline;

  // 2. Update Browser Tab Title
  document.title = `${name} – Smart Business Management System`;

  // 3. Update Live Settings Preview Box
  const pFormLogo = document.getElementById('previewFormLogo');
  if (pFormLogo) pFormLogo.textContent = logo;

  const pHeaderIcon = document.getElementById('previewHeaderIcon');
  if (pHeaderIcon) pHeaderIcon.textContent = logo;

  const pHeaderName = document.getElementById('previewHeaderName');
  if (pHeaderName) pHeaderName.textContent = name;

  const pHeaderTagline = document.getElementById('previewHeaderTagline');
  if (pHeaderTagline) pHeaderTagline.textContent = tagline;

  // 4. Update Form Inputs if not actively being typed in
  const nameInput = document.getElementById('settingStoreName');
  if (nameInput && document.activeElement !== nameInput) nameInput.value = settings.name || '';

  const logoSelect = document.getElementById('settingStoreLogo');
  if (logoSelect && document.activeElement !== logoSelect) logoSelect.value = settings.logo || '🏪';

  const taglineInput = document.getElementById('settingStoreTagline');
  if (taglineInput && document.activeElement !== taglineInput) taglineInput.value = settings.tagline || '';

  const ownerInput = document.getElementById('settingStoreOwner');
  if (ownerInput && document.activeElement !== ownerInput) ownerInput.value = settings.owner || '';

  const phoneInput = document.getElementById('settingStorePhone');
  if (phoneInput && document.activeElement !== phoneInput) phoneInput.value = settings.phone || '';

  const addressInput = document.getElementById('settingStoreAddress');
  if (addressInput && document.activeElement !== addressInput) addressInput.value = settings.address || '';

  const footerInput = document.getElementById('settingReceiptFooter');
  if (footerInput && document.activeElement !== footerInput) footerInput.value = settings.receiptFooter || '';

  const langSelect = document.getElementById('settingStoreLang');
  if (langSelect && settings.language) {
    langSelect.value = settings.language;
    if (!localStorage.getItem('vibe_tindahan_lang')) {
      state.currentLang = settings.language;
    }
  }
}

function handleSettingsLiveInput() {
  const name = document.getElementById('settingStoreName').value.trim() || 'Vibe Tindahan';
  const logo = document.getElementById('settingStoreLogo').value || '🏪';
  const tagline = document.getElementById('settingStoreTagline').value.trim() || 'Ang Maaasahang Tindahan ng Barangay';

  // Immediate live header reflection
  const nameEl = document.getElementById('navStoreName');
  if (nameEl) nameEl.textContent = name;

  const logoEl = document.getElementById('navStoreLogo');
  if (logoEl) logoEl.textContent = logo;

  const taglineEl = document.getElementById('navStoreTagline');
  if (taglineEl) taglineEl.textContent = tagline;

  document.title = `${name} – Smart Business Management System`;

  // Live preview box
  const pFormLogo = document.getElementById('previewFormLogo');
  if (pFormLogo) pFormLogo.textContent = logo;

  const pHeaderIcon = document.getElementById('previewHeaderIcon');
  if (pHeaderIcon) pHeaderIcon.textContent = logo;

  const pHeaderName = document.getElementById('previewHeaderName');
  if (pHeaderName) pHeaderName.textContent = name;

  const pHeaderTagline = document.getElementById('previewHeaderTagline');
  if (pHeaderTagline) pHeaderTagline.textContent = tagline;

  const liveBadge = document.getElementById('settingsLiveBadge');
  if (liveBadge) {
    liveBadge.textContent = '✏️ Nagbabago (Unsaved)';
    liveBadge.className = 'badge badge-warning';
  }
}

async function fetchProducts() {
  const res = await fetch('/api/products');
  state.products = await res.json();
  updateLowStockAlerts();
}

async function fetchCustomers() {
  const res = await fetch('/api/customers');
  state.customers = await res.json();
  populateUtangCustomerDropdown();
}

async function fetchAnalytics() {
  const res = await fetch('/api/analytics/daily');
  state.analytics = await res.json();
}

async function fetchExpenses() {
  const res = await fetch('/api/expenses');
  state.expenses = await res.json();
  renderExpensesList();
}

async function fetchSales() {
  const res = await fetch('/api/sales?limit=50');
  state.sales = await res.json();
  renderSalesLedger();
}

async function fetchAiInsights() {
  try {
    const lang = state.currentLang || 'fil';
    const [briefingRes, restockRes, combosRes] = await Promise.all([
      fetch(`/api/ai/briefing?lang=${lang}`),
      fetch('/api/ai/restock'),
      fetch('/api/ai/combos')
    ]);
    state.aiBriefing = await briefingRes.json();
    state.aiRestock = await restockRes.json();
    state.aiCombos = await combosRes.json();
  } catch (e) {
    console.warn('AI fetch error:', e);
  }
}

// Navigation & Tab Switching
function switchTab(tabId, filterLowStock = false) {
  state.activeTab = tabId;
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === `tab-${tabId}`);
  });

  if (tabId === 'pos') {
    document.getElementById('posSearchInput').focus();
  } else if (tabId === 'inventory') {
    if (filterLowStock) {
      document.getElementById('toggleLowStockFilterBtn').classList.add('btn-danger');
      state.lowStockFilterActive = true;
    }
    renderInventoryTable();
  } else if (tabId === 'utang') {
    renderUtangList();
  } else if (tabId === 'analytics') {
    renderAnalyticsCharts();
  } else if (tabId === 'ai') {
    renderAiView();
  }
}

function updateNavMetrics() {
  const sym = state.settings.currencySymbol || '₱';
  document.getElementById('navTodaySales').textContent = `${sym}${(state.analytics.grossSales || 0).toFixed(2)}`;
  document.getElementById('navTodayProfit').textContent = `${sym}${(state.analytics.netProfit || 0).toFixed(2)}`;
  document.getElementById('navTotalUtang').textContent = `${sym}${(state.analytics.totalOutstandingUtang || 0).toFixed(2)}`;
  
  const lowCount = state.analytics.lowStockCount || 0;
  document.getElementById('navLowStockCount').textContent = lowCount;
  
  const invBadge = document.getElementById('inventoryTabBadge');
  if (lowCount > 0) {
    invBadge.textContent = lowCount;
    invBadge.style.display = 'inline-block';
  } else {
    invBadge.style.display = 'none';
  }
}

function updateLowStockAlerts() {
  const lowStockItems = state.products.filter(p => p.stock <= (p.minStock || 5));
  const banner = document.getElementById('lowStockAlertBanner');
  const isEn = state.currentLang === 'en';
  if (lowStockItems.length > 0) {
    banner.style.display = 'flex';
    document.getElementById('lowStockBannerTitle').textContent = isEn
      ? `Attention: ${lowStockItems.length} products are low or out of stock!`
      : `Pansin: May ${lowStockItems.length} produkto na paubos na o ubos na!`;
    document.getElementById('lowStockBannerSub').textContent = isEn
      ? `Critical items: ${lowStockItems.slice(0, 3).map(p => p.name).join(', ')}`
      : `Mga kritikal: ${lowStockItems.slice(0, 3).map(p => p.name).join(', ')}`;
  } else {
    banner.style.display = 'none';
  }
}

// ==================== POS CASHIER FUNCTIONS ====================
function renderPosCategories() {
  const categories = ['All', ...new Set(state.products.map(p => p.category))];
  const container = document.getElementById('posCategoryPills');
  const isEn = state.currentLang === 'en';
  const allLabel = isEn ? '🌟 All Items' : '🌟 Lahat';

  container.innerHTML = categories.map(cat => `
    <button class="cat-pill ${cat === state.activeCategory ? 'active' : ''}" onclick="selectPosCategory('${cat}')">
      ${cat === 'All' ? allLabel : cat}
    </button>
  `).join('');

  // Also populate datalist in add product modal
  const datalist = document.getElementById('categoryDatalist');
  datalist.innerHTML = categories.filter(c => c !== 'All').map(c => `<option value="${c}">`).join('');
  
  // Populate inventory category filter dropdown
  const invSelect = document.getElementById('inventoryCategoryFilter');
  invSelect.innerHTML = `<option value="All">${isEn ? 'All Categories' : 'Lahat ng Kategorya'}</option>` +
    categories.filter(c => c !== 'All').map(c => `<option value="${c}">${c}</option>`).join('');
}

function selectPosCategory(cat) {
  state.activeCategory = cat;
  renderPosCategories();
  renderPosProducts();
}

function handlePosSearch() {
  renderPosProducts();
}

function clearPosFilters() {
  state.activeCategory = 'All';
  document.getElementById('posSearchInput').value = '';
  renderPosCategories();
  renderPosProducts();
}

function renderPosProducts() {
  const search = document.getElementById('posSearchInput').value.toLowerCase().trim();
  let filtered = state.products;
  const isEn = state.currentLang === 'en';

  if (state.activeCategory !== 'All') {
    filtered = filtered.filter(p => p.category.toLowerCase() === state.activeCategory.toLowerCase());
  }

  if (search) {
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(search) || 
      (p.barcode && p.barcode.includes(search)) ||
      (p.category && p.category.toLowerCase().includes(search))
    );
  }

  const container = document.getElementById('posProductGrid');
  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--gray-500);">
        <div style="font-size:2.5rem; margin-bottom:0.5rem;">🔍</div>
        <p>${isEn ? `No products found matching "${search || state.activeCategory}".` : `Walang nahanap na paninda para sa "${search || state.activeCategory}".`}</p>
      </div>
    `;
    return;
  }

  const sym = state.settings.currencySymbol || '₱';

  container.innerHTML = filtered.map(prod => {
    let stockClass = 'stock-good';
    let stockLabel = `${prod.stock} ${prod.unit || 'pcs'}`;
    let isOutOfStock = prod.stock <= 0;

    if (isOutOfStock) {
      stockClass = 'stock-out';
      stockLabel = isEn ? 'OUT OF STOCK' : 'UBOS NA';
    } else if (prod.stock <= (prod.minStock || 5)) {
      stockClass = 'stock-low';
      stockLabel = `⚠️ ${prod.stock} ${prod.unit || 'pcs'}`;
    }

    return `
      <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}" onclick="${isOutOfStock ? '' : `addToCart('${prod.id}')`}">
        <div class="card-top">
          <span class="stock-tag ${stockClass}">${stockLabel}</span>
          <span style="font-size:0.65rem; color:var(--gray-500); font-family:monospace;">${prod.barcode.slice(-6)}</span>
        </div>
        <div class="product-name" title="${prod.name}">${prod.name}</div>
        <div class="product-unit">${prod.category} • ${prod.unit || 'unit'}</div>
        <div class="product-price-row">
          <div class="product-price">${sym}${prod.sellingPrice.toFixed(2)}</div>
          <button class="add-btn" title="${isEn ? 'Add to Cart' : 'Idagdag sa Basket'}" ${isOutOfStock ? 'disabled' : ''}>+</button>
        </div>
      </div>
    `;
  }).join('');
}

// Cart Logic
function addToCart(productId) {
  const prod = state.products.find(p => p.id === productId);
  if (!prod) return;

  if (prod.stock <= 0) {
    showToast(`Ubos na ang stock ng ${prod.name}!`, 'danger');
    return;
  }

  const existing = state.cart.find(item => item.productId === productId);
  if (existing) {
    if (existing.qty + 1 > prod.stock) {
      showToast(`Hanggang ${prod.stock} ${prod.unit} lamang ang natitirang stock!`, 'warning');
      return;
    }
    existing.qty += 1;
  } else {
    state.cart.push({
      productId: prod.id,
      name: prod.name,
      barcode: prod.barcode,
      unitPrice: prod.sellingPrice,
      costPrice: prod.costPrice,
      qty: 1,
      unit: prod.unit
    });
  }

  playBeep();
  renderCart();
}

function updateCartQty(productId, delta) {
  const item = state.cart.find(i => i.productId === productId);
  const prod = state.products.find(p => p.id === productId);
  if (!item || !prod) return;

  const newQty = item.qty + delta;
  if (newQty <= 0) {
    removeFromCart(productId);
    return;
  }

  if (newQty > prod.stock) {
    showToast(`Hanggang ${prod.stock} lamang ang natitirang stock!`, 'warning');
    return;
  }

  item.qty = newQty;
  renderCart();
}

function removeFromCart(productId) {
  state.cart = state.cart.filter(item => item.productId !== productId);
  renderCart();
}

function clearCart() {
  if (state.cart.length === 0) return;
  state.cart = [];
  document.getElementById('cashTenderedInput').value = '';
  document.getElementById('cartDiscountType').value = 'none';
  document.getElementById('cartDiscountValue').style.display = 'none';
  renderCart();
  showToast('Nalinis na ang basket.');
}

function applyDiscount() {
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cartItemsContainer');
  const countBadge = document.getElementById('cartCountBadge');
  const sym = state.settings.currencySymbol || '₱';
  const isEn = state.currentLang === 'en';

  const totalItemsCount = state.cart.reduce((sum, i) => sum + i.qty, 0);
  const itemWord = totalItemsCount === 1 ? t('item_singular', state.currentLang) : t('item_plural', state.currentLang);
  countBadge.textContent = `${totalItemsCount} ${itemWord}`;

  if (state.cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-state">
        <div class="empty-cart-icon">🛍️</div>
        <p data-i18n="empty_cart_msg">${t('empty_cart_msg', state.currentLang)}</p>
        <small data-i18n="empty_cart_sub">${t('empty_cart_sub', state.currentLang)}</small>
      </div>
    `;
    document.getElementById('cartSubtotal').textContent = `${sym}0.00`;
    document.getElementById('cartTotalAmount').textContent = `${sym}0.00`;
    document.getElementById('cartDiscountRow').style.display = 'none';
    calculateSukli();

    const mobileBar = document.getElementById('mobileCartFloatingBar');
    if (mobileBar) mobileBar.style.display = 'none';
    closeMobileCartDrawer();
    return;
  }

  container.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name" title="${item.name}">${item.name}</div>
        <div class="cart-item-price">${sym}${item.unitPrice.toFixed(2)} / ${item.unit || 'pc'}</div>
      </div>
      <div class="qty-control">
        <button class="qty-btn" onclick="updateCartQty('${item.productId}', -1)">-</button>
        <span class="qty-value">${item.qty}</span>
        <button class="qty-btn" onclick="updateCartQty('${item.productId}', 1)">+</button>
      </div>
      <div class="cart-item-total">
        ${sym}${(item.unitPrice * item.qty).toFixed(2)}
      </div>
      <button class="cart-item-remove" onclick="removeFromCart('${item.productId}')" title="${isEn ? 'Remove' : 'Tanggalin'}">✕</button>
    </div>
  `).join('');

  // Calculations
  const subtotal = state.cart.reduce((sum, i) => sum + (i.unitPrice * i.qty), 0);
  document.getElementById('cartSubtotal').textContent = `${sym}${subtotal.toFixed(2)}`;

  // Discount
  const discType = document.getElementById('cartDiscountType').value;
  const discValInput = document.getElementById('cartDiscountValue');
  let discountAmount = 0;

  if (discType === 'pwd_senior') {
    discValInput.style.display = 'none';
    discountAmount = subtotal * 0.05; // 5% special store discount
  } else if (discType === 'round_off') {
    discValInput.style.display = 'none';
    discountAmount = Math.min(subtotal, 1.00); // Bawas piso
  } else if (discType === 'custom') {
    discValInput.style.display = 'inline-block';
    discountAmount = Number(discValInput.value) || 0;
  } else {
    discValInput.style.display = 'none';
  }

  discountAmount = Math.min(subtotal, Math.max(0, discountAmount));

  if (discountAmount > 0) {
    document.getElementById('cartDiscountRow').style.display = 'flex';
    document.getElementById('cartDiscountAmount').textContent = `-${sym}${discountAmount.toFixed(2)}`;
  } else {
    document.getElementById('cartDiscountRow').style.display = 'none';
  }

  const finalTotal = Math.max(0, subtotal - discountAmount);
  document.getElementById('cartTotalAmount').textContent = `${sym}${finalTotal.toFixed(2)}`;

  calculateSukli();

  // Update Mobile Floating Cart Bar
  const mobileBar = document.getElementById('mobileCartFloatingBar');
  const mobileBadge = document.getElementById('mobileCartBadge');
  const mobileTotal = document.getElementById('mobileCartBarTotal');
  if (mobileBar && mobileBadge && mobileTotal) {
    mobileBadge.textContent = `${totalItemsCount} ${itemWord}`;
    mobileTotal.textContent = `${sym}${finalTotal.toFixed(2)}`;
    // Only display on mobile/tablet viewports via CSS
    mobileBar.style.display = '';
  }
}

function openMobileCartDrawer() {
  const panel = document.querySelector('.cart-panel');
  const backdrop = document.getElementById('cartBackdrop');
  if (panel) panel.classList.add('mobile-drawer-open');
  if (backdrop) backdrop.classList.add('active');
}

function closeMobileCartDrawer() {
  const panel = document.querySelector('.cart-panel');
  const backdrop = document.getElementById('cartBackdrop');
  if (panel) panel.classList.remove('mobile-drawer-open');
  if (backdrop) backdrop.classList.remove('active');
}

function selectPaymentMethod(method) {
  state.selectedPaymentMethod = method;
  document.querySelectorAll('.pay-method-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.method === method);
  });

  document.getElementById('cashPaymentArea').style.display = method === 'Cash' ? 'block' : 'none';
  document.getElementById('gcashPaymentArea').style.display = method === 'GCash' ? 'block' : 'none';
  document.getElementById('utangPaymentArea').style.display = method === 'Utang' ? 'block' : 'none';
}

function setCashTender(val) {
  const subtotal = state.cart.reduce((sum, i) => sum + (i.unitPrice * i.qty), 0);
  const discAmount = calculateCurrentDiscount(subtotal);
  const total = subtotal - discAmount;

  if (val === 'exact') {
    document.getElementById('cashTenderedInput').value = total.toFixed(2);
  } else {
    document.getElementById('cashTenderedInput').value = val;
  }
  calculateSukli();
}

function calculateCurrentDiscount(subtotal) {
  const discType = document.getElementById('cartDiscountType').value;
  if (discType === 'pwd_senior') return subtotal * 0.05;
  if (discType === 'round_off') return Math.min(subtotal, 1.00);
  if (discType === 'custom') return Number(document.getElementById('cartDiscountValue').value) || 0;
  return 0;
}

function calculateSukli() {
  const sym = state.settings.currencySymbol || '₱';
  const isEn = state.currentLang === 'en';
  const subtotal = state.cart.reduce((sum, i) => sum + (i.unitPrice * i.qty), 0);
  const discount = calculateCurrentDiscount(subtotal);
  const total = Math.max(0, subtotal - discount);

  const tendered = Number(document.getElementById('cashTenderedInput').value) || 0;
  const sukli = Math.max(0, tendered - total);

  document.getElementById('sukliAmountDisplay').textContent = `${sym}${sukli.toFixed(2)}`;
  if (tendered > 0 && tendered < total) {
    const diff = (total - tendered).toFixed(2);
    document.getElementById('sukliAmountDisplay').textContent = isEn ? `Short by ${sym}${diff}` : `Kulang ng ${sym}${diff}`;
    document.getElementById('sukliAmountDisplay').style.color = 'var(--danger)';
  } else {
    document.getElementById('sukliAmountDisplay').style.color = '#047857';
  }
}

function populateUtangCustomerDropdown() {
  const select = document.getElementById('utangCustomerSelect');
  const sym = state.settings.currencySymbol || '₱';
  const isEn = state.currentLang === 'en';
  const defaultLabel = isEn ? '-- Select Customer --' : '-- Piliin ang Pangalan ng Suki --';
  const debtLabel = isEn ? 'Debt' : 'Utang';
  
  select.innerHTML = `<option value="">${defaultLabel}</option>` +
    state.customers.map(c => `
      <option value="${c.id}">${c.name} (${debtLabel}: ${sym}${c.currentBalance.toFixed(2)} / Limit: ${sym}${c.creditLimit})</option>
    `).join('');
}

function checkSelectedCustomerUtang() {
  const custId = document.getElementById('utangCustomerSelect').value;
  const alertEl = document.getElementById('customerCreditAlert');
  if (!custId) {
    alertEl.style.display = 'none';
    return;
  }

  const cust = state.customers.find(c => c.id === custId);
  if (!cust) return;

  const subtotal = state.cart.reduce((sum, i) => sum + (i.unitPrice * i.qty), 0);
  const discount = calculateCurrentDiscount(subtotal);
  const total = Math.max(0, subtotal - discount);
  const isEn = state.currentLang === 'en';

  const projectedBalance = cust.currentBalance + total;
  if (projectedBalance > cust.creditLimit) {
    alertEl.style.display = 'block';
    alertEl.textContent = isEn
      ? `⚠️ WARNING: Customer will exceed Credit Limit (₱${cust.creditLimit})! Projected Balance: ₱${projectedBalance.toFixed(2)}`
      : `⚠️ BABALA: Lalampas sa Credit Limit (₱${cust.creditLimit})! Bagong Balanse: ₱${projectedBalance.toFixed(2)}`;
  } else if (projectedBalance >= cust.creditLimit * 0.85) {
    alertEl.style.display = 'block';
    alertEl.textContent = isEn
      ? `⚠️ Notice: Approaching credit limit (₱${projectedBalance.toFixed(2)} / ₱${cust.creditLimit}).`
      : `⚠️ Paalala: Malapit na sa limit (₱${projectedBalance.toFixed(2)} / ₱${cust.creditLimit}).`;
  } else {
    alertEl.style.display = 'none';
  }
}

// POS Checkout
async function processCheckout() {
  if (state.cart.length === 0) {
    showToast(state.currentLang === 'en' ? 'Cart is empty!' : 'Walang laman ang basket!', 'warning');
    return;
  }

  const subtotal = state.cart.reduce((sum, i) => sum + (i.unitPrice * i.qty), 0);
  const discount = calculateCurrentDiscount(subtotal);
  const total = Math.max(0, subtotal - discount);

  const method = state.selectedPaymentMethod;
  let tendered = total;
  let customerId = null;
  let refNum = null;

  if (method === 'Cash') {
    tendered = Number(document.getElementById('cashTenderedInput').value);
    if (!tendered || tendered < total) {
      showToast(state.currentLang === 'en' ? `Insufficient cash! Total: ₱${total.toFixed(2)}` : `Kulang ang ibinayad na cash! Kailangan: ₱${total.toFixed(2)}`, 'warning');
      return;
    }
  } else if (method === 'GCash') {
    refNum = document.getElementById('gcashRefInput').value.trim();
  } else if (method === 'Utang') {
    customerId = document.getElementById('utangCustomerSelect').value;
    if (!customerId) {
      showToast(state.currentLang === 'en' ? 'Please select a customer for store credit!' : 'Pumili muna ng suki na ililista sa utang!', 'warning');
      return;
    }
  }

  const payload = {
    items: state.cart.map(i => ({
      productId: i.productId,
      qty: i.qty,
      unitPrice: i.unitPrice
    })),
    discount,
    paymentMethod: method,
    cashTendered: tendered,
    customerId,
    referenceNumber: refNum,
    cashier: state.settings.owner || 'Ate Baby'
  };

  try {
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to complete sale.');
    }

    const sale = await res.json();
    playChime();
    
    // Confetti celebration for checkout
    if (window.confetti) {
      window.confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    }

    showToast(state.currentLang === 'en' ? `Sale Complete! Receipt: ${sale.receiptNumber}` : `Benta Tagumpay! Resibo: ${sale.receiptNumber}`);

    // Update state & re-fetch
    await Promise.all([
      fetchProducts(),
      fetchCustomers(),
      fetchAnalytics(),
      fetchSales(),
      fetchAiInsights()
    ]);

    renderPosProducts();
    renderInventoryTable();
    renderUtangList();
    renderAnalyticsCharts();
    renderAiView();
    updateNavMetrics();

    // Clear cart and reset inputs
    state.cart = [];
    document.getElementById('cashTenderedInput').value = '';
    document.getElementById('gcashRefInput').value = '';
    renderCart();

    // Show Printable Thermal Receipt
    showThermalReceipt(sale);

  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// Thermal Receipt Display & Print
function showThermalReceipt(sale) {
  state.currentReceiptData = sale;
  const sym = state.settings.currencySymbol || '₱';
  const container = document.getElementById('thermalReceiptContent');
  const isEn = state.currentLang === 'en';

  const dateObj = new Date(sale.timestamp);
  const formattedDate = dateObj.toLocaleDateString(isEn ? 'en-US' : 'en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  const formattedTime = dateObj.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });

  let paymentDetailsHtml = '';
  if (sale.paymentMethod === 'Cash') {
    paymentDetailsHtml = `
      <tr><td>${isEn ? 'Cash Tendered:' : 'Cash Na Bayad:'}</td><td class="receipt-right">${sym}${Number(sale.cashTendered).toFixed(2)}</td></tr>
      <tr><td>${isEn ? 'Change:' : 'Sukli (Change):'}</td><td class="receipt-right"><strong>${sym}${Number(sale.change).toFixed(2)}</strong></td></tr>
    `;
  } else if (sale.paymentMethod === 'GCash') {
    paymentDetailsHtml = `
      <tr><td>Payment:</td><td class="receipt-right">GCash / E-Wallet</td></tr>
      <tr><td>Ref No:</td><td class="receipt-right">${sale.referenceNumber || 'N/A'}</td></tr>
    `;
  } else if (sale.paymentMethod === 'Utang') {
    const cust = state.customers.find(c => c.id === sale.customerId);
    paymentDetailsHtml = `
      <tr><td>Payment:</td><td class="receipt-right"><strong>${isEn ? 'CREDIT (Utang)' : 'UTANG (Charge)'}</strong></td></tr>
      <tr><td>${isEn ? 'Customer:' : 'Suki:'}</td><td class="receipt-right">${sale.customerName || 'Suki'}</td></tr>
      <tr><td>${isEn ? 'New Balance:' : 'Bagong Balanse:'}</td><td class="receipt-right" style="color:#b91c1c;"><strong>${sym}${cust ? cust.currentBalance.toFixed(2) : ''}</strong></td></tr>
    `;
  }

  container.innerHTML = `
    <div class="receipt-header-center">
      <div class="receipt-store-title">${state.settings.name || 'VIBE TINDAHAN'}</div>
      <div>${state.settings.address || 'Pasig City'}</div>
      <div>Tel: ${state.settings.phone || '0917-888-8423'}</div>
      <div style="font-size:10px; margin-top:2px;">Official Non-VAT Customer Slip</div>
    </div>

    <div class="receipt-divider"></div>

    <table class="receipt-table">
      <tr><td>${isEn ? 'Receipt #:' : 'Resibo #:'}</td><td class="receipt-right"><strong>${sale.receiptNumber}</strong></td></tr>
      <tr><td>${isEn ? 'Date:' : 'Petsa:'}</td><td class="receipt-right">${formattedDate} ${formattedTime}</td></tr>
      <tr><td>${isEn ? 'Cashier:' : 'Tindero:'}</td><td class="receipt-right">${sale.cashier || 'Bantay'}</td></tr>
    </table>

    <div class="receipt-divider"></div>

    <table class="receipt-table">
      <thead>
        <tr>
          <th style="text-align:left;">Item</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">${isEn ? 'Price' : 'Presyo'}</th>
          <th style="text-align:right;">${isEn ? 'Total' : 'Kabuuan'}</th>
        </tr>
      </thead>
      <tbody>
        ${sale.items.map(item => `
          <tr>
            <td style="max-width:140px; word-break:break-word;">${item.name}</td>
            <td style="text-align:center;">${item.qty}</td>
            <td style="text-align:right;">${item.unitPrice.toFixed(2)}</td>
            <td style="text-align:right;">${item.total.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="receipt-divider"></div>

    <table class="receipt-table">
      <tr><td>Subtotal:</td><td class="receipt-right">${sym}${sale.subtotal.toFixed(2)}</td></tr>
      ${sale.discount > 0 ? `<tr><td>${isEn ? 'Discount:' : 'Diskwento:'}</td><td class="receipt-right">-${sym}${sale.discount.toFixed(2)}</td></tr>` : ''}
      <tr class="receipt-total-bold">
        <td>${isEn ? 'TOTAL DUE:' : 'KABUUAN:'}</td>
        <td class="receipt-right">${sym}${sale.totalAmount.toFixed(2)}</td>
      </tr>
      ${paymentDetailsHtml}
    </table>

    <div class="receipt-divider"></div>

    <div class="receipt-barcode-sim">|||||| ||||| |||||||</div>
    <div style="text-align:center; font-size:10px; font-family:monospace;">* ${sale.receiptNumber} *</div>

    <div class="receipt-header-center" style="margin-top:0.75rem; font-size:10px;">
      <div>${(state.settings.receiptFooter || (isEn ? 'Thank you for shopping!\nPlease come again!' : 'Maraming Salamat po sa Pagtangkilik!\nBalik po kayo!')).replace(/\n/g, '<br>')}</div>
    </div>
  `;

  document.getElementById('thermalReceiptModal').classList.add('active');
}

function closeThermalReceiptModal() {
  document.getElementById('thermalReceiptModal').classList.remove('active');
}

function printReceiptNow() {
  window.print();
}

// ==================== INVENTORY MANAGEMENT ====================
let isLowStockFilterActive = false;

function toggleLowStockFilter() {
  isLowStockFilterActive = !isLowStockFilterActive;
  const btn = document.getElementById('toggleLowStockFilterBtn');
  btn.classList.toggle('btn-danger', isLowStockFilterActive);
  btn.classList.toggle('btn-secondary', !isLowStockFilterActive);
  renderInventoryTable();
}

function filterLowStockOnly() {
  isLowStockFilterActive = true;
  document.getElementById('toggleLowStockFilterBtn').classList.add('btn-danger');
  switchTab('inventory');
  renderInventoryTable();
}

function renderInventoryTable() {
  const search = document.getElementById('inventorySearch').value.toLowerCase().trim();
  const cat = document.getElementById('inventoryCategoryFilter').value;
  const sym = state.settings.currencySymbol || '₱';
  const isEn = state.currentLang === 'en';

  let list = state.products;

  if (cat !== 'All') {
    list = list.filter(p => p.category.toLowerCase() === cat.toLowerCase());
  }

  if (search) {
    list = list.filter(p => 
      p.name.toLowerCase().includes(search) || 
      (p.barcode && p.barcode.includes(search)) ||
      (p.category && p.category.toLowerCase().includes(search))
    );
  }

  if (isLowStockFilterActive) {
    list = list.filter(p => p.stock <= (p.minStock || 5));
  }

  const tbody = document.getElementById('inventoryTableBody');
  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center; padding:2rem; color:var(--gray-500);">
          ${isEn ? 'No products found.' : 'Walang nahanap na produkto.'}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(p => {
    const profit = p.sellingPrice - p.costPrice;
    const marginPct = p.sellingPrice > 0 ? ((profit / p.sellingPrice) * 100).toFixed(0) : 0;

    let badge = `<span class="badge badge-success">${isEn ? 'In Stock' : 'In Stock'}</span>`;
    if (p.stock <= 0) badge = `<span class="badge badge-danger">${isEn ? 'Out of Stock' : 'Ubos Na'}</span>`;
    else if (p.stock <= (p.minStock || 5)) badge = `<span class="badge badge-warning">${isEn ? 'Low Stock' : 'Paubos'} (${p.stock})</span>`;

    return `
      <tr>
        <td style="font-family:monospace; font-weight:700;">${p.barcode}</td>
        <td>
          <strong>${p.name}</strong>
          ${p.description ? `<div style="font-size:0.75rem; color:var(--gray-500);">${p.description}</div>` : ''}
        </td>
        <td><span class="badge badge-info">${p.category}</span></td>
        <td>${p.unit || 'pc'}</td>
        <td>${sym}${p.costPrice.toFixed(2)}</td>
        <td><strong>${sym}${p.sellingPrice.toFixed(2)}</strong></td>
        <td style="color:#047857;"><strong>+${sym}${profit.toFixed(2)}</strong> (${marginPct}%)</td>
        <td><strong>${p.stock}</strong></td>
        <td>${badge}</td>
        <td>
          <div style="display:flex; gap:0.25rem;">
            <button class="btn btn-secondary btn-sm" onclick="openRestockModal('${p.id}')" title="${isEn ? 'Add Stock' : 'Magdagdag ng Stock'}">
              ➕ Restock
            </button>
            <button class="btn btn-secondary btn-sm" onclick="openEditProductModal('${p.id}')" title="${isEn ? 'Edit' : 'I-edit'}">
              ✏️
            </button>
            <button class="btn btn-secondary btn-sm" style="color:var(--danger);" onclick="deleteProduct('${p.id}')" title="${isEn ? 'Delete' : 'Burahin'}">
              🗑️
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddProductModal() {
  document.getElementById('productModalTitle').textContent = '➕ Magdagdag ng Paninda';
  document.getElementById('prodEditId').value = '';
  document.getElementById('prodName').value = '';
  document.getElementById('prodBarcode').value = '';
  document.getElementById('prodCategory').value = '';
  document.getElementById('prodUnit').value = 'piece';
  document.getElementById('prodCost').value = '';
  document.getElementById('prodPrice').value = '';
  document.getElementById('prodStock').value = '12';
  document.getElementById('prodMinStock').value = '5';
  document.getElementById('prodDesc').value = '';
  calculateMarginPreview();
  document.getElementById('productModal').classList.add('active');
}

function openEditProductModal(id) {
  const prod = state.products.find(p => p.id === id);
  if (!prod) return;

  document.getElementById('productModalTitle').textContent = '✏️ I-edit ang Paninda';
  document.getElementById('prodEditId').value = prod.id;
  document.getElementById('prodName').value = prod.name;
  document.getElementById('prodBarcode').value = prod.barcode;
  document.getElementById('prodCategory').value = prod.category;
  document.getElementById('prodUnit').value = prod.unit || 'piece';
  document.getElementById('prodCost').value = prod.costPrice;
  document.getElementById('prodPrice').value = prod.sellingPrice;
  document.getElementById('prodStock').value = prod.stock;
  document.getElementById('prodMinStock').value = prod.minStock || 5;
  document.getElementById('prodDesc').value = prod.description || '';
  calculateMarginPreview();
  document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('active');
}

function calculateMarginPreview() {
  const cost = Number(document.getElementById('prodCost').value) || 0;
  const price = Number(document.getElementById('prodPrice').value) || 0;
  const profit = price - cost;
  const marginPct = price > 0 ? ((profit / price) * 100).toFixed(1) : 0;
  const sym = state.settings.currencySymbol || '₱';

  const display = document.getElementById('marginPreviewDisplay');
  display.textContent = `${sym}${profit.toFixed(2)} (${marginPct}%)`;
  if (profit < 0) {
    display.style.color = 'var(--danger)';
    display.style.background = 'var(--danger-light)';
  } else {
    display.style.color = 'var(--primary-dark)';
    display.style.background = 'var(--primary-light)';
  }
}

async function saveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('prodEditId').value;
  const payload = {
    name: document.getElementById('prodName').value,
    barcode: document.getElementById('prodBarcode').value,
    category: document.getElementById('prodCategory').value,
    unit: document.getElementById('prodUnit').value,
    costPrice: Number(document.getElementById('prodCost').value),
    sellingPrice: Number(document.getElementById('prodPrice').value),
    stock: Number(document.getElementById('prodStock').value),
    minStock: Number(document.getElementById('prodMinStock').value),
    description: document.getElementById('prodDesc').value
  };

  try {
    const url = id ? `/api/products/${id}` : '/api/products';
    const method = id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to save product.');
    }

    closeProductModal();
    showToast(id ? 'Na-update ang paninda!' : 'Matagumpay na naidagdag ang bagong paninda!');
    await fetchProducts();
    await fetchAnalytics();
    renderPosCategories();
    renderPosProducts();
    renderInventoryTable();
    updateNavMetrics();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function deleteProduct(id) {
  const prod = state.products.find(p => p.id === id);
  if (!prod) return;
  if (!confirm(`Sigurado ka bang nais mong burahin ang "${prod.name}" sa tindahan?`)) return;

  try {
    const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete product.');
    showToast(`Nabura ang ${prod.name}`);
    await fetchProducts();
    await fetchAnalytics();
    renderPosProducts();
    renderInventoryTable();
    updateNavMetrics();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// Quick Restock Modal
function openRestockModal(id) {
  const prod = state.products.find(p => p.id === id);
  if (!prod) return;

  document.getElementById('restockProdId').value = prod.id;
  document.getElementById('restockProdName').textContent = prod.name;
  document.getElementById('restockProdStockInfo').textContent = `Kasalukuyang Stock: ${prod.stock} ${prod.unit || 'pcs'} | Puhunan: ₱${prod.costPrice.toFixed(2)}`;
  document.getElementById('restockQty').value = 12;
  calculateRestockCostPreview();
  document.getElementById('restockModal').classList.add('active');
}

function closeRestockModal() {
  document.getElementById('restockModal').classList.remove('active');
}

function addRestockQty(delta) {
  const input = document.getElementById('restockQty');
  input.value = Number(input.value) + delta;
  calculateRestockCostPreview();
}

function calculateRestockCostPreview() {
  const id = document.getElementById('restockProdId').value;
  const prod = state.products.find(p => p.id === id);
  if (!prod) return;
  const qty = Number(document.getElementById('restockQty').value) || 0;
  const totalCost = qty * prod.costPrice;
  document.getElementById('restockCapitalPreview').textContent = `₱${totalCost.toFixed(2)}`;
}

async function saveRestock(e) {
  e.preventDefault();
  const id = document.getElementById('restockProdId').value;
  const qtyChange = Number(document.getElementById('restockQty').value);
  const reason = document.getElementById('restockReason').value;

  try {
    const res = await fetch(`/api/products/${id}/adjust-stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qtyChange, reason })
    });

    if (!res.ok) throw new Error('Failed to restock product.');
    closeRestockModal();
    showToast(`Matagumpay na naidagdag ang +${qtyChange} stock!`);
    await fetchProducts();
    await fetchAnalytics();
    await fetchAiInsights();
    renderPosProducts();
    renderInventoryTable();
    renderAiView();
    updateNavMetrics();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

function exportInventoryCSV() {
  if (state.products.length === 0) return;
  let csv = 'Barcode,Name,Category,Unit,CostPrice,SellingPrice,Stock,MinStock,Description\n';
  state.products.forEach(p => {
    csv += `"${p.barcode}","${p.name}","${p.category}","${p.unit}",${p.costPrice},${p.sellingPrice},${p.stock},${p.minStock},"${p.description || ''}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Vibe-Tindahan-Inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

// ==================== UTANG NOTEBOOK (KUWADERNO) ====================
function renderUtangList() {
  const search = document.getElementById('utangCustomerSearch').value.toLowerCase().trim();
  const status = document.getElementById('utangStatusFilter').value;
  const sym = state.settings.currencySymbol || '₱';
  const isEn = state.currentLang === 'en';

  let list = state.customers;

  if (status !== 'All') {
    list = list.filter(c => c.status.toLowerCase() === status.toLowerCase());
  }

  if (search) {
    list = list.filter(c => 
      c.name.toLowerCase().includes(search) || 
      (c.phone && c.phone.includes(search)) ||
      (c.address && c.address.toLowerCase().includes(search))
    );
  }

  // Update KPI Cards
  const totalUtang = state.customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);
  const debtorsCount = state.customers.filter(c => c.currentBalance > 0).length;
  const dueDebtors = state.customers.filter(c => c.currentBalance >= c.creditLimit * 0.85).length;

  document.getElementById('kpiTotalUtang').textContent = `${sym}${totalUtang.toFixed(2)}`;
  document.getElementById('kpiDebtorCount').textContent = debtorsCount;
  document.getElementById('kpiDueDebtorsCount').textContent = dueDebtors;

  const tbody = document.getElementById('utangTableBody');
  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding:2rem; color:var(--gray-500);">
          ${isEn ? 'No registered customers found.' : 'Walang nahanap na suki.'}
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(c => {
    let badge = `<span class="badge badge-success">${isEn ? 'Good Payer' : 'Mabait Magbayad'}</span>`;
    if (c.status === 'Warning' || c.currentBalance >= c.creditLimit) {
      badge = `<span class="badge badge-danger">${isEn ? 'Warning / Limit' : 'Warning / Limit'}</span>`;
    } else if (c.status === 'Due Soon' || c.currentBalance >= c.creditLimit * 0.75) {
      badge = `<span class="badge badge-warning">${isEn ? 'Due Soon' : 'Due Soon'}</span>`;
    }

    const payBtnText = isEn ? '💵 Payment' : '💵 Hulog / Bayad';
    const ledgerBtnText = isEn ? '📖 Ledger' : '📖 Kuwaderno';

    return `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>
          <div>${c.phone || (isEn ? 'No Phone' : 'Walang CP')}</div>
          <small style="color:var(--gray-500);">${c.address || (isEn ? 'No address' : 'Walang address')}</small>
        </td>
        <td>${sym}${c.creditLimit.toFixed(2)}</td>
        <td style="font-size:1.05rem;">
          <strong style="color:${c.currentBalance > 0 ? '#b91c1c' : '#15803d'};">
            ${sym}${c.currentBalance.toFixed(2)}
          </strong>
        </td>
        <td>${badge}</td>
        <td><small style="color:var(--gray-600);">${c.notes || '—'}</small></td>
        <td>
          <div style="display:flex; gap:0.25rem; flex-wrap:wrap;">
            <button class="btn btn-accent btn-sm" onclick="openUtangPayModal('${c.id}')">
              ${payBtnText}
            </button>
            <button class="btn btn-secondary btn-sm" onclick="openCustomerLedgerModal('${c.id}')" title="${isEn ? 'View customer credit ledger' : 'Tingnan ang talaan'}">
              ${ledgerBtnText}
            </button>
            <button class="btn btn-secondary btn-sm" onclick="openSmsReminderModal('${c.id}')" title="${isEn ? 'Generate SMS reminder' : 'Gumawa ng SMS paalala'}">
              📱 SMS
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddCustomerModal() {
  document.getElementById('custName').value = '';
  document.getElementById('custPhone').value = '';
  document.getElementById('custAddress').value = '';
  document.getElementById('custCreditLimit').value = '1000';
  document.getElementById('custNotes').value = '';
  document.getElementById('customerModal').classList.add('active');
}

function closeCustomerModal() {
  document.getElementById('customerModal').classList.remove('active');
}

async function saveCustomer(e) {
  e.preventDefault();
  const payload = {
    name: document.getElementById('custName').value,
    phone: document.getElementById('custPhone').value,
    address: document.getElementById('custAddress').value,
    creditLimit: Number(document.getElementById('custCreditLimit').value),
    notes: document.getElementById('custNotes').value
  };

  try {
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to create customer.');
    closeCustomerModal();
    showToast('Nailista na ang bagong suki!');
    await fetchCustomers();
    renderUtangList();
    populateUtangCustomerDropdown();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// Utang Pay Modal
function openUtangPayModal(id) {
  const cust = state.customers.find(c => c.id === id);
  if (!cust) return;

  document.getElementById('payCustomerId').value = cust.id;
  document.getElementById('payCustomerName').textContent = cust.name;
  document.getElementById('payCurrentBalance').textContent = `₱${cust.currentBalance.toFixed(2)}`;
  document.getElementById('payAmountInput').value = cust.currentBalance > 0 ? cust.currentBalance : '';
  calculateRemainingBalancePreview();
  document.getElementById('utangPayModal').classList.add('active');
}

function closeUtangPayModal() {
  document.getElementById('utangPayModal').classList.remove('active');
}

function setFullPayment() {
  const custId = document.getElementById('payCustomerId').value;
  const cust = state.customers.find(c => c.id === custId);
  if (!cust) return;
  document.getElementById('payAmountInput').value = cust.currentBalance;
  calculateRemainingBalancePreview();
}

function setPartialPayment(amt) {
  document.getElementById('payAmountInput').value = amt;
  calculateRemainingBalancePreview();
}

function calculateRemainingBalancePreview() {
  const custId = document.getElementById('payCustomerId').value;
  const cust = state.customers.find(c => c.id === custId);
  if (!cust) return;

  const payAmt = Number(document.getElementById('payAmountInput').value) || 0;
  const remaining = Math.max(0, cust.currentBalance - payAmt);
  document.getElementById('payRemainingPreview').textContent = `₱${remaining.toFixed(2)}`;
}

async function saveUtangPayment(e) {
  e.preventDefault();
  const id = document.getElementById('payCustomerId').value;
  const amount = Number(document.getElementById('payAmountInput').value);
  const paymentMethod = document.getElementById('payMethodSelect').value;
  const notes = document.getElementById('payNotesInput').value;

  try {
    const res = await fetch(`/api/customers/${id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, paymentMethod, notes })
    });

    if (!res.ok) throw new Error('Failed to record payment.');
    playChime();
    closeUtangPayModal();
    showToast(`Natanggap ang bayad na ₱${amount.toFixed(2)}!`);

    await Promise.all([
      fetchCustomers(),
      fetchAnalytics(),
      fetchAiInsights()
    ]);
    renderUtangList();
    renderAnalyticsCharts();
    renderAiView();
    updateNavMetrics();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// Customer Ledger Modal
async function openCustomerLedgerModal(id) {
  try {
    const res = await fetch(`/api/customers/${id}/ledger`);
    const data = await res.json();
    const sym = state.settings.currencySymbol || '₱';

    document.getElementById('ledgerCustomerName').textContent = `Kuwaderno ni ${data.customer.name}`;
    document.getElementById('ledgerTotalCharged').textContent = `${sym}${data.totalUtangAccumulated.toFixed(2)}`;
    document.getElementById('ledgerTotalPaid').textContent = `${sym}${data.totalPaid.toFixed(2)}`;
    document.getElementById('ledgerCurrentBalance').textContent = `${sym}${data.customer.currentBalance.toFixed(2)}`;

    const tbody = document.getElementById('ledgerHistoryBody');
    if (data.transactions.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:var(--gray-500);">Walang naitalang transaksyon.</td></tr>`;
    } else {
      tbody.innerHTML = data.transactions.map(t => {
        const isCharge = t.type === 'CHARGE';
        const dateStr = new Date(t.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        return `
          <tr>
            <td>${dateStr}</td>
            <td>
              <span class="badge ${isCharge ? 'badge-danger' : 'badge-success'}">
                ${isCharge ? 'UTANG (+)' : 'HULOG (-)'}
              </span>
            </td>
            <td>
              <strong>${t.description}</strong>
              ${t.itemsSummary ? `<div style="font-size:0.75rem; color:var(--gray-600);">${t.itemsSummary}</div>` : ''}
            </td>
            <td><strong>${isCharge ? '+' : '-'}${sym}${t.amount.toFixed(2)}</strong></td>
            <td>${sym}${t.balanceAfter.toFixed(2)}</td>
          </tr>
        `;
      }).join('');
    }

    document.getElementById('customerLedgerModal').classList.add('active');
  } catch (err) {
    showToast('Failed to load ledger history.', 'danger');
  }
}

function closeCustomerLedgerModal() {
  document.getElementById('customerLedgerModal').classList.remove('active');
}

// SMS Reminder Notice Generator
function openSmsReminderModal(id) {
  const cust = state.customers.find(c => c.id === id);
  if (!cust) return;

  const storeName = state.settings.name || 'Vibe Tindahan';
  const phone = cust.phone ? cust.phone.replace(/[^0-9]/g, '') : '';
  const sym = state.settings.currencySymbol || '₱';

  const template = `Magandang araw po ${cust.name}! Paalala lang po mula sa ${storeName} ukol sa inyong balanse sa tindahan na nagkakahalaga ng ${sym}${cust.currentBalance.toFixed(2)}. Maaari po kayong maghulog o magbayad sa tindahan anumang oras. Maraming salamat po sa inyong suporta at pagtangkilik!`;

  document.getElementById('smsMessageTemplate').value = template;
  document.getElementById('smsDirectLink').href = phone ? `sms:${phone}?body=${encodeURIComponent(template)}` : '#';
  document.getElementById('smsReminderModal').classList.add('active');
}

function closeSmsReminderModal() {
  document.getElementById('smsReminderModal').classList.remove('active');
}

function copySmsText() {
  const text = document.getElementById('smsMessageTemplate').value;
  navigator.clipboard.writeText(text);
  showToast('Nakopya na ang mensahe sa clipboard!');
}

// ==================== DAILY SALES & PROFIT ANALYTICS ====================
function renderAnalyticsCharts() {
  const a = state.analytics;
  const sym = state.settings.currencySymbol || '₱';

  document.getElementById('analyticsGrossSales').textContent = `${sym}${(a.grossSales || 0).toFixed(2)}`;
  document.getElementById('analyticsCostSales').textContent = `${sym}${(a.totalCost || 0).toFixed(2)}`;
  document.getElementById('analyticsExpenses').textContent = `${sym}${(a.totalExpenses || 0).toFixed(2)}`;
  document.getElementById('analyticsNetProfit').textContent = `${sym}${(a.netProfit || 0).toFixed(2)}`;
  document.getElementById('analyticsTxCount').textContent = a.transactionCount || 0;
  document.getElementById('analyticsMarginPct').textContent = `${(a.profitMarginPct || 0).toFixed(1)}%`;

  // Render Charts using Chart.js if loaded
  if (window.Chart) {
    renderSalesTrendChart();
    renderPaymentMethodsChart();
  }
}

function renderSalesTrendChart() {
  const ctx = document.getElementById('salesTrendChart');
  if (!ctx) return;

  if (state.charts.salesTrend) {
    state.charts.salesTrend.destroy();
  }

  const isEn = state.currentLang === 'en';
  // Generate 7-day trend labels
  const days = isEn
    ? ['Nov 1', 'Nov 2', 'Nov 3', 'Nov 4', 'Nov 5', 'Nov 6 (Today)']
    : ['Nov 1', 'Nov 2', 'Nov 3', 'Nov 4', 'Nov 5', 'Nov 6 (Ngayon)'];
  const salesData = [1200, 1550, 1420, 1680, 1850, Math.max(state.analytics.grossSales || 0, 750)];
  const profitData = [320, 410, 380, 450, 520, Math.max(state.analytics.netProfit || 0, 220)];

  state.charts.salesTrend = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: days,
      datasets: [
        {
          label: isEn ? 'Gross Sales (₱)' : 'Kabuuang Benta (Gross ₱)',
          data: salesData,
          backgroundColor: 'rgba(2, 132, 199, 0.75)',
          borderRadius: 6
        },
        {
          label: isEn ? 'True Net Profit (₱)' : 'Tunay na Tubo (Net Kita ₱)',
          data: profitData,
          backgroundColor: 'rgba(16, 185, 129, 0.85)',
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' }
      },
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

function renderPaymentMethodsChart() {
  const ctx = document.getElementById('paymentMethodsChart');
  if (!ctx) return;

  if (state.charts.paymentMethods) {
    state.charts.paymentMethods.destroy();
  }

  const pm = state.analytics.paymentMethods || { Cash: 70, GCash: 20, Utang: 10 };
  const labels = Object.keys(pm);
  const values = Object.values(pm);

  state.charts.paymentMethods = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [
        {
          data: values.every(v => v === 0) ? [70, 20, 10] : values,
          backgroundColor: ['#10b981', '#0284c7', '#f59e0b', '#8b5cf6']
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// Expenses
function renderExpensesList() {
  const container = document.getElementById('expenseListContainer');
  const sym = state.settings.currencySymbol || '₱';
  const isEn = state.currentLang === 'en';

  if (state.expenses.length === 0) {
    container.innerHTML = `<p style="font-size:0.85rem; color:var(--gray-500); padding:1rem 0;">${isEn ? 'No recorded operating expenses.' : 'Walang naitalang gastusin.'}</p>`;
    return;
  }

  container.innerHTML = state.expenses.map(e => `
    <div style="display:flex; justify-content:space-between; align-items:center; background:var(--gray-100); padding:0.5rem 0.75rem; border-radius:var(--radius-md);">
      <div>
        <strong style="font-size:0.85rem;">${e.description}</strong>
        <div style="font-size:0.75rem; color:var(--gray-500);">${e.category} • ${e.paymentMethod}</div>
      </div>
      <div style="display:flex; align-items:center; gap:0.5rem;">
        <span style="font-weight:700; color:var(--danger); font-size:0.9rem;">-${sym}${e.amount.toFixed(2)}</span>
        <button onclick="deleteExpense('${e.id}')" style="background:none; border:none; color:var(--gray-400); cursor:pointer; font-size:0.85rem;" title="${isEn ? 'Delete' : 'Burahin'}">✕</button>
      </div>
    </div>
  `).join('');
}

function openExpenseModal() {
  document.getElementById('expDescription').value = '';
  document.getElementById('expAmount').value = '';
  document.getElementById('expenseModal').classList.add('active');
}

function closeExpenseModal() {
  document.getElementById('expenseModal').classList.remove('active');
}

async function saveExpense(e) {
  e.preventDefault();
  const payload = {
    category: document.getElementById('expCategory').value,
    description: document.getElementById('expDescription').value,
    amount: Number(document.getElementById('expAmount').value),
    paymentMethod: document.getElementById('expPaymentMethod').value
  };

  try {
    const res = await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to record expense.');
    closeExpenseModal();
    showToast(state.currentLang === 'en' ? 'Operating expense successfully recorded.' : 'Naitala ang gastusin sa tindahan.');
    await fetchExpenses();
    await fetchAnalytics();
    renderAnalyticsCharts();
    updateNavMetrics();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function deleteExpense(id) {
  const isEn = state.currentLang === 'en';
  if (!confirm(isEn ? 'Delete this expense entry?' : 'Burahin ang talaan ng gastusing ito?')) return;
  try {
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
    showToast(isEn ? 'Expense deleted.' : 'Nabura ang gastos.');
    await fetchExpenses();
    await fetchAnalytics();
    renderAnalyticsCharts();
    updateNavMetrics();
  } catch (err) {
    showToast('Failed to delete expense.', 'danger');
  }
}

function renderSalesLedger() {
  const tbody = document.getElementById('salesLedgerBody');
  const sym = state.settings.currencySymbol || '₱';
  const isEn = state.currentLang === 'en';

  if (state.sales.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:1rem; color:var(--gray-500);">${isEn ? 'No receipts recorded yet.' : 'Wala pang resibo.'}</td></tr>`;
    return;
  }

  tbody.innerHTML = state.sales.map(s => {
    const timeStr = new Date(s.timestamp).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
    const itemsSummary = s.items.map(i => `${i.qty}x ${i.name}`).join(', ');
    const receiptBtnText = isEn ? '🧾 Receipt' : '🧾 Resibo';

    return `
      <tr>
        <td>${timeStr}</td>
        <td><strong style="font-family:monospace;">${s.receiptNumber}</strong></td>
        <td style="max-width:200px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${itemsSummary}">${itemsSummary}</td>
        <td><span class="badge ${s.paymentMethod === 'Utang' ? 'badge-danger' : s.paymentMethod === 'GCash' ? 'badge-info' : 'badge-success'}">${s.paymentMethod}</span></td>
        <td><strong>${sym}${s.totalAmount.toFixed(2)}</strong></td>
        <td style="color:#047857;">+${sym}${s.grossProfit.toFixed(2)}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="showThermalReceiptById('${s.id}')">
            ${receiptBtnText}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function showThermalReceiptById(id) {
  const sale = state.sales.find(s => s.id === id);
  if (sale) showThermalReceipt(sale);
}

// ==================== UTAK-TINDAHAN AI ====================
function renderAiView() {
  const b = state.aiBriefing;
  const sym = state.settings.currencySymbol || '₱';
  const isEn = state.currentLang === 'en';

  document.getElementById('aiHealthScore').textContent = b.healthScore || 85;
  document.getElementById('aiStatusGreeting').textContent = b.statusGreeting || (isEn ? 'Your store operations are running healthy and steady!' : 'Maganda ang takbo ng tindahan!');
  document.getElementById('aiCriticalCount').textContent = b.criticalCount || 0;
  document.getElementById('aiDeadStockCount').textContent = b.deadStockCount || 0;
  document.getElementById('aiCapitalNeeded').textContent = `${sym}${(b.totalCapitalNeededForRestock || 0).toFixed(2)}`;

  // Highlights
  const hList = document.getElementById('aiHighlightsList');
  if (b.highlights && b.highlights.length > 0) {
    hList.innerHTML = b.highlights.map(h => `<li>${h}</li>`).join('');
  } else {
    hList.innerHTML = `<li>${isEn ? 'All store metrics are within optimal ranges.' : 'Lahat ng paninda ay sumusunod sa maayos na takbo ng tindahan.'}</li>`;
  }

  // Action Items
  const aList = document.getElementById('aiActionItemsList');
  if (b.actionItems && b.actionItems.length > 0) {
    aList.innerHTML = b.actionItems.map(a => `<li>${a}</li>`).join('');
  } else {
    aList.innerHTML = `<li>${isEn ? 'No immediate actions needed. Operations secure!' : 'Walang kailangang agarang aksyon. Ligtas ang tindahan!'}</li>`;
  }

  // Restock Predictions
  const rList = document.getElementById('aiRestockList');
  if (state.aiRestock.length === 0) {
    rList.innerHTML = `<p style="font-size:0.85rem; color:var(--gray-500); padding:1rem;">${isEn ? 'All inventory levels are safe! No critically low stock.' : 'Ligtas ang lahat ng stock! Walang critically low stock.'}</p>`;
  } else {
    rList.innerHTML = state.aiRestock.map(r => {
      const msg = isEn ? (r.messageEn || r.message) : r.message;
      const stockInfo = isEn 
        ? `Current stock: ${r.currentStock} | Required capital: ${sym}${r.estimatedCost.toFixed(2)}`
        : `Kasalukuyang stock: ${r.currentStock} | Kailangang puhunan: ${sym}${r.estimatedCost.toFixed(2)}`;
      return `
        <div class="ai-recommendation-card ${r.urgency === 'OUT_OF_STOCK' || r.urgency === 'CRITICAL' ? 'danger' : 'warning'}">
          <div>
            <strong style="font-size:0.9rem;">${r.name}</strong>
            <div style="font-size:0.8rem; color:var(--gray-700); margin:0.2rem 0;">
              ${msg}
            </div>
            <small style="color:var(--gray-500);">${stockInfo}</small>
          </div>
          <button class="btn btn-primary btn-sm" onclick="openRestockModal('${r.productId}')">
            ➕ Restock
          </button>
        </div>
      `;
    }).join('');
  }

  // Combos
  const cList = document.getElementById('aiCombosList');
  if (state.aiCombos.length === 0) {
    cList.innerHTML = `<p style="font-size:0.85rem; color:var(--gray-500); padding:1rem;">${isEn ? 'Record more sales receipts to analyze combo purchasing patterns.' : 'Magtala pa ng mga resibo upang ma-analisa ang pinakamadalas bilhin nang sabay.'}</p>`;
  } else {
    cList.innerHTML = state.aiCombos.map(c => {
      const title = isEn ? (c.comboTitleEn || c.comboTitle) : c.comboTitle;
      const pitch = isEn ? (c.pitchEn || c.pitch) : c.pitch;
      return `
        <div class="ai-recommendation-card">
          <div>
            <strong style="font-size:0.9rem;">🍱 ${title}</strong>
            <div style="font-size:0.8rem; color:var(--gray-700); margin:0.2rem 0;">
              ${pitch}
            </div>
            <div style="font-size:0.75rem; color:#047857; font-weight:700;">
              ${isEn ? 'Regular Price:' : 'Normal Price:'} ${sym}${c.combinedRetail.toFixed(2)} ➔ ${isEn ? 'Bundle Offer:' : 'I-alok ng:'} ${sym}${c.suggestedBundlePrice.toFixed(2)}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

function askAiPrompt(question) {
  document.getElementById('aiQuestionInput').value = question;
  submitAiQuestion();
}

async function submitAiQuestion() {
  const input = document.getElementById('aiQuestionInput');
  const question = input.value.trim();
  if (!question) return;

  const isEn = state.currentLang === 'en';
  const box = document.getElementById('aiResponseBox');
  box.style.display = 'block';
  box.textContent = isEn ? '🤔 Store AI is analyzing...' : '🤔 Nag-iisip si Utak-Tindahan AI...';

  try {
    const res = await fetch('/api/ai/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, lang: state.currentLang })
    });
    const data = await res.json();
    box.textContent = data.answer;
  } catch (err) {
    box.textContent = isEn ? 'Sorry, an error occurred during analysis.' : 'Paumanhin, nagkaroon ng error sa pagsusuri.';
  }
}

// ==================== CAMERA BARCODE SCANNER ====================
let html5QrScanner = null;

function openCameraScannerModal() {
  document.getElementById('cameraScannerModal').classList.add('active');
  startCameraScanner();
}

function closeCameraScannerModal() {
  stopCameraScanner();
  document.getElementById('cameraScannerModal').classList.remove('active');
}

function startCameraScanner() {
  if (typeof Html5Qrcode === 'undefined') {
    document.getElementById('cameraReader').innerHTML = '<p style="color:#fff; padding:2rem;">Camera scanning library loading...</p>';
    return;
  }

  html5QrScanner = new Html5Qrcode('cameraReader');
  const config = { fps: 10, qrbox: { width: 250, height: 180 } };

  html5QrScanner.start(
    { facingMode: 'environment' },
    config,
    (decodedText) => {
      closeCameraScannerModal();
      handleScannedBarcode(decodedText);
    },
    (errorMessage) => {
      // Ignore frame errors
    }
  ).catch(err => {
    document.getElementById('cameraReader').innerHTML = `
      <div style="color:#fff; padding:2rem;">
        <p>Hindi mabuksan ang camera (${err.message || 'Permission denied'}).</p>
        <small>Gamitin ang USB barcode scanner o mabilisang barcode demo buttons.</small>
      </div>
    `;
  });
}

function stopCameraScanner() {
  if (html5QrScanner) {
    html5QrScanner.stop().catch(() => {}).then(() => {
      html5QrScanner.clear();
      html5QrScanner = null;
    });
  }
}

function switchCamera() {
  stopCameraScanner();
  setTimeout(startCameraScanner, 300);
}

// ==================== STORE SETTINGS & BACKUP ====================
async function saveStoreSettings(e) {
  if (e) e.preventDefault();
  const isEn = state.currentLang === 'en';
  const payload = {
    name: document.getElementById('settingStoreName').value.trim() || 'Vibe Tindahan',
    logo: document.getElementById('settingStoreLogo')?.value || '🏪',
    tagline: document.getElementById('settingStoreTagline').value.trim(),
    owner: document.getElementById('settingStoreOwner').value.trim(),
    phone: document.getElementById('settingStorePhone').value.trim(),
    address: document.getElementById('settingStoreAddress').value.trim(),
    receiptFooter: document.getElementById('settingReceiptFooter').value.trim(),
    language: document.getElementById('settingStoreLang')?.value || state.currentLang
  };

  try {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to update settings.');
    state.settings = await res.json();
    applyStoreSettings(state.settings);
    playChime();

    if (window.confetti) {
      window.confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    }

    const liveBadge = document.getElementById('settingsLiveBadge');
    if (liveBadge) {
      liveBadge.textContent = isEn ? '✅ Active & Saved' : '✅ Aktibo at Nai-save';
      liveBadge.className = 'badge badge-success';
    }

    showToast(isEn ? `Successfully activated "${state.settings.name}"!` : `Matagumpay na na-activate ang "${state.settings.name}"!`, 'success');
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

function downloadBackup() {
  window.location.href = '/api/backup';
  showToast('Inihahanda ang pag-download ng database backup...');
}

async function restoreBackupFromFile(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (event) => {
    try {
      const data = JSON.parse(event.target.result);
      const res = await fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Invalid backup file.');
      showToast('Matagumpay na naibalik ang backup!');
      await initApp();
    } catch (err) {
      showToast('Hindi ma-restore: ' + err.message, 'danger');
    }
  };
  reader.readAsText(file);
}

async function confirmResetData() {
  if (!confirm('BABALA: Mabubura ang lahat ng kasalukuyang transaksyon at babalik sa bagong sample data ng Sari-Sari Store. Sigurado ka ba?')) return;
  try {
    const res = await fetch('/api/reset', { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset data.');
    showToast('Na-reset ang tindahan sa bagong sample data.');
    await initApp();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  if (type === 'danger') toast.style.background = '#991b1b';
  else if (type === 'warning') toast.style.background = '#b45309';
  else if (type === 'success') toast.style.background = '#065f46';

  toast.innerHTML = `<span>🔔</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// Keyboard shortcuts (F9 to checkout, Esc to close modals)
window.addEventListener('keydown', (e) => {
  if (e.key === 'F9') {
    e.preventDefault();
    processCheckout();
  } else if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    closeMobileCartDrawer();
    stopCameraScanner();
  }
});

// Start the app on load
document.addEventListener('DOMContentLoaded', initApp);

