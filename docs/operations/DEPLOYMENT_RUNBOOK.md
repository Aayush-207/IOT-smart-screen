# CampusCast Operations & Infrastructure Deployment Runbook

## 1. Prerequisites & AWS Configuration

Ensure AWS CLI v2 and Terraform 1.6+ are installed on the provisioning workstation.

```bash
# Set Target AWS Region (ap-south-1 Mumbai)
export AWS_REGION="ap-south-1"
export AWS_PROFILE="campuscast-prod"
```

---

## 2. Infrastructure Setup Sequence

### Step 1: S3 Bucket & CloudFront OAC Setup
1. Create Quarantine S3 Bucket: `campuscast-quarantine-mit-adt` (Private access, AES-256 server-side encryption enabled).
2. Create Production Approved Media S3 Bucket: `campuscast-media-mit-adt` (Private access, Block All Public Access enabled).
3. Create CloudFront Distribution pointing to `campuscast-media-mit-adt` with Origin Access Control (OAC) enabled.

### Step 2: Amazon Cognito User Pool Provisioning
1. Create User Pool `campuscast-user-pool-mit-adt`.
2. Configure App Client with OAuth 2.0 Authorization Code Grant and PKCE.
3. Configure Custom Attributes: `custom:organization_id`, `custom:app_role`.

### Step 3: AWS IoT Core Policy & Certificate Binding
Create least-privilege IoT Policy `CampusCastKioskDevicePolicy`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["iot:Connect"],
      "Resource": ["arn:aws:iot:ap-south-1:*:client/${iot:Connection.Thing.ThingName}"]
    },
    {
      "Effect": "Allow",
      "Action": ["iot:Subscribe", "iot:Receive"],
      "Resource": [
        "arn:aws:iot:ap-south-1:*:topicfilter/$aws/things/${iot:Connection.Thing.ThingName}/shadow/*",
        "arn:aws:iot:ap-south-1:*:topicfilter/campuscast/org/${iot:Connection.Thing.Attributes[organizationId]}/device/${iot:Connection.Thing.ThingName}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["iot:Publish"],
      "Resource": [
        "arn:aws:iot:ap-south-1:*:topic/$aws/things/${iot:Connection.Thing.ThingName}/shadow/update",
        "arn:aws:iot:ap-south-1:*:topic/campuscast/org/${iot:Connection.Thing.Attributes[organizationId]}/device/${iot:Connection.Thing.ThingName}/telemetry"
      ]
    }
  ]
}
```

---

## 3. Application Deployment Commands

```bash
# Install Node.js Dependencies
npm install

# Verify TypeScript Type Correctness
npx tsc --noEmit

# Build Production Bundle
npm run build

# Start Production API Server
node --import tsx src/server/index.ts
```

---

## 4. Disaster Recovery & Rollback Checklist

- **RPO (Recovery Point Objective)**: $\le$ 24 Hours via automated RDS PostgreSQL daily snapshots and S3 Cross-Region Replication.
- **RTO (Recovery Time Objective)**: $\le$ 8 Hours using Terraform infrastructure automation scripts.
- **Kiosk Offline Guarantee**: Kiosks continue playing last-known-good cached manifest indefinitely if cloud connection is interrupted.
