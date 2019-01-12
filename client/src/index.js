import React from 'react';
import ReactDOM from 'react-dom';

import Routes from './routes/';
import './index.css'

import { ApolloProvider } from 'react-apollo';
import ApolloClient, { InMemoryCache } from "apollo-boost";

const App = Routes

const client = new ApolloClient({
  uri: "http://localhost:4555/graphql",
  cache: new InMemoryCache({addTypename:false}),
  onError:({networkError, graphQLErrors})=>{
    console.log('networkError',networkError)
    console.log('graphQLErrors',graphQLErrors)
  }
});

const Route =   <ApolloProvider client={client}>
                    <App/>  
                </ApolloProvider>

ReactDOM.render(Route, document.getElementById('root'));
