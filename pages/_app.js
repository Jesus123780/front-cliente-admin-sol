import PropTypes from 'prop-types'
import '../styles/globals.css'
import { ApolloProvider } from '@apollo/client'
import { useApollo } from '../apollo/apolloClient'

function MyApp ({ Component, pageProps }) {
  const apolloClient = useApollo(pageProps)
  return (
  <ApolloProvider client={apolloClient}>
    <Component {...pageProps} />
  </ApolloProvider>
  )
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  pageProps: PropTypes.object
}

export default MyApp
