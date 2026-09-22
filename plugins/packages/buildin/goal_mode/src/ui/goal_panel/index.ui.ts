import type { ComposeDslContext, ComposeNode } from "../../../../../../types/compose-dsl";
import {
  clearGoalAsync,
  readGoalAsync,
  setGoalStatusAsync,
} from "../../shared/goal_mode_ipc.js";
import type { GoalRecord } from "../../shared/goal_mode_state.js";

/** Renders the current goal and its state controls above the chat composer. */
export default function Screen(ctx: ComposeDslContext): ComposeNode {
  const [chatId] = ctx.useState<string>("chatId", "");
  const [goal, setGoal] = ctx.useState<GoalRecord | null>("goal", null);
  const [loaded, setLoaded] = ctx.useState("loaded", false);

  /** Refreshes the goal snapshot stored by the owning plugin runtime. */
  const refresh = async (): Promise<void> => {
    setGoal(await readGoalAsync(chatId));
    setLoaded(true);
  };

  /** Pauses an active goal. */
  const pause = async (): Promise<void> => {
    setGoal(await setGoalStatusAsync(chatId, "paused"));
  };

  /** Resumes a paused goal. */
  const resume = async (): Promise<void> => {
    setGoal(await setGoalStatusAsync(chatId, "active"));
  };

  /** Removes the current goal. */
  const clear = async (): Promise<void> => {
    await clearGoalAsync(chatId);
    setGoal(null);
  };

  if (loaded && goal === null) {
    return ctx.UI.Column({ fillMaxWidth: true, onLoad: refresh }, []);
  }

  const active = goal?.status === "active";
  const paused = goal?.status === "paused";
  return ctx.UI.Column(
    { fillMaxWidth: true, padding: { horizontal: 12, vertical: 4 }, onLoad: refresh },
    goal === null
      ? []
      : [
          ctx.UI.Card(
            {
              fillMaxWidth: true,
              containerColor: active ? "secondaryContainer" : "surfaceVariant",
              shape: { cornerRadius: 8 },
              elevation: 0,
            },
            [
              ctx.UI.Row(
                { fillMaxWidth: true, padding: { horizontal: 12, vertical: 8 }, spacing: 8, verticalAlignment: "center" },
                [
                  ctx.UI.Icon({ name: "flag", tint: active ? "onSecondaryContainer" : "onSurfaceVariant", size: 18 }),
                  ctx.UI.Column({ weight: 1, spacing: 2 }, [
                    ctx.UI.Text({ text: active ? "Task goal" : "Task goal paused", style: "labelLarge" }),
                    ctx.UI.Text({ text: goal.objective, style: "bodySmall" }),
                  ]),
                  active
                    ? ctx.UI.IconButton({ icon: "pause", onClick: pause })
                    : paused
                    ? ctx.UI.IconButton({ icon: "playArrow", onClick: resume })
                    : ctx.UI.Icon({ name: "checkCircle", tint: "primary", size: 18 }),
                  ctx.UI.IconButton({ icon: "close", onClick: clear }),
                ]
              ),
            ]
          ),
        ]
  );
}
