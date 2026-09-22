// Entry point for clients.
// Mounts authentication layout and verifies portal access credentials.


import LoginForm from "../../components/auth/LoginForm";

function ClientLogin() {
  return (
    <LoginForm
      role="CLIENT"
      title="Client Portal"
    />
  );
}

export default ClientLogin;
