# alt:V Open Source MenuFramework
**[MenuFramework](https://github.com/MyHwu9508/altv-os-menu-framework)** is a menu framework written for **[alt:V](https://altv.mp/)**.
This framework will help you implement intuitive menus quickly. Currently this framework is only available in JS. In case you want to help me adding TS support, please check the contact details on the bottom of this page.

## Features
- Components (default items, list items, checkbox items, input items, confirm items)
- Built-in event handlers
- For each component an item description
- Support for emojis
- Fully configurable design pattern (colours, scale, positioning)
- Support for controllers and built in menu navigation using arrow keys, enter and backspace
- all items, descriptions and menu titels can contain plain html markup language -> You could even add a video player to the description box if you want to
- Colored text is supported with the feature mentioned above. Please see the example resource to get help.

## Compile files
**[MenuFramework](https://github.com/MyHwu9508/altv-os-menu-framework)** uses **[Svelte](https://svelte.dev/)**, **[Tailwind CSS](https://tailwindcss.com/)** with **[NodeJS](https://nodejs.org/en/)**.
Before compiling the files make sure you have the latest [Node.js](https://nodejs.org/en/) version installed.
Run following commands to download all necessary dependencies:
```sh
npm install
```
Now you can build the source by running following command:
```sh
npm run build
```

After the command is executed you will see a `dist` folder containing all the resource files.
Copy the content of this folder to your own resource, or if you are using the example resource paste the files in `menuframework-example/client/src/html`.

## Menu usage
To run the example resource copy it into your servers resources folder and add `menuframework-example` to your `server.cfg`.
Now start and join your server and `press M` to open the example resource.

## Menu Development
### Menu creation
Make sure you import the source file by adding following import to your file:
```js
import * as MenuFramework from './src/menu';
```

Create a menu by calling the **MenuFramework.Menu** constructor.
```js
const menu = new MenuFramework.Menu(title);
```
**Example:**
```js
const menu = new MenuFramework.Menu('Example');
```

### Menu item creation
Use one of the following examples to create a new menu item.
```js
// CREATE A BUTTON
new MenuFramework.MenuItem(text: string, description?: string, emoji?: string, disabled?: bool, data?: any, rightText?: string);

//CREATE A CONFIRM
new MenuFramework.ConfirmItem(text: string, confirmDenyText?: string, confirmAcceptText?: string, confirmed?: bool, description?: string, emoji?: string, disabled:? bool, data?: any);

//CREATE A RANGESLIDER
new MenuFramework.RangeSliderItem(text: string, min: int, max: int, currentSelection?: int, description?: string, emoji?: string, disabled?: bool, data?: any);

//CREATE A CHECKBOX
new MenuFramework.CheckboxItem(text: string, checked?: bool, description?: string, emoji?: string, disabled?: bool, data?: any);

//CREATE A LIST
new MenuFramework.ListItem(text: string, values?: Array[], initialIndex?: int, description?: string, emoji?: string, disabled?: bool, data?: any);

//CREATE AN AUTOLIST
new MenuFramework.AutoListItem(text: string, min: int, max:int, initialIndex?: int, description?: string, emoji?: string, disabled?: bool, data?: any);

//CREATE AN INPUT
new MenuFramework.InputItem(text: string, maxLength?: int, placeholder?: string, value?: any, description?: string, emoji?: string, disabled?: bool, data?: any);
```
**Example:**
```js
const menu = new MenuFramework.Menu('Menu');
const item = new MenuFramework.MenuItem('Hello World');
menu.addItem(item);

//Or in shorthand version
const menu = new MenuFramework.Menu('Menu');
menu.addItem(new MenuFramework.MenuItem('Hello World');
```

### Important notice to menu items!
Items can be shared across multiple menus.
To change attributes of the menu item use the setters and getters, **not** the variables starting with `_`
You need to add items to a menu, so you can interact with it.
```js
menu.addItem(item);
```

### Events
You can listen to events that are emitted by user inputs.

Listen to an event by adding a handler:
```js
    menu.itemSelect.on((item,index) => {
        alt.log(`Selected item ${item.text} @${index}`);
    });
```
**AVAILBALE EVENTS**
```js
menuOpen() //Called on menu open -> called BEFORE the menu is actually opened and sent to the webView, so if you do changes on each menu open, it won't cause lags
menuClose(noParentMenuOpened) // called on menu close
checkboxChange(item,state) //called on checkbox change
rangeSliderChange(item,newValue) //called on range slider change
itemSelect(item,index) // called when selecting an item
confirmationSubmit(item,confirmed) //called when selecting an confirmation item
confirmationChange(item,confirmed) //called when confirmation item changes
inputSubmit(item,newValue) //called when selecting an input item
inputChange(item,newValue) //called when typing into an input item
listChange(item,newIndex,oldIndex,newValue) //called when the list value changed (left arrow, right arrow)
autoListChange(item,newValue,newIndex) //called when the auto list changes (left arrow, right arrow)
indexChange(item,newIndex) //called when the current selected item changes (arrow up, arrow down)
```

### Design Configuration
Menus can be designed in bundles as follows:
Change the values for `MenuFramework.menuConfiguration`
It contains following attributes:
```js
left
top
height
fontSize
highlightColor
backgroundColor
fontColor
fontWeight
fontType
sound
useAnimations
reset() // reset everything to the default layout
```
If you want to add more fonts to the menu, please check the `main.css` in `src/assets/css`

### Metas
The menu is using metas that you can use in any resource to process information you may need
1. You can disable any menu input by giving the local player follwing meta
```
MenuFramework::State::PreventInput
```
2. While the player is hovering over an input item, it will get focused and the game controls disabled. Also it will set following meta to true
```
MenuFramework::Action::IsTypingText
```

### Functions
To get the most recent used Menu use `MenuFramework.Menu.current`

Menu functions:
```js
addItem(item)
hasItem(item)
removeItem(item)
addSubmenu(subMenu,item)
removeSubmenu(item)
clear()
open()
close()
```
Menu variables you can set:
```js
visible: bool
title: string
currentIndex: int
```

To manipulate menu items after creation check the attributes from the constructors above. Any attribute can be changed during runtime and will be applied to the item

## Screenshots
The screenshots have been taken from the example resource
Example1 | Example2 | Example3
:-------|:-------- |:--------
![Example1](https://i.imgur.com/HRvpqLK.png) | ![Example2](https://i.imgur.com/dfcdXQR.png5) | ![Example3](https://i.imgur.com/VUCRcOf.png)

## Help
In case you have any questions or concerns regarding this, feel free to contact me on Discord.
**Kaniggel#6969**
Alternatively you can join my Discord and create a ticket: https://corrosive.eu/discord

## License
This project is written by **[Kaniggel](https://github.com/MyHwu9508)** and published under **MIT License**

## Changes
修复Menu.IndexChange事件第一个参数错误的问题
添加ts声明文件
Fix the issue of the first parameter error in the Menu.indexChange event
Add ts declaration file