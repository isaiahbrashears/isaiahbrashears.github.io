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
 * Fetches a player's score from column B
 * @param {string} sheetId - The Google Sheet ID from the URL
 * @param {number} row - The row number to fetch
 * @param {string} apiKey - Your Google API key
 * @returns {Promise<number>} The player's score (0 if blank)
 */
export const fetchPlayerScore = async (sheetId, row, apiKey) => {
  try {
    const range = `Players!B${row}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
    const response = await axios.get(url);

    // Check if there's a value in the cell
    if (response.data.values && response.data.values[0] && response.data.values[0][0]) {
      const score = parseInt(response.data.values[0][0], 10);
      return isNaN(score) ? 0 : score;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching player score:', error);
    return 0;
  }
};

/**
 * Fetches all players with their scores, answers, and wagers (columns A, B, C, and D)
 * @param {string} sheetId - The Google Sheet ID from the URL
 * @param {string} apiKey - Your Google API key
 * @returns {Promise<Array>} Array of objects with name, score, answer, wager, and row
 */
export const fetchAllPlayersWithScores = async (sheetId, apiKey) => {
  try {
    const range = 'Players!A2:D11';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
    const response = await axios.get(url);

    if (response.data.values) {
      return response.data.values.map((row, index) => ({
        name: row[0] || '',
        score: row[1] ? parseInt(row[1], 10) : 0,
        answer: row[2] || '',
        wager: row[3] ? parseInt(row[3], 10) : 0,
        row: index + 2 // Row number starts at 2
      })).filter(player => player.name.trim() !== '');
    }
    return [];
  } catch (error) {
    console.error('Error fetching players with scores:', error);
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
    // TODO: Replace with your new deployment URL after creating fresh deployment
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbx35za_dPo9AX6rBguULzz813eDCYYZuwJ6zqMezBnZ0yDs1Ize0dBzNcUfVBLOY3vUTQ/exec';

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
 * Submits a player's wager to Google Sheets via Apps Script
 * @param {number} row - The row number to update
 * @param {number} wager - The wager amount
 * @returns {Promise<void>}
 */
export const submitPlayerWager = async (row, wager) => {
  try {
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbx35za_dPo9AX6rBguULzz813eDCYYZuwJ6zqMezBnZ0yDs1Ize0dBzNcUfVBLOY3vUTQ/exec';
    const payload = { action: 'submitWager', row, wager };

    console.log('Submitting wager:', payload);
    console.log('To URL:', scriptUrl);

    const response = await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      mode: 'no-cors'
    });

    console.log('Wager submitted successfully - Response status:', response.status);
    console.log('Note: With no-cors mode, we cannot read the actual response');
  } catch (error) {
    console.error('Error submitting wager:', error);
    throw error;
  }
};

/**
 * Fetches current category and score from Points sheet
 * @param {string} sheetId - The Google Sheet ID from the URL
 * @param {string} apiKey - Your Google API key
 * @returns {Promise<{category: string, score: number, categoryCell: string, scoreCell: string, isFinalJeopardy: boolean}>} Current category, score, cell references, and final jeopardy status
 */
export const fetchCurrentCategoryAndScore = async (sheetId, apiKey) => {
  try {
    const range = 'Points!H2:H6';
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apiKey}`;
    const response = await axios.get(url);

    if (response.data.values) {
      const categoryCell = response.data.values[0] ? response.data.values[0][0] : 'A1';
      const scoreCell = response.data.values[2] ? response.data.values[2][0] : 'A2';
      const isFinalJeopardy = response.data.values[4] ? response.data.values[4][0] === 'TRUE' : false;

      // Now fetch the actual values from those cells
      const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchGet?ranges=${encodeURIComponent('Points!' + categoryCell)}&ranges=${encodeURIComponent('Points!' + scoreCell)}&key=${apiKey}`;
      const valuesResponse = await axios.get(valuesUrl);

      const category = valuesResponse.data.valueRanges[0]?.values?.[0]?.[0] || '';
      const score = valuesResponse.data.valueRanges[1]?.values?.[0]?.[0] || 0;

      return {
        category,
        score: parseInt(score, 10) || 0,
        categoryCell,
        scoreCell,
        isFinalJeopardy
      };
    }
    return { category: '', score: 0, categoryCell: 'A1', scoreCell: 'A2', isFinalJeopardy: false };
  } catch (error) {
    console.error('Error fetching category and score:', error);
    return { category: '', score: 0, categoryCell: 'A1', scoreCell: 'A2', isFinalJeopardy: false };
  }
};

/**
 * Updates a player's score in Google Sheets via Apps Script
 * @param {number} row - The row number to update
 * @param {number} pointsToAdd - The points to add to the player's score
 * @returns {Promise<void>}
 */
export const updatePlayerScore = async (row, pointsToAdd) => {
  try {
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbx35za_dPo9AX6rBguULzz813eDCYYZuwJ6zqMezBnZ0yDs1Ize0dBzNcUfVBLOY3vUTQ/exec';

    await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify({ action: 'updateScore', row, pointsToAdd }),
      mode: 'no-cors'
    });

    console.log('Score updated successfully');
  } catch (error) {
    console.error('Error updating score:', error);
    throw error;
  }
};

/**
 * Updates the category and score cell references in Points sheet
 * @param {string} currentCategoryCell - Current category cell reference (e.g., 'A1')
 * @param {string} currentScoreCell - Current score cell reference (e.g., 'A2')
 * @returns {Promise<void>}
 */
export const updateCellReferences = async (currentCategoryCell, currentScoreCell) => {
  try {
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbx35za_dPo9AX6rBguULzz813eDCYYZuwJ6zqMezBnZ0yDs1Ize0dBzNcUfVBLOY3vUTQ/exec';

    await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'updateCellReferences',
        categoryCell: currentCategoryCell,
        scoreCell: currentScoreCell
      }),
      mode: 'no-cors'
    });

    console.log('Cell references updated successfully');
  } catch (error) {
    console.error('Error updating cell references:', error);
    throw error;
  }
};

/**
 * Clears all player answers in Google Sheets via Apps Script
 * @returns {Promise<void>}
 */
export const clearAllAnswers = async () => {
  try {
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbx35za_dPo9AX6rBguULzz813eDCYYZuwJ6zqMezBnZ0yDs1Ize0dBzNcUfVBLOY3vUTQ/exec';

    console.log('Sending clear answers request...');

    await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify({ action: 'clearAnswers' }),
      mode: 'no-cors'
    });

    console.log('Clear answers request sent successfully');
  } catch (error) {
    console.error('Error clearing answers:', error);
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

/**
 * Toggles Final Jeopardy mode in Google Sheets
 * Writes TRUE/FALSE to Points!H6
 */
export const setFinalJeopardy = async (isFinal) => {
  try {
    const scriptUrl =
      'https://script.google.com/macros/s/AKfycbx35za_dPo9AX6rBguULzz813eDCYYZuwJ6zqMezBnZ0yDs1Ize0dBzNcUfVBLOY3vUTQ/exec';

    await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify({
        action: 'setFinalJeopardy',
        value: isFinal
      }),
      mode: 'no-cors'
    });

    console.log('Final Jeopardy updated:', isFinal);
  } catch (err) {
    console.error('Error setting Final Jeopardy:', err);
    throw err;
  }
};
