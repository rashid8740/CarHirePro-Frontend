// Role-based permissions system
export const PERMISSIONS = {
  // Director - Full system access and control
  director: [
    {
      module: 'dashboard',
      actions: ['view', 'export']
    },
    {
      module: 'quick-actions',
      actions: ['view', 'create', 'update', 'send_reminders', 'generate_invoices']
    },
    {
      module: 'clients',
      actions: ['view', 'create', 'edit', 'delete', 'suspend', 'activate', 'export']
    },
    {
      module: 'vehicles',
      actions: ['view', 'create', 'edit', 'delete', 'assign_owner', 'maintenance']
    },
    {
      module: 'bookings',
      actions: ['view', 'create', 'edit', 'cancel', 'approve', 'dispatch', 'checkin']
    },
    {
      module: 'finance',
      actions: ['view', 'create', 'edit', 'delete', 'generate_reports', 'export']
    },
    {
      module: 'staff',
      actions: ['view', 'create', 'edit', 'delete', 'assign_permissions']
    },
    {
      module: 'owners',
      actions: ['view', 'create', 'edit', 'delete', 'generate_invoices', 'track_earnings']
    },
    {
      module: 'reports',
      actions: ['view', 'generate', 'export', 'financial_analysis']
    },
    {
      module: 'settings',
      actions: ['view', 'edit', 'system_config', 'backup']
    },
    {
      module: 'notifications',
      actions: ['send_bulk_sms', 'email_campaigns', 'system_alerts']
    }
  ],

  // Staff - Operational tasks and client management
  staff: [
    {
      module: 'dashboard',
      actions: ['view']
    },
    {
      module: 'quick-actions',
      actions: ['view', 'create', 'update', 'send_reminders']
    },
    {
      module: 'clients',
      actions: ['view', 'create', 'edit', 'suspend', 'activate']
    },
    {
      module: 'vehicles',
      actions: ['view', 'edit', 'maintenance']
    },
    {
      module: 'bookings',
      actions: ['view', 'create', 'edit', 'dispatch', 'checkin']
    },
    {
      module: 'finance',
      actions: ['view', 'create', 'generate_receipts']
    },
    {
      module: 'reports',
      actions: ['view', 'generate']
    },
    {
      module: 'notifications',
      actions: ['send_reminders']
    }
  ],

  // Owner - Vehicle and earnings management
  owner: [
    {
      module: 'dashboard',
      actions: ['view']
    },
    {
      module: 'quick-actions',
      actions: ['view']
    },
    {
      module: 'vehicles',
      actions: ['view'] // Only their own vehicles
    },
    {
      module: 'bookings',
      actions: ['view'] // Only bookings for their vehicles
    },
    {
      module: 'finance',
      actions: ['view', 'track_earnings', 'view_expenses']
    },
    {
      module: 'reports',
      actions: ['view', 'earnings_report']
    }
  ],

  // Client - Self-service booking and account management
  client: [
    {
      module: 'dashboard',
      actions: ['view']
    },
    {
      module: 'quick-actions',
      actions: ['view', 'create']
    },
    {
      module: 'vehicles',
      actions: ['view'] // Available vehicles only
    },
    {
      module: 'bookings',
      actions: ['view', 'create', 'extend'] // Only their own bookings
    },
    {
      module: 'profile',
      actions: ['view', 'edit']
    },
    {
      module: 'receipts',
      actions: ['view', 'download']
    }
  ]
};

export const hasPermission = (userRole: string, module: string, action: string): boolean => {
  const rolePermissions = PERMISSIONS[userRole as keyof typeof PERMISSIONS];
  if (!rolePermissions) return false;

  const modulePermissions = rolePermissions.find(p => p.module === module);
  if (!modulePermissions) return false;

  return modulePermissions.actions.includes(action);
};

export const getModulePermissions = (userRole: string, module: string): string[] => {
  const rolePermissions = PERMISSIONS[userRole as keyof typeof PERMISSIONS];
  if (!rolePermissions) return [];

  const modulePermissions = rolePermissions.find(p => p.module === module);
  return modulePermissions ? modulePermissions.actions : [];
};

export const getUserModules = (userRole: string): string[] => {
  const rolePermissions = PERMISSIONS[userRole as keyof typeof PERMISSIONS];
  if (!rolePermissions) return [];

  return rolePermissions.map(p => p.module);
};