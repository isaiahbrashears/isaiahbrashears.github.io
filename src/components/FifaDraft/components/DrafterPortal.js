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
  subscribeToFifaSkippedDrafters,
  skipDraftTurn,

} from '../../../utils/fifaFirebase';
import { lightenColor } from '../../../utils/lightenColor';
import PlayerSearch from './PlayerSearch';
import { getCurrentTurnPlayerId, getNextTurnStateAfterPick, getNextTurnStateAfterSkip } from '../utils/turnOrder';

const DrafterPortal = ({ player, playerId }) => {
  const [draftedPlayer, setDraftedPlayer] = useState('');
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
  const [skippedDrafterIds, setSkippedDrafterIds] = useState([]);
  const [isSkipping, setIsSkipping] = useState(false);

  useEffect(() => {
    if (!playerId) return;

    const unsubscribePlayer = subscribeToPlayer(playerId, (playerData) => {
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

    const unsubscribeSkippedDrafters = subscribeToFifaSkippedDrafters((ids) => {
      setSkippedDrafterIds(ids || []);
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
      if (unsubscribeSkippedDrafters) unsubscribeSkippedDrafters();
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
  const currentTurnPlayerId = getCurrentTurnPlayerId(effectiveDraftOrder, currentTurnIndex, skippedDrafterIds);
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
        const { nextTurnIndex, nextSkippedDrafterIds } = getNextTurnStateAfterPick(
          effectiveDraftOrder,
          currentTurnIndex,
          skippedDrafterIds,
        );
        await submitDraftedPlayer(playerId, draftEntry, nextTurnIndex, nextSkippedDrafterIds);
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

  // Skipping forfeits the current rule, so the next turn (and this drafter, once revisited) needs a fresh spin
  const handleSkip = async () => {
    if (!isMyTurn) return;
    setIsSkipping(true);
    setError(null);

    try {
      const { nextTurnIndex, nextSkippedDrafterIds } = getNextTurnStateAfterSkip(
        effectiveDraftOrder,
        currentTurnIndex,
        skippedDrafterIds,
      );
      setCurrentRule({});
      await skipDraftTurn(nextTurnIndex, nextSkippedDrafterIds);
    }
    catch (err) {
      console.error('Error skipping turn:', err);
      setError('Failed to skip turn. Please try again.');
    }
    finally {
      setIsSkipping(false);
    }
  };

  const handlePlayerSkip = () => {
    const confirmed = window.confirm(
      'This will skip your turn. Are you sure?',
    );
    if (!confirmed) return;

    handleSkip();
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
          className="button"
        >
          {isSubmitting ? 'Sending...' : 'Send'}
        </button>
        {currentCategory !== 'Rating' && (

          <button
            onClick={handlePlayerSkip}
            disabled={isSubmitting || isSkipping}
            className="button maroon"

          >
            {isSkipping ? 'Skipping...' : 'Skip'}
          </button>
        )}
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

  const answerDisplay = (isMyTurn && currentRule.name) ? inputField : waitingDisplay;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }} className="fifa-player-portal">
      <h2>{player}</h2>
      <p className="text-center" style={{ fontWeight: 'bold' }}>
        Round
        {' '}
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
                  {' '}
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
