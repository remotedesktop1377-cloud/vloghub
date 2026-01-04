import NextAuth from 'next-auth';
import { Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
  ],
  callbacks: {
    async session({ session, token }: { session: Session; token: JWT }): Promise<Session> {
      if (session.user) {
        session.user.id = (token as any).sub || (token as any).email || '';
        session.user.provider = 'google';
      }
      return session;
    },
    async jwt({ token, user, account }: { token: JWT; user?: any; account?: any }): Promise<JWT> {
      if (user) {
        token.id = user.id || user.email || '';
      }
      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = (NextAuth as any)(authOptions);
export { handler as GET, handler as POST };


