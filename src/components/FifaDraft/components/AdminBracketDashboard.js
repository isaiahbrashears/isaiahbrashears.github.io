/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import { setFifaBracket, subscribeToFifaBracket } from '../../../utils/fifaFirebase';

const shuffle = (list) => {
  const shuffled = [...list];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Pairs players at random; an odd player out gets a bye (an automatic round-1 win)
const generateFirstRoundMatchups = (players) => {
  const shuffled = shuffle(players);
  const matchups = [];

  for (let i = 0; i < shuffled.length; i += 2) {
    const player1 = shuffled[i];
    const player2 = shuffled[i + 1] || null;

    matchups.push({
      id: `r1-m${matchups.length}`,
      player1Id: player1.id,
      player1Name: player1.name,
      player2Id: player2 ? player2.id : null,
      player2Name: player2 ? player2.name : null,
      winnerId: player2 ? null : player1.id,
    });
  }

  return matchups;
};

const AdminBracketDashboard = ({ players = [] }) => {
  const [rounds, setRounds] = useState([]);
  const eligiblePlayers = players.filter(p => p.name && p.name.trim() !== '');

  useEffect(() => {
    const unsubscribeBracket = subscribeToFifaBracket((bracketRounds) => {
      setRounds(bracketRounds || []);
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

    // Firestore rejects arrays nested directly inside arrays, so each round is
    // wrapped in a { matchups } object rather than being a bare array itself.
    const newRounds = [{ matchups: generateFirstRoundMatchups(eligiblePlayers) }];
    setRounds(newRounds);
    setFifaBracket(newRounds).catch((err) => {
      console.error('Error saving bracket:', err);
    });
  };

  const firstRound = rounds[0]?.matchups || [];

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

      {firstRound.length > 0 && (
        <div className="fifa-bracket-round">
          <h2 className="text-center">Round 1</h2>
          <ol className="fifa-bracket-matchup-list">
            {firstRound.map(matchup => (
              <li key={matchup.id} className="fifa-bracket-matchup">
                <span className="fifa-bracket-player">{matchup.player1Name}</span>
                {matchup.player2Name
                  ? (
                      <>
                        <span className="fifa-bracket-vs">vs</span>
                        <span className="fifa-bracket-player">{matchup.player2Name}</span>
                      </>
                    )
                  : (
                      <span className="fifa-bracket-bye">BYE</span>
                    )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};

export default AdminBracketDashboard;
