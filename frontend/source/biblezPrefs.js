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
	name: "BibleZ.Prefs",
	kind: enyo.VFlexBox,
    events: {
        onBack: "",
        onBgChange: ""
    },
	published: {
		background: "biblez"
	},
	components: [
        {kind: "Header", components: [
            {kind: "Button", caption: $L("Back"), onclick: "doBack"},
			{kind: "Spacer"},
			{content: $L("Preferences")},
			{kind: "Spacer"}
        ]},
        {kind: "Scroller", flex: 1, components: [
            {kind: "RowGroup", caption: $L("General"), style: "margin-left: auto; margin-right: auto;", className: "prefs-container", components: [
                {name: "generalSelector", kind: "ListSelector", label: $L("Background"), onChange: "itemChanged", items: [
                    {caption: $L("Default"), value: "biblez"},
					{caption: $L("Paper Grayscale"), value: "grayscale"},
                    {caption: $L("Gray"), value: "palm"},
					{caption: $L("Night View"), value: "night"}
                ]}
            ]},
            {kind: "Spacer"}
        ]}
    ],
    
    itemChanged: function(inSender, inValue, inOldValue) {
        this.background = inValue;
        this.doBgChange();
    },
    
    setBgItem: function (value) {
        this.background = value;
        this.$.generalSelector.setValue(value);
    }
})