import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'SmoothSend SDK',
  description: 'Multi-chain gasless transaction SDK for seamless dApp integration',
  
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#646cff' }],
    ['meta', { property: 'og:title', content: 'SmoothSend SDK Documentation' }],
    ['meta', { property: 'og:description', content: 'The ultimate multi-chain gasless transaction SDK' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: 'Guide', link: '/' },
      { text: 'API Reference', link: '/api/' },
      { text: 'NPM Package', link: 'https://npmjs.com/package/@smoothsend/sdk' }
    ],

    sidebar: {
      '/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/' },
            { text: 'Installation', link: '/installation' },
            { text: 'Quick Start', link: '/quick-start' }
          ]
        },
        {
          text: 'API Reference',
          items: [
            { text: 'SmoothSendSDK', link: '/api/' },
            { text: 'Types', link: '/api/types' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'x', link: 'https://x.com/smoothsend' },
      { icon: 'discord', link: 'https://discord.gg/fF6cdJFWnM' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 SmoothSend'
    },

    search: {
      provider: 'local'
    },


    lastUpdated: {
      text: 'Updated at',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium'
      }
    }
  },

  markdown: {
    theme: 'material-theme-palenight',
    lineNumbers: true
  },

  vite: {
    define: {
      __VUE_OPTIONS_API__: false
    }
  }
})
