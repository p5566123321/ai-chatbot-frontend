import type { Locale } from "./config";

// Flat dotted keys. `en` is the source of truth for the key set; `zh` is checked against it
// by the `satisfies` below, so a missing or misspelled translation key is a compile error.
// Interpolation: use `{name}` placeholders and pass `t(key, { name: "…" })`.
const en = {
  "meta.title": "AI Chatbot",
  "meta.description": "A chatbot with retrieval-augmented generation (RAG) over your documents",

  "common.email": "Email",
  "common.password": "Password",
  "common.loading": "Loading…",
  "common.cancel": "Cancel",
  "common.retry": "Retry",
  "common.save": "Save",
  "common.saving": "Saving…",
  "common.saved": "Saved",
  "common.saveFailed": "Failed to save",

  "lang.switcherLabel": "Language",
  "lang.en": "English",
  "lang.zh": "中文",

  "nav.chat": "Chat",
  "nav.documents": "Documents",
  "nav.settings": "Settings",
  "action.logout": "Log out",

  "page.chat.title": "Chatbot",
  "page.documents.title": "Documents",
  "page.settings.title": "Settings",

  "chat.empty.prefix": "Type a message to start chatting, or upload files under ",
  "chat.empty.link": "Documents",
  "chat.empty.suffix": " to help answer your questions.",
  "chat.thinking": "Thinking…",
  "chat.inputPlaceholder": "Type a message… (Enter to send, Shift+Enter for a new line)",
  "chat.send": "Send",
  "chat.streamInterrupted": "\n\n⚠️ The stream was interrupted, please try again later.",
  "chat.error": "⚠️ Something went wrong, please try again later.",

  "login.title": "Sign in to the chatbot",
  "login.submit": "Sign in",
  "login.submitting": "Signing in…",
  "login.noAccount": "Don't have an account?",
  "login.registerLink": "Register",
  "login.errorInvalid": "Incorrect email or password",
  "login.errorGeneric": "Sign-in failed, please try again later",

  "register.title": "Create an account",
  "register.confirmPassword": "Confirm password",
  "register.passwordHint": "At least 8 characters",
  "register.submit": "Register",
  "register.submitting": "Registering…",
  "register.haveAccount": "Already have an account?",
  "register.loginLink": "Sign in",
  "register.errorPasswordMismatch": "The passwords don't match",
  "register.errorEmailTaken": "This email is already registered",
  "register.errorGeneric": "Registration failed, please try again later",

  "settings.gemini.title": "Gemini model parameters",
  "settings.gemini.desc":
    "Empty fields use Gemini's defaults. These settings apply to every message you send afterwards.",
  "settings.model.useDefault": "Use default",
  "settings.systemInstruction.placeholder": "e.g. Answer concisely in English",
  "settings.loadError": "Failed to load settings, please refresh",

  "settings.apiKey.title": "Gemini API key (bring your own)",
  "settings.apiKey.desc":
    "Once set, your messages call Gemini with this key instead of the system default. The key is stored encrypted and is never shown again in plaintext.",
  "settings.apiKey.statusLabel": "Current status: ",
  "settings.apiKey.statusSet": "Set",
  "settings.apiKey.statusUnset": "Not set",
  "settings.apiKey.placeholderReplace": "Enter a new key to replace the current one",
  "settings.apiKey.placeholderNew": "Paste your Gemini API key",
  "settings.apiKey.processing": "Processing…",
  "settings.apiKey.clear": "Clear",
  "settings.apiKey.clearFailed": "Failed to clear",

  "settings.history.title": "Conversation history length",
  "settings.history.desc":
    "The maximum number of past messages included as context in each reply. Leave empty to use the system default.",
  "settings.history.fieldLabel": "Number of history messages (1–100)",
  "settings.history.placeholder": "Use system default",
  "settings.history.useDefault": "Use default",

  "documents.upload.title": "Upload documents",
  "documents.upload.desc":
    "Uploaded documents are automatically chunked and indexed, and are used to help answer your questions in chat.",
  "documents.list.title": "Uploaded documents",

  "upload.uploading": "Uploading…",
  "upload.failed": "Upload failed",
  "upload.success": "Uploaded “{name}”",

  "doc.status.PENDING": "Waiting",
  "doc.status.PROCESSING": "Processing",
  "doc.status.READY": "Ready",
  "doc.status.FAILED": "Failed",
  "doc.chunks": "{count} chunks",
  "doc.loadError": "Failed to load documents",
  "doc.empty": "No documents yet — upload files to enhance chat answers.",
  "doc.delete": "Delete",
  "doc.deleting": "Deleting…",
  "doc.confirmDelete": "Confirm delete",
  "doc.deleteAria": "Delete {title}",
  "doc.deleteFailed": "Failed to delete",

  "rag.label": "RAG retrieval",
  "rag.aria": "Toggle whether chat uses RAG retrieval",

  "embedding.label": "Message embedding",
  "embedding.aria": "Toggle chat message embedding",
} as const;

const zh = {
  "meta.title": "AI 聊天機器人",
  "meta.description": "支援文件檢索增強（RAG）的聊天機器人",

  "common.email": "電子郵件",
  "common.password": "密碼",
  "common.loading": "載入中…",
  "common.cancel": "取消",
  "common.retry": "重試",
  "common.save": "儲存",
  "common.saving": "儲存中…",
  "common.saved": "已儲存",
  "common.saveFailed": "儲存失敗",

  "lang.switcherLabel": "語言",
  "lang.en": "English",
  "lang.zh": "中文",

  "nav.chat": "聊天",
  "nav.documents": "文件管理",
  "nav.settings": "設定",
  "action.logout": "登出",

  "page.chat.title": "聊天機器人",
  "page.documents.title": "文件管理",
  "page.settings.title": "設定",

  "chat.empty.prefix": "輸入訊息開始對話吧，或先到「",
  "chat.empty.link": "文件管理",
  "chat.empty.suffix": "」上傳文件來輔助回答",
  "chat.thinking": "思考中…",
  "chat.inputPlaceholder": "輸入訊息…（Enter 送出，Shift+Enter 換行）",
  "chat.send": "送出",
  "chat.streamInterrupted": "\n\n⚠️ 串流中斷，請稍後再試。",
  "chat.error": "⚠️ 發生錯誤，請稍後再試。",

  "login.title": "登入聊天機器人",
  "login.submit": "登入",
  "login.submitting": "登入中…",
  "login.noAccount": "還沒有帳號？",
  "login.registerLink": "註冊",
  "login.errorInvalid": "帳號或密碼錯誤",
  "login.errorGeneric": "登入失敗，請稍後再試",

  "register.title": "註冊新帳號",
  "register.confirmPassword": "確認密碼",
  "register.passwordHint": "至少 8 個字元",
  "register.submit": "註冊",
  "register.submitting": "註冊中…",
  "register.haveAccount": "已經有帳號了？",
  "register.loginLink": "登入",
  "register.errorPasswordMismatch": "兩次輸入的密碼不一致",
  "register.errorEmailTaken": "這個電子郵件已經被註冊過了",
  "register.errorGeneric": "註冊失敗，請稍後再試",

  "settings.gemini.title": "Gemini 模型參數",
  "settings.gemini.desc":
    "留空的欄位會使用 Gemini 預設值。這些設定套用在你之後傳送的每一則訊息。",
  "settings.model.useDefault": "使用預設",
  "settings.systemInstruction.placeholder": "例如：請用繁體中文簡潔回答",
  "settings.loadError": "載入設定失敗，請重新整理",

  "settings.apiKey.title": "Gemini API Key（自帶金鑰）",
  "settings.apiKey.desc":
    "設定後，你的訊息會改用這把金鑰呼叫 Gemini，而不是系統預設的金鑰。金鑰只會加密儲存，儲存後不會再顯示明文。",
  "settings.apiKey.statusLabel": "目前狀態：",
  "settings.apiKey.statusSet": "已設定",
  "settings.apiKey.statusUnset": "尚未設定",
  "settings.apiKey.placeholderReplace": "輸入新金鑰以取代目前設定",
  "settings.apiKey.placeholderNew": "貼上你的 Gemini API key",
  "settings.apiKey.processing": "處理中…",
  "settings.apiKey.clear": "清除",
  "settings.apiKey.clearFailed": "清除失敗",

  "settings.history.title": "對話歷史筆數",
  "settings.history.desc":
    "每次回覆時，最多帶入幾則過去的訊息當作上下文。留空則使用系統預設值。",
  "settings.history.fieldLabel": "歷史訊息筆數（1–100）",
  "settings.history.placeholder": "使用系統預設",
  "settings.history.useDefault": "使用預設",

  "documents.upload.title": "上傳文件",
  "documents.upload.desc":
    "上傳的文件會自動切片並建立索引，聊天時會用來輔助回答你的問題。",
  "documents.list.title": "已上傳的文件",

  "upload.uploading": "上傳中…",
  "upload.failed": "上傳失敗",
  "upload.success": "已上傳「{name}」",

  "doc.status.PENDING": "等待處理",
  "doc.status.PROCESSING": "處理中",
  "doc.status.READY": "已就緒",
  "doc.status.FAILED": "處理失敗",
  "doc.chunks": "{count} 個片段",
  "doc.loadError": "文件載入失敗",
  "doc.empty": "尚無文件，上傳文件後即可用於增強聊天回答",
  "doc.delete": "刪除",
  "doc.deleting": "刪除中…",
  "doc.confirmDelete": "確定刪除",
  "doc.deleteAria": "刪除 {title}",
  "doc.deleteFailed": "刪除失敗",

  "rag.label": "RAG 檢索",
  "rag.aria": "切換聊天時是否使用 RAG 檢索",

  "embedding.label": "訊息向量化",
  "embedding.aria": "切換聊天訊息向量化",
} as const satisfies Record<keyof typeof en, string>;

export type MessageKey = keyof typeof en;

export const messages: Record<Locale, Record<MessageKey, string>> = { en, zh };
