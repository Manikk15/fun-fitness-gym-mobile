# GymLog -- Product Requirements Document (PRD)

**Version:** 0.1 (MVP)\
**Status:** Draft\
**Owner:** Manik Sharma

------------------------------------------------------------------------

# Vision

GymLog replaces the traditional workout notebook with a simple mobile
application where trainers publish daily workouts and members track them
digitally.

## Goals

-   Replace paper notebooks
-   Save trainer time
-   Allow members to view daily workouts
-   Track workout completion
-   Keep the MVP simple

------------------------------------------------------------------------

# User Roles

## Trainer

Can:

-   Login
-   Create workout
-   Edit workout
-   Publish workout
-   Manage exercise categories
-   Manage exercise library
-   View member workout completion

## Member

Can:

-   Login
-   View today's workout
-   Mark exercises completed
-   View workout history
-   Update profile

------------------------------------------------------------------------

# Technology Stack

-   React Native (Expo)
-   TypeScript
-   Firebase Authentication
-   Firebase Firestore
-   Firebase Cloud Messaging
-   NativeWind
-   React Navigation

No custom backend for MVP.

------------------------------------------------------------------------

# Navigation Flow

``` text
Splash
   │
   ▼
Login
   │
Firebase Authentication
   │
Role Check
 ┌──────┴────────┐
 ▼               ▼
Trainer      Member
Dashboard    Dashboard
```

------------------------------------------------------------------------

# Trainer Features

## Dashboard

-   Today's Workout
-   Create Workout
-   Exercise Library
-   Categories
-   Members
-   Workout History
-   Profile

## Create Workout Flow

1.  Enter Workout Title
2.  Select Category
3.  Select Exercises
4.  Enter Sets
5.  Enter Reps
6.  Enter Target Weight
7.  Publish Workout

Example

  Exercise        Sets   Reps   Weight
  ------------- ------ ------ --------
  Bench Press        4     10    60 kg
  Cable Fly          3     15    15 kg

------------------------------------------------------------------------

# Exercise Categories

Initially supported:

-   Chest
-   Back
-   Shoulders
-   Legs
-   Biceps
-   Triceps
-   Abs
-   Cardio
-   Compound

Categories should NOT be hardcoded.

Trainer/Admin can create new categories.

------------------------------------------------------------------------

# Exercise Library

Every exercise belongs to one category.

Example

Chest

-   Bench Press
-   Incline Bench Press
-   Cable Fly
-   Machine Press

Back

-   Deadlift
-   Barbell Row
-   Lat Pulldown

Trainer can add new exercises.

------------------------------------------------------------------------

# Member Features

Dashboard

-   Today's Workout
-   Workout History
-   Profile

Workout Screen

Each exercise displays

-   Exercise Name
-   Sets
-   Reps
-   Target Weight
-   Completed Checkbox

Example

Bench Press

-   Sets: 4
-   Reps: 10
-   Weight: 60 kg

☐ Completed

------------------------------------------------------------------------

# Firebase Collections

## users

-   uid
-   name
-   phone
-   role
-   createdAt

## categories

-   id
-   name
-   createdAt

## exercises

-   id
-   categoryId
-   name
-   active
-   createdAt

## workouts

-   id
-   title
-   date
-   createdBy
-   published
-   exercises\[\]

Each exercise contains:

-   exerciseId
-   sets
-   reps
-   weight

## memberProgress

-   memberId
-   workoutId
-   completedExercises
-   completedAt

------------------------------------------------------------------------

# Project Structure

    gymlog-app/

    src/
    ├── assets/
    ├── components/
    ├── screens/
    │   ├── auth/
    │   ├── trainer/
    │   └── member/
    ├── navigation/
    ├── services/
    │   └── firebase/
    ├── hooks/
    ├── context/
    ├── constants/
    ├── types/
    └── utils/

------------------------------------------------------------------------

# Milestone 1

-   Project setup
-   Firebase setup
-   Authentication
-   Navigation
-   Theme
-   Trainer Dashboard
-   Member Dashboard

# Milestone 2

-   Categories
-   Exercise Library
-   Workout Builder

# Milestone 3

-   Workout Publish
-   Member Progress
-   Workout History

# Milestone 4

-   Push Notifications
-   Testing
-   Bug Fixes
-   MVP Release

------------------------------------------------------------------------

# Future Enhancements

-   Workout Templates
-   Exercise Images
-   Exercise Videos
-   Attendance
-   Membership Management
-   Diet Plans
-   Progress Charts
-   AI Recommendations

------------------------------------------------------------------------

# Development Principles

-   Keep the MVP simple.
-   Avoid unnecessary complexity.
-   Do not hardcode categories or exercises.
-   Design for reuse across multiple gyms.
-   Build features only if they provide clear value to trainers or
    members.
