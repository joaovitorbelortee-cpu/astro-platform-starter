import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';

export const prerender = false;

export const GET: APIRoute = async (context) => {
    try {
        const urlParams = new URL(context.url);
        const key = urlParams.searchParams.get('key');
        if (!key) {
            return new Response(JSON.stringify({ error: 'Missing blob key' }), { status: 400 });
        }

        const blobStore = getStore('shapes');
        const blob = await blobStore.get(key, { type: 'json' });
        if (!blob) {
            return new Response(JSON.stringify({ error: 'Blob not found' }), { status: 404 });
        }

        return new Response(
            JSON.stringify({
                blob
            })
        );
    } catch (error) {
        console.error('Error fetching blob', error);
        return new Response(JSON.stringify({ error: 'Failed fetching blob' }), { status: 500 });
    }
};
