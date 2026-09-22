// Guards sensitive pages by validating user authentication and access levels.
// Redirects unauthorized sessions back to login routes.


import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const RoleProtectedRoute = ({ allowedRole, requiredPermissionKey, superAdminOnly, children }) => {
  const { user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium">Verifying credentials...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    if (allowedRole === "ADMIN") return <Navigate to="/admin/login" />;
    if (allowedRole === "STAFF") return <Navigate to="/staff/login" />;
    return <Navigate to="/client/login" />;
  }
  if (user.role !== allowedRole) {
    if (user.role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "STAFF") return <Navigate to="/staff/dashboard" replace />;
    if (user.role === "CLIENT") return <Navigate to="/client/dashboard" replace />;
    return <Navigate to="/client/login" replace />;
  }

  // Handle specific admin sub-role checks if allowedRole is ADMIN
  if (allowedRole === "ADMIN") {
    const isMainAdmin = user?.isSuperAdmin === true;
    const isSubAdmin = !isMainAdmin;
    if (isSubAdmin) {
      if (superAdminOnly) {
        return <Navigate to="/admin/dashboard" replace />;
      }
      if (requiredPermissionKey) {
        let userPermissions = {};
        if (typeof user?.permissions === "string") {
          try {
            userPermissions = JSON.parse(user.permissions);
          } catch (_) {
            userPermissions = {};
          }
        } else if (user?.permissions && typeof user.permissions === "object") {
          userPermissions = user.permissions;
        }
        
        const hasPermission = userPermissions[requiredPermissionKey] === true || userPermissions[requiredPermissionKey] === "true";
        if (!hasPermission) {
          return <Navigate to="/admin/dashboard" replace />;
        }
      }
    }
  }

  return children;
};

export default RoleProtectedRoute;
