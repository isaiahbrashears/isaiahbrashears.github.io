/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef } from "react";
import {
  subscribeToScatagoriesPlayers,
  subscribeToGameState,
  startRound,
  endRound,
  pauseRound,
  resumeRound,
  savePlayerScores,
  setCategory as setCategoryInDb,
  resetGame
} from '../../../utils/scatagoriesFirebase';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const generateCategoryFromAI = async () => {
  const res = await fetch('http://localhost:3001/api/generate-category', {
    method: 'POST'
  });

  if (!res.ok) {
    console.error('Backend error');
    return null;
  }

  const data = await res.json();
  return data.category;
};

// Auto-score a letter for a player
// Returns { point, duplicate, wrongLetter }
const autoScore = (letter, answer, otherPlayersAnswers) => {
  if (!answer || !answer.trim()) return { point: false, duplicate: false, wrongLetter: false };

  const trimmed = answer.trim();

  // No point if word doesn't start with the letter
  if (trimmed[0].toUpperCase() !== letter) return { point: false, duplicate: false, wrongLetter: true };

  // No point if answer matches any other player's answer
  const normalized = trimmed.toLowerCase();
  const otherNormalized = otherPlayersAnswers
    .map(a => (a || '').trim().toLowerCase())
    .filter(a => a.length > 0);

  if (otherNormalized.includes(normalized)) return { point: false, duplicate: true, wrongLetter: false };

  return { point: true, duplicate: false, wrongLetter: false };
};

const AdminPortal = () => {
  const [players, setPlayers] = useState([]);
  const [roundActive, setRoundActive] = useState(false);
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  // scores: { playerId: { A: true/false, B: true/false, ... } }
  const [scores, setScores] = useState({});
  // flags: { playerId: { A: { duplicate, wrongLetter }, ... } }
  const [flags, setFlags] = useState({});
  const [scoresInitialized, setScoresInitialized] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerPaused, setTimerPaused] = useState(false);
  const [roundEndTime, setRoundEndTime] = useState(null);
  const [pausedRemaining, setPausedRemaining] = useState(null);
  const [generating, setGenerating] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const unsubPlayers = subscribeToScatagoriesPlayers((allPlayers) => {
      setPlayers(allPlayers);
      setLoading(false);
    });
    const unsubGame = subscribeToGameState((gameState) => {
      setRoundActive(gameState.roundActive);
      setCategory(gameState.category || '');
      setRoundEndTime(gameState.roundEndTime || null);
      setTimerPaused(gameState.timerPaused || false);
      setPausedRemaining(gameState.timeRemaining || null);
      if (gameState.roundActive) {
        setScores({});
        setScoresInitialized(false);
      } else {
        setTimeLeft(null);
      }
    });
    return () => {
      if (unsubPlayers) unsubPlayers();
      if (unsubGame) unsubGame();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (!roundActive) { setTimeLeft(null); return; }
    if (timerPaused) {
      setTimeLeft(pausedRemaining ? Math.ceil(pausedRemaining / 1000) : null);
      return;
    }
    if (!roundEndTime) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((roundEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        endRound();
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [roundActive, roundEndTime, timerPaused, pausedRemaining]);

  // Auto-calculate scores when round ends and players have answers
  useEffect(() => {
    if (roundActive || scoresInitialized || players.length === 0) return;

    const hasAnswers = players.some(p => p.answers && Object.keys(p.answers).length > 0);
    if (!hasAnswers) return;

    const initialScores = {};
    const initialFlags = {};
    players.forEach(player => {
      const playerAnswers = player.answers || {};
      const playerScores = {};
      const playerFlags = {};

      LETTERS.forEach(letter => {
        const otherAnswers = players
          .filter(p => p.id !== player.id)
          .map(p => (p.answers || {})[letter]);

        const result = autoScore(letter, playerAnswers[letter], otherAnswers);
        playerScores[letter] = result.point;
        playerFlags[letter] = { duplicate: result.duplicate, wrongLetter: result.wrongLetter };
      });

      initialScores[player.id] = playerScores;
      initialFlags[player.id] = playerFlags;
    });

    setScores(initialScores);
    setFlags(initialFlags);
    setScoresInitialized(true);
  }, [roundActive, players, scoresInitialized]);

  const handleStartRound = async () => {
    await startRound();
  };

  const handleEndRound = async () => {
    await endRound();
  };

  const handlePauseResume = async () => {
    if (timerPaused) {
      await resumeRound(pausedRemaining);
    } else {
      const remaining = Math.max(0, roundEndTime - Date.now());
      await pauseRound(remaining);
    }
  };

  const toggleScore = (playerId, letter) => {
    setScores(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [letter]: !prev[playerId]?.[letter]
      }
    }));
  };

  const getPlayerTotal = (playerId) => {
    const playerScores = scores[playerId] || {};
    return Object.values(playerScores).filter(Boolean).length;
  };

  const handleCategoryChange = async (e) => {
    const val = e.target.value;
    setCategory(val);
    await setCategoryInDb(val);
  };

  const handleGenerateCategory = async () => {
    setGenerating(true);
    try {
      const text = await generateCategoryFromAI();
      if (text) {
        setCategory(text);
        await setCategoryInDb(text);
      }
    } catch (err) {
      console.error('Failed to generate category:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleResetGame = async () => {
    if (window.confirm('This will delete all players and scores. Are you sure?')) {
      await resetGame();
      setScores({});
      setFlags({});
      setScoresInitialized(false);
    }
  };

  const handleSaveScores = async () => {
    const promises = Object.entries(scores).map(([playerId, playerScores]) => {
      const roundPoints = Object.values(playerScores).filter(Boolean).length;
      return savePlayerScores(playerId, playerScores, roundPoints);
    });
    await Promise.all(promises);
  };

  if (loading) {
    return <div className="scategories-admin"><p>Loading...</p></div>;
  }

  const showAnswers = !roundActive && players.some(p => p.answers && Object.keys(p.answers).length > 0);

  return (
    <div className="scategories-admin">
      <h2>Admin Portal</h2>

      <div className="category-section">
        <label>Category</label>
        <div className="category-input-row">
          <input
            type="text"
            value={category}
            onChange={handleCategoryChange}
            placeholder="Enter category..."
          />
          <button className="generate-button" onClick={handleGenerateCategory} disabled={generating}>
            {generating ? '...' : 'Generate'}
          </button>
        </div>
      </div>

      <div className="round-controls">
        {roundActive ? (
          <>
            <button className="round-button end" onClick={handleEndRound}>
              End Round
            </button>
            <button className="round-button pause" onClick={handlePauseResume}>
              {timerPaused ? 'Resume' : 'Pause'}
            </button>
          </>
        ) : (
          <button className="round-button start" onClick={handleStartRound} disabled={!category.trim()}>
            Start Round
          </button>
        )}
        <span className="round-status">
          {roundActive
            ? timerPaused ? `PAUSED - ${timeLeft}s` : timeLeft != null ? `${timeLeft}s remaining` : 'Round in progress'
            : !category.trim() ? 'Enter a category to start' : 'Round not active'}
        </span>
      </div>

      {showAnswers && (
        <div className="all-answers">
          <div className="answers-header">
            <h3>Player Answers</h3>
            <button className="save-scores-button" onClick={handleSaveScores}>
              Save Scores
            </button>
          </div>
          <div className="player-columns">
            {players.map((player) => {
              const playerAnswers = player.answers || {};
              const playerScores = scores[player.id] || {};
              const playerFlags = flags[player.id] || {};

              return (
                <div key={player.id} className="player-answers-card">
                  <div className="player-card-header">
                    <h4>{player.name}</h4>
                    <span className="player-total">{getPlayerTotal(player.id)} pts</span>
                  </div>
                  <div className="answers-grid">
                    {LETTERS.map(letter => {
                      const answer = playerAnswers[letter];
                      const hasPoint = playerScores[letter] || false;
                      const letterFlags = playerFlags[letter] || {};

                      return (
                        <div key={letter} className={`answer-row ${answer ? '' : 'empty'} ${letterFlags.duplicate ? 'duplicate' : ''} ${letterFlags.wrongLetter ? 'wrong-letter' : ''}`}>
                          <span className="answer-letter">{letter}.</span>
                          <span className="answer-text">{answer || '-'}</span>
                          <button
                            className={`score-toggle ${hasPoint ? 'point' : 'no-point'}`}
                            onClick={() => toggleScore(player.id, letter)}
                          >
                            {hasPoint ? '+1' : '0'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}


          </div>
        </div>
      )}
      <button className="round-button reset" onClick={handleResetGame}>
        Reset Game
      </button>
    </div>
  );
};

export default AdminPortal;
