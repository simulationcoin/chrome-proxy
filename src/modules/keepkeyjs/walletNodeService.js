var _ = require('lodash');
var dbPromise = require('./dbPromise.js');
var EventEmitter2 = require('eventemitter2').EventEmitter2;
var bitcore = require('bitcore');

const NODES_STORE_NAME = 'nodes';

var eventEmitter = new EventEmitter2();

var walletNodes = {
    nodes: [],
    addListener: eventEmitter.addListener.bind(eventEmitter)
};

walletNodes.registerPublicKey = function registerPublicKey(publicKeyObject) {
    var oldNodes = JSON.parse(JSON.stringify(walletNodes.nodes));

    var matches = _.filter(walletNodes.nodes, function (it) {
        var childNum = it.nodePath[it.nodePath.length - 1];
        var level = it.nodePath.length;
        return childNum === publicKeyObject.node.child_num &&
            level === publicKeyObject.node.depth;
    });

    if (matches.length !== 1) {
        console.error('error while matching public key to a node');
        return;
    }

    var match = matches[0];

    match.xpub = publicKeyObject.xpub;
    match.chainCode = publicKeyObject.node.chain_code.toHex();
    match.fingerprint = publicKeyObject.node.fingerprint;
    match.publicKey = publicKeyObject.node.public_key.toHex();

    populateAddresses('[0-1]/[0-19]', match);

    dbPromise.then(function (db) {
        var store = db
            .transaction(NODES_STORE_NAME, 'readwrite')
            .objectStore(NODES_STORE_NAME);

        store.put(match);
    });

    eventEmitter.emit('changed', walletNodes.nodes, oldNodes);
};


function populateAddresses(range, node) {
    if (!node.addresses) {
        node.addresses = [];
    }
    scanNodes(bitcore.HDPublicKey(node.xpub), node.addresses, parseRange(range));
}


function scanNodes(publicKey, addresses, ranges) {
    for (var i = ranges[0].start; i <= ranges[0].end; i++) {
        var derivedKey = publicKey.derive(i);
        if (ranges.length > 1) {
            addresses[i] = scanNodes(derivedKey, addresses[i] || [], ranges.slice(1));
        }
        else {
            addresses[i] = {
                xpub: derivedKey.publicKey.toString(),
                address: derivedKey.publicKey.toAddress().toString()
            };
        }
    }
    return addresses;
}


function parseRange(range) {
    var levels = range.split('/');
    var parsed = [];

    for (var i = 0; i < levels.length; i++) {
        var level = levels[i];
        var tokens = level.match(/\[([0-9]+)-([0-9]+)\]/);
        if (tokens) {
            parsed.push({
                start: parseInt(tokens[1]),
                end: parseInt(tokens[2])
            });
        } else {
            throw 'unable to parse range: ' + level;
        }
    }
    return parsed;
}

dbPromise
    .then(function (db) {
        return new Promise(function (resolve) {
            var store = db
                .transaction(NODES_STORE_NAME, 'readonly')
                .objectStore(NODES_STORE_NAME);

            var oldNodes = JSON.parse(JSON.stringify(walletNodes.nodes));

            store.openCursor().onsuccess = function (event) {
                var cursor = event.target.result;
                if (cursor) {
                    walletNodes.nodes.push(cursor.value);
                    cursor.continue();
                }
                else {
                    eventEmitter.emit('changed', walletNodes.nodes, oldNodes);
                    resolve(walletNodes.nodes);
                }
            };
        });
    });

module.exports = walletNodes;