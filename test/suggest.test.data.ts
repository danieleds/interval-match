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
    {
        v1: [{interval: {name: "A", from: {lowerBound: 8-0.5, upperBound: 8}, to: null, minSize: 8, maxSize: 10}, followingSpace: null}],
        v2: [{from: 9, to: 18, data: 'u'}],
        r:  [{from: 8, to: 18, data: undefined}],
    },
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
             {interval: {name: "B", from: null, to: {lowerBound: 160, upperBound: 180}, minSize: "80 - A - 10", maxSize: "80 - A + 50"}, followingSpace: null }],
        v2: [{from: 74, to: 131, data: 'u'}, {from: 139, to: 185, data: 'v'}],
        r:  [{from: 74, to: 131, data: undefined}, {from: 139, to: 180, data: undefined}],
    },
    {
        v1: [{interval: {name: "A", from: {lowerBound: 70, upperBound: 90}, to: null, minSize: 10, maxSize: 1000}, followingSpace: { name: "sA", minSize: 5, maxSize: 200 } },
             {interval: {name: "B", from: null, to: {lowerBound: 160, upperBound: 180}, minSize: "80 - A - 10", maxSize: "80 - A + 10"}, followingSpace: null }],
        v2: [{from: 50, to: 131, data: 'u'}, {from: 139, to: 150, data: 'v'}],
        r:  [{from: 70, to: 131, data: undefined}, {from: 139, to: 160, data: undefined}],
    },
    {
        v1: [{interval: {name: "A", from: null, to: null, minSize: 0, maxSize: 8}, followingSpace: {name: "sA", minSize: 1, maxSize: 3}},
             {interval: {name: "B", from: null, to: null, minSize: "8 - A", maxSize: "8 - A"}, followingSpace: null}],
        v2: [{from: 9, to: 12, data: 'u'}, {from: 14, to: 21, data: 'v'}],
        r:  [{from: 9, to: 12, data: undefined}, {from: 14, to: 19, data: undefined}],
    },
    {
        // zero values
        v1: [{interval: {name: "A",from: {lowerBound: 0,upperBound: 100},to: null,minSize: 1,maxSize: 50},followingSpace: null}],
        v2: [],
        r:  [{from: 0, to: 1, data: undefined}],
    },
    {
        // not enough intervals
        v1: [{interval: {name:"A", from: {lowerBound:5, upperBound:10}, to: {lowerBound:15, upperBound:20}, minSize:0, maxSize:100}, followingSpace:null},
             {interval: {name:"B", from: {lowerBound:40, upperBound:40}, to: null, minSize:5, maxSize:30}, followingSpace:null}],
        v2: [{from: 5, to: 15, data: null}],
        r:  [{from: 5, to: 15, data: undefined}, {from: 40, to: 45, data: undefined}],
    },
    {
        // two errors, one before the first interval, one after the second interval
        v1: [{interval: {name: "A", from: {lowerBound: 10, upperBound: 50}, to: {lowerBound: 10, upperBound: 200}, minSize: 0, maxSize: 80}, followingSpace: {name: "sA", minSize: 1, maxSize: 20}},
             {interval: {name: "B", from: null, to: {lowerBound: 1, upperBound: 200}, minSize: "80 - A", maxSize: "80 - A"}, followingSpace: null}],
        v2: [{from: 8, to: 50, data: 'u'}, {from: 60, to: 120, data: 'v'}],
        r:  [{from: 30, to: 50, data: undefined}, {from: 60, to: 120, data: undefined}],
    },
    {
        // lack of from/to constraints
        v1: [{interval: {name: "A", from: null, to: null, minSize: 0, maxSize: 28}, followingSpace: null},
             {interval: {name: "B", from: null, to: null, minSize: "28 - A", maxSize: "28 - A"}, followingSpace: null}],
        v2: [{from: 37, to: 46, data: 'u'}, {from: 49, to: 66, data: 'v'}],
        r:  [{from: 37, to: 46, data: undefined}, {from: 49, to: 68, data: undefined}],
    }
]

export const test_data_2: {v1: Interval[], v2: Interval[], r: number[]}[] = [
    {
        v1: [ { from: 9, to: 12, data: null }, { from: 14, to: 19, data: null } ],
        v2: [ { from: 9, to: 12, data: null }, { from: 14, to: 21, data: null } ],
        r: [2, 1, -3, -20]
    },
    {
        v1: [ { from: 9, to: 11, data: null }, { from: 14, to: 20, data: null } ],
        v2: [ { from: 9, to: 12, data: null }, { from: 14, to: 21, data: null } ],
        r: [2, 2, -2, -16]
    },
    {
        v1: [ { from: 9, to: 11, data: null }, { from: 14, to: 20, data: null } ],
        v2: [ { from: 9, to: 12, data: null } ],
        r: [7, 2, -1, -14.25]
    },
    {
        v1: [ { from: 9, to: 12, data: null }, { from: 14, to: 21, data: null } ],
        v2: [ { from: 10, to: 11, data: null },{ from: 14, to: 21, data: null } ],
        r: [2, 2, -2, -10.5]
    }
]

export const test_data_3: {v1: Interval[], v2: Interval[], r: {from: number, to: number}[]}[] = [
    {
        v1: [ { from: 50, to: 131, data: null }, { from: 139, to: 150, data: null } ],
        v2: [ { from: 70, to: 139, data: null }, { from: 144, to: 160, data: null } ],
        r: [ { from: 50, to: 70 }, { from: 131, to: 139 }, { from: 139, to: 144 }, { from: 150, to: 160 } ]
    },
    {
        v1: [ { from: 50, to: 131, data: null }, { from: 139, to: 150, data: null } ],
        v2: [ { from: 40, to: 100, data: null }, { from: 144, to: 160, data: null } ],
        r: [ { from: 40, to: 50 }, { from: 100, to: 131 }, { from: 139, to: 144 }, { from: 150, to: 160 } ]
    },
    {
        v1: [ { from: 50, to: 131, data: null }, { from: 139, to: 150, data: null } ],
        v2: [ { from: 70, to: 190, data: null } ],
        r: [ { from: 50, to: 70 }, { from: 131, to: 139 }, { from: 150, to: 190 } ]
    },
    {
        v1: [ { from: 10, to: 30, data: null }, { from: 50, to: 70, data: null }, { from: 80, to: 100, data: null } ],
        v2: [ { from: 20, to: 90, data: null } ],
        r: [ { from: 10, to: 20 }, { from: 30, to: 50 }, { from: 70, to: 80 }, { from: 90, to: 100 } ]
    }
]