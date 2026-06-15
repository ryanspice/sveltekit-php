import type { EntryGenerator, RequestHandler } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => [{ lang: 'fr' }];

export const GET: RequestHandler = ({ params }) => {
	return new Response(`<rss version="2.0"><channel><title>${params.lang}</title></channel></rss>`, {
		headers: {
			'content-type': 'application/rss+xml; charset=utf-8'
		}
	});
};

