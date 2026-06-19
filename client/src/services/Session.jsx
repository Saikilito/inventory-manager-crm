import React from "react";
import { useQuery } from "@apollo/client";
import { CURRENT_USER } from "./queries/users";

const Session = (Component) => (props) => {
  const { loading, error, data, refetch } = useQuery(CURRENT_USER, {
    fetchPolicy: "network-only",
    errorPolicy: "ignore",
  });
  if (loading) return <div className="text-center p-5">Cargando...</div>;
  return (
    <Component {...props} session={data?.getUser || null} refetch={refetch} />
  );
};

export default Session;
