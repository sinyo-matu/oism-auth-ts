import { z } from "zod";

export interface LoginRequestResponse {
  redirectUrl: string;
}

export const LoginRequestResponseZ: z.ZodType<LoginRequestResponse> = z.object({
  redirectUrl: z.string(),
});

export interface ExchangeCodeResponse {
  accessToken: string;
  refreshToken: string;
}

export const ExchangeCodeResponseZ: z.ZodType<ExchangeCodeResponse> = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export interface User {
  clientCode: string;
  exId: string;
  imageUrl?: string;
  name: string;
}

const UserZ: z.ZodType<User> = z.object({
  clientCode: z.string(),
  exId: z.string(),
  imageUrl: z.string().optional(),
  name: z.string(),
});

export const GetUserByAccessTokenResponseBodyZ = z.object({
  user: UserZ,
});

export interface RefreshResponseBody {
  accessToken: string;
  refreshToken: string;
}

export const RefreshResponseBodyZ: z.ZodType<RefreshResponseBody> = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export interface RefreshTokenEntity {
  clientName: string;
  clientCode: string;
  userExId: string;
  updatedAt: Date;
}

const RefreshTokenEntityZ: z.ZodType<RefreshTokenEntity> = z.object({
  clientName: z.string(),
  clientCode: z.string(),
  userExId: z.string(),
  updatedAt: z.date(),
});

export const GetRefreshTokenListResponseBodyZ = z.object({
  tokens: z.array(RefreshTokenEntityZ),
});

export interface LoginReturnUserExIdResponse {
  userExId: string;
}

export const LoginReturnUserExIdResponseZ: z.ZodType<LoginReturnUserExIdResponse> =
  z.object({
    userExId: z.string(),
  });
