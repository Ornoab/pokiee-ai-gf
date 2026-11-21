# POKIEE — সম্পূর্ণ Project

POKIEE হলো Bangla/English emotional-support companion। এটি কোনো চিকিৎসক বা therapist নয়।

## GitHub-এ কী Upload করবে

এই ZIP Extract করলে `POKIEE-FULL-PROJECT` নামে একটি folder পাবে। **Folder-এর ভেতরের সব file ও folder** তোমার GitHub repository `Ornoab/pokiee`-এর root-এ Upload করবে। বাইরের `POKIEE-FULL-PROJECT` folder-টি নিজে Upload করবে না। পুরোনো একই নামের file replace করতে বললে replace করবে।

অবশ্যই থাকবে:
- `.github/workflows/deploy.yml`
- `src/` (ভেতরের সব file সহ)
- `supabase/functions/chat/index.ts`
- `index.html`, `package.json`, `vite.config.ts`
- সব `tsconfig` file

তারপর Commit changes করো। Actions-এ Build and Deploy POKIEE green হলে GitHub Pages থেকে site live হবে।

## 1. GitHub Pages
Repository → Settings → Pages → Build and deployment → Source: **GitHub Actions**।

এই project-এর Vite base path `/pokiee/`; repository নাম `pokiee` অপরিবর্তিত রাখবে।

## 2. Gemini API key
1. https://aistudio.google.com/apikey এ গিয়ে Gemini API key তৈরি করো।
2. Key কাউকে পাঠাবে না, GitHub code-এ লিখবে না।

Gemini free-tier availability, limits ও model access Google পরিবর্তন করতে পারে; তাই সম্পূর্ণ unlimited free ব্যবহারের নিশ্চয়তা নেই।

## 3. Supabase
1. https://supabase.com এ project তৈরি করো।
2. Project Settings → API থেকে Project URL এবং anon/public key কপি করো।
3. Project → Edge Functions-এ `chat` নামে function deploy করতে হবে। এই ZIP-এর `supabase/functions/chat/index.ts` function source।
4. Supabase Function secrets-এ `GEMINI_API_KEY` নামে Gemini key save করো।
5. Function deploy করো। Supabase Dashboard-এর Edge Functions UI-তে source editor/deploy সুবিধা না থাকলে Supabase CLI/Cloud development environment লাগতে পারে; শুধু GitHub Pages দিয়ে Edge Function deploy হয় না।

## 4. GitHub Actions secrets
Repository → Settings → Secrets and variables → Actions → New repository secret:
- `VITE_SUPABASE_URL` = Supabase Project URL
- `VITE_SUPABASE_ANON_KEY` = Supabase anon/public key

তারপর workflow পুনরায় চালাতে Actions → Build and Deploy POKIEE → Run workflow।

**কখনো `GEMINI_API_KEY` GitHub-এর `VITE_` secret হিসেবে দেবে না।** এটি শুধু Supabase Edge Function secret।

## 5. Browser use
Chrome-এ microphone permission allow করো। Voice input browser support-এর উপর নির্ভর করে। Text reply-ও থাকবে; voice on থাকলে browser speech synthesis দিয়ে পড়ে শোনাবে। নরম/feminine voice কোনটি পাওয়া যাবে তা device/browser-এর installed voices-এর উপর নির্ভরশীল।

Chat history এই device/browser-এর localStorage-এ থাকে; অন্য device-এ sync হয় না। Clear chat চাপলে এই browser-এর history মুছে যাবে।

## Privacy and safety
এই prototype-এ chat history local browser-এ রাখা হয় এবং AI reply-এর জন্য message Supabase function হয়ে Gemini-তে পাঠানো হয়। সংবেদনশীল তথ্য শেয়ার কোরো না। POKIEE emotional support দিতে পারে, কিন্তু জরুরি সহায়তা বা পেশাদার চিকিৎসার বিকল্প নয়।
