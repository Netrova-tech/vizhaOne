# VizhaOne Mobile App

Next.js static application prepared for Android/iOS packaging with Capacitor.

## Local development

1. Copy `.env.example` to `.env.local` and configure the live API and website URLs.
2. Run `npm install`.
3. Run `npm run dev`.

## Android

1. Install Android Studio and its SDK.
2. Run `npm run cap:add:android` once.
3. Run `npm run cap:android` to build, sync and open Android Studio.

The existing Express backend remains hosted separately. Never place backend secrets in this app.

## Included VizhaOne routes

The complete tested web application is shared through `legacy/` and rendered inside the Next.js mobile shell using hash navigation. This keeps every route reload-safe inside Capacitor:

- Home, About, Categories, FAQ and Blog
- Halls, Hall Details, Services and Service Details
- Calculator and Event Packages
- Login, OTP verification and user session
- Invitation Maker, public invitations and RSVP
- Hashtag Generator and Referral Rewards
- Vendor onboarding and partner plans
- Admin dashboard, analytics and inquiries
- Privacy Policy and Terms

API calls use `NEXT_PUBLIC_API_URL`. Public invitation links use `NEXT_PUBLIC_WEB_URL` so QR codes remain accessible outside the installed app.
