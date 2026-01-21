import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  onSnapshot,
  writeBatch,
  increment
} from 'firebase/firestore';

// Collection references
const PLAYERS_COLLECTION = 'players';
const GAME_STATE_DOC = 'gameState';
const GAME_COLLECTION = 'game';

/**
 * Initialize players in Firestore (run once to set up initial data)
 * @param {Array} playerNames - Array of player names
 */
export const initializePlayers = async (playerNames) => {
  const batch = writeBatch(db);

  playerNames.forEach((name, index) => {
    const playerRef = doc(db, PLAYERS_COLLECTION, `player_${index + 1}`);
    batch.set(playerRef, {
      name: name,
      score: 0,
      answer: '',
      wager: 0,
      order: index + 1
    });
  });

  await batch.commit();
};

/**
 * Initialize game state in Firestore
 */
export const initializeGameState = async () => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  await setDoc(gameStateRef, {
    categoryIndex: 0,    // 0-5 for categories A-F
    scoreIndex: 0,       // 0-29 for the 30 questions (6 categories x 5 scores)
    isFinalJeopardy: false,
    categories: ['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5', 'Category 6'],
    scores: [200, 400, 600, 800, 1000]
  });
};

/**
 * Fetch all players with their data
 * @returns {Promise<Array>} Array of player objects
 */
export const fetchAllPlayers = async () => {
  const playersRef = collection(db, PLAYERS_COLLECTION);
  const snapshot = await getDocs(playersRef);

  const players = [];
  snapshot.forEach((doc) => {
    players.push({
      id: doc.id,
      ...doc.data()
    });
  });

  // Sort by order
  return players.sort((a, b) => a.order - b.order);
};

/**
 * Fetch player names only (for player selection)
 * @returns {Promise<Array>} Array of player names
 */
export const fetchPlayerNames = async () => {
  const players = await fetchAllPlayers();
  return players.map(p => p.name).filter(name => name && name.trim() !== '');
};

/**
 * Find player by name and return their data
 * @param {string} playerName - The player's name
 * @returns {Promise<Object|null>} Player object or null
 */
export const findPlayerByName = async (playerName) => {
  const players = await fetchAllPlayers();
  return players.find(p => p.name === playerName) || null;
};

/**
 * Fetch game state
 * @returns {Promise<Object>} Game state object
 */
export const fetchGameState = async () => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  const snapshot = await getDoc(gameStateRef);

  if (snapshot.exists()) {
    return snapshot.data();
  }

  // Return default state if not initialized
  return {
    categoryIndex: 0,
    scoreIndex: 0,
    isFinalJeopardy: false,
    categories: ['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5', 'Category 6'],
    scores: [200, 400, 600, 800, 1000]
  };
};

/**
 * Get current category and score from game state
 * @returns {Promise<Object>} Current category, score, and final jeopardy status
 */
export const fetchCurrentCategoryAndScore = async () => {
  const gameState = await fetchGameState();

  const categoryIndex = gameState.scoreIndex % 6;  // Which category (0-5)
  const scoreRow = Math.floor(gameState.scoreIndex / 6);  // Which score row (0-4)

  return {
    category: gameState.categories[categoryIndex] || '',
    score: gameState.scores[scoreRow] || 0,
    categoryIndex,
    scoreIndex: gameState.scoreIndex,
    isFinalJeopardy: gameState.isFinalJeopardy
  };
};

/**
 * Submit a player's answer
 * @param {string} playerId - The player's document ID
 * @param {string} answer - The answer text
 */
export const submitPlayerAnswer = async (playerId, answer) => {
  const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
  await updateDoc(playerRef, { answer });
};

/**
 * Submit a player's wager (Final Jeopardy)
 * @param {string} playerId - The player's document ID
 * @param {number} wager - The wager amount
 */
export const submitPlayerWager = async (playerId, wager) => {
  const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
  await updateDoc(playerRef, { wager });
};

/**
 * Update a player's score
 * @param {string} playerId - The player's document ID
 * @param {number} pointsToAdd - Points to add (can be negative)
 */
export const updatePlayerScore = async (playerId, pointsToAdd) => {
  const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
  await updateDoc(playerRef, {
    score: increment(pointsToAdd)
  });
};

/**
 * Advance to the next question (update category/score indices)
 */
export const advanceToNextQuestion = async () => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  const gameState = await fetchGameState();

  let nextScoreIndex = gameState.scoreIndex + 1;

  // Reset if we've gone through all 30 questions
  if (nextScoreIndex >= 30) {
    nextScoreIndex = 0;
  }

  await updateDoc(gameStateRef, {
    scoreIndex: nextScoreIndex
  });
};

/**
 * Clear all player answers
 */
export const clearAllAnswers = async () => {
  const players = await fetchAllPlayers();
  const batch = writeBatch(db);

  players.forEach(player => {
    const playerRef = doc(db, PLAYERS_COLLECTION, player.id);
    batch.update(playerRef, { answer: '' });
  });

  await batch.commit();
};

/**
 * Set Final Jeopardy mode
 * @param {boolean} isFinal - Whether to enable Final Jeopardy
 */
export const setFinalJeopardy = async (isFinal) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  await updateDoc(gameStateRef, { isFinalJeopardy: isFinal });
};

/**
 * Set Double Jeopardy mode
 * @param {boolean} isDouble - Whether to enable Double Jeopardy
 */
export const setDoubleJeopardy = async (isDouble) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  await updateDoc(gameStateRef, {
    isDoubleJeopardy: isDouble,
    scoreIndex: 0  // Reset to first question when switching rounds
  });
};

/**
 * Reset the entire game
 */
export const resetGame = async () => {
  const players = await fetchAllPlayers();
  const batch = writeBatch(db);

  // Reset all players
  players.forEach(player => {
    const playerRef = doc(db, PLAYERS_COLLECTION, player.id);
    batch.update(playerRef, {
      score: 0,
      answer: '',
      wager: 0
    });
  });

  // Reset game state
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  batch.update(gameStateRef, {
    scoreIndex: 0,
    isFinalJeopardy: false,
    isDoubleJeopardy: false
  });

  await batch.commit();
};

/**
 * Update game categories
 * @param {Array} categories - Array of 6 category names
 */
export const updateCategories = async (categories) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  await updateDoc(gameStateRef, { categories });
};

/**
 * Update score values
 * @param {Array} scores - Array of 5 score values
 */
export const updateScores = async (scores) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  await updateDoc(gameStateRef, { scores });
};

// ==================== REAL-TIME LISTENERS ====================

/**
 * Subscribe to all players (real-time updates)
 * @param {Function} callback - Function to call with updated players array
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPlayers = (callback) => {
  const playersRef = collection(db, PLAYERS_COLLECTION);

  return onSnapshot(playersRef, (snapshot) => {
    const players = [];
    snapshot.forEach((doc) => {
      players.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Sort by order
    players.sort((a, b) => a.order - b.order);
    callback(players);
  });
};

/**
 * Subscribe to game state (real-time updates)
 * @param {Function} callback - Function to call with updated game state
 * @returns {Function} Unsubscribe function
 */
export const subscribeToGameState = (callback) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);

  return onSnapshot(gameStateRef, (snapshot) => {
    if (snapshot.exists()) {
      const gameState = snapshot.data();

      const categoryIndex = gameState.scoreIndex % 6;
      const scoreRow = Math.floor(gameState.scoreIndex / 6);

      // Use double jeopardy categories if in double jeopardy mode
      const activeCategories = gameState.isDoubleJeopardy
        ? (gameState.doubleCategories || gameState.categories)
        : gameState.categories;

      // Double the scores if in double jeopardy mode
      const baseScore = gameState.scores[scoreRow] || 0;
      const activeScore = gameState.isDoubleJeopardy ? baseScore * 2 : baseScore;

      callback({
        ...gameState,
        category: activeCategories[categoryIndex] || '',
        score: activeScore,
        categoryIndex,
        currentScoreIndex: gameState.scoreIndex,
        isDoubleJeopardy: gameState.isDoubleJeopardy || false
      });
    }
  });
};

/**
 * Subscribe to a specific player (real-time updates)
 * @param {string} playerId - The player's document ID
 * @param {Function} callback - Function to call with updated player data
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPlayer = (playerId, callback) => {
  const playerRef = doc(db, PLAYERS_COLLECTION, playerId);

  return onSnapshot(playerRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({
        id: snapshot.id,
        ...snapshot.data()
      });
    }
  });
};
