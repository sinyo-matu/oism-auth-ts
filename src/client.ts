import { z } from "zod";
import { OismAuthError } from "./error";
import {
  ClientCodeZ,
  ExchangeCodeResponseZ,
  GetRefreshTokenListResponseBodyZ,
  GetUserByAccessTokenResponseBodyZ,
  LoginRequestResponseZ,
  LoginReturnUserExIdResponseZ,
  RefreshResponseBodyZ,
  Tokens,
} from "./types";

export class AuthClient {
  #hostBaseUrl: string;
  #clientCode: string;

  constructor(hostBaseUrl: string, clientCode: string) {
    this.#hostBaseUrl = hostBaseUrl;
    this.#clientCode = ClientCodeZ.parse(clientCode);
  }

  getLoginUrl() {
    return `${this.#hostBaseUrl}/login?client_code=${this.#clientCode}`;
  }

  async login(username: string, password: string) {
    const data = { username, password, clientCode: this.#clientCode };
    const res = await this.wrappedPost(
      `${this.#hostBaseUrl}/api/v1/auth/login`,
      JSON.stringify(data)
    );
    if (res.status === 404 || res.status === 401) {
      throw new OismAuthError.InvalidLoginInfo();
    }
    this.checkRestStatus(res);
    return this.jsonParse(res, LoginRequestResponseZ);
  }

  async loginReturnUserExId(username: string, password: string) {
    const data = { username, password };
    const res = await this.wrappedPost(
      `${this.#hostBaseUrl}/api/v1/auth/login_return_user_ex_id`,
      JSON.stringify(data)
    );
    if (res.status === 404 || res.status === 401) {
      throw new OismAuthError.InvalidLoginInfo();
    }
    this.checkRestStatus(res);
    return this.jsonParse(res, LoginReturnUserExIdResponseZ);
  }

  async exchangeCode(code: string) {
    const data = { code, clientCode: this.#clientCode };
    const res = await this.wrappedPost(
      `${this.#hostBaseUrl}/api/v1/auth/exchange_code`,
      JSON.stringify(data)
    );
    if (
      res.status === 400 &&
      (await res.clone().text()) === "Exchange code expired"
    ) {
      throw new OismAuthError.ExpiredCode();
    }
    this.checkRestStatus(res);
    return this.jsonParse(res, ExchangeCodeResponseZ);
  }

  async getUser(accessToken: string) {
    const res = await this.wrappedAuthGet(
      `${this.#hostBaseUrl}/api/v1/user/by_access_token`,
      accessToken
    );
    if (res.status === 401) {
      const m = await res.clone().text();
      if (m === "Expired access token") {
        throw new OismAuthError.ExpiredAccessToken();
      }
      if (m === "Invalid token") {
        throw new OismAuthError.InvalidToken();
      }
    }
    this.checkRestStatus(res);
    return (await this.jsonParse(res, GetUserByAccessTokenResponseBodyZ)).user;
  }

  async getTokenList(accessToken: string) {
    const data = { clientCode: this.#clientCode };
    const res = await this.wrappedAuthPost(
      `${this.#hostBaseUrl}/api/v1/auth/token_list`,
      accessToken,
      JSON.stringify(data)
    );
    if (res.status === 401) {
      const m = await res.clone().text();
      if (m === "Expired access token") {
        throw new OismAuthError.ExpiredAccessToken();
      }
      if (m === "Invalid token") {
        throw new OismAuthError.InvalidToken();
      }
    }
    this.checkRestStatus(res);
    return (await this.jsonParse(res, GetRefreshTokenListResponseBodyZ)).tokens;
  }

  async refreshToken(refreshToken: string) {
    const data = { clientCode: this.#clientCode };
    const res = await this.wrappedAuthPost(
      `${this.#hostBaseUrl}/api/v1/auth/refresh`,
      refreshToken,
      JSON.stringify(data)
    );
    if (res.status === 401) {
      const m = await res.clone().text();
      if (m === "Expired refresh token") {
        throw new OismAuthError.ExpiredRefreshToken();
      }
      if (m === "Invalid token") {
        throw new OismAuthError.InvalidToken();
      }
    }
    this.checkRestStatus(res);
    return await this.jsonParse(res, RefreshResponseBodyZ);
  }

  private async wrappedPost(url: string, body: string) {
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-type": "application/json",
        },
        body,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new OismAuthError.FetchError(error);
      }
      throw new OismAuthError.UnknownError(String(error));
    }
    return res;
  }
  private async wrappedAuthGet(url: string, token: string) {
    let res;
    try {
      res = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new OismAuthError.FetchError(error);
      }
      throw new OismAuthError.UnknownError(String(error));
    }
    return res;
  }

  private async wrappedAuthPost(url: string, token: string, body: string) {
    let res;
    try {
      res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "application/json",
        },
        body,
      });
    } catch (error) {
      if (error instanceof Error) {
        throw new OismAuthError.FetchError(error);
      }
      throw new OismAuthError.UnknownError(String(error));
    }
    return res;
  }

  private async checkRestStatus(res: Response) {
    res = res.clone();
    if (res.status >= 400) {
      throw new OismAuthError.UnknownClientError(
        `${res.status}:${await res.text()}`
      );
    }
    if (res.status >= 500) {
      throw new OismAuthError.ServerError(`${res.status}:${await res.text()}`);
    }
    if (res.status >= 300) {
      throw new OismAuthError.UnknownError(`invalid response: ${res.status}`);
    }
  }

  private async jsonParse<T>(
    res: Response,
    schema: z.ZodSchema<T>
  ): Promise<T> {
    let json: unknown;
    try {
      json = await res.json();
    } catch (error) {
      if (error instanceof Error) {
        throw new OismAuthError.JsonParse(error);
      }
    }
    try {
      return schema.parse(json) as T;
    } catch (e) {
      throw new OismAuthError.InvalidResponseBody(
        `invalid response body: ${JSON.stringify(json)}`
      );
    }
  }
}
