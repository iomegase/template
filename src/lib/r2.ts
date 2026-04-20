import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  })
}

/**
 * Generate a presigned PUT URL. The client uploads directly to R2 using this URL.
 * Expires in 5 minutes.
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string
): Promise<string> {
  const client = getR2Client()
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(client, command, { expiresIn: 300 })
}

/**
 * Delete an object from R2 by its key.
 */
export async function deleteR2Object(key: string): Promise<void> {
  const client = getR2Client()
  await client.send(
    new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
    })
  )
}

/**
 * Build the public URL for a given R2 object key.
 */
export function getR2PublicUrl(key: string): string {
  const base = process.env.R2_PUBLIC_URL!.replace(/\/$/, "")
  return `${base}/${key}`
}

/**
 * Extract the R2 key from a public URL.
 * Throws if the URL does not belong to the configured R2 bucket.
 */
export function extractR2Key(publicUrl: string): string {
  const base = process.env.R2_PUBLIC_URL!.replace(/\/$/, "")
  const prefix = `${base}/`
  if (!publicUrl.startsWith(prefix)) {
    throw new Error(
      `URL "${publicUrl}" does not belong to R2 bucket "${base}"`
    )
  }
  return publicUrl.slice(prefix.length)
}
