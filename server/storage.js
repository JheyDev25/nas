const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const os = require('os');
const {
  defaultStoreSettings,
  defaultProducts,
  defaultCustomers,
  defaultUtangTransactions,
  defaultSales,
  defaultExpenses
} = require('./seed-data');

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const LOCAL_DATA_DIR = path.join(__dirname, '..', 'data');
const LOCAL_DB_FILE = path.join(LOCAL_DATA_DIR, 'db.json');

const DB_DIR = isServerless ? os.tmpdir() : LOCAL_DATA_DIR;
const DB_FILE = path.join(DB_DIR, 'db.json');
const DB_TEMP_FILE = path.join(DB_DIR, 'db.json.tmp');

class StorageManager {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      let sourceFile = DB_FILE;
      if (isServerless && !fs.existsSync(DB_FILE) && fs.existsSync(LOCAL_DB_FILE)) {
        sourceFile = LOCAL_DB_FILE;
      }

      if (fs.existsSync(sourceFile)) {
        const raw = fs.readFileSync(sourceFile, 'utf8');
        this.data = JSON.parse(raw);
        // Ensure all collections exist
        this.data.settings = this.data.settings || { ...defaultStoreSettings };
        this.data.products = this.data.products || [...defaultProducts];
        this.data.customers = this.data.customers || [...defaultCustomers];
        this.data.utangTransactions = this.data.utangTransactions || [...defaultUtangTransactions];
        this.data.sales = this.data.sales || [...defaultSales];
        this.data.expenses = this.data.expenses || [...defaultExpenses];
      } else {
        this.resetToSeedData();
      }
    } catch (err) {
      console.error('Error reading db.json, falling back to seed data:', err.message);
      this.resetToSeedData();
    }
  }

  save() {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const serialized = JSON.stringify(this.data, null, 2);
      fs.writeFileSync(DB_TEMP_FILE, serialized, 'utf8');
      fs.renameSync(DB_TEMP_FILE, DB_FILE);
    } catch (err) {
      console.warn('Storage save warning (filesystem might be read-only):', err.message);
      // In serverless environments, in-memory data remains updated for the invocation
    }
  }

  resetToSeedData() {
    this.data = {
      settings: JSON.parse(JSON.stringify(defaultStoreSettings)),
      products: JSON.parse(JSON.stringify(defaultProducts)),
      customers: JSON.parse(JSON.stringify(defaultCustomers)),
      utangTransactions: JSON.parse(JSON.stringify(defaultUtangTransactions)),
      sales: JSON.parse(JSON.stringify(defaultSales)),
      expenses: JSON.parse(JSON.stringify(defaultExpenses)),
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data;
  }

  getRawBackup() {
    return this.data;
  }

  restoreFromBackup(backupData) {
    if (!backupData || !backupData.products || !backupData.sales) {
      throw new Error('Invalid backup data format.');
    }
    this.data = {
      settings: backupData.settings || { ...defaultStoreSettings },
      products: backupData.products || [],
      customers: backupData.customers || [],
      utangTransactions: backupData.utangTransactions || [],
      sales: backupData.sales || [],
      expenses: backupData.expenses || [],
      updatedAt: new Date().toISOString()
    };
    this.save();
    return this.data;
  }

  // Settings
  getSettings() {
    return this.data.settings;
  }

  updateSettings(newSettings) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.save();
    return this.data.settings;
  }

  // Products & Inventory
  getProducts({ category, search, barcode, lowStockOnly } = {}) {
    let list = [...this.data.products];

    if (category && category !== 'All') {
      list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (barcode) {
      list = list.filter(p => p.barcode === barcode);
    }

    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    if (lowStockOnly === true || lowStockOnly === 'true') {
      list = list.filter(p => p.stock <= (p.minStock ?? this.data.settings.lowStockGlobalThreshold ?? 5));
    }

    return list;
  }

  getProductById(id) {
    return this.data.products.find(p => p.id === id);
  }

  getProductByBarcode(barcode) {
    if (!barcode) return null;
    return this.data.products.find(p => p.barcode === String(barcode).trim());
  }

  createProduct(prod) {
    if (!prod.name || prod.sellingPrice === undefined) {
      throw new Error('Product name and selling price are required.');
    }

    // Check duplicate barcode if barcode provided
    if (prod.barcode && prod.barcode.trim()) {
      const exists = this.data.products.some(p => p.barcode === prod.barcode.trim());
      if (exists) {
        throw new Error(`A product with barcode "${prod.barcode}" already exists.`);
      }
    }

    const newProduct = {
      id: prod.id || `prod-${uuidv4().slice(0, 8)}`,
      barcode: prod.barcode ? prod.barcode.trim() : `BAR-${Date.now().toString().slice(-8)}`,
      name: prod.name.trim(),
      category: prod.category || 'General Merchandise',
      unit: prod.unit || 'piece',
      costPrice: Number(prod.costPrice) || 0,
      sellingPrice: Number(prod.sellingPrice) || 0,
      stock: Number(prod.stock) || 0,
      minStock: Number(prod.minStock) || 5,
      description: prod.description || '',
      createdAt: new Date().toISOString()
    };

    this.data.products.unshift(newProduct);
    this.save();
    return newProduct;
  }

  updateProduct(id, updates) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) {
      throw new Error(`Product with ID "${id}" not found.`);
    }

    // Check duplicate barcode if barcode is changed
    if (updates.barcode && updates.barcode.trim()) {
      const dup = this.data.products.some(p => p.id !== id && p.barcode === updates.barcode.trim());
      if (dup) {
        throw new Error(`Another product already uses barcode "${updates.barcode}".`);
      }
    }

    const current = this.data.products[idx];
    this.data.products[idx] = {
      ...current,
      ...updates,
      costPrice: updates.costPrice !== undefined ? Number(updates.costPrice) : current.costPrice,
      sellingPrice: updates.sellingPrice !== undefined ? Number(updates.sellingPrice) : current.sellingPrice,
      stock: updates.stock !== undefined ? Number(updates.stock) : current.stock,
      minStock: updates.minStock !== undefined ? Number(updates.minStock) : current.minStock,
      updatedAt: new Date().toISOString()
    };

    this.save();
    return this.data.products[idx];
  }

  adjustProductStock(id, qtyChange, reason = 'Restock') {
    const product = this.getProductById(id);
    if (!product) {
      throw new Error(`Product with ID "${id}" not found.`);
    }

    const prevStock = product.stock;
    const newStock = Math.max(0, prevStock + Number(qtyChange));
    product.stock = newStock;
    product.lastStockAdjustment = {
      date: new Date().toISOString(),
      qtyChange: Number(qtyChange),
      prevStock,
      newStock,
      reason
    };

    this.save();
    return product;
  }

  deleteProduct(id) {
    const idx = this.data.products.findIndex(p => p.id === id);
    if (idx === -1) {
      throw new Error(`Product with ID "${id}" not found.`);
    }
    const removed = this.data.products.splice(idx, 1)[0];
    this.save();
    return removed;
  }

  // Sales & POS Checkout
  getSales({ startDate, endDate, limit = 100 } = {}) {
    let sales = [...this.data.sales];

    if (startDate) {
      const s = new Date(startDate).getTime();
      sales = sales.filter(item => new Date(item.timestamp).getTime() >= s);
    }

    if (endDate) {
      const e = new Date(endDate).getTime();
      sales = sales.filter(item => new Date(item.timestamp).getTime() <= e);
    }

    // Sort newest first
    sales.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (limit && Number(limit) > 0) {
      sales = sales.slice(0, Number(limit));
    }

    return sales;
  }

  getSaleById(id) {
    return this.data.sales.find(s => s.id === id);
  }

  createSale({
    items,
    discount = 0,
    paymentMethod = 'Cash',
    cashTendered = 0,
    customerId = null,
    cashier = 'Tindero',
    referenceNumber = null,
    note = ''
  }) {
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Cannot process empty cart sale.');
    }

    let subtotal = 0;
    let totalCost = 0;
    const processedItems = [];

    // Verify products and calculate costs/totals
    for (const item of items) {
      const prod = this.getProductById(item.productId);
      if (!prod) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      const qty = Math.max(1, Number(item.qty) || 1);
      const unitPrice = item.unitPrice !== undefined ? Number(item.unitPrice) : prod.sellingPrice;
      const costPrice = prod.costPrice || 0;
      const lineTotal = unitPrice * qty;
      const lineCost = costPrice * qty;

      subtotal += lineTotal;
      totalCost += lineCost;

      // Decrement product stock in real-time
      prod.stock = Math.max(0, prod.stock - qty);

      processedItems.push({
        productId: prod.id,
        name: prod.name,
        barcode: prod.barcode,
        unit: prod.unit,
        qty,
        unitPrice,
        costPrice,
        total: lineTotal,
        grossProfit: lineTotal - lineCost
      });
    }

    const discountAmount = Math.max(0, Number(discount) || 0);
    const totalAmount = Math.max(0, subtotal - discountAmount);
    const grossProfit = totalAmount - totalCost;

    // Generate readable receipt number: VT-YYYYMMDD-HHMMSS
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const receiptNumber = `VT-${dateStr}-${timeStr}`;

    const tender = Number(cashTendered) || totalAmount;
    const change = Math.max(0, tender - totalAmount);

    let customerObj = null;
    if (paymentMethod === 'Utang') {
      if (!customerId) {
        throw new Error('Customer is required when payment method is Utang (Credit).');
      }
      customerObj = this.getCustomerById(customerId);
      if (!customerObj) {
        throw new Error(`Customer with ID "${customerId}" not found.`);
      }

      const newBalance = customerObj.currentBalance + totalAmount;
      if (newBalance > customerObj.creditLimit) {
        // Warning: Exceeds credit limit
        console.warn(`Customer ${customerObj.name} exceeded credit limit (Limit: ₱${customerObj.creditLimit}, New Balance: ₱${newBalance})`);
      }

      customerObj.currentBalance = newBalance;
      if (customerObj.currentBalance > customerObj.creditLimit * 0.9) {
        customerObj.status = 'Warning';
      }

      // Add to Utang ledger
      const utangLog = {
        id: `utang-${uuidv4().slice(0, 8)}`,
        customerId: customerObj.id,
        type: 'CHARGE',
        amount: totalAmount,
        balanceAfter: newBalance,
        description: `Utang / Credit Purchase (${receiptNumber})`,
        itemsSummary: processedItems.map(i => `${i.qty}x ${i.name}`).join(', '),
        date: now.toISOString(),
        receiptNumber
      };
      this.data.utangTransactions.push(utangLog);
    }

    const newSale = {
      id: `sale-${uuidv4().slice(0, 8)}`,
      receiptNumber,
      timestamp: now.toISOString(),
      items: processedItems,
      subtotal,
      discount: discountAmount,
      totalAmount,
      totalCost,
      grossProfit,
      paymentMethod,
      cashTendered: tender,
      change,
      customerId,
      customerName: customerObj ? customerObj.name : null,
      cashier,
      referenceNumber,
      note
    };

    this.data.sales.unshift(newSale);
    this.save();
    return newSale;
  }

  // Expenses & Operating Costs
  getExpenses({ startDate, endDate } = {}) {
    let list = [...this.data.expenses];
    if (startDate) {
      const s = new Date(startDate).getTime();
      list = list.filter(e => new Date(e.date).getTime() >= s);
    }
    if (endDate) {
      const e = new Date(endDate).getTime();
      list = list.filter(e => new Date(e.date).getTime() <= e);
    }
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }

  createExpense({ category = 'General', description, amount, paymentMethod = 'Cash' }) {
    if (!description || amount === undefined || Number(amount) <= 0) {
      throw new Error('Description and a positive amount are required for an expense.');
    }

    const newExpense = {
      id: `exp-${uuidv4().slice(0, 8)}`,
      date: new Date().toISOString(),
      category: category.trim(),
      description: description.trim(),
      amount: Number(amount),
      paymentMethod
    };

    this.data.expenses.unshift(newExpense);
    this.save();
    return newExpense;
  }

  deleteExpense(id) {
    const idx = this.data.expenses.findIndex(e => e.id === id);
    if (idx === -1) {
      throw new Error(`Expense with ID "${id}" not found.`);
    }
    const removed = this.data.expenses.splice(idx, 1)[0];
    this.save();
    return removed;
  }

  // Customers & Utang (Debt) Management
  getCustomers({ search, status } = {}) {
    let list = [...this.data.customers];

    if (search) {
      const q = search.toLowerCase().trim();
      list = list.filter(c => 
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    }

    if (status && status !== 'All') {
      list = list.filter(c => c.status.toLowerCase() === status.toLowerCase());
    }

    // Sort by largest balance first by default
    list.sort((a, b) => b.currentBalance - a.currentBalance);
    return list;
  }

  getCustomerById(id) {
    return this.data.customers.find(c => c.id === id);
  }

  createCustomer({ name, phone = '', address = '', creditLimit = 1000, notes = '' }) {
    if (!name || !name.trim()) {
      throw new Error('Customer name is required.');
    }

    const newCust = {
      id: `cust-${uuidv4().slice(0, 8)}`,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      creditLimit: Number(creditLimit) || 1000,
      currentBalance: 0,
      status: 'Good',
      notes: notes.trim(),
      createdAt: new Date().toISOString()
    };

    this.data.customers.unshift(newCust);
    this.save();
    return newCust;
  }

  updateCustomer(id, updates) {
    const cust = this.getCustomerById(id);
    if (!cust) {
      throw new Error(`Customer with ID "${id}" not found.`);
    }

    if (updates.name !== undefined) cust.name = updates.name.trim();
    if (updates.phone !== undefined) cust.phone = updates.phone.trim();
    if (updates.address !== undefined) cust.address = updates.address.trim();
    if (updates.creditLimit !== undefined) cust.creditLimit = Number(updates.creditLimit);
    if (updates.status !== undefined) cust.status = updates.status;
    if (updates.notes !== undefined) cust.notes = updates.notes.trim();

    this.save();
    return cust;
  }

  recordCustomerPayment(customerId, { amount, paymentMethod = 'Cash', notes = '' }) {
    const cust = this.getCustomerById(customerId);
    if (!cust) {
      throw new Error(`Customer with ID "${customerId}" not found.`);
    }

    const payAmount = Number(amount);
    if (isNaN(payAmount) || payAmount <= 0) {
      throw new Error('Valid payment amount is required.');
    }

    const prevBalance = cust.currentBalance;
    const newBalance = Math.max(0, prevBalance - payAmount);
    cust.currentBalance = newBalance;

    if (newBalance === 0) {
      cust.status = 'Good';
    } else if (newBalance <= cust.creditLimit * 0.75) {
      cust.status = 'Good';
    }

    const logEntry = {
      id: `utang-${uuidv4().slice(0, 8)}`,
      customerId: cust.id,
      type: 'PAYMENT',
      amount: payAmount,
      balanceAfter: newBalance,
      description: `Hulog / Bayad Utang${notes ? ' - ' + notes : ''}`,
      paymentMethod,
      date: new Date().toISOString()
    };

    this.data.utangTransactions.push(logEntry);
    this.save();

    return {
      customer: cust,
      paymentRecord: logEntry,
      amountPaid: payAmount,
      previousBalance: prevBalance,
      newBalance
    };
  }

  getCustomerLedger(customerId) {
    const cust = this.getCustomerById(customerId);
    if (!cust) {
      throw new Error(`Customer with ID "${customerId}" not found.`);
    }

    const transactions = this.data.utangTransactions
      .filter(t => t.customerId === customerId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      customer: cust,
      totalUtangAccumulated: transactions
        .filter(t => t.type === 'CHARGE')
        .reduce((sum, t) => sum + t.amount, 0),
      totalPaid: transactions
        .filter(t => t.type === 'PAYMENT')
        .reduce((sum, t) => sum + t.amount, 0),
      transactions
    };
  }

  // Analytics & Summary
  getAnalyticsSummary(targetDateStr) {
    const targetDate = targetDateStr ? new Date(targetDateStr) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0);
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    const daySales = this.data.sales.filter(s => {
      const t = new Date(s.timestamp).getTime();
      return t >= startOfDay.getTime() && t <= endOfDay.getTime();
    });

    const dayExpenses = this.data.expenses.filter(e => {
      const t = new Date(e.date).getTime();
      return t >= startOfDay.getTime() && t <= endOfDay.getTime();
    });

    const grossSales = daySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalCost = daySales.reduce((sum, s) => sum + s.totalCost, 0);
    const grossProfit = grossSales - totalCost;
    const totalExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossProfit - totalExpenses; // Tunay na Kita!
    const transactionCount = daySales.length;
    const averageTicket = transactionCount > 0 ? grossSales / transactionCount : 0;
    const profitMarginPct = grossSales > 0 ? (netProfit / grossSales) * 100 : 0;

    // Payment methods breakdown
    const paymentMethods = { Cash: 0, GCash: 0, Maya: 0, Utang: 0 };
    daySales.forEach(s => {
      paymentMethods[s.paymentMethod] = (paymentMethods[s.paymentMethod] || 0) + s.totalAmount;
    });

    // Top selling items today
    const itemMap = {};
    daySales.forEach(s => {
      s.items.forEach(item => {
        if (!itemMap[item.productId]) {
          itemMap[item.productId] = {
            id: item.productId,
            name: item.name,
            qty: 0,
            revenue: 0,
            profit: 0
          };
        }
        itemMap[item.productId].qty += item.qty;
        itemMap[item.productId].revenue += item.total;
        itemMap[item.productId].profit += item.grossProfit || 0;
      });
    });

    const topItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

    // Total outstanding Utang across all customers
    const totalOutstandingUtang = this.data.customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);

    // Total inventory value (at cost and at retail)
    const inventoryCostValue = this.data.products.reduce((sum, p) => sum + (p.stock * p.costPrice), 0);
    const inventoryRetailValue = this.data.products.reduce((sum, p) => sum + (p.stock * p.sellingPrice), 0);
    const lowStockCount = this.data.products.filter(p => p.stock <= (p.minStock ?? 5)).length;

    return {
      date: startOfDay.toISOString().slice(0, 10),
      grossSales,
      totalCost,
      grossProfit,
      totalExpenses,
      netProfit,
      profitMarginPct,
      transactionCount,
      averageTicket,
      paymentMethods,
      topItems,
      totalOutstandingUtang,
      inventoryCostValue,
      inventoryRetailValue,
      lowStockCount,
      daySales,
      dayExpenses
    };
  }
}

const storage = new StorageManager();
module.exports = storage;

