#!/usr/bin/env node

var fs = require('fs');
var jade = require('jade');
var hb = require('handlebars');
var yaml = require('js-yaml');
var cadeau = require('..');
var path = require('path');

if (process.argv.length!=4) {
    throw "Usage: "+process.argv[1]+" slides.yaml output.html";
}

var src = process.argv[2];
var dst = process.argv[3];

var raw = fs.readFileSync(src, "utf8");
var data = yaml.load(raw, { filename: src });

var preamble = "";
var context = cadeau.processSlides(data, preamble);

try {
    fs.mkdirSync(dst)
} catch(e) {}
cadeau.generate(context, dst);
cadeau.copyResources(data, dst);
