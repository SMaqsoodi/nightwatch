const assert = require('assert');
const {Given, Then, After} = require('@cucumber/cucumber');

Given('I navigate to localhost', function() {
  browser.globals.test_calls++;

  return browser.navigateTo('http://localhost');
});

Then('I check if webdriver is present', function() {
  browser.globals.test_calls++;

  return browser.assert.elementPresent('#webdriver');
});

Then('I check if badElement is present', function() {
  browser.globals.test_calls++;

  return browser.assert.elementPresent('#badElement');
});

After(function() {
  assert.strictEqual(browser.globals.test_calls, 2);
});