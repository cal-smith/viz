document.addEventListener("DOMContentLoaded", function(event) {
	var subs = ["askreddit", "askscience", "atheism", "games", "gaming", "iama", "mildlyinteresting", "music", "pics", "science", "technology", "tifu", "worldnews"];
	avg = [];
	subs.map(function(x){
		d3.json("january/comments_"+ x +".json", function(e, json){
			console.log(x, json.length);
			var total_words = 0;
			var total_score = 0;
			for (var i = 0; i < json.length; i++) {
				var temp = [];
				var words = json[i].body.split(/\s|\r\n|\r|\n/);
				words = format(words)
				json[i].body = words;
				total_words += json[i].body.length;
				total_score += json[i].score;
			}
			console.log("average words per comment:", total_words/json.length);
			console.log("average score per comment:", total_score/json.length);
			avg.push({avg:total_words/json.length, sub:x});
		});
	});
	function format(words){
		var temp = [];
		words = words.map(function(word){//peliminary data normilization. A lot of pointless stuff gets reduced to "" or " ", which is kinda nice.
			var a = word.toLowerCase()
			.replace(/[h|f]t+ps?/g, "")//removes http/https/ftp
			.replace(/www\.?|\.com/g, "")
			.replace(/\/?(r|u|message)\/\w+/g,"")
			.replace(/\d+|\\|\/|\&((gt|lt|amp)\;)+/g, " ")//replaces digits and slashes with spaces, also &gt|lt|amp;
			.replace(/[^A-Za-z|\'|\"]/g, " ")
			.replace(/\'|\"/g,"")
			.trim().split(" ");
			if (a.length > 0) temp = temp.concat(a.slice(1,a.length));
			return a[0];
		});
		words = words.concat(temp);
		words = words = words.filter(function(x){//filter out spaces
			if (x !== "" || x !== " ") { return x; }
		});
		return words;
	}
});