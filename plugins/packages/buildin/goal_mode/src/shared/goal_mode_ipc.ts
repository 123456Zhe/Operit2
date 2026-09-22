import {
  clearGoal,
  readGoal,
  readSingleActiveChatView,
  removeTrackedChatView,
  setGoal,
  setGoalStatus,
  upsertTrackedChatView,
  type GoalRecord,
  type GoalStatus,
  type GoalTrackedChatView,
} from "./goal_mode_state.js";

export const GOAL_MODE_READ_GOAL_CHANNEL = "goal_mode.read_goal";
export const GOAL_MODE_SET_GOAL_CHANNEL = "goal_mode.set_goal";
export const GOAL_MODE_SET_STATUS_CHANNEL = "goal_mode.set_status";
export const GOAL_MODE_CLEAR_GOAL_CHANNEL = "goal_mode.clear_goal";
export const GOAL_MODE_ACTIVE_VIEW_CHANNEL = "goal_mode.active_view";
export const GOAL_MODE_TRACK_VIEW_CHANNEL = "goal_mode.track_view";
export const GOAL_MODE_REMOVE_VIEW_CHANNEL = "goal_mode.remove_view";

/** Registers the shared goal-state IPC endpoints in the owning plugin runtime. */
export function registerGoalModeIpc(): void {
  ToolPkg.ipc.on<string, GoalRecord | null>(GOAL_MODE_READ_GOAL_CHANNEL, readGoal);
  ToolPkg.ipc.on<{ chatId: string; objective: string }, GoalRecord>(
    GOAL_MODE_SET_GOAL_CHANNEL,
    (request) => setGoal(request.chatId, request.objective)
  );
  ToolPkg.ipc.on<{ chatId: string; status: GoalStatus }, GoalRecord | null>(
    GOAL_MODE_SET_STATUS_CHANNEL,
    (request) => setGoalStatus(request.chatId, request.status)
  );
  ToolPkg.ipc.on<string, void>(GOAL_MODE_CLEAR_GOAL_CHANNEL, clearGoal);
  ToolPkg.ipc.on<void, GoalTrackedChatView | null>(
    GOAL_MODE_ACTIVE_VIEW_CHANNEL,
    readSingleActiveChatView
  );
  ToolPkg.ipc.on<GoalTrackedChatView, void>(GOAL_MODE_TRACK_VIEW_CHANNEL, upsertTrackedChatView);
  ToolPkg.ipc.on<{ runtime: string; viewId: string }, void>(
    GOAL_MODE_REMOVE_VIEW_CHANNEL,
    (request) => removeTrackedChatView(request.runtime, request.viewId)
  );
}

/** Reads one chat goal through the owning runtime. */
export async function readGoalAsync(chatId: string): Promise<GoalRecord | null> {
  return await ToolPkg.ipc.call<string, GoalRecord | null>(GOAL_MODE_READ_GOAL_CHANNEL, chatId);
}

/** Stores one active chat goal through the owning runtime. */
export async function setGoalAsync(chatId: string, objective: string): Promise<GoalRecord> {
  return await ToolPkg.ipc.call<{ chatId: string; objective: string }, GoalRecord>(
    GOAL_MODE_SET_GOAL_CHANNEL,
    { chatId, objective }
  );
}

/** Updates one chat goal status through the owning runtime. */
export async function setGoalStatusAsync(chatId: string, status: GoalStatus): Promise<GoalRecord | null> {
  return await ToolPkg.ipc.call<{ chatId: string; status: GoalStatus }, GoalRecord | null>(
    GOAL_MODE_SET_STATUS_CHANNEL,
    { chatId, status }
  );
}

/** Clears one chat goal through the owning runtime. */
export async function clearGoalAsync(chatId: string): Promise<void> {
  await ToolPkg.ipc.call<string, void>(GOAL_MODE_CLEAR_GOAL_CHANNEL, chatId);
}

/** Reads the active chat view through the owning runtime. */
export async function readSingleActiveChatViewAsync(): Promise<GoalTrackedChatView | null> {
  return await ToolPkg.ipc.call<void, GoalTrackedChatView | null>(GOAL_MODE_ACTIVE_VIEW_CHANNEL);
}

/** Tracks a chat view through the owning runtime. */
export async function upsertTrackedChatViewAsync(view: GoalTrackedChatView): Promise<void> {
  await ToolPkg.ipc.call<GoalTrackedChatView, void>(GOAL_MODE_TRACK_VIEW_CHANNEL, view);
}

/** Removes a closed chat view through the owning runtime. */
export async function removeTrackedChatViewAsync(runtime: string, viewId: string): Promise<void> {
  await ToolPkg.ipc.call<{ runtime: string; viewId: string }, void>(GOAL_MODE_REMOVE_VIEW_CHANNEL, { runtime, viewId });
}
