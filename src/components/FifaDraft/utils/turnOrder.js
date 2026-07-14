// Turn order works in two passes through a round: first everyone in effectiveDraftOrder
// goes once (currentTurnIndex counts up through it); a skip during this pass still advances
// currentTurnIndex but queues the skipped drafter in skippedDrafterIds. Once currentTurnIndex
// reaches the end of effectiveDraftOrder, the front of skippedDrafterIds becomes the active
// turn; skipping during this second pass rotates that drafter to the back of the same queue.

export const getCurrentTurnPlayerId = (effectiveDraftOrder, currentTurnIndex, skippedDrafterIds) => {
  if (currentTurnIndex < effectiveDraftOrder.length) {
    return effectiveDraftOrder[currentTurnIndex];
  }
  return skippedDrafterIds[0];
};

export const isDraftRoundComplete = (effectiveDraftOrder, currentTurnIndex, skippedDrafterIds) => (
  currentTurnIndex >= effectiveDraftOrder.length && skippedDrafterIds.length === 0
);

export const getNextTurnStateAfterPick = (effectiveDraftOrder, currentTurnIndex, skippedDrafterIds) => {
  if (currentTurnIndex < effectiveDraftOrder.length) {
    return { nextTurnIndex: currentTurnIndex + 1, nextSkippedDrafterIds: skippedDrafterIds };
  }
  return { nextTurnIndex: currentTurnIndex, nextSkippedDrafterIds: skippedDrafterIds.slice(1) };
};

export const getNextTurnStateAfterSkip = (effectiveDraftOrder, currentTurnIndex, skippedDrafterIds) => {
  if (currentTurnIndex < effectiveDraftOrder.length) {
    const skippedId = effectiveDraftOrder[currentTurnIndex];
    return { nextTurnIndex: currentTurnIndex + 1, nextSkippedDrafterIds: [...skippedDrafterIds, skippedId] };
  }
  const [skippedId, ...rest] = skippedDrafterIds;
  return { nextTurnIndex: currentTurnIndex, nextSkippedDrafterIds: [...rest, skippedId] };
};
