/* eslint-disable react/prop-types */
import React from 'react';
import { deleteFifaPlayer } from '../../../utils/fifaFirebase';

const AdminDrafterTable = ({
  drafter = {},
  index,
  currentTurnIndex,
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
      <h4 className={index === currentTurnIndex ? 'fifa-draft-order-active' : ''}>{drafter.name}</h4>
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

          return (
            <li
              key={`${player.name}-${pickIndex}`}
              className={isDuplicate ? 'fifa-draft-duplicate-pick' : ''}
            >
              <span className="font-bold">{player.name}</span>
              {' '}
              (
              {player.currentCategory}
              :
              {' '}
              {player.currentRule}
              )
              {editDrafter && !isEditing && (
                <button
                  className="fifa-draft-edit-pick-btn"
                  onClick={() => onStartEditPick(pickIndex)}
                  aria-label="Edit pick"
                  title="Edit pick"
                >
                  ✏️
                </button>
              )}
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
