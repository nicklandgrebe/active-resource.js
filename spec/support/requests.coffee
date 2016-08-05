ActiveResource.baseUrl = 'https://example.com/api/v1/'
ActiveResource.interface = ActiveResource::Interfaces::JsonApi

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
