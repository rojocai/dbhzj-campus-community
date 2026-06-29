module.exports = {
  apps: [{
    name: 'campus-community',
    script: 'node_modules/.bin/next',
    args: 'start -p 23002',
    cwd: '/root/backup-site',
    env: {
      NODE_ENV: 'production',
      NEXTAUTH_URL: 'https://bk.lc26.de',
    },
  }],
}
