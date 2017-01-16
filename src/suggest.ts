import { Rule, Interval, SpaceInterval } from './types'
import * as Common from './common'
const algebra = require('algebra.js'); // For parsing expressions
const lpsolver = require('javascript-lp-solver');

type StickyEndpoint = {
    /**
     * Index of the pattern to which this endpoint belongs.
     */
    pattern_index: number,
    /**
     * True if it's the left endpoint, false if it's the right endpoint.
     */
    left: boolean,
    /**
     * Value to stick this endpoint to.
     */
    stickTo: number
};

export function suggest(pattern: Rule[], intervals: Interval[], ordered = false): Interval[] | null {
    if (pattern.length === 0) {
        return [];
    }

    // FIXME We should check that the expressions are linear
    // FIXME Order intervals?
    
    let result = generateIntervals(pattern, intervals, null, []);

    if (result !== null && intervals.length > 0) {

        // For each interval in `result` find the closest intervals in `intervals`.
        // pattern[i] is associated with intervals[associations[i]]
        let associations: number[] = [];
        for (let i = 0; i < pattern.length; i++) {
            associations.push(
                intervals.indexOf(
                    closestInterval(result[i],
                                    intervals.filter((_, i) => associations.indexOf(i) === -1))));
        }

        /*
            For each interval in `result`, take the endpoints of its associated interval.
            Sort these endpoints from the closest to the farther w.r.t. the current result.
            For each endpoint, from 0 to n:
               Mark endpoint as sticky
               r = generateIntervals(...)
               If r failed or #errors in r > previous #errors in r:
                 Mark endpoint as not sticky.
            return r
        */

        const endpoints = result.map((resultIv, i) => [
            { pattern_index: i, left: true,  stickTo: intervals[associations[i]].from, current_value: resultIv.from, sticky: false },
            { pattern_index: i, left: false, stickTo: intervals[associations[i]].to,   current_value: resultIv.to, sticky: false }
        ])
        .reduce((a, b) => [...a, ...b])
        .sort((a, b) => Math.abs(a.current_value - a.stickTo) - Math.abs(b.current_value - b.stickTo));

        let lastError = errorMeasure(result, intervals);

        if (endpoints.length <= 4) {
            // They are few, we can try all binary combinations...
            const failingCombinations: typeof endpoints[] = [];
            for (let e of powerset(endpoints)) {
                // If one combination has been already tried unsuccessfully (infeasible), ignore the sets 'e' containing that combination.
                if (failingCombinations.find(v => v.every(x => e.indexOf(x) >= 0))) {
                    continue;
                }

                for (let ep of e) {
                    ep.sticky = true;
                }

                const candidateResult = generateIntervals(pattern, intervals, associations, endpoints.filter(v => v.sticky));
                if (candidateResult === null) {
                    failingCombinations.push(e);
                } else {
                    const error = errorMeasure(candidateResult, intervals);
                    if (isLessThan(error, lastError)) {
                        result = candidateResult;
                        lastError = error;
                    }
                }

                for (let ep of e) {
                    ep.sticky = false;
                }
            }
        } else {
            for (let e of endpoints) {
                e.sticky = true;

                const candidateResult = generateIntervals(pattern, intervals, associations, endpoints.filter(v => v.sticky));
                if (candidateResult === null) {
                    e.sticky = false;
                } else {
                    const error = errorMeasure(candidateResult, intervals);
                    if (isLessThan(error, lastError)) {
                        result = candidateResult;
                        lastError = error;
                    } else {
                        e.sticky = false;
                    }
                }
            }
        }
    }

    return result;
}

/**
 * Generate a set of intervals matching the specified pattern and close to the provided intervals.
 * 
 * @param pattern       The pattern from which to generate intervals
 * @param intervals     The generated intervals will be as close as possible to these intervals
 * @param associations  Associate each rule of `pattern` to an interval of `intervals`. The length of this
 *                      array must be equal to that of `pattern`. If it is null, it is considered as an
 *                      array of all null elements.
 *                      For example, if this parameter is `[3, null, 2]`, it means that the first
 *                      rule is associated with the interval at index 3, the second rule with nothing
 *                      and the third rule with the interval at index 2.
 * @param stickyEndpoints  An array which contains a set of endpoints for which to force a specified value.
 */
function generateIntervals(pattern: Rule[], intervals: Interval[], associations: number[]|null, stickyEndpoints: StickyEndpoint[]): Interval[] | null
{
    if (pattern.length === 0) {
        return [];
    }

    if (associations === null) {
        associations = Array(pattern.length).fill(null);
    }

    /*

    We try to find compatible intervals using linear programming.

    What we try to minimize is:

        * The length of the intervals
        * The difference with the provided intervals

    We can do the former by using an objective function like the following:

        min: (i0_to - i0_from) + (i1_to - i1_from) + ... + (in_to - in_from)

    And we can partially do the latter by using an objective function like the following:

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
    To put it in our linear system we need to express 'A' with respect to the interval
    start and end. So, to continue with our example, the inequality will become:

         - i(k).from + i(k).to  >=  2*(A) + 5
        =
         - i(k).from + i(k).to  >=  2*(i(h).to - i(h).from) + 5
        =
         - i(k).from + i(k).to  >=  2*i(h).to - 2*i(h).from + 5
        =
         - i(k).from + i(k).to - 2*i(h).to + 2*i(h).from  >=  5

    Where i(h) is the interval matched by the pattern A.
    And now we can put that inequality into our system.

    Note that right now we're using `javascript-lp-solver` to solve the linear problems.
    This requires us to write the system in the format of lp_solve, which has a special syntax:
    http://lpsolve.sourceforge.net/5.5/lp-format.htm
    */


    // Get the longest match, and filter out the space intervals
    const longestMatch: Interval[] = Common.tryMatch(pattern, intervals).result.filter(v => !Common.isSpaceInterval(v));

    // Let's build the objective function.
    const absoluteInequalities: string[] = []; // Additional inequalities for absolute values
    const coefficients = new Map([['', 0]]);
    for (let i = 0; i < pattern.length; i++) {
        const rule = pattern[i];

        // Minimize the difference with already matching intervals
        if (i < longestMatch.length || associations[i] !== null) {
            const match = associations[i] === null ? longestMatch[i] : intervals[associations[i]];

            /*
                We want to insert the following into the objective function to be minimized:

                    2*|i(k)_from - match.from| + |i(k)_to - match.to|

                But we can't use that because of the absolute value. We need to add extra inequalities
                to simulate an absolute operator. We exploit the following property:

                    min |x| + |y| + ...
                    Ax <= b

                is equivalent to

                    min t1 + t2 + ...
                     x <= t1
                    -x <= t1
                     y <= t2
                    -y <= t2
                    ...
                    Ax <= b

                See also http://math.stackexchange.com/questions/623568/minimizing-the-sum-of-absolute-values-with-a-linear-solver

                (you can observe that t1, t2, etc will always be positive).


                We have the multiplicative constant 2 because we can't assign the same weight to
                the distance of the "from" endpoint and the distance of the "to" endpoint, otherwise
                the resulting interval could be in the middle. By doubling the weight of the "from"
                endpoint, we ensure that the "from" endpoint of the generated interval will be as
                close as possible to the original "from" endpoint, and from there the "to" endpoint
                can move as needed.
            */

            mapSum(coefficients, `absDiff_i${i}_from`, 2);
            mapSum(coefficients, `absDiff_i${i}_to`, 1);

            absoluteInequalities.push(`i${i}_from - absDiff_i${i}_from <= ${match.from}`);
            absoluteInequalities.push(`i${i}_from + absDiff_i${i}_from >= ${match.from}`);
            absoluteInequalities.push(`i${i}_to - absDiff_i${i}_to <= ${match.to}`);
            absoluteInequalities.push(`i${i}_to + absDiff_i${i}_to >= ${match.to}`);

        } else {
            // Minimize the size of the intervals
            //    i(k)_to - i(k)_from
            mapSum(coefficients, `i${i}_to`, 1);
            mapSum(coefficients, `i${i}_from`, -1);
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

    // Constraints for sticky endpoints
    for (let e of stickyEndpoints) {
        if (e.left) {
            model.push(`i${e.pattern_index}_from = ${e.stickTo}`);
        } else {
            model.push(`i${e.pattern_index}_to = ${e.stickTo}`);
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
        const output: Interval[] = [];
        for (let i = 0; i < pattern.length; i++) {
            output.push({ from: result[`i${i}_from`] || 0, to: result[`i${i}_to`] || 0, data: undefined });
        }
        return output;
    } else {
        return null;
    }
}

/**
 * Get a measure of the difference between the provided intervals.
 */
export function errorMeasure(intervals1: Interval[], intervals2: Interval[]) {
    let a = flattenIntervals(intervals1);
    let b = flattenIntervals(intervals2);

    /*
        Count the non-overlapping sections: they're errors
        Possible cases of interest for interval i:

              i-1                   current i                  i+1
         |------------|          |============|          |------------|

        0  - - - ----------|
        1  - - - ----------------------|
        2  - - - --------------------------------------------- - - -
        3                |-| |-|
        4                |-------------|
        5                          |--| |--|
        6                                  |--------|
        7                                  |------------------ - - -
        8
    */

    const errors: {from: number, to: number}[] = [];

    let i = 0;
    let j = 0;

    // a must always be the first to begin. If that's not the case, exchange them.
    if (a.length > 0 && b.length > 0 && b[0].from < a[0].from) {
        const tmp = a;
        a = b;
        b = tmp;
    }

    while (i < a.length) {

        let left_i = a[i].from;

        while (j < b.length && b[j].from < a[i].to) {

            if (i > 0 && b[j].from <= a[i-1].to && b[j].to <= a[i].from) {
                // (0)
                errors.push({from: a[i-1].to, to: b[j].to});
            } else if (i > 0 && b[j].from <= a[i-1].to && a[i].from <= b[j].to && b[j].to <= a[i].to) {
                // (1)
                errors.push({from: a[i-1].to, to: b[j].to});
                left_i = b[j].to;
            } else if (i > 0 && b[j].from <= a[i-1].to && a[i].to <= b[j].to) {
                // (2)
                errors.push({from: a[i-1].to, to: a[i].from});
                left_i = a[i].to;
                break;
            } else if ((i === 0 || a[i-1].to <= b[j].from) && b[j].from <= a[i].from && b[j].to <= a[i].from) {
                // (3)
                errors.push({from: b[j].from, to: b[j].to});
            } else if ((i === 0 || a[i-1].to <= b[j].from) && b[j].from <= a[i].from && a[i].from <= b[j].to && b[j].to <= a[i].to) {
                // (4)
                errors.push({from: b[j].from, to: a[i].from});
                left_i = b[j].to;
            } else if (a[i].from <= b[j].from && b[j].to <= a[i].to) {
                // (5)
                errors.push({from: left_i, to: b[j].from})
                left_i = b[j].to;
            } else if (a[i].from <= b[j].from && b[j].from <= a[i].to && (i+1>=a.length || b[j].to <= a[i+1].from)) {
                // (6)
                errors.push({from: a[i].to, to: b[j].to})
                left_i = a[i].to;
            } else if (i+1<a.length && a[i].from <= b[j].from && b[j].from <= a[i].to && a[i+1].from <= b[j].to) {
                // (7)
                errors.push({from: a[i].to, to: a[i+1].from})
                left_i = a[i].to;
                break;
            }

            j++;
        }

        if (left_i < a[i].to) {
            // (8)
            errors.push({from: left_i, to: a[i].to})
        }

        i++;
    }

    while (j < b.length) {
        if (a.length > 0 && b[j].from <= a[a.length-1].to) {
            errors.push({from: a[a.length-1].to, to: b[j].to})
        } else {
            errors.push({from: b[j].from, to: b[j].to})
        }

        j++;
    }

    const normalized = errors.filter(v => v.from < v.to);

    return [
        normalized.reduce((sum, curr) => sum + Math.abs(curr.to - curr.from), 0),
        // at the same cost, we prefer contiguous intervals
        normalized.length,
        // prefer when errors are located at the end
        normalized.length > 0 ? -normalized.reduce((sum, curr) => sum + curr.to + curr.from, 0) / (2*normalized.length) : 0
    ];
}

function isLessThan(errMeasure1: any[], errMeasure2: any[]) {
    for (let i = 0; i < Math.min(errMeasure1.length, errMeasure2.length); i++) {
        if (errMeasure1[i] < errMeasure2[i]) {
            return true;
        } else if (errMeasure1[i] > errMeasure2[i]) {
            return false;
        }
    }
    return false;
}

/**
 * Return the ordered and flattened intervals as a copy.
 * Running time: O(log n)
 */
function flattenIntervals(intervals: Interval[]) {
    return intervals
        .sort((a, b) => a.to - b.to)
        .sort((a, b) => a.from - b.from)
        .reduce((prev, curr, i) => {
            if (i === 0) {
                return [curr];
            } else {
                const last = prev[prev.length - 1];
                if (last.to <= curr.from) {
                    return [...prev, { from: curr.from, to: curr.to, data: null }];
                } else if (curr.to <= last.to) {
                    return prev;
                } else {
                    return [...prev, { from: last.to, to: curr.to, data: null }]
                }
            }
        }, <Interval[]>[])
}

function closestInterval(interval: Interval, intervals: Interval[]): Interval {
    return intervals.reduce((prev, curr) => 
        Math.abs(curr.from - interval.from) + Math.abs(curr.to - interval.to) <
        Math.abs(prev.from - interval.from) + Math.abs(prev.to - interval.to) ?
        curr : prev, intervals[0]);
}

/**
 * Given an expression and a list of rules, simplify the expression and
 * writes it with respect to the intervals from and to values.
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

function *powerset<T>(array: T[]) {
    const len = Math.pow(2, array.length);

    const mask = [1];
    for (let i = 1; i < array.length; i++) {
        mask[i] = 2 * mask[i-1];
    }

    for (let n = 0; n < len; n++) {
        yield array.filter((_, i) => (n & mask[i]));
    }
}