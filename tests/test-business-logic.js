const assert = require('assert');
const storage = require('../server/storage');
const AIEngine = require('../server/ai-engine');

console.log('🧪 Starting Vibe Tindahan Automated Test Suite...');

// Reset to clean seed data before testing
storage.resetToSeedData();
const aiEngine = new AIEngine(storage);

// TEST 1: Seed data and products loading
console.log('Running Test 1: Products & Inventory verification...');
const allProducts = storage.getProducts();
assert(allProducts.length >= 25, `Expected at least 25 seed products, found ${allProducts.length}`);
const pancit = storage.getProductByBarcode('4807770270016');
assert(pancit, 'Expected to find Lucky Me Pancit Canton by barcode');
assert.strictEqual(pancit.sellingPrice, 17.00, 'Pancit Canton selling price should be 17.00');
assert.strictEqual(pancit.costPrice, 13.50, 'Pancit Canton cost price should be 13.50');

// TEST 2: Low-stock alert detection
console.log('Running Test 2: Low-stock detection...');
const lowStockItems = storage.getProducts({ lowStockOnly: true });
assert(lowStockItems.length > 0, 'Should detect initial low stock items');
const foundCritical = lowStockItems.some(p => p.stock <= p.minStock);
assert(foundCritical, 'Low stock items must have stock <= minStock');

// TEST 3: POS Checkout & Real-time stock decrement
console.log('Running Test 3: Checkout transaction & inventory decrement...');
const egg = storage.getProductById('prod-020');
const initialEggStock = egg.stock;

const checkoutSale = storage.createSale({
  items: [
    { productId: 'prod-020', qty: 5, unitPrice: 9.00 }
  ],
  discount: 5.00,
  paymentMethod: 'Cash',
  cashTendered: 100.00,
  cashier: 'Ate Baby'
});

assert(checkoutSale.id, 'Sale must have an ID');
assert(checkoutSale.receiptNumber.startsWith('VT-'), 'Receipt number must start with VT-');
assert.strictEqual(checkoutSale.subtotal, 45.00, 'Subtotal should be 5 * 9 = 45');
assert.strictEqual(checkoutSale.discount, 5.00, 'Discount should be 5.00');
assert.strictEqual(checkoutSale.totalAmount, 40.00, 'Total should be 45 - 5 = 40');
assert.strictEqual(checkoutSale.change, 60.00, 'Change should be 100 - 40 = 60');

// Check stock decrement
const updatedEgg = storage.getProductById('prod-020');
assert.strictEqual(updatedEgg.stock, initialEggStock - 5, `Egg stock should be decremented by 5 (was ${initialEggStock}, now ${updatedEgg.stock})`);

// TEST 4: Utang (Debt) Tracking and Partial Payments
console.log('Running Test 4: Utang tracking, ledger, and partial payments...');
const customer = storage.getCustomerById('cust-001');
const initialBalance = customer.currentBalance;

// Customer buys via Utang
const utangSale = storage.createSale({
  items: [
    { productId: 'prod-008', qty: 2, unitPrice: 16.00 } // Great Taste White = 32.00
  ],
  discount: 0,
  paymentMethod: 'Utang',
  customerId: 'cust-001',
  cashier: 'Kuya Jun'
});

const updatedCustomer = storage.getCustomerById('cust-001');
assert.strictEqual(updatedCustomer.currentBalance, initialBalance + 32.00, 'Customer balance should increase by 32.00');

// Customer makes a partial payment (hulog) of 20.00
const paymentRes = storage.recordCustomerPayment('cust-001', {
  amount: 20.00,
  paymentMethod: 'Cash',
  notes: 'Hulog mula sa kita sa tricycle'
});

assert.strictEqual(paymentRes.newBalance, initialBalance + 12.00, 'New balance after 20 payment should be previous balance + 12');
const ledger = storage.getCustomerLedger('cust-001');
assert(ledger.transactions.length > 0, 'Customer must have ledger transactions');
assert(ledger.totalUtangAccumulated > 0, 'Total utang accumulated should be recorded');

// TEST 5: Financial Analytics & Net Daily Profit (Tunay na Kita)
console.log('Running Test 5: Daily Net Profit (Tunay na Kita) calculation...');
// Add an operating expense
const expense = storage.createExpense({
  category: 'Utilities',
  description: 'Dagdag kuryente tindahan',
  amount: 25.00,
  paymentMethod: 'Cash'
});
assert(expense.id, 'Expense must be created');

const analytics = storage.getAnalyticsSummary();
assert(analytics.grossSales > 0, 'Gross sales should be positive');
assert(analytics.totalExpenses >= 25.00, 'Total expenses should include the new expense');
const expectedNetProfit = analytics.grossProfit - analytics.totalExpenses;
assert.strictEqual(Math.round(analytics.netProfit * 100), Math.round(expectedNetProfit * 100), 'Net profit must equal Gross Profit - Total Expenses');

// TEST 6: AI Engine Insights
console.log('Running Test 6: AI Engine Restock & Basket Analysis...');
const restockPredictions = aiEngine.getRestockPredictions();
assert(Array.isArray(restockPredictions), 'Restock predictions should be an array');
assert(restockPredictions.length > 0, 'Should find products needing restock');

const deadStock = aiEngine.getDeadStockAnalysis();
assert(Array.isArray(deadStock), 'Dead stock analysis should be an array');

const combos = aiEngine.getBasketCombos();
assert(Array.isArray(combos), 'Combos should be an array');

const briefing = aiEngine.getDailyExecutiveBriefing();
assert(briefing.healthScore >= 0 && briefing.healthScore <= 100, 'Health score must be between 0 and 100');
assert(briefing.highlights.length > 0, 'Briefing must have highlights');

const aiAnswer = aiEngine.askAI('Sino ang may pinakamalaking utang?');
assert(aiAnswer.answer && aiAnswer.answer.includes('pautang'), 'AI answer should mention pautang/utang');

// TEST 7: Database Backup & Restore
console.log('Running Test 7: Backup and Restore integrity...');
const backup = storage.getRawBackup();
assert(backup.products && backup.sales && backup.customers, 'Backup must contain all entities');
storage.restoreFromBackup(backup);
const restoredProducts = storage.getProducts();
assert.strictEqual(restoredProducts.length, backup.products.length, 'Restored product count must match backup');

// TEST 8: Bilingual Internationalization (Filipino & English)
console.log('Running Test 8: Bilingual Engine & Translations...');
const { translations, t } = require('../public/i18n.js');
assert(translations.fil && translations.en, 'Both Filipino and English translation maps must exist');
assert.strictEqual(t('tab_pos', 'fil'), '🛒 POS Cashier');
assert.strictEqual(t('tab_pos', 'en'), '🛒 POS Cashier');
assert.strictEqual(t('tab_inventory', 'fil'), '📦 Imbentaryo & Stock');
assert.strictEqual(t('tab_inventory', 'en'), '📦 Inventory & Stock');
assert.strictEqual(t('tab_utang', 'fil'), '📒 Kuwaderno ng Utang');
assert.strictEqual(t('tab_utang', 'en'), '📒 Customer Debt Ledger');
assert.strictEqual(t('checkout_btn', 'fil'), '✅ Bayad at Resibo (F9)');
assert.strictEqual(t('checkout_btn', 'en'), '✅ Complete & Print Receipt (F9)');

// Bilingual AI Verification
const briefingFil = aiEngine.getDailyExecutiveBriefing('fil');
const briefingEn = aiEngine.getDailyExecutiveBriefing('en');
assert(briefingFil.statusGreeting, 'Filipino AI briefing must have status greeting');
assert(briefingEn.statusGreeting, 'English AI briefing must have status greeting');
assert.notStrictEqual(briefingFil.statusGreeting, briefingEn.statusGreeting, 'Filipino and English status greetings should differ');

const aiDebtFil = aiEngine.askAI('utang', 'fil');
const aiDebtEn = aiEngine.askAI('debt', 'en');
assert(aiDebtFil.answer.includes('pautang') || aiDebtFil.answer.includes('utang'), 'Filipino AI answer should mention utang/pautang');
assert(aiDebtEn.answer.includes('outstanding') || aiDebtEn.answer.includes('debt'), 'English AI answer should mention debt/outstanding');

console.log('✅ ALL 8 TEST SUITES PASSED FLAWLESSLY!');
console.log('==================================================');

