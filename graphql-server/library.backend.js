const { ApolloServer, UserInputError, gql } = require('apollo-server')
const mongoose = require('mongoose')
const Book = require('./models/book')
const Author = require('./models/author')

const uuid = require('uuid/v1')

mongoose.set('useFindAndModify', false)

const MONGODB_URI = 'mongodb+srv://Alice:daisyridley@cluster0-e2n8s.mongodb.net/books-app?retryWrites=true&w=majority'
console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI, {useNewUrlParser: true})
    .then( () => {
        console.log('connected to MongoDB')
    })
    .catch( (error) => {
        console.error('error connecting to MongoDB: ', error.message)
    })
// Schema
const typeDefs = gql`
    type Author {
        name: String!
        id: ID!
        born: Int
        bookCount: Int!
    }
    type Book {
        title: String!
        published: Int!
        author: Author!
        id: ID!
        genres: [String!]!
    }
    type Query {
        bookCount: Int!
        authorCount: Int!
        allAuthors: [Author!]!
        allBooks(author: String, genre: String): [Book]
    }
    type Mutation {
        addBook(
            title: String!
            published: Int!
            author: String!
            genres: [String!]!
        ): Book
        editAuthor(
            name: String!
            setBornTo: Int!
        ): Author
    }
  
`
// Apollo resolvers, how query is responded to
const resolvers = {
    Query: {
        bookCount: () => Book.collection.countDocuments(),
        authorCount: () => Author.collection.countDocuments(),
        allAuthors: () => Author.find({}),
        allBooks: async (root, args) => {
            const books = await Book.find({}).populate('author')
            console.log(books)
            const f = (books) => {
                if(args.genre) {
                    return books.filter(book => book.genres.includes(args.genre))
                } else {
                    console.log(books)
                    return books
                }
            }
            if(args.author) {
                const selectedAuthor = await Author.find({ name: args.author})
                if(selectedAuthor.length === 0) {
                    throw new UserInputError('Name not found', {
                        invalidArgs: args.title,
                    })
                }
                const a = books.filter(book => String(book.author.id) === selectedAuthor[0].id )
                return f(a)
            } else {
                return f(books)
            }
        }
    },
    Author: {
        bookCount: async (root) =>  {
            const books = await Book.find({ author: root})
            return books.length
        }
    },
    Mutation: {
        addBook: async (root, args) => {
            const existing = await Book.find({ title: args.title})
            if(existing.length !== 0) {
                throw new UserInputError('Name must be unique', {
                    invalidArgs: args.title,
                })
            }
            const author = await Author.find({ name: args.author})
            if(author.length === 0){
                const authorForm = new Author({name: args.author})
                const addedAuthor = await authorForm.save()
                const bookForm = new Book({ ...args, author: addedAuthor})
                return bookForm.save()
            } else {
                const book = {...args, author: author[0]}
                const bookForm = new Book(book)
                return bookForm.save()
            }
        },
        editAuthor: async (root, args) => {
            const l = await Author.findOne( { name : {$eq: args.name}})
            l.born = args.setBornTo
            return l.save()
        }

    }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
})

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`)
})
