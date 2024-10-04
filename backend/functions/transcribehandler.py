import json
import time
import boto3
import logging
import os
import base64

# Initialize the logger
logger = logging.getLogger()
logger.setLevel(logging.INFO)

success_message = {"message":"success"}
error_message = {"message":"error"}

BUCKET_NAME = os.getenv("UploadBucket")

# Initialize the transcribe
transcribe = boto3.client('transcribe')
job_name = "transcribe_podcast"
output_job_uri = BUCKET_NAME
output_loc = "transcribe/"

# Initialize the Step Functions
sf = boto3.client('stepfunctions')


def lambda_handler(event, context):
    logger.info("Event:", event)
    task_token = str(event['token'])
    filename = str(event['filename'])
    logger.info(f"filename:{filename}")

    # Form the job uri
    job_uri = f"s3://{BUCKET_NAME}/{filename}"

    # Check if transcription job exists, then delete
    check_transcription_job()

    response = transcribe.start_transcription_job(
        TranscriptionJobName=job_name,
        Media={'MediaFileUri': job_uri},
        OutputBucketName=output_job_uri,
        OutputKey=output_loc,
        MediaFormat='mp3',
        LanguageCode='en-US')

    try:
        max_tries = 60
        while max_tries > 0:
            max_tries -= 1
            job = transcribe.get_transcription_job(TranscriptionJobName=job_name)
            job_status = job['TranscriptionJob']['TranscriptionJobStatus']
            if job_status in ['COMPLETED', 'FAILED']:
                logger.info(f"Job {job_name} is {job_status}.")
                if job_status == 'COMPLETED':
                    logger.info(
                        f"Download the transcript from\n"
                        f"\t{job['TranscriptionJob']['Transcript']['TranscriptFileUri']}.")
                    sf.send_task_success(taskToken=task_token, output=json.dumps(success_message))
                break
            else:
                logger.info(f"Waiting for {job_name}. Current status is {job_status}.")
            time.sleep(10)
    except Exception as e:
        logger.error(e)
        sf.send_task_failure(taskToken=task_token, output=json.dumps(error_message))

    return {
        'statusCode': 200,
        'body': 'Processing complete.'
    }


def check_transcription_job():
    # all the transcriptions
    existed_jobs = transcribe.list_transcription_jobs()
    for job in existed_jobs['TranscriptionJobSummaries']:
        if job_name == job['TranscriptionJobName']:
            logger.info(f"Transcribe job {job_name} currently exists.")
            logger.info(f"Deleting the job {job_name}.")
            transcribe.delete_transcription_job(TranscriptionJobName=job_name)
            break



