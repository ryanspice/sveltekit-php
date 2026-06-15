import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params, request }) => {
	return Response.json(
		{
			locale: params.lang,
			accept: request.headers.get('accept') ?? ''
		},
		{
			headers: {
				vary: 'Accept'
			}
		}
	);
};
