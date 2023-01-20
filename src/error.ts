export abstract class OismAuthErrorBase extends Error {
	private libError: Error | undefined;
	private errorMessage: string;
	constructor(message: string, libError?: Error) {
		super();
		this.errorMessage = message;
		this.libError = libError;
		this.errorMessageOutput();
	}

	private errorMessageOutput() {
		console.error('error message:', this.errorMessage);
		if (this.libError) {
			console.error('Is lib error message:', this.libError.message);
		}
	}
}

class InvalidLoginInfo extends OismAuthErrorBase {
	constructor() {
		super('wrong username or password');
	}
}

class ExpiredAccessToken extends OismAuthErrorBase {
	constructor() {
		super('expired accesstoken');
	}
}

class ServerError extends OismAuthErrorBase {
	constructor(m: string) {
		super(m);
	}
}

class FetchError extends OismAuthErrorBase {
	constructor(e: Error) {
		super('build-in fetch error', e);
	}
}

class UnknownClientError extends OismAuthErrorBase {
	constructor(message: string) {
		super(message);
	}
}

class UnknownError extends OismAuthErrorBase {
	constructor(m: string) {
		super(m);
	}
}

class InvalidResponseBody extends OismAuthErrorBase {
	constructor(m: string) {
		super(m);
	}
}

class JsonParse extends OismAuthErrorBase {
	constructor(e: Error) {
		super('Json parse error', e);
	}
}

class ExpiredCode extends OismAuthErrorBase {
	constructor() {
		super('expired exchange code');
	}
}

class ExpiredRefreshToken extends OismAuthErrorBase {
	constructor() {
		super('expired refresh token');
	}
}

class InvalidToken extends OismAuthErrorBase {
	constructor() {
		super('invalid token');
	}
}

export const OismAuthError = {
	InvalidLoginInfo: InvalidLoginInfo,
	ExpiredAccessToken: ExpiredAccessToken,
	ServerError: ServerError,
	FetchError: FetchError,
	UnknownClientError: UnknownClientError,
	UnknownError: UnknownError,
	InvalidResponseBody: InvalidResponseBody,
	JsonParse: JsonParse,
	ExpiredCode: ExpiredCode,
	ExpiredRefreshToken: ExpiredRefreshToken,
	InvalidToken: InvalidToken
} as const;
