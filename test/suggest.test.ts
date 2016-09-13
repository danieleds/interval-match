const assert = require('assert6');
import { IntervalMatch } from '../src/index'
import * as data from './suggest.test.data'

describe('IntervalMatch', () => {

    data.test_data_1.forEach((testData, i) => {
        it(`suggests intervals #${i}`, () => {
            assert.assertMap(IntervalMatch.suggest(testData.v1, testData.v2), testData.r);
        })
    })

})