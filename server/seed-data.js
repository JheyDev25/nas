// Realistic seed data for Vibe Tindahan (Philippine Sari-Sari Store & Mini Grocery)

const defaultStoreSettings = {
  name: "Vibe Tindahan",
  tagline: "Ang Maaasahang Tindahan ng Barangay",
  owner: "Ate Baby & Kuya Jun",
  address: "123 Mabini St., Brgy. San Antonio, Pasig City",
  phone: "0917-888-8423",
  currency: "PHP",
  currencySymbol: "₱",
  receiptHeader: "VIBE TINDAHAN\n123 Mabini St., Brgy. San Antonio\nTel: 0917-888-8423",
  receiptFooter: "Maraming Salamat sa inyong Pagtangkilik!\nBalik po kayo sa Vibe Tindahan!\n(Official Non-VAT Customer Receipt)",
  taxRate: 0, // Sari-sari stores are typically non-VAT micro-enterprises
  lowStockGlobalThreshold: 5
};

const defaultProducts = [
  // Canned Goods & Instant Meals
  {
    id: "prod-001",
    barcode: "4807770270016",
    name: "Lucky Me! Instant Pancit Canton Kalamansi",
    category: "Instant Noodles",
    unit: "pack (80g)",
    costPrice: 13.50,
    sellingPrice: 17.00,
    stock: 24,
    minStock: 10,
    description: "Classic Pinoy favorite calamansi flavored noodles"
  },
  {
    id: "prod-002",
    barcode: "4807770270023",
    name: "Lucky Me! Instant Pancit Canton Extra Hot",
    category: "Instant Noodles",
    unit: "pack (80g)",
    costPrice: 13.50,
    sellingPrice: 17.00,
    stock: 8,
    minStock: 10,
    description: "Spicy chili kalamansi instant noodles"
  },
  {
    id: "prod-003",
    barcode: "4807770270030",
    name: "Lucky Me! Instant Mami Beef",
    category: "Instant Noodles",
    unit: "pack (55g)",
    costPrice: 11.00,
    sellingPrice: 14.00,
    stock: 18,
    minStock: 8,
    description: "Savory beef broth instant mami"
  },
  {
    id: "prod-004",
    barcode: "4800016644810",
    name: "Century Tuna Flakes in Oil",
    category: "Canned Goods",
    unit: "can (155g)",
    costPrice: 38.00,
    sellingPrice: 45.00,
    stock: 12,
    minStock: 6,
    description: "Healthy tuna flakes in vegetable oil"
  },
  {
    id: "prod-005",
    barcode: "4800016053032",
    name: "555 Sardines in Tomato Sauce (Green)",
    category: "Canned Goods",
    unit: "can (155g)",
    costPrice: 22.00,
    sellingPrice: 27.00,
    stock: 4, // Critical stock!
    minStock: 8,
    description: "Sardines in rich tomato sauce with chili"
  },
  {
    id: "prod-006",
    barcode: "4800110023412",
    name: "Purefoods Corned Beef",
    category: "Canned Goods",
    unit: "can (150g)",
    costPrice: 65.00,
    sellingPrice: 76.00,
    stock: 7,
    minStock: 5,
    description: "Premium juicy shredded corned beef"
  },
  {
    id: "prod-007",
    barcode: "4800888138760",
    name: "San Marino Corned Tuna",
    category: "Canned Goods",
    unit: "can (150g)",
    costPrice: 36.50,
    sellingPrice: 43.00,
    stock: 15,
    minStock: 6,
    description: "Delicious corned tuna with chili flakes"
  },

  // Beverages & Coffee
  {
    id: "prod-008",
    barcode: "4801981110028",
    name: "Great Taste White Coffee Twin Pack",
    category: "Beverages",
    unit: "sachet (50g)",
    costPrice: 13.00,
    sellingPrice: 16.00,
    stock: 35,
    minStock: 12,
    description: "Smooth & creamy white coffee twin pack"
  },
  {
    id: "prod-009",
    barcode: "4801981110042",
    name: "Kopiko Blanca Twin Pack",
    category: "Beverages",
    unit: "sachet (52g)",
    costPrice: 13.50,
    sellingPrice: 16.50,
    stock: 30,
    minStock: 12,
    description: "Rich creamy coffee twin pack"
  },
  {
    id: "prod-010",
    barcode: "4800011140027",
    name: "Bear Brand Fortified Milk Powder",
    category: "Beverages",
    unit: "sachet (33g)",
    costPrice: 12.00,
    sellingPrice: 15.00,
    stock: 3, // Low stock!
    minStock: 15,
    description: "Tibay-araw powdered milk drink"
  },
  {
    id: "prod-011",
    barcode: "4800016001019",
    name: "Coca-Cola Original 1.5L",
    category: "Beverages",
    unit: "bottle (1.5L)",
    costPrice: 62.00,
    sellingPrice: 75.00,
    stock: 9,
    minStock: 6,
    description: "Cold refreshing Coke 1.5L bottle"
  },
  {
    id: "prod-012",
    barcode: "4800016001026",
    name: "Royal Tru-Orange 1.5L",
    category: "Beverages",
    unit: "bottle (1.5L)",
    costPrice: 62.00,
    sellingPrice: 75.00,
    stock: 6,
    minStock: 5,
    description: "Fruity sparkling orange softdrink"
  },
  {
    id: "prod-013",
    barcode: "4800028110014",
    name: "Nature's Spring Mineral Water",
    category: "Beverages",
    unit: "bottle (500ml)",
    costPrice: 11.00,
    sellingPrice: 15.00,
    stock: 22,
    minStock: 10,
    description: "Clean purified drinking water"
  },

  // Condiments & Cooking Essentials
  {
    id: "prod-014",
    barcode: "4800038200017",
    name: "Silver Swan Soy Sauce (Toyo)",
    category: "Condiments",
    unit: "bottle (385ml)",
    costPrice: 20.00,
    sellingPrice: 25.00,
    stock: 14,
    minStock: 6,
    description: "Tamang-tamang timpla na toyo"
  },
  {
    id: "prod-015",
    barcode: "4800038200024",
    name: "Datu Puti White Vinegar (Suka)",
    category: "Condiments",
    unit: "bottle (385ml)",
    costPrice: 18.00,
    sellingPrice: 23.00,
    stock: 11,
    minStock: 6,
    description: "Mukhasim na sukang puti"
  },
  {
    id: "prod-016",
    barcode: "4800038200031",
    name: "Mang Tomas All-Around Sarsa",
    category: "Condiments",
    unit: "bottle (325g)",
    costPrice: 32.00,
    sellingPrice: 39.00,
    stock: 5,
    minStock: 5,
    description: "Masarap na sarsa para sa litson at pritong ulam"
  },
  {
    id: "prod-017",
    barcode: "4800099001001",
    name: "Magic Sarap All-In-One Seasoning",
    category: "Condiments",
    unit: "sachet (8g)",
    costPrice: 4.50,
    sellingPrice: 6.00,
    stock: 45,
    minStock: 20,
    description: "Granulated seasoning with real meat and spices"
  },

  // Rice & Grains
  {
    id: "prod-018",
    barcode: "4809990001011",
    name: "Sinandomeng Rice (Well-Milled)",
    category: "Rice & Grains",
    unit: "kilo",
    costPrice: 44.00,
    sellingPrice: 50.00,
    stock: 45,
    minStock: 15,
    description: "White, soft cooked regular rice"
  },
  {
    id: "prod-019",
    barcode: "4809990001028",
    name: "Dinorado Fragrant Rice",
    category: "Rice & Grains",
    unit: "kilo",
    costPrice: 52.00,
    sellingPrice: 60.00,
    stock: 25,
    minStock: 10,
    description: "Mabango at malambot na kanin"
  },
  {
    id: "prod-020",
    barcode: "4809990001035",
    name: "Fresh Farm Chicken Egg (Medium)",
    category: "Fresh & Tingi",
    unit: "piece",
    costPrice: 7.00,
    sellingPrice: 9.00,
    stock: 36,
    minStock: 15,
    description: "Sariwang itlog mula sa poultry"
  },

  // Snacks & Biscuits
  {
    id: "prod-021",
    barcode: "4800016010011",
    name: "Piattos Cheese Flavored Potato Crisps",
    category: "Snacks",
    unit: "pack (85g)",
    costPrice: 30.00,
    sellingPrice: 36.00,
    stock: 14,
    minStock: 8,
    description: "Hexagonal crispy snack in cheese flavor"
  },
  {
    id: "prod-022",
    barcode: "4800016010028",
    name: "Chippy Barbecue Flavored Corn Chips",
    category: "Snacks",
    unit: "pack (110g)",
    costPrice: 28.00,
    sellingPrice: 34.00,
    stock: 16,
    minStock: 8,
    description: "Classic Pinoy barbecue corn snack"
  },
  {
    id: "prod-023",
    barcode: "4800103001015",
    name: "SkyFlakes Crackers (Singles)",
    category: "Snacks",
    unit: "pack (3s)",
    costPrice: 6.50,
    sellingPrice: 8.50,
    stock: 2, // Critical low!
    minStock: 15,
    description: "Number 1 saltine cracker in the Philippines"
  },

  // Personal Care & Household (Tingi culture)
  {
    id: "prod-024",
    barcode: "4800068100012",
    name: "Safeguard Pure White Soap Bar",
    category: "Personal Care",
    unit: "bar (60g)",
    costPrice: 24.00,
    sellingPrice: 30.00,
    stock: 10,
    minStock: 5,
    description: "Antibacterial protection family soap"
  },
  {
    id: "prod-025",
    barcode: "4800068100029",
    name: "Surf Sun Fresh Powder Detergent",
    category: "Household",
    unit: "sachet (65g)",
    costPrice: 11.50,
    sellingPrice: 14.50,
    stock: 28,
    minStock: 12,
    description: "Mabangong sabong panlaba sa damit"
  },
  {
    id: "prod-026",
    barcode: "4800068100036",
    name: "Sunsilk Strong & Long Shampoo Sachet",
    category: "Personal Care",
    unit: "sachet (13ml)",
    costPrice: 6.50,
    sellingPrice: 8.50,
    stock: 32,
    minStock: 12,
    description: "Green shampoo sachet with biotin"
  },
  {
    id: "prod-027",
    barcode: "4800068100043",
    name: "Champion Laundry Bar (White)",
    category: "Household",
    unit: "bar (130g)",
    costPrice: 19.00,
    sellingPrice: 24.00,
    stock: 8,
    minStock: 6,
    description: "Mabisa sa mantsa bar soap"
  }
];

const defaultCustomers = [
  {
    id: "cust-001",
    name: "Aling Marites Cruz",
    phone: "0918-123-4567",
    address: "Block 4, Lot 12, Sitio Pag-asa",
    creditLimit: 1500.00,
    currentBalance: 420.00,
    status: "Good",
    notes: "Regular customer; pays tuwing kinsenas (15th & 30th).",
    createdAt: "2026-10-15T08:00:00.000Z"
  },
  {
    id: "cust-002",
    name: "Mang Tomas Santos",
    phone: "0920-555-7890",
    address: "Block 2, Lot 5, Mabini Extension",
    creditLimit: 1000.00,
    currentBalance: 850.00,
    status: "Due Soon",
    notes: "Tricycle driver; promises payment this Saturday afternoon.",
    createdAt: "2026-10-20T10:15:00.000Z"
  },
  {
    id: "cust-003",
    name: "Nanay Rosa Gomez",
    phone: "0917-333-8821",
    address: "Purok 3, Near Chapel",
    creditLimit: 800.00,
    currentBalance: 150.00,
    status: "Good",
    notes: "Laging may hulog tuwing Lunes ng umaga.",
    createdAt: "2026-10-25T14:30:00.000Z"
  },
  {
    id: "cust-004",
    name: "Kuya Jun Barredo",
    phone: "0999-444-1122",
    address: "Block 6, Riverside",
    creditLimit: 1200.00,
    currentBalance: 1100.00,
    status: "Warning",
    notes: "Malapit na sa credit limit. Need paalala bago magpautang muli.",
    createdAt: "2026-10-28T09:00:00.000Z"
  }
];

const defaultUtangTransactions = [
  {
    id: "utang-001",
    customerId: "cust-001",
    type: "CHARGE", // CHARGE or PAYMENT
    amount: 420.00,
    balanceAfter: 420.00,
    description: "Utang: 2kg Sinandomeng Rice, 2 cans 555 Sardines, 1 sachet Great Taste",
    saleId: "sale-hist-002",
    date: "2026-11-04T17:15:00.000Z"
  },
  {
    id: "utang-002",
    customerId: "cust-002",
    type: "CHARGE",
    amount: 550.00,
    balanceAfter: 550.00,
    description: "Utang: 1.5L Coke, 2 packs Piattos, 1 can Purefoods Corned Beef",
    saleId: "sale-hist-005",
    date: "2026-11-02T19:30:00.000Z"
  },
  {
    id: "utang-003",
    customerId: "cust-002",
    type: "CHARGE",
    amount: 300.00,
    balanceAfter: 850.00,
    description: "Utang dagdag: 4pcs Farm Eggs, 2 Lucky Me Pancit Canton",
    saleId: "sale-hist-007",
    date: "2026-11-04T07:45:00.000Z"
  },
  {
    id: "utang-004",
    customerId: "cust-003",
    type: "CHARGE",
    amount: 350.00,
    balanceAfter: 350.00,
    description: "Utang: Sabon Safeguard, Surf powder, Sunsilk shampoo",
    date: "2026-11-03T11:00:00.000Z"
  },
  {
    id: "utang-005",
    customerId: "cust-003",
    type: "PAYMENT",
    amount: 200.00,
    balanceAfter: 150.00,
    description: "Hulog / Partial payment (Cash)",
    paymentMethod: "Cash",
    date: "2026-11-05T09:30:00.000Z"
  },
  {
    id: "utang-006",
    customerId: "cust-004",
    type: "CHARGE",
    amount: 1100.00,
    balanceAfter: 1100.00,
    description: "Utang: Bigas 10kg, De Lata, Kape, Asukal",
    date: "2026-10-30T16:00:00.000Z"
  }
];

// Sample past sales to give instant vibrant charts & analytics
const defaultSales = [
  {
    id: "sale-hist-001",
    receiptNumber: "VT-20261105-001",
    timestamp: "2026-11-05T07:20:00.000Z",
    items: [
      { productId: "prod-008", name: "Great Taste White Coffee Twin Pack", qty: 2, unitPrice: 16.00, costPrice: 13.00, total: 32.00 },
      { productId: "prod-023", name: "SkyFlakes Crackers (Singles)", qty: 2, unitPrice: 8.50, costPrice: 6.50, total: 17.00 },
      { productId: "prod-020", name: "Fresh Farm Chicken Egg (Medium)", qty: 2, unitPrice: 9.00, costPrice: 7.00, total: 18.00 }
    ],
    subtotal: 67.00,
    discount: 0.00,
    totalAmount: 67.00,
    totalCost: 53.00,
    grossProfit: 14.00,
    paymentMethod: "Cash",
    cashTendered: 100.00,
    change: 33.00,
    cashier: "Ate Baby"
  },
  {
    id: "sale-hist-002",
    receiptNumber: "VT-20261105-002",
    timestamp: "2026-11-05T12:15:00.000Z",
    items: [
      { productId: "prod-018", name: "Sinandomeng Rice (Well-Milled)", qty: 3, unitPrice: 50.00, costPrice: 44.00, total: 150.00 },
      { productId: "prod-004", name: "Century Tuna Flakes in Oil", qty: 2, unitPrice: 45.00, costPrice: 38.00, total: 90.00 },
      { productId: "prod-017", name: "Magic Sarap All-In-One Seasoning", qty: 4, unitPrice: 6.00, costPrice: 4.50, total: 24.00 }
    ],
    subtotal: 264.00,
    discount: 0.00,
    totalAmount: 264.00,
    totalCost: 226.00,
    grossProfit: 38.00,
    paymentMethod: "GCash",
    referenceNumber: "GC-982104192",
    cashier: "Ate Baby"
  },
  {
    id: "sale-hist-003",
    receiptNumber: "VT-20261105-003",
    timestamp: "2026-11-05T15:40:00.000Z",
    items: [
      { productId: "prod-001", name: "Lucky Me! Instant Pancit Canton Kalamansi", qty: 3, unitPrice: 17.00, costPrice: 13.50, total: 51.00 },
      { productId: "prod-020", name: "Fresh Farm Chicken Egg (Medium)", qty: 3, unitPrice: 9.00, costPrice: 7.00, total: 27.00 },
      { productId: "prod-011", name: "Coca-Cola Original 1.5L", qty: 1, unitPrice: 75.00, costPrice: 62.00, total: 75.00 }
    ],
    subtotal: 153.00,
    discount: 3.00, // Merienda round-off
    totalAmount: 150.00,
    totalCost: 123.50,
    grossProfit: 26.50,
    paymentMethod: "Cash",
    cashTendered: 200.00,
    change: 50.00,
    cashier: "Kuya Jun"
  },
  {
    id: "sale-hist-004",
    receiptNumber: "VT-20261106-001",
    timestamp: "2026-11-06T08:10:00.000Z",
    items: [
      { productId: "prod-008", name: "Great Taste White Coffee Twin Pack", qty: 3, unitPrice: 16.00, costPrice: 13.00, total: 48.00 },
      { productId: "prod-023", name: "SkyFlakes Crackers (Singles)", qty: 3, unitPrice: 8.50, costPrice: 6.50, total: 25.50 }
    ],
    subtotal: 73.50,
    discount: 0.00,
    totalAmount: 73.50,
    totalCost: 58.50,
    grossProfit: 15.00,
    paymentMethod: "Cash",
    cashTendered: 100.00,
    change: 26.50,
    cashier: "Ate Baby"
  },
  {
    id: "sale-hist-005",
    receiptNumber: "VT-20261106-002",
    timestamp: "2026-11-06T10:35:00.000Z",
    items: [
      { productId: "prod-019", name: "Dinorado Fragrant Rice", qty: 2, unitPrice: 60.00, costPrice: 52.00, total: 120.00 },
      { productId: "prod-006", name: "Purefoods Corned Beef", qty: 1, unitPrice: 76.00, costPrice: 65.00, total: 76.00 },
      { productId: "prod-020", name: "Fresh Farm Chicken Egg (Medium)", qty: 4, unitPrice: 9.00, costPrice: 7.00, total: 36.00 }
    ],
    subtotal: 232.00,
    discount: 2.00,
    totalAmount: 230.00,
    totalCost: 197.00,
    grossProfit: 33.00,
    paymentMethod: "Cash",
    cashTendered: 500.00,
    change: 270.00,
    cashier: "Kuya Jun"
  }
];

const defaultExpenses = [
  {
    id: "exp-001",
    date: "2026-11-05T14:00:00.000Z",
    category: "Store Supplies",
    description: "Yelo / Tube Ice para sa softdrinks at tubig",
    amount: 50.00,
    paymentMethod: "Cash"
  },
  {
    id: "exp-002",
    date: "2026-11-05T17:30:00.000Z",
    category: "Snacks & Food",
    description: "Merienda ng tindero (pansit at tinapay)",
    amount: 45.00,
    paymentMethod: "Cash"
  },
  {
    id: "exp-003",
    date: "2026-11-06T09:00:00.000Z",
    category: "Pamasahe / Delivery",
    description: "Tricycle fare pamalengke sa Pasig Mega Market",
    amount: 60.00,
    paymentMethod: "Cash"
  }
];

module.exports = {
  defaultStoreSettings,
  defaultProducts,
  defaultCustomers,
  defaultUtangTransactions,
  defaultSales,
  defaultExpenses
};
