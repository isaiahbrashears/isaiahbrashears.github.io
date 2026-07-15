import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeToPlayers, addFifaPlayer } from '../../../utils/fifaFirebase';

const BracketDisplay = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = subscribeToPlayers((allPlayers) => {
      const filteredPlayers = allPlayers.filter(p => p.name && p.name.trim() !== '');
      setPlayers(filteredPlayers);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSignUp = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await addFifaPlayer(trimmed);
      setNewName('');
      navigate(`/fifa-draft/${encodeURIComponent(trimmed)}`);
    }
    catch (err) {
      console.error('Error signing up:', err);
      setError('Failed to join. Please try again.');
    }
    finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fifa-draft">
      <div className="fifa-draft-bracket-display">

      </div>
    </div>
  );
};

export default BracketDisplay;
