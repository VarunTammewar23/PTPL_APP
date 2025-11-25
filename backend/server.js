// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- Polling & cache setup ---
const REFRESH_MS = Number(process.env.REFRESH_MS || 2000);
const pool = require('./db'); // your mysql2 pool

// In-memory caches
const cache = {
  customers: { data: null, lastUpdated: 0 },
  // recipes per customer_code: { '1001': { data: [...], lastUpdated: ts }, ... }
  recipesByCustomer: {}
};

// Safe generic fetch helper
async function fetchAndCacheCustomers() {
  try {
    const [rows] = await pool.query('SELECT sr_no AS id, customer_name, customer_code FROM customer_master ORDER BY customer_name');
    cache.customers.data = rows;
    cache.customers.lastUpdated = Date.now();
    // console.log('customers cache refreshed', rows.length);
  } catch (err) {
    console.error('Error refreshing customers cache:', err.message || err);
    // keep old cache if present
  }
}

async function fetchAndCacheRecipesFor(customerCode) {
  if (!customerCode) return;
  try {
    const [rows] = await pool.query(
      'SELECT sr_no AS recipe_id, recipe_name, customer_code FROM recipe_list WHERE customer_code = ? ORDER BY recipe_name',
      [customerCode]
    );
    cache.recipesByCustomer[customerCode] = {
      data: rows,
      lastUpdated: Date.now()
    };
    // console.log(`recipes cache for ${customerCode} refreshed (${rows.length})`);
  } catch (err) {
    console.error(`Error refreshing recipes cache for ${customerCode}:`, err.message || err);
  }
}

// Initial immediate refresh
(async function initialRefresh() {
  await fetchAndCacheCustomers();
  // Optionally pre-cache recipes for known customer codes (if any)
  if (cache.customers.data && cache.customers.data.length) {
    for (const c of cache.customers.data) {
      // you can choose to pre-cache all customers' recipes; comment out to lazy-load
      await fetchAndCacheRecipesFor(c.customer_code);
    }
  }
})();

// Polling loop: refresh customers every REFRESH_MS and recipes as needed
let pollingHandle = null;
function startPolling() {
  if (pollingHandle) return;
  pollingHandle = setInterval(async () => {
    // refresh customers
    await fetchAndCacheCustomers();

    // refresh recipes for cached customer codes
    const codes = Object.keys(cache.recipesByCustomer);
    // refresh only those the server already cached (lazy strategy)
    for (const code of codes) {
      await fetchAndCacheRecipesFor(code);
    }
    // NOTE: if you want to refresh all customers' recipes proactively, do:
    // if (cache.customers.data) for (const c of cache.customers.data) await fetchAndCacheRecipesFor(c.customer_code);

  }, REFRESH_MS);
  console.log(`Started polling every ${REFRESH_MS}ms`);
}

function stopPolling() {
  if (!pollingHandle) return;
  clearInterval(pollingHandle);
  pollingHandle = null;
  console.log('Polling stopped');
}

// Start polling on server startup
startPolling();

// Clean up on process exit
process.on('SIGINT', async () => {
  console.log('SIGINT received — shutting down polling and pool...');
  stopPolling();
  try { await pool.end(); } catch(e) {}
  process.exit(0);
});
process.on('SIGTERM', async () => {
  console.log('SIGTERM received — shutting down polling and pool...');
  stopPolling();
  try { await pool.end(); } catch(e) {}
  process.exit(0);
});


// Health check
app.get('/', (req, res) => {
  res.json({ ok: true });
});

// ✅ Login
app.post('/login', async (req, res) => {
  const { customer_code } = req.body;
  if (!customer_code) return res.status(400).json({ error: 'customer_code required' });

  try {
    const [rows] = await pool.query(
      'SELECT sr_no, customer_name, customer_code FROM customer_master WHERE customer_code = ? LIMIT 1',
      [customer_code]
    );
    if (!rows.length) return res.status(401).json({ error: 'Invalid customer code' });
    res.json({ customer: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

// ✅ Recipes for a customer
app.get('/recipes', async (req, res) => {
  const customerCode = req.query.customer_code;
  if (!customerCode) return res.status(400).json({ error: 'customer_code query param required' });

  const existing = cache.recipesByCustomer[customerCode];
  if (existing && existing.data) {
    return res.json({ recipes: existing.data, cached: true, lastUpdated: existing.lastUpdated });
  }

  // Fallback: fetch now and populate cache
  try {
    const [rows] = await pool.query(
      'SELECT sr_no AS recipe_id, recipe_name, customer_code FROM recipe_list WHERE customer_code = ? ORDER BY recipe_name',
      [customerCode]
    );
    cache.recipesByCustomer[customerCode] = { data: rows, lastUpdated: Date.now() };
    return res.json({ recipes: rows, cached: false });
  } catch (err) {
    console.error('recipes route DB error:', err);
    return res.status(500).json({ error: 'DB error' });
  }
});


// ✅ Recipe details
app.get('/recipes/:id', async (req, res) => {
  const recipeId = Number(req.params.id);
  if (!recipeId) return res.status(400).json({ error: 'Invalid recipe id' });

  try {
    const [recipeRows] = await pool.query(
      'SELECT recipe_name, customer_code FROM recipe_list WHERE sr_no = ? LIMIT 1',
      [recipeId]
    );
    if (!recipeRows.length) return res.status(404).json({ error: 'Recipe not found' });

    const recipeName = recipeRows[0].recipe_name;
    const [params] = await pool.query(
      'SELECT parameter_no, section, parameter, value_01, unit FROM recipe_master WHERE recipe_name = ? ORDER BY parameter_no',
      [recipeName]
    );

    res.json({
      recipe: { recipe_id: recipeId, recipe_name: recipeName, customer_code: recipeRows[0].customer_code },
      params,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'DB error' });
  }
});

app.get('/customers', async (req, res) => {
  if (cache.customers.data) {
    return res.json({ customers: cache.customers.data, cached: true, lastUpdated: cache.customers.lastUpdated });
  }
  // fallback: query DB once
  try {
    const [rows] = await pool.query('SELECT sr_no AS id, customer_name, customer_code FROM customer_master ORDER BY customer_name');
    return res.json({ customers: rows, cached: false });
  } catch (err) {
    console.error('customers route DB error:', err);
    return res.status(500).json({ error: 'DB error' });
  }
});

app.get('/recipes/:id/download', async (req, res) => {
  const recipeId = Number(req.params.id);
  if (!recipeId) {
    return res.status(400).json({ error: 'Invalid recipe id' });
  }

  try {
    // 1️⃣ Fetch recipe details
    const [recipeRows] = await pool.query(
      'SELECT recipe_name, customer_code FROM recipe_list WHERE sr_no = ? LIMIT 1',
      [recipeId]
    );

    if (!recipeRows.length) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    const recipeName = recipeRows[0].recipe_name;

    // 2️⃣ Fetch recipe parameters
    const [params] = await pool.query(
      'SELECT parameter_no, section, parameter, value_01, unit FROM recipe_master WHERE recipe_name = ? ORDER BY parameter_no',
      [recipeName]
    );

    // 3️⃣ Create Excel workbook
    const Excel = require('exceljs');
    const workbook = new Excel.Workbook();
    const sheet = workbook.addWorksheet('Recipe Parameters');

    // 4️⃣ Add header row
    sheet.addRow(['Parameter No', 'Section', 'Parameter', 'Value', 'Unit']);

    // 5️⃣ Add data rows
    params.forEach(row => {
      sheet.addRow([
        row.parameter_no,
        row.section,
        row.parameter,
        row.value_01,
        row.unit
      ]);
    });

    // 6️⃣ Set header formatting
    sheet.getRow(1).font = { bold: true };

    // 7️⃣ Prepare file for download
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${recipeName.replace(/ /g, '_')}.xlsx"`
    );
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

    // 8️⃣ Write workbook to response
    await workbook.xlsx.write(res);

    res.end();

  } catch (err) {
    console.error('Excel download error:', err);
    res.status(500).json({ error: 'Failed to generate Excel' });
  }
});

// 📌 Upload Excel and insert rows into MySQL
app.post("/api/upload-excel", async (req, res) => {
  const rows = req.body.rows;

  try {
    for (const r of rows) {
      await pool.query(
        "INSERT INTO recipe_master (section, parameter_no, parameter, value_01, unit, recipe_name) VALUES (?, ?, ?, ?, ?, ?)",
        [r.section, r.parameter_no, r.parameter, r.value_01, r.unit, r.recipe_name]
      );
    }

    res.json({ success: true, message: "Excel imported successfully" });
  } catch (e) {
    console.error(e);
    res.json({ success: false, error: e });
  }
});


// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
