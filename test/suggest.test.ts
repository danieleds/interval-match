const assert = require('assert6');
import { IntervalMatch } from '../src/index'
import { errorMeasure } from '../src/suggest'
import * as data from './suggest.test.data'

describe('suggest', () => {

    data.test_data_1.forEach((testData, i) => {
        it(`suggests intervals #${i}`, () => {
            assert.assertMap(IntervalMatch.suggest(testData.v1, testData.v2), testData.r);
        })
    })

})

describe('errorMeasure', () => {

    data.test_data_2.forEach((testData, i) => {
        it(`errorMeasure #${i}`, () => {
            assert.assertMap(errorMeasure(testData.v1, testData.v2), testData.r);
        })
    })

})