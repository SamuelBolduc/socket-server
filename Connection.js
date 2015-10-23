'use strict';

const JsonSocket = require('json-socket');

class Connection {
  constructor(socket) {
    // Bind JSON socket functions
    this.socket = new JsonSocket(socket);
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
      const errorResponse = {msg: msg.toString(), details: e ? e.toString() : null};
      that.socket.sendEndMessage({status: 'error', e: errorResponse});
    }

    this.socket.success = _success;
    this.socket.error = _error;

    Promise.resolve();
  }

  registerDispatcher(handlers) {
    this.handlers = handlers;
    this.socket.on('message', message => {
      try {
        this.processMessage(message);
      } catch(err) {
        console.log(err);
        throw err;
      }
    });
    Promise.resolve();
  }

  checkMessageIntegrity(message) {
    if(!message.type) {
      this.socket.error(new Error('No message type found in socket message!'));
    } else {
      return message;
    }
  }

  checkRouteAvailability(message) {
    if(!this.handlers.get(message.type)) this.socket.error(new Error(`No handler found for this message type (message.type = ${message.type})`));
    return message;
  }

  route(message) {
    const utilities = {success: this.socket.success, error: this.socket.error};
    const handler = this.handlers.get(message.type);

    try {
      handler(message.body, utilities);
    } catch(err) {
      this.socket.error('Error in response handler on the server');
      throw err;
    }
  }

  processMessage(message) {
    Promise.resolve(this.checkMessageIntegrity(message))
    .then(this.checkRouteAvailability)
    .then(this.route)
    .catch(err => {
      console.log(err.stack);
    });
  }
}

module.exports = Connection;
