/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: process.env.SITE_URL || 'https://purebinlv.com',
  generateRobotsTxt: true,
  exclude: [
    '/admin/',
    '/rep/',
    '/tech/',
    '/api/',
    '/setup/',
    '/schedule',
    '/save-quote',
    '/quote',
    '/script',
    
  ],
}

export default config