export const openApiDocument = {
  openapi: "3.1.0",
  info: { title: "CodeMuscle API", version: "1.0.0", description: "Manual coding practice platform API" },
  servers: [{ url: "/api/v1" }],
  paths: {
    "/health": { get: { summary: "Liveness", responses: { "200": { description: "Healthy" } } } },
    "/ready": { get: { summary: "Readiness", responses: { "200": { description: "Ready" } } } },
    "/profile": {
      get: { summary: "Get local profile", responses: { "200": { description: "Profile" } } },
      patch: { summary: "Update profile", responses: { "200": { description: "Updated" } } }
    },
    "/settings": {
      get: { summary: "Get settings", responses: { "200": { description: "Settings" } } },
      patch: { summary: "Update settings", responses: { "200": { description: "Updated" } } }
    },
    "/languages": { get: { summary: "List languages", responses: { "200": { description: "Languages" } } } },
    "/projects": { get: { summary: "List projects", responses: { "200": { description: "Projects" } } } },
    "/projects/{projectId}": { get: { summary: "Get project", responses: { "200": { description: "Project" } } } },
    "/projects/{projectId}/tree": { get: { summary: "Project file tree", responses: { "200": { description: "Tree" } } } },
    "/projects/{projectId}/files": { get: { summary: "Project files", responses: { "200": { description: "Files" } } } },
    "/files/{fileId}": { get: { summary: "Get training file", responses: { "200": { description: "File" } } } },
    "/sessions": { post: { summary: "Start session", responses: { "201": { description: "Created" } } } },
    "/sessions/{sessionId}": {
      get: { summary: "Get session", responses: { "200": { description: "Session" } } },
      patch: { summary: "Patch session", responses: { "200": { description: "Updated" } } }
    },
    "/sessions/{sessionId}/pause": { post: { summary: "Pause session", responses: { "200": { description: "Paused" } } } },
    "/sessions/{sessionId}/resume": { post: { summary: "Resume session", responses: { "200": { description: "Resumed" } } } },
    "/sessions/{sessionId}/restart": { post: { summary: "Restart session", responses: { "201": { description: "Restarted" } } } },
    "/sessions/{sessionId}/finish": { post: { summary: "Finish session", responses: { "200": { description: "Finished" } } } },
    "/sessions/{sessionId}/draft": {
      put: { summary: "Autosave draft", responses: { "200": { description: "Saved" } } },
      get: { summary: "Get draft", responses: { "200": { description: "Draft" } } }
    },
    "/sessions/{sessionId}/metrics": { post: { summary: "Calculate metrics", responses: { "200": { description: "Metrics" } } } },
    "/dashboard/summary": { get: { summary: "Dashboard summary", responses: { "200": { description: "Summary" } } } },
    "/dashboard/timeseries": { get: { summary: "Daily timeseries", responses: { "200": { description: "Series" } } } },
    "/dashboard/topics": { get: { summary: "Topic performance", responses: { "200": { description: "Topics" } } } },
    "/dashboard/recent-sessions": { get: { summary: "Recent sessions", responses: { "200": { description: "Sessions" } } } },
    "/dashboard/personal-bests": { get: { summary: "Personal bests", responses: { "200": { description: "Bests" } } } },
    "/recommendations/daily": { get: { summary: "Daily practice queue", responses: { "200": { description: "Recommendations" } } } },
    "/files/{fileId}/repeat": {
      post: { summary: "Mark file for repetition", responses: { "201": { description: "Marked" } } },
      delete: { summary: "Unmark repetition", responses: { "204": { description: "Removed" } } }
    },
    "/achievements": { get: { summary: "All achievements", responses: { "200": { description: "Achievements" } } } },
    "/achievements/unlocked": { get: { summary: "Unlocked achievements", responses: { "200": { description: "Unlocked" } } } }
  }
} as const;
