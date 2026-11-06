# 🏪 Vibe Tindahan – Smart Business Management System

> **Best Overall Project**  
> Problem solved: Small businesses (sari-sari stores, mini groceries, small retailers) struggle with inventory, sales, expenses, and tracking profits.

---

## 🌟 Overview

**Vibe Tindahan** is an all-in-one, lightning-fast Point-of-Sale (POS), real-time inventory management, customer credit ledger (*Kuwaderno ng Utang*), and AI-driven business intelligence system engineered specifically for Philippine sari-sari stores and micro-retailers.

Built with an offline-first philosophy, zero heavy native compile dependencies, and instant responsiveness on PC, tablets, and smartphones.

---

## 🚀 Key Features

### 1. 🛒 Real-Time POS & Inventory Management
* **Instant Stock Decrementing:** Real-time stock updates upon checkout.
* **Pre-seeded Philippine Catalogue:** Includes 27 authentic sari-sari store staples (Lucky Me, Bear Brand, Great Taste White, Purefoods, Century Tuna, Datu Puti, San Miguel, Surf, Safeguard, Fresh Farm Eggs, Bigas, etc.) complete with real EAN-13 barcodes.
* **Financial Margin Tracking:** Auto-computes gross profit and margin % per item `(Benta - Puhunan) / Benta * 100`.
* **Quick Restock Modal:** 1-click `+6`, `+12 (Dozen)`, `+24 (Box)` restock with auto-calculated puhunan required.
* **CSV Export:** 1-click full inventory data export.

### 2. 📷 Barcode Scanning (Multi-Method)
* **Live Camera Barcode Scanner:** Interactive camera viewfinder supporting standard 1D/2D barcodes (EAN-13, UPC, Code 128, QR) via HTML5-QRCode.
* **Hardware USB / Handheld Barcode Scanner Listener:** High-speed keyboard input listener that automatically detects barcode reader inputs and adds scanned items straight into the cart with an authentic cash register beep!
* **Quick Barcode Simulation Strip:** One-click demo chips to test scanning without requiring physical cameras or handheld scanners.
* **Web Audio API Sound Feedback:** Cash register scan beep (1800Hz) and checkout celebratory chime (C5-E5-G5-C6) using native browser Web Audio (0 external MP3 files needed).

### 3. ⚠️ Automatic Low-Stock Alerts
* **Prominent Red Alert Banner:** Warns store owners immediately when items hit or drop below their reorder threshold.
* **Top Navigation Badge Counter:** Live pill displaying active low-stock count.
* **1-Click "Paubos Lamang" Filter:** Instantly filters the inventory list to items needing supplier orders.

### 4. 📊 Daily Sales & Profit Analytics (Benta at Tunay na Kita)
* **True Net Profit Calculation:**  
  $$\text{Tunay na Kita (Net Profit)} = \text{Gross Profit} - \text{Daily Operating Expenses}$$
* **Daily Operating Expense Logger:** Track daily store costs (tube ice/yelo, delivery/pamasahe sa palengke, electricity, tindero merienda).
* **Interactive Chart.js Visualizations:**
  * 7-day Sales vs Net Profit trend bar chart.
  * Payment method breakdown (Cash vs GCash vs Utang).
* **Live Sales Ledger Feed:** Searchable list of past transactions with 1-click receipt reprint.

### 5. 📒 Customer Debt (Utang) Tracking – *Kuwaderno ng Utang*
* **Digital Credit Ledger:** Replaces lost or damaged paper notebooks.
* **Credit Limit & Risk Monitoring:** Set custom credit limits per suki with warning badges (Good Payer, Due Soon, Warning/Over limit).
* **Flexible Payments (Hulog):** Supports full or partial payments (`Buong Utang`, ₱50, ₱100, ₱200, or custom amount) with real-time remaining balance recalculation.
* **Full Itemized Transaction History:** View the exact date, items bought on credit, and payment dates for every customer.
* **Polite SMS Reminder Generator:** Generates a friendly, respectful Tagalog reminder notice with 1-click clipboard copy and `sms:` link to message directly from mobile.

### 6. 🤖 Utak-Tindahan AI – Smart Business Intelligence
* **Store Health Score (0–100):** Real-time gauge evaluating inventory health, margins, and debt risk.
* **Predictive Restock Advisor:** Analyzes sales velocity, computes days of stock remaining, and recommends exact reorder quantities with estimated capital required.
* **Dead Stock / Stagnant Capital Detector:** Identifies slow-moving items tying up store cash and provides promo/bundling suggestions.
* **Dagdag-Benta Combos (Basket Analysis):** Identifies frequently co-purchased items (e.g. *Kopiko Blanca + Skyflakes*, *Pancit Canton + Eggs*) and proposes discounted bundle prices to boost average ticket size.
* **Interactive AI Advisor ("Tanong kay AI"):** Conversational assistant answering natural questions like *"Magkano ang kinita ko?"*, *"Sino ang may pinakamalaking utang?"*, and *"Anong paninda ang dapat i-order?"*.

### 7. 🧾 Printable Thermal Receipts
* **Authentic 58mm / 80mm Thermal POS Slip:** Formatted for standard receipt printers with store name, address, receipt #, cashier name, itemized breakdown, discounts, tender/change, and suki balance.
* **Clean Print Media Styling:** `@media print` layout automatically strips navigation buttons and fits 58mm thermal paper rolls.

### 8. 🛡️ Data Backup & Portability
* **Atomic JSON Storage Engine:** Zero native C++ dependency; crashes or power cuts will not corrupt data.
* **1-Click Download Complete Backup:** Exports the entire store database as JSON.
* **1-Click Restore & Reset:** Easily restore backups or reset to fresh sample data for demos.

---

## 🛠️ Quick Start

### Prerequisites
* Node.js (v18+)

### Running the App
```bash
# 1. Start the server
npm start
# or double-click start.bat on Windows
```

Open your browser and navigate to:
```
http://localhost:3000
```

### Running Automated Tests
```bash
# Run business logic unit tests
npm test

# Run end-to-end HTTP REST API tests
node tests/test-http-api.js
```

---

## 📁 Project Structure

```
nas/
├── data/
│   └── db.json               # Persistent atomic database
├── public/
│   ├── vendor/               # Offline-bundled libraries (Chart.js, Confetti, HTML5-QRCode)
│   ├── index.html            # Single Page Application interface
│   ├── style.css             # Responsive styling & 58mm thermal print rules
│   └── app.js                # Frontend controller & Web Audio synthesizer
├── server/
│   ├── seed-data.js          # Realistic Philippine sari-sari catalogue & fixtures
│   ├── storage.js            # Thread-safe atomic JSON persistence engine
│   ├── ai-engine.js          # Utak-Tindahan AI business analytics engine
│   └── server.js             # Express REST API server & static file host
├── tests/
│   ├── test-business-logic.js # Automated domain & money calculation tests
│   └── test-http-api.js       # End-to-end HTTP integration tests
├── package.json
├── start.bat                 # 1-click Windows launcher
└── README.md
```

---

## ⚖️ License
MIT License. Built for the Filipino entrepreneur and small retail businesses.
