// Store the harvest data
let harvestData = {
    crops: [],
    harvests: []
};

// Load data from localStorage if available
function loadData() {
    const savedData = localStorage.getItem('harvestMunshiData');
    if (savedData) {
        harvestData = JSON.parse(savedData);
        updateUI();
    }
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('harvestMunshiData', JSON.stringify(harvestData));
}

// Create a simple bar chart
function createBarChart(container, data, labels) {
    const chartHeight = container.clientHeight - 40;
    const chartWidth = container.clientWidth - 40;
    const barCount = data.length;
    const barWidth = Math.min(40, (chartWidth / barCount) - 10);
    const maxValue = Math.max(...data);

    container.innerHTML = '';
    
    // Create chart grid lines
    for (let i = 0; i < 5; i++) {
        const gridLine = document.createElement('div');
        gridLine.style.position = 'absolute';
        gridLine.style.left = '0';
        gridLine.style.right = '0';
        gridLine.style.bottom = `${(i * 20)}%`;
        gridLine.style.borderBottom = '1px solid var(--chart-grid)';
        gridLine.style.opacity = '0.5';
        container.appendChild(gridLine);
    }

    // Create bars
    data.forEach((value, index) => {
        const barContainer = document.createElement('div');
        barContainer.style.position = 'absolute';
        barContainer.style.bottom = '0';
        barContainer.style.left = `${(index * (chartWidth / (barCount - 1))) + 20}px`;
        barContainer.style.transform = 'translateX(-50%)';
        barContainer.style.width = `${barWidth}px`;
        barContainer.style.display = 'flex';
        barContainer.style.flexDirection = 'column';
        barContainer.style.alignItems = 'center';

        const bar = document.createElement('div');
        const height = (value / maxValue) * chartHeight;
        bar.style.width = '100%';
        bar.style.height = `${height}px`;
        bar.style.backgroundColor = 'var(--accent-primary)';
        bar.style.borderRadius = '4px 4px 0 0';
        bar.style.transition = 'height 0.3s ease';

        const label = document.createElement('div');
        label.textContent = labels[index];
        label.style.marginTop = '8px';
        label.style.color = 'var(--text-secondary)';
        label.style.fontSize = '0.8rem';
        label.style.whiteSpace = 'nowrap';
        label.style.transform = 'rotate(-45deg)';

        barContainer.appendChild(bar);
        barContainer.appendChild(label);
        container.appendChild(barContainer);
    });
}

// Create a simple donut chart
function createDonutChart(container, data, labels) {
    const total = data.reduce((a, b) => a + b, 0);
    let currentAngle = 0;
    const colors = ['#4cd964', '#5856d6', '#ff2d55', '#5ac8fa', '#ffcc00'];
    const size = Math.min(container.clientWidth, container.clientHeight) - 40;
    const radius = size / 2;
    const center = size / 2;

    container.innerHTML = `
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <g transform="translate(${center}, ${center})">
    `;

    data.forEach((value, index) => {
        const percentage = value / total;
        const angle = percentage * 360;
        const startX = Math.cos(currentAngle * Math.PI / 180) * radius;
        const startY = Math.sin(currentAngle * Math.PI / 180) * radius;
        const endAngle = currentAngle + angle;
        const endX = Math.cos(endAngle * Math.PI / 180) * radius;
        const endY = Math.sin(endAngle * Math.PI / 180) * radius;
        const largeArc = angle > 180 ? 1 : 0;

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', `
            M ${startX} ${startY}
            A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}
            L 0 0
            Z
        `);
        path.setAttribute('fill', colors[index % colors.length]);
        path.setAttribute('stroke', 'var(--bg-primary)');
        path.setAttribute('stroke-width', '1');
        
        container.querySelector('g').appendChild(path);
        currentAngle += angle;
    });

    container.innerHTML += '</g></svg>';
}

// Calculate total harvests for a crop
function calculateTotalHarvests(potId) {
    return harvestData.harvests.filter(harvest => harvest.potId === potId)
        .reduce((total, harvest) => total + (Number(harvest.quantity) || 0), 0);
}

// Update the total harvest display with animation
function updateTotalHarvestDisplay(total) {
    // Update the number
    const numberElement = document.querySelector('#main-harvest-number .number');
    numberElement.textContent = total;

    // Animate the ring
    const ring = document.querySelector('.ring-progress');
    const circumference = 283; // 2 * π * r (r = 45)
    const offset = circumference - (total / 100) * circumference;
    ring.style.strokeDashoffset = Math.max(0, offset);
}

// Get vegetable emoji for crop name
function getCropEmoji(cropName) {
    const emojiMap = {
        'tomato': '🍅',
        'carrot': '🥕',
        'potato': '🥔',
        'cucumber': '🥒',
        'lettuce': '🥬',
        'broccoli': '🥦',
        'onion': '🧅',
        'garlic': '🧄',
        'pepper': '🫑',
        'eggplant': '🍆',
        'corn': '🌽',
        'mushroom': '🍄',
    };
    
    // Try to find a matching emoji based on the crop name
    const matchingEmoji = Object.entries(emojiMap).find(([key]) => 
        cropName.toLowerCase().includes(key.toLowerCase())
    );
    
    return matchingEmoji ? matchingEmoji[1] : '🌱';
}

// Add a new harvest
function addHarvest(potId) {
    const harvest = {
        potId: potId,
        date: new Date().toISOString(),
        quantity: 1,
        unit: 'unit'
    };
    
    harvestData.harvests.push(harvest);
    saveData();
    updateUI();
}

// Update the UI with current data
function updateUI() {
    const totalHarvests = harvestData.harvests.length;
    
    // Update the main harvest number and ring in dashboard
    const mainHarvestNumber = document.querySelector('#main-harvest-number .number');
    if (mainHarvestNumber) {
        mainHarvestNumber.textContent = totalHarvests;
        
        // Update the ring progress
        const ring = document.querySelector('.ring-progress');
        const circumference = 283; // 2 * π * r (r = 45)
        const offset = circumference - (totalHarvests / 100) * circumference;
        ring.style.strokeDashoffset = Math.max(0, offset);
    }

    // Update crops grid in dashboard
    const cropsGrid = document.querySelector('.crops-grid');
    if (cropsGrid) {
        cropsGrid.innerHTML = '';
        
        harvestData.crops.forEach(crop => {
            const totalHarvest = calculateTotalHarvests(crop.potId);
            const cropEmoji = getCropEmoji(crop.name);
            
            const cropCard = document.createElement('div');
            cropCard.className = 'crop-card';
            cropCard.innerHTML = `
                <div class="crop-icon">${cropEmoji}</div>
                <div class="crop-info">
                    <div class="crop-details">
                        <div class="crop-name">${crop.name}</div>
                        <div class="crop-pot">Pot ${crop.potId}</div>
                    </div>
                </div>
                <div class="crop-harvest">
                    <div class="harvest-count">${totalHarvest}</div>
                    <button class="btn-add-harvest" onclick="addHarvest('${crop.potId}')" title="Add harvest">+</button>
                </div>
            `;
            cropsGrid.appendChild(cropCard);
        });
    }

    // Update configured crops table in config tab
    const configuredCropsTable = document.getElementById('configured-crops');
    if (configuredCropsTable) {
        configuredCropsTable.innerHTML = '';
        
        harvestData.crops.forEach(crop => {
            const totalHarvest = calculateTotalHarvests(crop.potId);
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${crop.potId}</td>
                <td>${crop.name}</td>
                <td class="harvest-count">${totalHarvest}</td>
                <td>
                    <button onclick="deleteCrop('${crop.potId}')" class="btn-icon btn-delete" title="Delete crop">
                        <span class="delete-icon">🗑️</span>
                    </button>
                </td>
            `;
            configuredCropsTable.appendChild(tr);
        });
    }

    // Update harvest items list
    const harvestList = document.getElementById('harvest-items');
    if (harvestList) {
        harvestList.innerHTML = '';
        harvestData.harvests.slice(-5).reverse().forEach(harvest => {
            const crop = harvestData.crops.find(c => c.potId === harvest.potId);
            if (!crop) return;
            
            const li = document.createElement('li');
            li.innerHTML = `
                <div class="harvest-item">
                    <strong>${crop.name}</strong> - ${new Date(harvest.date).toLocaleDateString()}
                    <span>${harvest.quantity} ${harvest.unit}</span>
                </div>
            `;
            harvestList.appendChild(li);
        });
    }

    // Update distribution chart
    const distributionChartContainer = document.getElementById('crop-distribution-chart');
    if (distributionChartContainer) {
        const cropDistribution = harvestData.crops.map(crop => calculateTotalHarvests(crop.potId));
        const cropLabels = harvestData.crops.map(crop => crop.name);
        createDonutChart(distributionChartContainer, cropDistribution, cropLabels);
    }
}

// Add new crop type
function addCropType() {
    const potIdInput = document.getElementById('pot-id');
    const cropNameInput = document.getElementById('crop-name');
    const potId = potIdInput.value.trim();
    const cropName = cropNameInput.value.trim();
    
    if (potId && cropName) {
        const cropEntry = {
            potId: potId,
            name: cropName
        };
        
        // Check if pot ID already exists
        const existingCrop = harvestData.crops.find(crop => crop.potId === potId);
        if (existingCrop) {
            alert('A crop with this Pot ID already exists!');
            return;
        }
        
        harvestData.crops.push(cropEntry);
        potIdInput.value = '';
        cropNameInput.value = '';
        saveData();
        updateUI();
    }
}

// Delete crop type
function deleteCrop(potId) {
    harvestData.crops = harvestData.crops.filter(crop => crop.potId !== potId);
    saveData();
    updateUI();
}

// Tab switching functionality
document.addEventListener('DOMContentLoaded', () => {
    // Load saved data
    loadData();

    // Set up tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    const pages = document.querySelectorAll('.page-content');

    function switchPage(pageId) {
        // Remove active class from all buttons and pages
        tabButtons.forEach(btn => btn.classList.remove('active'));
        pages.forEach(page => page.classList.remove('active'));

        // Set new active page and button
        const newPage = document.getElementById(pageId);
        newPage.classList.add('active');
        document.querySelector(`[data-page="${pageId}"]`).classList.add('active');

        // Update UI after page switch
        updateUI();
    }

    // Handle page navigation
    function handleNavigation() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        switchPage(hash);
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleNavigation);

    // Initial page load
    handleNavigation();

    // Set up new crop button and form
    const addNewCropButton = document.getElementById('add-new-crop-button');
    const addCropForm = document.getElementById('add-crop-form');
    const potIdInput = document.getElementById('pot-id');
    const cropNameInput = document.getElementById('crop-name');
    const addCropTypeButton = document.getElementById('add-crop-type');
    
    if (addNewCropButton && addCropForm) {
        addNewCropButton.addEventListener('click', () => {
            const isHidden = addCropForm.style.display === 'none' || !addCropForm.style.display;
            addCropForm.style.display = isHidden ? 'block' : 'none';
            if (isHidden && potIdInput) {
                potIdInput.focus();
            }
        });
    }

    // Set up crop type addition
    if (addCropTypeButton) {
        addCropTypeButton.addEventListener('click', () => {
            addCropType();
        });
    }
    
    // Handle form submission with Enter key
    if (potIdInput) {
        potIdInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (cropNameInput) {
                    cropNameInput.focus();
                }
            }
        });
    }
    
    if (cropNameInput) {
        cropNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCropType();
            }
        });
    }

    // Handle window resize for responsive charts
    window.addEventListener('resize', updateUI);
}); 