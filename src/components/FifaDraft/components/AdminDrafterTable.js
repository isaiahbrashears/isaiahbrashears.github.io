/* eslint-disable react/prop-types */
import React from 'react';
import { deleteFifaPlayer } from '../../../utils/fifaFirebase';
import { catShortenedTerm } from '../utils/catShortenedTerm';

const AdminDrafterTable = ({
  drafter = {},
  isActiveTurn = false,
  editDrafter,
  duplicatePlayerNames = new Set(),
  editingPickIndex = null,
  onStartEditPick,
  onCancelEditPick,
}) => {
  const deleteDrafter = () => {
    deleteFifaPlayer(drafter.id);
  };

  const handlePlayerDelete = () => {
    const confirmed = window.confirm(
      'This will permanently delete this player. Are you sure?',
    );
    if (!confirmed) return;

    deleteDrafter();
  };

  return (
    <div className="admins-drafter-table">
      <h4 className={isActiveTurn ? 'fifa-draft-order-active' : ''}>{drafter.name}</h4>
      {editDrafter && (
        <button onClick={handlePlayerDelete}>
          Remove
          {' '}
          {drafter.name}
        </button>
      )}
      <ol>
        {drafter?.draftedPlayerList.map((player, pickIndex) => {
          const isDuplicate = duplicatePlayerNames.has(player.name?.trim().toLowerCase());
          const isEditing = editingPickIndex === pickIndex;
          const showEditButton = editDrafter && !isEditing;

          return (
            <li
              key={`${player.name}-${pickIndex}`}
              className={[
                isDuplicate ? 'fifa-draft-duplicate-pick' : '',
                showEditButton ? 'fifa-draft-pick-has-edit-btn' : '',
              ].filter(Boolean).join(' ')}
            >
              {showEditButton && (
                <button
                  className="fifa-draft-edit-pick-btn"
                  onClick={() => onStartEditPick(pickIndex)}
                  aria-label="Edit pick"
                  title="Edit pick"
                >
                  ✏️
                </button>
              )}
              <span className="font-bold">{player.name}</span>
              (
              {catShortenedTerm[player.currentCategory]}
              {player.currentRule}
              )

              {isEditing && (
                <span className="fifa-draft-pick-editing-status">
                  {' '}
                  Waiting for
                  {' '}
                  {drafter.name}
                  {' '}
                  to edit...
                  {' '}
                  <button onClick={onCancelEditPick}>Cancel</button>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default AdminDrafterTable;
