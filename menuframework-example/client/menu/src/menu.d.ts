declare module "alt:menu-framework" {
  class Menu<T = any> {
    constructor(title: string, data?: T);
    data: T;
    visible: boolean;
    title: string;
    currentIndex: number;
    addSubmenu(menu: Menu, item: MenuItem): void;
    removeSubmenu(item: MenuItem): void;
    addItem(item: MenuItem): void;
    hasItem(item: MenuItem): void;
    removeItem(item: MenuItem, onlyCleaup: boolean): void;
    clear(): void;
    static remove(menu: Menu): void;
    close(): void;
    open(): void;
    refreshItems(): void;
    refreshItem(item: MenuItem): void;
    get currentItem(): MenuItem;
    goBack(): void;
    moveLeft(): void;
    moveRight(): void;
    moveUp(): void;
    moveDown(): void;
    onIndexChange(): void;
    checkForInputItem(): void;
    select(): void;
    readonly menuOpen: EventHandler<() => void>;
    readonly menuClose: EventHandler<(noParentMenuOpened: boolean) => void>;
    readonly checkboxChange: EventHandler<
      (item: CheckboxItem, state: boolean) => void
    >;
    readonly rangeSliderChange: EventHandler<
      (item: RangeSliderItem, newValue: number) => void
    >;
    readonly itemSelect: EventHandler<(item: MenuItem, index: number) => void>;
    readonly confirmationSubmit: EventHandler<
      (item: ConfirmItem, confirmed: boolean) => void
    >;
    readonly inputSubmit: EventHandler<
      (item: InputItem, newValue: string) => void
    >;
    readonly inputChange: EventHandler<
      (item: InputItem, newValue: string) => void
    >;
    readonly listChange: EventHandler<
      (
        item: ListItem,
        newIndex: number,
        oldIndex: number,
        newValue: string
      ) => void
    >;
    readonly autoListChange: EventHandler<
      (item: AutoListItem, newValue: number, newIndex: number) => void
    >;
    readonly confirmationChange: EventHandler<
      (item: ConfirmItem, confirmed: boolean) => void
    >;
    readonly indexChange: EventHandler<
      (item: MenuItem, newIndex: number) => void
    >;
  }
  class MenuItem<T = any> {
    constructor(
      text: string,
      description?: string,
      emoji?: string,
      disable?: boolean,
      data?: T,
      rightText?: string
    );
    requestRefresh(): void;
    get type(): string;
    text: string;
    rightText: string;
    description: string;
    emoji: string;
    disabled: boolean;
    data: T;
    moveLeft(): void;
    moveRight(): void;
    select(): void;
    getWebviewObjects(): {
      type: string;
      text: string;
      rightText: string;
      emoji: string;
      disable: boolean;
      description: string;
    };
  }
  class CheckboxItem<T = any> extends MenuItem {
    constructor(
      text: string,
      checked?: boolean,
      description?: string,
      emoji?: string,
      disable?: boolean,
      data?: T
    );
    checked: boolean;
    select(): void;
    getWebviewObjects(): {
      type: string;
      text: string;
      rightText: string;
      emoji: string;
      disable: boolean;
      description: string;
      checked: boolean;
    };
  }
  class ConfirmItem<T = any> extends MenuItem {
    constructor(
      text: string,
      confirmDenyText?: string,
      confirmAcceptText?: string,
      confirmed?: boolean,
      description?: string,
      emoji?: string,
      disable?: boolean,
      data?: T
    );
    confirmed: boolean;
    select(): void;
    moveLeft(): void;
    moveRight(): void;
    getWebviewObjects(): {
      type: string;
      text: string;
      rightText: string;
      emoji: string;
      disable: boolean;
      description: string;
      confirmed: boolean;
      confirmDenyText: string;
      confirmAcceptText: string;
    };
  }
  class InputItem<T = any> extends MenuItem {
    constructor(
      text: string,
      maxLength?: number,
      placeholder?: string,
      value?: string,
      description?: string,
      emoji?: string,
      disable?: boolean,
      data?: T
    );
    value: string;
    placeholder: string;
    maxLength: number;
    select(): void;
    getWebviewObjects(): {
      type: string;
      text: string;
      rightText: string;
      emoji: string;
      disable: boolean;
      description: string;
      value: string;
      placeholder: string;
      maxLength: number;
    };
  }
  class ListItem<T = any> extends MenuItem {
    constructor(
      text: string,
      values?: string[],
      initialIndex?: number,
      description?: string,
      emoji?: string,
      disable?: boolean,
      data?: T
    );
    selectedIndex: number;
    values: string[];
    currentValue: string;
    moveLeft(): void;
    moveRight(): void;
    getWebviewObjects(): {
      type: string;
      text: string;
      rightText: string;
      emoji: string;
      disable: boolean;
      description: string;
      currentValue: string;
    };
  }
  class AutoListItem<T = any> extends ListItem {
    constructor(
      text: string,
      min: number,
      max: number,
      initalValue?: number,
      description?: string,
      emoji?: string,
      disable?: boolean,
      data?: T
    );
    min: number;
    max: number;
    moveLeft(): void;
    moveRight(): void;
    getWebviewObjects(): {
      type: string;
      text: string;
      rightText: string;
      emoji: string;
      disable: boolean;
      description: string;
      currentValue: string;
    };
  }
  class RangeSliderItem<T = any> extends MenuItem {
    constructor(
      text: string,
      min: number,
      max: number,
      currentSelection?: number,
      description?: string,
      emoji?: string,
      disable?: boolean,
      data?: T
    );
    min: number;
    max: number;
    currentSelection: number;
    moveLeft(): void;
    moveRight(): void;
    getWebviewObjects(): {
      type: string;
      text: string;
      rightText: string;
      emoji: string;
      disable: boolean;
      description: string;
      min: number;
      max: number;
    };
  }
  class MenuConfiguration {
    left: number;
    top: number;
    height: number;
    width: number;
    fontSize: number;
    highlightColor: string;
    backgroundColor: string;
    fontColor: string;
    fontWeight: number;
    fontType: string;
    sound: boolean;
    useAnimations: boolean;
    reset(): void;
  }
  class EventHandler<T> {
    constructor();
    on(handler: T): void;
    off(handler: T): void;
    emit(...args: any[]): void;
    expose(): void;
    count(): number;
  }
  const menuConfiguration: MenuConfiguration;
}
