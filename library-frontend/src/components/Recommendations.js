import React from 'react'

const Recommendations = ({show, books, me}) => {
    console.log(me)

    const genre = me.data.me.favoriteGenre
    
    console.log(genre)
    if(!show) {
        return null
    }
    return (
        <div>
            Recommendations based on your favorite genre <b>{genre}</b>
            {books
                .filter( b =>  b.genres.includes(genre))
                .map(a =>
                    <tr key={a.title}>
                      <td>{a.title}</td>
                      <td>{a.author.name}</td>
                      <td>{a.published}</td>
                    </tr>
                )
            }
        </div>
    )
}


export default Recommendations
