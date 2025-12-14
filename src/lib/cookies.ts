/**
 * Secure cookie management utilities
 * Provides safe methods for setting and getting cookies with proper error handling
 *
 * Note: While Cookie Store API is the modern approach, it's still experimental
 * and has limited browser support. We use document.cookie here with proper
 * security attributes as a fallback while maintaining functionality across all browsers.
 */

/**
 * Secure cookie options interface
 */
interface SecureCookieOptions {
	expires?: Date;
	maxAge?: number;
	domain?: string;
	path?: string;
	secure?: boolean;
	sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Sets a cookie with proper security attributes and error handling
 * @param name - Cookie name
 * @param value - Cookie value
 * @param options - Additional cookie options
 */
export const setSecureCookie = (
	name: string,
	value: string,
	options: SecureCookieOptions = {},
): void => {
	try {
		// Build cookie string with proper attributes
		let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

		// Add expiration
		if (options.expires) {
			cookieString += `; expires=${options.expires.toUTCString()}`;
		}

		// Add max-age (in seconds)
		if (options.maxAge) {
			cookieString += `; max-age=${options.maxAge}`;
		}

		// Add path
		if (options.path) {
			cookieString += `; path=${options.path}`;
		} else {
			cookieString += '; path=/';
		}

		// Add domain if provided
		if (options.domain) {
			cookieString += `; domain=${options.domain}`;
		}

		// Add security flags
		if (options.secure !== false) {
			// Secure flag (only over HTTPS)
			cookieString += '; secure';
		}

		// SameSite attribute (prevents CSRF)
		if (options.sameSite) {
			cookieString += `; samesite=${options.sameSite}`;
		} else {
			cookieString += '; samesite=lax';
		}

		// Set the cookie
		document.cookie = cookieString;
	} catch (_error) {
		// Silently handle cookie setting errors
		// In production, cookie failures shouldn't break the app
	}
};

/**
 * Gets a cookie value by name with proper decoding
 * @param name - Cookie name to retrieve
 * @returns Cookie value or null if not found
 */
export const getCookie = (name: string): string | null => {
	try {
		const nameEQ = `${encodeURIComponent(name)}=`;
		const cookies = document.cookie.split(';');

		for (const cookie of cookies) {
			let trimmedCookie = cookie;
			while (trimmedCookie.charAt(0) === ' ') {
				trimmedCookie = trimmedCookie.substring(1, trimmedCookie.length);
			}
			if (trimmedCookie.indexOf(nameEQ) === 0) {
				return decodeURIComponent(trimmedCookie.substring(nameEQ.length, trimmedCookie.length));
			}
		}

		return null;
	} catch (_error) {
		// Silently handle cookie reading errors
		// Return null as default
		return null;
	}
};

/**
 * Deletes a cookie by setting expiration in the past
 * @param name - Cookie name to delete
 * @param options - Additional options (path, domain)
 */
export const deleteCookie = (
	name: string,
	options: { path?: string; domain?: string } = {},
): void => {
	try {
		const cookiePath = options.path || '/';
		const cookieDomain = options.domain ? `; domain=${options.domain}` : '';

		document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${cookiePath}${cookieDomain}`;
	} catch (_error) {
		// Silently handle cookie deletion errors
		// Cookie deletion is non-critical for app functionality
	}
};
