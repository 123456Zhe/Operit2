"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onGoalCommand = onGoalCommand;
exports.onChatViewEvent = onChatViewEvent;
exports.onPromptFinalize = onPromptFinalize;
exports.registerToolPkg = registerToolPkg;
const index_ui_js_1 = __importDefault(require("../ui/goal_panel/index.ui.js"));
const goal_mode_ipc_js_1 = require("../shared/goal_mode_ipc.js");
const GOAL_COMMAND_ID = "goal_mode_command";
const GOAL_COMMAND_NAME = "goal";
const GOAL_SLOT_ID = "goal_mode_above_input";
const MAX_GOAL_OBJECTIVE_LENGTH = 4000;
/** Adds a non-empty supervision instruction to a composed prompt. */
function appendPrompt(base, extra) {
    const normalizedBase = base.trim();
    const normalizedExtra = extra.trim();
    return normalizedBase ? `${normalizedBase}\n\n${normalizedExtra}` : normalizedExtra;
}
/** Builds the model-visible supervision instruction for an active task goal. */
function buildGoalPrompt(objective, useEnglish) {
    if (useEnglish) {
        return [
            "An active task goal is attached to this chat.",
            `Goal: ${objective}`,
            "Keep working toward this goal across turns. Verify the requested result before declaring it complete.",
            "When and only when the goal is actually complete, call `goal_mode_tools:complete_goal` exactly once.",
        ].join("\n");
    }
    return [
        "当前聊天附带一个进行中的任务目标。",
        `目标：${objective}`,
        "你必须跨回合持续推进该目标，在确认结果真正完成前不得宣称完成。",
        "当且仅当目标实际完成时，调用一次 `goal_mode_tools:complete_goal`。",
    ].join("\n");
}
/** Resolves the single chat currently targeted by a slash command. */
async function requireActiveChatView() {
    const view = await (0, goal_mode_ipc_js_1.readSingleActiveChatViewAsync)();
    return view ?? {
        stderr: "No active chat view is available for /goal.",
        json: { ok: false, error: "chat_view_missing" },
    };
}
/** Distinguishes a command error result from a tracked chat view. */
function isCommandResult(value) {
    return "stdout" in value || "stderr" in value;
}
/** Executes Codex-compatible goal state commands for the active chat. */
async function onGoalCommand(event) {
    const args = event.eventPayload.args.map((arg) => arg.trim()).filter((arg) => arg !== "");
    const viewOrResult = await requireActiveChatView();
    if (isCommandResult(viewOrResult)) {
        return viewOrResult;
    }
    const chatId = viewOrResult.chatId;
    if (args.length === 0) {
        const goal = await (0, goal_mode_ipc_js_1.readGoalAsync)(chatId);
        return {
            stdout: goal ? `Goal (${goal.status}): ${goal.objective}` : "No task goal is set.",
            json: { ok: true, chatId, goal },
        };
    }
    const command = args[0].toLowerCase();
    if (command === "clear" && args.length === 1) {
        await (0, goal_mode_ipc_js_1.clearGoalAsync)(chatId);
        return { stdout: "Task goal cleared.", json: { ok: true, action: "clear", chatId } };
    }
    if (command === "pause" && args.length === 1) {
        const goal = await (0, goal_mode_ipc_js_1.setGoalStatusAsync)(chatId, "paused");
        return {
            stdout: goal ? "Task goal paused." : "No task goal is set.",
            json: { ok: goal !== null, action: "pause", chatId, goal },
        };
    }
    if (command === "resume" && args.length === 1) {
        const goal = await (0, goal_mode_ipc_js_1.setGoalStatusAsync)(chatId, "active");
        return {
            stdout: goal ? "Task goal resumed." : "No task goal is set.",
            json: { ok: goal !== null, action: "resume", chatId, goal },
        };
    }
    const objective = command === "edit" ? args.slice(1).join(" ") : args.join(" ");
    if (!objective) {
        return { stderr: "Goal objective is required.", json: { ok: false, error: "objective_required" } };
    }
    if (objective.length > MAX_GOAL_OBJECTIVE_LENGTH) {
        return {
            stderr: `Goal objective exceeds ${MAX_GOAL_OBJECTIVE_LENGTH} characters.`,
            json: { ok: false, error: "objective_too_long" },
        };
    }
    const goal = await (0, goal_mode_ipc_js_1.setGoalAsync)(chatId, objective);
    return {
        stdout: command === "edit" ? "Task goal updated." : "Task goal set.",
        json: { ok: true, action: command === "edit" ? "edit" : "set", chatId, goal },
    };
}
/** Tracks the chat view targeted by goal commands and Compose DSL panels. */
async function onChatViewEvent(event) {
    const payload = event.eventPayload;
    const viewId = payload.viewId;
    const chatId = payload.chatId;
    const runtime = payload.runtime;
    if (typeof viewId !== "string" || typeof chatId !== "string" || typeof runtime !== "string") {
        return;
    }
    if (event.eventName === "view_closed") {
        await (0, goal_mode_ipc_js_1.removeTrackedChatViewAsync)(runtime, viewId);
        return;
    }
    await (0, goal_mode_ipc_js_1.upsertTrackedChatViewAsync)({ viewId, chatId, runtime, updatedAt: Date.now() });
}
/** Adds active goal supervision immediately before the model request. */
async function onPromptFinalize(event) {
    const payload = event.eventPayload;
    const stage = payload.stage === undefined ? event.eventName : payload.stage;
    if (stage !== "before_send_to_model" || payload.chatId === undefined || payload.preparedHistory === undefined) {
        return null;
    }
    const goal = await (0, goal_mode_ipc_js_1.readGoalAsync)(payload.chatId);
    if (!goal || goal.status !== "active") {
        return null;
    }
    const instruction = buildGoalPrompt(goal.objective, payload.useEnglish === true);
    const history = payload.preparedHistory.slice();
    const systemIndex = history.findIndex((turn) => turn.kind === "SYSTEM");
    if (systemIndex < 0) {
        history.unshift({ kind: "SYSTEM", content: instruction });
    }
    else {
        history[systemIndex] = {
            ...history[systemIndex],
            content: appendPrompt(history[systemIndex].content, instruction),
        };
    }
    return { preparedHistory: history };
}
(0, goal_mode_ipc_js_1.registerGoalModeIpc)();
/** Registers goal commands, supervision hooks, and the composer panel. */
function registerToolPkg() {
    ToolPkg.registerCoreCommand({
        id: GOAL_COMMAND_ID,
        name: GOAL_COMMAND_NAME,
        title: { zh: "任务目标", en: "Task Goal" },
        description: { zh: "设置、查看、暂停、恢复、编辑或清除当前聊天的任务目标。", en: "Set, view, pause, resume, edit, or clear the current chat task goal." },
        usage: "/goal [objective|edit <objective>|pause|resume|clear]",
        function: onGoalCommand,
    });
    ToolPkg.registerChatViewHook({ id: "goal_mode_chat_view", function: onChatViewEvent });
    ToolPkg.registerPromptFinalizeHook({ id: "goal_mode_prompt_finalize", function: onPromptFinalize });
    ToolPkg.registerPromptEstimateFinalizeHook({ id: "goal_mode_prompt_estimate", function: onPromptFinalize });
    ToolPkg.registerChatComposerSlot({
        id: GOAL_SLOT_ID,
        slot: "above_input",
        screen: index_ui_js_1.default,
        order: -100,
        keepAlive: true,
    });
    return true;
}
