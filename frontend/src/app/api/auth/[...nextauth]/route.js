import NextAuth from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import EmailProvider from 'next-auth/providers/email'
import CredentialsProvider from 'next-auth/providers/credentials'
import { MongoDBAdapter } from '@next-auth/mongodb-adapter'
import clientPromise from '@/lib/mongodb' // Adjust path as needed
import bcrypt from 'bcrypt' // You'll need to install bcrypt

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER, // You'll need to add EMAIL_SERVER to .env.local
      from: process.env.EMAIL_FROM, // You'll need to add EMAIL_FROM to .env.local
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Add your own logic here to find the user from the database
        // For example, using the MongoDB client:
        const client = await clientPromise
        const usersCollection = client.db().collection('users')

        const lowercasedEmail = credentials.email ? credentials.email.toLowerCase() : null;
        if (!lowercasedEmail) {
          // This case should ideally not be reached if NextAuth form validation is in place
          return null;
        }
        const user = await usersCollection.findOne({ email: lowercasedEmail })

        if (user && bcrypt.compareSync(credentials.password, user.password)) {
          // Any object returned will be saved in `user` property of the JWT
          return { id: user._id, name: user.name, email: user.email }
        } else {
          // If you return null then an error will be displayed advising the user to check their details.
          return null
          // You can also Reject this callback with an Error thus the user will be sent to the error page with the error message as a query parameter
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/auth/signin',
    // verifyRequest: '/auth/verify-request', // (Optional) Email verification page
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
