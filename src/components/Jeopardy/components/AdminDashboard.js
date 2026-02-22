/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  subscribeToPlayers,
  subscribeToGameState,
  clearAllAnswers,
  updatePlayerScore,
  advanceToNextQuestion,
  setFinalJeopardy,
  setDoubleJeopardy,
  resetGame
} from "../../../utils/firebase";

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
  const [isTogglingFinalJeopardy, setIsTogglingFinalJeopardy] = useState(false);
  const [isTogglingDoubleJeopardy, setIsTogglingDoubleJeopardy] = useState(false);

  useEffect(() => {
    // Subscribe to real-time player updates
    const unsubscribePlayers = subscribeToPlayers((allPlayers) => {
      setPlayers(allPlayers);
      setError(null);
    });

    // Subscribe to real-time game state updates
    const unsubscribeGameState = subscribeToGameState((gameState) => {
      setCurrentCategory(gameState.category);
      setCurrentScore(gameState.score);
      setIsFinalJeopardy(gameState.isFinalJeopardy);
      setIsDoubleJeopardy(gameState.isDoubleJeopardy);
    });

    // Cleanup subscriptions on unmount
    return () => {
      if (unsubscribePlayers) unsubscribePlayers();
      if (unsubscribeGameState) unsubscribeGameState();
    };
  }, []);

  // if (loading && players.length === 0) {
  //   return (
  //     <div style={{ padding: '20px', textAlign: 'center' }}>
  //       <h2>Admin Dashboard</h2>
  //       <p>Loading players...</p>
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Admin Dashboard</h2>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  // Sort by score descending
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // Get unique scores for ranking
  const uniqueScores = [...new Set(sortedPlayers.map(p => p.score))].sort((a, b) => b - a);

  // Helper function to get medal/rank based on score
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
      // Submit scores for all correct answers
      const updatePromises = Object.entries(selectedAnswers).map(([playerId, status]) => {
        if (isFinalJeopardy) {
          // In Final Jeopardy, use wager amount from player data
          const player = players.find(p => p.id === playerId);
          const wagerAmount = player?.wager || 0;

          if (status === 'correct') {
            return updatePlayerScore(playerId, wagerAmount);
          } else if (status === 'incorrect') {
            // Subtract wager for incorrect answers
            return updatePlayerScore(playerId, -wagerAmount);
          }
        } else {
          // Regular questions: add currentScore for correct answers only
          if (status === 'correct') {
            return updatePlayerScore(playerId, currentScore);
          }
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);

      // Advance to next question
      await advanceToNextQuestion();

      // Clear answers after submitting scores
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
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }} className="jeopardy">
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Jeopardy Admin Dashboard</h2>

      {isFinalJeopardy ? (
        <div style={{
          padding: '15px',
          backgroundColor: '#060CE9',
          borderRadius: '8px',
          marginBottom: '30px',
          textAlign: 'center',
          color: 'white'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>FINAL JEOPARDY!</h3>
        </div>
      ) : (
        <div style={{
          padding: '15px',
          backgroundColor: isDoubleJeopardy ? '#9c27b0' : '#060CE9',
          borderRadius: '8px',
          marginBottom: '30px',
          textAlign: 'center',
          color: 'white'
        }}>
          {isDoubleJeopardy && (
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px' }}>DOUBLE JEOPARDY</p>
          )}
          <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{currentCategory || 'No Category Set'}</h3>
          <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold' }}>${currentScore}</p>
        </div>
      )}


      {sortedPlayers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
          <p style={{ fontSize: '16px', color: '#666' }}>No players have scored points yet.</p>
        </div>
      ) : (
        <div>
          <h3 style={{ marginBottom: '20px' }}>Leaderboard</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#060CE9', color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderRadius: '8px 0 0 0' }}>Rank</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Player</th>
                <th style={{ padding: '12px', textAlign: 'right', borderRadius: '0 8px 0 0' }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, index) => (
                <tr
                  key={player.id}
                  style={{
                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                    borderBottom: '1px solid #e0e0e0'
                  }}
                >
                  <td style={{ padding: '12px', fontWeight: 'bold', fontSize: '18px' }}>
                    {getRankDisplay(player.score)}
                  </td>
                  <td style={{ padding: '12px', fontSize: '16px' }}>{player.name}</td>
                  <td style={{ padding: '12px', textAlign: 'right', fontSize: '16px', fontWeight: 'bold' }}>
                    {player.score}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '15px' }}>Answer Status</h3>
        <div style={{ marginBottom: '20px' }}>
          {players.map((player) => (
            <div
              key={player.id}
              style={{
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: 'white',
                borderRadius: '6px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showAnswers && player.answer ? '10px' : '0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 'bold' }}>{player.name}</span>
                  <span style={{ fontSize: '25px', fontWeight: 'bold' }}>
                    {player.answer ? '✅' : '❌'}
                  </span>
                </div>
                {showAnswers && player.answer && (
                  <div style={{
                    fontSize: '20px',
                    color: '#666',
                    fontWeight: 'bold',
                    fontStyle: 'italic',
                    maxWidth: '300px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    &quot;{player.answer}&quot;
                  </div>
                )}
              </div>
              {showAnswers && player.answer && (
                <div>
                  {isFinalJeopardy && (
                    <div style={{
                      marginTop: '10px',
                      marginBottom: '10px',
                      padding: '8px 12px',
                      backgroundColor: '#e3f2fd',
                      borderRadius: '4px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#1976d2'
                    }}>
                      Wager: ${player.wager || 0}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      padding: '6px 12px',
                      backgroundColor: selectedAnswers[player.id] === 'correct' ? '#4caf50' : '#f0f0f0',
                      color: selectedAnswers[player.id] === 'correct' ? 'white' : '#333',
                      borderRadius: '4px',
                      fontWeight: selectedAnswers[player.id] === 'correct' ? 'bold' : 'normal'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedAnswers[player.id] === 'correct'}
                        onChange={() => handleAnswerSelection(player.id, true)}
                        style={{ cursor: 'pointer' }}
                      />
                      Correct
                    </label>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      padding: '6px 12px',
                      backgroundColor: selectedAnswers[player.id] === 'incorrect' ? '#f44336' : '#f0f0f0',
                      color: selectedAnswers[player.id] === 'incorrect' ? 'white' : '#333',
                      borderRadius: '4px',
                      fontWeight: selectedAnswers[player.id] === 'incorrect' ? 'bold' : 'normal'
                    }}>
                      <input
                        type="checkbox"
                        checked={selectedAnswers[player.id] === 'incorrect'}
                        onChange={() => handleAnswerSelection(player.id, false)}
                        style={{ cursor: 'pointer' }}
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
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: showAnswers ? '#666' : '#060CE9',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            width: '100%',
            marginBottom: '10px'
          }}
        >
          {showAnswers ? 'Hide Answers' : 'Reveal Answers'}
        </button>

        <button
          onClick={handleSubmitAnswers}
          disabled={!showAnswers || isResetting}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isResetting || !showAnswers ? '#ccc' : 'green',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isResetting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            width: '100%'
          }}
        >
          {isResetting ? 'Submitting...' : 'Submit Answers'}
        </button>
      </div>

      {/* Game Controls Section */}
      <div style={{
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        marginBottom: '30px',
        marginTop: '50px'
      }}>
        <h3 style={{ marginTop: '0', marginBottom: '15px' }}>Game Controls</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <a href="/#/jeopardy/setup" className="button w-full">Setup Game</a>
          <button
            onClick={handleToggleDoubleJeopardy}
            disabled={isTogglingDoubleJeopardy || isFinalJeopardy}
            className="button w-full"
            style={{ backgroundColor: isDoubleJeopardy ? '#ff9800' : '#9c27b0' }}
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
