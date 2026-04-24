const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'db.json');

if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify({
    categories: [
      { id: 1, name: "Real Estate", slug: "real-estate" },
      { id: 2, name: "Vehicles", slug: "vehicles" },
      { id: 3, name: "Electronics", slug: "electronics" },
      { id: 4, name: "Services", slug: "services" },
      { id: 5, name: "Jobs", slug: "jobs" }
    ],
    cities: [
      { id: 1, name: "New York" },
      { id: 2, name: "Los Angeles" },
      { id: 3, name: "Chicago" },
      { id: 4, name: "Houston" },
      { id: 5, name: "Phoenix" }
    ],
    users: [],
    ads: [],
    payments: []
  }, null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function saveDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

class QueryBuilder {
  constructor(table) {
    this.table = table;
    this._select = '*';
    this._filters = [];
    this._order = null;
    this._action = 'select'; // select, insert, update, delete
    this._payload = null;
    this._single = false;
    this._maybeSingle = false;
  }

  select(cols = '*') {
    this._select = cols;
    return this;
  }

  eq(col, val) {
    this._filters.push({ type: 'eq', col, val });
    return this;
  }
  
  order(col, options = {}) {
    this._order = { col, ascending: options.ascending !== false };
    return this;
  }

  insert(data) {
    this._action = 'insert';
    this._payload = Array.isArray(data) ? data : [data];
    return this;
  }

  update(data) {
    this._action = 'update';
    this._payload = data;
    return this;
  }

  delete() {
    this._action = 'delete';
    return this;
  }

  single() {
    this._single = true;
    return this;
  }

  maybeSingle() {
    this._maybeSingle = true;
    return this;
  }

  async _execute() {
    const db = readDB();
    let tableData = db[this.table] || [];

    if (this._action === 'select') {
      let result = [...tableData];
      
      // Apply filters
      for (const f of this._filters) {
        if (f.type === 'eq') {
          // Type coercion because sometimes ID is string/int
          result = result.filter(item => String(item[f.col]) === String(f.val));
        }
      }

      // Apply order
      if (this._order) {
        result.sort((a, b) => {
          if (a[this._order.col] < b[this._order.col]) return this._order.ascending ? -1 : 1;
          if (a[this._order.col] > b[this._order.col]) return this._order.ascending ? 1 : -1;
          return 0;
        });
      }

      // Format joins if needed (simple mock for ads -> category, city, user)
      if (this._select && this._select.includes('category:categories') && this.table === 'ads') {
         result = result.map(item => ({
            ...item,
            category: db.categories.find(c => String(c.id) === String(item.category_id)) || null,
            city: db.cities.find(c => String(c.id) === String(item.city_id)) || null,
            user: db.users.find(u => String(u.id) === String(item.user_id)) || null
         }));
      }

      if (this._single) return { data: result[0] || null, error: result.length === 0 ? { message: 'Row not found' } : null };
      if (this._maybeSingle) return { data: result[0] || null, error: null };
      return { data: result, error: null };
    }

    if (this._action === 'insert') {
      const newItems = this._payload.map(item => ({ id: uuidv4(), created_at: new Date().toISOString(), ...item }));
      db[this.table] = [...tableData, ...newItems];
      saveDB(db);
      const resData = this._single ? newItems[0] : newItems;
      return { data: resData, error: null };
    }

    if (this._action === 'update') {
       let updatedCount = 0;
       let updatedItems = [];
       db[this.table] = tableData.map(item => {
          let match = true;
          for (const f of this._filters) {
            if (f.type === 'eq' && String(item[f.col]) !== String(f.val)) match = false;
          }
          if (match) {
             const updated = { ...item, ...this._payload };
             updatedItems.push(updated);
             updatedCount++;
             return updated;
          }
          return item;
       });
       saveDB(db);
       const resData = this._single || this._maybeSingle ? updatedItems[0] || null : updatedItems;
       return { data: resData, error: null };
    }

    if (this._action === 'delete') {
       db[this.table] = tableData.filter(item => {
          let match = true;
          for (const f of this._filters) {
            if (f.type === 'eq' && String(item[f.col]) !== String(f.val)) match = false;
          }
          return !match; // exclude matches
       });
       saveDB(db);
       return { data: null, error: null };
    }
  }

  then(onFulfilled, onRejected) {
    return this._execute().then(onFulfilled, onRejected);
  }
}

const mockSupabase = {
  from: (table) => new QueryBuilder(table)
};

module.exports = { supabase: mockSupabase };
