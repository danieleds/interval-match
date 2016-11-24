import { Rule, Interval, SpaceInterval } from '../src/index'

export const test_data_1: {v1: Rule[], v2: Interval[], r: Map<string, Interval|SpaceInterval>}[] = [
    {
        v1: [{interval: {name: "A", from: {lowerBound: 100, upperBound: 200}, to: {lowerBound: 300, upperBound: 400}, minSize: 150, maxSize: 1000}, followingSpace: {name: 'x', minSize: 0, maxSize: 200}},
             {interval: {name: "B", from: {lowerBound: 500, upperBound: 600}, to: {lowerBound: 800, upperBound: Infinity}, minSize: '2*A', maxSize: Infinity}, followingSpace: null}
            ],
        v2: [{from: 190, to: 350, data: 'u'}, {from: 550, to: 800, data: 'u'}],
        r: new Map<string, Interval|SpaceInterval>([["A", {from: 190, to: 350, data: 'u'}], ["x", {from: 350, to: 550, data: undefined!, isSpace: true }]])
    },
    /*{ // Decimal values don't work because of approssimations!!
        v1: [{interval: {name: "A", from: {lowerBound: 7, upperBound: 9}, to: null, minSize: 1, maxSize: 100}, followingSpace: { name: "sA", minSize: 0.5, maxSize: 20 } },
             {interval: {name: "B", from: null, to: {lowerBound: 16, upperBound: 18}, minSize: "8 - A - 1", maxSize: "8 - A + 1"}, followingSpace: null }],
        v2: [ { from: 7.45, to: 13.01, data: 'u' }, { from: 14.56, to: 16, data: 'v' } ],
        r: new Map<string, Interval|SpaceInterval>([["A", {from: 7.45, to: 13.01, data: 'u'}], ["sA", {from: 13.01, to: 14.56, data: undefined!, isSpace: true }], ["B", {from: 14.56, to: 16, data: 'v'}]])
    },*/
    {
        v1: [{interval: {name: "A", from: {lowerBound: 70, upperBound: 90}, to: null, minSize: 10, maxSize: 1000}, followingSpace: { name: "sA", minSize: 5, maxSize: 200 } },
             {interval: {name: "B", from: null, to: {lowerBound: 160, upperBound: 180}, minSize: "80 - A - 10", maxSize: "80 - A + 10"}, followingSpace: null }],
        v2: [ { from: 74, to: 131, data: 'u' }, { from: 145, to: 178, data: 'v' } ],
        r: new Map<string, Interval|SpaceInterval>([["A", {from: 74, to: 131, data: 'u'}], ["sA", {from: 131, to: 145, data: undefined!, isSpace: true }], ["B", {from: 145, to: 178, data: 'v'}]])
    }
]