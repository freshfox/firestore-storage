import * as admin from "firebase-admin";
import Timestamp = admin.firestore.Timestamp;
import 'should';
import {isTimestamp, toComparableValue} from "../lib";

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

});
