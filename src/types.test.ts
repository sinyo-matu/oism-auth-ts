import { describe, it, expect } from "vitest";
import { GetUserByAccessTokenResponseBodyZ } from "./types";
const input = `{"user":{"clientCode":"ca2a26ef-1c3a-4ef8-a0b3-28edf83ea9d2","exId":"77f2e7a0-ad0f-4042-a0b1-86e1ecb45ced","imageUrl":null,"name":"caicai"}}`;
describe("first", () => {
  it("should be parsed", () => {
    const json = JSON.parse(input);
    const parsed = GetUserByAccessTokenResponseBodyZ.parse(json);
    expect(parsed).toHaveProperty("user");
  });
});
