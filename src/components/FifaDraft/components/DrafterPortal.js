/* eslint-disable react/prop-types */
import React, { useState, useEffect } from 'react';
import {
  submitDraftedPlayer,
  subscribeToPlayer,
  subscribeToPlayers,
  subscribeToFifaCurrentRule,
  subscribeToFifaCurrentCategory,
  subscribeToFifaCurrentRound,
  subscribeToFifaDraftOrder,
  subscribeToFifaCurrentTurnIndex,
  setFifaCurrentCategory,
  setFifaCurrentRule,
  updateDraftedPlayerEntry,
  subscribeToFifaEditingContext,
  setFifaEditingContext,

} from '../../../utils/fifaFirebase';
import { lightenColor } from '../../../utils/lightenColor';
import PlayerSearch from './PlayerSearch';

const DrafterPortal = ({ player, playerId }) => {
  const [draftedPlayer, setDraftedPlayer] = useState('');
  const [lastPlayerSubmitted, setLastPlayerSubmitted] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [currentRule, setCurrentRule] = useState({});
  const [currentCategory, setCurrentCategory] = useState('');
  const [currentRound, setCurrentRound] = useState(1);
  const [draftedPlayerList, setDraftedPlayerList] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]);
  const [draftOrder, setDraftOrder] = useState([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [editingContext, setEditingContext] = useState(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (!playerId) return;

    const unsubscribePlayer = subscribeToPlayer(playerId, (playerData) => {
      setLastPlayerSubmitted(playerData.lastDraft || null);
      setDraftedPlayerList(playerData.draftedPlayerList || []);
    });

    const unsubscribeCategory = subscribeToFifaCurrentCategory((category) => {
      if (category) {
        setCurrentCategory(category);
      }
    });

    const unsubscribeRule = subscribeToFifaCurrentRule((rule) => {
      if (rule) {
        setCurrentRule(rule);
      }
    });

    const unsubscribeRound = subscribeToFifaCurrentRound((round) => {
      if (round) {
        setCurrentRound(round);
      }
    });

    const unsubscribeAllPlayers = subscribeToPlayers((players) => {
      setAllPlayers(players || []);
    });

    const unsubscribeDraftOrder = subscribeToFifaDraftOrder((order) => {
      setDraftOrder(order || []);
    });

    const unsubscribeTurnIndex = subscribeToFifaCurrentTurnIndex((index) => {
      setCurrentTurnIndex(typeof index === 'number' ? index : 0);
    });

    const unsubscribeEditingContext = subscribeToFifaEditingContext((context) => {
      setEditingContext(context);
    });

    // Cleanup subscriptions on unmount
    return () => {
      if (unsubscribePlayer) unsubscribePlayer();
      if (unsubscribeRule) unsubscribeRule();
      if (unsubscribeCategory) unsubscribeCategory();
      if (unsubscribeRound) unsubscribeRound();
      if (unsubscribeAllPlayers) unsubscribeAllPlayers();
      if (unsubscribeDraftOrder) unsubscribeDraftOrder();
      if (unsubscribeTurnIndex) unsubscribeTurnIndex();
      if (unsubscribeEditingContext) unsubscribeEditingContext();
    };
  }, [playerId]);

  const isMyPickBeingEdited = editingContext?.drafterId === playerId;

  useEffect(() => {
    if (isMyPickBeingEdited) {
      const pick = draftedPlayerList[editingContext.pickIndex];
      if (pick) setEditValue(pick.name);
    }
  }, [isMyPickBeingEdited, editingContext, draftedPlayerList]);

  // If no draft order has been explicitly set, default to the current player order
  const effectiveDraftOrder = draftOrder.length > 0 ? draftOrder : allPlayers.map(p => p.id);
  const currentTurnPlayerId = effectiveDraftOrder[currentTurnIndex];
  const isMyTurn = Boolean(currentTurnPlayerId) && currentTurnPlayerId === playerId;
  const currentTurnPlayerName = allPlayers.find(p => p.id === currentTurnPlayerId)?.name;

  const handleSend = async () => {
    if (draftedPlayer.trim() && isMyTurn) {
      setIsSubmitting(true);
      setError(null);

      try {
        const draftEntry = {
          name: draftedPlayer.trim(),
          currentCategory,
          currentRule: currentRule.shortName,
        };
        await submitDraftedPlayer(playerId, draftEntry, currentTurnIndex + 1);
        setLastPlayerSubmitted(draftEntry);
        setDraftedPlayer('');
      }
      catch (err) {
        console.error('Error submitting drafted player:', err);
        setError('Failed to submit player. Please try again.');
      }
      finally {
        setIsSubmitting(false);
      }
    }
  };
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isSubmitting) {
      handleSend();
    }
  };

  // Restores the category/rule that were active before the admin unlocked this pick, and clears the unlock
  const restoreGameStateAfterEdit = async () => {
    if (editingContext) {
      setCurrentCategory(editingContext.previousCategory);
      setFifaCurrentCategory(editingContext.previousCategory).catch((err) => {
        console.error('Error saving category:', err);
      });

      setCurrentRule(editingContext.previousRule);
      setFifaCurrentRule(editingContext.previousRule).catch((err) => {
        console.error('Error saving rule:', err);
      });
    }

    try {
      await setFifaEditingContext(null);
    }
    catch (err) {
      console.error('Error clearing editing context:', err);
    }
  };

  const handleCancelEditPick = () => {
    restoreGameStateAfterEdit();
  };

  const handleSaveEditedPick = async () => {
    if (!editValue.trim() || !isMyPickBeingEdited) return;
    const pick = draftedPlayerList[editingContext.pickIndex];
    if (!pick) return;

    try {
      await updateDraftedPlayerEntry(playerId, editingContext.pickIndex, { ...pick, name: editValue.trim() });
    }
    catch (err) {
      console.error('Error updating drafted player:', err);
    }
    finally {
      await restoreGameStateAfterEdit();
    }
  };

  // Answer input (shown after wager in Final Jeopardy, or immediately in regular rounds)
  const inputField = (
    <div>
      <label htmlFor="answer" style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
        Your Player:
      </label>
      <div style={{ display: 'flex', gap: '10px' }} className="flex-wrap">
        <div style={{ flex: 1 }} onKeyPress={handleKeyPress}>
          <PlayerSearch
            value={draftedPlayer}
            onChange={setDraftedPlayer}
            disabled={isSubmitting}
          />
        </div>
        <button
          onClick={handleSend}
          disabled={!draftedPlayer.trim() || isSubmitting}
          style={{
            padding: '12px 24px',
            fontSize: '16px',
            backgroundColor: draftedPlayer.trim() && !isSubmitting ? '#060CE9' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: draftedPlayer.trim() && !isSubmitting ? 'pointer' : 'not-allowed',
            fontWeight: 'bold',
            minWidth: '100px',
          }}
        >
          {isSubmitting ? 'Sending...' : 'Send'}
        </button>
      </div>
      {error && (
        <p style={{ color: 'red', marginTop: '10px', fontSize: '14px' }}>{error}</p>
      )}
    </div>
  );

  const waitingDisplay = (
    <div>
      <p style={{ fontSize: '16px', padding: '12px', backgroundColor: '#f0f0f0', borderRadius: '8px' }}>
        {(currentTurnPlayerName !== player) ? `Waiting for ${currentTurnPlayerName}'s turn...` : 'Waiting for Category to be set'}
      </p>
    </div>
  );

  const lastPickDisplay = lastPlayerSubmitted?.name && (
    <div>
      <p style={{ fontSize: '16px', padding: '12px', backgroundColor: '#e8f5e9', borderRadius: '8px' }}>
        Last Player:
        {' '}
        <strong>{lastPlayerSubmitted.name}</strong>
        {' '}
        (
        {lastPlayerSubmitted.currentCategory}
        :
        {' '}
        {lastPlayerSubmitted.currentRule}
        )
      </p>
    </div>
  );

  const answerDisplay = (isMyTurn && currentRule.name) ? inputField : waitingDisplay;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }} className="fifa-player-portal">
      <h2>{player}</h2>
      <p className="text-center" style={{ fontWeight: 'bold' }}>
        Round
        {currentRound}
        {' '}
        / 15
      </p>

      {currentRule.name && (
        <div
          className="fifa-draft-rule-display"
          style={currentRule.color
            ? {
                '--rule-color': currentRule.color,
                '--rule-color-light': lightenColor(currentRule.color, 40),
              }
            : undefined}
        >
          <h3 className="my-0">{currentCategory}</h3>
          <p className="my-0">
            {currentRule?.icon}
            {' '}
            {currentRule.name}
            {' '}
            {currentRule?.icon}
          </p>
        </div>
      )}
      {answerDisplay}
      {lastPickDisplay}
      {draftedPlayerList.length > 0 && (
        <div>
          <h3>Your Picks</h3>
          <ol>
            {draftedPlayerList.map((pick, index) => {
              if (isMyPickBeingEdited && editingContext.pickIndex === index) {
                return (
                  <li key={`${pick.name}-${index}`} className="fifa-draft-pick-editing">
                    <PlayerSearch value={editValue} onChange={setEditValue} />
                    <button onClick={handleSaveEditedPick}>Save</button>
                    <button onClick={handleCancelEditPick}>Cancel</button>
                  </li>
                );
              }

              return (
                <li key={`${pick.name}-${index}`}>
                  <span className="font-bold">{pick.name}</span>
                  {' '}
                  (
                  {pick.currentCategory}
                  :
                  {pick.currentRule}
                  )
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
};

export default DrafterPortal;
