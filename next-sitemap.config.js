/** @type {import('next-sitemap').IConfig} */
const config = {
  siteUrl: process.env.SITE_URL || 'https://purebinlv.com',
  generateRobotsTxt: true,
}

export default config
