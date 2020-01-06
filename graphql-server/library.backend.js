const { ApolloServer, AuthenticationError, UserInputError, gql } = require('apollo-server')
const { PubSub } = require('apollo-server')
const pubsub = new PubSub()

const mongoose = require('mongoose')
const Book = require('./models/book')
const Author = require('./models/author')
const User = require('./models/user')

const loaders = require('./loaders')
const jwt = require('jsonwebtoken')

const JWT_SECRET = 'hunter2'
//const uuid = require('uuid/v1')

mongoose.set('useFindAndModify', false)

const MONGODB_URI = 'mongodb+srv://Alice:daisyridley@cluster0-e2n8s.mongodb.net/books-app?retryWrites=true&w=majority'
console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true})
    .then( () => {
        console.log('connected to MongoDB')
    })
    .catch( (error) => {
        console.error('error connecting to MongoDB: ', error.message)
    })
// Schema
const typeDefs = gql`
    type User {
        username: String!
        favoriteGenre: String!
        id: ID!
    }
    
    type Token {
        value: String!
    }
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
        me: User
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
        createUser(
            username: String!
            favoriteGenre: String!
        ): User
        login(
            username: String!
            password: String!
        ): Token
    }
    type Subscription {
        bookAdded: Book!
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
            const f = (books) => {
                if(args.genre) {
                    return books.filter(book => book.genres.includes(args.genre))
                } else {
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
        },
        me: (root, args, context) => {
            return context.currentUser
        }
    },
    Author: {
        bookCount: async (root) =>  {
            // We call bookCount x times but loader only executes once
            const books = await loaders.bookCountLoader.load(root._id)
            return books.length
        }
    },
    Mutation: {
        addBook: async (root, args, context) => {
            const existing = await Book.find({ title: args.title})
            const currentUser = context.currentUser
            if(!currentUser) {
                throw new AuthenticationError('not authenticated')
            }
            if(existing.length !== 0) {
                throw new UserInputError('Name must be unique', {
                    invalidArgs: args.title,
                })
            }
            const author = await Author.find({ name: args.author})
            if(author.length === 0){
                const authorForm = new Author({name: args.author})
                try {
                    const addedAuthor = await authorForm.save()
                    const bookForm = new Book({ ...args, author: addedAuthor})
                    try {
                        await bookForm.save()
                        pubsub.publish('BOOK_ADDED', { bookAdded: bookForm})
                        return bookForm
                    } catch (error) {
                        throw new UserInputError( error.message, {
                            invalidArgs: args
                        })
                    }
                } catch (error) {
                    throw new UserInputError('Tried to add new author, but failed, check the author field. ' + error.message, {
                        invalidArgs: args
                    })
                }
            } else {
                const book = {...args, author: author[0]}
                const bookForm = new Book(book)
                try {
                    await bookForm.save()
                } catch (error) {
                    console.error(error.message)
                    throw new UserInputError(error.message, {
                        invalidArgs: args
                    })
                }
                pubsub.publish('BOOK_ADDED', { bookAdded: bookForm})
                return bookForm
            }
        },
        editAuthor: async (root, args, context) => {
            const l = await Author.findOne( { name : {$eq: args.name}})
            const currentUser = context.currentUser
            if(!currentUser) {
                throw new AuthenticationError('not authenticated')
            }
            l.born = args.setBornTo
            try {
                await l.save()
            } catch (error) {
                throw new UserInputError(error.message, {
                    invalidArgs: args
                })
            }
            return l
        },
        createUser: async (root, args) => {
            const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })
            return user
                .save()
                .catch(error => {
                    throw new UserInputError(error.message, {
                        invalidArgs: args,
                    })
                })
        },
        login: async (root, args) => {
            const user = await User.findOne({ username: args.username })
            if ( !user || args.password !== 'hunter2' ) {
                throw new UserInputError("wrong credentials")
            }
            const userForToken = {
                username: user.username,
                id: user._id,
            }
            return { value: jwt.sign(userForToken, JWT_SECRET) }
        }
    },
    Subscription: {
        bookAdded: {
            subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
        },
    },
}


const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
        const auth = req ? req.headers.authorization : null
        if (auth && auth.toLowerCase().startsWith('bearer ')) {
            const decodedToken = jwt.verify(
                auth.substring(7), JWT_SECRET
            )
            const currentUser = await User.findById(decodedToken.id)
            return { currentUser, loaders }
        }
        return { loaders }
    }
})


server.listen().then(({ url, subscriptionsUrl }) => {
    console.log(`Server ready at ${url}`)
    console.log(`Subscriptions ready at ${subscriptionsUrl}`)
})
