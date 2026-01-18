/* eslint-disable react/prop-types */
import React from "react";

const PlayerPortal = ({ player, score = 0 }) => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>{player}</h2>
      <p>Score: {score}</p>
    </div>
  );
};

export default PlayerPortal;
