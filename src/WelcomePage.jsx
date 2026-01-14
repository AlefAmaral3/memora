import { useLocation } from "react-router-dom";

export default function WelcomePage() {
  const location = useLocation();
  const username = location.state?.username || "Utilizador";

  return (
    <div
      style={{
        padding: "50px",
        fontSize: "28px",
        textAlign: "center",
      }}
    >
      {username} fez login
    </div>
  );
}
