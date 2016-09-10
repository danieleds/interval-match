import { Rule, Interval, Result } from '../src/index'

export const test_data_1: {v1: Rule[], v2: Interval[], r: Result}[] = [
    {
        v1: [{interval: {name: "A", from: null, to: null, minSize: 500, maxSize: 1000}, followingSpace: null}],
        v2: [{from: 0, to: 500, data: 'hello'}],
        r: new Map([["A", {from: 0, to: 500, data: 'hello'}]])
    },
    {
        v1: [{interval: {name: "A", from: null, to: null, minSize: 500, maxSize: 1000}, followingSpace: null}],
        v2: [{from: 0, to: 750, data: 'hello'}],
        r: new Map([["A", {from: 0, to: 750, data: 'hello'}]])
    },
    {
        v1:[{interval: {name: "A", from: null, to: null, minSize: 500, maxSize: 1000}, followingSpace: null}],
        v2: [{from: 0, to: 1000, data: 'hello'}],
        r: new Map([["A", {from: 0, to: 1000, data: 'hello'}]])
    },
    {
        v1: [{interval: {name: "A", from: null, to: null, minSize: 500, maxSize: 1000}, followingSpace: null}],
        v2: [{from: 0, to: 1001, data: 'hello'}],
        r: new Map()
    },
    {
        v1: [{interval: {name: "A", from: null, to: null, minSize: 500, maxSize: 1000}, followingSpace: null}],
        v2: [{from: 0, to: 750, data: 'u'}, {from: 10, to: 760, data: 'x'}],
        r: new Map([["A", {from: 0, to: 750, data: 'u'}]])
    },
    {
        v1: [{interval: {name: "A", from: {lowerBound: 100, upperBound: 150}, to: null, minSize: 0, maxSize: Infinity}, followingSpace: null}],
        v2: [{from: 80, to: 1000, data: 'u'}],
        r: new Map()
    },
    {
        v1: [{interval: {name: "A", from: {lowerBound: 100, upperBound: 150}, to: null, minSize: 0, maxSize: Infinity}, followingSpace: null}],
        v2: [{from: 100, to: 1000, data: 'u'}],
        r: new Map([["A", {from: 100, to: 1000, data: 'u'}]])
    },
    {
        v1: [{interval: {name: "A", from: {lowerBound: 100, upperBound: 150}, to: null, minSize: 0, maxSize: Infinity}, followingSpace: null}],
        v2: [{from: 120, to: 1000, data: 'u'}],
        r: new Map([["A", {from: 120, to: 1000, data: 'u'}]])
    },
    {
        v1: [{interval: {name: "A", from: {lowerBound: 100, upperBound: 150}, to: null, minSize: 0, maxSize: Infinity}, followingSpace: null}],
        v2: [{from: 150, to: 1000, data: 'u'}],
        r: new Map([["A", {from: 150, to: 1000, data: 'u'}]])
    },
    {
        v1: [{interval: {name: "A", from: {lowerBound: 100, upperBound: 150}, to: null, minSize: 0, maxSize: Infinity}, followingSpace: null}],
        v2: [{from: 151, to: 1000, data: 'u'}],
        r: new Map()
    },
    {
        v1: [{interval: {name: "A", from: null, to: null, minSize: 0, maxSize: Infinity}, followingSpace: {name: "B", minSize: 5, maxSize: 10}}],
        v2: [{from: 50, to: 60, data: 'u'}, {from: 65, to: 100, data: 'u'}],
        r: new Map([["A", {from: 50, to: 60, data: 'u'}], ["B", {from: 60, to: 65, data: undefined!}]])
    },
    {
        v1: [{interval: {name: "A", from: {lowerBound: 7, upperBound: 9}, to: null, minSize: 1, maxSize: 8}, followingSpace: {name: "B", minSize: 0.5, maxSize: 4}},
                            {interval: {name: "C", from: null, to: {lowerBound: null, upperBound: 20}, minSize: 1, maxSize: 8}, followingSpace: null}],
        v2: [{from: 7, to: 12, data: 'u'}, {from: 15, to: 18, data: 'x'}],
        r: new Map([["A", {from: 7, to: 12, data: 'u'}], ["B", {from: 12, to: 15, data: undefined!}], ["C", {from: 15, to: 18, data: 'x'}]])
    },
    {
        v1: [{interval: {name: "A", from: {lowerBound: 7, upperBound: 9}, to: null, minSize: 1, maxSize: 8}, followingSpace: {name: "B", minSize: 0.5, maxSize: 4}},
                            {interval: {name: "C", from: null, to: {lowerBound: null, upperBound: 20}, minSize: 1, maxSize: 8}, followingSpace: null}],
        v2: [{from: 7, to: 12, data: 'u'}, {from: 17, to: 20, data: 'x'}],
        r: new Map()
    },
    {
        v1: [{interval: {name: "A", from: null, to: null, minSize: 2, maxSize: 20}, followingSpace: {name: "B", minSize: 10, maxSize: Infinity}}],
        v2: [{from: 0, to: 20, data: 'u'}, {from: 25, to: 30, data: 'x'}, {from: 40, to: 50, data: 'y'}],
        r: new Map([["A", {from: 25, to: 30, data: 'x'}], ["B", {from: 30, to: 40, data: undefined!}]])
    },
    {
        v1: [{interval: {name: "A", from: null, to: null, minSize: '498 + (-1 * -2)', maxSize: 1000}, followingSpace: null}],
        v2: [{from: 0, to: 499, data: 'u'}],
        r: new Map()
    },{
        v1: [{interval: {name: "A", from: null, to: null, minSize: '498 + (-1 * -2)', maxSize: 1000}, followingSpace: null}],
        v2: [{from: 0, to: 500, data: 'u'}],
        r: new Map([["A", {from: 0, to: 500, data: 'u'}]])
    },
    { // followingSpace should be half the size of its preceding interval. Intervals match.
        v1: [{interval: {name: "A", from: null, to: null, minSize: 0, maxSize: Infinity}, followingSpace: {name: "B", minSize: 'A * 0.5', maxSize: 'A * 0.5'}}],
        v2: [{from: 40, to: 60, data: 'u'}, {from: 70, to: 100, data: 'u'}],
        r: new Map([["A", {from: 40, to: 60, data: 'u'}], ["B", {from: 60, to: 70, data: undefined!}]])
    },
    { // followingSpace should be half the size of its preceding interval. Intervals wrong.
        v1: [{interval: {name: "A", from: null, to: null, minSize: 0, maxSize: Infinity}, followingSpace: {name: "B", minSize: 'A * 0.5', maxSize: 'A * 0.5'}}],
        v2: [{from: 40, to: 60, data: 'u'}, {from: 71, to: 100, data: 'u'}],
        r: new Map()
    },
]