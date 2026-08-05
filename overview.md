# RS Gym App - Workout Assignment Architecture (V1)

> Goal: Keep the application simple so any local gym trainer can use it without technical knowledge.

---

# Philosophy

The trainer should **not** create new workout plans every day.

Instead:

1. Create master workout templates once.
2. Create exercise library once.
3. Open a member.
4. Select a workout template.
5. Choose exercises, sets, reps and weights.
6. Assign.
7. Repeat tomorrow.

The app should match the trainer's real workflow.

---

# System Flow

```
Master Data (One Time)

        │

        ▼

Workout Masters
Exercise Library

        │

        ▼

Trainer

        │

        ▼

Open Member

        │

        ▼

Select Workout Master

        │

        ▼

Choose Exercises

        │

        ▼

Add Sets/Reps/Weight

        │

        ▼

Assign

        │

        ▼

Member sees today's workout
```

---

# 1. Master Data

Created only once by Admin.

## Workout Masters

```
Compound

- Compound 1
- Compound 2
- Compound 3

Dual Muscle

- Dual 1
- Dual 2
- Dual 3

Single Muscle

- Chest
- Back
- Legs
- Shoulder
- Biceps
- Triceps

Cardio
```

These are reusable templates.

---

## Exercise Categories

```
Chest
Back
Shoulders
Legs
Biceps
Triceps
Core
Cardio
Functional
Stretching
```

---

## Workout Library

```
Chest

Bench Press
Incline Bench
Machine Press
Cable Fly
Pec Deck

Back

Lat Pulldown
Barbell Row
Cable Row

Legs

Squat
Leg Press
Leg Extension

Shoulders

Shoulder Press
Arnold Press

Cardio

Running
Walking
Cycling
Treadmill

Functional

Walking Lunges
Farmer Walk

Core

Crunches
Plank
Leg Raise
```

Created once.

Never recreated.

---

# 2. Trainer Daily Workflow

Trainer opens

```
Members
```

↓

```
Rahul
```

↓

```
Assign Workout
```

↓

Select

```
Compound 1
```

Now trainer prepares Rahul's workout.

Example

```
Running
Duration : 5 min

Bench Press
3 Sets
10 Reps
30 kg

Lat Pulldown
3 Sets
12 Reps
25 kg

Running
3 min

Walking Lunges
2 Rounds

Shoulder Press
3 x 10

Crunches
3 x 20
```

↓

Click

```
Assign
```

Done.

---

# Another Member

Trainer opens

```
Amit
```

↓

```
Compound 1
```

Trainer chooses different exercises.

```
Running

Machine Chest Press

Cable Row

Leg Press

Shoulder Machine

Plank
```

Same master.

Different member workout.

---

# Important Rule

Master Workout

```
Compound 1
```

DOES NOT store

- Exercise
- Weight
- Sets
- Reps

Those are selected during assignment.

This allows every member to have a personalized workout.

---

# Member View

Rahul opens app.

```
Today's Workout

□ Running

□ Bench Press

□ Lat Pulldown

□ Running

□ Walking Lunges

□ Shoulder Press

□ Crunches
```

Simple.

No editing.

---

# Workout History

Every assignment automatically becomes history.

Example

```
Rahul

History

5 Aug

Compound 1

----------------

6 Aug

Compound 2

----------------

7 Aug

Dual 1

----------------

8 Aug

Cardio
```

Opening any history shows

```
Bench Press

3 x 10

30kg

Completed
```

---

# Database Collections

## workout_masters

```
id
name

Compound 1
Compound 2
Dual 1
Chest
Back
...
```

---

## exercise_categories

```
id

Chest
Back
Legs
Cardio
Core
Functional
```

---

## exercise_library

```
id
categoryId
name

Bench Press

Running

Walking Lunges

Crunches

...
```

---

## member_workouts

```
id
memberId
masterWorkoutId
trainerId
date
status
```

---

## member_workout_items

```
id
memberWorkoutId

exerciseId

sets

reps

weight

duration

distance

order

notes
```

---

# Future Features

The architecture supports:

- Attendance
- Membership
- Diet Plans
- Progress Photos
- Body Measurements
- Reports
- AI Suggestions

without redesigning the database.

---

# Future Improvement

While assigning workout

```
Compound 2

☑ Copy Previous Workout

or

○ Start Fresh
```

Copy Previous should automatically load

- exercises
- sets
- reps
- weights

Trainer changes only what's required.

This saves time.

---

# Final Workflow

```
Admin

↓

Create Workout Masters

↓

Create Exercise Library

===============================

Trainer

↓

Open Member

↓

Assign Workout

↓

Select Master

↓

Choose Exercises

↓

Sets

↓

Reps

↓

Weight

↓

Assign

===============================

Member

↓

View Today's Workout

↓

Complete Workout

===============================

System

↓

Store History
```

---

# Core Principle

**Master Data = Structure**

**Member Workout = Personalization**

Never modify master data for individual members.

Always personalize during assignment.
