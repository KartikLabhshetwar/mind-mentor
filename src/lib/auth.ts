import { AuthOptions, DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectMongoDB } from "@/lib/mongodb";
import User from "@/models/user";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
    };
    token?: string;
  }
}

// Extend JWT type
declare module "next-auth/jwt" {
  interface JWT {
    _id: string;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectMongoDB();
          const user = await User.findOne({ email: credentials.email });

          if (!user) {
            return null;
          }

          const passwordsMatch = await bcrypt.compare(credentials.password, user.password);

          if (!passwordsMatch) {
            return null;
          }

          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
          };
        } catch (error) {
          console.error("Error during authentication:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      // Create a JWT for agent API calls
      const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
      session.token = await new SignJWT({ id: token.id })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("30d")
        .sign(secret);
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
};