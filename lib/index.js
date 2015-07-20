var Querystring = require('querystring');
var Wreck = require('wreck');

var internals = {};
var printshompsdk;

module.exports = printchompsdk = function (options, cb) {
  
  this.token = options.token;
  this.clientId = options.clientId;
  this.clientSecret = options.clientSecret;
  this.printchompUrl = options.printchompUrl;
  
};


// returns the token currently in use
printchompsdk.prototype.getToken = function(cb) {
  
  if (!this.token) {
    
    return cb(new Error('There is no access token currently set. Generate one using createToken'
      +' or contact Printchomp customer support to have one generated for your application.'));
  }
  
  return cb(null, this.token);
  
};// end getToken


// generates an application token, if necessary
printchompsdk.prototype.createToken = function(cb) {
  
  var self = this;
  
  Wreck.post(
    
    self.printchompUrl+'/oauth/token',
    {headers: {
      grant_type: 'client_credentials',
      client_id: self.clientId,
      client_secret: self .clientSecret
    }},
    
    function (err, response, payload) {
      
      if (err || (response.statusCode !== 200 && response.statusCode !== 201)) {
        return cb(new Error('Failed to obtain access token '+( err || payload)));
      }
      
      payload = internals.parsePayload(payload.toString());
      
      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from access token endpoint '+payload));
      }
      
      self.token = payload.token_type+' '+payload.access_token;
      
      cb();
    }
  );
  
};// end createToken


// returns user(s)
printchompsdk.prototype.getUsers = function(userId, cb) {
  
  var self = this;
  
  // if the userId is present return the matching user, otherwise return all users
  var userId = (userId) ? '/'+userId : '';
  
  Wreck.get(
    
    self.printchompUrl+'/api/v1/users'+userId,
    
    {headers: {
      Authorization: self.token
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
printchompsdk.prototype.createUser = function (name, email, cb) {
  
  var self = this;
  
  Wreck.post(
    
    self.printchompUrl+'/api/v1/users',
    
    // printchomp will create and send login credentials to the following user
    {headers: {
      Authorization: self.token,
      body: {
        name: name,
        email: email
      }
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
printchompsdk.prototype.getOffers = function (offerId, productName, exclusiveOffer, cb) {
  
  var self = this;
  var offerUrl = '';
  
  // if the offerId is present then return the matching offer
  if (offerId) {
    
    offerUrl = '/'+offerId;
    
  // otherwise we are looking for any offer that matches the following criteria
  } else {
    
    /* productName ensures that only items with the same productName are returned
       note: it is possible to have multiple products with the same productName */
    productName = (productName) ? '?product_name'+productName : '';
    
    // exclusiveOffer indicates that the offer should be specific for your partner(token)
    exclusiveOffer = (productName) ? '&exclusive='+exclusiveOffer : '?exclusive='+exclusiveOffer;
    
    offerUrl = productName+exclusiveOffer;
  }
  
  Wreck.get(
    
    self.printchompUrl+'/api/v1/offers'+offerUrl,
    
    {headers:{
      Authorization:self.token
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
printchompsdk.prototype.createQuote = function (orderInfo, cb) {
  
  var self = this;
  
  Wreck.post(
    
    self.printchompUrl+'api/v1/shipping',
    
    {headers: {
      Authorization: self.token,
      body: {
        offer: {
          id: shippingInfo.offerId
        },
        address: {
          city: orderInfo.shipping.city,
          region: orderInfo.shipping.state,
          country: orderInfo.shipping.country,
          postal_code: orderInfo.shipping.postal
        }
      }
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
printchompsdk.prototype.getOrders = function (orderId, cb) {
  
  var self = this;
  
  // if the orderId is present return the matching order, otherwise return all orders
  orderId = (orderId) ? '/'+orderId : '';
  
  Wreck.get(
    
    self.printchompUrl+'/api/v1/orders'+orderId,
    
    {headers:{
      Authorization:self.token
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
printchompsdk.prototype.createOrder = function (orderInfo, cb) {
  
  var self = this;
  
  Wreck.post (
    
    self.printchompUrl+'/api/v1/orders',
    
    {headers: {
      Authorization: self.token,
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
printchompsdk.prototype.getFiles = function (fileId, orderId, cb) {
  
  var self = this;
  
  // one of these values needs to be present
  var filesUrl = '';
  
  // if the fileId is present then return the matching file
  if (fileId && !orderId) {
    filesUrl = 'files/'+fileId;
    
  // if the orderId is present then return all files associated with the matching order
  } else if (!fileId && orderId) {
    filesUrl = 'orders/'+orderId+'/files';
  } else {
    return cb(new Error('Received unexpected or missing parameters fileId and orderId'));
  }
  
  Wreck.get(
    
    self.printchompUrl+'/api/v1/'+filesUrl,
    
    {headers:{
      Authorization:self.token
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
printchompsdk.prototype.getProducts = function (productId, cb) {
  
  var self = this;
  
  // if the productId is present then return the matching product, otherwise return all products
  var productId = (productId) ? '/'+productId : '';
  
  Wreck.get(
    
    self.printchompUrl+'/api/v1/products'+productId,
    
    {headers:{
      Authorization:self.token
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
