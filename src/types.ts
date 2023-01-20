import { z } from "zod";
export const LoginRequestResponse = z.object({
  redirectUrl: z.string(),
});

export type LoginRequestResponse = z.infer<typeof LoginRequestResponse>;

export const ExchangeCodeResponse = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type ExchangeCodeResponse = z.infer<typeof ExchangeCodeResponse>;

const User = z.object({
  clientCode: z.string(),
  exId: z.string(),
  imageUrl: z.string().optional(),
  name: z.string(),
});

export type User = z.infer<typeof User>;

export const GetUserByAccessTokenResponseBody = z.object({
  user: User,
});

export const RefreshResponseBody = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type RefreshResponse = z.infer<typeof RefreshResponseBody>;

const RefreshTokenEntity = z.object({
  clientName: z.string(),
  clientCode: z.string(),
  userExId: z.string(),
  updatedAt: z.date(),
});

export type RefreshTokenEntity = z.infer<typeof RefreshTokenEntity>;

export const GetRefreshTokenListResponseBody = z.object({
  tokens: z.array(RefreshTokenEntity),
});

export const LoginReturnUserExIdResponse = z.object({
  userExId: z.string(),
});

export type LoginReturnUserExIdResponse = z.infer<
  typeof LoginReturnUserExIdResponse
>;
