var Qs = require('qs');
var Hoek = require('hoek');
var Wreck = require('wreck');

var internals = {};
var PrintChompSDK;

// sets all of the necessary values, if any values are missing it defaults to the mock server testing values
module.exports = PrintChompSDK = function (options) {

  this.token = options.token || "a973a5535ecae185c84b3ab5885aa9484cb2180735ffdd773c7d7e00315ab031";
  this.clientId = options.clientId || "faea7085836429308d9775926746265cb9d4735c2e1ddfc59078f24617e8c33f";
  this.clientSecret = options.clientSecret || "96b35972a4dfbee217029358eed105143fa42ad703b728926b997ef68d5a1416";
  this.printchompUrl = options.printchompUrl || "https://staging.printchomp.com";

};


// returns the token currently in use
PrintChompSDK.prototype.getToken = function() {

  if (!this.token) {

    return 'There is no access token currently set. Generate one using createToken or '+
      'contact Printchomp customer support to have one generated for your application.';
  }

  return this.token;

};// end getToken


// generates an application token
PrintChompSDK.prototype.createToken = function(cb) {

  var self = this;

  Wreck.post(

    this.printchompUrl+'/oauth/token',

    {payload: JSON.stringify({
      'grant_type': 'client_credentials',
      'client_id': this.clientId,
      'client_secret': this .clientSecret
    }),
    headers:{
      'Content-Type': 'application/json'
    }},

    function (err, response, payload) {

      if (err) {
        return cb(err);
      } else if (response.statusCode !== 200 && response.statusCode !== 201) {
        return cb(new Error('Failed to obtain access token '+payload));
      }

      payload = internals.parsePayload(payload.toString());

      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from access token endpoint '+payload));
      }

      self.token = payload.access_token;

      cb(null, self.token);
    }
  );

};// end createToken


// returns user(s)
PrintChompSDK.prototype.getUsers = function(userId, cb) {

  // ensure that userId is an integer like value
  if (userId) {
    Hoek.assert(userId == parseInt(userId), new Error('The received userId is not an integer'));
  }

  // if the userId is set then return matching user, otherwise return all users
  var userUrl = (userId) ? '/'+parseInt(userId) : '';

  Wreck.get(

    this.printchompUrl+'/api/v1/users'+userUrl,

    {headers: {
      'Authorization': 'Bearer '+this.token
    }},

    function (err, response, payload) {

      if (err) {
        return cb(err);
      } else if (response.statusCode !== 200 && response.statusCode !== 201) {
        return cb(new Error('Failed to obtain user/users '+payload));
      }

      payload = internals.parsePayload(payload.toString());

      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from get users endpoint '+payload));
      }

      if (typeof payload._embedded === 'undefined') {
        cb(null, payload);
      } else {
        cb(null, payload._embedded.users);
      }
    }
  );
};// end getUsers


// creates a printchomp user
PrintChompSDK.prototype.createUser = function (name, email, cb) {

  Wreck.post(

    this.printchompUrl+'/api/v1/users',

    // printchomp will create and send login credentials to the following user
    {payload: JSON.stringify({
      'name': name,
      'email': email
    }),
    headers:{
      'Content-Type': 'application/json',
      'Authorization': 'Bearer '+this.token
    }},

    function (err, response, payload) {

      if (err) {
        return cb(err);
      } else if (response.statusCode !== 200 && response.statusCode !== 201) {
        return cb(new Error('Failed to create new user '+payload));
      }

      payload = internals.parsePayload(payload.toString());

      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from create user endpoint '+payload));
      }

      cb(null, payload);
    }
  );
};// end createUser


// returns offer(s)
PrintChompSDK.prototype.getOffers = function (offerId, productName, exclusiveOffer, cb) {

  var offerUrl = '';

  // if the offerId is present then return the matching offer
  if (offerId) {

    // ensure that offerId is an integer like value
    Hoek.assert(offerId == parseInt(offerId), new Error('The received offerId is not an integer'));

    offerUrl = '/'+parseInt(offerId);

  // otherwise we are looking for any offer that matches the following criteria
  } else {

    if (productName) {

      offerUrl = '?'+Qs.stringify({product_name: productName, exclusive: exclusiveOffer});

    } else {

      offerUrl = '?'+Qs.stringify({exclusive: exclusiveOffer});
    }
  }

  Wreck.get(

    this.printchompUrl+'/api/v1/offers'+offerUrl,

    {headers:{
      'Authorization': 'Bearer '+this.token
    }},

    function(err, response, payload) {

      if (err) {
        return cb(err);
      } else if (response.statusCode !== 200 && response.statusCode !== 201) {
        return cb(new Error('Failed to obtain offer/offers '+payload));
      }

      payload = internals.parsePayload(payload.toString());

      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from get offers endpoint '+payload));
      }

      if (typeof payload._embedded === 'undefined') {
        cb(null, payload);
      } else {
        cb(null, payload._embedded.offers);
      }
    }
  );
};// end getOffers


// creates a quote for shipping an order
PrintChompSDK.prototype.createQuote = function (orderInfo, cb) {

  Wreck.post(

    this.printchompUrl+'/api/v1/shipping',

    {payload: JSON.stringify({
      'offer': {
        'id': orderInfo.offerId
      },
      'address': {
        'street': orderInfo.shipping.addr1,
        'city': orderInfo.shipping.city,
        'region': orderInfo.shipping.state,
        'country': orderInfo.shipping.country,
        'postal_code': orderInfo.shipping.postal
      }
    }),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer '+this.token
    }},

    function (err, response, payload) {

      if (err) {
        return cb(err);
      } else if (response.statusCode !== 200 && response.statusCode !== 201) {
        return cb(new Error('Failed to create shipping quote '+payload));
      }

      payload = internals.parsePayload(payload.toString());

      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from create quote endpoint '+payload));
      }

      cb(null, payload);
    }
  );
};// end createQuote


// returns order(s)
PrintChompSDK.prototype.getOrders = function (orderId, cb) {

  // ensure that orderId is an integer like value
  if (orderId) {
    Hoek.assert(orderId == parseInt(orderId), new Error('The received orderId is not an integer'));
  }

  // if the orderId is present return the matching order, otherwise return all orders
  var ordersUrl = (orderId) ? '/'+parseInt(orderId) : '';

  Wreck.get(

    this.printchompUrl+'/api/v1/orders'+ordersUrl,

    {headers:{
      'Authorization': 'Bearer '+this.token
    }},

    function (err, response, payload) {

      if (err) {
        return cb(err);
      } else if (response.statusCode !== 200 && response.statusCode !== 201) {
        return cb(new Error('Failed to obtain order/orders '+payload));
      }

      payload = internals.parsePayload(payload.toString());

      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from get orders endpoint '+payload));
      }

      if (typeof payload._embedded === 'undefined') {
        cb(null, payload);
      } else {
        cb(null, payload._embedded.orders);
      }
    }
  );
};// end getOrders


// creates a printchomp order
PrintChompSDK.prototype.createOrder = function (orderInfo, cb) {

  var self = this;

  Wreck.post (

    this.printchompUrl+'/api/v1/orders',

    {payload: JSON.stringify(orderInfo),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer '+this.token
    }},

    function (err, response, payload) {

      if (err) {
        return cb(err);
      } else if (response.statusCode !== 200 && response.statusCode !== 201) {
        return cb(new Error('Failed to create an order '+payload));
      }

      payload = internals.parsePayload(payload.toString());

      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from create order endpoint '+payload));
      }

      cb(null, payload);
    }
  );
};// end createOrder


// returns file(s)
PrintChompSDK.prototype.getFiles = function (fileId, cb) {

  // the fileId must be present and an integer like value
  Hoek.assert(fileId, new Error('fileId is a required field.'));
  Hoek.assert(fileId == parseInt(fileId), new Error('The received fileId is not an integer.'));

  var filesUrl = '/'+parseInt(fileId);

  Wreck.get(

    this.printchompUrl+'/api/v1/files'+filesUrl,

    {headers:{
      'Authorization': 'Bearer '+this.token
    }},

    function (err, response, payload) {

      if (err) {
        return cb(err);
      } else if (response.statusCode !== 200 && response.statusCode !== 201) {
        return cb(new Error('Failed to obtain file/files '+payload));
      }

      payload = internals.parsePayload(payload.toString());

      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from get files endpoint '+payload));
      }

      cb(null, payload);
    }
  );
};// end getFiles


// returns product(s)
PrintChompSDK.prototype.getProducts = function (productId, cb) {

  // ensure that productId is an integer like value
  if (productId) {
    Hoek.assert(productId == parseInt(productId), new Error('The received product id is not an integer'));
  }

  // if productId is present return matching product, otherwise return all products
  var productUrl = (productId) ? '/'+parseInt(productId) : '';

  Wreck.get(

    this.printchompUrl+'/api/v1/products'+productUrl,

    {headers:{
      'Authorization': 'Bearer '+this.token
    }},

    function (err, response, payload) {

      if (err) {
        return cb(err);
      } else if (response.statusCode !== 200 && response.statusCode !== 201) {
        return cb(new Error('Failed to obtain product/products '+payload));
      }

      payload = internals.parsePayload(payload.toString());

      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from get products endpoint '+payload));
      }

      if (typeof payload._embedded === 'undefined') {
        cb(null, payload);
      } else {
        cb(null, payload._embedded.products);
      }
    }
  );
};// end getProducts


internals.parsePayload = function(payload) {
  if (payload[0] === '{') {
    try {
      return JSON.parse(payload);
    }
    catch (err) {
      return err;
    }
  }
  return Qs.parse(payload);
};
