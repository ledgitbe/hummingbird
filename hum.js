const log = require("debug")("hummingbird:hum");

import Hummingbird from "./index"
import { connect, isdupeerror } from "./helpers"

const config = {
    rpc: { host: "127.0.0.1", user: "root", pass: "bitcoin" },
    peer: { host: "127.0.0.1" },
    from: 609844
};


const h = new Hummingbird(config);

h.ontransaction = async function(tx) {
    if (tx.blk) {
        log(`ontransaction processing block tx ${tx.tx.h}`);
        try {
            if (!await h.db.collection("c").insertOne(tx)) {
                log(`error inserting tx ${tx.tx.h}`);
                return false;
            }
        } catch (e) {
            if (!isdupeerror(e, ["tx.h"]) && !isdupeerror(e, ["_id"])) {
                throw e;
            }
        }
    } else {
        log(`ontransaction processing mempool tx ${tx.tx.h}`);
        try {
            if (!await h.db.collection("u").insertOne(tx)) {
                log(`error inserting tx ${tx.tx.h}`);
                return false;
            }
        } catch (e) {
            if (!isdupeerror(e, ["tx.h"]) && !isdupeerror(e, ["_id"])) {
                throw e;
            }
        }
    }

    return true;
}

h.ready = async function() {
    h.db = await connect("hummingbird");
}

h.onrealtime = async function(block) {
    log(`realtime`);
    log(`refreshing mempool`);
    await h.db.collection("u").deleteMany({});
    await h.fetchmempool();
}

h.start();

