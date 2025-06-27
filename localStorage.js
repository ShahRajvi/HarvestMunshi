class LocalStorageManager {
    static STORAGE_KEY = 'harvest_notes_data';

    /**
     * Save harvest notes to local storage
     * @param {string} potId - The ID of the pot
     * @param {string} cropName - The name of the crop
     * @param {string} notes - The notes to be stored
     */
    static saveHarvestNotes(potId, cropName, notes) {
        try {
            const key = `${potId}_${cropName}`;
            const timestamp = new Date().toISOString();
            const noteEntry = {
                timestamp,
                notes,
                lastSynced: new Date().toISOString()
            };

            // Get existing data
            const existingData = this.getAllHarvestNotes();
            
            // Update or add new entry
            existingData[key] = noteEntry;

            // Save back to localStorage
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingData));
            return true;
        } catch (error) {
            console.error('Error saving to local storage:', error);
            return false;
        }
    }

    /**
     * Get harvest notes from local storage
     * @param {string} potId - The ID of the pot
     * @param {string} cropName - The name of the crop
     * @returns {Object|null} The stored notes or null if not found
     */
    static getHarvestNotes(potId, cropName) {
        try {
            const key = `${potId}_${cropName}`;
            const data = this.getAllHarvestNotes();
            return data[key] || null;
        } catch (error) {
            console.error('Error reading from local storage:', error);
            return null;
        }
    }

    /**
     * Get all harvest notes from local storage
     * @returns {Object} All stored harvest notes
     */
    static getAllHarvestNotes() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Error reading from local storage:', error);
            return {};
        }
    }

    /**
     * Delete harvest notes from local storage
     * @param {string} potId - The ID of the pot
     * @param {string} cropName - The name of the crop
     */
    static deleteHarvestNotes(potId, cropName) {
        try {
            const key = `${potId}_${cropName}`;
            const data = this.getAllHarvestNotes();
            delete data[key];
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error deleting from local storage:', error);
            return false;
        }
    }

    /**
     * Sync local data with server
     * @returns {Promise<boolean>} Success status of sync
     */
    static async syncWithServer() {
        try {
            const localData = this.getAllHarvestNotes();
            const syncPromises = [];

            // Sync each entry to server
            for (const [key, data] of Object.entries(localData)) {
                const [potId, cropName] = key.split('_');
                const syncPromise = fetch('/api/log-harvest-notes', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        potId,
                        cropName,
                        notes: data.notes
                    })
                });
                syncPromises.push(syncPromise);
            }

            await Promise.all(syncPromises);
            return true;
        } catch (error) {
            console.error('Error syncing with server:', error);
            return false;
        }
    }
}

module.exports = LocalStorageManager; 