const DRIVE_HOSTS = new Set(['drive.google.com', 'www.drive.google.com', 'drive.usercontent.google.com']);

/** Resolve public Drive file links without the download/account UI. No server fetch. */
export function normalizeProductImageSource(value: string): string {
  const source = value.trim();
  try {
    const url = new URL(source);
    if (url.protocol !== 'https:' || !DRIVE_HOSTS.has(url.hostname) || url.username || url.password) return source;
    const pathId = url.pathname.match(/^\/file\/d\/([\w-]+)(?:\/|$)/)?.[1];
    const queryId = ['/download', '/uc', '/open', '/thumbnail'].includes(url.pathname) ? url.searchParams.get('id') : null;
    const id = pathId || queryId;
    if (!id || !/^[\w-]{10,200}$/.test(id)) return source;
    // Links requiring a resource key keep Google's thumbnail endpoint and that key.
    const resourceKey = url.searchParams.get('resourcekey');
    if (resourceKey) {
      const thumbnail = new URL('https://drive.google.com/thumbnail');
      thumbnail.searchParams.set('id', id);
      thumbnail.searchParams.set('sz', 'w1600');
      thumbnail.searchParams.set('resourcekey', resourceKey);
      return thumbnail.toString();
    }
    return `https://lh3.googleusercontent.com/d/${id}`;
  } catch {
    return source;
  }
}

export function isProductImageSource(value: string): boolean {
  if (!value || /[\u0000-\u0020\\]/.test(value)) return false;
  if (value.startsWith('/') && !value.startsWith('//')) return true;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}
