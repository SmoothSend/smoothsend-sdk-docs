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
      { text: 'Examples', link: '/examples/' },
      {
        text: 'v1.0.0',
        items: [
          { text: 'Changelog', link: '/changelog' },
          { text: 'NPM Package', link: 'https://npmjs.com/package/@smoothsend/sdk' }
        ]
      }
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
          text: 'Chain Guides',
          items: [
            { text: 'Avalanche', link: '/chains/avalanche' },
            { text: 'Aptos', link: '/chains/aptos' }
          ]
        },
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Token Sender', link: '/examples/token-sender' },
            { text: 'NFT Marketplace', link: '/examples/nft-marketplace' },
            { text: 'DeFi Farming', link: '/examples/defi-farming' }
          ]
        },
        {
          text: 'API Reference',
          items: [
            { text: 'SmoothSendSDK', link: '/api/' },
            { text: 'Types', link: '/api/types' },
            { text: 'Errors', link: '/api/errors' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/smoothsend/sdk' },
      { icon: 'twitter', link: 'https://twitter.com/smoothsend' },
      { icon: 'discord', link: 'https://discord.gg/smoothsend' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024 SmoothSend'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/smoothsend/sdk/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
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
