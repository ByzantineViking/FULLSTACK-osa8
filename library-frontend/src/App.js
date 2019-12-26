import React, { useState } from 'react'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/LoginForm'
import { gql } from 'apollo-boost'
import { useQuery, useMutation, useApolloClient } from '@apollo/react-hooks'


const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      value
    }
  }
`
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
  const client = useApolloClient()
  const authors = useQuery(ALL_AUTHORS)
  const books = useQuery(ALL_BOOKS)
  const [page, setPage] = useState('authors')
  const [errorMessage, setErrorMessage] = useState(null)
  const [token, setToken] = useState(null)
  const handleError = (error) => {
    console.log(error.message)
    setErrorMessage(error.message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 10000)
  }
  const logout = () => {
    setToken(null)
    localStorage.clear()
    // Clears cache, which might contain stuff only user has access to
    client.resetStore()
  }
  const [login] = useMutation(LOGIN, {
    onError: handleError
  })
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
  const errorNotification = () => errorMessage &&
  <div style={{ color: 'red' }}>
    {errorMessage}
  </div>
  
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
        {token ? <button onClick={() => setPage('add')}>add book</button> : <div></div>}
        {token ?
          <button onClick={() => logout()}>logout</button> :
          <button onClick={() => setPage('login')}>login</button>
        }
      </div>

      <Authors 
        result={authors}
        show={page === 'authors'}
        setBorn={setBorn}
        token={token}

      />

      <Books result = {books}
        show={page === 'books'}
      />
      <NewBook 
        show={page === 'add'}
        addBook = {addBook}
      />
      <LoginForm
        show={page=== 'login'}
        login={login}
        setToken={(token) => setToken(token)}
        errorNotification={errorNotification}
        setPage={setPage}
      />

    </div>
  )
}

export default App