import { useSearch } from '@tanstack/react-router';

export type UTMParams = {
	utmSource?: string;
	utmCampaign?: string;
	utmMedium?: string;
	utmContent?: string;
	utmTerm?: string;
};

export function useUTMParams(): UTMParams {
	const search = useSearch({ strict: false }) as Record<string, unknown>;

	return {
		utmSource: typeof search.utm_source === 'string' ? search.utm_source : undefined,
		utmCampaign: typeof search.utm_campaign === 'string' ? search.utm_campaign : undefined,
		utmMedium: typeof search.utm_medium === 'string' ? search.utm_medium : undefined,
		utmContent: typeof search.utm_content === 'string' ? search.utm_content : undefined,
		utmTerm: typeof search.utm_term === 'string' ? search.utm_term : undefined,
	};
}
