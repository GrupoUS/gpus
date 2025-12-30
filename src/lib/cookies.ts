export function setSecureCookie(
	name: string,
	value: string,
	options: {
		path?: string;
		maxAge?: number;
		sameSite?: 'lax' | 'strict' | 'none';
		secure?: boolean;
	} = {},
) {
	let cookie = `${name}=${encodeURIComponent(value)}`;

	if (options.path) {
		cookie += `; path=${options.path}`;
	}

	if (options.maxAge) {
		cookie += `; max-age=${options.maxAge}`;
	}

	if (options.sameSite) {
		cookie += `; samesite=${options.sameSite}`;
	}

	if (options.secure) {
		cookie += `; secure`;
	}

	document.cookie = cookie;
}
