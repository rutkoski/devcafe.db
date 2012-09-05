/*global QUnit:false, module:false, test:false, asyncTest:false, expect:false*/
/*global start:false, stop:false ok:false, equal:false, notEqual:false, deepEqual:false*/
/*global notDeepEqual:false, strictEqual:false, notStrictEqual:false, raises:false*/
(function($) {

  /*
    ======== A Handy Little QUnit Reference ========
    http://docs.jquery.com/QUnit

    Test methods:
      expect(numAssertions)
      stop(increment)
      start(decrement)
    Test assertions:
      ok(value, [message])
      equal(actual, expected, [message])
      notEqual(actual, expected, [message])
      deepEqual(actual, expected, [message])
      notDeepEqual(actual, expected, [message])
      strictEqual(actual, expected, [message])
      notStrictEqual(actual, expected, [message])
      raises(block, [expected], [message])
  */

  module('devcafe#db', {
    setup: function() {
      this.queryObject = DB.query();
    }
  });

  test('is chainable', 1, function() {
    strictEqual(this.queryObject.select('*'), this.queryObject, 'OK');
  });

  test('no tables, raises error', 1, function() {
    raises(this.queryObject.buildQuery, Error, 'OK');
  });

  test('table only', 1, function() {
    equal(this.queryObject.from('test_table').buildQuery(), 'SELECT * FROM test_table', 'OK');
  });

  test('alias', 1, function() {
    equal(this.queryObject.from('test_table').alias('b').buildQuery(), '(SELECT * FROM test_table) b', 'OK');
  });

  test('select only', 1, function() {
    equal(this.queryObject.select('*').from('test_table').buildQuery(), 'SELECT * FROM test_table', 'OK');
  });

  test('no duplicate values', 1, function() {
    equal(this.queryObject.from('test_table').from('test_table').buildQuery(), 'SELECT * FROM test_table', 'OK');
  });

  test('insert', 1, function() {
    equal(this.queryObject.insert('test_table', { id:1, name:'John' }).buildQuery(), 'INSERT INTO test_table (`id`, `name`) VALUES (1, \'John\')', 'OK');
  });

  test('where empty', 1, function() {
    equal(this.queryObject.from('test_table').where().buildQuery(), 'SELECT * FROM test_table', 'OK');
  });

  test('where with and', 1, function() {
    equal(this.queryObject.from('test_table').where([ "'a'", "'b'" ]).buildQuery(), 'SELECT * FROM test_table WHERE (\'a\' AND \'b\')', 'OK');
  });

  test('where with or', 1, function() {
    equal(this.queryObject.from('test_table').where([ ["'a'", "'b'"] ]).buildQuery(), 'SELECT * FROM test_table WHERE (\'a\' OR \'b\')', 'OK');
  });

}(jQuery));
