/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';;

const StepFour = () => {
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowQR(!showQR);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);



  return (
    <div className="text-center step-four">
      <div className={`mt-8 fade-in ${showQR ? 'visible' : ''}`}>

      </div>
    </div>
  );
};

export default StepFour;
