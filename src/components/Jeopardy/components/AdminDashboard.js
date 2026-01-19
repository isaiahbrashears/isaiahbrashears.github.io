/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { fetchAllPlayersWithScores, clearAllAnswers, fetchCurrentCategoryAndScore, updatePlayerScore, updateCellReferences, resetGame } from "../../../utils/googleSheets";

const AdminDashboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResettingGame, setIsResettingGame] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentScore, setCurrentScore] = useState(0);
  const [categoryCell, setCategoryCell] = useState('A1');
  const [scoreCell, setScoreCell] = useState('A2');
  const [selectedAnswers, setSelectedAnswers] = useState({});

  // Google Sheets configuration
  const SHEET_ID = '1B2sbqWxT5_C90tpRbrSHbIYUd9jHMrIi5HACZTq5074';
  const API_KEY = 'AIzaSyBttryaeAIQgtRYr420ezByQsmWDfYuoEY';

  useEffect(() => {
    const loadData = async () => {
      try {
        if (loading && players.length === 0) {
          setLoading(true);
        }
        const [allPlayers, categoryAndScore] = await Promise.all([
          fetchAllPlayersWithScores(SHEET_ID, API_KEY),
          fetchCurrentCategoryAndScore(SHEET_ID, API_KEY)
        ]);
        setPlayers(allPlayers);
        setCurrentCategory(categoryAndScore.category);
        setCurrentScore(categoryAndScore.score);
        setCategoryCell(categoryAndScore.categoryCell);
        setScoreCell(categoryAndScore.scoreCell);
        setError(null);
      } catch (err) {
        console.error('Error loading data:', err);
        if (err.response?.status === 429) {
          setError('Rate limit exceeded. Slowing down requests...');
        } else {
          setError('Failed to load data');
        }
      } finally {
        setLoading(false);
      }
    };

    // Load immediately
    loadData();

    // Poll every 10 seconds for updates (reduced from 3 seconds)
    const intervalId = setInterval(() => {
      loadData();
    }, 5000);

    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, []);

  if (loading && players.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Admin Dashboard</h2>
        <p>Loading players...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Admin Dashboard</h2>
        <p style={{ color: 'red' }}>{error}</p>
      </div>
    );
  }

  const playersWithScores = players;

  // Sort by score descending
  const sortedPlayers = [...playersWithScores].sort((a, b) => b.score - a.score);

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

  // Helper function to get next cell reference
  const getNextCell = (currentCell, isCategory) => {
    const match = currentCell.match(/([A-Z]+)(\d+)/);
    if (!match) return isCategory ? 'A1' : 'A2';

    const col = match[1];
    const row = parseInt(match[2]);

    if (isCategory) {
      // Category: A1 -> B1 -> C1 -> D1 -> E1 -> F1 -> A1
      if (col === 'F') return 'A1';
      return String.fromCharCode(col.charCodeAt(0) + 1) + row;
    } else {
      // Score: A2 -> B2 -> C2 -> D2 -> E2 -> F2 -> A3 -> B3... -> F6 -> A2
      if (col === 'F') {
        if (row === 6) return 'A2'; // Reset to beginning
        return 'A' + (row + 1); // Move to next row
      }
      return String.fromCharCode(col.charCodeAt(0) + 1) + row;
    }
  };

  const handleSubmitAnswers = async () => {
    setIsResetting(true);
    try {
      // Submit scores for all correct answers
      const updatePromises = Object.entries(selectedAnswers).map(([row, status]) => {
        if (status === 'correct') {
          return updatePlayerScore(parseInt(row), currentScore);
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);

      // Calculate next cell references
      const nextCategoryCell = getNextCell(categoryCell, true);
      const nextScoreCell = getNextCell(scoreCell, false);

      // Update cell references in Google Sheets
      await updateCellReferences(nextCategoryCell, nextScoreCell);

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

  const handleAnswerSelection = (playerRow, isCorrect) => {
    // Just mark the answer as selected, don't submit yet
    setSelectedAnswers(prev => ({
      ...prev,
      [playerRow]: isCorrect ? 'correct' : 'incorrect'
    }));
  };

  const handleGameReset = async () => {
    if (!window.confirm('Are you sure you want to reset the entire game? This will clear all scores and answers.')) {
      return;
    }

    setIsResettingGame(true);
    try {
      await resetGame();
      setShowAnswers(false);
      setSelectedAnswers({});
    } catch (err) {
      console.error('Error resetting game:', err);
    } finally {
      setIsResettingGame(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }} className="jeopardy">
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Jeopardy Admin Dashboard</h2>

      <div style={{
        padding: '15px',
        backgroundColor: '#060CE9',
        borderRadius: '8px',
        marginBottom: '30px',
        textAlign: 'center',
        color: 'white'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{currentCategory || 'No Category Set'}</h3>
        <p style={{ margin: '0', fontSize: '32px', fontWeight: 'bold' }}>${currentScore}</p>
      </div>

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
                  key={player.row}
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
              key={player.row}
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
                  <span style={{ fontSize: '20px' }}>
                    {player.answer ? '✅' : '❌'}
                  </span>
                </div>
                {showAnswers && player.answer && (
                  <div style={{
                    fontSize: '14px',
                    color: '#666',
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
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    padding: '6px 12px',
                    backgroundColor: selectedAnswers[player.row] === 'correct' ? '#4caf50' : '#f0f0f0',
                    color: selectedAnswers[player.row] === 'correct' ? 'white' : '#333',
                    borderRadius: '4px',
                    fontWeight: selectedAnswers[player.row] === 'correct' ? 'bold' : 'normal'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedAnswers[player.row] === 'correct'}
                      onChange={() => handleAnswerSelection(player.row, true)}
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
                    backgroundColor: selectedAnswers[player.row] === 'incorrect' ? '#f44336' : '#f0f0f0',
                    color: selectedAnswers[player.row] === 'incorrect' ? 'white' : '#333',
                    borderRadius: '4px',
                    fontWeight: selectedAnswers[player.row] === 'incorrect' ? 'bold' : 'normal'
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedAnswers[player.row] === 'incorrect'}
                      onChange={() => handleAnswerSelection(player.row, false)}
                      style={{ cursor: 'pointer' }}
                    />
                    Incorrect
                  </label>
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
          disabled={isResetting}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: isResetting ? '#ccc' : 'green',
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

      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '15px' }}>Game Controls</h3>

      </div>
    </div>
  );
};

export default AdminDashboard;
