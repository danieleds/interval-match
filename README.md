# IntervalMatch

[![npm version](https://badge.fury.io/js/interval-match.svg)](https://badge.fury.io/js/interval-match)

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

... work in progress ...
