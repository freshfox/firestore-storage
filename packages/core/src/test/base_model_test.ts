import 'reflect-metadata';
import * as should from 'should';
import {isSameReferenceMap} from "../lib";

describe('BaseModel', function () {

	describe('#isSameReferenceMap()', function () {

		it('should be the same', () => {

			should(isSameReferenceMap({}, {})).true();
			should(isSameReferenceMap({
				a: true
			}, {
				a: true
			})).true();

		});

		it('should not be the same', () => {

			should(isSameReferenceMap({
				a: true
			}, {
				b: true
			})).false();

			should(isSameReferenceMap({
				a: true,
				b: true
			}, {
				b: true,
				c: true
			})).false();

			should(isSameReferenceMap({
				a: true,
			}, {
				b: true,
			})).false();

		});
	});
});
