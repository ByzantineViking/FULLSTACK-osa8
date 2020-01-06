const DataLoader = require('dataloader')
const Book = require('./models/book')
const loaders = {
    /* This takes the multiple calls for bookCountLoaders,
    and only when ready, aka with all the different id:s
    then does the sorting */
    bookCountLoader: new DataLoader( async (authorIds) => {
        // All the books which have one of the authors
        const books = await Book.find({ author: authorIds })
        const h = authorIds.map(authorId => books.filter(b => String(b.author) === String(authorId)))
        return h
    })
}

module.exports = loaders