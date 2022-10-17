import Command from '../../types/Command';

export interface BaseUICustomization extends Record<string, unknown> {
  id: string;
  uiType?: string;
  description?: string;
  label?: string;
  commands?: Command[];
}

export interface LabelUICustomization extends BaseUICustomization {
  label: string;
}

export interface CodeUICustomization extends BaseUICustomization {
  code: string;
}

export interface CommandUICustomization extends BaseUICustomization {
  commands: Command[];
}

export type UICustomization =
  | BaseUICustomization
  | LabelUICustomization
  | CommandUICustomization
  | CodeUICustomization;

export default UICustomization;

export interface UIConfiguration {
  globalCustomizations?: string[];
}
