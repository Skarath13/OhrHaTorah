/** Public links remain usable; private draft HTML stays behind server session checks. */
export const pendingPagePaths = ['/expect', '/faq', '/events', '/resources', '/youth'] as const;

export function isPendingPage(pathname: string): boolean {
    return pendingPagePaths.some(path => path === pathname.replace(/\/+$/, ''));
}
