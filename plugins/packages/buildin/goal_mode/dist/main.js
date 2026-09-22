"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerToolPkg = exports.onPromptFinalize = exports.onGoalCommand = exports.onChatViewEvent = void 0;
var goal_mode_plugin_js_1 = require("./plugin/goal_mode_plugin.js");
Object.defineProperty(exports, "onChatViewEvent", { enumerable: true, get: function () { return goal_mode_plugin_js_1.onChatViewEvent; } });
Object.defineProperty(exports, "onGoalCommand", { enumerable: true, get: function () { return goal_mode_plugin_js_1.onGoalCommand; } });
Object.defineProperty(exports, "onPromptFinalize", { enumerable: true, get: function () { return goal_mode_plugin_js_1.onPromptFinalize; } });
Object.defineProperty(exports, "registerToolPkg", { enumerable: true, get: function () { return goal_mode_plugin_js_1.registerToolPkg; } });
