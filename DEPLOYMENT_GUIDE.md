# JB ENGITECH GST Billing Application - Complete Deployment Guide

## Overview
This is a **free, production-ready GST billing application** for JB ENGITECH. It will be deployed on free tiers of:
- **Vercel** (Frontend hosting) - Free tier
- **Supabase** (Database + Authentication) - Free tier
- **Firebase Storage** (Optional, for PDF storage) - Free tier

**Total Cost: ₹0/month** ✅

---

## Step 1: Prepare Your Local Environment

### 1.1 Install Required Tools

```bash
# Install Node.js (if not already installed)
# Download from: https://nodejs.org/ (LTS version)

# Install Vercel CLI
npm install -g vercel
```

### 1.2 Create Project Directory

```bash
mkdir jb-engitech-billing
cd jb-engitech-billing

# Initialize NPM
npm init -y

# Install dependencies
npm install react react-dom next lucide-react axios
npm install -D tailwindcss postcss autoprefixer
npm install jspdf html2canvas  # For PDF generation
```

---

## Step 2: Set Up GitHub Repository

### 2.1 Create GitHub Account (if you don't have one)
- Go to https://github.com/signup
- Sign up for free

### 2.2 Create New Repository

1. Go to https://github.com/new
2. Repository name: `jb-engitech-billing`
3. Description: `GST Tax Invoice Billing System`
4. Make it **Public** (free Vercel deployment works better with public repos)
5. Click **Create repository**

### 2.3 Upload Project to GitHub

```bash
# In your project directory
git init
git add .
git commit -m "Initial commit: JB ENGITECH billing app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/jb-engitech-billing.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 3: Deploy Frontend to Vercel (FREE)

### 3.1 Create Vercel Account

1. Go to https://vercel.com/signup
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub account
4. Complete signup

### 3.2 Import Project to Vercel

1. On Vercel dashboard, click **"New Project"**
2. Select your GitHub repository `jb-engitech-billing`
3. Click **"Import"**
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
5. Click **"Deploy"**

✅ **Your app is now live!** Vercel will give you a URL like:
```
https://jb-engitech-billing.vercel.app
```

---

## Step 4: Set Up Database (Supabase - FREE)

### 4.1 Create Supabase Account

1. Go to https://supabase.com/
2. Click **"Start your project for free"**
3. Sign up with GitHub (recommended)
4. Create a new project:
   - **Project Name**: `jb-engitech-invoices`
   - **Database Password**: Create strong password (save it!)
   - **Region**: `ap-south-1` (India) or closest to you
5. Wait for project to initialize (2-3 minutes)

### 4.2 Create Invoice Table

In Supabase SQL Editor, run this query:

```sql
CREATE TABLE invoices (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_date DATE NOT NULL,
  customer_name TEXT NOT NULL,
  buyer_gstin TEXT,
  consignee_gstin TEXT,
  total_taxable_value DECIMAL(12, 2),
  total_gst DECIMAL(12, 2),
  grand_total DECIMAL(12, 2),
  supply_type TEXT,
  items JSONB,
  pdf_url TEXT,
  invoice_data JSONB,
  status TEXT DEFAULT 'draft'
);

CREATE TABLE customers (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  customer_name TEXT NOT NULL,
  gstin TEXT UNIQUE,
  address TEXT,
  city TEXT,
  state TEXT,
  state_code TEXT,
  pin_code TEXT,
  contact_person TEXT,
  mobile TEXT,
  email TEXT
);

CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_customer ON invoices(customer_name);
```

### 4.3 Get Supabase Credentials

1. In Supabase project, go to **Settings → API**
2. Copy:
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon Key**: (the long string)
3. Save these for later!

---

## Step 5: Add Environment Variables

### 5.1 Create `.env.local` in Your Project

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace with your actual Supabase credentials.

### 5.2 Add to Vercel

1. Go to Vercel dashboard
2. Select your project
3. Go to **Settings → Environment Variables**
4. Add:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://your-project.supabase.co`
5. Add second variable:
   - Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Value: `your-anon-key`
6. Redeploy: Go to **Deployments** → Click last deployment → **Redeploy**

---

## Step 6: Update App with Database Integration

Create file `lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export async function saveInvoice(invoiceData) {
  const { data, error } = await supabase
    .from('invoices')
    .insert([invoiceData])
  
  if (error) throw error
  return data
}

export async function getInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function saveCustomer(customerData) {
  const { data, error } = await supabase
    .from('customers')
    .insert([customerData])
  
  if (error) throw error
  return data
}

export async function getCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
  
  if (error) throw error
  return data
}
```

---

## Step 7: PDF Generation (Optional - Uses Client-Side)

For production PDF generation with server-side rendering, create `pages/api/generate-pdf.js`:

```javascript
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { invoiceData } = req.body
    
    // Create PDF
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text('Tax Invoice', 14, 15)
    doc.setFontSize(10)
    doc.text(`Invoice: ${invoiceData.invoiceNumber}`, 14, 25)
    doc.text(`Date: ${invoiceData.invoiceDate}`, 14, 32)
    
    // Add customer details
    doc.text(`Customer: ${invoiceData.consigneeDetails.name}`, 14, 45)
    
    // Add items table
    const items = invoiceData.items.map(item => [
      item.description,
      item.hsn,
      item.quantity,
      `₹${item.rate}`,
      `₹${item.quantity * item.rate}`
    ])

    doc.autoTable({
      head: [['Description', 'HSN', 'Qty', 'Rate', 'Amount']],
      body: items,
      startY: 55
    })

    // Add totals
    const finalY = doc.lastAutoTable.finalY + 10
    doc.text(`Total: ₹${invoiceData.totals.grandTotal}`, 14, finalY)
    
    // Send PDF
    const pdf = doc.output('arraybuffer')
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`)
    res.send(Buffer.from(pdf))
    
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
```

---

## Step 8: Free Domain (Optional)

### Option A: Use Vercel's Free Domain
- Vercel gives you a free `.vercel.app` domain automatically
- Example: `jb-engitech-billing.vercel.app`

### Option B: Custom Free Domain (FreeDNS)
1. Go to https://freedns.afraid.org/
2. Sign up free
3. Add a subdomain pointing to `jb-engitech-billing.vercel.app`
4. In Vercel **Settings → Domains**, add your custom domain

---

## Step 9: Enable HTTPS & SSL (Automatic on Vercel)
✅ Vercel automatically provides free HTTPS/SSL certificates
✅ Your app is secure by default

---

## Step 10: Test Your Live App

1. Go to `https://jb-engitech-billing.vercel.app`
2. Try creating an invoice:
   - Click **"New Invoice"**
   - Fill in customer details (pre-filled with test data)
   - Add items
   - Click **"Preview Invoice"**
   - Click **"Generate PDF"**
3. Invoice should save to Supabase database
4. Go to **Invoice History** to view saved invoices

---

## Admin Access to Your Data

### View Invoices in Supabase
1. Go to Supabase Dashboard
2. Select your project
3. Click **"SQL Editor"** on left
4. Run:
   ```sql
   SELECT * FROM invoices ORDER BY created_at DESC;
   ```

### Delete/Edit Invoices
```sql
-- View specific invoice
SELECT * FROM invoices WHERE invoice_number = 'JB/001/2026-27';

-- Update invoice status
UPDATE invoices SET status = 'sent' WHERE invoice_number = 'JB/001/2026-27';

-- Delete invoice
DELETE FROM invoices WHERE invoice_number = 'JB/001/2026-27';
```

---

## Troubleshooting

### Problem: "Module not found" error
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
git add .
git commit -m "Fix dependencies"
git push
```
Then redeploy from Vercel.

### Problem: Supabase connection fails
**Solution:**
1. Check environment variables in Vercel Settings
2. Make sure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
3. In Supabase, go to **Settings → API** and verify your keys

### Problem: PDF doesn't generate
**Solution:**
1. Install `jspdf` and `html2canvas`: `npm install jspdf html2canvas`
2. Restart build in Vercel: Go to **Deployments** → Redeploy

### Problem: App is slow
**Solution:**
- Supabase free tier has rate limits
- If heavy usage, upgrade to paid plan
- Or implement response caching

---

## Production Checklist

Before sharing with real users:

- [ ] Test invoice generation 5 times
- [ ] Test PDF download on mobile
- [ ] Verify Supabase backups are enabled
- [ ] Set up email notifications (optional)
- [ ] Train staff on how to use app
- [ ] Back up important invoices monthly

---

## Monthly Costs

| Service | Free Tier | Cost |
|---------|-----------|------|
| **Vercel** | 100 GB bandwidth/month | ₹0 |
| **Supabase** | 500 MB storage + 2 million queries | ₹0 |
| **Custom Domain** | Via FreeDNS | ₹0 |
| **SSL/HTTPS** | Automatic Vercel | ₹0 |
| **TOTAL** | | **₹0/month** ✅ |

---

## Upgrade Path (When You Grow)

| Level | Cost | When to Upgrade |
|-------|------|-----------------|
| Free | ₹0 | < 100 invoices/month |
| Vercel Pro | ₹500/month | > 100k requests/month |
| Supabase Pro | ₹500/month | > 100 GB data |
| Custom Email | ₹500/month | Need branded emails |

---

## Support & Next Steps

### You're Done! 🎉

Your billing app is now:
- ✅ Live at `https://jb-engitech-billing.vercel.app`
- ✅ Automatically backed up (Supabase)
- ✅ Secure with HTTPS
- ✅ Free forever (free tiers)
- ✅ Scalable when you grow

### Share with team:
Send them: `https://jb-engitech-billing.vercel.app`

### Get help:
- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- React Docs: https://react.dev

---

**That's it! Your GST billing app is ready to use!** 🚀
