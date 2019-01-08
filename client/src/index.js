import React from 'react';
import ReactDOM from 'react-dom';

import Routes from './routes/';

import { ApolloProvider } from 'react-apollo';
import ApolloClient from "apollo-boost";

const App = Routes

const client = new ApolloClient({
  uri: "http://localhost:3001/graphql"
});

const Route =   <ApolloProvider client={client}>
                    <App/>  
                </ApolloProvider>

ReactDOM.render(Route, document.getElementById('root'));
