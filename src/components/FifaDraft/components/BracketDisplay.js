import React, { useState, useEffect } from 'react';
import { subscribeToFifaBracket } from '../../../utils/fifaFirebase';
import BracketTree from './BracketTree';

const BracketDisplay = () => {
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const unsubscribeBracket = subscribeToFifaBracket((bracketMatches) => {
      setMatches(bracketMatches || []);
    });

    return () => {
      if (unsubscribeBracket) unsubscribeBracket();
    };
  }, []);

  return (
    <div className="fifa-draft">
      <h1 className="text-center fifa-draft-bracket-header">Tournament Knockout</h1>
      <div className="fifa-draft-bracket-display">
        {matches.length > 0
          ? <BracketTree matches={matches} />
          : <p className="text-center">The bracket hasn&apos;t been set yet.</p>}
      </div>
    </div>
  );
};

export default BracketDisplay;
