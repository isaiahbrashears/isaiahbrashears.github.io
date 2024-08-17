/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';

const StepTwo = ({ changeStep }) => {
  const [crypticText, setCrypticText] = useState(true);
  const sentence = 'the complex murderer swiftly grabbed a hazy knife to fix a quivering broken jaw';
  const crypticSentence = 'ム¥ɖ ӄጀ山ᐸ¤ɖ๏ 山の爪ֆɖ爪ɖ爪 ズ℘𝔶รム¤ᘻ 乂爪ɮɨɨɖֆ ɮ ¥ɮᗱᘻ 千尺𝔶รɖ ムጀ ร𝔶๏ ɮ ʄの𝔶ﾘɖ爪𝔶尺乂 ɨ爪ጀ千ɖ尺 ๔ɮ℘';
  const translateText = 'translate';
  const translateCrypticText = 'ム爪ɮ尺ズ¤ɮムɖ';
  const [displayText, setDisplayText] = useState([crypticSentence]);
  const [translateBtnText, setTranslateBtnText] = useState(translateCrypticText);
  const [key, setKey] = useState(0);
  const [inputText, setInputText] = useState('');
  const [showInput, setShowInput] = useState(false);


  const textKey = {
    a: 'ɮ',
    b: 'ɨ',
    c: 'ӄ',
    d: 'ֆ',
    e: 'ɖ',
    f: 'ร',
    g: '乂',
    h: '¥',
    i: '𝔶',
    j: '๔',
    k: '千',
    l: '¤',
    m: '山',
    n: '尺',
    o: 'ጀ',
    p: 'ᐸ',
    q: 'ʄ',
    r: '爪',
    s: 'ズ',
    t: 'ム',
    u: 'の',
    v: 'ﾘ',
    w: '℘',
    x: '๏',
    y: 'ᘻ',
    z: 'ᗱ',
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInput(!showInput);
    }, 1000); // Adjust the delay as needed

    return () => clearTimeout(timer);
  }, []);

  const handleTranslate = () => {
    const nextCrypticText = !crypticText;
    let displaySentence = sentence;
    let nextTranslateBtnText = translateText;

    if (nextCrypticText) {
      displaySentence = crypticSentence;
      nextTranslateBtnText = translateCrypticText;
    }

    setTranslateBtnText(nextTranslateBtnText)
    setCrypticText(nextCrypticText); // Update state with the new value
    setDisplayText([displaySentence]); // Update display text
    setKey(prevKey => prevKey + 1); // Trigger re-render
  };

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
    <div className="text-center step-two">
      <TypeAnimation
        key={key}
        sequence={displayText}
        wrapper="span"
        speed={70}
        style={{
          fontSize: '2em',
          display: 'inline-block',
          whiteSpace: 'normal',
          wordBreak: crypticText ? 'keep-all' : 'normal'
        }}
        repeat={0}
      />
      <div className={`mt-8 fade-in ${showInput ? 'visible' : ''}`}>
        <div className="my-4">
          <button onClick={handleTranslate}>{translateBtnText}</button>
        </div>
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

export default StepTwo;
