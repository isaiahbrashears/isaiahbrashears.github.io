/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  subscribeToScatagoriesPlayers,
  subscribeToGameState,
  startRound,
  endRound,
  savePlayerScores,
  setCategory as setCategoryInDb,
  resetGame
} from '../../../utils/scatagoriesFirebase';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

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

  useEffect(() => {
    const unsubPlayers = subscribeToScatagoriesPlayers((allPlayers) => {
      setPlayers(allPlayers);
      setLoading(false);
    });
    const unsubGame = subscribeToGameState((gameState) => {
      setRoundActive(gameState.roundActive);
      setCategory(gameState.category || '');
      if (gameState.roundActive) {
        setScores({});
        setScoresInitialized(false);
      }
    });
    return () => {
      if (unsubPlayers) unsubPlayers();
      if (unsubGame) unsubGame();
    };
  }, []);

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

  const handleResetGame = async () => {
    if (window.confirm('This will delete all players and scores. Are you sure?')) {
      await resetGame();
      setScores({});
      setFlags({});
      setScoresInitialized(false);
    }
  };

  const handleSaveScores = async () => {
    const promises = Object.entries(scores).map(([playerId, playerScores]) =>
      savePlayerScores(playerId, playerScores)
    );
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
        <input
          type="text"
          value={category}
          onChange={handleCategoryChange}
          placeholder="Enter category..."
        />
      </div>

      <div className="round-controls">
        {roundActive ? (
          <button className="round-button end" onClick={handleEndRound}>
            End Round
          </button>
        ) : (
          <button className="round-button start" onClick={handleStartRound}>
            Start Round
          </button>
        )}
        <span className="round-status">
          {roundActive ? 'Round in progress' : 'Round not active'}
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
