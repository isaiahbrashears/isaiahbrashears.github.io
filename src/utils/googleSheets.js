import axios from 'axios';

/**
 * Fetches data from a public Google Sheet
 * @param {string} sheetId - The Google Sheet ID from the URL
 * @param {string} range - The range to fetch (e.g., 'Sheet1!A:A' or 'Players!A2:A')
 * @param {string} apiKey - Your Google API key
 * @returns {Promise<Array>} Array of values from the sheet
 */
export const fetchSheetData = async (sheetId, range, apiKey) => {
  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
    const response = await axios.get(url);

    // response.data.values is a 2D array, flatten it to 1D if single column
    if (response.data.values) {
      return response.data.values.flat();
    }
    return [];
  } catch (error) {
    console.error('Error fetching Google Sheets data:', error);
    throw error;
  }
};

/**
 * Updates a player's answer in Google Sheets via Apps Script
 * @param {number} row - The row number to update
 * @param {string} answer - The answer to write
 * @returns {Promise<void>}
 */
export const submitPlayerAnswer = async (row, answer) => {
  try {
    const scriptUrl = 'https://script.google.com/macros/s/AKfycby-TC6EWN63jKR3YeabBd1XCW9Kkdveen-GImiKzRqwb3ITdHp_2xHxaDmcBF7c5VFzlA/exec';

    await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify({ row, answer }),
      mode: 'no-cors'
    });

    // With no-cors mode, we can't read the response, but the request will succeed
    console.log('Answer submitted successfully');
  } catch (error) {
    console.error('Error submitting answer to Google Sheets:', error);
    throw error;
  }
};

/**
 * Helper to extract Sheet ID from a Google Sheets URL
 * @param {string} url - Full Google Sheets URL
 * @returns {string} The sheet ID
 */
export const extractSheetId = (url) => {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : url;
};
