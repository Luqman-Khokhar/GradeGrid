import { test } from 'node:test';
import assert from 'node:assert/strict';
import { clientKey } from './rateLimit.js';

test('keys IPv4 clients by address, including IPv4-mapped IPv6', () => {
  assert.equal(clientKey('203.0.113.7'), '203.0.113.7');
  assert.equal(clientKey('::ffff:203.0.113.7'), '203.0.113.7');
});

test('keys IPv6 clients by their /64 so rotating addresses shares one bucket', () => {
  assert.equal(clientKey('2001:db8:85a3:12:1:2:3:4'), '2001:db8:85a3:12::/64');
  assert.equal(clientKey('2001:db8:85a3:12:ffff::9'), '2001:db8:85a3:12::/64');
  assert.equal(clientKey('2001:0db8::1'), '2001:db8:0:0::/64');
  assert.equal(clientKey('::1'), '0:0:0:0::/64');
});

test('falls back to a shared key when the address is missing', () => {
  assert.equal(clientKey(undefined), 'unknown');
});
