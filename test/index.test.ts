const assert = require('assert6');
import { IntervalMatch } from '../src/index'
import * as data from './index.test.data'

import './common.test'
import './suggest.test'

describe('IntervalMatch', () => {

    data.test_data_1.forEach((testData, i) => {
        it(`correctly matches intervals #${i}`, () => {
            const pattern = testData.v1;
            const intervals = testData.v2;
            const output = testData.r;

            assert.deepStrictEqual(IntervalMatch.match(pattern, intervals), output);
        })
    })

})