import { Rule, Interval, Result } from '../src/index'

export const test_data_1: {v1: Rule[], v2: Interval[], r: Result}[] = [
    {
        v1: [{interval: {name: "A", from: {lowerBound: 100, upperBound: 200}, to: {lowerBound: 300, upperBound: 400}, minSize: 150, maxSize: 1000}, followingSpace: {name: 'x', minSize: 0, maxSize: 200}},
             {interval: {name: "B", from: {lowerBound: 500, upperBound: 600}, to: {lowerBound: 800, upperBound: Infinity}, minSize: '2*A', maxSize: Infinity}, followingSpace: null}
            ],
        v2: [{from: 190, to: 350, data: 'u'}, {from: 550, to: 800, data: 'u'}],
        r: new Map([["A", {from: 190, to: 350, data: 'u'}], ["x", {from: 350, to: 550, data: undefined!}]])
    }
]