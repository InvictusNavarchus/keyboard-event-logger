
export enum KeyEventType {
  KeyDown = 'keydown',
  KeyUp = 'keyup',
  KeyPress = 'keypress',
}

export interface CapturedEvent {
  id: number;
  type: KeyEventType;
  key: string;
  code: string;
  which: number;
  keyCode: number;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
}
