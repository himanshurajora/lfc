/** Admin UID — only this user can access the /admin-lfc route. */
export const ADMIN_UID = 'PRkC3J55wLaTBlMy8tyyoSqBcJj1';

/** Check if a given UID is the platform admin. */
export function isAdmin(uid: string | undefined | null): boolean {
  return uid === ADMIN_UID;
}
