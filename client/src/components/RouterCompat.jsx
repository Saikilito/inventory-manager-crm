import React from "react";
import {
  useNavigate,
  useParams,
  useLocation,
  Navigate,
} from "react-router-dom";

export function withRouter(Component) {
  function WrappedComponent(props) {
    const navigate = useNavigate();
    const params = useParams();
    const location = useLocation();

    const history = {
      push: navigate,
      replace: (to) => navigate(to, { replace: true }),
      goBack: () => navigate(-1),
      go: (n) => navigate(n),
      location,
      listen: () => {},
    };

    return (
      <Component
        {...props}
        history={history}
        match={{ params }}
        location={location}
      />
    );
  }
  WrappedComponent.displayName = `withRouter(${Component.displayName || Component.name || "Component"})`;
  return WrappedComponent;
}

export { Navigate as Redirect };
