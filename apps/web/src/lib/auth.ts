import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import AzureADProvider from 'next-auth/providers/azure-ad'
import EmailProvider from 'next-auth/providers/email'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { PrismaClient } from '@prisma/client'
import { Resend } from 'resend'

const prisma = new PrismaClient()

// Initialize Resend for magic link emails
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Google OAuth - for personal accounts
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile',
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          include_granted_scopes: 'true'
        }
      }
    }),

    // Microsoft Azure AD - for school accounts (.edu)
    ...(process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET ? [
      AzureADProvider({
        clientId: process.env.AZURE_AD_CLIENT_ID,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
        tenantId: 'common', // Allows any Microsoft account (personal + work/school)
        authorization: {
          params: {
            scope: 'openid email profile User.Read',
          }
        }
      })
    ] : []),

    // Magic Link (Passwordless) - for .edu emails
    ...(process.env.RESEND_API_KEY ? [
      EmailProvider({
        from: process.env.EMAIL_FROM || 'Studiora <onboarding@resend.dev>',
        sendVerificationRequest: async ({ identifier: email, url }) => {
          // Optional: Restrict to .edu emails
          const isEduEmail = email.toLowerCase().endsWith('.edu')

          if (!resend) {
            console.error('Resend not configured')
            throw new Error('Email service not configured')
          }

          try {
            await resend.emails.send({
              from: process.env.EMAIL_FROM || 'Studiora <onboarding@resend.dev>',
              to: email,
              subject: 'Sign in to Studiora',
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
                  <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <div style="text-align: center; margin-bottom: 32px;">
                      <img src="https://studiora.io/logos/logo-blue.svg" alt="Studiora" style="height: 40px;">
                    </div>
                    <h1 style="color: #1e3a5f; font-size: 24px; margin-bottom: 16px; text-align: center;">
                      Sign in to Studiora
                    </h1>
                    <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 32px; text-align: center;">
                      Click the button below to sign in to your account. This link will expire in 24 hours.
                    </p>
                    <div style="text-align: center; margin-bottom: 32px;">
                      <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                        Sign In
                      </a>
                    </div>
                    <p style="color: #94a3b8; font-size: 14px; text-align: center;">
                      If you didn't request this email, you can safely ignore it.
                    </p>
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">
                    <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                      Studiora - Smart schedule. Smart study. Smart semester.
                    </p>
                  </div>
                </body>
                </html>
              `,
              text: `Sign in to Studiora\n\nClick this link to sign in: ${url}\n\nThis link will expire in 24 hours.\n\nIf you didn't request this email, you can safely ignore it.`
            })
          } catch (error) {
            console.error('Failed to send verification email:', error)
            throw new Error('Failed to send verification email')
          }
        }
      })
    ] : []),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          provider: account.provider,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image
          }
        }
      }
      return token
    },
    async session({ session, token, user }) {
      // When using database sessions (adapter), user comes from DB
      if (user) {
        session.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image
        } as any
      } else if (token) {
        // JWT fallback
        session.user = token.user as any
        session.accessToken = token.accessToken as string
        session.refreshToken = token.refreshToken as string
      }
      return session
    },
    async signIn({ user, account }) {
      // Optional: Add .edu email restriction for magic links
      // Uncomment to enforce:
      // if (account?.provider === 'email' && user.email) {
      //   if (!user.email.toLowerCase().endsWith('.edu')) {
      //     return '/auth/error?error=EmailNotAllowed'
      //   }
      // }
      return true
    }
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  session: {
    strategy: 'database', // Use database sessions for magic link support
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
}
