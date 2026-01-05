import { json } from '@sveltejs/kit';

export async function POST({ request }) {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers);
    // Verify content-type if needed, but for now just echo size and headers
    return json({
        size: body.length,
        hash: 'md5-placeholder',
        headers
    });
}
