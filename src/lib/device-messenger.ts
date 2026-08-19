import { prisma } from "./prisma";

export interface ContentPayload {
  contentItemId: string;
  mediaUrl: string;
  startAt: string;
  endAt: string;
}

export interface DeviceShadowPayload {
  temperature?: number;
  storageFreePct?: number;
  firmwareVersion?: string;
  lastPlayedContentId?: string;
  timestamp?: string;
  status?: string;
}

export interface DeviceMessenger {
  publishContent(deviceId: string, payload: ContentPayload): Promise<{ success: boolean; topic: string }>;
  processShadowUpdate(deviceId: string, payload: DeviceShadowPayload): Promise<void>;
  getPublishedHistory(deviceId?: string): Array<{ deviceId: string; payload: ContentPayload; timestamp: Date }>;
}

class InMemoryDeviceMessenger implements DeviceMessenger {
  private history: Array<{ deviceId: string; payload: ContentPayload; timestamp: Date }> = [];

  async publishContent(deviceId: string, payload: ContentPayload): Promise<{ success: boolean; topic: string }> {
    const topic = `devices/${deviceId}/content`;
    this.history.push({
      deviceId,
      payload,
      timestamp: new Date(),
    });
    console.log(`[MQTT MOCK PUBLISH] Topic: ${topic}`, payload);
    return { success: true, topic };
  }

  async processShadowUpdate(deviceId: string, payload: DeviceShadowPayload): Promise<void> {
    const topic = `devices/${deviceId}/shadow`;
    console.log(`[MQTT MOCK SHADOW] Topic: ${topic}`, payload);

    await prisma.deviceLog.create({
      data: {
        deviceId,
        eventType: "heartbeat",
        payload: JSON.parse(JSON.stringify(payload)),
      },
    });

    await prisma.device.update({
      where: { id: deviceId },
      data: {
        lastHeartbeat: new Date(),
        status: payload.status || "online",
        firmwareVersion: payload.firmwareVersion || undefined,
      },
    }).catch(() => {
      console.warn(`Device ${deviceId} not found in DB during shadow update`);
    });
  }

  getPublishedHistory(deviceId?: string) {
    if (deviceId) {
      return this.history.filter((h) => h.deviceId === deviceId);
    }
    return [...this.history];
  }
}

export const deviceMessenger: DeviceMessenger = new InMemoryDeviceMessenger();
