The following is the result of packet sniffing the communications between an Android device running the Media Remote app and the TV itself. I used the following ngrep command on the Android device:

	./ngrep -q -d wlan0 -W byline host IP-OF-TV

You can get a version of ngrep compiled for Android here: <http://unbeagleyyo.wordpress.com/2011/04/12/ngrep-for-android/>

Requests to the TV
------------------

My TV was at 192.168.1.100. My Android device identifies itself as "SoftwinerEvb" and the TV is a Sony Bravia.

Requests from the Media Remote app also featured the following additional headers on each request:

	User-Agent: Dalvik/1.6.0 (Linux; U; Android 4.0.4; SoftwinerEvb Build/IMM76D)
	Host: 192.168.1.100
	Connection: Keep-Alive
	Accept-Encoding: gzip

You can identify yourself as the device that has been registered with the following headers on each request:

	X-CERS-DEVICE-ID: MediaRemote:XX-XX-XX-XX-XX-XX
	X-CERS-DEVICE-INFO: Android4.0.4/MediaRemoteForAndroid3.4.3/SoftwinerEvb

I think only the first header is neccessary. Note the XXs are actually replaced by the device's Mac address, but this doesn't seem to be essential. Seems like it could be any unique identifier.

Discovering the TV
------------------

Send a UDP packet to 239.255.255.250 on port 1900:

	M-SEARCH * HTTP/1.1
	HOST: 239.255.255.250:1900
	ST: urn:schemas-sony-com:service:IRCC:1
	MAN: "ssdp:discover"
	MX:1
	

You'll get a response like this from TVs:

	HTTP/1.1 200 OK
	CACHE-CONTROL: max-age=1800
	EXT: 
	LOCATION: http://192.168.1.100:52323/dmr.xml
	SERVER: Linux/2.6 UPnP/1.0 KDL-40CX520/1.7
	ST: urn:schemas-sony-com:service:IRCC:1
	USN: uuid:00000000-0000-XXXX-XXXX-XXXXXXXXXXXX::urn:schemas-sony-com:service:IRCC:1
	X-AV-Physical-Unit-Info: pa="BRAVIA KDL-40CX520";
	X-AV-Server-Info: av=5.0; cn="Sony Corporation"; mn="BRAVIA KDL-40CX520"; mv="1.7";

General Pre-Authentication Info request
---------------------------------------

	GET /cers/api/getSystemInformation
	X-CERS-DEVICE-ID: MediaRemote:XX-XX-XX-XX-XX-XX
	X-CERS-DEVICE-INFO: Android4.0.4/MediaRemoteForAndroid3.4.3/SoftwinerEvb

Response

	<?xml version="1.0"?>
	<systemInformation>
	    <name>BRAVIA</name>
	    <generation>1.0</generation>
	    <area>AUS</area>
	    <actionHeader name="CERS-DEVICE-ID" />
	    <supportSource>
		<source>Net</source>
	    </supportSource>
	    <supportContentsClass>
		<class>video</class>
		<class>music</class>
		<class>photo</class>
	    </supportContentsClass>
	</systemInformation>


Pre-Authentication Action List
------------------------------

	GET /cers/ActionList.xml

Response

	<?xml version="1.0"?>
	<actionList>
	    <action name="register" mode="2" url="http://192.168.1.100:80/cers/api/register" />
	    <action name="getText" url="http://192.168.1.100:80/cers/api/getText" />
	    <action name="sendText" url="http://192.168.1.100:80/cers/api/sendText" />
	    <action name="getSystemInformation" url="http://192.168.1.100:80/cers/api/getSystemInformation" />
	    <action name="getRemoteCommandList" url="http://192.168.1.100:80/cers/api/getRemoteCommandList" />
	    <action name="getStatus" url="http://192.168.1.100:80/cers/api/getStatus" />
	    <action name="BgmSearch::search" url="http://192.168.1.100:80/BgmSearch/search" />
	</actionList>

Get information
---------------

	GET /s2mtv/SSDgetDeviceInfo/

Response

	<?xml version="1.0" encoding="utf-8" ?>
	<response>
	    <header version="01">
		<command>SSDgetDeviceInfo</command>
		<code>0</code>
	    </header>
	    <sony>
		<product id="DTV">
		    <referrer_id>30F9ED826C53</referrer_id>
		    <features>
			<direct_url>true</direct_url>
		    </features>
		    <cers>
			<x_unr_version>1.2</x_unr_version>
			<x_cers_actionlist_url>http://192.168.1.100:80/cers/ActionList.xml</x_cers_actionlist_url>
		    </cers>
		    <ircc>
			<x_ircc_version>1.0</x_ircc_version>
			<scpd_url>http://192.168.1.100:80/IRCC/IRCCSCPD.xml</scpd_url>
			<control_url>http://192.168.1.100:80/IRCC</control_url>
			<event_sub_url></event_sub_url>
		    </ircc>
		    <iptv_params>
			<build>PKG4.021GAA</build>
			<language>en</language>
			<rating>21</rating>
			<age_rating>21</age_rating>
			<mpaa_rating>X</mpaa_rating>
			<rating_country>EUR</rating_country>
			<block_unrated>f</block_unrated>
			<ui_type>0</ui_type>
			<drm_types>MARLINBB,SSL,WMDRM10</drm_types>
			<config_types>CAD,FLX</config_types>
			<audio_types>AAC,AAC-LC,AC3,HE-AAv1,HE-AAv2,MP3,WMA</audio_types>
			<stream_types>HTTP,HTTPLS,HTTPS</stream_types>
			<video_types>AVC,MPEG2,WMV9</video_types>
			<container_types>3GPP,ASF,MOV,MP3,MP4,MPEG2TS</container_types>
			<display_types>2D</display_types>
			<metafile_types>M3U8</metafile_types>
			<display_width>960</display_width>
			<display_height>540</display_height>
		    </iptv_params>
		</product>
	    </sony>
	</response>


Register a device
-----------------

	GET /cers/api/register?name=SoftwinerEvb&registrationType=initial&deviceId=MediaRemote%3AXX-XX-XX-XX-XX-XX
	X-CERS-DEVICE-ID: MediaRemote:XX-XX-XX-XX-XX-XX.
	X-CERS-DEVICE-INFO: Android4.0.4/MediaRemoteForAndroid3.4.3/SoftwinerEvb.

Response

	No apparent response but the TV shows a popup asking the user to click to authenticate.

# The following require you to 'register' with the TV as above. #

Command list
------------


	GET /cers/api/getRemoteCommandList
	X-CERS-DEVICE-ID: MediaRemote:XX-XX-XX-XX-XX-XX.
	X-CERS-DEVICE-INFO: Android4.0.4/MediaRemoteForAndroid3.4.3/SoftwinerEvb.


Response

	<?xml version="1.0"?>
	<remoteCommandList>
	    <command name="Confirm" type="ircc" value="AAAAAQAAAAEAAABlAw==" />
	    <command name="Up" type="ircc" value="AAAAAQAAAAEAAAB0Aw==" />
	    <command name="Down" type="ircc" value="AAAAAQAAAAEAAAB1Aw==" />
	    <command name="Right" type="ircc" value="AAAAAQAAAAEAAAAzAw==" />
	    <command name="Left" type="ircc" value="AAAAAQAAAAEAAAA0Aw==" />
	    <command name="Home" type="ircc" value="AAAAAQAAAAEAAABgAw==" />
	    <command name="Options" type="ircc" value="AAAAAgAAAJcAAAA2Aw==" />
	    <command name="Return" type="ircc" value="AAAAAgAAAJcAAAAjAw==" />
	    <command name="Num1" type="ircc" value="AAAAAQAAAAEAAAAAAw==" />
	    <command name="Num2" type="ircc" value="AAAAAQAAAAEAAAABAw==" />
	    <command name="Num3" type="ircc" value="AAAAAQAAAAEAAAACAw==" />
	    <command name="Num4" type="ircc" value="AAAAAQAAAAEAAAADAw==" />
	    <command name="Num5" type="ircc" value="AAAAAQAAAAEAAAAEAw==" />
	    <command name="Num6" type="ircc" value="AAAAAQAAAAEAAAAFAw==" />
	    <command name="Num7" type="ircc" value="AAAAAQAAAAEAAAAGAw==" />
	    <command name="Num8" type="ircc" value="AAAAAQAAAAEAAAAHAw==" />
	    <command name="Num9" type="ircc" value="AAAAAQAAAAEAAAAIAw==" />
	    <command name="Num0" type="ircc" value="AAAAAQAAAAEAAAAJAw==" />
	    <command name="Num11" type="ircc" value="AAAAAQAAAAEAAAAKAw==" />
	    <command name="Num12" type="ircc" value="AAAAAQAAAAEAAAALAw==" />
	    <command name="Power" type="ircc" value="AAAAAQAAAAEAAAAVAw==" />
	    <command name="Display" type="ircc" value="AAAAAQAAAAEAAAA6Aw==" />
	    <command name="VolumeUp" type="ircc" value="AAAAAQAAAAEAAAASAw==" />
	    <command name="VolumeDown" type="ircc" value="AAAAAQAAAAEAAAATAw==" />
	    <command name="Mute" type="ircc" value="AAAAAQAAAAEAAAAUAw==" />
	    <command name="Audio" type="ircc" value="AAAAAQAAAAEAAAAXAw==" />
	    <command name="SubTitle" type="ircc" value="AAAAAgAAAJcAAAAoAw==" />
	    <command name="Yellow" type="ircc" value="AAAAAgAAAJcAAAAnAw==" />
	    <command name="Blue" type="ircc" value="AAAAAgAAAJcAAAAkAw==" />
	    <command name="Red" type="ircc" value="AAAAAgAAAJcAAAAlAw==" />
	    <command name="Green" type="ircc" value="AAAAAgAAAJcAAAAmAw==" />
	    <command name="Play" type="ircc" value="AAAAAgAAAJcAAAAaAw==" />
	    <command name="Stop" type="ircc" value="AAAAAgAAAJcAAAAYAw==" />
	    <command name="Pause" type="ircc" value="AAAAAgAAAJcAAAAZAw==" />
	    <command name="Rewind" type="ircc" value="AAAAAgAAAJcAAAAbAw==" />
	    <command name="Forward" type="ircc" value="AAAAAgAAAJcAAAAcAw==" />
	    <command name="Prev" type="ircc" value="AAAAAgAAAJcAAAA8Aw==" />
	    <command name="Next" type="ircc" value="AAAAAgAAAJcAAAA9Aw==" />
	    <command name="Replay" type="ircc" value="AAAAAgAAAJcAAAB5Aw==" />
	    <command name="Advance" type="ircc" value="AAAAAgAAAJcAAAB4Aw==" />
	    <command name="TopMenu" type="ircc" value="AAAAAgAAABoAAABgAw==" />
	    <command name="PopUpMenu" type="ircc" value="AAAAAgAAABoAAABhAw==" />
	    <command name="Eject" type="ircc" value="AAAAAgAAAJcAAABIAw==" />
	    <command name="Rec" type="ircc" value="AAAAAgAAAJcAAAAgAw==" />
	    <command name="SyncMenu" type="ircc" value="AAAAAgAAABoAAABYAw==" />
	    <command name="ClosedCaption" type="ircc" value="AAAAAgAAAKQAAAAQAw==" />
	    <command name="Teletext" type="ircc" value="AAAAAQAAAAEAAAA/Aw==" />
	    <command name="ChannelUp" type="ircc" value="AAAAAQAAAAEAAAAQAw==" />
	    <command name="ChannelDown" type="ircc" value="AAAAAQAAAAEAAAARAw==" />
	    <command name="Input" type="ircc" value="AAAAAQAAAAEAAAAlAw==" />
	    <command name="GGuide" type="ircc" value="AAAAAQAAAAEAAAAOAw==" />
	    <command name="EPG" type="ircc" value="AAAAAgAAAKQAAABbAw==" />
	    <command name="DOT" type="ircc" value="AAAAAgAAAJcAAAAdAw==" />
	    <command name="Analog" type="ircc" value="AAAAAgAAAHcAAAANAw==" />
	    <command name="Exit" type="ircc" value="AAAAAQAAAAEAAABjAw==" />
	    <command name="Digital" type="ircc" value="AAAAAgAAAJcAAAAyAw==" />
	    <command name="BS" type="ircc" value="AAAAAgAAAJcAAAAsAw==" />
	    <command name="CS" type="ircc" value="AAAAAgAAAJcAAAArAw==" />
	    <command name="BSCS" type="ircc" value="AAAAAgAAAJcAAAAQAw==" />
	    <command name="Ddata" type="ircc" value="AAAAAgAAAJcAAAAVAw==" />
	    <command name="InternetWidgets" type="ircc" value="AAAAAgAAABoAAAB6Aw==" />
	    <command name="InternetVideo" type="ircc" value="AAAAAgAAABoAAAB5Aw==" />
	    <command name="SceneSelect" type="ircc" value="AAAAAgAAABoAAAB4Aw==" />
	    <command name="Mode3D" type="ircc" value="AAAAAgAAAHcAAABNAw==" />
	    <command name="iManual" type="ircc" value="AAAAAgAAABoAAAB7Aw==" />
	    <command name="Wide" type="ircc" value="AAAAAgAAAKQAAAA9Aw==" />
	    <command name="Jump" type="ircc" value="AAAAAQAAAAEAAAA7Aw==" />
	    <command name="PAP" type="ircc" value="AAAAAgAAAKQAAAB3Aw==" />
	    <command name="MyEPG" type="ircc" value="AAAAAgAAAHcAAABrAw==" />
	    <command name="ProgramDescription" type="ircc" value="AAAAAgAAAJcAAAAWAw==" />
	    <command name="WriteChapter" type="ircc" value="AAAAAgAAAHcAAABsAw==" />
	    <command name="TrackID" type="ircc" value="AAAAAgAAABoAAAB+Aw==" />
	    <command name="TenKey" type="ircc" value="AAAAAgAAAJcAAAAMAw==" />
	    <command name="AppliCast" type="ircc" value="AAAAAgAAABoAAABvAw==" />
	    <command name="acTVila" type="ircc" value="AAAAAgAAABoAAAByAw==" />
	    <command name="DeleteVideo" type="ircc" value="AAAAAgAAAHcAAAAfAw==" />
	    <command name="EasyStartUp" type="ircc" value="AAAAAgAAAHcAAABqAw==" />
	    <command name="OneTouchTimeRec" type="ircc" value="AAAAAgAAABoAAABkAw==" />
	    <command name="OneTouchView" type="ircc" value="AAAAAgAAABoAAABlAw==" />
	    <command name="OneTouchRec" type="ircc" value="AAAAAgAAABoAAABiAw==" />
	    <command name="OneTouchRecStop" type="ircc" value="AAAAAgAAABoAAABjAw==" />
	    <command name="MuteOn" type="url" value="http://192.168.1.100:80/cers/command/MuteOn" />
	    <command name="MuteOff" type="url" value="http://192.168.1.100:80/cers/command/MuteOff" />
	</remoteCommandList>

Status updates (poll)
---------------------

	GET /cers/api/getStatus
	X-CERS-DEVICE-ID: MediaRemote:XX-XX-XX-XX-XX-XX.
	X-CERS-DEVICE-INFO: Android4.0.4/MediaRemoteForAndroid3.4.3/SoftwinerEvb.

Response

	<?xml version="1.0"?>
	<statusList>
	    <status name="viewing">
		<statusItem field="source" value="Net" />
		<statusItem field="title" value="Shameless Series 4 Episode 3" />
		<statusItem field="serviceId" value="2099" />
		<statusItem field="assetId" value="29988" />
		<statusItem field="provider" value="ABC_iView" />
	    </status>
	</statusList>


Pressing a virtual button
-------------------------

	POST /IRCC
	content-type: text/xml; charset=utf-8.
	soapaction: "urn:schemas-sony-com:service:IRCC:1#X_SendIRCC".
	Content-Length: 317.
	
	<?xml version="1.0"?>
	<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">
	  <s:Body>
	    <u:X_SendIRCC xmlns:u="urn:schemas-sony-com:service:IRCC:1">
	      <IRCCCode>AAAAAQAAAAEAAAB0Aw==</IRCCCode>
	    </u:X_SendIRCC>
	  </s:Body>
	</s:Envelope>

Response

	<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/encoding/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance/" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
	    <s:Body>
		<u:X_SendIRCCResponse xmlns:u="urn:schemas-sony-com:service:IRCC:1">
		</u:X_SendIRCCResponse>
	    </s:Body>
	</s:Envelope>


UPNP discovery packet
---------------------

This packet seems to be periodically broadcast by the TV on UDP port 1900.

	NOTIFY * HTTP/1.1.
	HOST: 239.255.255.250:1900.
	CACHE-CONTROL: max-age=1800.
	LOCATION: http://192.168.1.100:52323/dmr.xml.
	NT: urn:schemas-sony-com:service:IRCC:1.
	NTS: ssdp:alive.
	SERVER: Linux/2.6 UPnP/1.0 KDL-40CX520/1.7.
	USN: uuid:00000000-0000-XXXX-XXXX-XXXXXXXXXXXX::urn:schemas-sony-com:service:IRCC:1.
	X-AV-Physical-Unit-Info: pa="BRAVIA KDL-40CX520";.
	X-AV-Server-Info: av=5.0; cn="Sony Corporation"; mn="BRAVIA KDL-40CX520"; mv="1.7";.

Accessing the URL in the LOCATION key:

	GET /dmr.xml

Response

	<?xml version="1.0"?>
	<root xmlns="urn:schemas-upnp-org:device-1-0"
	      xmlns:pnpx="http://schemas.microsoft.com/windows/pnpx/2005/11"
	      xmlns:df="http://schemas.microsoft.com/windows/2008/09/devicefoundation">
	  <specVersion>
	    <major>1</major>
	    <minor>0</minor>
	  </specVersion>
	  <device>
	    <deviceType>urn:schemas-upnp-org:device:MediaRenderer:1</deviceType>
	    <friendlyName>BRAVIA KDL-40CX520</friendlyName>
	    <manufacturer>Sony Corporation</manufacturer>
	    <manufacturerURL>http://www.sony.net/</manufacturerURL>
	    <modelName>KDL-40CX520</modelName>
	    <UDN>uuid:00000000-0000-XXXX-XXXX-XXXXXXXXXXXX</UDN>
	    <dlna:X_DLNADOC xmlns:dlna="urn:schemas-dlna-org:device-1-0">DMR-1.50</dlna:X_DLNADOC>
	    <iconList>
	      <icon>
		<mimetype>image/png</mimetype>
		<width>32</width>
		<height>32</height>
		<depth>24</depth>
		<url>/MediaRenderer_32x32.png</url>
	      </icon>
	      <icon>
		<mimetype>image/png</mimetype>
		<width>48</width>
		<height>48</height>
		<depth>24</depth>
		<url>/MediaRenderer_48x48.png</url>
	      </icon>
	      <icon>
		<mimetype>image/png</mimetype>
		<width>60</width>
		<height>60</height>
		<depth>24</depth>
		<url>/MediaRenderer_60x60.png</url>
	      </icon>
	      <icon>
		<mimetype>image/png</mimetype>
		<width>120</width>
		<height>120</height>
		<depth>24</depth>
		<url>/MediaRenderer_120x120.png</url>
	      </icon>
	      <icon>
		<mimetype>image/jpeg</mimetype>
		<width>32</width>
		<height>32</height>
		<depth>24</depth>
		<url>/MediaRenderer_32x32.jpg</url>
	      </icon>
	      <icon>
		<mimetype>image/jpeg</mimetype>
		<width>48</width>
		<height>48</height>
		<depth>24</depth>
		<url>/MediaRenderer_48x48.jpg</url>
	      </icon>
	      <icon>
		<mimetype>image/jpeg</mimetype>
		<width>60</width>
		<height>60</height>
		<depth>24</depth>
		<url>/MediaRenderer_60x60.jpg</url>
	      </icon>
	      <icon>
		<mimetype>image/jpeg</mimetype>
		<width>120</width>
		<height>120</height>
		<depth>24</depth>
		<url>/MediaRenderer_120x120.jpg</url>
	      </icon>
	    </iconList>
	    <serviceList>
	      <service>
		<serviceType>urn:schemas-upnp-org:service:RenderingControl:1</serviceType>
		<serviceId>urn:upnp-org:serviceId:RenderingControl</serviceId>
		<SCPDURL>/RenderingControlSCPD.xml</SCPDURL>
		<controlURL>/upnp/control/RenderingControl</controlURL>
		<eventSubURL>/upnp/event/RenderingControl</eventSubURL>
	      </service>
	      <service>
		<serviceType>urn:schemas-upnp-org:service:ConnectionManager:1</serviceType>
		<serviceId>urn:upnp-org:serviceId:ConnectionManager</serviceId>
		<SCPDURL>/ConnectionManagerSCPD.xml</SCPDURL>
		<controlURL>/upnp/control/ConnectionManager</controlURL>
		<eventSubURL>/upnp/event/ConnectionManager</eventSubURL>
	      </service>
	      <service>
		<serviceType>urn:schemas-upnp-org:service:AVTransport:1</serviceType>
		<serviceId>urn:upnp-org:serviceId:AVTransport</serviceId>
		<SCPDURL>/AVTransportSCPD.xml</SCPDURL>
		<controlURL>/upnp/control/AVTransport</controlURL>
		<eventSubURL>/upnp/event/AVTransport</eventSubURL>
	      </service>
	      <service>
		<serviceType>urn:schemas-sony-com:service:IRCC:1</serviceType>
		<serviceId>urn:schemas-sony-com:serviceId:IRCC</serviceId>
		<SCPDURL>http://192.168.1.100:80/IRCC/IRCCSCPD.xml</SCPDURL>
		<controlURL>http://192.168.1.100:80/IRCC</controlURL>
		<eventSubURL></eventSubURL>
	      </service>
	    </serviceList>
	    <av:X_MaxBGMCount xmlns:av="urn:schemas-sony-com:av">64</av:X_MaxBGMCount>
	    <av:X_StandardDMR xmlns:av="urn:schemas-sony-com:av">1.1</av:X_StandardDMR>
	    <av:X_IRCCCodeList xmlns:av="urn:schemas-sony-com:av">
	      <av:X_IRCCCode command="Power">AAAAAQAAAAEAAAAVAw==</av:X_IRCCCode>
	      <av:X_IRCCCode command="Power ON">AAAAAQAAAAEAAAAuAw==</av:X_IRCCCode>
	      <av:X_IRCCCode command="Power OFF">AAAAAQAAAAEAAAAvAw==</av:X_IRCCCode>
	    </av:X_IRCCCodeList>
	    <pnpx:X_compatibleId>MS_DigitalMediaDeviceClass_DMR_V001</pnpx:X_compatibleId>
	    <pnpx:X_deviceCategory>MediaDevices</pnpx:X_deviceCategory>
	    <pnpx:X_hardwareId>VEN_0033&amp;DEV_0006&amp;REV_01</pnpx:X_hardwareId>
	    <df:X_deviceCategory>Display.TV Multimedia.DMR</df:X_deviceCategory>
	    <av:X_IRCC_DeviceInfo xmlns:av="urn:schemas-sony-com:av">
	      <av:X_IRCC_Version>1.0</av:X_IRCC_Version>
	      <av:X_IRCC_CategoryList>
		<av:X_IRCC_Category>
		  <av:X_CategoryInfo>AAEAAAAB</av:X_CategoryInfo>
		</av:X_IRCC_Category>
		<av:X_IRCC_Category>
		  <av:X_CategoryInfo>AAIAAACX</av:X_CategoryInfo>
		</av:X_IRCC_Category>
		<av:X_IRCC_Category>
		  <av:X_CategoryInfo>AAIAAAAa</av:X_CategoryInfo>
		</av:X_IRCC_Category>
		<av:X_IRCC_Category>
		  <av:X_CategoryInfo>AAIAAACk</av:X_CategoryInfo>
		</av:X_IRCC_Category>
	      </av:X_IRCC_CategoryList>
	    </av:X_IRCC_DeviceInfo>
	    <av:X_UNR_DeviceInfo xmlns:av="urn:schemas-sony-com:av">
	      <av:X_UNR_Version>1.2</av:X_UNR_Version>
	      <av:X_CERS_ActionList_URL>http://192.168.1.100:80/cers/ActionList.xml</av:X_CERS_ActionList_URL>
	    </av:X_UNR_DeviceInfo>
	    <av:X_S2MTV_DeviceInfo xmlns:av="urn:schemas-sony-com:av">
	      <av:X_S2MTV_Version>1.0</av:X_S2MTV_Version>
	      <av:X_S2MTV_BaseURL>http://192.168.1.100:80/s2mtv</av:X_S2MTV_BaseURL>
	    </av:X_S2MTV_DeviceInfo>
	  </device>
	</root>

