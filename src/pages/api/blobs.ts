import type { APIRoute } from 'astro';
import { getStore } from '@netlify/blobs';
import { uploadDisabled } from '../../utils';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        if (uploadDisabled) {
            return new Response(JSON.stringify({ error: 'Uploads are disabled' }), { status: 403 });
        }

        const parameters = await request.json();
        if (!parameters?.name) {
            return new Response(JSON.stringify({ error: 'Missing blob name' }), { status: 400 });
        }

        const blobStore = getStore('shapes');
        const key = parameters.name;
        await blobStore.setJSON(key, parameters);
        return new Response(
            JSON.stringify({
                message: `Stored shape "${key}"`
            })
        );
    } catch (error) {
        console.error('Error storing blob', error);
        return new Response(JSON.stringify({ error: 'Failed storing blob' }), { status: 500 });
    }
};

export const GET: APIRoute = async ({ request }) => {
    try {
        const blobStore = getStore({ name: 'shapes', consistency: 'strong' });
        const data = await blobStore.list();
        const keys = data.blobs.map(({ key }) => key);
        return new Response(
            JSON.stringify({
                keys
            })
        );
    } catch (e) {
        console.error(e);
        return new Response(
            JSON.stringify({
                keys: [],
                error: 'Failed listing blobs'
            }),
            { status: 500 }
        );
    }
};
