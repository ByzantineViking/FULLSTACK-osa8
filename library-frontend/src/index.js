import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

import { ApolloProvider } from '@apollo/react-hooks'

import { ApolloClient } from 'apollo-client'
import { createHttpLink} from 'apollo-link-http'
import { setContext } from 'apollo-link-context'
import { InMemoryCache } from 'apollo-cache-inmemory'

import { split } from 'apollo-link'
import { WebSocketLink } from 'apollo-link-ws'
import { getMainDefinition } from 'apollo-utilities'

// WebSocket connection
const wsLink = new WebSocketLink({
  uri: `ws://localhost:4000/graphql`,
  options: { reconnect: true }
})
// HTTP connection
const httpLink = createHttpLink({
    uri: 'http://localhost:4000/graphql'
})
// Authentication with login from Authorization header
const authLink = setContext((_, { headers }) => {
    const token = localStorage.getItem('phonenumbers-user-token')
    return {
      headers: {
        ...headers,
        authorization: token ? `bearer ${token}` : null,
      }
    }
  })
  // Parsing the link
  const link = split( 
    ({ query }) => {
      const { kind, operation } = getMainDefinition(query)
      return kind === 'OperationDefinition' && operation === 'subscription'
    },
    wsLink,
    authLink.concat(httpLink)
  )
  // Establish the client
  const client = new ApolloClient({
    link,
    cache: new InMemoryCache()
  })
  
// Giving the client with ApolloProvider so no need to give in props?
ReactDOM.render(
    <ApolloProvider client={client}>
        <App />
    </ApolloProvider>
,document.getElementById('root'))