'use strict';

//const log = require('./lib/logger')();
const JsonSocket = require('json-socket');
const net = require('net');

class Connection {
  constructor(socket, handlers) {
    // Bind JSON socket functions
    this.socket = new JsonSocket(socket);
    this.handlers = handlers;
    this.processMessage = this.processMessage.bind(this);
    this.registerUtilityMethods = this.registerUtilityMethods.bind(this);
    this.registerDispatcher = this.registerDispatcher.bind(this);
    this.checkRouteAvailability = this.checkRouteAvailability.bind(this);
    this.route = this.route.bind(this);
    Promise.all(this.registerUtilityMethods(), this.registerDispatcher());
  }

  registerUtilityMethods() {
    // Store the context in a constant instead of binding it
    const that = this;

    function _success(data) {
      that.socket.sendEndMessage({status: 'success', data});
    }

    function _error(msg, e) {
      log.e(e || msg);
      const errorResponse = {msg: msg.toString(), details: e ? e.toString() : null};
      that.socket.sendEndMessage({status: 'error', e: errorResponse});
    }

    this.socket.success = _success;
    this.socket.error = _error;

    Promise.resolve();
  }

  registerDispatcher() {
    this.socket.on('message', this.processMessage);
    Promise.resolve();
  }

  checkMessageIntegrity(message) {
    //log.t('checkMessageIntegrity');
    if(!message.type) {
      throw new Error('No message type found in socket message!');
    } else {
      return message;
    }
  }

  checkRouteAvailability(message) {
    //log.t('checkRouteAvailability');
    if(!this.handlers.get(message.type)) throw new Error(`No handler found for this message type (message.type = ${message.type})`);
    return message;
  }

  route(message) {
    //log.t('route');
    const utilities = {success: this.socket.success, error: this.socket.error};
    const handler = this.handlers.get(message.type);

    Promise.resolve(handler(message.body, utilities)).catch(this.socket.error);
  }

  processMessage(message) {
    //log.t('Received message...');
    Promise.resolve(this.checkMessageIntegrity(message))
    .then(this.checkRouteAvailability)
    .then(this.route)
    .catch(this.socket.error);
  }
}

class Router {
  constructor() {
    this.handlers = new Map();
    this.server = null;
    //this.listen = this.listen.bind(this);
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
