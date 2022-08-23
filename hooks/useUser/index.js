import { gql, useQuery } from '@apollo/client'
import { useState } from 'react'

export const useUser = () => {
  const GET_ALL_AREAS = gql`
query book {
  books {
    title
    author
  }
}
    `
  const [user, setUser] = useState(null)
  const { loading, error } = useQuery(GET_ALL_AREAS, {
    onCompleted: (data) => {
      setUser(data.books)
    }
  })

  return [user, { loading, error }]
}
