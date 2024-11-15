import {
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  ListBucketsCommand,
  ListObjectsV2Command,
  S3Client,
  S3ClientConfig,
} from '@aws-sdk/client-s3';

export const buildS3Clients = (): {
  s3: S3Client;
} => {
  const config: S3ClientConfig = {
    endpoint: 'http://localhost:9000',
    region: 'ap-northeast-1',
    credentials: {
      accessKeyId: 'ACCESS_KEY_DUMMY',
      secretAccessKey: 'SECRET_KEY_DUMMY',
    },
    forcePathStyle: true, // Minioを使う際に必須
  };
  const s3 = new S3Client(config);
  return { s3 };
};

export const pruneBucket = async ({
  s3,
  bucketName,
}: {
  s3: S3Client;
  bucketName: string;
}): Promise<void> => {
  // バケットを空にする
  const { Contents: contents = [] } = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucketName,
    })
  );
  // eslint-disable-next-line no-restricted-syntax
  for (const content of contents) {
    // eslint-disable-next-line no-await-in-loop
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: content.Key!,
      })
    );
  }

  // バケットを削除
  await s3.send(
    new DeleteBucketCommand({
      Bucket: bucketName,
    })
  );
};

export const refreshBucket = async ({
  s3,
  bucketName,
}: {
  s3: S3Client;
  bucketName: string;
}): Promise<void> => {
  const { Buckets: buckets } = await s3.send(new ListBucketsCommand({}));
  if ((buckets ?? []).map((bucket) => bucket.Name).includes(bucketName)) {
    await pruneBucket({ s3, bucketName });
  }

  await s3.send(
    new CreateBucketCommand({
      Bucket: bucketName,
    })
  );
};
