import { Rule, Interval, MatchResult } from './types'
import * as Common from './common'
import * as Suggest from './suggest'

export * from './types'
export { isSpaceInterval } from './common'
export { nonIntersectingIntervals, endpoints, expectedCost } from './suggest'

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

    /**
     * 
     * @param pattern 
     * @param intervals 
     * @param ordered 
     * @param errorMeasure 
     * @param maxCost The max cost allowed for a high precision suggestion.
     *                If the actual cost will be greater than this value, a simple suggestion will be performed
     *                instead. By default it is 0, meaning that a high precision suggestion is never performed.
     */
    export function suggest(pattern: Rule[], intervals: Interval[], ordered = false, errorMeasure: Suggest.ErrorMeasure = null, maxCost = 0): Interval[] | null {
        if (pattern.length === 0) {
            return [];
        }

        if (maxCost <= 0 || (maxCost < +Infinity && Suggest.expectedCost(pattern.length, intervals.length) > maxCost)) {
            return suggestSimple(pattern, intervals, ordered, errorMeasure);
        } else {
            return suggestHighPrecision(pattern, intervals, ordered, errorMeasure);
        }
    }

    export function suggestSimple(pattern: Rule[], intervals: Interval[], ordered = false, errorMeasure: Suggest.ErrorMeasure = null): Interval[] | null {
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

    export function suggestHighPrecision(pattern: Rule[], intervals: Interval[], ordered = false, errorMeasure: Suggest.ErrorMeasure = null): Interval[] | null {
        if (pattern.length === 0) {
            return [];
        }

        if (!ordered) {
            intervals = intervals
                .sort((a, b) => a.to - b.to)
                .sort((a, b) => a.from - b.from);
        }

        return Suggest.suggestHighPrecision(pattern, intervals, errorMeasure);
    }
}