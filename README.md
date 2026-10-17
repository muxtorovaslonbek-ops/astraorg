# ASTRA: Your Starry Learning Journey

bu meni yangi yaratmoqchi bolgan ASTRA  nomli platformam uni korinishi intro kirishi rasmlarda korsatilgan sen shiulardan foydalan va xuddi shunday qilib yarat keyin instro kirish ovozli animatsiyali bolsin  rasmlarda keltirilgan fanlar bosganda fan bolimi ochilsin unda funksiyalar bolsin keyin toliq saytga otishni bosganda  shu saytlarni ulaysan bosganda shular chiqsin keyin animatsiyalik bolsin yulduzlar animatsiyasi introda ham sayt orqa fonida ham

📚 Tarix — edusat-uz-tarix.vercel.app

🌍 Geografiya — edusat-uz-geografiya.vercel.app

🫀 Tibbiyot anatomiyasi — edusat-uz-tibbiyot-anatomiya.vercel.app

🧬 Biologiya / Anatomiya — edusat-uz-biologiya.vercel.app/uz

➗ Matematika — MathHub — edusat-matematika.vercel.app

🇬🇧 Ingliz tili —  edusat-english.vercel.app

🇷🇺 Rus tili —  edusat-rustili.vercel.app

⚗️ Kimyo — Chemverse AI — edusat-kimyo.vercel.app

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://astraorg.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/566b7734-e2d0-4206-bb16-36e774bc5de5).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

## Sign-in deployment checklist

- Telegram bot `@talimeduz_bot` requires its site domain registered in BotFather: `/setdomain` → select the bot → enter `astraorg.lovable.app` for the published Lovable app, or the actual Vercel hostname when testing there. Telegram currently rejects the preview hostname.
- Server-only Telegram values are `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_USERNAME`; never prefix the token with `VITE_`.
- Email signup retains confirmation. Password recovery returns to `/auth/reset`; allow that full URL for each deployment in Lovable Cloud auth redirect settings.
- Google uses managed Lovable Cloud sign-in. A separately owned backend on Vercel needs its own supported provider configuration; do not assume managed credentials or Cloud's private service key can be exported.
- A Vercel deployment must run the full TanStack Start server, not serve a static `dist` directory, because Telegram login requires server functions. Validate its deployment target separately before claiming Vercel sign-in works.
- Administrator access comes from the protected role table. The requesting account currently has only the user role; use an authorized administrator account to test approvals.

## Local development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
