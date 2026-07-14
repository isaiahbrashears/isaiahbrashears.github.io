import React, { useState, useEffect } from 'react';
import {
  setFifaCurrentCategory,
  subscribeToFifaCurrentCategory,
  setFifaCurrentRule,
  subscribeToFifaCurrentRule,
  setFifaCurrentRound,
  subscribeToFifaCurrentRound,
  setFifaDraftOrder,
  subscribeToFifaDraftOrder,
  setFifaCurrentTurnIndex,
  subscribeToFifaCurrentTurnIndex,
  subscribeToPlayers,
  resetFifaGame,
  setFifaEditingContext,
  subscribeToFifaEditingContext,
} from '../../../utils/fifaFirebase';
import LeagueWheel from './wheels/LeagueWheel';
import NationalityWheel from './wheels/NationalityWheel';
import NumberWheel from './wheels/NumberWheel';
import RatingWheel from './wheels/RatingWheel';
import CategoryWheel from './wheels/CategoryWheel';

import { lightenColor } from '../../../utils/lightenColor';
import AdminDrafterTable from './AdminDrafterTable';

const AdminDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [draftOrderEditable, setDraftOrderEditable] = useState(false);
  const [adminButtonsVisible, setAdminButtonsVisible] = useState(false);
  const [currentCategory, setCurrentCategory] = useState('Category');
  const [currentRule, setCurrentRule] = useState({});
  const [currentRound, setCurrentRound] = useState(1);
  const [drafters, setDrafters] = useState([]);
  const [draftOrder, setDraftOrder] = useState([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [editingContext, setEditingContext] = useState(null);

  const wheels = {
    Category: CategoryWheel,
    League: LeagueWheel,
    Nationality: NationalityWheel,
    Number: NumberWheel,
    Rating: RatingWheel,
  };

  const WheelComponent = wheels[currentCategory];

  useEffect(() => {
    const unsubscribeCategory = subscribeToFifaCurrentCategory((category) => {
      if (category) {
        setCurrentCategory(category);
      }
      setIsLoading(false);
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

    const unsubscribeDrafters = subscribeToPlayers((players) => {
      if (players) {
        setDrafters(players);
      }
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

    return () => {
      if (unsubscribeCategory) unsubscribeCategory();
      if (unsubscribeRule) unsubscribeRule();
      if (unsubscribeRound) unsubscribeRound();
      if (unsubscribeDrafters) unsubscribeDrafters();
      if (unsubscribeDraftOrder) unsubscribeDraftOrder();
      if (unsubscribeTurnIndex) unsubscribeTurnIndex();
      if (unsubscribeEditingContext) unsubscribeEditingContext();
    };
  }, []);

  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
    setFifaCurrentCategory(category).catch((err) => {
      console.error('Error saving category:', err);
    });
  };

  const handleRuleChange = (rule) => {
    setCurrentRule(rule);
    setFifaCurrentRule(rule).catch((err) => {
      console.error('Error saving rule:', err);
    });
  };

  // Unlocks a specific pick so its drafter (and only that drafter) can correct its name
  const handleStartEditPick = (drafter, pickIndex) => {
    const pick = drafter.draftedPlayerList?.[pickIndex];
    if (!pick) return;

    handleCategoryChange(pick.currentCategory);
    handleRuleChange({ name: pick.currentRule, shortName: pick.currentRule });
    setFifaEditingContext({
      drafterId: drafter.id,
      pickIndex,
      previousCategory: currentCategory,
      previousRule: currentRule,
    }).catch((err) => {
      console.error('Error starting pick edit:', err);
    });
  };

  const handleCancelEditPick = () => {
    if (editingContext) {
      handleCategoryChange(editingContext.previousCategory);
      handleRuleChange(editingContext.previousRule);
    }
    setFifaEditingContext(null).catch((err) => {
      console.error('Error cancelling pick edit:', err);
    });
  };

  const handleResetCategory = () => {
    setCurrentRule({});
    setFifaCurrentRule({}).catch((err) => {
      console.error('Error saving rule:', err);
    });
    handleCategoryChange('Category');
  };

  const handleNextRound = () => {
    const nextRound = Math.min(currentRound + 1, 15);
    setCurrentRound(nextRound);
    setFifaCurrentRound(nextRound).catch((err) => {
      console.error('Error saving round:', err);
    });
    setCurrentTurnIndex(0);
    setFifaCurrentTurnIndex(0).catch((err) => {
      console.error('Error resetting turn:', err);
    });
  };

  // Names drafted more than once across all drafters (e.g. free-text typos/duplicate picks)
  const duplicatePlayerNames = (() => {
    const counts = {};
    drafters.forEach((drafter) => {
      (drafter.draftedPlayerList || []).forEach((pick) => {
        const key = pick.name?.trim().toLowerCase();
        if (!key) return;
        counts[key] = (counts[key] || 0) + 1;
      });
    });
    return new Set(Object.keys(counts).filter(key => counts[key] > 1));
  })();

  // If no draft order has been explicitly set, default to the current player order
  const effectiveDraftOrder = draftOrder.length > 0 ? draftOrder : drafters.map(drafter => drafter.id);

  const orderedDrafters = [
    ...effectiveDraftOrder.map(id => drafters.find(drafter => drafter.id === id)).filter(Boolean),
    ...drafters.filter(drafter => !effectiveDraftOrder.includes(drafter.id)),
  ];

  const moveDraftOrderEntry = (index, direction) => {
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= effectiveDraftOrder.length) return;

    const newOrder = [...effectiveDraftOrder];
    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
    setDraftOrder(newOrder);
    setFifaDraftOrder(newOrder).catch((err) => {
      console.error('Error saving draft order:', err);
    });
  };

  const handlePrevRound = () => {
    const nextRound = Math.min(currentRound - 1, 15);
    setCurrentRound(nextRound);
    setFifaCurrentRound(nextRound).catch((err) => {
      console.error('Error saving round:', err);
    });
  };

  const handleFullReset = () => {
    const confirmed = window.confirm(
      'This will permanently delete all players and reset the entire draft. Are you sure?',
    );
    if (!confirmed) return;

    resetFifaGame().catch((err) => {
      console.error('Error resetting game:', err);
    });
  };

  const completeRound = () => {
    handleNextRound();
    handleResetCategory();
  };
  return (
    <div className="fifa-draft-admin-Dashboard">
      <div className="fifa-draft-wheels">
        <h2 className="text-center">{currentCategory}</h2>
        <div
          className="fifa-draft-rule-display"
          style={currentRule.color
            ? {
                '--rule-color': currentRule.color,
                '--rule-color-light': lightenColor(currentRule.color, 40),
              }
            : undefined}
        >
          {currentRule?.icon}
          {' '}
          {currentRule.name}
          {' '}
          {currentRule?.icon}
        </div>
        {!isLoading
          ? (
              <WheelComponent
                setCurrentCategory={handleCategoryChange}
                setCurrentRule={handleRuleChange}
              />
            )
          : <p className="text-center">Loading...</p>}
      </div>

      <div className="fifa-draft-player-tracking">
        <h1 className="text-center">Admin Portal</h1>
        <h2 className="text-center">
          Round
          {' '}
          {currentRound}
          {' '}
          / 15
        </h2>
        <button
          className="new-category-btn button passed-color m-auto"
          style={{
            '--button-color': '#117996',
            '--button-text-color': 'white',
          }}
          onClick={completeRound}
        >
          Complete Round
        </button>
        <div className="fifa-drafters-container">
          {orderedDrafters.map((drafter, index) => {
            return (
              <AdminDrafterTable
                key={drafter.id}
                drafter={drafter}
                currentTurnIndex={currentTurnIndex}
                editDrafter={adminButtonsVisible}
                index={index}
                duplicatePlayerNames={duplicatePlayerNames}
                editingPickIndex={editingContext?.drafterId === drafter.id ? editingContext.pickIndex : null}
                onStartEditPick={pickIndex => handleStartEditPick(drafter, pickIndex)}
                onCancelEditPick={handleCancelEditPick}
              />
            );
          })}
        </div>

        <div className="my-8">
          <button
            className="new-category-btn button passed-color m-auto"
            style={{
              '--button-color': '#ffdf00',
              '--button-text-color': 'black',
            }}
            onClick={() => setAdminButtonsVisible(!adminButtonsVisible)}
          >
            {!adminButtonsVisible ? 'Admin Functions' : 'Hide Admin Functions'}
          </button>
        </div>
        {adminButtonsVisible && (
          <div className="fifa-admin-buttons">
            <div className="flex mb-4">
              <button
                className="new-category-btn button passed-color m-auto w-full"
                disabled={currentRound <= 1}
                style={{
                  '--button-color': '#6f1515',
                  '--button-text-color': 'white',
                }}
                onClick={() => handlePrevRound()}
              >
                Prev Round
              </button>
              <span className="px-2"></span>
              <button
                className="new-category-btn button passed-color m-auto w-full"
                disabled={currentRound >= 15}
                style={{
                  '--button-color': '#2980b9',
                  '--button-text-color': 'white',
                }}
                onClick={() => handleNextRound()}
              >
                Next Round
              </button>
            </div>
            <button
              className="new-category-btn button passed-color m-auto w-full"
              style={{
                '--button-color': '#016600',
                '--button-text-color': 'white',
              }}
              onClick={() => handleResetCategory()}
            >
              Reset Category
            </button>

            <div className="fifa-draft-order mt-4">
              <button
                className="new-category-btn button passed-color m-auto w-full"
                style={{
                  '--button-color': '#010000',
                  '--button-text-color': 'white',
                }}
                onClick={() => setDraftOrderEditable(!draftOrderEditable)}
              >
                Edit Draft Order
              </button>
              {draftOrderEditable && (
                <ol className="fifa-draft-order-list">
                  <h3>Draft Order</h3>

                  {effectiveDraftOrder.map((id, index) => {
                    const drafter = drafters.find(d => d.id === id);
                    return (
                      <li
                        key={id}
                        className={index === currentTurnIndex ? 'fifa-draft-order-active' : ''}
                      >
                        {drafter?.name || id}
                        <button
                          onClick={() => moveDraftOrderEntry(index, -1)}
                          disabled={index === 0}
                          className="ml-auto"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveDraftOrderEntry(index, 1)}
                          disabled={index === effectiveDraftOrder.length - 1}
                        >
                          ↓
                        </button>
                      </li>
                    );
                  })}
                </ol>
              )}
              <button
                className="new-category-btn button passed-color m-auto w-full mt-4"
                style={{
                  '--button-color': '#8b0000',
                  '--button-text-color': 'white',
                }}
                onClick={() => handleFullReset()}
              >
                Full Reset (Delete All Players)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
