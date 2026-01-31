/* eslint-disable react/prop-types */
import React, { useState, useRef, useEffect } from "react";
import { savePlayerAnswers, subscribeToGameState, subscribeToPlayer } from '../../../utils/scatagoriesFirebase';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const PlayerPortal = ({ player }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [editingLetter, setEditingLetter] = useState(null);
  const [roundActive, setRoundActive] = useState(false);
  const [category, setCategory] = useState('');
  const [totalScore, setTotalScore] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const inputRef = useRef(null);

  const currentLetter = LETTERS[currentIndex];

  // Subscribe to player data (answers on first load + scores in real-time)
  useEffect(() => {
    const unsubPlayer = subscribeToPlayer(player, (playerData) => {
      if (!loaded) {
        setAnswers(playerData.answers || {});
        setLoaded(true);
      }
      // Always update score from saved scores
      const scores = playerData.scores || {};
      setTotalScore(Object.values(scores).filter(Boolean).length);
    });
    return () => { if (unsubPlayer) unsubPlayer(); };
  }, [player, loaded]);

  useEffect(() => {
    const unsubscribe = subscribeToGameState((gameState) => {
      setRoundActive(gameState.roundActive);
      setCategory(gameState.category || '');
      if (gameState.roundActive && loaded) {
        setAnswers({});
        setCurrentIndex(0);
        setInputValue('');
        setEditingLetter(null);
      }
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [loaded]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentIndex, editingLetter, roundActive]);

  const saveAnswer = (letter, value) => {
    const updated = { ...answers, [letter]: value };
    setAnswers(updated);
    savePlayerAnswers(player, updated);
  };

  const handleSubmitAnswer = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const letter = editingLetter || currentLetter;
    saveAnswer(letter, trimmed);
    setInputValue('');

    if (editingLetter) {
      setEditingLetter(null);
    } else if (currentIndex < LETTERS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (inputValue.trim()) {
      handleSubmitAnswer();
      return;
    }
    if (editingLetter) {
      setEditingLetter(null);
      setInputValue('');
      return;
    }
    if (currentIndex < LETTERS.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (editingLetter) {
      setEditingLetter(null);
      setInputValue('');
      return;
    }
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setInputValue('');
    }
  };

  const handleAnswerClick = (letter) => {
    setEditingLetter(letter);
    setInputValue(answers[letter] || '');
  };

  const activeLetter = editingLetter || currentLetter;

  if (!roundActive) {
    return (
      <div className="scategories-player-portal">
        <div className="player-header">
          <h2>{player}</h2>
          <span className="player-score">{totalScore} pts</span>
        </div>
        <p className="waiting-message">Waiting for the round to start...</p>
      </div>
    );
  }

  return (
    <div className="scategories-player-portal">
      <div className="player-header">
        <h2>{player}</h2>
        <span className="player-score">{totalScore} pts</span>
      </div>

      {category && <div className="current-category">Category: <strong>{category}</strong></div>}

      <div className="answers-list">
        {LETTERS.map(letter => (
          <button
            key={letter}
            className={`answer-item ${editingLetter === letter ? 'editing' : ''} ${!answers[letter] ? 'empty' : ''}`}
            onClick={() => handleAnswerClick(letter)}
          >
            <span className="answer-letter">{letter}.</span>
            <span className="answer-text">{answers[letter] || '-'}</span>
          </button>
        ))}
      </div>

      <div className="letter-input-section">
        <label className="letter-label">{activeLetter}</label>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmitAnswer()}
          placeholder={`Answer for ${activeLetter}...`}
        />
        <div className="nav-buttons">
          <button
            onClick={handlePrev}
            disabled={!editingLetter && currentIndex === 0}
            className="nav-button"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={!editingLetter && currentIndex === LETTERS.length - 1 && !inputValue.trim()}
            className="nav-button"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerPortal;
