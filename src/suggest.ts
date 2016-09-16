import { Rule, Interval, SpaceInterval } from './types'
import * as Common from './common'
const algebra = require('algebra.js'); // For parsing expressions
const lpsolver = require('javascript-lp-solver');

export function suggest(pattern: Rule[], intervals: Interval[], ordered = false): Interval[] | null {
    if (pattern.length === 0) {
        return [];
    }

    // FIXME We should check that the expressions are linear

    

/*

    We try to find compatible intervals using linear programming.

    What we try to minimize is:

        * The length of the intervals
        * The difference with the provided intervals

    We can do the former by using an objective function like the following:

        min: (i0_to - i0_from) + (i1_to - i1_from) + ... + (in_to - in_from)

    And we can do the latter by using an objective function like the following:

        min: |i0_from - match0.from| + |i0_to - match0.to| + ... + |in_from - matchn.from| + |in_to - matchn.to|

    The names `i(k)_from` and `i(k)_to` represent variables in our linear programming problem. These are the
    values that we want to find, as they describe resp. the start and the end of the k-th interval.

    We scan the provided intervals for matches with our pattern. The names `match(k).from` and
    `match(k).to` refer to the interval that matched the k-th rule in the pattern. As we have seen,
    we use these to generate results that are close to the provided intervals.


    Ok, so we have an objective function. Let's see what the constraints are.

        /
        |   i0.from                    >=  rule0.interval.from.lowerBound
        |   i0.from                    <=  rule0.interval.from.upperBound
        |             i0.to            >=  rule0.interval.to.lowerBound
        |             i0.to            <=  rule0.interval.to.upperBound
       /  - i0.from + i0.to            >=  rule0.interval.minSize (function)
       \  - i0.from + i0.to            <=  rule0.interval.maxSize (function)
        |           - i0.to + i1.from  >=  rule0.followingSpace.minSize (function)
        |           - i0.to + i1.from  <=  rule0.followingSpace.maxSize (function)
        |                             ....
        |                 (repeat for rule1 and so on)
        |                             ....
        \

    Actually, it's more complicated than that. As you see, some of them are functions.
    Take, for example, `rule(k).interval.minSize`. It can be an expression like this:

        2*A + 5

    where 'A' refers to the name of a pattern. That expression means:

        minSize should be twice the size of the interval matched by A, plus 5

    This expression must be linear.
    To put it in our linear system we need to express 'A' with respect to the interval's
    start and end. So, to continue with our example, the inequality will become:

         - i(k).from + i(k).to  >=  2*(A) + 5
        =
         - i(k).from + i(k).to  >=  2*(i(h).to - i(h).from) + 5
        =
         - i(k).from + i(k).to  >=  2*i(h).to - 2*i(h).from + 5
        =
         - i(k).from + i(k).to - 2*i(h).to + 2*i(h).from  >=  5

    And now we can put that into our system.

    Note that right now we're using `javascript-lp-solver` to solve the linear problems.
    This requires us to write the system in the format of lp_solve, which has a special syntax:
    http://lpsolve.sourceforge.net/5.5/lp-format.htm
    */


    // Get the longest match, filtering out the space intervals
    const longestMatch: Interval[] = Common.tryMatch(pattern, intervals).result.filter(v => !Common.isSpaceInterval(v));

    // Let's build the objective function.
    const absoluteInequalities: string[] = []; // Additional inequalities for absolute values
    const coefficients = new Map([['', 0]]);
    for (let i = 0; i < pattern.length; i++) {
        const rule = pattern[i];
        // Minimize the size of the intervals
        //    i(k)_to - i(k)_from
        mapSum(coefficients, `i${i}_to`, 1);
        mapSum(coefficients, `i${i}_from`, -1);

        // Minimize the difference with already matching intervals
        if (i < longestMatch.length) {
            const match = longestMatch[i];

            /*
                We want to insert the following into the objective function to be minimized:

                    |i(k)_from - match.from| + |i(k)_to - match.to|

                But we can't use that because of the absolute value. We need to add extra inequalities
                to simulate an absolute operator. We exploit the following property:

                    min |x| + |y| + ...
                    Ax <= b

                is equivalent to

                    min t1 + t2 + ...
                    x <= t1
                    x >= -t1
                    y <= t2
                    y >= -t2
                    ...
                    Ax <= b

                See also http://math.stackexchange.com/questions/623568/minimizing-the-sum-of-absolute-values-with-a-linear-solver
            */

            mapSum(coefficients, `absDiff_i${i}_from`, 1);
            mapSum(coefficients, `absDiff_i${i}_to`, 1);

            absoluteInequalities.push(`i${i}_from - absDiff_i${i}_from <= ${match.from}`);
            absoluteInequalities.push(`i${i}_from + absDiff_i${i}_from >= ${match.from}`);
            absoluteInequalities.push(`i${i}_to - absDiff_i${i}_to <= ${match.to}`);
            absoluteInequalities.push(`i${i}_to + absDiff_i${i}_to >= ${match.to}`);
        }
    }

    let model = ['min: ' + [...coefficients].map(([name,val]) => `+ ${val} ${name}`).join(' ')];
    model.push(...absoluteInequalities);

    // Ok, let's build the actual constraints
    for (let i = 0; i < pattern.length; i++) {
        const rule = pattern[i];

        // rule.interval.from.lowerBound
        if (rule.interval.from && rule.interval.from.lowerBound && rule.interval.from.lowerBound > -Infinity) {
            model.push(`i${i}_from >= ${rule.interval.from.lowerBound}`);
        }

        // rule.interval.from.upperBound
        if (rule.interval.from && rule.interval.from.upperBound && rule.interval.from.upperBound < Infinity) {
            model.push(`i${i}_from <= ${rule.interval.from.upperBound}`);
        }

        // rule.interval.to.lowerBound
        if (rule.interval.to && rule.interval.to.lowerBound && rule.interval.to.lowerBound > -Infinity) {
            model.push(`i${i}_to >= ${rule.interval.to.lowerBound}`);
        }

        // rule.interval.to.upperBound
        if (rule.interval.to && rule.interval.to.upperBound && rule.interval.to.upperBound < Infinity) {
            model.push(`i${i}_to <= ${rule.interval.to.upperBound}`);
        }

        // rule.interval.minSize
        if (rule.interval) {
            const coefficients = decomposeExpression(rule.interval.minSize, pattern);
            const constant = coefficients.get('');
            coefficients.delete('');

            if (constant > -Infinity) {
                // Add the current condition to the inequality. Negate it to put it in the right hand side.
                mapSum(coefficients, `i${i}_to`, -1)
                mapSum(coefficients, `i${i}_from`, 1)

                // Negate the values to bring them to the left hand side of the inequality.
                const terms = [...coefficients].map(([name, val]) => `${-val} ${name}`).join(' ');
                model.push(`${terms} >= ${constant}`);
            }
        }

        // rule.interval.maxSize
        if (rule.interval) {
            const coefficients = decomposeExpression(rule.interval.maxSize, pattern);
            const constant = coefficients.get('');
            coefficients.delete('');

            if (constant < Infinity) {
                // Add the current condition to the inequality. Negate it to put it in the right hand side.
                mapSum(coefficients, `i${i}_to`, -1)
                mapSum(coefficients, `i${i}_from`, 1)

                // Negate the values to bring them to the left hand side of the inequality.
                const terms = [...coefficients].map(([name, val]) => `${-val} ${name}`).join(' ');
                model.push(`${terms} <= ${constant}`);
            }
        }

        // rule.followingSpace.minSize
        if (rule.followingSpace) {
            const coefficients = decomposeExpression(rule.followingSpace.minSize, pattern);
            const constant = coefficients.get('');
            coefficients.delete('');

            if (constant > -Infinity) {
                // Add the current condition to the inequality. Negate it to put it in the right hand side.
                mapSum(coefficients, `i${i}_to`, 1)
                mapSum(coefficients, `i${i+1}_from`, -1)

                // Negate the values to bring them to the left hand side of the inequality.
                const terms = [...coefficients].map(([name, val]) => `${-val} ${name}`).join(' ');
                model.push(`${terms} >= ${constant}`);
            }
        }

        // rule.followingSpace.maxSize
        if (rule.followingSpace) {
            const coefficients = decomposeExpression(rule.followingSpace.maxSize, pattern);
            const constant = coefficients.get('');
            coefficients.delete('');

            if (constant < Infinity) {
                // Add the current condition to the inequality. Negate it to put it in the right hand side.
                mapSum(coefficients, `i${i}_to`, 1)
                mapSum(coefficients, `i${i+1}_from`, -1)

                // Negate the values to bring them to the left hand side of the inequality.
                const terms = [...coefficients].map(([name, val]) => `${-val} ${name}`).join(' ');
                model.push(`${terms} <= ${constant}`);
            }
        }
    }

    // Constraints for positivity of i(k)_from and positivity of interval length
    for (let i = 0; i < pattern.length; i++) {
        model.push(`i${i}_from >= 0`);
        model.push(`i${i}_to - i${i}_from >= 0`);
    }

    const structured = lpsolver.ReformatLP(model);
    const result = lpsolver.Solve(structured);

    if (result.feasible) {
        const intervals: Interval[] = [];
        for (let i = 0; i < pattern.length; i++) {
            intervals.push({ from: result[`i${i}_from`], to: result[`i${i}_to`], data: undefined });
        }
        return intervals;
    } else {
        return null;
    }
}

/**
 * Given an expression and a list of rules, simplify the expression and
 * writes it with respect to the intervals' from and to values.
 * 
 * For example, having the rules:
 * 
 *     [ {interval: {name: 'A', ...}, followingSpace: {name: 'B', ...}},
 *       {interval: {name: 'C', ...}, followingSpace: {name: 'D', ...}} ]
 * 
 * and the expression `2B + C + 7 + B`, which is equivalent to
 * 
 *     0A + 3B + 1C + 0D + 7
 * 
 * we get as the result the following map:
 * 
 *     Map {'i0_to' => -3, 'i1_from' => 2, 'i1_to' => 1, '' => 7 }
 * 
 * because
 * 
 *     A is zero, ignored
 *     B is 3 => 3*(B) = 3*(C.from - A.to) = 3*(i1_from - i0_to) = 3*i1_from -3*i0_to
 *     C is 1 => 1*(C) = 1*(C.to - C.from) = 1*(i1_to - i1_from) = 1*i1_to -1*i1_from
 *     D is 0, ignored
 * 
 */
function decomposeExpression(expression: number|string, pattern: Rule[]) {
    return explodeIdentifiers(extractCoefficients(expression), pattern);
}

/**
 * Transform an expression like `A + 2B + B + 5` into:
 * 
 *     Map { 'A' => 1, 'B' => 3, '' => 5 }
 */
function extractCoefficients(expression: number|string) {
    if (Common.isNumber(expression)) {
        return new Map([['', expression]]);
    } else {
        const res = new Map([['', 0]]);
        const expr = algebra.parse(expression).simplify();
        if (expr.constants.length > 0) {
            res.set('', expr.constants[0]);
        }
        for (let term of expr.terms) {
            if (term.variables.length === 1 && term.variables[0].degree === 1) {
                res.set(term.variables[0].variable, term.coefficients[0]);
            } else {
                throw new Error("Non-linear expression");
            }
        }
        return res;
    }
}

/**
 * Takes in input a map of coefficients and a list of rules, for example:
 * 
 *     Map { 'B' => 2, 'C' => 3, '' => 7 }
 * 
 *     [ {interval: 'A', followingSpace: 'B'},
 *       {interval: 'C', followingSpace: 'D'} ]
 * 
 * Generally speaking, this function transforms '3C' into '3(C.to - C.from)' = '3C.to - 3C.from' (but with different names).
 * If the identifier is a followingSpace (e.g. 'B'), then it expresses the difference in terms of the preceding and following interval.
 * 
 *     Map {'i0_from' => 0, 'i0_to' => -2, 'i1_from' => -3 + 2, 'i1_to' => 3, '' => 7 }
 */
function explodeIdentifiers(coefficients: Map<string, number>, pattern: Rule[]) {
    const result = new Map<string, number>();
    for (let i = 0; i < pattern.length; i++) {
        const rule = pattern[i];

        if (rule.interval.name !== '' && coefficients.has(rule.interval.name)) {
            mapSum(result, `i${i}_to`, coefficients.get(rule.interval.name));
            mapSum(result, `i${i}_from`, -coefficients.get(rule.interval.name));
        }

        if (rule.followingSpace) {
            if (rule.followingSpace.name !== '' && coefficients.has(rule.followingSpace.name)) {
                mapSum(result, `i${i}_to`, -coefficients.get(rule.followingSpace.name));
                mapSum(result, `i${i+1}_from`, coefficients.get(rule.followingSpace.name));
            }
        }
    }

    result.set('', coefficients.get(''));
    return result;
}

/**
 * Sum a value in a map. If the value didn't exist, sum it to zero.
 */
function mapSum<T>(map: Map<T, number>, key: T, val: number) {
    if (map.has(key)) {
        map.set(key, map.get(key) + val);
    } else {
        map.set(key, val);
    }
}