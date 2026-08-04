# Fun Fitness Gym Mobile

A production-oriented Expo and React Native foundation for Fun Fitness Gym. This first milestone establishes app structure and developer tooling only; it intentionally contains no Firebase initialization, authentication, or business logic.

## Included

- Expo SDK 57 with TypeScript and strict type checking
- React Navigation native stack with registered splash, login, admin, and member placeholder screens
- NativeWind with a shared Tailwind palette
- Firebase, React Hook Form, Zod, and resolver dependencies ready for future features
- ESLint and Prettier scripts and configuration
- Feature-first source layout with shared UI, navigation, theme, services, hooks, types, utilities, and constants

## Prerequisites

- Node.js 22.13 or later
- npm 10 or later
- Expo Go on a physical device, or an Android/iOS simulator

## Setup

```bash
npm install
npm start
```

### Firebase configuration

Copy `.env.example` to `.env` and fill it with the public configuration from
your Firebase web app. Expo loads values prefixed with `EXPO_PUBLIC_` when it
starts or bundles the app. Do not place service-account credentials or other
private secrets in this file: public Expo variables are embedded in the client
application.

Then scan the QR code with Expo Go, or use one of the platform commands:

```bash
npm run android
npm run ios
npm run web
```

## Quality commands

```bash
npm run typecheck
npm run lint
npm run format:check
npm run format
```

## Project structure

```text
src/
  features/
    auth/
    workouts/
    exercises/
    members/
    profile/
  shared/
    components/
    services/
    navigation/
    theme/
    hooks/
    types/
    utils/
    constants/
assets/
```

Feature folders own their presentation and future domain/data layers. Shared code is reserved for cross-feature concerns. The app launches on the static `SplashScreen`; the remaining registered screens are placeholders only and are not connected to authentication or role selection yet.

## Next milestone

Add Firebase configuration through environment variables, then build authentication as a separate feature. Do not commit Firebase credentials.

## Existing test users

The approval workflow does not modify existing Firestore user documents. Set an
existing test user's `status` manually in Firestore (for example, `active`) and
promote the first administrator manually with `role: "admin"` and `status:
"active"`. Publish [firestore.rules](./firestore.rules) before testing member
approval or admin management.

## Training plan model

Training plans are assigned only by an active admin through
`currentTrainingPlanType`. The supported types are `compound_full_body`,
`two_muscle_split`, and `single_muscle_split`. Template names and workout items
are admin-configured Firestore data; the app does not automatically progress a
member between plans based on time.

Deploy Firestore rules after reviewing them:

```bash
firebase deploy --only firestore:rules
```
