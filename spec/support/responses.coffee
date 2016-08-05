# Defines responses for various queries

getJSONFixture = (fixture) ->
  require("./fixtures/json/#{fixture}.json")

jasmine.Ajax.useMock()
window.onSuccess = jasmine.createSpy('onSuccess')
window.onFailure = jasmine.createSpy('onFailure')
window.onCompletion = jasmine.createSpy('onCompletion')

window.JsonApiResponses =
  Comment:
    find:
      success:
        status: 200
        responseText: JSON.stringify(getJSONFixture('comments/singular.json'))
  GiftCard:
    find:
      success:
        status: 200
        responseText: JSON.stringify(getJSONFixture('gift_cards/singular.json'))
      includes:
        status: 200
        responseText: JSON.stringify(getJSONFixture('gift_cards/includes.json'))
    save:
      success:
        status: 200
        responseText: JSON.stringify(getJSONFixture('gift_cards/singular.json'))
      failure:
        status: 422
        responseText: JSON.stringify(getJSONFixture('gift_cards/422_resource_invalid.json'))
  Order:
    all:
      success:
        status: 200
        responseText: JSON.stringify(getJSONFixture('orders/collection.json'))
      includes:
        status: 200
        responseText: JSON.stringify(getJSONFixture('orders/collection_includes.json'))
    find:
      success:
        status: 200
        responseText: JSON.stringify(getJSONFixture('orders/singular.json'))
      includes:
        status: 200
        responseText: JSON.stringify(getJSONFixture('orders/includes.json'))
    save:
      success:
        status: 200
        responseText: JSON.stringify(getJSONFixture('orders/singular.json'))
      failure:
        status: 422
        responseText: JSON.stringify(getJSONFixture('orders/422_resource_invalid.json'))
  Product:
    all:
      success:
        status: 200
        responseText: JSON.stringify(getJSONFixture('products/collection.json'))
    find:
      success:
        status: 200
        responseText: JSON.stringify(getJSONFixture('products/singular.json'))
      includes:
        status: 200
        responseText: JSON.stringify(getJSONFixture('products/includes.json'))
      failure:
        status: 404
        responseText: JSON.stringify(getJSONFixture('products/404_resource_not_found.json'))
    save:
      success:
        status: 200
        responseText: JSON.stringify(getJSONFixture('products/another_singular.json'))
      failure:
        status: 422
        responseText: JSON.stringify(getJSONFixture('products/422_resource_invalid.json'))
    destroy:
      success:
        status: 204
      failure:
        status: 403
        responseText: JSON.stringify(getJSONFixture('products/403_forbidden.json'))
  Venue:
    find:
      tokenized:
        status: 200
        responseText: JSON.stringify(getJSONFixture('venues/singular_token.json'))
  relationships:
    update:
      success:
        status: 204
      failure:
        status: 403
