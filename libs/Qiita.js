const request = require('request');

module.exports = class Qiita {
  constructor(params) {
    var baseOptions = {
      url: `https://${params.team}.qiita.com`,
      headers: {
        'Authorization': 'Bearer ' + params.token,
        'Content-Type': 'application/json; charset=utf-8"',
        'User-Agent': 'Hubot'
      }
    };

    this.Comments = new Comments(baseOptions);
  }
}

class Comments {

  constructor(baseOptions) {
    this.options = baseOptions;
  }

  list(itemId) {
    let options = {
      url: this.options.url + `/api/v2/items/${itemId}/comments`,
      headers: this.options.headers,
    };

    return new Promise((resolve, reject) => {
      request.get(options, (err, res, body) => {
        if (res) {
          resolve(JSON.parse(res.body))
        } else {
          reject(err);
        }
      })
    });
  }

  post(itemId, body) {

    let options = {
      url: this.options.url + `/api/v2/items/${itemId}/comments`,
      headers: this.options.headers,
      body: JSON.stringify({body: body})
    };

    return new Promise((resolve, reject) => {
      request.post(options, (err, res, body) => {
        if (res) {
          resolve(JSON.parse(res.body))
        } else {
          reject(err);
        }
      });
    });
  }

  update(commentId, body) {

    let options = {
      url: this.options.url + `/api/v2/comments/${commentId}`,
      headers: this.options.headers,
      body: JSON.stringify({body: body})
    };

    return new Promise((resolve, reject) => {
      request.patch(options, (err, res, body) => {
        if (res) {
          resolve(JSON.parse(res.body))
        } else {
          reject(err);
        }
      });
    });
  }
}
