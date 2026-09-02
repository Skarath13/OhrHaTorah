import type { User } from './auth';

export const requiresAdminAuthentication = (pathname: string): boolean =>
  pathname === '/admin' || (pathname.startsWith('/admin/') && pathname !== '/admin/login');

export const canViewAdminPreview = (
  user: Pick<User, 'role'> | null | undefined,
): boolean => user?.role === 'admin';
