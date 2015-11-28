//-----------------------------------
// Copyright(c) 2015 猫王子
//-----------------------------------
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, Promise, generator) {
    return new Promise(function (resolve, reject) {
        generator = generator.call(thisArg, _arguments);
        function cast(value) { return value instanceof Promise && value.constructor === Promise ? value : new Promise(function (resolve) { resolve(value); }); }
        function onfulfill(value) { try { step("next", value); } catch (e) { reject(e); } }
        function onreject(value) { try { step("throw", value); } catch (e) { reject(e); } }
        function step(verb, value) {
            var result = generator[verb](value);
            result.done ? resolve(result.value) : cast(result.value).then(onfulfill, onreject);
        }
        step("next", void 0);
    });
};
var net = require('net');
var crypto = require('../lib/cipher');
var constant_1 = require('../lib/constant');
var index_1 = require('./socks5/index');
class Socks5Server {
    constructor(options) {
        let _this = this;
        ['cipherAlgorithm', 'password', 'port'].forEach(n => _this[n] = options[n]);
    }
    start() {
        let me = this;
        let server = net.createServer((client) => __awaiter(this, void 0, Promise, function* () {
            let data = yield client.readAsync();
            if (!data)
                return client.dispose();
            let meta = crypto.SupportedCiphers[me.cipherAlgorithm] || crypto.SupportedCiphers[crypto.DefaultAlgorithm];
            let ivLength = meta[1];
            let iv = new Buffer(ivLength);
            data.copy(iv, 0, 0, ivLength);
            let decipher = crypto.createDecipher(me.cipherAlgorithm, me.password, iv);
            let vpnTypeBuf = new Buffer(1);
            data.copy(vpnTypeBuf, 0, ivLength, ivLength + 1);
            let vpnType = decipher.update(vpnTypeBuf)[0];
            let paddingSizeBuf = new Buffer(1);
            data.copy(paddingSizeBuf, 0, ivLength + 2, ivLength + 3);
            let paddingSize = decipher.update(paddingSizeBuf)[0];
            let request = new Buffer(data.length - ivLength - 3 - paddingSize);
            data.copy(request, 0, ivLength + 3 + paddingSize, data.length);
            request = decipher.update(request);
            if (vpnType === constant_1.VPN_TYPE.SOCKS5) {
                return index_1.HandleSocks5(client, request);
            }
            client.dispose();
        }));
        server.listen(this.port);
        server.on('error', (err) => console.error(err.message));
        this._server = server;
    }
    stop() {
        this._server.end();
        this._server.close();
        this._server.destroy();
    }
}
exports.Socks5Server = Socks5Server;