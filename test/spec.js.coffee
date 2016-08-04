#= require jquery
#= require mock-ajax
#= require_tree ../../app/assets/javascripts/active_resource
#= require responses
#= require_tree .

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
    this.hasMany 'orderItems', autosave: 'true'

  class @::OrderItem extends ActiveResource::Base
    this.className = 'OrderItem'
    this.queryName = 'order_items'

    this.belongsTo 'order'

  class @::Product extends ActiveResource::Base
    this.className = 'Product'
    this.queryName = 'products'

    this.hasMany 'orders'

ActiveResource.constantizeScope = window.MyLibrary::
ActiveResource.interface = ActiveResource::Interfaces::JsonApi

jasmine.Ajax.useMock()
window.onSuccess = jasmine.createSpy('onSuccess')
window.onFailure = jasmine.createSpy('onFailure')
window.onCompletion = jasmine.createSpy('onCompletion')

# Get the params in a URL after the `?`
#
# @param [Object] request the mostRecentAjaxRequest() from jasmine-Ajax
# @return [String] the request query params
window.requestParams = (request) ->
  decodeURIComponent(request.url.split('?')[1])

# Get the response data from a mostRecentAjaxRequest().data() jasmine-Ajax call,
# which formats incorrectly due to rendering as `Content-Type: 'application/json'`
#
# @param [Object] request the mostRecentAjaxRequest() from jasmine-Ajax
# @return [Object] the request data
window.requestData = (request) ->
  JSON.parse(_.keys(request.data())[0])
