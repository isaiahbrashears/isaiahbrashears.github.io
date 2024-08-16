import React, { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';

const StepOne = ({ changePage }) => {
  const [displayText, setDisplayText] = useState(['Hello Becca.', 100, 'Hello Becky.', 4000, 'Would you like to play a game?', 2000]);
  const [key, setKey] = useState(0);
  const [inputText, setInputText] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInput(true);
    }, 7000); // Adjust the delay as needed

    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = () => {

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
        <input type="text" />
      </div>
    </div>
  );
};

export default StepOne;
