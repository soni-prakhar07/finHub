/**
 * Role-based access policies for HTTP routes.
 *
 * Capability matrix:
 * - Auth (register/login), GET /api/me: any authenticated user (no extra role gate).
 * - Records list (GET /api/records): VIEWER, ANALYST, ADMIN — read-only for viewers/analysts.
 * - Records create/update/delete: ADMIN only.
 * - Dashboard (summary, categories, recent): ANALYST, ADMIN — aggregates / analyst tooling.
 * - User management (GET/POST/PATCH /api/users): ADMIN only.
 */

const ROLES = Object.freeze({
  VIEWER: "VIEWER",
  ANALYST: "ANALYST",
  ADMIN: "ADMIN",
});

const policies = Object.freeze({
  recordsRead: [ROLES.VIEWER, ROLES.ANALYST, ROLES.ADMIN],
  recordsWrite: [ROLES.ADMIN],
  dashboard: [ROLES.ANALYST, ROLES.ADMIN],
  usersManage: [ROLES.ADMIN],
  adminOnly: [ROLES.ADMIN],
});

module.exports = { ROLES, policies };
