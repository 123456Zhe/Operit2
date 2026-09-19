import type {
  ComposeDslContext,
  ComposeNode,
} from "../../../../../types/compose-dsl";
import type { Request } from "../service";
import type { Snapshot } from "../model";

/** Embeds the bundled editor and exposes durable workflow operations through the shared host. */
export default function screen(ctx: ComposeDslContext): ComposeNode {
  const controller = ctx.createWebViewController("workflow-web");
  const [path, setPath] = ctx.useState("workflow-html-path", "");
  const [error, setError] = ctx.useState("workflow-html-error", "");
  /** Registers the service boundary before making the local document available. */
  async function initialize(): Promise<void> {
    try {
      controller.addJavascriptInterface("WorkflowHost", {
        /** Writes user-requested exports through the cross-platform file host. */
        exportFile: async (...args: unknown[]) => {
          const [path, content] = args[0] as [string, string];
          await Tools.Files.create(path, content);
        },
        /** Executes one persisted operation and returns its detached snapshot. */
        request: async (...args: unknown[]) => {
          const [request] = args[0] as [Request];
          return ToolPkg.ipc.call<Request, Snapshot>("workflow.web", request, {
            targetRuntime: "main",
          });
        },
      });
      setPath(await ToolPkg.readResource("workflow_web", "workflow.html"));
    } catch (failure) {
      setError(String(failure));
    }
  }
  return ctx.UI.Box(
    { fillMaxSize: true, onLoad: initialize },
    path === ""
      ? ctx.UI.Text({ text: error || "正在加载工作流…" })
      : ctx.UI.WebView({
          key: "workflow-web",
          controller,
          fillMaxSize: true,
          url: "https://workflow.operit.local/",
          javaScriptEnabled: true,
          domStorageEnabled: true,
          supportZoom: false,
          useWideViewPort: true,
          onShouldOverrideUrlLoading: (request) =>
            request.url === "https://workflow.operit.local/"
              ? { action: "allow" }
              : { action: "cancel" },
          onInterceptRequest: (request) =>
            request.url === "https://workflow.operit.local/"
              ? {
                  action: "respond",
                  response: {
                    mimeType: "text/html",
                    encoding: "utf-8",
                    statusCode: 200,
                    reasonPhrase: "OK",
                    filePath: path,
                  },
                }
              : { action: "block" },
        }),
  );
}
