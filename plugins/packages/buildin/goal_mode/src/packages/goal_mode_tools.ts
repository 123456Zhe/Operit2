/* METADATA
{
  "name": "goal_mode_tools",
  "display_name": { "zh": "目标模式工具", "en": "Goal Mode Tools" },
  "description": { "zh": "在任务实际完成后更新当前目标。", "en": "Updates the current goal after task completion." },
  "enabledByDefault": true,
  "tools": [
    {
      "name": "complete_goal",
      "description": { "zh": "仅在当前任务目标实际完成后调用一次。", "en": "Call exactly once only after the current task goal is actually complete." },
      "parameters": []
    }
  ]
}
*/

import { readGoalAsync, setGoalStatusAsync } from "../shared/goal_mode_ipc.js";

/** Marks the active chat goal complete after the agent has verified the outcome. */
export async function complete_goal(): Promise<void> {
  const chatId = getChatId();
  if (chatId === undefined) {
    complete({ success: false, error: "chatId is unavailable" });
    return;
  }
  const goal = await readGoalAsync(chatId);
  if (!goal || goal.status !== "active") {
    complete({ success: false, error: "No active task goal is available" });
    return;
  }
  await setGoalStatusAsync(chatId, "completed");
  complete({ success: true, objective: goal.objective });
}
