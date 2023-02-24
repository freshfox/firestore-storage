import {ModelMeta} from "./base_model_v2";

type CollectionIds<C extends Collection<M, any, IdType, ParentIds>, M extends ModelMeta<IdType>, IdType extends string, ParentIds extends object> = ParentIds;
type DocumentIds<C extends Collection<M, IdKey, IdType, ParentIds>, M extends ModelMeta<IdType>, IdType extends string, ParentIds extends object, IdKey extends string> = ParentIds;



class Collection<M extends ModelMeta<ID>, IdKey extends string, ID extends string, ParentIds extends object> {

}
