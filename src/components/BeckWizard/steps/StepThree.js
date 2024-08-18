/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';
import ClosedLock from '../../../assets/images/lock-closed.svg';
import RooLock from '../../../assets/images/raygun.svg';
import SpotifyLock from '../../../assets/images/violet.svg';
import SweatLock from '../../../assets/images/pink.svg';
import OpenLock from '../../../assets/images/lock-open.svg';


const StepThree = ({ changeStep }) => {

  const [displayText, setDisplayText] = useState(["One dancer comes first"]);
  const [key, setKey] = useState(0);
  const [lockTrial, setlockTrial] = useState(3);
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

  const handleSubmit = () => {

  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSubmit();
    }
  };

  const closedLock = (
    <ClosedLock className=" lock" />
  )

  let lockOne = (
    closedLock
  )

  let lockTwo = (
    closedLock
  )

  let lockThree = (
    closedLock
  )

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
        <div className="lock-box lock-1">
          {lockOne}
        </div>
        <div className="lock-box lock-2">
          {lockTwo}
        </div>
        <div className="lock-box lock-3">
          {lockThree}
        </div>
      </div>
      <div className={`mt-8 fade-in ${showInput ? 'visible' : ''}`}>
        <input
          type="text"
          onChange={(event) => handleInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="enter password"
        />
      </div>
    </div>
  );
};

export default StepThree;
