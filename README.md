# IntervalMatch

[![npm version](https://badge.fury.io/js/interval-match.svg)](https://badge.fury.io/js/interval-match)
[![Build Status](https://travis-ci.org/danieleds/interval-match.svg?branch=master)](https://travis-ci.org/danieleds/interval-match)
<!-- [![npm version](https://img.shields.io/npm/v/interval-match.svg?maxAge=2592000)](https://www.npmjs.com/package/interval-match)
[![npm](https://img.shields.io/npm/dm/interval-match.svg?maxAge=2592000)]()-->

This library allows you to match a set of intervals with various patterns.

## Install

```sh
$ npm install --save interval-match
```

## Introduction

Intervals are objects which define their position and a payload. For example, this is an interval:

```js
{
    from: 10,
    to: 15.7,
    data: { some: 'thing' }
}
```

When you have a set of intervals, you might need to find some of them based on their properties as a whole.
Think of this process as similar to regular expressions: just like `a{1,3}b` will match any string composed by one, two or three *a's* followed by a *b*, you can write a pattern that can match an interval with a length of 20 which is followed by another interval which ends before 50.

## Usage

First, import the module:

```js
const IntervalMatch = require('interval-match').IntervalMatch  // CommonJS / Node style
// or:
import { IntervalMatch } from 'interval-match'  // ES6 style
```
Then you can call the `match` function over some intervals to know if they match a specific pattern.

Example:

```js
import { IntervalMatch } from 'interval-match'

// Here we define the pattern we want to match.
// In this case, we're saying we want to match the intervals which:
//  - start between 35 and 45
//  - have a length of 5 or more
//  - are followed by a space (the gap before the next interval) which:
//     - is half the size of them
//  - and then by an interval which:
//     - is smaller or equal to 30
const pattern = [
    {
        interval: {
            name: 'A',
            from: { lowerBound: 35, upperBound: 45 },
            to: null,
            minSize: 5,
            maxSize: Infinity
        },
        followingSpace: {
            name: 'B',
            minSize: 'A * 0.5',
            maxSize: 'A * 0.5'
        }
    },
    {
        interval: {
            name: 'C',
            from: null,
            to: null,
            minSize: 0,
            maxSize: 30
        },
        followingSpace: null
    }
]

// Our intervals
const intervals = [
    { from: 20, to: 30, data: 'apple' },
    { from: 40, to: 60, data: 'orange' },
    { from: 70, to: 100, data: 'lemon' }
];

// Get the matches
const matches = IntervalMatch.match(pattern, intervals);

// Now `matches` will be:
//     Map {
//       'A' => { from: 40, to: 60, data: 'orange' },
//       'B' => { from: 60, to: 70, data: undefined },
//       'C' => { from: 70, to: 100, data: 'lemon' } }
```

## Patterns

As we saw in the example, a pattern is actually an array of rules, each of which is limited to a single interval. So, a sequence of rules describes how the succession of the intervals should look like.

There are two types of rules: *IntervalRule* and *SpaceRule*. The first is applied to intervals, the second to the gaps between intervals.

### IntervalRule

```js
{
    name: 'A',
    from: { lowerBound: 35, upperBound: 45 },
    to: null,
    minSize: 5,
    maxSize: Infinity
}
```

* **name:** string

   The name to assign to the matched interval to identify it in the result. If it is in the form of an identifier (only letters, numbers and underscores, and doesn't start with a number) then it can be used in expressions (see below).
   
* **from:** Endpoint | null

   If not null, defines where the interval should start. It takes an Endpoint, which is an object like the following, that you can use to specify the allowed range for the start of the interval:
   
   ```js
   { lowerBound: number, upperBound: number }
   ```

* **to:** Endpoint | null

   If not null, defines where the interval should end. See **from**.

* **minSize:** number | string

   Defines the minimum size of the interval. If it is a string, the value is interpreted as an arithmetic expression which:
     * can use `+`, `-` and `*` operators (no division)
     * can use any preceding matched name as a variable (e.g: `1.5 * (A + B) - 1`)

* **maxSize:** number | string

   Defines the maximum size of the interval. See **minSize**.
<!--
## Current Limitations
no overlapping intervals
precedingSpace-->
