// Import Firestore from firebaseconfig.js
import { db } from './firebaseconfig.js';
import { collection, getDocs, setDoc, doc, updateDoc, deleteDoc, addDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Store the harvest data
let harvestData = {
    crops: [],
    harvests: []
};

// Firestore collection references
const cropsCol = collection(db, 'crops');
const harvestsCol = collection(db, 'harvests');

// Load data from Firestore
async function loadData() {
    // Load crops
    const cropsSnapshot = await getDocs(cropsCol);
    harvestData.crops = cropsSnapshot.docs.map(doc => {
        const data = doc.data();
        // Always use doc.id as potId, and ensure it's a string
        return { ...data, potId: doc.id };
    });
    // Load harvests
    const harvestsSnapshot = await getDocs(harvestsCol);
    harvestData.harvests = harvestsSnapshot.docs.map(doc => doc.data());
    updateUI();
}

// Save crop to Firestore
async function saveCrop(crop) {
    // Always use string for potId
    const potId = String(crop.potId);
    await setDoc(doc(cropsCol, potId), { ...crop, potId });
}

// Delete crop from Firestore
async function deleteCropFirestore(potId) {
    await deleteDoc(doc(cropsCol, String(potId)));
}

// Save harvest to Firestore
async function saveHarvest(harvest) {
    await addDoc(harvestsCol, harvest);
}

// Save all harvests (for batch update, if needed)
async function saveAllHarvests() {
    // Not implemented: Firestore does not support batch overwrite easily in client SDK
}

// Save notes for a crop
async function saveCropNotesFirestore(potId, notes) {
    const cropRef = doc(cropsCol, String(potId));
    await updateDoc(cropRef, { notes });
}

// Override saveData to sync to Firestore
function saveData() {
    // Save all crops
    harvestData.crops.forEach(crop => saveCrop(crop));
    // Save all harvests
    // (For new harvests, use saveHarvest when adding)
}

// Override addCropType to save to Firestore
function addCropType() {
    const potIdInput = document.getElementById('pot-id');
    const cropNameInput = document.getElementById('crop-name');
    const potId = potIdInput.value.trim();
    const cropName = cropNameInput.value.trim();
    if (potId && cropName) {
        const potIdStr = String(potId);
        const cropEntry = {
            potId: potIdStr,
            name: cropName,
            notes: []
        };
        // Check if pot ID already exists (as string)
        const existingCrop = harvestData.crops.find(crop => String(crop.potId) === potIdStr);
        if (existingCrop) {
            alert('A crop with this Pot ID already exists!');
            return;
        }
        if (isNaN(potId)) {
            alert('Pot ID must be a number!');
            return;
        }
        harvestData.crops.push(cropEntry);
        potIdInput.value = '';
        cropNameInput.value = '';
        saveCrop(cropEntry);
        updateUI();
    }
}

// Override deleteCrop to delete from Firestore
function deleteCrop(potId) {
    const potIdStr = String(potId);
    harvestData.crops = harvestData.crops.filter(crop => String(crop.potId) !== potIdStr);
    deleteCropFirestore(potIdStr);
    updateUI();
}

// Override addHarvest to save to Firestore
function addHarvest(potId) {
    const potIdStr = String(potId);
    const harvest = {
        potId: potIdStr,
        date: new Date().toISOString(),
        quantity: 1,
        unit: 'unit'
    };
    harvestData.harvests.push(harvest);
    saveHarvest(harvest);
    updateUI();
}

// Override saveCropNotes to save to Firestore
window.saveCropNotes = async function(potId) {
    const notesTextarea = document.getElementById('crop-notes-input');
    if (!notesTextarea) return;
    const cropIndex = harvestData.crops.findIndex(c => c.potId === potId);
    if (cropIndex === -1) return;
    if (!harvestData.crops[cropIndex].notes) {
        harvestData.crops[cropIndex].notes = [];
    }
    const newNote = {
        text: notesTextarea.value.trim(),
        timestamp: new Date().toISOString()
    };
    if (newNote.text) {
        harvestData.crops[cropIndex].notes.unshift(newNote);
        notesTextarea.value = '';
        await saveCropNotesFirestore(potId, harvestData.crops[cropIndex].notes);
        updateNotesDisplay(potId);
    }
};

// Listen for Firestore changes (real-time sync)
onSnapshot(cropsCol, (snapshot) => {
    harvestData.crops = snapshot.docs.map(doc => {
        const data = doc.data();
        return { ...data, potId: doc.id };
    });
    updateUI();
});
onSnapshot(harvestsCol, (snapshot) => {
    harvestData.harvests = snapshot.docs.map(doc => doc.data());
    updateUI();
});

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
        // Tomatoes
        'tomato': '🍅',
        'celebration hybrid tomato': '🍅',
        'green ladder monster tomato': '🍅',
        'cherry tomato': '🍅',
        'beefsteak tomato': '🍅',
        
        // Cucumbers & Squash family
        'cucumber': '🥒',
        'zucchini': '🥒',
        'yellow squash': '🥒',
        'loofah': '🥒',
        
        // Root vegetables
        'carrot': '🥕',
        'potato': '🥔',
        'beet': '🌰',
        
        // Leafy greens & Herbs
        'lettuce': '🥬',
        'arugula': '🥬',
        'fennel': '🌿',
        'oregano': '🌱',
        'mint': '🪴',
        'lemon balm': '🪴',
        'tulsi': '🌱',
        'cilantro': '🌿',
        'fenugreek': '🌿',
        'basil': '🌿',
        'thyme': '🌿',
        'sage': '🌿',
        'rosemary': '🌿',

        
        // Alliums
        'onion': '🧅',
        'garlic': '🧄',
        
        // Peppers
        'pepper': '🫑',
        'bell peppers': '🫑',
        'jalapeno': '🌶️',
        'hot pepper mix': '🌶️',
        'cayenne peppers': '🌶️',
        'habanero': '🌶️',
        
        // Other vegetables
        'eggplant': '🍆',
        'broccoli': '🥦',
        'okra': '🌿',
        
        // Legumes
        'bush beans': '🫘',
        'peas': '🫛',
        
        // Flowers
        'marigold': '🌼',
        'carnation': '🌸',
        'rose': '🌹',
        'sunflower': '🌻',
        'daisy': '🌼',
        'lily': '🪷',
        'tulip': '🌷',
        'hibiscus': '🌺',
        'peony': '🌸',
        
        // Default for unknown crops
        'corn': '🌽',
    };
    
    // Try to find a matching emoji based on the crop name
    const matchingEmoji = Object.entries(emojiMap).find(([key]) => 
        cropName.toLowerCase().includes(key.toLowerCase())
    );
    
    return matchingEmoji ? matchingEmoji[1] : '🌱';
}

// Helper function to log harvest data
async function logHarvestData(potId, cropName, quantity, totalHarvest) {
    try {
        const response = await fetch('/api/log-harvest', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                potId,
                cropName,
                quantity,
                totalHarvest
            })
        });
        
        if (!response.ok) {
            console.error('Failed to log harvest data');
        }
    } catch (error) {
        console.error('Error logging harvest data:', error);
    }
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
                        <div class="crop-name-container">
                        <div class="crop-name">${crop.name}</div>
                            <button class="notes-icon" onclick="window.location.hash='crop-details/${crop.potId}'" title="View Details">
                                📝
                            </button>
                        </div>
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

// Tab switching functionality
document.addEventListener('DOMContentLoaded', () => {
    // Load saved data
    loadData();

    // Set up tab switching
    const tabButtons = document.querySelectorAll('.tab-button');
    const pages = document.querySelectorAll('.page-content');
    

    function switchPage(pageId, cropId = null) {
        // Remove active class from all buttons and pages
        tabButtons.forEach(btn => btn.classList.remove('active'));
        pages.forEach(page => page.classList.remove('active'));

        // Set new active page and button
        const newPage = document.getElementById(pageId);
        if (newPage) newPage.classList.add('active');
        
        if (pageId !== 'crop-details') {
            const tabBtn = document.querySelector(`[data-page="${pageId}"]`);
            if (tabBtn) tabBtn.classList.add('active');
        } else if (cropId) {
            showCropDetails(cropId);
        }

        // Update UI after page switch
        updateUI();
    }

    // Handle page navigation
    function handleNavigation() {
        const hash = window.location.hash.slice(1) || 'dashboard';
        const [pageId, cropId] = hash.split('/');
        switchPage(pageId, cropId);
    }

    // Format date to "6th June, 2025" format
    function formatDate(date) {
        const d = new Date(date);
        const day = d.getDate();
        const month = d.toLocaleString('default', { month: 'long' });
        const year = d.getFullYear();
        
        // Add ordinal suffix to day
        const suffix = (day) => {
            if (day > 3 && day < 21) return 'th';
            switch (day % 10) {
                case 1: return 'st';
                case 2: return 'nd';
                case 3: return 'rd';
                default: return 'th';
            }
        };
        
        return `${day}${suffix(day)} ${month}, ${year}`;
    }

    // Get date key for grouping (YYYY-MM-DD)
    function getDateKey(date) {
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    }

    // Group notes by date
    function groupNotesByDate(notes) {
        const grouped = {};
        
        notes.forEach(note => {
            const dateKey = getDateKey(note.timestamp);
            if (!grouped[dateKey]) {
                grouped[dateKey] = {
                    displayDate: formatDate(note.timestamp),
                    notes: []
                };
            }
            grouped[dateKey].notes.push(note);
        });
        
        // Sort dates in descending order
        return Object.entries(grouped)
            .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
            .map(([_, group]) => group);
    }

    // Update notes display
    function updateNotesDisplay(potId) {
        const notesContainer = document.getElementById('saved-notes');
        if (!notesContainer) return;

        const crop = harvestData.crops.find(c => c.potId === potId);
        if (!crop || !crop.notes) return;

        const groupedNotes = groupNotesByDate(crop.notes);
        
        notesContainer.innerHTML = groupedNotes.map(group => `
            <div class="notes-date-group">
                <div class="notes-date-header">${group.displayDate}</div>
                <div class="notes-group-content">
                    ${group.notes.map(note => `
                        <div class="note-entry" data-timestamp="${note.timestamp}">
                            <div class="note-content">
                                <div class="note-text">${note.text}</div>
                                <div class="note-actions">
                                    <button class="btn-icon btn-edit" onclick="editNote('${potId}', '${note.timestamp}')" title="Edit note">
                                        ✏️
                                    </button>
                                    <button class="btn-icon btn-delete" onclick="deleteNote('${potId}', '${note.timestamp}')" title="Delete note">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                            <div class="note-edit-form" style="display: none;">
                                <textarea class="note-edit-input">${note.text}</textarea>
                                <div class="note-edit-actions">
                                    <button class="btn-primary btn-save" onclick="saveNoteEdit('${potId}', '${note.timestamp}')">Save</button>
                                    <button class="btn-secondary" onclick="cancelNoteEdit('${potId}', '${note.timestamp}')">Cancel</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    // Edit note
    window.editNote = function(potId, timestamp) {
        const noteEntry = document.querySelector(`.note-entry[data-timestamp="${timestamp}"]`);
        if (!noteEntry) return;

        const noteContent = noteEntry.querySelector('.note-content');
        const editForm = noteEntry.querySelector('.note-edit-form');
        
        noteContent.style.display = 'none';
        editForm.style.display = 'block';
        
        const textarea = editForm.querySelector('.note-edit-input');
        textarea.focus();
        // Place cursor at the end of the text
        textarea.setSelectionRange(textarea.value.length, textarea.value.length);
    }

    // Save note edit
    window.saveNoteEdit = async function(potId, timestamp) {
        const noteEntry = document.querySelector(`.note-entry[data-timestamp="${timestamp}"]`);
        if (!noteEntry) return;

        const editInput = noteEntry.querySelector('.note-edit-input');
        const newText = editInput.value.trim();
        
        if (!newText) {
            alert('Note cannot be empty');
            return;
        }

        const cropIndex = harvestData.crops.findIndex(c => c.potId === potId);
        if (cropIndex === -1) return;

        const noteIndex = harvestData.crops[cropIndex].notes.findIndex(n => n.timestamp === timestamp);
        if (noteIndex === -1) return;

        harvestData.crops[cropIndex].notes[noteIndex].text = newText;
        await saveCropNotesFirestore(potId, harvestData.crops[cropIndex].notes);
        updateNotesDisplay(potId);
    }

    // Cancel note edit
    window.cancelNoteEdit = function(potId, timestamp) {
        const noteEntry = document.querySelector(`.note-entry[data-timestamp="${timestamp}"]`);
        if (!noteEntry) return;

        const noteContent = noteEntry.querySelector('.note-content');
        const editForm = noteEntry.querySelector('.note-edit-form');
        
        noteContent.style.display = 'flex';
        editForm.style.display = 'none';
    }

    // Delete note
    window.deleteNote = async function(potId, timestamp) {
        if (!confirm('Are you sure you want to delete this note?')) return;

        const cropIndex = harvestData.crops.findIndex(c => c.potId === potId);
        if (cropIndex === -1) return;

        harvestData.crops[cropIndex].notes = harvestData.crops[cropIndex].notes.filter(
            note => note.timestamp !== timestamp
        );
        await saveCropNotesFirestore(potId, harvestData.crops[cropIndex].notes);

        updateNotesDisplay(potId);
    }

    // Show crop details page
    function showCropDetails(potId) {
        const crop = harvestData.crops.find(c => c.potId === potId);
        if (!crop) return;

        const cropDetailsPage = document.getElementById('crop-details');
        if (!cropDetailsPage) return;

        const cropEmoji = getCropEmoji(crop.name);
        const totalHarvest = calculateTotalHarvests(crop.potId);

        cropDetailsPage.innerHTML = `
            <div class="page-header">
                <button onclick="window.location.hash='dashboard'" class="back-button">
                    <span class="back-icon">←</span>
                    <span>Back</span>
                </button>
            </div>
            <div class="crop-details-content">
                <div class="crop-details-header">
                    <div class="crop-emoji-large">${cropEmoji}</div>
                    <div class="crop-info-large">
                        <div class="crop-title">
                            <h3>Pot ${crop.potId} - ${crop.name}</h3>
                        </div>
                        <div class="total-harvests">Total Harvests: ${totalHarvest}</div>
                    </div>
                </div>
                <div class="notes-section">
                    <h3>Notes</h3>
                    <div id="saved-notes" class="saved-notes">
                        ${crop.notes ? groupNotesByDate(crop.notes).map(group => `
                            <div class="notes-date-group">
                                <div class="notes-date-header">${group.displayDate}</div>
                                <div class="notes-group-content">
                                    ${group.notes.map(note => `
                                        <div class="note-entry" data-timestamp="${note.timestamp}">
                                            <div class="note-content">
                                                <div class="note-text">${note.text}</div>
                                                <div class="note-actions">
                                                    <button class="btn-icon btn-edit" onclick="editNote('${potId}', '${note.timestamp}')" title="Edit note">
                                                        ✏️
                                                    </button>
                                                    <button class="btn-icon btn-delete" onclick="deleteNote('${potId}', '${note.timestamp}')" title="Delete note">
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                            <div class="note-edit-form" style="display: none;">
                                                <textarea class="note-edit-input">${note.text}</textarea>
                                                <div class="note-edit-actions">
                                                    <button class="btn-primary btn-save" onclick="saveNoteEdit('${potId}', '${note.timestamp}')">Save</button>
                                                    <button class="btn-secondary" onclick="cancelNoteEdit('${potId}', '${note.timestamp}')">Cancel</button>
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        `).join('') : ''}
                    </div>
                    <textarea id="crop-notes-input" placeholder="Add notes about your crop..."></textarea>
                    <button onclick="saveCropNotes('${crop.potId}')" class="btn-primary">Save Note</button>
                </div>
            </div>
        `;

        // Initialize the notes display
        updateNotesDisplay(potId);
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

    // Set up export logs button
    const exportLogsButton = document.getElementById('export-logs-button');
    if (exportLogsButton) {
        exportLogsButton.addEventListener('click', async () => {
            try {
                const response = await fetchWithRetry('/api/download-logs');
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'harvest-logs.zip';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } catch (error) {
                console.error('Error downloading logs:', error);
            }
        });
    }
}); 

// Add connection status indicator to the page
document.body.insertAdjacentHTML('beforeend', `
    <div id="connection-status" style="display: none; position: fixed; top: 10px; right: 10px; padding: 8px 12px; border-radius: 4px; background: var(--accent-primary); color: var(--text-primary); z-index: 9999;">
        Reconnecting...
    </div>
`);

const connectionStatus = document.getElementById('connection-status');

// Connection handling function
function checkConnection() {
    return fetch('/')
        .then(response => {
            if (response.ok) {
                connectionStatus.style.display = 'none';
                return true;
            }
            throw new Error('Connection lost');
        })
        .catch(error => {
            console.error('Connection error:', error);
            connectionStatus.style.display = 'block';
            return false;
        });
}

// Retry connection with exponential backoff
async function retryConnection(retryCount = 0) {
    const maxRetries = 10;
    const baseDelay = 1000; // Start with 1 second delay

    if (retryCount >= maxRetries) {
        connectionStatus.textContent = 'Connection failed. Please refresh the page.';
        return;
    }

    const delay = Math.min(baseDelay * Math.pow(2, retryCount), 30000); // Max 30 seconds delay
    await new Promise(resolve => setTimeout(resolve, delay));

    const isConnected = await checkConnection();
    if (!isConnected) {
        retryConnection(retryCount + 1);
    }
}

// Check connection periodically
setInterval(checkConnection, 30000); // Check every 30 seconds

// Check connection on visibility change
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        checkConnection();
    }
});

// Update existing fetch calls to use fetchWithRetry
function fetchWithRetry(url, options = {}) {
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Connection': 'keep-alive'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    })
    .catch(error => {
        console.error('Fetch error:', error);
        checkConnection();
        throw error;
    });
}

// Example of updating an existing fetch call:
// This block is now redundant as the event listener handles the fetchWithRetry call directly.
// Keeping it for now as it might be used elsewhere or for clarity.
// document.getElementById('export-logs-button').addEventListener('click', async () => {
//     try {
//         const response = await fetchWithRetry('/api/download-logs');
//         const blob = await response.blob();
//         const url = window.URL.createObjectURL(blob);
//         const a = document.createElement('a');
//         a.href = url;
//         a.download = 'harvest-logs.zip';
//         document.body.appendChild(a);
//         a.click();
//         window.URL.revokeObjectURL(url);
//         document.body.removeChild(a);
//     } catch (error) {
//         console.error('Error downloading logs:', error);
//     }
// }); 

window.addHarvest = addHarvest;
window.deleteCrop = deleteCrop; 