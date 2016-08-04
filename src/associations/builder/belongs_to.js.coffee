# =require ./singular_association

class ActiveResource::Associations::Builder::BelongsTo extends ActiveResource::Associations::Builder::SingularAssociation
  @macro: 'belongsTo'
