import * as alt from "alt";
import * as native from "natives";

export let viewReady = false;
const debug = false; //setting this to true will print some logs to debug functions
const webView = new alt.WebView(
  "http://resource/client/menu/src/html/index.html"
); //http://localhost:5173   http://resource/client/menu/src/html/index.html

//For developers
const cleanSubmenus = true; // When set to true it will try to delete all submenus and items attached to an item you are deleting. However this may break dynamic menus
const resetMenuCurrent = false; //When set to true this will toggle to set Menu.current to undefined when no menu is open. When turning the Menu.current variable will be set to undefined when you close all menus and there is no one visible
const blockInputOnMenuOpen = false; //Block any player input, while any menu is open. -> Prevents unexpected player interaction
const preventESCOnMenuOpen = true; //When a menu is open and the player presses ESC on the keyboard, the pause menu wont open. Use this to prevent users get confused with menu navigation

let lastNavigation = 0,
  keydownStart,
  justNavigatedBack;

webView.once("ready", () => {
  registerKeybinds();
  viewReady = true;

  // when value has been changed in view set it properly
  webView.on("inputChanged", (itemIndex, value) => {
    if (!Menu.current) return;
    const i = Menu.current._items[itemIndex];
    if (i && i instanceof InputItem) {
      i.value = value; // this causes some ugly delay when writing, but we need to update the item with each input, otherwise its not synced anymore - Fix would be good
      Menu.current.inputChange.emit(i, value);
    }
  });
});

export class Menu {
  static current;
  static _allMenus = [];

  _visible = false;
  _title;
  _items;
  _parentMenu;
  _currentIndex = 0;
  _data;

  constructor(title, data = undefined) {
    this._title = title;
    this._items = [];
    this._data = data;

    Menu._allMenus.push(this);

    this.menuOpen = new EventHandler();
    this.menuClose = new EventHandler();
    this.checkboxChange = new EventHandler();
    this.rangeSliderChange = new EventHandler();
    this.itemSelect = new EventHandler();
    this.confirmationSubmit = new EventHandler();
    this.inputSubmit = new EventHandler();
    this.inputChange = new EventHandler();
    this.listChange = new EventHandler();
    this.autoListChange = new EventHandler();
    this.confirmationChange = new EventHandler();
    this.indexChange = new EventHandler();
  }
  get data() {
    return this._data;
  }
  set data(value) {
    this._data = value;
  }

  get visible() {
    return this._visible;
  }
  set visible(state) {
    if (debug) {
      alt.log("set visible: " + state);
    }
    if (state) {
      if (!justNavigatedBack) playSound("SELECT");
      this.menuOpen.emit(); //emit Open before we actually open the menu -> When changing items in MenuOpen they wont get sent to UI twice
      if (this.currentIndex >= this._items.length) this._currentIndex = 0; //reset index when it became out of bounce
      //  webView.emit('setMenuItems', []); //When opening large menus use this to pre-open the menu before the items are loaded to prevent confusion
      webView.emit("setTitle", this._title);
      webView.emit("setVisible", true);

      const _populatedItemList = [];
      for (let i = 0; i < this._items.length; i++) {
        _populatedItemList.push(this._items[i].getWebviewObjects());
      }
      webView.emit("setMenuItems", _populatedItemList); //force refresh of items, using this instead of refreshItems(), because we set visible to true in the end to prevent currentIndex out of bounce in webView, when changing menus on menuOpen (Needs investigation!)
      webView.emit("setIndex", this.currentIndex); //refresh current index when opening

      //enfore only one menu opened at a time / fired when a user hardcodes .visible = true
      if (this !== Menu.current && Menu.current?.visible) {
        Menu.current._visible = false;
        Menu.current.menuClose.emit(false);
      }

      Menu.current = this;
      webView.focus();
      this.checkForInputItem(); //check if opened item is input item and set meta #tryfix
    } else {
      playSound("Back");
      webView.emit("setVisible", false);
      if (resetMenuCurrent) Menu.current = undefined;
      this.menuClose.emit(false);
    }
    this._visible = state;
  }

  get title() {
    return this._title;
  }
  set title(value) {
    this._title = value;
    if (this.visible) webView.emit("setTitle", this._title);
  }

  get currentIndex() {
    return this._currentIndex;
  }
  set currentIndex(value) {
    this._currentIndex = value;
    if (this.visible) webView.emit("setIndex", this._currentIndex);
  }

  addSubmenu(menu, item) {
    if (debug) {
      alt.log("adding submenu");
    }
    if (item.type !== "MenuItem") {
      alt.log("Can only add MenuItem items as submenu!");
      return;
    }
    this.addItem(item);
    menu._parentMenu = this;
    item._childMenu = menu;
  }

  removeSubmenu(item) {
    if (debug) {
      alt.log("removing submenu");
    }
    if (item._childMenu) {
      Menu.remove(item._childMenu);
      this.removeItem(item);
    }
  }

  addItem(item) {
    this._items.push(item);
    if (this.visible) {
      webView.emit("addMenuItem", item.getWebviewObjects());
    }
  }

  hasItem(item) {
    return this._items.includes(item);
  }

  removeItem(item, onlyCleanup = false) {
    if (!onlyCleanup) {
      const index = this._items.indexOf(item);
      if (index == -1) {
        alt.log("tried to remove item, but it is not existent in menu!");
        return;
      }
      this._items.splice(index, 1);
      if (this.visible) {
        webView.emit("removeMenuItem", index);
      }
    }

    if (cleanSubmenus && item._childMenu) {
      Menu.remove(item._childMenu);
    }
    item = null;

    if (this.currentIndex >= this._items.length) this.currentIndex = 0; //reset index when it became out of bounce
  }

  clear() {
    for (let i = this._items.length - 1; i >= 0; i--) {
      this.removeItem(this._items[i], true);
    }
    this.currentIndex = 0;
    this._items = [];
    this.refreshItems();
  }

  static remove(menu) {
    const index = Menu._allMenus.indexOf(menu);
    if (index == -1) {
      alt.log("tried to remove non-existend menu!");
      return;
    }
    if (Menu.current === menu && menu.visible) menu.visible = false;
    menu.clear();
    Menu._allMenus.splice(index, 1);
    menu = null;
  }

  close() {
    this.visible = false;
  }
  open() {
    if (Menu.current) Menu.current._visible = false;
    this.visible = true;
  }
  refreshItems() {
    if (this.visible) {
      webView.emit("setMenuItems", this._items);
    }
  }
  refreshItem(item) {
    if (this.visible) {
      const index = this._items.indexOf(item);
      if (index != -1) {
        webView.emit(
          "setMenuItem",
          this._items[index].getWebviewObjects(),
          index
        );
        //  MAYBE NOT NEEDED??? webView.emit('setIndex', this.currentIndex); //enforece index update -> refreshes description and input items
      } else {
        alt.log("editing item, that is not in this menu?");
      }
    }
  }
  get currentItem() {
    return this._items[this.currentIndex] ?? false;
  }
  goBack() {
    if (this.currentItem instanceof InputItem) return false;

    if (this._parentMenu) {
      //Handle menu back sounds
      justNavigatedBack = true;
      alt.nextTick(() => {
        justNavigatedBack = false;
      });
      playSound("Back");

      this._visible = false;
      this._parentMenu.visible = true;
      this.menuClose.emit(false);
    } else {
      this.visible = false;
      this.menuClose.emit(true);
    }
    return true;
  }
  moveLeft() {
    const currentItem = this.currentItem;
    if (!currentItem) return false;

    if (
      currentItem instanceof ListItem ||
      currentItem instanceof RangeSliderItem ||
      currentItem instanceof ConfirmItem
    ) {
      const res = currentItem.moveLeft();
      return res;
    } else if (currentItem instanceof InputItem) {
      return false;
    } else {
      this.goBack();
      return false;
    }
  }
  moveRight() {
    const currentItem = this.currentItem;
    if (!currentItem) return false;

    if (
      currentItem instanceof ListItem ||
      currentItem instanceof RangeSliderItem ||
      currentItem instanceof ConfirmItem
    ) {
      const res = currentItem.moveRight();
      return res;
    } else if (currentItem instanceof InputItem) {
      return false;
    } else {
      const resSelect = this.select();
      if (resSelect) playSound("SELECT");
      return false;
    }
  }
  moveUp() {
    if (this.currentIndex - 1 < 0) this.currentIndex = this._items.length - 1;
    else this.currentIndex--;

    this.onIndexChange();

    return true;
  }
  moveDown() {
    if (this.currentIndex + 1 >= this._items.length) {
      this.currentIndex = 0;
    } else this.currentIndex++;
    this.onIndexChange();

    return true;
  }

  //When selected item index changes due to moving up, down or navigating in menus
  onIndexChange() {
    const currentItem = this.currentItem;
    if (!currentItem) return false;

    this.checkForInputItem();

    this.indexChange.emit(currentItem, this.currentIndex);
  }

  checkForInputItem() {
    const currentItem = this.currentItem;
    if (!currentItem) return;
    if (currentItem instanceof InputItem && !currentItem.disabled) {
      webView.focus();
      alt.Player.local.setMeta("MenuFramework::Action::IsTypingText", true);
    } else if (
      alt.Player.local.hasMeta("MenuFramework::Action::IsTypingText")
    ) {
      alt.Player.local.deleteMeta("MenuFramework::Action::IsTypingText");
    }
  }

  select() {
    const currentItem = this.currentItem;
    if (!currentItem) return false;

    const res = currentItem.select();
    if (debug) alt.log("item selected");
    return res;
  }
}

export class MenuItem {
  _type;
  _text;
  _rightText;
  _emoji;
  _disabled;
  _data;
  _childMenu;
  _description;

  //First attr basic constructor for all MenuItems, last few are special - idk if really needed, because we have a setter
  constructor(
    text,
    description = undefined,
    emoji = undefined,
    disabled = undefined,
    data = undefined,
    rightText = undefined
  ) {
    this._type = "MenuItem";
    this._text = text;
    this._rightText = rightText;
    this._emoji = emoji;
    this._disabled = disabled;
    this._data = data;
    this._description = description;
  }

  requestRefresh() {
    if (
      Menu.current &&
      Menu.current.visible &&
      Menu.current._items.includes(this)
    ) {
      Menu.current.refreshItem(this);
    } else {
      if (debug) alt.log("error trying to refresh item!");
    }
  }

  get type() {
    return this._type;
  }

  get text() {
    return this._text;
  }
  set text(value) {
    this._text = value;
    this.requestRefresh();
  }

  get rightText() {
    return this._rightText;
  }
  set rightText(value) {
    this._rightText = value;
    this.requestRefresh();
  }

  get description() {
    return this._description;
  }
  set description(value) {
    this._description = value;
    this.requestRefresh();
  }

  get emoji() {
    return this._emoji;
  }
  set emoji(value) {
    this._emoji = value;
    this.requestRefresh();
  }

  get disabled() {
    return this._disabled;
  }
  set disabled(value) {
    this._disabled = value;
    this.requestRefresh();
  }

  get data() {
    return this._data;
  }
  set data(value) {
    this._data = value;
  }

  moveLeft() {
    if (this.disabled) return false;
    if (!Menu.current || !Menu.current.visible) return false;
    return true;
  }

  moveRight() {
    if (this.disabled) return false;
    if (!Menu.current || !Menu.current.visible) return false;
    return true;
  }

  select() {
    if (this.disabled) {
      if (debug) alt.log("disabled");
      return false;
    }
    if (!Menu.current || !Menu.current.visible) {
      if (debug) alt.log("menu not visible");
      return false;
    }

    Menu.current.itemSelect.emit(this, Menu.current._items.indexOf(this)); //Run this before opening child, so the emit is in correct menu

    if (this._childMenu) {
      if (debug) alt.log("Opening child menu");
      const childMenu = this._childMenu;
      if (!childMenu) {
        alt.log("Tried to open child menu, but its not in array!");
        return false;
      }
      Menu.current._visible = false;
      Menu.current.menuClose.emit(false);
      childMenu.visible = true;
      return false; // prevent sound playing twice
    }
    return true;
  }

  getWebviewObjects() {
    return {
      type: this.type,
      text: this.text,
      rightText: this.rightText,
      emoji: this.emoji,
      disabled: this.disabled,
      description: this.description,
    };
  }
}

export class CheckboxItem extends MenuItem {
  _checked;

  constructor(
    text,
    checked = false,
    description = undefined,
    emoji = undefined,
    disabled = undefined,
    data = undefined
  ) {
    super(text, description, emoji, disabled, data);
    this._checked = checked;
    this._type = "CheckboxItem";
  }

  get checked() {
    return this._checked;
  }
  set checked(value) {
    if (debug) {
      alt.log("changed checkbox state");
    }
    this._checked = value;
    this.requestRefresh();
  }

  select() {
    if (!super.select()) return false; //Check item health and if change is allowed
    this.checked = !this.checked; //perform change and update item in UI
    Menu.current.checkboxChange.emit(this, this.checked); //call Hook
    return true;
  }

  getWebviewObjects() {
    return {
      ...super.getWebviewObjects(),
      checked: this.checked,
    };
  }
}

export class ConfirmItem extends MenuItem {
  _confirmed;
  _confirmDenyText;
  _confirmAcceptText;

  constructor(
    text,
    confirmDenyText = "No",
    confirmAcceptText = "Yes",
    confirmed = false,
    description = undefined,
    emoji = undefined,
    disabled = undefined,
    data = undefined
  ) {
    super(text, description, emoji, disabled, data);
    this._confirmed = confirmed;
    this._confirmAcceptText = confirmAcceptText;
    this._confirmDenyText = confirmDenyText;
    this._type = "ConfirmItem";
  }

  get confirmed() {
    return this._confirmed;
  }
  set confirmed(state) {
    this._confirmed = state;
    this.requestRefresh();
    Menu.current.confirmationChange.emit(this, state);
  }

  select() {
    if (!super.select()) return false;
    Menu.current.confirmationSubmit.emit(this, this.confirmed);
    return true;
  }

  moveLeft() {
    if (!super.moveLeft()) return false;
    if (this.confirmed) return false;
    this.confirmed = true;
    return true;
  }

  moveRight() {
    if (!super.moveRight()) return false;
    if (!this.confirmed) return false;
    this.confirmed = false;
    return true;
  }

  getWebviewObjects() {
    return {
      ...super.getWebviewObjects(),
      confirmed: this.confirmed,
      confirmDenyText: this._confirmDenyText,
      confirmAcceptText: this._confirmAcceptText,
    };
  }
}

export class InputItem extends MenuItem {
  _value;
  _placeholder;
  _maxLength;

  constructor(
    text,
    maxLength = 10,
    placeholder = undefined,
    value = undefined,
    description = undefined,
    emoji = undefined,
    disabled = undefined,
    data = undefined
  ) {
    super(text, description, emoji, disabled, data);
    this._value = value;
    this._placeholder = placeholder;
    this._maxLength = maxLength;
    this._type = "InputItem";
  }

  get value() {
    return this._value;
  }
  set value(val) {
    this._value = val;
    this.requestRefresh();
  }

  get placeholder() {
    return this._placeholder;
  }
  set placeholder(value) {
    this._placeholder = value;
    this.requestRefresh();
  }
  get maxLength() {
    return this._maxLength;
  }
  set maxLength(value) {
    this._maxLength = value;
    this.requestRefresh();
  }

  select() {
    if (!super.select()) return false;
    Menu.current.inputSubmit.emit(this, this.value);
    return true;
  }

  getWebviewObjects() {
    return {
      ...super.getWebviewObjects(),
      value: this.value,
      placeholder: this.placeholder,
      maxLength: this.maxLength,
    };
  }
}

export class ListItem extends MenuItem {
  _currentIndex;
  _currentValue;
  _values;

  constructor(
    text,
    values = [],
    initialIndex = 0,
    description = undefined,
    emoji = undefined,
    disabled = undefined,
    data = undefined
  ) {
    super(text, description, emoji, disabled, data);
    this._values = values;
    this.selectedIndex = initialIndex;
    this._type = "ListItem";
  }

  get selectedIndex() {
    return this._currentIndex;
  }
  set selectedIndex(value) {
    this._currentIndex = value;
    this._currentValue = this.currentValue; //internally update the currentValue and send it along with the refresh - Kinda complicated, but short - needs investigation!
    this.requestRefresh();
  }

  get values() {
    return this._values;
  }
  set values(values) {
    this._values = values;
    if (this.selectedIndex > this.values.length) this.selectedIndex = 0; //fix index, when new list will be used with index out of range
    this.requestRefresh();
  }
  get currentValue() {
    return this.values[this._currentIndex];
  }
  set currentValue(value) {
    const index = this.values.indexOf(value);
    if (index === -1) {
      alt.log(
        "Tried to set the ListItem index based on value, but it failed. Item is not in list."
      );
      return;
    } else {
      this.selectedIndex = index;
    }
  }

  moveLeft(isAutoListItem = false) {
    if (!super.moveLeft()) return false;
    const oldIndex = this.selectedIndex;
    if (this.selectedIndex - 1 < 0) this.selectedIndex = this.values.length - 1;
    else this.selectedIndex--;
    if (oldIndex === this.selectedIndex) return false; // no emit when nothing changed
    if (!isAutoListItem)
      Menu.current.listChange.emit(
        this,
        this.selectedIndex,
        oldIndex,
        this.currentValue
      );
    return true;
  }

  moveRight(isAutoListItem = false) {
    if (!super.moveRight()) return false;
    const oldIndex = this.selectedIndex;
    if (this.selectedIndex >= this.values.length - 1) this.selectedIndex = 0;
    else this.selectedIndex++;
    if (oldIndex === this.selectedIndex) return false; // no emit when nothing changed
    if (!isAutoListItem)
      Menu.current.listChange.emit(
        this,
        this.selectedIndex,
        oldIndex,
        this.currentValue
      );
    return true;
  }

  getWebviewObjects() {
    return {
      ...super.getWebviewObjects(),
      currentValue: this._currentValue,
    };
  }
}

export class AutoListItem extends ListItem {
  _min;
  _max;

  constructor(
    text,
    min,
    max,
    initialValue = 0,
    description = undefined,
    emoji = undefined,
    disabled = undefined,
    data = undefined
  ) {
    const values = Array.from({ length: max - min + 1 }, (v, k) => k + min);
    super(
      text,
      values,
      values.indexOf(initialValue),
      description,
      emoji,
      disabled,
      data
    );
    this._min = min;
    this._max = max;
  }

  get min() {
    return this._min;
  }
  set min(value) {
    const values = Array.from(
      { length: this.max - value + 1 },
      (v, k) => k + value
    );
    this.values = values;
    this._min = value;
  }
  get max() {
    return this._max;
  }
  set max(value) {
    const values = Array.from(
      { length: value - this.min + 1 },
      (v, k) => k + this.min
    );
    this.values = values;
    this._max = value;
  }

  moveLeft() {
    const res = super.moveLeft(true);
    if (res)
      Menu.current.autoListChange.emit(
        this,
        this.currentValue,
        this.selectedIndex
      );
    return res;
  }

  moveRight() {
    const res = super.moveRight(true);
    if (res)
      Menu.current.autoListChange.emit(
        this,
        this.currentValue,
        this.selectedIndex
      );
    return res;
  }
  getWebviewObjects() {
    return {
      ...super.getWebviewObjects(),
    };
  }
}

export class RangeSliderItem extends MenuItem {
  _min;
  _max;
  _currentSelection;

  constructor(
    text,
    min,
    max,
    currentSelection = 0,
    description = undefined,
    emoji = undefined,
    disabled = undefined,
    data = undefined
  ) {
    super(text, description, emoji, disabled, data);
    this._min = min;
    this._max = max;
    this._currentSelection = currentSelection;
    this._type = "RangeSliderItem";
  }

  get min() {
    return this._min;
  }
  set min(value) {
    this._min = value;
    this.requestRefresh();
  }

  get max() {
    return this._max;
  }
  set max(value) {
    this._max = value;
    this.requestRefresh();
  }

  get currentSelection() {
    return this._currentSelection;
  }
  set currentSelection(value) {
    this._currentSelection = value;
    this.requestRefresh();
  }

  moveLeft() {
    if (!super.moveLeft()) return false;
    if (this.currentSelection > this.min) {
      this.currentSelection = this.currentSelection - 1;
      Menu.current.rangeSliderChange.emit(this, this.currentSelection);
      return true;
    }
    return false;
  }

  moveRight() {
    if (!super.moveRight()) return false;
    if (this.currentSelection < this.max) {
      this.currentSelection = this.currentSelection + 1;
      Menu.current.rangeSliderChange.emit(this, this.currentSelection);
      return true;
    }
    return false;
  }

  getWebviewObjects() {
    return {
      ...super.getWebviewObjects(),
      currentSelection: this.currentSelection,
      min: this.min,
      max: this.max,
    };
  }
}

export class MenuConfiguration {
  _left = 1;
  _top = 1;
  _height = 30;
  _width = 30;
  _fontSize = 20;
  _highlightColor = "#bf7595da";
  _backgroundColor = "#000000a6";
  _fontColor = "#DDDAD2";
  _fontWeight = 500;
  _fontType = "Rubik";
  _sound = true;
  _useAnimations = true;

  get left() {
    return this._left;
  }
  set left(value) {
    this._left = value;
    webView.emit("setConfig", "left", value);
  }

  get top() {
    return this._top;
  }
  set top(value) {
    this._top = value;
    webView.emit("setConfig", "top", value);
  }

  get height() {
    return this._height;
  }
  set height(value) {
    this._height = value;
    webView.emit("setConfig", "height", value);
  }

  get width() {
    return this._width;
  }
  set width(value) {
    this._width = value;
    webView.emit("setConfig", "width", value);
  }

  get fontSize() {
    return this._fontSize;
  }
  set fontSize(value) {
    this._fontSize = value;
    webView.emit("setConfig", "fontSize", value);
  }

  get highlightColor() {
    return this._highlightColor;
  }
  set highlightColor(value) {
    this._highlightColor = value;
    webView.emit("setConfig", "highlightColor", value);
  }

  get backgroundColor() {
    return this._backgroundColor;
  }
  set backgroundColor(value) {
    this._backgroundColor = value;
    webView.emit("setConfig", "backgroundColor", value);
  }

  get fontColor() {
    return this._fontColor;
  }
  set fontColor(value) {
    this._fontColor = value;
    webView.emit("setConfig", "fontColor", value);
  }

  get fontWeight() {
    return this._fontWeight;
  }
  set fontWeight(value) {
    this._fontWeight = value;
    webView.emit("setConfig", "fontWeight", value);
  }

  get fontType() {
    return this._fontType;
  }
  set fontType(value) {
    this._fontType = value;
    webView.emit("setConfig", "fontType", value);
  }

  get sound() {
    return this._sound;
  }
  set sound(state) {
    this._sound = state;
  }

  get useAnimations() {
    return this._useAnimations;
  }
  set useAnimations(value) {
    this._useAnimations = value;
    webView.emit("setConfig", "useAnimations", value);
  }

  reset() {
    this.left = 1;
    this.top = 1;
    this.height = 30;
    this.width = 30;
    this.fontSize = 20;
    this.highlightColor = "#bf7595da";
    this.backgroundColor = "#000000a6";
    this.fontColor = "#DDDAD2";
    this.fontWeight = 500;
    this.fontType = "Rubik";
    this.sound = true;
    this.useAnimations = true;
  }
}
export const menuConfiguration = new MenuConfiguration();

class EventHandler {
  constructor() {
    this.handlers = [];
  }
  on(handler) {
    this.handlers.push(handler);
  }
  off(handler) {
    this.handlers = this.handlers.filter((h) => h !== handler);
  }
  emit(...args) {
    this.handlers.slice(0).forEach((h) => h(...args));
  }
  expose() {
    return this;
  }
  count() {
    return this.handlers.length;
  }
}

function registerKeybinds() {
  alt.everyTick(() => {
    const menu = Menu.current;

    if (!menu || !menu.visible) return;
    if (alt.Player.local.hasMeta("MenuFramework::State::PreventInput")) return;

    if (
      alt.Player.local.hasMeta("MenuFramework::Action::IsTypingText") ||
      blockInputOnMenuOpen
    ) {
      native.disableAllControlActions(0); //for input items
    }

    if (preventESCOnMenuOpen) {
      native.disableControlAction(0, 200, true);
      native.disableControlAction(0, 199, true);
    }

    if (
      native.isControlJustPressed(0, 177) ||
      native.isDisabledControlJustPressed(0, 177)
    ) {
      //if (menu.goBack()) playSound('BACK');
      menu.goBack();
      return;
    }

    if (menu._items?.length === 0) return;

    if (
      native.isControlJustPressed(0, 201) ||
      native.isDisabledControlJustPressed(0, 201)
    ) {
      if (menu.select()) playSound("SELECT");
      return;
    }

    const now = Date.now();
    let itemChangeSpeed = 200;

    if (
      native.isControlPressed(0, 172) ||
      native.isControlPressed(0, 173) ||
      native.isControlPressed(0, 174) ||
      native.isControlPressed(0, 175) ||
      native.isDisabledControlPressed(0, 172) ||
      native.isDisabledControlPressed(0, 173) ||
      native.isDisabledControlPressed(0, 174) ||
      native.isDisabledControlPressed(0, 175)
    ) {
      if (!keydownStart) keydownStart = now;
    } else if (keydownStart) keydownStart = undefined;

    if (keydownStart + 1000 < now) itemChangeSpeed = 70;
    if (keydownStart + 3000 < now) itemChangeSpeed = 50;
    if (keydownStart + 5000 < now) itemChangeSpeed = 40;
    if (keydownStart + 7000 < now) itemChangeSpeed = 30;

    if (
      (native.isControlPressed(0, 172) ||
        native.isDisabledControlPressed(0, 172)) &&
      lastNavigation + itemChangeSpeed < now
    ) {
      lastNavigation = now;
      if (menu.moveUp()) playSound("NAV_UP_DOWN");
      return;
    } else if (
      (native.isControlPressed(0, 173) ||
        native.isDisabledControlPressed(0, 173)) &&
      lastNavigation + itemChangeSpeed < now
    ) {
      lastNavigation = now;
      if (menu.moveDown()) playSound("NAV_UP_DOWN");
      return;
    } else if (
      (native.isControlPressed(0, 174) ||
        native.isDisabledControlPressed(0, 174)) &&
      lastNavigation + itemChangeSpeed < now
    ) {
      lastNavigation = now;
      if (menu.moveLeft()) playSound("NAV_LEFT_RIGHT");
      return;
    }

    if (
      (native.isControlPressed(0, 175) ||
        native.isDisabledControlPressed(0, 175)) &&
      lastNavigation + itemChangeSpeed < now
    ) {
      lastNavigation = now;
      if (menu.moveRight()) playSound("NAV_LEFT_RIGHT");
      return;
    } else if (
      native.isControlJustReleased(0, 172) ||
      native.isControlJustReleased(0, 173) ||
      native.isControlJustReleased(0, 174) ||
      native.isControlJustReleased(0, 175) ||
      native.isDisabledControlJustReleased(0, 172) ||
      native.isDisabledControlJustReleased(0, 173) ||
      native.isDisabledControlJustReleased(0, 174) ||
      native.isDisabledControlJustReleased(0, 175)
    ) {
      lastNavigation = 0;
    }
  });
}

export function playSound(name) {
  if (!menuConfiguration.sound) return;
  const soundID = native.getSoundId();
  native.playSoundFrontend(
    soundID,
    name,
    "HUD_FRONTEND_DEFAULT_SOUNDSET",
    true
  );
  native.releaseSoundId(soundID);
}
