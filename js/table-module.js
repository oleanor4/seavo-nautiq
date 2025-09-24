class InventoryTable {
  constructor(config) {
    this.config = {
      storageKey: config.storageKey,
      columns: config.columns,
      pageTitle: config.pageTitle,
      features: {
        images: config.features?.images || false,
        expiry: config.features?.expiry || false,
        colors: config.features?.colors || true,
        secondaryTable: config.features?.secondaryTable || false,
        ...config.features
      },
      secondaryTableConfig: config.secondaryTableConfig || null
    };
    
    this.data = JSON.parse(localStorage.getItem(this.config.storageKey)) || {};
    this.activeCategory = Object.keys(this.data)[0] || "Standard";
    this.isGlobalView = false;
    
    // Initialize secondary table data if needed
    if (this.config.features.secondaryTable) {
      const secondaryKey = this.config.storageKey + "_secondary";
      this.secondaryData = JSON.parse(localStorage.getItem(secondaryKey)) || {};
    }
  }

  init() {
    this.updateCategories();
    this.showCategory();
    
    if (this.config.features.secondaryTable) {
      this.showSecondaryTable();
    }
  }

  showCategory() {
    const content = document.getElementById("content");
    content.innerHTML = "";
    
    const table = this.buildMainTable();
    content.appendChild(table);
    
    if (this.config.features.secondaryTable) {
      const secondaryTable = this.buildSecondaryTable();
      content.appendChild(secondaryTable);
    }
  }

  buildMainTable() {
    const table = document.createElement("table");
    const headers = this.config.columns.map(col => `<th>${col.header}</th>`).join('');
    
    table.innerHTML = `
      <thead>
        <tr>${headers}</tr>
      </thead>
      <tbody></tbody>
    `;
    
    const tbody = table.querySelector("tbody");
    this.populateMainTableRows(tbody);
    
    return table;
  }

  buildSecondaryTable() {
    if (!this.config.secondaryTableConfig) return null;
    
    const wrapper = document.createElement("div");
    wrapper.innerHTML = `
      <h3 style="color: var(--accent); margin: 40px 0 20px 0; text-align: center;">
        ${this.config.secondaryTableConfig.title}
      </h3>
    `;
    
    const table = document.createElement("table");
    table.className = "secondary-table";
    
    const headers = this.config.secondaryTableConfig.columns
      .map(col => `<th>${col.header}</th>`).join('');
    
    table.innerHTML = `
      <thead>
        <tr>${headers}</tr>
      </thead>
      <tbody></tbody>
    `;
    
    const tbody = table.querySelector("tbody");
    this.populateSecondaryTableRows(tbody);
    
    wrapper.appendChild(table);
    return wrapper;
  }

  createDataCell(row, column, index) {
  const td = document.createElement("td");
  
  switch (column.type) {
    case 'image':
      td.innerHTML = this.createImageCell(row, column.key, index);
      break;
    case 'expiry':
      td.innerHTML = this.createExpiryCell(row, column.key, index);
      this.checkExpiryWarning(td, row[column.key]);
      break;
    case 'number':
      td.innerHTML = `<input type="number" value="${row[column.key] || 0}" 
                     oninput="window.tableInstance.updateValue(${index}, '${column.key}', this.value)">`;
      break;
    case 'text':
    default:
      if (this.config.features.colors && column.key === 'product') {
        td.innerHTML = this.createProductCellWithColor(row, index);
      } else {
        td.innerHTML = `<input type="text" value="${row[column.key] || ''}" 
                       oninput="window.tableInstance.updateValue(${index}, '${column.key}', this.value)">`;
      }
      break;
   }
  
    return td;
  }

  createImageCell(row, key, index) {
    const imageData = row[key] || '';
    const hasImage = imageData && imageData.startsWith('data:image');
    
    return `
      <div class="image-upload-container">
        ${hasImage ? 
          `<img src="${imageData}" alt="Product" onclick="window.tableInstance.showImageModal('${imageData}')">` : 
          '<span style="color: #888; font-size: 12px;">No image</span>'
        }
        <input type="file" accept="image/*" style="display:none" 
               onchange="window.tableInstance.handleImageUpload(event, ${index}, '${key}')">
        <button class="upload-btn" onclick="this.previousElementSibling.click()">
          ${hasImage ? 'Change' : 'Upload'}
        </button>
      </div>
    `;
  }

  createExpiryCell(row, key, index) {
    const expiryDate = row[key] || '';
    return `
      <input type="date" value="${expiryDate}" 
             class="expiry-cell"
             oninput="window.tableInstance.updateValue(${index}, '${key}', this.value)">
    `;
  }

  checkExpiryWarning(td, expiryDate) {
    if (!expiryDate) return;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      td.classList.add('expiry-expired');
    } else if (daysUntilExpiry <= 7) {
      td.classList.add('expiry-warning');
    }
  }

  handleImageUpload(event, rowIndex, key) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this.updateValue(rowIndex, key, e.target.result);
      this.showCategory(); // Refresh to show new image
    };
    reader.readAsDataURL(file);
  }

  showImageModal(imageSrc) {
    // Create and show image modal
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:2000;';
    modal.innerHTML = `<img src="${imageSrc}" style="max-width:80%;max-height:80%;border-radius:8px;">`;
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
  }

  updateValue(rowIndex, key, value) {
    if (!this.data[this.activeCategory][rowIndex]) return;
    this.data[this.activeCategory][rowIndex][key] = value;
    this.save();
  }

  save() {
    localStorage.setItem(this.config.storageKey, JSON.stringify(this.data));
  }

  // Copy other methods from your existing code...



  

  populateMainTableRows(tbody) {
    const rows = this.data[this.activeCategory] || [];
    
    rows.forEach((row, index) => {
      if (row.type === "header") {
        this.createHeaderRow(tbody, row, index);
      } else {
        this.createDataRow(tbody, row, index);
      }
    });
  }

  createHeaderRow(tbody, row, index) {
    const tr = document.createElement("tr");
    tr.className = "header-row";
    
    const headerCell = document.createElement("td");
    headerCell.colSpan = this.config.columns.length;
    headerCell.innerHTML = `
      <div class="header-color-chip" style="background-color: ${row.color || '#333'}"></div>
      <span>${row.product || 'Header'}</span>
    `;
    
    if (this.config.features.colors) {
      this.buildHeaderColorPicker(headerCell, row);
    }
    
    tr.appendChild(headerCell);
    tbody.appendChild(tr);
  }

  createDataRow(tbody, row, index) {
    const tr = document.createElement("tr");
    
    // Create cells for each column
    this.config.columns.forEach(column => {
      const td = this.createDataCell(row, column, index);
      tr.appendChild(td);
    });
    
    // Add action cell (move/delete buttons)
    const actionTd = document.createElement("td");
    actionTd.className = "cell-move";
    actionTd.innerHTML = `
      <button onclick="window.tableInstance.moveRow(${index}, -1)">↑</button>
      <button onclick="window.tableInstance.moveRow(${index}, 1)">↓</button>
      <button class="btn-danger" onclick="window.tableInstance.deleteRow(${index})">×</button>
    `;
    tr.appendChild(actionTd);
    
    tbody.appendChild(tr);
  }

  createProductCellWithColor(row, index) {
    const color = row.color || '';
    const rgbValues = this.hexToRgb(color) || '0,0,0';
    
    return `
      <div class="product-color-wrap">
        <input type="text" value="${row.product || ''}" 
               class="product-input large-bold-input" 
               style="--col-rgb: ${rgbValues};"
               oninput="window.tableInstance.updateValue(${index}, 'product', this.value)">
        <div class="color-chip" style="background-color: ${color}" 
             onclick="window.tableInstance.showColorPicker(event, ${index})"></div>
      </div>
    `;
  }

  hexToRgb(hex) {
    if (!hex) return null;
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : 
      null;
  }

  showColorPicker(event, rowIndex) {
    // Simple color picker implementation
    const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff', '#ffffff', '#000000'];
    const picker = document.createElement('div');
    picker.className = 'color-popover';
    picker.style.cssText = `
      position: absolute; background: rgba(0,0,0,0.9); padding: 10px; 
      border-radius: 8px; display: flex; gap: 5px; z-index: 1000;
    `;
    
    colors.forEach(color => {
      const colorOption = document.createElement('div');
      colorOption.className = 'color-option';
      colorOption.style.cssText = `
        width: 24px; height: 24px; background-color: ${color}; 
        border-radius: 4px; cursor: pointer; border: 1px solid #666;
      `;
      colorOption.onclick = () => {
        this.updateValue(rowIndex, 'color', color);
        this.showCategory();
        picker.remove();
      };
      picker.appendChild(colorOption);
    });
    
    // Position picker near clicked element
    const rect = event.target.getBoundingClientRect();
    picker.style.left = rect.left + 'px';
    picker.style.top = (rect.bottom + 5) + 'px';
    
    document.body.appendChild(picker);
    
    // Remove picker when clicking outside
    setTimeout(() => {
      document.addEventListener('click', () => picker.remove(), { once: true });
    }, 100);
  }

  buildHeaderColorPicker(hostTd, row) {
    // Add color picker for header rows
    const colorButton = document.createElement('button');
    colorButton.textContent = 'Color';
    colorButton.style.cssText = 'margin-left: 10px; padding: 2px 8px; font-size: 11px;';
    colorButton.onclick = (e) => {
      e.stopPropagation();
      this.showColorPicker(e, this.data[this.activeCategory].indexOf(row));
    };
    hostTd.appendChild(colorButton);
  }

  populateSecondaryTableRows(tbody) {
    if (!this.secondaryData[this.activeCategory]) {
      this.secondaryData[this.activeCategory] = [];
    }
    
    const rows = this.secondaryData[this.activeCategory];
    
    rows.forEach((row, index) => {
      const tr = document.createElement("tr");
      
      this.config.secondaryTableConfig.columns.forEach(column => {
        const td = document.createElement("td");
        td.innerHTML = `<input type="${column.type === 'number' ? 'number' : 'text'}" 
                       value="${row[column.key] || ''}" 
                       oninput="window.tableInstance.updateSecondaryValue(${index}, '${column.key}', this.value)">`;
        tr.appendChild(td);
      });
      
      // Add action cell
      const actionTd = document.createElement("td");
      actionTd.innerHTML = `<button class="btn-danger" onclick="window.tableInstance.deleteSecondaryRow(${index})">×</button>`;
      tr.appendChild(actionTd);
      
      tbody.appendChild(tr);
    });
    
    // Add "Add Row" button
    const addTr = document.createElement("tr");
    const addTd = document.createElement("td");
    addTd.colSpan = this.config.secondaryTableConfig.columns.length + 1;
    addTd.innerHTML = '<button onclick="window.tableInstance.addSecondaryRow()">+ Add Row</button>';
    addTr.appendChild(addTd);
    tbody.appendChild(addTr);
  }

  updateSecondaryValue(rowIndex, key, value) {
    if (!this.secondaryData[this.activeCategory][rowIndex]) return;
    this.secondaryData[this.activeCategory][rowIndex][key] = value;
    this.save();
  }

  addSecondaryRow() {
    if (!this.secondaryData[this.activeCategory]) {
      this.secondaryData[this.activeCategory] = [];
    }
    
    const newRow = {};
    this.config.secondaryTableConfig.columns.forEach(col => {
      newRow[col.key] = '';
    });
    
    this.secondaryData[this.activeCategory].push(newRow);
    this.save();
    this.showCategory();
  }

  deleteSecondaryRow(index) {
    this.secondaryData[this.activeCategory].splice(index, 1);
    this.save();
    this.showCategory();
  }

  deleteRow(index) {
    this.data[this.activeCategory].splice(index, 1);
    this.save();
    this.showCategory();
  }

  moveRow(index, direction) {
    const rows = this.data[this.activeCategory];
    if (index + direction < 0 || index + direction >= rows.length) return;
    
    [rows[index], rows[index + direction]] = [rows[index + direction], rows[index]];
    this.save();
    this.showCategory();
  }

  addRow() {
    if (!this.data[this.activeCategory]) {
      this.data[this.activeCategory] = [];
    }
    
    const newRow = { type: 'data' };
    this.config.columns.forEach(col => {
      newRow[col.key] = col.type === 'number' ? 0 : '';
    });
    
    this.data[this.activeCategory].push(newRow);
    this.save();
    this.showCategory();
  }

  addHeader() {
    if (!this.data[this.activeCategory]) {
      this.data[this.activeCategory] = [];
    }
    
    const newHeader = {
      type: 'header',
      product: 'New Section',
      color: '#333333'
    };
    
    this.data[this.activeCategory].push(newHeader);
    this.save();
    this.showCategory();
  }

  updateCategories() {
    const container = document.querySelector(".category-slider-office");
    if (!container) return;
    
    container.innerHTML = "";
    
    // Add arrow buttons and category buttons
    container.innerHTML = `
      <button class="arrow" onclick="scrollSlider(-200)">←</button>
      <div id="category-container" style="display: flex; overflow-x: auto;">
        ${Object.keys(this.data).map(cat => 
          `<button class="category-button ${cat === this.activeCategory ? 'active' : ''}" 
                   onclick="window.tableInstance.switchCategory('${cat}')">${cat}</button>`
        ).join('')}
        <button class="add-category" onclick="window.tableInstance.addCategory()">+</button>
      </div>
      <button class="arrow" onclick="scrollSlider(200)">→</button>
    `;
  }

  switchCategory(categoryName) {
    this.activeCategory = categoryName;
    this.updateCategories();
    this.showCategory();
  }

  addCategory() {
    const name = prompt("Enter category name:");
    if (name && !this.data[name]) {
      this.data[name] = [];
      this.activeCategory = name;
      this.save();
      this.updateCategories();
      this.showCategory();
    }
  }

  toggleGlobalView() {
    // Add this method or remove the button
    console.log('Global view not implemented yet');
  }

  showGlobalOverview() { /* Your existing implementation */ }
  generatePDF() { /* Your existing implementation */ }
  generateExcel() { /* Your existing implementation */ }
}



// Make instance globally accessible
window.InventoryTable = InventoryTable;












// Page-specific configuration and initialization

const TABLE_CONFIGS = {
  office: {
    storageKey: "lagerDataV3",
    pageTitle: "Office",
    columns: [
      { key: 'product', header: 'Product/Type', type: 'text' },
      { key: 'start', header: 'Start Qty', type: 'number' },
      { key: 'min', header: 'Min', type: 'number' },
      { key: 'max', header: 'Max', type: 'number' },
      { key: 'order', header: 'Order', type: 'number' },
      { key: 'comment', header: 'Comment', type: 'text' }
    ],
    features: {
      images: false,
      expiry: false,
      colors: true,
      secondaryTable: false
    }
  },

  equipment: {
    storageKey: "equipmentDataV1",
    pageTitle: "Equipment",
    columns: [
      { key: 'product', header: 'Product', type: 'text' },
      { key: 'image', header: 'Image', type: 'image' },
      { key: 'start', header: 'Start Qty', type: 'number' },
      { key: 'min', header: 'Min', type: 'number' },
      { key: 'max', header: 'Max', type: 'number' },
      { key: 'order', header: 'Order', type: 'number' },
      { key: 'comment', header: 'Comment', type: 'text' }
    ],
    features: {
      images: true,
      expiry: false,
      colors: true,
      secondaryTable: false
    }
  },

  provisions: {
    storageKey: "provisionsDataV1",
    pageTitle: "Provisions",
    columns: [
      { key: 'product', header: 'Product', type: 'text' },
      { key: 'start', header: 'Start Qty', type: 'number' },
      { key: 'min', header: 'Min', type: 'number' },
      { key: 'max', header: 'Max', type: 'number' },
      { key: 'expiry', header: 'Expiry Date', type: 'expiry' },
      { key: 'order', header: 'Order', type: 'number' },
      { key: 'comment', header: 'Comment', type: 'text' }
    ],
    features: {
      images: false,
      expiry: true,
      colors: true,
      secondaryTable: false
    }
  },

  partsAndTools: {
    storageKey: "partsToolsDataV1",
    pageTitle: "Parts & Tools",
    columns: [
      { key: 'product', header: 'Product', type: 'text' },
      { key: 'image', header: 'Image', type: 'image' },
      { key: 'start', header: 'Start Qty', type: 'number' },
      { key: 'min', header: 'Min', type: 'number' },
      { key: 'max', header: 'Max', type: 'number' },
      { key: 'order', header: 'Order', type: 'number' },
      { key: 'comment', header: 'Comment', type: 'text' }
    ],
    features: {
      images: true,
      expiry: false,
      colors: true,
      secondaryTable: true
    },
    secondaryTableConfig: {
      title: "Fuel / Lube / Ballast",
      columns: [
        { key: 'product', header: 'Product', type: 'text' },
        { key: 'sg', header: 'SG', type: 'number' },
        { key: 'weight', header: 'Weight (kg)', type: 'number' },
        { key: 'volume', header: 'Volume (L)', type: 'number' },
        { key: 'comment', header: 'Comment', type: 'text' }
      ]
    }
  }
};











