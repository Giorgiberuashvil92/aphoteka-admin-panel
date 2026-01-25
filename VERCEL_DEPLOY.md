# Vercel Deployment - სწრაფი გზამკვლევი

## მეთოდი 1: Vercel Dashboard (რეკომენდებული)

### ნაბიჯები:

1. **GitHub/GitLab/Bitbucket-ზე ატვირთეთ კოდი:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Aphoteka Admin Panel"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/aphoteka-admin.git
   git push -u origin main
   ```

2. **Vercel-ზე გადადით:**
   - გადადით [vercel.com](https://vercel.com)
   - Sign up/Login GitHub-ით
   - დააკლიკეთ "Add New Project"

3. **Import Project:**
   - აირჩიეთ თქვენი repository
   - Vercel ავტომატურად გაიგებს Next.js project-ს
   - დააკლიკეთ "Deploy"

4. **Deployment ავტომატურად დაიწყება!**

## მეთოდი 2: Vercel CLI

### ინსტალაცია:

```bash
npm i -g vercel
```

### Deploy:

```bash
# პროექტის დირექტორიაში
cd /Users/gioberuashvili/Desktop/aphoteka-admin

# Login Vercel-ზე
vercel login

# Deploy
vercel

# Production deploy
vercel --prod
```

## Build Status

✅ **Build Test**: წარმატებით გავიდა
- ✓ Compiled successfully
- ✓ TypeScript check passed
- ✓ All pages generated

## Project Structure

პროექტი მზადაა deployment-ისთვის:
- ✅ `next.config.ts` - კონფიგურირებულია
- ✅ `vercel.json` - Vercel კონფიგურაცია
- ✅ `.vercelignore` - Ignore ფაილები
- ✅ `package.json` - Build scripts მზადაა

## Environment Variables (თუ საჭიროა)

თუ გაქვთ API endpoints ან სხვა secrets:

1. Vercel Dashboard → Project Settings → Environment Variables
2. დაამატეთ:
   - `NEXT_PUBLIC_API_URL` (თუ გაქვთ)
   - სხვა API keys

## Post-Deployment

Deployment-ის შემდეგ:
1. შეამოწმეთ რომ საიტი მუშაობს
2. შეამოწმეთ ყველა routes
3. შეამოწმეთ dark mode
4. შეამოწმეთ responsive design

## Custom Domain

თუ გსურთ custom domain:
1. Project Settings → Domains
2. დაამატეთ domain
3. დაამატეთ DNS records

## Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
