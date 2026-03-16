/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { db } from "../../../config/firebase";
import { doc, writeBatch } from "firebase/firestore";
import { fetchGameState } from "../../../utils/firebase";

const GameSetup = () => {
  const [categories, setCategories] = useState(['', '', '', '', '', '']);
  const [doubleCategories, setDoubleCategories] = useState(['', '', '', '', '', '']);
  const [scores, setScores] = useState([200, 400, 600, 800, 1000]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchGameState().then((gameState) => {
      if (!gameState) return;
      if (gameState.categories?.length) setCategories(gameState.categories);
      if (gameState.doubleCategories?.length) setDoubleCategories(gameState.doubleCategories);
      if (gameState.scores?.length) setScores(gameState.scores);
    }).catch(() => {});
  }, []);

  const handleCategoryChange = (index, value) => {
    const newCategories = [...categories];
    newCategories[index] = value;
    setCategories(newCategories);
  };

  const handleDoubleCategoryChange = (index, value) => {
    const newCategories = [...doubleCategories];
    newCategories[index] = value;
    setDoubleCategories(newCategories);
  };

  const handleScoreChange = (index, value) => {
    const newScores = [...scores];
    newScores[index] = parseInt(value) || 0;
    setScores(newScores);
  };

  const handleSetup = async () => {
    setIsLoading(true);
    setMessage('');

    try {
      const batch = writeBatch(db);

      // Add players (filter out empty names but keep track of order)
      const validPlayers = players.filter(name => name.trim() !== '');

      validPlayers.forEach((name, index) => {
        const playerRef = doc(db, 'players', `player_${index + 1}`);
        batch.set(playerRef, {
          name: name.trim(),
          score: 0,
          answer: '',
          wager: 0,
          order: index + 1
        });
      });

      // Set up game state
      const gameStateRef = doc(db, 'game', 'gameState');
      batch.set(gameStateRef, {
        scoreIndex: 0,
        isFinalJeopardy: false,
        isDoubleJeopardy: false,
        categories: categories.map(c => c.trim() || 'Category'),
        doubleCategories: doubleCategories.map(c => c.trim() || 'Double Category'),
        scores: scores
      });

      await batch.commit();

      setMessage('Game setup complete! Players and categories have been added to Firebase.');
    } catch (error) {
      console.error('Error setting up game:', error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }} className="jeopardy">
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Jeopardy Game Setup</h2>

      <div style={{ marginBottom: '30px' }}>
        <h3>Round 1 Categories (6)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {categories.map((category, index) => (
            <input
              key={index}
              type="text"
              value={category}
              onChange={(e) => handleCategoryChange(index, e.target.value)}
              placeholder={`Category ${index + 1}`}
              style={{
                padding: '10px',
                fontSize: '14px',
                border: '2px solid #060CE9',
                borderRadius: '6px'
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#9c27b0' }}>Double Jeopardy Categories (6)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          {doubleCategories.map((category, index) => (
            <input
              key={index}
              type="text"
              value={category}
              onChange={(e) => handleDoubleCategoryChange(index, e.target.value)}
              placeholder={`Double Category ${index + 1}`}
              style={{
                padding: '10px',
                fontSize: '14px',
                border: '2px solid #9c27b0',
                borderRadius: '6px'
              }}
            />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3>Point Values (5)</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
          {scores.map((score, index) => (
            <input
              key={index}
              type="number"
              value={score}
              onChange={(e) => handleScoreChange(index, e.target.value)}
              placeholder={`Score ${index + 1}`}
              style={{
                padding: '10px',
                maxWidth: '100px',
                fontSize: '14px',
                border: '2px solid #060CE9',
                borderRadius: '6px',
                textAlign: 'center'
              }}
            />
          ))}
        </div>
      </div>

      <button
        onClick={handleSetup}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '15px',
          fontSize: '18px',
          backgroundColor: isLoading ? '#ccc' : '#060CE9',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontWeight: 'bold'
        }}
      >
        {isLoading ? 'Setting up...' : 'Initialize Game'}
      </button>

      <a
        href="/#/jeopardy/admin"
        disabled={isLoading}
        className="button maroon mt-4"
      >
        {isLoading ? 'Setting up...' : 'Admin Portal'}
      </a>

      {message && (
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: message.includes('Error') ? '#ffebee' : '#e8f5e9',
          color: message.includes('Error') ? '#c62828' : '#2e7d32',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          {message}
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h4>Instructions:</h4>
        <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
          <li>Enter your 6 Round 1 category names</li>
          <li>Enter your 6 Double Jeopardy category names (point values are doubled)</li>
          <li>Adjust point values if needed (default: 200, 400, 600, 800, 1000)</li>
          <li>Click &quot;Initialize Game&quot; to set up the database</li>
          <li>After setup, go to <strong>/jeopardy</strong> to start playing!</li>
        </ol>
      </div>
    </div>
  );
};

export default GameSetup;
