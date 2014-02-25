function process_slides(root, preamble) {
    var fs = require('fs');
    var yaml = require('js-yaml');
    var jade = require('jade');
    var slides = root["slides"]
    var nslides = [];
     for(var section in slides) {
	 var smeta = {};
	 var pages = [];
	 var nsection = [];
	 if (slides[section] instanceof Array) {
	     pages = slides[section];
	 } else {
	     smeta = slides[section] || {}
	     pages = slides[section]['pages']
	 }
	 for(var page in pages) {
	     var id = null;
	     var metadata = {};
	     var text = null;
	     var docs = fs.readFileSync(page, "utf-8").split("\n---\n");
	     if (docs.length==0) {
		 text = "";
	     } else if (docs.length==1) {
		 text = docs[0];
	     } else if (docs.length==2) {
		 metadata = yaml.safeLoad(docs[0], {"filename": page});
		 text = docs[1];
	     } else {
		 throw page+" contained "+docs.length+" documents, no more than 2 expected";
	     }

	     if (page.endsWith(".jade")) {
		 console.log("template is: "+preamble+text);
		 var template = jade.compile(preamble+"\n"+text, {
		     filename: page,
		     pretty: true
		 });
		 var id = page.slice(0,-5);
		 text = template({"metadata": metadata});
		 console.log("result is: "+text);
	     } else {
		 console.log("Unable to process page "+page);
	     }
	     nsection.push({"id": id, "html": text, "metadata": metadata});
	}
	nslides.push({"id": section, "pages": nsection, "metadata": smeta});
    }
    var nroot = {};
    for(var k in root) {
	nroot[k] = root[k];
    }
    nroot["slides"] = nslides
    return nroot;
}
