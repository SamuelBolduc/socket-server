'use strict';

const net = require('net');
const Connection = require('./Connection.js');

class Router {
  constructor() {
    this.handlers = new Map();
    this.server = null;
  }

  register(name, handler) {
    if(this.handlers.has(name)) {
      throw new Error(`${name} task already registered`);
    }
    this.handlers.set(name, handler);
  }

  end() {
    return new Promise((resolve, reject) => {
      this.server.close(err => {
        if(err) {
          return reject('Not running. Nothing done.');
        }
        this.server = null;
        resolve();
      });
    });
  }

  listen(port) {
    return new Promise((resolve, reject) => {
      this.server = net.createServer().listen(port, () => {
        resolve();
        this.server.on('connection', socket => {
          const connection = new Connection(socket);
          socket.registered = true;
          connection.registerDispatcher(this.handlers);
        });
      });
    });
  }
}

module.exports = Router;
