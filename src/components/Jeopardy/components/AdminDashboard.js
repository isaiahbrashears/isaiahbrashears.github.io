/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  subscribeToPlayers,
  subscribeToGameState,
  clearAllAnswers,
  updatePlayerScore,
  setPlayerScore,
  advanceToNextQuestion,
  setFinalJeopardy,
  setDoubleJeopardy,
  resetGame,
  deleteJeopardyPlayer
} from "../../../utils/firebase";
import "../jeopardy.scss";

const AdminDashboard = () => {
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentScore, setCurrentScore] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [isFinalJeopardy, setIsFinalJeopardy] = useState(false);
  const [isDoubleJeopardy, setIsDoubleJeopardy] = useState(false);
  const [isResettingGame, setIsResettingGame] = useState(false);
  const [playersEditable, setPlayersEditable] = useState(false);
  const [editScores, setEditScores] = useState({});
  const [isTogglingFinalJeopardy, setIsTogglingFinalJeopardy] = useState(false);
  const [isTogglingDoubleJeopardy, setIsTogglingDoubleJeopardy] = useState(false);

  useEffect(() => {
    const unsubscribePlayers = subscribeToPlayers((allPlayers) => {
      setPlayers(allPlayers);
      setError(null);
    });

    const unsubscribeGameState = subscribeToGameState((gameState) => {
      setCurrentCategory(gameState.category);
      setCurrentScore(gameState.score);
      setIsFinalJeopardy(gameState.isFinalJeopardy);
      setIsDoubleJeopardy(gameState.isDoubleJeopardy);
    });

    return () => {
      if (unsubscribePlayers) unsubscribePlayers();
      if (unsubscribeGameState) unsubscribeGameState();
    };
  }, []);

  if (error) {
    return (
      <div className="jeopardy admin-dashboard__error">
        <h2>Admin Dashboard</h2>
        <p>{error}</p>
      </div>
    );
  }

  const togglePlayerEditability = () => {
    if (!playersEditable) {
      const scores = {};
      players.forEach(p => { scores[p.id] = p.score; });
      setEditScores(scores);
    }
    setPlayersEditable(!playersEditable);
  };

  const handleScoreBlur = async (playerId) => {
    const newScore = parseInt(editScores[playerId], 10);
    if (!isNaN(newScore)) {
      await setPlayerScore(playerId, newScore);
    }
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const uniqueScores = [...new Set(sortedPlayers.map(p => p.score))].sort((a, b) => b - a);

  const getRankDisplay = (score) => {
    const scoreRank = uniqueScores.indexOf(score);
    if (scoreRank === 0) return '🥇';
    if (scoreRank === 1) return '🥈';
    if (scoreRank === 2) return '🥉';
    return `${scoreRank + 1}`;
  };

  const handleSubmitAnswers = async () => {
    setIsResetting(true);
    try {
      let updatePromises;
      if (isFinalJeopardy) {
        updatePromises = players.map((player) => {
          const wagerAmount = player?.wager || 0;
          const isCorrect = selectedAnswers[player.id] === 'correct';
          return updatePlayerScore(player.id, isCorrect ? wagerAmount : -wagerAmount);
        });
      } else {
        updatePromises = Object.entries(selectedAnswers).map(([playerId, status]) => {
          if (status === 'correct') {
            return updatePlayerScore(playerId, currentScore);
          }
          return Promise.resolve();
        });
      }

      await Promise.all(updatePromises);
      await advanceToNextQuestion();
      await clearAllAnswers();
      setShowAnswers(false);
      setSelectedAnswers({});
    } catch (err) {
      console.error('Error submitting answers:', err);
    } finally {
      setIsResetting(false);
    }
  };

  const handleAnswerSelection = (playerId, isCorrect) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [playerId]: isCorrect ? 'correct' : 'incorrect'
    }));
  };

  const handleResetGame = async () => {
    if (!window.confirm('Are you sure you want to reset the game? This will clear all scores, answers, and wagers.')) {
      return;
    }

    setIsResettingGame(true);
    try {
      await resetGame();
      setSelectedAnswers({});
      setShowAnswers(false);
    } catch (err) {
      console.error('Error resetting game:', err);
      alert('Failed to reset game. Please try again.');
    } finally {
      setIsResettingGame(false);
    }
  };

  const handleToggleFinalJeopardy = async () => {
    setIsTogglingFinalJeopardy(true);
    try {
      await setFinalJeopardy(!isFinalJeopardy);
    } catch (err) {
      console.error('Error toggling Final Jeopardy:', err);
      alert('Failed to toggle Final Jeopardy. Please try again.');
    } finally {
      setIsTogglingFinalJeopardy(false);
    }
  };

  const handleDeletePlayer = async (player) => {
    if (!window.confirm(`Remove ${player.name} from the game?`)) return;
    try {
      await deleteJeopardyPlayer(player.id);
    } catch (err) {
      console.error('Error deleting player:', err);
      alert('Failed to remove player. Please try again.');
    }
  };

  const handleToggleDoubleJeopardy = async () => {
    setIsTogglingDoubleJeopardy(true);
    try {
      await setDoubleJeopardy(!isDoubleJeopardy);
    } catch (err) {
      console.error('Error toggling Double Jeopardy:', err);
      alert('Failed to toggle Double Jeopardy. Please try again.');
    } finally {
      setIsTogglingDoubleJeopardy(false);
    }
  };

  return (
    <div className="jeopardy admin-dashboard">
      <h2 className="admin-dashboard__title">Jeopardy Admin Dashboard</h2>

      {isFinalJeopardy ? (
        <div className="round-banner">
          <h3>FINAL JEOPARDY!</h3>
        </div>
      ) : (
        <div className={`round-banner${isDoubleJeopardy ? ' round-banner--double' : ''}`}>
          {isDoubleJeopardy && (
            <p className="round-banner__label">DOUBLE JEOPARDY</p>
          )}
          <h3 className="round-banner__category">{currentCategory || 'No Category Set'}</h3>
          <p className="round-banner__score">${currentScore}</p>
        </div>
      )}

      {sortedPlayers.length === 0 ? (
        <div className="empty-state">
          <p>No players have scored points yet.</p>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between">
            <h3 className="leaderboard__title">Leaderboard</h3>
            <a onClick={togglePlayerEditability} className="edit-link">
              {playersEditable ? 'Done Editing' : 'Edit Players'}
            </a>
          </div>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>Score</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player) => (
                <tr key={player.id}>
                  <td className="rank">{getRankDisplay(player.score)}</td>
                  <td>{player.name}</td>
                  <td className="score">
                    {playersEditable ? (
                      <input
                        type="number"
                        className="score-input"
                        value={editScores[player.id] ?? player.score}
                        onChange={(e) => setEditScores(prev => ({ ...prev, [player.id]: e.target.value }))}
                        onBlur={() => handleScoreBlur(player.id)}
                      />
                    ) : player.score}
                  </td>
                  {playersEditable && (
                    <td className="actions">
                      <button
                        onClick={() => handleDeletePlayer(player)}
                        className="delete-player-btn"
                        title="Remove player"
                      >
                        ✕
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isFinalJeopardy && (
        <div className="wager-status">
          <h3>Wager Status</h3>
          <div className="wager-status__list">
            {players.map((player) => (
              <div key={player.id} className="wager-row">
                <div className="wager-row__player">
                  <span className="wager-row__name">{player.name}</span>
                  <span className="wager-row__status">
                    {player.wagerSubmitted ? '✅' : '❌'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="answer-status">
        <h3>Answer Status</h3>
        <div className="answer-status__list">
          {players.map((player) => (
            <div key={player.id} className="answer-row">
              <div className={`answer-row__header${showAnswers && player.answer ? ' answer-row__header--expanded' : ''}`}>
                <div className="answer-row__player">
                  <span className="answer-row__name">{player.name}</span>
                  <span className="answer-row__status">
                    {player.answer ? '✅' : '❌'}
                  </span>
                </div>
                {showAnswers && player.answer && (
                  <div className="answer-row__text">{player.answer}</div>
                )}
              </div>
              {showAnswers && player.answer && (
                <div>
                  {isFinalJeopardy && (
                    <div className="answer-row__wager">
                      Wager: ${player.wager || 0}
                    </div>
                  )}
                  <div className="answer-row__actions">
                    <label className={`answer-label answer-label--correct${selectedAnswers[player.id] === 'correct' ? ' answer-label--selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedAnswers[player.id] === 'correct'}
                        onChange={() => handleAnswerSelection(player.id, true)}
                      />
                      Correct
                    </label>
                    <label className={`answer-label answer-label--incorrect${selectedAnswers[player.id] === 'incorrect' ? ' answer-label--selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedAnswers[player.id] === 'incorrect'}
                        onChange={() => handleAnswerSelection(player.id, false)}
                      />
                      Incorrect
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowAnswers(!showAnswers)}
          className={`reveal-btn${showAnswers ? ' reveal-btn--active' : ''}`}
        >
          {showAnswers ? 'Hide Answers' : 'Reveal Answers'}
        </button>

        <button
          onClick={handleSubmitAnswers}
          disabled={!showAnswers || isResetting}
          className="button w-full"
          style={{ backgroundColor: isResetting || !showAnswers ? '#ccc' : 'green' }}
        >
          {isResetting ? 'Submitting...' : 'Submit Answers'}
        </button>
      </div>

      <div className="game-controls">
        <h3>Game Controls</h3>
        <div className="game-controls__buttons">
          <a href="/#/jeopardy/setup" className="button w-full">Setup Game</a>
          <button
            onClick={handleToggleDoubleJeopardy}
            disabled={isTogglingDoubleJeopardy || isFinalJeopardy}
            className={`button w-full ${isDoubleJeopardy ? 'button--double-exit' : 'button--double-enter'}`}
          >
            {isTogglingDoubleJeopardy ? 'Updating...' : (isDoubleJeopardy ? 'Exit Double Jeopardy' : 'Start Double Jeopardy')}
          </button>
          <button
            onClick={handleToggleFinalJeopardy}
            disabled={isTogglingFinalJeopardy}
            className="button green w-full"
          >
            {isTogglingFinalJeopardy ? 'Updating...' : (isFinalJeopardy ? 'Exit Final Jeopardy' : 'Start Final Jeopardy')}
          </button>
          <button
            onClick={handleResetGame}
            disabled={isResettingGame}
            className="button red w-full"
          >
            {isResettingGame ? 'Resetting...' : 'Reset Game'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
