// Data storage (in-memory for demo)
let drivers = [
  {
    id: 1,
    name: "John Doe",
    status: "available",
    vehicleId: 101,
    cardNumber: "1234567890123456",
    cardType: "Fuel Card",
    cardPin: "1234",
    cardExpiry: "2026-10-01"
  },
  {
    id: 2,
    name: "Jane Smith",
    status: "on-delivery",
    vehicleId: 102,
    cardNumber: "1234567890123457",
    cardType: "Expense Card",
    cardPin: "4321",
    cardExpiry: "2025-05-15"
  },
  {
    id: 3,
    name: "Peter Jones",
    status: "on-leave",
    vehicleId: null,
    cardNumber: null,
    cardType: null,
    cardPin: null,
    cardExpiry: null
  }
];

let vehicles = [
  {
    id: 101,
    plate: "ABC-123",
    type: "Box Truck",
    maxLoad: 5,
    assignedDriverId: 1,
    insuranceExpiry: "2025-12-31",
    insuranceNotif: 30,
    inspectionExpiry: "2026-06-30",
    inspectionNotif: 60,
  },
  {
    id: 102,
    plate: "XYZ-456",
    type: "Semi-trailer",
    maxLoad: 25,
    assignedDriverId: 2,
    insuranceExpiry: "2026-03-15",
    insuranceNotif: 30,
    inspectionExpiry: "2025-11-20",
    inspectionNotif: 30,
  },
  {
    id: 103,
    plate: "LMN-789",
    type: "Flatbed Truck",
    maxLoad: 15,
    assignedDriverId: null,
    insuranceExpiry: "2025-10-10",
    insuranceNotif: 90,
    inspectionExpiry: "2025-08-01",
    inspectionNotif: 30,
  },
];

// DOM elements
const driversTableBody = document.getElementById('driversTable').querySelector('tbody');
const vehiclesTableBody = document.getElementById('vehiclesTable').querySelector('tbody');
const assignmentTableBody = document.getElementById('assignmentTableBody');
const availableVehiclesList = document.getElementById('availableVehiclesList');

// Modal and Form Elements
const driverModal = document.getElementById('driverModal');
const vehicleModal = document.getElementById('vehicleModal');
const driverForm = document.getElementById('driverForm');
const vehicleForm = document.getElementById('vehicleForm');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  renderTables();
});

function setupEventListeners() {
  document.getElementById('addDriverBtn').addEventListener('click', () => openDriverModal());
  document.getElementById('addVehicleBtn').addEventListener('click', () => openVehicleModal());
  driverForm.addEventListener('submit', handleDriverFormSubmit);
  vehicleForm.addEventListener('submit', handleVehicleFormSubmit);

  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
      button.classList.add('active');
      document.getElementById(button.dataset.tab).classList.add('active');
      if (button.dataset.tab === 'assignments-tab') {
        renderAssignmentsTab();
      }
    });
  });
}

function renderTables() {
  renderDriversTable();
  renderVehiclesTable();
}

// --- Rendering Functions ---

function renderDriversTable() {
  driversTableBody.innerHTML = '';
  drivers.forEach(driver => {
    const assignedVehicle = vehicles.find(v => v.id === driver.vehicleId);
    const row = driversTableBody.insertRow();
    row.innerHTML = `
      <td>${driver.name}</td>
      <td><span class="status-badge status-${driver.status}">${driver.status}</span></td>
      <td>${assignedVehicle ? assignedVehicle.plate : 'None'}</td>
      <td>${driver.cardExpiry ? driver.cardExpiry : 'N/A'}</td>
      <td>
        <button onclick="openDriverModal(${driver.id})" class="btn btn-small">Edit</button>
        <button onclick="deleteDriver(${driver.id})" class="btn btn-small btn-danger">Delete</button>
      </td>
    `;
  });
}

function renderVehiclesTable() {
  vehiclesTableBody.innerHTML = '';
  vehicles.forEach(vehicle => {
    const assignedDriver = drivers.find(d => d.vehicleId === vehicle.id);
    const row = vehiclesTableBody.insertRow();
    row.innerHTML = `
      <td>${vehicle.plate}</td>
      <td>${vehicle.type}</td>
      <td>${vehicle.maxLoad} Tons</td>
      <td>${assignedDriver ? assignedDriver.name : 'None'}</td>
      <td>${vehicle.insuranceExpiry}</td>
      <td>${vehicle.inspectionExpiry}</td>
      <td>
        <button onclick="openVehicleModal(${vehicle.id})" class="btn btn-small">Edit</button>
        <button onclick="deleteVehicle(${vehicle.id})" class="btn btn-small btn-danger">Delete</button>
      </td>
    `;
  });
}

function renderAssignmentsTab() {
  assignmentTableBody.innerHTML = '';
  availableVehiclesList.innerHTML = '';

  const unassignedVehicles = vehicles.filter(v => v.assignedDriverId === null);
  unassignedVehicles.forEach(vehicle => {
    const item = document.createElement('div');
    item.className = 'vehicle-item';
    item.draggable = true;
    item.dataset.vehicleId = vehicle.id;
    item.innerHTML = `<span>${vehicle.plate} (${vehicle.type})</span>`;
    item.addEventListener('dragstart', handleDragStart);
    availableVehiclesList.appendChild(item);
  });

  drivers.forEach(driver => {
    const assignedVehicle = vehicles.find(v => v.id === driver.vehicleId);
    const row = assignmentTableBody.insertRow();
    row.innerHTML = `
      <td>${driver.name}</td>
      <td id="driver-drop-zone-${driver.id}" class="drop-zone" style="min-width: 200px; padding: 1rem; border: 1px dashed #ddd;">
        ${assignedVehicle ? `<div class="vehicle-item" draggable="true" data-vehicle-id="${assignedVehicle.id}">${assignedVehicle.plate} (${assignedVehicle.type})</div>` : 'Drop vehicle here'}
      </td>
    `;
    row.querySelector('.drop-zone').addEventListener('dragover', handleDragOver);
    row.querySelector('.drop-zone').addEventListener('drop', (e) => handleDrop(e, driver.id));
  });
}

// --- Modal and Form Functions ---

function openDriverModal(id = null) {
  const driverModalTitle = document.getElementById('driverModalTitle');
  const driverIdInput = document.getElementById('driverId');
  const assignedVehicleSelect = document.getElementById('assignedVehicle');

  // Populate vehicle dropdown
  assignedVehicleSelect.innerHTML = '<option value="">No Vehicle Assigned</option>';
  vehicles.forEach(v => {
    const option = document.createElement('option');
    option.value = v.id;
    option.textContent = `${v.plate} (${v.type})`;
    assignedVehicleSelect.appendChild(option);
  });

  if (id) {
    driverModalTitle.textContent = "Edit Driver";
    const driver = drivers.find(d => d.id === id);
    if (driver) {
      driverIdInput.value = driver.id;
      document.getElementById('driverName').value = driver.name;
      document.getElementById('driverStatus').value = driver.status;
      document.getElementById('cardNumber').value = driver.cardNumber;
      document.getElementById('cardType').value = driver.cardType;
      document.getElementById('cardPin').value = driver.cardPin;
      document.getElementById('cardExpiry').value = driver.cardExpiry;
      document.getElementById('assignedVehicle').value = driver.vehicleId || '';
    }
  } else {
    driverModalTitle.textContent = "Add New Driver";
    driverIdInput.value = '';
    driverForm.reset();
  }
  openModal('driverModal');
}

function openVehicleModal(id = null) {
  const vehicleModalTitle = document.getElementById('vehicleModalTitle');
  const vehicleIdInput = document.getElementById('vehicleId');

  if (id) {
    vehicleModalTitle.textContent = "Edit Vehicle";
    const vehicle = vehicles.find(v => v.id === id);
    if (vehicle) {
      vehicleIdInput.value = vehicle.id;
      document.getElementById('vehiclePlate').value = vehicle.plate;
      document.getElementById('vehicleType').value = vehicle.type;
      document.getElementById('maxLoad').value = vehicle.maxLoad;
      document.getElementById('insuranceExpiry').value = vehicle.insuranceExpiry;
      document.getElementById('insuranceNotif').value = vehicle.insuranceNotif;
      document.getElementById('inspectionExpiry').value = vehicle.inspectionExpiry;
      document.getElementById('inspectionNotif').value = vehicle.inspectionNotif;
    }
  } else {
    vehicleModalTitle.textContent = "Add New Vehicle";
    vehicleIdInput.value = '';
    vehicleForm.reset();
  }
  openModal('vehicleModal');
}

function handleDriverFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('driverId').value;
  const driverName = document.getElementById('driverName').value;
  const driverStatus = document.getElementById('driverStatus').value;
  const cardNumber = document.getElementById('cardNumber').value;
  const cardType = document.getElementById('cardType').value;
  const cardPin = document.getElementById('cardPin').value;
  const cardExpiry = document.getElementById('cardExpiry').value;
  const assignedVehicle = document.getElementById('assignedVehicle').value;

  if (id) {
    // Edit existing driver
    const driver = drivers.find(d => d.id == id);
    if (driver) {
      // Unassign old vehicle if it exists
      if (driver.vehicleId) {
        const oldVehicle = vehicles.find(v => v.id === driver.vehicleId);
        if (oldVehicle) oldVehicle.assignedDriverId = null;
      }

      driver.name = driverName;
      driver.status = driverStatus;
      driver.cardNumber = cardNumber || null;
      driver.cardType = cardType || null;
      driver.cardPin = cardPin || null;
      driver.cardExpiry = cardExpiry || null;
      driver.vehicleId = assignedVehicle ? parseInt(assignedVehicle) : null;
      
      // Assign new vehicle
      if (driver.vehicleId) {
        const newVehicle = vehicles.find(v => v.id === driver.vehicleId);
        if (newVehicle) newVehicle.assignedDriverId = driver.id;
      }
    }
  } else {
    // Add new driver
    const newId = drivers.length > 0 ? Math.max(...drivers.map(d => d.id)) + 1 : 1;
    const newDriver = {
      id: newId,
      name: driverName,
      status: driverStatus,
      vehicleId: assignedVehicle ? parseInt(assignedVehicle) : null,
      cardNumber, cardType, cardPin, cardExpiry
    };
    drivers.push(newDriver);
    if (newDriver.vehicleId) {
      const newVehicle = vehicles.find(v => v.id === newDriver.vehicleId);
      if (newVehicle) newVehicle.assignedDriverId = newDriver.id;
    }
  }
  closeModal('driverModal');
  renderTables();
}

function handleVehicleFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('vehicleId').value;
  const vehiclePlate = document.getElementById('vehiclePlate').value;
  const vehicleType = document.getElementById('vehicleType').value;
  const maxLoad = document.getElementById('maxLoad').value;
  const insuranceExpiry = document.getElementById('insuranceExpiry').value;
  const insuranceNotif = document.getElementById('insuranceNotif').value;
  const inspectionExpiry = document.getElementById('inspectionExpiry').value;
  const inspectionNotif = document.getElementById('inspectionNotif').value;

  if (id) {
    // Edit existing vehicle
    const vehicle = vehicles.find(v => v.id == id);
    if (vehicle) {
      vehicle.plate = vehiclePlate;
      vehicle.type = vehicleType;
      vehicle.maxLoad = parseInt(maxLoad);
      vehicle.insuranceExpiry = insuranceExpiry;
      vehicle.insuranceNotif = parseInt(insuranceNotif);
      vehicle.inspectionExpiry = inspectionExpiry;
      vehicle.inspectionNotif = parseInt(inspectionNotif);
    }
  } else {
    // Add new vehicle
    const newId = vehicles.length > 0 ? Math.max(...vehicles.map(v => v.id)) + 1 : 101;
    const newVehicle = {
      id: newId,
      plate: vehiclePlate,
      type: vehicleType,
      maxLoad: parseInt(maxLoad),
      assignedDriverId: null,
      insuranceExpiry, insuranceNotif: parseInt(insuranceNotif),
      inspectionExpiry, inspectionNotif: parseInt(inspectionNotif),
    };
    vehicles.push(newVehicle);
  }
  closeModal('vehicleModal');
  renderTables();
}

function deleteDriver(id) {
  if (confirm("Are you sure you want to delete this driver?")) {
    const driver = drivers.find(d => d.id === id);
    if (driver && driver.vehicleId) {
      const vehicle = vehicles.find(v => v.id === driver.vehicleId);
      if (vehicle) vehicle.assignedDriverId = null;
    }
    drivers = drivers.filter(d => d.id !== id);
    renderTables();
  }
}

function deleteVehicle(id) {
  if (confirm("Are you sure you want to delete this vehicle?")) {
    const driver = drivers.find(d => d.vehicleId === id);
    if (driver) {
      driver.vehicleId = null;
    }
    vehicles = vehicles.filter(v => v.id !== id);
    renderTables();
  }
}

// --- Drag and Drop Functions ---

function handleDragStart(e) {
  e.dataTransfer.setData('text/plain', e.target.dataset.vehicleId);
  e.target.classList.add('dragging');
}

function handleDragOver(e) {
  e.preventDefault();
}

function handleDrop(e, driverId) {
  e.preventDefault();
  const vehicleId = e.dataTransfer.getData('text/plain');
  const vehicle = vehicles.find(v => v.id == vehicleId);
  const driver = drivers.find(d => d.id === driverId);

  if (vehicle && driver) {
    // If the vehicle was already assigned, unassign it from the old driver
    if (vehicle.assignedDriverId) {
      const oldDriver = drivers.find(d => d.id === vehicle.assignedDriverId);
      if (oldDriver) {
        oldDriver.vehicleId = null;
      }
    }
    
    // Assign the vehicle to the new driver
    driver.vehicleId = vehicle.id;
    vehicle.assignedDriverId = driver.id;
    renderTables();
  }
  document.querySelector('.dragging')?.classList.remove('dragging');
}

// Expose functions to the global scope for HTML onclick handlers
window.openDriverModal = openDriverModal;
window.deleteDriver = deleteDriver;
window.openVehicleModal = openVehicleModal;
window.deleteVehicle = deleteVehicle;
