'use strict';

var path = require('path');
var hb = require('handlebars');
var fs = require('fs-extra');
var html = require('html');
var resources = path.join(path.dirname(module.filename), "flowtime");

function generate(context, metadata, dst) {
    /* Copy resources */
    var cssdir = path.join(resources, "css");
    if (fs.existsSync(cssdir)) fs.copySync(cssdir, path.join(dst, "css"));
    else { console.log("Couldn't find CSS files for engine "+eng.name+" at "+cssdir); }

    var jsdir = path.join(resources, "js");
    if (fs.existsSync(jsdir)) fs.copySync(jsdir, path.join(dst, "js"));
    else { console.log("Couldn't find JS files for engine "+eng.name+" at "+jsdir); }

    var fontsdir = path.join(resources, "fonts");
    if (fs.existsSync(fontsdir)) fs.copySync(fontsdir, path.join(dst, "fonts"));
    else { console.log("Couldn't find font files for engine "+eng.name+" at "+fontsdir); }

    /* Generate index.html */
    var ft = hb.compile(fs.readFileSync(path.join(resources, "flowtime.html"), "utf8"));

    var result = ft(context);

    var pretty = html.prettyPrint(result, { indent_size: 2 });
    fs.writeFileSync(path.join(dst, "index.html"), pretty);
}

module.exports.resources = resources;
module.exports.generate = generate;
module.exports.name = "Flowtime Engine";
