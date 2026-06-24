import { createRoot } from "react-dom/client";
import { setContext } from "@apollo/client/link/context";
import {
  HttpLink,
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
} from "@apollo/client";

import "./index.css";
import Routes from "./routes/index";

const graphqlUri =
  import.meta.env.VITE_GRAPHQL_URI || "http://localhost:4555/graphql";

const httpLink = new HttpLink({
  uri: graphqlUri,
  credentials: "include",
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("Token");
  return {
    headers: {
      ...headers,
      authorization: token || "",
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

const App = Routes;

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Root element not found in DOM");
}

const root = createRoot(rootElement);
root.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
);
