import "server-only";
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                // Dynamic imports to avoid bundling Node-only modules in middleware (Edge)
                const { default: connectToDB } = await import("@/lib/mongodb");
                const { default: User } = await import("@/models/user");
                const { default: bcrypt } = await import("bcryptjs");

                await connectToDB();
                const { email, password } = (credentials || {}) as { email?: string; password?: string };
                if (!email || !password) return null;

                const user = await User.findOne({ email });
                if (!user) return null;
                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) return null;
                return user as any;
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
    callbacks: {
        async session({ session, token }) {
            if (token.sub) {
                session.user.id = token.sub;
            }
            return session;
        }
    }
})