// Data structures
let drivers = [];
let vehicles = [];
let cards = [];
let cardTypes = [];
let vehicleTypes = [];
let expirySettings = {};

// Initial data load and setup
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setupEventListeners();
  renderAllData();
});

// Load data from localStorage
function loadData() {
  drivers = JSON.parse(localStorage.getItem('transforge_drivers') || '[]');
  vehicles = JSON.parse(localStorage.getItem('transforge_vehicles') || '[]');
  cards = JSON.parse(localStorage.getItem('transforge_cards') || '[]');
  cardTypes = JSON.parse(localStorage.getItem('transforge_card_types') || '[]');
  vehicleTypes = JSON.parse(localStorage.getItem('transforge_vehicle_types') || '[]');
  expirySettings = JSON.parse(localStorage.getItem('transforge_expiry_settings') || '{}');
  
  // Set default settings if none exist
  if (Object.keys(expirySettings).length === 0) {
    expirySettings = { insuranceNotifyDays: 30, inspectionNotifyDays: 30 };
    saveExpirySettings();
  }

  // Initialize with default data if empty
  if (cardTypes.length === 0) {
    cardTypes = [{ id: 1, name: 'Fuel Card', description: 'For fuel purchases' }];
    saveCardTypes();
  }
  if (vehicleTypes.length === 0) {
    vehicleTypes = [{ id: 1, name: 'Semi-Truck', maxLoad: 20 }];
    saveVehicleTypes();
  }
}

function renderAllData() {
  renderDrivers();
  renderVehicles();
  renderCards();
  renderCardTypes();
  renderVehicleTypes();
  loadExpirySettingsUI();
  
  // This function is in dashboard.html. We call it to update the global stats
  if (window.updateDashboardStats) {
    window.updateDashboardStats();
  }
}

// Setup event listeners
function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      this.classList.add('active');
      const tabId = this.dataset.tab;
      document.getElementById(tabId).classList.add('active');
      
      // Hide drag-and-drop view when switching tabs
      document.getElementById('assignVehiclesContainer').classList.remove('active');
    });
  });

  // Search functionality
  ['driverSearch', 'vehicleSearch'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const tableId = id === 'driverSearch' ? 'driversTable' : 'vehiclesTable';
        const rows = document.querySelectorAll(`#${tableId} tbody tr`);
        rows.forEach(row => {
          const text = row.textContent.toLowerCase();
          row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
      });
    }
  });
}

// ==================== DRIVERS ====================

function renderDrivers() {
  const tbody = document.querySelector('#driversTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (drivers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No drivers found.</td></tr>';
    return;
  }
  
  drivers.forEach(driver => {
    const assignedVehicle = vehicles.find(v => v.driverId === driver.id);
    const assignedCards = cards.filter(c => c.driverId === driver.id);
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${driver.name}</td>
      <td>${driver.phone}</td>
      <td><span class="status-badge status-${driver.status.toLowerCase().replace(' ', '-')}">${driver.status}</span></td>
      <td>${assignedVehicle ? assignedVehicle.licensePlate : 'None'}</td>
      <td>${assignedCards.length}</td>
      <td>
        <button class="btn-icon" onclick="editDriver(${driver.id})"><i class="fas fa-edit"></i></button>
        <button class="btn-icon" onclick="deleteDriver(${driver.id})"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

function showAddDriverForm() {
  const formHtml = `
    <div class="form-group"><label for="driverName">Driver Name</label><input type="text" id="driverName" class="form-control" required></div>
    <div class="form-group"><label for="driverPhone">Phone Number</label><input type="tel" id="driverPhone" class="form-control" required></div>
    <div class="form-group"><label for="driverStatus">Status</label>
      <select id="driverStatus" class="form-control">
        <option value="Available">Available</option>
        <option value="On Delivery">On Delivery</option>
        <option value="On Leave">On Leave</option>
      </select>
    </div>
    <button class="btn" onclick="addDriver()"><i class="fas fa-save"></i> Save Driver</button>`;
  openModal('Add New Driver', formHtml);
}

function addDriver() {
  const name = document.getElementById('driverName').value;
  const phone = document.getElementById('driverPhone').value;
  const status = document.getElementById('driverStatus').value;
  if (!name || !phone) { alert('Please fill all required fields'); return; }
  const newDriver = { id: Date.now(), name, phone, status };
  drivers.push(newDriver);
  saveDrivers();
  closeModal();
  renderDrivers();
  if (window.updateDashboardStats) { window.updateDashboardStats(); }
}

function editDriver(id) {
  const driver = drivers.find(d => d.id === id);
  if (!driver) return;
  const formHtml = `
    <div class="form-group"><label for="driverName">Driver Name</label><input type="text" id="driverName" class="form-control" value="${driver.name}" required></div>
    <div class="form-group"><label for="driverPhone">Phone Number</label><input type="tel" id="driverPhone" class="form-control" value="${driver.phone}" required></div>
    <div class="form-group"><label for="driverStatus">Status</label>
      <select id="driverStatus" class="form-control">
        <option value="Available" ${driver.status === 'Available' ? 'selected' : ''}>Available</option>
        <option value="On Delivery" ${driver.status === 'On Delivery' ? 'selected' : ''}>On Delivery</option>
        <option value="On Leave" ${driver.status === 'On Leave' ? 'selected' : ''}>On Leave</option>
      </select>
    </div>
    <div class="form-group"><label>Assigned Cards</label><div id="assignedCardsContainer">${getAssignedCardsHtml(id)}</div>
      <button type="button" class="btn" onclick="showAddCardToDriverForm(${id})"><i class="fas fa-plus"></i> Add Card</button>
    </div>
    <button class="btn" onclick="updateDriver(${id})"><i class="fas fa-save"></i> Update Driver</button>`;
  openModal(`Edit Driver: ${driver.name}`, formHtml);
}

function getAssignedCardsHtml(driverId) {
  const assignedCards = cards.filter(c => c.driverId === driverId);
  if (assignedCards.length === 0) return '<p>No cards assigned.</p>';
  return `<ul class="assigned-cards-list">${assignedCards.map(card => {
    const cardType = cardTypes.find(ct => ct.id === card.typeId);
    return `<li>${cardType ? cardType.name : 'Unknown'} - ${card.cardNumber}<button class="btn-icon" onclick="removeCardFromDriver(${card.id}, ${driverId})"><i class="fas fa-times"></i></button></li>`;
  }).join('')}</ul>`;
}

function updateDriver(id) {
  const name = document.getElementById('driverName').value;
  const phone = document.getElementById('driverPhone').value;
  const status = document.getElementById('driverStatus').value;
  if (!name || !phone) { alert('Please fill all required fields'); return; }
  const index = drivers.findIndex(d => d.id === id);
  if (index !== -1) {
    drivers[index] = { ...drivers[index], name, phone, status };
    saveDrivers();
    closeModal();
    renderDrivers();
  }
}

function deleteDriver(id) {
  if (!confirm('Are you sure you want to delete this driver?')) return;
  if (vehicles.some(v => v.driverId === id)) {
    alert('This driver has an assigned vehicle. Please reassign it first.');
    return;
  }
  cards = cards.filter(c => c.driverId !== id);
  drivers = drivers.filter(d => d.id !== id);
  saveDrivers();
  saveCards();
  renderAllData();
}

function saveDrivers() {
  localStorage.setItem('transforge_drivers', JSON.stringify(drivers));
}


// ==================== VEHICLES ====================

function renderVehicles() {
  const tbody = document.querySelector('#vehiclesTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (vehicles.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">No vehicles found.</td></tr>';
    return;
  }
  vehicles.forEach(vehicle => {
    const vehicleType = vehicleTypes.find(vt => vt.id === vehicle.typeId);
    const assignedDriver = drivers.find(d => d.id === vehicle.driverId);
    const insuranceStatus = getExpiryStatus(vehicle.insuranceExpiry, expirySettings.insuranceNotifyDays);
    const inspectionStatus = getExpiryStatus(vehicle.inspectionExpiry, expirySettings.inspectionNotifyDays);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${vehicle.licensePlate}</td>
      <td>${vehicleType ? vehicleType.name : 'Unknown'}</td>
      <td>${vehicle.maxLoad} tons</td>
      <td class="${insuranceStatus.class}">${formatDate(vehicle.insuranceExpiry)} ${insuranceStatus.label}</td>
      <td class="${inspectionStatus.class}">${formatDate(vehicle.inspectionExpiry)} ${inspectionStatus.label}</td>
      <td>${assignedDriver ? assignedDriver.name : 'Unassigned'}</td>
      <td>
        <button class="btn-icon" onclick="editVehicle(${vehicle.id})"><i class="fas fa-edit"></i></button>
        <button class="btn-icon" onclick="deleteVehicle(${vehicle.id})"><i class="fas fa-trash"></i></button>
      </td>`;
    tbody.appendChild(row);
  });
}

function showAddVehicleForm() {
  if (vehicleTypes.length === 0) { alert('Please add at least one vehicle type first.'); return; }
  const formHtml = `
    <div class="form-group"><label for="licensePlate">License Plate</label><input type="text" id="licensePlate" class="form-control" required></div>
    <div class="form-group"><label for="vehicleTypeId">Vehicle Type</label>
      <select id="vehicleTypeId" class="form-control" onchange="updateMaxLoad()">
        ${vehicleTypes.map(vt => `<option value="${vt.id}" data-max-load="${vt.maxLoad}">${vt.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label for="maxLoad">Max Load (tons)</label><input type="number" id="maxLoad" class="form-control" min="0" step="0.1" required></div>
    <div class="form-group"><label for="insuranceExpiry">Insurance Expiry Date</label><input type="date" id="insuranceExpiry" class="form-control" required></div>
    <div class="form-group"><label for="inspectionExpiry">Vehicle Inspection Expiry Date</label><input type="date" id="inspectionExpiry" class="form-control" required></div>
    <div class="form-group"><label for="driverId">Assign to Driver (optional)</label>
      <select id="driverId" class="form-control">
        <option value="">-- Unassigned --</option>
        ${drivers.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
      </select>
    </div>
    <button class="btn" onclick="addVehicle()"><i class="fas fa-save"></i> Save Vehicle</button>`;
  openModal('Add New Vehicle', formHtml);
  updateMaxLoad();
}

function updateMaxLoad() {
  const select = document.getElementById('vehicleTypeId');
  const option = select.options[select.selectedIndex];
  if (option) { document.getElementById('maxLoad').value = option.dataset.maxLoad; }
}

function addVehicle() {
  const licensePlate = document.getElementById('licensePlate').value;
  const typeId = parseInt(document.getElementById('vehicleTypeId').value);
  const maxLoad = parseFloat(document.getElementById('maxLoad').value);
  const insuranceExpiry = document.getElementById('insuranceExpiry').value;
  const inspectionExpiry = document.getElementById('inspectionExpiry').value;
  const driverId = document.getElementById('driverId').value ? parseInt(document.getElementById('driverId').value) : null;
  if (!licensePlate || !typeId || isNaN(maxLoad) || !insuranceExpiry || !inspectionExpiry) { alert('Please fill all required fields'); return; }
  const newVehicle = { id: Date.now(), licensePlate, typeId, maxLoad, insuranceExpiry, inspectionExpiry, driverId };
  vehicles.push(newVehicle);
  saveVehicles();
  closeModal();
  renderVehicles();
  if (window.updateDashboardStats) { window.updateDashboardStats(); }
}

function deleteVehicle(id) {
  if (!confirm('Are you sure you want to delete this vehicle?')) return;
  vehicles = vehicles.filter(v => v.id !== id);
  saveVehicles();
  renderVehicles();
  if (window.updateDashboardStats) { window.updateDashboardStats(); }
}

function saveVehicles() {
  localStorage.setItem('transforge_vehicles', JSON.stringify(vehicles));
}


// ==================== CARDS ====================

function renderCards() {
  const tbody = document.querySelector('#cardsTable tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (cards.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">No cards found.</td></tr>';
    return;
  }
  cards.forEach(card => {
    const cardType = cardTypes.find(ct => ct.id === card.typeId);
    const assignedDriver = drivers.find(d => d.id === card.driverId);
    const expiryStatus = getExpiryStatus(card.expiryDate);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${cardType ? cardType.name : 'Unknown'}</td>
      <td>${card.cardNumber}</td>
      <td class="${expiryStatus.class}">${formatDate(card.expiryDate)} ${expiryStatus.label}</td>
      <td>${assignedDriver ? assignedDriver.name : 'Unassigned'}</td>
      <td>
        <button class="btn-icon" onclick="editCard(${card.id})"><i class="fas fa-edit"></i></button>
        <button class="btn-icon" onclick="deleteCard(${card.id})"><i class="fas fa-trash"></i></button>
      </td>`;
    tbody.appendChild(row);
  });
}

function showAddCardToDriverForm(driverId) {
  if (cardTypes.length === 0) { alert('Please add card types first.'); return; }
  const formHtml = `
    <div class="form-group"><label for="cardTypeId">Card Type</label>
      <select id="cardTypeId" class="form-control">
        ${cardTypes.map(ct => `<option value="${ct.id}">${ct.name}</option>`).join('')}
      </select>
    </div>
    <div class="form-group"><label for="cardNumber">Card Number</label><input type="text" id="cardNumber" class="form-control" required></div>
    <div class="form-group"><label for="cardPin">PIN (optional)</label><input type="password" id="cardPin" class="form-control"></div>
    <div class="form-group"><label for="cardExpiry">Expiry Date</label><input type="date" id="cardExpiry" class="form-control" required></div>
    <button class="btn" onclick="addCardToDriver(${driverId})"><i class="fas fa-save"></i> Add Card</button>`;
  openModal('Add Card to Driver', formHtml);
}

function addCardToDriver(driverId) {
  const typeId = parseInt(document.getElementById('cardTypeId').value);
  const cardNumber = document.getElementById('cardNumber').value;
  const pin = document.getElementById('cardPin').value;
  const expiryDate = document.getElementById('cardExpiry').value;
  if (!typeId || !cardNumber || !expiryDate) { alert('Please fill all required fields'); return; }
  const newCard = { id: Date.now(), typeId, cardNumber, pin, expiryDate, driverId };
  cards.push(newCard);
  saveCards();
  closeModal();
  renderCards();
  // We need to re-render the driver's modal content to show the new card
  editDriver(driverId);
}

function removeCardFromDriver(cardId, driverId) {
  if (!confirm('Are you sure you want to remove this card?')) return;
  cards = cards.filter(c => c.id !== cardId);
  saveCards();
  editDriver(driverId);
  renderCards();
}

function renderCardTypes() {
  const tbody = document.querySelector('#cardTypesTable tbody');
  if (!tbody) return;
  tbody.innerHTML = cardTypes.length > 0 ?
    cardTypes.map(type => `
      <tr>
        <td>${type.name}</td>
        <td>${type.description}</td>
        <td>
          <button class="btn-icon" onclick="editCardType(${type.id})"><i class="fas fa-edit"></i></button>
          <button class="btn-icon" onclick="deleteCardType(${type.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`).join('') :
    '<tr><td colspan="3" class="text-center">No card types found.</td></tr>';
}

function showAddCardTypeForm() {
  const formHtml = `
    <div class="form-group"><label for="cardTypeName">Card Type Name</label><input type="text" id="cardTypeName" class="form-control" required></div>
    <div class="form-group"><label for="cardTypeDescription">Description</label><textarea id="cardTypeDescription" class="form-control" rows="3"></textarea></div>
    <button class="btn" onclick="addCardType()"><i class="fas fa-save"></i> Save Card Type</button>`;
  openModal('Add New Card Type', formHtml);
}

function addCardType() {
  const name = document.getElementById('cardTypeName').value;
  const description = document.getElementById('cardTypeDescription').value;
  if (!name) { alert('Please enter a card type name'); return; }
  const newCardType = { id: Date.now(), name, description };
  cardTypes.push(newCardType);
  saveCardTypes();
  closeModal();
  renderCardTypes();
}

function deleteCardType(id) {
  if (!confirm('Are you sure you want to delete this card type?')) return;
  if (cards.some(c => c.typeId === id)) {
    alert('This card type is in use. Please remove or reassign the cards first.');
    return;
  }
  cardTypes = cardTypes.filter(ct => ct.id !== id);
  saveCardTypes();
  renderCardTypes();
}

function saveCards() {
  localStorage.setItem('transforge_cards', JSON.stringify(cards));
}
function saveCardTypes() {
  localStorage.setItem('transforge_card_types', JSON.stringify(cardTypes));
}

// ==================== SETTINGS (VEHICLE TYPES & EXPIRY) ====================

function renderVehicleTypes() {
  const tbody = document.querySelector('#vehicleTypesTable tbody');
  if (!tbody) return;
  tbody.innerHTML = vehicleTypes.length > 0 ?
    vehicleTypes.map(type => `
      <tr>
        <td>${type.name}</td>
        <td>${type.maxLoad} tons</td>
        <td>
          <button class="btn-icon" onclick="editVehicleType(${type.id})"><i class="fas fa-edit"></i></button>
          <button class="btn-icon" onclick="deleteVehicleType(${type.id})"><i class="fas fa-trash"></i></button>
        </td>
      </tr>`).join('') :
    '<tr><td colspan="3" class="text-center">No vehicle types found.</td></tr>';
}

function showAddVehicleTypeForm() {
  const formHtml = `
    <div class="form-group"><label for="vehicleTypeName">Vehicle Type Name</label><input type="text" id="vehicleTypeName" class="form-control" required></div>
    <div class="form-group"><label for="vehicleTypeMaxLoad">Max Load (tons)</label><input type="number" id="vehicleTypeMaxLoad" class="form-control" min="0" step="0.1" required></div>
    <button class="btn" onclick="addVehicleType()"><i class="fas fa-save"></i> Save Vehicle Type</button>`;
  openModal('Add New Vehicle Type', formHtml);
}

function addVehicleType() {
  const name = document.getElementById('vehicleTypeName').value;
  const maxLoad = parseFloat(document.getElementById('vehicleTypeMaxLoad').value);
  if (!name || isNaN(maxLoad)) { alert('Please fill all required fields'); return; }
  const newType = { id: Date.now(), name, maxLoad };
  vehicleTypes.push(newType);
  saveVehicleTypes();
  closeModal();
  renderVehicleTypes();
  renderVehicles(); // Rerender vehicles to show new type
}

function deleteVehicleType(id) {
  if (!confirm('Are you sure you want to delete this vehicle type?')) return;
  if (vehicles.some(v => v.typeId === id)) {
    alert('This vehicle type is in use. Please remove or reassign the vehicles first.');
    return;
  }
  vehicleTypes = vehicleTypes.filter(vt => vt.id !== id);
  saveVehicleTypes();
  renderVehicleTypes();
}

function saveVehicleTypes() {
  localStorage.setItem('transforge_vehicle_types', JSON.stringify(vehicleTypes));
}

function loadExpirySettingsUI() {
  const insuranceInput = document.getElementById('insuranceNotifyDays');
  const inspectionInput = document.getElementById('inspectionNotifyDays');
  if (insuranceInput && inspectionInput) {
    insuranceInput.value = expirySettings.insuranceNotifyDays;
    inspectionInput.value = expirySettings.inspectionNotifyDays;
  }
}

function saveExpirySettings() {
  expirySettings = {
    insuranceNotifyDays: parseInt(document.getElementById('insuranceNotifyDays').value) || 30,
    inspectionNotifyDays: parseInt(document.getElementById('inspectionNotifyDays').value) || 30,
  };
  localStorage.setItem('transforge_expiry_settings', JSON.stringify(expirySettings));
  alert('Expiry notification settings saved!');
  renderVehicles(); // Refresh the table to show updated warnings
}

// ==================== DRAG & DROP ====================

function showAssignVehiclesMode() {
  document.querySelectorAll('.tab-content.active').forEach(tab => tab.classList.remove('active'));
  document.getElementById('assignVehiclesContainer').classList.add('active');
  renderDragAndDropLists();
}

function hideAssignVehiclesMode() {
  document.getElementById('assignVehiclesContainer').classList.remove('active');
  const driversTab = document.querySelector('[data-tab="drivers-tab"]');
  driversTab.classList.add('active');
  document.getElementById('drivers-tab').classList.add('active');
}

function renderDragAndDropLists() {
  const availableVehiclesList = document.getElementById('availableVehiclesList');
  const driversAssignmentList = document.getElementById('driversAssignmentList');
  if (!availableVehiclesList || !driversAssignmentList) return;
  
  availableVehiclesList.innerHTML = '';
  driversAssignmentList.innerHTML = '';
  
  const availableVehicles = vehicles.filter(v => !v.driverId);
  const assignedVehicles = vehicles.filter(v => v.driverId);
  
  // Render available vehicles
  if (availableVehicles.length > 0) {
    availableVehicles.forEach(vehicle => {
      const item = document.createElement('div');
      item.className = 'draggable-item';
      item.setAttribute('draggable', 'true');
      item.setAttribute('ondragstart', `drag(event)`);
      item.dataset.vehicleId = vehicle.id;
      item.textContent = vehicle.licensePlate;
      availableVehiclesList.appendChild(item);
    });
  } else {
    availableVehiclesList.innerHTML = '<p class="text-center" style="color:var(--gray);">All vehicles are assigned.</p>';
  }
  
  // Render drivers with their assigned vehicles
  drivers.forEach(driver => {
    const driverDiv = document.createElement('div');
    driverDiv.className = 'driver-droppable-card';
    driverDiv.innerHTML = `
      <h4>${driver.name}</h4>
      <div class="droppable-area" ondrop="drop(event, this)" ondragover="allowDrop(event)" data-driver-id="${driver.id}">
        <p style="color:var(--gray);">Drop vehicle here</p>
      </div>`;
    
    // Add vehicle if already assigned
    const assignedVehicle = assignedVehicles.find(v => v.driverId === driver.id);
    if (assignedVehicle) {
      const item = document.createElement('div');
      item.className = 'draggable-item';
      item.setAttribute('draggable', 'true');
      item.setAttribute('ondragstart', `drag(event)`);
      item.dataset.vehicleId = assignedVehicle.id;
      item.textContent = assignedVehicle.licensePlate;
      driverDiv.querySelector('.droppable-area').innerHTML = ''; // Clear placeholder
      driverDiv.querySelector('.droppable-area').appendChild(item);
    }
    driversAssignmentList.appendChild(driverDiv);
  });
}

function allowDrop(event) {
  event.preventDefault();
}

function drag(event) {
  event.dataTransfer.setData("text", event.target.dataset.vehicleId);
}

function drop(event, target) {
  event.preventDefault();
  const vehicleId = parseInt(event.dataTransfer.getData("text"));
  const driverId = target.dataset.driverId ? parseInt(target.dataset.driverId) : null;
  
  const vehicleIndex = vehicles.findIndex(v => v.id === vehicleId);
  if (vehicleIndex === -1) return;
  
  // Check if target has a vehicle and if we're not dropping it back on its owner
  const currentAssignedVehicle = vehicles.find(v => v.driverId === driverId);
  if (currentAssignedVehicle && currentAssignedVehicle.id !== vehicleId && driverId !== null) {
    alert('This driver already has an assigned vehicle. Please unassign it first.');
    return;
  }
  
  // Update the vehicle's driverId
  vehicles[vehicleIndex].driverId = driverId;
  saveVehicles();
  renderDragAndDropLists();
  renderVehicles();
  renderDrivers();
  if (window.updateDashboardStats) { window.updateDashboardStats(); }
}

// ==================== UTILITIES ====================

function getExpiryStatus(dateStr, daysToWarn = 30) {
  if (!dateStr) return { label: '', class: '' };
  const expiryDate = new Date(dateStr);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
  if (daysUntilExpiry < 0) return { label: '(EXPIRED)', class: 'text-danger' };
  if (daysUntilExpiry <= daysToWarn) return { label: `(Expires in ${daysUntilExpiry} days)`, class: 'text-warning' };
  return { label: '', class: '' };
}

function formatDate(dateStr) {
  if (!dateStr) return 'Not set';
  const date = new Date(dateStr);
  return date.toLocaleDateString();
}
