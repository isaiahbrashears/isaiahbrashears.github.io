/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { setFifaBracket, subscribeToFifaBracket } from '../../../utils/fifaFirebase';
import { buildBracketMatches, applyMatchWinner } from '../utils/bracket';
import BracketTree from './BracketTree';

const AdminBracketDashboard = ({ players = [] }) => {
  const [matches, setMatches] = useState([]);
  const eligiblePlayers = players.filter(p => p.name && p.name.trim() !== '');

  useEffect(() => {
    const unsubscribeBracket = subscribeToFifaBracket((bracketMatches) => {
      setMatches(bracketMatches || []);
    });

    return () => {
      if (unsubscribeBracket) unsubscribeBracket();
    };
  }, []);

  const handleRandomizeBracket = () => {
    if (eligiblePlayers.length < 2) return;

    const confirmed = window.confirm(
      'This will randomize the bracket and overwrite any existing matchups. Are you sure?',
    );
    if (!confirmed) return;

    const newMatches = buildBracketMatches(eligiblePlayers);
    setMatches(newMatches);
    setFifaBracket(newMatches).catch((err) => {
      console.error('Error saving bracket:', err);
    });
  };

  const handleDeclareWinner = (matchId, playerId) => {
    const newMatches = applyMatchWinner(matches, matchId, playerId);
    setMatches(newMatches);
    setFifaBracket(newMatches).catch((err) => {
      console.error('Error saving bracket winner:', err);
    });
  };

  return (
    <div className="fifa-draft-bracket-dash">
      <h1 className="text-center">Bracket</h1>
      <button
        className="new-category-btn button passed-color m-auto"
        style={{
          '--button-color': '#117996',
          '--button-text-color': 'white',
        }}
        onClick={handleRandomizeBracket}
        disabled={eligiblePlayers.length < 2}
      >
        Randomize Bracket
      </button>

      <BracketTree matches={matches} onDeclareWinner={handleDeclareWinner} />
    </div>
  );
};

export default AdminBracketDashboard;
