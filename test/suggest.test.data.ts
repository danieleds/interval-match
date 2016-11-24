import { Rule, Interval } from '../src/index'

export const test_data_1: {v1: Rule[], v2: Interval[], r: Interval[]}[] = [
    {
        v1: [{interval: {name: "A", from: {lowerBound: 100, upperBound: 200}, to: {lowerBound: 300, upperBound: 400}, minSize: 150, maxSize: 1000}, followingSpace: {name: 'x', minSize: 0, maxSize: 200}},
             {interval: {name: "B", from: {lowerBound: 500, upperBound: 600}, to: {lowerBound: 800, upperBound: Infinity}, minSize: '2*A', maxSize: Infinity}, followingSpace: null}
            ],
        v2: [{from: 190, to: 350, data: 'u'}, {from: 550, to: 1200, data: 'u'}],
        r:  [{from: 190, to: 350, data: undefined}, {from: 550, to: 1200, data: undefined}],
    },
    {
        v1: [{interval: {name: "A", from: {lowerBound: 100, upperBound: 200}, to: {lowerBound: 300, upperBound: 400}, minSize: 150, maxSize: 1000}, followingSpace: {name: 'x', minSize: 0, maxSize: 200}},
             {interval: {name: "B", from: {lowerBound: 500, upperBound: 600}, to: {lowerBound: 800, upperBound: Infinity}, minSize: '2*A', maxSize: Infinity}, followingSpace: null}
            ],
        v2: [],
        r:  [{from: 150, to: 300, data: undefined}, {from: 500, to: 800, data: undefined}],
    },
    /*{
        v1: [{interval: {name: "A", from: {lowerBound: 8-0.5, upperBound: 8}, to: null, minSize: 8, maxSize: 10}, followingSpace: null}],
        v2: [{from: 9, to: 18, data: 'u'}],
        r:  [{from: 8, to: 18, data: undefined}],
    },*/
    {
        v1: [{interval: {name: "A", from: {lowerBound: 50, upperBound: 55}, to: null, minSize: 100, maxSize: 600}, followingSpace: null}],
        v2: [{from: 52, to: 10000, data: 'u'}],
        r:  [{from: 52, to: 652, data: undefined}],
    },
    {
        v1: [{interval: {name: "A", from: {lowerBound: 7, upperBound: 9}, to: null, minSize: 1, maxSize: 100}, followingSpace: null }],
        v2: [{from: 7.45, to: 13.01, data: 'u'}],
        r:  [{from: 7.45, to: 13.01, data: undefined}],
    },
    {
        v1: [{interval: {name: "A", from: {lowerBound: 70, upperBound: 90}, to: null, minSize: 10, maxSize: 1000}, followingSpace: { name: "sA", minSize: 5, maxSize: 200 } },
             {interval: {name: "B", from: null, to: {lowerBound: 160, upperBound: 180}, minSize: "80 - A - 10", maxSize: "80 - A + 10"}, followingSpace: null }],
        v2: [{from: 74, to: 131, data: 'u'}, {from: 139, to: 185, data: 'v'}],
        r:  [{from: 74, to: 131, data: undefined}, {from: 139, to: 172, data: undefined}],
    },
    /*{
        v1: [{interval: {name: "A", from: {lowerBound: 70, upperBound: 90}, to: null, minSize: 10, maxSize: 1000}, followingSpace: { name: "sA", minSize: 5, maxSize: 200 } },
             {interval: {name: "B", from: null, to: {lowerBound: 160, upperBound: 180}, minSize: "80 - A - 10", maxSize: "80 - A + 10"}, followingSpace: null }],
        v2: [{from: 50, to: 131, data: 'u'}, {from: 139, to: 150, data: 'v'}],
        r:  [{from: 70, to: 131, data: undefined}, {from: 139, to: 150, data: undefined}],
    }*/
]