/**
 * Opções para configuração de cookies seguros.
 */
export interface CookieOptions {
	/** Tempo de vida em segundos (default: 7 dias) */
	maxAge?: number;
	/** Caminho do cookie (default: '/') */
	path?: string;
	/** Política SameSite (default: 'lax') */
	sameSite?: 'strict' | 'lax' | 'none';
	/** Cookie seguro (HTTPS only) - default: true em produção */
	secure?: boolean;
}

/**
 * Define um cookie com configurações de segurança.
 * Usado pelo Sidebar para persistir estado aberto/fechado.
 *
 * @param name - Nome do cookie
 * @param value - Valor do cookie
 * @param options - Opções de configuração
 */
export function setSecureCookie(name: string, value: string, options: CookieOptions = {}): void {
	const {
		maxAge = 60 * 60 * 24 * 7, // 7 dias
		path = '/',
		sameSite = 'lax',
		secure = typeof window !== 'undefined' && window.location.protocol === 'https:',
	} = options;

	const cookieParts = [
		`${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
		`max-age=${maxAge}`,
		`path=${path}`,
		`samesite=${sameSite}`,
	];

	if (secure) {
		cookieParts.push('secure');
	}

	document.cookie = cookieParts.join('; ');
}

/**
 * Obtém o valor de um cookie pelo nome.
 *
 * @param name - Nome do cookie
 * @returns Valor do cookie ou null se não existir
 */
export function getCookie(name: string): string | null {
	if (typeof document === 'undefined') return null;

	const cookies = document.cookie.split(';');
	const encodedName = encodeURIComponent(name);

	for (const cookie of cookies) {
		const [cookieName, cookieValue] = cookie.trim().split('=');
		if (cookieName === encodedName) {
			return decodeURIComponent(cookieValue);
		}
	}

	return null;
}

/**
 * Remove um cookie pelo nome.
 *
 * @param name - Nome do cookie
 * @param path - Caminho do cookie (default: '/')
 */
export function deleteCookie(name: string, path = '/'): void {
	document.cookie = `${encodeURIComponent(name)}=; max-age=0; path=${path}`;
}
