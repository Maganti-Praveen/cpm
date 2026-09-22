// Entry point for staff.
// Restricts dashboard access to authenticated staff accounts.


import LoginForm from "../../components/auth/LoginForm";

function StaffLogin() {
  return (
    <LoginForm
      role="STAFF"
      title="Staff Portal"
    />
  );
}

export default StaffLogin;
