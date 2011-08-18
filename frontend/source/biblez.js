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
		{kind: "PalmService", service: "palm://com.palm.applicationManager/", method: "open"},
		{kind: "AppMenu", components: [
			{caption: $L("Module Manager"), onclick: "openModuleMgr"},
			{caption: $L("Preferences"), onclick: "openPrefs"},
			{caption: $L("Help"), onclick: "openHelp"},
			{caption: $L("About"), onclick: "openAbout"}
		]},
		{kind: "ModalDialog", name: "errorDialog", caption: "Error", lazy: false, components:[
			{name: "errorMsg", content: "Error", className: "enyo-text-error warning-icon"},
			{kind: "Button", caption: $L("OK"), onclick: "closeError", style: "margin-top:10px"}
		]},
		{name: "notePopup", kind: "BibleZ.AddNote", onAddNote: "addNote"},
		{name: "noteView", kind: "BibleZ.ShowNote", style: "min-width: 100px; max-width: 300px;"},
		{name: "versePopup", kind: "BibleZ.VersePopup", className: "verse-popup", onBeforeOpen: "hideColors", onNote: "handleNote", onBookmark: "handleBookmark", onHighlight: "handleHighlight"},
		{name: "fontMenu", kind: "BibleZ.FontMenu", onFontSize: "changeFontSize", onFont: "changeFont"},
		{name: "biblezAbout", kind: "BibleZ.About"},
		{name: "mainPane", flex: 1, kind: "Pane", transitionKind: "enyo.transitions.Simple", onSelectView: "viewSelected", components: [
			{name: "verseView", kind: "VFlexBox", flex: 1, components: [
				{name: "mainToolbar", kind: "Toolbar", components: [
					{icon: "images/modules.png", onclick: "selectModule"},
					{name: "tbPassage", caption: "Go To", onclick: "showToaster"},
					{icon: "images/history.png", onclick: "openHistoryMenu"},
					{kind: "Spacer"},
                    {kind: "Spinner", showing: true},
                    {kind: "Spacer"},
					{icon: "images/font.png", onclick: "openFontMenu"},
					{name: "btNote", icon: "images/sidebar.png", toggling: true,  onclick: "openSidebar"}
                    //{icon: "images/bookmarks.png"}
				]},
				{name: "modMenu", kind: "Menu", lazy: false},
				{name: "historyMenu", kind: "Menu", lazy: false},
				//{name: "mainView", kind: "BibleZ.Scroller", onSnap: "changeChapter", onVerseTap: "handleVerseTap", onShowNote: "openShowNote"},
				{name: "mainViewContainer", kind: "HFlexBox", flex: 1, components: [
					{name: "mainView", kind: "BibleZ.Scroller", onSnap: "changeChapter", onVerseTap: "handleVerseTap", onShowNote: "openShowNote"},
					{name: "biblezHint", flex: 1, className: "scroller-background biblez-hint", content: ""},
					{name: "firstStart", flex: 1, className: "first-start scroller-background", components: [
						{allowHtml: true, content: $L("Thank you for installing BibleZ HD. Currently there are no modules installed. Please open the Module Manager and add at least one module!")},
						{kind: "Button", caption: $L("Open Module Manager"), className: "first-start-button", onclick: "openModuleMgr"}
					]},
					{name: "sidebarContainer", className: "main-sidebar",components: [
						{name: "noteBmSidebar", kind: "BibleZ.Sidebar", onVerse: "handleSidebarVerse", onSearch: "handleSearch"}		
					]}
				]}
			]},
			{name: "selector", kind: "BibleZ.Selector", onChapter: "getVMax", onVerse: "getPassage"},
			{name: "modManView", kind: "BibleZ.ModMan", onUntar: "untarModules", onUnzip: "unzipModule", onGetDetails: "getDetails", onRemove: "removeModule", onBack: "goToMainView"},
			{name: "prefs", kind: "BibleZ.Prefs", onBack: "goToMainView", onBgChange: "changeBackground"}
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
		this.$.sidebarContainer.hide();
		biblezTools.createDB();
		this.start = 0;
		this.currentModule = undefined;
		this.currentFontSize = 20;
		this.currentFont = "Prelude";
		
		this.position = 0;
		this.$.plugin.addCallback("returnModules", enyo.bind(this, "handleGetModules"), true);
		this.$.plugin.addCallback("returnVerses", enyo.bind(this, "handleGetVerses"), true);
		this.$.plugin.addCallback("returnBooknames", enyo.bind(this, "handleBooknames"), true);
		this.$.plugin.addCallback("returnVMax", enyo.bind(this, "handleVMax"), true);
		this.$.plugin.addCallback("returnUntar", enyo.bind(this, "handleUntar"), true);
		this.$.plugin.addCallback("returnUnzip", enyo.bind(this, "handleUnzip"), true);
		this.$.plugin.addCallback("returnRemove", enyo.bind(this, "handleRemove"), true);
		this.$.plugin.addCallback("returnReadConfs", enyo.bind(this, "handleReadConfs"), true);
		this.$.plugin.addCallback("returnGetDetails", enyo.bind(this, "handleGetDetails"), true);
        this.$.plugin.addCallback("returnSearch", enyo.bind(this, "handleSearchResults"), true);
        this.$.plugin.addCallback("returnSearchProcess", enyo.bind(this, "handleSearchProcess"), true);
		
        enyo.keyboard.setResizesWindow(false);
		//enyo.log(enyo.fetchDeviceInfo().platformVersion);
		//enyo.log(enyo.json.stringify(new enyo.g11n.currentLocale().getLocale()));
	},
	
	//SIDEBAR STUFF
	openSidebar: function () {
		if (this.$.btNote.depressed == true) {
			this.$.sidebarContainer.show();
			//this.$.btNote.setState("down", true);
			this.$.mainView.setSidebarWidth(320);
		} else {
			//this.$.btNote.setState("down", false);
			this.$.sidebarContainer.hide();
			this.$.mainView.setSidebarWidth(0);
		}
		this.$.mainView.setSnappers();
		this.$.mainView.setPrevChapter(this.$.selector.getPrevPassage().passage);
		this.$.mainView.setNextChapter(this.$.selector.getNextPassage().passage);
		this.$.mainView.snapTo(this.$.mainView.index);
	},
	
	handleSidebarVerse: function (inSender, inEvent) {
		//enyo.log(this.$.noteBmSidebar.getPassage());
		this.$.selector.setVerse(this.$.noteBmSidebar.getVerse());
		this.getVerses(this.$.noteBmSidebar.getPassage());
	},
	
	//POPUP STUFF
	
	handleVerseTap: function(inSender, inEvent) {
		this.$.versePopup.openAt({top: inSender.popupTop, left: inSender.popupLeft}, true);
		if (enyo.byId("bmIcon"+this.$.mainView.tappedVerse).innerHTML !== "") {
			this.$.versePopup.setBmCaption($L("Bookmark") + " - ");
		} else {
			this.$.versePopup.setBmCaption($L("Bookmark") + " + ");
		}
		if (enyo.byId("noteIcon"+this.$.mainView.tappedVerse).innerHTML !== "") {
			this.$.versePopup.setNoteCaption($L("Note") + " - ");
		} else {
			this.$.versePopup.setNoteCaption($L("Note") + " + ");
		}
	},
	
	handleNote: function () {
		if (enyo.byId("noteIcon"+this.$.mainView.tappedVerse).innerHTML !== "") {
			biblezTools.removeNote(this.$.selector.getBnumber(), this.$.selector.getChapter(), this.$.mainView.tappedVerse, enyo.bind(this, this.getNotes));
			enyo.byId("noteIcon"+this.$.mainView.tappedVerse).innerHTML = "";
			this.$.versePopup.close();
		} else {
			this.openAddNote();
		}
	},
	
	openAddNote: function () {
        //enyo.keyboard.setResizesWindow(false);
		this.$.versePopup.close();
		this.$.notePopup.clearInput();
        this.$.notePopup.openAtCenter();
		
        //this.$.notePopup.setFocus();
		
	},
	
	addNote: function (inSender, inEvent) {
		if (inSender.edit == false) {
			biblezTools.addNote(this.$.selector.getBnumber(), this.$.selector.getChapter(), this.$.mainView.tappedVerse, enyo.json.stringify(this.$.notePopup.getNote()), "", "", "", enyo.bind(this, this.getNotes));
		} else {
			biblezTools.updateNote(this.$.selector.getBnumber(), this.$.selector.getChapter(), this.$.mainView.tappedVerse, enyo.json.stringify(this.$.notePopup.getNote()), "", "", "", enyo.bind(this, this.getNotes));
		}		
	},
	
	getNotes: function() {
		biblezTools.getNotes(this.$.selector.bnumber, this.$.selector.chapter, enyo.bind(this.$.mainView, this.$.mainView.setNotes));
        biblezTools.getNotes(-1,-1,enyo.bind(this.$.noteBmSidebar, this.$.noteBmSidebar.handleNotes));
	},
	
	openShowNote: function (inSender, inEvent) {
		//enyo.log("Show Notes...");
		//this.$.noteView.setNote(inSender.notes[inSender.tappedNote].note);
		enyo.keyboard.setResizesWindow(false);
		this.$.notePopup.setCaption("");
		this.$.notePopup.setNote(inSender.notes[inSender.tappedNote].note);
		this.$.notePopup.setEditMode();
		this.$.notePopup.setDismissWithClick(true);
        this.$.notePopup.hideCancel();
		this.$.notePopup.openAt({top: inSender.popupTop, left: inSender.popupLeft}, true);
	},
	
	handleBookmark: function (inSender, inEvent) {
		this.$.versePopup.close();
		if (enyo.byId("bmIcon"+this.$.mainView.tappedVerse).innerHTML !== "") {
			biblezTools.removeBookmark(this.$.selector.getBnumber(), this.$.selector.getChapter(), this.$.mainView.tappedVerse, enyo.bind(this, this.getBookmarks));
			enyo.byId("bmIcon"+this.$.mainView.tappedVerse).innerHTML = "";
		} else {
			biblezTools.addBookmark(this.$.selector.getBnumber(), this.$.selector.getChapter(), this.$.mainView.tappedVerse, "", "", "", enyo.bind(this, this.getBookmarks));
		}		
	},
	
	getBookmarks: function() {
		biblezTools.getBookmarks(this.$.selector.bnumber, this.$.selector.chapter, enyo.bind(this.$.mainView, this.$.mainView.setBookmarks));
        biblezTools.getBookmarks(-1,-1,enyo.bind(this.$.noteBmSidebar, this.$.noteBmSidebar.handleBookmarks));
	},
	
	handleHighlight: function (inSender, inEvent) {
		//enyo.log("BG:",enyo.byId("verse"+this.$.mainView.tappedVerse).style.backgroundColor);
		if (enyo.byId("verse"+this.$.mainView.tappedVerse).style.backgroundColor.search("rgba") == -1) {
			biblezTools.addHighlight(this.$.selector.getBnumber(), this.$.selector.getChapter(), this.$.mainView.tappedVerse,inSender.getColor(), "",enyo.bind(this, this.getHighlights));
		} else {
			biblezTools.updateHighlight(this.$.selector.getBnumber(), this.$.selector.getChapter(), this.$.mainView.tappedVerse,inSender.getColor(), "",enyo.bind(this, this.getHighlights));
		}
		enyo.byId("verse"+this.$.mainView.tappedVerse).style.backgroundColor = inSender.getColor();
		
	},
	
	getHighlights: function() {
		biblezTools.getHighlights(this.$.selector.bnumber, this.$.selector.chapter, enyo.bind(this.$.mainView, this.$.mainView.setHighlights));
        biblezTools.getHighlights(-1,-1,enyo.bind(this.$.noteBmSidebar, this.$.noteBmSidebar.handleHighlights));
	},
	
	hideColors: function (inSender, inEvent) {
		this.$.versePopup.hideColors();
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
	
	selectModule: function (inSender, inEvent) {
		this.$.modMenu.openAtEvent(inEvent);
	},
	
	openHistoryMenu: function (inSender, inEvent) {
		this.$.historyMenu.openAtEvent(inEvent);
	},
	
	openFontMenu: function (inSender, inEvent) {
		this.$.fontMenu.openAtEvent(inEvent);
		this.$.fontMenu.setFontSize(this.currentFontSize);
		this.$.fontMenu.setFont(this.currentFont);
	},
	
	changeFontSize: function (inSender, inEvent) {
		if (inSender) {this.currentFontSize = inSender.getFontSize()};
		this.$.mainView.setFontSize(this.currentFontSize);
	},
	
	changeFont: function (inSender, inEvent) {
		if (inSender) {this.currentFont = inSender.getFont()};
		this.$.mainView.setFont(this.currentFont);
	},
	
	//PREFERENCES
	
	changeBackground: function () {
		switch (this.$.prefs.getBackground()) {
			case "palm":
				this.$.mainView.setClassName("");
			break;
			case "biblez":
				this.$.mainView.setClassName("scroller-background");
			break;
			case "grayscale":
				this.$.mainView.setClassName("scroller-grayscale");
			break;
			case "night":
				this.$.mainView.setClassName("scroller-night");
			break;
		
		}
	},
	
	//HYBRID STUFF
	
	handlePluginReady: function(inSender) {
		this.pluginReady = true;
		//this.$.plugin.hide();
		this.getModules();
	},
	
	handleGetModules: function(modules) {
		//enyo.log("INFO: " + modules);
		var mods = enyo.json.parse(modules);
		this.$.modManView.setInstalledModules(enyo.json.parse(modules));

		var comp = this.getComponents()
		for (var j=0;j<comp.length;j++) {
			if (comp[j].name.search(/modulesItem\d+/) != -1) {
				comp[j].destroy();
			}
		}
		
		if (mods.length > 0) {
			this.$.firstStart.hide();
			this.$.mainToolbar.show();
			
			//Check if saved Module currently exists
			var ifModule = 0;
			if (this.dbSets["lastRead"]) {
				for (var k=0;k<mods.length;k++) {
					if (enyo.json.parse(this.dbSets["lastRead"]).module.name == mods[k].name) {
						ifModule = 1;
					}
				}
			}				
			this.currentModule = (this.dbSets["lastRead"] && ifModule == 1)? enyo.json.parse(this.dbSets["lastRead"]).module : mods[0];
			
			//Get current Booknames
			this.getBooknames(this.currentModule.name);
			
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
					this.currentFontSize = lastRead.fontSize;
					this.currentFont = lastRead.font;
					this.changeFontSize();
					this.changeFont();
					this.$.prefs.setBgItem(lastRead.background);
					this.changeBackground();
				}				
			}
			this.start = 1;	
		} else {
			enyo.log("NO MODULES");
			this.$.mainToolbar.hide();
			this.$.mainView.hide();
			this.$.firstStart.show();
		}
	},
	
	handleSelectModules: function (inSender, inEvent) {
		enyo.log("MODULE: " + inSender.module.name);
		this.currentModule = inSender.module;
		var comp = this.getComponents()
		for (var j=0;j<comp.length;j++) {
			if (comp[j].name.search(/modulesItem\d+/) != -1) {
				comp[j].setChecked(false);
			}
		}
		inSender.setChecked(true);
        //this.getBooknames(this.currentModule.name);
		this.getVerses(this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter(), inSender.module.name);
	},
	
	handleBooknames: function(response) {
		//enyo.log(response);
		this.$.selector.createSection("books", enyo.json.parse(response));
		this.$.selector.setBookNames(enyo.json.parse(response));
		this.$.noteBmSidebar.setBookNames(enyo.json.parse(response));
		if (this.$.mainPane.getViewName() == "verseView") {
		    this.getVerses(this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter(), this.currentModule.name);
		}
		
	},
	
	handleGetVerses: function(verses, passage) {
		//this.showError(enyo.json.parse(verses));
		//enyo.log(verses);
		this.$.selector.setCurrentPassage(passage);
		
		if (enyo.json.parse(verses).length != 0) {
			this.$.mainView.show();
			this.$.biblezHint.hide();
			this.$.mainView.setVerses(enyo.json.parse(verses), this.$.selector.verse);
			this.$.mainView.setPrevChapter(this.$.selector.getPrevPassage().passage);
			this.$.mainView.setNextChapter(this.$.selector.getNextPassage().passage);
			
			//Need to wait for setCurrentPassage???
			this.getNotes();
			this.getBookmarks();
			this.getHighlights();
		} else {
			enyo.log("Chapter not available!");
			this.$.firstStart.hide();
			this.$.biblezHint.setContent($L("The chapter is not available in this module! :-("));
			this.$.mainView.hide();
			this.$.biblezHint.show();
		}
		
		//enyo.log(enyo.json.stringify(this.dbSets["history"]));
		this.setHistory();
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
				if(history[i].passage == this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter()) {
					history.splice(i,1);
				}
			}
		}
		
		history.unshift({"passage": this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter()});
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
	
	handleVMax: function(response) {
		enyo.log(response)
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
		enyo.log(response);		
		if (response == "0") {
			this.log("INFO", "Read available confs...");
			if (this.pluginReady) {
				try { var status = this.$.plugin.callPluginMethod("readConfs"); }
				catch (e) { this.log("ERROR", "Plugin exception: " + e);}
			}
			else {
				this.log("ERROR", "plugin not ready");
			}
		} else {
			this.$.modManView.stopSpinner();
			enyo.log("Couldn't untar mods.d.gz");
			this.showError("Couldn't untar mods.d.tar. You need to remove the /media/internal/.sword/ directory!");
		}
	},
	
	handleReadConfs: function(modules) {
		this.log("INFO", modules.length);
		biblezTools.prepareModules(enyo.json.parse(modules), enyo.bind(this.$.modManView, this.$.modManView.getLang));
	},
	
	unzipModule: function(inSender, inEvent) {
		enyo.log(inSender.modulePath);
		if (this.pluginReady) {
			try { var status = this.$.plugin.callPluginMethod("unzipModule", inSender.modulePath); }
			catch (e) { this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},
	
	handleUnzip: function (response) {
		if (response == "true") {
			this.log("INFO", "Unzipped Module!");
			enyo.windows.addBannerMessage($L("Installed Module!"), enyo.json.stringify({}));
			this.getModules();
		}
	},
	
	removeModule: function (inSender, inEvent) {
		enyo.log(inSender.moduleToRemove.dataPath + "," + inSender.moduleToRemove.name.toLowerCase());
		if (this.pluginReady) {
			try { var status = this.$.plugin.callPluginMethod("removeModule", inSender.moduleToRemove.dataPath, inSender.moduleToRemove.name.toLowerCase()); }
			catch (e) { this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},
	
	handleRemove: function (response) {
		enyo.log("REMOVE: " + response);
		enyo.windows.addBannerMessage($L("Uninstalled Module!"), enyo.json.stringify({}));
		this.getModules();
	},
	
	getDetails: function (inSender, inEvent) {
		if (this.pluginReady) {
			try { var status = this.$.plugin.callPluginMethod("getModuleDetails", inSender.currentModule); }
			catch (e) { this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},
	
	handleGetDetails: function (details) {
		//enyo.log("DETAILS", details);
		this.$.modManView.showDetails(enyo.json.parse(details));
	},
    
    handleSearch: function (inSender, inValue) {
        if (this.pluginReady) {
            enyo.log(inSender.getSearchType());
			try { var status = this.$.plugin.callPluginMethod("search", this.currentModule.name, inSender.getSearchTerm(), inSender.getScope(), inSender.getSearchType()); }
			catch (e) { this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
    },
    
    handleSearchResults: function (results) {
        //enyo.log("RESULTS:", results);
        this.$.noteBmSidebar.setSearchResults(enyo.json.parse(results));
    },
    
    handleSearchProcess: function (process) {
        enyo.log("PROCESS: ", process);
    },
	
	getModules:function(inSender, inEvent) {
		//this.log(inSender, inEvent);
		if (this.pluginReady) {
			try { var status = this.$.plugin.callPluginMethod("getModules", "all"); }
			catch (e) { this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},
	
	getPassage: function (inSender, inEvent) {
		this.getVerses(this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter());
	},
	
	getVerses:function(passage, module) {
		if(!module) {module = this.currentModule.name}
		if (this.pluginReady) {
			try {var status = this.$.plugin.callPluginMethod("getVerses", module, passage);}
			catch (e) {this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},
	
	getBooknames:function(modName) {
		if (this.pluginReady) {
			try {var status = this.$.plugin.callPluginMethod("getBooknames", modName);}
			catch (e) {this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},
	
	getVMax:function() {
		var passage = this.$.selector.getBook().name + " " + this.$.selector.getChapter();
		enyo.log(passage);
		if (this.pluginReady) {
			try {var status = this.$.plugin.callPluginMethod("getVMax", passage);}
			catch (e) {this.showError("Plugin exception: " + e);}
		}
		else {
			this.showError("plugin not ready");
		}
	},
	
	//OTHER STUFF
	
	handleSelectHistory: function (inSender, inEvent) {
		this.$.selector.setVerse(1);
		this.getVerses(inSender.passage.passage);
	},
	
	changeChapter: function (inSender, inEvent) {
		//enyo.log("CHANGE CHAPTER... " + inSender.index, inSender.numberOfSnappers);
		if (inSender.index == 0) {
			var prev = this.$.selector.getPrevPassage();
			if (prev.prevBnumber != 0 && prev.prevChapter != 0) {
				this.getVerses(prev.passage);
				this.$.selector.setBook(prev.prevBook);
				this.$.selector.setChapter(prev.prevChapter);
				this.$.selector.setBnumber(prev.prevBnumber);
				this.$.selector.setVerse(1);
			} else {
				this.$.mainView.setIndex(1);
			}
			
			
		} else if (inSender.index == inSender.numberOfSnappers + 2) {
			var next = this.$.selector.getNextPassage();
			if (next.nextBook !== "" && next.nextChapter !== 0) {
				this.getVerses(next.passage);
				this.$.selector.setBook(next.nextBook);
				this.$.selector.setChapter(next.nextChapter);
				this.$.selector.setBnumber(next.nextBnumber);
				this.$.selector.setVerse(1);
			} else {
				this.$.mainView.setIndex(this.$.mainView.getIndex()-1);
			}
			
		}
	},
	
	openModuleMgr: function (inSender, inEvent) {
		this.$.mainPane.selectViewByName("modManView");
	},
	
	openPrefs: function (inSender, inEvent) {
		this.$.mainPane.selectViewByName("prefs");
	},
	
	openHelp: function () {
		this.$.palmService.call({
			id: 'com.palm.app.browser',
            params: {
				"target": "http://zefanjas.de/biblez"
            }
        });
	},
	
	showToaster: function() {
		this.$.selector.openSelector();
	},
	
	goToMainView: function () {
		this.$.mainPane.selectViewByName("verseView");
	},
	
	viewSelected: function(inSender, inView, inPreviousView) {
		//enyo.log(inView.name);
		if (inView.name == "modManView") {
			this.$.modManView.downloadMods();
			//this.$.modManView.getLang();
		} else if (inView.name == "verseView") {
			if(this.$.modManView.installedModules.length != 0) {
				this.getVerses(this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter(), this.currentModule.name);
			}
			
		}
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
			"passage" : this.$.selector.getBook().abbrev + " " + this.$.selector.getChapter(),
			"module" : this.currentModule,
			"bnumber": this.$.selector.bnumber,
			"chapter": this.$.selector.chapter,
			"verse": this.$.selector.verse,
			"book": this.$.selector.book,
			"fontSize": this.currentFontSize,
			"font": this.currentFont,
			"background" : this.$.prefs.getBackground()
		};
		//enyo.log(enyo.json.stringify(lastRead));
		if(this.currentModule) {
			this.dbSets["lastRead"] = enyo.json.stringify(lastRead);
		}
	}
});

//Turn Logging off
//enyo.log = function(){}