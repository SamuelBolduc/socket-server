'use strict';

const Router = require(`${process.cwd()}/Router.js`);
require('chai').should();
const exec = require('child_process').exec;

function throwException(e) {
  console.error(e);
  setTimeout(() => {
    throw e;
  });
}

function noop() {
  return;
}

describe('Router', () => {
  it('can be instanciated', () => {
    const router = new Router();
    router.should.be.an('object');
  });

  let router = null;
  const defaultPort = 4444;

  beforeEach(() => {
    router = new Router();
  });

  it('should have a "register" method', () => {
    router.register.should.be.a('function');
  });

  it('should have a "listen" method', () => {
    router.listen.should.be.a('function');
  });

  it('should have a "end" method', () => {
    router.end.should.be.a('function');
  });

  describe('end method', () => {
    it('should end the server', done => {
      router.listen(defaultPort).then(() => {
        router.end().then(() => {
          const router2 = new Router();
          router2.listen(defaultPort).then(() => {
            router2.end().then(done).catch(throwException);
          });
        }).catch(throwException);
      });
    });
  });

  describe('listen method', () => {
    

    it('should throw without a port specified', () => {
      function fn() {
        router.listen('bad_port');
      }
      fn.should.throw();
    });

    it('should fail if port is already in use', done => {
      router.listen(4441).then(() => {
        const router2 = new Router();
        router2.listen(4441).then(() => {
          done('Port should have been in use');
        }).catch(e => {
          e.e.code.should.equal('EADDRINUSE');
          done();
        });
      });
    });

    describe('with a valid port', () => {
      beforeEach(done => {
        router.listen(defaultPort).then(done).catch(throwException);
      });

      afterEach(done => {
        router.end().then(done);
      });

      it('should set the "server" key in the object', () => {
        router.server.should.not.equal(null);
      });

      it('should listen on the right port', done => {
        router.server.address().port.should.equal(defaultPort);
        done();
      });
    });
  });

  describe('register method', () => {
    afterEach(done => {
      router.end().then(done);
    });

    beforeEach(done => {
      router.listen(defaultPort).then(done).catch(throwException);
    });

    it('should not throw', () => {
      router.register('TEST', () => {
        // nothing here
      });
    });

    it('should register a new handler', () => {
      const handlerName = 'my-handler';
      router.register(handlerName, noop);
      router.handlers.size.should.equal(1);
      router.handlers.get(handlerName).should.be.a('function');
    });

    it('should throw an exception if handler already registered', () => {
      const handlerName = 'my-handler';
      router.register(handlerName, noop);
      try {
        router.register(handlerName, noop);
      } catch(e) {
        e.should.be.an('error');
        e.toString().should.equal('Error: my-handler task already registered');
      }
    });
  });
});