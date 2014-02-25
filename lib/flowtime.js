'use strict';

var path = require('path');
var hb = require('handlebars');
var fs = require('fs');
var resources = path.join(path.dirname(module.filename), "flowtime");

function generate(context, metadata, dst) {
    var ft = hb.compile(fs.readFileSync(path.join(resources, "flowtime.html"), "utf8"));

    var result = ft(context);

    fs.writeFileSync(path.join(dst, "index.html"), result);
}

module.exports.resources = resources;
module.exports.generate = generate;
