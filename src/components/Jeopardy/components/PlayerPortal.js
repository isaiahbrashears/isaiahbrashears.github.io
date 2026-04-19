/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  submitPlayerAnswer,
  submitPlayerWager,
  subscribeToPlayer,
  subscribeToGameState,
  updatePlayerScore,
  advanceToNextQuestion
} from "../../../utils/firebase";

const PlayerPortal = ({ player, playerId}) => {
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
  const [singlePlayer, setSinglePlayer] = useState(0);
  const [submittedWagerValue, setSubmittedWagerValue] = useState(0);

  useEffect(() => {
    if (!playerId) return;

    // Subscribe to real-time player updates
    const unsubscribePlayer = subscribeToPlayer(playerId, (playerData) => {
      setScore(playerData.score || 0);
      setSubmittedAnswer(playerData.answer || '');

      if (playerData.wagerSubmitted) {
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

  const isaiahAliases = ['isaiah brashears', 'wavyzayb', 'zayb', 'isaiah', 'zay', 'wavyzay', 'brashears', 'brash', 'comic god', 'the one who remains'];
  let toggleSinglePlayerButtons = null;

  const toggleSinglePlayer = () => {
    setSinglePlayer((prev) => !prev);
  };

  if (isaiahAliases.includes(player.toLowerCase()) && !submittedAnswer && score === 0) {
    toggleSinglePlayerButtons = (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Welcome, Master!</h2>
        <p style={{ fontSize: '18px' }}>Are you playing solo or with the chumps?</p>
        <button
          onClick={toggleSinglePlayer}
          className="player-button"
          style={{ marginTop: '20px', fontSize: '18px', padding: '16px 32px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {singlePlayer ? 'Exit Single Player Mode' : 'Enter Single Player Mode'}
        </button>
      </div>
    );
  }

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

  const handleSinglePlayerAnswer = async (correct) => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (correct) {
        await updatePlayerScore(playerId, currentScore);
      }
      await advanceToNextQuestion();
    } catch (err) {
      console.error('Error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const singlePlayerButtons = (
    <div style={{ display: 'flex', gap: '16px', marginTop: '50px' }}>
      <button
        onClick={() => handleSinglePlayerAnswer(true)}
        disabled={isSubmitting}
        style={{
          flex: 1,
          padding: '20px',
          fontSize: '20px',
          fontWeight: 'bold',
          backgroundColor: isSubmitting ? '#ccc' : '#2e7d32',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isSubmitting ? 'not-allowed' : 'pointer'
        }}
      >
        Correct
      </button>
      <button
        onClick={() => handleSinglePlayerAnswer(false)}
        disabled={isSubmitting}
        style={{
          flex: 1,
          padding: '20px',
          fontSize: '20px',
          fontWeight: 'bold',
          backgroundColor: isSubmitting ? '#ccc' : '#c62828',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isSubmitting ? 'not-allowed' : 'pointer'
        }}
      >
        Incorrect
      </button>
      {error && (
        <p style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>{error}</p>
      )}
    </div>
  );

  // Determine what to display based on Final Jeopardy state
  let answerDisplay;

  if (singlePlayer) {
    answerDisplay = singlePlayerButtons;
  } else if (isFinalJeopardy) {
    // Final Jeopardy: Show wager first, then answer
    if (submittedAnswer) {
      answerDisplay = (
        <div>
          {wagerSubmittedDisplay}
          {submittedAnswerDisplay}
        </div>
      );
    } else if (wagerSubmitted) {
      answerDisplay = (
        <div>
          {wagerSubmittedDisplay}
          {inputField}
        </div>
      );
    } else {
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
      {toggleSinglePlayerButtons}
    </div>
  );
};

export default PlayerPortal;
