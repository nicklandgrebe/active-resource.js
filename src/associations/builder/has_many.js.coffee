# =require ./collection_association

class ActiveResource::Associations::Builder::HasMany extends ActiveResource::Associations::Builder::CollectionAssociation
  @macro: 'hasMany'
