/**
	Android Media Remote app reverse engineered into a node.js module. Running this directly will result in it asking your TV to register as a device and then outputting the status of the TV (e.g. what show is currently playing etc.).
**/

var dgram = require('dgram');
var request = require('request');
var xml2js = require('xml2js');

var identifier = {
	"name": "node-library",
	"deviceId": "node-library"
};

/**
	@class Encapsulating a TV that has been found.
**/

function TV(tv_info) {
	this.info = tv_info;
	
	/**
		Asks the TV to prompt the user to register this script as a remote control device.
		@param callback will receive err if there is an error or nothing if not.
	*/
	this.register = function(callback) {
		// name=XXXXX - visible name
		// registrationType=initial
		// deviceId=XXXXX - needs to go out in the header
		request.get(tv_info["actions"]["register"] + "?name=" + identifier["name"] + "&registrationType=initial&deviceId=" + identifier["deviceId"], function(error, response, body) {
			if (!error && response.statusCode == 200) {
				var parser = new xml2js.Parser();
				parser.parseString(body, function(err, result){
					if (err) {
						callback(err);
					} else {
						callback(null, result);
					}
				});
			} else {
				console.log(error, response.statusCode);
			}
		});
	};
	
	/**
		Asks the TV for it's current status (should be registered first).
		@param callback will receive (err, stat) where err is null if there was no error and status is an associative array.
	*/
	this.getStatus = function(callback) {
		request.get({
			"uri": tv_info["actions"]["getStatus"],
			"headers": {
				"X-CERS-DEVICE-ID": identifier["deviceId"],
				"X-CERS-DEVICE-INFO": "mediaremote.js"
			}
		}, function (error, response, body) {
			if (!error && response.statusCode == 200) {
				var parser = new xml2js.Parser();
				parser.parseString(body, function(err, result){
					if (err) {
						callback(err);
					} else {
						var statuses = [];
						for (var s=0; s<result.statusList["status"].length; s++) {
							var status_item = {};
							for (var si=0; si<result.statusList["status"][s]["statusItem"].length; si++) {
								status_item[result.statusList["status"][s]["statusItem"][si]["$"]["field"]] = result.statusList["status"][s]["statusItem"][si]["$"]["value"];
							}
							statuses.push(status_item);
						}
						callback(null, statuses);
					}
				});
			} else {
				callback(error);
			}
		});
	};
	
	// TODO: sending remote control commands
	this.sendCommand = function(callback) {
		// request.post('http://service.com/upload', {form:{key:'value'}});
		callback();
	};
}

// original code from here: https://gist.github.com/chrishulbert/895382
// heavily modified

/** Use UPNP discovery to find a Media Remote compatible TV on the network.
	@param tv_callback is called with an associative array of TV information each time a TV is found.
	@param timeout_callback is called once the timeout elapses (default 3 seconds) and passes an array of TV info associative arrays
	@param timeout is the length of time in milliseconds to wait for TVs to respond.
**/
function findTVs(tv_callback, timeout_callback, timeout) {
	// how long to wait for a TV to respond
	var timeout = timeout | 3000;
	
	// UPNP UDP discovery packet
	var message = new Buffer(
		"M-SEARCH * HTTP/1.1\r\n" +
		"HOST: 239.255.255.250:1900\r\n" + // UPNP broadcast address
		"ST: urn:schemas-sony-com:service:IRCC:1\r\n" + // we're searching for Media Remote compatible TVs
		'MAN: "ssdp:discover"\r\n' +
		"MX:1\r\n" + // please respond within 1 second
		"\r\n"
	);
	
	var client = dgram.createSocket("udp4");
	// Get a port so we can listen before sending
	client.bind(function() {
		var TVs = [];
		var found = {};
		
		// give it a while for responses to come in
		var waiting_for_tv = setTimeout(function(){
			server.close();
			timeout_callback(TVs);
		}, timeout);
		
		// a socket we'll use to listen out for the UPNP response from any TV
		var server = dgram.createSocket("udp4");
		server.on("message", function (msg, rinfo) {
			if (!found[rinfo.address + ":" + rinfo.port]) {
				// store this TV's unique IP and port as already found
				found[rinfo.address + ":" + rinfo.port] = true;
				// struct of info about the TV we will send back
				var tv_info = {
					"address": rinfo.address,
					"port": rinfo.port,
					"headers": {}
				};
				// now parse the headers we were sent for useful info
				var lines = msg.toString().split("\r\n");
				for (var l=0; l<lines.length; l++) {
					var key_val = lines[l].split(/\: +/);
					tv_info["headers"][key_val[0]] = key_val[1];
				}
				// fetch the dmr.xml
				request(tv_info["headers"]["LOCATION"], function (error, response, body) {
					if (!error && response.statusCode == 200) {
						var parser = new xml2js.Parser();
						parser.parseString(body, function(err, result){
							tv_info["dmr_xml"] = result;
							// get the useful information from the dmr.xml including the action list
							tv_info["device"] = result.root.device[0].friendlyName[0];
							tv_info["uuid"] = result.root.device[0].UDN[0];
							tv_info["actionlist_url"] = result.root.device[0]["av:X_UNR_DeviceInfo"][0]["av:X_CERS_ActionList_URL"][0];
							// now fetch the actions from the action list URL
							request(tv_info["actionlist_url"], function(error, response, body) {
								if (!error && response.statusCode == 200) {
									var parser = new xml2js.Parser();
									parser.parseString(body, function(err, result) {
										tv_info["actionlist_xml"] = result;
										tv_info["actions"] = {};
										for (var a=0; a<result.actionList.action.length; a++) {
											var action = result.actionList.action[a];
											tv_info["actions"][action["$"]["name"]] = action["$"]["url"];
										}
										var new_tv = new TV(tv_info);
										TVs.push(new_tv);
										tv_callback(new_tv);
									});
								}
							});
						});
					}
				});
			}
		});
		server.bind(client.address().port); // Bind to the random port we were given when sending the message, not 1900
		
		// TV wants this three times
		client.send(message, 0, message.length, 1900, "239.255.255.250", function() { client.close(); });
	});
}

/**
	Change the way this script identifies itself to TVs.
	@param name is what is displayed on the screen when requesting access from the user.
	@param deviceId is the ID that the TV uses to identify us by the header.
*/
function setIdentifier(name, deviceId) {
	identifier["name"] = name;
	identifier["deviceId"] = deviceId;
}

// what we'll export as a module
module.exports = {
	"findTVs": findTVs,
	"setIdentifier": setIdentifier
}

// do something interesting if we're run
if (require.main === module) {
	findTVs(function(tv) {
		console.log("Got TV:", tv.info);
		tv.register(function(err, result) {
			if (!err) {
				console.log("Successfully registered.");
				tv.getStatus(function(err, statuses) {
					if (err) {
						console.log("Could not get status.");
					} else {
						console.log(statuses);
					}
				});
			} else {
				console.log("Registration failed.");
			}
		});
	}, function(tvs) {
		console.log("TVs found:", tvs.length);
	});
}
