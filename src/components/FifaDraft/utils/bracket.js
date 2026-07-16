// Builds and maintains a single-elimination bracket, stored directly in the
// flat { id, name, nextMatchId, tournamentRoundText, startTime, state, participants }
// shape @g-loot/react-tournament-brackets expects - no conversion step, what's
// read out of Firestore is what gets passed straight into <SingleEliminationBracket />.
//
// Each match also carries a few internal-only bookkeeping fields (roundIndex,
// matchIndex, isBye) - the library ignores unknown keys, per its own docs.
//
// `participants` is always a fixed-length [slotA, slotB] array; an unfilled
// slot is `null` (never `undefined` - Firestore rejects undefined array values).
// Filter out nulls right before handing participants to the bracket library.

export const shuffle = (list) => {
  const shuffled = [...list];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const toParticipant = (matchId, playerId, playerName, winnerId) => ({
  id: playerId,
  matchId,
  name: playerName,
  isWinner: winnerId === playerId,
  resultText: winnerId ? (winnerId === playerId ? 'Won' : 'Lost') : null,
  status: winnerId ? 'PLAYED' : null,
});

// Pushes known winners into the next match's slot, auto-resolving any bye
// whose single feeder has just become known. Mutates and returns `matches`.
const propagate = (matches) => {
  const byId = Object.fromEntries(matches.map(match => [match.id, match]));
  let changed = true;

  while (changed) {
    changed = false;

    matches.forEach((match) => {
      const winner = match.participants.find(p => p?.isWinner);
      if (!winner || !match.nextMatchId) return;

      const nextMatch = byId[match.nextMatchId];
      const slot = match.matchIndex % 2;

      if (!nextMatch.participants[slot] || nextMatch.participants[slot].id !== winner.id) {
        nextMatch.participants[slot] = toParticipant(nextMatch.id, winner.id, winner.name, null);
        changed = true;
      }

      const filled = nextMatch.participants.filter(Boolean);
      if (nextMatch.isBye && filled.length === 1 && nextMatch.state !== 'DONE' && nextMatch.state !== 'WALK_OVER') {
        const solo = filled[0];
        nextMatch.participants = nextMatch.participants.map(p => (
          p && p.id === solo.id ? { ...p, isWinner: true, resultText: 'Won', status: 'PLAYED' } : p
        ));
        nextMatch.state = 'WALK_OVER';
        changed = true;
      }
    });
  }

  return matches;
};

/**
 * Randomly pairs players into a full single-elimination bracket, stored as a
 * flat list of matches. An odd player (or, in later rounds, an odd match
 * count) gets a bye - auto-resolved and cascaded forward.
 * @param {Array<{ id: string, name: string }>} players
 * @returns {Array<Object>} Flat list of matches (bracket library's MatchType shape)
 */
export const buildBracketMatches = (players) => {
  const shuffled = shuffle(players);

  // Match count per round is fixed purely by player count - work it out up front
  // so ids/nextMatchId links can be created before any winners are known.
  const roundSizes = [Math.ceil(shuffled.length / 2)];
  while (roundSizes[roundSizes.length - 1] > 1) {
    roundSizes.push(Math.ceil(roundSizes[roundSizes.length - 1] / 2));
  }
  const totalRounds = roundSizes.length;

  const matchesByRound = [];
  const matches = [];

  roundSizes.forEach((matchCount, r) => {
    const ids = [];

    for (let m = 0; m < matchCount; m++) {
      const id = `r${r}-m${m}`;
      ids.push(id);

      let isBye;
      let participants;
      let state;

      if (r === 0) {
        const player1 = shuffled[m * 2] || null;
        const player2 = shuffled[m * 2 + 1] || null;
        isBye = Boolean(player1) && !player2;
        const winnerId = isBye ? player1.id : null;

        participants = [
          player1 ? toParticipant(id, player1.id, player1.name, winnerId) : null,
          player2 ? toParticipant(id, player2.id, player2.name, winnerId) : null,
        ];
        state = isBye ? 'WALK_OVER' : 'NO_PARTY';
      }
      else {
        isBye = (m * 2 + 1) >= roundSizes[r - 1];
        participants = [null, null];
        state = 'NO_PARTY';
      }

      matches.push({
        id,
        roundIndex: r,
        matchIndex: m,
        isBye,
        name: r === totalRounds - 1 ? 'Final' : `Round ${r + 1} - Match ${m + 1}`,
        nextMatchId: null,
        tournamentRoundText: r === totalRounds - 1 ? 'Final' : String(r + 1),
        startTime: '',
        state,
        participants,
      });
    }

    matchesByRound.push(ids);
  });

  for (let r = 0; r < totalRounds - 1; r++) {
    matchesByRound[r].forEach((id, m) => {
      const match = matches.find(candidate => candidate.id === id);
      match.nextMatchId = matchesByRound[r + 1][Math.floor(m / 2)];
    });
  }

  return propagate(matches);
};

/**
 * Declares a winner for a given match and cascades that result forward
 * through the bracket, returning a new matches array (does not mutate the input).
 * @param {Array<Object>} matches
 * @param {string} matchId
 * @param {string} winnerId
 * @returns {Array<Object>}
 */
export const applyMatchWinner = (matches, matchId, winnerId) => {
  const cloned = matches.map(match => ({
    ...match,
    participants: match.participants.map(p => (p ? { ...p } : null)),
  }));

  const match = cloned.find(candidate => candidate.id === matchId);
  if (!match) return cloned;

  match.participants = match.participants.map(p => (
    p ? { ...p, isWinner: p.id === winnerId, resultText: p.id === winnerId ? 'Won' : 'Lost', status: 'PLAYED' } : p
  ));
  match.state = 'DONE';

  return propagate(cloned);
};
