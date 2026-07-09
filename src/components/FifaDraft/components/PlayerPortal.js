/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import {
  submitPlayerAnswer,
  subscribeToPlayer,
  subscribeToGameState,
} from "../../../utils/fifaFirebase";

const PlayerPortal = ({ player, playerId}) => {
  const [answer, setAnswer] = useState('');
  const [submittedAnswer, setSubmittedAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentCategory, setCurrentCategory] = useState('');


  useEffect(() => {
    if (!playerId) return;

    const unsubscribePlayer = subscribeToPlayer(playerId, (playerData) => {
      setSubmittedAnswer(playerData.answer || '');
    });
    const unsubscribeGameState = subscribeToGameState((gameState) => {
          setCurrentCategory(gameState.category);
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
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSend();
    }
  };



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

  console.log(player);


  // Determine what to display based on Final Jeopardy state
  let answerDisplay;
  answerDisplay = submittedAnswer ? submittedAnswerDisplay : inputField;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }} className="jeopardy">
      <h2>{player}</h2>
        <div style={{
          padding: '15px',
          backgroundColor: '#060CE9',
          borderRadius: '8px',
          marginBottom: '30px',
          textAlign: 'center',
          color: 'white'
        }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{currentCategory || 'No Category Set'}</h3>
        </div>
        <div style={{
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '30px',
          textAlign: 'center',
          color: 'white'
        }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: 'bold', letterSpacing: '2px' }}>DOUBLE JEOPARDY</p>
        </div>
      {answerDisplay}
    </div>
  );
};

export default PlayerPortal;
