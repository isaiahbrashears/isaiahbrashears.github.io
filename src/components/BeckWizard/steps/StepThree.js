/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';
import ClosedLock from '../../../assets/images/lock-closed.svg';
import RooLock from '../../../assets/images/raygun.svg';
import SpotifyLock from '../../../assets/images/violet.svg';
import SweatLock from '../../../assets/images/pink.svg';
import OpenLock from '../../../assets/images/lock-open.svg';


const StepThree = ({ changeStep }) => {

  const [displayText, setDisplayText] = useState(["This is the hip hoppiest dancer in the game"]);
  const [key, setKey] = useState(0);
  const [lockTrial, setlockTrial] = useState(1);
  const [attempt, setAttempt] = useState(1);
  const [inputText, setInputText] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInput(!showInput);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);



  const handleInputChange = (value) => {
    setInputText(value);
  };

  const handleTrialOneSubmit = () => {
    setKey(prevKey => prevKey + 1)
    if (['raygun', 'ray gun'].includes(inputText.toLowerCase())) {
      setAttempt(1);
      setlockTrial(2);
      setDisplayText(['That is correct', 2000, 'This is the first color of Boston'])
      return;
    }
    setDisplayText(['incorrect.', 1000, 'incorrect. come on.', 1000, 'This is the hip hoppiest dancer in the game'])
  };

  const handleTrialTwoSubmit = () => {
    setKey(prevKey => prevKey + 1)
    if (inputText.toLowerCase() === 'violet') {
      setAttempt(1);
      setlockTrial(3);
      setDisplayText(['That is correct', 2000, 'This is the second color of Boston'])
      return;
    }
    setDisplayText(['incorrect.', 1000, 'This is the first color of Boston'])
  };

  const handleTrialThreeSubmit = () => {
    setKey(prevKey => prevKey + 1)
    if (inputText.toLowerCase() === 'pink') {
      setlockTrial(4);
      setShowInput(false);
      setDisplayText(['Congratulations!',1000, 'Congratulations! Collect your reward.'])
      const timer = setTimeout(() => {
        changeStep(4);
      }, 5000);
      return () => clearTimeout(timer);
    }
    if (inputText.toLowerCase() === 'violet') {
      setDisplayText(['No.', 1000, 'This is the SECOND color of Boston'])
      return;
    }
    setDisplayText(['incorrect.', 1000, 'This is the second color of Boston'])
  };

  const trialSubmits = {
    1: handleTrialOneSubmit,
    2: handleTrialTwoSubmit,
    3: handleTrialThreeSubmit,
  }

  const handleSubmit = async () => {
    setInputText('');
    setAttempt(attempt + 1);
    trialSubmits[lockTrial]();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  const closedLock = (
    <ClosedLock className="lock" />
  )

  const showHint = attempt > 2;

  let lockOne = (
    closedLock
  )

  if (lockTrial === 1 && showHint) {
    lockOne = <RooLock className="lock"/>;
  }

  if (lockTrial > 1) {
    lockOne = <OpenLock className="lock"/>;
  }

  let lockTwo = (
    closedLock
  )

  if (lockTrial === 2 && showHint) {
    lockTwo = <SpotifyLock className="lock"/>;
  }

  if (lockTrial > 2) {
    lockTwo = <OpenLock className="lock"/>;
  }

  let lockThree = (
    closedLock
  )

  if (lockTrial === 3 && showHint) {
    lockThree = <SweatLock className="lock"/>;
  }

  if (lockTrial > 3) {
    lockThree = <OpenLock className="lock"/>;
  }

  return (
    <div className="text-center step-three">
      <TypeAnimation
        key={key}
        sequence={displayText}
        wrapper="span"
        speed={70}
        style={{
          fontSize: '2em',
          display: 'inline-block',
        }}
        repeat={0}
      />
      <div className={`lock-container mt-6 active-${lockTrial}`}>
        <div className="lock-box mx-2 lock-1">
          {lockOne}
        </div>
        <div className="lock-box mx-2 lock-2">
          {lockTwo}
        </div>
        <div className="lock-box mx-2 lock-3">
          {lockThree}
        </div>
      </div>
      <div className={`mt-8 fade-in ${showInput ? 'visible' : ''}`}>
        <input
          type="text"
          onChange={(event) => handleInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="enter password"
          value={inputText}
        />
      </div>
    </div>
  );
};

export default StepThree;
