#!/usr/bin/env nodejs

var mr = require('./mediaremote');

mr.findTVs(function(tv) {
	// console.log("Got TV:", tv.info);
	tv.register(function(err, result) {
		if (!err) {
			// console.log("Successfully registered.");
			tv.getStatus(function(err, statuses) {
				if (err) {
					console.log("error\tstatus-failed");
				} else {
					for (var s=0; s<statuses.length; s++) {
						var output = [
							tv.info["device"],
							(new Date()).toISOString(),
							statuses[s]["title"],
							statuses[s]["source"],
							statuses[s]["provider"]
						];
						console.log(output.join("\t"));
					}
				}
			});
		} else {
			console.log("error\tregistration-failed");
		}
	});
}, function(tvs) {
	// console.log("TVs found:", tvs.length);
});
