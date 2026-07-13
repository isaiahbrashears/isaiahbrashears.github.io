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
  serverTimestamp,
  arrayUnion
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
  };
};

/**
 * Submit a drafted player: records it as the player's last draft, appends it
 * to their running draftedPlayerList, and advances the draft turn to the next drafter
 * @param {string} playerId - The player's document ID
 * @param {{ name: string, currentCategory: string, currentRule: string }} draftedPlayer - The drafted player entry
 * @param {number} nextTurnIndex - Index into the draft order that should become active next
 */
export const submitDraftedPlayer = async (playerId, draftedPlayer, nextTurnIndex) => {
  const batch = writeBatch(db);

  const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
  batch.update(playerRef, {
    lastDraft: draftedPlayer,
    draftedPlayerList: arrayUnion(draftedPlayer),
    submittedAt: serverTimestamp()
  });

  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  batch.set(gameStateRef, { currentTurnIndex: nextTurnIndex }, { merge: true });

  await batch.commit();
};

export const setPlayerScore = async (playerId, score) => {
  const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
  await updateDoc(playerRef, { score });
};

/**
 * Save the currently selected FIFA draft category (e.g. 'Nationality', 'League')
 * @param {string} category - The category name
 */
export const setFifaCurrentCategory = async (category) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  await setDoc(gameStateRef, { currentCategory: category }, { merge: true });
};

/**
 * Save the currently selected FIFA draft category (e.g. 'Nationality', 'League')
 * @param {string} rule - The rule name
 */
export const setFifaCurrentRule = async (rule) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  await setDoc(gameStateRef, { currentRule: rule }, { merge: true });
};

/**
 * Subscribe to just the current FIFA draft rule (real-time updates).
 * Safe to use even if the game state doc hasn't been initialized yet.
 * @param {Function} callback - Called with the current rule string (or undefined)
 * @returns {Function} Unsubscribe function
 */
export const subscribeToFifaCurrentRule = (callback) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);

  return onSnapshot(gameStateRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.data().currentRule : undefined);
  });
};


/**
 * Subscribe to just the current FIFA draft category (real-time updates).
 * Safe to use even if the game state doc hasn't been initialized yet.
 * @param {Function} callback - Called with the current category string (or undefined)
 * @returns {Function} Unsubscribe function
 */
export const subscribeToFifaCurrentCategory = (callback) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);

  return onSnapshot(gameStateRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.data().currentCategory : undefined);
  });
};

/**
 * Save the current FIFA draft round (1-15)
 * @param {number} round - The round number
 */
export const setFifaCurrentRound = async (round) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  await setDoc(gameStateRef, { currentRound: round }, { merge: true });
};

/**
 * Subscribe to the current FIFA draft round (real-time updates).
 * Safe to use even if the game state doc hasn't been initialized yet.
 * @param {Function} callback - Called with the current round number (or undefined)
 * @returns {Function} Unsubscribe function
 */
export const subscribeToFifaCurrentRound = (callback) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);

  return onSnapshot(gameStateRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.data().currentRound : undefined);
  });
};

/**
 * Save the draft order (array of player document IDs) and reset the turn
 * back to the first drafter in that order
 * @param {Array<string>} playerIds - Ordered array of player document IDs
 */
export const setFifaDraftOrder = async (playerIds) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  await setDoc(gameStateRef, { draftOrder: playerIds, currentTurnIndex: 0 }, { merge: true });
};

/**
 * Subscribe to the current draft order (real-time updates).
 * Safe to use even if the game state doc hasn't been initialized yet.
 * @param {Function} callback - Called with the draft order array (or undefined)
 * @returns {Function} Unsubscribe function
 */
export const subscribeToFifaDraftOrder = (callback) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);

  return onSnapshot(gameStateRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.data().draftOrder : undefined);
  });
};

/**
 * Save whose turn it currently is (index into the draft order)
 * @param {number} index - Index into the draft order
 */
export const setFifaCurrentTurnIndex = async (index) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  await setDoc(gameStateRef, { currentTurnIndex: index }, { merge: true });
};

/**
 * Subscribe to whose turn it currently is (real-time updates).
 * Safe to use even if the game state doc hasn't been initialized yet.
 * @param {Function} callback - Called with the current turn index (or undefined)
 * @returns {Function} Unsubscribe function
 */
export const subscribeToFifaCurrentTurnIndex = (callback) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);

  return onSnapshot(gameStateRef, (snapshot) => {
    callback(snapshot.exists() ? snapshot.data().currentTurnIndex : undefined);
  });
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
    draftedPlayerList: [],
    lastDraft: '',
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
