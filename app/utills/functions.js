const jwt = require("jsonwebtoken");
require("dotenv").config();

function generateUserToken(id) {
  let token = jwt.sign(
    {
      id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1y" }
  );
  return token;
}

async function generateGameJwtToken(id){
    let gameToken=await jwt.sign(
        {
            id
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1y"
        }
    )
    return gameToken
}
function validatorMapper(errors = []) {
    let message = {};
    errors.forEach((error) => {
      message[error.path] = error.msg;
    });
    return message;
  }

module.exports = {
  generateUserToken,
  validatorMapper,
    generateGameJwtToken
};
