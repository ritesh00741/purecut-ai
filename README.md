# PureCut AI — High-Precision Background Removal & Studio SaaS

PureCut AI is a modern, production-grade AI background removal and image editing studio built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**. It isolates fine hair, fur, transparent surfaces, and products 100% automatically in seconds with zero clutter.

---

## 🚀 Key Features

- **Pixel-Accurate AI Segmentation**: Edge-aware alpha matting that cleanly isolates hair, fur, and delicate contours without harsh artifacts or halos.
- **Interactive Before / After Comparison Slider**: Live touch & mouse comparison with draggable divider.
- **Custom Studio Backdrops**: Replace transparency with solid colors, vibrant gradients, or photorealistic studio scenes.
- **Fine-Tuning Controls**: Real-time edge feathering (0–6px) and studio floor drop shadows with blur & opacity.
- **High-Resolution Exports**: Download lossless transparent PNGs, compressed JPGs, or modern WEBP, plus direct 1-click clipboard image copy for Figma, Photoshop, and Canva.
- **Authentication & User Management**:
  - Email & password sign-up and sign-in with password strength meter.
  - Show/hide password control.
  - Forgot password & password reset flows.
  - Dual-mode authentication: real Supabase Auth integration ready + zero-config local persistence fallback for instant testing.
- **Protected User Dashboard**:
  - Live AI credits balance tracking.
  - History gallery with search, category filtering, batch deletion, inspection modal, and downloads.
  - API keys generator and token revocation.
  - Account profile update, avatar change, password update, and danger zone account deletion.
- **Developer REST API**: Secure endpoints (`/api/remove-background`, `/api/api-keys`, `/api/images`) with code snippets in cURL, JavaScript, and Python.
- **Dark Mode & Responsive UI**: Seamless dark/light theme switching with accessibility and clean neutral backgrounds.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Actions & Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict typing throughout)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom transparency grid and responsive breakpoints
- **Icons**: [Lucide React](https://lucide.dev/)
- **Database & Auth**: [Supabase](https://supabase.com/) (PostgreSQL with Row Level Security)
- **Image Processing**: Canvas 2D Edge-Aware Matting & Alpha Channel Engine

---

## 🚀 Deploy to Vercel

PureCut AI is pre-configured for one-click deployment on [Vercel](https://vercel.com):

1. **Push to your GitHub repository**:
   ```bash
   git remote add origin https://github.com/<your-username>/purecut-ai.git
   git branch -M main
   git push -u origin main
   ```

2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your `purecut-ai` repository.
   - Framework preset will automatically be detected as **Next.js**.

3. **Environment Variables (Optional)**:
   Add any of the following if you want cloud database or Gemini AI features:
   - `GEMINI_API_KEY`: Your Google Gemini API Key (optional, for Gemini Vision tagging).
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL (optional).
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key (optional).

4. **Click Deploy**:
   Vercel will build and deploy your project live with an automatic HTTPS URL.

---

## 📦 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Configure your Supabase credentials (optional for initial local run, required for cloud production sync):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

*Note: If Supabase keys are not set, PureCut AI automatically runs in local persistent demo mode so every feature works out of the box!*

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
npm run build
npm start
```

---

## 🗄️ Database Setup (Supabase PostgreSQL)

To enable cloud persistence and user synchronization:

1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in your Supabase dashboard.
3. Open the file `supabase/schema.sql` from this repository.
4. Paste the entire SQL script and click **Run**.
5. Copy your **Project URL** and **anon public key** from *Project Settings -> API* into your `.env.local`.

---

## 📡 API Usage Example

Remove background via cURL:

```bash
curl -X POST http://localhost:3000/api/remove-background \
  -H "Authorization: Bearer pc_live_demo123" \
  -F "image_file=@sneaker.jpg" \
  -F "format=png" \
  -o cutout.png
```

---

## 🛡️ Security & Privacy

- **Row Level Security (RLS)**: Enforced on all Supabase tables so users can only access their own cutouts and API keys.
- **Service Role Secret Isolation**: Service keys are never imported in client components.
- **Safe Input Validation**: Uploaded files are strictly validated by MIME type (PNG, JPG, WEBP) and size (< 25MB).
- **No Plaintext Passwords**: Cryptographic hashing via Supabase Auth.
