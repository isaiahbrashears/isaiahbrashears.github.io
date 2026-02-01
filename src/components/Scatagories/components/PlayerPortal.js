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
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerPaused, setTimerPaused] = useState(false);
  const [roundEndTime, setRoundEndTime] = useState(null);
  const [pausedRemaining, setPausedRemaining] = useState(null);
  const timerRef = useRef(null);
  const inputRef = useRef(null);

  const currentLetter = LETTERS[currentIndex];

  // Subscribe to player data (answers on first load + scores in real-time)
  useEffect(() => {
    const unsubPlayer = subscribeToPlayer(player, (playerData) => {
      if (!loaded) {
        setAnswers(playerData.answers || {});
        setLoaded(true);
      }
      // Always update cumulative score
      setTotalScore(playerData.totalScore || 0);
    });
    return () => { if (unsubPlayer) unsubPlayer(); };
  }, [player, loaded]);

  useEffect(() => {
    const unsubscribe = subscribeToGameState((gameState) => {
      setRoundActive(gameState.roundActive);
      setCategory(gameState.category || '');
      setRoundEndTime(gameState.roundEndTime || null);
      setTimerPaused(gameState.timerPaused || false);
      setPausedRemaining(gameState.timeRemaining || null);
      if (gameState.roundActive && loaded) {
        setAnswers({});
        setCurrentIndex(0);
        setInputValue('');
        setEditingLetter(null);
      }
      if (!gameState.roundActive) {
        if (timerRef.current) clearInterval(timerRef.current);
        setTimeLeft(null);
      }
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [loaded]);

  // Countdown timer
  useEffect(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (!roundActive) { setTimeLeft(null); return; }
    if (timerPaused) {
      setTimeLeft(pausedRemaining ? Math.ceil(pausedRemaining / 1000) : null);
      return;
    }
    if (!roundEndTime) return;

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((roundEndTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0 && timerRef.current) clearInterval(timerRef.current);
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [roundActive, roundEndTime, timerPaused, pausedRemaining]);

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

    if (editingLetter) {
      setEditingLetter(null);
      setInputValue(answers[currentLetter] || '');
    } else if (currentIndex < LETTERS.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setInputValue(answers[LETTERS[nextIndex]] || '');
    } else {
      setInputValue('');
    }
  };

  const advanceEmpty = () => {
    if (editingLetter) {
      setEditingLetter(null);
      setInputValue(answers[currentLetter] || '');
    } else if (currentIndex < LETTERS.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setInputValue(answers[LETTERS[nextIndex]] || '');
    }
  };

  const handleNext = () => {
    if (inputValue.trim()) {
      handleSubmitAnswer();
      return;
    }
    if (editingLetter) {
      setEditingLetter(null);
      setInputValue(answers[currentLetter] || '');
      return;
    }
    if (currentIndex < LETTERS.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setInputValue(answers[LETTERS[nextIndex]] || '');
    }
  };

  const handlePrev = () => {
    if (editingLetter) {
      setEditingLetter(null);
      setInputValue(answers[currentLetter] || '');
      return;
    }
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      setInputValue(answers[LETTERS[prevIndex]] || '');
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
      <h2 className="current-category">{category}</h2>
      <div className="player-header">
        <h2>{player}</h2>
        <span className="player-score">{totalScore} pts</span>
      </div>

      {timeLeft != null && <div className={`timer-display ${timerPaused ? 'paused' : ''}`}>{timerPaused ? `PAUSED - ${timeLeft}s` : `${timeLeft}s`}</div>}

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
          onKeyDown={(e) => e.key === 'Enter' && (inputValue.trim() ? handleSubmitAnswer() : advanceEmpty())}
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
