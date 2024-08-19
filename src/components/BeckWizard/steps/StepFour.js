import React, { useState, useEffect } from 'react';;
import QRCode from '../../../assets/images/link-qr.svg';

const StepFour = () => {
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowQR(!showQR);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);



  return (
    <div className="text-center step-four">
      <div className={`fade-in ${showQR ? 'visible' : ''}`}>
        <QRCode className="qr-code"/>
      </div>
    </div>
  );
};

export default StepFour;
