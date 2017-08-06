@module ActiveResource
@export ActiveResource

@import jquery as jQuery
@import underscore as _
@import underscore.string as s
@import underscore.inflection

var ActiveResource = function(){};

@include modulizing.js
@include typing.js
@include resource_library.js
@include interfaces/base.js
@include interfaces/json_api.js
@include associations.js
@include attributes.js
@include callbacks.js
@include collection.js
@include errors.js
@include fields.js
@include persistence.js
@include query_params.js
@include reflection.js
@include relation.js
@include base.js
@include associations/association.js
@include associations/collection_association.js
@include associations/collection_proxy.js
@include associations/has_many_association.js
@include associations/singular_association.js
@include associations/has_one_association.js
@include associations/belongs_to_association.js
@include associations/belongs_to_polymorphic_association.js
@include associations/builder/association.js
@include associations/builder/collection_association.js
@include associations/builder/has_many.js
@include associations/builder/singular_association.js
@include associations/builder/belongs_to.js
@include associations/builder/has_one.js

return ActiveResource;
