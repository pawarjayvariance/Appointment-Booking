export const getProfilePicUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;

    // Assuming backend runs on port 5000 and serves public folder
    const baseUrl = 'http://localhost:5000';

    // Ensure relative paths have /public/ prefix if they are local uploads
    if (path.startsWith('/uploads') || path.startsWith('uploads')) {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}/public${cleanPath}`;
    }

    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
