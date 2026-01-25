# Vercel Deployment ინსტრუქციები

## მზადება Deployment-ისთვის

### 1. Git Repository-ს შექმნა/განახლება

```bash
# თუ Git repository არ არის ინიციალიზებული
git init
git add .
git commit -m "Initial commit - Aphoteka Admin Panel"

# GitHub/GitLab/Bitbucket-ზე შექმენით repository და დაამატეთ remote
git remote add origin https://github.com/yourusername/aphoteka-admin.git
git push -u origin main
```

### 2. Vercel Account-ის შექმნა

1. გადადით [vercel.com](https://vercel.com)
2. შექმენით account (GitHub/GitLab/Bitbucket-ით)
3. დააკლიკეთ "New Project"

### 3. Project-ის Import

1. Vercel Dashboard-ში დააკლიკეთ "Add New Project"
2. აირჩიეთ თქვენი Git repository (aphoteka-admin)
3. Vercel ავტომატურად გაიგებს რომ ეს არის Next.js project

### 4. Build Settings

Vercel ავტომატურად გამოიყენებს შემდეგ settings-ს:
- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (default)
- **Install Command**: `npm install`

### 5. Environment Variables (თუ საჭიროა)

თუ გაქვთ environment variables:
1. Project Settings → Environment Variables
2. დაამატეთ:
   - `NEXT_PUBLIC_API_URL` (თუ გაქვთ)
   - სხვა API keys ან secrets

### 6. Deploy

1. დააკლიკეთ "Deploy"
2. Vercel ავტომატურად:
   - დააინსტალირებს dependencies
   - გააკეთებს build
   - გააქვს production-ში

## ავტომატური Deployments

Vercel ავტომატურად deploy-ს აკეთებს:
- **Production**: `main` branch-ზე push-ისას
- **Preview**: სხვა branches-ზე push-ისას ან Pull Request-ებისთვის

## Custom Domain (თუ საჭიროა)

1. Project Settings → Domains
2. დაამატეთ თქვენი domain
3. დაამატეთ DNS records როგორც Vercel მიუთითებს

## Build Troubleshooting

### თუ Build ვერ მუშაობს:

1. შეამოწმეთ Build Logs Vercel Dashboard-ში
2. ლოკალურად შეამოწმეთ:
   ```bash
   npm run build
   ```
3. შეამოწმეთ რომ ყველა dependencies დაყენებულია:
   ```bash
   npm install
   ```

### Common Issues:

1. **TypeScript Errors**: შეამოწმეთ `tsconfig.json`
2. **Missing Dependencies**: დარწმუნდით რომ ყველა dependency არის `package.json`-ში
3. **Environment Variables**: დარწმუნდით რომ ყველა env variable დამატებულია Vercel-ში

## Post-Deployment

Deployment-ის შემდეგ:
1. შეამოწმეთ რომ საიტი მუშაობს
2. შეამოწმეთ რომ ყველა routes მუშაობს
3. შეამოწმეთ API calls (თუ გაქვთ)

## Useful Commands

```bash
# ლოკალური build test
npm run build

# Production build test
npm run build && npm run start

# Lint check
npm run lint
```

## Support

თუ პრობლემები გაქვთ:
- Vercel Documentation: https://vercel.com/docs
- Next.js Documentation: https://nextjs.org/docs
