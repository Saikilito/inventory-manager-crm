import { createRoot } from 'react-dom/client';
import Routes from './routes/';
import './index.css';

import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = new HttpLink({
  uri: "http://localhost:4555/graphql",
  credentials: 'include',
});

const authLink = setContext(({ headers }) => {
  const token = localStorage.getItem('Token');
  return {
    headers: {
      ...headers,
      authorization: token || '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache({ addTypename: false }),
});

const App = Routes;

const root = createRoot(document.getElementById('root'));
root.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);
