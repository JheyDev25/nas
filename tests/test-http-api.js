const assert = require('assert');
const app = require('../server/server');

const TEST_PORT = 3456;

async function runHttpTests() {
  console.log('🚀 Starting Vibe Tindahan End-to-End HTTP API Tests...');

  const server = app.listen(TEST_PORT, async () => {
    const baseUrl = `http://localhost:${TEST_PORT}`;

    try {
      // 1. Health
      console.log('Test 1: Health check...');
      const healthRes = await fetch(`${baseUrl}/api/health`);
      assert.strictEqual(healthRes.status, 200);
      const healthData = await healthRes.json();
      assert.strictEqual(healthData.status, 'ok');

      // 2. Products List
      console.log('Test 2: Products list and barcode lookup...');
      const prodsRes = await fetch(`${baseUrl}/api/products`);
      assert.strictEqual(prodsRes.status, 200);
      const prods = await prodsRes.json();
      assert(prods.length > 20);

      const barcodeRes = await fetch(`${baseUrl}/api/products/barcode/4807770270016`);
      assert.strictEqual(barcodeRes.status, 200);
      const barcodeProd = await barcodeRes.json();
      assert.strictEqual(barcodeProd.barcode, '4807770270016');

      // 3. Create Product
      console.log('Test 3: Create product...');
      const newProdRes = await fetch(`${baseUrl}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Nescafe 3-in-1 Original',
          barcode: '4800011199999',
          category: 'Beverages',
          unit: 'sachet (28g)',
          costPrice: 9.00,
          sellingPrice: 12.00,
          stock: 30,
          minStock: 10
        })
      });
      assert.strictEqual(newProdRes.status, 201);
      const createdProd = await newProdRes.json();
      assert.strictEqual(createdProd.name, 'Nescafe 3-in-1 Original');

      // 4. Adjust Stock
      console.log('Test 4: Adjust product stock...');
      const adjustRes = await fetch(`${baseUrl}/api/products/${createdProd.id}/adjust-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qtyChange: 12, reason: 'Restock supplier' })
      });
      assert.strictEqual(adjustRes.status, 200);
      const adjustedProd = await adjustRes.json();
      assert.strictEqual(adjustedProd.stock, 42);

      // 5. Checkout Sale (Cash)
      console.log('Test 5: POS checkout sale with Cash...');
      const saleRes = await fetch(`${baseUrl}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { productId: createdProd.id, qty: 2, unitPrice: 12.00 }
          ],
          discount: 0,
          paymentMethod: 'Cash',
          cashTendered: 50.00,
          cashier: 'Ate Baby'
        })
      });
      assert.strictEqual(saleRes.status, 201);
      const saleData = await saleRes.json();
      assert.strictEqual(saleData.subtotal, 24.00);
      assert.strictEqual(saleData.change, 26.00);

      // 6. Checkout Sale (Utang)
      console.log('Test 6: POS checkout sale with Utang (Credit)...');
      const utangSaleRes = await fetch(`${baseUrl}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { productId: 'prod-001', qty: 2, unitPrice: 17.00 }
          ],
          discount: 0,
          paymentMethod: 'Utang',
          customerId: 'cust-002',
          cashier: 'Kuya Jun'
        })
      });
      assert.strictEqual(utangSaleRes.status, 201);
      const utangSaleData = await utangSaleRes.json();
      assert.strictEqual(utangSaleData.paymentMethod, 'Utang');

      // 7. Customers & Utang Payment (Hulog)
      console.log('Test 7: Customer payment (Hulog)...');
      const payRes = await fetch(`${baseUrl}/api/customers/cust-002/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 50.00,
          paymentMethod: 'Cash',
          notes: 'Bayad sa boundary'
        })
      });
      assert.strictEqual(payRes.status, 200);
      const payData = await payRes.json();
      assert.strictEqual(payData.amountPaid, 50.00);

      // 8. Customer Ledger History
      console.log('Test 8: Customer Ledger...');
      const ledgerRes = await fetch(`${baseUrl}/api/customers/cust-002/ledger`);
      assert.strictEqual(ledgerRes.status, 200);
      const ledgerData = await ledgerRes.json();
      assert(ledgerData.transactions.length > 0);

      // 9. Expenses
      console.log('Test 9: Record operating expense...');
      const expRes = await fetch(`${baseUrl}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'Store Supplies',
          description: '1 balot ng sando plastic bags',
          amount: 40.00,
          paymentMethod: 'Cash'
        })
      });
      assert.strictEqual(expRes.status, 201);

      // 10. Analytics Daily
      console.log('Test 10: Daily financial analytics...');
      const analyticsRes = await fetch(`${baseUrl}/api/analytics/daily`);
      assert.strictEqual(analyticsRes.status, 200);
      const analyticsData = await analyticsRes.json();
      assert(analyticsData.grossSales > 0);
      assert(analyticsData.netProfit !== undefined);

      // 11. AI Endpoints
      console.log('Test 11: AI Insights and Briefing...');
      const briefingRes = await fetch(`${baseUrl}/api/ai/briefing`);
      assert.strictEqual(briefingRes.status, 200);
      const briefing = await briefingRes.json();
      assert(briefing.healthScore > 0);

      const askRes = await fetch(`${baseUrl}/api/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'Anong paninda ang dapat kong i-restock?' })
      });
      assert.strictEqual(askRes.status, 200);
      const askData = await askRes.json();
      assert(askData.answer);

      // 12. Backup
      console.log('Test 12: Database backup...');
      const backupRes = await fetch(`${baseUrl}/api/backup`);
      assert.strictEqual(backupRes.status, 200);
      const backupJson = await backupRes.json();
      assert(backupJson.products && backupJson.sales);

      // 13. Static frontend files
      console.log('Test 13: Static frontend files...');
      const htmlRes = await fetch(`${baseUrl}/`);
      assert.strictEqual(htmlRes.status, 200);
      const htmlText = await htmlRes.text();
      assert(htmlText.includes('Vibe Tindahan'));

      const cssRes = await fetch(`${baseUrl}/style.css`);
      assert.strictEqual(cssRes.status, 200);

      const jsRes = await fetch(`${baseUrl}/app.js`);
      assert.strictEqual(jsRes.status, 200);

      console.log('🎉 ALL 13 END-TO-END HTTP API TESTS PASSED SUCCESSFULLY!');
      console.log('===========================================================');
    } catch (err) {
      console.error('❌ HTTP API Test Failure:', err);
      process.exit(1);
    } finally {
      server.close();
    }
  });
}

runHttpTests();
