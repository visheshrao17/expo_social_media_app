# Social Media App

A modern, Neo-Brutalist style Social Media application built with React Native (Expo) and Supabase.

## 🚀 Features

- **Authentication:** Secure user signup and login handled by Supabase Auth.
- **Neo-Brutalist Design:** Bold, high-contrast UI with thick borders and striking colors.
- **Feed & Interactions:** View user posts in a scrolling feed and "like" posts in real-time.
- **Camera & Gallery:** Take photos directly within the app or upload images from your device gallery.
- **Profiles:** Manage your user profile and view a gallery grid of all your previous posts.
- **Cloud Storage:** Images are securely uploaded and retrieved using Supabase Storage buckets.

## 🛠️ Tech Stack

- **Frontend:** React Native, Expo, React Navigation, React Native Paper
- **Backend & Database:** Supabase (PostgreSQL)
- **File Storage:** Supabase Storage
- **Authentication:** Supabase Auth

## 📦 Prerequisites

Before running the project locally, ensure you have the following installed:
- Node.js (v18 or newer recommended)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- A Supabase account and project

## ⚙️ Environment Setup

1. Create a `.env` file in the root of the project.
2. Add your Supabase URL and Anon Key. The file should look like this:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 🗄️ Supabase Configuration

This project requires a specific database schema and storage bucket to function correctly. 

### Database Schema

Run the following in your Supabase SQL Editor:

```sql
-- Profiles Table
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text unique not null,
    email text not null,
    created_at timestamptz default timezone('utc', now()) not null
);

-- Posts Table
create table public.posts (
    id bigint generated always as identity primary key,
    user_id uuid not null references public.profiles(id) on delete cascade,
    image_url text not null,
    caption text,
    created_at timestamptz default timezone('utc', now()) not null
);

-- Likes Table
create table public.likes (
    id bigint generated always as identity primary key,
    post_id bigint not null references public.posts(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamptz default timezone('utc', now()) not null,
    unique(post_id, user_id)
);
```

### Storage Setup

1. Create a storage bucket named `instabucket`.
2. Make the bucket **Public**.
3. Create Row Level Security (RLS) policies for `storage.objects` to allow authenticated users to `INSERT` and `DELETE`, and the public to `SELECT`.

## 🏃‍♂️ Running the App

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the Expo development server:
   ```bash
   npx expo start -c
   ```

3. Open the app:
   - Press **`a`** to open in Android Emulator
   - Press **`i`** to open in iOS Simulator
   - Scan the QR code with the **Expo Go** app on your physical device.
