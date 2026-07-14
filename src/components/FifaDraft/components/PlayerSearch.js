/* eslint-disable react/prop-types */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import players from '../files/EAFC26-Men.json';

const MAX_RESULTS = 8;

const PlayerSearch = ({ onSelect, placeholder = 'Search for a player...', disabled = false }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const matches = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];

    return players
      .filter(player => player.Name.toLowerCase().includes(trimmed))
      .slice(0, MAX_RESULTS);
  }, [query]);

  const handleChange = (e) => {
    setQuery(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = (player) => {
    setQuery(player.Name);
    setIsOpen(false);
    onSelect(player);
  };

  return (
    <div className="player-search" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        onFocus={() => query.trim() && setIsOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className="player-search-input"
      />
      {isOpen && matches.length > 0 && (
        <ul className="player-search-results">
          {matches.map((player, index) => (
            <li
              key={`${player.Name}-${player.Team}-${index}`}
              className="player-search-result"
              onClick={() => handleSelect(player)}
            >
              <span className="player-search-result-name">{player.Name}</span>
              <span className="player-search-result-meta">
                {player.OVR}
                {' '}
                OVR ·
                {' '}
                {player.Position}
                {' '}
                ·
                {' '}
                {player.Team}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PlayerSearch;
