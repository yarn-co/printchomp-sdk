var Querystring = require('querystring');
var Wreck = require('wreck');

var internals = {};
var PrintChompSDK;

// sets all of the necessary values, if any values are missing it defaults to the mock server testing values
module.exports = PrintChompSDK = function (options) {
  
  this.token = (options.token) ?
    options.token : "a973a5535ecae185c84b3ab5885aa9484cb2180735ffdd773c7d7e00315ab031";
  this.clientId = (options.clientId) ?
    options.clientId : "faea7085836429308d9775926746265cb9d4735c2e1ddfc59078f24617e8c33f";
  this.clientSecret = (options.clientSecret) ?
    options.clientSecret : "96b35972a4dfbee217029358eed105143fa42ad703b728926b997ef68d5a1416";
  this.printchompUrl = (options.printchompUrl) ?
    options.printchompUrl : "https://private-anon-674d053cd-printchomp.apiary-mock.com";
  
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
    
    {payload: Querystring.stringify({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this .clientSecret
    }),
    headers:{Content-Type: 'application/json'}},
    
    function (err, response, payload) {
      
      if (err || (response.statusCode !== 200 && response.statusCode !== 201)) {
        return cb(new Error('Failed to obtain access token '+( err || payload)));
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
  
  // if the userId is present return the matching user, otherwise return all users
  var userId = (userId) ? '/'+querystring.escape(userId) : '';
  
  Wreck.get(
    
    this.printchompUrl+'/api/v1/users'+userId,
    
    {headers: {
      Authorization: this.token
    }},
    
    function (err, response, payload) {
      
      if (err || (response.statusCode !== 200 && response.statusCode !== 201)) {
        return cb(new Error('Failed to obtain user/users '+(err || payload)));
      }
      
      payload = internals.parsePayload(payload.toString());
      
      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from get users endpoint '+payload));
      }
      
      cb(null, payload);
    }
  );
};// end getUsers


// creates a printchomp user
PrintChompSDK.prototype.createUser = function (name, email, cb) {
  
  Wreck.post(
    
    this.printchompUrl+'/api/v1/users',
    
    // printchomp will create and send login credentials to the following user
    {payload: Querystring.stringify({
      name: name,
      email: email
    }),
    headers:{
      Content-Type: 'application/json',
      Authorization: this.token
    }},
    
    function (err, response, payload) {
      
      if (err || (response.statusCode !== 200 && response.statusCode !== 201)) {
        return cb(new Error('Failed to create new user '+(err || payload)));
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
    
    offerUrl = '/'+querystring.escape(offerId);
    
  // otherwise we are looking for any offer that matches the following criteria
  } else {
    
    // escape data using querystring
    offerUrl = '?'+querystring.stringify({product_name: productName, exclusive: exclusiveOffer});
  }
  
  Wreck.get(
    
    this.printchompUrl+'/api/v1/offers'+offerUrl,
    
    {headers:{
      Authorization:this.token
    }},
    
    function(err, response, payload) {
      
      if (err || (response.statusCode !== 200 && response.statusCode !== 201)) {
        return cb(new Error('Failed to obtain offer/offers '+(err || payload)));
      }
      
      payload = internals.parsePayload(payload.toString());
      
      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from get offers endpoint '+payload));
      }
      
      cb(null, payload);
    }
  );
};// end getOffers


// creates a quote for shipping an order
PrintChompSDK.prototype.createQuote = function (orderInfo, cb) {
  
  Wreck.post(
    
    this.printchompUrl+'api/v1/shipping',
    
    {payload: Querystring.stringify({
      offer: {
        id: shippingInfo.offerId
      },
      address: {
        city: orderInfo.shipping.city,
        region: orderInfo.shipping.state,
        country: orderInfo.shipping.country,
        postal_code: orderInfo.shipping.postal
      }
    }),
    headers: {
      Authorization: this.token,
    }},
    
    function (err, response, payload) {
      
      if (err || (response.statusCode !== 200 && response.statusCode !== 201)) {
        return cb(new Error('Failed to create shipping quote '+(err || payload)));
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
  
  // if the orderId is present return the matching order, otherwise return all orders
  orderId = (orderId) ? '/'+querystring.escape(orderId) : '';
  
  Wreck.get(
    
    this.printchompUrl+'/api/v1/orders'+orderId,
    
    {headers:{
      Authorization:this.token
    }},
    
    function (err, response, payload) {
      
      if (err || (response.statusCode !== 200 && response.statusCode !== 201)) {
        return cb(new Error('Failed to obtain order/orders '+(err || payload)));
      }
      
      payload = internals.parsePayload(payload.toString());
      
      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from get orders endpoint '+payload));
      }
      
      cb(null, payload);
    }
  );
};// end getOrders


// creates a printchomp order
PrintChompSDK.prototype.createOrder = function (orderInfo, cb) {
  
  var self = this;
  
  Wreck.post (
    
    this.printchompUrl+'/api/v1/orders',
    
    {headers: {
      Authorization: this.token,
      body: {
        offer: {
          id: orderInfo.offerId
        },
        customer: {
          id: orderInfo.userId
        },
        billing: {
          name: orderInfo.billing.firstName+' '+orderInfo.billing.lastName,
          phone: orderInfo.billing.phone,
          address: {
            street: orderInfo.billing.addr1,
            street2: orderInfo.billing.addr2,
            city: orderInfo.billing.city,
            region: orderInfo.billing.state,
            country: orderInfo.billing.country,
            postal_code: orderInfo.billing.postal,
          },
          amount: {
            price: orderInfo.pricing.price,
            markup: orderInfo.pricing.markup,
            subtotal: orderInfo.pricing.subtotal,
            tax1: orderInfo.pricing.tax1,
            tax2: orderInfo.pricing.tax2,
            shipping: orderInfo.pricing.shipping,
            total: orderInfo.pricing.total,
            currency: orderInfo.pricing.currency
          },
          credit_card: {
            number: orderInfo.card.number,
            verification: orderInfo.card.verify,
            expiry: {
              month: orderInfo.card.month,
              year: orderInfo.card.year
            }
          }
        },
        shipping: {
          name: orderInfo.shipping.firstName+' '+orderInfo.shipping.lastName,
          phone: orderInfo.shipping.phone,
          address: {
            street: orderInfo.shipping.addr1,
            street2: orderInfo.shipping.addr2,
            city: orderInfo.shipping.city,
            region: orderInfo.shipping.state,
            country: orderInfo.shipping.country,
            postal_code: orderInfo.shipping.postal
          }
        },
        files:[
          orderInfo.files
        ]
      }
    }},
    
    function (err, response, payload) {
      
      if (err || (response.statusCode !== 200 && response.statusCode !== 201)) {
        return cb(new Error('Failed to create an order '+(err || payload)));
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
PrintChompSDK.prototype.getFiles = function (fileId, orderId, cb) {
  
  // one of these values needs to be present
  var filesUrl = '';
  
  // if the fileId is present then return the matching file
  if (fileId && !orderId) {
    filesUrl = 'files/'+querystring.escape(fileId);
    
  // if the orderId is present then return all files associated with the matching order
  } else if (!fileId && orderId) {
    filesUrl = 'orders/'+querystring.escape(orderId)+'/files';
  } else {
    return cb(new Error('Received unexpected or missing parameters fileId and orderId'));
  }
  
  Wreck.get(
    
    this.printchompUrl+'/api/v1/'+filesUrl,
    
    {headers:{
      Authorization:this.token
    }},
    
    function (err, response, payload) {
      
      if (err || (response.statusCode !== 200 && response.statusCode !== 201)) {
        return cb(new Error('Failed to obtain file/files '+(err || payload)));
      }
      
      payload = internals.parsePayload(payload.toString());
      
      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from get files endpoint '+payload));
      }
      
      cb(null, payload);
    }
  );
};// end getFiles


// returns product(s) a specific product or all products
PrintChompSDK.prototype.getProducts = function (productId, cb) {
  
  // if the productId is present then return the matching product, otherwise return all products
  var productId = (productId) ? '/'+querystring.escape(productId) : '';
  
  Wreck.get(
    
    this.printchompUrl+'/api/v1/products'+productId,
    
    {headers:{
      Authorization:this.token
    }},
    
    function (err, response, payload) {
      
      if (err || (response.statusCode !== 200 && response.statusCode !== 201)) {
        return cb(new Error('Failed to obtain product/products '+(err || payload)));
      }
      
      payload = internals.parsePayload(payload.toString());
      
      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from get products endpoint '+payload));
      }
      
      cb(null, payload);
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
  return Querystring.parse(payload);
};
