import {
  verifySlackSignature,
  parseEventPayload,
  handleMessageEvent,
} from "./slack";

export interface Env {
  SLACK_BOT_TOKEN: string;
  SLACK_SIGNING_SECRET: string;
  USER_COUNTRY?: string;
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    if (request.method !== "POST") {
      return new Response("Not Found", { status: 404 });
    }

    // Skip Slack retries to avoid duplicate processing
    if (request.headers.get("x-slack-retry-num")) {
      return new Response("ok", { status: 200 });
    }

    // Verify Slack request signature
    const isValid = await verifySlackSignature(request, env.SLACK_SIGNING_SECRET);
    if (!isValid) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.text();
    const payload = parseEventPayload(body);
    if (!payload) {
      return new Response("Bad Request", { status: 400 });
    }

    // Handle Slack URL verification challenge
    if (payload.type === "url_verification") {
      return new Response(JSON.stringify({ challenge: payload.challenge }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle event callbacks
    if (payload.type === "event_callback" && payload.event) {
      if (payload.event.type === "message") {
        ctx.waitUntil(
          handleMessageEvent(payload.event, env.SLACK_BOT_TOKEN, env.USER_COUNTRY),
        );
      }
    }

    return new Response("ok", { status: 200 });
  },
};
