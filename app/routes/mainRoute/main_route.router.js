const express = require("express");


const router = express.Router();

router.route("/").get( (req, res, next) => {
  return res.status(200).json({
    message: "home",
  });
});



module.exports = {
  mainRouter: router,
};
