export {};

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: {
      Setup?: (options?: { eventHandler?: (event: { event: string }) => void }) => void;
      Refresh?: () => void;
      Url?: {
        Open?: (url: string) => void;
        Close?: () => void;
      };
      Affiliate?: {
        GetID?: () => string;
        Build?: (url: string) => string;
      };
    };
  }
}
