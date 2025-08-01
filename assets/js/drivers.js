document.addEventListener('DOMContentLoaded', () => {
  // Initialize drivers data
  let drivers = [];
  
  // Load existing data or initialize with sample
  const savedDrivers = localStorage.getItem('transforge_drivers');
  if (savedDrivers) {
    drivers = JSON.parse(savedDrivers);
  } else {
    // Sample data
    drivers = [
      { id: 1, name: 'John Doe', status: 'Available', vehicle: 'ABC-123' },
      { id: 2, name: 'Jane Smith', status: 'On Delivery', vehicle: 'XYZ-456' }
    };
    localStorage.setItem('transforge_drivers', JSON.stringify(drivers));
  }
  
  renderDrivers();
});

function renderDrivers() {
  const tbody = document.getElementById('driversTable');
  if (!tbody) return;
  
  tbody.innerHTML = drivers.map(driver => `
    <tr>
      <td>${driver.name}</td>
      <td><span class="status-badge status-${driver.status.toLowerCase().replace(' ', '-')">${driver.status}</span></td>
      <td>${driver.vehicle || 'None'}</td>
      <td>
        <button class="btn-icon" onclick="editDriver(${driver.id})">✏️</button>
        <button class="btn-icon" onclick="deleteDriver(${driver.id})">🗑️</button>
      </td>
    </tr>
  `).join('');
}

function showAddDriverForm() {
  const formHtml = `
    <div class="form-group">
      <label for="driverName">Name</label>
      <input type="text" id="driverName" class="form-control" required>
    </div>
    <div class="form-group">
      <label for="driverStatus">Status</label>
      <select id="driverStatus" class="form-control">
        <option value="Available">Available</option>
        <option value="On Delivery">On Delivery</option>
        <option value="On Leave">On Leave</option>
      </select>
    </div>
    <div class="form-group">
      <label for="driverVehicle">Vehicle</label>
      <input type="text" id="driverVehicle" class="form-control">
    </div>
    <button class="btn" onclick="saveDriver()">Save</button>`;
  
  document.getElementById('driverModalTitle').textContent = 'Add New Driver';
  document.getElementById('driverModalBody').innerHTML = formHtml;
  document.getElementById('driverModal').style.display = 'flex';
}

function saveDriver() {
  const name = document.getElementById('driverName').value;
  const status = document.getElementById('driverStatus').value;
  const vehicle = document.getElementById('driverVehicle').value;
  
  if (!name) {
    alert('Name is required');
    return;
  }
  
  const newDriver = {
    id: Date.now(),
    name,
    status,
    vehicle
  };
  
  drivers.push(newDriver);
  localStorage.setItem('transforge_drivers', JSON.stringify(drivers));
  closeModal();
  renderDrivers();
}

function editDriver(id) {
  const driver = drivers.find(d => d.id === id);
  if (!driver) return;
  
  const formHtml = `
    <div class="form-group">
      <label for="driverName">Name</label>
      <input type="text" id="driverName" class="form-control" value="${driver.name}" required>
    </div>
    <div class="form-group">
      <label for="driverStatus">Status</label>
      <select id="driverStatus" class="form-control">
        <option value="Available" ${driver.status === 'Available' ? 'selected' : ''}>Available</option>
        <option value="On Delivery" ${driver.status === 'On Delivery' ? 'selected' : ''}>On Delivery</option>
        <option value="On Leave" ${driver.status === 'On Leave' ? 'selected' : ''}>On Leave</option>
      </select>
    </div>
    <div class="form-group">
      <label for="driverVehicle">Vehicle</label>
      <input type="text" id="driverVehicle" class="form-control" value="${driver.vehicle}">
    </div>
    <button class="btn" onclick="updateDriver(${driver.id})">Update</button>`;
  
  document.getElementById('driverModalTitle').textContent = `Edit ${driver.name}`;
  document.getElementById('driverModalBody').innerHTML = formHtml;
  document.getElementById('driverModal').style.display = 'flex';
}

function updateDriver(id) {
  const name = document.getElementById('driverName').value;
  const status = document.getElementById('driverStatus').value;
  const vehicle = document.getElementById('driverVehicle').value;
  
  if (!name) {
    alert('Name is required');
    return;
  }
  
  const index = drivers.findIndex(d => d.id === id);
  if (index !== -1) {
    drivers[index] = { ...drivers[index], name, status, vehicle };
    localStorage.setItem('transforge_drivers', JSON.stringify(drivers));
    closeModal();
    renderDrivers();
  }
}

function deleteDriver(id) {
  if (confirm('Are you sure you want to delete this driver?')) {
    drivers = drivers.filter(d => d.id !== id);
    localStorage.setItem('transforge_drivers', JSON.stringify(drivers));
    renderDrivers();
  }
}

function closeModal() {
  document.getElementById('driverModal').style.display = 'none';
}
