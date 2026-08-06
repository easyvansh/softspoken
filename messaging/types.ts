import type {
  ArticleExtractionError,
  ExtractedArticle,
  PageInformation,
  PageInformationError,
  PlaybackCommand,
  PlaybackError,
  PlaybackProgressRecord,
  PlaybackSessionCheckpoint,
  PlaybackState,
  SpeechPitch,
  SpeechChunk,
  SpeechSpeed,
  UserSettings,
  VoiceOption,
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
  readonly settings: UserSettings;
}

export interface ListenToArticleRequest {
  readonly type: "softspoken.playback.listen-request";
  readonly source: "article";
  readonly article: ExtractedArticle;
  readonly settings: UserSettings;
}

export interface PlaybackCommandRequest {
  readonly type: "softspoken.playback.command-request";
  readonly command: PlaybackCommand;
}

export interface PlaybackSpeedRequest {
  readonly type: "softspoken.playback.speed-request";
  readonly speed: SpeechSpeed;
}

export interface PlaybackPitchRequest {
  readonly type: "softspoken.playback.pitch-request";
  readonly pitch: SpeechPitch;
}

export interface PlaybackVoiceRequest {
  readonly type: "softspoken.playback.voice-request";
  readonly selectedVoiceId?: string;
}

export interface PlaybackStateRequest {
  readonly type: "softspoken.playback.state-request";
}

export interface PlaybackProgressRequest {
  readonly type: "softspoken.playback.progress-request";
}

export interface SettingsRequest {
  readonly type: "softspoken.settings.request";
}

export interface SettingsUpdateRequest {
  readonly type: "softspoken.settings.update-request";
  readonly settings: UserSettings;
}

export type SettingsResponse =
  | { readonly ok: true; readonly settings: UserSettings }
  | { readonly ok: false; readonly error: PlaybackError };

export interface VoiceListRequest {
  readonly type: "softspoken.voices.request";
}

export type VoiceListResponse =
  | {
      readonly ok: true;
      readonly voices: readonly VoiceOption[];
      readonly unavailableVoiceId?: string;
    }
  | { readonly ok: false; readonly error: PlaybackError };

export interface VoiceListChangedMessage {
  readonly type: "softspoken.voices.changed";
  readonly target: "popup";
  readonly voices: readonly VoiceOption[];
  readonly unavailableVoiceId?: string;
}

export interface VoicePreviewRequest {
  readonly type: "softspoken.voices.preview-request";
  readonly settings: UserSettings;
}

export type PlaybackProgressResponse =
  | { readonly ok: true; readonly progress?: PlaybackProgressRecord }
  | { readonly ok: false; readonly error: PlaybackError };

export interface ResumeArticleRequest {
  readonly type: "softspoken.playback.resume-article-request";
  readonly article: ExtractedArticle;
}

interface SpeechStartRequestBase {
  readonly type: "softspoken.speech.start";
  readonly target: "offscreen";
  readonly chunks: readonly SpeechChunk[];
  readonly speed: SpeechSpeed;
  readonly pitch: SpeechPitch;
  readonly startParagraphIndex?: number;
  readonly startSentenceIndex?: number;
  readonly selectedVoiceId?: string;
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

export interface SpeechPitchRequest {
  readonly type: "softspoken.speech.pitch";
  readonly target: "offscreen";
  readonly pitch: SpeechPitch;
}

export interface SpeechVoiceRequest {
  readonly type: "softspoken.speech.voice";
  readonly target: "offscreen";
  readonly selectedVoiceId?: string;
}

export interface SpeechVoicesRequest {
  readonly type: "softspoken.speech.voices";
  readonly target: "offscreen";
  readonly preferredVoiceId?: string;
}

export interface SpeechPreviewRequest {
  readonly type: "softspoken.speech.preview";
  readonly target: "offscreen";
  readonly settings: UserSettings;
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

export interface PlaybackCheckpointMessage {
  readonly type: "softspoken.playback.checkpoint";
  readonly target: "background";
  readonly state: PlaybackState;
}

export type PlaybackResponse =
  | { readonly ok: true; readonly state: PlaybackState }
  | { readonly ok: false; readonly error: PlaybackError };

export type PopupPlaybackRequest =
  | ListenToSelectionRequest
  | ListenToArticleRequest
  | ResumeArticleRequest
  | PlaybackCommandRequest
  | PlaybackSpeedRequest
  | PlaybackPitchRequest
  | PlaybackVoiceRequest
  | PlaybackStateRequest
  | PlaybackProgressRequest
  | SettingsRequest
  | SettingsUpdateRequest
  | VoiceListRequest
  | VoicePreviewRequest;

export type OffscreenSpeechRequest =
  | SpeechStartRequest
  | SpeechRestoreRequest
  | SpeechCommandRequest
  | SpeechSpeedRequest
  | SpeechPitchRequest
  | SpeechVoiceRequest
  | SpeechStateRequest;

export type OffscreenVoiceRequest = SpeechVoicesRequest | SpeechPreviewRequest;

export type SoftSpokenMessage =
  | PageInformationRequest
  | SelectionTextRequest
  | ArticleLoadRequest
  | ArticleExtractionRequest
  | PopupPlaybackRequest
  | OffscreenSpeechRequest
  | OffscreenVoiceRequest
  | PlaybackCheckpointMessage
  | PlaybackStateChangedMessage
  | VoiceListChangedMessage;

export type SoftSpokenMessageType = SoftSpokenMessage["type"];
