import { json } from '@sveltejs/kit';

export const GET = () =>
	json({ ok: true, ts: Date.now() }, { headers: { 'cache-control': 'no-store' } });
