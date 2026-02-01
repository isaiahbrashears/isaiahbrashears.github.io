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
  serverTimestamp,
  query,
  orderBy,
  increment
} from 'firebase/firestore';

const SCATAGORIES_PLAYERS_COLLECTION = 'scatagories_players';
const SCATAGORIES_GAME_DOC = 'scatagories_game/gameState';

// ---- Players ----

// Real-time listener for all scatagories players, ordered by sign-up time
export const subscribeToScatagoriesPlayers = (callback) => {
  const playersRef = collection(db, SCATAGORIES_PLAYERS_COLLECTION);
  const q = query(playersRef, orderBy('createdAt', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const players = [];
    snapshot.forEach((doc) => {
      players.push({ id: doc.id, ...doc.data() });
    });
    callback(players);
  });
};

// Add a new player (idempotent - safe to call with existing names)
export const addScatagoriesPlayer = async (name) => {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Name cannot be empty');

  const docId = trimmed.toLowerCase();
  const playerRef = doc(db, SCATAGORIES_PLAYERS_COLLECTION, docId);

  await setDoc(playerRef, {
    name: trimmed,
    createdAt: serverTimestamp()
  }, { merge: true });

  return docId;
};

// Check if a player exists by name
export const findScatagoriesPlayer = async (name) => {
  const docId = name.trim().toLowerCase();
  const playerRef = doc(db, SCATAGORIES_PLAYERS_COLLECTION, docId);
  const snapshot = await getDoc(playerRef);

  if (snapshot.exists()) {
    return { id: snapshot.id, ...snapshot.data() };
  }
  return null;
};

// One-time fetch of all players
export const fetchAllScatagoriesPlayers = async () => {
  const playersRef = collection(db, SCATAGORIES_PLAYERS_COLLECTION);
  const q = query(playersRef, orderBy('createdAt', 'asc'));
  const snapshot = await getDocs(q);

  const players = [];
  snapshot.forEach((doc) => {
    players.push({ id: doc.id, ...doc.data() });
  });
  return players;
};

// Save a player's answers (A-Z map)
export const savePlayerAnswers = async (playerName, answers) => {
  const docId = playerName.trim().toLowerCase();
  const playerRef = doc(db, SCATAGORIES_PLAYERS_COLLECTION, docId);
  await updateDoc(playerRef, { answers });
};

// Subscribe to a single player's data in real-time
export const subscribeToPlayer = (playerName, callback) => {
  const docId = playerName.trim().toLowerCase();
  const playerRef = doc(db, SCATAGORIES_PLAYERS_COLLECTION, docId);
  return onSnapshot(playerRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    }
  });
};

// Save scores and add round points to cumulative totalScore
export const savePlayerScores = async (playerId, scores, roundPoints) => {
  const playerRef = doc(db, SCATAGORIES_PLAYERS_COLLECTION, playerId);
  await updateDoc(playerRef, { scores, totalScore: increment(roundPoints) });
};

// ---- Game State ----

// Subscribe to game state in real-time
export const subscribeToGameState = (callback) => {
  const gameRef = doc(db, ...SCATAGORIES_GAME_DOC.split('/'));
  return onSnapshot(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback({ roundActive: false });
    }
  });
};

export const startRound = async (durationMs = 195000) => {
  const gameRef = doc(db, ...SCATAGORIES_GAME_DOC.split('/'));
  await setDoc(gameRef, { roundActive: true, roundEndTime: Date.now() + durationMs, timerPaused: false, timeRemaining: null }, { merge: true });

  // Clear all player answers
  const playersRef = collection(db, SCATAGORIES_PLAYERS_COLLECTION);
  const snapshot = await getDocs(playersRef);
  const updates = [];
  snapshot.forEach((playerDoc) => {
    updates.push(updateDoc(playerDoc.ref, { answers: {} }));
  });
  await Promise.all(updates);
};

// Pause the round timer
export const pauseRound = async (timeRemainingMs) => {
  const gameRef = doc(db, ...SCATAGORIES_GAME_DOC.split('/'));
  await setDoc(gameRef, { timerPaused: true, roundEndTime: null, timeRemaining: timeRemainingMs }, { merge: true });
};

// Resume the round timer
export const resumeRound = async (timeRemainingMs) => {
  const gameRef = doc(db, ...SCATAGORIES_GAME_DOC.split('/'));
  await setDoc(gameRef, { timerPaused: false, roundEndTime: Date.now() + timeRemainingMs, timeRemaining: null }, { merge: true });
};

// End the current round
export const endRound = async () => {
  const gameRef = doc(db, ...SCATAGORIES_GAME_DOC.split('/'));
  await setDoc(gameRef, { roundActive: false, roundEndTime: null, timerPaused: false, timeRemaining: null }, { merge: true });
};

// Set the current category
export const setCategory = async (category) => {
  const gameRef = doc(db, ...SCATAGORIES_GAME_DOC.split('/'));
  await setDoc(gameRef, { category }, { merge: true });
};

// Reset entire game - delete all players and game state
export const resetGame = async () => {
  const playersRef = collection(db, SCATAGORIES_PLAYERS_COLLECTION);
  const snapshot = await getDocs(playersRef);
  const deletes = [];
  snapshot.forEach((playerDoc) => {
    deletes.push(deleteDoc(playerDoc.ref));
  });
  await Promise.all(deletes);

  const gameRef = doc(db, ...SCATAGORIES_GAME_DOC.split('/'));
  await setDoc(gameRef, { roundActive: false, category: '' });
};
