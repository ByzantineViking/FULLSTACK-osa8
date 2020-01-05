import React, { useEffect } from 'react'
const Recommendations = ({show, books, me, client, FILTERED_BOOKS, favoriteBooks, setFavoriteBooks, handleError}) => {
    const fetchBooks = async () => {
        if(me.loading || !show)
            return null
        console.log(me)
        const genre = me.data.me.favoriteGenre
        const { data } = await client.query({
            query: FILTERED_BOOKS,
            variables: { myFavorite: genre},
            onError: handleError,
        })
        setFavoriteBooks(data.allBooks)
    }
    useEffect( () => {
        fetchBooks()
    })
    if (!show) 
        return null
    
    
    
    /*Filtering done with react
    if (me.loading) 
        return null
    const genre = me.data.me.favoriteGenre
    const bookData = books.data.allBooks
    const footer = {
        marginTop: "20px"
    }
        return (
            <div>
                <div style={footer} ></div>
                Recommendations based on your favorite genre <b>{genre}</b>
                <div style={footer} ></div>
                <table>
                    <tbody>
                        {bookData
                            .filter( b =>  b.genres.includes(genre))
                            .map(a =>
                                <tr key={a.title}>
                                <td>{a.title}</td>
                                <td>{a.author.name}</td>
                                <td>{a.published}</td>
                                </tr>
                        )
                        }
                    </tbody>
                </table>
            </div>
        )
    }*/

    // Filtering done with GraphQL
    return(
        <div>
            <table>
                    <tbody>
                        {favoriteBooks
                            .map(a =>
                                <tr key={a.title}>
                                <td>{a.title}</td>
                                <td>{a.author.name}</td>
                                <td>{a.published}</td>
                                </tr>
                        )
                        }
                    </tbody>
                </table>
        </div>
    )

    
}


export default Recommendations
