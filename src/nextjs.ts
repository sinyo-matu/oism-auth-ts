import { AuthClient } from "./client";
import { GetServerSidePropsContext } from "next";
import { deleteCookie, getCookie, setCookie } from "cookies-next";
import { OismAuthError } from "./error";
import { CookieOptions, defaultCookieOptions } from "./types";

export class NextJsAuthClient extends AuthClient {
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
   * @param ctx next request event
   * @returns user info or null
   */
  async extractUser(ctx: GetServerSidePropsContext) {
    // check if the user is logged in
    const { accessToken, refreshToken } = this.getCookies(ctx);
    if (!accessToken || !refreshToken) {
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
          // if the refresh token is expired, delete the cookies and return null
          if (error instanceof OismAuthError.ExpiredRefreshToken) {
            this.cleanupCookies(ctx);
          }
          return null;
        }
        this.setCookies(ctx, newTokens.accessToken, newTokens.refreshToken);
        try {
          // get user info with the new access token
          user = await this.getUser(newTokens.accessToken);
          return user;
        } catch (error) {
          return null;
        }
      }
      // if the access token is invalid, delete the cookies and return null
      this.cleanupCookies(ctx);
      return null;
    }
  }

  /** * this will be used in the svelte-kit hooks function
   * check if query params has code
   * if yes, exchange code for access token and refresh token return true
   * if not, return false
   * @param ctx next request event
   * @returns has exchanged code or not
   */
  async codeExchange(ctx: GetServerSidePropsContext) {
    const { code } = ctx.query;
    if (!code) {
      return false;
    }
    const { accessToken, refreshToken } = await this.exchangeCode(
      code as string
    );
    this.setCookies(ctx, accessToken, refreshToken);
    return true;
  }

  /**
   * this cleans up the cookies
   * @param ctx next request event
   */
  cleanupCookies(ctx: GetServerSidePropsContext) {
    deleteCookie(this.#accessTokenName, {
      req: ctx.req,
      res: ctx.res,
      ...this.#cookieOptions,
    });
    deleteCookie(this.#refreshTokenName, {
      req: ctx.req,
      res: ctx.res,
      ...this.#cookieOptions,
    });
  }

  private getCookies(ctx: GetServerSidePropsContext) {
    return {
      accessToken: getCookie(this.#accessTokenName, {
        req: ctx.req,
        res: ctx.res,
      })?.toString(),
      refreshToken: getCookie(this.#refreshTokenName, {
        req: ctx.req,
        res: ctx.res,
      })?.toString(),
    };
  }

  private setCookies(
    ctx: GetServerSidePropsContext,
    accessToken: string,
    refreshToken: string
  ) {
    this.setCookie(ctx, this.#accessTokenName, accessToken);
    this.setCookie(ctx, this.#refreshTokenName, refreshToken);
  }

  private setCookie(
    ctx: GetServerSidePropsContext,
    name: string,
    value: string
  ) {
    setCookie(name, value, {
      req: ctx.req,
      res: ctx.res,
      ...this.#cookieOptions,
    });
  }
}
