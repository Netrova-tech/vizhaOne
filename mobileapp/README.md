# VizhaOne Mobile App

Next.js static application prepared for Android/iOS packaging with Capacitor.

## Android web updates

The app uses the Capacitor 7 Capawesome Live Update plugin with self-hosted, RSA-signed ZIP bundles. Updates download after the app renders and on foreground checks (at most once per 15 minutes). They take effect on the next cold launch, without interrupting forms or bookings. Offline devices continue using their installed files. If an updated app fails to signal readiness within 30 seconds, the plugin restores the APK's bundled web files and blocks that failed bundle.

**One initial Play Store release is required:** versionCode 22 / versionName 1.21 introduces this native plugin. Existing version 21 installations cannot receive these updates. Native plugins, permissions, Gradle settings and Capacitor native configuration still require a new Play release; increment versionCode whenever the native layer changes. Web releases target exactly one versionCode.

### Signing key

The initial key pair has been created locally. Commit `web-update-public.pem` with the app. Back up `.web-update-keys/private.pem` securely outside the repository. It is ignored by Git and must never be included in a ZIP, backend image or public hosting. This is a separate key from the Play Store upload keystore. CI may supply the private key path via `WEB_UPDATE_PRIVATE_KEY`. Do not run the `init` command to replace keys for an existing installation: changing the trusted public key requires a new APK.

### Publish a UI/JavaScript release

1. Keep native dependencies and configuration identical to the Android version receiving the update. Test the UI changes, then run from `mobileapp`:
   ```powershell
   npm run web:release -- https://vizhaone-backend-450892873561.asia-south1.run.app/api/web-updates/
   ```
   This builds the static app and writes a signed ZIP plus `latest.json` into `web-releases/<versionCode>/`. The ZIP contains the contents of `out/`, with `index.html` at its root.
2. Copy that version directory into `backend/src/web-updates/` and deploy the backend image from this prepared local source. Its existing Dockerfile includes `src/`; the new `/api/web-updates` static route serves these files. For Git-triggered Cloud Build deployments, the release artifacts must be supplied to the build context too; local ignored files are not included in a Git-triggered build. Keep prior version directories available for older installed apps.
3. For separate HTTPS object hosting/CDN, build the initial APK with `NEXT_PUBLIC_WEB_UPDATE_URL` set to the hosting directory and pass the same directory URL to `web:release`. Upload the ZIP before replacing `<versionCode>/latest.json`. Serve manifests with `Cache-Control: no-store`, allow the app's origin for manifest fetches, and keep ZIP URLs immutable.
4. Open an installed version 22 app, let it finish downloading, fully close it and reopen. Confirm the changed screen, authentication, booking flow and native plugins on a real device. Re-publishing a previous tested manifest rolls users back on their next download/restart; do not reuse a failed bundle ID.

The hosting/deployment steps are required before devices receive updates. The updater safely ignores missing manifests. The existing Google Play update prompt remains in place for native releases.

Reference: [Capawesome Live Update](https://capawesome.io/docs/sdks/capacitor/live-update/).

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


## Android Firebase push notifications

The app uses Firebase Cloud Messaging (FCM) for push delivery and the existing signed-in account token to securely register each device. Firebase Authentication remains responsible for Google sign-in.

- In Profile, tap **Enable notifications** and accept Android's permission prompt. Permission is requested only after that tap.
- Booking status changes from the admin and provider flows send a push to the customer's registered devices. In the foreground an in-app alert appears; tapping a background notification opens Bookings.
- Turning notifications off, signing out, or deleting the account unregisters the device. Enable notifications again after signing in.
- Web preview does not receive native pushes. This integration targets the existing Android project; iOS FCM integration is not included.

Deployment:

1. Run `npm run db:migrate` from `backend` to create `push_devices` (and the daily activity tables).
2. Keep `android/app/google-services.json` for Firebase project `vizhaone`, package `com.vizhaone.app`.
3. Set `FIREBASE_PROJECT_ID=vizhaone` on the backend. Enable the Firebase Cloud Messaging API and grant the backend runtime service account the Firebase Cloud Messaging API Admin role in that project. Cloud Run uses Application Default Credentials; local development can use `GOOGLE_APPLICATION_CREDENTIALS` pointing to a service-account file outside the app. Never bundle server credentials in Android assets.
4. From `mobileapp`, run `npm install`, `npm run build`, then `npx cap sync android`. Build and install the new Android release.
5. On a physical Android device, sign in, enable notifications in Profile, put the app in the background, and update one of that customer's bookings using an admin/provider account. Verify delivery and that tapping the notification opens Bookings. Repeat in the foreground, after opt-out, and after logout to check handling and cleanup.

Backend device endpoints are `POST /api/notifications/devices` and `DELETE /api/notifications/devices`; both require the signed-in account bearer token and ignore client-supplied user IDs. Unregistered FCM tokens are removed after delivery failures.

References: [Capacitor 7 push notifications](https://capacitorjs.com/docs/v7/apis/push-notifications), [Firebase server authorization](https://firebase.google.com/docs/cloud-messaging/auth-server).


## Automatic Google Play update prompt

The Android app checks Google Play on launch and when returning to the foreground (with a 30-second debounce). When Google Play reports an update available to the current user, a dialog offers **Update now** or **Later**, on every app screen including sign-in, admin, and provider screens. Update now opens this app's Google Play listing. Offline or unsupported installations continue opening normally. Dismissing the prompt does not permanently hide future reminders.

This uses `@capawesome/capacitor-app-update` for Capacitor 7 and no longer depends on manually setting `ANDROID_LATEST_VERSION_CODE` for this app's prompt. The existing backend config endpoint remains available for older app releases.

Publish a new Android release containing this change first, then increase `versionCode` for each later Play Store release. The prompt appears only once Google Play makes the newer release available to that user, including rollout and testing-track eligibility. Test through a Google Play testing track or internal app sharing using an older installed build and a newer published build with the same application ID/signing setup. Sideloaded debug builds are not a reliable test of Play update availability.

References: [App Update plugin](https://capawesome.io/docs/sdks/capacitor/app-update/), [Google Play in-app update testing](https://developer.android.com/guide/playcore/in-app-updates/test).


## Signing a Play Store release

Use the existing upload keystore for `com.vizhaone.app`.

- **Android Studio:** Build > Generate Signed Bundle / APK > Android App Bundle, select your existing keystore, and enter its passwords and alias.
- **Command line:** Copy `android/release-key.properties.example` to `android/release-key.properties`, fill all four values locally, then run `./gradlew.bat bundleRelease` from `mobileapp/android`. Use forward slashes in Windows paths. Relative keystore paths are resolved from `android/`.

The local properties file and keystores are ignored by Git. Do not commit passwords. A missing or incomplete signing configuration now produces a clear error before release compilation instead of an empty signing configuration failing at `signReleaseBundle`. Debug builds do not require release credentials. The signed bundle is written to `android/app/build/outputs/bundle/release/app-release.aab`.

For an already published app, keep using the existing upload key. If it is lost, use the Play Console upload-key reset procedure before changing keys. See [Android app signing](https://developer.android.com/studio/publish/app-signing).
