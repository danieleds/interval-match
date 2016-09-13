import { ArithmeticExpression } from './arithmeticExpression'
import * as Types from './types'

export module Common
{
    /**
     * Return the first satisfied match, along with the longest partial result.
     * If a match is found, the longest partial result is the same as the result.
     * 
     * @param intervals The set of ORDERED non-overlapping intervals.
     */
    export function tryMatch(pattern: Types.Rule[], intervals: Types.Interval[]) {
        let longestMatchingChain: Types.Result = new Map();
        const result: Types.Result = new Map();

        let currConstraintId = 0;
        for (let i = 0; i < intervals.length; i++) {
            const interval = intervals[i];
            const nextInterval = i+1 < intervals.length ? intervals[i+1] : null;
            const constraint = pattern[currConstraintId];

            // Check if this interval satisfies the current constraint
            const matches = satisfiesRule(interval, nextInterval, constraint, result);

            if (matches) {
                // Add it to the result
                result.set(constraint.interval.name, interval);
                if (constraint.followingSpace) {
                    const spaceInterval = {from: interval.to, to: nextInterval ? nextInterval.from : Infinity, data: undefined};
                    result.set(constraint.followingSpace.name, spaceInterval);
                }

                // Update longestMatchingChain (FIXME It should update it even if only the IntervalRule matches)
                if (result.size >= longestMatchingChain.size) {
                    longestMatchingChain = result;
                }

                if (currConstraintId + 1 < pattern.length) {
                    // More constraints to check; increment the id
                    currConstraintId++;
                } else {
                    // No more constraints to check! They all matched, so we're finished.
                    return { success: true, result: result, longestMatch: result };
                }

            } else {
                // No match; any previous matches were errors. Clear them and then keep searching.
                currConstraintId = 0;
                result.clear();
            }
        }

        // If we're here, we've not been able to match all the constraints.
        return { success: false, result: new Map(), longestMatch: longestMatchingChain };
    }


    /**
     * Determine if a specified interval satisfies the provided constraint.
     * @param interval          The interval to check.
     * @param nextInterval      The interval following `interval`, if any. Otherwise, `null`. This parameter is
     *                          used to verify the constraints on `constraint.followingSpace`.
     * @param pattern           The pattern that needs to be tested.
     * @param precedingMatches  The map of any preceding matches, which is used to verify expressions.
     */
    function satisfiesRule(interval: Types.Interval, nextInterval: Types.Interval | null, rule: Types.Rule, precedingMatches: Types.Result): boolean {
        const expressionEnv = new Map([...precedingMatches].map(v => <[string, number]>[v[0], v[1].to - v[1].from]));

        // interval matches minSize constraint?
        if (length(interval) < parseExpression(rule.interval.minSize, expressionEnv)) {
            return false;
        }

        // interval matches maxSize constraint?
        if (length(interval) > parseExpression(rule.interval.maxSize, expressionEnv)) {
            return false;
        }

        if (rule.interval.from) {
            // interval's left endpoint matches lowerBound constraint?
            if (rule.interval.from.lowerBound !== null && interval.from < rule.interval.from.lowerBound) {
                return false;
            }

            // interval's left endpoint matches upperBound constraint?
            if (rule.interval.from.upperBound !== null && interval.from > rule.interval.from.upperBound) {
                return false;
            }
        }
        
        if (rule.interval.to) {
            // interval's right endpoint matches lowerBound constraint?
            if (rule.interval.to.lowerBound !== null && interval.to < rule.interval.to.lowerBound) {
                return false;
            }

            // interval's right endpoint matches upperBound constraint?
            if (rule.interval.to.upperBound !== null && interval.to > rule.interval.to.upperBound) {
                return false;
            }
        }

        if (rule.followingSpace) {
            // The constraint on the interval succeeded, so we add its length to the expression environment.
            expressionEnv.set(rule.interval.name, length(interval));

            const spaceInterval = {
                from: interval.to,
                to: nextInterval ? nextInterval.from : Infinity
            }

            // space respects minSize constraint?
            if (length(spaceInterval) < parseExpression(rule.followingSpace.minSize, expressionEnv)) {
                return false;
            }

            // space respects maxSize constraint?
            if (length(spaceInterval) > parseExpression(rule.followingSpace.maxSize, expressionEnv)) {
                return false;
            }
        }

        return true;
    }

    function parseExpression(expr: number | string, env: Map<string, number>): number {
        if (isNumber(expr)) {
            return +expr;
        } else {
            const result = ArithmeticExpression.parse(expr, {});
            return result(env);
        }
    }
}


/**
 * Calculate the length of an interval.
 */
function length(interval: { from: number, to: number }): number {
    return interval.to - interval.from;
}

/**
 * Check if the provided value has numeric type.
 */
function isNumber(n: any): boolean {
    return (typeof n === 'number') || (n instanceof Number);
}