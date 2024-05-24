import { S3 } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import fs from 'fs'

const s3 = new S3({
  region: process.env.AWS_REGION as string,
  credentials: {
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string
  }
})

s3.listBuckets({}).then((data) => {
  console.log(data)
})

export const uploadFileToS3 = ({
  filename,
  filepath,
  contentType
}: {
  filename: string
  filepath: string
  contentType: string
}) => {
  const parallelUploads3 = new Upload({
    client: new S3({}),
    params: {
      Bucket: 'twitter-clone-daoanhtuan',
      Key: filename,
      Body: fs.readFileSync(filepath),
      ContentType: contentType
    }, // add contentType to avoid download instead of view when click on the remote link

    tags: [
      /*...*/
    ], // optional tags
    queueSize: 4, // optional concurrency configuration
    partSize: 1024 * 1024 * 5, // optional size of each part, in bytes, at least 5MB
    leavePartsOnError: false // optional manually handle dropped parts
  })

  parallelUploads3.on('httpUploadProgress', (progress) => {
    console.log(progress)
  })

  return parallelUploads3.done()
}
