var dbg;

try {
    // Is Debug deactivated
    if(process.env.IOSTREAM_DEBUG == 'false') {
        throw new Error('Use dummy debug function');
    }
    // Debug is active so try importing debug
    dbg = require('debug');
} catch(err) {
    // Either debug was deactivated or we're
    // in production
    dbg = function() {
        return function() {};
    };
}

// Exports
module.exports = dbg;
