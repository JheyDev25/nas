// Utak-Tindahan AI - Smart Business Intelligence & Sales Insights Engine
// Specifically engineered for Philippine Sari-Sari Stores, Mini Groceries, and Small Retailers
// Supports Bilingual Analysis: Filipino (Tagalog/Taglish) & English

class AIEngine {
  constructor(storage) {
    this.storage = storage;
  }

  // 1. Predictive Restock Advisor
  getRestockPredictions() {
    const products = this.storage.getProducts();
    const sales = this.storage.getSales({ limit: 500 });
    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

    // Filter sales to last 7 days
    const recentSales = sales.filter(s => new Date(s.timestamp).getTime() >= sevenDaysAgo);
    const daySpan = Math.max(1, Math.min(7, (now - Math.min(...recentSales.map(s => new Date(s.timestamp).getTime()), now)) / (24 * 3600 * 1000)));

    // Calculate sales velocity per product
    const velocityMap = {};
    recentSales.forEach(s => {
      s.items.forEach(item => {
        velocityMap[item.productId] = (velocityMap[item.productId] || 0) + item.qty;
      });
    });

    const predictions = [];

    products.forEach(p => {
      const unitsSold = velocityMap[p.id] || 0;
      const dailyVelocity = unitsSold / daySpan;
      const currentStock = p.stock;
      const minStock = p.minStock || 5;

      let daysRemaining = dailyVelocity > 0 ? (currentStock / dailyVelocity) : (currentStock > 0 ? 999 : 0);
      let urgency = 'NORMAL';

      if (currentStock === 0) {
        urgency = 'OUT_OF_STOCK';
      } else if (currentStock <= minStock || daysRemaining <= 2) {
        urgency = 'CRITICAL';
      } else if (daysRemaining <= 5) {
        urgency = 'WARNING';
      }

      if (urgency !== 'NORMAL') {
        // Recommend restock for 10 days of inventory
        const suggestedQty = Math.max(12, Math.ceil((dailyVelocity || 2) * 10) - currentStock);
        const estimatedCost = suggestedQty * p.costPrice;
        const potentialRevenue = suggestedQty * p.sellingPrice;
        const projectedProfit = potentialRevenue - estimatedCost;

        predictions.push({
          productId: p.id,
          name: p.name,
          category: p.category,
          currentStock,
          minStock,
          dailyVelocity: Number(dailyVelocity.toFixed(1)),
          daysRemaining: Number(daysRemaining.toFixed(1)),
          urgency,
          suggestedRestockQty: suggestedQty,
          costPrice: p.costPrice,
          estimatedCost: Number(estimatedCost.toFixed(2)),
          projectedProfit: Number(projectedProfit.toFixed(2)),
          message: urgency === 'OUT_OF_STOCK'
            ? `UBOS NA! (${p.name}). Nawawalan ka ng benta. Mag-order agad ng ${suggestedQty} ${p.unit}.`
            : urgency === 'CRITICAL'
            ? `Peligro maubusan sa loob ng ${daysRemaining <= 1 ? '1 araw' : daysRemaining.toFixed(0) + ' araw'}! Mag-restock ng ${suggestedQty} ${p.unit} (Puhunan: ₱${estimatedCost.toFixed(2)}).`
            : `Pababa na ang stock (${currentStock} natitira). Mainam mag-order bago mag-weekend.`,
          messageEn: urgency === 'OUT_OF_STOCK'
            ? `OUT OF STOCK! (${p.name}). You are losing sales. Reorder ${suggestedQty} ${p.unit} immediately.`
            : urgency === 'CRITICAL'
            ? `Risk of running out in ${daysRemaining <= 1 ? '1 day' : daysRemaining.toFixed(0) + ' days'}! Reorder ${suggestedQty} ${p.unit} (Cost: ₱${estimatedCost.toFixed(2)}).`
            : `Stock is running low (${currentStock} left). Good time to reorder before the weekend.`
        });
      }
    });

    const urgencyWeight = { OUT_OF_STOCK: 3, CRITICAL: 2, WARNING: 1, NORMAL: 0 };
    predictions.sort((a, b) => urgencyWeight[b.urgency] - urgencyWeight[a.urgency] || a.daysRemaining - b.daysRemaining);

    return predictions;
  }

  // 2. Dead Stock / Stagnant Capital Detector
  getDeadStockAnalysis() {
    const products = this.storage.getProducts();
    const sales = this.storage.getSales({ limit: 500 });
    const now = Date.now();
    const fourteenDaysAgo = now - (14 * 24 * 60 * 60 * 1000);

    const activeProductIds = new Set();
    sales.forEach(s => {
      if (new Date(s.timestamp).getTime() >= fourteenDaysAgo) {
        s.items.forEach(i => activeProductIds.add(i.productId));
      }
    });

    const deadStock = [];
    products.forEach(p => {
      if (!activeProductIds.has(p.id) && p.stock > 0) {
        const tiedCapital = p.stock * p.costPrice;
        deadStock.push({
          productId: p.id,
          name: p.name,
          category: p.category,
          stock: p.stock,
          unit: p.unit,
          costPrice: p.costPrice,
          tiedCapital: Number(tiedCapital.toFixed(2)),
          sellingPrice: p.sellingPrice,
          suggestion: `Nakatenggang puhunan: ₱${tiedCapital.toFixed(2)}. Subukang i-bundle bilang promo o bawasan ang presyo ng ₱1.00 para maibalik agad ang puhunan.`,
          suggestionEn: `Stagnant capital: ₱${tiedCapital.toFixed(2)}. Try bundling as a promo or discounting by ₱1.00 to quickly recoup capital.`
        });
      }
    });

    deadStock.sort((a, b) => b.tiedCapital - a.tiedCapital);
    return deadStock;
  }

  // 3. Sari-Sari Basket Analysis (Frequently Bought Together)
  getBasketCombos() {
    const sales = this.storage.getSales({ limit: 500 });
    const pairCounts = {};
    const itemNames = {};

    sales.forEach(sale => {
      const items = sale.items;
      if (items.length < 2) return;

      for (let i = 0; i < items.length; i++) {
        itemNames[items[i].productId] = items[i].name;
        for (let j = i + 1; j < items.length; j++) {
          itemNames[items[j].productId] = items[j].name;
          const pairKey = [items[i].productId, items[j].productId].sort().join('___');
          pairCounts[pairKey] = (pairCounts[pairKey] || 0) + 1;
        }
      }
    });

    const combos = Object.keys(pairCounts)
      .map(key => {
        const [idA, idB] = key.split('___');
        const prodA = this.storage.getProductById(idA);
        const prodB = this.storage.getProductById(idB);
        const count = pairCounts[key];
        const combinedRetail = (prodA ? prodA.sellingPrice : 0) + (prodB ? prodB.sellingPrice : 0);
        const suggestedBundlePrice = Math.max(0, combinedRetail - 2.00); // ₱2 discount for combo

        return {
          itemA: { id: idA, name: itemNames[idA] || idA, price: prodA?.sellingPrice || 0 },
          itemB: { id: idB, name: itemNames[idB] || idB, price: prodB?.sellingPrice || 0 },
          frequency: count,
          combinedRetail,
          suggestedBundlePrice,
          comboTitle: `Combo Tipid Merienda: ${itemNames[idA]} + ${itemNames[idB]}`,
          comboTitleEn: `Saver Bundle: ${itemNames[idA]} + ${itemNames[idB]}`,
          pitch: `Binili nang sabay sa ${count} na resibo. Gumawa ng combo bundle sa presyong ₱${suggestedBundlePrice.toFixed(2)} para mahikayat ang iba pang suki!`,
          pitchEn: `Purchased together in ${count} sales receipts. Create a combo bundle at ₱${suggestedBundlePrice.toFixed(2)} to encourage more purchases!`
        };
      })
      .filter(c => c.frequency >= 1)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 6);

    return combos;
  }

  // 4. Daily AI Executive Summary & Store Health
  getDailyExecutiveBriefing(lang = 'fil') {
    const isEn = lang === 'en';
    const analytics = this.storage.getAnalyticsSummary();
    const restock = this.getRestockPredictions();
    const deadStock = this.getDeadStockAnalysis();
    const customers = this.storage.getCustomers();
    const highDebtCustomers = customers.filter(c => c.currentBalance > c.creditLimit * 0.8);

    let healthScore = 85;
    const highlights = [];
    const actionItems = [];

    // Evaluate revenue & net profit
    if (analytics.grossSales > 0) {
      if (isEn) {
        highlights.push(`Total Sales Today: ₱${analytics.grossSales.toFixed(2)} (${analytics.transactionCount} transactions).`);
        highlights.push(`True Net Profit: ₱${analytics.netProfit.toFixed(2)} after deducting ₱${analytics.totalExpenses.toFixed(2)} in operational expenses.`);
      } else {
        highlights.push(`Kabuuang Benta Ngayong Araw: ₱${analytics.grossSales.toFixed(2)} (${analytics.transactionCount} transactions).`);
        highlights.push(`Tunay na Tubo (Net Profit): ₱${analytics.netProfit.toFixed(2)} matapos ibawas ang ₱${analytics.totalExpenses.toFixed(2)} na gastusin.`);
      }
    } else {
      healthScore -= 10;
      highlights.push(isEn ? `No sales recorded yet today.` : `Wala pang naitatalang benta ngayong araw.`);
    }

    // Profit margin check
    if (analytics.profitMarginPct >= 20) {
      highlights.push(isEn 
        ? `Healthy profit margin: ${analytics.profitMarginPct.toFixed(1)}% return on sales.` 
        : `Maganda ang margin ng tindahan: ${analytics.profitMarginPct.toFixed(1)}% ang tubo sa benta.`);
    } else if (analytics.profitMarginPct > 0) {
      healthScore -= 5;
      highlights.push(isEn 
        ? `Slightly low margin (${analytics.profitMarginPct.toFixed(1)}%). Review your pricing.` 
        : `Medyo mababa ang margin (${analytics.profitMarginPct.toFixed(1)}%). Suriin ang mga presyo ng paninda.`);
    }

    // Low stock checks
    const criticalRestock = restock.filter(r => r.urgency === 'OUT_OF_STOCK' || r.urgency === 'CRITICAL');
    if (criticalRestock.length > 0) {
      healthScore -= criticalRestock.length * 4;
      actionItems.push(isEn 
        ? `${criticalRestock.length} products urgently require restocking (${criticalRestock.map(r => r.name).slice(0, 3).join(', ')}).`
        : `May ${criticalRestock.length} produkto na dapat nang i-restock agad (${criticalRestock.map(r => r.name).slice(0, 3).join(', ')}).`);
    }

    // Utang checks
    if (analytics.totalOutstandingUtang > 0) {
      if (analytics.totalOutstandingUtang > 2000) {
        healthScore -= 10;
        actionItems.push(isEn 
          ? `Outstanding debt is high: ₱${analytics.totalOutstandingUtang.toFixed(2)} total credit. Follow up with customers.`
          : `Medyo mataas ang pautang: ₱${analytics.totalOutstandingUtang.toFixed(2)} ang kabuuang utang. Paalalahanan ang mga suki.`);
      } else {
        highlights.push(isEn 
          ? `Customer debt is under control: ₱${analytics.totalOutstandingUtang.toFixed(2)} total.`
          : `Kontrolado ang pautang: ₱${analytics.totalOutstandingUtang.toFixed(2)} kabuuan.`);
      }
    }

    if (highDebtCustomers.length > 0) {
      actionItems.push(isEn 
        ? `${highDebtCustomers.length} customers are near their credit limits: ${highDebtCustomers.map(c => `${c.name} (₱${c.currentBalance})`).join(', ')}.`
        : `${highDebtCustomers.length} customer ang malapit na sa credit limit: ${highDebtCustomers.map(c => `${c.name} (₱${c.currentBalance})`).join(', ')}.`);
    }

    healthScore = Math.max(30, Math.min(100, healthScore));

    let statusGreeting = isEn ? 'Your store operations are running healthy and steady!' : 'Maganda at matatag ang takbo ng iyong tindahan!';
    if (healthScore >= 90) {
      statusGreeting = isEn 
        ? 'Outstanding! Your store performance and cash flow are in peak condition today!' 
        : 'Napakagaling! Napakalusog at masigla ang operasyon ng tindahan mo ngayon!';
    } else if (healthScore < 70) {
      statusGreeting = isEn 
        ? 'Attention needed on inventory reorders and customer credit collection to maintain cash flow.' 
        : 'Kailangan ng pansin sa imbentaryo at paniningil ng pautang para mapanatiling ligtas ang cash flow.';
    }

    return {
      date: analytics.date,
      healthScore,
      statusGreeting,
      highlights,
      actionItems,
      totalCapitalNeededForRestock: criticalRestock.reduce((sum, r) => sum + r.estimatedCost, 0),
      criticalCount: criticalRestock.length,
      deadStockCount: deadStock.length,
      totalUtang: analytics.totalOutstandingUtang
    };
  }

  // 5. Natural Language Ask AI Engine
  askAI(question, lang = 'fil') {
    const q = (question || '').toLowerCase();
    const isEn = lang === 'en';
    const analytics = this.storage.getAnalyticsSummary();
    const customers = this.storage.getCustomers();
    const products = this.storage.getProducts();
    const restock = this.getRestockPredictions();
    const settings = this.storage.getSettings() || {};
    const storeName = settings.name || (isEn ? 'Our Store' : 'Vibe Tindahan');

    if (q.includes('utang') || q.includes('pautang') || q.includes('debt') || q.includes('credit') || q.includes('suki') || q.includes('customer')) {
      const topDebtors = customers.slice(0, 3);
      if (isEn) {
        const debtorList = topDebtors.map(c => `• ${c.name}: ₱${c.currentBalance.toFixed(2)} (Limit: ₱${c.creditLimit})`).join('\n');
        return {
          answer: `Total outstanding customer debt across ${customers.length} registered customers is ₱${analytics.totalOutstandingUtang.toFixed(2)}.\n\nTop active balances:\n${debtorList}\n\nAI Tip: Send polite reminders on the 15th and end of the month using our SMS reminder button in the Debt Ledger.`
        };
      } else {
        const debtorList = topDebtors.map(c => `• ${c.name}: ₱${c.currentBalance.toFixed(2)} (Limit: ₱${c.creditLimit})`).join('\n');
        return {
          answer: `Ang kabuuang pautang ng tindahan ay ₱${analytics.totalOutstandingUtang.toFixed(2)} across ${customers.length} na suki.\n\nNangungunang may balanse:\n${debtorList}\n\nTip ni AI: Magpadala ng magalang na SMS reminder tuwing kinsenas at katapusan gamit ang aming SMS button sa Utang Tracker.`
        };
      }
    }

    if (q.includes('benta') || q.includes('kinita') || q.includes('sales') || q.includes('tubo') || q.includes('profit') || q.includes('earn') || q.includes('revenue')) {
      if (isEn) {
        return {
          answer: `Here is today's financial performance summary:\n• Gross Revenue: ₱${analytics.grossSales.toFixed(2)}\n• Cost of Goods Sold: ₱${analytics.totalCost.toFixed(2)}\n• Gross Margin: ₱${analytics.grossProfit.toFixed(2)}\n• Operating Expenses: ₱${analytics.totalExpenses.toFixed(2)}\n• TRUE NET PROFIT: ₱${analytics.netProfit.toFixed(2)}\n\nLogged ${analytics.transactionCount} transactions today with an average basket spend of ₱${analytics.averageTicket.toFixed(2)} per customer.`
        };
      } else {
        return {
          answer: `Narito ang financial status ngayong araw:\n• Kabuuang Benta: ₱${analytics.grossSales.toFixed(2)}\n• Puhunan ng Nabenta: ₱${analytics.totalCost.toFixed(2)}\n• Gross Profit (Tubo sa Produkto): ₱${analytics.grossProfit.toFixed(2)}\n• Gastusin sa Tindahan: ₱${analytics.totalExpenses.toFixed(2)}\n• TUNAY NA KITA (Net Profit): ₱${analytics.netProfit.toFixed(2)}\n\nNakatala ang ${analytics.transactionCount} na benta na may average na ₱${analytics.averageTicket.toFixed(2)} bawat customer.`
        };
      }
    }

    if (q.includes('restock') || q.includes('order') || q.includes('ubos') || q.includes('stock') || q.includes('inventory')) {
      const critical = restock.filter(r => r.urgency === 'OUT_OF_STOCK' || r.urgency === 'CRITICAL');
      if (critical.length === 0) {
        return {
          answer: isEn ? `All products have healthy inventory! No critically low stock at this time.` : `Ligtas ang iyong mga paninda! Walang agarang critically low-stock na produkto sa ngayon.`
        };
      }
      if (isEn) {
        const items = critical.slice(0, 5).map(r => `• ${r.name}: ${r.currentStock} pcs remaining (Order ${r.suggestedRestockQty} pcs, requires ₱${r.estimatedCost.toFixed(2)} capital)`).join('\n');
        return {
          answer: `There are ${critical.length} items that urgently require restocking to avoid losing sales:\n${items}`
        };
      } else {
        const items = critical.slice(0, 5).map(r => `• ${r.name}: ${r.currentStock} pcs natitira (Mag-order ng ${r.suggestedRestockQty} pcs, kailangan ng ₱${r.estimatedCost.toFixed(2)} puhunan)`).join('\n');
        return {
          answer: `May ${critical.length} produkto na kailangan nang i-restock agad para hindi mawalan ng suki:\n${items}`
        };
      }
    }

    if (q.includes('best seller') || q.includes('mabili') || q.includes('lakas') || q.includes('popular') || q.includes('top')) {
      if (analytics.topItems.length === 0) {
        return {
          answer: isEn 
            ? `No sales recorded today yet. General fast-moving items are Instant Noodles, Coffee, and Rice.`
            : `Wala pang benta ngayong araw. Pero sa pangkalahatang takbo, ang mga pangunahing mabili ay Instant Noodles (Lucky Me), Kape (Great Taste White), at Bigas.`
        };
      }
      if (isEn) {
        const topList = analytics.topItems.map(item => `• ${item.name} (${item.qty} units sold, Total: ₱${item.revenue.toFixed(2)})`).join('\n');
        return {
          answer: `Today's best-selling products:\n${topList}`
        };
      } else {
        const topList = analytics.topItems.map(item => `• ${item.name} (${item.qty} nabenta, Benta: ₱${item.revenue.toFixed(2)})`).join('\n');
        return {
          answer: `Ito ang pinakamabiling produkto ngayong araw:\n${topList}`
        };
      }
    }

    // Default business advice
    if (isEn) {
      return {
        answer: `Hello! I am your Store AI Advisor for ${storeName}. Currently tracking ${products.length} products and ${customers.length} registered credit customers.\n\nToday's gross revenue is ₱${analytics.grossSales.toFixed(2)} with true net profit of ₱${analytics.netProfit.toFixed(2)}.\n\nTip: Keep your daily operating expenses updated in the 'Analytics' tab so your net profit calculations are always 100% accurate!`
      };
    } else {
      return {
        answer: `Halo! Ako si Utak-Tindahan AI ng ${storeName}. Kasalukuyang nakatala ang ${products.length} na produkto at ${customers.length} na suki sa iyong tindahan.\n\nMay kabuuang ₱${analytics.grossSales.toFixed(2)} na benta ngayong araw na may tunay na kita na ₱${analytics.netProfit.toFixed(2)}.\n\nTip: Panatilihing updated ang iyong mga gastusin (yelo, pamasahe) sa tab na 'Benta at Tubo' upang laging eksakto ang kwenta ng iyong totoong kita!`
      };
    }
  }
}

module.exports = AIEngine;
