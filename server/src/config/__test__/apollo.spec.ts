import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { context } from "../apollo-context.js";
import { makeContainer } from "../container.js";
import { Result } from "../../../../shared-domain/src/shared/result.js";
import {
  IProduct,
  makeProduct,
} from "../../../../shared-domain/src/product/product.entity.js";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

const mockProduct = makeProduct({
  id: VALID_UUID,
  name: "Premium Saikilo Coffee",
  price: 12.99,
  stock: 45,
});

describe("Apollo Context Integration", () => {
  it("should build a context containing the container, models, and token function", async () => {
    const mockReq = {
      headers: {
        authorization: "",
      },
    };

    const ctx = await context({ req: mockReq as any });
    expect(ctx.container).toBeDefined();
    expect(ctx.models).toBeDefined();
    expect(ctx.token).toBeTypeOf("function");
  });

  it("should use the provided container override", async () => {
    const mockReq = { headers: {} };
    const mockRepository = {
      getById: async (id: string) =>
        Result.ok<IProduct | null, any>(mockProduct),
    };
    const customContainer = makeContainer({
      productRepository: mockRepository as any,
    });

    const ctx = await context({ req: mockReq as any }, customContainer);
    const result = await ctx.container.product.getProduct(VALID_UUID);
    expect(result.isFailure).toBe(false);
    expect(result.getValue().name).toBe("Premium Saikilo Coffee");
  });

  it("should verify a valid token and attach the user to req.actualUser", async () => {
    const payload = { id: "user_123", email: "test@example.com" };
    const secret = process.env.JWT_SECRET || "JWT_SECRET_DEFAULT";
    const token = jwt.sign(payload, secret);

    const mockReq = {
      headers: {
        authorization: token,
      },
      actualUser: undefined as any,
    };

    const ctx = await context({ req: mockReq as any });
    const user = (await ctx.token()) as any;

    expect(user).toBeDefined();
    expect(user.id).toBe(payload.id);
    expect(mockReq.actualUser).toBeDefined();
    expect(mockReq.actualUser.id).toBe(payload.id);
  });

  it("should return null for an invalid token", async () => {
    const mockReq = {
      headers: {
        authorization: "invalid-token-string",
      },
    };

    const ctx = await context({ req: mockReq as any });
    const user = await ctx.token();
    expect(user).toBeNull();
  });

  it('should return null when token is empty or "null"', async () => {
    const mockReq = {
      headers: {
        authorization: "null",
      },
    };

    const ctx = await context({ req: mockReq as any });
    const user = await ctx.token();
    expect(user).toBeNull();
  });
});
