// Data storage - initialized from localStorage or with defaults
let drivers = JSON.parse(localStorage.getItem('drivers')) || [];
let vehicles = JSON.parse(localStorage.getItem('vehicles')) || [];
let cards = JSON.parse(localStorage.getItem('cards')) || [];
let cardTypes = JSON.parse(localStorage.getItem('cardTypes')) || ['Fuel Card', 'Toll Card', 'Credit Card'];
let settings = JSON.parse(localStorage.getItem('settings')) || {
    insuranceNotifyDays: 30,
    inspectionNotifyDays: 7
};

// Initialize the app when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupTabs();
    loadDrivers(); // Loads drivers and populates driver select dropdowns
    loadVehicles();
    loadCards(); // Loads cards and populates card type select dropdowns
    loadSettings();
    setupEventListeners();
}

// --- Tab Management ---
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
    // Update nav buttons active state
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // Re-load data for active tab if necessary (e.g., in case of external changes)
    if (tabName === 'drivers') loadDrivers();
    if (tabName === 'vehicles') loadVehicles();
    if (tabName === 'cards') loadCards();
    if (tabName === 'settings') loadSettings();
}

// --- Drivers Management ---
function loadDrivers() {
    const container = document.getElementById('driversList');
    const statusFilter = document.getElementById('driverStatusFilter').value;
    const searchTerm = document.getElementById('driverSearch').value.toLowerCase();

    let filteredDrivers = drivers.filter(driver => {
        const matchesStatus = statusFilter === 'all' || driver.status === statusFilter;
        const matchesSearch = driver.name.toLowerCase().includes(searchTerm) || 
                             driver.email.toLowerCase().includes(searchTerm) ||
                             driver.license.toLowerCase().includes(searchTerm);
        return matchesStatus && matchesSearch;
    });

    container.innerHTML = ''; // Clear existing cards
    if (filteredDrivers.length === 0) {
        container.innerHTML = '<p class="no-items">No drivers found. Click "Add Driver" to get started!</p>';
    } else {
        filteredDrivers.forEach(driver => {
            const driverCard = createDriverCard(driver);
            container.appendChild(driverCard);
        });
    }

    updateDriverSelects(); // Update driver dropdowns in other modals
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
            <button onclick="editDriver('${driver.id}')" class="btn-edit" title="Edit Driver">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteDriver('${driver.id}')" class="btn-delete" title="Delete Driver">
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
        if (!driver) { // Handle case where driver might not be found (e.g., after deletion)
            console.error("Driver not found for editing:", driverId);
            return;
        }
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
        form.reset(); // Clear form for new entry
        document.getElementById('driverId').value = ''; // Ensure no old ID remains
    }

    modal.style.display = 'block';
}

function saveDriver(e) {
    e.preventDefault(); // Prevent default form submission

    const driverId = document.getElementById('driverId').value;
    const driverData = {
        id: driverId || Date.now().toString(), // Use existing ID or generate new
        name: document.getElementById('driverName').value,
        email: document.getElementById('driverEmail').value,
        phone: document.getElementById('driverPhone').value,
        status: document.getElementById('driverStatus').value,
        license: document.getElementById('driverLicense').value,
        licenseExpiry: document.getElementById('licenseExpiry').value
    };

    const existingIndex = drivers.findIndex(d => d.id === driverData.id);
    if (existingIndex >= 0) {
        // Update existing driver
        drivers[existingIndex] = driverData;
    } else {
        // Add new driver
        drivers.push(driverData);
    }

    localStorage.setItem('drivers', JSON.stringify(drivers));
    loadDrivers(); // Re-render the list
    closeModal('driverModal');
}

function editDriver(driverId) {
    openDriverModal(driverId);
}

function deleteDriver(driverId) {
    if (confirm('Are you sure you want to delete this driver?')) {
        drivers = drivers.filter(d => d.id !== driverId);
        // Also unassign any vehicles currently assigned to this driver
        vehicles.forEach(v => {
            if (v.driverId === driverId) {
                v.driverId = null;
            }
        });
        // Also unassign any cards currently assigned to this driver
        cards.forEach(c => {
            if (c.driverId === driverId) {
                c.driverId = null;
            }
        });

        localStorage.setItem('drivers', JSON.stringify(drivers));
        localStorage.setItem('vehicles', JSON.stringify(vehicles)); // Save vehicle changes
        localStorage.setItem('cards', JSON.stringify(cards)); // Save card changes

        loadDrivers(); // Re-render driver list
        loadVehicles(); // Re-render vehicle list to reflect unassigned vehicles
        loadCards(); // Re-render card list
    }
}

// --- Vehicles Management ---
function loadVehicles() {
    const unassignedContainer = document.getElementById('unassignedVehicles');
    const assignedContainer = document.getElementById('assignedVehicles');

    unassignedContainer.innerHTML = '';
    assignedContainer.innerHTML = '';

    const unassignedVehicles = vehicles.filter(v => !v.driverId);
    const assignedVehicles = vehicles.filter(v => v.driverId);

    // Display unassigned vehicles
    if (unassignedVehicles.length === 0) {
        unassignedContainer.innerHTML = '<p class="no-items">No unassigned vehicles. Drag and drop vehicles here to unassign them.</p>';
    } else {
        unassignedVehicles.forEach(vehicle => {
            const vehicleCard = createVehicleCard(vehicle);
            unassignedContainer.appendChild(vehicleCard);
        });
    }

    // Display assigned vehicles grouped by driver
    const vehiclesByDriver = {};
    assignedVehicles.forEach(vehicle => {
        if (!vehiclesByDriver[vehicle.driverId]) {
            vehiclesByDriver[vehicle.driverId] = [];
        }
        vehiclesByDriver[vehicle.driverId].push(vehicle);
    });

    if (Object.keys(vehiclesByDriver).length === 0) {
        assignedContainer.innerHTML = '<p class="no-items">No vehicles currently assigned to drivers.</p>';
    } else {
        Object.keys(vehiclesByDriver).forEach(driverId => {
            const driver = drivers.find(d => d.id === driverId);
            if (driver) {
                const driverSection = document.createElement('div');
                driverSection.className = 'driver-vehicle-section';
                driverSection.innerHTML = `<h4><i class="fas fa-user-circle"></i> ${driver.name}</h4>`;
                
                const vehicleList = document.createElement('div');
                vehicleList.className = 'vehicle-list';
                vehicleList.ondrop = (e) => drop(e, driverId); // Allow dropping on this driver's section
                vehicleList.ondragover = allowDrop;
                
                vehiclesByDriver[driverId].forEach(vehicle => {
                    const vehicleCard = createVehicleCard(vehicle);
                    vehicleList.appendChild(vehicleCard);
                });
                
                driverSection.appendChild(vehicleList);
                assignedContainer.appendChild(driverSection);
            }
        });
    }

    checkExpiringDocuments();
}

function createVehicleCard(vehicle) {
    const card = document.createElement('div');
    card.className = 'vehicle-card';
    card.draggable = true;
    card.dataset.vehicleId = vehicle.id; // Store ID for drag/drop
    card.ondragstart = drag;
    
    // Check expiry dates
    const insuranceExpiring = isExpiringSoon(vehicle.insuranceExpiry, settings.insuranceNotifyDays);
    const inspectionExpiring = isExpiringSoon(vehicle.inspectionExpiry, settings.inspectionNotifyDays);
    
    card.innerHTML = `
        <div class="vehicle-info">
            <h4><i class="fas fa-car-alt"></i> ${vehicle.registration}</h4>
            <p>Type: ${vehicle.type}</p>
            <p>Max Load: ${vehicle.maxLoad} tons</p>
            <p class="${insuranceExpiring ? 'expiring' : ''}">
                <i class="fas fa-file-invoice"></i> Insurance: ${formatDate(vehicle.insuranceExpiry)}
            </p>
            <p class="${inspectionExpiring ? 'expiring' : ''}">
                <i class="fas fa-clipboard-check"></i> Inspection: ${formatDate(vehicle.inspectionExpiry)}
            </p>
        </div>
        <div class="vehicle-actions">
            <button onclick="editVehicle('${vehicle.id}')" class="btn-edit" title="Edit Vehicle">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteVehicle('${vehicle.id}')" class="btn-delete" title="Delete Vehicle">
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
        if (!vehicle) {
            console.error("Vehicle not found for editing:", vehicleId);
            return;
        }
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
    
    const vehicleId = document.getElementById('vehicleId').value;
    const vehicleData = {
        id: vehicleId || Date.now().toString(),
        registration: document.getElementById('vehicleReg').value,
        type: document.getElementById('vehicleType').value,
        maxLoad: parseFloat(document.getElementById('maxLoad').value),
        insuranceExpiry: document.getElementById('insuranceExpiry').value,
        inspectionExpiry: document.getElementById('inspectionExpiry').value,
        driverId: null // Initialize as unassigned or keep existing if editing
    };

    const existingIndex = vehicles.findIndex(v => v.id === vehicleData.id);
    if (existingIndex >= 0) {
        // Retain current driver assignment when editing
        vehicleData.driverId = vehicles[existingIndex].driverId; 
        vehicles[existingIndex] = vehicleData;
    } else {
        vehicles.push(vehicleData);
    }

    localStorage.setItem('vehicles', JSON.stringify(vehicles));
    loadVehicles(); // Re-render the list
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

// --- Drag and Drop Logic ---
function allowDrop(ev) {
    ev.preventDefault(); // Allow dropping
}

function drag(ev) {
    ev.dataTransfer.setData("vehicleId", ev.target.dataset.vehicleId); // Store the vehicle ID being dragged
}

function drop(ev, driverId = null) {
    ev.preventDefault();
    const vehicleId = ev.dataTransfer.getData("vehicleId");
    
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (vehicle) {
        // If a driver already has this vehicle, make sure they don't have multiple assignments
        // (Optional: You might want to allow multiple vehicles per driver, if so, remove this logic)
        vehicles.forEach(v => {
            if (v.driverId === driverId && v.id !== vehicle.id) {
                // If the target driver already has another vehicle, you might want to unassign it,
                // or prevent dropping if only one vehicle per driver is allowed.
                // For now, we'll just allow multiple assignments or reassign.
            }
        });

        vehicle.driverId = driverId; // Assign or unassign (if driverId is null)
        localStorage.setItem('vehicles', JSON.stringify(vehicles));
        loadVehicles(); // Re-render the vehicle lists
    }
}

// --- Cards Management ---
function loadCards() {
    const container = document.getElementById('cardsList');
    container.innerHTML = '';

    if (cards.length === 0) {
        container.innerHTML = '<p class="no-items">No cards found. Click "Add Card" to get started!</p>';
    } else {
        cards.forEach(card => {
            const driver = drivers.find(d => d.id === card.driverId);
            const cardCard = document.createElement('div');
            cardCard.className = 'card-card';
            cardCard.innerHTML = `
                <div class="card-info">
                    <h4><i class="fas fa-credit-card"></i> ${card.type}</h4>
                    <p>Number: **** **** **** ${card.number.slice(-4)}</p>
                    <p>Expiry: ${card.expiry}</p>
                    <p>Driver: ${driver ? driver.name : 'Unassigned'}</p>
                </div>
                <div class="card-actions">
                    <button onclick="editCard('${card.id}')" class="btn-edit" title="Edit Card">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCard('${card.id}')" class="btn-delete" title="Delete Card">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(cardCard);
        });
    }

    updateCardTypeSelect(); // Ensure card type dropdown is up-to-date
}

function openCardModal(cardId = null) {
    const modal = document.getElementById('cardModal');
    const form = document.getElementById('cardForm');
    const title = document.getElementById('cardModalTitle');

    // Always update dropdowns before opening the modal
    updateDriverSelects();
    updateCardTypeSelect();

    if (cardId) {
        const card = cards.find(c => c.id === cardId);
        if (!card) {
            console.error("Card not found for editing:", cardId);
            return;
        }
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
        document.getElementById('cardDriver').value = ''; // Ensure unassigned default
    }

    modal.style.display = 'block';
}

function saveCard(e) {
    e.preventDefault();
    
    const cardId = document.getElementById('cardId').value;
    const cardData = {
        id: cardId || Date.now().toString(),
        type: document.getElementById('cardType').value,
        number: document.getElementById('cardNumber').value,
        // For security, never store PINs in plain text in production.
        // For this local storage example, it's just for functionality demonstration.
        pin: document.getElementById('cardPin').value, 
        expiry: document.getElementById('cardExpiry').value, // YYYY-MM format from <input type="month">
        driverId: document.getElementById('cardDriver').value || null // Store null if unassigned
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
    loadCardTypes(); // Load current card types into the list
    document.getElementById('cardTypeModal').style.display = 'block';
}

function loadCardTypes() {
    const container = document.getElementById('cardTypesList');
    container.innerHTML = '';
    
    if (cardTypes.length === 0) {
        container.innerHTML = '<p class="no-items">No card types defined.</p>';
    } else {
        cardTypes.forEach((type, index) => {
            const typeDiv = document.createElement('div');
            typeDiv.className = 'card-type-item';
            typeDiv.innerHTML = `
                <span>${type}</span>
                <button onclick="deleteCardType(${index})" class="btn-delete" title="Delete Card Type">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(typeDiv);
        });
    }
}

function addCardType() {
    const input = document.getElementById('newCardType');
    const newType = input.value.trim();
    
    if (newType && !cardTypes.includes(newType)) {
        cardTypes.push(newType);
        localStorage.setItem('cardTypes', JSON.stringify(cardTypes));
        input.value = ''; // Clear input field
        loadCardTypes(); // Re-render card types list
        updateCardTypeSelect(); // Update card type dropdown in card modal
    } else if (newType) {
        alert('Card type already exists!');
    }
}

function deleteCardType(index) {
    if (confirm('Are you sure you want to delete this card type?')) {
        const typeToDelete = cardTypes[index];
        // Check if any cards use this type before deleting
        if (cards.some(card => card.type === typeToDelete)) {
            alert(`Cannot delete "${typeToDelete}" because it is currently assigned to one or more cards.`);
            return;
        }

        cardTypes.splice(index, 1);
        localStorage.setItem('cardTypes', JSON.stringify(cardTypes));
        loadCardTypes();
        updateCardTypeSelect();
    }
}

// --- Settings Management ---
function loadSettings() {
    document.getElementById('insuranceNotifyDays').value = settings.insuranceNotifyDays;
    document.getElementById('inspectionNotifyDays').value = settings.inspectionNotifyDays;
}

function saveSettings() {
    settings = {
        insuranceNotifyDays: parseInt(document.getElementById('insuranceNotifyDays').value, 10),
        inspectionNotifyDays: parseInt(document.getElementById('inspectionNotifyDays').value, 10)
    };
    
    localStorage.setItem('settings', JSON.stringify(settings));
    alert('Settings saved successfully!');
    // Re-evaluate vehicle expiries with new settings
    loadVehicles(); 
}

// --- Utility Functions ---
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Modified to accept notification days as argument for flexibility
function isExpiringSoon(dateString, notifyDays) {
    if (!dateString) return false;
    const expiryDate = new Date(dateString);
    const today = new Date();
    today.setHours(0,0,0,0); // Reset time for accurate day comparison
    expiryDate.setHours(0,0,0,0); // Reset time for accurate day comparison

    const timeDiff = expiryDate.getTime() - today.getTime();
    const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry >= 0 && daysUntilExpiry <= notifyDays;
}

function checkExpiringDocuments() {
    const expiringVehicles = vehicles.filter(v => 
        isExpiringSoon(v.insuranceExpiry, settings.insuranceNotifyDays) || 
        isExpiringSoon(v.inspectionExpiry, settings.inspectionNotifyDays)
    );
    
    if (expiringVehicles.length > 0) {
        console.warn(`[Vehicle Management] Alert: ${expiringVehicles.length} vehicles have documents expiring soon!`);
        // In a real app, you'd show a persistent notification or send an email.
        // For now, it logs to console and highlights in red on the UI.
    }
}

function updateDriverSelects() {
    const cardDriverSelect = document.getElementById('cardDriver');
    if (cardDriverSelect) {
        cardDriverSelect.innerHTML = '<option value="">Unassigned</option>';
        drivers.forEach(driver => {
            const option = document.createElement('option');
            option.value = driver.id;
            option.textContent = driver.name;
            cardDriverSelect.appendChild(option);
        });
    }
}

function updateCardTypeSelect() {
    const cardTypeSelect = document.getElementById('cardType');
    if (cardTypeSelect) {
        cardTypeSelect.innerHTML = ''; // Clear existing options
        if (cardTypes.length === 0) {
            const option = document.createElement('option');
            option.value = "";
            option.textContent = "No types available - add some!";
            option.disabled = true;
            cardTypeSelect.appendChild(option);
        } else {
            cardTypes.forEach(type => {
                const option = document.createElement('option');
                option.value = type;
                option.textContent = type;
                cardTypeSelect.appendChild(option);
            });
        }
    }
}

// Attach all major event listeners here
function setupEventListeners() {
    // Form submissions
    document.getElementById('driverForm').addEventListener('submit', saveDriver);
    document.getElementById('vehicleForm').addEventListener('submit', saveVehicle);
    document.getElementById('cardForm').addEventListener('submit', saveCard);

    // Search and filter for drivers
    document.getElementById('driverStatusFilter').addEventListener('change', loadDrivers);
    document.getElementById('driverSearch').addEventListener('input', loadDrivers);

    // Close modals when clicking outside of modal content
    window.addEventListener('click', (e) => {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}
