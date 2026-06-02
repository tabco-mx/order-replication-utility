import type { ConfigRepo, GetLinkedAndOpenOrdersResult } from "@app/shared";
import type { Logger } from "pino";
import type { createRemoteApiService } from "../remote-api/services/remote-api.service.js";
import type { createWansoftService } from "../wansoft/services/wansoft.service.js";

export type WorkerLogger = Logger;
export type GetOrCreateConfig = ConfigRepo["getOrCreateConfig"];
export type RemoteApiService = ReturnType<typeof createRemoteApiService>;
export type WansoftService = ReturnType<typeof createWansoftService>;
export type LinkedOrder = GetLinkedAndOpenOrdersResult["data"][number];
