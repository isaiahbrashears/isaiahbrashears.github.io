/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  submitPlayerAnswer,
  submitPlayerWager,
  subscribeToPlayer,
  subscribeToGameState
} from "../../../utils/firebase";

const PlayerPortal = ({ player, playerId }) => {
  const [answer, setAnswer] = useState('');
  const [submittedAnswer, setSubmittedAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [score, setScore] = useState(0);
  const [loadingScore, setLoadingScore] = useState(true);
  const [isFinalJeopardy, setIsFinalJeopardy] = useState(false);
  const [isDoubleJeopardy, setIsDoubleJeopardy] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentScore, setCurrentScore] = useState(0);
  const [wager, setWager] = useState(0);
  const [wagerSubmitted, setWagerSubmitted] = useState(false);
  const [submittedWagerValue, setSubmittedWagerValue] = useState(0);

  useEffect(() => {
    if (!playerId) return;

    // Subscribe to real-time player updates
    const unsubscribePlayer = subscribeToPlayer(playerId, (playerData) => {
      setScore(playerData.score || 0);
      setSubmittedAnswer(playerData.answer || '');

      // Check if wager has been submitted
      if (playerData.wager > 0) {
        setWagerSubmitted(true);
        setSubmittedWagerValue(playerData.wager);
      } else {
        setWagerSubmitted(false);
        setSubmittedWagerValue(0);
      }

      setLoadingScore(false);
    });

    // Subscribe to real-time game state updates
    const unsubscribeGameState = subscribeToGameState((gameState) => {
      setIsFinalJeopardy(gameState.isFinalJeopardy);
      setIsDoubleJeopardy(gameState.isDoubleJeopardy);
      setCurrentCategory(gameState.category);
      setCurrentScore(gameState.score);
    });

    // Cleanup subscriptions on unmount
    return () => {
      if (unsubscribePlayer) unsubscribePlayer();
      if (unsubscribeGameState) unsubscribeGameState();
    };
  }, [playerId]);

  const handleSend = async () => {
    if (answer.trim()) {
      setIsSubmitting(true);
      setError(null);

      try {
        await submitPlayerAnswer(playerId, answer.trim());
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

  const handleWagerSubmit = async () => {
    if (wager > score) {
      setError(`Wager cannot exceed your current score of $${score}.`);
    }else {
      setIsSubmitting(true);
      setError(null);

      try {
        await submitPlayerWager(playerId, wager);
        setWagerSubmitted(true);
        setSubmittedWagerValue(wager);
      } catch (err) {
        console.error('Error submitting wager:', err);
        setError('Failed to submit wager. Please try again.');
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

  const handleWagerChange = (value) => {
    if (value === '') {
      setWager('');
      return;
    }
    const numValue = parseInt(value);
    if (!isNaN(numValue)) {
      setWager(numValue);
    }
  };

  // Wager input for Final Jeopardy (shown first, before answer)
  const wagerInput = (
    <div>
      <label htmlFor="wager" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
        Enter Your Wager (Max: ${score}):
      </label>
      <div style={{ display: 'flex', gap: '10px' }} className="flex-wrap">
        <input
          id="wager"
          type="number"
          min="0"
          max={score}
          value={wager}
          onChange={(e) => handleWagerChange(e.target.value)}
          placeholder="Enter your wager..."
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
          onClick={handleWagerSubmit}
          disabled={isSubmitting}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: !isSubmitting ? '#060CE9' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: !isSubmitting ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            minWidth: '100px'
          }}
        >
          {isSubmitting ? 'Sending...' : 'Submit Wager'}
        </button>
      </div>
      {error && (
        <p style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>{error}</p>
      )}
    </div>
  );

  // Wager submitted display
  const wagerSubmittedDisplay = (
    <div>
      <p style={{ fontSize: '16px', padding: '12px', backgroundColor: '#e3f2fd', borderRadius: '8px', marginBottom: '20px' }}>
        ✓ Wager submitted: <strong>${submittedWagerValue}</strong>
      </p>
    </div>
  );

  // Answer input (shown after wager in Final Jeopardy, or immediately in regular rounds)
  const inputField = (
    <div>
      <label htmlFor="answer" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
        Your Answer:
      </label>
      <div style={{ display: 'flex', gap: '10px' }} className="flex-wrap">
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

  const submittedAnswerDisplay = (
    <div>
      <p style={{ fontSize: '16px', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
        ✓ You answered: <strong>{submittedAnswer}</strong>
      </p>
    </div>
  );

  // Determine what to display based on Final Jeopardy state
  let answerDisplay;

  if (isFinalJeopardy) {
    // Final Jeopardy: Show wager first, then answer
    if (submittedAnswer) {
      // Both wager and answer submitted
      answerDisplay = (
        <div>
          {wagerSubmittedDisplay}
          {submittedAnswerDisplay}
        </div>
      );
    } else if (wagerSubmitted) {
      // Wager submitted, now show answer input
      answerDisplay = (
        <div>
          {wagerSubmittedDisplay}
          {inputField}
        </div>
      );
    } else {
      // Show wager input first
      answerDisplay = wagerInput;
    }
  } else {
    // Regular round: Just show answer input or submitted answer
    answerDisplay = submittedAnswer ? submittedAnswerDisplay : inputField;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }} className="jeopardy">
      <h2>{player}</h2>
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
      <h3 style={{ marginBottom: '10px' }}>Your Score: ${loadingScore ? 'Loading...' : score}</h3>
      {answerDisplay}
    </div>
  );
};

export default PlayerPortal;
