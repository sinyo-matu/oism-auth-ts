import type { RequestEvent } from "@sveltejs/kit";
import { AuthClient } from "./client";
import { OismAuthError } from "./error";
import { CookieOptions, defaultCookieOptions } from "./types";

export class SvelteAuthClient extends AuthClient {
  #accessTokenName: string;
  #refreshTokenName: string;
  #cookieOptions: CookieOptions;
  constructor(
    hostBaseUrl: string,
    clientCode: string,
    accessTokenName: string,
    refreshTokenName: string,
    cOptions?: Partial<CookieOptions>
  ) {
    super(hostBaseUrl, clientCode);
    this.#accessTokenName = accessTokenName;
    this.#refreshTokenName = refreshTokenName;
    this.#cookieOptions = { ...defaultCookieOptions, ...cOptions };
  }

  /**
   * this will be used in the svelte-kit hooks function
   * check if the user got the access token and refresh token
   * if yes, get user info
   * if the access token is expired, refresh it
   * if the refresh token is expired, delete the cookies and redirect return null
   * if not, redirect return null
   * @param event svelte-kit request event
   * @returns user info or null
   */
  async extractUser(event: RequestEvent) {
    // check if the user is logged in
    const accessToken = event.cookies.get(this.#accessTokenName);
    const refreshToken = event.cookies.get(this.#refreshTokenName);
    if (!accessToken || !refreshToken) {
      // if not, redirect to login page
      return null;
    }
    let user;
    try {
      // if yes, get user info
      user = await this.getUser(accessToken);
      return user;
    } catch (error) {
      // if the access token is expired, refresh it
      if (error instanceof OismAuthError.ExpiredAccessToken) {
        let newTokens;
        try {
          newTokens = await this.refreshToken(refreshToken);
        } catch (error) {
          // if the refresh token is expired, delete the cookies and redirect to login page
          if (error instanceof OismAuthError.ExpiredRefreshToken) {
            this.cleanupCookies(event);
          }
          return null;
        }
        event.cookies.set(
          this.#accessTokenName,
          newTokens.accessToken,
          this.#cookieOptions
        );
        event.cookies.set(
          this.#refreshTokenName,
          newTokens.refreshToken,
          this.#cookieOptions
        );
        try {
          // get user info with the new access token
          user = await this.getUser(newTokens.accessToken);
          return user;
        } catch (error) {
          return null;
        }
      }
      // if the access token is invalid, delete the cookies and redirect to login page
      this.cleanupCookies(event);
      return null;
    }
  }

  /** * this will be used in the svelte-kit hooks function
   * check if query params has code
   * if yes, exchange code for access token and refresh token return true
   * if not, return false
   * @param event svelte-kit request event
   * @returns has exchanged code or not
   */
  async codeExchange(event: RequestEvent) {
    const queryParams = event.url.searchParams;
    if (!queryParams.has("code")) {
      return false;
    }
    const { accessToken, refreshToken } = await this.exchangeCode(
      queryParams.get("code") as string
    );
    event.cookies.set(this.#accessTokenName, accessToken, this.#cookieOptions);
    event.cookies.set(
      this.#refreshTokenName,
      refreshToken,
      this.#cookieOptions
    );
    return true;
  }

  cleanupCookies(event: RequestEvent) {
    event.cookies.delete(this.#accessTokenName);
    event.cookies.delete(this.#refreshTokenName);
  }
}
