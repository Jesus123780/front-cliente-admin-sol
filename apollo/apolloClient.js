import { useMemo } from 'react'
import { ApolloClient, HttpLink, InMemoryCache, ApolloLink, split } from '@apollo/client'
import { concatPagination, getMainDefinition } from '@apollo/client/utilities'
import merge from 'deepmerge'
import isEqual from 'lodash/isEqual'
import { API_URL_BASE } from './urls'
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { WebSocketLink } from '@apollo/client/link/ws'

export const APOLLO_STATE_PROP_NAME = '__APOLLO_STATE__'

let apolloClient
export const getDeviceId = async () => {
  const fp = await FingerprintJS.load()
  const result = await fp.get()
  return result.visitorId || null
}
const authLink = async (_) => {
  if (typeof window !== 'undefined') {
    const token = window?.localStorage.getItem('session')

    const authorization = token ? `Bearer ${token}` : null
    const device = await getDeviceId()
    return token
      ? {
          headers: {
            device,
            authorization
          }
        }
      : {
          headers: {
            device
          }
        }
  }
}
// Create Second Link
const wsLink = process.browser
  ? new WebSocketLink({
    uri: process.env.NODE_ENV === 'development' ? 'ws://localhost:4000/graphql' : '',
    options: {
      reconnect: true,
      lazy: true,
      connectionParams: () => {
        return { headers: { Authorization: 'Bearer TOKEN' } }
      }
    }
  })
  : null

console.log(API_URL_BASE)
const getLink = async (operation) => {
  // await splitLink({ query: operation.query })
  const headers = await authLink()
  const service = operation.getContext().clientName
  let uri = `${API_URL_BASE}graphql`
  if (service === 'subscriptions') uri = 'http://localhost:4000/graphql'
  const link = new HttpLink({
    uri,
    credentials: 'same-origin',
    authorization: '',
    ...headers
  })
  return link.request(operation)
}
function createApolloClient () {
  const ssrMode = typeof window === 'undefined'
  const link = ssrMode
    ? ApolloLink.split(() => true, operation => getLink(operation))
    : typeof window !== 'undefined'
      ? split((operation) => {
        const definition = getMainDefinition(operation.query)
        return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
      },
      wsLink,
      ApolloLink.split(() => true, operation => getLink(operation)))
      : ApolloLink.split(() => true, operation => getLink(operation))
  return new ApolloClient({
    connectToDevTools: true,
    ssrMode: typeof window === 'undefined',
    link,
    cache: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            allPosts: concatPagination()
          }
        }
      }
    })
  })
}

export function initializeApollo (initialState = null, ctx) {
  const _apolloClient = apolloClient ?? createApolloClient()
  // If your page has Next.js data fetching methods that use Apollo Client, the initial state
  // gets hydrated here
  if (initialState) {
    // Get existing cache, loaded during client side data fetching
    const existingCache = _apolloClient.extract()
    // Merge the existing cache into data passed from getStaticProps/getServerSideProps
    const data = merge(initialState, existingCache, {
      // combine arrays using object equality (like in sets)
      arrayMerge: (destinationArray, sourceArray) => [
        ...sourceArray,
        ...destinationArray.filter(d => sourceArray.every(s => !isEqual(d, s))
        )
      ]
    })

    // Restore the cache with the merged data
    _apolloClient.cache.restore(data)
  }
  // For SSG and SSR always create a new Apollo Client
  if (typeof window === 'undefined') return _apolloClient
  // Create the Apollo Client once in the client
  if (!apolloClient) apolloClient = _apolloClient

  return _apolloClient
}

export function addApolloState (client, pageProps) {
  if (pageProps?.props) {
    pageProps.props[APOLLO_STATE_PROP_NAME] = client.cache.extract()
  }

  return pageProps
}

export function useApollo (pageProps) {
  const state = pageProps[APOLLO_STATE_PROP_NAME]
  const store = useMemo(() => initializeApollo(state, pageProps), [state])
  return store
}
