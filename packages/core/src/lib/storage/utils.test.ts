import 'should';
import { toComparableValue } from './utils';

describe('Utils', function () {
	describe('#toComparableValue', function () {
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
});
