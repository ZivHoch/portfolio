import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ChatService } from "./chatService";

describe("ChatService", () => {
  // Mock fetch globally
  global.fetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("sendMessage", () => {
    it("sends a message to the API with correct parameters", async () => {
      const mockResponse = new Response(JSON.stringify({ success: true }));
      global.fetch.mockResolvedValue(mockResponse);

      const chatRequest = {
        sessionId: "test-session-id",
        timestamp: Date.now() / 1000, // ✅ required field
        messages: [
          { role: "user", content: "Test message" },
          { role: "assistant", content: "Test response" },
        ],
      };

      const result = await ChatService.sendMessage(chatRequest);

      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/chat"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: "test-session-id",
          timestamp: chatRequest.timestamp,
          messages: [
            { role: "user", content: "Test message" },
            { role: "assistant", content: "Test response" },
          ],
        }),
      });

      expect(result).toBe(mockResponse);
    });

    it("handles network errors", async () => {
      global.fetch.mockRejectedValue(new Error("Network error"));

      const chatRequest = {
        sessionId: "test-session-id",
        timestamp: Date.now() / 1000,
        messages: [{ role: "user", content: "Test message" }],
      };

      await expect(ChatService.sendMessage(chatRequest)).rejects.toThrow("Network error");
    });
  });

  describe("handleStreamingResponse", () => {
    it("processes a streaming response and calls callbacks", async () => {
      const mockReader = {
        read: vi.fn(),
        cancel: vi.fn().mockResolvedValue(undefined),
      };

      mockReader.read
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('0:"Hello"'),
          done: false,
        })
        .mockResolvedValueOnce({
          value: new TextEncoder().encode('0:" World"'),
          done: false,
        })
        .mockResolvedValueOnce({ done: true });

      const mockResponse = {
        body: {
          getReader: () => mockReader,
        },
      };

      const callbacks = {
        onChunk: vi.fn(),
        onComplete: vi.fn(),
        shouldStop: vi.fn().mockReturnValue(false),
      };

      await ChatService.handleStreamingResponse(mockResponse, callbacks);

      expect(mockReader.read).toHaveBeenCalledTimes(3);
      expect(callbacks.onChunk).toHaveBeenCalledTimes(2);
      expect(callbacks.onComplete).toHaveBeenCalledTimes(1);
    });

    it("handles errors during streaming", async () => {
      const mockReader = {
        read: vi.fn().mockRejectedValue(new Error("Stream error")),
        cancel: vi.fn().mockResolvedValue(undefined),
      };

      const mockResponse = {
        body: {
          getReader: () => mockReader,
        },
      };

      const callbacks = {
        onChunk: vi.fn(),
        onComplete: vi.fn(),
        shouldStop: vi.fn().mockReturnValue(false),
      };

      await expect(ChatService.handleStreamingResponse(mockResponse, callbacks)).rejects.toThrow("Error processing response stream");

      expect(callbacks.onComplete).not.toHaveBeenCalled();
    });
  });

  describe("handleError", () => {
    it("handles rate limit errors", async () => {
      const mockResponse = new Response(
        JSON.stringify({
          friendly_message: "You've reached the rate limit. Please wait before sending more messages.",
          retry_after: 10,
        }),
        { status: 429 }
      );

      const result = await ChatService.handleError(mockResponse);

      expect(result).toEqual({
        isRateLimit: true,
        message: "You've reached the rate limit. Please wait before sending more messages.",
        retryAfter: 10,
      });
    });

    it("handles general errors", async () => {
      const mockResponse = new Response(JSON.stringify({ detail: "Server error occurred" }), { status: 500 });

      await expect(ChatService.handleError(mockResponse)).rejects.toThrow("Server error occurred");
    });

    it("handles non-JSON responses", async () => {
      const mockResponse = new Response("Internal Server Error", { status: 500 });

      // Simulate .json() throwing
      mockResponse.json = vi.fn().mockRejectedValue(new SyntaxError("Unexpected token"));

      await expect(ChatService.handleError(mockResponse)).rejects.toThrow("Unexpected token");
    });
  });
});
