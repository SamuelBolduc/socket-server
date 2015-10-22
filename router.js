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

  listen(port) {
    this.server = net.createServer().listen(port);
    this.server.on('connection', socket => {
      const connection = new Connection(socket, this.handlers);
      connection.registerDispatcher();
    });
  }
}

module.exports = Router;
