const assert = require('assert');
const common = require('../../../common.js');
const NightwatchAssertion = common.require('core/assertion.js');
const MockServer  = require('../../../lib/mockserver.js');
const CommandGlobals = require('../../../lib/globals/commands.js');

describe('waitForElementNotVisible', function() {
  const createOrig = NightwatchAssertion.create;

  before(function(done) {
    CommandGlobals.beforeEach.call(this, done);
  });

  afterEach(function() {
    MockServer.removeMock({
      url : '/wd/hub/session/1352110219202/element/0/displayed',
      method:'GET'
    });
  });

  after(function(done) {
    CommandGlobals.afterEach.call(this, done);
  });

  it('client.waitForElementNotVisible() success', function(done) {
    const assertion = [];
    NightwatchAssertion.create = function(...args) {
      assertion.unshift(...args);

      return createOrig(...args);
    };

    MockServer.addMock({
      url : '/wd/hub/session/1352110219202/element/0/displayed',
      method:'GET',
      response : JSON.stringify({
        sessionId: '1352110219202',
        status:0,
        value : false
      })
    });


    this.client.api.globals.abortOnAssertionFailure = false;
    this.client.api.waitForElementNotVisible('#weblogin', 110, 50, function callback(result, instance) {
      assert.strictEqual(assertion[0], true);
      assert.strictEqual(assertion[4], false);
      NightwatchAssertion.create = createOrig;
    });

    this.client.start(done);
  });

  it('client.waitForElementNotVisible() failure', function(done) {
    MockServer.addMock({
      url : '/wd/hub/session/1352110219202/element/0/displayed',
      method:'GET',
      response : JSON.stringify({
        sessionId: '1352110219202',
        status:0,
        value : true
      })
    });

    const assertion = [];
    NightwatchAssertion.create = function(...args) {
      assertion.unshift(...args);

      return createOrig(...args);
    };

    this.client.api.globals.abortOnAssertionFailure = true;

    this.client.api.waitForElementNotVisible('#weblogin', 15, 10, function callback(result) {
      assert.strictEqual(result.status, 0);
      assert.strictEqual(assertion[0], false);
      assert.strictEqual(assertion[1].actual, 'visible');
      assert.strictEqual(assertion[1].expected, 'not visible');
      assert.strictEqual(assertion[3], 'Timed out while waiting for element <#weblogin> to not be visible for 15 milliseconds.');
      assert.strictEqual(assertion[4], true); // abortOnFailure
    });

    this.client.start(function(err) {
      assert.strictEqual(err.abortOnFailure, true);
      assert.ok(err instanceof Error);
      done();
    });
  });
});

