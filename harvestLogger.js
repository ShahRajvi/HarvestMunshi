const fs = require('fs');
const path = require('path');

// Ensure the logs directory exists
const LOGS_DIR = path.join(__dirname, 'logs', 'HarvestNotes');

// Create the logs directory if it doesn't exist
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
}

class HarvestLogger {
    /**
     * Creates or updates a harvest note file
     * @param {string} potId - The ID of the pot
     * @param {string} cropName - The name of the crop
     * @param {string} notes - The notes to be logged
     * @returns {Promise<void>}
     */
    static async logHarvestNotes(potId, cropName, notes) {
        const fileName = `${potId}_${cropName}.txt`;
        const filePath = path.join(LOGS_DIR, fileName);
        
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${notes}\n`;
        
        try {
            // Append the new note to the file
            await fs.promises.appendFile(filePath, logEntry);
            console.log(`Successfully logged notes for ${cropName} in pot ${potId}`);
        } catch (error) {
            console.error(`Error logging harvest notes: ${error.message}`);
            throw error;
        }
    }

    /**
     * Gets all harvest notes for a specific pot and crop
     * @param {string} potId - The ID of the pot
     * @param {string} cropName - The name of the crop
     * @returns {Promise<string>} The contents of the log file
     */
    static async getHarvestNotes(potId, cropName) {
        const fileName = `${potId}_${cropName}.txt`;
        const filePath = path.join(LOGS_DIR, fileName);
        
        try {
            if (fs.existsSync(filePath)) {
                const content = await fs.promises.readFile(filePath, 'utf8');
                return content;
            }
            return '';
        } catch (error) {
            console.error(`Error reading harvest notes: ${error.message}`);
            throw error;
        }
    }

    /**
     * Lists all harvest note files
     * @returns {Promise<string[]>} Array of harvest note filenames
     */
    static async listHarvestNotes() {
        try {
            const files = await fs.promises.readdir(LOGS_DIR);
            return files.filter(file => file.endsWith('.txt'));
        } catch (error) {
            console.error(`Error listing harvest notes: ${error.message}`);
            throw error;
        }
    }
}

module.exports = HarvestLogger; 