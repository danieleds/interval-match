import { Rule, Interval, MatchResult } from './types'
import * as Common from './common'
import * as Suggest from './suggest'

export * from './types'
export { isSpaceInterval } from './common'
export { defaultCostFunction, nonIntersectingIntervals } from './suggest'

export module IntervalMatch
{
    /**
     * Return the first satisfied match.
     * @param intervals The set of non-overlapping intervals.
     * @param ordered Set this to true if the provided intervals are already
     *        in ascending order on (from, to).
     */
    export function match(pattern: Rule[], intervals: Interval[], ordered = false): MatchResult {
        if (pattern.length === 0 || intervals.length === 0) {
            return { success: false, groups: new Map(), result: [] };
        }

        if (!ordered) {
            intervals = intervals
                .sort((a, b) => a.to - b.to)
                .sort((a, b) => a.from - b.from);
        }

        return Common.tryMatch(pattern, intervals);
    }

    export function suggest(pattern: Rule[], intervals: Interval[], ordered = false, errorMeasure: Suggest.ErrorMeasure = null): Interval[] | null {
        if (pattern.length === 0) {
            return [];
        }

        if (!ordered) {
            intervals = intervals
                .sort((a, b) => a.to - b.to)
                .sort((a, b) => a.from - b.from);
        }

        return Suggest.suggest(pattern, intervals, errorMeasure);
    }
}