export const dynamic = 'force-dynamic';

export default async function handler(request) {
    const imageUrl = request.query.url;

    if (!imageUrl) {
        return new Response('Missing url parameter', { status: 400 });
    }

    try {
        const decodedUrl = decodeURIComponent(imageUrl);
        
        const response = await fetch(decodedUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            return new Response('Failed to fetch image', { status: response.status });
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        const contentType = response.headers.get('content-type') || 'image/jpeg';

        return new Response(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=86400',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return new Response(error.message, { status: 500 });
    }
}
