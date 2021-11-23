import 'reflect-metadata';
import * as should from 'should';
import {isSameReferenceMap} from "../lib";
import {BaseModelClass, DateTransformer, serialize} from "../lib/storage/base_model_v2";
import * as admin from "firebase-admin";
import Timestamp = admin.firestore.Timestamp;
import {Type} from "class-transformer";

describe('BaseModel', function () {

	describe('Model classes', () => {

		class Comment {
			content: string;
			userId: string;
		}

		class PostDetails {
			@DateTransformer()
			publishDate: Date;

		}

		class Post extends BaseModelClass<Post> {

			@Type(() => PostDetails)
			details?: PostDetails;

			content: string;
			@Type(() => Comment)
			comments?: Comment[];

			getContent(): string {
				return this.content;
			};
		}

		it('should create a model class and get data without __metadata', async () => {
			const now = Date.now();
			const post = new Post({
				details: {
					publishDate: new Date(now),
				},
				content: 'Content'
			});
			post.details.should.instanceOf(PostDetails);
			post.getData().should.eql({
				details: {
					publishDate: new Date(now),
				},
				content: 'Content'
			});
		});

		it('should create a model class with an id', async () => {
			const post = new Post({
				id: 'some-id'
			});
			post.getData().should.eql({});
			post.id.should.eql('some-id');
		});

		it('should convert a timestamp to a date', async () => {

			const date = new Date();

			const post = new Post(serialize(Post, {
				details: {
					publishDate: Timestamp.fromDate(date) as any
				},
				content: 'Content'
			}));
			post.details.publishDate.should.eql(date)
		});

		it('should create instances of an array', async () => {

			const post = new Post({
				comments: [{
					content: 'I like that',
					userId: 'userId'
				}],
				content: 'Content'
			});
			post.comments[0].should.instanceOf(Comment);
			post.comments[0].userId.should.eql('userId');

		});

	});


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
