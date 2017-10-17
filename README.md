# ActiveResource.js - Object-relational mapping in Javascript
Welcome to ActiveResource.js, an object relational mapping library for Javascript. ActiveResource.js is designed to make
interacting with resources stored on a RESTful server more straightforward and holistic than simpler solutions like
`ngResource`. ActiveResource.js constructs and executes requests and formats responses into
meaningful resource representations on the client side, allowing you to perform CRUD operations, as well
as interact with and modify the various relationships (often known as associations) of resources effortlessly.

ActiveResource.js is inspired heavily by [Active Record](https://github.com/rails/rails/tree/master/activerecord), the well known
ORM for Ruby on Rails. In the same way that Active Record makes interacting with relational databases trivial in most of the
use cases that might be required of a server side application, ActiveResource.js hopes to make interacting with
RESTful servers trivial in most of the use cases that might be required of a client side application.

The library provides a base class that, when subclassed, sets up a mapping between the new class
and an existing resource scope on the server. In the context of an application, these classes are commonly referred to as
models. Models can also be connected to other models in two ways: through client side interaction (whose behavior is defined
by associations), and by making requests to persist the association on the server.

ActiveResource.js relies heavily on naming in that it uses class and association names to establish mappings between
respective resource endpoints, subresource endpoints, and foreign key properties. Although these mappings can be defined
explicitly, it's recommended to follow naming conventions, especially when getting started with the library.

* * *

WARNING: ActiveResource.js currently only works in browsers. A new release will soon allow it to work in Node, plus change some design decisions
to use more universal idioms.

* * *

## Installation

```
npm i active-resource --save
```

## Getting Started

In order to use ActiveResource, you must first create a resource library to hold configuration data for accessing your resources:

```coffee
# lib/myLibrary.coffee

MyLibrary = ActiveResource.createResourceLibrary(
  'https://example.com/api/v1/', # base url for your server
  headers: { Authorization: 'Basic ...' }
)
```

Then, you create a resource class for each resource in your library:

```coffee

# lib/myLibrary/product.coffee

class MyLibrary.Product extends MyLibrary.Base
  this.className = 'Product'
  this.queryName = 'products'

# **or**

class MyLibrary::Product extends MyLibrary.Base
  this.className = 'Product'
  this.queryName = 'products'
```

Both `className` and `queryName` are required, and you can see what they do in the [configuration section of this page](#config).

Some of the major features include:

* * *

* Automated mapping between classes and endpoints, attributes and relationships

```coffee
class MyLibrary.Product extends MyLibrary.Base
  this.className = 'Product'
  this.queryName = 'products'
```

The Product class is automatically mapped to the RESTful endpoints for product resources on the server, which would all have the URL:
```
http://example.com/api/v1/products/
```

* * *

* HTTP requests constructable through simple to use chained method calls (a `Relation`)

```coffee
Product.where(title: 'A product title').includes('orders').order(createdAt: 'desc').all()
Product.select('title').first(5)
Product.page(2).perPage(1).all()

Product.limit(2).offset(2).all()

Product.find(1)
Product.findBy(title: 'A product title')

Product.each (p) ->
  ...

Product.includes('orders', merchant: ['currency']).all()
```

Method calls like `all()` will return a promise, and the response in the promise will be an `ActiveResource::Collection` (see below). If the response is expected to be a single resource (`find`, `findBy`, `first`) it will just be that resource.

**Note:** Due to the current design of JSON API, if you use both `select` and `includes` in the same `Relation` chain, you should add any `includes` to `select`. For example:
```coffee
Product.includes('merchant').select('title').all()
```
should be:
```coffee
Product.includes('merchant').select('title','merchant').all()
```
This is because the JSON API spec defines both attributes and relationships as `fields`, which is what the `select` method constructs. So
if you want to include a relationship and you also plan on `select`ing fields, make sure that you specify any includes as a field using
`select`. This does not apply if you only want to use `includes` without `select`.

* * *

* Persistence methods that simplify managing of resources

```coffee
product = Product.build(title: 'A product title')
product.save ->
  if product.valid()
    product.persisted() # == true
  else
    product.errors().empty() # == false

Product.create title: 'A product title', (product) ->
  if product.valid()
    ...
  else
    product.newRecord() # == true

Product.first()
.then (product) ->
  product.update title: 'A new title'

Product.first()
.then (product) ->
  product.destroy()

Product.first()
.then (product) ->
  product.reload()
```

* * *

* Associations between objects defined by simple class methods

```coffee
class MyLibrary.Product extends MyLibrary.Base
  @hasMany 'orders'

class MyLibrary.Order extends MyLibrary.Base
  @belongsTo 'product'
```

This defines a number of methods on each class. For `hasMany`:
```coffee
product = Product.build()
product.orders()             # collection proxy to use for more queries (see below)
product.orders().toArray()   # read
product.orders().build()     # local construction
product.orders().create()    # persisted construction
product.orders().assign()    # persisted assignment
product.orders().push()      # persisted concatenation
product.orders().delete()    # persisted deletion of association (not the resources themselves)
product.orders().deleteAll()
product.orders().reload()
product.orders().empty()     # NOTE: Only indicates if the collection currently loaded is empty
product.orders().size()      # NOTE: Only gives the size of the collection currently loaded
```

In regards to association collection proxies, you can work off them just like you would any other ActiveResource `Relation` class:
```coffee
product.orders().where(title: 'A product title').select('title').last(10)
.then (orders) ->
  # result will only be orders related to `product`

product.orders().includes('merchant').create title: 'A product title', (order) ->
  if order.valid()
    order.merchant() # != null, was included in response
  else
    order.errors()
```

It is important to note that none of the `hasMany` methods above will assign the actual target of the association to their result,
nor will the association be considered "loaded." For example:
```coffee
product.orders().where(title: 'A product title').select('title').last(10)
.then (orders) ->
  orders # != []
  product.orders().toArray() # == []
  product.association('orders').loaded() # == false
```

To accomplish this, one must *load* the association either in the initial query, or at some later point in time:
```coffee
Product.includes('orders').first()
.then (product) ->
  product.orders().toArray() # != []
  product.association('orders').loaded() # == true

Product.first()
.then (product) ->
  product.association('orders').loaded() # == false

  product.loadOrders()
  .then ->
    product.association('orders').loaded() # == true

  product.orders().loadTarget()
  .then ->
    product.association('orders').loaded() # == true

  product.orders().reload()
  .then ->
    product.association('orders').loaded() # == true
```

**In general, it is best to include every association you'll need to do your business in the very first query.**

It is also worth noting that most `Relation` methods (and association `Relation` methods here) will return promises, and do not
hit any sort of cache. If you want to make a synchronous method call that gives you the current target of the association (loaded or not), you have a few options:

```coffee
Product.includes('orders').first()
.then (product) ->
  product.orders().all(cached: true)

  product.orders().toArray()
```

There are a number of methods defined for singular associations (`hasOne`, `belongsTo`) as well:

```coffee
order = Order.build()
order.product()       # read locally
order.loadProduct()   # read persisted
order.assignProduct() # assign locally
order.updateProduct() # persist assignment
order.buildProduct()  # local construction
order.createProduct() # persist construction
```

**You should never make a direct assignment like `product=`, because ActiveResource is not aware when this happens and it may cause unexpected results.**

* * *

* Reflections on associations

```coffee
Order.reflectOnAllAssociations().each (reflection) ->
  reflection.name # == 'product'
  reflection.macro # == 'belongsTo'
  reflection.klass() # == Product

Order.reflectOnAssociation('product')
```

* * *

* Attribute management

```coffee
class MyLibrary.Order extends MyLibrary.Base
  @attributes('price', 'quantity')

order = Order.build()

order.assignAttributes(price: 5.0)
order.attributes() # == { price: 5.0 }
```

* * *

* Change tracking


Defining `attributes` on resource classes allows changes to those attributes to be tracked, as will
relationships defined using `hasMany`, `belongsTo`, etc.

The result is that when saving an existing resource (updating / `PATCH` request), only those
attributes and relationships that have changed will be submitted to server.

```coffee
Order.find(1)
.then (order) =>
  order.price # == 5.0
  order.quantity # == 2
  
  order.price = 10.0
  
  order.changedFields().toArray() # => ['price']
  
  order.save # only sends change to price to server
```

* * *

* Better typing, constantizing, module mixins than Javascript alone

```coffee
Order.build().isA(Order) # == true
Order.build().isA(Product) # == false

Order.build().klass() # == Order
```

```coffee
class MyLibrary.Order extends MyLibrary.Base
  this.className = 'Order'

MyLibrary.constantize('Order') # == MyLibrary.Order
```

```coffee
class MyModule
  @method1: ->

class Order extends MyLibrary.Base
  ActiveResource.extend(this, MyModule)

Order.method1 # defined

class Product extends MyLibrary.Base
  ActiveResource.include(this, MyModule)

Order.build().method1 # defined
```

* * *

* A wrapper class for Array that is similar to Ruby Array functionality

```coffee
c = ActiveResource::Collection.build([product1, product2])

c.all()
c.toArray()
c.size()
c.empty()
c.include(item)
c.first(n)
c.last(n)
c.each (i) -> ...
c.inject {}, (h, i) -> ...
c.map (i) -> ...
c.compact()
c.flatten()
c.join()
c.push(items)
c.delete(items)
c.clear()
c.select (i) -> ...
c.detect (i) -> ...
```
These make use of Underscore.js. [Learn more](http://docs.ruby-lang.org/en/2.0.0/Array.html)

This is the class that will be returned from `Relation#all()`, etc.

* * *

<a name="config"></a>

* Customization through properties/options on the library itself, as well as base classes and associations:

#### `ResourceLibrary.baseUrl`

```coffee
ActiveResource.createResourceLibrary(
  'http://example.com/api/v1'
)
```

**This property is required.** It specifies the root URL to the resource server, and all requests for resources in the library will be made relative to this URL.

#### `ResourceLibrary.headers`

```coffee
ActiveResource.createResourceLibrary(
  headers: {
    'Authorization': 'Basic xxx'
  }
)
```

*This property is optional.* It specifies any headers that should be added to every request for resources in the library. The most obvious use case is providing an
`Authorization` header if your resource server requires authentication.

#### `ResourceLibrary.constantizeScope`

```coffee
MyLibrary = ActiveResource.createResourceLibrary(
  constantizeScope: window
)

class window.Product extends MyLibrary.Base
  this.className = 'Product'

MyLibrary.constantize('Product') # == window.Product
```

*This property is optional, and defaults to null.* It specifies the object to search properties of when looking up a class name to find a class constant. If null, ActiveResource will search both `MyLibrary` and `MyLibrary::`, if your resource library variable were named `MyLibrary`.

#### `ResourceLibrary.interface`

```coffee
ActiveResource.createResourceLibrary(
  interface: MyCustomInterface
)
```

*This property is optional and defaults to `ActiveResource.Interfaces.JsonApi`.* `Interface`s allow you to define the interface between
a server and ActiveResource, constructing requests from input data, and constructing objects from response data. Right now, the only
interface that is supported is `JsonApi`, which is in accordance with the [JSON API specification](http://jsonapi.org/).

#### `Base.className`

```coffee
class Product extends MyLibrary.Base
  this.className = 'Product'
```

**This property is required.** It is so the library will continue to work in minified environments, where a call to `constructor.name` might yield a random result instead of the intended class name.

#### `Base.queryName`

```coffee
class Product extends MyLibrary.Base
  this.queryName = 'products'
```

**This property is required.** This is the name that will be used in URLs, so a call like `Product.all()` will result in an HTTP request `GET /api/v1/products`

#### `Base.primaryKey`

```coffee
class Product extends MyLibrary.Base
  this.primaryKey = 'token'
```

*This property is optional.* It tells ActiveResource which property in a response object is the primaryKey of the resource being returned,
as well as telling ActiveResource which key to use when making foreign key assignments

#### `Association.className`

```coffee
class Product extends MyLibrary.Base
  @hasMany 'specialOrders', className: 'Order'

class Order extends MyLibrary.Base
  @belongsTo 'product'
```

This option allows you to name an association by one name, but have that association refer to an existing class of a different name

#### `Association.as` && `Association.polymorphic`

```coffee
class Product extends MyLibrary.Base
  @hasMany 'orders', as: 'resource'

class Store extends MyLibrary.Base
  @hasMany 'orders', as: 'resource'

class Order extends MyLibrary.Base
  @belongsTo 'resource', polymorphic: true
```

These options work together to allow for polymorphic associations between models.

#### `Association.inverseOf`

```coffee
class Product extends MyLibrary.Base
  @hasMany 'orders', inverseOf: 'product'

class Order extends MyLibrary.Base
  @belongsTo 'product', inverseOf: 'orders'
```

This option allows you to define the inverse of an association on a class. Typically, this is done automatically, but there are cases,
like polymorphic relationships, where this cannot be done automatically, and it is extremely useful and highly recommended to provide `inverseOf` in those instances.

#### `Association.foreignKey`

```coffee
class Product extends MyLibrary.Base
  @hasMany 'orders', foreignKey: 'ownerProductId'

class Order extends MyLibrary.Base
  @belongsTo 'ownerProduct', className: 'Product'

Product.first()
.then (product) ->
  order = product.orders().build() # order.ownerProductId == product.id
```

This option allows you to define the foreign key that is set on a child association (`belongsTo`) when assignments/constructions are
made.

#### `Association.primaryKey`

```coffee
class Product extends MyLibrary.Base
  @hasMany 'orders', primaryKey: 'token', foreignKey: 'ownerProductId'

class Order extends MyLibrary.Base
  @belongsTo 'ownerProduct', className: 'Product'

Product.first()
.then (product) ->
  order = product.orders().build() # order.ownerProductId == product.token
```

This option allows you to define the primary key of the parent association that is assigned as the foreign key to the child association
when assignments/constructions are made.

#### `Association.autosave`

```coffee
class Order extends MyLibrary.Base
  @hasMany 'orderItems', autosave: true

class OrderItem extends MyLibrary.Base
  @belongsTo 'order'

order = Order.build(orderItems: [OrderItem.build(amount: 5.0)])
order.save() # sends orderItems attributes to server too
```

This option allows you to specify that associated object(s) of a resource should be saved when the resource itself is saved.
