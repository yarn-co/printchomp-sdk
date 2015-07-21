var Qs = require('qs');
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
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this .clientSecret
    })},
    
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
  if (userId && userId !== parseInt(userId)) {
    return cb(new Error('The received user id is not an integer'));
  }
  
  var userId = (userId) ? '/'+parseInt(userId) : '';
  
  Wreck.get(
    
    this.printchompUrl+'/api/v1/users'+userId,
    
    {headers: {
      Authorization: 'Bearer '+this.token
    }},
    
    function (err, response, payload) {
      
      if (err || (response.statusCode !== 200 && response.statusCode !== 201)) {
        return cb(new Error('Failed to obtain user/users '+(err || payload)));
      }
      
      payload = internals.parsePayload(payload.toString());
      
      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from get users endpoint '+payload));
      }
      
      if (typeof(payload._embedded) === 'undefined') {
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
      name: name,
      email: email
    }),
    headers:{
      Authorization: 'Bearer '+this.token
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
  
  var offerUrl;
  
  // if the offerId is present then return the matching offer
  if (offerId) {
    
    if (parseInt(offerId) !== offerId) {
      
      return cb(new Error('The received offer id is not an integer'));
    }
    
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
      Authorization: 'Bearer '+this.token
    }},
    
    function(err, response, payload) {
      
      if (err || (response.statusCode !== 200 && response.statusCode !== 201)) {
        return cb(new Error('Failed to obtain offer/offers '+(err || payload)));
      }
      
      payload = internals.parsePayload(payload.toString());
      
      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from get offers endpoint '+payload));
      }
      
      if (typeof(payload._embedded) === 'undefined') {
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
    
    this.printchompUrl+'api/v1/shipping',
    
    {payload: JSON.stringify({
      offer: {
        id: orderInfo.offerId
      },
      address: {
        city: orderInfo.shipping.city,
        region: orderInfo.shipping.state,
        country: orderInfo.shipping.country,
        postal_code: orderInfo.shipping.postal
      }
    }),
    headers: {
      Authorization: 'Bearer '+this.token
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
  if (orderId && orderId !== parseInt(userId)) {
    return cb(new Error('The received order id is not an integer'));
  }
  
  var orderId = (orderId) ? '/'+parseInt(orderId) : '';
  
  Wreck.get(
    
    this.printchompUrl+'/api/v1/orders'+orderId,
    
    {headers:{
      Authorization: 'Bearer '+this.token
    }},
    
    function (err, response, payload) {
      
      if (err || (response.statusCode !== 200 && response.statusCode !== 201)) {
        return cb(new Error('Failed to obtain order/orders '+(err || payload)));
      }
      
      payload = internals.parsePayload(payload.toString());
      
      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from get orders endpoint '+payload));
      }
      
      if (typeof(payload._embedded) === 'undefined') {
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
    
    {payload: JSON.stringify({
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
    }),
    headers: {
      Authorization: 'Bearer '+this.token
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
    filesUrl = 'files/'+Qs.stringify(fileId);
    
  // if the orderId is present then return all files associated with the matching order
  } else if (!fileId && orderId) {
    filesUrl = 'orders/'+Qs.stringify(orderId)+'/files';
  } else {
    return cb(new Error('Received unexpected or missing parameters fileId and orderId'));
  }
  
  Wreck.get(
    
    this.printchompUrl+'/api/v1/'+filesUrl,
    
    {headers:{
      Authorization: 'Bearer '+this.token
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
  if (productId && productId !== parseInt(productId)) {
    return cb(new Error('The received product id is not an integer'));
  }
  
  var productId = (productId) ? '/'+parseInt(productId) : '';
  
  Wreck.get(
    
    this.printchompUrl+'/api/v1/products'+productId,
    
    {headers:{
      Authorization: 'Bearer '+this.token
    }},
    
    function (err, response, payload) {
      
      if (err || (response.statusCode !== 200 && response.statusCode !== 201)) {
        return cb(new Error('Failed to obtain product/products '+(err || payload)));
      }
      
      payload = internals.parsePayload(payload.toString());
      
      if (payload instanceof Error) {
        return cb(new Error('Received invalid payload from get products endpoint '+payload));
      }
      
      if (typeof(payload._embedded) === 'undefined') {
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
