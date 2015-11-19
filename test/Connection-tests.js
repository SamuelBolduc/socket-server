'use strict';

const Connection = require(`${process.cwd()}/Connection.js`);
const net = require('net');
const sinon = require('sinon');
require('chai').should();

function throwException(e) {
  console.error(e);
  setTimeout(() => {
    throw e;
  });
}

function noop() {
  return;
}

describe('Connection class', () => {
  it('throws when called without a parameter', () => {
    function newConnectionFn() {
      new Connection();
    }
    newConnectionFn.should.throw('A valid socket must be supplied when creating a connection');
  });

  it('throws when called with something else than a socket', () => {
    function newConnectionFn() {
      new Connection('test');
    }
    newConnectionFn.should.throw('A valid socket must be supplied when creating a connection');
  });

  it('does not throw when called with a socket as a parameter', () => {
    function newConnectionFn() {
      new Connection(new net.Socket());
    }
    newConnectionFn.should.not.throw();
  });

  it('throws when called with an already used socket', () => {
    const sock = new net.Socket();
    function newConnectionFn() {
      new Connection(sock);
    }
    new Connection(sock);
    sock.registered = true;
    newConnectionFn.should.throw();
  });

  let conn = null;
  const spies = {};

  beforeEach(() => {
    const sock = new net.Socket();
    conn = new Connection(sock);
    spies.socketSuccessSpy = sinon.spy(conn.socket, 'success');
    spies.socketErrorSpy = sinon.spy(conn.socket, 'error');
    spies.sendEndMessageError = sinon.spy();
    spies.handlerSpy = sinon.spy();
    sinon.stub(conn.socket, 'sendEndMessage', () => { spies.sendEndMessageError(); });
  });

  it('should have a "checkMessageIntegrity" method', () => {
    conn.checkMessageIntegrity.should.be.a('function');
  });

  it('should have a "checkRouteAvailability" method', () => {
    conn.checkRouteAvailability.should.be.a('function');
  });

  it('should have a "route" method', () => {
    conn.route.should.be.a('function');
  });

  it('should have a "processMessage" method', () => {
    conn.processMessage.should.be.a('function');
  });

  it('should have a "destroy" method', () => {
    conn.destroy.should.be.a('function');
  });

  describe('checkMessageIntegrity', () => {
    it('should fail if message is undefined', () => {
      conn.checkMessageIntegrity();
      spies.socketErrorSpy.called.should.equal(true);
    });

    it('should fail if message type is undefined', () => {
      conn.checkMessageIntegrity({message: 'blabla'});
      spies.socketErrorSpy.called.should.equal(true);
    });

    it('should return the message if OK', () => {
      const msg = {type: 'my_msg_type', message: 'blabla'};
      conn.checkMessageIntegrity(msg).should.be.an('object');
      conn.checkMessageIntegrity(msg).should.equal(msg);
    });
  });

  describe('registerDispatcher', () => {
    it('should fail if no handlers are provided', () => {
      function fn() {
        conn.registerDispatcher();
      }
      fn.should.throw();
    });

    it('should fail if handlers is not a Map', () => {
      function fn() {
        conn.registerDispatcher('test');
      }
      fn.should.throw();
    });

    it('should work with a correct handlers Map', () => {
      const handlers = new Map();
      handlers.set('test', noop);
      function fn() {
        conn.registerDispatcher(handlers);
      }
      fn.should.not.throw();
    });
  });

  describe('destroy', () => {
    it('should destroy the socket', () => {
      conn.destroy();
      conn.should.not.have.key('socket');
    });
  });

  describe('checkRouteAvailability', () => {
    beforeEach(() => {
      const handlers = new Map();
      handlers.set('test', noop);
      conn.registerDispatcher(handlers);
    });

    it('should call socket.error if handler not found', () => {
      conn.checkRouteAvailability({type: 'my_msg_type', message: 'blabla'});
      spies.socketErrorSpy.called.should.equal(true);
      spies.sendEndMessageError.called.should.equal(true);
    });

    it('should succeed if handler exists', () => {
      conn.checkRouteAvailability({type: 'test', message: 'blabla'});
      spies.socketErrorSpy.called.should.equal(false);
    });
  });

  describe('route method', () => {
    beforeEach(() => {
      const handlers = new Map();
      handlers.set('test', spies.handlerSpy);
      conn.registerDispatcher(handlers);
    });

    it('should throw if called without a message', () => {
      conn.route.should.throw();
    });

    describe('with a valid message', () => {

      it('should fail if no handler found', () => {
        function fn() {
          conn.route({type: 'not_found', message: 'blabla'});
        }
        fn.should.throw();
      });

      it('should call the handler if found', () => {
        conn.route({type: 'test', message: 'blabla'});
        spies.handlerSpy.called.should.equal(true);
      });
    });
  });

  describe('processMessage method', () => {
    beforeEach(() => {
      const handlers = new Map();
      handlers.set('test', spies.handlerSpy);
      conn.registerDispatcher(handlers);
    });

    it('should throw if called without a message', () => {
      conn.processMessage.should.throw();
    });

    describe('with a valid message and existing handler', () => {
      it('should call the handler', () => {
        conn.route({type: 'test', message: 'blabla'});
        spies.handlerSpy.called.should.equal(true);
      });
    });
  });
});