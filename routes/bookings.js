const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookings");
const { isLoggedIn } = require("../middleware.js");

/* CREATE BOOKING */
router.post(
  "/listings/:id/book",
  isLoggedIn,
  bookingController.createBooking
);

/* PAYMENT PAGE */
router.get(
  "/bookings/:id/pay",
  isLoggedIn,
  bookingController.renderPaymentPage
);

/* CREATE ORDER */
router.post(
  "/bookings/:id/create-order",
  isLoggedIn,
  bookingController.createPaymentOrder
);

/* VERIFY PAYMENT */
router.post(
  "/bookings/:id/verify-payment",
  isLoggedIn,
  bookingController.verifyPayment
);

module.exports = router;