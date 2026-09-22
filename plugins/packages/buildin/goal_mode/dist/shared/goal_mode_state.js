"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.readGoal = readGoal;
exports.setGoal = setGoal;
exports.setGoalStatus = setGoalStatus;
exports.clearGoal = clearGoal;
exports.upsertTrackedChatView = upsertTrackedChatView;
exports.removeTrackedChatView = removeTrackedChatView;
exports.readSingleActiveChatView = readSingleActiveChatView;
const goalsByChatId = {};
const trackedViewsByChatId = {};
/** Returns an isolated copy of one goal record. */
function cloneGoal(goal) {
    return { objective: goal.objective, status: goal.status, updatedAt: goal.updatedAt };
}
/** Returns an isolated copy of one tracked chat view. */
function cloneTrackedView(view) {
    return { viewId: view.viewId, runtime: view.runtime, chatId: view.chatId, updatedAt: view.updatedAt };
}
/** Reads the goal associated with a chat. */
function readGoal(chatId) {
    const goal = goalsByChatId[chatId];
    return goal ? cloneGoal(goal) : null;
}
/** Stores one active goal for a chat. */
function setGoal(chatId, objective) {
    const goal = { objective, status: "active", updatedAt: Date.now() };
    goalsByChatId[chatId] = goal;
    return cloneGoal(goal);
}
/** Changes the status of an existing goal. */
function setGoalStatus(chatId, status) {
    const goal = goalsByChatId[chatId];
    if (!goal) {
        return null;
    }
    goal.status = status;
    goal.updatedAt = Date.now();
    return cloneGoal(goal);
}
/** Removes a goal from a chat. */
function clearGoal(chatId) {
    delete goalsByChatId[chatId];
}
/** Records the currently active chat view. */
function upsertTrackedChatView(view) {
    trackedViewsByChatId[view.chatId] = cloneTrackedView(view);
}
/** Removes a closed chat view by its host identity. */
function removeTrackedChatView(runtime, viewId) {
    Object.entries(trackedViewsByChatId).forEach(([chatId, view]) => {
        if (view.runtime === runtime && view.viewId === viewId) {
            delete trackedViewsByChatId[chatId];
        }
    });
}
/** Reads the most recently updated tracked chat view. */
function readSingleActiveChatView() {
    const views = Object.values(trackedViewsByChatId);
    if (views.length === 0) {
        return null;
    }
    return cloneTrackedView(views.reduce((latest, view) => view.updatedAt > latest.updatedAt ? view : latest));
}
