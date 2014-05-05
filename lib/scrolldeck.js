'use strict';

/* Bring in dependencies */
var path = require('path');
var fs = require('fs-extra');
var cheerio = require('cheerio');
var resources = path.join(path.dirname(module.filename), "scrolldeck");
var main = require('./main');
var swig = require('swig');

swig.setDefaults({ cache: false });

function copyResources(root, dst) {
    main.copyEngineResources(root, "css", dst);
    main.copyEngineResources(root, "js", dst);
    main.copyEngineResources(root, "img", dst);
}

function compileTemplates(context, metadata) {
    /* Generate index.html */
    var ff = path.join(resources, "scrolldeck.html");
    var ft = swig.compile(fs.readFileSync(ff, "utf8"), {filename: ff});

    /* Generate outline.html */
    var of = path.join(resources, "outline.html");
    var ot = swig.compile(fs.readFileSync(of, "utf8"), {filename: of});

    /* Run the results through the handlebars template (this is one case where we
       definitely want to use handlebars. */
    var tcon = {
	"slides": context['slides'],
	"metadata": metadata
    };
    var result = ft(tcon);
    var outline = ot(tcon);
 
    return {
	result: result,
	outline: outline
    };
}

function customizeMarkup(result, metadata) {
    var $ = cheerio.load(result);

    if (metadata.animation) {
	// Handle .c-step, .c-dim and .c-shy
    }
    return $.html();
}

/* This is the code that actually generates the presentation. */
function generate(context, metadata, dst) {
    /* Copy resources needed by flowtime. */
    copyResources(context, dst);

    var compiled = compileTemplates(context, metadata);

    var complete = customizeMarkup(compiled.result, metadata);

    fs.writeFileSync(path.join(dst, "index.html"), complete);
    if (metadata.draft) {
	fs.writeFileSync(path.join(dst, "outline.html"), compiled.outline);
    }
}

/* Export these functions for use in main.js.  These essentially form
   the engine API. */
module.exports.resources = resources;
module.exports.generate = generate;
module.exports.name = "Scrolldeck Engine";
