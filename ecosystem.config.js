/* eslint-disable */
module.exports = {
  apps: [
    {
      name: 'Upvote Downloader',
      script: 'src',

      // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
      instances: 1,
      autorestart: true,
      watch: ['src'],
      log_date_format: 'HH:mm:ss DD-MM-YY',
    },
  ],
};
