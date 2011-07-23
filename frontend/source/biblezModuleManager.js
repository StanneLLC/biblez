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
	name: "BibleZ.ModMan",
	kind: enyo.VFlexBox,
    events: {
        onUntar: "",
		onBack: "",
		onUnzip: "",
		onRemove: ""
    },
	published: {
		installedModules: [],
		moduleToRemove: {}
	},
	components: [
        {kind: enyo.PalmService, 
            name: "DownloadMgr",
            service: "palm://com.palm.downloadmanager/",
            method: "download",
            targetDir: "/media/internal/.sword/install",
            subscribe: true,
            onResponse: "updateStatus",
            onSuccess : "downloadFinished"
        },
		{kind: "Header", components: [
			{kind: "Button", caption: "Back", onclick: "doBack"},
			{kind: "Spacer"},
			{content: "Module Manger"},
			{kind: "Spacer"},
			{kind: "Spinner", showing: true}
			
		]},
		{name: "slidingPane", kind: "SlidingPane", flex: 1, components: [
			{name: "left", width: "320px", kind:"SlidingView", components: [
                {kind: "Scroller", flex: 1, components: [
                    {name: "langList", kind: "VirtualRepeater", onSetupRow: "getLangListItem", components: [
						{name: "itemLang", kind: "Item", layoutKind: "HFlexLayout", tapHighlight: true, className: "list-item", components: [
							{name: "langCode", style: "width: 60px;"},
							{name: "langName", style: "font-style: italic;"}
						],
						onclick: "getModules"
						}]
					}
                ]},
                {kind: "Toolbar", components: [
                    {kind: "GrabButton"}
                ]}
			]},
			{name: "middle", width: "320px", kind:"SlidingView", peekWidth: 50, components: [
                {kind: "Scroller", flex: 1, components: [
                    {name: "modList", kind: "VirtualRepeater", onSetupRow: "getModListItem", components: [
						{name: "itemMod", kind: "Item", layoutKind: "VFlexLayout", tapHighlight: true, className: "list-item", components: [
							{name: "modName"}
						],
						onclick: "getDetails"
						}]
					},
					{name: "modHint", className: "hint"}
                ]},
                {kind: "Toolbar", components: [
                    {kind: "GrabButton"}
                ]}
			]},
			{name: "right", kind:"SlidingView", flex: 1, components: [
                {kind: "Scroller", flex: 1, style: "background-color: transparent;", components: [
                    {name: "detailsContainer", components: [
						{name: "detailsName", className: "details-name"},
						{name: "detailsDescription", className: "details-descr"},
						{name: "detailsType", className: "details-type"},
						{name: "detailsLang", className: "details-lang"},
						{name: "btInstall", kind: "ProgressButton", cancelable: false, position: 100, onclick: "downloadAddIn", className: "modules-button-install", components: [
							{kind: "HFlexBox", components: [
								{name:"btInstallCaption", content: $L("Install")}
							]}
						]},
						{name: "btRemove", caption: $L("Remove"), kind: "Button", onclick: "removeModule", className: "enyo-button-negative modules-button-remove"}
					]}					
                ]},
                {kind: "Toolbar", components: [
                    {kind: "GrabButton"}					
                ]}
			]}
		]}
	],
    
    published: {
        dbSets: window['localStorage'],
		modulePath: "",
		allModsPath: ""
    },
    
    create: function () {
        this.inherited(arguments);
		this.lang = [];
		this.modules = [];
		this.$.detailsContainer.hide();
    },
    
    downloadMods: function(update) {
		console.log(enyo.json.stringify(this.dbSets["lastModUpdate"]));
        if (!this.dbSets["lastModUpdate"]) {
            console.log("mods.d.tar.gz missing. Downloading now...");
			enyo.windows.addBannerMessage("Downloading List of available Modules...", enyo.json.stringify({}));
            this.$.DownloadMgr.call({target: "http://www.crosswire.org/ftpmirror/pub/sword/raw/mods.d.tar.gz", targetDir: "/media/internal/.sword/install"});
			//this.doUntar();
        } else {
			this.getLang();
		}
    },
	
	downloadAddIn: function () {
		url = "http://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/" + this.currentModule + ".zip";
		console.log(url);
		this.$.DownloadMgr.call({target: url, targetDir: "/media/internal/.sword/install"});
	},
    
    updateStatus: function (inSender, inResponse) {
        this.log("STATUS", enyo.json.stringify(inResponse));    
    },
    
    downloadFinished: function (inSender, inResponse) {
		console.log(enyo.json.stringify(inResponse));
		this.$.btInstall.setMaximum(inResponse.amountTotal);
		this.$.btInstall.setPosition(inResponse.amountReceived);
        if (inResponse.completed == true) {
            this.log("SUCCESS", "finished download")
			if (inResponse.url == "http://www.crosswire.org/ftpmirror/pub/sword/raw/mods.d.tar.gz") {
				this.allModsPath = inResponse.target;
				this.doUntar();
			} else if(inResponse.url.search("http://www.crosswire.org/ftpmirror/pub/sword/packages/rawzip/") !== -1) {
				console.log("DO UNZIP...");
				this.$.btInstallCaption.setContent($L("Installed"));
				this.modulePath = inResponse.target;
				this.doUnzip();
			}
			
        } else {
            this.log("INFO", "Downloading");
        }
    },
	
	getLang: function () {
		//this.$.langList.render();
		console.log("Getting languages...");
		biblezTools.getLang("crosswire", enyo.bind(this, this.setLang));
	},
	
	setLang: function(lang) {
		//console.log(lang);
		this.lang = lang;
		this.$.langList.render();
		this.$.spinner.hide();
	},
	
	getLangListItem: function(inSender, inIndex) {
        var r = this.lang[inIndex];
		this.tmpLang = "";
        if (r) {
			//console.log(r + " - " + this.tmpLang);
			this.$.langCode.setContent(r);
			this.$.langName.setContent((languages[r]) ? (languages[r]) : r);
            
			var isRowSelected = (inIndex == this.lastLangItem);
			this.$.itemLang.applyStyle("background", isRowSelected ? "#3A8BCB" : null);
            return true;
        } else {
            return false;
        }
    },
	
	getModules: function (inSender, inEvent, rowIndex) {
		this.$.detailsContainer.hide();
		biblezTools.getModules(this.lang[rowIndex], enyo.bind(this, this.setModules));
		this.lastLangItem = rowIndex;
		this.lastModItem = null;
		this.$.langList.render();
		
	},
	
	setModules: function (modules) {
		//console.log(modules);
		this.modules = modules;
		this.$.modList.render();
		if (modules.length != 0) {
			this.$.modHint.hide();
		} else {
			this.$.modHint.show();
			this.$.modHint.setContent($L("No Module available"));
		}
		
	},
	
	setInstalledModules: function (modules) {
		this.installedModules = modules;
	},
	
	getModListItem: function(inSender, inIndex) {
        var r = this.modules[inIndex];
        if (r) {
			this.$.modName.setContent(r.modName);
            
			var isRowSelected = (inIndex == this.lastModItem);
			this.$.itemMod.applyStyle("background", isRowSelected ? "#3A8BCB" : null);
            return true;
        } else {
            return false;
        }
    },
	
	getDetails: function (inSender, inEvent, rowIndex) {
		this.lastModItem = rowIndex;
		this.$.modList.render();
		
		this.currentModule = this.modules[rowIndex].modName;
		
		this.$.btInstall.show();
		this.$.btRemove.hide();
		this.$.btInstallCaption.setContent($L("Install"));
		this.$.btInstall.setMaximum(100);
		this.$.btInstall.setPosition(100);
		this.$.detailsName.setContent(this.modules[rowIndex].modName);
		this.$.detailsDescription.setContent(this.modules[rowIndex].descr);
		this.$.detailsType.setContent($L("Type") + ": " + this.modules[rowIndex].modType);
		var tmpLang = (languages[this.modules[rowIndex].lang]) ? (languages[this.modules[rowIndex].lang]) : this.modules[rowIndex].lang;
		this.$.detailsLang.setContent($L("Language") + ": " + tmpLang);
		
		for(var i=0;i<this.installedModules.length;i++) {
			if(this.installedModules[i].name ==  this.modules[rowIndex].modName) {
				this.$.btInstall.hide();
				this.$.btRemove.show();
				this.moduleToRemove = this.installedModules[i];
			}
		}
		
		this.$.detailsContainer.show();
	},
	
	removeModule: function(inSender, inEvent) {
		this.doRemove();
		this.$.btInstall.show();
		this.$.btRemove.hide();
	},
	
	stopSpinner: function () {
		this.$.spinner.hide();
	}
});