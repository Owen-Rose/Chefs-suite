export const withApiAuth = jest.fn((handler, requiredPermission) => {
  return async (req: any, res: any) => {
    // If the test provided a session, check if the user has the required permission
    if (req.session && req.session.user) {
      const user = req.session.user;
      
      // Add user to request
      req.user = {
        role: user.role,
        id: user.id,
        hasPermission: (permission: any) => user.permissions?.includes(permission) || false
      };

      // Check if user has required permission
      if (requiredPermission && !req.user.hasPermission(requiredPermission)) {
        return res.status(403).json({ error: "Not authorized" });
      }
      
      return handler(req, res);
    } else {
      // No session provided
      return res.status(401).json({ error: "Not authenticated" });
    }
  };
});

export const ExtendedNextApiRequest = {};

export const mockReqUser = {
    id: 'mock-user-id',
    role: 'ADMIN',
    hasPermission: jest.fn().mockReturnValue(true)
};