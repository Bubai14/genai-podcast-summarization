import React, { useState, useContext } from 'react';
import { FileNameContext } from "./App";
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function S3FileUpload() {
  const [file, setFile] = useState('');
  const [presignedUrl, setPresignedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { setFilename } = useContext(FileNameContext)
  const [region, setRegion] = useState('');
  const [accesskey, setAccesskey] = useState('');
  const [secret, setSecret] = useState('');

  // Handle File selection
  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  // Handle Region input
  const handleRegionInputChange = (event) => {
    setRegion(event.target.value);
  };

  // Handle Access Key input
  const handleAccessInputChange = (event) => {
    setAccesskey(event.target.value);
  };

  // Handle Secret Key input
  const handleSecretInputChange = (event) => {
    setSecret(event.target.value);
  };

  // Generates Presigned URL
  const generatePresignedUrl = async () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    setLoading(true);
    console.log('region:', region);
    console.log('accesskey:', accesskey);
    console.log('secret:', secret);
    try {
      const client = new S3Client({
        region: region,//process.env.REACT_APP_AWS_REGION,
        credentials: {
          accessKeyId: accesskey,//process.env.REACT_APP_AWS_ACCESS_KEY_ID,
          secretAccessKey: secret//process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
        },
      });

      const command = new PutObjectCommand({
        Bucket: process.env.REACT_APP_S3_BUCKET,
        Key: file.name,
        ContentType: file.type,
      });

      const url = await getSignedUrl(client, command, { expiresIn: 3600 });
      console.log('Presigned URL:', url);
      setPresignedUrl(url);
    } catch (error) {
      console.error('Error generating presigned URL:', error);
      alert('Failed to generate presigned URL:'+error);
    } finally {
      setLoading(false);
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!presignedUrl) {
      alert('Please generate a presigned URL first!');
      return;
    }
    setUploading(true)
    try {
      const response = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (response.ok) {
        setFilename(file.name);
        setUploading(false)
        alert('File uploaded successfully!');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file:'+error);
    } 
  };

  return (
    <div>
      <div class="mb-3">
        <label for="aws-region" class="form-label">AWS Region code</label>
        <input type="text" class="form-control" value={region}
            onChange={handleRegionInputChange} id="aws-region" aria-describedby="emailHelp"/>
      </div>
      <div class="mb-3">
        <label for="aws-access-key" class="form-label">AWS Access Key</label>
        <input type="text" class="form-control" value={accesskey}
            onChange={handleAccessInputChange} id="aws-access-key" aria-describedby="emailHelp"/>
      </div>
      <div class="mb-3">
        <label for="aws-secret-access" class="form-label">AWS Secret Access</label>
        <input type="password" class="form-control" value={secret}
            onChange={handleSecretInputChange} id="aws-secret-access" aria-describedby="emailHelp"/>
      </div>
      <div class="mb-3">
        <label for="basic-url" class="form-label">Upload the audio file</label>
        <input type="file" class="form-control" onChange={handleFileChange} disabled={loading} id="inputGroupFile01"/>
      </div>
      <div class="row">
        <div class="col">
              <button class="btn btn-primary" onClick={generatePresignedUrl} disabled={loading || !file}>
                {loading ? 'Generating...' : 'Generate'}
              </button>
        </div>
        {presignedUrl && (
            <><div class="col">
            <button class="btn btn-primary" onClick={handleUpload}>Upload</button>
          </div>
          <div class="col">
              {uploading ? <div class="spinner-border text-warning" role="status"></div> : <div></div>}
          </div></>
        )}
      </div>
     
    </div>  
  );
}

export default S3FileUpload;
