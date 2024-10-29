
# Quiz Of Mine
This repository is an ongoing project to clone the popular game Quiz of King with Socket.io implementation in the backend using Express.js. The frontend, which will be developed using Flutter, is planned for mobile platforms.

## Project Overview
The goal of this project is to:
- Explore and implement *Socket.io* for real-time features and challenges.
- Develop a Flutter front end to work seamlessly with the backend for mobile applications.
- Provide a robust backend architecture using Node.js, Express.js, Socket.io, and other tools.
  
**We welcome contributions from developers who want to help enhance this project and overcome its challenges.**

## Features
- Real-time socket connection with Socket.io.
- Database interaction usig **Mongoose** and **MongoDB**.
- Redis integration for caching and fast data storage.
- Flutter-based mobile front-end(comming soon)

## Backend Structure
The backend structure is organized as follows:
``` perl
├───app
│   ├───http
│   │   ├───controllers
│   │   ├───middlewares
│   │   ├───models
│   │   └───validators
│   ├───routes
│   │   ├───auth
│   │   ├───link
│   │   └───mainRoute
│   └───utils
│   └───server.js
├───node_modules
│   └───socket
└───index.js
```
### Dependencies
Here are the main dependencies used in the backend project:
``` json
{
  "bcrypt": "^5.1.1",
  "dotenv": "^16.4.5",
  "ejs": "^3.1.10",
  "express": "^4.21.1",
  "express-validator": "^7.2.0",
  "http-errors": "^2.0.0",
  "jsonwebtoken": "^9.0.2",
  "mongoose": "^8.7.0",
  "morgan": "^1.10.0",
  "nodemon": "^3.1.7",
  "redis": "^4.7.0",
  "short-unique-id": "^5.2.0",
  "socket.io": "^4.8.0",
  "uuid": "^10.0.0",
  "ws": "^8.18.0"
}
```
### Contributing
We welcome forks and contributions. Feel free to submit pull requests or report issues.

