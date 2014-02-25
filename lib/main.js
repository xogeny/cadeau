function process_slides(root, preamble) {
    var slides = root["slides"]
    var nslides = [];
     for(var section in slides) {
	 var smeta = {};
	 var pages = [];
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
	     var docs = null;
	     if (docs.length==0) {
	     }
	}
    }
}
