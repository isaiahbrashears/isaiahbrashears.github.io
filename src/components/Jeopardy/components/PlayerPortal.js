/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { submitPlayerAnswer, fetchAllPlayersWithScores } from "../../../utils/googleSheets";

const PlayerPortal = ({ player, playerRow }) => {
  const [answer, setAnswer] = useState('');
  const [submittedAnswer, setSubmittedAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [score, setScore] = useState(0);
  const [loadingScore, setLoadingScore] = useState(true);

  // Google Sheets configuration
  const SHEET_ID = '1B2sbqWxT5_C90tpRbrSHbIYUd9jHMrIi5HACZTq5074';
  const API_KEY = 'AIzaSyBttryaeAIQgtRYr420ezByQsmWDfYuoEY';

  useEffect(() => {
    const loadPlayerData = async () => {
      try {
        if (loadingScore) {
          setLoadingScore(true);
        }
        // Fetch all players to get both score and answer status
        const allPlayers = await fetchAllPlayersWithScores(SHEET_ID, API_KEY);
        const currentPlayer = allPlayers.find(p => p.row === playerRow);

        if (currentPlayer) {
          setScore(currentPlayer.score);
          // If the answer in the sheet is empty, clear the local submittedAnswer
          if (!currentPlayer.answer) {
            setSubmittedAnswer('');
          } else {
            setSubmittedAnswer(currentPlayer.answer);
          }
        } else {
          setScore(0);
        }
      } catch (err) {
        console.error('Error loading player data:', err);
        if (err.response?.status !== 429) {
          setScore(0);
        }
      } finally {
        setLoadingScore(false);
      }
    };

    // Load player data immediately
    loadPlayerData();

    // Set up polling every 10 seconds (reduced from 3 seconds)
    const intervalId = setInterval(() => {
      loadPlayerData();
    }, 5000);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [playerRow]);

  const handleSend = async () => {
    if (answer.trim()) {
      setIsSubmitting(true);
      setError(null);

      try {
        // Submit answer via Google Apps Script
        await submitPlayerAnswer(playerRow, answer.trim());

        setSubmittedAnswer(answer.trim());
        setAnswer('');
      } catch (err) {
        console.error('Error submitting answer:', err);
        setError('Failed to submit answer. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSend();
    }
  };

  const inputField = (
    <div>
      <label htmlFor="answer" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
        Your Answer:
      </label>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          id="answer"
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your answer here..."
          disabled={isSubmitting}
          style={{
            flex: 1,
            padding: '12px',
            fontSize: '16px',
            border: '2px solid #060CE9',
            borderRadius: '8px',
            outline: 'none',
            opacity: isSubmitting ? 0.6 : 1
          }}
        />
        <button
          onClick={handleSend}
          disabled={!answer.trim() || isSubmitting}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: answer.trim() && !isSubmitting ? '#060CE9' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: answer.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            minWidth: '100px'
          }}
        >
          {isSubmitting ? 'Sending...' : 'Send'}
        </button>
      </div>
      {error && (
        <p style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>{error}</p>
      )}
    </div>
  );

  let answerDisplay = inputField;

  const submittedAnswerDisplay = (
    <div>
      <p style={{ fontSize: '16px', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
        ✓ You answered: <strong>{submittedAnswer}</strong>
      </p>
    </div>
  );

  if (submittedAnswer) {
    answerDisplay = submittedAnswerDisplay;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }} className="jeopardy">
      <h2>{player}</h2>
      <p style={{ fontSize: '18px', marginBottom: '30px' }}>
        Score: {score}
      </p>
      {answerDisplay}
    </div>
  );
};

export default PlayerPortal;
