import { json } from '@sveltejs/kit';

export function GET({ cookies }) {
    cookies.set('c1', 'v1', { path: '/' });
    cookies.set('c2', 'v2', { path: '/' });
    return json({ ok: true });
}
