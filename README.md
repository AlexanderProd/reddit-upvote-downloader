# Reddit-Upvote-Downloader

- This script automatically downloads images and videos (from some hosters) that are being upvoted with the connected account.

- ⚠️ You need to create a reddit app in your accounts settings to obtain API credentials, you also need to register an app with Imgur if you want Imgur albums to be automatically downloaded.

- It also utilizes the Mega command line tools to automatically upload media to Mega.

## 🛠 Configuration

1. Download or clone this repo
2. `$ yarn install` or `$ npm install`
3. Copy `config-template.json` and rename it to `config.json`
4. Edit `config.json` and fill in the necessary information.
5. Start the app using `$ yarn start`, `$ node src` or by using PM2 (`$ pm2 start`).

## ✅ Supported Media Types and Hosters

- Reddit images
- Reddit GIFs & videos
- Imgur images & albums
- Imgur GIFs & videos
