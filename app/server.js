const express = require("express");
const mongoose = require("mongoose");
const morgan = require("morgan");
require("dotenv").config();
const path = require("path");
const http = require("http");
const createHttpError = require("http-errors");
const {appRouter} = require("./routes/router");
const {mainRouter} = require("./routes/mainRoute/main_route.router");
const {ioMainHandler} = require("./socket");

const {connectToRedis} = require('./redis/redis_cache_service')

class Application {
    #app = express();
    #PORT;
    #DB_URL;
    #server;
    #io;
    #redis_client

    constructor(PORT, DB_URL) {
        this.#PORT = PORT;
        this.#DB_URL = DB_URL;
        this.configureApplication();
        this.connectToDB();
        this.connectToRDB()
        this.createServer();
        this.createIO();
        this.createRoute();
        this.errorHandler();
    }

    createServer() {
        this.#server = http.createServer(this.#app);
        this.#server.listen(this.#PORT, () => {
            console.log(`run on > http://localhost:${this.#PORT}`);
        });
    }

    createIO() {
        this.#io = require("socket.io")(this.#server, {
            cors: "*",
        });
        ioMainHandler(this.#io)
    }

    configureApplication() {
        let stat_path = path.join(__dirname, "..", "public");
        // console.log(stat_path);
        this.#app.use(express.static(stat_path));
        this.#app.use(morgan("dev"));
        this.#app.use(express.json());
        this.#app.use(express.urlencoded({extended: true, limit: "50mg"}));
    }

    connectToDB() {
        mongoose.connect(this.#DB_URL);
        mongoose.connection.on("error", (err) => {
            console.log(err);
            process.exit(1);
        });
        // listen on connection and print connected message
        mongoose.connection.on("connected", () => {
            console.log("connected to DB");
        });
        // on SIGINT signal exist
        process.on("SIGINT", () => {
            mongoose.connection.close(() => {
                console.log("Mongoose disconnected on app termination");
                process.exit(0);
            });
        });
    }

    errorHandler() {
        this.#app.use((req, res, next) => {
            next(createHttpError.NotFound("Not Found"));
        });
        this.#app.use((err, req, res, next) => {
            // server err
            console.log(err);
            const serverError = createHttpError.InternalServerError();
            const statusCode = err.status || serverError.statusCode;
            let message;

            message = err.message || serverError.message;

            res.status(statusCode).json({
                status: statusCode,
                message,
            });
        });
    }

    connectToRDB() {
        connectToRedis()
    }

    createRoute() {
        this.#app.use("/api/v1", appRouter);
        this.#app.use("/", mainRouter);
    }
}

module.exports = {
    Application,
};
