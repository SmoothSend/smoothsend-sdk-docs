# Documentation Deployment Guide

## Hosting Options for docs.smoothsend.xyz

### Option 1: Vercel (Recommended) ⭐

**Why Vercel:**
- Automatic deployments from Git
- Built-in CDN and performance optimization
- Easy custom domain setup
- Zero configuration for VitePress

**Setup Steps:**

1. **Push docs to GitHub:**
```bash
cd docs
git init
git add .
git commit -m "Initial documentation"
git remote add origin https://github.com/smoothsend/docs
git push -u origin main
```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set build settings:
     - **Framework**: VitePress
     - **Build Command**: `npm run build`
     - **Output Directory**: `.vitepress/dist`

3. **Configure Custom Domain:**
   - In Vercel dashboard, go to Settings > Domains
   - Add `docs.smoothsend.xyz`
   - Update DNS records as instructed

### Option 2: Netlify

**Setup Steps:**

1. **Create `netlify.toml`:**
```toml
[build]
  publish = "docs/.vitepress/dist"
  command = "cd docs && npm install && npm run build"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Deploy:**
   - Connect GitHub repository to Netlify
   - Set custom domain to `docs.smoothsend.xyz`

### Option 3: GitHub Pages

**Setup Steps:**

1. **Create GitHub Action (`.github/workflows/docs.yml`):**
```yaml
name: Deploy Documentation

on:
  push:
    branches: [ main ]
    paths: [ 'docs/**' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm
          cache-dependency-path: docs/package-lock.json
      
      - name: Install dependencies
        run: cd docs && npm ci
      
      - name: Build documentation
        run: cd docs && npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: docs/.vitepress/dist
          cname: docs.smoothsend.xyz
```

2. **Configure GitHub Pages:**
   - Repository Settings > Pages
   - Source: GitHub Actions
   - Custom domain: `docs.smoothsend.xyz`

### Option 4: Self-Hosted (Advanced)

**Docker Setup:**

1. **Create `Dockerfile`:**
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY docs/package*.json ./
RUN npm ci

COPY docs/ .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/.vitepress/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. **Create `nginx.conf`:**
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    server {
        listen 80;
        server_name docs.smoothsend.xyz;
        root /usr/share/nginx/html;
        index index.html;
        
        location / {
            try_files $uri $uri/ $uri.html /index.html;
        }
        
        # Enable gzip compression
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    }
}
```

3. **Deploy:**
```bash
docker build -t smoothsend-docs .
docker run -p 80:80 smoothsend-docs
```

## DNS Configuration

For `docs.smoothsend.xyz`, add these DNS records:

### For Vercel:
```
CNAME docs cname.vercel-dns.com
```

### For Netlify:
```
CNAME docs your-site-name.netlify.app
```

### For Custom Server:
```
A docs YOUR_SERVER_IP
```

## Development Workflow

### Local Development

```bash
cd docs
npm install
npm run dev
```

Visit `http://localhost:5173`

### Content Updates

1. **Edit Markdown files** in `docs/`
2. **Test locally** with `npm run dev`
3. **Commit and push** to trigger deployment

### Adding New Pages

1. **Create markdown file** in appropriate directory
2. **Update sidebar** in `.vitepress/config.js`
3. **Add navigation links** if needed

Example:
```javascript
// .vitepress/config.js
sidebar: {
  '/': [
    {
      text: 'New Section',
      items: [
        { text: 'New Page', link: '/new-section/new-page' }
      ]
    }
  ]
}
```

## SEO Optimization

### Meta Tags
Already configured in `.vitepress/config.js`:
- Open Graph tags
- Twitter Card
- Theme color
- Favicon

### Sitemap
VitePress automatically generates sitemap at `/sitemap.xml`

### Search
Local search is enabled. For advanced search, consider:
- Algolia DocSearch (free for open source)
- Custom search integration

## Performance Optimization

### Build Optimization
```javascript
// .vitepress/config.js
export default defineConfig({
  vite: {
    build: {
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['vue'],
            'examples': ['./examples/index.md']
          }
        }
      }
    }
  }
})
```

### CDN Configuration
For static assets, consider using a CDN:
```javascript
// .vitepress/config.js
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? 'https://cdn.smoothsend.xyz/docs/' : '/'
})
```

## Analytics Setup

### Google Analytics
```javascript
// .vitepress/config.js
export default defineConfig({
  head: [
    ['script', { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID' }],
    ['script', {}, `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'GA_MEASUREMENT_ID');
    `]
  ]
})
```

### Plausible Analytics (Privacy-friendly)
```javascript
head: [
  ['script', { defer: '', 'data-domain': 'docs.smoothsend.xyz', src: 'https://plausible.io/js/script.js' }]
]
```

## Security Headers

### Vercel (`vercel.json`)
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Netlify (`_headers`)
```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
```

## Monitoring & Maintenance

### Uptime Monitoring
- Use services like UptimeRobot or Pingdom
- Monitor `https://docs.smoothsend.xyz`

### Content Updates
- Set up automated dependency updates
- Regular content reviews and updates
- Monitor for broken links

### Backup Strategy
- GitHub serves as primary backup
- Consider additional backups for custom content

## Recommended: Vercel Deployment

For the best experience, I recommend **Vercel** because:

✅ **Zero configuration** for VitePress  
✅ **Automatic deployments** from Git  
✅ **Global CDN** for fast loading  
✅ **Custom domain** support  
✅ **Analytics** built-in  
✅ **Free** for open source projects  

The documentation will be live at `https://docs.smoothsend.xyz` within minutes of setup!
