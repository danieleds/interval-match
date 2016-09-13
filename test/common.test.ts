const assert = require('assert6');
import * as Common from '../src/common'
import * as data from './common.test.data'

describe('IntervalMatch', () => {

    data.test_data_1.forEach((testData, i) => {
        it(`longestMatch #${i}`, () => {
            const pattern = testData.v1;
            const intervals = testData.v2;
            const output = testData.r;

            assert.assertMap(Common.tryMatch(pattern, intervals).longestMatch, output);
        })
    })

})