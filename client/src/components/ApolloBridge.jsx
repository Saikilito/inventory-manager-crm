import { useQuery, useMutation } from '@apollo/client';

/**
 * Render-prop wrapper for useQuery.
 * Replaces react-apollo's <Query> component.
 */
export function Query({ query, variables, pollInterval, skip, children }) {
  const result = useQuery(query, { variables, pollInterval, skip });
  return children(result);
}

/**
 * Render-prop wrapper for useMutation.
 * Replaces react-apollo's <Mutation> component.
 */
export function Mutation({ mutation, variables, onCompleted, refetchQueries, children }) {
  const [mutate, result] = useMutation(mutation, {
    variables,
    onCompleted,
    refetchQueries,
  });
  return children(mutate, result);
}
