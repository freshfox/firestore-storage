export interface ModelMetaInternal {
	id?: string;
	rawPath?: string;
}

export type ModelMeta<R extends boolean = false> = R extends true ? Required<ModelMetaInternal> : ModelMetaInternal;
