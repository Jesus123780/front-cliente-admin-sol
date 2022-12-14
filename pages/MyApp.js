import { ApolloProvider } from '@apollo/client'
import { useApollo } from '../apollo/apolloClient'

export function MyApp ({ Component, pageProps }) {
  const apolloClient = useApollo(pageProps)
  return (
    <ApolloProvider client={apolloClient}>
      <Component {...pageProps} />
    </ApolloProvider>
  )
}
