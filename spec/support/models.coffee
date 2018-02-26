# Imply that a singular version of the word 'Class' is still 'Class'
_.singular('Class', 'Class');

window.MyLibrary = ActiveResource.createResourceLibrary('https://example.com/api/v1')

class MyLibrary::Comment extends MyLibrary.Base
  this.className = 'Comment'
  this.queryName = 'comments'

  this.belongsTo 'resource', polymorphic: true, inverseOf: 'comments'

class MyLibrary::Customer extends MyLibrary.Base
  this.className = 'Customer'
  this.queryName = 'customers'

  this.hasMany 'orders', inverseOf: 'customer'

class MyLibrary::GiftCard extends MyLibrary.Base
  this.className = 'GiftCard'
  this.queryName = 'gift_cards'

  this.hasOne 'order'

class MyLibrary::Order extends MyLibrary.Base
  this.className = 'Order'
  this.queryName = 'orders'

  this.attributes('price')

  this.belongsTo 'customer', inverseOf: 'orders'
  this.belongsTo 'giftCard'
  this.belongsTo 'product'

  this.hasMany 'comments', as: 'resource', autosave: true, inverseOf: 'resource'
  this.hasMany 'orderItems'
  this.hasMany 'transactions', autosave: true

class MyLibrary::OrderItem extends MyLibrary.Base
  this.className = 'OrderItem'
  this.queryName = 'order_items'

  this.belongsTo 'order'

class MyLibrary::PaymentMethod extends MyLibrary.Base
  this.className = 'PaymentMethod'
  this.queryName = 'payment_methods'

  this.hasMany 'transactions'

class MyLibrary::Product extends MyLibrary.Base
  this.className = 'Product'
  this.queryName = 'products'

  this.attributes('title')

  this.hasMany 'orders'
  this.hasMany 'timeSlots'

class MyLibrary::TimeSlot extends MyLibrary.Base
  this.className = 'TimeSlot'
  this.queryName = 'time_slots'

  this.belongsTo 'product'

class MyLibrary::Transaction extends MyLibrary.Base
  this.className = 'Transaction'
  this.queryName = 'transactions'

  this.attributes('amount')

  this.belongsTo 'order'
  this.belongsTo 'paymentMethod'
