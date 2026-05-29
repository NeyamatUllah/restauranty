import { useContext } from "react";
import { AuthContext } from "../../context/auth.context";
import { Navigate } from "react-router-dom";
import Loading from "../Loading/Loading";

function IsPrivate({ children }) {
  const { isLoggedIn, isAdmin, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return <Loading />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" />;
  }

  if (!isAdmin) {
    return <Navigate to="/" />;
  }
  // If the user is logged in, allow to see the page ✅
  return children;
}

export default IsPrivate;
