import React, { useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";

import Error from "../../components/Error";

import { Mutation } from "../../components/ApolloBridge.jsx";
import { AUTH_USER } from "../../services/mutations/users";

const initialState = {
  user: "",
  password: "",
};

function Login({ refetch }) {
  const navigate = useNavigate();
  const [state, setState] = useState(initialState);

  const updateState = (e) => {
    const { name, value } = e.target;
    setState((prev) => ({ ...prev, [name]: value }));
  };

  const clearState = () => {
    setState(initialState);
  };

  const handleLogin = async (data) => {
    if (data && data.userAuthentication && data.userAuthentication.token) {
      localStorage.setItem("Token", data.userAuthentication.token);

      try {
        await refetch();
      } catch (e) {
        console.error("refetch error:", e);
      }
      clearState();
      navigate("/panel", { replace: true });
    }
  };

  const validateForm = () => {
    const { user, password } = state;
    return !user || !password;
  };

  const { user, password } = state;

  return (
    <Fragment>
      <h1 className="text-center mb-5">Iniciar Sesion</h1>
      <div className="row justify-content-center">
        <Mutation
          mutation={AUTH_USER}
          variables={{ user, password }}
          onCompleted={handleLogin}
        >
          {(userAuthentication, { loading, error }) => {
            return (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  userAuthentication();
                }}
                className="col-md-8"
              >
                {error && <Error error={error.message} />}

                <div className="form-group">
                  <label>Usuario</label>
                  <input
                    onChange={updateState}
                    value={user}
                    type="text"
                    name="user"
                    autoComplete="username"
                    className="form-control"
                    placeholder="Nombre Usuario"
                  />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input
                    onChange={updateState}
                    value={password}
                    type="password"
                    name="password"
                    autoComplete="current-password"
                    className="form-control"
                    placeholder="Password"
                  />
                </div>

                <button
                  disabled={loading || validateForm()}
                  type="submit"
                  className="btn btn-success float-right"
                >
                  Iniciar Sesión
                </button>
              </form>
            );
          }}
        </Mutation>
      </div>
    </Fragment>
  );
}

export default Login;
