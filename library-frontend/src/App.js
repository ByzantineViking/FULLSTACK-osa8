import React, { useState } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import { gql } from 'apollo-boost'
import { useQuery, useMutation } from '@apollo/react-hooks'

const ALL_AUTHORS = gql`
{
  allAuthors {
    name
    born
    bookCount
  }
}
`
const ALL_BOOKS = gql`
{ 
  allBooks {
    title
    published
    author {
      name
      born
      bookCount
    }
  }
}
`
const CREATE_BOOK = gql`
  mutation createBook(
    $title: String!,
    $publishedNumber: Int!,
    $author: String!,
    $genres: [String!]!
  ) {
      addBook(
        title: $title,
        published: $publishedNumber,
        author: $author,
        genres: $genres
      ) {
          title
          published
          id
          author {
            name
            born
            bookCount
          }
          genres
      }
  }
`
const SET_BORN = gql`
  mutation setBorn(
    $justName: String!,
    $yearNumber: Int!
  ) {
    editAuthor(
      name: $justName,
      setBornTo: $yearNumber
    ) {
        name
        id
        born
        bookCount
      }
  }
`

const App = () => {
  const authors = useQuery(ALL_AUTHORS)
  const books = useQuery(ALL_BOOKS)
  const [page, setPage] = useState('authors')
  const [errorMessage, setErrorMessage] = useState(null)

  const handleError = (error) => {
    console.log(error.message)
    setErrorMessage(error.message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 10000)
  }


  const [addBook] = useMutation(CREATE_BOOK, {
    onError: handleError,
    refetchQueries: [{ query: ALL_BOOKS }],
    errorPolicy: 'all'
  })

  const [setBorn] = useMutation(SET_BORN, {
    onError: handleError,
    refetchQueries: [{ query: ALL_AUTHORS }],
    errorPolicy: 'all'
  })

  return (
    <div>
       {errorMessage &&
        <div style={{color: 'red'}}>
          {errorMessage}
        </div>
      }
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        <button onClick={() => setPage('add')}>add book</button>
      </div>

      <Authors 
        result={authors}
        show={page === 'authors'}
        setBorn={setBorn}

      />

      <Books result = {books}
        show={page === 'books'}
      />

      <NewBook 
        show={page === 'add'}
        addBook = {addBook}
      />

    </div>
  )
}

export default App