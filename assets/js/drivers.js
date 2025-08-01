// Data storage
let drivers = JSON.parse(localStorage.getItem('drivers')) || [];
let vehicles = JSON.parse(localStorage.getItem('vehicles')) || [];
let cards = JSON.parse(localStorage.getItem('cards')) || [];
let cardTypes = JSON.parse(localStorage.getItem('cardTypes')) || ['Fuel Card', 'Toll Card', 'Credit Card'];
let settings = JSON.parse(localStorage.getItem('settings')) || {
    insuranceNotifyDays: 30,
    inspectionNotifyDays: 7
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupTabs();
    loadDrivers();
    loadVehicles();
    loadCards();
    loadSettings();
    setupEventListeners();
}

// Tab Management
function setupTabs() {
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            switchTab(tabName);
        });
    });
}

function switchTab(tabName) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');
}

// Drivers Management
function loadDrivers() {
    const container = document.getElementById('driversList');
    const statusFilter = document.getElementById('driverStatusFilter').value;
    const searchTerm = document.getElementById('driverSearch').value.toLowerCase();

    let filteredDrivers = drivers.filter(driver => {
        const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
        const matchesSearch = driver.name.toLowerCase().includes(searchTerm) || 
                             driver.email.toLowerCase().includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    container.innerHTML = '';
    filteredDrivers.forEach(driver => {
        const driverCard = createDriverCard(driver);
        container.appendChild(driverCard);
    });

    updateDriverSelects();
}

function createDriverCard(driver) {
    const card = document.createElement('div');
    card.className = 'driver-card';
    card.innerHTML = `
        <div class="driver-info">
            <h3>${driver.name}</h3>
            <p><i class="fas fa-envelope"></i> ${driver.email}</p>
            <p><i class="fas fa-phone"></i> ${driver.phone}</p>
            <p><i class="fas fa-id-card"></i> ${driver.license}</p>
            <p><i class="fas fa-calendar"></i> License expires: ${formatDate(driver.licenseExpiry)}</p>
            <span class="status-badge status-${driver.status}">${driver.status}</span>
        </div>
        <div class="driver-actions">
            <button onclick="editDriver('${driver.id}')" class="btn-edit">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteDriver('${driver.id}')" class="btn-delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return card;
}

function openDriverModal(driverId = null) {
    const modal = document.getElementById('driverModal');
    const form = document.getElementById('driverForm');
    const title = document.getElementById('driverModalTitle');

    if (driverId) {
        const driver = drivers.find(d => d.id === driverId);
        title.textContent = 'Edit Driver';
        document.getElementById('driverId').value = driver.id;
        document.getElementById('driverName').value = driver.name;
        document.getElementById('driverEmail').value = driver.email;
        document.getElementById('driverPhone').value = driver.phone;
        document.getElementById('driverStatus').value = driver.status;
        document.getElementById('driverLicense').value = driver.license;
        document.getElementById('licenseExpiry').value = driver.licenseExpiry;
    } else {
        title.textContent = 'Add Driver';
        form.reset();
        document.getElementById('driverId').value = '';
    }

    modal.style.display = 'block';
}

function saveDriver(e) {
    e.preventDefault();
    
    const driverData = {
        id: document.getElementById('driverId').value || Date.now().toString(),
        name: document.getElementById('driverName').value,
        email: document.getElementById('driverEmail').value,
        phone: document.getElementById('driverPhone').value,
        status: document.getElementById('driverStatus').value,
        license: document.getElementById('driverLicense').value,
        licenseExpiry: document.getElementById('licenseExpiry').value
    };

    const existingIndex = drivers.findIndex(d => d.id === driverData.id);
    if (existingIndex >= 0) {
        drivers[existingIndex] = driverData;
    } else {
        drivers.push(driverData);
    }

    localStorage.setItem('drivers', JSON.stringify(drivers));
    loadDrivers();
    closeModal('driverModal');
}

function editDriver(driverId) {
    openDriverModal(driverId);
}

function deleteDriver(driverId) {
    if (confirm('Are you sure you want to delete this driver?')) {
        drivers = drivers.filter(d => d.id !== driverId);
        localStorage.setItem('drivers', JSON.stringify(drivers));
        loadDrivers();
    }
}

// Vehicles Management
function loadVehicles() {
    const unassignedContainer = document.getElementById('unassignedVehicles');
    const assignedContainer = document.getElementById('assignedVehicles');

    unassignedContainer.innerHTML = '';
    assignedContainer.innerHTML = '';

    const unassignedVehicles = vehicles.filter(v => !v.driverId);
    const assignedVehicles = vehicles.filter(v => v.driverId);

    // Display unassigned vehicles
    unassignedVehicles.forEach(vehicle => {
        const vehicleCard = createVehicleCard(vehicle);
        unassignedContainer.appendChild(vehicleCard);
    });

    // Display assigned vehicles grouped by driver
    const vehiclesByDriver = {};
    assignedVehicles.forEach(vehicle => {
        if (!vehiclesByDriver[vehicle.driverId]) {
            vehiclesByDriver[vehicle.driverId] = [];
        }
        vehiclesByDriver[vehicle.driverId].push(vehicle);
    });

    Object.keys(vehiclesByDriver).forEach(driverId => {
        const driver = drivers.find(d => d.id === driverId);
        if (driver) {
            const driverSection = document.createElement('div');
            driverSection.className = 'driver-vehicle-section';
            driverSection.innerHTML = `<h4>${driver.name}</h4>`;
            
            const vehicleList = document.createElement('div');
            vehicleList.className = 'vehicle-list';
            vehicleList.ondrop = (e) => drop(e, driverId);
            vehicleList.ondragover = allowDrop;
            
            vehiclesByDriver[driverId].forEach(vehicle => {
                const vehicleCard = createVehicleCard(vehicle);
                vehicleList.appendChild(vehicleCard);
            });
            
            driverSection.appendChild(vehicleList);
            assignedContainer.appendChild(driverSection);
        }
    });

    checkExpiringDocuments();
}

function createVehicleCard(vehicle) {
    const card = document.createElement('div');
    card.className = 'vehicle-card';
    card.draggable = true;
    card.dataset.vehicleId = vehicle.id;
    card.ondragstart = drag;
    
    const insuranceExpiring = isExpiringSoon(vehicle.insuranceExpiry);
    const inspectionExpiring = isExpiringSoon(vehicle.inspectionExpiry);
    
    card.innerHTML = `
        <div class="vehicle-info">
            <h4>${vehicle.registration}</h4>
            <p>Type: ${vehicle.type}</p>
            <p>Max Load: ${vehicle.maxLoad} tons</p>
            <p class="${insuranceExpiring ? 'expiring' : ''}">
                Insurance: ${formatDate(vehicle.insuranceExpiry)}
            </p>
            <p class="${inspectionExpiring ? 'expiring' : ''}">
                Inspection: ${formatDate(vehicle.inspectionExpiry)}
            </p>
        </div>
        <div class="vehicle-actions">
            <button onclick="editVehicle('${vehicle.id}')" class="btn-edit">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteVehicle('${vehicle.id}')" class="btn-delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    return card;
}

function openVehicleModal(vehicleId = null) {
    const modal = document.getElementById('vehicleModal');
    const form = document.getElementById('vehicleForm');
    const title = document.getElementById('vehicleModalTitle');

    if (vehicleId) {
        const vehicle = vehicles.find(v => v.id === vehicleId);
        title.textContent = 'Edit Vehicle';
        document.getElementById('vehicleId').value = vehicle.id;
        document.getElementById('vehicleReg').value = vehicle.registration;
        document.getElementById('vehicleType').value = vehicle.type;
        document.getElementById('maxLoad').value = vehicle.maxLoad;
        document.getElementById('insuranceExpiry').value = vehicle.insuranceExpiry;
        document.getElementById('inspectionExpiry').value = vehicle.inspectionExpiry;
    } else {
        title.textContent = 'Add Vehicle';
        form.reset();
        document.getElementById('vehicleId').value = '';
    }

    modal.style.display = 'block';
}

function saveVehicle(e) {
    e.preventDefault();
    
    const vehicleData = {
        id: document.getElementById('vehicleId').value || Date.now().toString(),
        registration: document.getElementById('vehicleReg').value,
        type: document.getElementById('vehicleType').value,
        maxLoad: parseFloat(document.getElementById('maxLoad').value),
        insuranceExpiry: document.getElementById('insuranceExpiry').value,
        inspectionExpiry: document.getElementById('inspectionExpiry').value,
        driverId: null
    };

    const existingIndex = vehicles.findIndex(v => v.id === vehicleData.id);
    if (existingIndex >= 0) {
        vehicleData.driverId = vehicles[existingIndex].driverId;
        vehicles[existingIndex] = vehicleData;
    } else {
        vehicles.push(vehicleData);
    }

    localStorage.setItem('vehicles', JSON.stringify(vehicles));
    loadVehicles();
    closeModal('vehicleModal');
}

function editVehicle(vehicleId) {
    openVehicleModal(vehicleId);
}

function deleteVehicle(vehicleId) {
    if (confirm('Are you sure you want to delete this vehicle?')) {
        vehicles = vehicles.filter(v => v.id !== vehicleId);
        localStorage.setItem('vehicles', JSON.stringify(vehicles));
        loadVehicles();
    }
}

// Drag and Drop
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("vehicleId", ev.target.dataset.vehicleId);
}

function drop(ev, driverId = null) {
    ev.preventDefault();
    const vehicleId = ev.dataTransfer.getData("vehicleId");
    
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
        vehicle.driverId = driverId;
        localStorage.setItem('vehicles', JSON.stringify(vehicles));
        loadVehicles();
    }
}

// Cards Management
function loadCards() {
    const container = document.getElementById('cardsList');
    container.innerHTML = '';

    cards.forEach(card => {
        const driver = drivers.find(d => d.id === card.driverId);
        const cardCard = document.createElement('div');
        cardCard.className = 'card-card';
        cardCard.innerHTML = `
            <div class="card-info">
                <h4>${card.type}</h4>
                <p>Number: **** **** **** ${card.number.slice(-4)}</p>
                <p>Expiry: ${card.expiry}</p>
                <p>Driver: ${driver ? driver.name : 'Unassigned'}</p>
            </div>
            <div class="card-actions">
                <button onclick="editCard('${card.id}')" class="btn-edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteCard('${card.id}')" class="btn-delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        container.appendChild(cardCard);
    });

    updateCardTypeSelect();
}

function openCardModal(cardId = null) {
    const modal = document.getElementById('cardModal');
    const form = document.getElementById('cardForm');
    const title = document.getElementById('cardModalTitle');

    if (cardId) {
        const card = cards.find(c => c.id === cardId);
        title.textContent = 'Edit Card';
        document.getElementById('cardId').value = card.id;
        document.getElementById('cardType').value = card.type;
        document.getElementById('cardNumber').value = card.number;
        document.getElementById('cardPin').value = card.pin;
        document.getElementById('cardExpiry').value = card.expiry;
        document.getElementById('cardDriver').value = card.driverId || '';
    } else {
        title.textContent = 'Add Card';
        form.reset();
        document.getElementById('cardId').value = '';
    }

    modal.style.display = 'block';
}

function saveCard(e) {
    e.preventDefault();
    
    const cardData = {
        id: document.getElementById('cardId').value || Date.now().toString(),
        type: document.getElementById('cardType').value,
        number: document.getElementById('cardNumber').value,
        pin: document.getElementById('cardPin').value,
        expiry: document.getElementById('cardExpiry').value,
        driverId: document.getElementById('cardDriver').value || null
    };

    const existingIndex = cards.findIndex(c => c.id === cardData.id);
    if (existingIndex >= 0) {
        cards[existingIndex] = cardData;
    } else {
        cards.push(cardData);
    }

    localStorage.setItem('cards', JSON.stringify(cards));
    loadCards();
    closeModal('cardModal');
}

function editCard(cardId) {
    openCardModal(cardId);
}

function deleteCard(cardId) {
    if (confirm('Are you sure you want to delete this card?')) {
        cards = cards.filter(c => c.id !== cardId);
        localStorage.setItem('cards', JSON.stringify(cards));
        loadCards();
    }
}

function openCardTypeModal() {
    loadCardTypes();
    document.getElementById('cardTypeModal').style.display = 'block';
}

function loadCardTypes() {
    const container = document.getElementById('cardTypesList');
    container.innerHTML = '';
    
    cardTypes.forEach((type, index) => {
        const typeDiv = document.createElement('div');
        typeDiv.className = 'card-type-item';
        typeDiv.innerHTML = `
            <span>${type}</span>
            <button onclick="deleteCardType(${index})" class="btn-delete">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(typeDiv);
    });
}

function addCardType() {
    const input = document.getElementById('newCardType');
    const newType = input.value.trim();
    
    if (newType && !cardTypes.includes(newType)) {
        cardTypes.push(newType);
        localStorage.setItem('cardTypes', JSON.stringify(cardTypes));
        input.value = '';
        loadCardTypes();
        updateCardTypeSelect();
    }
}

function deleteCardType(index) {
    if (confirm('Are you sure you want to delete this card type?')) {
        cardTypes.splice(index, 1);
        localStorage.setItem('cardTypes', JSON.stringify(cardTypes));
        loadCardTypes();
        updateCardTypeSelect();
    }
}

// Settings
function loadSettings() {
    document.getElementById('insuranceNotifyDays').value = settings.insuranceNotifyDays;
    document.getElementById('inspectionNotifyDays').value = settings.inspectionNotifyDays;
}

function saveSettings() {
    settings = {
        insuranceNotifyDays: parseInt(document.getElementById('insuranceNotifyDays').value),
        inspectionNotifyDays: parseInt(document.getElementById('inspectionNotifyDays').value)
    };
    
    localStorage.setItem('settings', JSON.stringify(settings));
    alert('Settings saved successfully!');
}

// Utility Functions
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

function isExpiringSoon(dateString) {
    const expiryDate = new Date(dateString);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= settings.insuranceNotifyDays;
}

function checkExpiringDocuments() {
    const expiringVehicles = vehicles.filter(v => 
        isExpiringSoon(v.insuranceExpiry) || isExpiringSoon(v.inspectionExpiry)
    );
    
    if (expiringVehicles.length > 0) {
        console.log(`${expiringVehicles.length} vehicles have expiring documents`);
        // Could add notification system here
    }
}

function updateDriverSelects() {
    const selects = [document.getElementById('cardDriver')];
    
    selects.forEach(select => {
        if (select) {
            select.innerHTML = '<option value="">Unassigned</option>';
            drivers.forEach(driver => {
                const option = document.createElement('option');
                option.value = driver.id;
                option.textContent = driver.name;
                select.appendChild(option);
            });
        }
    });
}

function updateCardTypeSelect() {
    const select = document.getElementById('cardType');
    select.innerHTML = '';
    cardTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        select.appendChild(option);
    });
}

function setupEventListeners() {
    // Form submissions
    document.getElementById('driverForm').addEventListener('submit', saveDriver);
    document.getElementById('vehicleForm').addEventListener('submit', saveVehicle);
    document.getElementById('cardForm').addEventListener('submit', saveCard);

    // Search and filter
    document.getElementById('driverStatusFilter').addEventListener('change', loadDrivers);
    document.getElementById('driverSearch').addEventListener('input', loadDrivers);

    // Modal close on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}
