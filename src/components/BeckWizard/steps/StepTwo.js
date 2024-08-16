/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';

const StepTwo = ({ changeStep }) => {
  const [displayText, setDisplayText] = useState(['Phase 2', 2000]);
  const [key, setKey] = useState(0);
  const [inputText, setInputText] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInput(!showInput);
    }, 1000); // Adjust the delay as needed

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

  return (
    <div className="text-center step-one">
      <TypeAnimation
        key={key}
        sequence={displayText}
        wrapper="span"
        speed={70}
        style={{ fontSize: '2em', display: 'inline-block' }}
        repeat={0}
      />
      <div className={`mt-8 fade-in ${showInput ? 'visible' : ''}`}>
        <input
          type="text"
          onChange={(event) => handleInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
};

export default StepTwo;