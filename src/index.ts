import { Rule, Interval, Result } from './types'
import * as Common from './common'

export * from './types'

export module IntervalMatch
{
    /**
     * Return the first satisfied match.
     * @param intervals The set of non-overlapping intervals.
     * @param ordered Set this to true if the provided intervals are already ordered. // FIXME ordered how?
     */
    export function match(pattern: Rule[], intervals: Interval[], ordered = false): Result {
        if (pattern.length === 0 || intervals.length === 0) {
            return new Map();
        }

        if (!ordered) {
            intervals = intervals
                .sort((a, b) => a.to - b.to)
                .sort((a, b) => a.from - b.from);
        }

        return Common.tryMatch(pattern, intervals).result;
    }

}