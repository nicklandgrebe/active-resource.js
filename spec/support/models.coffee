# Imply that a singular version of the word 'Class' is still 'Class'
_.singular('Class', 'Class');

ActiveResource.baseUrl = 'https://example.com/api/v1/'

class window.MyLibrary
  class @::Comment extends ActiveResource::Base
    this.className = 'Comment'
    this.queryName = 'comments'

    this.belongsTo 'resource', polymorphic: true

  class @::GiftCard extends ActiveResource::Base
    this.className = 'GiftCard'
    this.queryName = 'gift_cards'

    this.hasOne 'order'

  class @::Order extends ActiveResource::Base
    this.className = 'Order'
    this.queryName = 'orders'

    this.belongsTo 'giftCard'
    this.belongsTo 'product'

    this.hasMany 'comments', as: 'resource'
    this.hasMany 'orderItems'

  class @::Comment extends ActiveResource::Base
    this.className = 'Comment'
    this.queryName = 'comments'

    this.belongsTo 'resource', polymorphic: true

  class @::OrderItem extends ActiveResource::Base
    this.className = 'OrderItem'
    this.queryName = 'order_items'

    this.belongsTo 'order'

  class @::Product extends ActiveResource::Base
    this.className = 'Product'
    this.queryName = 'products'

    this.hasMany 'orders'

ActiveResource.constantizeScope = window.MyLibrary::
