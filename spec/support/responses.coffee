# Defines responses for various queries

jasmine.Ajax.install()

window.JsonApiResponses =
  Comment:
    find: {}
  GiftCard:
    find: {}
    save: {}
  Order:
    all: {}
    find: {}
    save: {}
  Product:
    all: {}
    find: {}
    save: {}
    destroy:
      success:
        status: 204
  Venue:
    find: {}
  relationships:
    update:
      success:
        status: 204
      failure:
        status: 403
