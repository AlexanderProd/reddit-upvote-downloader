const EventEmitter = require('events');
const fetch = require('node-fetch');

const sleep = t => new Promise(resolve => setTimeout(resolve, t));

module.exports = class UpvoteWatcher extends EventEmitter {
  constructor(options) {
    super();
    this.options = options;
    this.requestsPerMinute = 30;
    this.sleepTime = (1000 * 60) / this.requestsPerMinute;
    this.lastRequest = 0;
    this.tokenExpiration = 0;
    this.token = null;
    this.stopped = false;
    this.lastItem = null;
    this.seenItems = [];
    this.seenItemsSize = 20;
    this.firstRun = true;

    this.once('newListener', (event, listener) => {
      this.start();
    });
  }

  async getToken() {
    const { username, password, appId, apiSecret, useragent } = this.options;

    return new Promise(async (resolve, reject) => {
      if (Date.now() / 1000 <= this.tokenExpiration) {
        resolve(this.token);
      }

      const url = new URL(`https://www.reddit.com/api/v1/access_token?`);
      const headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': useragent,
        'Cache-Control': 'no-cache',
        Authorization:
          'Basic ' + Buffer.from(appId + ':' + apiSecret).toString('base64'),
      };
      const params = new URLSearchParams({
        grant_type: 'password',
        username: username,
        password: password,
      });

      try {
        const res = await fetch(url + params, { method: 'POST', headers });
        if (res.status !== 200) {
          return this.start();
        }
        const tokenInfo = await res.json();

        this.tokenExpiration = Date.now() / 1000 + tokenInfo.expires_in / 2;
        this.token = tokenInfo.token_type + ' ' + tokenInfo.access_token;

        resolve(this.token);
      } catch (error) {
        console.error(error);
        return this.start();
      }
    });
  }

  async getItems(retry = 0) {
    const { username, useragent } = this.options;

    return new Promise(async (resolve, reject) => {
      try {
        const url = new URL(
          `https://oauth.reddit.com/user/${username}/upvoted?`
        );
        const headers = {
          Authorization: await this.getToken(),
          'User-Agent': useragent,
        };
        const params = new URLSearchParams({ limit: 10 });

        const res = await fetch(url + params, { headers });
        if (res.status !== 200) {
          return this.start();
        }

        const json = await res.json();

        resolve(json);
      } catch (error) {
        console.error(error);
        return this.start();
      }
    });
  }

  async start() {
    if (this.stopped) return;

    setTimeout(async () => {
      try {
        const { data } = await this.getItems();
        const { children } = data;

        children.forEach(elem => {
          if (this.seenItems.indexOf(elem.data.name) < 0) {
            if (!this.firstRun) {
              this.emit('post', elem.data);
            }

            this.seenItems.push(elem.data.name);

            if (this.seenItems.length > this.seenItemsSize) {
              this.seenItems.shift();
            }
          }
        });

        this.firstRun = false;
        this.start();
      } catch (error) {
        this.emit('error', error);
      }
    }, this.sleepTime);
  }
};
