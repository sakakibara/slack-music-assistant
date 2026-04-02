import { describe, it, expect } from "vitest";
import { parseEventPayload } from "./slack";

describe("parseEventPayload", () => {
  it("parses valid JSON payload", () => {
    const payload = parseEventPayload(
      JSON.stringify({ type: "event_callback", event: { type: "message" } }),
    );
    expect(payload).not.toBeNull();
    expect(payload!.type).toBe("event_callback");
  });

  it("parses url_verification challenge", () => {
    const payload = parseEventPayload(
      JSON.stringify({ type: "url_verification", challenge: "abc123" }),
    );
    expect(payload).not.toBeNull();
    expect(payload!.challenge).toBe("abc123");
  });

  it("returns null for invalid JSON", () => {
    const payload = parseEventPayload("not json at all");
    expect(payload).toBeNull();
  });

  it("returns null for empty string", () => {
    const payload = parseEventPayload("");
    expect(payload).toBeNull();
  });

  it("returns null for truncated JSON", () => {
    const payload = parseEventPayload('{"type": "event_call');
    expect(payload).toBeNull();
  });
});
