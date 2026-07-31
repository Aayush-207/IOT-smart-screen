-- Add this SQL to the initial Prisma migration after Prisma creates the tables.
-- PostgreSQL 15+ is assumed.

ALTER TABLE "MembershipRole"
  ADD CONSTRAINT "MembershipRole_scope_matches_type"
  CHECK (
    ("scopeType" = 'ORGANIZATION'
      AND "campusId" IS NULL
      AND "buildingId" IS NULL
      AND "zoneId" IS NULL
      AND "organizationalUnitId" IS NULL)
    OR
    ("scopeType" = 'CAMPUS'
      AND "campusId" IS NOT NULL
      AND "buildingId" IS NULL
      AND "zoneId" IS NULL
      AND "organizationalUnitId" IS NULL)
    OR
    ("scopeType" = 'BUILDING'
      AND "campusId" IS NULL
      AND "buildingId" IS NOT NULL
      AND "zoneId" IS NULL
      AND "organizationalUnitId" IS NULL)
    OR
    ("scopeType" = 'ZONE'
      AND "campusId" IS NULL
      AND "buildingId" IS NULL
      AND "zoneId" IS NOT NULL
      AND "organizationalUnitId" IS NULL)
    OR
    ("scopeType" = 'ORGANIZATIONAL_UNIT'
      AND "campusId" IS NULL
      AND "buildingId" IS NULL
      AND "zoneId" IS NULL
      AND "organizationalUnitId" IS NOT NULL)
  );

CREATE UNIQUE INDEX "MembershipRole_unique_scope"
  ON "MembershipRole" (
    "membershipId",
    "roleId",
    "scopeType",
    "campusId",
    "buildingId",
    "zoneId",
    "organizationalUnitId"
  ) NULLS NOT DISTINCT;

ALTER TABLE "ContentItem"
  ADD CONSTRAINT "ContentItem_event_range"
  CHECK (
    "eventEndsAt" IS NULL
    OR "eventStartsAt" IS NULL
    OR "eventEndsAt" > "eventStartsAt"
  );

ALTER TABLE "ContentVersion"
  ADD CONSTRAINT "ContentVersion_positive_version"
  CHECK ("versionNumber" > 0);

ALTER TABLE "MediaAsset"
  ADD CONSTRAINT "MediaAsset_positive_size"
  CHECK (
    "byteLength" > 0
    AND ("width" IS NULL OR "width" > 0)
    AND ("height" IS NULL OR "height" > 0)
    AND ("durationMs" IS NULL OR "durationMs" > 0)
  );

ALTER TABLE "Upload"
  ADD CONSTRAINT "Upload_positive_sizes"
  CHECK (
    ("expectedByteLength" IS NULL OR "expectedByteLength" > 0)
    AND ("actualByteLength" IS NULL OR "actualByteLength" > 0)
  );

ALTER TABLE "UploadJob"
  ADD CONSTRAINT "UploadJob_attempt_bounds"
  CHECK (
    "attempt" >= 0
    AND "maxAttempts" > 0
    AND "attempt" <= "maxAttempts"
  );

ALTER TABLE "ApprovalWorkflowStep"
  ADD CONSTRAINT "ApprovalWorkflowStep_positive_values"
  CHECK ("stepNumber" > 0 AND "approvalsRequired" > 0);

ALTER TABLE "ApprovalRequest"
  ADD CONSTRAINT "ApprovalRequest_positive_current_step"
  CHECK ("currentStep" > 0);

ALTER TABLE "ApprovalStep"
  ADD CONSTRAINT "ApprovalStep_positive_step"
  CHECK ("stepNumber" > 0);

ALTER TABLE "Playlist"
  ADD CONSTRAINT "Playlist_positive_version"
  CHECK ("version" > 0);

ALTER TABLE "PlaylistItem"
  ADD CONSTRAINT "PlaylistItem_valid_playback"
  CHECK ("position" >= 0 AND "durationMs" > 0);

ALTER TABLE "Schedule"
  ADD CONSTRAINT "Schedule_positive_revision"
  CHECK ("currentRevision" > 0);

ALTER TABLE "ScheduleRevision"
  ADD CONSTRAINT "ScheduleRevision_valid_time_and_recurrence"
  CHECK (
    ("endsAt" IS NULL OR "endsAt" > "startsAt")
    AND
    (
      ("kind" = 'ONE_TIME' AND "recurrenceRule" IS NULL)
      OR
      ("kind" = 'RECURRING' AND "recurrenceRule" IS NOT NULL)
    )
  );

ALTER TABLE "ScheduleTarget"
  ADD CONSTRAINT "ScheduleTarget_target_matches_type"
  CHECK (
    ("targetType" = 'ORGANIZATION'
      AND "campusId" IS NULL
      AND "buildingId" IS NULL
      AND "zoneId" IS NULL
      AND "deviceGroupId" IS NULL
      AND "deviceId" IS NULL)
    OR
    ("targetType" = 'CAMPUS'
      AND "campusId" IS NOT NULL
      AND "buildingId" IS NULL
      AND "zoneId" IS NULL
      AND "deviceGroupId" IS NULL
      AND "deviceId" IS NULL)
    OR
    ("targetType" = 'BUILDING'
      AND "campusId" IS NULL
      AND "buildingId" IS NOT NULL
      AND "zoneId" IS NULL
      AND "deviceGroupId" IS NULL
      AND "deviceId" IS NULL)
    OR
    ("targetType" = 'ZONE'
      AND "campusId" IS NULL
      AND "buildingId" IS NULL
      AND "zoneId" IS NOT NULL
      AND "deviceGroupId" IS NULL
      AND "deviceId" IS NULL)
    OR
    ("targetType" = 'DEVICE_GROUP'
      AND "campusId" IS NULL
      AND "buildingId" IS NULL
      AND "zoneId" IS NULL
      AND "deviceGroupId" IS NOT NULL
      AND "deviceId" IS NULL)
    OR
    ("targetType" = 'DEVICE'
      AND "campusId" IS NULL
      AND "buildingId" IS NULL
      AND "zoneId" IS NULL
      AND "deviceGroupId" IS NULL
      AND "deviceId" IS NOT NULL)
  );

CREATE UNIQUE INDEX "ScheduleTarget_unique_target"
  ON "ScheduleTarget" (
    "scheduleRevisionId",
    "targetType",
    "campusId",
    "buildingId",
    "zoneId",
    "deviceGroupId",
    "deviceId"
  ) NULLS NOT DISTINCT;

ALTER TABLE "ScheduleOccurrence"
  ADD CONSTRAINT "ScheduleOccurrence_valid_range"
  CHECK ("endsAt" > "startsAt");

ALTER TABLE "Device"
  ADD CONSTRAINT "Device_positive_version"
  CHECK ("version" > 0);

ALTER TABLE "DeviceRuntimeState"
  ADD CONSTRAINT "DeviceRuntimeState_valid_storage"
  CHECK (
    ("freeStorageBytes" IS NULL OR "freeStorageBytes" >= 0)
    AND ("totalStorageBytes" IS NULL OR "totalStorageBytes" >= 0)
    AND (
      "freeStorageBytes" IS NULL
      OR "totalStorageBytes" IS NULL
      OR "freeStorageBytes" <= "totalStorageBytes"
    )
  );

CREATE UNIQUE INDEX "Device_one_active_certificate"
  ON "DeviceCertificate" ("deviceId")
  WHERE "status" = 'ACTIVE';

ALTER TABLE "DeviceCommand"
  ADD CONSTRAINT "DeviceCommand_valid_expiry"
  CHECK ("expiresAt" > "issuedAt");

ALTER TABLE "DeviceManifest"
  ADD CONSTRAINT "DeviceManifest_valid_values"
  CHECK (
    "manifestVersion" > 0
    AND "schemaVersion" > 0
    AND "byteLength" > 0
    AND ("validUntil" IS NULL OR "validUntil" > "validFrom")
  );

ALTER TABLE "PlaybackEvent"
  ADD CONSTRAINT "PlaybackEvent_valid_time"
  CHECK (
    ("endedAt" IS NULL OR "endedAt" >= "startedAt")
    AND ("durationMs" IS NULL OR "durationMs" >= 0)
  );

ALTER TABLE "PlaybackAggregate"
  ADD CONSTRAINT "PlaybackAggregate_valid_values"
  CHECK (
    "bucketEnd" > "bucketStart"
    AND "playStarts" >= 0
    AND "playCompletions" >= 0
    AND "playFailures" >= 0
    AND "totalDurationMs" >= 0
  );

CREATE UNIQUE INDEX "PlaybackAggregate_unique_dimensions"
  ON "PlaybackAggregate" (
    "organizationId",
    "granularity",
    "bucketStart",
    "deviceId",
    "zoneId",
    "contentItemId",
    "contentVersionId"
  ) NULLS NOT DISTINCT;

CREATE UNIQUE INDEX "ApprovalWorkflow_one_default"
  ON "ApprovalWorkflow" ("organizationId")
  WHERE "isDefault" = true AND "deletedAt" IS NULL;

ALTER TABLE "NotificationDelivery"
  ADD CONSTRAINT "NotificationDelivery_nonnegative_attempts"
  CHECK ("attemptCount" >= 0);

ALTER TABLE "OtaArtifact"
  ADD CONSTRAINT "OtaArtifact_valid_values"
  CHECK (
    "versionCode" > 0
    AND "byteLength" > 0
    AND ("minAndroidApi" IS NULL OR "minAndroidApi" > 0)
    AND ("maxAndroidApi" IS NULL OR "maxAndroidApi" > 0)
    AND (
      "minAndroidApi" IS NULL
      OR "maxAndroidApi" IS NULL
      OR "maxAndroidApi" >= "minAndroidApi"
    )
  );

ALTER TABLE "OtaCampaignTarget"
  ADD CONSTRAINT "OtaCampaignTarget_exactly_one_target"
  CHECK (num_nonnulls("deviceGroupId", "deviceId") = 1);

CREATE UNIQUE INDEX "OtaCampaignTarget_unique_target"
  ON "OtaCampaignTarget" ("campaignId", "deviceGroupId", "deviceId")
  NULLS NOT DISTINCT;

ALTER TABLE "OutboxEvent"
  ADD CONSTRAINT "OutboxEvent_nonnegative_attempts"
  CHECK ("attemptCount" >= 0);

ALTER TABLE "AsyncOperation"
  ADD CONSTRAINT "AsyncOperation_valid_progress"
  CHECK ("progress" IS NULL OR ("progress" >= 0 AND "progress" <= 1));

-- The production application role should receive INSERT and SELECT only on
-- AuditLog. UPDATE/DELETE remain reserved for a separately controlled
-- retention role.
