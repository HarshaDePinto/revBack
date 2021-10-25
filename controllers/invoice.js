const Invoice = require("../models/invoice");
const { errorHandler } = require("../helpers/dbErrorHandler");
const User = require("../models/user");
const md5 = require('md5');

exports.invoiceById = (req, res, next, id) => {
  Invoice.findById(id).exec((err, invoice) => {
    if (err || !invoice) {
      return res.status(400).json({
        error: "Invoice not found",
      });
    }
    req.invoice = invoice;
    next();
  });
};

exports.read = (req, res) => {
  return res.json(req.invoice);
};

exports.create = (req, res) => {
  const invoice = new Invoice(req.body);
  invoice.save((err, data) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    res.json({ data });
  });
};

exports.remove = (req, res) => {
  let invoice = req.invoice;
  invoice.remove((error) => {
    if (error) {
      return res.status(400).json({
        error: errorHandler(error),
      });
    }
    res.json({ message: "Invoice deleted successfully" });
  });
};

exports.onGoingOrders = (req, res) => {
  Invoice.find({ status: 0 }).exec((err, invoices) => {
    if (err) {
      return res.status(400).json({
        error: "Salad not found",
      });
    }
    res.json(invoices);
  });
};

exports.onGoingOrdersClient = (req, res) => {
  const user = req.profile;
  Invoice.find({ status: 1, clientId: user._id }).exec((err, invoices) => {
    if (err) {
      return res.status(400).json({
        error: "Salad not found",
      });
    }
    res.json(invoices);
  });
};

exports.onGoingOrdersNumber = (req, res) => {
  Invoice.find({ status: 0 }).exec((err, invoices) => {
    if (err) {
      return res.status(400).json({
        error: "Salad not found",
      });
    }
    res.json(invoices.length);
  });
};

exports.onGoingOrdersNumberRestaurant = (req, res) => {
  const restaurant = req.restaurant;
  Invoice.find({ status: 0, restaurantId: restaurant._id }).exec(
    (err, invoices) => {
      if (err) {
        return res.status(400).json({
          error: "Invoice Number not found",
        });
      }
      res.json(invoices.length);
    }
  );
};

exports.onGoingOrdersRestaurant = (req, res) => {
  const restaurant = req.restaurant;
  Invoice.find({ status: 0, restaurantId: restaurant._id }).exec(
    (err, invoices) => {
      if (err) {
        return res.status(400).json({
          error: "Salad not found",
        });
      }
      res.json(invoices);
    }
  );
};

exports.acceptedOrdersRestaurant = (req, res) => {
  const restaurant = req.restaurant;
  Invoice.find({ status: 1, restaurantId: restaurant._id }).exec(
    (err, invoices) => {
      if (err) {
        return res.status(400).json({
          error: "Salad not found",
        });
      }
      res.json(invoices);
    }
  );
};

exports.onGoingOrdersClientNumber = (req, res) => {
  const user = req.profile;
  Invoice.find({ status: 1, clientId: user._id }).exec((err, invoices) => {
    if (err) {
      return res.status(400).json({
        error: "Salad not found",
      });
    }
    res.json(invoices.length);
  });
};

exports.isOrderSubmit = (req, res) => {
  const user = req.profile;
  Invoice.find({ status: 0, clientId: user._id }).exec((err, invoices) => {
    if (err) {
      return res.status(400).json({
        error: "Salad not found",
      });
    }
    res.json(invoices.length);
  });
};

exports.updateStatus = (req, res) => {
  const invoice = req.invoice;
  invoice.status = req.body.status;
  invoice.save((err, data) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    res.json(data);
  });
};

exports.orderDelivered = (req, res) => {
  const invoice = req.invoice;
  invoice.status = req.body.status;
  invoice.cashierId = req.body.cashierId;
  invoice.cashierName = req.body.cashierName;
  invoice.paymentStatus = req.body.paymentStatus;
  invoice.save((err, data) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err),
      });
    }
    res.json(data);
  });
};

exports.invoicesByDateRange = (req, res) => {
  let { startDate, endDate } = req.body;
  if (startDate === "" || endDate === "") {
    return res.status(400).json({
      status: "failure",
      message: "Please ensure you pick two dates",
    });
  }

  Invoice.find({
    createdAt: {
      $gte: new Date(new Date(startDate).setHours(00, 00, 00)),
      $lt: new Date(new Date(endDate).setHours(23, 59, 59)),
    },
    status: 2,
  }).exec((err, invoices) => {
    if (err) {
      return res.status(400).json({
        error: "invoices not found",
      });
    }
    res.json(invoices);
  });
};

exports.createByManager = (req, res) => {
  const invoice = new Invoice(req.body);
  const mobile = invoice.clientMobile;
  User.findOne({ mobile: mobile }, (err, user) => {
    if (err || !user) {
      let name = invoice.clientName;
      let mobile = invoice.clientMobile;
      let password = "123456";
      let email = invoice.clientMobile;
      let otp = 2015;
      const user = new User({ name, mobile, password, email, otp });
      user.save((err, user) => {
        if (err) {
          return res.json({
            err: errorHandler(err),
          });
        }
        invoice.clientId = user._id;
        invoice.save((err, data) => {
          if (err) {
            return res.status(400).json({
              error: errorHandler(err),
            });
          }
          res.json({ data });
        });
      });
    } else {
      invoice.clientId = user._id;
      invoice.save((err, data) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        }
        res.json({ data });
      });
    }
  });
};

exports.notify = (req, res) => {
  console.log(req.body);
  const merchantId = req.body.merchant_id;
  const orderId = req.body.order_id;
  const paymentId = req.body.payment_id;
  const payhereAmount = req.body.payhere_amount;
  const capturedAmount = req.body.captured_amount;
  const payhereCurrency = req.body.payhere_currency;
  const md5sig = req.body.md5sig;
  const payhereMethod = req.body.method;
  const statusCode = req.body.status_code;
  const cardHolderName = req.body.card_holder_name;
  const cardNo = req.body.card_no;
  const cardExpiry = req.body.card_expiry;

  const merchant_secret = "4qDMGUZfKze8n4FEABViHU4UobgJIMgZ24juVihTvxsx";
  const mS =md5(merchant_secret).toUpperCase();
  const local_md5sig =md5(merchantId+orderId+payhereAmount+payhereCurrency+statusCode+mS).toUpperCase();

  if(local_md5sig ===md5sig && statusCode === 2){
    Invoice.findOne({ orderId: orderId }).exec((err, invoice) => {
      if (err) {
        return res.status(400).json({
          error: "Invoice not found",
        });
      }
      if(invoice){
        invoice.paymentStatus=true;
        invoice.onlinePaymentStatus=2;
        invoice.merchantId=merchantId;
        invoice.payhereAmount=payhereAmount;
        invoice.paymentId=paymentId;
        invoice.capturedAmount=capturedAmount;
        invoice.payhereCurrency=payhereCurrency;
        invoice.md5sig=md5sig;
        invoice.payhereMethod=payhereMethod;
        invoice.cardHolderName=cardHolderName;
        invoice.cardNo=cardNo;
        invoice.cardExpiry=cardExpiry;
        invoice.save((err, data) => {
          if (err) {
            return res.status(400).json({
              error: errorHandler(err),
            });
          }
          res.json(data);
        });

      }
    });
  }

  if(local_md5sig ===md5sig && statusCode !== 2){
    Invoice.findOne({ orderId: orderId }).exec((err, invoice) => {
      if (err) {
        return res.status(400).json({
          error: "Invoice not found",
        });
      }
      if(invoice){
        invoice.paymentStatus=false;
        invoice.onlinePaymentStatus=statusCode;
        invoice.merchantId=merchantId;
        invoice.payhereAmount=payhereAmount;
        invoice.paymentId=paymentId;
        invoice.capturedAmount=capturedAmount;
        invoice.payhereCurrency=payhereCurrency;
        invoice.md5sig=md5sig;
        invoice.payhereMethod=payhereMethod;
        invoice.cardHolderName=cardHolderName;
        invoice.cardNo=cardNo;
        invoice.cardExpiry=cardExpiry;
        invoice.save((err, data) => {
          if (err) {
            return res.status(400).json({
              error: errorHandler(err),
            });
          }
          res.json(data);
        });

      }
    });
  }

 
};

exports.updateStatusClient = (req, res) => {
  const orderId = req.body.orderId;
  const status = req.body.status; 
  Invoice.findOne({ orderId: orderId }).exec((err, invoice) => {
    if (err) {
      return res.status(400).json({
        error: "Invoice not found",
      });
    }
    if(invoice){
      invoice.status=status;
      invoice.save((err, data) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err),
          });
        }
        res.json(data);
      });

    }
  });
};

exports.ordersByClient = (req, res) => {
  const user = req.profile;
  Invoice.find({ clientId: user._id }).sort({'updatedAt': -1}).exec((err, invoices) => {
    if (err) {
      return res.status(400).json({
        error: "Invoices not found",
      });
    }
    res.json(invoices);
  });
};
