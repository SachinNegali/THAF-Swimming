# Frontend Implementation Prompt: React Native Background Image Upload with SSE

## Context & Current State

We have a React Native messaging app with a Node.js backend. There is **no end-to-end encryption** — images are uploaded as-is (plaintext). The backend is being updated to:

- Accept **presigned S3 URLs** — the client uploads directly to S3, not through the Node.js server
- Process images server-side (thumbnails, optimized versions via sharp)
- Push **SSE notifications** when processing completes
- Support **idempotent uploads** via client-generated UUIDs

The client is responsible for: picking images, requesting presigned URLs, uploading to S3 via OS-level background uploader, calling `/complete`, and handling SSE status events.

---

## Detailed Implementation Requirements

### 1. Required Dependencies

```bash
# OS-level background uploader — delegates HTTP PUT to NSURLSession (iOS) / WorkManager (Android)
# This is what makes uploads survive app kills
npm install react-native-background-upload

# UUID generation for imageId and messageId
npm install uuid

# SSE client (React Native doesn't have native EventSource)
npm install react-native-sse

# File system access (to get file size, check if file exists, clean up temp files)
npm install react-native-fs

# Local persistence for upload state tracking — pick ONE based on your stack:
# Option A: Fast key-value store (recommended if you don't already have a local DB)
npm install react-native-mmkv
# Option B: If you already use SQLite, WatermelonDB, or Realm, use that instead

# Image picker (keep what you already have, or use one of these)
npm install react-native-image-crop-picker
# OR: npm install @react-native-camera-roll/camera-roll + expo-image-picker
```

**iOS setup:**

1. In `Info.plist`, add background modes:
   ```xml
   <key>UIBackgroundModes</key>
   <array>
     <string>fetch</string>
     <string>processing</string>
   </array>
   ```

2. In Xcode, create an **App Group** (e.g., `group.com.yourapp.uploads`). Add it to your main app target. This lets the OS-level background upload session communicate results back to your app even after it's been killed and relaunched.

3. Run `npx pod-install`.

**Android setup:**

1. In `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
   ```

2. `react-native-background-upload` handles WorkManager registration automatically.

---

### 2. Upload State Persistence Layer

**Why this exists:** When the app is killed mid-upload, the OS continues the HTTP PUT. When the user reopens the app, it needs to know: which uploads were in flight, which completed while the app was dead, and which failed. This state must survive app restarts — React state/context/Redux don't.

**Schema for local upload records:**

```
{
  imageId: string,           // UUID, generated before upload starts — this is the idempotency key
  messageId: string,         // UUID of the parent message
  chatId: string,            // The chat/group this belongs to
  localUri: string,          // file:// path to the original image on device
  s3Key: string | null,      // Returned by /init endpoint
  status: 'queued' | 'requesting-url' | 'uploading' | 'completing' | 'completed' | 'failed',
  backgroundUploadId: string | null,  // ID from react-native-background-upload
  presignedUrl: string | null,
  thumbnailUrl: string | null,        // Set when server confirms completion
  optimizedUrl: string | null,        // Set when server confirms completion
  width: number | null,               // Original dimensions, set on completion
  height: number | null,
  retryCount: number,
  createdAt: number,          // timestamp
  error: string | null,
}
```

**If using MMKV (recommended for simplicity):**

```javascript
// stores/uploadStore.js
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'upload-state' });

export function saveUpload(record) {
  storage.set(`upload:${record.imageId}`, JSON.stringify(record));

  // Also maintain a message-level index for quick lookups
  const indexKey = `msg-index:${record.messageId}`;
  const existing = JSON.parse(storage.getString(indexKey) || '[]');
  if (!existing.includes(record.imageId)) {
    existing.push(record.imageId);
    storage.set(indexKey, JSON.stringify(existing));
  }
}

export function getUpload(imageId) {
  const raw = storage.getString(`upload:${imageId}`);
  return raw ? JSON.parse(raw) : null;
}

export function updateUpload(imageId, updates) {
  const existing = getUpload(imageId);
  if (!existing) return null;
  const updated = { ...existing, ...updates };
  storage.set(`upload:${imageId}`, JSON.stringify(updated));
  return updated;
}

export function getUploadsByStatus(statuses) {
  const allKeys = storage.getAllKeys().filter(k => k.startsWith('upload:'));
  return allKeys
    .map(k => JSON.parse(storage.getString(k)))
    .filter(r => statuses.includes(r.status));
}

export function getUploadsByMessage(messageId) {
  const indexKey = `msg-index:${messageId}`;
  const imageIds = JSON.parse(storage.getString(indexKey) || '[]');
  return imageIds.map(id => getUpload(id)).filter(Boolean);
}

export function deleteUpload(imageId) {
  storage.delete(`upload:${imageId}`);
}
```

**Critical rule: Always write to this store BEFORE starting any network call.** If the app is killed right after, the record must exist so reconciliation can find it.

---

### 3. Core Upload Flow (Step by Step)

#### Step 3.1: User Picks Images and Taps Send

```javascript
import { v4 as uuidv4 } from 'uuid';
import RNFS from 'react-native-fs';
import { saveUpload } from '../stores/uploadStore';

async function handleSendWithImages(chatId, selectedImages, messageText) {
  const messageId = uuidv4();

  // 1. Create local upload records for each image FIRST (before any network call)
  const uploadRecords = await Promise.all(
    selectedImages.map(async (image) => {
      const imageId = uuidv4();
      const fileSize = image.size || (await RNFS.stat(image.path)).size;

      const record = {
        imageId,
        messageId,
        chatId,
        localUri: image.path,         // file:// URI from the image picker
        s3Key: null,
        status: 'queued',
        backgroundUploadId: null,
        presignedUrl: null,
        thumbnailUrl: null,
        optimizedUrl: null,
        width: image.width || null,
        height: image.height || null,
        retryCount: 0,
        createdAt: Date.now(),
        error: null,
        mimeType: image.mime || 'image/jpeg',
        sizeBytes: fileSize,
      };

      saveUpload(record);
      return record;
    })
  );

  // 2. Display the message in the chat immediately (optimistic UI)
  addMessageToChat({
    id: messageId,
    chatId,
    text: messageText,
    images: uploadRecords.map((r) => ({
      imageId: r.imageId,
      localUri: r.localUri,
      status: 'queued',
      width: r.width,
      height: r.height,
    })),
    status: 'sending',
    createdAt: Date.now(),
  });

  // 3. Start the upload pipeline
  await processUploadQueue(uploadRecords);
}
```

#### Step 3.2: Request Presigned URLs

```javascript
async function processUploadQueue(uploads) {
  const CONCURRENCY = 3;
  const chunks = chunkArray(uploads, CONCURRENCY);

  for (const chunk of chunks) {
    await Promise.all(chunk.map(requestPresignedUrlAndUpload));
  }
}

async function requestPresignedUrlAndUpload(upload) {
  try {
    updateUpload(upload.imageId, { status: 'requesting-url' });

    const response = await api.post('/v1/media/upload/init', {
      chatId: upload.chatId,
      messageId: upload.messageId,
      imageId: upload.imageId,
      mimeType: upload.mimeType,
      sizeBytes: upload.sizeBytes,
    });

    const data = response.data.data;

    // Server says it's already done (idempotent retry)
    if (data.alreadyComplete) {
      updateUpload(upload.imageId, {
        status: 'completed',
        thumbnailUrl: data.thumbnailUrl,
        optimizedUrl: data.optimizedUrl,
      });
      updateMessageImageStatus(upload.messageId, upload.imageId, 'completed', {
        thumbnailUrl: data.thumbnailUrl,
        optimizedUrl: data.optimizedUrl,
      });
      return;
    }

    // Store presigned URL and proceed to background upload
    updateUpload(upload.imageId, {
      presignedUrl: data.presignedUrl,
      s3Key: data.s3Key,
    });

    await startBackgroundUpload({
      ...upload,
      presignedUrl: data.presignedUrl,
      s3Key: data.s3Key,
    });

  } catch (error) {
    updateUpload(upload.imageId, {
      status: 'failed',
      error: error.message,
    });
    updateMessageImageStatus(upload.messageId, upload.imageId, 'failed');
  }
}
```

#### Step 3.3: Start OS-Level Background Upload

```javascript
import Upload from 'react-native-background-upload';

async function startBackgroundUpload(upload) {
  const options = {
    url: upload.presignedUrl,
    path: upload.localUri,      // Must be a file path the OS can read
    method: 'PUT',
    type: 'raw',                // Send raw bytes, NOT multipart form
    headers: {
      'Content-Type': upload.mimeType,
    },
    notification: {
      enabled: true,
      title: 'Sending image...',
      text: 'Upload in progress',
    },
    // iOS: allows uploads to continue after app kill
    appGroup: 'group.com.yourapp.uploads',
  };

  const uploadId = await Upload.startUpload(options);

  // IMMEDIATELY persist the uploadId before anything else happens
  updateUpload(upload.imageId, {
    backgroundUploadId: uploadId,
    status: 'uploading',
  });
  updateMessageImageStatus(upload.messageId, upload.imageId, 'uploading');
}
```

#### Step 3.4: Register Upload Listeners (once at app startup)

**Call this ONCE in your app initialization, not per upload:**

```javascript
function registerBackgroundUploadListeners() {

  // ── Progress ──
  Upload.addListener('progress', null, (data) => {
    // data.id = backgroundUploadId, data.progress = 0-100
    // Emit to UI for progress bar updates
    uploadProgressEmitter.emit(`progress:${data.id}`, data.progress);
  });

  // ── Upload completed (S3 responded) ──
  Upload.addListener('completed', null, async (data) => {
    // Find which of our uploads this corresponds to
    const upload = findUploadByBackgroundId(data.id);
    if (!upload) return;

    if (data.responseCode >= 200 && data.responseCode < 300) {
      // S3 accepted the file — now tell OUR backend
      updateUpload(upload.imageId, { status: 'completing' });
      await callCompleteEndpoint(upload);
    } else {
      // S3 rejected it (expired URL, wrong content type, etc.)
      updateUpload(upload.imageId, {
        status: 'failed',
        error: `S3 returned ${data.responseCode}`,
      });
      updateMessageImageStatus(upload.messageId, upload.imageId, 'failed');
    }
  });

  // ── Upload error (network, timeout, etc.) ──
  Upload.addListener('error', null, async (data) => {
    const upload = findUploadByBackgroundId(data.id);
    if (!upload) return;

    updateUpload(upload.imageId, {
      status: 'failed',
      error: data.error,
      retryCount: (upload.retryCount || 0) + 1,
    });
    updateMessageImageStatus(upload.messageId, upload.imageId, 'failed');
  });

  // ── Upload cancelled ──
  Upload.addListener('cancelled', null, async (data) => {
    const upload = findUploadByBackgroundId(data.id);
    if (upload) {
      updateUpload(upload.imageId, { status: 'failed', error: 'cancelled' });
    }
  });
}

// Helper: find upload record by background upload ID
function findUploadByBackgroundId(bgId) {
  // MMKV doesn't support querying by field, so we scan
  // For better perf, maintain a reverse index: bgId → imageId
  const allUploads = getUploadsByStatus(['uploading', 'completing']);
  return allUploads.find((u) => u.backgroundUploadId === bgId);
}
```

#### Step 3.5: Call /complete After S3 Upload Succeeds

```javascript
async function callCompleteEndpoint(upload) {
  try {
    const response = await api.post('/v1/media/upload/complete', {
      imageId: upload.imageId,
    });

    if (response.data.success) {
      const result = response.data.data;

      if (result.status === 'completed') {
        // Already processed (fast path — unlikely but possible)
        updateUpload(upload.imageId, {
          status: 'completed',
          thumbnailUrl: result.thumbnailUrl,
          optimizedUrl: result.optimizedUrl,
        });
        updateMessageImageStatus(upload.messageId, upload.imageId, 'completed', {
          thumbnailUrl: result.thumbnailUrl,
          optimizedUrl: result.optimizedUrl,
        });
      } else {
        // status === 'processing' — server is generating thumbnails
        // SSE will notify us when it's done
        updateUpload(upload.imageId, { status: 'completing' });
        updateMessageImageStatus(upload.messageId, upload.imageId, 'processing');
      }
    }
  } catch (error) {
    // /complete failed, but the file IS in S3.
    // Don't mark as 'failed' — mark as 'uploading' so reconciliation retries /complete.
    // The server's reconciliation cron will also catch this.
    updateUpload(upload.imageId, {
      status: 'uploading',
      error: 'complete_call_failed: ' + error.message,
    });
  }
}
```

---

### 4. SSE Integration

#### 4.1 SSE Connection Manager (Singleton)

```javascript
// services/sse/SSEManager.js
import EventSource from 'react-native-sse';

class SSEManager {
  constructor() {
    this.es = null;
    this.listeners = new Map();   // eventType → Set<callback>
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 30000;
    this.authToken = null;
  }

  connect(authToken) {
    this.authToken = authToken;
    if (this.es) this.disconnect();

    this.es = new EventSource(`${API_BASE_URL}/v1/events`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    this.es.addEventListener('open', () => {
      this.reconnectAttempts = 0;
      // Reconcile on every reconnect
      reconcilePendingUploads();
    });

    // ── Upload status events ──
    this.es.addEventListener('upload:status', (event) => {
      const data = JSON.parse(event.data);
      this._emit('upload:status', data);
    });

    // ── All media ready for a message (notifies recipients, not sender) ──
    this.es.addEventListener('message:media-ready', (event) => {
      const data = JSON.parse(event.data);
      this._emit('message:media-ready', data);
    });

    this.es.addEventListener('error', () => {
      this._scheduleReconnect();
    });
  }

  disconnect() {
    if (this.es) {
      this.es.close();
      this.es = null;
    }
  }

  on(eventType, callback) {
    if (!this.listeners.has(eventType)) this.listeners.set(eventType, new Set());
    this.listeners.get(eventType).add(callback);
    // Return unsubscribe function
    return () => this.listeners.get(eventType)?.delete(callback);
  }

  _emit(eventType, data) {
    this.listeners.get(eventType)?.forEach((cb) => cb(data));
  }

  _scheduleReconnect() {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;
    setTimeout(() => {
      if (this.authToken) this.connect(this.authToken);
    }, delay);
  }
}

export const sseManager = new SSEManager();
```

**Where to connect/disconnect:**
- **Connect:** after login / token refresh / app comes to foreground with valid session
- **Disconnect:** on logout
- **Reconnect:** automatic (exponential backoff in the manager)

#### 4.2 Consuming SSE Events in Chat UI

Use a hook in your chat screen or message store:

```javascript
import { useEffect } from 'react';
import { sseManager } from '../services/sse/SSEManager';

export function useUploadSSE() {
  useEffect(() => {
    const unsubUpload = sseManager.on('upload:status', (data) => {
      // data: { imageId, messageId, chatId, status, thumbnailUrl, optimizedUrl, width, height, allImagesComplete }

      if (data.status === 'completed') {
        // Update local persistence
        updateUpload(data.imageId, {
          status: 'completed',
          thumbnailUrl: data.thumbnailUrl,
          optimizedUrl: data.optimizedUrl,
          width: data.width,
          height: data.height,
        });
        // Update message in chat UI — swap local thumbnail for server URL
        updateMessageImageStatus(data.messageId, data.imageId, 'completed', {
          thumbnailUrl: data.thumbnailUrl,
          optimizedUrl: data.optimizedUrl,
          width: data.width,
          height: data.height,
        });
      }

      if (data.status === 'failed') {
        updateUpload(data.imageId, { status: 'failed' });
        updateMessageImageStatus(data.messageId, data.imageId, 'failed');
      }

      if (data.allImagesComplete) {
        // All images for this message are done — update message status
        updateMessageStatus(data.messageId, 'sent');
      }
    });

    const unsubMediaReady = sseManager.on('message:media-ready', (data) => {
      // Another participant's images are ready — refresh the message
      refreshMessageFromServer(data.messageId);
    });

    return () => {
      unsubUpload();
      unsubMediaReady();
    };
  }, []);
}
```

---

### 5. Optimistic UI

When the user sends a message with images, render it immediately in the chat with local URIs:

```
┌─────────────────────────────────────┐
│  [Image 1]                          │
│  ████████████░░░░░░░  72%           │  ← uploading (progress from background listener)
│                                     │
│  [Image 2]                          │
│  ⟳ Processing...                    │  ← S3 upload done, server is generating thumbnail
│                                     │
│  [Image 3]                          │
│  ✓ Done                             │  ← completed
│                                     │
│  "Check out these photos!"          │
│  10:42 AM · Sending...              │
└─────────────────────────────────────┘
```

**Per-image status display:**

| Local Status | UI | Source of Truth |
|---|---|---|
| `queued` | Thumbnail + "Waiting..." | Local store |
| `requesting-url` | Thumbnail + "Preparing..." | Local store |
| `uploading` | Thumbnail + progress bar (0-100%) | Background upload progress listener |
| `completing` / `processing` | Thumbnail + "Processing..." | REST response from /complete |
| `completed` | Image (swap to CDN `thumbnailUrl` for list, `optimizedUrl` for full view) | SSE event or REST |
| `failed` | Thumbnail + error icon + "Tap to retry" | Local store |

**Image source priority:**
1. While uploading/processing: show the **local file URI** (the image picker returns this)
2. After completion: show the **thumbnailUrl** in chat list view, **optimizedUrl** when the user taps to view full size
3. The local file is kept until cleanup (see Section 8)

**Progress hook example:**

```javascript
import { useState, useEffect } from 'react';

export function useUploadProgress(backgroundUploadId) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!backgroundUploadId) return;

    const handler = (p) => setProgress(p);
    uploadProgressEmitter.addListener(`progress:${backgroundUploadId}`, handler);

    return () => uploadProgressEmitter.removeListener(`progress:${backgroundUploadId}`, handler);
  }, [backgroundUploadId]);

  return progress;
}
```

---

### 6. App Relaunch Reconciliation

This is the critical reliability mechanism. Run on every app launch and SSE reconnect.

```javascript
async function reconcilePendingUploads() {
  // 1. Get all non-completed uploads from local store
  const pending = getUploadsByStatus([
    'queued', 'requesting-url', 'uploading', 'completing', 'failed'
  ]);

  if (pending.length === 0) return;

  // 2. Batch-check server status
  const imageIds = pending.map((u) => u.imageId);
  let serverStatuses;
  try {
    const response = await api.post('/v1/media/upload/status/batch', { imageIds });
    serverStatuses = response.data.data;
  } catch (error) {
    console.warn('[reconcile] Server unreachable, will retry on next foreground');
    return;
  }

  // 3. Reconcile each upload
  for (const upload of pending) {
    const server = serverStatuses[upload.imageId];

    // ── Server says completed ──
    if (server?.status === 'completed') {
      updateUpload(upload.imageId, {
        status: 'completed',
        thumbnailUrl: server.thumbnailUrl,
        optimizedUrl: server.optimizedUrl,
        width: server.width,
        height: server.height,
      });
      updateMessageImageStatus(upload.messageId, upload.imageId, 'completed', {
        thumbnailUrl: server.thumbnailUrl,
        optimizedUrl: server.optimizedUrl,
      });
      continue;
    }

    // ── Server says processing ──
    if (server?.status === 'processing' || server?.status === 'uploaded') {
      // Server has the file — just wait for SSE notification
      updateUpload(upload.imageId, { status: 'completing' });
      continue;
    }

    // ── Server doesn't have it, or it failed ── handle by local status:
    switch (upload.status) {
      case 'queued':
      case 'requesting-url':
        // Never got a presigned URL — restart from scratch
        await restartUploadFromScratch(upload);
        break;

      case 'uploading':
        // Started upload but don't know if it reached S3
        // The presigned URL may have expired — safest to restart
        if (await fileExistsOnDevice(upload.localUri)) {
          await restartUploadFromScratch(upload);
        } else {
          markPermanentlyFailed(upload, 'local_file_deleted');
        }
        break;

      case 'completing':
        // File reached S3 but /complete wasn't called (or server hasn't processed yet)
        await callCompleteEndpoint(upload);
        break;

      case 'failed':
        // Previously failed — retry if file still exists and under max retries
        if (upload.retryCount < 5 && await fileExistsOnDevice(upload.localUri)) {
          await restartUploadFromScratch(upload);
        }
        // Else: leave as failed, user can tap retry manually
        break;
    }
  }
}

async function restartUploadFromScratch(upload) {
  try {
    const fileSize = (await RNFS.stat(upload.localUri)).size;

    const response = await api.post('/v1/media/upload/init', {
      chatId: upload.chatId,
      messageId: upload.messageId,
      imageId: upload.imageId,          // same imageId = server deduplicates
      mimeType: upload.mimeType,
      sizeBytes: fileSize,
    });

    const data = response.data.data;

    if (data.alreadyComplete) {
      updateUpload(upload.imageId, {
        status: 'completed',
        thumbnailUrl: data.thumbnailUrl,
        optimizedUrl: data.optimizedUrl,
      });
      return;
    }

    updateUpload(upload.imageId, {
      presignedUrl: data.presignedUrl,
      s3Key: data.s3Key,
      retryCount: (upload.retryCount || 0) + 1,
    });

    await startBackgroundUpload({
      ...upload,
      presignedUrl: data.presignedUrl,
    });
  } catch (error) {
    updateUpload(upload.imageId, { status: 'failed', error: error.message });
  }
}

async function fileExistsOnDevice(uri) {
  try {
    return await RNFS.exists(uri);
  } catch {
    return false;
  }
}

function markPermanentlyFailed(upload, reason) {
  updateUpload(upload.imageId, { status: 'failed', error: reason });
  updateMessageImageStatus(upload.messageId, upload.imageId, 'failed');
}
```

**When to call `reconcilePendingUploads()`:**

```javascript
import { AppState } from 'react-native';

// 1. On app launch — in root component
useEffect(() => {
  registerBackgroundUploadListeners();   // Section 3.4
  reconcilePendingUploads();
}, []);

// 2. On app foreground
useEffect(() => {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      reconcilePendingUploads();
    }
  });
  return () => sub.remove();
}, []);

// 3. On SSE reconnect — handled inside SSEManager.connect() 'open' handler
```

---

### 7. Retry UI for Failed Uploads

When an upload fails permanently, show actionable UI:

```javascript
function FailedImageOverlay({ upload, onRetry, onRemove }) {
  return (
    <View style={styles.overlay}>
      <Icon name="alert-circle" color="red" />
      <Text>Upload failed</Text>
      <View style={styles.actions}>
        <TouchableOpacity onPress={() => onRetry(upload)}>
          <Text>Retry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onRemove(upload)}>
          <Text>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

**Retry handler:**

```javascript
async function handleRetry(upload) {
  if (await fileExistsOnDevice(upload.localUri)) {
    await restartUploadFromScratch(upload);
  } else {
    // Original file is gone (gallery cleaned, app cache cleared)
    // User needs to re-select the image
    Alert.alert(
      'Image unavailable',
      'The original image is no longer on your device. Please select it again.',
      [{ text: 'OK' }]
    );
    // Optionally remove the image from the message
  }
}
```

---

### 8. Temp File Cleanup

Image picker URIs usually point to the device gallery or a cache copy. The gallery images don't need cleanup, but if your picker creates temp copies, clean them up:

```javascript
async function cleanupCompletedUploads() {
  const completed = getUploadsByStatus(['completed']);
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;

  for (const upload of completed) {
    if (upload.createdAt < oneDayAgo) {
      // Only delete if it's a temp/cache file, not a gallery file
      if (upload.localUri.includes('cache') || upload.localUri.includes('tmp')) {
        try { await RNFS.unlink(upload.localUri); } catch {}
      }
      deleteUpload(upload.imageId);
    }
  }
}

// Run on app launch, after reconciliation
```

---

### 9. Network-Aware Behavior (Optional)

```javascript
import NetInfo from '@react-native-community/netinfo';

async function shouldStartUpload() {
  const state = await NetInfo.fetch();

  if (!state.isConnected) return false;

  // Optional: respect user preference for Wi-Fi-only uploads
  if (userSettings.wifiOnlyUploads && state.type !== 'wifi') return false;

  return true;
}

// Also: listen for network changes and trigger reconciliation
NetInfo.addEventListener((state) => {
  if (state.isConnected) {
    reconcilePendingUploads();
  }
});
```

---

### 10. Concurrency Control

When 10 images are selected, don't blast 10 parallel requests:

```javascript
async function processUploadQueue(uploads) {
  const CONCURRENT_PRESIGN_REQUESTS = 3;
  const chunks = chunkArray(uploads, CONCURRENT_PRESIGN_REQUESTS);

  for (const chunk of chunks) {
    await Promise.all(chunk.map(requestPresignedUrlAndUpload));
  }

  // Note: react-native-background-upload hands off to the OS,
  // which manages its own concurrency. Starting all background uploads
  // is fine — the OS queues them internally.
}

function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}
```

---

### 11. File Structure

```
src/
├── services/
│   ├── upload/
│   │   ├── UploadManager.js          ← Orchestrator: handleSendWithImages, processUploadQueue
│   │   ├── BackgroundUploader.js     ← react-native-background-upload wrapper + listener registration
│   │   ├── UploadReconciler.js       ← reconcilePendingUploads + restartUploadFromScratch
│   │   └── UploadCleanup.js          ← Temp file cleanup
│   ├── sse/
│   │   └── SSEManager.js             ← Singleton SSE connection
│   └── api/
│       └── mediaApi.js               ← /init, /complete, /status/batch API calls
├── stores/
│   └── uploadStore.js                ← MMKV persistence layer
├── hooks/
│   ├── useUploadProgress.js          ← Per-image progress bar hook
│   └── useUploadSSE.js               ← SSE event subscription hook
├── components/
│   └── chat/
│       ├── MessageBubble.js          ← Renders message with image upload states
│       ├── ImageUploadThumbnail.js   ← Single image with progress/retry overlay
│       └── FailedImageOverlay.js     ← Retry/remove UI for failed uploads
```

---

### 12. Complete Flow Diagram

```
User taps Send with 3 images
         │
         ▼
┌─ Client ──────────────────────────────────────────────────────────┐
│ 1. Generate messageId (UUID) + 3 imageIds (UUIDs)                │
│ 2. Save 3 upload records to MMKV (status: queued)                │
│ 3. Display message in chat with local thumbnails                 │
│ 4. POST /v1/media/upload/init × 3 (concurrency: 3)              │
│    → receive 3 presigned S3 URLs                                 │
│ 5. Start 3 OS-level background uploads                           │
│    ┌────────────────────────────────────────────┐                │
│    │ App can be killed here.                     │                │
│    │ iOS (NSURLSession) / Android (WorkManager)  │                │
│    │ continue uploading in the background.       │                │
│    └────────────────────────────────────────────┘                │
│ 6. On each S3 upload success → POST /v1/media/upload/complete    │
│ 7. Listen SSE for 'upload:status' events → update UI             │
│    - Replace local thumbnail with server thumbnailUrl            │
│    - When allImagesComplete: mark message as 'sent'              │
│ 8. On app relaunch → reconcilePendingUploads()                   │
│    - Batch check server status                                   │
│    - Restart any stuck uploads                                   │
└───────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─ Server ──────────────────────────────────────────────────────────┐
│ /init:      Validate membership, upsert DB, return presigned URL │
│ /complete:  HEAD check S3, enqueue BullMQ job, return immediately│
│ Worker:     Download from S3 → sharp resize/compress/strip EXIF  │
│             → upload thumbnail + optimized webp back to S3       │
│             → update DB → emit SSE 'upload:status'               │
│ Cron:       Every 30min, find orphaned 'pending' uploads         │
│             → if file in S3, enqueue for processing              │
│             → if not, mark as failed                             │
└───────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─ S3 ─────────────────────────────────────────────────────────────┐
│ uploads/{chatId}/{imageId}.jpg     ← raw original (temp)         │
│ thumbs/{chatId}/{imageId}.webp     ← 300x300 thumbnail (perm)   │
│ optimized/{chatId}/{imageId}.webp  ← max-1200px version (perm)  │
└───────────────────────────────────────────────────────────────────┘
```
