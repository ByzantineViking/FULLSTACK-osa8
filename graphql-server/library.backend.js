const { ApolloServer, UserInputError, gql } = require('apollo-server')
const uuid = require('uuid/v1')
let authors = [
  {
    name: 'Robert Martin',
    id: "afa51ab0-344d-11e9-a414-719c6709cf3e",
    born: 1952,
  },
  {
    name: 'Martin Fowler',
    id: "afa5b6f0-344d-11e9-a414-719c6709cf3e",
    born: 1963
  },
  {
    name: 'Fyodor Dostoevsky',
    id: "afa5b6f1-344d-11e9-a414-719c6709cf3e",
    born: 1821
  },
  { 
    name: 'Joshua Kerievsky', // birthyear not known
    id: "afa5b6f2-344d-11e9-a414-719c6709cf3e",
  },
  { 
    name: 'Sandi Metz', // birthyear not known
    id: "afa5b6f3-344d-11e9-a414-719c6709cf3e",
  },
]

/*
 * It would be more sensible to assosiate book and the author by saving 
 * the author id instead of the name to the book.
 * For simplicity we however save the author name.
*/

let books = [
  {
    title: 'Clean Code',
    published: 2008,
    author: 'Robert Martin',
    id: "afa5b6f4-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Agile software development',
    published: 2002,
    author: 'Robert Martin',
    id: "afa5b6f5-344d-11e9-a414-719c6709cf3e",
    genres: ['agile', 'patterns', 'design']
  },
  {
    title: 'Refactoring, edition 2',
    published: 2018,
    author: 'Martin Fowler',
    id: "afa5de00-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring']
  },
  {
    title: 'Refactoring to patterns',
    published: 2008,
    author: 'Joshua Kerievsky',
    id: "afa5de01-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'patterns']
  },  
  {
    title: 'Practical Object-Oriented Design, An Agile Primer Using Ruby',
    published: 2012,
    author: 'Sandi Metz',
    id: "afa5de02-344d-11e9-a414-719c6709cf3e",
    genres: ['refactoring', 'design']
  },
  {
    title: 'Crime and punishment',
    published: 1866,
    author: 'Fyodor Dostoevsky',
    id: "afa5de03-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'crime']
  },
  {
    title: 'The Demon',
    published: 1872,
    author: 'Fyodor Dostoevsky',
    id: "afa5de04-344d-11e9-a414-719c6709cf3e",
    genres: ['classic', 'revolution']
  },
]
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
        author: String!
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
    bookCount: () => books.length,
    authorCount: () => authors.length,
    allAuthors: () => authors,
    allBooks: (root, args) => {
        const a = books.filter(book => book.author === args.author )
        const b = books
        const f = (books) => {
            if(args.genre) {
                return books.filter(book => book.genres.includes(args.genre))
            } else {
                return books
            }
        }
        if(args.author) {
            return f(a)
        } else {
            return f(b)
        }
    }
  },
  Author: {
        bookCount: (root, args) =>  books.filter(book => book.author === root.name).length
  },
  Mutation: {
        addBook: (root, args) => {
            const book = { ...args, id: uuid() }
            if(books.find(book => book.title === args.title)) {
                throw new UserInputError('Name must be unique', {
                    invalidArgs: args.title,
                })
            }
            books = books.concat(book)
            if(!authors.find(author => author.name === args.author)){
                const author = {
                    name: args.author,
                    id: uuid()
                }
                authors = authors.concat(author)
                return book
            } else {
                return book
            }
        },
        editAuthor: (root, args) => {
            const author = authors.find(a => a.name === args.name)
            if (!author) {
                return null
            }

            const updatedAuthor = { ...author, born: args.setBornTo }
            authors = authors.map(a => a.name === args.name ? updatedAuthor : a)
            return updatedAuthor
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
