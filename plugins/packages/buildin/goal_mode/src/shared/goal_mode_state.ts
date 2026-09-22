export type GoalStatus = "active" | "paused" | "completed";

export type GoalRecord = {
  objective: string;
  status: GoalStatus;
  updatedAt: number;
};

export type GoalTrackedChatView = {
  viewId: string;
  runtime: string;
  chatId: string;
  updatedAt: number;
};

const goalsByChatId: Record<string, GoalRecord> = {};
const trackedViewsByChatId: Record<string, GoalTrackedChatView> = {};

/** Returns an isolated copy of one goal record. */
function cloneGoal(goal: GoalRecord): GoalRecord {
  return { objective: goal.objective, status: goal.status, updatedAt: goal.updatedAt };
}

/** Returns an isolated copy of one tracked chat view. */
function cloneTrackedView(view: GoalTrackedChatView): GoalTrackedChatView {
  return { viewId: view.viewId, runtime: view.runtime, chatId: view.chatId, updatedAt: view.updatedAt };
}

/** Reads the goal associated with a chat. */
export function readGoal(chatId: string): GoalRecord | null {
  const goal = goalsByChatId[chatId];
  return goal ? cloneGoal(goal) : null;
}

/** Stores one active goal for a chat. */
export function setGoal(chatId: string, objective: string): GoalRecord {
  const goal = { objective, status: "active" as const, updatedAt: Date.now() };
  goalsByChatId[chatId] = goal;
  return cloneGoal(goal);
}

/** Changes the status of an existing goal. */
export function setGoalStatus(chatId: string, status: GoalStatus): GoalRecord | null {
  const goal = goalsByChatId[chatId];
  if (!goal) {
    return null;
  }
  goal.status = status;
  goal.updatedAt = Date.now();
  return cloneGoal(goal);
}

/** Removes a goal from a chat. */
export function clearGoal(chatId: string): void {
  delete goalsByChatId[chatId];
}

/** Records the currently active chat view. */
export function upsertTrackedChatView(view: GoalTrackedChatView): void {
  trackedViewsByChatId[view.chatId] = cloneTrackedView(view);
}

/** Removes a closed chat view by its host identity. */
export function removeTrackedChatView(runtime: string, viewId: string): void {
  Object.entries(trackedViewsByChatId).forEach(([chatId, view]) => {
    if (view.runtime === runtime && view.viewId === viewId) {
      delete trackedViewsByChatId[chatId];
    }
  });
}

/** Reads the most recently updated tracked chat view. */
export function readSingleActiveChatView(): GoalTrackedChatView | null {
  const views = Object.values(trackedViewsByChatId);
  if (views.length === 0) {
    return null;
  }
  return cloneTrackedView(
    views.reduce((latest, view) => view.updatedAt > latest.updatedAt ? view : latest)
  );
}
