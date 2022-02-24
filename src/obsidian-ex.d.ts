import "obsidian";
declare module "obsidian" {
  interface App {
    plugins: {
      enablePlugin(id: string): Promise<void>;
      disablePlugin(id: string): Promise<void>;
    };
    setting: {
      openTabById(id: string): any;
    };
  }
}
