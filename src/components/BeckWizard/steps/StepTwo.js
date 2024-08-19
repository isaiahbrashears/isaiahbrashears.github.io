/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { TypeAnimation } from 'react-type-animation';

const StepTwo = ({ changeStep }) => {
  const [crypticText, setCrypticText] = useState(true);
  const sentence = 'the complex murderer swiftly grabbed a hazy knife to fix a quivering broken jaw';
  const crypticSentence = 'ム¥ɖ ӄጀ山ᐸ¤ɖ๏ 山の爪ֆɖ爪ɖ爪 ズ℘𝔶รム¤ᘻ 乂爪ɮɨɨɖֆ ɮ ¥ɮᗱᘻ 千尺𝔶รɖ ムጀ ร𝔶๏ ɮ ʄの𝔶ﾘɖ爪𝔶尺乂 ɨ爪ጀ千ɖ尺 ๔ɮ℘';
  let translateText = 'translate';
  if (crypticText) {
    translateText = 'ム爪ɮ尺ズ¤ɮムɖ';
  }

  const [displayText, setDisplayText] = useState([crypticSentence]);
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

  const password = 'the password is this sentence'

  // let passwordStr;
  // const passwordEncryptor = () => {
  //   const passwordArr = [];
  //   for (let index = 0; index < password.length; index++) {
  //     if (password[index] === ' ') {
  //       passwordArr.push(' ');
  //     }
  //     passwordArr.push(textKey[password[index]]);
  //   }
  //   passwordStr = passwordArr.join('');
  //   console.log(passwordStr);
  // }

  // passwordEncryptor();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInput(!showInput);
    }, 1000); // Adjust the delay as needed

    return () => clearTimeout(timer);
  }, []);

  const handleTranslate = () => {
    const nextCrypticText = !crypticText;
    let displaySentence = sentence;

    if (nextCrypticText) {
      displaySentence = crypticSentence;
    }

    setCrypticText(nextCrypticText);
    setDisplayText([displaySentence]);
    setKey(prevKey => prevKey + 1);
  };

  const handleInputChange = (value) => {
    setInputText(value);
  };

  const handleSubmit = () => {
    if (inputText.toLowerCase() === password) {
      setDisplayText(["password accepted.", 2000, "password accepted. ֆɖӄ𝔶ᐸ¥ɖ爪𝔶尺乂 ム¥𝔶ズ 𝔶ズ ɮ ℘ɮズムɖ ጀร ム𝔶山ɖ"])
      setKey(prevKey => prevKey + 1)
      const timer = setTimeout(() => {
        changeStep(3);
      }, 5000);
      return () => clearTimeout(timer);
    }

    setDisplayText(["incorrect password.", 2000, crypticSentence])
    setKey(prevKey => prevKey + 1)
    setCrypticText(true);
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
          <button onClick={handleTranslate}>{translateText}</button>
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
