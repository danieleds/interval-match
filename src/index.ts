export interface Interval {
    from: number
    to: number
    data: any
}

export interface Pattern {
    constraints: Constraint[]
    // reserved for extra options
}

export interface Constraint {
    interval: IntervalPattern,
    followingSpace: SpacePattern | null
}

export type Result = Map<string, Interval>;

export interface IntervalPattern {
    /**
     * Name of this pattern to identify it in the results
     */
    name: string
    /**
     * Where the start of the interval should be. If null, there is no constraint.
     */
    from: Endpoint | null
    /**
     * Where the end of the interval should be. If null, there is no constraint.
     */
    to: Endpoint | null
    /**
     * Minimum size of the interval.
     * If a string, it is an expression which defines the minimum size of the interval.
     * Any preceding matches can be used in the expression with their name as identifiers.
     * // FIXME Better doc with example
     */
    minSize: number | string
    /**
     * Maximum size of the interval.
     * If a string, it is an expression which defines the maximum size of the interval.
     * Any preceding matches can be used in the expression with their name as identifiers.
     * // FIXME Better doc with example
     */
    maxSize: number | string
}

/**
 * FIXME Docs
 */
export interface SpacePattern {
    name: string
    minSize: number | string
    maxSize: number | string
}

/**
 * Specify a validity range for an interval endpoint.
 */
export interface Endpoint {
    /**
     * Lower bound. If null, there is no lower bound.
     */
    lowerBound: number | null,
    /**
     * Upper bound. If null, there is no upper bound.
     */
    upperBound: number | null
}

export class IntervalMatch
{
    /**
     * Return the first satisfied match.
     * @param intervals The set of non-overlapping intervals.
     * @param ordered Set this to true if the provided intervals are already ordered. // FIXME ordered how?
     */
    public static match(pattern: Pattern, intervals: Interval[], ordered = false): Result {
        if (pattern.constraints.length === 0 || intervals.length === 0) {
            return new Map();
        }

        if (!ordered) {
            intervals = intervals
                .sort((a, b) => a.to - b.to)
                .sort((a, b) => a.from - b.from);
        }

        const result: Result = new Map();

        let currConstraintId = 0;
        for (let i = 0; i < intervals.length; i++) {
            const interval = intervals[i];
            const nextInterval = i+1 < intervals.length ? intervals[i+1] : null;
            const constraint = pattern.constraints[currConstraintId];

            // Check if this interval satisfies the current constraint
            const matches = IntervalMatch.satisfiesConstraint(interval, nextInterval, constraint, result);

            if (matches) {
                // Add it to the result
                result.set(constraint.interval.name, interval);
                if (constraint.followingSpace) {
                    const spaceInterval = {from: interval.to, to: nextInterval ? nextInterval.from : Infinity, data: undefined};
                    result.set(constraint.followingSpace.name, spaceInterval);
                }

                if (currConstraintId + 1 < pattern.constraints.length) {
                    // More constraints to check; increment the id
                    currConstraintId++;
                } else {
                    // No more constraints to check! They all matched, so we're finished.
                    return result;
                }

            } else {
                // No match; any previous matches were errors. Clear them and then keep searching.
                currConstraintId = 0;
                result.clear();
            }
        }

        // If we're here, we've not been able to match all the constraints.
        return new Map();
    }

    /**
     * Determine if a specified interval satisfies the provided constraint.
     * @param interval          The interval to check.
     * @param nextInterval      The interval following `interval`, if any. Otherwise, `null`. This parameter is
     *                          used to verify the constraints on `constraint.followingSpace`.
     * @param constraint        The constraint that needs to be tested.
     * @param precedingMatches  The map of any preceding matches, which is used to verify expressions.
     */
    private static satisfiesConstraint(interval: Interval, nextInterval: Interval | null, constraint: Constraint, precedingMatches: Result): boolean {
        const expressionEnv = new Map([...precedingMatches].map(v => <[string, number]>[v[0], v[1].to - v[1].from]));

        // interval matches minSize constraint?
        if (length(interval) < IntervalMatch.parseExpression(constraint.interval.minSize, expressionEnv)) {
            return false;
        }

        // interval matches maxSize constraint?
        if (length(interval) > IntervalMatch.parseExpression(constraint.interval.maxSize, expressionEnv)) {
            return false;
        }

        if (constraint.interval.from) {
            // interval's left endpoint matches lowerBound constraint?
            if (constraint.interval.from.lowerBound !== null && interval.from < constraint.interval.from.lowerBound) {
                return false;
            }

            // interval's left endpoint matches upperBound constraint?
            if (constraint.interval.from.upperBound !== null && interval.from > constraint.interval.from.upperBound) {
                return false;
            }
        }
        
        if (constraint.interval.to) {
            // interval's right endpoint matches lowerBound constraint?
            if (constraint.interval.to.lowerBound !== null && interval.to < constraint.interval.to.lowerBound) {
                return false;
            }

            // interval's right endpoint matches upperBound constraint?
            if (constraint.interval.to.upperBound !== null && interval.to > constraint.interval.to.upperBound) {
                return false;
            }
        }

        if (constraint.followingSpace) {
            const spaceInterval = {
                from: interval.to,
                to: nextInterval ? nextInterval.from : Infinity
            }

            // space respects minSize constraint?
            if (length(spaceInterval) < IntervalMatch.parseExpression(constraint.followingSpace.minSize, expressionEnv)) {
                return false;
            }

            // space respects maxSize constraint?
            if (length(spaceInterval) > IntervalMatch.parseExpression(constraint.followingSpace.maxSize, expressionEnv)) {
                return false;
            }
        }

        return true;
    }

    private static parseExpression(expr: number | string, env: Map<string, number>): number {
        return +expr;
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