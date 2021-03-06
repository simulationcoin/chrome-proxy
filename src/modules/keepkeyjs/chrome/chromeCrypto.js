var ByteBuffer = require('bytebuffer');

module.exports = {
    getLocalEntropy: function (length) {
        var randArr = new Uint8Array(length);
        window.crypto.getRandomValues(randArr);
        return ByteBuffer.wrap(randArr);
    },
    digest: function(method, payload) {
        return window.crypto.subtle.digest(method, payload);
    }
};