const PERMISSIONS = {
  admin: [
    'task:create',
    'task:update',
    'task:delete',
    'task:view:all',
    'task:assign',
    'user:invite',
    'user:remove',
    'user:manage'
  ],
  manager: ['task:create', 'task:assign', 'task:view:all', 'task:update'],
  member: ['task:view:own', 'task:update:own']
};

function permissionsForRole(role) {
  return PERMISSIONS[role] ? [...PERMISSIONS[role]] : [];
}

function hasPermission(role, permission) {
  const perms = PERMISSIONS[role];
  if (!perms) return false;
  return perms.includes(permission);
}

module.exports = { PERMISSIONS, permissionsForRole, hasPermission };

