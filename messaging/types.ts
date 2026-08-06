import type {
  ArticleExtractionError,
  ExtractedArticle,
  PageInformation,
  PageInformationError,
  PlaybackCommand,
  PlaybackError,
  PlaybackSessionCheckpoint,
  PlaybackState,
  SpeechChunk,
  SpeechSpeed,
} from "@/types";

export interface PageInformationRequest {
  readonly type: "softspoken.page-info.request";
}

export type PageInformationResponse =
  | { readonly ok: true; readonly page: PageInformation }
  | { readonly ok: false; readonly error: PageInformationError };

export interface SelectionTextRequest {
  readonly type: "softspoken.selection.request";
  readonly target: "content";
}

export type SelectionTextResponse =
  | { readonly ok: true; readonly text: string }
  | { readonly ok: false; readonly error: PlaybackError };

export interface ArticleLoadRequest {
  readonly type: "softspoken.article.extract-request";
}

export interface ArticleExtractionRequest {
  readonly type: "softspoken.article.content-request";
  readonly target: "content";
}

export type ArticleExtractionResponse =
  | { readonly ok: true; readonly article: ExtractedArticle }
  | { readonly ok: false; readonly error: ArticleExtractionError };

export interface ListenToSelectionRequest {
  readonly type: "softspoken.playback.listen-request";
  readonly source: "selection";
  readonly speed: SpeechSpeed;
}

export interface ListenToArticleRequest {
  readonly type: "softspoken.playback.listen-request";
  readonly source: "article";
  readonly article: ExtractedArticle;
  readonly speed: SpeechSpeed;
}

export interface PlaybackCommandRequest {
  readonly type: "softspoken.playback.command-request";
  readonly command: PlaybackCommand;
}

export interface PlaybackSpeedRequest {
  readonly type: "softspoken.playback.speed-request";
  readonly speed: SpeechSpeed;
}

export interface PlaybackStateRequest {
  readonly type: "softspoken.playback.state-request";
}

interface SpeechStartRequestBase {
  readonly type: "softspoken.speech.start";
  readonly target: "offscreen";
  readonly chunks: readonly SpeechChunk[];
  readonly speed: SpeechSpeed;
}

export type SpeechStartRequest = SpeechStartRequestBase &
  (
    | { readonly source: "selection" }
    | { readonly source: "article"; readonly articleId: string }
  );

export interface SpeechCommandRequest {
  readonly type: "softspoken.speech.command";
  readonly target: "offscreen";
  readonly command: PlaybackCommand;
}

export interface SpeechSpeedRequest {
  readonly type: "softspoken.speech.speed";
  readonly target: "offscreen";
  readonly speed: SpeechSpeed;
}

export interface SpeechStateRequest {
  readonly type: "softspoken.speech.state-request";
  readonly target: "offscreen";
}

export interface SpeechRestoreRequest {
  readonly type: "softspoken.speech.restore";
  readonly target: "offscreen";
  readonly checkpoint: PlaybackSessionCheckpoint;
}

export interface PlaybackStateChangedMessage {
  readonly type: "softspoken.playback.state-changed";
  readonly target: "popup";
  readonly state: PlaybackState;
}

export type PlaybackResponse =
  | { readonly ok: true; readonly state: PlaybackState }
  | { readonly ok: false; readonly error: PlaybackError };

export type PopupPlaybackRequest =
  | ListenToSelectionRequest
  | ListenToArticleRequest
  | PlaybackCommandRequest
  | PlaybackSpeedRequest
  | PlaybackStateRequest;

export type OffscreenSpeechRequest =
  | SpeechStartRequest
  | SpeechRestoreRequest
  | SpeechCommandRequest
  | SpeechSpeedRequest
  | SpeechStateRequest;

export type SoftSpokenMessage =
  | PageInformationRequest
  | SelectionTextRequest
  | ArticleLoadRequest
  | ArticleExtractionRequest
  | PopupPlaybackRequest
  | OffscreenSpeechRequest
  | PlaybackStateChangedMessage;

export type SoftSpokenMessageType = SoftSpokenMessage["type"];
