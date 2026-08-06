import type {
  ArticleExtractionError,
  ExtractedArticle,
  PlaybackCommand,
  PlaybackState,
  UserSettings,
} from "@/types";

export type SoftSpokenMessage =
  | { readonly type: "softspoken.article.load-request" }
  | {
      readonly type: "softspoken.article.load-success";
      readonly article: ExtractedArticle;
    }
  | {
      readonly type: "softspoken.article.load-failure";
      readonly error: ArticleExtractionError;
    }
  | {
      readonly type: "softspoken.playback.command";
      readonly command: PlaybackCommand;
    }
  | { readonly type: "softspoken.playback.state-request" }
  | {
      readonly type: "softspoken.playback.state-changed";
      readonly state: PlaybackState;
    }
  | {
      readonly type: "softspoken.settings.update";
      readonly settings: UserSettings;
    }
  | { readonly type: "softspoken.settings.request" }
  | {
      readonly type: "softspoken.settings.changed";
      readonly settings: UserSettings;
    };

export type SoftSpokenMessageType = SoftSpokenMessage["type"];
