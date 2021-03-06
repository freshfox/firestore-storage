import * as admin from "firebase-admin";
import * as should from 'should';
import {CollectionUtils, isTimestamp, parsePath, parsePathWithFunction, toComparableValue} from "../lib";
import Timestamp = admin.firestore.Timestamp;

describe('Utils', function () {

	describe('#toComparableValue', function () {

		it('should convert Timestamp', async () => {
			const millis = Date.now();
			const ts = Timestamp.fromMillis(millis);
			toComparableValue(ts).should.eql(millis);
		});

		it('should convert Date', async () => {
			const millis = Date.now();
			toComparableValue(new Date(millis)).should.eql(millis);
		});

		it('should not convert primitive types', async () => {
			toComparableValue('test').should.eql('test');
			toComparableValue(1).should.eql(1);
			toComparableValue(true).should.eql(true);
		});
	});

	describe('#isTimestamp()', function () {

		it('should check if value is a Timestamp', async () => {

			isTimestamp(Timestamp.now()).should.true();
			isTimestamp({
				_seconds: 0,
				_nanoseconds: 0
			}).should.true();

		});
	});

	describe('#parsePath()', function () {

		it('should parse a document path', async () => {
			const map = parsePath('/accounts/acc1/restaurants/res1/reviews/rev1');
			map.get('accounts').should.eql('acc1');
			map.get('restaurants').should.eql('res1');
			map.get('reviews').should.eql('rev1');
		});

		it('should parse a collection path', async () => {
			const map = parsePath('/accounts/acc1/restaurants/res1/reviews/');
			map.get('accounts').should.eql('acc1');
			map.get('restaurants').should.eql('res1');
			should(map.get('reviews')).eql(null);
		});
	});

	describe('parsePathWithFunction()', function () {

		it('should parse a document path', async () => {
			const map = parsePathWithFunction(
				CollectionUtils.createPath('/accounts/{accountId}/restaurants/{restaurantId}/reviews/{reviewId}'),
				'/accounts/acc1/restaurants/res1/reviews/rev1'
			);
			map.get('accountId').should.eql('acc1');
			map.get('restaurantId').should.eql('res1');
			map.get('reviewId').should.eql('rev1');
		});

		it('should parse a collection path', async () => {
			const map = parsePathWithFunction(
				CollectionUtils.createPath('/accounts/{accountId}/restaurants/{restaurantId}/reviews/{reviewId}'),
				'/accounts/acc1/restaurants/res1/reviews/'
			);
			map.get('accountId').should.eql('acc1');
			map.get('restaurantId').should.eql('res1');
			should(map.get('reviewId')).eql(null);
		});

	});

});
