import NextAuth from 'next-auth';
import { Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import GoogleProvider from 'next-auth/providers/google';
import { createHash } from 'crypto';

function generateUUIDFromEmail(email: string): string {
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  const hash = createHash('sha1')
    .update(namespace + email.toLowerCase())
    .digest('hex');
  
  return [
    hash.substring(0, 8),
    hash.substring(8, 12),
    '5' + hash.substring(13, 16),
    ((parseInt(hash.substring(16, 18), 16) & 0x3f) | 0x80).toString(16) + hash.substring(18, 20),
    hash.substring(20, 32),
  ].join('-');
}

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
        session.user.id = (token as any).id || (token as any).jti || '';
        session.user.provider = (token as any).provider;
      }
      return session;
    },
    async jwt({ token, user, account }: { token: JWT; user?: any; account?: any }): Promise<JWT> {
      if (user) {
        if (user.email) {
          token.id = generateUUIDFromEmail(user.email);
        } else {
          token.id = user.id || (token as any).jti || '';
        }
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


