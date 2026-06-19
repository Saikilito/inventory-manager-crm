import { describe, it, expect } from "vitest";
import { parseConfig } from "../index.js";

describe("Environment Variables Config Parser", () => {
  it("should parse and return default values when environment variables are empty", () => {
    const config = parseConfig({});
    expect(config.PORT).toBe(4555);
    expect(config.database).toBe("mongodb://localhost:27017/CRM-Apollo");
    expect(config.secret).toBe("JWT_SECRET_DEFAULT");
    expect(config.corsOrigin).toBe("http://localhost:3000");
  });

  it("should successfully parse valid custom environment variables", () => {
    const customEnv = {
      PORT: "8080",
      MONGODB_URI: "mongodb://saikilo:pass@remote:27017/prod",
      JWT_SECRET: "CUSTOM_SECURE_TOKEN_123",
      CLIENT_URL: "https://saikilo.com",
    };

    const config = parseConfig(customEnv);
    expect(config.PORT).toBe(8080);
    expect(config.database).toBe(customEnv.MONGODB_URI);
    expect(config.secret).toBe(customEnv.JWT_SECRET);
    expect(config.corsOrigin).toBe(customEnv.CLIENT_URL);
  });

  it("should throw an error if PORT is not a positive integer", () => {
    const invalidEnv = {
      PORT: "-10",
    };

    expect(() => parseConfig(invalidEnv)).toThrow(
      "Invalid environment variables configuration",
    );
  });

  it("should throw an error if a required field is empty", () => {
    // If we override MONGODB_URI to be empty string, Zod min(1) validation should fail
    const invalidEnv = {
      MONGODB_URI: "",
    };

    expect(() => parseConfig(invalidEnv)).toThrow(
      "Invalid environment variables configuration",
    );
  });
});
