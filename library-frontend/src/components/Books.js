import React from 'react'

const Books = ({ result, show, filter, setFilter }) => {
  if (!show) {
    return null
  }

  const books = result.data.allBooks
  const genres = [...new Set(books.map(b => b.genres).flat())]
  return (
    <div>
      <h2>books</h2>

      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              author
            </th>
            <th>
              published
            </th>
          </tr>
          {books
            .filter(a => 
              filter ? a.genres.includes(filter) : true
            ) 
            .map(a =>
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          )}
        </tbody>
      </table>
      <div>
        {genres.map(g => 
          <button key={g} onClick={() => setFilter(g)}>{g}</button>
        )}
      </div>
    </div>
  )
}

export default Books