'use strict';

const net = require('net');
const Connection = require('./Connection.js');
const exec = require('child_process').exec;

class Router {
  constructor() {
    this.handlers = new Map();
    this.server = null;
    this.listening = false;
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

  listen(port, force) {
    if(!port || !parseInt(port)) throw new Error(`Please specify a valid port number (received ${port})`);
    return new Promise((resolve, reject) => {
      if(this.listening) return resolve();
      this.server = net.createServer();
      this.server.listen(port);
      this.server.on('listening', () => {
        this.listening = true;
        return resolve();
      });
      this.server.on('error', e => {
        if(e.code === 'EADDRINUSE' && force) {
          this.freePort(port, (err, port) => {
            if(err) return reject('Could not force free port', e);
            this.server.listen(port);
          });
        } else {
          return reject({error: 'An error occured when trying to listen()', e});
        }
      });
      this.server.on('connection', socket => {
        const connection = new Connection(socket);
        socket.registered = true;
        connection.registerDispatcher(this.handlers);
      });
    });
  }

  freePort(port, cb) {
    if(!port || !parseInt(port)) throw new Error(`Please specify a valid port number (received ${port})`);
    // No promises here, was always failing and couldn't debug it...
    exec(`lsof -n -iTCP:${port} | grep LISTEN`, (err, stdout, stderr) => {
      if(stderr) return cb(stderr);
      if(!stdout) return cb(null, port);
      const values = stdout.match(/\S+/g);
      const pid = values[1];
      exec(`kill -15 ${pid}`, (err, stdout, stderr) => {
        if(err) return cb(err);
        if(stderr) return cb(stderr);
        return cb(null, port);
      });
    });
  }
}

module.exports = Router;
