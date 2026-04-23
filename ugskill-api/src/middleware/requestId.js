"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = void 0;
const uuid_1 = require("uuid");
const express_1 = require("express");
const requestIdMiddleware = (req, res, next) => {
    req.reqId = req.headers['x-request-id'] || (0, uuid_1.v4)();
    res.setHeader('X-Request-Id', req.reqId);
    next();
};
exports.requestIdMiddleware = requestIdMiddleware;
//# sourceMappingURL=requestId.js.map