import {IDocumentTransformer} from "./transformer";

export class TransformerRepository<T> {
	protected transformer?: IDocumentTransformer<T>
}
