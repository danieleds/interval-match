export interface Interval {
    from: number
    to: number
    data: any
}

export interface SpaceInterval {
    from: number
    to: number
    data: undefined
    isSpace: true
}

export interface Rule {
    interval: IntervalRule,
    followingSpace: SpaceRule | null
}

export interface MatchResult {
    /**
     * True if and only if the intervals matched the whole pattern.
     */
    success: boolean;

    /**
     * The matching intervals, organized by their name. If `success == false`, this
     * contains the partial matches before the failure.
     */
    groups: Map<string, Interval|SpaceInterval>;

    /**
     * The ordered list of matching intervals. If `success == false`, this
     * contains the partial matches before the failure.
     */
    result: (Interval|SpaceInterval)[];
}

export interface IntervalRule {
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
export interface SpaceRule {
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