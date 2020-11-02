const { mkdirSync, existsSync, createWriteStream, unlink } = require('fs');
const { exec } = require('child_process');
const UpvoteWatcher = require('./watcher');
const fetch = require('node-fetch');

const { reddit, imgur } = require('../config.json');
const watcher = new UpvoteWatcher(reddit);
const MEGA_PATH = '/Bilder';
const TMP = '../tmp';

const init = () => {
  if (!existsSync(TMP)) {
    mkdirSync(TMP);
  }
};

const getFileName = url => {
  return url.substring(url.lastIndexOf('/') + 1);
};

const download = (url, dest) =>
  new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(url);
      const fileStream = createWriteStream(dest, { flags: 'wx' });

      res.body.pipe(fileStream);

      res.body.on('error', err => {
        fileStream.close();
        unlink(dest);
        reject(err);
      });

      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });

      fileStream.on('error', err => {
        fileStream.close();

        if (err.code === 'EEXIST') {
          reject('File already exists');
        } else {
          unlink(dest);
          reject(err);
        }
      });
    } catch (error) {
      reject(error);
    }
  });

const uploadMega = dest => {
  return new Promise((resolve, reject) => {
    const command = `mega-put ${dest} ${MEGA_PATH}`;

    exec(command, error => {
      if (error) {
        reject(error);
      }
      resolve();
    });
  });
};

const downloadAndUpload = async url => {
  const filename = getFileName(url);
  const dest = `${TMP}/${filename}`;

  try {
    await download(url, dest);
    await uploadMega(dest);
    unlink(dest, error => {
      if (error) console.error(error);
    });
  } catch (error) {
    console.error(error);
  }
};

const handleImgurAlbum = async url => {
  const albumID = url.match(/[^\/]+$/)[0];

  const res = await fetch(`https://api.imgur.com/3/album/${albumID}/images`, {
    headers: { Authorization: `Client-ID ${imgur.clientID}` },
  });

  const json = await res.json();
  json.data.forEach(image => downloadAndUpload(image.link));
};

const downloader = async data => {
  const { post_hint, url } = data;

  if (post_hint === 'self') return;

  // Image
  if (post_hint === 'image') {
    downloadAndUpload(url);
  }

  // Imgur GIF
  if (post_hint === 'link') {
    if (url.includes('imgur')) {
      if (url.includes(['.gifv', '.gif'])) {
      }

      if (url.includes('/a/')) {
        handleImgurAlbum(url);
      }
    }
  }
};

(async function () {
  init();
  console.log('Watching for Reddit upvotes...');

  watcher.on('post', data => {
    console.log(data.title);
    console.log(data.post_hint);
    console.log(data.url);
    console.log('');

    downloader(data);
  });
  watcher.on('error', error => console.error(error));
})();
