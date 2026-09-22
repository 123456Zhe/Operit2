"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Screen;
const goal_mode_ipc_js_1 = require("../../shared/goal_mode_ipc.js");
/** Renders the current goal and its state controls above the chat composer. */
function Screen(ctx) {
    const [chatId] = ctx.useState("chatId", "");
    const [goal, setGoal] = ctx.useState("goal", null);
    const [loaded, setLoaded] = ctx.useState("loaded", false);
    /** Refreshes the goal snapshot stored by the owning plugin runtime. */
    const refresh = async () => {
        setGoal(await (0, goal_mode_ipc_js_1.readGoalAsync)(chatId));
        setLoaded(true);
    };
    /** Pauses an active goal. */
    const pause = async () => {
        setGoal(await (0, goal_mode_ipc_js_1.setGoalStatusAsync)(chatId, "paused"));
    };
    /** Resumes a paused goal. */
    const resume = async () => {
        setGoal(await (0, goal_mode_ipc_js_1.setGoalStatusAsync)(chatId, "active"));
    };
    /** Removes the current goal. */
    const clear = async () => {
        await (0, goal_mode_ipc_js_1.clearGoalAsync)(chatId);
        setGoal(null);
    };
    if (loaded && goal === null) {
        return ctx.UI.Column({ fillMaxWidth: true, onLoad: refresh }, []);
    }
    const active = goal?.status === "active";
    const paused = goal?.status === "paused";
    return ctx.UI.Column({ fillMaxWidth: true, padding: { horizontal: 12, vertical: 4 }, onLoad: refresh }, goal === null
        ? []
        : [
            ctx.UI.Card({
                fillMaxWidth: true,
                containerColor: active ? "secondaryContainer" : "surfaceVariant",
                shape: { cornerRadius: 8 },
                elevation: 0,
            }, [
                ctx.UI.Row({ fillMaxWidth: true, padding: { horizontal: 12, vertical: 8 }, spacing: 8, verticalAlignment: "center" }, [
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
                ]),
            ]),
        ]);
}
