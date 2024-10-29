/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';

const StepOne = ({ changeStep }) => {
  const [displayText, setDisplayText] = useState(['Hello Becca.', 100, 'Hello Becky.', 4000, 'Would you like to play a game?', 2000]);
  const [key, setKey] = useState(0);
  const [inputText, setInputText] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [hideInput, setHideInput] = useState(false);

  const affirmativeAnswers = ['yes', 'ya', 'yea', 'yeah', 'yep', 'yeppers', 'sure', 'si', 'yesh', 'affirmative', 'yes please']
  const negativeAnswers = ['nah', 'no', 'na', 'nope', 'no thanks', 'why', 'why?', 'negative']

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInput(!showInput);
    }, 7000); // Adjust the delay as needed

    return () => clearTimeout(timer);
  }, [hideInput]);

  const handleInputChange = (value) => {
    setInputText(value);
  };

  const handleSubmit = () => {
    if (affirmativeAnswers.includes(inputText.toLowerCase())) {
      setDisplayText(["It's nice to see you again."])
      setKey(prevKey => prevKey + 1)
      const timer = setTimeout(() => {
        changeStep(2);
      }, 3000);
      return () => clearTimeout(timer);
    }

    if (negativeAnswers.includes(inputText.toLowerCase())) {
      setHideInput(true)
      setDisplayText(
        [
          "Umm okay...", 3000,
          'I had a whole thing, but I guess we can just stare at each other.', 10000,
          'Was it because you saw me call you "Becca"?', 4000,
          'Seriously?', 3000,
          'It was a mistake and I fixed it.', 3000,
          "Sorry I'm not perfect.", 4000,
          "Can we just start over?", 4000,
          'Hello BECKY.', 2000,
          'Would you like to play a game?',
        ])
      setKey(prevKey => prevKey + 1)
      setInputText('');
      const timer = setTimeout(() => {
        setShowInput(true);
      }, 48000);
      return () => clearTimeout(timer);
    } else {
      setDisplayText(
        [
          "No one knows what you're trying to say.", 2000,
          "No one knows what you're trying to say. Let's try again", 2000,
          'Would you like to play a game?'
        ])
      setKey(prevKey => prevKey + 1)
    }
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
          value={inputText}
        />
      </div>
    </div>
  );
};

export default StepOne;
