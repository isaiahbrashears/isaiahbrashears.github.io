/* eslint-disable react/prop-types */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import players from '../files/EAFC26-Men.json';

const MAX_RESULTS = 8;

const PlayerSearch = ({ value, onChange, placeholder = 'Type or search for a player...', disabled = false }) => {
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
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return [];

    return players
      .filter(player => player.Name.toLowerCase().includes(trimmed))
      .slice(0, MAX_RESULTS);
  }, [value]);

  const handleChange = (e) => {
    onChange(e.target.value);
    setIsOpen(true);
  };

  const handleSelect = (player) => {
    onChange(player.Name);
    setIsOpen(false);
  };

  return (
    <div className="player-search" ref={containerRef}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => value.trim() && setIsOpen(true)}
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
