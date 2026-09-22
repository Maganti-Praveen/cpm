// Entry point for administrators.
// Mounts authentication forms and restricts layout access.


import LoginForm from "../../components/auth/LoginForm";

function AdminLogin() {
  return (
    <LoginForm
      role="ADMIN"
      title="Administrator Portal"
    />
  );
}

export default AdminLogin;
