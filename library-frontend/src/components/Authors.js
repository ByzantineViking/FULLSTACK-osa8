import React, { useState } from 'react'
import Select from 'react-select'

const Authors = ({ show, result, setBorn, token }) => {
  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  
  
  const submit = async (event) => {
    event.preventDefault()
    const yearNumber = Number(year)
    const justName = name.value
    await setBorn({
      variables: { justName, yearNumber }
    })
    setYear('')
    setName('')
  }
  if (!show) {
    return null
  }
  if(result.loading) {
    return <div>Authors loading ...</div>
  }
  const authors = result.data.allAuthors
  const nameOption = authors.map(a => ({ value: a.name, label: a.name}) )
  const birthYearForm = (
    <div>
      <div>Set birth year of author</div>
      <form onSubmit={submit}>
        <Select value={name} onChange={({value, label}) => setName({value: value, label: label})} options={nameOption}>

        </Select>
        <div>
          born
          <input value={year} type='number' onChange={({target}) => setYear(target.value)}></input>
        </div>
        <button type='submit'>set</button>
      </form>
    </div>
  )
  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              born
            </th>
            <th>
              books
            </th>
          </tr>
          {authors.map(a =>
            <tr key={a.name}>
              <td>{a.name}</td>
              <td>{a.born}</td>
              <td>{a.bookCount}</td>
            </tr>
          )}
        </tbody>
      </table>
      <div style={{marginTop: "10px"}}></div>
      {token ? birthYearForm: <div>Log in to fill correct birth years.</div>}

    </div>
  )
}

export default Authors