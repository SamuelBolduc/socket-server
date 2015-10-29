'use strict';

const Client = require('socket-router-client');
const Server = require('../Router.js');
const socketParams = {host: 'localhost', port: 4445};
const client = new Client(socketParams);
const server = new Server();

function noop() {

}

const type = 'my_task;';

server.listen(4445).then(() => {
  server.register(type, (body, res) => {
    res.success(`${body.toUpperCase()}`);
  });

  describe('server, when used with a socket-router-client', () => {
    after(() => {
      server.end();
    });

    it('should respond with the cb provided', done => {
      client.query({type, body: 'Hello'}).then(res => {
        done();
      });
    });

    it('should have applied the transformation on the message', done => {
      client.query({type, body: 'Hello'}).then(res => {
        res.should.equal('HELLO');
        done();
      });
    });
  });
});

