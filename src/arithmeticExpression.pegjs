/*
 * Simple Arithmetics Grammar Created With PEG.js
 * ==============================================
 *
 * Accepts expressions like "2 * (3 + 4) * variable".
 * The result is a function which accepts an environment
 * (a js object) and returns a number.
 */

Expression
  = head:Term tail:(_ ("+" / "-") _ Term)* {
      var result = head;

      for (let i = 0; i < tail.length; i++) {
        if (tail[i][1] === "+") {
          let prev = result;
          let next = tail[i][3];
          result = (env) => prev(env) + next(env);
        }
        if (tail[i][1] === "-") {
          let prev = result;
          let next = tail[i][3];
          result = (env) => prev(env) - next(env);
        }
      }

      return result;
    }

Term
  = head:Factor tail:(_ ("*" /*/ "/"*/) _ Factor)* {
      var result = head;

      for (let i = 0; i < tail.length; i++) {
        if (tail[i][1] === "*") {
          let prev = result;
          let next = tail[i][3];
          result = (env) => prev(env) * next(env);
        }
        /*if (tail[i][1] === "/") {
          let prev = result;
          let next = tail[i][3];
          result = (env) => prev(env) / next(env);
        }*/
      }

      return result;
    }

Factor
  = "(" _ expr:Expression _ ")" { return expr; }
  / Number
  / Variable

Number "number"
  = [+-]?[0-9]+('.'[0-9]+)? {
      let value = parseInt(text(), 10);
      return (env) => value;
    }

Variable "variable"
  = [_a-zA-Z][_a-zA-Z0-9]* {
      let ide = text();
      return (env) => (env.has(ide) ? +env.get(ide) : expected("Identifier '" + ide + "' is not defined"));
    }

_ "whitespace"
  = [ \t\n\r]*