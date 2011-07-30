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
    name: "BibleZ.VersePopup",
    scrim: false,
    kind: "Popup",
    lazy: false,
    events: {
      onNote: "",
      onBookmark: ""
    },
    components:[
        {kind: "VFlexBox", flex: 1, components: [
            {kind: "ToolButtonGroup", components: [
                //{content: "Copy"},
                {name: "bmCaption", caption: $L("Bookmark") + " + ", onclick: "doBookmark"},
                {name: "noteCaption", caption: $L("Note") + " + ", onclick: "doNote"}
                //{content: "Highlight"},
            ]}
        ]}       
    ],
    
    setBmCaption: function (caption) {
        this.$.bmCaption.setCaption(caption);
    },
    
    setNoteCaption: function (caption) {
        this.$.noteCaption.setCaption(caption);
    },
    
    closePopup: function() {
       this.close();
    }
});

enyo.kind({
    name: "BibleZ.AddNote",
    kind: "ModalDialog",
    lazy: false,
    events: {
      onAddNote: ""
    },
    published: {
		edit: false
	},
    caption: $L("Add A Note"), components:[        
        {name: "noteInput", kind: "RichText", className: "note-input", hint: $L("Add your note here."), onfocus: "openCenter"},
        {layoutKind: "HFlexLayout", style: "margin-top: 10px;", components: [  
            {name: "btCancel", kind: "Button", caption: $L("Cancel"), flex: 1, onclick: "closePopup"},
            {name: "btAdd", kind: "Button", caption: $L("Add"), flex: 1, onclick: "addNote", className: "enyo-button-affirmative"},
        ]}
    ],
    
    getNote: function () {
        return this.$.noteInput.getHtml();
    },
    
    setFocus: function () {
        this.$.noteInput.forceFocusEnableKeyboard();
    },
    
    clearInput: function () {
        this.dismissWithClick = false;
        this.$.noteInput.setValue("");
		this.$.btAdd.show();
        this.$.btAdd.setCaption($L("Add"));
        this.edit = false;
        this.setFocus();
    },
    
    setNote: function(noteText) {
        this.$.btAdd.hide();
        this.$.noteInput.setValue(noteText.replace(/"/g,""));
    },
    
    addNote: function (inSender, inEvent) {
        console.log(this.$.noteInput.getValue());
        this.doAddNote();
        this.closePopup();
    },
    
    setEditMode: function () {
        this.edit = true;
    },
    
    showEditBt: function () {
        if (this.edit == true) {
            this.$.btAdd.setCaption($L("Edit"));
            this.$.btAdd.show();    
        }        
    },
	
	hideCancel: function () {
		this.$.btCancel.hide();
	},
    
    openCenter: function() {
        this.dismissWithClick = false;
		this.$.btCancel.show();
        this.close()
        this.openAtCenter();
        this.showEditBt();
    },
    
    closePopup: function () {
       this.close();
    }
});

enyo.kind({
    name: "BibleZ.ShowNote",
    kind: "Popup",
    //caption: "",
    lazy: false,
    components:[
        {name: "noteContent", allowHtml: true, content: "", className: "popup-note"}
        //{kind: "Button", caption: $L("OK"), onclick: "closePopup", style: "margin-top:10px"}
    ],
    
    setNote: function (note) {
        this.$.noteContent.setContent(note.replace(/"/g,""));
    },
    
    closePopup: function() {
       this.close();
    }
})

enyo.kind({
    name: "BibleZ.FontMenu",
    kind: "Popup",
    lazy: false,
    events: {
      onFontSize: ""
    },
    published: {
		fontSize: 16
	},
    components:[
        {kind: "HFlexBox", components: [
            {content: $L("Font Size"), flex: 1, className: "font-menu"},
            {name: "fontSlider", kind: "Slider", flex: 2, minimum: 12, maximum: 30, snap: 1, onChanging: "sliderChanging", onChange: "sliderChange", className: "font-slider"}
        ]}
        
    ],
    
    sliderChange: function (inSender, inEvent) {
        //enyo.log(inSender.position);
        this.fontSize = inSender.position;
        this.doFontSize();
    },
    
    setFontSize: function (size) {
        if (size) {
            this.$.fontSlider.setPosition(size);
        } else {
            this.$.fontSlider.setPosition(16);
        }        
    }
})


enyo.kind({
   name: "BibleZ.About",
   scrim: true,
   kind: "Popup", components: [
      {kind: "PalmService", service: "palm://com.palm.applicationManager/", method: "open"},
      {content: "About " + enyo.fetchAppInfo().title, className: "popup-title"},
      {content: "Version " + enyo.fetchAppInfo().version, className: "popup-version"},
      {content: "BibleZ HD is based on the <a href='http://www.crosswire.org/sword'>SWORD Project</a>. \
                <br>BibleZ HD is licensed  under <a href='http://www.gnu.org/licenses/gpl.txt'>GPLv3</a>. \
                <br><br>&copy; 2010-2011 by <a href='http://zefanjas.de'>zefanjas.de</a>", className: "popup-info"},      
      {kind: "Button", flex: 1, caption: $L("Send eMail"), onclick: "sendMail"},
      {kind: "Button", flex: 1, caption: "Close", onclick: "doCancel"}
   ],
   
   doCancel: function () {
    this.close();
   },
   
   sendMail: function () {
      this.$.palmService.call({
         id: 'com.palm.app.email',
            params: {
               summary: $L("Support ") + enyo.fetchAppInfo().title + " TouchPad - " + enyo.fetchAppInfo().version,
			   "recipients":[{
					"type":"email",
					"contactDisplay":"Zefanjas Support",
					"role":1,
					"value":"info@zefanjas.de"
				}]
            }
      });
   }
});