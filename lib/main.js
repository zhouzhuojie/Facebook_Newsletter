/* 	Name: main.js
	Project: Facebook NewsLetter

	Developers: Andrew Skinner, Zhou Zhuojie

	Purpose: To Stream the newsfeed and alert the user of updates

	Description: To use the Firefox SDK to interface with Facebook inorder to 
					determine when updates to the newsfeed occures.



	Running: The user must have Firefox 4.0 or newer and a Facebook acocunt.
				To run not a developer you will also need Firefox Jetpack SDK.
		Running as an xpi or addon.
			open up Firefox.
			drag the xpi into the window and follow 
					install procedures for an extensions
		Running as an developing addon
			See the SDK documentation at https://jetpack.mozillalabs.com/sdk/1.0b3/docs/dev-guide/addon-development/about.html

		once running left click on the Facebook icon in the lower right corner. 
			There you will find a Facebook webpage loaded. Log in.
			when the panel is close you will be altered to any updates. When open
			no alerts will be displayed but, the updates can be seen every 10 seconds

	Resources:
		Firefox 4.0: http://www.mozilla.com/en-US/firefox/RC/
		Firefox JetPack SDK: https://jetpack.mozillalabs.com/
		Firefox JetPack SDK Documentation: https://jetpack.mozillalabs.com/sdk/1.0b3/docs/dev-guide/addon-development/about.html
*/		
var resources = require("self").data	//required to use some resources like the icon picture
var widgets = require("widget");	//required to use widget
var panels = require("panel");		//required to display in widget
var timer = require("timer");  		//required to use the time delays
var pageMod = require("page-mod");	//required to update the page and get feeds
var notifications = require("notifications");  //required to alert the user


var last_updated = new Array();     last_updated[0] = -1;	//holds the last update from the newsfeed
var current_updated = new Array();	//holds the current newsfeed

var index = 0;						//use to move through  the current_update
var timeID = 0;						//use to identify the timeInterval for periodically refresh	
var isPanelShow = true;				//show that my panel is open
// the icon to use in the script
var icon = resources.url("facebook-icon.jpg"); 
// the Facebook webpage
var facebook = "http://m.facebook.com";



// the script that is attached to fetch the data
// from the webpage
// retures data from the webpage by posting a message
var fetchScript = 
//fetches the newsfeed
"var newsfeed_elements = document.getElementsByClassName('async_like abb acw apl');"+
// loop through newsfeed
"for (var i = 0; i < newsfeed_elements.length; i++) {"+
	//if newsfeed has a "strong" tags
	"if(newsfeed_elements[i].innerHTML.indexOf('strong') != -1) { "+
		//returns the current newsfeed element
		"postMessage(newsfeed_elements[i].id + ' - ' + " +
		"newsfeed_elements[i].getElementsByTagName('strong')[0].textContent +" +
		" ' - ' + " + 
		"newsfeed_elements[i].getElementsByTagName('span')[0].textContent);"+
	"} else {"+
	//newsfeed does not have "strong" elements
		//returns the current newsfeed element
		"postMessage(newsfeed_elements[i].id + ' - ' + " + 
		"newsfeed_elements[i].getElementsByClassName('participant')[0].textContent" +
		"  + ' - ' + " + 
		"newsfeed_elements[i].getElementsByTagName('span')[0].textContent);"+ 
	"}" +  
"};" + 
"postMessage('done');"; //use to alter script that it is done


/*
  pageMod allows the addon to attach new scripts to a webpage
  we attach the fetchScript and reloadScript.
  The fetch Script returns a message for each newsfeed element
*/
pageMod.PageMod({
	include: [facebook + "/home.php*"],
	contentScript: fetchScript,
	contentScriptWhen: 'ready',
	onAttach: function onAttach(worker) {
		worker.on('message', function(data) 
		{
			//if we are not done proccessing
			if(data != 'done')
			{
				current_updated[index] = data;
				index++;
			}
			else
			{
				//holds the test update value
				var updated = 0;
				// loop through the current updates
				for(var i = 0; i < current_updated.length; i++)
				{	
					// if we had a previous updates 
					// and last and current don't match
					if(last_updated[0] != -1 //if it is the first time opening the add-on, do not update 
					   && last_updated[0] != current_updated[0]) //if there is no new feed, do not update
					{ 
						updated = 1;
					}
					last_updated[i] = current_updated[i];
				}
				index = 0;
			
				// if there is an update and the panel is 
				// not showing
				if(updated && !isPanelShow)
				{
					//splits the update for display
					var most_recent = last_updated[0].split(" - ");
				
					//allows to send a notification to
					// the user
					notifications.notify({
						title: 	"Facebook NewsLetter",
						text: 	"Friend/Group/App: " + most_recent[1] +
								"\nFeed: " + most_recent[2],
						iconURL: icon,
					 });
				}
			}// end of else
    	}); //end of worker
	}// end of onAttach
}); //end of pageMod


//script that is attached to reload the webpage
var panelReloadScript =
	"onMessage = function onMessage(message){"+
	"	if (message == 'Please Reload'){"+
	"		window.location.reload();}"+
	"	else if (message == 'Homepage'){"+
	"		window.location.assign('http://m.facebook.com');}}";


/*
	Widgets allows the addon to attach a script or webpage which can be activated
	by clicking on the icon. This case we are loading the webpage.
*/
widgets.Widget({
	label: "Facebook NewsLetter",
	contentURL: icon,
	/* 
		Panels allow to display a webpage inside
		a small panel. 
	*/
	panel: panels.Panel({
		width: 360,
		height: 600,
		contentURL: facebook,
		contentScript: panelReloadScript,
		onShow: function()
		{
			isPanelShow = true;
			//Stop periodically refreshing the page
			timer.clearInterval(timeID);
		},
		onHide: function()
		{
			var me = this;
			isPanelShow = false;
			//Make sure it is refreshing the homepage of facebook. 
			this.postMessage("Homepage");
			//Start periodically refreshing the page
			timeID = timer.setInterval(function() {me.postMessage("Please Reload")},1000);
		}
	}),
});



