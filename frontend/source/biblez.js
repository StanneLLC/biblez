/*### BEGIN LICENSE
# Copyright (C) 2011 Stephan Tetzel <info@zefanjas.de>
# This program is free software: you can redistribute it and/or modify it 
# under the terms of the GNU General Public License version 3, as published 
# by the Free Software Foundation.
# 
# This program is distributed in the hope that it will be useful, but 
# WITHOUT ANY WARRANTY; without even the implied warranties of 
# MERCHANTABILITY, SATISFACTORY QUALITY, or FITNESS FOR A PARTICULAR 
# PURPOSE.  See the GNU General Public License for more details.
# 
# You should have received a copy of the GNU General Public License along 
# with this program.  If not, see <http://www.gnu.org/licenses/>.
### END LICENSE*/

enyo.kind({
    name: "BibleZ.main",
    kind: enyo.VFlexBox,
	components: [
		{kind: "ApplicationEvents", onWindowRotated: "windowRotated"},
		{kind: "ApplicationEvents", onUnload: "savePassage"},
		{kind: "AppMenu", components: [
			{caption: "Module Manager", onclick: "openModuleMgr"},
			{caption: "About", onclick: "openAbout"}
		]},
		{kind: "ModalDialog", name: "errorDialog", caption: "Error", lazy: false, components:[
			{name: "errorMsg", content: "Error", className: "enyo-text-error warning-icon"},
			{kind: "Button", caption: $L("OK"), onclick: "closeError", style: "margin-top:10px"}
		]},
		{name: "notePopup", kind: "BibleZ.AddNote", onAddNote: "addNote"},
		{name: "noteView", kind: "BibleZ.ShowNote", style: "min-width: 100px; max-width: 300px;"},
		{name: "versePopup", kind: "BibleZ.VersePopup", className: "verse-popup", onNote: "openAddNote"},
		{name: "biblezAbout", kind: "BibleZ.About"},
		{name: "mainPane", flex: 1, kind: "Pane", onSelectView: "viewSelected", components: [
			{name: "verseView", kind: "VFlexBox", flex: 1, components: [
				{name: "mainToolbar", kind: "Toolbar", components: [
					{icon: "images/modules.png", onclick: "selectModule"},
					{name: "tbPassage", caption: "Go To", onclick: "showToaster"},
					{icon: "images/history.png", onclick: "openHistoryMenu"},
					{kind: "Spacer"},
					{kind: "Spinner", showing: true}
					//{icon: "images/notes.png", onclick: ""},
					//{icon: "images/bookmarks.png"}
				]},
				{name: "modMenu", kind: "Menu", lazy: false},
				{name: "historyMenu", kind: "Menu", lazy: false},
				{name: "firstStart", flex: 1, className: "first-start scroller-background", components: [
					{allowHtml: true, content: $L("Thank you for installing BibleZ. Currently there are no modules installed. \
								 Please open the Module Manager and add at least one module!  \
								 <br><br>This is a BETA version! Report any bugs to <a href='mailto:info@zefanjas.de?subject=Bug BibleZ HD - Version " + enyo.fetchAppInfo().version + "'>info@zefanjas.de</a>")},
					{kind: "Button", caption: "Open Module Manager", className: "first-start-button", onclick: "openModuleMgr"}
				]},
				{name: "mainView", kind: "BibleZ.Scroller", onSnap: "changeChapter", onVerseTap: "handleVerseTap", onShowNote: "openShowNote"},
				{name: "biblezHint", flex: 1, className: "scroller-background biblez-hint", content: "ERROR"}
			]},
			{name: "selector", kind: "BibleZ.Selector", onChapter: "getVMax", onVerse: "getPassage"},
			{name: "modManView", kind: "BibleZ.ModMan", onUntar: "untarModules", onUnzip: "unzipModule", onBack: "goToMainView"}
		]},
		{kind: "Hybrid", name: "plugin", executable: "pluginSword", width:"0", height:"0", onPluginReady: "handlePluginReady", style: "float: left;"}
	],
	published: {
        dbSets: window['localStorage']
    },
	
	pluginReady: false,

	create: function() {
		this.inherited(arguments);
		
		this.$.firstStart.hide();
		this.$.mainToolbar.hide();
		this.$.biblezHint.hide();
		biblezTools.createDB();
		this.start = 0;
		this.currentModule = undefined;
		
		this.position = 0;
		this.$.plugin.addCallback("returnModules", enyo.bind(this, "handleGetModules"), true);
		this.$.plugin.addCallback("returnVerses", enyo.bind(this, "handleGetVerses"), true);
		this.$.plugin.addCallback("returnBooknames", enyo.bind(this, "handleBooknames"), true);
		this.$.plugin.addCallback("returnVMax", enyo.bind(this, "handleVMax"), true);
		this.$.plugin.addCallback("returnUntar", enyo.bind(this, "handleUntar"), true);
		this.$.plugin.addCallback("returnUnzip", enyo.bind(this, "handleUnzip"), true);
		this.$.plugin.addCallback("returnReadConfs", enyo.bind(this, "handleReadConfs"), true);
		
		//console.log(enyo.fetchDeviceInfo().platformVersion);
	},
	
	rendered: function() {
		this.inherited(arguments);
	},
	
	//POPUP STUFF
	
	handleVerseTap: function(inSender, inEvent) {
		this.$.versePopup.openAt({top: inSender.popupTop, left: inSender.popupLeft}, true);
	},
	
	openAddNote: function () {
		enyo.keyboard.setResizesWindow(false);
		this.$.versePopup.close();
		this.$.notePopup.openAtCenter();
		this.$.notePopup.setFocus();
		this.$.notePopup.clearInput();
	},
	
	addNote: function (inSender, inEvent) {
		biblezTools.addNote(this.$.selector.getBnumber(), this.$.selector.getChapter(), this.$.mainView.tappedVerse, enyo.json.stringify(this.$.notePopup.getNote()), "", "", "", enyo.bind(this, this.getNotes));
		
	},
	
	openShowNote: function (inSender, inEvent) {
		console.log("Show Notes...");
		this.$.noteView.setNote(inSender.notes[inSender.tappedNote].note);
		this.$.noteView.openAt({top: inSender.popupTop, left: inSender.popupLeft}, true);
	},
	
	openAbout: function ()  {
		this.$.biblezAbout.openAtCenter();
	},
	
	showError: function (message) {
		this.$.errorMsg.setContent(message);
		this.$.errorDialog.openAtCenter();
	},
	
	closeError: function (message) {
		this.$.errorDialog.close();
	},
	
	//HYBRID STUFF
	
	handlePluginReady: function(inSender) {
		this.pluginReady = true;
		//this.$.plugin.hide();
		this.getBooknames();
	},
	
	handleGetModules: function(modules) {
		//console.log("INFO: " + modules);
		var mods = enyo.json.parse(modules);

		var comp = this.getComponents()
		for (var j=0;j<comp.length;j++) {
			if (comp[j].name.search(/modulesItem\d+/) != -1) {
				comp[j].destroy();
			}
		}
		
		if (mods.length > 0) {
			this.$.mainToolbar.show();
			this.$.firstStart.hide();
			console.log(this.dbSets["lastRead"]);
			this.currentModule = (this.dbSets["lastRead"])? enyo.json.parse(this.dbSets["lastRead"]).module : mods[0];
			//this.currentModule = mods[0];
			var kindName = "";
			for (var i=0;i<mods.length;i++) {
				kindName = "modulesItem" + i;
				this.$.modMenu.createComponent({name: kindName, kind: "MenuCheckItem", module: mods[i], caption: mods[i].name, onclick: "handleSelectModules", className: "module-item"}, {owner: this});
				if (this.currentModule.name == mods[i].name) {
					this.$[kindName].setChecked(true);
				}
			}
			this.$.modMenu.render();
			//this.$.modMenu.setItems(tmp); //???
			
			if (this.start == 0) {
				if (this.dbSets["lastRead"]) {
					var lastRead = enyo.json.parse(this.dbSets["lastRead"]);
					this.$.selector.setBnumber(lastRead.bnumber);
					this.$.selector.setChapter(lastRead.chapter);
					this.$.selector.setVerse(lastRead.verse);
					this.$.selector.setBook(lastRead.book);
				}
				if (this.$.mainPane.getViewName() == "verseView") {
					this.getVerses(this.$.selector.getBook().name + " " + this.$.selector.getChapter(), this.currentModule.name);
				}
				
			}
			this.start = 1;	
		} else {
			console.log("NO MODULES");
			this.$.mainToolbar.hide();
			this.$.mainView.hide();
			this.$.firstStart.show();
		}
	},
	
	handleSelectModules: function (inSender, inEvent) {
		console.log("MODULE: " + inSender.module.name);
		this.currentModule = inSender.module;
		var comp = this.getComponents()
		for (var j=0;j<comp.length;j++) {
			if (comp[j].name.search(/modulesItem\d+/) != -1) {
				comp[j].setChecked(false);
			}
		}
		inSender.setChecked(true);
		this.getVerses(this.$.selector.getBook().name + " " + this.$.selector.getChapter(), inSender.module.name);
	},
	
	handleGetVerses: function(verses, passage) {
		//this.outputMessage(enyo.json.parse(verses));
		//console.log(verses);
		if (enyo.json.parse(verses).length != 0) {
			this.$.mainView.show();
			this.$.biblezHint.hide();
			this.$.selector.setCurrentPassage(passage);
			this.$.mainView.setVerses(enyo.json.parse(verses), this.$.selector.verse);
			this.$.mainView.setPrevChapter(this.$.selector.getPrevPassage().passage);
			this.$.mainView.setNextChapter(this.$.selector.getNextPassage().passage);
			
			this.setHistory();
			
			//Need to wait for setCurrentPassage???
			this.getNotes();
		} else {
			console.log("Chapter not available!");
			this.$.biblezHint.setContent($L("The chapter is not available in this module! :-("));
			this.$.mainView.hide();
			this.$.biblezHint.show();
		}
		
		//console.log(enyo.json.stringify(this.dbSets["history"]));
		this.$.tbPassage.setCaption(this.currentModule.name + " - " + this.$.selector.getBook().name + " " + this.$.selector.getChapter());
		this.$.spinner.hide();
	},
	
	setHistory: function () {
		var history = [];
		if(this.dbSets["history"]) {
			history = enyo.json.parse(this.dbSets["history"]);
			if (history.length > 10) {
				history.splice(11,history.length-10);
			}
			for (var i=0;i<history.length;i++) {
				if(history[i].passage == this.$.selector.getBook().name + " " + this.$.selector.getChapter()) {
					history.splice(i,1);
				}
			}
		}
		
		history.unshift({"passage": this.$.selector.getBook().name + " " + this.$.selector.getChapter()});
		this.dbSets["history"] = enyo.json.stringify(history);
		
		var comp = this.getComponents()
		for (var j=0;j<comp.length;j++) {
			if (comp[j].name.search(/historyItem\d+/) != -1) {
				comp[j].destroy();
			}
		}
		
		var kindName = "";
		for (var i=0;i<history.length;i++) {
			kindName = "historyItem" + i;
			this.$.historyMenu.createComponent({name: kindName, kind: "MenuItem", passage: history[i], caption: history[i].passage, onclick: "handleSelectHistory", className: "module-item"}, {owner: this});
		}
		this.$.historyMenu.render();
	},
	
	getNotes: function() {
		biblezTools.getNotes(this.$.selector.bnumber, this.$.selector.chapter, enyo.bind(this.$.mainView, this.$.mainView.setNotes));
	},
	
	handleBooknames: function(response) {
		//this.outputMessage(response);
		this.$.selector.createSection("books", enyo.json.parse(response));
		this.$.selector.setBookNames(enyo.json.parse(response));
		this.getModules();
	},
	
	handleVMax: function(response) {
		console.log(response)
		this.$.selector.createSection("verses", parseInt(response, 10));
	},
	
	untarModules: function (inSender, inEvent) {
		this.log("INFO", "Untar Modules...", inSender.allModsPath);
		if (this.pluginReady) {
			try { var status = this.$.plugin.callPluginMethod("untarMods", inSender.allModsPath); }
			catch (e) { this.log("ERROR", "Plugin exception: " + e);}
		}
		else {
			this.log("ERROR", "plugin not ready");
		}
	},
	
	handleUntar: function (response) {
		console.log(response);
		
		if (response == "0") {
			this.log("INFO", "Read available confs...");
			var date = new Date();
			this.dbSets["lastModUpdate"] = enyo.json.stringify({"lastUpdate": date.getTime()});
			if (this.pluginReady) {
				try { var status = this.$.plugin.callPluginMethod("readConfs"); }
				catch (e) { this.log("ERROR", "Plugin exception: " + e);}
			}
			else {
				this.log("ERROR", "plugin not ready");
			}
		} else {
			this.$.modManView.stopSpinner();
			console.log("Couldn't untar mods.d.gz");
			this.showError("Couldn't untar mods.d.tar. You need to remove the /media/internal/.sword/ directory!");
		}
	},
	
	handleReadConfs: function(modules) {
		this.log("INFO", enyo.json.parse(modules).length);
		//this.$.modManView.readData(enyo.json.parse(modules));
		biblezTools.prepareModules(enyo.json.parse(modules), enyo.bind(this.$.modManView, this.$.modManView.getLang));
	},
	
	unzipModule: function(inSender, inEvent) {
		console.log(inSender.modulePath);
		if (this.pluginReady) {
			try { var status = this.$.plugin.callPluginMethod("unzipModule", inSender.modulePath); }
			catch (e) { this.outputMessage("Plugin exception: " + e);}
		}
		else {
			this.outputMessage("plugin not ready");
		}
	},
	
	handleUnzip: function (response) {
		if (response == "true") {
			this.log("INFO", "Unzipped Module!");
			enyo.windows.addBannerMessage($L("Installed Module!"), enyo.json.stringify({}));
			this.getModules();
		}
	},
	
	outputMessage: function(message) {
		console.log("*** " + message);
		this.$.mainView.setPlain(message);
	},
	
	getModules:function(inSender, inEvent) {
		//this.log(inSender, inEvent);
		if (this.pluginReady) {
			try { var status = this.$.plugin.callPluginMethod("getModules", "all"); }
			catch (e) { this.outputMessage("Plugin exception: " + e);}
		}
		else {
			this.outputMessage("plugin not ready");
		}
	},
	
	getPassage: function (inSender, inEvent) {
		this.getVerses(this.$.selector.getBook().name + " " + this.$.selector.getChapter());
	},
	
	getVerses:function(passage, module) {
		if(!module) {module = this.currentModule.name}
		if (this.pluginReady) {
			try {var status = this.$.plugin.callPluginMethod("getVerses", module, passage);}
			catch (e) {this.outputMessage("Plugin exception: " + e);}
		}
		else {
			this.outputMessage("plugin not ready");
		}
	},
	
	getBooknames:function() {
		if (this.pluginReady) {
			try {var status = this.$.plugin.callPluginMethod("getBooknames");}
			catch (e) {this.outputMessage("Plugin exception: " + e);}
		}
		else {
			this.outputMessage("plugin not ready");
		}
	},
	
	getVMax:function() {
		var passage = this.$.selector.getBook().name + " " + this.$.selector.getChapter();
		console.log(passage);
		if (this.pluginReady) {
			try {var status = this.$.plugin.callPluginMethod("getVMax", passage);}
			catch (e) {this.outputMessage("Plugin exception: " + e);}
		}
		else {
			this.outputMessage("plugin not ready");
		}
	},
	
	//OTHER STUFF
	
	handleSelectHistory: function (inSender, inEvent) {
		this.getVerses(inSender.passage.passage);
	},
	
	changeChapter: function (inSender, inEvent) {
		//console.log("CHANGE CHAPTER... " + inSender.index, inSender.numberOfSnappers);
		if (inSender.index == 0) {
			var prev = this.$.selector.getPrevPassage();
			this.getVerses(prev.passage);
			this.$.selector.setBook(prev.prevBook);
			this.$.selector.setChapter(prev.prevChapter);
			this.$.selector.setBnumber(prev.prevBnumber);
			this.$.selector.setVerse(1);
		} else if (inSender.index == inSender.numberOfSnappers + 2) {
			var next = this.$.selector.getNextPassage();
			this.getVerses(next.passage);
			this.$.selector.setBook(next.nextBook);
			this.$.selector.setChapter(next.nextChapter);
			this.$.selector.setBnumber(next.nextBnumber);
			this.$.selector.setVerse(1);
		}
	},
	
	openModuleMgr: function (inSender, inEvent) {
		this.$.mainPane.selectViewByName("modManView");
	},
	
	showToaster: function() {
		this.$.selector.openSelector();
	},
	
	goToMainView: function () {
		this.$.mainPane.selectViewByName("verseView");
	},
	
	viewSelected: function(inSender, inView, inPreviousView) {
		console.log(inView.name);
		if (inView.name == "modManView") {
			this.$.modManView.downloadMods();
			//this.$.modManView.getLang();
		} else if (inView.name == "verseView") {
			this.getVerses(this.$.selector.getBook().name + " " + this.$.selector.getChapter(), this.currentModule.name);
		}
	},
	
	selectModule: function (inSender, inEvent) {
		this.$.modMenu.openAtCenter();
	},
	
	openHistoryMenu: function (inSender, inEvent) {
		this.$.historyMenu.openAtCenter();
	},
	
	windowRotated: function(inSender) {
		//this.render();
	},
	
	openAppMenuHandler: function() {
		this.$.appMenu.open();
	},
	
	closeAppMenuHandler: function() {
		this.$.appMenu.close();
	},
	
	//SAVE CURRENT PASSAGE
	
	savePassage: function () {
		var lastRead = {
			"passage" : this.$.selector.getBook().name + " " + this.$.selector.getChapter(),
			"module" : this.currentModule,
			"bnumber": this.$.selector.bnumber,
			"chapter": this.$.selector.chapter,
			"verse": this.$.selector.verse,
			"book": this.$.selector.book
		};
		//console.log(enyo.json.stringify(lastRead));
		if(this.currentModule) {
			this.dbSets["lastRead"] = enyo.json.stringify(lastRead);
		}
	}
});

//Turn Logging off
//console.log = function(){}