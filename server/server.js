const express = require('express');
const cors = require('cors');
const path = require('path');
const storage = require('./storage');
const AIEngine = require('./ai-engine');

const app = express();
const aiEngine = new AIEngine(storage);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'Vibe Tindahan',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Settings
app.get('/api/settings', (req, res) => {
  res.json(storage.getSettings());
});

app.put('/api/settings', (req, res) => {
  try {
    const updated = storage.updateSettings(req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Products & Inventory
app.get('/api/products', (req, res) => {
  const { category, search, barcode, lowStockOnly } = req.query;
  const products = storage.getProducts({ category, search, barcode, lowStockOnly });
  res.json(products);
});

app.get('/api/products/barcode/:barcode', (req, res) => {
  const product = storage.getProductByBarcode(req.params.barcode);
  if (!product) {
    return res.status(404).json({ error: 'Product not found with this barcode.' });
  }
  res.json(product);
});

app.get('/api/products/:id', (req, res) => {
  const product = storage.getProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  res.json(product);
});

app.post('/api/products', (req, res) => {
  try {
    const created = storage.createProduct(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const updated = storage.updateProduct(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/products/:id/adjust-stock', (req, res) => {
  try {
    const { qtyChange, reason } = req.body;
    if (qtyChange === undefined || isNaN(Number(qtyChange))) {
      return res.status(400).json({ error: 'Valid qtyChange number is required.' });
    }
    const updated = storage.adjustProductStock(req.params.id, qtyChange, reason);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    const deleted = storage.deleteProduct(req.params.id);
    res.json({ message: 'Product deleted successfully.', product: deleted });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Sales & POS Checkout
app.get('/api/sales', (req, res) => {
  const { startDate, endDate, limit } = req.query;
  const sales = storage.getSales({ startDate, endDate, limit });
  res.json(sales);
});

app.get('/api/sales/:id', (req, res) => {
  const sale = storage.getSaleById(req.params.id);
  if (!sale) {
    return res.status(404).json({ error: 'Sale transaction not found.' });
  }
  res.json(sale);
});

app.post('/api/sales', (req, res) => {
  try {
    const newSale = storage.createSale(req.body);
    res.status(201).json(newSale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Expenses
app.get('/api/expenses', (req, res) => {
  const { startDate, endDate } = req.query;
  const expenses = storage.getExpenses({ startDate, endDate });
  res.json(expenses);
});

app.post('/api/expenses', (req, res) => {
  try {
    const expense = storage.createExpense(req.body);
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', (req, res) => {
  try {
    const deleted = storage.deleteExpense(req.params.id);
    res.json({ message: 'Expense deleted.', expense: deleted });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Customers & Utang (Debt) Tracking
app.get('/api/customers', (req, res) => {
  const { search, status } = req.query;
  const customers = storage.getCustomers({ search, status });
  res.json(customers);
});

app.get('/api/customers/:id', (req, res) => {
  const customer = storage.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found.' });
  }
  res.json(customer);
});

app.get('/api/customers/:id/ledger', (req, res) => {
  try {
    const ledger = storage.getCustomerLedger(req.params.id);
    res.json(ledger);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.post('/api/customers', (req, res) => {
  try {
    const customer = storage.createCustomer(req.body);
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/customers/:id', (req, res) => {
  try {
    const updated = storage.updateCustomer(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/customers/:id/pay', (req, res) => {
  try {
    const result = storage.recordCustomerPayment(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Analytics & Dashboard Summary
app.get('/api/analytics/daily', (req, res) => {
  const { date } = req.query;
  const summary = storage.getAnalyticsSummary(date);
  res.json(summary);
});

// AI Insights Endpoints
app.get('/api/ai/restock', (req, res) => {
  const predictions = aiEngine.getRestockPredictions();
  res.json(predictions);
});

app.get('/api/ai/dead-stock', (req, res) => {
  const deadStock = aiEngine.getDeadStockAnalysis();
  res.json(deadStock);
});

app.get('/api/ai/combos', (req, res) => {
  const combos = aiEngine.getBasketCombos();
  res.json(combos);
});

app.get('/api/ai/briefing', (req, res) => {
  const briefing = aiEngine.getDailyExecutiveBriefing();
  res.json(briefing);
});

app.post('/api/ai/ask', (req, res) => {
  const { question } = req.body;
  const answer = aiEngine.askAI(question);
  res.json(answer);
});

// Backup & Reset
app.get('/api/backup', (req, res) => {
  const data = storage.getRawBackup();
  res.setHeader('Content-Disposition', 'attachment; filename="vibe-tindahan-backup.json"');
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(data, null, 2));
});

app.post('/api/restore', (req, res) => {
  try {
    storage.restoreFromBackup(req.body);
    res.json({ message: 'Store database successfully restored from backup.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/reset', (req, res) => {
  try {
    storage.resetToSeedData();
    res.json({ message: 'Database reset to fresh sample sari-sari store data.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback to index.html for SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🛍️  Vibe Tindahan – Smart Business Management System`);
    console.log(`🚀  Server running at http://localhost:${PORT}`);
    console.log(`📦  Ready for POS, Inventory, Utang & AI Insights`);
    console.log(`====================================================`);
  });
}

module.exports = app;
