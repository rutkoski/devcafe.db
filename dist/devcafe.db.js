/*! DevCafé DB - v0.1.0 - 2012-09-05
* https://github.com/rutkoski/devcafe.db
* Copyright (c) 2012 Rodrigo Rutkoski Rodrigues; Licensed MIT, GPL */

(function(window, undefined) {

  function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  function isEmpty(obj) {
    for (var prop in obj) {
      if(obj.hasOwnProperty(prop))
        return false;
    }

    return true;
  }

  function isArray(someVar) {
    return ( Object.prototype.toString.call( someVar ) === '[object Array]' );
  }

  // indexOf polyfill
  if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function(elt /*, from*/)
    {
      var len = this.length >>> 0;
      var from = Number(arguments[1]) || 0;
      from = (from < 0)
           ? Math.ceil(from)
           : Math.floor(from);
      if (from < 0)
        from += len;

      for (; from < len; from++)
      {
        if (from in this &&
            this[from] === elt)
          return from;
      }
      return -1;
    };
  }

  BoolExpr = {
    parse: function(expr) {
      function _parse(expr, and) {
        if (typeof and === 'undefined') {
          and = true;
        }

        if (! (expr + '').length) {
          return '';
        }

        if (! isArray(expr)) {
          return expr;
        }

        var c = expr.length;

        if (c == 1) {
          return _parse(expr[0], ! and);
        }

        for (var i = 0; i < c; i++) {
          expr[i] = _parse(expr[i], ! and);
        }

        s = '(' + expr.join(and ? ' AND ' : ' OR ') + ')';

        return s;
      }

      return _parse(expr);
    }
  }

  var DB = {
    query: function(sql) {
      return DB.factoryQueryObject().sql(sql);
    },

    insert: function(table, data) {
      return DB.factoryQueryObject().insert(table, data);
    },

    update: function(table, data, where) {
      return DB.factoryQueryObject().update(table, data, where);
    },

    remove: function(table, where) {
      return DB.factoryQueryObject().remove(table, where);
    },

    factoryQueryObject: function() {
      return new QueryObject();
    },

    quote: function(value) {
      if (isNumber(value)) {
        return value;
      } else {
        return "'" + value + "'";
      }
    },

    sqlQuote: function(expr) {
      return '`' + expr + '`';
    }
  };

  QueryObject = function () {

    function _mix(type, values, remove) {
      if (values === true) {
        return params[type];
      }

      if (values === false) {
        params[type] = [];
      }
      else {
        if (! isArray(values)) {
          values = [values];
        }

        var i, c = values.length;

        for (var j = 0; j < c; j++) {
          if (typeof values[j] === 'undefined') continue;

          if (remove === true) {
            if ((i = params[type].indexOf(values[j])) > -1) {
              params[type].splice(i, 1);
            }
          } else {
            if ((i = params[type].indexOf(values[j])) === -1) {
              params[type].push(values[j]);
            }
          }
        }
      }

      _sql = '';

      return q;
    }

    function accept(type) {
      return (_type & type) == _type;
    }

    var _type = QueryObject.SELECT;

    var params = {
      sql: [],
      data: {},
      tables: [],
      fields: [],
      joins: [],
      groupBy: [],
      having: [],
      where: [],
      orderBy: [],
      limit: null,
      offset: null,
      alias: null,
    }

    var _sql = '';

    var q = {

      insert: function(table, data) {
        _type = QueryObject.INSERT;
        return q.from(table).data(data);
      },

      update: function(table, data, where) {
        _type = QueryObject.UPDATE;
        return q.from(table).data(data).where(where);
      },

      remove: function(table, where) {
        _type = QueryObject.DELETE;
        return q.from(table).where(where);
      },

      sql: function(sql) {
        _type = QueryObject.SELECT;

        if (sql === true) {
          return params.sql;
        } else if (sql === false) {
          params.sql = null;
        } else {
          params.sql = sql;
        }

        _sql = '';

        return q;
      },

      alias: function(alias) {
        if (alias === true) {
          return params.alias;
        } else if (alias === false) {
          params.alias = null;
        } else {
          params.alias = alias;
        }
        return q;
      },

      data: function(data) {
        if (data === true) {
          return params.data;
        } else if (data === false) {
          params.data = {};
        } else {
          params.data = data;
        }
        return q;
      },

      from: function(expr, remove) {
        return _mix('tables', expr, remove);
      },

      select: function(expr, remove) {
        return _mix('fields', expr, remove);
      },

      leftJoin: function(expr, remove) {
        return _mix('joins', [ expr, 'LEFT JOIN' ], remove);
      },

      rightJoin: function(expr, remove) {
        return _mix('joins', [ expr, 'RIGHT JOIN' ], remove);
      },

      innerJoin: function(expr, remove) {
        return _mix('joins', [ expr, 'INNER JOIN' ], remove);
      },

      groupBy: function(expr, remove) {
        return _mix('groupBy', expr, remove);
      },

      having: function(expr, remove) {
        return _mix('having', expr, remove);
      },

      where: function(expr, remove) {
        return _mix('where', expr, remove);
      },

      orderBy: function(expr, remove) {
        return _mix('groupBy', expr, remove);
      },

      limit: function(limit) {
        if (limit === true) {
          return params.limit;
        } else if (limit === false) {
          params.limit = null;
        } else {
          params.limit = limit;
        }

        _sql = '';

        return q;
      },

      offset: function(offset) {
        if (offset === true) {
          return params.offset;
        } else if (offset === false) {
          params.offset = null;
        } else {
          params.offset = offset;
        }

        _sql = '';

        return q;
      },

      /**
       * Build the query
       *
       * @return string
       */
      buildQuery: function() {
        if (! _sql.length) {
          var sql = [];

          /**
           *
           * fields
           *
           */

          if (accept(QueryObject.SELECT)) {
            sql.push('SELECT');

            if (params.fields.length) {
              sql.push(params.fields.join(', '));
            } else {
              sql.push('*');
            }

            sql.push('FROM');
          }
          else if (accept(QueryObject.INSERT)) {
            sql.push('INSERT INTO');
          }
          else if (accept(QueryObject.UPDATE)) {
            sql.push('UPDATE');
          }
          else if (accept(QueryObject.DELETE)) {
            sql.push('DELETE FROM');
          }

          /**
           *
           * tables
           *
           */

          if (params.tables.length) {
            sql.push(params.tables.join(', '));
          } else {
            throw new Error('Missing table in expression');
          }

          /**
           *
           * insert/update data
           *
           */

          if (accept(QueryObject.UPDATE) && ! isEmpty(params.data)) {
            sql.push('SET ' . QueryObject.buildUpdate(params.data));
          }
          else if (accept(QueryObject.INSERT) && ! isEmpty(params.data)) {
            sql.push(QueryObject.buildInsert(params.data));
          }

          /**
           *
           * joins
           *
           */

          if (accept(QueryObject.SELECT)) {
            if (params.joins.length) {
              for (var i in params.joins) {
                sql.push(params.joins[i][1] + ' ' + params.joins[i][0]);
              }
            }
          }

          /**
           *
           * where
           *
           */

          if (accept(QueryObject.ALL ^ QueryObject.INSERT)) {
            if (params.where.length) {
              sql.push('WHERE');
              sql.push(BoolExpr.parse(params.where));
            }
          }

          /**
           *
           * group by and having
           *
           */

          if (accept(QueryObject.SELECT)) {
            if (params.groupBy.length) {
              sql.push('GROUP BY');
              sql.push(params.groupBy.join(', '));

              if (params.having.length) {
                sql.push(BoolExpr.parse(params.having));
              }
            }
          }

          /**
           *
           * order by
           *
           */

          if (accept(QueryObject.ALL ^ QueryObject.INSERT)) {
            if (params.orderBy.length) {
              sql.push('ORDER BY');
              sql.push(params.orderBy.join(', '));
            }
          }

          /**
           *
           * limit
           *
           */

          if (params.limit !== null) {
            sql.push('LIMIT');
            sql.push(params.limit);
          }

          /**
           *
           * offset
           *
           */

          if (params.offset !== null) {
            sql.push('OFFSET');
            sql.push(params.offset);
          }

          _sql = sql.join(' ');

          if (accept(QueryObject.SELECT) && params.alias) {
            _sql = '(' + _sql + ') ' + params.alias;
          }
        }

        return _sql;
      }
    };

    return q;
  };

  QueryObject.buildIn = function(field, values, not) {
    if (! values.length) {
      return ' TRUE ';
    }

    if (! isArray(values)) {
      values = [ values ];
    }

    for (var i in values) {
      values[i] = DB.quote(values[i]);
    }

    s = DB.sqlQuote(field);

    var value = values.join(', ');

    if (values.length > 1) {
      s = s + (not ? ' NOT ' : '') + ' IN (' + value + ')';
    } else {
      s = s + (not ? ' !' : ' ') + '= ' + value;
    }

    return s;
  };

  QueryObject.buildInsert = function(data, wildcard) {
    if (typeof wildcard === 'undefined') {
      wildcard = false;
    }

    fields = [];
    values = [];

    for (var k in data) {
      var v = data[k];

      fields.push(DB.sqlQuote(k));

      if (wildcard === false) {
        values.push(DB.quote(v));
      } else if (typeof wildcard === 'string') {
        values.push(wildcard);
      } else {
        values.push(':' + k);
      }
    }

    return '(' + fields.join(', ') + ') VALUES (' + values.join(', ') + ')';
  }

  QueryObject.buildUpdate = function(data, wildcard) {
    if (typeof wildcard === 'undefined') {
      wildcard = false;
    }

    fields = [];

    for (var k in data) {
      var v = data[k];

      if (wildcard === false) {
        v = DB.quote(v);

        fields.push(DB.sqlQuote(k) + ' = ' + v);
      } else if (typeof wildcard === 'string') {
        fields.push(DB.sqlQuote(k) + ' = ' + wildcard);
      } else {
        fields.push(DB.sqlQuote(k) + ' = :' + k);
      }
    }

    return fields.join(', ');
  }

  QueryObject.SELECT = 1;

  QueryObject.UPDATE = 2;

  QueryObject.INSERT = 4;

  QueryObject.DELETE = 8;

  QueryObject.ALL = 15;

  if ( typeof define === "function" && define.amd ) {
    define( "DB", [], function () { return DB; } );
    define( "BoolExpr", [], function () { return BoolExpr; } );
    define( "QueryObject", [], function () { return QueryObject; } );
  } else {
    window.DB = DB;
    window.BoolExpr = BoolExpr;
    window.QueryObject = QueryObject;
  }

})(this);