"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GOAL_MODE_REMOVE_VIEW_CHANNEL = exports.GOAL_MODE_TRACK_VIEW_CHANNEL = exports.GOAL_MODE_ACTIVE_VIEW_CHANNEL = exports.GOAL_MODE_CLEAR_GOAL_CHANNEL = exports.GOAL_MODE_SET_STATUS_CHANNEL = exports.GOAL_MODE_SET_GOAL_CHANNEL = exports.GOAL_MODE_READ_GOAL_CHANNEL = void 0;
exports.registerGoalModeIpc = registerGoalModeIpc;
exports.readGoalAsync = readGoalAsync;
exports.setGoalAsync = setGoalAsync;
exports.setGoalStatusAsync = setGoalStatusAsync;
exports.clearGoalAsync = clearGoalAsync;
exports.readSingleActiveChatViewAsync = readSingleActiveChatViewAsync;
exports.upsertTrackedChatViewAsync = upsertTrackedChatViewAsync;
exports.removeTrackedChatViewAsync = removeTrackedChatViewAsync;
const goal_mode_state_js_1 = require("./goal_mode_state.js");
exports.GOAL_MODE_READ_GOAL_CHANNEL = "goal_mode.read_goal";
exports.GOAL_MODE_SET_GOAL_CHANNEL = "goal_mode.set_goal";
exports.GOAL_MODE_SET_STATUS_CHANNEL = "goal_mode.set_status";
exports.GOAL_MODE_CLEAR_GOAL_CHANNEL = "goal_mode.clear_goal";
exports.GOAL_MODE_ACTIVE_VIEW_CHANNEL = "goal_mode.active_view";
exports.GOAL_MODE_TRACK_VIEW_CHANNEL = "goal_mode.track_view";
exports.GOAL_MODE_REMOVE_VIEW_CHANNEL = "goal_mode.remove_view";
/** Registers the shared goal-state IPC endpoints in the owning plugin runtime. */
function registerGoalModeIpc() {
    ToolPkg.ipc.on(exports.GOAL_MODE_READ_GOAL_CHANNEL, goal_mode_state_js_1.readGoal);
    ToolPkg.ipc.on(exports.GOAL_MODE_SET_GOAL_CHANNEL, (request) => (0, goal_mode_state_js_1.setGoal)(request.chatId, request.objective));
    ToolPkg.ipc.on(exports.GOAL_MODE_SET_STATUS_CHANNEL, (request) => (0, goal_mode_state_js_1.setGoalStatus)(request.chatId, request.status));
    ToolPkg.ipc.on(exports.GOAL_MODE_CLEAR_GOAL_CHANNEL, goal_mode_state_js_1.clearGoal);
    ToolPkg.ipc.on(exports.GOAL_MODE_ACTIVE_VIEW_CHANNEL, goal_mode_state_js_1.readSingleActiveChatView);
    ToolPkg.ipc.on(exports.GOAL_MODE_TRACK_VIEW_CHANNEL, goal_mode_state_js_1.upsertTrackedChatView);
    ToolPkg.ipc.on(exports.GOAL_MODE_REMOVE_VIEW_CHANNEL, (request) => (0, goal_mode_state_js_1.removeTrackedChatView)(request.runtime, request.viewId));
}
/** Reads one chat goal through the owning runtime. */
async function readGoalAsync(chatId) {
    return await ToolPkg.ipc.call(exports.GOAL_MODE_READ_GOAL_CHANNEL, chatId);
}
/** Stores one active chat goal through the owning runtime. */
async function setGoalAsync(chatId, objective) {
    return await ToolPkg.ipc.call(exports.GOAL_MODE_SET_GOAL_CHANNEL, { chatId, objective });
}
/** Updates one chat goal status through the owning runtime. */
async function setGoalStatusAsync(chatId, status) {
    return await ToolPkg.ipc.call(exports.GOAL_MODE_SET_STATUS_CHANNEL, { chatId, status });
}
/** Clears one chat goal through the owning runtime. */
async function clearGoalAsync(chatId) {
    await ToolPkg.ipc.call(exports.GOAL_MODE_CLEAR_GOAL_CHANNEL, chatId);
}
/** Reads the active chat view through the owning runtime. */
async function readSingleActiveChatViewAsync() {
    return await ToolPkg.ipc.call(exports.GOAL_MODE_ACTIVE_VIEW_CHANNEL);
}
/** Tracks a chat view through the owning runtime. */
async function upsertTrackedChatViewAsync(view) {
    await ToolPkg.ipc.call(exports.GOAL_MODE_TRACK_VIEW_CHANNEL, view);
}
/** Removes a closed chat view through the owning runtime. */
async function removeTrackedChatViewAsync(runtime, viewId) {
    await ToolPkg.ipc.call(exports.GOAL_MODE_REMOVE_VIEW_CHANNEL, { runtime, viewId });
}
