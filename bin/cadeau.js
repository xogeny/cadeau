#!/usr/bin/env node

/* Load dependencies */
var fs = require('fs-extra');
var yaml = require('js-yaml');
var cadeau = require('..');
var path = require('path');

/* Check the arguments.
   TODO: Add argparse support at some point. */
if (process.argv.length!=4) {
    throw "Usage: "+process.argv[1]+" slides.yaml output.html";
}

/* Pull out arguments */
var src = process.argv[2];
var dst = process.argv[3];

/* Read the presentation file */
var raw = fs.readFileSync(src, "utf8");
/* Transform it into a data structure. */
var data = yaml.load(raw, { filename: src });

var context = cadeau.processSlides(data);

/* Make the directory, if we didn't already. */
fs.mkdirsSync(dst);
/* Run the code generator for the backend engine */
cadeau.generate(context, dst);
/* Copy presentation specific resources.

   Note, this is deliberatly done second to allow the presentation
   to insert its own resources to overwrite those added by
   the backend engine.
 */
cadeau.copyResources(data, dst);
