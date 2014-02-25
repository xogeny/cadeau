#!/usr/bin/env node

var fs = require('fs');
var jade = require('jade');
var yaml = require('js-yaml');
var cadeau = require('..');

console.log("process.argv = "+process.argv);

if (process.argv.length!=4) {
    throw "Usage: "+process.argv[1]+" slides.yaml output.html";
}

var src = process.argv[2];
var dst = process.argv[3];

console.log("Loading yaml from: "+src);

var raw = fs.readFileSync(src, "utf8");
var data = yaml.load(raw, { filename: src });

var preamble = "";
var context = cadeau.process_slides(data, preamble);

var ft = jade.compile(fs.readFileSync("flowtime.jade"), {
    filename: "flowtime.jade",
    pretty: true
});

var result = ft(context);

fs.writeFileSync(dst, result);
