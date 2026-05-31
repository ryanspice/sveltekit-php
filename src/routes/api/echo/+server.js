import { json } from '@sveltejs/kit';

export function GET({ request }) {
	const url = new URL(request.url);
	const message = url.searchParams.get('message') || 'echo';
	return json({ message });
}
