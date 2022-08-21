import { useUser } from '../../hooks/useUser'
import React from 'react'

export default function Dashboard () {
  const [data, { loading, error }] = useUser()
  if (loading) return <div>Loading...</div>
  if (error) return <div>Error</div>
  return (
        <div>
          {data.length > 0
            ? data.map(book => {
              return (
              <div key={book.id}>{book.title}</div>
              )
            })
            : <div>Aun no hay datos</div>}
        </div>
  )
}
