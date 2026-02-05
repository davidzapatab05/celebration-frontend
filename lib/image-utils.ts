export function getOptimizedImageUrl(
    url: string | null | undefined,
    options: { width?: number; height?: number; quality?: number | string; format?: string } = {}
): string | null {
    if (!url) return null;

    // Handle local images or non-http paths (prepend backend if needed)
    // Note: The components currently handle the prepending logic. 
    // We will assume the input is the full URL or we will handle the check.

    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    let fullUrl = url;

    // If it's a relative path, prepend backend
    if (!url.startsWith('http')) {
        fullUrl = `${backendUrl.replace(/\/$/, '')}/${url.startsWith('/') ? url.slice(1) : url}`;
    }

    // Check if it is a Cloudinary URL
    if (fullUrl.includes('cloudinary.com')) {
        // Example: https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg
        // We want to insert transformations after /upload/

        const uploadIndex = fullUrl.indexOf('/upload/');
        if (uploadIndex === -1) return fullUrl;

        const baseUrl = fullUrl.slice(0, uploadIndex + 8); // include /upload/
        const restUrl = fullUrl.slice(uploadIndex + 8);

        const params: string[] = [];

        // Auto format and quality by default
        params.push('f_auto');
        params.push(`q_${options.quality || 'auto'}`);

        if (options.width) params.push(`w_${options.width}`);
        if (options.height) params.push(`h_${options.height}`);

        // Use fit/limit to maintain aspect ratio unless crop is specified
        if (options.width || options.height) params.push('c_limit');

        return `${baseUrl}${params.join(',')}/${restUrl}`;
    }

    return fullUrl;
}
