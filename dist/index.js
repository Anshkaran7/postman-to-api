"use strict";
// Main entry point for the postman-to-api package
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateInputs = exports.generateApiFiles = exports.parseCollection = void 0;
__exportStar(require("./lib/types"), exports);
__exportStar(require("./lib/parser"), exports);
__exportStar(require("./lib/generator"), exports);
__exportStar(require("./lib/validator"), exports);
__exportStar(require("./lib/templates"), exports);
// Re-export main classes/functions for easier imports
var parser_1 = require("./lib/parser");
Object.defineProperty(exports, "parseCollection", { enumerable: true, get: function () { return parser_1.parseCollection; } });
var generator_1 = require("./lib/generator");
Object.defineProperty(exports, "generateApiFiles", { enumerable: true, get: function () { return generator_1.generateApiFiles; } });
var validator_1 = require("./lib/validator");
Object.defineProperty(exports, "validateInputs", { enumerable: true, get: function () { return validator_1.validateInputs; } });
//# sourceMappingURL=index.js.map