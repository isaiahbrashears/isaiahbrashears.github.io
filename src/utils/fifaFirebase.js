import { db } from '../config/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  increment,
  serverTimestamp
} from 'firebase/firestore';

// Collection references
const PLAYERS_COLLECTION = 'fifa_players';
const GAME_STATE_DOC = 'fifa_gameState';
const GAME_COLLECTION = 'fifa_game';

/**
 * Initialize players in Firestore (run once to set up initial data)
 * @param {Array} fifaPlayerNames - Array of player names
 */
export const initializePlayers = async (fifaPlayerNames) => {
  const batch = writeBatch(db);

  fifaPlayerNames.forEach((name, index) => {
    const playerRef = doc(db, PLAYERS_COLLECTION, `player_${index + 1}`);
    batch.set(playerRef, {
      name: name,
      score: 0,
      answer: '',
      wager: 0,
      wagerSubmitted: false,
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
export const fetchAllFifaPlayers = async () => {
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
export const fetchfifaPlayerNames = async () => {
  const players = await fetchAllFifaPlayers();
  return players.map(p => p.name).filter(name => name && name.trim() !== '');
};

/**
 * Find player by name and return their data
 * @param {string} playerName - The player's name
 * @returns {Promise<Object|null>} Player object or null
 */
export const findFifaPlayerByName = async (playerName) => {
  const players = await fetchAllFifaPlayers();
  return players.find(p => p.name === playerName) || null;
};

/**
 * Fetch game state
 * @returns {Promise<Object>} Game state object
 */
export const fetchFifaGameState = async () => {
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
  const gameState = await fetchFifaGameState();

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
  await updateDoc(playerRef, { answer, submittedAt: serverTimestamp() });
};

export const setPlayerScore = async (playerId, score) => {
  const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
  await updateDoc(playerRef, { score });
};

/**
 * Advance to the next question (update category/score indices)
 */
export const advanceToNextQuestion = async () => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  const gameState = await fetchFifaGameState();

  let nextScoreIndex = gameState.scoreIndex + 1;

  // Reset if we've gone through all 30 questions
  if (nextScoreIndex >= 30) {
    nextScoreIndex = 0;
  }

  await updateDoc(gameStateRef, {
    scoreIndex: nextScoreIndex
  });
};

// ==================== REAL-TIME LISTENERS ====================

/**
 * Subscribe to all players (real-time updates)
 * @param {Function} callback - Function to call with updated players array
 * @returns {Function} Unsubscribe function
 */
/**
 * Add a new player by name (idempotent - safe to call with existing names)
 * @param {string} name - Player name
 * @returns {Promise<string>} The player's doc ID
 */
export const addFifaPlayer = async (name) => {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Name cannot be empty');

  const docId = trimmed.toLowerCase().replace(/\s+/g, '_');
  const playerRef = doc(db, PLAYERS_COLLECTION, docId);

  await setDoc(playerRef, {
    name: trimmed,
    score: 0,
    answer: '',
    wager: 0,
    wagerSubmitted: false,
    createdAt: serverTimestamp()
  }, { merge: true });

  return docId;
};

export const deleteFifaPlayer = async (playerId) => {
  const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
  await deleteDoc(playerRef);
};

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
