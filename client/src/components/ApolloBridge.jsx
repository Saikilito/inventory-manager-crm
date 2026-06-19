import { useQuery, useMutation } from "@apollo/client";

export function Query({ query, variables, pollInterval, skip, children }) {
  const result = useQuery(query, { variables, pollInterval, skip });
  return children(result);
}

export function Mutation({ mutation, variables, onCompleted, children }) {
  const [mutate, result] = useMutation(mutation, {
    variables,
    onCompleted: (data) => {
      if (onCompleted) onCompleted(data);
    },
  });
  return children(mutate, result);
}
