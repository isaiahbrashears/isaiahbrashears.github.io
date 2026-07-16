/* eslint-disable react/prop-types */
import React, { useState, useEffect, useRef } from 'react';
import { SingleEliminationBracket, Match, SVGViewer, createTheme } from '@g-loot/react-tournament-brackets';

const fifaTheme = createTheme({
  fontFamily: 'inherit',
  canvasBackground: '#000',
  textColor: {
    main: '#f33244',
    highlighted: '#fff',
    dark: '#c9c9c9',
    disabled: '#5D6371',
  },
  matchBackground: {
    wonColor: '#1a1a1a',
    lostColor: '#0d0d0d',
  },
  border: {
    color: '#f33244',
    highlightedColor: '#fff',
  },
  roundHeaders: {
    background: '#f33244',
    color: '#000',
  },
  score: {
    text: {
      highlightedWonColor: '#000',
      highlightedLostColor: '#000',
    },
    background: {
      wonColor: '#ffdf00',
      lostColor: '#4b4848',
    },
  },
});

const MIN_WIDTH = 320;
const MIN_HEIGHT = 320;

// Tracks how much room the bracket actually has (container width + a share of
// viewport height) so SVGViewer's pan/zoom window - not the SVG content itself -
// is what adapts at each breakpoint.
const useViewerSize = () => {
  const containerRef = useRef(null);
  const [size, setSize] = useState({ width: MIN_WIDTH, height: MIN_HEIGHT });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    const updateSize = () => {
      setSize({
        width: Math.max(node.clientWidth, MIN_WIDTH),
        height: Math.max(Math.round(window.innerHeight * 0.65), MIN_HEIGHT),
      });
    };

    updateSize();

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(node);
    window.addEventListener('resize', updateSize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  return [containerRef, size];
};

// Shared bracket renderer. `matches` is the flat, Firestore-stored list in the
// bracket library's own MatchType shape. Pass `onDeclareWinner(matchId, playerId)`
// to make it interactive (admin control); omit it for a read-only display.
const BracketTree = ({ matches, onDeclareWinner }) => {
  const [containerRef, { width, height }] = useViewerSize();

  // Guards against stale data left over from an earlier bracket data shape
  // (e.g. the old per-round { matchups } format, which has no `participants`)
  const validMatches = (matches || []).filter(
    match => Array.isArray(match?.participants) && typeof match?.roundIndex === 'number',
  );

  if (validMatches.length === 0) return null;

  // Only the library's documented fields go out to the component; participants
  // are stored as fixed [slotA, slotB] arrays with null placeholders for TBD slots.
  const renderableMatches = validMatches.map(match => ({
    ...match,
    participants: match.participants.filter(Boolean),
  }));

  const handlePartyClick = (party) => {
    if (!onDeclareWinner || !party?.matchId || !party?.id) return;
    onDeclareWinner(party.matchId, party.id);
  };

  return (
    <div className="fifa-bracket-tree" ref={containerRef}>
      <SingleEliminationBracket
        matches={renderableMatches}
        matchComponent={Match}
        theme={fifaTheme}
        onPartyClick={onDeclareWinner ? handlePartyClick : undefined}
        svgWrapper={({ children, ...props }) => (
          <SVGViewer width={width} height={height} {...props}>
            {children}
          </SVGViewer>
        )}
      />
    </div>
  );
};

export default BracketTree;
