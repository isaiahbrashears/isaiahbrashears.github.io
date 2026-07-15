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
  serverTimestamp,
  arrayUnion,
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
      order: index + 1,
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
    categoryIndex: 0, // 0-5 for categories A-F
    scoreIndex: 0, // 0-29 for the 30 questions (6 categories x 5 scores)
    isFinalJeopardy: false,
    categories: ['Category 1', 'Category 2', 'Category 3', 'Category 4', 'Category 5', 'Category 6'],
    scores: [200, 400, 600, 800, 1000],
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
      ...doc.data(),
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
 * @param {Array<string>} nextSkippedDrafterIds - Updated skip queue (see turnOrder.js)
 */
export const submitDraftedPlayer = async (playerId, draftedPlayer, nextTurnIndex, nextSkippedDrafterIds) => {
  const batch = writeBatch(db);

  const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
  batch.update(playerRef, {
    lastDraft: draftedPlayer,
    draftedPlayerList: arrayUnion(draftedPlayer),
    submittedAt: serverTimestamp(),
  });

  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  batch.set(gameStateRef, { currentTurnIndex: nextTurnIndex, skippedDrafterIds: nextSkippedDrafterIds }, { merge: true });

  await batch.commit();
};

/**
 * Skip the current drafter's turn without recording a pick, advancing the turn
 * per the queue rules in turnOrder.js (the skipped drafter gets revisited later in the round).
 * Also clears the current rule, since skipping forfeits that spin - whoever's up
 * next (including the skipped drafter, once revisited) needs a freshly spun rule.
 * @param {number} nextTurnIndex - Index into the draft order that should become active next
 * @param {Array<string>} nextSkippedDrafterIds - Updated skip queue (see turnOrder.js)
 */
export const skipDraftTurn = async (nextTurnIndex, nextSkippedDrafterIds) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  await setDoc(gameStateRef, {
    currentTurnIndex: nextTurnIndex,
    skippedDrafterIds: nextSkippedDrafterIds,
    currentRule: {},
  }, { merge: true });
};

/**
 * Save (or clear) the skip queue directly, e.g. when starting a new round
 * @param {Array<string>} ids - Player IDs waiting to be revisited, in order
 */
export const setFifaSkippedDrafterIds = async (ids) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  await setDoc(gameStateRef, { skippedDrafterIds: ids }, { merge: true });
};

/**
 * Subscribe to the current skip queue (real-time updates).
 * Safe to use even if the game state doc hasn't been initialized yet.
 * @param {Function} callback - Called with the skip queue array (player IDs, or [])
 * @returns {Function} Unsubscribe function
 */
export const subscribeToFifaSkippedDrafters = (callback) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);

  return onSnapshot(gameStateRef, (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data().skippedDrafterIds || []) : []);
  });
};

/**
 * Replace a single entry in a player's draftedPlayerList (e.g. to fix a typo),
 * keeping its recorded category/rule intact unless overridden in updatedEntry.
 * Also updates lastDraft if the edited entry is the most recent pick.
 * @param {string} playerId - The player's document ID
 * @param {number} pickIndex - Index into the drafter's draftedPlayerList
 * @param {{ name: string, currentCategory: string, currentRule: string }} updatedEntry - The corrected entry
 */
export const updateDraftedPlayerEntry = async (playerId, pickIndex, updatedEntry) => {
  const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
  const snapshot = await getDoc(playerRef);
  if (!snapshot.exists()) return;

  const draftedPlayerList = snapshot.data().draftedPlayerList || [];
  if (pickIndex < 0 || pickIndex >= draftedPlayerList.length) return;

  const newList = [...draftedPlayerList];
  newList[pickIndex] = updatedEntry;

  const updates = { draftedPlayerList: newList };
  if (pickIndex === draftedPlayerList.length - 1) {
    updates.lastDraft = updatedEntry;
  }

  await updateDoc(playerRef, updates);
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
 * back to the first drafter in that order, clearing any pending skips
 * @param {Array<string>} playerIds - Ordered array of player document IDs
 */
export const setFifaDraftOrder = async (playerIds) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  await setDoc(gameStateRef, { draftOrder: playerIds, currentTurnIndex: 0, skippedDrafterIds: [] }, { merge: true });
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
 * Save the tournament bracket: an array of rounds, each round a
 * { matchups: Array<{ id, player1Id, player1Name, player2Id, player2Name, winnerId }> }
 * object (not a bare array - Firestore doesn't allow arrays nested directly inside arrays).
 * A matchup with a null player2Id is a bye, auto-won by player1.
 * @param {Array<{ matchups: Array<Object> }>} rounds - The bracket's rounds
 */
export const setFifaBracket = async (rounds) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  await setDoc(gameStateRef, { bracket: rounds }, { merge: true });
};

/**
 * Subscribe to the tournament bracket (real-time updates).
 * Safe to use even if the game state doc hasn't been initialized yet.
 * @param {Function} callback - Called with the bracket's rounds array (or [])
 * @returns {Function} Unsubscribe function
 */
export const subscribeToFifaBracket = (callback) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);

  return onSnapshot(gameStateRef, (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data().bracket || []) : []);
  });
};

/**
 * Save (or clear) which drafted pick is currently unlocked for editing.
 * Set by an admin to let a specific drafter correct one of their own picks;
 * includes the category/rule that were active before the edit so they can be restored after.
 * @param {{ drafterId: string, pickIndex: number, previousCategory: string, previousRule: Object }|null} context
 */
export const setFifaEditingContext = async (context) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  await setDoc(gameStateRef, { editingContext: context }, { merge: true });
};

/**
 * Subscribe to the currently unlocked pick edit, if any (real-time updates).
 * @param {Function} callback - Called with the editing context object (or null)
 * @returns {Function} Unsubscribe function
 */
export const subscribeToFifaEditingContext = (callback) => {
  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);

  return onSnapshot(gameStateRef, (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data().editingContext || null) : null);
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
    scoreIndex: nextScoreIndex,
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
    createdAt: serverTimestamp(),
  }, { merge: true });

  return docId;
};

/**
 * Delete a player and remove them from the draft order, adjusting whose
 * turn it is if the removed drafter was before or at the active turn
 * @param {string} playerId - The player's document ID
 */
export const deleteFifaPlayer = async (playerId) => {
  const gameState = await fetchFifaGameState();
  const draftOrder = gameState.draftOrder || [];
  const currentTurnIndex = typeof gameState.currentTurnIndex === 'number' ? gameState.currentTurnIndex : 0;
  const skippedDrafterIds = gameState.skippedDrafterIds || [];

  const removedIndex = draftOrder.indexOf(playerId);
  const newDraftOrder = draftOrder.filter(id => id !== playerId);
  const newSkippedDrafterIds = skippedDrafterIds.filter(id => id !== playerId);

  let newTurnIndex = currentTurnIndex;
  if (removedIndex !== -1 && removedIndex < currentTurnIndex) {
    newTurnIndex -= 1;
  }
  newTurnIndex = Math.max(0, Math.min(newTurnIndex, newDraftOrder.length));

  const batch = writeBatch(db);

  const playerRef = doc(db, PLAYERS_COLLECTION, playerId);
  batch.delete(playerRef);

  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  batch.set(gameStateRef, {
    draftOrder: newDraftOrder,
    currentTurnIndex: newTurnIndex,
    skippedDrafterIds: newSkippedDrafterIds,
  }, { merge: true });

  await batch.commit();
};

/**
 * Fully reset the FIFA draft: deletes every player and resets the game state
 * (category, rule, round, draft order, turn index) back to defaults
 */
export const resetFifaGame = async () => {
  const playersRef = collection(db, PLAYERS_COLLECTION);
  const snapshot = await getDocs(playersRef);

  const batch = writeBatch(db);
  snapshot.forEach((playerDoc) => {
    batch.delete(playerDoc.ref);
  });

  const gameStateRef = doc(db, GAME_COLLECTION, GAME_STATE_DOC);
  batch.set(gameStateRef, {
    currentCategory: 'Category',
    currentRule: {},
    currentRound: 1,
    draftOrder: [],
    currentTurnIndex: 0,
    skippedDrafterIds: [],
  });

  await batch.commit();
};

export const subscribeToPlayers = (callback) => {
  const playersRef = collection(db, PLAYERS_COLLECTION);

  return onSnapshot(playersRef, (snapshot) => {
    const players = [];
    snapshot.forEach((doc) => {
      players.push({
        id: doc.id,
        ...doc.data(),
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
        ...snapshot.data(),
      });
    }
  });
};
